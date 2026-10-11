// Learning-path content on the server (answer keys stay here). Content lives
// in src/data/path/<level>/ (syllabus.mjs + days/dNNN.json) and
// src/data/vocab/<level>.json; levels fill up as content is produced.
import { presentQuestions, scoreQuestions } from './path.mjs';

type Q = { q: string; o: string[]; why?: string };
export type Topic = {
  id: string; title: string; tr: string; explain: string[]; examples: [string, string][]; mistake: string;
  video: { id: string; title: string; channel: string; lang: string } | null;
  alt: { id: string; title: string; channel: string; lang: string } | null;
};
export type Day = {
  level: string; day: number; topic: string; theme: string;
  grammar: { questions: Q[] };
  reading: { title: string; text: string; questions: Q[] };
  listening: { video: { id: string; title: string; source: string; start?: number; end?: number }; intro?: string; questions: Q[] };
  writing: { prompt: string; prompt_en: string; min: number; max: number; focus: string; model: string };
  speaking: { read: string[]; ask: { q: string; tr: string; min_words: number } };
};
export type Word = { id: string; word: string; pos: string; tr: string; en: string; ex: string };

const dayFiles = import.meta.glob('../data/path/*/days/d*.json', { import: 'default' });
const syllabusFiles = import.meta.glob('../data/path/*/syllabus.mjs', { import: 'default' });
const vocabFiles = import.meta.glob('../data/vocab/*.json', { import: 'default' });

const lv = (level: string) => level.toLowerCase();
const pad = (n: number) => String(n).padStart(3, '0');

export async function getDay(level: string, day: number): Promise<Day | null> {
  const f = dayFiles[`../data/path/${lv(level)}/days/d${pad(day)}.json`];
  return f ? ((await f()) as Day) : null;
}
export function dayCount(level: string): number {
  return Object.keys(dayFiles).filter((k) => k.startsWith(`../data/path/${lv(level)}/days/`)).length;
}
export async function getSyllabus(level: string): Promise<Topic[]> {
  const f = syllabusFiles[`../data/path/${lv(level)}/syllabus.mjs`];
  return f ? ((await f()) as Topic[]) : [];
}
export async function getVocab(level: string): Promise<Word[]> {
  const f = vocabFiles[`../data/vocab/${lv(level)}.json`];
  return f ? ((await f()) as Word[]) : [];
}

export const taskKey = (level: string, day: number, task: string) => `${level}-${day}-${task}`;

/** Is this the first day of its grammar topic (the explanation day)? */
export async function isTopicStart(d: Day): Promise<boolean> {
  if (d.day === 1) return true;
  const prev = await getDay(d.level, d.day - 1);
  return !prev || prev.topic !== d.topic;
}

/** The day as the learner sees it: questions shuffled, no answer keys. */
export async function publicDay(d: Day) {
  const topics = await getSyllabus(d.level);
  const topic = topics.find((t) => t.id === d.topic) || null;
  return {
    level: d.level, day: d.day, theme: d.theme, topicStart: await isTopicStart(d), topic,
    grammar: { questions: presentQuestions(d.grammar.questions, taskKey(d.level, d.day, 'grammar')) },
    reading: { title: d.reading.title, text: d.reading.text, questions: presentQuestions(d.reading.questions, taskKey(d.level, d.day, 'reading')) },
    listening: { video: d.listening.video, intro: d.listening.intro || '', questions: presentQuestions(d.listening.questions, taskKey(d.level, d.day, 'listening')) },
    writing: { prompt: d.writing.prompt, prompt_en: d.writing.prompt_en, min: d.writing.min, max: d.writing.max, focus: d.writing.focus },
    speaking: d.speaking,
  };
}

export function scoreTask(d: Day, task: 'grammar' | 'reading' | 'listening', choices: number[]) {
  return scoreQuestions(d[task].questions, taskKey(d.level, d.day, task), choices);
}

export type PathState = {
  mission_level: string; mission_day: number; day_opened_on: string; mission_xp: number;
  vocab_level: string; vocab_xp: number; vocab_streak: number; last_vocab_on: string | null;
};

/** The learner's path row (created on first use; start levels from the level test). */
export async function loadPathState(sb: any, userId: string): Promise<PathState | null> {
  const { data } = await sb.from('path_state').select('*').eq('student_id', userId).maybeSingle();
  if (data) return data as PathState;
  const { data: pt } = await sb.from('student_progress').select('payload').eq('student_id', userId).eq('module', 'placement-test').maybeSingle();
  const p = pt?.payload || {};
  const mission = typeof p.level === 'string' ? p.level : null;
  const vocab = p.skills?.vocab?.level || mission;
  const r = await sb.rpc('ensure_path', { p_mission_level: mission, p_vocab_level: vocab });
  return (r.data as PathState) || null;
}

/** Today's mission day for the learner, or null when it opens tomorrow / has no content yet. */
export async function todaysDay(sb: any, userId: string) {
  const st = await loadPathState(sb, userId);
  if (!st) return { st: null, day: null };
  return { st, day: await getDay(st.mission_level, st.mission_day) };
}
