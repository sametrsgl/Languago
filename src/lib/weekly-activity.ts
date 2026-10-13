// Weekly activity for the learner's "Yolum" page: the last 8 weeks
// (Monday to Sunday, Istanbul time), counted from dated rows.
const TZ = 'Europe/Istanbul';
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ }); // YYYY-MM-DD

export type Week = { start: string; label: string; current: boolean };

/** The Mondays of the last `n` weeks, oldest first. */
export function lastWeeks(n = 8, now = new Date()): Week[] {
  const today = new Date(`${dayKey(now)}T12:00:00Z`);
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7));
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() - (n - 1 - i) * 7);
    return { start: d.toISOString().slice(0, 10), label: d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', timeZone: 'UTC' }), current: i === n - 1 };
  });
}

/** Count dates (ISO timestamps or YYYY-MM-DD) into the given weeks. */
export function countByWeek(weeks: Week[], dates: (string | null | undefined)[]): number[] {
  const counts = weeks.map(() => 0);
  for (const raw of dates) {
    if (!raw) continue;
    const key = raw.length === 10 ? raw : dayKey(new Date(raw));
    for (let i = weeks.length - 1; i >= 0; i--) if (key >= weeks[i].start) { counts[i]++; break; }
  }
  return counts;
}
