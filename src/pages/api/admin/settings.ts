import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeAdmin } from '../../../lib/admin';

type Respond = (status: number, body: Record<string, unknown>) => Response;
const respond: Respond = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * Admin CMS — site_settings management.
 * All routes validate role === 'admin' server-side from profiles.role
 * (never user_metadata). RLS policies additionally require role='admin'
 * for any write to public.site_settings.
 *
 *  GET    /api/admin/settings           -> { ok, settings: [...] }
 *  POST   /api/admin/settings  {key,value}  upsert a setting -> { ok, setting }
 *  DELETE /api/admin/settings  {key}   delete a setting -> { ok }
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const { data, error } = await supabase.from('site_settings').select('key, value, updated_at').order('key');
  if (error) return respond(500, { ok: false, error: { message: error.message } });
  return respond(200, { ok: true, settings: data ?? [] });
};

export const POST: APIRoute = async ({ request, cookies }) => {
  let body: { key?: string; value?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const key = (typeof body.key === 'string' ? body.key : '').trim();
  const value = typeof body.value === 'string' ? body.value : '';
  if (!key) {
    return respond(400, { ok: false, error: { fields: { key: ['Anahtar (key) gerekli.'] } } });
  }
  if (key.length > 200) {
    return respond(400, { ok: false, error: { fields: { key: ['Anahtar en fazla 200 karakter olabilir.'] } } });
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      { key, value, updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    )
    .select('key, value, updated_at')
    .single();

  if (error || !data) {
    return respond(500, { ok: false, error: { message: error?.message ?? 'Kayıt başarısız.' } });
  }
  return respond(200, { ok: true, setting: data });
};

export const DELETE: APIRoute = async ({ request, cookies }) => {
  let body: { key?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const key = (typeof body.key === 'string' ? body.key : '').trim();
  if (!key) return respond(400, { ok: false, error: { message: 'Geçersiz anahtar.' } });

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor.' } });

  const auth = await authorizeAdmin(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için yönetici (admin) yetkisi gerekli.' },
    });
  }

  const { error } = await supabase.from('site_settings').delete().eq('key', key);
  if (error) return respond(500, { ok: false, error: { message: error.message } });
  return respond(200, { ok: true });
};