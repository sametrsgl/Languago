import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, isTeacherRole, json, getPeople, mailLesson, attachMeet, noticeStudents, parseTarget, siteOrigin, APPT_COLS, type Appt } from '../../../lib/lessons-server';
import { fromLocal, parseHm, lessonError, LESSON_LENGTHS } from '../../../lib/timetable';

export const prerender = false;

/** The teacher puts a lesson on a student's or a class's timetable (confirmed at once). */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any;
  try { body = await readJsonBody(ctx.request, 2048); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const target = parseTarget(body.target);
  if (!target) return json(400, { ok: false, error: 'Bir öğrenci ya da sınıf seçin.' });
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(body.date || ''));
  const minute = parseHm(String(body.time || ''));
  const minutes = Number(body.minutes);
  if (!d || minute === null) return json(400, { ok: false, error: 'Tarih ve saat seçin.' });
  if (!LESSON_LENGTHS.includes(minutes)) return json(400, { ok: false, error: 'Ders süresini seçin.' });
  const day = Math.floor(Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3])) / 86_400_000);
  const starts = fromLocal(day, minute);
  if (starts < Date.now()) return json(400, { ok: false, error: 'Geçmiş bir saate ders eklenemez. Şimdi başlamak için “Şimdi ders başlat”ı kullanın.' });
  const title = String(body.title || '').trim().slice(0, 120) || null;

  const { data, error } = await u.sb.from('appointments').insert({
    teacher_id: u.userId, ...target, kind: target.class_id ? 'group' : 'one_on_one', title,
    starts_at: new Date(starts).toISOString(), ends_at: new Date(starts + minutes * 60_000).toISOString(),
    status: 'confirmed', created_by: 'teacher', decided_at: new Date().toISOString(),
  }).select(APPT_COLS).single();
  if (error || !data) return json(400, { ok: false, error: error?.code === '42501' ? 'Bu öğrenci ya da sınıf sizin değil.' : lessonError(error?.message) });
  const a = data as Appt;
  const people = await getPeople(u.sb, a.id);
  const { via } = await attachMeet(u.sb, a, people);
  await noticeStudents(u.sb, a, false);
  await mailLesson('added', a, people, siteOrigin(ctx.request));
  return json(200, { ok: true, id: a.id, via });
};
