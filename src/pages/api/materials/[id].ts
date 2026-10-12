import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { TRACKS } from '../../../data/library-topics.mjs';

export const prerender = false;

/** PATCH { track, topic }: file the material in the teacher's library ("Materyallerime ekle"); track null takes it out. */
export const PATCH: APIRoute = async (ctx) => {
  const id = String(ctx.params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { ok: false });
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 1000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const track = b.track === null ? null : TRACKS.includes(b.track) ? b.track : undefined;
  const topic = typeof b.topic === 'string' ? b.topic.trim().replace(/\s+/g, ' ').slice(0, 80) : '';
  if (track === undefined || (track && topic.length < 2)) return json(400, { ok: false, error: 'Bir bölüm ve konu başlığı seçin.' });
  const { data, error } = await u.sb.rpc('file_teacher_material', { p_id: id, p_track: track, p_topic: track ? topic : null });
  if (error || !data) return json(400, { ok: false, error: 'Kaydedilemedi.' });
  return json(200, { ok: true });
};

/** DELETE: remove one of the teacher's own AI materials. */
export const DELETE: APIRoute = async (ctx) => {
  const id = String(ctx.params.id || '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return json(400, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { error } = await u.sb.from('teacher_materials').delete().eq('id', id).eq('teacher_id', u.userId);
  return json(error ? 400 : 200, { ok: !error });
};
