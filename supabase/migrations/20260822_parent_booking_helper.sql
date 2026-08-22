-- ============================================================================
-- Languago — PARENT DASHBOARD + BOOKING helper
-- ============================================================================
-- Adds get_child_by_email, a SECURITY DEFINER helper so a parent can look up
-- a child student by email (to link them) without bypassing RLS on profiles.
-- Companion to supabase/migrations/20260822_q2q4_parent_role.sql
-- (get_family_children) and 20260822_q11_dual_calendar.sql (booking tables).
-- ============================================================================

create or replace function public.get_child_by_email(p_parent uuid, p_email text)
returns table(child_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_parent is null or p_parent <> auth.uid() then return; end if;
  return query
  select p.id, p.full_name, u.email::text
  from public.profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(p_email) and p.role = 'student'
  limit 1;
end;
$$;

revoke execute on function public.get_child_by_email(uuid, text) from public;
grant execute on function public.get_child_by_email(uuid, text) to authenticated;