// Drafts learning-path days with AI, then checks them before saving.
//
//   node scripts/path-draft.mjs <env file> <level> <fromDay> <toDay> [--voa <transcripts.json> --map <map.json>]
//
// The env file (outside this public repo) holds LLM_API_KEY, LLM_BASE_URL and
// LLM_MODEL_FAST/LLM_MODEL; values are read, never printed. Days 1–3 of A1
// are hand-written and serve as the model. Each draft is checked:
//  - shape (10 grammar, 7 reading, 7 listening questions; 4 different options)
//  - reading and listening answers must quote evidence found in the text
//  - a second "blind" pass answers every question without the key; a day
//    whose answers disagree is redrafted (max 3 tries) or reported.
// Writes src/data/path/<level>/days/dNNN.json, skipping days that exist.
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';

const [envPath, level = 'A1', fromArg = '4', toArg = '120'] = process.argv.slice(2);
const opt = (k) => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
if (!envPath || !existsSync(envPath)) { console.error('Usage: node scripts/path-draft.mjs <env file> <level> <from> <to> --voa t.json --map m.json'); process.exit(1); }
const env = Object.fromEntries(readFileSync(envPath, 'utf8').split(/\r?\n/).map((l) => l.match(/^\s*(LLM_[A-Z_]+)\s*=\s*"?([^"\r\n]*)"?\s*$/)).filter(Boolean).map((m) => [m[1], m[2]]));
const KEY = env.LLM_API_KEY, BASE = (env.LLM_BASE_URL || 'https://opencode.ai/zen/go/v1').replace(/\/+$/, ''), MODEL = (process.argv.includes('--model') ? process.argv[process.argv.indexOf('--model') + 1] : null) || env.LLM_MODEL || env.LLM_MODEL_FAST, REASONING = env.LLM_REASONING;
if (!KEY || !MODEL) { console.error('LLM_API_KEY / LLM_MODEL missing in the env file.'); process.exit(1); }

const lv = level.toLowerCase();
const root = new URL('../', import.meta.url);
const syllabus = (await import(new URL(`src/data/path/${lv}/syllabus.mjs`, root))).default;
const dayPath = (d) => new URL(`src/data/path/${lv}/days/d${String(d).padStart(3, '0')}.json`, root);
mkdirSync(new URL(`src/data/path/${lv}/days/`, root), { recursive: true });
const examples = [1, 2, 3].map((d) => existsSync(dayPath(d)) ? JSON.parse(readFileSync(dayPath(d), 'utf8')) : null).filter(Boolean);

const voa = opt('--voa') ? JSON.parse(readFileSync(opt('--voa'), 'utf8')) : [];
const map = opt('--map') ? JSON.parse(readFileSync(opt('--map'), 'utf8')) : [];
const lessons = map.filter((m) => m.video && m.transcript && m.n >= 4).map((m) => ({ ...m, lines: voa.find((v) => v.lesson === m.n)?.lines || [] }));

const THEMES = ['Günlük rutin', 'Yemek ve içecek', 'Alışveriş', 'İş ve meslekler', 'Okul ve dersler', 'Hobiler', 'Hava durumu', 'Ulaşım', 'Tatil', 'Sağlık', 'Spor', 'Teknoloji', 'Arkadaşlar', 'Hafta sonu', 'Restoranda', 'Kıyafetler', 'Kutlamalar', 'Komşular', 'Evcil hayvanlar', 'Müzik ve film', 'Mevsimler', 'Ev işleri', 'Şehirde yol tarifi', 'Kafede', 'Aile ziyareti', 'Doğa', 'Kitaplar', 'Telefon ve mesajlar', 'Otel', 'Plan yapmak'];
const LEN = { A1: [70, 120], A2: [110, 170], B1: [170, 250], B2: [230, 320], C1: [280, 380], C2: [320, 420] }[level];

function planDay(d) {
  const ti = Math.min(syllabus.length - 1, Math.floor((d - 1) / 5));
  const inTopic = ((d - 1) % 5) + 1;
  const lesson = lessons.length ? lessons[Math.min(lessons.length - 1, Math.floor(((d - 4) * lessons.length) / (120 - 3)))] : null;
  return { topic: syllabus[ti], earlier: syllabus.slice(0, ti), inTopic, lesson, theme: THEMES[(d * 7) % THEMES.length] };
}

async function chat(messages, maxTokens = 6000) {
  const body = { model: MODEL, messages, temperature: 0.5, max_tokens: maxTokens, response_format: { type: 'json_object' }, ...(REASONING ? { reasoning_effort: REASONING } : {}) };
  for (let attempt = 0; attempt < 6; attempt++) {
    let wait = 3000 * (attempt + 1);
    try {
      const r = await fetch(`${BASE}/chat/completions`, { method: 'POST', headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(300000) });
      const t = await r.text();
      if (!r.ok) {
        // free tiers: a daily cap means stop for today; a per-minute cap means wait a minute
        if (r.status === 429 && /PerDay/i.test(t)) { console.log(`daily quota reached for ${MODEL}; run again later to continue`); process.exit(3); }
        if (r.status === 429 || r.status === 503) wait = 65000;
        if (/response_format/i.test(t)) delete body.response_format;
        throw new Error(`HTTP ${r.status}`);
      }
      const c = JSON.parse(t).choices?.[0]?.message?.content || '';
      return JSON.parse(c.slice(c.indexOf('{'), c.lastIndexOf('}') + 1));
    } catch (e) { if (attempt === 5) throw e; await new Promise((s) => setTimeout(s, wait)); }
  }
}

const norm = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const q4 = (q) => q && typeof q.q === 'string' && Array.isArray(q.o) && q.o.length === 4 && new Set(q.o.map(norm)).size === 4 && q.o.every((x) => typeof x === 'string' && x.trim());
const words = (t) => String(t).split(/\s+/).filter(Boolean).length;

function validate(d, plan) {
  const errs = [];
  if (d.grammar?.questions?.length !== 10 || !d.grammar.questions.every(q4)) errs.push('grammar: need 10 questions with 4 different options');
  if (d.reading?.questions?.length !== 7 || !d.reading.questions.every(q4)) errs.push('reading: need 7 questions with 4 different options');
  const n = words(d.reading?.text || '');
  if (n < LEN[0] || n > LEN[1]) errs.push(`reading: text is ${n} words, need ${LEN[0]}-${LEN[1]}`);
  for (const q of d.reading?.questions || []) if (!q.evidence || !norm(d.reading.text).includes(norm(q.evidence))) errs.push(`reading: evidence not in text for "${q.q}"`);
  if (plan.lesson) {
    const tr = norm(plan.lesson.lines.join(' '));
    if (d.listening?.questions?.length !== 7 || !d.listening.questions.every(q4)) errs.push('listening: need 7 questions with 4 different options');
    for (const q of d.listening?.questions || []) if (!q.evidence || !tr.includes(norm(q.evidence).replace(/^[a-z]+: /, ''))) errs.push(`listening: evidence not in transcript for "${q.q}"`);
  }
  const w = d.writing || {};
  if (!w.prompt || !w.prompt_en || !w.model || !(w.min > 0 && w.max > w.min)) errs.push('writing: missing fields');
  const s = d.speaking || {};
  if (!Array.isArray(s.read) || s.read.length !== 3 || !s.ask?.q || !s.ask?.tr || !(s.ask?.min_words > 0)) errs.push('speaking: need 3 read sentences and an ask {q,tr,min_words}');
  return errs;
}

// Blind check: answer every question without the key; return indexes that disagree.
async function blind(d, plan) {
  const pack = (qs, k) => qs.map((q, i) => ({ id: `${k}${i}`, q: q.q, o: [...q.o].sort() }));
  const items = [...pack(d.grammar.questions, 'g'), ...pack(d.reading.questions, 'r'), ...(plan.lesson ? pack(d.listening.questions, 'l') : [])];
  const r = await chat([
    { role: 'system', content: 'You are a careful English teacher. Answer each multiple-choice question. Use the reading text and the video transcript where needed. If two options are equally correct or none is, answer "AMBIGUOUS". Reply JSON {"answers":{"<id>":"<exact option text or AMBIGUOUS>"}}.' },
    { role: 'user', content: JSON.stringify({ reading_text: d.reading.text, transcript: plan.lesson?.lines || [], questions: items }) },
  ], 3000);
  const bad = [];
  const check = (qs, k) => qs.forEach((q, i) => { const a = r.answers?.[`${k}${i}`]; if (!a || norm(a) !== norm(q.o[0])) bad.push(`${k}${i}: key "${q.o[0]}" vs blind "${a}" — ${q.q}`); });
  check(d.grammar.questions, 'g'); check(d.reading.questions, 'r'); if (plan.lesson) check(d.listening.questions, 'l');
  return bad;
}

const SYSTEM = `You write daily lessons for Turkish adults learning English (level ${level}) on the Languago learning path.
Rules:
- Natural, adult, everyday contexts (work, city, family, travel, Turkey and abroad). No children's content, no emoji, no brand names.
- Every multiple-choice question has exactly 4 options and the CORRECT option is ALWAYS FIRST in "o". Exactly one option is right; distractors are typical learner mistakes (often Turkish-speaker errors) and clearly wrong for a careful learner.
- "why" is a short Turkish explanation (one sentence) of the right answer.
- Grammar: 10 questions on the day's topic${level === 'A1' ? ' with A1 vocabulary' : ''}; on practice days mix in 3 questions on earlier topics; on review days (day 5 of a topic) mix the topic with earlier ones. Vary formats: gap-fill, choose the correct sentence, choose the right question, short dialogue completion.
- Reading: an original text of ${LEN[0]}-${LEN[1]} words on the theme that uses the day's grammar naturally; 7 questions (main idea, details, one inference, one word meaning in context); each question has "evidence": an exact quote copied from the text.
- Listening: 7 questions about the given video transcript only (who, what, where, numbers, feelings, what happens next); each has "evidence": an exact quote copied from the transcript (without the speaker name).
- Writing: a Turkish task (prompt) and its English version (prompt_en) that makes the learner use the day's grammar about the theme; min/max words suitable for ${level}; "focus" names the grammar; "model" is a model answer at the level.
- Speaking: 3 short sentences to read aloud that use the grammar; "ask": an English question (q), a Turkish instruction (tr) and min_words.
Return ONLY JSON with keys: theme, grammar{questions[{q,o,why}]}, reading{title,text,questions[{q,o,why,evidence}]}, listening{intro (one Turkish sentence about the video), questions[{q,o,why,evidence}]}, writing{prompt,prompt_en,min,max,focus,model}, speaking{read[3],ask{q,tr,min_words}}.`;

async function draftDay(d) {
  const plan = planDay(d);
  const brief = {
    day: d, theme: plan.theme,
    topic: { id: plan.topic.id, title: plan.topic.title, tr: plan.topic.tr, explain: plan.topic.explain },
    dayOfTopic: plan.inTopic === 1 ? 'first day (new topic)' : plan.inTopic === 5 ? 'review day' : `practice day ${plan.inTopic}`,
    earlierTopics: plan.earlier.map((t) => t.title),
    video: plan.lesson ? { title: plan.lesson.video.title, transcript: plan.lesson.lines } : null,
  };
  let feedback = '';
  for (let tryNo = 1; tryNo <= 3; tryNo++) {
    const out = await chat([
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `Example of a finished day (format and quality):\n${JSON.stringify(examples[(d % examples.length)] || examples[0])}` },
      { role: 'user', content: `Write day ${d}.\n${JSON.stringify(brief)}${feedback ? `\n\nYour previous draft had these problems; fix them:\n${feedback}` : ''}` },
    ]);
    const errs = validate(out, plan);
    const bad = errs.length ? [] : await blind(out, plan);
    if (!errs.length && !bad.length) {
      const strip = (qs) => qs.map(({ q, o, why }) => ({ q, o, why }));
      return {
        level, day: d, topic: plan.topic.id, theme: out.theme || plan.theme,
        grammar: { questions: strip(out.grammar.questions) },
        reading: { title: out.reading.title, text: out.reading.text, questions: strip(out.reading.questions) },
        listening: { video: { id: plan.lesson.video.id, title: plan.lesson.video.title, source: 'VOA Learning English' }, intro: out.listening.intro, questions: strip(out.listening.questions) },
        writing: out.writing, speaking: out.speaking,
      };
    }
    feedback = [...errs, ...bad].slice(0, 15).join('\n');
    console.log(`  day ${d} try ${tryNo}: ${errs.length} shape errors, ${bad.length} blind mismatches`);
  }
  throw new Error(`day ${d} failed checks:\n${feedback}`);
}

const from = Number(fromArg), to = Number(toArg);
const todo = [];
for (let d = from; d <= to; d++) if (!existsSync(dayPath(d))) todo.push(d);
console.log(`${level}: ${todo.length} days to draft (${from}-${to}); ${lessons.length} VOA lessons.`);
const failed = [];
let next = 0;
await Promise.all(Array.from({ length: 3 }, async () => {
  while (next < todo.length) {
    const d = todo[next++];
    try { writeFileSync(dayPath(d), JSON.stringify(await draftDay(d), null, 2) + '\n'); console.log(`day ${d} saved`); }
    catch (e) { failed.push(d); console.log(String(e.message).slice(0, 600)); }
  }
}));
console.log(failed.length ? `failed: ${failed.join(', ')}` : 'all drafted');
