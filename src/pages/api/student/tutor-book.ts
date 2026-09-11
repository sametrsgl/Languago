import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { getSessionUser } from '../../../lib/auth';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';

/**
 * POST /api/student/tutor-book
 * Book an open 1:1 tutor slot for the signed-in student.
 *
 * Body: { slot_id: "..." }
 *  - Role/eligibility for the slot is enforced by RLS: `slots_student_read`
 *    only surfaces open slots from the student's own enrolled teachers.
 *  - Bookings insert is RLS-scoped to student_id = auth.uid() and only when
 *    the slot is open.
 *
 * Success: { "ok": true, "slot": {...} }
 */
export const POST: APIRoute = async ({ request, cookies }) => {
  const respond = (status: number, body: Record<string, unknown>) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    });

  let body: { slot_id?: string } = {};
  try {
    body = await readJsonBody(request, 4_096);
  } catch (error) {
    if (error instanceof RequestBodyError && error.status === 413) {
      return respond(413, { ok: false, error: { message: error.message } });
    }
    return respond(400, { ok: false, error: { message: 'Geçersiz istek.' } });
  }
  const slot_id = typeof body.slot_id === 'string' ? body.slot_id.trim() : '';
  if (!slot_id) {
    return respond(400, { ok: false, error: { message: 'Geçersiz slot.' } });
  }

  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) {
    return respond(500, { ok: false, error: { message: 'Servis şu anda kullanılamıyor: Supabase ayarlanmamış.' } });
  }

  const user = await getSessionUser(pageCookieSource({ request, cookies }));
  if (!user) {
    return respond(401, { ok: false, error: { message: 'Bu işlem için giriş yapmalısın.' } });
  }

  const { data, error } = await supabase.rpc('book_tutor_slot', { p_slot_id: slot_id });
  if (error) {
    if (String(error.code ?? '').match(/23505|P0001|unique|no longer available/i)) {
      return respond(409, { ok: false, error: { message: 'Bu slot artık müsait değil veya daha önce rezerve edildi.' } });
    }
    return respond(500, { ok: false, error: { message: 'Rezervasyon tamamlanamadı.' } });
  }
  return respond(200, { ok: true, slot: Array.isArray(data) ? data[0] : data });
};