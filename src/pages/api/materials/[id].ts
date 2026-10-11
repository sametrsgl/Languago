import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;

/** DELETE: remove one of the teacher's own AI materials. */
export const DELETE: APIRoute = async (ctx) => {
  const id = String(ctx.params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { error } = await u.sb.from('teacher_materials').delete().eq('id', id).eq('teacher_id', u.userId);
  return json(error ? 400 : 200, { ok: !error });
};
