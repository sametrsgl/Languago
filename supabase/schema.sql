-- Languago Teaching Platform — Supabase schema
-- Run in Supabase SQL editor (or `supabase db push`).
-- Tables: profiles, class_roster, student_progress, lessons.
-- RLS enabled: students read/write only their own rows; teachers read/write what they own.

-- =====================================================================
-- PROFILES  (1 row per auth.users)
-- =====================================================================
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  role        text not null default 'student' check (role in ('student','teacher')),
  full_name   text,
  level       text,                                   -- e.g. A1..C2, IELTS, TOEFL...
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id)
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Auto-create a profile when a new auth user signs up.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Policies
create policy "profiles_select_own"   on public.profiles for select using (auth.uid() = id);
create policy "profiles_update_own"   on public.profiles for update using (auth.uid() = id);
-- Teacher can read their students (see roster); helper below.

-- =====================================================================
-- CLASS ROSTER
-- =====================================================================
create table public.class_roster (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id),
  class_name  text not null,
  join_code   text not null unique,                  -- students join with this code
  created_at  timestamptz not null default now()
);

create table public.roster_members (
  class_id    uuid not null references public.class_roster(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  joined_at   timestamptz not null default now(),
  primary key (class_id, student_id)
);

alter table public.class_roster enable row level security;
alter table public.roster_members enable row level security;

create policy "roster_owner_create" on public.class_roster for insert to authenticated with check (auth.uid() = teacher_id);
create policy "roster_owner_select" on public.class_roster for select using (auth.uid() = teacher_id);
create policy "roster_member_read"  on public.roster_members for select using (
  auth.uid() = student_id or auth.uid() = teacher_id
);
create policy "roster_member_join"  on public.roster_members for insert to authenticated with check (auth.uid() = student_id);

-- =====================================================================
-- STUDENT PROGRESS
-- =====================================================================
create table public.student_progress (
  id          uuid primary key default gen_random_uuid(),
  student_id  uuid not null references public.profiles(id) on delete cascade,
  module      text not null,                          -- 'vocab' | 'grammar' | 'reading' | 'game'
  payload     jsonb not null default '{}'::jsonb,     -- per-module state (e.g. SRS boxes)
  updated_at  timestamptz not null default now(),
  unique (student_id, module)
);

alter table public.student_progress enable row level security;
create policy "progress_owner_all" on public.student_progress for all using (auth.uid() = student_id);

-- =====================================================================
-- LESSONS (scheduled online classes → Jitsi room)
-- =====================================================================
create table public.lessons (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id),
  title       text not null,
  starts_at   timestamptz not null,
  room_token  text not null unique,                   -- Jitsi room id / slug
  class_id    uuid references public.class_roster(id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table public.lessons enable row level security;
create policy "lesson_owner_all"     on public.lessons for all using (auth.uid() = teacher_id);
create policy "lesson_student_read"  on public.lessons for select using (
  exists (
    select 1 from public.roster_members rm
    join public.class_roster cr on cr.id = rm.class_id
    where rm.student_id = auth.uid() and cr.id = lessons.class_id
  )
);

-- =====================================================================
-- Helpers / updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at   before update on public.profiles        for each row execute procedure public.set_updated_at();
create trigger progress_updated_at   before update on public.student_progress for each row execute procedure public.set_updated_at();