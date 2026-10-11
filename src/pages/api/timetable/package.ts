import type { APIRoute } from 'astro';
import { apiUser, isTeacherRole, json } from '../../../lib/lessons-server';

export const prerender = false;

/** Teacher sets a student's lessons for a month: { studentId, month: 'YYYY-MM', lessons, note? }. */
export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (!isTeacherRole(u.role)) return json(403, { ok: false, error: 'Bu işlem öğretmenler içindir.' });
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 1000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }
  const m = /^(\d{4})-(\d{2})$/.exec(String(body.month || ''));
  const lessons = Number(body.lessons);
  if (!m || !Number.isInteger(lessons) || lessons < 0 || lessons > 60) return json(400, { ok: false, error: 'Ay ve 0–60 arası ders sayısı girin.' });
  const { error } = await u.sb.from('lesson_packages').upsert({
    student_id: String(body.studentId || ''), teacher_id: u.userId, month: `${m[1]}-${m[2]}-01`, lessons,
    note: String(body.note || '').slice(0, 200) || null, updated_at: new Date().toISOString(),
  });
  if (error) return json(400, { ok: false, error: error.code === '42501' ? 'Bu öğrenci sınıflarınızda değil.' : 'Kaydedilemedi.' });
  return json(200, { ok: true });
};
