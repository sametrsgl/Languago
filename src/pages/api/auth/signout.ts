import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

/**
 * POST /api/auth/signout
 * Standalone JSON endpoint. Signs the current user out and clears the Supabase
 * auth cookies — both by calling signOut() and by explicitly deleting every
 * `sb-*` auth cookie on the response via Astro's `cookies.delete` AND a manual
 * `Set-Cookie` header (belt-and-braces, so the browser reliably ends up with no
 * session cookie even when signOut()'s own setAll is not emitted reliably).
 *
 * Success: { "ok": true }   → client redirects to /
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Best-effort: even if signOut throws, we still clear cookies explicitly
      // below; report ok so the browser navigates away.
    }
  }

  // Collect every `sb-*` auth cookie name that was sent with this request.
  const cookieNames: string[] = [];
  for (const part of (request.headers.get('cookie') ?? '').split(';')) {
    const name = (part.split('=')[0] ?? '').trim();
    if (name.startsWith('sb-')) cookieNames.push(name);
  }

  // 1) Clear through Astro's cookie API (emits Set-Cookie on the response).
  for (const name of cookieNames) {
    cookies.delete(name, { path: '/' });
  }

  // 2) Explicit, framework-independent Set-Cookie clearing header(s). Fall back
  //    to a deterministic name derived from the Supabase project ref if no
  //    cookie was actually present but we know the project.
  if (cookieNames.length === 0) {
    const derived = deriveAuthCookieName();
    if (derived) cookieNames.push(derived);
  }

  const headers = new Headers();
  for (const name of cookieNames) {
    headers.append(
      'Set-Cookie',
      `${name}=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax; Secure`,
    );
  }
  headers.set('Content-Type', 'application/json');

  return new Response(JSON.stringify({ ok: true }), { status: 200, headers });
};

/**
 * Derive the Supabase auth-cookie name (`sb-<project-ref>-auth-token`) from the
 * configured SUPABASE_URL hostname. Returns null when the env is missing or the
 * host does not look like a Supabase project.
 */
function deriveAuthCookieName(): string | null {
  const url = import.meta.env.SUPABASE_URL as string | undefined;
  if (!url) return null;
  try {
    const ref = new URL(url).hostname.split('.')[0];
    return ref ? `sb-${ref}-auth-token` : null;
  } catch {
    return null;
  }
}