-- ============================================================================
-- Languago — Q11: DUAL CALENDAR (group classes + 1-on-1 bookings)
-- ============================================================================
-- Adds a 1-on-1 tutoring booking system alongside the existing group
-- `lessons` (online Jitsi classes). A teacher sets available 1-on-1 slots;
-- students register for one. Uses the class_roster / lessons concepts already
-- present without touching existing tables.
--
-- Tables: tutor_slots (teacher-offered 1-on-1 appointment slots),
--         tutor_bookings (a student's registration for a slot).
-- ============================================================================

create table public.tutor_slots (
  id          uuid primary key default gen_random_uuid(),
  teacher_id  uuid not null references public.profiles(id) on delete cascade,
  starts_at   timestamptz not null,
  duration_min int not null default 30,
  room_token  text unique,                -- shared Jitsi room for the tutoring session
  note        text,                       -- optional teacher note / topic
  status      text not null default 'open' check (status in ('open','booked','cancelled')),
  created_at  timestamptz not null default now()
);

create table public.tutor_bookings (
  id          uuid primary key default gen_random_uuid(),
  slot_id     uuid not null references public.tutor_slots(id) on delete cascade,
  student_id  uuid not null references public.profiles(id) on delete cascade,
  booked_at   timestamptz not null default now(),
  unique (slot_id, student_id)           -- a student cannot book the same slot twice
);

alter table public.tutor_slots enable row level security;
alter table public.tutor_bookings enable row level security;

-- Teacher owns their slots (CRUD).
create policy "slots_owner_all" on public.tutor_slots for all using (auth.uid() = teacher_id);
-- Students can read OPEN slots from teachers they are enrolled with (via roster)
-- so they only see booking options from their own teacher(s).
create policy "slots_student_read" on public.tutor_slots for select using (
  status = 'open' and exists (
    select 1 from public.class_roster cr
    join public.roster_members rm on rm.class_id = cr.id
    where cr.teacher_id = tutor_slots.teacher_id and rm.student_id = auth.uid()
  )
);
-- Teacher manages bookings for their slots.
create policy "bookings_teacher_all" on public.tutor_bookings for all using (
  exists (
    select 1 from public.tutor_slots ts where ts.id = tutor_bookings.slot_id and ts.teacher_id = auth.uid()
  )
);
-- Student creates/reads their own booking.
create policy "bookings_student_read" on public.tutor_bookings for select using (auth.uid() = student_id);
create policy "bookings_student_insert" on public.tutor_bookings for insert to authenticated
  with check (auth.uid() = student_id and (
    -- must be a student and the slot must be open
    exists (select 1 from public.tutor_slots ts where ts.id = slot_id and ts.status = 'open')
  ));