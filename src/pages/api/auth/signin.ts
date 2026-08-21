import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

/**
 * POST /api/auth/signin
 * Standalone JSON endpoint — no Astro Actions routing. Reliable under Vercel.
 *
 * Request:  { "email", "password" }
 * Success:  { "ok": true }                  → client → /dashboard
 * Validation error: { "error": { "fields": { email: [...], password: [...] } } }
 * Other error:     { "error": { "message": "..." } }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { email?: string; password?: string } = {};
  try {
    body = await request.json();
  } catch {
    return json(
      { error: { message: 'Geçersiz istek. Lütfen tekrar dene.' } },
      400
    );
  }

  const email = (typeof body.email === 'string' ? body.email : '').trim();
  const password = typeof body.password === 'string' ? body.password : '';

  const fields: Record<string, string[]> = {};
  if (!email) fields.email = ['E-posta adresi gerekli.'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fields.email = ['Geçerli bir e-posta adresi girin.'];
  if (!password) fields.password = ['Şifre gerekli.'];
  if (Object.keys(fields).length) {
    return json({ error: { fields } }, 400);
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return json(
      { error: { message: 'Giriş şu anda devre dışı: Supabase ayarlanmamış.' } },
      500
    );
  }

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return json(
        { error: { message: 'E-posta veya şifre hatalı. Bilgilerini kontrol et.' } },
        401
      );
    }

    return json({ ok: true }, 200);
  } catch {
    return json(
      { error: { message: 'Giriş sırasında bir hata oluştu. Lütfen tekrar dene.' } },
      500
    );
  }
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}