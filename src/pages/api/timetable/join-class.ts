import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, json } from '../../../lib/lessons-server';
import { lessonError } from '../../../lib/timetable';

export const prerender = false;

/** A student joins a teacher's class with its code. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any;
  try { body = await readJsonBody(ctx.request, 512); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  const code = String(body.code || '').trim().toUpperCase();
  if (!/^[A-Z0-9]{4,12}$/.test(code)) return json(400, { ok: false, error: lessonError('bad_code') });
  const { data, error } = await u.sb.rpc('join_class', { p_code: code });
  if (error) return json(400, { ok: false, error: lessonError(error.message) });
  const row = Array.isArray(data) ? data[0] : data;
  return json(200, { ok: true, className: row?.class_name ?? '', teacherName: row?.teacher_name ?? '' });
};
