import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { getDay, todaysDay } from '../../../lib/path-content';
import { scoreSpokenAnswer } from '../../../lib/ai';
import { countWords, readAloudScore, PASS } from '../../../lib/path.mjs';

export const prerender = false;

/**
 * Today's speaking task. The browser turns speech into text (free); here we
 * score the read-aloud sentences against the text and let AI judge the answer.
 * Score = half read-aloud, half answer.
 */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 8000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const demo = import.meta.env.DEV && body.demo;
  let u: any = null;
  let d;
  let aiAllowed = true; // KVKK: AI only with the learner's consent (consents table)
  if (demo) d = await getDay(String(body.level || 'A1'), Number(body.day) || 1);
  else {
    u = await apiUser(ctx);
    if (u instanceof Response) return u;
    d = (await todaysDay(u.sb, u.userId)).day;
    const { data: c } = await u.sb.from('consents').select('ai_feedback').eq('user_id', u.userId).maybeSingle();
    aiAllowed = !!c?.ai_feedback;
  }
  if (!d) return json(404, { ok: false, error: 'Bu günün içeriği henüz hazır değil.' });
  const said: string[] = (Array.isArray(body.read) ? body.read : []).slice(0, d.speaking.read.length).map((s: unknown) => String(s || '').slice(0, 400));
  const readScores = d.speaking.read.map((t, i) => readAloudScore(t, said[i] || ''));
  const readAvg = Math.round(readScores.reduce((a, b) => a + b, 0) / Math.max(1, readScores.length));
  const answer = String(body.answer || '').slice(0, 1500);
  const words = countWords(answer);
  const minWords = d.speaking.ask.min_words;
  let ans = words < 3
    ? { score: 0, feedback: 'Cevabınız duyulamadı ya da çok kısa. Tekrar deneyin.', better: '' }
    : !aiAllowed ? null : await scoreSpokenAnswer({ level: d.level, question: d.speaking.ask.q, transcript: answer, minWords });
  const aiMissing = !ans;
  if (!ans) ans = { score: Math.min(PASS, Math.round((words / minWords) * PASS)), feedback: '', better: '' };
  if (words < minWords) ans.score = Math.min(ans.score, 80);
  const score = Math.round((readAvg + ans.score) / 2);
  const result = { ok: true, score, passed: score >= PASS, readScores, answerScore: ans.score, feedback: ans.feedback, better: ans.better, aiMissing, words, minWords };
  if (demo) return json(200, { ...result, xp: result.passed ? 25 : 0 });
  const { data, error } = await u.sb.rpc('submit_mission_task', { p_task: 'speaking', p_score: score, p_payload: { read: said, answer, readScores, answerScore: ans.score } });
  if (error) return json(400, { ok: false, error: /not_open_yet/.test(error.message) ? 'Yeni görev yarın açılacak.' : 'Kaydedilemedi.' });
  return json(200, { ...result, xp: data?.xp ?? 0, dayDone: !!data?.day_done });
};
