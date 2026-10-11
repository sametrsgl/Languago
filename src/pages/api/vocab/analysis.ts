import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { getVocab } from '../../../lib/path-content';
import { nextBatch, plan, scoreAnswers, testVocabLevel, ANALYSIS_TARGET, ANALYSIS_UNLOCK, type Check } from '../../../lib/vocab-analysis';

export const prerender = false;

async function state(sb: any, userId: string) {
  const { data } = await sb.from('vocab_checks').select('word_id, level, known, checked_at').eq('student_id', userId).order('checked_at');
  return (data || []) as Check[];
}

/** The highest level up to `want` that already has vocabulary cards (so nobody lands on an empty level). */
async function withCards(want: string) {
  const order = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  for (let i = order.indexOf(want); i > 0; i--) if ((await getVocab(order[i])).length) return order[i];
  return 'A1';
}

/** GET: how far the analysis is, plus the next batch of questions. */
export const GET: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const checks = await state(u.sb, u.userId);
  const done = checks.length >= ANALYSIS_TARGET;
  return json(200, { ok: true, count: checks.length, unlock: ANALYSIS_UNLOCK, target: ANALYSIS_TARGET,
    questions: done ? [] : nextBatch(checks, await testVocabLevel(u.sb, u.userId)) });
};

/** POST { answers: [{ id, choice }] }: save a batch, set the vocabulary level, send the next batch. */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 8000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const items = scoreAnswers(body.answers);
  if (!items.length) return json(400, { ok: false });
  const before = await state(u.sb, u.userId);
  const asked = new Set(before.map((c) => c.word_id));
  const checks = [...before.filter((c) => !items.some((i) => i.id === c.word_id)), ...items.map((i) => ({ word_id: i.id, level: i.level, known: i.known }))];
  const testLevel = await testVocabLevel(u.sb, u.userId);
  const { vocabLevel } = plan(checks, testLevel);
  // the level is set once the path opens, and refined after that
  const setLevel = checks.length >= ANALYSIS_UNLOCK ? await withCards(vocabLevel) : null;
  const { data, error } = await u.sb.rpc('record_vocab_checks', { p_items: items, p_vocab_level: setLevel });
  if (error) return json(400, { ok: false });
  const count = Number(data) || checks.length;
  const known = items.filter((i) => i.known).length;
  return json(200, { ok: true, count, known, fresh: items.filter((i) => !asked.has(i.id)).length, level: setLevel,
    questions: count >= ANALYSIS_TARGET ? [] : nextBatch(checks, testLevel) });
};
