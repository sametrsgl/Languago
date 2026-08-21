import { createServerClient, parseCookieHeader } from '@supabase/ssr';

/**
 * Minimal cookie-store interface for sources that expose getAll()/set() —
 * namely the cookie object Astro Actions gives an action handler
 * (`ctx.cookies`), which DOES support getAll().
 */
export interface CookieStore {
  getAll(): { name: string; value: string; options?: Record<string, unknown> }[];
  set(name: string, value: string, options?: Record<string, unknown>): void;
}

/**
 * Cookie source for Astro `.astro` pages and API routes. `Astro.cookies` (and
 * the API-route `cookies` object) do NOT expose `getAll()`, so cookie reads
 * must come from parsing the raw request `Cookie` header, while writes go
 * through the existing setter. `pageCookieSource()` builds this from an Astro
 * page/endpoint context (its `Astro.request` + `Astro.cookies`).
 */
export interface PageCookieSource {
  request: Request;
  setCookie(name: string, value: string, options?: Record<string, unknown>): void;
}

/**
 * Union of everything `createSupabaseClient` accepts: either a CookieStore
 * (action handlers) or a PageCookieSource (pages / API routes).
 */
export type SupabaseSource = CookieStore | PageCookieSource;

function isCookieStore(source: SupabaseSource): source is CookieStore {
  return 'getAll' in source;
}

/**
 * Create a Supabase SSR client wired to cookie-based auth for this request.
 *
 * Accepts either:
 *  - a `CookieStore` (e.g. an action handler's `ctx.cookies`), or
 *  - a `PageCookieSource` (built by `pageCookieSource()` from `Astro.cookies`
 *    and `Astro.request`), for `.astro` pages and API routes.
 *
 * Cookie READS are handled per source: CookieStore uses its `getAll()`; the
 * page source parses the raw `Cookie` request header because Astro's cookie
 * object has no `getAll()`.
 *
 * Returns `null` when SUPABASE_URL / SUPABASE_ANON_KEY are absent so the app
 * still builds and boots locally before a real Supabase project exists. Every
 * caller must handle `null` (they redirect or show a friendly "not configured"
 * message). The client is created per-request, never at module load.
 */
export function createSupabaseClient(source: SupabaseSource) {
  const url = import.meta.env.SUPABASE_URL;
  const anonKey = import.meta.env.SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    return null;
  }

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        if (isCookieStore(source)) {
          return source.getAll();
        }
        return parseCookieHeader(source.request.headers.get('cookie') ?? '');
      },
      setAll(cookiesToSet) {
        for (const { name, value, options } of cookiesToSet) {
          if (isCookieStore(source)) {
            source.set(name, value, options);
          } else {
            source.setCookie(name, value, options);
          }
        }
      },
    },
  });
}

/**
 * Build a PageCookieSource from an Astro page/endpoint context so a Supabase
 * client can be created from `Astro.cookies` on `.astro` pages and API routes,
 * e.g. `createSupabaseClient(pageCookieSource(Astro))` or
 * `getSessionUser(pageCookieSource(Astro))`.
 */
export function pageCookieSource(context: {
  request: Request;
  cookies: { set(...args: unknown[]): void };
}): PageCookieSource {
  const { request, cookies } = context;
  return {
    request,
    setCookie: (name, value, options) => cookies.set(name, value, options),
  };
}