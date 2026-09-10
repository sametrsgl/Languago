-- ============================================================================
-- Languago — SECURITY HARDENING (2026-09-10)
-- ============================================================================
-- Fixes three privilege-escalation / data-leak classes in one migration:
--
--  1) PROFILES ROLE ESCALATION
--     `profiles_update_own` (schema.sql) allows any authenticated user to
--     UPDATE their whole own row — including `role`. A student could simply
--     set role='teacher' (or 'admin') and unlock teacher/admin surfaces.
--     RLS policies cannot express "all columns except role", so we enforce it
--     with a BEFORE UPDATE trigger that rejects any role change by non-admin
--     callers (idempotent: drop/create, safe to re-run).
--
--  2) SUBSCRIPTION SELF-SERVICE ESCALATION
--     `subs_owner_all` (20260822_monetization.sql) is FOR ALL — a user can
--     INSERT/UPDATE/DELETE their own subscription row and simply set
--     tier='premium', status='active'. Paid state must only ever be written
--     by trusted backend logic (service role / payment webhook / admin).
--     We drop that policy and replace it with SELECT-only access.
--     Note: the app's getOrCreateSubscription() upsert of a default 'free'
--     row will now fail (best-effort, already tolerated) — the account page
--     already falls back to an in-memory 'free' row, so UX is unchanged.
--     A trusted seed RPC (`seed_own_free_subscription`) keeps first-visit
--     rows working without granting UPDATE/DELETE.
--
--  3) SECURITY DEFINER LEAKS
--     a. get_teacher_students(uuid) returned EVERY student on the platform
--        (with progress) to any authenticated caller who passed their own id.
--        Now it returns only students actually enrolled in the caller's
--        classes (roster_members → class_roster) and requires the caller's
--        profile.role to be 'teacher' (or 'admin').
--     b. get_booking_students(p_teacher) had NO auth guard: any authenticated
--        user could enumerate another teacher's bookings + student emails.
--        Now the argument must equal auth.uid() AND the caller must be a
--        teacher/admin; otherwise zero rows.
--
-- All statements are idempotent (create or replace / drop if exists) so the
-- migration is safe to re-run and to apply on top of an existing project.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1) PROFILES: block role self-escalation
-- ---------------------------------------------------------------------------
create or replace function public.enforce_profile_role_unchanged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  caller_role text;
begin
  -- No-op when the role is not being touched (the common case: a user
  -- editing full_name / level on their own row).
  if new.role is distinct from old.role then
    if auth.uid() is not null then
      -- A real signed-in user is making this change: only admins may change
      -- any role (including their own). Everyone else is rejected.
      select p.role into caller_role
      from public.profiles p
      where p.id = auth.uid();

      if caller_role is distinct from 'admin' then
        raise exception 'profiles.role cannot be changed by non-admin callers'
          using errcode = '42501';
      end if;
    end if;
    -- auth.uid() IS NULL → trusted context (service role / SQL editor /
    -- postgres). Those bypass RLS by design and stay allowed so payment
    -- webhooks and admin tooling can manage roles.
  end if;

  return new;
end;
$$;

revoke execute on function public.enforce_profile_role_unchanged() from public;

drop trigger if exists profiles_role_guard on public.profiles;
create trigger profiles_role_guard
  before update on public.profiles
  for each row execute procedure public.enforce_profile_role_unchanged();

-- ---------------------------------------------------------------------------
-- 2) SUBSCRIPTIONS: read-only for owners; writes only via trusted paths
-- ---------------------------------------------------------------------------
drop policy if exists "subs_owner_all" on public.subscriptions;

create policy "subs_owner_select"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Trusted first-visit seeding of a default 'free' row. SECURITY DEFINER +
-- caller-bound: a user can only seed their own row, only once (no update
-- path), and only with tier='free'/status='free' — premium state remains
-- impossible to reach from the client.
create or replace function public.seed_own_free_subscription()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  insert into public.subscriptions (user_id, tier, status)
  values (auth.uid(), 'free', 'free')
  on conflict (user_id) do nothing;
end;
$$;

revoke execute on function public.seed_own_free_subscription() from public;
grant execute on function public.seed_own_free_subscription() to authenticated;

