-- ============================================================================
-- Languago — UNIFIED LEARNING PATH architecture (the Unit)
-- ============================================================================
-- Binds a level's Vocabulary set + Reading + Grammar into a single logical
-- "Learning_Unit" and tracks a student's per-unit progress with soft gating.
--
-- Gating (as decided): LIGHT/sOFT — the UI soft-locks Reading (and Grammar)
-- until the unit's Vocabulary reaches ~80% completion (derived from the
-- student's real vocab activity in student_progress). No hard DB block; the
-- gating is enforced in the app layer so it can be tuned without migrations.
--
-- Tables: learning_units (curriculum mapping), student_unit_progress
--         (per-student per-unit soft progress + unlock state).
-- ============================================================================

-- The curriculum: which vocab set, which reading passage set, which grammar
-- module make up one learning unit. `level` is the shared key (a1, a2, ...).
-- Grammar uses GRAMMAR_<LEVEL> units; reading uses READINGS_<LEVEL>.
create table public.learning_units (
  id          uuid primary key default gen_random_uuid(),
  level       text not null unique,          -- a1..c2, ielts, toefl, ...
  title       text not null,                 -- e.g. "A1 · Başlangıç"
  vocab_key   text not null,                 -- VOCAB_SETS key (same as level)
  reading_key text not null,                 -- matching readings_<level>.js
  grammar_key text not null,                 -- matching GRAMMAR_<level>
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

-- Per-student unit progress + soft gating state. `unlock_reading` /
-- `unlock_grammar` are computed by the app (not trusted client-side) but
-- stored here so the dashboard reads one place.
create table public.student_unit_progress (
  student_id     uuid not null references public.profiles(id) on delete cascade,
  unit_id        uuid not null references public.learning_units(id) on delete cascade,
  vocab_pct      numeric not null default 0,   -- 0..100 (soft threshold source)
  vocab_done     boolean not null default false,
  reading_done   boolean not null default false,
  grammar_done   boolean not null default false,
  unlock_reading boolean not null default false,  -- true when vocab_pct >= 80
  unlock_grammar boolean not null default false,  -- true when reading_done (or vocab done if simpler)
  updated_at     timestamptz not null default now(),
  primary key (student_id, unit_id)
);

alter table public.learning_units enable row level security;
alter table public.student_unit_progress enable row level security;

-- Curriculum is globally readable (any signed-in or anon sees the levels).
create policy "units_read_public" on public.learning_units for select using (true);

-- A student reads/updates only their own unit progress row.
create policy "unit_progress_owner_all" on public.student_unit_progress for all
  using (auth.uid() = student_id)
  with check (auth.uid() = student_id);

-- kept updated_at in sync
create trigger student_unit_progress_updated_at before update on public.student_unit_progress
  for each row execute procedure public.set_updated_at();