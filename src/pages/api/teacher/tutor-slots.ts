import { randomBytes } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeTeacher } from '../../../lib/teacher';

const ALLOWED_DURATIONS = [30, 45, 60];

function makeRoomToken(): string {
  return 'tutor-' + randomBytes(6).toString('hex');
}

/**
 * /api/teacher/tutor-slots
 * POST  — create an open 1:1 slot for the signed-in teacher.
 *         { starts_at: "ISO", duration_min: 30|45|60, note?: string }
 * DELETE — cancel a slot (sets status = 'cancelled'). { id: "..." }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { starts_at?: string; duration_min?: number; note?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const starts_raw = typeof body.starts_at === 'string' ? body.starts_at.trim() : '';
  const starts = new Date(starts_raw);
  if (!starts_raw || Number.isNaN(starts.getTime())) {
    return respond(400, { ok: false, error: { fields: { starts_at: ['Geçerli bir başlangıç zamanı seç.'] } } });
  }
  if (starts.getTime() <= Date.now()) {
    return respond(400, { ok: false, error: { fields: { starts_at: ['Başlangıç zamanı gelecekte olmalı.'] } } });
  }

  const duration_min = Number(body.duration_min);
  if (!ALLOWED_DURATIONS.includes(duration_min)) {
    return respond(400, { ok: false, error: { fields: { duration_min: ['Süre 30, 45 veya 60 dk olmalı.'] } } });
  }

  const note = (typeof body.note === 'string' ? body.note : '').trim().slice(0, 300);

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' } });
  }

  const auth = await authorizeTeacher(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için öğretmen yetkisi gerekli.' },
    });
  }

  // RLS `slots_owner` scopes inserts to teacher_id = auth.uid().
  const { data, error } = await supabase
    .from('tutor_slots')
    .insert({
      teacher_id: auth.userId,
      starts_at: starts.toISOString(),
      duration_min,
      room_token: makeRoomToken(),
      note: note || null,
      status: 'open',
    })
    .select('id')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Slot oluşturulamadı.' } });
  }
  return respond(200, { ok: true, id: data.id });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }
  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) {
    return respond(400, { ok: false, error: { message: 'Geçersiz slot.' } });
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' } });
  }

  const auth = await authorizeTeacher(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için öğretmen yetkisi gerekli.' },
    });
  }

  // RLS scopes the update to slots this teacher owns.
  const { data, error } = await supabase
    .from('tutor_slots')
    .update({ status: 'cancelled' })
    .eq('id', id)
    .eq('teacher_id', auth.userId)
    .select('id')
    .maybeSingle();

  if (error) {
    return respond(500, { ok: false, error: { message: error.message } });
  }
  if (!data) {
    return respond(404, { ok: false, error: { message: 'Slot bulunamadı.' } });
  }
  return respond(200, { ok: true });
};