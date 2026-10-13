import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { getDay, todaysDay, scoreTask, taskKey } from '../../../lib/path-content';
import { recordMistakes, grammarMistakes } from '../../../lib/mistakes';

export const prerender = false;

const saveError = (m: string) => (/not_open_yet/.test(m) ? 'Yeni görev yarın açılacak.' : 'Kaydedilemedi.');

/** Grammar, reading or listening answers for today's mission, scored here. */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 4000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const task = body.task;
  if (!['grammar', 'reading', 'listening'].includes(task)) return json(400, { ok: false, error: 'Geçersiz görev.' });
  const choices = (Array.isArray(body.choices) ? body.choices : []).slice(0, 30).map((c: unknown) => (Number.isInteger(c) ? (c as number) : -1));

  if (import.meta.env.DEV && body.demo) {
    const d = await getDay(String(body.level || 'A1'), Number(body.day) || 1);
    if (!d) return json(404, { ok: false, error: 'İçerik yok.' });
    const r = scoreTask(d, task, choices);
    return json(200, { ok: true, ...r, xp: r.passed ? 20 : 0, dayDone: false });
  }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { day: d } = await todaysDay(u.sb, u.userId);
  if (!d) return json(404, { ok: false, error: 'Bu günün içeriği henüz hazır değil.' });
  const r = scoreTask(d, task, choices);
  const { data, error } = await u.sb.rpc('submit_mission_task', { p_task: task, p_score: r.score, p_payload: { choices, correct: r.correct } });
  if (error) return json(400, { ok: false, error: saveError(error.message) });
  // wrong grammar answers go to the mistakes notebook (reading/listening need their text, so they stay out)
  if (task === 'grammar') await recordMistakes(u.sb, grammarMistakes(d, r.review, taskKey(d.level, d.day, 'grammar')));
  return json(200, { ok: true, ...r, xp: data?.xp ?? 0, dayDone: !!data?.day_done });
};
