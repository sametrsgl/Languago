import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Resolve the signed-in user for a request, or `null` when either Supabase is
 * not configured or the visitor has no valid session. Every protected page
 * calls this and redirects to `/signin` when the result is null.
 */
export async function getSessionUser(source: SupabaseSource) {
  const supabase = createSupabaseClient(source);
  if (!supabase) return null;
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

/** Best-effort progress upsert. Never throws; degrades gracefully when
 * Supabase is not configured or the session is missing. */
export async function saveProgress(
  source: SupabaseSource,
  module: string,
  payload: Record<string, unknown>
) {
  const supabase = createSupabaseClient(source);
  if (!supabase) return { ok: false as const, error: 'not_configured' };
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false as const, error: 'unauthenticated' };

  try {
    const { error } = await supabase
      .from('student_progress')
      .upsert(
        { student_id: data.user.id, module, payload },
        { onConflict: 'student_id,module' }
      );
    if (error) return { ok: false as const, error: error.message };
    return { ok: true as const, error: null };
  } catch {
    return { ok: false as const, error: 'write_failed' };
  }
}