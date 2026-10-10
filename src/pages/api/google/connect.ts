import type { APIRoute } from 'astro';
import { randomBytes } from 'node:crypto';
import { apiUser, isTeacherRole, siteOrigin } from '../../../lib/lessons-server';
import { consentUrl, googleReady } from '../../../lib/google';

export const prerender = false;

/** Teacher → Google consent screen for Calendar (Meet links come from there). */
export const GET: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return ctx.redirect('/signin?next=/app/takvim', 302);
  if (!isTeacherRole(u.role)) return ctx.redirect('/app', 302);
  if (!googleReady()) return ctx.redirect('/app/takvim?google=kurulmadi', 302);
  const origin = siteOrigin(ctx.request);
  const state = randomBytes(18).toString('base64url');
  ctx.cookies.set('lg_google_state', state, {
    path: '/api/google', httpOnly: true, sameSite: 'lax', secure: origin.startsWith('https:'), maxAge: 600,
  });
  return ctx.redirect(consentUrl(origin, state, u.email || undefined), 302);
};
