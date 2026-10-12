-- Languago 2.0: homework ("Ödev"). A teacher sends one of their AI materials
-- Applied to production on 2026-10-12 (SQL editor, approved by the owner).
-- to a class or to one student, with an optional due date. Students answer the
-- grammar and reading questions (scored here, in the database, so the answer
-- key never reaches the browser before they submit) and may write the writing
-- task, which the teacher reads. In a material, a question's first option is
-- the right one; students always see the options in alphabetical order.

create table if not exists public.material_assignments (
  id           uuid primary key default gen_random_uuid(),
  teacher_id   uuid not null references public.profiles(id) on delete cascade,
  material_id  uuid not null references public.teacher_materials(id) on delete cascade,
  class_id     uuid references public.class_roster(id) on delete cascade,
  student_id   uuid references public.profiles(id) on delete cascade,
  title        text not null check (length(title) between 1 and 160),
  level        text not null,
  due_on       date,
  created_at   timestamptz not null default now(),
  check ((class_id is null) <> (student_id is null))
);
create index if not exists material_assignments_teacher_idx on public.material_assignments (teacher_id, created_at desc);
create index if not exists material_assignments_class_idx on public.material_assignments (class_id);
create index if not exists material_assignments_student_idx on public.material_assignments (student_id);
alter table public.material_assignments enable row level security;
create policy "ma_teacher_read"   on public.material_assignments for select using (auth.uid() = teacher_id);
create policy "ma_teacher_delete" on public.material_assignments for delete using (auth.uid() = teacher_id);
create policy "ma_student_read"   on public.material_assignments for select using (
  student_id = auth.uid() or exists (select 1 from public.roster_members rm where rm.class_id = material_assignments.class_id and rm.student_id = auth.uid()));

create table if not exists public.assignment_submissions (
  assignment_id uuid not null references public.material_assignments(id) on delete cascade,
  student_id    uuid not null references public.profiles(id) on delete cascade,
  correct       int not null,
  total         int not null,
  score         int not null check (score between 0 and 100),
  answers       jsonb not null default '{}'::jsonb,
  writing       text check (writing is null or length(writing) <= 4000),
  submitted_at  timestamptz not null default now(),
  primary key (assignment_id, student_id)
);
alter table public.assignment_submissions enable row level security;
create policy "as_own_read" on public.assignment_submissions for select using (auth.uid() = student_id);
create policy "as_teacher_read" on public.assignment_submissions for select using (exists (
  select 1 from public.material_assignments a where a.id = assignment_submissions.assignment_id and a.teacher_id = auth.uid()));

-- Is the signed-in user one of this assignment's students?
create or replace function public.assignment_is_mine(p_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.material_assignments a
     where a.id = p_id
       and (a.student_id = auth.uid()
            or exists (select 1 from public.roster_members rm where rm.class_id = a.class_id and rm.student_id = auth.uid())));
$$;
revoke all on function public.assignment_is_mine(uuid) from public, anon;
grant execute on function public.assignment_is_mine(uuid) to authenticated;

