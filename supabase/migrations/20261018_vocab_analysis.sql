-- Languago 2.0: vocabulary analysis ("Kelime analizi").
-- Applied to production on 2026-10-11 (SQL editor, approved by the owner).
-- Before the vocabulary path, a learner answers quick Turkish → English
-- questions (recommended 600 words; the path opens after 400). Every answer
-- is kept; known words go straight into the learner's cards as learned, so
-- the path teaches only what they don't know yet, and the vocabulary level
-- starts where their knowledge runs out.

create table if not exists public.vocab_checks (
  student_id  uuid not null references public.profiles(id) on delete cascade,
  word_id     text not null,
  level       text not null check (level in ('A1','A2','B1','B2','C1','C2')),
  known       boolean not null,
  checked_at  timestamptz not null default now(),
  primary key (student_id, word_id)
);
create index if not exists vocab_checks_student_idx on public.vocab_checks (student_id, level);
alter table public.vocab_checks enable row level security;
create policy "vch_own_read" on public.vocab_checks for select using (auth.uid() = student_id);
create policy "vch_teacher_read" on public.vocab_checks for select using (exists (
  select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
  where cr.teacher_id = auth.uid() and rm.student_id = vocab_checks.student_id));

-- Save a batch of answers [{ "id": "a1-hello", "level": "A1", "known": true }, ...]
-- and the vocabulary level the server worked out. Returns the learner's total.
create or replace function public.record_vocab_checks(p_items jsonb, p_vocab_level text default null)
returns int language plpgsql security definer set search_path = public as $$
declare it jsonb; n int;
begin
  if auth.uid() is null then raise exception 'signed_out'; end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 60 then raise exception 'bad_items'; end if;
  for it in select * from jsonb_array_elements(p_items) loop
    if length(it->>'id') > 60 or (it->>'level') not in ('A1','A2','B1','B2','C1','C2') then continue; end if;
    insert into public.vocab_checks (student_id, word_id, level, known)
    values (auth.uid(), it->>'id', it->>'level', coalesce((it->>'known')::boolean, false))
    on conflict (student_id, word_id) do update set known = excluded.known, checked_at = now();
    if coalesce((it->>'known')::boolean, false) then
      insert into public.vocab_cards (student_id, word_id, level, box, interval_days, due_on, reps, last_rating, first_seen_on)
      values (auth.uid(), it->>'id', it->>'level', 4, 35, public.path_today() + 35, 1, 'learned', public.path_today())
      on conflict (student_id, word_id) do nothing;
    end if;
  end loop;
  if p_vocab_level in ('A1','A2','B1','B2','C1','C2') then
    perform public.ensure_path(null, p_vocab_level);
    update public.path_state set vocab_level = p_vocab_level, updated_at = now() where student_id = auth.uid();
  end if;
  select count(*) into n from public.vocab_checks where student_id = auth.uid();
  return n;
end;
$$;
revoke all on function public.record_vocab_checks(jsonb, text) from public;
grant execute on function public.record_vocab_checks(jsonb, text) to authenticated;
revoke execute on function public.record_vocab_checks(jsonb, text) from anon;
