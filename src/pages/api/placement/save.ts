import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { assessmentQuestions } from '../../../lib/assessment-pool';
import { placementResult, replayPlacementAnswers } from '../../../lib/placement-test.mjs';

const MAX_BODY_BYTES = 16_384;

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

  const { data: authData, error: authError } = await supabase.auth.getUser();
  const user = authData.user;
  if (authError || !user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const requestedName = typeof body?.learnerName === 'string' ? body.learnerName.trim().slice(0, 120) : '';
  const requestedGoal = ['general', 'ielts', 'toefl', 'yds', 'other'].includes(body?.goal) ? body.goal : 'general';
  const state = replayPlacementAnswers(body?.answers, assessmentQuestions);
  state.learnerName = requestedName;
  state.goal = requestedGoal;
  const result = placementResult(state);
  if (!state.completed) return json({ error: 'Seviye testini tamamlaman gerekiyor.' }, 400);

  const payload = {
    version: 2,
    learnerName: result.learnerName,
    goal: result.goal,
    goalLabel: result.goalLabel,
    level: result.level,
    confidence: result.confidence,
    accuracy: result.accuracy,
    estimatedScore: result.estimatedScore,
    scoreLabel: result.scoreLabel,
    questionsAnswered: result.questionsAnswered,
    completedAt: new Date().toISOString(),
    answers: state.questions,
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
