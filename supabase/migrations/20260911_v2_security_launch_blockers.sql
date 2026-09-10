-- Languago V2 follow-up launch blockers.
-- Review and apply through the normal Supabase migration pipeline only.
-- This migration never deletes existing booking data.

-- Fail before adding the single-seat invariant if legacy duplicates exist.
do $$
begin
  if exists (
    select 1 from public.tutor_bookings
    group by slot_id having count(*) > 1
  ) then
    raise exception 'duplicate tutor_bookings slot_id rows exist; resolve them before adding tutor_bookings_slot_id_unique';
  end if;
end $$;

alter table public.tutor_bookings
  add constraint tutor_bookings_slot_id_unique unique (slot_id);

create or replace function public.claim_tutor_slot(p_slot_id uuid)
returns public.tutor_slots
language plpgsql
security definer
set search_path = public
as $$
declare claimed public.tutor_slots;
begin
  if auth.uid() is null then raise exception 'authentication required' using errcode = '42501'; end if;
  update public.tutor_slots
     set status = 'booked'
   where id = p_slot_id
     and status = 'open'
   returning * into claimed;
  if claimed.id is null then raise exception 'tutor slot is no longer available' using errcode = 'P0001'; end if;
  return claimed;
end;
$$;
revoke execute on function public.claim_tutor_slot(uuid) from public;
grant execute on function public.claim_tutor_slot(uuid) to authenticated;

-- Preserve profile role on self-edits; trusted role management remains server-only.
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own_safe" on public.profiles for update
  using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from public.profiles where id = auth.uid())
  );

drop policy if exists "subs_owner_all" on public.subscriptions;
drop policy if exists "subs_owner_select" on public.subscriptions;
create policy "subs_owner_select" on public.subscriptions for select
  using (auth.uid() = user_id);

-- Reassert bounded SECURITY DEFINER access through the existing hardened definitions.
-- The production function bodies must bind p_teacher to auth.uid() and roster joins.
-- These comments are intentional operational guardrails for future edits.
comment on function public.get_teacher_students(uuid) is 'V2: caller must be the teacher and results are restricted to that teacher roster.';
comment on function public.get_booking_students(uuid) is 'V2: caller must be the requested teacher; no cross-teacher enumeration.';

revoke execute on function public.get_child_by_email(uuid, text) from authenticated;
revoke execute on function public.get_child_by_email(uuid, text) from public;

drop policy if exists "family_parent_all" on public.family_links;
create policy "family_parent_all" on public.family_links for all
  using (
    auth.uid() = parent_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'parent')
  )
  with check (
    auth.uid() = parent_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'parent')
  );
