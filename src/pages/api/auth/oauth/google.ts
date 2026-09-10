import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../../lib/supabase';

/**
 * GET /api/auth/oauth/google
 *
 * Server-driven Supabase OAuth start. Calling signInWithOAuth on the SSR
 * client generates the PKCE verifier (stored in a cookie on OUR domain via
 * pageCookieSource) and returns the Supabase authorize URL; we then 302 the
 * browser to it. The provider bounces back to /api/auth/callback, which
 * exchanges the code using that same verifier cookie.
 *
 * This replaces direct links to `<ref>.supabase.co/auth/v1/authorize?...`
 * which could not complete: without a code_challenge the flow returns tokens
 * in a URL fragment the server never sees, so no session cookie was ever set.
 */
export const prerender = false;

function resolveAllowedOrigin(request: Request): string | null {
  const requestOrigin = new URL(request.url).origin;
  const configured = import.meta.env.SITE_URL;
  const allowed = new Set<string>();
  if (configured) {
    try { allowed.add(new URL(configured).origin); } catch { /* invalid config is ignored */ }
  }
  if (requestOrigin.startsWith('http://localhost:') || requestOrigin.startsWith('http://127.0.0.1:')) {
    allowed.add(requestOrigin);
  }
  return allowed.has(requestOrigin) ? requestOrigin : null;
}

export const GET: APIRoute = async ({ request, cookies, redirect }) => {
  const origin = resolveAllowedOrigin(request);
  if (!origin) return redirect('/signin?oauth=origin_error', 302);
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return redirect('/signin?oauth=unconfigured', 302);
  }

  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${origin}/api/auth/callback`,
        // Do not follow the authorize URL server-side; we return it as a
        // redirect so the verifier cookie travels with this response.
        skipBrowserRedirect: true,
      },
    });

    if (error || !data?.url) {
      return redirect('/signin?oauth=error', 302);
    }

    return redirect(data.url, 302);
  } catch {
    return redirect('/signin?oauth=error', 302);
  }
};
