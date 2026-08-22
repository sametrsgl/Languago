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
 * POST /api/teacher/content-questions
 * Add a question to a quiz owned by the signed-in teacher.
 *
 * Role validated server-side from profiles.role. RLS `teacher_quiz_questions`
 * insert policy scopes quiz_id to quizzes owned by auth.uid(). We also verify
 * ownership explicitly before computing the next `position`.
 *
 * Request:
 *  { "quiz_id", "prompt", "options": ["..","..","..",".."], "answer_index": 0..3, "explain"? }
 * Success:
 *  { "ok": true, "question": {...}, "position": N }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: {
    quiz_id?: string;
    prompt?: string;
    options?: unknown;
    answer_index?: unknown;
    explain?: string;
  } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const quiz_id = typeof body.quiz_id === 'string' ? body.quiz_id.trim() : '';
  if (!quiz_id) {
    return respond(400, { ok: false, error: { fields: { quiz_id: ['Quiz gerekli.'] } } });
  }

  const prompt = (typeof body.prompt === 'string' ? body.prompt : '').trim();
  if (!prompt) {
    return respond(400, { ok: false, error: { fields: { prompt: ['Soru gerekli.'] } } });
  }

  const explain = typeof body.explain === 'string' ? body.explain.trim() : '';

  const options: string[] = Array.isArray(body.options)
    ? body.options.map((o) => (typeof o === 'string' ? o.trim() : '')).filter(Boolean)
    : [];
  if (options.length !== 4) {
    return respond(400, {
      ok: false,
      error: { fields: { options: ['Tam olarak 4 seçenek gir.'] } },
    });
  }

  const answer_index = Number(body.answer_index);
  if (!Number.isInteger(answer_index) || answer_index < 0 || answer_index > 3) {
    return respond(400, {
      ok: false,
      error: { fields: { answer_index: ['Doğru cevabı seç.'] } },
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

  // Verify the quiz belongs to this teacher (RLS would also block a foreign
  // insert, but we need the count for position anyway).
  const { data: quiz } = await supabase
    .from('teacher_quizzes')
    .select('id')
    .eq('id', quiz_id)
    .eq('teacher_id', auth.userId)
    .maybeSingle();
  if (!quiz) {
    return respond(400, {
      ok: false,
      error: { fields: { quiz_id: ['Quiz bulunamadı.'] } },
    });
  }

  const nextPosition =
    (
      await supabase
        .from('teacher_quiz_questions')
        .select('position')
        .eq('quiz_id', quiz_id)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle()
    ).data?.position ?? -1;

  const { data, error } = await supabase
    .from('teacher_quiz_questions')
    .insert({
      quiz_id,
      prompt,
      options,
      answer_index,
      explain: explain || null,
      position: (Number(nextPosition) || 0) + 1,
    })
    .select('id, quiz_id, prompt, options, answer_index, explain, position')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Kayıt başarısız.' } });
  }

  return respond(200, { ok: true, question: data, position: data.position });
};