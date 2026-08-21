import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

/**
 * POST /api/auth/signout
 * Standalone JSON endpoint. Signs the current user out and clears auth
 * cookies via the SSR client, then returns clean JSON.
 *
 * Success: { "ok": true }   → client redirects to /signin
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort: even if signOut throws, we clear cookies below via the
      // client's setAll path; report ok so the browser navigates away.
    }
  }
  return json({ ok: true }, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}