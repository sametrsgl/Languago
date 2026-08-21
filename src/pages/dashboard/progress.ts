import type { APIRoute } from 'astro';
import { saveProgress } from '../../lib/auth';
import { pageCookieSource } from '../../lib/supabase';

/**
 * Best-effort student progress persistence.
 * POST /dashboard/progress  body: { module: 'vocab' | 'grammar' | 'reading'
 *                                    | 'game', payload: { ...any } }
 * Result is written into `student_progress` (unique per student+module).
 * Everything degrades gracefully: if Supabase is not configured or the
 * session is missing we still return a well-formed JSON response — the
 * client treats a non-ok result as silent (offline) progress.
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: 'invalid_json' });
  }

  const module = String(body.module ?? '');
  const payload = body.payload && typeof body.payload === 'object' ? body.payload : {};

  if (
    module !== 'vocab' &&
    module !== 'grammar' &&
    module !== 'reading' &&
    module !== 'game'
  ) {
    return respond(400, { ok: false, error: 'invalid_module' });
  }

  const result = await saveProgress(
    pageCookieSource({ request, cookies }),
    module,
    payload
  );
  if (!result.ok && result.error === 'unauthenticated') {
    return respond(401, result);
  }
  return respond(result.ok ? 200 : 500, result);
};