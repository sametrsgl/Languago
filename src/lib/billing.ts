import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Languago — BILLING HELPERS (DESIGN/TEST MODE — no real payments).
 * ====================================================================
 * Per the monetization architecture, the app models pricing tiers, feature
 * access and trial state so it is READY to charge once real Stripe/Iyzico
 * keys are wired via Supabase Edge Functions. Nothing here performs a real
 * payment, creates a gateway customer, or moves money. It only reads the
 * seeded `pricing_tiers` / `subscriptions` tables and synthesizes a default
 * 'free' access level.
 *
 * Every function is GUARDED: a missing Supabase, no session, an empty table
 * or a malformed row resolves to a safe default instead of throwing, so it
 * never crashes the build / prerender.
 */

/** The four billing tiers (keys match public.pricing_tiers.key). */
export type TierKey = 'free' | 'premium' | 'family' | 'institutional';

/** Ordered, human-readable feature keys the whole app reasons about. */
export type BillingFeatureKey =
  | 'unlimitedWords'
  | 'dailyPractice'
  | 'grammar'
  | 'reading'
  | 'games'
  | 'liveClasses'
  | 'detailedAnalytics'
  | 'offline'
  | 'familySeats'
  | 'prioritySupport'
  | 'institutionalTools';

export type FeatureDef = { key: BillingFeatureKey; label: string };

/** Shared ordered feature vocabulary (rendering + comparisons stay in sync). */
export const BILLING_FEATURES: FeatureDef[] = [
  { key: 'unlimitedWords', label: 'Sınırsız kelime kartları' },
  { key: 'dailyPractice', label: 'Günlük kişiselleştirilmiş pratik (SRS)' },
  { key: 'grammar', label: 'Dil bilgisi modülü' },
  { key: 'reading', label: 'Okuma modülü' },
  { key: 'games', label: 'Sınıf içi oyunlar' },
  { key: 'liveClasses', label: 'Canlı online dersler' },
  { key: 'detailedAnalytics', label: 'Ayrıntılı ilerleme analizi' },
  { key: 'offline', label: 'Çevrimdışı çalışma' },
  { key: 'familySeats', label: 'Aile / veli panelleri' },
  { key: 'prioritySupport', label: 'Öncelikli destek' },
  { key: 'institutionalTools', label: 'Kurumsal yönetici & raporlama' },
];

type AccessMatrix = Record<BillingFeatureKey, boolean>;

const ACCESS: Record<TierKey, AccessMatrix> = {
  free: {
    unlimitedWords: true,
    dailyPractice: true,
    grammar: false,
    reading: false,
    games: true,
    liveClasses: false,
    detailedAnalytics: false,
    offline: false,
    familySeats: false,
    prioritySupport: false,
    institutionalTools: false,
  },
  premium: {
    unlimitedWords: true,
    dailyPractice: true,
    grammar: true,
    reading: true,
    games: true,
    liveClasses: true,
    detailedAnalytics: true,
    offline: true,
    familySeats: false,
    prioritySupport: false,
    institutionalTools: false,
  },
  family: {
    unlimitedWords: true,
    dailyPractice: true,
    grammar: true,
    reading: true,
    games: true,
    liveClasses: true,
    detailedAnalytics: true,
    offline: true,
    familySeats: true,
    prioritySupport: true,
    institutionalTools: false,
  },
  institutional: {
    unlimitedWords: true,
    dailyPractice: true,
    grammar: true,
    reading: true,
    games: true,
    liveClasses: true,
    detailedAnalytics: true,
    offline: true,
    familySeats: true,
    prioritySupport: true,
    institutionalTools: true,
  },
};

export const TIER_META: Record<TierKey, { key: TierKey; label: string; tagline: string }> = {
  free: { key: 'free', label: 'Ücretsiz', tagline: 'Başlamak için ideal' },
  premium: { key: 'premium', label: 'Premium', tagline: 'Kendi hızında tam öğrenim' },
  family: { key: 'family', label: 'Aile', tagline: 'Ailenle birlikte öğrenin' },
  institutional: { key: 'institutional', label: 'Kurumsal', tagline: 'Okul & kurum çözümü' },
};

