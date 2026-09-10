export function visibleGrammarActivities(input = {}) {
  const quizCount = clampCount(input.quizCount);
  const practiceCount = clampCount(input.practiceCount);
  const guidedCount = clampCount(input.guidedCount);
  const productionCount = clampCount(input.productionCount);
  const pronounRelated = !!input.pronounRelated;
  const activities = [];
  if (guidedCount > 0) activities.push({ key: 'guided', total: guidedCount, label: 'Rehberli kontrol' });
  if (quizCount > 0) activities.push({ key: 'mcq', total: quizCount, label: 'Test' });
  if (practiceCount > 0) activities.push({ key: 'gap', total: practiceCount, label: 'Boşluk' });
  if (pronounRelated) {
    activities.push({ key: 'apply', total: clampCount(input.applyCount ?? 5), label: 'Hızlı uygulama' });
    activities.push({ key: 'match', total: clampCount(input.matchCount ?? 6), label: 'Eşleştirme' });
  }
  if (productionCount > 0) activities.push({ key: 'production', total: productionCount, label: 'Cümle üretimi' });
  return activities.filter((a) => a.total > 0);
}

export function grammarProgressSnapshot({ totals = {}, done = {}, correct = {} } = {}) {
  const keys = Object.keys(totals).filter((key) => key !== 'jumble' && clampCount(totals[key]) > 0);
  const total = keys.reduce((sum, key) => sum + clampCount(totals[key]), 0);
  let completed = 0;
  let correctCount = 0;
  for (const key of keys) {
    const max = clampCount(totals[key]);
    completed += Math.min(max, clampCount(done[key]));
    correctCount += Math.min(max, clampCount(correct[key]));
  }
  const completionPct = total ? Math.round((completed / total) * 100) : 0;
  const masteryPct = total ? Math.round((correctCount / total) * 100) : 0;
  return {
    completed,
    correct: correctCount,
    total,
    completionPct: clampPct(completionPct),
    masteryPct: clampPct(masteryPct),
    displayPct: clampPct(completionPct),
  };
}

export function grammarProgressPayload({ level, unit, title, totals = {}, done = {}, correct = {}, shownIds = [] } = {}) {
  const snap = grammarProgressSnapshot({ totals, done, correct });
  return {
    level,
    unit,
    title,
    correct: snap.correct,
    completed: snap.completed,
    total: snap.total,
    completionPct: snap.completionPct,
    masteryPct: snap.masteryPct,
    displayPct: snap.displayPct,
    shownIds: uniqueStrings(shownIds),
  };
}

export function grammarFeedbackForChoice(qq, chosenIdx) {
  const options = Array.isArray(qq?.options) ? qq.options : [];
  const answerIdx = Number.isInteger(qq?.a) ? qq.a : -1;
  const chosen = options[chosenIdx] ?? '';
  const answer = options[answerIdx] ?? '';
  const correct = chosenIdx === answerIdx;
  const chosenWhy = explainAt(qq, chosenIdx);
  const answerWhy = explainAt(qq, answerIdx);
  const fallbackWhy = typeof qq?.why === 'string' ? qq.why : '';
  if (correct) {
    return {
      correct: true,
      chosen,
      answer,
      message: `✓ Doğru: ${answer}. ${answerWhy || fallbackWhy || 'Kuralı doğru uyguladın.'}`.trim(),
    };
  }
  const pieces = [`Seçimin: ${chosen || '—'}`];
  if (chosenWhy) pieces.push(chosenWhy);
  pieces.push(`Doğru cevap: ${answer || '—'}`);
  if (answerWhy) pieces.push(answerWhy);
  else if (fallbackWhy) pieces.push(fallbackWhy);
  return { correct: false, chosen, answer, message: pieces.join(' · ') };
}

function explainAt(qq, idx) {
  if (!qq) return '';
  if (Array.isArray(qq.why) && idx >= 0 && idx < qq.why.length && qq.why[idx]) return String(qq.why[idx]);
  if (qq.explanations && Array.isArray(qq.explanations) && idx >= 0 && idx < qq.explanations.length && qq.explanations[idx]) return String(qq.explanations[idx]);
  return '';
}

function clampCount(n) {
  n = Number(n || 0);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.floor(n);
}

function clampPct(n) {
  n = Number(n || 0);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

function uniqueStrings(items) {
  const out = [];
  const seen = new Set();
  for (const item of Array.isArray(items) ? items : []) {
    const s = String(item || '').trim();
    if (!s || seen.has(s)) continue;
    seen.add(s);
    out.push(s);
  }
  return out;
}
