// Vocabulary analysis: which words does the learner already know?
// Quick Turkish → English questions from the level word lists (A1, A2, B1 so
// far), adaptive by level band: start one band below the level test's
// vocabulary level, move up when a band is 85 %+ known.
import { parseWordList, wordId } from './word-id.mjs';
import a1Text from '../data/wordlists/a1-words.txt?raw';
import a1TrText from '../data/wordlists/a1-tr.txt?raw';
import a2Text from '../data/wordlists/a2-words.txt?raw';
import b1Text from '../data/wordlists/b1-words.txt?raw';
import a1Cards from '../data/vocab/a1.json';

export const ANALYSIS_TARGET = 600;
export const ANALYSIS_UNLOCK = 400;
export const BATCH = 25;
const BANDS = ['A1', 'A2', 'B1'] as const;
type Word = { id: string; level: string; word: string; tr: string };

let cache: Record<string, Word[]> | null = null;
export function bandWords(): Record<string, Word[]> {
  if (cache) return cache;
  const trA1 = new Map(parseWordList(a1TrText).map((r: any) => [r.key, r.tr]));
  const cardTr = new Map((a1Cards as any[]).map((c) => [c.word, c.tr]));
  const build = (level: string, text: string, extraTr?: (r: any) => string | null) =>
    parseWordList(text).map((r: any) => ({ id: wordId(level, r.word, r.hint, r.dup), level, word: r.word, tr: r.tr || (extraTr ? extraTr(r) : null) || '' }))
      .filter((w: Word) => w.tr);
  cache = {
    A1: build('A1', a1Text, (r) => trA1.get(r.key) || cardTr.get(r.word) || null),
    A2: build('A2', a2Text),
    B1: build('B1', b1Text),
  };
  return cache;
}

export type Check = { word_id: string; level: string; known: boolean };
const pct = (xs: Check[]) => (xs.length ? xs.filter((c) => c.known).length / xs.length : 0);

/** Where to ask next and which vocabulary level to set, from the answers so far. */
export function plan(checks: Check[], testLevel: string | null) {
  const idx = (l: string | null) => Math.max(0, BANDS.indexOf((l || 'A1') as any));
  const start = Math.max(0, Math.min(BANDS.length - 1, idx(testLevel) - 1));
  let current = start;
  for (let i = BANDS.length - 1; i >= 0; i--) if (checks.some((c) => c.level === BANDS[i])) { current = Math.max(i, start); break; }
  const inBand = checks.filter((c) => c.level === BANDS[current]);
  if (inBand.length >= BATCH && pct(inBand.slice(-50)) >= 0.85 && current < BANDS.length - 1) current++;
  // vocabulary level: the first band (from the start) that is not 85 % known
  let vocabLevel: string = BANDS[start];
  for (let i = start; i < BANDS.length; i++) {
    const b = checks.filter((c) => c.level === BANDS[i]);
    vocabLevel = BANDS[i];
    if (b.length < BATCH || pct(b) < 0.85) break;
  }
  return { band: BANDS[current], vocabLevel };
}

function shuffle<T>(a: T[]): T[] { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

/** The next batch of questions: Turkish prompt, four English options (the key stays on the server). */
export function nextBatch(checks: Check[], testLevel: string | null) {
  const words = bandWords();
  const asked = new Set(checks.map((c) => c.word_id));
  let { band } = plan(checks, testLevel);
  let pool = words[band].filter((w) => !asked.has(w.id));
  const order = BANDS.indexOf(band as any);
  if (!pool.length) for (let i = order + 1; i < BANDS.length && !pool.length; i++) { band = BANDS[i]; pool = words[band].filter((w) => !asked.has(w.id)); }
  const pick = shuffle(pool).slice(0, BATCH);
  return pick.map((w) => {
    const others = shuffle(words[w.level].filter((o) => o.id !== w.id && o.word.toLowerCase() !== w.word.toLowerCase() && o.tr !== w.tr)).slice(0, 3).map((o) => o.word);
    const options = shuffle([w.word, ...others]);
    return { id: w.id, tr: w.tr, options };
  });
}

let byId: Map<string, Word> | null = null;
export function wordById(id: string): Word | null {
  if (!byId) byId = new Map(Object.values(bandWords()).flat().map((w) => [w.id, w]));
  return byId.get(id) || null;
}

/** Turn answers [{ id, choice }] into checks; a missing choice ("Bilmiyorum") counts as not known. */
export function scoreAnswers(answers: unknown): { id: string; level: string; known: boolean }[] {
  if (!Array.isArray(answers)) return [];
  const out: { id: string; level: string; known: boolean }[] = [];
  const seen = new Set<string>();
  for (const a of answers.slice(0, BATCH)) {
    const w = wordById(String((a as any)?.id || ''));
    if (!w || seen.has(w.id)) continue;
    seen.add(w.id);
    const choice = typeof (a as any).choice === 'string' ? (a as any).choice.trim().toLowerCase() : '';
    out.push({ id: w.id, level: w.level, known: choice !== '' && choice === w.word.toLowerCase() });
  }
  return out;
}

/** The vocabulary level the level test suggested (or its overall level). */
export async function testVocabLevel(sb: any, userId: string): Promise<string | null> {
  const { data } = await sb.from('student_progress').select('payload').eq('student_id', userId).eq('module', 'placement-test').maybeSingle();
  const p = data?.payload || {};
  return p.skills?.vocab?.level || (typeof p.level === 'string' ? p.level : null);
}