/**
 * Normalize an arbitrary tier string to one of the 4 known keys.
 * Anything unrecognized (empty, 'inactive', typos) resolves to 'free'.
 */
export function normalizeTier(tier: string | null | undefined): TierKey {
  const t = (tier ?? '').toLowerCase();
  if (t === 'premium' || t === 'family' || t === 'institutional') return t;
  return 'free';
}

/**
 * Per-tier feature access. Always returns a full matrix for a known tier.
 * `check(key)` is a convenient boolean helper; `entries` is the ordered list
 * (with `on` flags) used to render a feature comparison list.
 */
export function getTierFeatureAccess(tier: string | null | undefined) {
  const key = normalizeTier(tier);
  const matrix = ACCESS[key];
  return {
    tier: key,
    label: TIER_META[key].label,
    check: (f: BillingFeatureKey) => matrix[f],
    entries: BILLING_FEATURES.map((f) => ({ ...f, on: matrix[f.key] })),
  };
}

/** A user's stored subscription row (shape we actually consume). */
export type SubscriptionRow = {
  id?: string;
  tier: string;
  status: string;
  trial_ends_at?: string | null;
  current_period_end?: string | null;
  gateway?: string | null;
  gateway_customer_id?: string | null;
};

/** Derived, render-ready view of a subscription for the account page. */
export type SubscriptionView = {
  tier: TierKey;
  status: string;
  isTrialing: boolean;
  trialEndsAt: string | null;
  daysLeft: number;
  gateway: string | null;
  paymentPending: boolean; // true until a real gateway is wired
};

/** Guarded read + trial-state derivation. Never throws. */
export function toSubscriptionView(row: SubscriptionRow | null): SubscriptionView {
  const tier = normalizeTier(row?.tier);
  const status = row?.status ?? 'free';
  const trialEndsAt = row?.trial_ends_at ?? null;
  let isTrialing = status === 'trialing' && !!trialEndsAt;
  let daysLeft = 0;
  if (isTrialing && trialEndsAt) {
    const end = new Date(trialEndsAt);
    if (!Number.isNaN(end.getTime())) {
      const days = Math.ceil((end.getTime() - Date.now()) / 86_400_000);
      daysLeft = Math.max(0, days);
      isTrialing = daysLeft > 0;
    }
  }
  return {
    tier,
    status,
    isTrialing,
    trialEndsAt: isTrialing ? trialEndsAt : null,
    daysLeft,
    gateway: row?.gateway ?? null,
    // No real Stripe/Iyzico customer id yet → still in design/build-your-path
    // mode until a gateway and customer are actually connected.
    paymentPending: !row?.gateway_customer_id,
  };
}

/**
 * Read the signed-in user's subscription row (owner RLS-scoped) or, when none
 * exists, best-effort upsert a default 'free' row. Returns a normalized
 * SubscriptionRow + view, or null when there is no Supabase / no session.
 *
 * Best-effort: if the upsert fails (permissions, table missing, offline) we
 * still return an in-memory default 'free' row so the page renders fine.
 */
export async function getOrCreateSubscription(source: SupabaseSource): Promise<{
  row: SubscriptionRow;
  view: SubscriptionView;
  userId: string;
} | null> {
  try {
    const supabase = createSupabaseClient(source);
    if (!supabase) return null;
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    const userId = user.user.id;

    const { data: found } = await supabase
      .from('subscriptions')
      .select(
        'id, tier, status, trial_ends_at, current_period_end, gateway, gateway_customer_id'
      )
      .eq('user_id', userId)
      .maybeSingle();

    if (found) {
      const row = found as SubscriptionRow;
      return { row, view: toSubscriptionView(row), userId };
    }

    // No row yet → best-effort default 'free' subscription upsert. Explicit
    // tier + status (never rely on the schema default) so it satisfies the
    // status check constraint. Fails silently on any error.
    const defaultRow: SubscriptionRow = { tier: 'free', status: 'free' };
    try {
      await supabase
        .from('subscriptions')
        .upsert({ user_id: userId, tier: 'free', status: 'free' }, { onConflict: 'user_id' });
    } catch {
      /* best-effort — the in-memory default is returned regardless */
    }
    return { row: defaultRow, view: toSubscriptionView(defaultRow), userId };
  } catch {
    return null;
  }
}