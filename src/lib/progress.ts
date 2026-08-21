import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Best-effort reads of the signed-in student's own `student_progress` row for
 * a module, used to power the "Kaldığın yerden devam et" markers on the
 * self-study pages (Kelime / Dilbilgisi / Okuma).
 *
 * Everything here is guarded so it NEVER crashes or blocks the build/prerender:
 * a missing Supabase, no session, an empty table, or an oddly-shaped payload
 * all resolve to `null`. Callers treat `null` as "no resume data".
 */

export type ProgressRow = {
  module: string;
  payload?: Record<string, unknown> | null;
  updated_at?: string;
};

/** Read the latest `student_progress` row payload for a module, or null. */
export async function readProgress(
  source: SupabaseSource,
  module: string
): Promise<Record<string, unknown> | null> {
  try {
    const supabase = createSupabaseClient(source);
    if (!supabase) return null;
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return null;
    const { data } = await supabase
      .from('student_progress')
      .select('payload, updated_at')
      .eq('student_id', user.user.id)
      .eq('module', module)
      .order('updated_at', { ascending: false })
      .limit(1);
    const row = data && Array.isArray(data) ? data[0] : null;
    if (!row || !row.payload || typeof row.payload !== 'object') return null;
    return row.payload as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Safely pull a string-ish field out of a payload object. */
export function payloadStr(p: Record<string, unknown> | null | undefined, ...keys: string[]): string {
  if (!p || typeof p !== 'object') return '';
  for (const k of keys) {
    const v = (p as Record<string, unknown>)[k];
    if (typeof v === 'string' && v) return v;
    if (typeof v === 'number') return String(v);
  }
  return '';
}