import type { APIRoute } from 'astro';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';
import { apiUser, isTeacherRole, json } from '../../../lib/lessons-server';
import { fromLocal } from '../../../lib/timetable';

export const prerender = false;

const dayNum = (s: unknown): number | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s || ''));
  if (!m) return null;
  const ms = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(ms) ? null : Math.floor(ms / 86_400_000);
};

/** Teacher closes whole days (from, to inclusive, Turkey time) or reopens them. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any;
  try { body = await readJsonBody(ctx.request, 2048); } catch (e) {
    return json(e instanceof RequestBodyError ? e.status : 400, { ok: false, error: 'Geçersiz istek.' });
  }
  if (body.remove) {
    await u.sb.from('teacher_blocks').delete().eq('id', String(body.remove)).eq('teacher_id', u.userId);
    return json(200, { ok: true });
  }
  const from = dayNum(body.from);
  const to = dayNum(body.to || body.from);
  if (from === null || to === null || to < from || to - from > 90) return json(400, { ok: false, error: 'Geçerli bir tarih aralığı seçin (en fazla 90 gün).' });
  const note = String(body.note || '').trim().slice(0, 120) || null;
  const { error } = await u.sb.from('teacher_blocks').insert({
    teacher_id: u.userId, starts_at: new Date(fromLocal(from, 0)).toISOString(), ends_at: new Date(fromLocal(to + 1, 0)).toISOString(), note,
  });
  if (error) return json(500, { ok: false, error: 'Kaydedilemedi.' });
  return json(200, { ok: true });
};
