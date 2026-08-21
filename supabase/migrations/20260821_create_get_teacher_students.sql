-- ============================================================================
-- Languago — TEACHER READ ACCESS TO STUDENT PROFILES + PROGRESS
-- ============================================================================
-- WHY THIS IS NEEDED
-- -----------------
-- `student_progress` RLS is owner-only (`progress_owner_all`: student_id =
-- auth.uid()), so a teacher CANNOT `select` those rows directly — and the
-- profile RLS (`profiles_select_own`) lets a user read only their own row.
-- This security-definer function lets an authenticated teacher read the
-- student list (profiles where role='student') together with each student's
-- progress — WITHOUT weakening the owner-only RLS on student_progress or
-- profiles themselves (students keep their strict policies untouched).
--
-- HOW IT STAYS SECURE
-- -------------------
--  * `SECURITY DEFINER` runs as the table owner, but it is the ONLY path that
--    exposes progress — the underlying tables keep their original policies.
--  * The function takes the caller's own teacher id and verifies it equals the
--    session user (auth.uid()); a caller can never enumerate another scope.
--  * Execution is revoked from `public` and granted only to `authenticated`.
--    A signed-in student could call it but it returns zero rows for them
--    because their id will not match any teacher id passed with auth.uid().
--
-- USAGE (from a teacher/admin SSR session):
--   select * from public.get_teacher_students(auth.uid());
--   -- rows: student_id, full_name, email, level, created_at, progress(jsonb)
-- where progress is e.g.
--   {"vocab":{"payload":{...},"updated_at":"..."},"game":{"payload":{...},...}}
-- ============================================================================

create or replace function public.get_teacher_students(p_teacher uuid)
returns table (
  student_id  uuid,
  full_name   text,
  email       text,
  level       text,
  created_at  timestamptz,
  progress    jsonb
)
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bind the argument to the actual JWT/session user so callers cannot pass an
  -- arbitrary teacher id. auth.uid() reads the request's JWT claims, independent
  -- of the security-definer role switch.
  if p_teacher is null or p_teacher <> auth.uid() then
    return;
  end if;

  return query
  select
    p.id                as student_id,
    p.full_name         as full_name,
    au.email            as email,
    p.level             as level,
    p.created_at        as created_at,
    coalesce(
      jsonb_object_agg(
        sp.module,
        jsonb_build_object('payload', sp.payload, 'updated_at', sp.updated_at)
      ) filter (where sp.student_id is not null),
      '{}'::jsonb
    )                   as progress
  from public.profiles p
  join auth.users au on au.id = p.id
  left join public.student_progress sp on sp.student_id = p.id
  where p.role = 'student'
  group by p.id, au.email;
end;
$$;

revoke execute on function public.get_teacher_students(uuid) from public;
grant execute on function public.get_teacher_students(uuid) to authenticated;

-- Allow the app's anon JWT to also populate profiles.role on teacher updates is
-- intentionally NOT touched here (profiles role changes stay manual/admin-side).