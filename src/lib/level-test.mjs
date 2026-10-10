// Languago level test v2: four adaptive sections (vocabulary, grammar,
// reading, listening). Pure functions shared by the test page and the server.
//
// Model: each item has a difficulty b (A1 = 1 ... C2 = 6). A learner's ability
// theta on the same scale answers an item correctly with probability
// 1 / (1 + e^(-A (theta - b))). After every answer theta is re-estimated
// (maximum a posteriori over a grid), and the next item is taken from the
// level closest to theta, which is where an answer tells us the most.

export const LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const SECTIONS = Object.freeze([
  { key: 'vocab', label: 'Kelime', kind: 'item', count: 12 },
  { key: 'grammar', label: 'Dilbilgisi', kind: 'item', count: 12 },
  { key: 'reading', label: 'Okuma', kind: 'unit', count: 3 },
  { key: 'listening', label: 'Dinleme', kind: 'unit', count: 4 },
]);
export const SKILL_LABELS = { vocab: 'Kelime', grammar: 'Dilbilgisi', reading: 'Okuma', listening: 'Dinleme' };

const A = 1.7; // discrimination
const PRIOR_SD = 1.25;
const GRID = Array.from({ length: 141 }, (_, i) => 0 + i * 0.05); // 0 .. 7
// "At level L" = about 65 % right on level-L items: theta >= L + 0.36.
const MASTERY = Math.log(0.65 / 0.35) / A;

export const levelB = (level) => LEVELS.indexOf(level) + 1;

/** Start ability from the learner's own description (0 = beginner ... 4 = advanced). */
export function startTheta(selfReport) {
  return [1.4, 2.2, 3.0, 3.8, 4.6][Math.max(0, Math.min(4, Number(selfReport) || 2))];
}

/** MAP estimate of ability from responses [{ b, correct }] around `prior`. */
export function estimate(responses, prior = 3) {
  let best = prior, bestLp = -Infinity;
  const lps = GRID.map((t) => {
    let lp = -((t - prior) ** 2) / (2 * PRIOR_SD ** 2);
    for (const r of responses) {
      const p = 1 / (1 + Math.exp(-A * (t - r.b)));
      lp += Math.log(r.correct ? p : 1 - p);
    }
    if (lp > bestLp) { bestLp = lp; best = t; }
    return lp;
  });
  // Spread of the posterior, for "how sure are we".
  const w = lps.map((lp) => Math.exp(lp - bestLp));
  const sum = w.reduce((a, b) => a + b, 0);
  const mean = GRID.reduce((a, t, i) => a + t * w[i], 0) / sum;
  const sd = Math.sqrt(GRID.reduce((a, t, i) => a + (t - mean) ** 2 * w[i], 0) / sum);
  return { theta: Math.round(best * 100) / 100, sd: Math.round(sd * 100) / 100 };
}

/** CEFR level for an ability, plus how far along the next level the learner is (0..1). */
export function levelOf(theta) {
  const x = theta - MASTERY;
  const i = Math.max(1, Math.min(6, Math.floor(x)));
  const progress = i === 6 ? 1 : Math.max(0, Math.min(1, x - i));
  return { level: LEVELS[i - 1], progress: Math.round(progress * 100) / 100, below: x < 1 };
}

