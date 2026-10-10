import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { saveLevelTest, scoreTest } from '../../../lib/level-test-bank';

export const prerender = false;

const json = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

/**
 * Score a finished test on the server. Signed-in learners get it saved;
 * visitors get the result and the page keeps the answers to save at sign-up.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const raw = await request.text();
  if (raw.length > 16_384) return json(413, { ok: false, error: 'İstek çok büyük.' });
  let body: any;
  try { body = JSON.parse(raw); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const scored = scoreTest(body.answers, Number(body.selfReport) || 0);
  if (!scored) return json(400, { ok: false, error: 'Test tamamlanmadı.' });
  let saved = false;
  const sb = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (sb) {
    const { data } = await sb.auth.getUser();
    if (data.user) saved = await saveLevelTest(sb, data.user.id, scored, String(body.goal || 'general'));
  }
  return json(200, { ok: true, saved, result: scored.result });
};
