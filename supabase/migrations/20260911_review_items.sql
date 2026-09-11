-- Durable item-level review state for the V2 retrieval loop.
-- Apply through Supabase's migration pipeline before enabling server persistence.
create table if not exists public.review_items (
  student_id uuid not null references auth.users(id) on delete cascade,
  item_id text not null,
  skill text not null check (skill in ('vocabulary', 'grammar', 'reading', 'speaking', 'listening', 'writing')),
  stability_days numeric not null default 0.1 check (stability_days > 0),
  difficulty numeric not null default 5 check (difficulty between 1 and 10),
  due_at timestamptz not null default now(),
  repetitions integer not null default 0 check (repetitions >= 0),
  lapses integer not null default 0 check (lapses >= 0),
  last_reviewed_at timestamptz,
  last_rating smallint check (last_rating between 0 and 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (student_id, item_id)
);

alter table public.review_items enable row level security;
drop policy if exists review_items_owner_all on public.review_items;
create policy review_items_owner_all on public.review_items
  for all using (auth.uid() = student_id) with check (auth.uid() = student_id);

create index if not exists review_items_due_idx on public.review_items (student_id, due_at);

revoke all on public.review_items from anon;
grant select, insert, update, delete on public.review_items to authenticated;
