import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;

const ERR: Record<string, string> = {
  bad_code: 'Bu kod geçersiz ya da süresi dolmuş. Çocuğunuzdan yeni bir kod isteyin.',
  not_parent: 'Bu işlem veli hesapları içindir.',
};

/**
 * POST /api/family/code    (student) -> { code }  a 7-day parent code
 * POST /api/family/link    (parent)  { code } -> { childName }
 * POST /api/family/unlink  (either)  { otherId }
 */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 500)); } catch { /* empty */ }
  if (ctx.params.action === 'code') {
    const { data, error } = await u.sb.rpc('make_parent_code');
    return error ? json(400, { ok: false, error: 'Kod oluşturulamadı.' }) : json(200, { ok: true, code: data });
  }
  if (ctx.params.action === 'link') {
    const { data, error } = await u.sb.rpc('link_child', { p_code: String(body.code || '').slice(0, 12) });
    if (error) { const k = Object.keys(ERR).find((x) => error.message.includes(x)); return json(400, { ok: false, error: k ? ERR[k] : 'Bağlanamadı.' }); }
    return json(200, { ok: true, childName: data });
  }
  if (ctx.params.action === 'unlink') {
    const other = String(body.otherId || '');
    if (!/^[0-9a-f-]{36}$/i.test(other)) return json(400, { ok: false }); // goes into a filter: ids only
    const { error } = await u.sb.from('family_links').delete().or(`and(parent_id.eq.${u.userId},child_id.eq.${other}),and(child_id.eq.${u.userId},parent_id.eq.${other})`);
    return json(error ? 400 : 200, { ok: !error });
  }
  return json(404, { ok: false });
};
