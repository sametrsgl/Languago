import type { APIRoute } from 'astro';
import { json } from '../../../lib/lessons-server';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { notifyContact, CONTACT_TOPICS } from '../../../lib/notify';

export const prerender = false;

/** POST { name, email, topic, message, page, website, t }: save the message, e-mail the owner. */
export const POST: APIRoute = async (ctx) => {
  let b: any = {};
  try { b = JSON.parse((await ctx.request.text()).slice(0, 8000)); } catch { return json(400, { ok: false }); }
  // bots: the hidden "website" field is filled, or the form was sent within 3 seconds
  if (b.website || (Number(b.t) && Number(b.t) < 3000)) return json(200, { ok: true });
  const name = String(b.name || '').trim().slice(0, 80);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 160);
  const topic = CONTACT_TOPICS[b.topic] ? String(b.topic) : 'genel';
  const message = String(b.message || '').trim().slice(0, 3000);
  const page = typeof b.page === 'string' ? b.page.slice(0, 200) : null;
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json(400, { ok: false, error: 'Adınızı ve geçerli bir e-posta adresi yazın.' });
  if (message.length < 5) return json(400, { ok: false, error: 'Mesajınız çok kısa.' });
  const sb = createSupabaseClient(pageCookieSource(ctx));
  if (!sb) return json(503, { ok: false, error: 'Servis şu anda kullanılamıyor.' });
  const { data: u } = await sb.auth.getUser();
  const { data, error } = await sb.rpc('submit_contact', { p_name: name, p_email: email, p_topic: topic, p_message: message, p_page: page });
  if (error) return json(error.message.includes('too_many') ? 429 : 500, { ok: false, error: error.message.includes('too_many') ? 'Bugün çok mesaj gönderildi. Lütfen yarın tekrar deneyin.' : 'Mesaj kaydedilemedi. Lütfen tekrar deneyin.' });
  await notifyContact({ id: Number(data) || null, name, email, topic, message, page, userId: u?.user?.id || null });
  return json(200, { ok: true });
};
