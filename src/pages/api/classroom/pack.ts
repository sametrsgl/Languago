import type { APIRoute } from 'astro';
import { getSessionUser } from '../../../lib/auth';
import { pageCookieSource } from '../../../lib/supabase';
import { GROUPS, audienceProfile } from '../../../classroom/core/groups.mjs';
import {
  buildLexicon,
  generatePack,
  DEFAULT_COUNT,
  MAX_ITEMS,
  MAX_PROMPT_CHARS,
  MIN_ITEMS,
  type ChatMessage,
} from '../../../classroom/core/generate.mjs';

// Classroom AI packs (signed-in teachers). A short topic such as
// "6. sınıf 3. ünite yiyecekler, some/any" becomes a validated lg.pack/1
// multiple-choice pack for the classroom games.
//
// The pipeline (prompt, parallel chunk calls with per-chunk timeouts and an
// overall deadline, defensive parsing, validation) lives in
// src/classroom/core/generate.mjs and is unit-tested there. This route only
// does auth, limits, input checks and the OpenAI-compatible HTTP call, with
// the same env conventions as the Material Maker (materials/generate.ts).
export const prerender = false;

const MAX_REQUEST_BYTES = 4096;
const GROUP_IDS = new Set(GROUPS.map((g) => g.id));
const ALLOWED_KEYS = new Set(['prompt', 'group', 'count']);

// ---------------------------------------------------------------------------
// Abuse throttling (best-effort, in-memory per server instance, like the
// Material Maker). Per user:
//   - successful generations in a 10-minute and a 24-hour window (runs still
//     in flight count as successes, so a reservation counts at once);
//   - every started run in its own, wider windows, because refused, too-few
//     and timed-out runs cost the same LLM calls as good ones;
//   - one generation at a time.
// Per IP: every started run (school networks share an IP, so it is generous).
// All checks and the reservation happen in one synchronous block (no await in
// between), so parallel requests cannot all pass before any of them reserves.
// ---------------------------------------------------------------------------
type RateWindow = { ms: number; max: number };
const USER_SUCCESS_WINDOWS: RateWindow[] = [
  { ms: 10 * 60_000, max: 4 },
  { ms: 24 * 60 * 60_000, max: 20 },
];
const USER_ATTEMPT_WINDOWS: RateWindow[] = [
  { ms: 10 * 60_000, max: 8 },
  { ms: 24 * 60 * 60_000, max: 40 },
];
const USER_KEEP_MS = 24 * 60 * 60_000; // the longest user window
const IP_WINDOW: RateWindow = { ms: 10 * 60_000, max: 30 };
const MAX_IN_FLIGHT_PER_USER = 1;
const BUSY_RETRY_SEC = 60;

const userSuccesses = new Map<string, number[]>();
const userAttempts = new Map<string, number[]>();
const ipAttempts = new Map<string, number[]>();
// Start times of each user's running generations. A run older than
// RUN_STALE_MS no longer counts, so a run that never reached its `finally`
// (a killed instance) cannot block the user until the instance recycles.
const inFlight = new Map<string, number[]>();
const RUN_STALE_MS = 2 * 60_000;

function runningRuns(userId: string, now: number): number {
  const runs = (inFlight.get(userId) ?? []).filter((t) => now - t < RUN_STALE_MS);
  if (runs.length) inFlight.set(userId, runs);
  else inFlight.delete(userId);
  return runs.length;
}

function clientKey(request: Request): string {
  const fwd = request.headers.get('x-forwarded-for') ?? '';
  const ip = fwd.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown';
  return ip;
}

// Opportunistic cleanup so the maps cannot grow unbounded.
function prune(map: Map<string, number[]>, maxAgeMs: number, now: number) {
  if (map.size <= 5000) return;
  for (const [k, v] of map) {
    if (!v.some((t) => now - t < maxAgeMs)) map.delete(k);
  }
}

type Quota = {
  allowed: boolean;
  busy: boolean;
  retryAfterSec: number;
  headers: Record<string, string>;
};

// A user's recent timestamps, trimmed to the longest window.
function recentHits(map: Map<string, number[]>, userId: string, now: number): number[] {
  const hits = (map.get(userId) ?? []).filter((t) => now - t < USER_KEEP_MS);
  if (hits.length) map.set(userId, hits);
  else map.delete(userId);
  return hits;
}

