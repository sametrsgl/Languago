-- ============================================================================
-- Languago — Q2+Q4: PARENT ROLE + FAMILY LINKAGE
-- ============================================================================
-- Adds a `parent` role (so a parent dashboard can monitor multiple children)
-- and a `family_links` table linking a parent to one or more child students.
-- Admin role also added for future platform-wide management (Q16 CMS).
--
-- IMPORTANT: run this AFTER the q8 migration. It alters the profiles role
-- check constraint, which requires dropping + re-adding the constraint.
-- ============================================================================

-- Widen the role check to include 'parent' and 'admin'. -----------------
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('student','teacher','parent','admin'));

-- A parent can be linked to multiple children (students). ----------------
create table public.family_links (
  parent_id   uuid not null references public.profiles(id) on delete cascade,
  child_id    uuid not null references public.profiles(id) on delete cascade,
  linked_at   timestamptz not null default now(),
  primary key (parent_id, child_id)
);

alter table public.family_links enable row level security;

-- Only the parent themselves can manage their links.
create policy "family_parent_all" on public.family_links for all
  using (auth.uid() = parent_id)
  with check (auth.uid() = parent_id);

-- A parent may read their children's progress via a security-definer helper,
-- so RLS on student_progress (owner-only) is not weakened. The helper binds
-- the child to an active family_link owned by the caller.
create or replace function public.get_family_children(p_parent uuid)
returns table (
  child_id  uuid,
  full_name text,
  email     text,
  level     text,
  progress  jsonb,
  last_activity timestamptz
)
language plpgsql security definer set search_path = public
as $$
begin
  if p_parent is null or p_parent <> auth.uid() then
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