// --- seeded randomness (same seed, same test) -------------------------------
export function rng(seed) {
  let s = (Number(seed) >>> 0) || 1;
  return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
}
export function hash(text) {
  let h = 2166136261;
  for (const c of String(text)) { h ^= c.codePointAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

// --- session ----------------------------------------------------------------
export function createSession({ selfReport = 2, seed = Date.now() } = {}) {
  return { version: 2, seed: Number(seed) >>> 0, selfReport: Number(selfReport) || 0, section: 0, answers: [], units: [] };
}

/** Responses of one skill as { b, correct }. */
function responses(state, skill) {
  return state.answers.filter((a) => a.skill === skill).map((a) => ({ b: a.b, correct: a.correct }));
}

/** Prior for a section: the self-report for the first, then what earlier sections showed. */
function sectionPrior(state, index) {
  const done = SECTIONS.slice(0, index).map((s) => responses(state, s.key)).filter((r) => r.length);
  if (!done.length) return startTheta(state.selfReport);
  const thetas = done.map((r, i) => estimate(r, startTheta(state.selfReport)).theta);
  return thetas.reduce((a, b) => a + b, 0) / thetas.length;
}

function pickByLevel(candidates, theta, rand) {
  if (!candidates.length) return null;
  const target = Math.max(1, Math.min(6, Math.round(theta)));
  let bestDist = Infinity;
  for (const c of candidates) bestDist = Math.min(bestDist, Math.abs(levelB(c.level) - target));
  const near = candidates.filter((c) => Math.abs(levelB(c.level) - target) === bestDist);
  return near[Math.floor(rand() * near.length)];
}

/**
 * What comes next: { type: 'item', section, item } | { type: 'unit', section, unit }
 * | { type: 'done' }. `bank` = { items: [...], units: [...] } (answers not needed).
 */
export function nextStep(state, bank) {
  for (let s = state.section; s < SECTIONS.length; s++) {
    const sec = SECTIONS[s];
    const rand = rng(state.seed + hash(sec.key) + state.answers.length * 7919);
    const prior = sectionPrior(state, s);
    const theta = estimate(responses(state, sec.key), prior).theta;
    if (sec.kind === 'item') {
      const asked = state.answers.filter((a) => a.skill === sec.key).length;
      if (asked >= sec.count) continue;
      const used = new Set(state.answers.map((a) => a.id));
      const item = pickByLevel(bank.items.filter((i) => i.skill === sec.key && !used.has(i.id)), theta, rand);
      if (!item) continue;
      return { type: 'item', section: s, item, theta };
    }
    const done = state.units.filter((u) => u.skill === sec.key).length;
    if (done >= sec.count) continue;
    const used = new Set(state.units.map((u) => u.id));
    const unit = pickByLevel(bank.units.filter((u) => u.skill === sec.key && !used.has(u.id)), theta, rand);
    if (!unit) continue;
    return { type: 'unit', section: s, unit, theta };
  }
  return { type: 'done' };
}

/** Record one answer. `meta` = { id, skill, level } of the item; `unitId` for reading/listening. */
export function recordAnswer(state, meta, choice, correct, unitId = null) {
  const next = { ...state, answers: [...state.answers, { id: meta.id, skill: meta.skill, b: levelB(meta.level), choice, correct: !!correct }] };
  next.section = Math.max(state.section, SECTIONS.findIndex((s) => s.key === meta.skill));
  if (unitId && !state.units.some((u) => u.id === unitId)) next.units = [...state.units, { id: unitId, skill: meta.skill }];
  return next;
}

/** Final result from answers [{ skill, b, correct }]. */
export function result(answers, selfReport = 2) {
  const skills = {};
  const thetas = [];
  for (const sec of SECTIONS) {
    const r = answers.filter((a) => a.skill === sec.key).map((a) => ({ b: a.b, correct: a.correct }));
    if (!r.length) continue;
    const e = estimate(r, startTheta(selfReport));
    skills[sec.key] = { ...levelOf(e.theta), theta: e.theta, sd: e.sd, answered: r.length, correct: r.filter((x) => x.correct).length };
    thetas.push(e.theta);
  }
  const mean = thetas.length ? thetas.reduce((a, b) => a + b, 0) / thetas.length : startTheta(selfReport);
  const overall = { ...levelOf(mean), theta: Math.round(mean * 100) / 100 };
  const ranked = Object.entries(skills).sort((a, b) => b[1].theta - a[1].theta).map(([k]) => k);
  return { version: 2, overall, skills, strongest: ranked[0] ?? null, weakest: ranked.length > 1 ? ranked[ranked.length - 1] : null };
}

/** A fixed order of an item's options (correct answer authored first), per item id. */
export function optionOrder(id, n) {
  const order = Array.from({ length: n }, (_, i) => i);
  const rand = rng(hash('order:' + id));
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
  return order;
}
