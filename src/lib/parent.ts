import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Role-gated parent/admin authorization for Languago — SERVER-side only.
 *
 * Mirrors `authorizeTeacher` exactly: the role is read from the
 * RLS-authoritative `public.profiles.role` (protected by a DB trigger), NEVER
 * from `user_metadata.role`. profiles RLS (`profiles_select_own`) lets a
 * signed-in user SELECT only their own row, so this always resolves to the
 * caller's real, server-stored role.
 */
export type ParentContext =
  | { ok: false; reason: 'no_supabase' | 'signed_out' | 'forbidden' }
  | { ok: true; userId: string; role: 'parent' | 'admin' };

export async function authorizeParent(
  source: SupabaseSource
): Promise<ParentContext> {
  const supabase = createSupabaseClient(source);
  if (!supabase) return { ok: false, reason: 'no_supabase' };

  const { data } = await supabase.auth.getUser();
  if (!data.user) return { ok: false, reason: 'signed_out' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle();

  const role = (profile?.role as string | undefined) ?? 'student';
  if (role !== 'parent' && role !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, userId: data.user.id, role };
}