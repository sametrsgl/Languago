import type { APIRoute } from 'astro';
import { scheduleReview, REVIEW_RATINGS } from '../../../lib/review-scheduler.mjs';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';
import { readJsonBody, RequestBodyError } from '../../../lib/request-body';

export const prerender = false;
const VALID_SKILLS = new Set(['vocabulary', 'grammar', 'reading', 'speaking', 'listening', 'writing']);

export const POST: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);
  let body: any;
  try { body = await readJsonBody<unknown>(request, 32_768); }
  catch (error) {
    if (error instanceof RequestBodyError) return json({ error: error.message }, error.status);
    return json({ error: 'Geçersiz istek.' }, 400);
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return json({ error: 'Geçersiz tekrar verisi.' }, 400);
  const itemId = String(body?.itemId ?? '').trim();
  const skill = String(body?.skill ?? 'vocabulary').trim();
  const rating = Number(body?.rating);
  if (!itemId || itemId.length > 160 || !VALID_SKILLS.has(skill) || !Number.isInteger(rating) || rating < 0 || rating > 3) {
    return json({ error: 'Geçersiz tekrar verisi.' }, 400);
  }

  let previous: any = null;
  try {
    const { data, error } = await supabase.from('review_items')
      .select('item_id, skill, stability_days, difficulty, due_at, repetitions, lapses, last_reviewed_at, last_rating')
      .eq('student_id', auth.user.id).eq('item_id', itemId).maybeSingle();
    if (error && isMissingReviewTable(error)) return json({ error: 'review_unavailable' }, 503);
    if (error) return json({ error: 'Tekrar okunamadı.' }, 500);
    previous = data;
  } catch { return json({ error: 'review_unavailable' }, 503); }
  const next = scheduleReview({
    itemId,
    skill,
    stabilityDays: previous?.stability_days,
    difficulty: previous?.difficulty,
    dueAt: previous?.due_at ? Date.parse(previous.due_at) : Date.now(),
    repetitions: previous?.repetitions,
    lapses: previous?.lapses,
    lastReviewedAt: previous?.last_reviewed_at ? Date.parse(previous.last_reviewed_at) : 0,
    lastRating: previous?.last_rating,
  }, rating);
  const { error } = await supabase.from('review_items').upsert({
    student_id: auth.user.id,
    item_id: next.itemId,
    skill: next.skill,
    stability_days: next.stabilityDays,
    difficulty: next.difficulty,
    due_at: new Date(next.dueAt).toISOString(),
    repetitions: next.repetitions,
    lapses: next.lapses,
    last_reviewed_at: new Date(next.lastReviewedAt).toISOString(),
    last_rating: next.lastRating,
  }, { onConflict: 'student_id,item_id' });
  if (error && isMissingReviewTable(error)) return json({ error: 'review_unavailable' }, 503);
  if (error) return json({ error: 'Tekrar kaydedilemedi.' }, 500);
  return json({ ok: true, item: next, label: Object.entries(REVIEW_RATINGS).find(([, value]) => value === rating)?.[0] ?? 'GOOD' }, 200);
};

function isMissingReviewTable(error: { code?: string; message?: string } | null | undefined) {
  const code = String(error?.code ?? '');
  const message = String(error?.message ?? '').toLowerCase();
  return code === '42P01' || code === 'PGRST205' || (message.includes('review_items') && message.includes('not found'));
}

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), { status, headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' } });
}