type WindowTally = { retryAfterSec: number; limit: number; remaining: number; windowSec: number };

// `pending` runs count as used on top of the recorded hits. When a window is
// full, the retry time is when enough of its oldest hits have expired.
function tallyWindows(hits: number[], windows: RateWindow[], pending: number, now: number): WindowTally {
  const tally: WindowTally = { retryAfterSec: 0, limit: windows[0].max, remaining: Infinity, windowSec: windows[0].ms / 1000 };
  for (const w of windows) {
    const inWindow = hits.filter((t) => now - t < w.ms);
    const used = inWindow.length + pending;
    if (used >= w.max) {
      const oldest = inWindow[used - w.max];
      const waitSec = oldest === undefined ? BUSY_RETRY_SEC : Math.ceil((oldest + w.ms - now) / 1000);
      tally.retryAfterSec = Math.max(tally.retryAfterSec, Math.max(1, waitSec));
    }
    if (w.max - used < tally.remaining) {
      Object.assign(tally, { limit: w.max, remaining: w.max - used, windowSec: w.ms / 1000 });
    }
  }
  return tally;
}

// Per-user quota. `ownRuns` leaves the caller's own reserved run out of the
// in-flight count (for the headers of its own response). The headers report
// the tightest window.
function userQuota(userId: string, now: number, ownRuns = 0): Quota {
  const running = Math.max(0, runningRuns(userId, now) - ownRuns);
  const successes = tallyWindows(recentHits(userSuccesses, userId, now), USER_SUCCESS_WINDOWS, running, now);
  const attempts = tallyWindows(recentHits(userAttempts, userId, now), USER_ATTEMPT_WINDOWS, 0, now);
  const tightest = attempts.remaining < successes.remaining ? attempts : successes;
  const busy = running >= MAX_IN_FLIGHT_PER_USER;
  const retryAfterSec = Math.max(successes.retryAfterSec, attempts.retryAfterSec, busy ? BUSY_RETRY_SEC : 0);
  return {
    allowed: retryAfterSec === 0,
    busy,
    retryAfterSec,
    headers: {
      'X-RateLimit-Limit': String(tightest.limit),
      'X-RateLimit-Remaining': String(Math.max(0, tightest.remaining)),
      'X-RateLimit-Window-Seconds': String(tightest.windowSec),
    },
  };
}

function ipQuota(ip: string, now: number): { allowed: boolean; retryAfterSec: number } {
  const bucket = (ipAttempts.get(ip) ?? []).filter((t) => now - t < IP_WINDOW.ms);
  ipAttempts.set(ip, bucket);
  prune(ipAttempts, IP_WINDOW.ms, now);
  if (bucket.length < IP_WINDOW.max) return { allowed: true, retryAfterSec: 0 };
  const freesAt = bucket[bucket.length - IP_WINDOW.max] + IP_WINDOW.ms;
  return { allowed: false, retryAfterSec: Math.max(1, Math.ceil((freesAt - now) / 1000)) };
}

function recordIpAttempt(ip: string, now: number) {
  const bucket = ipAttempts.get(ip) ?? [];
  bucket.push(now);
  ipAttempts.set(ip, bucket);
}

function recordUserHit(map: Map<string, number[]>, userId: string, now: number) {
  const hits = map.get(userId) ?? [];
  hits.push(now);
  map.set(userId, hits);
  prune(map, USER_KEEP_MS, now);
}

function releaseRun(userId: string, startedAt: number) {
  const runs = inFlight.get(userId) ?? [];
  const i = runs.indexOf(startedAt);
  if (i >= 0) runs.splice(i, 1);
  if (runs.length) inFlight.set(userId, runs);
  else inFlight.delete(userId);
}

// ---------------------------------------------------------------------------
// Responses and input
// ---------------------------------------------------------------------------

function json(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...headers,
    },
  });
}

function tooMany(message: string, retryAfterSec: number, headers: Record<string, string>) {
  return json(429, { error: message }, { 'Retry-After': String(retryAfterSec), ...headers });
}

