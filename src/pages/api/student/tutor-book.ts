import type { APIRoute } from 'astro';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { getSessionUser } from '../../../lib/auth';

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
    body = await request.json();
  } catch {
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

  // 1) Confirm the slot actually exists, is open, and is eligible for this
  //    student (RLS `slots_student_read` already limits visibility).
  const { data: slot } = await supabase
    .from('tutor_slots')
    .select('id, starts_at, duration_min, status')
    .eq('id', slot_id)
    .eq('status', 'open')
    .maybeSingle();

  if (!slot) {
    return respond(409, {
      ok: false,
      error: { message: 'Bu slot artık müsait değil veya öğretmeninle eşleşmiyor.' },
    });
  }

  // 2) Insert the booking (unique(slot_id, student_id) blocks duplicates).
  const { error: insertErr } = await supabase
    .from('tutor_bookings')
    .insert({ slot_id, student_id: user.id });

  if (insertErr) {
    if (String(insertErr.code ?? '').match(/23505|unique/)) {
      return respond(409, {
        ok: false,
        error: { message: 'Bu ders için zaten rezervasyonun var.' },
      });
    }
    return respond(500, { ok: false, error: { message: insertErr.message } });
  }

  // 3) Best-effort: mark the slot booked (RLS scopes to this teacher's slot,
  //    and we only flip it if it is still open).
  const { error: updateErr } = await supabase
    .from('tutor_slots')
    .update({ status: 'booked' })
    .eq('id', slot_id)
    .eq('status', 'open');

  if (updateErr) {
    // Booking succeeded even if the status flip raced; treat as success but
    // surface the note so the teacher still sees it in their slots.
    return respond(200, { ok: true, slot, note: 'booking_recorded' });
  }
  return respond(200, { ok: true, slot });
};