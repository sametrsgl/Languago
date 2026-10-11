// Level test v2 bank on the server: stable ids, shuffled options and answer
// keys. The page only ever receives publicBank() (no keys, no scripts).
import vocab from '../data/level-test/vocab.mjs';
import grammar from '../data/level-test/grammar.mjs';
import reading1 from '../data/level-test/reading-1.mjs';
import reading2 from '../data/level-test/reading-2.mjs';
import listening from '../data/level-test/listening.mjs';
import { TAGS as GRAMMAR_TAGS, TOPICS as GRAMMAR_TOPICS, A1_TOPIC_MAP } from '../data/level-test/grammar-topics.mjs';
import { hash, optionOrder, levelB, result, SECTIONS } from './level-test.mjs';

export type Skill = 'vocab' | 'grammar' | 'reading' | 'listening';
export type Item = { id: string; skill: Skill; level: string; stem: string; options: string[]; answer: number; topic?: string };
export type Unit = {
  id: string; skill: Skill; level: string; title: string; kind?: string;
  text?: string; audio?: string; lines?: [string, string][]; speakers?: Record<string, string>;
  questions: Item[];
};

const idOf = (prefix: string, key: string) => `${prefix}-${hash(key).toString(36)}`;

function makeItem(skill: Skill, level: string, stem: string, authored: string[], key: string): Item {
  const id = idOf(skill.slice(0, 1), key);
  const order = optionOrder(id, authored.length);
  return { id, skill, level, stem, options: order.map((i) => authored[i]), answer: order.indexOf(0) };
}

function build() {
  const items: Item[] = [];
  for (const [level, stem, opts] of vocab as [string, string, string[]][]) items.push(makeItem('vocab', level, stem, opts, `vocab|${stem}`));
  (grammar as [string, string, string[]][]).forEach(([level, stem, opts], i) => items.push({ ...makeItem('grammar', level, stem, opts, `grammar|${stem}`), topic: (GRAMMAR_TAGS as string[])[i] }));
  const units: Unit[] = [];
  for (const p of [...reading1, ...reading2] as any[]) {
    const id = idOf('r', `reading|${p.title}`);
    units.push({
      id, skill: 'reading', level: p.level, title: p.title, text: p.text,
      questions: p.questions.map(([stem, opts]: [string, string[]]) => makeItem('reading', p.level, stem, opts, `${id}|${stem}`)),
    });
  }
  for (const c of listening as any[]) {
    const id = idOf('l', `listening|${c.title}`);
    units.push({
      id, skill: 'listening', level: c.level, title: c.title, kind: c.kind, audio: `/audio/level-test/${id}.mp3`,
      lines: c.lines, speakers: c.speakers,
      questions: c.questions.map(([stem, opts]: [string, string[]]) => makeItem('listening', c.level, stem, opts, `${id}|${stem}`)),
    });
  }
  const byId = new Map<string, Item>();
  for (const i of items) byId.set(i.id, i);
  for (const u of units) for (const q of u.questions) byId.set(q.id, q);
  return { items, units, byId };
}

let cache: ReturnType<typeof build> | null = null;
export function bank() {
  return (cache ??= build());
}

const strip = (i: Item) => ({ id: i.id, skill: i.skill, level: i.level, stem: i.stem, options: i.options });

/** What the test page gets: no answer keys. Listening scripts go along so a
 * device voice can read them while the recorded audio is missing; the page
 * never shows them. */
export function publicBank() {
  const b = bank();
  return {
    items: b.items.map(strip),
    units: b.units.map((u) => ({
      id: u.id, skill: u.skill, level: u.level, title: u.title, kind: u.kind, text: u.text, audio: u.audio,
      lines: u.lines, speakers: u.speakers,
      questions: u.questions.map(strip),
    })),
  };
}

export function isCorrect(id: string, choice: number): boolean | null {
  const item = bank().byId.get(id);
  if (!item) return null;
  return item.answer === choice;
}

/**
 * Score a finished test from the learner's choices, never trusting the page:
 * correctness comes from the keys here. Returns null when the test is too
 * incomplete to give a level.
 */
export function scoreTest(answers: { id: string; choice: number }[], selfReport: number, opts: { skipListening?: boolean } = {}) {
  const b = bank();
  const seen = new Set<string>();
  const scored: { id: string; skill: Skill; b: number; choice: number; correct: boolean; topic?: string }[] = [];
  for (const a of Array.isArray(answers) ? answers.slice(0, 120) : []) {
    const item = b.byId.get(String(a?.id));
    if (!item || seen.has(item.id)) continue;
    seen.add(item.id);
    const choice = Number(a.choice);
    scored.push({ id: item.id, skill: item.skill, b: levelB(item.level), choice, correct: item.answer === choice, ...(item.topic ? { topic: item.topic } : {}) });
  }
  // Listening can be skipped when the device has no English voice (no recorded audio yet).
  const need: Record<string, number> = { vocab: 8, grammar: 8, reading: 6, listening: opts.skipListening ? 0 : 6 };
  for (const s of SECTIONS) if (scored.filter((x) => x.skill === s.key).length < need[s.key]) return null;
  // Right / wrong per grammar topic (used to personalise the learning path).
  const grammarTopics: Record<string, { asked: number; correct: number }> = {};
  for (const a of scored) if (a.topic) { const t = (grammarTopics[a.topic] ||= { asked: 0, correct: 0 }); t.asked++; if (a.correct) t.correct++; }
  return { result: { ...result(scored, selfReport), grammarTopics }, answers: scored };
}

/** Save a scored test for a signed-in learner (row rules: own rows only). */
export async function saveLevelTest(sb: any, userId: string, scored: NonNullable<ReturnType<typeof scoreTest>>, goal = 'general') {
  const r = scored.result;
  const payload = {
    version: 3,
    test: 'level-test-v2',
    level: r.overall.level,
    goal,
    overall: r.overall,
    skills: r.skills,
    strongest: r.strongest,
    weakest: r.weakest,
    grammarTopics: (r as any).grammarTopics || {},
    questionsAnswered: scored.answers.length,
    completedAt: new Date().toISOString(),
    answers: scored.answers.map((a) => ({ id: a.id, choice: a.choice, correct: a.correct })),
  };
  const [p, prof] = await Promise.all([
    sb.from('student_progress').upsert({ student_id: userId, module: 'placement-test', payload }, { onConflict: 'student_id,module' }),
    sb.from('profiles').update({ level: r.overall.level }).eq('id', userId),
  ]);
  return !p.error && !prof.error;
}

export { GRAMMAR_TOPICS };

/**
 * How a learner did on the level-test topics behind a path topic:
 * 'known' (all right, at least 2 questions), 'weak' (half or more wrong) or null.
 */
export function topicStatus(grammarTopics: Record<string, { asked: number; correct: number }> | undefined, pathTopicId: string): 'known' | 'weak' | null {
  const keys: string[] = (A1_TOPIC_MAP as Record<string, string[]>)[pathTopicId] || [];
  let asked = 0, correct = 0;
  for (const k of keys) { const t = grammarTopics?.[k]; if (t) { asked += t.asked; correct += t.correct; } }
  if (!asked) return null;
  if (correct === asked && asked >= 2) return 'known';
  if (correct / asked <= 0.5) return 'weak';
  return null;
}
