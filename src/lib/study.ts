// Languago — self-study registry + lazy loaders for the auto-generated
// content in src/data/. Keeps the heavy modules out of the initial bundle:
// each level is only `import()`-ed when its page is actually requested.
//
// NOTE: the exports of the generated modules are NOT edited here — we only
// reference them via static dynamic-import specifiers so Vite/Astro can always
// resolve and code-split them at build time.

/** Grammar levels (A1–B2) with display metadata. */
export const GRAMMAR_LEVELS = {
  a1: { label: 'A1 · Başlangıç', color: '#10B981', subtitle: 'Temel dilbilgisi' },
  a2: { label: 'A2 · Temel', color: '#0EA5E9', subtitle: 'Günlük dilbilgisi' },
  b1: { label: 'B1 · Orta', color: '#8B5CF6', subtitle: 'Orta düzey dilbilgisi' },
  b2: { label: 'B2 · Orta-Üstü', color: '#F59E0B', subtitle: 'İleri dilbilgisi' },
} as const;

export type GrammarLevelKey = keyof typeof GRAMMAR_LEVELS;

/** Level names used across the Flashcards vocab sets. */
export const VOCAB_SETS = [
  { key: 'a1', label: 'A1' },
  { key: 'a2', label: 'A2' },
  { key: 'b1', label: 'B1' },
  { key: 'b2', label: 'B2' },
  { key: 'c1', label: 'C1' },
  { key: 'c2', label: 'C2' },
  { key: 'ielts', label: 'IELTS' },
  { key: 'toefl', label: 'TOEFL' },
  { key: 'yokdil', label: 'YÖKDİL' },
  { key: 'yds', label: 'YDS' },
  { key: 'gre', label: 'GRE' },
] as const;

/** Reading collections (CEFR levels + exams). */
export const READING_LEVELS = [
  { key: 'a1', label: 'A1 · Başlangıç' },
  { key: 'a2', label: 'A2 · Temel' },
  { key: 'b1', label: 'B1 · Orta' },
  { key: 'b2', label: 'B2 · Orta-Üstü' },
  { key: 'c1', label: 'C1 · İleri' },
  { key: 'c2', label: 'C2 · Usta' },
  { key: 'ielts', label: 'IELTS' },
  { key: 'toefl', label: 'TOEFL' },
  { key: 'yds', label: 'YDS' },
  { key: 'yokdil', label: 'YÖKDİL' },
  { key: 'gre', label: 'GRE' },
] as const;

/** Lazy-load a grammar module (returned export is e.g. `GRAMMAR_A1`). */
export async function loadGrammar(level: string) {
  switch (level) {
    case 'a1': return import('../data/grammar_a1.js');
    case 'a2': return import('../data/grammar_a2.js');
    case 'b1': return import('../data/grammar_b1.js');
    case 'b2': return import('../data/grammar_b2.js');
    default: return null;
  }
}

/** Lazy-load a grammar MCQ module (keyed by unit id). */
export async function loadGrammarMcq(level: string) {
  switch (level) {
    case 'a1': return import('../data/grammar_mcq_a1.js');
    case 'a2': return import('../data/grammar_mcq_a2.js');
    case 'b1': return import('../data/grammar_mcq_b1.js');
    case 'b2': return import('../data/grammar_mcq_b2.js');
    default: return null;
  }
}

/** Lazy-load a reading module (returned export is e.g. `READINGS_A1`). */
export async function loadReading(level: string) {
  switch (level) {
    case 'a1': return import('../data/readings_a1.js');
    case 'a2': return import('../data/readings_a2.js');
    case 'b1': return import('../data/readings_b1.js');
    case 'b2': return import('../data/readings_b2.js');
    case 'c1': return import('../data/readings_c1.js');
    case 'c2': return import('../data/readings_c2.js');
    case 'ielts': return import('../data/readings_ielts.js');
    case 'toefl': return import('../data/readings_toefl.js');
    case 'yds': return import('../data/readings_yds.js');
    case 'yokdil': return import('../data/readings_yokdil.js');
    case 'gre': return import('../data/readings_gre.js');
    default: return null;
  }
}

/** Uppercase export suffix (a1 → A1, ielts → IELTS, gre → GRE). */
export function exportSuffix(level: string) {
  return level.toUpperCase();
}

/** Humanised, safe page title for a level key (a2 → "A2", ielts → "IELTS"). */
export function levelTitle(level: string) {
  const g = GRAMMAR_LEVELS[level as GrammarLevelKey];
  if (g) return g.label;
  const r = READING_LEVELS.find((x) => x.key === level);
  return r ? r.label : level.toUpperCase();
}