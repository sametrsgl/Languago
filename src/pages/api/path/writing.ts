import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { getDay, todaysDay } from '../../../lib/path-content';
import { scoreWriting } from '../../../lib/ai';
import { countWords, PASS } from '../../../lib/path.mjs';
import { recordMistakes } from '../../../lib/mistakes';

export const prerender = false;

/** Today's writing task: AI marks it (85 to pass) and explains the mistakes. */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 8000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const text = String(body.text || '').trim().slice(0, 3000);
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
  const n = countWords(text);
  if (n < Math.ceil(d.writing.min * 0.8)) return json(200, { ok: true, tooShort: true, words: n, min: d.writing.min, score: 0, passed: false });

  const fb = !aiAllowed ? null : await scoreWriting({ level: d.level, prompt: d.writing.prompt, focus: d.writing.focus, min: d.writing.min, text });
  // Without AI the text is accepted (the teacher can read it); the day is not blocked.
  const score = fb ? fb.score : PASS;
  const result = { ok: true, score, passed: score >= PASS, feedback: fb, aiMissing: !fb, model: d.writing.model, words: n };
  if (demo) return json(200, { ...result, xp: result.passed ? 25 : 0 });
  const { data, error } = await u.sb.rpc('submit_mission_task', { p_task: 'writing', p_score: score, p_payload: { text, feedback: fb, aiMissing: !fb } });
  if (error) return json(400, { ok: false, error: /not_open_yet/.test(error.message) ? 'Yeni görev yarın açılacak.' : 'Kaydedilemedi.' });
  // the AI's corrections go to the mistakes notebook
  if (fb?.corrections?.length) await recordMistakes(u.sb, fb.corrections.map((c: any) => ({ source: 'writing' as const, level: d.level, wrong: c.wrong, right: c.right, why: c.why })));
  return json(200, { ...result, xp: data?.xp ?? 0, dayDone: !!data?.day_done });
};
