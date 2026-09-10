import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

/**
 * GET /api/auth/callback
 *
 * Supabase OAuth (Google) landing route. The provider redirects back here
 * with `?code=...`; we exchange the code for a session — the @supabase/ssr
 * client reads the PKCE verifier cookie set by /api/auth/oauth/[provider]
 * and writes the sb-* session cookies — then bounce the user into the app.
 *
 * Google buttons across the site point at /api/auth/oauth/google, which
 * starts the flow and sends redirect_to=<site>/api/auth/callback.
 */
export const prerender = false;

const SAFE_NEXT_RE = /^\/[a-zA-Z0-9\-_./]*$/;

export const GET: APIRoute = async ({ request, url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const nextParam = url.searchParams.get('next') ?? url.searchParams.get('redirectTo');
  const next =
    nextParam && SAFE_NEXT_RE.test(nextParam) && !nextParam.startsWith('//')
      ? nextParam
      : '/dashboard';

  if (!code) {
    // No code → nothing to exchange (e.g. OAuth error/deny). Send back to
    // signin with a friendly flag instead of stranding the user.
    return redirect('/signin?oauth=error', 302);
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return redirect('/signin?oauth=unconfigured', 302);
  }

  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return redirect('/signin?oauth=error', 302);
    }
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return redirect('/signin?oauth=error', 302);
    }
    return redirect(next, 302);
  } catch {
    return redirect('/signin?oauth=error', 302);
  }
};
