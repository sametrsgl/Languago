import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { authorizeParent } from '../../../lib/parent';

/**
 * POST /api/parent/add-child
 * Link a child (student) to the signed-in parent's family by the CHILD'S EMAIL.
 *
 * Lookup is performed via the SECURITY DEFINER `get_child_by_email` helper,
 * which only resolves a profile whose role = 'student' and only for the
 * authenticated caller. The `family_links` insert is then RLS-scoped to
 * parent_id = auth.uid() — a parent can never attach an arbitrary student on
 * their own.
 *
 * Request: { "email": "..." }
 * Success: { "ok": true, "child": {...} }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { email?: string } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const email = (typeof body.email === 'string' ? body.email : '').trim().toLowerCase();
  if (!email) {
    return respond(400, {
      ok: false,
      error: { fields: { email: ['Çocuğun e-posta adresini gir.'] } },
    });
  }
  // Light format sanity-check (block simple junk input; real validation is
  // on the child-account uniqueness, not here).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return respond(400, {
      ok: false,
      error: { fields: { email: ['Geçerli bir e-posta adresi gir.'] } },
    });
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return respond(500, {
      ok: false,
      error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' },
    });
  }

  const auth = await authorizeParent(pageCookieSource({ request, cookies }));
  if (!auth.ok) {
    return respond(auth.reason === 'signed_out' ? 401 : 403, {
      ok: false,
      error: { message: 'Bu işlem için veli yetkisi gerekli.' },
    });
  }

  // 1) Resolve the child via the SECURITY DEFINER helper.
  let child: { child_id: string; full_name: string | null; email: string } | null = null;
  try {
    const { data } = await supabase.rpc('get_child_by_email', {
      p_parent: auth.userId,
      p_email: email,
    });
    if (Array.isArray(data) && data.length > 0) {
      child = (data[0] as { child_id: string; full_name: string | null; email: string });
    }
  } catch {
    child = null;
  }
  if (!child) {
    return respond(404, {
      ok: false,
      error: {
        message: 'Bu e-posta ile kayıtlı bir öğrenci bulunamadı veya öğrenci rolü yok.',
      },
    });
  }

  // 2) Insert the family link (RLS enforces parent_id = auth.uid()).
  const { error } = await supabase
    .from('family_links')
    .insert({ parent_id: auth.userId, child_id: child.child_id });

  if (error) {
    if (String(error.code ?? '').match(/23505|unique/)) {
      return respond(409, {
        ok: false,
        error: { message: 'Bu çocuk zaten eklenmiş.' },
      });
    }
    return respond(500, { ok: false, error: { message: error.message } });
  }

  return respond(200, { ok: true, child });
};