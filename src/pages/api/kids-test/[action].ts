import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { publicKids, kidCorrect, scoreKids, saveKids } from '../../../lib/kids-test';

export const prerender = false;
const json = (status: number, body: unknown, cache = 'no-store') =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': cache } });

/** Kids' level test: GET bank, POST check { id, choice }, POST finish { answers, age }. */
export const GET: APIRoute = ({ params }) =>
  params.action === 'bank' ? json(200, publicKids(), 'public, max-age=3600') : json(404, { ok: false });

export const POST: APIRoute = async ({ params, request, cookies }) => {
  let body: any = {};
  try { body = JSON.parse((await request.text()).slice(0, 12000)); } catch { return json(400, { ok: false }); }
  if (params.action === 'check') {
    const c = kidCorrect(String(body.id || ''), Number(body.choice));
    return c === null ? json(404, { ok: false }) : json(200, { ok: true, correct: c });
  }
  if (params.action === 'finish') {
    const scored = scoreKids(body.answers, Number(body.age) || 10, { skipListening: body.skipListening === true });
    if (!scored) return json(400, { ok: false, error: 'Test tamamlanmadı.' });
    let saved = false;
    const sb = createSupabaseClient(pageCookieSource({ request, cookies }));
    if (sb) { const { data } = await sb.auth.getUser(); if (data.user) saved = await saveKids(sb, data.user.id, scored); }
    return json(200, { ok: true, saved, result: scored.result });
  }
  return json(404, { ok: false });
};
