import type { APIRoute } from 'astro';
import { isCorrect } from '../../../lib/level-test-bank';

export const prerender = false;

/** Is this choice right? The adaptive test needs it after every answer. */
export const POST: APIRoute = async ({ request }) => {
  let body: any = {};
  try { body = JSON.parse((await request.text()).slice(0, 512)); } catch { /* falls through */ }
  const correct = isCorrect(String(body.id || ''), Number(body.choice));
  if (correct === null) return new Response(JSON.stringify({ ok: false }), { status: 404, headers: { 'Content-Type': 'application/json' } });
  return new Response(JSON.stringify({ ok: true, correct }), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
};
