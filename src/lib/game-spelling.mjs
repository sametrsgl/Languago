export function normalizeSpellingMode(mode = 'tr2en') {
  return mode === 'en2tr' ? 'en2tr' : 'tr2en';
}

export function buildSpellingPrompt(word, mode = 'tr2en') {
  const actualMode = normalizeSpellingMode(mode);
  const english = sanitizeTarget(word?.w || '');
  const turkish = firstMeaning(word?.t || '');
  if (actualMode === 'en2tr') {
    return {
      mode: 'en2tr',
      label: 'Opsiyonel ters mod: İngilizce ipucundan Türkçe yaz',
      clue: english,
      target: sanitizeTarget(turkish, true),
    };
  }
  return {
    mode: 'tr2en',
    label: 'Türkçe ipucundan İngilizce yaz',
    clue: `${turkish}${word?.d ? ` — ${word.d}` : ''}`,
    target: english,
  };
}

export function gradeTypedSpelling(input, target, previousMistakes = 0) {
  const correct = normalizeAnswer(input) === normalizeAnswer(target);
  const mistakes = correct ? Math.max(0, Number(previousMistakes || 0)) : Math.max(0, Number(previousMistakes || 0)) + 1;
  return { correct, mistakes };
}

export function sanitizeTarget(value, allowTurkish = false) {
  const re = allowTurkish ? /[^\p{L}\s]/gu : /[^A-Za-z\s'-]/g;
  return String(value || '').replace(re, '').replace(/\s+/g, ' ').trim();
}

function normalizeAnswer(value) {
  return String(value || '').trim().toLocaleLowerCase('en').replace(/\s+/g, ' ');
}

function firstMeaning(t) {
  return String(t || '').split(',')[0].trim();
}
