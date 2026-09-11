import type { APIRoute } from 'astro';
import { WORD_DATA } from '../../../data/words.js';
import { createVocabularyDiagnostic, recordsFromWordData, scoreVocabularyDiagnostic } from '../../../lib/vocab-path.mjs';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
const questions = createVocabularyDiagnostic(recordsFromWordData(WORD_DATA));

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > 16_384) return json({ error: 'İstek gövdesi çok büyük.' }, 413);
  let body: any;
  try { body = JSON.parse(raw); } catch { return json({ error: 'Geçersiz istek.' }, 400); }
  const answers = Array.isArray(body?.answers) ? body.answers : [];
  if (answers.length !== questions.length) return json({ error: 'Test tamamlanmadı.' }, 400);
  if (answers.some((answer: unknown) => !Number.isInteger(answer) || Number(answer) < 0 || Number(answer) > 3)) {
    return json({ error: 'Cevaplar geçersiz.' }, 400);
  }

  const result = scoreVocabularyDiagnostic(questions, answers);
  const payload = {
    version: 1,
    status: 'diagnosed',
    level: result.level,
    confidence: result.confidence,
    questionsAnswered: result.questionsAnswered,
    stats: result.stats,
    completedAt: new Date().toISOString(),
  };
  const progress = await supabase.from('student_progress').upsert(
    { student_id: authData.user.id, module: 'vocab-path', payload },
    { onConflict: 'student_id,module' },
  );
  const profile = await supabase.from('profiles').update({ level: result.level }).eq('id', authData.user.id);
  if (progress.error || profile.error) return json({ error: 'Seviye sonucu kaydedilemedi.' }, 500);
  return json({ ok: true, ...result }, 200);
};

export const GET: APIRoute = () => json({ total: questions.length, levels: Array.from(LEVELS) }, 200);

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json' } });
}
