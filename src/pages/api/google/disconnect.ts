import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { revoke } from '../../../lib/google';

export const prerender = false;

/** Teacher disconnects Google: the token is revoked at Google and deleted here. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { data } = await u.sb.from('google_links').select('token_enc').eq('teacher_id', u.userId).maybeSingle();
  if (data?.token_enc) await revoke(data.token_enc);
  await u.sb.from('google_links').delete().eq('teacher_id', u.userId);
  return json(200, { ok: true });
};
