import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, json, getPeople, mailLesson, siteOrigin, APPT_COLS, type Appt } from '../../../lib/lessons-server';
import { lessonError } from '../../../lib/timetable';

export const prerender = false;

/** A student asks their teacher for a slot; the teacher gets a notice and an email. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any;
  try { body = await readJsonBody(ctx.request, 2048); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const startsAt = new Date(String(body.startsAt || ''));
  if (Number.isNaN(startsAt.getTime())) return json(400, { ok: false, error: 'Bir saat seçin.' });
  const { data: id, error } = await u.sb.rpc('request_lesson', {
    p_teacher: String(body.teacherId || ''), p_starts: startsAt.toISOString(), p_note: String(body.note || '').slice(0, 500) || null,
  });
  if (error || !id) return json(400, { ok: false, error: lessonError(error?.message) });
  const { data: a } = await u.sb.from('appointments').select(APPT_COLS).eq('id', id).maybeSingle();
  if (a) await mailLesson('requested', a as Appt, await getPeople(u.sb, id), siteOrigin(ctx.request));
  return json(200, { ok: true, id });
};
