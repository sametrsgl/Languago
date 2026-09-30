// Content packs (lg.pack/1): one format for built-in topics and AI packs,
// so the same pack can be played in every compatible game.
import { shuffleSeeded, rngFor } from './rng.mjs';
import { blankParts, fillBlanks } from './dom.mjs';

export const PACK_SCHEMA = 'lg.pack/1';

// A gap item the stage cannot show correctly:
//  'multi-blank'  several blanks whose key can't be split across them;
//  'doubled-word' the filled sentence repeats a word ("a big house house").
export function blankProblem(stem, key) {
  const s = String(stem || '');
  const n = (s.match(/_{2,}/g) || []).length;
  if (!n) return null;
  if (n >= 2 && !blankParts(s, key)) return 'multi-blank';
  // Checked per sentence ("Who is he? — He is…" is fine), and real English
  // doubles like "had had" / "that that" are allowed.
  const OK_DOUBLES = new Set(['had', 'that']);
  const sentences = fillBlanks(s, key).toLowerCase().replace(/\([^)]*\)/g, ' ').split(/[.?!;:—–]+/);
  for (const sentence of sentences) {
    const words = sentence.split(/[^a-z']+/).filter(Boolean);
    for (let i = 1; i < words.length; i++) {
      if (words[i] === words[i - 1] && words[i].length > 1 && !OK_DOUBLES.has(words[i])) return 'doubled-word';
    }
  }
  return null;
}

// Item types the first wave understands. Later games add more.
export const ITEM_TYPES = ['mcq', 'tf', 'gap', 'vocab', 'qa'];

export function makePack({ id, title, level, origin = 'builtin', topic = null, items = [] }) {
  return { schema: PACK_SCHEMA, id, title, level, origin, topic, items };
}

// Built-in grammar unit (curated MCQ bank) -> pack.
export function grammarTopicToPack(topic, levelLabel) {
  const items = (topic.qs || []).map((q, i) => ({
    id: q.id || `${topic.id}:${i}`,
    type: 'mcq',
    stem: String(q.q || ''),
    options: (q.o || []).map(String),
    answer: Number(q.a),
    whyOpt: Array.isArray(q.why) ? q.why.map((w) => String(w || '')) : null,
    whyTr: typeof q.why === 'string' ? q.why : null,
    rule: topic.short || null,
    target: topic.title,
    unit: topic.id,
    level: topic.level,
  }));
  return makePack({
    id: `builtin:grammar:${topic.id}`,
    title: topic.title,
    level: levelLabel || String(topic.level || '').toUpperCase(),
    origin: 'builtin',
    topic: { kind: 'grammar', unit: topic.id, short: topic.short || '' },
    items,
  });
}

export function wordCount(text) {
  return String(text || '').trim().split(/\s+/).filter(Boolean).length;
}

// Structural checks every item must pass before it reaches a board.
export function validateItem(item) {
  const problems = [];
  if (!item || typeof item !== 'object') return { ok: false, problems: ['not-an-object'] };
  if (!ITEM_TYPES.includes(item.type)) problems.push('unknown-type');
  if (item.type === 'mcq') {
    const opts = Array.isArray(item.options) ? item.options : [];
    if (!String(item.stem || '').trim()) problems.push('empty-stem');
    if (opts.length < 2 || opts.length > 4) problems.push('option-count');
    if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= opts.length) problems.push('answer-index');
    const norm = opts.map((o) => String(o).trim().toLowerCase());
    if (new Set(norm).size !== norm.length) problems.push('duplicate-options');
    if (norm.some((o) => !o)) problems.push('empty-option');
  }
  if (item.type === 'vocab') {
    if (!String(item.term || '').trim()) problems.push('empty-term');
  }
  if (item.type === 'tf') {
    if (!String(item.statement || '').trim()) problems.push('empty-statement');
    if (typeof item.isTrue !== 'boolean') problems.push('no-truth');
  }
  return { ok: problems.length === 0, problems };
}

// Pick the items for a board: N on tiles plus a ~30% reserve for "↻ değiştir"
// and for the kids' second try with a fresh item.
export function itemsForBoard(pack, count, seed, { wordCap = 0 } = {}) {
  const valid = (pack?.items || []).filter((it) => validateItem(it).ok);
  let shuffled = shuffleSeeded(valid, `${seed}:items`);
  // Items within the group's prompt word cap go first; longer ones only fill gaps.
  if (wordCap > 0) {
    const len = (it) => wordCount(it.stem || it.statement || '');
    const fits = shuffled.filter((it) => len(it) <= wordCap);
    const long = shuffled.filter((it) => len(it) > wordCap).sort((x, y) => len(x) - len(y));
    shuffled = [...fits, ...long];
  }
  const onBoard = shuffled.slice(0, count);
  const reserve = shuffled.slice(count);
  return { onBoard, reserve, short: Math.max(0, count - onBoard.length) };
}

