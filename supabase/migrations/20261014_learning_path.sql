-- Languago 2.0, Release 3: learning path ("Bugünün görevi") and vocabulary path.
-- Applied to production on 2026-10-11 (SQL editor, approved by the owner).
--
-- A level takes 4 months: ~120 daily missions (grammar, reading, listening,
-- writing, speaking). A task passes at 85+; passed tasks earn XP; when all
-- missions are passed, the end-of-level exam (85+) moves the learner up.
-- The vocabulary path has its own level: 13 new words a day (listen and
-- choose, then timed flashcards rated learned / repeat / not sure / didn't learn).
-- Every lesson in the timetable is 40 minutes (owner's rule).
--
-- Learners read their own rows; every write goes through the functions below,
-- which keep the day order and compute XP themselves.

-- 1) 40-minute lessons
update public.teacher_settings set lesson_min = 40;
alter table public.teacher_settings alter column lesson_min set default 40;
alter table public.teacher_settings drop constraint if exists teacher_settings_lesson_min_check;
alter table public.teacher_settings add constraint teacher_settings_lesson_min_check check (lesson_min = 40);

-- 2) path tables
create table if not exists public.path_state (
  student_id     uuid primary key references public.profiles(id) on delete cascade,
  mission_level  text not null default 'A1' check (mission_level in ('A1','A2','B1','B2','C1','C2')),
  mission_day    int  not null default 1 check (mission_day between 1 and 999),
  day_opened_on  date not null default (now() at time zone 'Europe/Istanbul')::date,
  mission_xp     int  not null default 0,
  vocab_level    text not null default 'A1' check (vocab_level in ('A1','A2','B1','B2','C1','C2')),
  vocab_xp       int  not null default 0,
  vocab_streak   int  not null default 0,
  last_vocab_on  date,
  updated_at     timestamptz not null default now()
);

create table if not exists public.mission_results (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  level       text not null,
  day         int  not null,
  task        text not null check (task in ('grammar','reading','listening','writing','speaking')),
  best_score  int  not null default 0 check (best_score between 0 and 100),
  last_score  int  not null default 0 check (last_score between 0 and 100),
  passed      boolean not null default false,
  attempts    int  not null default 0,
  xp          int  not null default 0,
  last_payload jsonb,
  updated_at  timestamptz not null default now(),
  primary key (student_id, level, day, task)
);

create table if not exists public.vocab_cards (
  student_id     uuid not null references public.profiles(id) on delete cascade,
  word_id        text not null,
  level          text not null,
  box            int  not null default 0,
  interval_days  int  not null default 0,
  due_on         date not null,
  reps           int  not null default 0,
  lapses         int  not null default 0,
  last_rating    text check (last_rating in ('learned','repeat','unsure','not_learned')),
  first_seen_on  date not null,
  updated_at     timestamptz not null default now(),
  primary key (student_id, word_id)
);
create index if not exists vocab_cards_due_idx on public.vocab_cards (student_id, due_on);

create table if not exists public.vocab_days (
  student_id    uuid not null references public.profiles(id) on delete cascade,
  day_on        date not null,
  level         text not null,
  listen_score  int,
  cards_done    int not null default 0,
  done          boolean not null default false,
  primary key (student_id, day_on)
);

create table if not exists public.level_exams (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  level       text not null,
  score       int not null check (score between 0 and 100),
  passed      boolean not null,
  taken_at    timestamptz not null default now()
);

alter table public.path_state      enable row level security;
alter table public.mission_results enable row level security;
alter table public.vocab_cards     enable row level security;
alter table public.vocab_days      enable row level security;
alter table public.level_exams     enable row level security;

create policy "ps_own_read" on public.path_state      for select using (auth.uid() = student_id);
create policy "mr_own_read" on public.mission_results for select using (auth.uid() = student_id);
create policy "vc_own_read" on public.vocab_cards     for select using (auth.uid() = student_id);
create policy "vd_own_read" on public.vocab_days      for select using (auth.uid() = student_id);
create policy "le_own_read" on public.level_exams     for select using (auth.uid() = student_id);
-- Teachers read the path of students in their classes.
create policy "ps_teacher_read" on public.path_state      for select using (exists (select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id where cr.teacher_id = auth.uid() and rm.student_id = path_state.student_id));
create policy "mr_teacher_read" on public.mission_results for select using (exists (select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id where cr.teacher_id = auth.uid() and rm.student_id = mission_results.student_id));
create policy "le_teacher_read" on public.level_exams     for select using (exists (select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id where cr.teacher_id = auth.uid() and rm.student_id = level_exams.student_id));

