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

-- Book and close a slot in one transaction. This prevents two students from
-- both seeing an open slot and one booking succeeding after the other.
create or replace function public.book_tutor_slot(p_slot_id uuid)
returns public.tutor_slots
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed public.tutor_slots;
begin
  if auth.uid() is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;

  update public.tutor_slots ts
     set status = 'booked'
   where ts.id = p_slot_id
     and ts.status = 'open'
     and exists (
       select 1
       from public.class_roster cr
       join public.roster_members rm on rm.class_id = cr.id
       where cr.teacher_id = ts.teacher_id
         and rm.student_id = auth.uid()
     )
   returning ts.* into claimed;

  if claimed.id is null then
    raise exception 'tutor slot is no longer available' using errcode = 'P0001';
  end if;

  insert into public.tutor_bookings (slot_id, student_id)
  values (claimed.id, auth.uid());
  return claimed;
end;
$$;
revoke execute on function public.book_tutor_slot(uuid) from public;
grant execute on function public.book_tutor_slot(uuid) to authenticated;

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
create or replace function public.get_teacher_students(p_teacher uuid)
returns table (student_id uuid, full_name text, email text, level text, created_at timestamptz, progress jsonb)
language plpgsql security definer set search_path = public
as $$
begin
  if p_teacher is null or p_teacher <> auth.uid() then return; end if;
  return query
    select p.id, p.full_name, au.email::text, p.level, p.created_at,
      coalesce(jsonb_object_agg(sp.module, jsonb_build_object('payload', sp.payload, 'updated_at', sp.updated_at)) filter (where sp.student_id is not null), '{}'::jsonb)
    from public.profiles p
    join auth.users au on au.id = p.id
    join public.roster_members rm on rm.student_id = p.id
    join public.class_roster cr on cr.id = rm.class_id and cr.teacher_id = p_teacher
    left join public.student_progress sp on sp.student_id = p.id
    where p.role = 'student'
    group by p.id, au.email;
end;
$$;

create or replace function public.get_booking_students(p_teacher uuid)
returns table(slot_id uuid, student_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public
as $$
begin
  if p_teacher is null or p_teacher <> auth.uid() then return; end if;
  return query
    select b.slot_id, b.student_id, pr.full_name, u.email::text
    from public.tutor_bookings b
    join public.tutor_slots s on s.id = b.slot_id and s.teacher_id = p_teacher
    join public.profiles pr on pr.id = b.student_id
    join auth.users u on u.id = b.student_id;
end;
$$;
revoke execute on function public.get_teacher_students(uuid) from public;
grant execute on function public.get_teacher_students(uuid) to authenticated;
revoke execute on function public.get_booking_students(uuid) from public;
grant execute on function public.get_booking_students(uuid) to authenticated;

revoke execute on function public.get_child_by_email(uuid, text) from authenticated;
revoke execute on function public.get_child_by_email(uuid, text) from public;

drop policy if exists "family_parent_all" on public.family_links;
create policy "family_parent_all" on public.family_links for all
  using (
    auth.uid() = family_links.parent_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'parent')
  )
  with check (
    auth.uid() = family_links.parent_id
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'parent')
  );
