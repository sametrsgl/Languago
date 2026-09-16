import type { APIRoute } from 'astro';
import { WORD_DATA } from '../../../data/words.js';
import { buildPersonalizedVocabularyPath, CEFR_LEVELS, recordsFromWordData } from '../../../lib/vocab-path.mjs';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const requestedLevel = new URL(request.url).searchParams.get('level')?.toUpperCase() || '';
  let profileLevel = '';
  try {
    const { data: profile } = await supabase.from('profiles').select('level').eq('id', authData.user.id).maybeSingle();
    profileLevel = String(profile?.level ?? '').toUpperCase();
  } catch { /* fall back to explicit level */ }
  const level = requestedLevel || (CEFR_LEVELS.includes(profileLevel) ? profileLevel : 'A1');
  if (!CEFR_LEVELS.includes(level)) return json({ error: 'Seviye geçersiz.' }, 400);
  let reviews: unknown[] = [];
  try {
    const { data } = await supabase.from('review_items')
      .select('item_id, skill, stability_days, difficulty, due_at, repetitions, lapses, last_rating')
      .eq('student_id', authData.user.id).eq('skill', 'vocabulary').limit(500);
    reviews = (data ?? []) as unknown[];
  } catch { /* optional migration: new students use the unseen-word route */ }
  const path = buildPersonalizedVocabularyPath(recordsFromWordData(WORD_DATA), level, { reviews });
  return json(path, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}