// How an MCQ is shown to this audience: young A1/A2 classes get 3 big options.
// The distractor dropped is chosen by seed, the key is always kept, and the
// option order is shuffled once so it matches what every team sees.
export function presentMcq(item, optionCount, seed) {
  const all = item.options.map((text, i) => ({ text, correct: i === item.answer, why: item.whyOpt ? item.whyOpt[i] || '' : '' }));
  let kept = all;
  if (optionCount < all.length) {
    const wrong = shuffleSeeded(all.filter((o) => !o.correct), `${seed}:drop`);
    kept = [all.find((o) => o.correct), ...wrong.slice(0, optionCount - 1)];
  }
  const order = shuffleSeeded(kept, `${seed}:order`);
  return { options: order, answer: order.findIndex((o) => o.correct) };
}

// A picture word as a question. Two directions:
//  'find'  (A1 young learners): hear/read "Where's the banana?", pick one of 2-3 pictures;
//  'name'  (everyone else): see the picture, pick the word.
// Distractors come from the same topic, chosen by seed, never sharing the picture.
export function presentVocab(item, pool, optionCount, direction, seed) {
  const others = shuffleSeeded(
    // Never offer a word the class could argue about (same confusable group, e.g.
    // whale/dolphin/fish), and never mix colour and shape words.
    (pool || []).filter((it) => it.type === 'vocab' && it.id !== item.id && it.term !== item.term && (!it.pic || it.pic !== item.pic) && (!item.topic || it.topic === item.topic)
      && !(item.cg && it.cg === item.cg) && (!item.cat || it.cat === item.cat)),
    `${seed}:vocab`,
  ).slice(0, Math.max(1, optionCount - 1));
  const choices = [item, ...others].map((it) => ({ text: it.term, img: it.pic || null, correct: it === item, why: '' }));
  const options = shuffleSeeded(choices, `${seed}:order`);
  const find = direction === 'find';
  return {
    kind: 'vocab',
    direction: find ? 'find' : 'name',
    stem: find ? (item.find || `Where's the ${item.term}?`) : (item.q || 'What is it?'),
    img: find ? null : item.pic || null,
    optionImgs: find,
    options,
    answer: options.findIndex((o) => o.correct),
    say: item.say || item.term,
  };
}

// First-letter and 50:50 hints for an MCQ, computed, never stored.
export function mcqHint(presented, kind, seed) {
  const key = presented.options[presented.answer];
  if (kind === 'first-letter') return { kind, text: `${String(key.text).trim().charAt(0).toUpperCase()}…` };
  if (kind === 'fifty') {
    const rng = rngFor(`${seed}:fifty`);
    const wrong = presented.options.map((o, i) => (o.correct ? -1 : i)).filter((i) => i >= 0);
    const removeCount = Math.max(0, presented.options.length - 2);
    const removed = [];
    while (removed.length < removeCount && wrong.length) {
      removed.push(wrong.splice(Math.floor(rng() * wrong.length), 1)[0]);
    }
    return { kind, removed };
  }
  return { kind, text: '' };
}

// One rung of a level's hint ladder for this item as it is shown, or null
// when the item has nothing to give for that kind. A hint costs points, so
// a kind that would show an empty box is never offered.
//  'first-letter'  the key's first letter (not when the prompt already says the word)
//  'fifty'         two wrong options go (needs 3+ options)
//  'listen'        heard, not shown: the app reads the prompt, or asks the teacher to
//  'turkish'       the Turkish gloss of a picture word
//  'example', 'definition'  from the item's own data, with the key blanked out
// 'picture' has no content source yet, so it is never offered.
export function itemHint(item, presented, kind, seed) {
  if (!presented || !Array.isArray(presented.options) || !presented.options[presented.answer]) return null;
  const key = presented.options[presented.answer];
  const find = presented.direction === 'find';
  switch (kind) {
    case 'first-letter':
      return !find && String(key.text || '').trim() ? mcqHint(presented, kind, seed) : null;
    case 'fifty':
      return presented.options.length > 2 ? mcqHint(presented, kind, seed) : null;
    case 'listen':
      // "What is it?" under a picture: hearing it again tells nothing.
      return presented.kind === 'vocab' && !find ? null : { kind };
    case 'turkish': {
      const tr = String(item?.tr || '').trim();
      const same = tr.toLocaleLowerCase('tr-TR') === String(item?.term || '').trim().toLocaleLowerCase('tr-TR');
      return tr && !same ? { kind, text: tr } : null;
    }
    case 'example':
    case 'definition': {
      const raw = String(item?.[kind] || '').trim();
      return raw ? { kind, text: blankOut(raw, key.text) } : null;
    }
    default:
      return null;
  }
}

function blankOut(text, word) {
  const w = String(word || '').trim();
  if (!w) return text;
  const re = new RegExp(`(^|[^\\p{L}])${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?=$|[^\\p{L}])`, 'giu');
  return text.replace(re, '$1___');
}
