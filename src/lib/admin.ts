import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Role-gated ADMIN authorization for Languago — SERVER-side only.
 *
 * Mirrors authorizeTeacher() exactly: the role is read from
 * `public.profiles.role` (the RLS-authoritative source, protected by a DB
 * trigger), NEVER from `user_metadata.role` which is client-editable and can
 * be spoofed by a signed-in user.
 *
 * profiles RLS (`profiles_select_own`) lets a signed-in user SELECT only their
 * own row, so `select('role') ... .eq('id', user.id)` always resolves to the
 * current caller's actual, server-stored role. Only `role === 'admin'` grants
 * CMS access; teachers/students get `forbidden`.
 */
export type AdminContext =
  | { ok: false; reason: 'no_supabase' | 'signed_out' | 'forbidden' }
  | { ok: true; userId: string; role: 'admin' };

export async function authorizeAdmin(source: SupabaseSource): Promise<AdminContext> {
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
  if (role !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, userId: data.user.id, role };
}