-- Send a material as homework (teacher's own material; own class, or a student in one of their classes). 50 a day.
create or replace function public.assign_material(p_material uuid, p_class uuid, p_student uuid, p_due date)
returns uuid language plpgsql security definer set search_path = public as $$
declare m record; new_id uuid;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  select id, title, level into m from public.teacher_materials where id = p_material and teacher_id = auth.uid();
  if not found then raise exception 'not_found'; end if;
  if (p_class is null) = (p_student is null) then raise exception 'bad_target'; end if;
  if p_class is not null and not exists (select 1 from public.class_roster where id = p_class and teacher_id = auth.uid()) then raise exception 'not_found'; end if;
  if p_student is not null and not exists (
    select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
     where rm.student_id = p_student and cr.teacher_id = auth.uid()) then raise exception 'not_found'; end if;
  if p_due is not null and (p_due < current_date or p_due > current_date + 180) then raise exception 'bad_due'; end if;
  if (select count(*) from public.material_assignments where teacher_id = auth.uid() and created_at > now() - interval '1 day') >= 50 then raise exception 'too_many'; end if;
  insert into public.material_assignments (teacher_id, material_id, class_id, student_id, title, level, due_on)
  values (auth.uid(), p_material, p_class, p_student, m.title, m.level, p_due)
  returning id into new_id;
  return new_id;
end;
$$;
revoke all on function public.assign_material(uuid, uuid, uuid, date) from public, anon;
grant execute on function public.assign_material(uuid, uuid, uuid, date) to authenticated;

-- A student's view of one assignment. Before submitting: questions with the
-- options in alphabetical order and no key. After submitting: also the right
-- answers and the student's own answers.
create or replace function public.get_assignment(p_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare a record; full_data jsonb; d jsonb; s record; done boolean;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not public.assignment_is_mine(p_id) then raise exception 'not_found'; end if;
  select ma.*, p.full_name as teacher_name into a
    from public.material_assignments ma join public.profiles p on p.id = ma.teacher_id where ma.id = p_id;
  select tm.data into full_data from public.teacher_materials tm where tm.id = a.material_id;
  d := full_data->'day';
  select * into s from public.assignment_submissions where assignment_id = p_id and student_id = auth.uid();
  done := found;
  return jsonb_build_object(
    'id', a.id, 'title', a.title, 'level', a.level, 'due_on', a.due_on, 'teacher', a.teacher_name,
    'topic', full_data->'topic',
    'grammar', (select coalesce(jsonb_agg(jsonb_build_object(
        'q', q->>'q',
        'o', (select jsonb_agg(x order by x) from jsonb_array_elements_text(q->'o') x),
        'right', case when done then q->'o'->>0 end) order by i), '[]'::jsonb)
      from jsonb_array_elements(d->'grammar'->'questions') with ordinality as t(q, i)),
    'reading', jsonb_build_object(
      'title', d->'reading'->>'title', 'text', d->'reading'->>'text',
      'questions', (select coalesce(jsonb_agg(jsonb_build_object(
          'q', q->>'q',
          'o', (select jsonb_agg(x order by x) from jsonb_array_elements_text(q->'o') x),
          'right', case when done then q->'o'->>0 end) order by i), '[]'::jsonb)
        from jsonb_array_elements(d->'reading'->'questions') with ordinality as t(q, i))),
    'writing', jsonb_build_object('prompt', d->'writing'->>'prompt', 'prompt_en', d->'writing'->>'prompt_en', 'min', d->'writing'->'min', 'max', d->'writing'->'max'),
    'submission', case when done then jsonb_build_object('correct', s.correct, 'total', s.total, 'score', s.score, 'answers', s.answers, 'writing', s.writing, 'submitted_at', s.submitted_at) end
  );
end;
$$;
revoke all on function public.get_assignment(uuid) from public, anon;
grant execute on function public.get_assignment(uuid) to authenticated;

-- Submit once: { "g": [chosen option text, ...], "r": [...] } in question order.
create or replace function public.submit_assignment(p_id uuid, p_answers jsonb, p_writing text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb; c int := 0; n int := 0; q jsonb; i int;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not public.assignment_is_mine(p_id) then raise exception 'not_found'; end if;
  if exists (select 1 from public.assignment_submissions where assignment_id = p_id and student_id = auth.uid()) then raise exception 'already_submitted'; end if;
  select tm.data->'day' into d from public.material_assignments ma join public.teacher_materials tm on tm.id = ma.material_id where ma.id = p_id;
  if d is null then raise exception 'not_found'; end if;
  i := 0;
  for q in select * from jsonb_array_elements(d->'grammar'->'questions') loop
    n := n + 1;
    if (p_answers->'g'->>i) is not null and (p_answers->'g'->>i) = q->'o'->>0 then c := c + 1; end if;
    i := i + 1;
  end loop;
  i := 0;
  for q in select * from jsonb_array_elements(d->'reading'->'questions') loop
    n := n + 1;
    if (p_answers->'r'->>i) is not null and (p_answers->'r'->>i) = q->'o'->>0 then c := c + 1; end if;
    i := i + 1;
  end loop;
  insert into public.assignment_submissions (assignment_id, student_id, correct, total, score, answers, writing)
  values (p_id, auth.uid(), c, n, case when n = 0 then 0 else round(c * 100.0 / n) end,
          jsonb_build_object('g', coalesce(p_answers->'g', '[]'::jsonb), 'r', coalesce(p_answers->'r', '[]'::jsonb)),
          nullif(left(btrim(coalesce(p_writing, '')), 4000), ''));
  return jsonb_build_object('correct', c, 'total', n, 'score', case when n = 0 then 0 else round(c * 100.0 / n) end);
end;
$$;
revoke all on function public.submit_assignment(uuid, jsonb, text) from public, anon;
grant execute on function public.submit_assignment(uuid, jsonb, text) to authenticated;
