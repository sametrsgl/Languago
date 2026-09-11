import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const MAX_BODY_BYTES = 16_384;
const MAX_ANSWERS = 40;

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'İstek gövdesi çok büyük.' }, 413);
  }

  let body: any;
  try {
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Geçersiz istek.' }, 400);
  }

  const level = typeof body?.level === 'string' ? body.level.toUpperCase() : '';
  const confidence = Number(body?.confidence);
  const answers = Array.isArray(body?.answers) ? body.answers.slice(0, MAX_ANSWERS) : [];
  if (!LEVELS.has(level) || !Number.isFinite(confidence) || confidence < 0 || confidence > 1) {
    return json({ error: 'Seviye sonucu geçersiz.' }, 400);
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const cleanAnswers = answers
    .filter((row: any) => typeof row?.id === 'string' && LEVELS.has(String(row.level).toUpperCase()))
    .map((row: any) => ({
      id: row.id.slice(0, 100),
      level: String(row.level).toUpperCase(),
      correct: Boolean(row.correct),
      source: typeof row.source === 'string' ? row.source.slice(0, 30) : 'grammar',
    }));

  const payload = {
    version: 1,
    level,
    confidence: Math.round(confidence * 100) / 100,
    questionsAnswered: cleanAnswers.length,
    completedAt: new Date().toISOString(),
    answers: cleanAnswers,
  };

  const [progressResult, profileResult] = await Promise.all([
    supabase.from('student_progress').upsert(
      { student_id: user.id, module: 'placement-test', payload },
      { onConflict: 'student_id,module' },
    ),
    supabase.from('profiles').update({ level }).eq('id', user.id),
  ]);

  if (progressResult.error || profileResult.error) {
    return json({ error: 'Seviye sonucu kaydedilemedi.' }, 500);
  }
  return json({ ok: true, level, confidence: payload.confidence }, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
