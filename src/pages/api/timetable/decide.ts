import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, isTeacherRole, json, getPeople, mailLesson, attachMeet, siteOrigin, APPT_COLS, type Appt } from '../../../lib/lessons-server';
import { lessonError } from '../../../lib/timetable';

export const prerender = false;

/** The teacher accepts (a Meet link is made) or declines a student's request. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any;
  try { body = await readJsonBody(ctx.request, 1024); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const id = String(body.id || '');
  const accept = body.accept === true;
  const { error } = await u.sb.rpc('decide_lesson', { p_id: id, p_accept: accept });
  if (error) return json(400, { ok: false, error: lessonError(error.message) });
  const { data } = await u.sb.from('appointments').select(APPT_COLS).eq('id', id).maybeSingle();
  if (!data) return json(200, { ok: true });
  const a = data as Appt;
  const people = await getPeople(u.sb, id);
  let via: string | null = null;
  if (accept) via = (await attachMeet(u.sb, a, people)).via;
  await mailLesson(accept ? 'confirmed' : 'declined', a, people, siteOrigin(ctx.request));
  return json(200, { ok: true, via });
};
