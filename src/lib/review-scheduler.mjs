const DAY_MS = 24 * 60 * 60 * 1000;

export const REVIEW_RATINGS = Object.freeze({ AGAIN: 0, HARD: 1, GOOD: 2, EASY: 3 });

function finite(value, fallback) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

export function normalizeReviewItem(input = {}, now = Date.now()) {
  const id = String(input.itemId ?? input.id ?? '').trim();
  if (!id) throw new TypeError('review itemId is required');
  const dueAt = finite(input.dueAt, now);
  return {
    itemId: id,
    skill: String(input.skill ?? 'vocabulary').trim() || 'vocabulary',
    stabilityDays: Math.max(0.1, finite(input.stabilityDays, 0)),
    difficulty: Math.min(10, Math.max(1, finite(input.difficulty, 5))),
    dueAt,
    repetitions: Math.max(0, Math.floor(finite(input.repetitions, 0))),
    lapses: Math.max(0, Math.floor(finite(input.lapses, 0))),
    lastReviewedAt: finite(input.lastReviewedAt, 0),
    lastRating: input.lastRating == null ? null : Math.max(0, Math.min(3, Math.floor(finite(input.lastRating, 0)))),
  };
}

export function scheduleReview(input, rating, now = Date.now()) {
  const item = normalizeReviewItem(input, now);
  const score = Math.max(0, Math.min(3, Math.floor(finite(rating, REVIEW_RATINGS.AGAIN))));
  const firstReview = item.repetitions === 0;
  let stabilityDays = item.stabilityDays;
  let lapses = item.lapses;
  let repetitions = item.repetitions;
  let difficulty = item.difficulty;

  if (score === REVIEW_RATINGS.AGAIN) {
    lapses += 1;
    repetitions = 0;
    stabilityDays = 0.08;
    difficulty = Math.min(10, difficulty + 0.5);
  } else if (score === REVIEW_RATINGS.HARD) {
    repetitions += 1;
    stabilityDays = Math.max(0.5, (stabilityDays || 1) * 1.2);
    difficulty = Math.min(10, difficulty + 0.15);
  } else if (score === REVIEW_RATINGS.GOOD) {
    repetitions += 1;
    stabilityDays = firstReview ? 1 : Math.max(1, (stabilityDays || 1) * 2.3);
    difficulty = Math.max(1, difficulty - 0.15);
  } else {
    repetitions += 1;
    stabilityDays = firstReview ? 4 : Math.max(2, (stabilityDays || 1) * 3.5);
    difficulty = Math.max(1, difficulty - 0.35);
  }

  return {
    ...item,
    stabilityDays: Math.round(stabilityDays * 100) / 100,
    difficulty: Math.round(difficulty * 100) / 100,
    dueAt: now + stabilityDays * DAY_MS,
    repetitions,
    lapses,
    lastReviewedAt: now,
    lastRating: score,
  };
}

export function selectDueReviews(items = [], now = Date.now(), limit = 20) {
  return items
    .map((item) => normalizeReviewItem(item, now))
    .filter((item) => item.dueAt <= now)
    .sort((a, b) => a.dueAt - b.dueAt || a.difficulty - b.difficulty || a.itemId.localeCompare(b.itemId))
    .slice(0, Math.max(0, Math.floor(finite(limit, 20))));
}

export const REVIEW_DAY_MS = DAY_MS;
