import type { APIRoute } from 'astro';
import { apiUser, isTeacherRole, json } from '../../../lib/lessons-server';

export const prerender = false;

/** After a lesson: attendance (present / absent / late) and a short report the student sees. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 6000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const attendance = ['present', 'absent', 'late'].includes(body.attendance) ? body.attendance : null;
  const report = String(body.report || '').trim().slice(0, 2000) || null;
  const id = String(body.id || '');
  const { data: a } = await u.sb.from('appointments').select('id, starts_at, status, report').eq('id', id).maybeSingle();
  if (!a) return json(404, { ok: false, error: 'Ders bulunamadı.' });
  if (Date.parse(a.starts_at) > Date.now()) return json(400, { ok: false, error: 'Rapor ders başladıktan sonra yazılır.' });
  const { error } = await u.sb.from('appointments').update({ attendance, report }).eq('id', id);
  if (error) return json(400, { ok: false, error: 'Kaydedilemedi.' });
  if (report && report !== a.report) await u.sb.rpc('notify_report', { p_id: id });
  return json(200, { ok: true });
};
