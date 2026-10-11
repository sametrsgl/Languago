import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { getVocab, loadPathState } from '../../../lib/path-content';
import { vocabMastery, VOCAB_LEVEL_UP } from '../../../lib/path.mjs';

export const prerender = false;

/** End of today's vocabulary session: XP once a day, level up at 85 % mastered. */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 500)); } catch { return json(400, { ok: false }); }
  if (import.meta.env.DEV && body.demo) return json(200, { ok: true, xp: 30, level: 'A1', levelUp: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const st = await loadPathState(u.sb, u.userId);
  if (!st) return json(500, { ok: false });
  const list = await getVocab(st.vocab_level);
  const { data: cards } = await u.sb.from('vocab_cards').select('word_id, box').eq('student_id', u.userId).eq('level', st.vocab_level);
  const levelUp = list.length > 0 && vocabMastery(list, cards || []) >= VOCAB_LEVEL_UP;
  const { data, error } = await u.sb.rpc('finish_vocab_day', { p_listen_score: Number(body.listenScore) || 0, p_cards: Number(body.cards) || 0, p_level_up: levelUp });
  if (error) return json(400, { ok: false });
  return json(200, { ok: true, xp: data?.xp ?? 0, level: data?.level ?? st.vocab_level, levelUp });
};
