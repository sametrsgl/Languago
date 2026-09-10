export function scopedViewedWords({ viewed = {}, words = {}, scope = 'all', shownIds = null } = {}) {
  const out = [];
  const allowedShown = Array.isArray(shownIds) ? new Set(shownIds.map(String)) : null;
  for (const key of Object.keys(viewed || {})) {
    const w = words[key] || words[String(key).toLowerCase()];
    if (!w) continue;
    const wordKey = w.w || key;
    if (allowedShown && !allowedShown.has(wordKey)) continue;
    if (scope !== 'all' && (!Array.isArray(w.lv) || !w.lv.includes(scope))) continue;
    out.push(wordKey);
  }
  return out.sort((a, b) => a.localeCompare(b));
}

export function repetitionPrompt(word, revealed = false) {
  const tr = firstMeaning(word?.t);
  const def = word?.d ? String(word.d) : '';
  if (!revealed) {
    return {
      mode: 'recall-en-from-tr',
      canGrade: false,
      cue: `Türkçe anlam: ${tr}${def ? ` — Tanım: ${def}` : ''}. İngilizce kelimeyi zihninde söyle veya yaz; sonra cevabı aç.`,
    };
  }
  return {
    mode: 'self-grade',
    canGrade: true,
    answer: word?.w || '',
    cue: `${word?.w || ''} — ${tr}${def ? ` · ${def}` : ''}`,
  };
}

export function repetitionGrade({ word, grade } = {}) {
  const g = String(grade || '').toLowerCase();
  return {
    word: String(word || ''),
    grade: g,
    mastered: g === 'known',
    repeat: g === 'again' || g === 'unknown',
  };
}

function firstMeaning(t) {
  if (!t) return '';
  return String(t).split(',')[0].trim();
}
