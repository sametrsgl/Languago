-- Languago 2.0, Release 2: teacher timetable, lesson requests, Google Meet.
--
-- A teacher sets weekly hours (plus closed periods). Their students see the
-- free slots and send a request; nothing is booked until the teacher accepts.
-- Teachers can also add a lesson themselves or start one right away.
-- Every lesson gets a Google Meet link (the teacher's connected Google
-- Calendar creates it), else the teacher's own Meet link, else a Languago room.
-- Times are stored in UTC; the hours grid is Turkey time (Europe/Istanbul).

create extension if not exists btree_gist with schema extensions;

-- ---------------------------------------------------------------------------
-- Is the caller a student in one of this teacher's classes?
create or replace function public.is_student_of(p_teacher uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.roster_members rm
    join public.class_roster cr on cr.id = rm.class_id
    where cr.teacher_id = p_teacher and rm.student_id = auth.uid()
  );
$$;
revoke all on function public.is_student_of(uuid) from public;
grant execute on function public.is_student_of(uuid) to authenticated;

-- Students join a class with the teacher's code (the old direct insert
-- policy let anyone who knew a class id add themselves; the code is the key).
drop policy if exists "roster_member_join" on public.roster_members;
create or replace function public.join_class(p_code text)
returns table (class_name text, teacher_name text)
language plpgsql security definer set search_path = public as $$
declare c record;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  select cr.id, cr.class_name, cr.teacher_id into c
  from public.class_roster cr where cr.join_code = upper(trim(p_code));
  if c.id is null then raise exception 'bad_code'; end if;
  if c.teacher_id = auth.uid() then raise exception 'own_class'; end if;
  insert into public.roster_members (class_id, student_id) values (c.id, auth.uid())
  on conflict do nothing;
  return query select c.class_name, coalesce(p.full_name, 'Öğretmen') from public.profiles p where p.id = c.teacher_id;
end;
$$;
revoke all on function public.join_class(text) from public;
grant execute on function public.join_class(text) to authenticated;

-- A student's teachers (for the booking page).
create or replace function public.my_teachers()
returns table (teacher_id uuid, full_name text)
language sql stable security definer set search_path = public as $$
  select distinct cr.teacher_id, coalesce(p.full_name, 'Öğretmen')
  from public.roster_members rm
  join public.class_roster cr on cr.id = rm.class_id
  join public.profiles p on p.id = cr.teacher_id
  where rm.student_id = auth.uid();
$$;
revoke all on function public.my_teachers() from public;
grant execute on function public.my_teachers() to authenticated;

-- ---------------------------------------------------------------------------
create table if not exists public.teacher_settings (
  teacher_id   uuid primary key references public.profiles(id) on delete cascade,
  lesson_min   int not null default 45 check (lesson_min in (30, 45, 60, 90)),
  notice_hours int not null default 12 check (notice_hours between 0 and 168),
  window_days  int not null default 21 check (window_days between 7 and 60),
  meet_link    text check (meet_link is null or meet_link ~ '^https://meet\.google\.com/[a-z0-9-]{6,40}$'),
  updated_at   timestamptz not null default now()
);

-- Weekly hours, Turkey time. weekday 0 = Monday ... 6 = Sunday; minutes from midnight.
create table if not exists public.teacher_hours (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  weekday    smallint not null check (weekday between 0 and 6),
  start_min  int not null check (start_min between 0 and 1439),
  end_min    int not null check (end_min between 1 and 1440),
  check (end_min > start_min)
);
create index if not exists teacher_hours_teacher_idx on public.teacher_hours (teacher_id, weekday);

-- Closed periods (holidays, a busy afternoon).
create table if not exists public.teacher_blocks (
  id         uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  starts_at  timestamptz not null,
  ends_at    timestamptz not null,
  note       text check (char_length(note) <= 120),
  check (ends_at > starts_at)
);
create index if not exists teacher_blocks_teacher_idx on public.teacher_blocks (teacher_id, ends_at);

