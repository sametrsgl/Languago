import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { aiJson, aiReady } from '../../../lib/ai';
import { LEVELS, COUNTS, systemPrompt, userPrompt, checkDraft, blindPrompt, applyBlind } from '../../../lib/material-check.mjs';

export const prerender = false;

/**
 * POST { level, topic, count, focus }: teachers only. The AI drafts a lesson,
 * the server checks it (shape, lengths, four distinct options, one blank) and
 * a second blind pass drops items whose key it disagrees with. The result is
 * saved for the teacher and opened as slides or a worksheet.
 */
export const POST: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 2000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (u.role !== 'teacher' && u.role !== 'admin') return json(403, { ok: false, error: 'Bu araç öğretmen hesapları içindir.' });
  const level = LEVELS.includes(b.level) ? b.level : null;
  const topic = typeof b.topic === 'string' ? b.topic.trim().replace(/\s+/g, ' ').slice(0, 120) : '';
  const count = COUNTS.includes(Number(b.count)) ? Number(b.count) : 8;
  const focus = typeof b.focus === 'string' ? b.focus.trim().replace(/\s+/g, ' ').slice(0, 200) : '';
  if (!level || topic.length < 3) return json(400, { ok: false, error: 'Seviye ve konu seçin.' });
  if (!aiReady()) return json(503, { ok: false, error: 'Yapay zekâ şu anda ayarlı değil.' });

  // quick limit check before spending AI time (the database enforces it too)
  const since = new Date(Date.now() - 86_400_000).toISOString();
  const { count: made } = await u.sb.from('teacher_materials').select('id', { count: 'exact', head: true }).eq('teacher_id', u.userId).gte('created_at', since);
  if ((made || 0) >= 20) return json(429, { ok: false, error: 'Bugün 20 materyal ürettiniz. Yarın tekrar deneyebilirsiniz.' });

  const messages = [{ role: 'system' as const, content: systemPrompt() }, { role: 'user' as const, content: userPrompt({ level, topic, count, focus }) }];
  let res: any = null;
  for (let attempt = 0; attempt < 2 && !res?.ok; attempt++) {
    const raw = await aiJson(messages, { maxTokens: 4000, timeoutMs: 120_000 });
    res = checkDraft(raw, { level, count });
    if (!res.ok) console.warn('[materials] draft rejected:', res.why);
  }
  if (!res?.ok) return json(502, { ok: false, error: 'Taslak kontrolden geçemedi. Lütfen tekrar deneyin ya da konuyu biraz değiştirin.' });

  const blind = await aiJson([{ role: 'user', content: blindPrompt(res.day) }], { maxTokens: 300, timeoutMs: 60_000 });
  const { day, dropped } = applyBlind(res.day, blind);
  if (day.grammar.questions.length < 4 || day.reading.questions.length < 3) return json(502, { ok: false, error: 'Soruların bir kısmı kontrolden geçemedi. Lütfen tekrar deneyin.' });

  const { data: id, error } = await u.sb.rpc('save_teacher_material', {
    p_level: level, p_title: res.title, p_request: { topic, count, focus }, p_data: { day, topic: res.topic },
  });
  if (error) {
    const msg = error.message.includes('too_many') ? 'Bugün 20 materyal ürettiniz. Yarın tekrar deneyebilirsiniz.' : 'Materyal kaydedilemedi.';
    return json(error.message.includes('too_many') ? 429 : 500, { ok: false, error: msg });
  }
  return json(200, { ok: true, id, title: res.title, dropped });
};
