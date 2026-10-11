import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;

/** One flashcard rating: learned / repeat / unsure / not_learned. */
export const POST: APIRoute = async (ctx) => {
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 500)); } catch { return json(400, { ok: false }); }
  if (import.meta.env.DEV && body.demo) return json(200, { ok: true });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { error } = await u.sb.rpc('rate_word', { p_word: String(body.wordId || ''), p_level: String(body.level || ''), p_rating: String(body.rating || '') });
  return json(error ? 400 : 200, { ok: !error });
};
