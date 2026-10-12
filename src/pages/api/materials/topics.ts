import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';
import { TRACKS } from '../../../data/library-topics.mjs';

export const prerender = false;

const clean = (s: unknown) => (typeof s === 'string' ? s.trim().replace(/\s+/g, ' ').slice(0, 80) : '');

/** POST { track, title }: add one of the teacher's own topic headings. */
export const POST: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 1000)); } catch { return json(400, { ok: false }); }
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  if (u.role !== 'teacher' && u.role !== 'admin') return json(403, { ok: false, error: 'Bu araç öğretmen hesapları içindir.' });
  const track = TRACKS.includes(b.track) ? b.track : null;
  const title = clean(b.title);
  if (!track || title.length < 2) return json(400, { ok: false, error: 'Bir bölüm seçin ve en az 2 harflik bir başlık yazın.' });
  const { data: id, error } = await u.sb.rpc('add_teacher_topic', { p_track: track, p_title: title });
  if (error) return json(error.message.includes('too_many') ? 429 : 400, { ok: false, error: error.message.includes('too_many') ? 'En fazla 300 başlık ekleyebilirsiniz.' : 'Başlık eklenemedi.' });
  return json(200, { ok: true, id, track, title });
};

/** DELETE { id }: remove one of the teacher's own headings (materials under it stay, without a heading). */
export const DELETE: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 500)); } catch { return json(400, { ok: false }); }
  if (!/^[0-9a-f-]{36}$/i.test(String(b.id || ''))) return json(400, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const { error } = await u.sb.from('teacher_topics').delete().eq('id', b.id).eq('teacher_id', u.userId);
  return json(error ? 400 : 200, { ok: !error });
};
