// Fills a level's vocabulary list from a word list, with AI, then checks it.
//
//   node scripts/vocab-draft.mjs <env file> <level>
//
// Reads scripts/data/<level>-words.txt (teaching order, "word [| pos]") and
// src/data/vocab/<level>.json (entries already written are kept). For each new
// word the AI writes: pos, Turkish meaning(s), a simple English explanation in
// its own words (never copied from a dictionary) and a natural example
// sentence. Checks: allowed part of speech, Turkish present, the explanation
// does not contain the word itself, the example contains the word (or a form).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { wordId } from '../src/lib/word-id.mjs';

const [envPath, level = 'A1'] = process.argv.slice(2);
if (!envPath || !existsSync(envPath)) { console.error('Usage: node scripts/vocab-draft.mjs <env file> <level>'); process.exit(1); }
const env = Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*(LLM_[A-Z_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const KEY = env.LLM_API_KEY, BASE = (env.LLM_BASE_URL || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, ''), MODEL = env.LLM_MODEL || env.LLM_MODEL_FAST;
if (!KEY || !MODEL) { console.error('LLM_API_KEY / LLM_MODEL missing in the env file.'); process.exit(1); }

const lv = level.toLowerCase();
const root = new URL('../', import.meta.url);
const listFile = new URL(`src/data/wordlists/${lv}-words.txt`, root);
const outFile = new URL(`src/data/vocab/${lv}.json`, root);
const POS = ['noun', 'verb', 'adjective', 'adverb', 'preposition', 'pronoun', 'determiner', 'conjunction', 'exclamation', 'phrase', 'number', 'phrasal verb'];
const slug = (w, pos) => `${lv}-${w.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}${pos ? '-' + pos.split(' ')[0].slice(0, 4) : ''}`;

const wanted = readFileSync(listFile, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .map((l) => { const [left, tr] = l.split(' = '); const [w, p] = left.split('|').map((s) => s.trim()); return { word: w, hint: p || null, tr: tr ? tr.trim() : null }; });
const have = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : [];
const byWord = new Map(have.map((e) => [`${e.word.toLowerCase()}|${e.pos}`, e]));
const dupWords = new Set(wanted.filter((w, i) => wanted.findIndex((x) => x.word.toLowerCase() === w.word.toLowerCase()) !== i).map((w) => w.word.toLowerCase()));

async function chat(messages) {
  for (let a = 0; a < 3; a++) {
    try {
      const r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: MODEL, messages, temperature: 0.3, max_tokens: 6000, response_format: { type: 'json_object' } }), signal: AbortSignal.timeout(120000) });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const c = (await r.json()).choices?.[0]?.message?.content || '';
      return JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1));
    } catch (e) { if (a === 2) throw e; await new Promise((s) => setTimeout(s, 3000)); }
  }
}

const forms = (w) => { const b = w.toLowerCase().split(' ')[0]; return [b, b + 's', b + 'es', b + 'ed', b + 'd', b + 'ing', b.replace(/e$/, '') + 'ing', b.replace(/y$/, 'ies'), b.replace(/y$/, 'ied')]; };
function check(e, want) {
  const errs = [];
  if (!POS.includes(e.pos)) errs.push(`pos "${e.pos}"`);
  if (want.hint && !e.pos.startsWith(want.hint)) errs.push(`pos should be ${want.hint}`);
  if (!e.tr || e.tr.length > 80) errs.push('tr missing or too long');
  if (!e.en || e.en.toLowerCase().split(/\W+/).includes(want.word.toLowerCase().split(' ')[0])) errs.push('en repeats the word');
  if (!e.ex || !forms(want.word).some((f) => e.ex.toLowerCase().includes(f))) errs.push('example lacks the word');
  return errs;
}

const todo = wanted.filter((w) => ![...byWord.values()].some((e) => e.word.toLowerCase() === w.word.toLowerCase() && (!w.hint || e.pos.startsWith(w.hint))));
console.log(`${level}: ${wanted.length} words, ${have.length} written, ${todo.length} to fill.`);
const SYSTEM = `You write vocabulary cards for Turkish adults learning English at ${level}.
For each word give: "pos" (one of ${POS.join(', ')}; follow the hint when given), "tr" (the most useful Turkish meaning(s) for this level, comma-separated, max 4),
"en" (a very simple English explanation in YOUR OWN words for a ${level} learner, max 12 words, never using the word itself; do not copy any dictionary),
"ex" (one short natural example sentence for an adult, using the word exactly as written or a regular form of it).
Return JSON {"cards":[{"word","pos","tr","en","ex"}]} in the same order.`;
const out = [...have];
for (let i = 0; i < todo.length; i += 30) {
  const batch = todo.slice(i, i + 30);
  let r = await chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: JSON.stringify(batch.map((w) => ({ word: w.word, hint: w.hint }))) }]);
  const cards = r.cards || [];
  const retry = [];
  batch.forEach((want, k) => {
    const e = cards.find((c) => c.word?.toLowerCase() === want.word.toLowerCase()) || cards[k];
    const errs = e ? check(e, want) : ['missing'];
    if (errs.length) { retry.push({ want, errs }); return; }
    const pos = e.pos;
    out.push({ id: wordId(lv, want.word, want.hint, dupWords.has(want.word.toLowerCase())), word: want.word, pos, tr: want.tr || e.tr, en: e.en, ex: e.ex });
  });
  for (const { want, errs } of retry) {
    r = await chat([{ role: 'system', content: SYSTEM }, { role: 'user', content: `Fix this card (problems: ${errs.join('; ')}):\n${JSON.stringify([{ word: want.word, hint: want.hint }])}` }]);
    const e = r.cards?.[0];
    if (e && !check(e, want).length) out.push({ id: wordId(lv, want.word, want.hint, dupWords.has(want.word.toLowerCase())), word: want.word, pos: e.pos, tr: want.tr || e.tr, en: e.en, ex: e.ex });
    else console.log(`  needs a hand check: ${want.word} (${errs.join('; ')})`);
  }
  // keep teaching order
  const order = new Map(wanted.map((w, idx) => [w.word.toLowerCase() + '|' + (w.hint || ''), idx]));
  const rank = (e) => order.get(e.word.toLowerCase() + '|' + (wanted.find((w) => w.word.toLowerCase() === e.word.toLowerCase() && (!w.hint || e.pos.startsWith(w.hint)))?.hint || '')) ?? 1e9;
  out.sort((a, b) => rank(a) - rank(b));
  writeFileSync(outFile, JSON.stringify(out, null, 1) + '\n');
  console.log(`saved ${out.length}/${wanted.length}`);
}
const ids = out.map((e) => e.id);
if (new Set(ids).size !== ids.length) console.log('WARNING: duplicate ids', ids.filter((x, i) => ids.indexOf(x) !== i));