-- 3) functions ----------------------------------------------------------------
create or replace function public.path_today() returns date language sql stable as $$
  select (now() at time zone 'Europe/Istanbul')::date;
$$;

-- Start (or read) the learner's path; the first mission and vocabulary levels
-- come from the level test when there is one.
create or replace function public.ensure_path(p_mission_level text default null, p_vocab_level text default null)
returns public.path_state language plpgsql security definer set search_path = public as $$
declare r public.path_state;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  insert into public.path_state (student_id, mission_level, vocab_level)
  values (auth.uid(),
          case when p_mission_level in ('A1','A2','B1','B2','C1','C2') then p_mission_level else 'A1' end,
          case when p_vocab_level in ('A1','A2','B1','B2','C1','C2') then p_vocab_level else 'A1' end)
  on conflict (student_id) do nothing;
  select * into r from public.path_state where student_id = auth.uid();
  return r;
end;
$$;

-- Record one task attempt of TODAY's mission. XP comes from here, not from the
-- page: full XP for a first-attempt pass, 70 % after retries, none below 85.
-- When all five tasks are passed the next day opens tomorrow (Turkey time).
create or replace function public.submit_mission_task(p_task text, p_score int, p_payload jsonb default null)
returns jsonb language plpgsql security definer set search_path = public as $$
declare st public.path_state; prev public.mission_results; base int; gain int := 0; ok boolean; done int;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if p_task not in ('grammar','reading','listening','writing','speaking') then raise exception 'bad_task'; end if;
  select * into st from public.path_state where student_id = auth.uid() for update;
  if st.student_id is null then raise exception 'no_path'; end if;
  if st.day_opened_on > public.path_today() then raise exception 'not_open_yet'; end if;
  p_score := greatest(0, least(100, coalesce(p_score, 0)));
  ok := p_score >= 85;
  base := case p_task when 'writing' then 25 when 'speaking' then 25 else 20 end;
  select * into prev from public.mission_results
  where student_id = auth.uid() and level = st.mission_level and day = st.mission_day and task = p_task;
  if ok and coalesce(prev.passed, false) = false then
    gain := case when coalesce(prev.attempts, 0) = 0 then base else round(base * 0.7) end;
  end if;
  insert into public.mission_results (student_id, level, day, task, best_score, last_score, passed, attempts, xp, last_payload, updated_at)
  values (auth.uid(), st.mission_level, st.mission_day, p_task, p_score, p_score, ok, 1, gain, case when length(coalesce(p_payload, '{}'::jsonb)::text) > 20000 then '{"truncated": true}'::jsonb else coalesce(p_payload, '{}'::jsonb) end, now())
  on conflict (student_id, level, day, task) do update set
    best_score = greatest(mission_results.best_score, excluded.best_score),
    last_score = excluded.last_score,
    passed = mission_results.passed or excluded.passed,
    attempts = mission_results.attempts + 1,
    xp = mission_results.xp + gain,
    last_payload = excluded.last_payload,
    updated_at = now();
  select count(*) into done from public.mission_results
  where student_id = auth.uid() and level = st.mission_level and day = st.mission_day and passed;
  update public.path_state set
    mission_xp = mission_xp + gain,
    mission_day = case when done >= 5 then mission_day + 1 else mission_day end,
    day_opened_on = case when done >= 5 then public.path_today() + 1 else day_opened_on end,
    updated_at = now()
  where student_id = auth.uid();
  return jsonb_build_object('passed', ok, 'xp', gain, 'day_done', done >= 5);
end;
$$;

