// Kids' level test (7–13): Pre-A1 / A1 / A2, adaptive like the adult test
// but on three steps. Server keeps the keys; the page gets publicKids().
import { words, hear, grammar, reading, listening } from '../data/level-test/kids.mjs';
import { estimate, hash, optionOrder } from './level-test.mjs';

export const KID_LEVELS = ['Pre-A1', 'A1', 'A2'] as const;
export const KID_NAMES: Record<string, string> = { 'Pre-A1': 'Minik adımlar', A1: 'İlk cümleler', A2: 'Kendi başına' };
const B: Record<string, number> = { P: 1, '1': 2, '2': 3 };
export const KID_SECTIONS = [
  { key: 'words', label: 'Kelimeler', kind: 'item', count: 12 },
  { key: 'grammar', label: 'Cümleler', kind: 'item', count: 10 },
  // Reading and listening were taken out (2026-10-14); their units stay in the bank.
] as const;

type Item = { id: string; skill: string; b: number; type: 'pic' | 'hear' | 'text'; picture?: string; say?: string; stem: string; options: string[]; answer: number };
type Unit = { id: string; skill: string; b: number; title: string; text?: string; lines?: [string, string][]; speakers?: Record<string, string>; questions: Item[] };

function mk(skill: string, b: number, type: Item['type'], stem: string, opts: string[], key: string, extra: Partial<Item> = {}): Item {
  const id = `k${skill[0]}-${hash(key).toString(36)}`;
  const order = optionOrder(id, opts.length);
  return { id, skill, b, type, stem, options: order.map((i) => opts[i]), answer: order.indexOf(0), ...extra };
}

let cache: { items: Item[]; units: Unit[]; byId: Map<string, Item> } | null = null;
export function kidsBank() {
  if (cache) return cache;
  const items: Item[] = [
    ...(words as any[]).map(([lv, pic, q, o]) => mk('words', B[lv], 'pic', q, o, `w|${pic}|${q}`, { picture: pic })),
    ...(hear as any[]).map(([lv, w, o]) => mk('words', B[lv], 'hear', 'Dinle ve doğru resmi seç.', o, `h|${w}`, { say: w })),
    ...(grammar as any[]).map(([lv, s, o]) => mk('grammar', B[lv], 'text', s, o, `g|${s}`)),
  ];
  const units: Unit[] = [
    ...(reading as any[]).map((r) => { const id = `kr-${hash(r.title).toString(36)}`; return { id, skill: 'reading', b: B[r.level], title: r.title, text: r.text, questions: r.questions.map(([q, o]: [string, string[]]) => mk('reading', B[r.level], 'text', q, o, `${id}|${q}`)) }; }),
    ...(listening as any[]).map((r) => { const id = `kl-${hash(r.title).toString(36)}`; return { id, skill: 'listening', b: B[r.level], title: r.title, lines: r.lines, speakers: r.speakers, questions: r.questions.map(([q, o]: [string, string[]]) => mk('listening', B[r.level], 'text', q, o, `${id}|${q}`)) }; }),
  ];
  const byId = new Map<string, Item>();
  for (const i of items) byId.set(i.id, i);
  for (const u of units) for (const q of u.questions) byId.set(q.id, q);
  return (cache = { items, units, byId });
}

const strip = ({ answer, ...rest }: Item) => rest;
export function publicKids() {
  const b = kidsBank();
  return { items: b.items.map(strip), units: b.units.map((u) => ({ ...u, questions: u.questions.map(strip) })) };
}
export function kidCorrect(id: string, choice: number): boolean | null {
  const i = kidsBank().byId.get(id);
  return i ? i.answer === choice : null;
}

/** Starting ability from age: 7–8 → Pre-A1, 9–10 → between, 11–13 → A1. */
export const kidPrior = (age: number) => (age <= 8 ? 1.3 : age <= 10 ? 1.8 : 2.3);
const MASTERY = 0.36;
export function kidLevel(theta: number) {
  const x = theta - MASTERY;
  return x < 2 ? 'Pre-A1' : x < 3 ? 'A1' : 'A2';
}

export function scoreKids(answers: { id: string; choice: number }[], age: number, opts: { skipListening?: boolean } = {}) {
  const b = kidsBank();
  const seen = new Set<string>();
  const scored: { id: string; skill: string; b: number; correct: boolean }[] = [];
  for (const a of Array.isArray(answers) ? answers.slice(0, 60) : []) {
    const it = b.byId.get(String(a?.id));
    if (!it || seen.has(it.id)) continue;
    seen.add(it.id);
    scored.push({ id: it.id, skill: it.skill, b: it.b, correct: it.answer === Number(a.choice) });
  }
  const need: Record<string, number> = { words: 6, grammar: 5 };
  for (const k of Object.keys(need)) if (scored.filter((s) => s.skill === k).length < need[k]) return null;
  const prior = kidPrior(age);
  const skills: Record<string, { level: string; theta: number; correct: number; answered: number }> = {};
  const thetas: number[] = [];
  for (const s of KID_SECTIONS) {
    const r = scored.filter((x) => x.skill === s.key);
    if (!r.length) continue;
    const e = estimate(r.map((x) => ({ b: x.b, correct: x.correct })), prior);
    skills[s.key] = { level: kidLevel(e.theta), theta: e.theta, correct: r.filter((x) => x.correct).length, answered: r.length };
    thetas.push(e.theta);
  }
  const mean = thetas.reduce((a, c) => a + c, 0) / thetas.length;
  return { result: { kids: true, overall: { level: kidLevel(mean), name: KID_NAMES[kidLevel(mean)], theta: Math.round(mean * 100) / 100 }, skills }, answers: scored };
}

/** Save a kids' result for a signed-in learner (start level of the path: Pre-A1 and A1 → A1). */
export async function saveKids(sb: any, userId: string, scored: NonNullable<ReturnType<typeof scoreKids>>) {
  const r = scored.result;
  const level = r.overall.level === 'A2' ? 'A2' : 'A1';
  const payload = { version: 3, test: 'kids', level, kidLevel: r.overall.level, kidName: r.overall.name, skills: r.skills, questionsAnswered: scored.answers.length, completedAt: new Date().toISOString(), answers: scored.answers };
  const [p, q] = await Promise.all([
    sb.from('student_progress').upsert({ student_id: userId, module: 'placement-test', payload }, { onConflict: 'student_id,module' }),
    sb.from('profiles').update({ level }).eq('id', userId),
  ]);
  return !p.error && !q.error;
}

