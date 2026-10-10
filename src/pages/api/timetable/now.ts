import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, isTeacherRole, json, getPeople, mailLesson, attachMeet, noticeStudents, parseTarget, siteOrigin, APPT_COLS, type Appt } from '../../../lib/lessons-server';
import { lessonError } from '../../../lib/timetable';

export const prerender = false;

/** "Şimdi ders başlat": a lesson that starts now, with a Meet link to open at once. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any;
  try { body = await readJsonBody(ctx.request, 1024); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const target = body.target ? parseTarget(body.target) : { student_id: null, class_id: null };
  if (!target) return json(400, { ok: false, error: 'Geçersiz seçim.' });
  const minutes = [30, 45, 60, 90].includes(Number(body.minutes)) ? Number(body.minutes) : 60;
  const now = Date.now();
  const { data, error } = await u.sb.from('appointments').insert({
    teacher_id: u.userId, ...target, kind: 'instant', title: String(body.title || '').trim().slice(0, 120) || 'Canlı ders',
    starts_at: new Date(now).toISOString(), ends_at: new Date(now + minutes * 60_000).toISOString(),
    status: 'confirmed', created_by: 'teacher', decided_at: new Date(now).toISOString(),
  }).select(APPT_COLS).single();
  if (error || !data) return json(400, { ok: false, error: error?.code === '42501' ? 'Bu öğrenci ya da sınıf sizin değil.' : lessonError(error?.message) });
  const a = data as Appt;
  const people = await getPeople(u.sb, a.id);
  const { url, via } = await attachMeet(u.sb, a, people);
  if (target.student_id || target.class_id) {
    await noticeStudents(u.sb, a, true);
    await mailLesson('instant', a, people, siteOrigin(ctx.request));
  }
  return json(200, { ok: true, url, via });
};
