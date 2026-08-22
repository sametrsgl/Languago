import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeTeacher } from '../../../lib/teacher';

type Respond = (status: number, body: Record<string, unknown>) => Response;
const respond: Respond = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * POST /api/teacher/content-lessons
 * Create a custom teacher lesson / printable activity.
 *
 * Role is validated server-side from profiles.role (never user_metadata).
 * RLS `teacher_lessons` policies enforce teacher_id = auth.uid() on insert
 * and scope reads/deletes to the caller's own rows.
 *
 * Request:  { "title", "summary"?, "level"?, "body"?, "class_id"? }
 * Success:  { "ok": true, "lesson": {...} }
 *
 * DELETE /api/teacher/content-lessons  body { "id" }
 * Delete one of the teacher's own lessons.
 * Success:  { "ok": true }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: {
    title?: string;
    summary?: string;
    level?: string;
    body?: string;
    class_id?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const title = (typeof body.title === 'string' ? body.title : '').trim();
  if (!title) {
    return respond(400, { ok: false, error: { fields: { title: ['Başlık gerekli.'] } } });
  }
  if (title.length > 120) {
    return respond(400, {
      ok: false,
      error: { fields: { title: ['Başlık en fazla 120 karakter olabilir.'] } },
    });
  }

  const summary = (typeof body.summary === 'string' ? body.summary : '').trim();
  const level = (typeof body.level === 'string' ? body.level : '').trim();
  const content = (typeof body.body === 'string' ? body.body : '').trim();
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

  // If a class is chosen, verify it belongs to this teacher.
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

  const { data, error } = await supabase
    .from('teacher_lessons')
    .insert({
      teacher_id: auth.userId,
      title,
      summary: summary || null,
      level: level || null,
      body: content || null,
      class_id,
    })
    .select('id, title, summary, level, body, class_id, created_at')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Kayıt başarısız.' } });
  }

  return respond(200, { ok: true, lesson: data });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  let body: { id?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const id = typeof body.id === 'string' ? body.id.trim() : '';
  if (!id) {
    return respond(400, { ok: false, error: { message: 'Geçersiz kayıt.' } });
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

  // RLS `teacher_lessons_delete` scopes the delete to rows this teacher owns.
  const { error } = await supabase
    .from('teacher_lessons')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.userId);

  if (error) {
    return respond(500, { ok: false, error: { message: error.message } });
  }
  return respond(200, { ok: true });
};