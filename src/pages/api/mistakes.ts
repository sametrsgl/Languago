import type { APIRoute } from 'astro';
import { apiUser, json } from '../../lib/lessons-server';

export const prerender = false;

/** POST { id, ok }: one review of a note in the student's mistakes notebook. */
export const POST: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 300)); } catch { return json(400, { ok: false }); }
  const id = Number(b.id);
  if (!Number.isSafeInteger(id) || id <= 0 || typeof b.ok !== 'boolean') return json(400, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { data, error } = await u.sb.rpc('review_mistake', { p_id: id, p_ok: b.ok });
  if (error) return json(400, { ok: false });
  return json(200, { ok: true, next: data, learned: data === null });
};