function minutesText(sec: number): string {
  if (sec < 90) return `${Math.max(1, Math.ceil(sec))} saniye`;
  if (sec < 90 * 60) return `${Math.ceil(sec / 60)} dakika`;
  return `${Math.ceil(sec / 3600)} saat`;
}

type PackInput = { prompt: string; group: string; count: number };

// Strict payload allowlist: { prompt, group, count? } and nothing else.
function parseInput(body: unknown): PackInput | { error: string } {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Geçersiz istek. Lütfen tekrar deneyin.' };
  }
  const b = body as Record<string, unknown>;
  const unknownKey = Object.keys(b).find((k) => !ALLOWED_KEYS.has(k));
  if (unknownKey) {
    return { error: `Bilinmeyen alan: "${unknownKey.slice(0, 30)}". Yalnızca prompt, group ve count gönderilebilir.` };
  }
  if (typeof b.prompt !== 'string' || !b.prompt.trim()) {
    return { error: 'Konu alanı boş olamaz. Örneğin: "6. sınıf 3. ünite yiyecekler, some/any".' };
  }
  if (b.prompt.trim().length > MAX_PROMPT_CHARS) {
    return { error: `Konu çok uzun. En fazla ${MAX_PROMPT_CHARS} karakter yazabilirsiniz.` };
  }
  if (typeof b.group !== 'string' || !GROUP_IDS.has(b.group)) {
    return { error: 'Geçersiz sınıf grubu. Lütfen listeden bir grup seçin.' };
  }
  let count = DEFAULT_COUNT;
  if (b.count !== undefined && b.count !== null) {
    if (typeof b.count !== 'number' || !Number.isInteger(b.count) || b.count < MIN_ITEMS || b.count > MAX_ITEMS) {
      return { error: `Soru sayısı ${MIN_ITEMS} ile ${MAX_ITEMS} arasında bir tam sayı olmalı.` };
    }
    count = b.count;
  }
  const prompt = b.prompt.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim();
  return { prompt, group: b.group, count };
}

// ---------------------------------------------------------------------------
// Word list (1.4 MB): loaded lazily on the server, once per instance, only
// when a generation actually runs. Without it the level check is skipped
// rather than failing the request. The picture-dictionary words (concrete
// young-learner vocabulary: body, weather, home, clothes...) are added as
// known words; the CEFR sets file several of them too high or miss them.
// ---------------------------------------------------------------------------
const lexicons = new Map<string, Set<string>>();

// Short, single-line error text for the server logs (Vercel function logs).
function errorText(e: unknown): string {
  const message = e instanceof Error ? e.message : String(e);
  return message.replace(/\s+/g, ' ').slice(0, 200);
}

async function pictureWords(): Promise<string[]> {
  try {
    const mod = await import('../../../data/pictures.json');
    const data = ((mod as { default?: unknown }).default ?? mod) as { topics?: { words?: { word?: unknown }[] }[] };
    return (data.topics ?? []).flatMap((t) => (t.words ?? []).map((w) => (typeof w.word === 'string' ? w.word : '')));
  } catch (e) {
    console.error('[classroom/pack] picture words not loaded:', errorText(e));
    return [];
  }
}

async function lexiconFor(level: string): Promise<Set<string> | null> {
  const cached = lexicons.get(level);
  if (cached) return cached;
  try {
    const [{ WORD_DATA }, extra] = await Promise.all([import('../../../data/words.js'), pictureWords()]);
    const lexicon = buildLexicon(WORD_DATA.sets, level, extra);
    lexicons.set(level, lexicon);
    return lexicon;
  } catch (e) {
    console.error('[classroom/pack] word list not loaded; level check skipped:', errorText(e));
    return null;
  }
}

// ---------------------------------------------------------------------------
// LLM call (OpenAI-compatible chat endpoint). The AbortSignal comes from
// generatePack: every chunk has its own timeout and the whole run a deadline.
// ---------------------------------------------------------------------------

// Some OpenAI-compatible providers reject response_format; after the first
// such 400 this instance stops sending it (the parser copes without it).
let jsonModeUnsupported = false;

// Output cap per chunk call: a chunk asks for at most ~10 items of roughly
// 150-250 tokens each, so this leaves room while stopping a runaway reply
// from billing until the timeout. A cut-off reply still yields its complete
// items (parseModelJson salvages them).
const MAX_TOKENS_PER_CHUNK = 3000;