-- End-of-level exam: open once all missions of the level are passed
-- (p_days = number of mission days in the level's content). 85+ moves up.
create or replace function public.submit_level_exam(p_score int, p_days int)
returns jsonb language plpgsql security definer set search_path = public as $$
declare st public.path_state; ok boolean; nxt text;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  select * into st from public.path_state where student_id = auth.uid() for update;
  if st.student_id is null then raise exception 'no_path'; end if;
  if st.mission_day <= greatest(1, p_days) then raise exception 'exam_locked'; end if;
  p_score := greatest(0, least(100, coalesce(p_score, 0)));
  ok := p_score >= 85;
  insert into public.level_exams (student_id, level, score, passed) values (auth.uid(), st.mission_level, p_score, ok);
  if ok then
    nxt := case st.mission_level when 'A1' then 'A2' when 'A2' then 'B1' when 'B1' then 'B2' when 'B2' then 'C1' else 'C2' end;
    update public.path_state set mission_level = nxt, mission_day = 1, day_opened_on = public.path_today() + 1,
      mission_xp = mission_xp + 200, updated_at = now() where student_id = auth.uid();
  end if;
  return jsonb_build_object('passed', ok, 'next', nxt);
end;
$$;

-- Vocabulary: rate one card. Intervals: learned -> grows (1, 3, 7, 16, 35 days),
-- unsure -> tomorrow, repeat / not learned -> tomorrow and a lapse.
create or replace function public.rate_word(p_word text, p_level text, p_rating text)
returns void language plpgsql security definer set search_path = public as $$
declare c public.vocab_cards; steps int[] := array[1, 3, 7, 16, 35, 75]; nb int; iv int;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if p_rating not in ('learned','repeat','unsure','not_learned') then raise exception 'bad_rating'; end if;
  if p_level not in ('A1','A2','B1','B2','C1','C2') or length(p_word) > 60 then raise exception 'bad_word'; end if;
  select * into c from public.vocab_cards where student_id = auth.uid() and word_id = p_word;
  nb := case when p_rating = 'learned' then least(coalesce(c.box, 0) + 1, 6)
             when p_rating = 'unsure' then greatest(coalesce(c.box, 0), 1)
             else 0 end;
  iv := case when p_rating = 'learned' then steps[nb] else 1 end;
  insert into public.vocab_cards (student_id, word_id, level, box, interval_days, due_on, reps, lapses, last_rating, first_seen_on)
  values (auth.uid(), p_word, p_level, nb, iv, public.path_today() + iv, 1,
          case when p_rating in ('repeat','not_learned') then 1 else 0 end, p_rating, public.path_today())
  on conflict (student_id, word_id) do update set
    box = nb, interval_days = iv, due_on = public.path_today() + iv, reps = vocab_cards.reps + 1,
    lapses = vocab_cards.lapses + case when p_rating in ('repeat','not_learned') then 1 else 0 end,
    last_rating = p_rating, updated_at = now();
end;
$$;

-- Vocabulary: finish today's session (listening score and cards). XP once a day;
-- the streak grows on consecutive days. p_level_up (checked by the server
-- against the word list) moves the vocabulary level up.
create or replace function public.finish_vocab_day(p_listen_score int, p_cards int, p_level_up boolean default false)
returns jsonb language plpgsql security definer set search_path = public as $$
declare st public.path_state; is_first boolean; nxt text;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  select * into st from public.path_state where student_id = auth.uid() for update;
  if st.student_id is null then raise exception 'no_path'; end if;
  is_first := st.last_vocab_on is distinct from public.path_today();
  insert into public.vocab_days (student_id, day_on, level, listen_score, cards_done, done)
  values (auth.uid(), public.path_today(), st.vocab_level, greatest(0, least(100, p_listen_score)), greatest(0, least(500, p_cards)), true)
  on conflict (student_id, day_on) do update set listen_score = excluded.listen_score, cards_done = vocab_days.cards_done + excluded.cards_done, done = true;
  nxt := case when p_level_up then case st.vocab_level when 'A1' then 'A2' when 'A2' then 'B1' when 'B1' then 'B2' when 'B2' then 'C1' else 'C2' end else st.vocab_level end;
  update public.path_state set
    vocab_xp = vocab_xp + case when is_first then 30 else 0 end,
    vocab_streak = case when not is_first then vocab_streak when last_vocab_on = public.path_today() - 1 then vocab_streak + 1 else 1 end,
    last_vocab_on = public.path_today(),
    vocab_level = nxt,
    updated_at = now()
  where student_id = auth.uid();
  return jsonb_build_object('xp', case when is_first then 30 else 0 end, 'level', nxt);
end;
$$;

revoke all on function public.ensure_path(text, text) from public;
revoke all on function public.submit_mission_task(text, int, jsonb) from public;
revoke all on function public.submit_level_exam(int, int) from public;
revoke all on function public.rate_word(text, text, text) from public;
revoke all on function public.finish_vocab_day(int, int, boolean) from public;
grant execute on function public.ensure_path(text, text) to authenticated;
grant execute on function public.submit_mission_task(text, int, jsonb) to authenticated;
grant execute on function public.submit_level_exam(int, int) to authenticated;
grant execute on function public.rate_word(text, text, text) to authenticated;
grant execute on function public.finish_vocab_day(int, int, boolean) to authenticated;
