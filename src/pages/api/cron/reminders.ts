import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { json, siteOrigin } from '../../../lib/lessons-server';
import { mailLayout, sendEmail } from '../../../lib/notify';
import { timeOf } from '../../../lib/timetable';

export const prerender = false;

/**
 * Lesson reminders, called every 10 minutes by a Supabase pg_cron job.
 * Safe to call by anyone: the database hands each reminder out once
 * (claim_lesson_reminders marks it sent), and the response is only counts.
 */
export const GET: APIRoute = async ({ request }) => {
  const url = import.meta.env.SUPABASE_URL;
  const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return json(503, { ok: false, error: 'not_configured' });
  const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await sb.rpc('claim_lesson_reminders');
  if (error) return json(500, { ok: false, error: 'claim_failed' });
  const rows = (Array.isArray(data) ? data : []) as {
    id: string; starts_at: string; title: string; join_url: string; teacher_name: string;
    role: string; full_name: string | null; email: string | null;
  }[];
  const origin = siteOrigin(request);
  let sent = 0;
  for (const r of rows) {
    if (!r.email) continue;
    const join = r.join_url.startsWith('/') ? origin + r.join_url : r.join_url;
    const at = timeOf(r.starts_at);
    const line = r.role === 'teacher' ? '“' + r.title + '” dersiniz bir saat içinde başlıyor.' : r.teacher_name + ' ile dersiniz bir saat içinde başlıyor.';
    const ok = await sendEmail([r.email], 'Ders hatırlatması: bugün ' + at, mailLayout('Dersiniz yaklaşıyor', [
      line,
      'Başlangıç: bugün ' + at + '. Birkaç dakika önce bağlanıp kameranızı ve mikrofonunuzu kontrol edin.',
    ], { href: join, label: 'Derse katıl' }));
    if (ok) sent++;
  }
  return json(200, { ok: true, reminders: rows.length, sent });
};
