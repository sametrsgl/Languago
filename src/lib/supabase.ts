import { createServerClient } from '@supabase/ssr';

/**
 * Minimal cookie-store interface shared by both `Astro.cookies` (in
 * `.astro` frontmatter) and the `cookies` subset exposed to an action's
 * handler (`ctx.cookies`). Both implement getAll()/set(), which is all the
 * Supabase SSR client needs for cookie-based sessions.
 */
export interface CookieStore {
  getAll(): { name: string; value: string; options?: Record<string, unknown> }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

/**
 * Create a Supabase SSR client wired to cookie-based auth for this request.
 *
 * Returns `null` when SUPABASE_URL / SUPABASE_ANON_KEY are absent so the app
 * still builds and boots locally before a real Supabase project exists. Every
 * caller must handle `null` (they redirect or show a friendly "not configured"
 * message). The client is created per-request, never at module load.
 */
export function createSupabaseClient(cookies: CookieStore) {
  const url = import.meta.env.SUPABASE_URL;
  const anonKey = import.meta.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          cookies.set(name, value, options);
        }
      },
    },
  });
}