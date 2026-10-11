// Learning path ("Bugünün görevi") and vocabulary path: pure rules shared by
// the pages, the API and the tests. The database functions in
// supabase/migrations/20261014_learning_path.sql apply the same numbers.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const PASS = 85;
export const TASKS = ['grammar', 'reading', 'listening', 'writing', 'speaking'];
export const TASK_LABELS = { grammar: 'Dilbilgisi', reading: 'Okuma', listening: 'Dinleme', writing: 'Yazma', speaking: 'Konuşma' };
export const TASK_XP = { grammar: 20, reading: 20, listening: 20, writing: 25, speaking: 25 };
export const DAYS_PER_LEVEL = 120; // four months, a mission every day
export const LEVEL_XP = DAYS_PER_LEVEL * Object.values(TASK_XP).reduce((a, b) => a + b, 0);
export const WORDS_PER_DAY = 13;
export const CARD_SECONDS = 12;
export const VOCAB_DAY_XP = 30;
export const MASTERED_BOX = 4; // learned four times in a row with growing gaps (16+ days)
export const VOCAB_LEVEL_UP = 0.85;

export const nextLevel = (l) => LEVELS[Math.min(LEVELS.indexOf(l) + 1, LEVELS.length - 1)];

// --- stable shuffle of options (correct answer is authored first) ----------
function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function rng(seed) {
  let s = seed >>> 0 || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function shuffleOrder(key, n) {
  const order = Array.from({ length: n }, (_, i) => i);
  const r = rng(hash('opt:' + key));
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}

/**
 * Multiple-choice questions as shown to the learner: options shuffled, no key.
 * `qs` = [{ q, o: [correct, ...], why? }], `key` makes the order stable per task.
 */
export function presentQuestions(qs, key) {
  return qs.map((x, i) => {
    const order = shuffleOrder(`${key}#${i}`, x.o.length);
    return { q: x.q, o: order.map((k) => x.o[k]) };
  });
}

/** Score answers (indexes in the shown order) against the authored questions. */
export function scoreQuestions(qs, key, choices) {
  let correct = 0;
  const review = qs.map((x, i) => {
    const order = shuffleOrder(`${key}#${i}`, x.o.length);
    const answer = order.indexOf(0);
    const choice = Number.isInteger(choices?.[i]) ? choices[i] : -1;
    const ok = choice === answer;
    if (ok) correct++;
    return { ok, choice, answer, why: x.why || null };
  });
  const score = qs.length ? Math.round((correct / qs.length) * 100) : 0;
  return { score, correct, total: qs.length, passed: score >= PASS, review };
}

// --- speaking: how closely a transcript matches the sentence to read --------
export function words(text) {
  return String(text || '').toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i')
    .replace(/[’']/g, "'")
    .replace(/[^a-z0-9' ]+/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}
/** 0..100: share of target words said, in order (word-level edit distance). */
export function readAloudScore(target, transcript) {
  const a = words(target), b = words(transcript);
  if (!a.length) return 0;
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i, ...Array(b.length).fill(0)]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) {
    d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  }
  return Math.max(0, Math.round((1 - d[a.length][b.length] / a.length) * 100));
}

export function countWords(text) {
  return words(text).length;
}

// --- vocabulary path ---------------------------------------------------------
/**
 * Today's vocabulary session: the next new words of the learner's level (in
 * list order, never seen before) plus cards that are due, most overdue first.
 * `cards` = [{ word_id, due_on, box }], `today` = 'YYYY-MM-DD'.
 */
export function vocabSession(list, cards, today, { perDay = WORDS_PER_DAY, maxReviews = 30 } = {}) {
  const seen = new Set(cards.map((c) => c.word_id));
  const fresh = list.filter((w) => !seen.has(w.id)).slice(0, perDay);
  const byId = new Map(list.map((w) => [w.id, w]));
  const due = cards
    .filter((c) => c.due_on <= today)
    .sort((x, y) => (x.due_on < y.due_on ? -1 : x.due_on > y.due_on ? 1 : x.box - y.box))
    .slice(0, maxReviews)
    .map((c) => byId.get(c.word_id))
    .filter(Boolean);
  return { fresh, due };
}

/**
 * Listen-and-choose question for a word: the word plus three look-alike words
 * from the same list (similar length and start), in a stable order.
 */
export function listenChoices(word, list) {
  const target = word.word.toLowerCase();
  const score = (w) => {
    const x = w.word.toLowerCase();
    let s = Math.abs(x.length - target.length);
    if (x[0] !== target[0]) s += 2;
    if (x.slice(-2) === target.slice(-2)) s -= 1;
    return s;
  };
  const pool = list.filter((w) => w.id !== word.id && w.word.toLowerCase() !== target && !w.word.includes(' ') === !word.word.includes(' '));
  const picks = pool
    .map((w) => ({ w, s: score(w) + (hash(word.id + w.id) % 100) / 100 }))
    .sort((a, b) => a.s - b.s)
    .slice(0, 3)
    .map((x) => x.w.word);
  const options = [word.word, ...picks];
  const order = shuffleOrder('listen:' + word.id, options.length);
  return { options: order.map((i) => options[i]), answer: order.indexOf(0) };
}

/** Share of a level's words the learner has mastered (0..1). */
export function vocabMastery(list, cards) {
  if (!list.length) return 0;
  const ids = new Set(list.map((w) => w.id));
  const mastered = cards.filter((c) => ids.has(c.word_id) && c.box >= MASTERED_BOX).length;
  return mastered / list.length;
}

/** XP progress inside a mission level, 0..1. */
export function levelProgress(missionDay, days = DAYS_PER_LEVEL) {
  return Math.max(0, Math.min(1, (missionDay - 1) / days));
}