async function callChat(input: {
  baseUrl: string;
  apiKey: string;
  model: string;
  messages: ChatMessage[];
  signal: AbortSignal;
  temperature?: number;
}): Promise<string> {
  const send = (jsonMode: boolean) =>
    fetch(`${input.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${input.apiKey}`,
      },
      body: JSON.stringify({
        model: input.model,
        messages: input.messages,
        temperature: input.temperature ?? 0.6,
        max_tokens: MAX_TOKENS_PER_CHUNK,
        ...(jsonMode ? { response_format: { type: 'json_object' } } : {}),
      }),
      signal: input.signal,
    });

  let res = await send(!jsonModeUnsupported);
  if (!res.ok && !jsonModeUnsupported && (res.status === 400 || res.status === 422)) {
    const detail = await res.text().catch(() => '');
    if (!/response_format|json_object/i.test(detail)) {
      throw new Error(`LLM HTTP ${res.status}: ${detail.slice(0, 200)}`);
    }
    jsonModeUnsupported = true;
    res = await send(false);
  }
  if (!res.ok) {
    const detail = await res.text().catch(() => '');
    throw new Error(`LLM HTTP ${res.status}: ${detail.slice(0, 200)}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: unknown }; finish_reason?: unknown }[];
    usage?: { completion_tokens?: unknown };
  };
  const choice = data?.choices?.[0];
  const finish = typeof choice?.finish_reason === 'string' ? choice.finish_reason : 'unknown';
  const content = choice?.message?.content;
  // Diagnostics only: status, finish reason and token counts, never the
  // prompt or the reply.
  if (finish === 'length') {
    console.warn(
      `[classroom/pack] reply cut at max_tokens (${MAX_TOKENS_PER_CHUNK}); completion_tokens=${String(data?.usage?.completion_tokens ?? '?')}`,
    );
  }
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error(`LLM empty content (finish_reason=${finish})`);
  }
  return content;
}

// ---------------------------------------------------------------------------
// Route
// ---------------------------------------------------------------------------


export const POST: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(pageCookieSource({ request, cookies }));
  if (!user) return json(401, { error: 'Yapay zekâ ile paket hazırlamak için oturum açmanız gerekiyor.' });

  // Body: at most 4 KB of JSON. Read and validated before any quota logic, so
  // the quota check and the reservation below can run without an await.
  const declaredLength = Number(request.headers.get('content-length') ?? 0);
  if (declaredLength > MAX_REQUEST_BYTES) return json(413, { error: 'İstek gövdesi çok büyük.' });
  let body: unknown;
  try {
    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_REQUEST_BYTES) {
      return json(413, { error: 'İstek gövdesi çok büyük.' });
    }
    body = JSON.parse(rawBody);
  } catch {
    return json(400, { error: 'Geçersiz istek. Lütfen tekrar deneyin.' });
  }
  const input = parseInput(body);
  if ('error' in input) return json(400, { error: input.error });

  const baseUrl = (import.meta.env.LLM_BASE_URL || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, '');
  const apiKey = import.meta.env.LLM_API_KEY;
  const model = import.meta.env.LLM_MODEL_FAST || import.meta.env.LLM_MODEL || 'deepseek-v4-pro';
  if (!apiKey) {
    return json(503, { error: 'Yapay zekâ paket üretici şu anda yapılandırılmamış. Lütfen daha sonra tekrar deneyin.' });
  }

  // Check and reserve in one synchronous block: no await from here until the
  // run is recorded, so parallel requests see each other's reservations.
  const now = Date.now();
  const quota = userQuota(user.id, now);
  if (!quota.allowed) {
    const message = quota.busy
      ? 'Önceki paketiniz hâlâ hazırlanıyor. O bitince tekrar deneyin.'
      : `Paket üretme sınırına ulaştınız. Lütfen ${minutesText(quota.retryAfterSec)} sonra tekrar deneyin.`;
    return tooMany(message, quota.retryAfterSec, quota.headers);
  }
  const ip = clientKey(request);
  const ipState = ipQuota(ip, now);
  if (!ipState.allowed) {
    return tooMany(
      `Bu ağdan çok fazla paket isteği geldi. Lütfen ${minutesText(ipState.retryAfterSec)} sonra tekrar deneyin.`,
      ipState.retryAfterSec,
      quota.headers,
    );
  }
  recordIpAttempt(ip, now);
  recordUserHit(userAttempts, user.id, now);
  inFlight.set(user.id, [...(inFlight.get(user.id) ?? []), now]);

  // From here on the slot is always released. Headers leave this run itself
  // out of the in-flight count.
  const headers = () => userQuota(user.id, Date.now(), 1).headers;
  try {
    const profile = audienceProfile(input.group);
    const lexicon = await lexiconFor(profile.level);
    let result: Awaited<ReturnType<typeof generatePack>>;
    try {
      result = await generatePack({
        prompt: input.prompt,
        profile,
        count: input.count,
        lexicon,
        // A client that disconnects aborts every chunk call.
        signal: request.signal,
        // Failed chunk calls are logged (HTTP status and provider message,
        // never the prompt); aborted ones (timeout, deadline, client gone)
        // are not errors.
        callModel: (messages, { signal }) =>
          callChat({ baseUrl, apiKey, model, messages, signal }).catch((e: unknown) => {
            if (!signal.aborted) console.warn('[classroom/pack] chunk failed:', errorText(e));
            throw e;
          }),
        // The answer check wants the model's single best reading, not variety.
        checkModel: (messages, { signal }) =>
          callChat({ baseUrl, apiKey, model, messages, signal, temperature: 0 }).catch((e: unknown) => {
            if (!signal.aborted) console.warn('[classroom/pack] check failed:', errorText(e));
            throw e;
          }),
      });
      // One line per run (no user data) so slow or failing runs show up in the logs.
      const s = result.stats;
      console.info(`[classroom/pack] ${result.ok ? 'ok' : result.code} group=${input.group} model=${model} asked=${s.requested} received=${s.received} kept=${s.kept} checked=${s.checked} dropped=${result.dropped.length} write=${s.writeMs}ms total=${s.ms}ms`);
    } catch (e) {
      console.error('[classroom/pack] generation failed:', errorText(e));
      return json(502, { error: 'Yapay zekâ yanıtı alınamadı. Lütfen birkaç dakika sonra tekrar deneyin.' }, headers());
    }

    if (result.ok) {
      recordUserHit(userSuccesses, user.id, Date.now());
      const { pack, warnings, dropped, stats } = result;
      return json(200, { pack, warnings, dropped, stats }, headers());
    }

    switch (result.code) {
      case 'refused':
        return json(
          422,
          {
            error: profile.young
              ? 'Bu metinden çocuklara uygun İngilizce ders içeriği hazırlanamadı. Lütfen okula uygun bir dil konusu yazın (ör. "hayvanlar, have got").'
              : 'Bu metinden İngilizce ders içeriği hazırlanamadı. Lütfen bir dil konusu yazın (ör. "past simple, travel").',
            reason: result.reason,
          },
          headers(),
        );
      case 'timeout':
        console.warn(`[classroom/pack] no chunk answered in time (model=${model}, ${result.stats.ms} ms)`);
        return json(504, { error: 'Yapay zekâ zamanında yanıt vermedi. Lütfen biraz sonra tekrar deneyin.' }, headers());
      case 'too-few':
        return json(
          502,
          {
            error: `Yeterince uygun soru çıkmadı (${result.stats.kept}/${MIN_ITEMS}). Konuyu biraz daha netleştirip tekrar deneyin.`,
            reasons: result.reason,
            warnings: result.warnings,
            dropped: result.dropped,
            stats: result.stats,
          },
          headers(),
        );
      default:
        console.error(`[classroom/pack] ${result.code} (model=${model}): ${result.warnings.join(' | ').slice(0, 300)}`);
        return json(502, { error: 'Yapay zekâ yanıtı alınamadı. Lütfen birkaç dakika sonra tekrar deneyin.' }, headers());
    }
  } finally {
    releaseRun(user.id, now);
  }
};

// The setup page asks once whether the teacher is signed in, so it can say
// so before anyone types a topic. No model call, no rate limit.
export const GET: APIRoute = async ({ request, cookies }) => {
  const user = await getSessionUser(pageCookieSource({ request, cookies }));
  return json(200, { signedIn: !!user });
};
