import type { APIRoute } from 'astro';
import { apiUser, isTeacherRole, siteOrigin } from '../../../lib/lessons-server';
import { exchangeCode, googleReady, sealToken } from '../../../lib/google';

export const prerender = false;

/** Google sends the teacher back here; the refresh token is stored encrypted. */
export const GET: APIRoute = async (ctx) => {
  const back = (q: string) => ctx.redirect(`/app/takvim?google=${q}`, 302);
  const state = ctx.cookies.get('lg_google_state')?.value;
  ctx.cookies.delete('lg_google_state', { path: '/api/google' });
  const params = ctx.url.searchParams;
  if (params.get('error')) return back('iptal');
  if (!state || params.get('state') !== state || !params.get('code')) return back('hata');
  if (!googleReady()) return back('kurulmadi');
  const u = await apiUser(ctx);
  if (u instanceof Response) return ctx.redirect('/signin?next=/app/takvim', 302);
  if (!isTeacherRole(u.role)) return ctx.redirect('/app', 302);
  try {
    const { refreshToken, email } = await exchangeCode(String(params.get('code')), siteOrigin(ctx.request));
    const { error } = await u.sb.from('google_links').upsert({
      teacher_id: u.userId, google_email: email, token_enc: sealToken(refreshToken), connected_at: new Date().toISOString(),
    });
    if (error) return back('hata');
    return back('bagli');
  } catch (e) {
    console.warn('[google] connect failed:', e instanceof Error ? e.message : String(e));
    return back(e instanceof Error && e.message === 'scope_missing' ? 'izin' : 'hata');
  }
};
