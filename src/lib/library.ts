// The teacher's library: built-in topic headings per section (level or exam)
// plus the teacher's own. A1 uses the learning path's topics, so its headings
// also link to the ready-made path days.
import { HEADINGS, TRACKS, LEVEL_TRACKS, EXAM_TRACKS, trackLabel } from '../data/library-topics.mjs';
import { getSyllabus } from './path-content';

export { TRACKS, LEVEL_TRACKS, EXAM_TRACKS, trackLabel };
export type Heading = { title: string; tr?: string; pathIndex?: number; ownId?: string };

/** Built-in headings of a section. For A1, `pathIndex` is the topic's place in the learning path. */
export async function builtInHeadings(track: string): Promise<Heading[]> {
  const path = LEVEL_TRACKS.includes(track) ? await getSyllabus(track) : [];
  if (path.length) return path.map((t, i) => ({ title: t.title, tr: t.tr, pathIndex: i }));
  return ((HEADINGS as Record<string, string[]>)[track] || []).map((title) => ({ title }));
}

/** Every section's built-in heading titles, for the "Materyallerime ekle" form. */
export async function allBuiltInTitles(): Promise<Record<string, string[]>> {
  const out: Record<string, string[]> = {};
  for (const t of TRACKS) out[t] = (await builtInHeadings(t)).map((h) => h.title);
  return out;
}

export const sameTitle = (a: string, b: string) => a.trim().toLocaleLowerCase('tr-TR') === b.trim().toLocaleLowerCase('tr-TR');
