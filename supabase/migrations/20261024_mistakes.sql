-- Languago 2.0: the mistakes notebook ("Hata defteri"). Wrong answers to
-- Applied to production on 2026-10-14 (SQL editor, approved by the owner).
-- grammar questions (daily mission, homework) and the AI's writing
-- corrections are kept per student and come back as short reviews:
-- right again → after 3, 7, 14, 30 days, then learned; wrong → tomorrow.

create table if not exists public.mistake_notes (
  id          bigint generated always as identity primary key,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  source      text not null check (source in ('mission','homework','writing')),
  level       text,
  prompt      text check (prompt is null or length(prompt) <= 300),
  wrong       text not null check (length(wrong) between 1 and 200),
  right_text  text not null check (length(right_text) between 1 and 200),
  why         text check (why is null or length(why) <= 300),
  box         smallint not null default 0 check (box between 0 and 5),
  due_on      date not null default (current_date + 1),
  reviews     int not null default 0,
  learned_at  timestamptz,
  created_at  timestamptz not null default now()
);
create unique index if not exists mistake_notes_unique on public.mistake_notes (student_id, md5(coalesce(prompt, '') || '|' || lower(right_text) || '|' || lower(wrong)));
create index if not exists mistake_notes_due_idx on public.mistake_notes (student_id, due_on) where learned_at is null;
alter table public.mistake_notes enable row level security;
create policy "mn_own_read" on public.mistake_notes for select using (auth.uid() = student_id);
create policy "mn_teacher_read" on public.mistake_notes for select using (exists (
  select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
  where cr.teacher_id = auth.uid() and rm.student_id = mistake_notes.student_id));

-- Add the signed-in student's mistakes: [{ source, level, prompt, wrong, right, why }], at most 20 at a time.
-- The same mistake again starts its reviews over.
create or replace function public.add_mistakes(p_items jsonb)
returns int language plpgsql security definer set search_path = public as $$
declare it jsonb; n int := 0;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if jsonb_typeof(p_items) <> 'array' then return 0; end if;
  if (select count(*) from public.mistake_notes where student_id = auth.uid()) >= 3000 then return 0; end if;
  for it in select * from jsonb_array_elements(p_items) limit 20 loop
    if coalesce(it->>'source', '') not in ('mission','homework','writing')
       or length(coalesce(it->>'wrong', '')) not between 1 and 200
       or length(coalesce(it->>'right', '')) not between 1 and 200
       or lower(btrim(it->>'wrong')) = lower(btrim(it->>'right')) then continue; end if;
    insert into public.mistake_notes (student_id, source, level, prompt, wrong, right_text, why)
    values (auth.uid(), it->>'source', left(it->>'level', 4), left(nullif(it->>'prompt', ''), 300), btrim(it->>'wrong'), btrim(it->>'right'), left(nullif(it->>'why', ''), 300))
    on conflict (student_id, md5(coalesce(prompt, '') || '|' || lower(right_text) || '|' || lower(wrong)))
    do update set box = 0, due_on = current_date + 1, learned_at = null;
    n := n + 1;
  end loop;
  return n;
end;
$$;
revoke all on function public.add_mistakes(jsonb) from public, anon;
grant execute on function public.add_mistakes(jsonb) to authenticated;

-- Record one review of the student's own note. Returns the next due date (null = learned).
create or replace function public.review_mistake(p_id bigint, p_ok boolean)
returns date language plpgsql security definer set search_path = public as $$
declare b smallint; next_due date;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  select box into b from public.mistake_notes where id = p_id and student_id = auth.uid() and learned_at is null;
  if not found then raise exception 'not_found'; end if;
  if p_ok then
    b := b + 1;
    next_due := current_date + (case b when 1 then 3 when 2 then 7 when 3 then 14 else 30 end);
  else
    b := 0; next_due := current_date + 1;
  end if;
  update public.mistake_notes
     set box = least(b, 5), due_on = next_due, reviews = reviews + 1,
         learned_at = case when b >= 5 then now() else null end
   where id = p_id;
  return case when b >= 5 then null else next_due end;
end;
$$;
revoke all on function public.review_mistake(bigint, boolean) from public, anon;
grant execute on function public.review_mistake(bigint, boolean) to authenticated;

-- Homework: same scoring as 20261023, plus wrong grammar answers go to the notebook.
create or replace function public.submit_assignment(p_id uuid, p_answers jsonb, p_writing text)
returns jsonb language plpgsql security definer set search_path = public as $$
declare d jsonb; lv text; c int := 0; n int := 0; q jsonb; i int; picked text; notes jsonb := '[]'::jsonb;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if not public.assignment_is_mine(p_id) then raise exception 'not_found'; end if;
  if exists (select 1 from public.assignment_submissions where assignment_id = p_id and student_id = auth.uid()) then raise exception 'already_submitted'; end if;
  select tm.data->'day', ma.level into d, lv from public.material_assignments ma join public.teacher_materials tm on tm.id = ma.material_id where ma.id = p_id;
  if d is null then raise exception 'not_found'; end if;
  i := 0;
  for q in select * from jsonb_array_elements(d->'grammar'->'questions') loop
    n := n + 1;
    picked := p_answers->'g'->>i;
    if picked is not null and picked = q->'o'->>0 then c := c + 1;
    elsif picked is not null then
      notes := notes || jsonb_build_object('source', 'homework', 'level', lv, 'prompt', q->>'q', 'wrong', picked, 'right', q->'o'->>0);
    end if;
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
  if jsonb_array_length(notes) > 0 then perform public.add_mistakes(notes); end if;
  return jsonb_build_object('correct', c, 'total', n, 'score', case when n = 0 then 0 else round(c * 100.0 / n) end);
end;
$$;
revoke all on function public.submit_assignment(uuid, jsonb, text) from public, anon;
grant execute on function public.submit_assignment(uuid, jsonb, text) to authenticated;
