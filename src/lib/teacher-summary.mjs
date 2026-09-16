export function moduleSummary(entry) {
  const p = entry?.payload && typeof entry.payload === 'object' ? entry.payload : null;
  if (!p) return null;
  if (typeof p.percent === 'number' && Number.isFinite(p.percent) && p.percent >= 0 && p.percent <= 100) return `%${Math.round(p.percent)}`;
  if (Number.isInteger(p.correct) && Number.isInteger(p.total) && p.correct >= 0 && p.total > 0 && p.correct <= p.total) return `${p.correct}/${p.total}`;
  return null;
}