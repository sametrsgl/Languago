-- Languago 2.0: the parent panel also shows the last 8 weeks of activity,
-- Applied to production on 2026-10-14 (SQL editor, approved by the owner).
-- homework with scores and the number of open mistakes. Same function as in
-- 20261017_parents (linked parents only), with four more fields.

create or replace function public.child_overview(p_child uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not exists (select 1 from public.family_links where parent_id = auth.uid() and child_id = p_child) then return null; end if;
  select jsonb_build_object(
    'name', (select full_name from public.profiles where id = p_child),
    'test', (select payload - 'answers' from public.student_progress where student_id = p_child and module = 'placement-test'),
    'path', (select to_jsonb(ps) - 'student_id' from public.path_state ps where ps.student_id = p_child),
    'recent', coalesce((select jsonb_agg(x) from (select day, task, best_score, passed, updated_at from public.mission_results where student_id = p_child order by updated_at desc limit 15) x), '[]'::jsonb),
    'lessons', coalesce((select jsonb_agg(x) from (select starts_at, status, attendance, report from public.appointments where student_id = p_child and starts_at > now() - interval '60 days' order by starts_at desc limit 12) x), '[]'::jsonb),
    'exams', coalesce((select jsonb_agg(x) from (select level, score, passed, taken_at from public.level_exams where student_id = p_child order by taken_at desc) x), '[]'::jsonb),
    -- new: dates for the weekly charts (last 9 weeks)
    'activity', jsonb_build_object(
      'tasks', coalesce((select jsonb_agg(updated_at) from public.mission_results where student_id = p_child and passed and updated_at > now() - interval '63 days'), '[]'::jsonb),
      'words', coalesce((select jsonb_agg(first_seen_on) from public.vocab_cards where student_id = p_child and first_seen_on > current_date - 63 and not (last_rating = 'learned' and reps <= 1)), '[]'::jsonb),
      'learned', coalesce((select jsonb_agg(learned_at) from public.mistake_notes where student_id = p_child and learned_at > now() - interval '63 days'), '[]'::jsonb)
    ),
    'openNotes', (select count(*) from public.mistake_notes where student_id = p_child and learned_at is null),
    'homework', coalesce((select jsonb_agg(x) from (
      select a.title, a.due_on, a.created_at, s.score, s.submitted_at
        from public.material_assignments a
        left join public.assignment_submissions s on s.assignment_id = a.id and s.student_id = p_child
       where a.student_id = p_child
          or exists (select 1 from public.roster_members rm where rm.class_id = a.class_id and rm.student_id = p_child)
       order by a.created_at desc limit 8) x), '[]'::jsonb)
  ) into r;
  return r;
end;
$$;
revoke all on function public.child_overview(uuid) from public, anon;
grant execute on function public.child_overview(uuid) to authenticated;
