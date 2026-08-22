-- ============================================================================
-- Languago — MONETIZATION ARCHITECTURE (Q13/14/15) — DESIGN-THEN-CHARGE (test mode)
-- ============================================================================
-- Builds the pricing-tier + trial + (future) subscription plumbing so the app
-- is ready to charge once real Stripe/Iyzico keys are connected. NO real
-- billing is performed by this schema — it models tiers, feature access, and
-- trial state. Real payment processing will be wired later via Supabase Edge
-- Functions (Stripe/Iyzico) reading these tables.
--
-- Tables: pricing_tiers (the 4 tiers), subscriptions (a user's current tier
--         + trial state + gateway references), payments (records for later).
-- ============================================================================

create table public.pricing_tiers (
  key         text primary key,        -- 'free' | 'premium' | 'family' | 'institutional'
  label       text not null,
  price_try   numeric not null default 0,   -- monthly price in TRY (0 for free); display only for now
  price_usd   numeric not null default 0,   -- optional USD price
  features    jsonb not null default '[]'::jsonb, -- e.g. ["Sınırsız kelime","Canlı dersler",...]
  sort_order  int not null default 0,
  is_active   boolean not null default true,
  updated_at  timestamptz not null default now()
);

create table public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  tier            text not null default 'free',   -- matches pricing_tiers.key
  status          text not null default 'inactive'
                    check (status in ('free','trialing','active','past_due','cancelled','paused')),
  trial_ends_at   timestamptz,                    -- 7-day trial
  gateway         text,            -- 'stripe' | 'iyzico' | null (until wired)
  gateway_customer_id text,        -- created once real keys connected
  gateway_sub_id     text,
  current_period_end timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (user_id)
);

create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.profiles(id) on delete cascade,
  amount_try      numeric not null default 0,
  gateway         text,
  gateway_ref     text,
  status          text not null default 'pending',
  created_at      timestamptz not null default now()
);

alter table public.pricing_tiers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.payments enable row level security;

-- Everyone can read the published price list (marketing + checkout UI).
create policy "tiers_read_public" on public.pricing_tiers for select using (true);
-- A user reads/updates only their own subscription + payments.
create policy "subs_owner_all" on public.subscriptions for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "payments_owner_read" on public.payments for select using (auth.uid() = user_id);

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute procedure public.set_updated_at();
create trigger pricing_tiers_updated_at before update on public.pricing_tiers
  for each row execute procedure public.set_updated_at();