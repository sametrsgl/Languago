import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;

const texts = (a: unknown) => (Array.isArray(a) ? a.slice(0, 40).map((x) => (typeof x === 'string' ? x.slice(0, 300) : null)) : []);

/** POST { g: [...], r: [...], writing }: a student hands in an assignment once; the database scores it. */
export const POST: APIRoute = async (ctx) => {
  const id = String(ctx.params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { ok: false });
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 16000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const writing = typeof b.writing === 'string' ? b.writing.trim().slice(0, 4000) : '';
  const { data, error } = await u.sb.rpc('submit_assignment', { p_id: id, p_answers: { g: texts(b.g), r: texts(b.r) }, p_writing: writing });
  if (error) {
    const done = error.message.includes('already_submitted');
    return json(done ? 409 : 400, { ok: false, error: done ? 'Bu ödevi zaten teslim ettiniz.' : 'Ödev teslim edilemedi.' });
  }
  return json(200, { ok: true, ...data });
};
