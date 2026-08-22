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
 * POST /api/teacher/content-quizzes
 * Create a custom teacher quiz. Questions are added separately via
 * content-questions.ts.
 *
 * Role validated server-side from profiles.role. RLS `teacher_quizzes`
 * policies enforce teacher_id = auth.uid() on insert and scope reads/deletes
 * to the caller's own rows.
 *
 * Request:  { "title", "description"?, "level"?, "class_id"? }
 * Success:  { "ok": true, "quiz": {...} }
 *
 * DELETE /api/teacher/content-quizzes  body { "id" }
 * Delete one of the teacher's own quizzes (and its questions).
 * Success:  { "ok": true }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: {
    title?: string;
    description?: string;
    level?: string;
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

  const description = (typeof body.description === 'string' ? body.description : '').trim();
  const level = (typeof body.level === 'string' ? body.level : '').trim();
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
    .from('teacher_quizzes')
    .insert({
      teacher_id: auth.userId,
      title,
      description: description || null,
      level: level || null,
      class_id,
    })
    .select('id, title, description, level, class_id, created_at')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Kayıt başarısız.' } });
  }

  return respond(200, { ok: true, quiz: data });
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

  // Verify the quiz belongs to this teacher before touching its questions.
  const { data: owned } = await supabase
    .from('teacher_quizzes')
    .select('id')
    .eq('id', id)
    .eq('teacher_id', auth.userId)
    .maybeSingle();
  if (!owned) {
    return respond(400, { ok: false, error: { message: 'Quiz bulunamadı.' } });
  }

  // Remove the quiz's questions first (FK-safe), then the quiz row.
  await supabase.from('teacher_quiz_questions').delete().eq('quiz_id', id);

  const { error } = await supabase
    .from('teacher_quizzes')
    .delete()
    .eq('id', id)
    .eq('teacher_id', auth.userId);

  if (error) {
    return respond(500, { ok: false, error: { message: error.message } });
  }
  return respond(200, { ok: true });
};