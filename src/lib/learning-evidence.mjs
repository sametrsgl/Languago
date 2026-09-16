function firstNumber(payload, keys) {
  for (const key of keys) {
    const value = payload?.[key];
    const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return 0;
}

function percentage(value, max = 100) {
  const number = typeof value === 'number' ? value : typeof value === 'string' && value.trim() ? Number(value) : NaN;
  return Number.isFinite(number) && number >= 0 && number <= max ? number : null;
}

/**
 * Reduce legacy student_progress payloads into explicitly labelled evidence.
 * Missing fields remain zero/null; this function never turns exposure into
 * accuracy or a single result into mastery.
 */
export function summarizeLearningEvidence(rows = []) {
  const modules = [];
  let exposure = 0;
  let completed = 0;
  let attempted = 0;
  let correct = 0;
  let confidence = null;
  let mastery = null;
  let dueCount = 0;
  let lastActivityAt = null;

  for (const row of Array.isArray(rows) ? rows : []) {
    if (!row || typeof row !== 'object') continue;
    const module = String(row.module ?? '').trim();
    if (module && !modules.includes(module)) modules.push(module);
    const payload = row.payload && typeof row.payload === 'object' ? row.payload : {};

    exposure += firstNumber(payload, ['exposureCount', 'viewedCount']);
    completed += firstNumber(payload, ['completedCount', 'completedSteps']);
    attempted += firstNumber(payload, ['attempted', 'answered', 'questionsAttempted']);
    correct += firstNumber(payload, ['correct', 'correctCount']);

    const rowConfidence = percentage(payload.confidence, 1);
    if (rowConfidence !== null) confidence = Math.max(confidence ?? 0, rowConfidence);
    const rowMastery = percentage(payload.masteryPct);
    if (rowMastery !== null) mastery = mastery === null ? rowMastery : Math.max(mastery, rowMastery);
    dueCount += firstNumber(payload, ['dueCount', 'reviewDue', 'due']);

    const updated = typeof row.updated_at === 'string' && !Number.isNaN(Date.parse(row.updated_at))
      ? row.updated_at
      : null;
    if (updated && (!lastActivityAt || Date.parse(updated) > Date.parse(lastActivityAt))) lastActivityAt = updated;
  }

  return {
    modules,
    exposure: Math.floor(exposure),
    completed: Math.floor(completed),
    attempted: Math.floor(attempted),
    correct: Math.min(Math.floor(correct), Math.floor(attempted)),
    accuracyPct: attempted > 0 ? Math.round(Math.min(1, correct / attempted) * 100) : null,
    confidencePct: confidence === null ? null : Math.round(confidence * 100),
    masteryPct: mastery === null ? null : Math.round(mastery),
    dueCount: Math.floor(dueCount),
    lastActivityAt,
  };
}
