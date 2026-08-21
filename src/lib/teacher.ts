import { randomInt } from 'node:crypto';
import { createSupabaseClient, type SupabaseSource } from './supabase';

/**
 * Role-gated teacher/admin authorization for Languago — SERVER-side only.
 *
 * The role is read from `public.profiles.role` (the RLS-authoritative source,
 * protected by a DB trigger), NEVER from `user_metadata.role` which is
 * client-editable and can be spoofed by a signed-in student.
 *
 * profiles RLS (`profiles_select_own`) lets a signed-in user SELECT only their
 * own row, so `select('role') ... .eq('id', user.id)` always resolves to the
 * current caller's actual, server-stored role.
 */
export type TeacherContext =
  | { ok: false; reason: 'no_supabase' | 'signed_out' | 'forbidden' }
  | { ok: true; userId: string; role: 'teacher' | 'admin' };

export async function authorizeTeacher(
  source: SupabaseSource
): Promise<TeacherContext> {
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
  if (role !== 'teacher' && role !== 'admin') {
    return { ok: false, reason: 'forbidden' };
  }
  return { ok: true, userId: data.user.id, role };
}

/** Alphanumeric class join-code, no lookalike characters. */
const JOIN_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function makeJoinCode(length = 6): string {
  let code = '';
  for (let i = 0; i < length; i++) {
    code += JOIN_ALPHABET[randomInt(JOIN_ALPHABET.length)];
  }
  return code;
}

/** Canonical progress modules with Turkish labels. */
export const MODULES = [
  { key: 'vocab', label: 'Kelime', emoji: '🪪' },
  { key: 'grammar', label: 'Dilbilgisi', emoji: '🧩' },
  { key: 'reading', label: 'Okuma', emoji: '📖' },
  { key: 'game', label: 'Oyunlar', emoji: '🎮' },
] as const;

export type ModuleKey = (typeof MODULES)[number]['key'];

/**
 * Best-effort short summary for one student's module progress entry.
 * `entry` is the row returned by the get_teacher_students RPC, i.e.
 * `{ payload: {...}, updated_at: "..." }` or undefined when untouched.
 * Returns a human string or null when there is no meaningful activity.
 */
export function moduleSummary(
  entry: { payload?: Record<string, unknown>; updated_at?: string } | undefined
): string | null {
  if (!entry) return null;
  const p = entry.payload && typeof entry.payload === 'object' ? entry.payload : null;
  if (!p) return null;
  if (typeof p.percent === 'number') {
    return `${Math.round(p.percent)}%`;
  }
  if (typeof p.correct === 'number' && typeof p.total === 'number') {
    return `${p.correct}/${p.total}`;
  }
  return 'Aktif';
}

/** Turkish-friendly short date (e.g. "21 Ağu"). Best-effort; fallback to ISO. */
const MONTHS_TR = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara',
];
export function shortDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.getDate()} ${MONTHS_TR[d.getMonth()] ?? ''} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`;
}

/** Display label for a stored CEFR/exam level key. */
export function levelLabel(level: string | null | undefined): string {
  return level && level.trim() ? level.trim().toUpperCase() : 'A1';
}