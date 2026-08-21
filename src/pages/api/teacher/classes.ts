import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeTeacher, makeJoinCode } from '../../../lib/teacher';

/**
 * POST /api/teacher/classes
 * Create a new class roster for the signed-in teacher.
 *
 * Role is validated server-side from profiles.role (never user_metadata).
 * RLS `roster_owner_create` enforces teacher_id = auth.uid().
 *
 * Request: { "class_name": "..." }
 * Success: { "ok": true, "id": "...", "join_code": "XXXXXX" }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { class_name?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const class_name = (typeof body.class_name === 'string' ? body.class_name : '').trim();
  if (!class_name) {
    return respond(400, {
      ok: false,
      error: { fields: { class_name: ['Sınıf adı gerekli.'] } },
    });
  }
  if (class_name.length > 120) {
    return respond(400, {
      ok: false,
      error: { fields: { class_name: ['Sınıf adı en fazla 120 karakter olabilir.'] } },
    });
  }

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

  // Generate a unique join-code; retry a few times on collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    const join_code = makeJoinCode();
    const { data, error } = await supabase
      .from('class_roster')
      .insert({ teacher_id: auth.userId, class_name, join_code })
      .select('id')
      .single();

    if (!error && data) {
      return respond(200, { ok: true, id: data.id, join_code });
    }
    if (error && !String(error.code ?? '').match(/23505|unique/)) {
      return respond(500, { ok: false, error: { message: error.message } });
    }
  }

  return respond(500, {
    ok: false,
    error: { message: 'Katılım kodu üretilemedi. Lütfen tekrar dene.' },
  });
};