create table if not exists public.appointments (
  id                uuid primary key default gen_random_uuid(),
  teacher_id        uuid not null references public.profiles(id) on delete cascade,
  student_id        uuid references public.profiles(id) on delete cascade,
  class_id          uuid references public.class_roster(id) on delete set null,
  kind              text not null default 'one_on_one' check (kind in ('one_on_one', 'group', 'instant')),
  title             text check (char_length(title) <= 120),
  starts_at         timestamptz not null,
  ends_at           timestamptz not null,
  status            text not null default 'requested' check (status in ('requested', 'confirmed', 'declined', 'cancelled', 'expired')),
  created_by        text not null check (created_by in ('student', 'teacher')),
  note              text check (char_length(note) <= 500),
  meet_url          text,
  calendar_event_id text,
  room_token        text not null unique default replace(gen_random_uuid()::text, '-', ''),
  decided_at        timestamptz,
  cancelled_by      uuid,
  reminder_sent_at  timestamptz,
  created_at        timestamptz not null default now(),
  check (ends_at > starts_at),
  check (student_id is null or class_id is null),
  -- No double booking: a teacher's requested/confirmed lessons never overlap
  -- (a lesson started "now" is outside the grid and may overlap).
  constraint appointments_no_overlap exclude using gist (
    teacher_id with =, tstzrange(starts_at, ends_at) with &&
  ) where (status in ('requested', 'confirmed') and kind <> 'instant')
);
create index if not exists appointments_teacher_idx on public.appointments (teacher_id, starts_at);
create index if not exists appointments_student_idx on public.appointments (student_id, starts_at);
create index if not exists appointments_class_idx on public.appointments (class_id, starts_at);
create index if not exists appointments_due_idx on public.appointments (starts_at) where status in ('requested', 'confirmed');

-- The teacher's Google Calendar connection. The refresh token is encrypted
-- by the server (AES-256-GCM, key only in Vercel), so the row is useless alone.
create table if not exists public.google_links (
  teacher_id   uuid primary key references public.profiles(id) on delete cascade,
  google_email text,
  token_enc    text not null,
  connected_at timestamptz not null default now()
);

alter table public.teacher_settings enable row level security;
alter table public.teacher_hours    enable row level security;
alter table public.teacher_blocks   enable row level security;
alter table public.appointments     enable row level security;
alter table public.google_links     enable row level security;

create policy "ts_owner_all"     on public.teacher_settings for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "ts_student_read"  on public.teacher_settings for select using (public.is_student_of(teacher_id));
create policy "th_owner_all"     on public.teacher_hours    for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "th_student_read"  on public.teacher_hours    for select using (public.is_student_of(teacher_id));
create policy "tb_owner_all"     on public.teacher_blocks   for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "gl_owner_all"     on public.google_links     for all using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);

create policy "ap_teacher_read"   on public.appointments for select using (auth.uid() = teacher_id);
create policy "ap_teacher_update" on public.appointments for update using (auth.uid() = teacher_id) with check (auth.uid() = teacher_id);
create policy "ap_student_read"   on public.appointments for select using (
  auth.uid() = student_id
  or (class_id is not null and exists (
    select 1 from public.roster_members rm where rm.class_id = appointments.class_id and rm.student_id = auth.uid()))
);
-- A teacher adds a lesson for one of their students or classes (confirmed at once).
create policy "ap_teacher_insert" on public.appointments for insert to authenticated with check (
  auth.uid() = teacher_id and created_by = 'teacher' and status = 'confirmed'
  and (student_id is null or exists (
    select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
    where cr.teacher_id = auth.uid() and rm.student_id = appointments.student_id))
  and (class_id is null or exists (
    select 1 from public.class_roster cr where cr.id = appointments.class_id and cr.teacher_id = auth.uid()))
);

