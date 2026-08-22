import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../lib/supabase';
import { getSessionUser } from '../../lib/auth';

const respond = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

/**
 * GET /api/notifications
 * List the signed-in user's OWN notifications (RLS `notif_owner_read` scopes to
 * auth.uid()), newest first, capped for the header bell. Returns an unread count
 * so the bell badge can render in one round trip.
 *
 * Success: { ok, notifications: [...], unread }
 */
export const GET: APIRoute = async ({ request, cookies }) => {
  const source = pageCookieSource({ request, cookies });
  const supabase = createSupabaseClient(source);
  if (!supabase) {
    return respond(500, {
      ok: false,
      error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' },
    });
  }

  const user = await getSessionUser(source);
  if (!user) {
    return respond(401, { ok: false, error: { message: 'Bu işlem için giriş yapmalısın.' } });
  }

  const { data, error } = await supabase
    .from('notifications')
    .select('id, title, body, href, kind, is_read, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return respond(500, { ok: false, error: { message: error.message } });
  }

  const list = data ?? [];
  const unread = list.filter((n) => !n.is_read).length;
  return respond(200, { ok: true, notifications: list, unread });
};

/**
 * POST /api/notifications
 * Mark notification(s) read for the signed-in user.
 *   Body: { id: "..." }  → mark one notification read
 *   Body: { all: true }  → mark every unread notification of the user read
 * RLS `notif_owner_update` (auth.uid() = user_id) + an explicit user_id guard
 * scope every update to the caller's own rows only — a user can never touch
 * another user's notifications.
 *
 * Success: { ok: true }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const source = pageCookieSource({ request, cookies });

  let body: { id?: unknown; all?: unknown } = {};
  try {
    body = await request.json();
  } catch {
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }

  const markAll = body.all === true;
  const id = typeof body.id === 'string' && body.id ? body.id.trim() : '';
  if (!markAll && !id) {
    return respond(400, { ok: false, error: { message: 'Geçersiz bildirim.' } });
  }

  const supabase = createSupabaseClient(source);
  if (!supabase) {
    return respond(500, {
      ok: false,
      error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' },
    });
  }

  const user = await getSessionUser(source);
  if (!user) {
    return respond(401, { ok: false, error: { message: 'Bu işlem için giriş yapmalısın.' } });
  }

  let query = supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id);
  if (markAll) {
    query = query.is('is_read', false);
  } else {
    query = query.eq('id', id);
  }

  const { error } = await query;
  if (error) {
    return respond(500, { ok: false, error: { message: error.message } });
  }
  return respond(200, { ok: true });
};