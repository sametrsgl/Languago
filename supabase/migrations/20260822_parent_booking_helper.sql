-- Languago 2026-08-22
-- Security-definer helpers for the PARENT dashboard and the 1:1 booking UI (Q11).
-- Idempotent (create or replace). Run against Supabase with the ORG/SUPABASE
-- credentials; do NOT run locally. These let mid-tier code resolve data that
-- RLS intentionally hides (another user's email/profile) without exposing the
-- underlying tables to the client anon key.

-- ---------------------------------------------------------------------------
-- 1) get_child_by_email: a parent looks up their child by the child's account
--    email. Returns the child id only when that email belongs to a row whose
--    profiles.role = 'student'. Caller-guarded: onlly runs for auth.uid().
-- ---------------------------------------------------------------------------
create or replace function public.get_child_by_email(p_parent uuid, p_email text)
returns table(child_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public as $$
begin
  if p_parent is null or p_parent <> auth.uid() then
    return;
  end if;
  return query
    select p.id, p.full_name, u.email::text
    from public.profiles p
    join auth.users u on u.id = p.id
    where lower(u.email) = lower(p_email)
      and p.role = 'student'
    limit 1;
end;
$$;
revoke execute on function public.get_child_by_email(uuid, text) from public;
grant execute on function public.get_child_by_email(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- 2) get_booking_students: which student booked each of a teacher's tutor
--    slots. profiles RLS hides other users, so this SECURITY DEFINER resolves
--    the name/email for the slots the caller (a teacher) actually owns.
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_students(p_teacher uuid)
returns table(slot_id uuid, student_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public as $$
begin
  return query
    select b.slot_id, b.student_id, pr.full_name, u.email::text
    from public.tutor_bookings b
    join public.tutor_slots s on s.id = b.slot_id and s.teacher_id = p_teacher
    join public.profiles pr on pr.id = b.student_id
    join auth.users u on u.id = b.student_id;
end;
$$;
revoke execute on function public.get_booking_students(uuid) from public;
grant execute on function public.get_booking_students(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3) get_my_tutor_bookings: a student's own bookings with slot details.
--    Slots `slots_student_read` hides everything except 'open' slots, so this
--    SECURITY DEFINER lets the student read the (booked) slots they themselves
--    reserved. Guarded to the caller.
-- ---------------------------------------------------------------------------
create or replace function public.get_my_tutor_bookings(p_student uuid)
returns table(slot_id uuid, starts_at timestamptz, duration_min int, note text, status text, booked_at timestamptz)
language plpgsql security definer set search_path = public as $$
begin
  if p_student is null or p_student <> auth.uid() then
    return;
  end if;
  return query
    select b.slot_id, s.starts_at, s.duration_min, s.note, s.status, b.booked_at
    from public.tutor_bookings b
    join public.tutor_slots s on s.id = b.slot_id
    where b.student_id = p_student;
end;
$$;
revoke execute on function public.get_my_tutor_bookings(uuid) from public;
grant execute on function public.get_my_tutor_bookings(uuid) to authenticated;