-- ---------------------------------------------------------------------------
-- 3a) get_teacher_students: restrict to the caller's OWN roster students
-- ---------------------------------------------------------------------------
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
declare
  caller_role text;
begin
  -- Bind the argument to the session user; anything else returns nothing.
  if p_teacher is null or p_teacher <> auth.uid() then
    return;
  end if;

  -- Only teachers (and admins) may list students; a student passing their
  -- own id gets zero rows instead of the whole platform.
  select p.role into caller_role from public.profiles p where p.id = auth.uid();
  if caller_role is distinct from 'teacher' and caller_role is distinct from 'admin' then
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
  -- ONLY students enrolled in one of THIS teacher's classes.
  join public.roster_members rm on rm.student_id = p.id
  join public.class_roster  cr  on cr.id = rm.class_id and cr.teacher_id = p_teacher
  left join public.student_progress sp on sp.student_id = p.id
  where p.role = 'student'
  group by p.id, au.email;
end;
$$;

revoke execute on function public.get_teacher_students(uuid) from public;
grant execute on function public.get_teacher_students(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 3b) get_booking_students: guard to the calling teacher
-- ---------------------------------------------------------------------------
create or replace function public.get_booking_students(p_teacher uuid)
returns table(slot_id uuid, student_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
begin
  -- The caller must be asking about themselves.
  if p_teacher is null or p_teacher <> auth.uid() then
    return;
  end if;

  -- ...and must actually be a teacher/admin.
  select p.role into caller_role from public.profiles p where p.id = auth.uid();
  if caller_role is distinct from 'teacher' and caller_role is distinct from 'admin' then
    return;
  end if;

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
-- 3c) FAMILY HELPERS: restrict child lookup/linking to actual parent accounts
--     Previously ANY authenticated user could resolve a student's id from
--     their email (get_child_by_email), self-insert a family_links row
--     (family_parent_all) and then read that student's progress via
--     get_family_children. Requiring profiles.role = 'parent' for the
--     helpers closes that enumeration path (roles are unchangeable per the
--     trigger above, so this cannot be self-granted). The family_links RLS
--     policy is likewise tightened so only parent/admin accounts can create
--     links at all.
-- ---------------------------------------------------------------------------
drop policy if exists "family_parent_all" on public.family_links;
create policy "family_parent_all" on public.family_links for all
  using (
    auth.uid() = parent_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('parent', 'admin')
    )
  )
  with check (
    auth.uid() = parent_id
    and exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role in ('parent', 'admin')
    )
  );

create or replace function public.get_child_by_email(p_parent uuid, p_email text)
returns table(child_id uuid, full_name text, email text)
language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
begin
  if p_parent is null or p_parent <> auth.uid() then
    return;
  end if;
  select p.role into caller_role from public.profiles p where p.id = auth.uid();
  if caller_role is distinct from 'parent' and caller_role is distinct from 'admin' then
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

create or replace function public.get_family_children(p_parent uuid)
returns table (
  child_id  uuid,
  full_name text,
  email     text,
  level     text,
  progress  jsonb,
  last_activity timestamptz
)
language plpgsql security definer set search_path = public as $$
declare
  caller_role text;
begin
  if p_parent is null or p_parent <> auth.uid() then
    return;
  end if;
  select p.role into caller_role from public.profiles p where p.id = auth.uid();
  if caller_role is distinct from 'parent' and caller_role is distinct from 'admin' then
    return;
  end if;
  return query
  select
    p.id as child_id,
    p.full_name,
    au.email::text as email,
    p.level,
    coalesce(
      jsonb_object_agg(
        sp.module,
        jsonb_build_object('payload', sp.payload, 'updated_at', sp.updated_at)
      ) filter (where sp.student_id is not null),
      '{}'::jsonb
    ) as progress,
    max(sp.updated_at) as last_activity
  from public.profiles p
  join public.family_links fl on fl.child_id = p.id and fl.parent_id = p_parent
  join auth.users au on au.id = p.id
  left join public.student_progress sp on sp.student_id = p.id
  where p.role = 'student'
  group by p.id, au.email;
end;
$$;
revoke execute on function public.get_family_children(uuid) from public;
grant execute on function public.get_family_children(uuid) to authenticated;
