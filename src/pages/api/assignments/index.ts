import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;
const UUID = /^[0-9a-f-]{36}$/i;

/** POST { material, classId | studentId, due? }: send one of the teacher's materials as homework. */
export const POST: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 1000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (u.role !== 'teacher' && u.role !== 'admin') return json(403, { ok: false, error: 'Ödevi öğretmenler verir.' });
  const material = UUID.test(String(b.material || '')) ? b.material : null;
  const classId = UUID.test(String(b.classId || '')) ? b.classId : null;
  const studentId = UUID.test(String(b.studentId || '')) ? b.studentId : null;
  const due = /^\d{4}-\d{2}-\d{2}$/.test(String(b.due || '')) ? b.due : null;
  if (!material || (!classId === !studentId)) return json(400, { ok: false, error: 'Bir sınıf ya da öğrenci seçin.' });
  const { data: id, error } = await u.sb.rpc('assign_material', { p_material: material, p_class: classId, p_student: studentId, p_due: due });
  if (error) {
    const m = error.message;
    const msg = m.includes('too_many') ? 'Bugün en fazla 50 ödev verebilirsiniz.' : m.includes('bad_due') ? 'Teslim tarihi bugünden sonra ve 6 ay içinde olmalı.' : 'Ödev verilemedi.';
    return json(m.includes('too_many') ? 429 : 400, { ok: false, error: msg });
  }
  return json(200, { ok: true, id });
};

/** DELETE { id }: take back an assignment (its submissions go with it). */
export const DELETE: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 500)); } catch { return json(400, { ok: false }); }
  if (!UUID.test(String(b.id || ''))) return json(400, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { error } = await u.sb.from('material_assignments').delete().eq('id', b.id).eq('teacher_id', u.userId);
  return json(error ? 400 : 200, { ok: !error });
};
