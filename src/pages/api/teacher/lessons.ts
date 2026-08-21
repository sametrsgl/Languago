import { randomUUID } from 'node:crypto';
import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeTeacher } from '../../../lib/teacher';

/**
 * POST /api/teacher/lessons
 * Create a scheduled online video-class (a Jitsi room) for the signed-in teacher.
 *
 * Role is validated server-side from profiles.role (never user_metadata).
 * RLS `lesson_owner_all` enforces teacher_id = auth.uid() on insert, and the
 * room_token is a cryptographically random UUID (prefixed `lg-`) so the Jitsi
 * room name is unguessable.
 *
 * Request: { "title": "...", "starts_at": "2026-08-22T10:00:00+03:00", "class_id"? }
 * Success: { "ok": true, "lesson": {...incl. room_token} }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { title?: string; starts_at?: string; class_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const title = (typeof body.title === 'string' ? body.title : '').trim();
  if (!title) {
    return respond(400, {
      ok: false,
      error: { fields: { title: ['Ders başlığı gerekli.'] } },
    });
  }
  if (title.length > 120) {
    return respond(400, {
      ok: false,
      error: { fields: { title: ['Ders başlığı en fazla 120 karakter olabilir.'] } },
    });
  }

  const starts_at = typeof body.starts_at === 'string' ? body.starts_at.trim() : '';
  if (!starts_at) {
    return respond(400, {
      ok: false,
      error: { fields: { starts_at: ['Ders tarihi gerekli.'] } },
    });
  }
  const startsDate = new Date(starts_at);
  if (Number.isNaN(startsDate.getTime())) {
    return respond(400, {
      ok: false,
      error: { fields: { starts_at: ['Geçersiz tarih.'] } },
    });
  }

  const class_id =
    typeof body.class_id === 'string' && body.class_id.trim()
      ? body.class_id.trim()
      : null;

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return respond(500, {
      ok: false,
      error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' },
    });
  }

  const auth = await authorizeTeacher(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için öğretmen yetkisi gerekli.' },
    });
  }

  // If a class is chosen, verify it belongs to this teacher so a teacher can't
  // attach a lesson to someone else's roster.
  if (class_id) {
    const { data: cls } = await supabase
      .from('class_roster')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', auth.userId)
      .maybeSingle();
    if (!cls) {
      return respond(400, {
        ok: false,
        error: { fields: { class_id: ['Seçtiğin sınıf bulunamadı.'] } },
      });
    }
  }

  // Cryptographically random Jitsi room name — never predictable/incrementing.
  const room_token = `lg-${randomUUID()}`;

  const { data, error } = await supabase
    .from('lessons')
    .insert({
      teacher_id: auth.userId,
      title,
      starts_at: startsDate.toISOString(),
      room_token,
      class_id,
    })
    .select('id, title, starts_at, room_token, class_id, created_at')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Kayıt başarısız.' } });
  }

  return respond(200, { ok: true, lesson: data });
};