-- ---------------------------------------------------------------------------
-- Busy times of a teacher (no names), for the student's free-slot view.
create or replace function public.teacher_busy(p_teacher uuid, p_from timestamptz, p_to timestamptz)
returns table (starts_at timestamptz, ends_at timestamptz)
language sql stable security definer set search_path = public as $$
  select a.starts_at, a.ends_at from public.appointments a
  where a.teacher_id = p_teacher and a.status in ('requested', 'confirmed')
    and a.ends_at > p_from and a.starts_at < p_to
    and (auth.uid() = p_teacher or public.is_student_of(p_teacher))
  union all
  select b.starts_at, b.ends_at from public.teacher_blocks b
  where b.teacher_id = p_teacher and b.ends_at > p_from and b.starts_at < p_to
    and (auth.uid() = p_teacher or public.is_student_of(p_teacher));
$$;
revoke all on function public.teacher_busy(uuid, timestamptz, timestamptz) from public;
grant execute on function public.teacher_busy(uuid, timestamptz, timestamptz) to authenticated;

-- A student asks for a slot. Checked against the teacher's hours, notice,
-- window and closed periods; the overlap constraint stops double booking.
create or replace function public.request_lesson(p_teacher uuid, p_starts timestamptz, p_note text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare
  s record; loc timestamp; wd int; m0 int; m1 int; new_id uuid; pending int; who text;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not public.is_student_of(p_teacher) then raise exception 'not_your_teacher'; end if;
  select coalesce(t.lesson_min, 45) lesson_min, coalesce(t.notice_hours, 12) notice_hours, coalesce(t.window_days, 21) window_days
    into s from (select 1) x left join public.teacher_settings t on t.teacher_id = p_teacher;
  if p_starts < now() + make_interval(hours => s.notice_hours) then raise exception 'too_soon'; end if;
  if p_starts > now() + make_interval(days => s.window_days) then raise exception 'too_far'; end if;
  loc := p_starts at time zone 'Europe/Istanbul';
  wd := extract(isodow from loc)::int - 1;
  m0 := extract(hour from loc)::int * 60 + extract(minute from loc)::int;
  m1 := m0 + s.lesson_min;
  if extract(second from loc) <> 0 or not exists (
    select 1 from public.teacher_hours h
    where h.teacher_id = p_teacher and h.weekday = wd and h.start_min <= m0 and m1 <= h.end_min
      and (m0 - h.start_min) % s.lesson_min = 0
  ) then raise exception 'not_open'; end if;
  if exists (select 1 from public.teacher_blocks b where b.teacher_id = p_teacher
             and b.ends_at > p_starts and b.starts_at < p_starts + make_interval(mins => s.lesson_min)) then
    raise exception 'not_open';
  end if;
  select count(*) into pending from public.appointments a
  where a.student_id = auth.uid() and a.teacher_id = p_teacher and a.status = 'requested' and a.starts_at > now();
  if pending >= 3 then raise exception 'too_many'; end if;
  begin
    insert into public.appointments (teacher_id, student_id, kind, starts_at, ends_at, status, created_by, note)
    values (p_teacher, auth.uid(), 'one_on_one', p_starts, p_starts + make_interval(mins => s.lesson_min),
            'requested', 'student', nullif(left(trim(coalesce(p_note, '')), 500), ''))
    returning id into new_id;
  exception when exclusion_violation then raise exception 'slot_taken';
  end;
  select coalesce(full_name, 'Bir öğrenci') into who from public.profiles where id = auth.uid();
  insert into public.notifications (user_id, title, body, href, kind)
  values (p_teacher, 'Yeni ders isteği', who || ', ' || to_char(loc, 'DD.MM HH24:MI') || ' için ders istedi.', '/app/takvim', 'class');
  return new_id;
end;
$$;
revoke all on function public.request_lesson(uuid, timestamptz, text) from public;
grant execute on function public.request_lesson(uuid, timestamptz, text) to authenticated;

-- The teacher accepts or declines a request.
create or replace function public.decide_lesson(p_id uuid, p_accept boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from public.appointments where id = p_id for update;
  if a.id is null or a.teacher_id <> auth.uid() then raise exception 'not_found'; end if;
  if a.status <> 'requested' then raise exception 'already_decided'; end if;
  if a.starts_at <= now() then raise exception 'too_late'; end if;
  update public.appointments set status = case when p_accept then 'confirmed' else 'declined' end, decided_at = now()
  where id = p_id;
  insert into public.notifications (user_id, title, body, href, kind)
  values (a.student_id,
          case when p_accept then 'Dersiniz onaylandı' else 'Ders isteğiniz kabul edilmedi' end,
          to_char(a.starts_at at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') ||
            case when p_accept then ' dersiniz takvimde.' else ' için başka bir saat seçebilirsiniz.' end,
          '/app/derslerim', 'class');
end;
$$;
revoke all on function public.decide_lesson(uuid, boolean) from public;
grant execute on function public.decide_lesson(uuid, boolean) to authenticated;

-- Either side cancels a lesson that has not started yet.
create or replace function public.cancel_lesson(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record; other uuid; who text;
begin
  select * into a from public.appointments where id = p_id for update;
  if a.id is null or auth.uid() not in (a.teacher_id, coalesce(a.student_id, '00000000-0000-0000-0000-000000000000'::uuid)) then
    raise exception 'not_found';
  end if;
  if a.status not in ('requested', 'confirmed') then raise exception 'already_closed'; end if;
  if a.starts_at <= now() then raise exception 'too_late'; end if;
  update public.appointments set status = 'cancelled', cancelled_by = auth.uid() where id = p_id;
  if auth.uid() = a.teacher_id and a.class_id is not null then
    insert into public.notifications (user_id, title, body, href, kind)
    select rm.student_id, 'Ders iptal edildi',
           to_char(a.starts_at at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') || ' grup dersi iptal edildi.', '/app/derslerim', 'class'
    from public.roster_members rm where rm.class_id = a.class_id;
  end if;
  other := case when auth.uid() = a.teacher_id then a.student_id else a.teacher_id end;
  if other is not null then
    select coalesce(full_name, 'Karşı taraf') into who from public.profiles where id = auth.uid();
    insert into public.notifications (user_id, title, body, href, kind)
    values (other, 'Ders iptal edildi',
            who || ', ' || to_char(a.starts_at at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') || ' dersini iptal etti.',
            case when other = a.teacher_id then '/app/takvim' else '/app/derslerim' end, 'class');
  end if;
end;
$$;
revoke all on function public.cancel_lesson(uuid) from public;
grant execute on function public.cancel_lesson(uuid) to authenticated;

-- The teacher tells a lesson's students it was added (or starts now).
create or replace function public.notify_lesson_students(p_id uuid, p_instant boolean)
returns void language plpgsql security definer set search_path = public as $$
declare a record; who text;
begin
  select * into a from public.appointments where id = p_id;
  if a.id is null or a.teacher_id <> auth.uid() or a.status <> 'confirmed' then return; end if;
  select coalesce(full_name, 'Öğretmeniniz') into who from public.profiles where id = a.teacher_id;
  insert into public.notifications (user_id, title, body, href, kind)
  select x.uid,
         case when p_instant then 'Ders şimdi başlıyor' else 'Yeni ders' end,
         case when p_instant then who || ' sizi canlı derse çağırıyor.'
              else who || ', ' || to_char(a.starts_at at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') || ' için ders planladı.' end,
         '/app/derslerim', 'class'
  from (select a.student_id uid where a.student_id is not null
        union select rm.student_id from public.roster_members rm where rm.class_id = a.class_id) x;
end;
$$;
revoke all on function public.notify_lesson_students(uuid, boolean) from public;
grant execute on function public.notify_lesson_students(uuid, boolean) to authenticated;

-- Names and emails of a lesson's people, for the emails the server sends.
-- The teacher sees everyone; a student sees the teacher and themself.
create or replace function public.lesson_people(p_id uuid)
returns table (role text, user_id uuid, full_name text, email text)
language plpgsql stable security definer set search_path = public as $$
declare a record;
begin
  select * into a from public.appointments where id = p_id;
  if a.id is null then return; end if;
  if auth.uid() is null or (auth.uid() <> a.teacher_id and auth.uid() is distinct from a.student_id) then return; end if;
  return query
    select 'teacher'::text, p.id, p.full_name, u.email::text from public.profiles p join auth.users u on u.id = p.id where p.id = a.teacher_id
    union all
    select 'student'::text, p.id, p.full_name, u.email::text from public.profiles p join auth.users u on u.id = p.id
    where (p.id = a.student_id and (auth.uid() = a.teacher_id or auth.uid() = a.student_id))
       or (a.class_id is not null and auth.uid() = a.teacher_id
           and p.id in (select rm.student_id from public.roster_members rm where rm.class_id = a.class_id));
end;
$$;
revoke all on function public.lesson_people(uuid) from public;
grant execute on function public.lesson_people(uuid) to authenticated;

-- A cancelled lesson's Google event lives in the teacher's calendar; when the
-- student cancels, the server needs the (encrypted) token to remove it.
create or replace function public.lesson_google_token(p_id uuid)
returns text language sql stable security definer set search_path = public as $$
  select g.token_enc from public.appointments a join public.google_links g on g.teacher_id = a.teacher_id
  where a.id = p_id and auth.uid() in (a.teacher_id, a.student_id);
$$;
revoke all on function public.lesson_google_token(uuid) from public;
grant execute on function public.lesson_google_token(uuid) to authenticated;

-- Run every 10 minutes by the reminder job (service role only): expires
-- requests nobody answered, then hands back the lessons starting within the
-- next 70 minutes, one row per person to remind, and marks them reminded.
create or replace function public.claim_lesson_reminders()
returns table (id uuid, starts_at timestamptz, title text, join_url text, teacher_name text,
               role text, user_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public as $$
begin
  with gone as (
    update public.appointments a set status = 'expired'
    where a.status = 'requested' and a.starts_at <= now()
    returning a.student_id, a.starts_at
  )
  insert into public.notifications (user_id, title, body, href, kind)
  select g.student_id, 'Ders isteği yanıtlanmadı',
         to_char(g.starts_at at time zone 'Europe/Istanbul', 'DD.MM HH24:MI') || ' için öğretmeniniz yanıt vermedi. Yeni bir saat seçebilirsiniz.',
         '/app/derslerim', 'class'
  from gone g where g.student_id is not null;

  return query
  with due as (
    update public.appointments a set reminder_sent_at = now()
    where a.status = 'confirmed' and a.kind <> 'instant' and a.reminder_sent_at is null
      and a.starts_at > now() and a.starts_at <= now() + interval '70 minutes'
    returning a.*
  ), people as (
    select d.id aid, 'teacher'::text r, d.teacher_id uid from due d
    union all
    select d.id, 'student', d.student_id from due d where d.student_id is not null
    union all
    select d.id, 'student', rm.student_id from due d join public.roster_members rm on rm.class_id = d.class_id
  )
  select d.id, d.starts_at, coalesce(d.title, 'İngilizce dersi'), coalesce(d.meet_url, '/ders/' || d.room_token),
         coalesce(tp.full_name, 'Öğretmen'), pe.r, pe.uid, p.full_name, u.email::text
  from due d
  join people pe on pe.aid = d.id
  join public.profiles p on p.id = pe.uid
  join auth.users u on u.id = pe.uid
  join public.profiles tp on tp.id = d.teacher_id;

  insert into public.notifications (user_id, title, body, href, kind)
  select pe_uid, 'Dersiniz yaklaşıyor', to_char(st at time zone 'Europe/Istanbul', 'HH24:MI') || ' dersiniz bir saat içinde başlıyor.',
         case when r = 'teacher' then '/app/takvim' else '/app/derslerim' end, 'reminder'
  from (select a.starts_at st, x.r, x.uid pe_uid from public.appointments a
        cross join lateral (select 'teacher'::text r, a.teacher_id uid
                            union all select 'student', a.student_id where a.student_id is not null
                            union all select 'student', rm.student_id from public.roster_members rm where rm.class_id = a.class_id) x
        where a.reminder_sent_at = now() and a.kind <> 'instant') q;  -- now() is fixed per transaction: exactly this run's rows
end;
$$;
revoke all on function public.claim_lesson_reminders() from public, anon, authenticated;
grant execute on function public.claim_lesson_reminders() to service_role;
