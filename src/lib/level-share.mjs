// Shareable level-test results. The link carries only the levels, e.g.
// /seviye-testi/sonuc/B1-B1A2---- (overall, then kelime, dilbilgisi, okuma,
// dinleme; "--" when a skill was not tested). Nothing personal, nothing stored.

const LV = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
export const SHARE_SKILLS = [
  { key: 'vocab', label: 'Kelime' },
  { key: 'grammar', label: 'Dilbilgisi' },
  { key: 'reading', label: 'Okuma' },
  { key: 'listening', label: 'Dinleme' },
];
export const LEVEL_NAMES = { A1: 'Başlangıç', A2: 'Temel', B1: 'Orta', B2: 'Orta üstü', C1: 'İleri', C2: 'Uzman' };

/** result = { overall: { level }, skills: { vocab: { level }, ... } } → "B1-B1A2B1B2" */
export function shareCode(result) {
  const o = result?.overall?.level;
  if (!LV.includes(o)) return null;
  return `${o}-${SHARE_SKILLS.map((s) => (LV.includes(result.skills?.[s.key]?.level) ? result.skills[s.key].level : '--')).join('')}`;
}

/** "B1-B1A2B1B2" → { level, skills: [{ key, label, level|null }] } or null */
export function readShareCode(code) {
  const m = /^(A1|A2|B1|B2|C1|C2)-((?:A1|A2|B1|B2|C1|C2|--){4})$/.exec(String(code || '').toUpperCase());
  if (!m) return null;
  const parts = m[2].match(/.{2}/g);
  return { level: m[1], skills: SHARE_SKILLS.map((s, i) => ({ ...s, level: parts[i] === '--' ? null : parts[i] })) };
}

export const levelIndex = (l) => LV.indexOf(l);
