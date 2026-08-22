-- ============================================================================
-- Languago — Q19: IN-APP NOTIFICATIONS
-- ============================================================================
-- In-app notification feed (fully autonomous part of Q19). Email/push delivery
-- needs external credentials (SMTP / a push provider) — those are wired later;
-- this table is the durable inbox the site reads from.
--
-- Notification rows are created by the app (e.g. streak reminders, class
-- reminders, weekly parent reports, quiz results) and shown in a bell/feed.
-- RLS: a user reads/updates only their own notifications; authors (system,
-- via the service role in API endpoints) create them.
-- ============================================================================

create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  body        text,
  href        text,                    -- deep link e.g. /dashboard/kelimeler
  kind        text not null default 'info',  -- 'reminder' | 'weekly' | 'class' | 'info'
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);

alter table public.notifications enable row level security;

-- Owner reads/updates their own; creation is done via the service role helper.
create policy "notif_owner_read"  on public.notifications for select using (auth.uid() = user_id);
create policy "notif_owner_update" on public.notifications for update using (auth.uid() = user_id);

-- Service-role (API endpoint) creates notifications. RESTRICTED: only callable
-- through an edge-function/RPC guarded by the service role, NOT by any user.
-- Simple approach: a SECURITY DEFINER function anyone-authenticated can call is
-- DANGEROUS (spam). Instead rely on the service role client (in API endpoints)
-- which bypasses RLS; so we DO NOT add an insecure insert policy. The API
-- endpoint uses the service role key, or a SECURITY DEFINER function that
-- validates intended behaviour. Keep it minimal: no public insert policy.
-- (Service-role inserts bypass RLS entirely.)

-- index for fast own-feed queries
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);