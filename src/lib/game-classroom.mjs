export function buildCuratedClassTopics({ level, levelLabel, grammar, mcqGroups } = {}) {
  const units = Array.isArray(grammar?.units) ? grammar.units : [];
  const groups = mcqGroups && typeof mcqGroups === 'object' ? mcqGroups : {};
  const topics = [];
  for (const unit of units) {
    const raw = Array.isArray(groups[unit.id]) ? groups[unit.id] : [];
    const qs = dedupeQuestions(raw).filter(isValidMcq).map((q, index) => normalizeQuestion(q, `${level}:${unit.id}:${index}`));
    if (qs.length < 20) continue;
    topics.push({
      level,
      levelLabel,
      id: unit.id,
      title: unit.title || unit.short || unit.id,
      short: unit.short || unit.title || unit.id,
      objective: unit.objective || unit.summary_note || unit.short || 'Doğru seçeneği açıklamasıyla seç.',
      qs,
    });
  }
  return topics;
}

export function createClassBoard({ topic, gridSize = 24, powerRate = 0.2, seed = 'class' } = {}) {
  const grid = Math.max(1, Math.floor(gridSize || 24));
  const powerCount = Math.max(0, Math.min(grid, Math.round(grid * Number(powerRate || 0))));
  const numbers = range(grid);
  const powerNums = new Set(shuffleSeeded(numbers, `${seed}:power`).slice(0, powerCount));
  const questions = shuffleSeeded(Array.isArray(topic?.qs) ? topic.qs : [], `${seed}:questions`);
  let qi = 0;
  const tiles = numbers.map((n) => {
    if (powerNums.has(n)) return { n, kind: 'power' };
    const q = questions[qi++] || null;
    return q ? { n, kind: 'question', question: q } : { n, kind: 'empty' };
  });
  return { gridSize: grid, tiles, shownIds: tiles.filter((t) => t.question).map((t) => t.question.id) };
}

export function answerClassQuestion(state, { questionId, correct, points = 0, team = null } = {}) {
  if (!state || !questionId) return { accepted: false, reason: 'missing-question' };
  state.answered ||= {};
  if (state.answered[questionId]) return { accepted: false, reason: 'already-answered' };
  const active = Number.isInteger(team) ? team : Number(state.active || 0);
  state.answered[questionId] = { correct: !!correct, team: active };
  if (correct) {
    state.scores ||= [];
    state.scores[active] = Number(state.scores[active] || 0) + Number(points || 0);
  }
  return { accepted: true };
}

export function classQuestionFeedback(question, chosenIdx) {
  const options = Array.isArray(question?.o) ? question.o : (Array.isArray(question?.options) ? question.options : []);
  const answerIdx = Number.isInteger(question?.a) ? question.a : -1;
  const chosen = options[chosenIdx] ?? '';
  const answer = options[answerIdx] ?? '';
  const why = explanationFor(question, chosenIdx) || explanationFor(question, answerIdx) || (typeof question?.why === 'string' ? question.why : 'Kuralı sınıfça açıklayın.');
  return { correct: chosenIdx === answerIdx, message: `Seçilen cevap: ${chosen || '—'} · Doğru cevap: ${answer || '—'} · ${why}` };
}

function normalizeQuestion(q, id) {
  return {
    id,
    q: String(q.q || ''),
    o: (q.o || q.options || []).map(String),
    a: Number(q.a),
    why: q.why || null,
    objective: q.objective || null,
    t: q.t || 3,
  };
}

function isValidMcq(q) {
  const opts = q.o || q.options;
  return !!q.q && Array.isArray(opts) && opts.length >= 4 && Number.isInteger(q.a) && q.a >= 0 && q.a < opts.length;
}

function dedupeQuestions(items) {
  const seen = new Set();
  const out = [];
  for (const item of Array.isArray(items) ? items : []) {
    const key = String(item?.q || '').toLowerCase().trim().replace(/\s+/g, ' ');
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

function explanationFor(q, idx) {
  if (Array.isArray(q?.why) && idx >= 0 && idx < q.why.length && q.why[idx]) return String(q.why[idx]);
  return '';
}

function range(n) {
  return Array.from({ length: n }, (_, i) => i + 1);
}

function shuffleSeeded(a, seed) {
  const arr = a.slice();
  const rng = mulberry32(hashSeed(seed));
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
