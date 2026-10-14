-- Languago 2.0: the lesson-report helper turns a teacher's notes into a
-- Applied to production on 2026-10-14 (SQL editor, approved by the owner).
-- report with AI. Notes are about a student, so (as /kvkk promises) the AI is
-- used only when that student has given AI consent. Teachers cannot read the
-- consents table; this answers yes/no for a student they teach.

create or replace function public.student_ai_consent(p_student uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select c.ai_feedback from public.consents c where c.user_id = p_student), false)
     and exists (
       select 1 from public.roster_members rm join public.class_roster cr on cr.id = rm.class_id
        where rm.student_id = p_student and cr.teacher_id = auth.uid()
       union all
       select 1 from public.appointments a where a.student_id = p_student and a.teacher_id = auth.uid());
$$;
revoke all on function public.student_ai_consent(uuid) from public, anon;
grant execute on function public.student_ai_consent(uuid) to authenticated;
