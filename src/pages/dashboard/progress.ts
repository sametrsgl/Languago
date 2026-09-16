import type { APIRoute } from 'astro';
import { saveProgress } from '../../lib/auth';
import { pageCookieSource } from '../../lib/supabase';
import { readJsonBody, RequestBodyError } from '../../lib/request-body';

/**
 * Best-effort student progress persistence.
 * POST /dashboard/progress body: { module, payload }.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  let body: Record<string, unknown>;
  try {
    const parsed = await readJsonBody<unknown>(request, 32_768);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return respond(400, { ok: false, error: 'invalid_body' });
    body = parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof RequestBodyError) return respond(error.status, { ok: false, error: error.status === 413 ? 'body_too_large' : 'invalid_json' });
    return respond(400, { ok: false, error: 'invalid_json' });
  }

  const module = String(body.module ?? '');
  const payload = body.payload && typeof body.payload === 'object'
    ? body.payload as Record<string, unknown>
    : {};
  const allowed = new Set(['vocab', 'grammar', 'reading', 'game', 'vocab-path']);
  if (!allowed.has(module)) return respond(400, { ok: false, error: 'invalid_module' });

  const result = await saveProgress(pageCookieSource({ request, cookies }), module, payload);
  if (!result.ok && result.error === 'unauthenticated') return respond(401, result);
  return respond(result.ok ? 200 : 500, result);
};
