import type { APIRoute } from 'astro';
import { WORD_DATA } from '../../../data/words.js';
import { buildVocabularyPath, CEFR_LEVELS, recordsFromWordData } from '../../../lib/vocab-path.mjs';
import { createSupabaseClient, pageCookieSource } from '../../../lib/supabase';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies }) => {
  const supabase = createSupabaseClient(pageCookieSource({ request, cookies }));
  if (!supabase) return json({ error: 'Supabase ayarlanmamış.' }, 503);
  const { data } = await supabase.auth.getUser();
  if (!data.user) return json({ error: 'Oturum açman gerekiyor.' }, 401);

  const level = new URL(request.url).searchParams.get('level')?.toUpperCase() || '';
  if (!CEFR_LEVELS.includes(level)) return json({ error: 'Seviye geçersiz.' }, 400);
  const path = buildVocabularyPath(recordsFromWordData(WORD_DATA), level);
  return json(path, 200);
};

function json(payload: unknown, status: number) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'private, no-store' },
  });
}
