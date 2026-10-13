// Mistakes notebook ("Hata defteri"): collect a student's wrong answers and
// writing corrections. Saving is best effort: a failure (or the table not
// existing yet) never blocks the task the student just did.
import { shuffleOrder } from './path.mjs';

export type MistakeIn = { source: 'mission' | 'homework' | 'writing'; level?: string; prompt?: string | null; wrong: string; right: string; why?: string | null };

export async function recordMistakes(sb: any, items: MistakeIn[]): Promise<void> {
  const list = items.filter((m) => m.wrong && m.right && m.wrong.trim().toLowerCase() !== m.right.trim().toLowerCase()).slice(0, 20);
  if (!list.length) return;
  try { await sb.rpc('add_mistakes', { p_items: list }); } catch { /* best effort */ }
}

/** Wrong answers to a mission's grammar questions (choices are indexes into the shuffled options). */
export function grammarMistakes(d: any, review: { ok: boolean; choice: number }[], key: string): MistakeIn[] {
  const qs = d?.grammar?.questions || [];
  const out: MistakeIn[] = [];
  review.forEach((r, i) => {
    const q = qs[i];
    if (!q || r.ok || r.choice < 0) return;
    const order = shuffleOrder(`${key}#${i}`, q.o.length);
    const picked = q.o[order[r.choice]];
    if (picked) out.push({ source: 'mission', level: d.level, prompt: q.q, wrong: picked, right: q.o[0], why: q.why || null });
  });
  return out;
}
