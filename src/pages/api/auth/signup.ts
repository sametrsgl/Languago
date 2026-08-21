import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

/**
 * POST /api/auth/signup
 * Standalone JSON endpoint — no Astro Actions routing, no origin-check
 * middleware. Reliable under Vercel's custom-domain proxy.
 *
 * Request:  { "fullName"?, "email", "password" }
 * Success (session): { "ok": true, "hasSession": true }      → client → /dashboard
 * Success (confirmation): { "ok": true, "hasSession": false } → client shows "check email"
 * Validation error: { "error": { "fields": { email: [...], password: [...] } } }
 * Other error:     { "error": { "message": "..." } }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { fullName?: string | null; email?: string; password?: string } = {};
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
  const fullName =
    typeof body.fullName === 'string' && body.fullName.trim()
      ? body.fullName.trim()
      : undefined;

  // Lightweight field validation (mirrors the old zod input shape).
  const fields: Record<string, string[]> = {};
  if (!email) fields.email = ['E-posta adresi gerekli.'];
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    fields.email = ['Geçerli bir e-posta adresi girin.'];
  if (!password) fields.password = ['Şifre gerekli.'];
  else if (password.length < 6)
    fields.password = ['Şifre en az 6 karakter olmalı.'];
  if (fullName && fullName.length > 120) fields.fullName = ['Ad Soyad en fazla 120 karakter olabilir.'];
  if (Object.keys(fields).length) {
    return json({ error: { fields } }, 400);
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return json(
      { error: { message: 'Kayıt şu anda devre dışı: Supabase ayarlanmamış.' } },
      500
    );
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: fullName ? { full_name: fullName } : undefined },
    });

    if (error) {
      return json({ error: { message: error.message } }, 400);
    }

    // If email confirmation is disabled in the Supabase project, the user is
    // signed straight in (a session exists). Otherwise they must confirm.
    return json({ ok: true, hasSession: Boolean(data.session) }, 200);
  } catch {
    return json(
      { error: { message: 'Kayıt sırasında bir hata oluştu. Lütfen tekrar dene.' } },
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