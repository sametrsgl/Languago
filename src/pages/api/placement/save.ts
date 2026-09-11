import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import pool from '../../../data/placement-question-pool.json';
import { createPlacementState, placementResult, recordPlacementAnswer } from '../../../lib/placement-test.mjs';

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

  const answers = Array.isArray(body?.answers) ? body.answers.slice(0, MAX_ANSWERS) : [];

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const questionById = new Map((pool.questions || []).map((question) => [question.id, question]));
  let state = createPlacementState();
  const cleanAnswers = [];
  for (const row of answers) {
    if (typeof row?.id !== 'string' || !Number.isInteger(row?.selectedIndex)) continue;
    const question = questionById.get(row.id);
    if (!question || !LEVELS.has(String(question.level).toUpperCase())) continue;
    if (row.selectedIndex < 0 || row.selectedIndex >= question.options.length) continue;
    const correct = row.selectedIndex === question.answer;
    state = recordPlacementAnswer(state, question, correct, row.selectedIndex);
    cleanAnswers.push({
      id: question.id,
      level: question.level,
      source: question.source || 'grammar',
      selectedIndex: row.selectedIndex,
      correct,
    });
  }
  const result = placementResult(state);
  if (!cleanAnswers.length) return json({ error: 'Seviye sonucu geçersiz.' }, 400);

  const payload = {
    version: 1,
    level: result.level,
    confidence: result.confidence,
    questionsAnswered: cleanAnswers.length,
    completedAt: new Date().toISOString(),
    answers: cleanAnswers,
  };

  const [progressResult, profileResult] = await Promise.all([
    supabase.from('student_progress').upsert(
      { student_id: user.id, module: 'placement-test', payload },
      { onConflict: 'student_id,module' },
    ),
    supabase.from('profiles').update({ level: result.level }).eq('id', user.id),
  ]);

  if (progressResult.error || profileResult.error) {
    return json({ error: 'Seviye sonucu kaydedilemedi.' }, 500);
  }
  return json({ ok: true, level: payload.level, confidence: payload.confidence }, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
