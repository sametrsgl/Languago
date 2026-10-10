import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, isTeacherRole, json } from '../../../lib/lessons-server';
import { LESSON_LENGTHS, normalizeHours, parseHm } from '../../../lib/timetable';

export const prerender = false;

/** Teacher saves weekly hours, lesson length, notice, window and own Meet link. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any;
  try { body = await readJsonBody(ctx.request, 8192); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const lessonMin = Number(body.lessonMin);
  const noticeHours = Number(body.noticeHours);
  const windowDays = Number(body.windowDays);
  if (!LESSON_LENGTHS.includes(lessonMin)) return json(400, { ok: false, error: 'Ders süresi 30, 45, 60 ya da 90 dakika olmalı.' });
  if (!Number.isInteger(noticeHours) || noticeHours < 0 || noticeHours > 168) return json(400, { ok: false, error: 'Önceden bildirim 0 ile 168 saat arasında olmalı.' });
  if (!Number.isInteger(windowDays) || windowDays < 7 || windowDays > 60) return json(400, { ok: false, error: 'Ders alınabilecek süre 7 ile 60 gün arasında olmalı.' });
  let meetLink: string | null = String(body.meetLink || '').trim().toLowerCase() || null;
  if (meetLink && !/^https:\/\/meet\.google\.com\/[a-z0-9-]{6,40}$/.test(meetLink)) {
    return json(400, { ok: false, error: 'Meet bağlantısı https://meet.google.com/abc-defg-hij biçiminde olmalı.' });
  }
  const raw = Array.isArray(body.hours) ? body.hours.slice(0, 60) : [];
  const hours = normalizeHours(raw.map((h: any) => ({
    weekday: Number(h.weekday), startMin: parseHm(h.start) ?? -1, endMin: parseHm(h.end) ?? -1,
  })));

  const { error: e1 } = await u.sb.from('teacher_settings').upsert({
    teacher_id: u.userId, lesson_min: lessonMin, notice_hours: noticeHours, window_days: windowDays,
    meet_link: meetLink, updated_at: new Date().toISOString(),
  });
  if (e1) return json(500, { ok: false, error: 'Ayarlar kaydedilemedi.' });
  const { error: e2 } = await u.sb.from('teacher_hours').delete().eq('teacher_id', u.userId);
  if (e2) return json(500, { ok: false, error: 'Saatler kaydedilemedi.' });
  if (hours.length) {
    const { error: e3 } = await u.sb.from('teacher_hours').insert(hours.map((h) => ({
      teacher_id: u.userId, weekday: h.weekday, start_min: h.startMin, end_min: h.endMin,
    })));
    if (e3) return json(500, { ok: false, error: 'Saatler kaydedilemedi.' });
  }
  return json(200, { ok: true, hours: hours.length });
};
