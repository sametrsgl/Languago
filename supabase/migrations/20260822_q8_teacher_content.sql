-- ============================================================================
-- Languago — Q8: TEACHER-CREATED CONTENT (custom lessons & quizzes)
-- ============================================================================
-- Lets a teacher upload custom lesson plans / printable activities and author
-- their own quizzes. Institutional selling point (Q8). RLS keeps content owned
-- by the creating teacher; students in that teacher's classes can read it.
--
-- Tables: teacher_lessons (custom lesson/activity), teacher_quizzes +
--         teacher_quiz_questions (custom MCQ quizzes).
-- ============================================================================

-- Custom lesson / printable activity authored by a teacher ---------------
create table public.teacher_lessons (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  summary     text,
  body        text not null,               -- rich text / markdown-ish content
  level       text,                        -- A1..C2
  class_id    uuid references public.class_roster(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.teacher_lessons enable row level security;

create policy "tl_owner_all" on public.teacher_lessons for all using (auth.uid() = teacher_id);
-- Students in any class of this teacher can read the teacher's lessons.
create policy "tl_student_read" on public.teacher_lessons for select using (
  exists (
    select 1 from public.class_roster cr
    join public.roster_members rm on rm.class_id = cr.id
    where cr.teacher_id = teacher_lessons.teacher_id and rm.student_id = auth.uid()
  )
);

-- Custom quiz authored by a teacher --------------------------------------
create table public.teacher_quizzes (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  description text,
  level       text,
  class_id    uuid references public.class_roster(id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.teacher_quiz_questions (
  id          uuid primary key default gen_random_uuid(),
  quiz_id     uuid not null references public.teacher_quizzes(id) on delete cascade,
  prompt      text not null,               -- the question / clue
  options     jsonb not null,              -- ["a","b","c","d"]
  answer_index int not null,               -- index of the correct option (0-based)
  explain     text,                        -- optional explanation
  position    int not null default 0
);

alter table public.teacher_quizzes enable row level security;
alter table public.teacher_quiz_questions enable row level security;

create policy "tq_owner_all" on public.teacher_quizzes for all using (auth.uid() = teacher_id);
create policy "tq_student_read" on public.teacher_quizzes for select using (
  exists (
    select 1 from public.class_roster cr
    join public.roster_members rm on rm.class_id = cr.id
    where cr.teacher_id = teacher_quizzes.teacher_id and rm.student_id = auth.uid()
  )
);
-- Questions visible to whoever can read their quiz (owner teacher always;
-- students see them via the quiz read policy). Using a simple owner-only +
-- student-via-class read, mirroring quiz policy.
create policy "tqq_owner_all" on public.teacher_quiz_questions for all using (
  exists (
    select 1 from public.teacher_quizzes tq
    where tq.id = teacher_quiz_questions.quiz_id and tq.teacher_id = auth.uid()
  )
);
create policy "tqq_student_read" on public.teacher_quiz_questions for select using (
  exists (
    select 1 from public.teacher_quizzes tq
    join public.class_roster cr on cr.id = tq.class_id
    join public.roster_members rm on rm.class_id = cr.id
    where tq.id = teacher_quiz_questions.quiz_id and rm.student_id = auth.uid()
  )
);

-- updated_at trigger for new tables ---------------------------------------
create trigger teacher_lessons_updated_at before update on public.teacher_lessons
  for each row execute procedure public.set_updated_at();
create trigger teacher_quizzes_updated_at before update on public.teacher_quizzes
  for each row execute procedure public.set_updated_at();