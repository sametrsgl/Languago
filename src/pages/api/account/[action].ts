import type { APIRoute } from 'astro';
import { apiUser, json } from '../../../lib/lessons-server';

export const prerender = false;

/**
 * Account actions for the signed-in user:
 *  POST /api/account/profile  { fullName }
 *  POST /api/account/consent  { ai, speech }
 *  GET  /api/account/export   -> a JSON file with the user's own data (KVKK)
 *  POST /api/account/delete   { confirm: 'SİL' }
 */
export const GET: APIRoute = async (ctx) => {
  if (ctx.params.action !== 'export') return json(404, { ok: false });
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  const own = (table: string, col = 'student_id') => u.sb.from(table).select('*').eq(col, u.userId).then((r: any) => r.data || []);
  const [profile, progress, path, missions, cards, exams, lessonsAsStudent, notifications, consents, vocabChecks] = await Promise.all([
    u.sb.from('profiles').select('*').eq('id', u.userId).maybeSingle().then((r: any) => r.data),
    own('student_progress'), own('path_state'), own('mission_results'), own('vocab_cards'), own('level_exams'),
    own('appointments'), own('notifications', 'user_id'), own('consents', 'user_id'), own('vocab_checks'),
  ]);
  const body = JSON.stringify({ exportedAt: new Date().toISOString(), email: u.email, profile, consents, progress, path, missions, vocabularyCards: cards, vocabularyAnalysis: vocabChecks, levelExams: exams, lessons: lessonsAsStudent, notifications }, null, 2);
  return new Response(body, { headers: { 'Content-Type': 'application/json; charset=utf-8', 'Content-Disposition': 'attachment; filename="languago-verilerim.json"', 'Cache-Control': 'no-store' } });
};

export const POST: APIRoute = async (ctx) => {
  const u = await apiUser(ctx);
  if (u instanceof Response) return u;
  let body: any = {};
  try { body = JSON.parse((await ctx.request.text()).slice(0, 1000)); } catch { return json(400, { ok: false, error: 'Geçersiz istek.' }); }

  if (ctx.params.action === 'profile') {
    const fullName = String(body.fullName || '').trim().slice(0, 120);
    if (fullName.length < 2) return json(400, { ok: false, error: 'Adınızı yazın.' });
    const { error } = await u.sb.from('profiles').update({ full_name: fullName }).eq('id', u.userId);
    await u.sb.auth.updateUser({ data: { full_name: fullName } }).catch(() => undefined);
    return json(error ? 400 : 200, { ok: !error, error: error ? 'Kaydedilemedi.' : undefined });
  }
  if (ctx.params.action === 'consent') {
    const { error } = await u.sb.from('consents').upsert({ user_id: u.userId, ai_feedback: body.ai === true, speech: body.speech === true, updated_at: new Date().toISOString() });
    return json(error ? 400 : 200, { ok: !error });
  }
  if (ctx.params.action === 'delete') {
    if (body.confirm !== 'SİL') return json(400, { ok: false, error: 'Onay için SİL yazın.' });
    const { data, error } = await u.sb.rpc('delete_my_account');
    if (error || data !== true) return json(400, { ok: false, error: 'Hesap silinemedi. Lütfen iletisim sayfasından bize yazın; 30 gün içinde sileriz.' });
    await u.sb.auth.signOut().catch(() => undefined);
    return json(200, { ok: true });
  }
  return json(404, { ok: false });
};
