import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, json, getPeople, mailLesson, dropMeet, siteOrigin, APPT_COLS, type Appt } from '../../../lib/lessons-server';
import { lessonError } from '../../../lib/timetable';

export const prerender = false;

/** Teacher or student cancels a lesson or a request that has not started. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any;
  try { body = await readJsonBody(ctx.request, 1024); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const id = String(body.id || '');
  // Read first: after cancelling, the people and the Google event are still needed.
  const { data } = await u.sb.from('appointments').select(APPT_COLS).eq('id', id).maybeSingle();
  if (!data) return json(404, { ok: false, error: lessonError('not_found') });
  const a = data as Appt;
  const people = await getPeople(u.sb, id);
  const { error } = await u.sb.rpc('cancel_lesson', { p_id: id });
  if (error) return json(400, { ok: false, error: lessonError(error.message) });
  await dropMeet(u.sb, a);
  await mailLesson('cancelled', a, people, siteOrigin(ctx.request), u.userId);
  return json(200, { ok: true });
};
