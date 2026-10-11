-- Languago 2.0: monthly lesson packages, attendance and lesson reports.
--
-- Payments happen outside the site; the teacher records each student's
-- monthly package (e.g. 16 lessons = 4 a week). A lesson uses a credit when it
-- takes place, when the student does not come, or when the student cancels
-- less than 24 hours before. A teacher's cancellation never uses a credit.
-- When a package is set, a student cannot ask for more lessons than it allows.

alter table public.appointments add column if not exists attendance text check (attendance in ('present', 'absent', 'late'));
alter table public.appointments add column if not exists report text check (char_length(report) <= 2000);
alter table public.appointments add column if not exists late_cancel boolean not null default false;

create table if not exists public.lesson_packages (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  month       date not null check (extract(day from month) = 1),
  lessons     int  not null check (lessons between 0 and 60),
  note        text check (char_length(note) <= 200),
  updated_at  timestamptz not null default now(),
  primary key (student_id, teacher_id, month)
);
alter table public.lesson_packages enable row level security;
create policy "lp_teacher_all" on public.lesson_packages for all
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id and exists (
    select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
    where cr.teacher_id = auth.uid() and rm.student_id = lesson_packages.student_id));
create policy "lp_student_read" on public.lesson_packages for select using (auth.uid() = student_id);

-- Package use in a month (Turkey time): total, used (held or charged), planned (upcoming or requested).
create or replace function public.package_usage(p_student uuid, p_teacher uuid, p_month date)
returns table (total int, used int, planned int)
language sql stable security definer set search_path = public as $$
  select
    (select lessons from public.lesson_packages where student_id = p_student and teacher_id = p_teacher and month = p_month),
    (select count(*)::int from public.appointments a
      where a.student_id = p_student and a.teacher_id = p_teacher
        and date_trunc('month', a.starts_at at time zone 'Europe/Istanbul')::date = p_month
        and ((a.status = 'confirmed' and a.starts_at <= now()) or (a.status = 'cancelled' and a.late_cancel))),
    (select count(*)::int from public.appointments a
      where a.student_id = p_student and a.teacher_id = p_teacher
        and date_trunc('month', a.starts_at at time zone 'Europe/Istanbul')::date = p_month
        and a.status in ('confirmed', 'requested') and a.starts_at > now())
  where auth.uid() in (p_student, p_teacher);
$$;
revoke all on function public.package_usage(uuid, uuid, date) from public;
grant execute on function public.package_usage(uuid, uuid, date) to authenticated;

-- request_lesson: respect the package when one is set for that month.
create or replace function public.lesson_credit_ok(p_teacher uuid, p_starts timestamptz)
returns boolean language plpgsql stable security definer set search_path = public as $$
declare m date := date_trunc('month', p_starts at time zone 'Europe/Istanbul')::date; u record;
begin
  select * into u from public.package_usage(auth.uid(), p_teacher, m);
  return u.total is null or (u.used + u.planned) < u.total;
end;
$$;
revoke all on function public.lesson_credit_ok(uuid, timestamptz) from public;
grant execute on function public.lesson_credit_ok(uuid, timestamptz) to authenticated;

-- cancel_lesson: remember student cancellations inside 24 hours (they use a credit).
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
  update public.appointments set status = 'cancelled', cancelled_by = auth.uid(),
    late_cancel = (auth.uid() = a.student_id and a.status = 'confirmed' and a.starts_at < now() + interval '24 hours')
  where id = p_id;
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

-- Tell the student when the teacher writes a lesson report.
create or replace function public.notify_report(p_id uuid)
returns void language plpgsql security definer set search_path = public as $$
declare a record;
begin
  select * into a from public.appointments where id = p_id;
  if a.id is null or a.teacher_id <> auth.uid() or a.student_id is null or coalesce(a.report, '') = '' then return; end if;
  insert into public.notifications (user_id, title, body, href, kind)
  values (a.student_id, 'Ders raporunuz hazır', 'Öğretmeniniz ' || to_char(a.starts_at at time zone 'Europe/Istanbul', 'DD.MM') || ' dersinin raporunu yazdı.', '/app/derslerim', 'class');
end;
$$;
revoke all on function public.notify_report(uuid) from public;
grant execute on function public.notify_report(uuid) to authenticated;

-- request_lesson again, now with the package check (otherwise as in 20261012).
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
  if not public.lesson_credit_ok(p_teacher, p_starts) then raise exception 'no_credits'; end if;
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
