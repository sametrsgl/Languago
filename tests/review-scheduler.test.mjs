import test from 'node:test';
import assert from 'node:assert/strict';
import { REVIEW_RATINGS, scheduleReview, selectDueReviews } from '../src/lib/review-scheduler.mjs';

const now = 1_700_000_000_000;

test('review scheduling moves an item into the future after a good answer', () => {
  const next = scheduleReview({ itemId: 'word:adapt', skill: 'vocabulary' }, REVIEW_RATINGS.GOOD, now);
  assert.equal(next.itemId, 'word:adapt');
  assert.equal(next.repetitions, 1);
  assert.ok(next.dueAt > now);
  assert.equal(next.lastRating, REVIEW_RATINGS.GOOD);
});

test('again resets repetitions, records a lapse, and schedules a short retry', () => {
  const next = scheduleReview({ itemId: 'grammar:q1', repetitions: 4, stabilityDays: 8, lapses: 1 }, REVIEW_RATINGS.AGAIN, now);
  assert.equal(next.repetitions, 0);
  assert.equal(next.lapses, 2);
  assert.ok(next.dueAt > now && next.dueAt < now + 24 * 60 * 60 * 1000);
});

test('due queue is deterministic and capped', () => {
  const items = [
    { itemId: 'b', dueAt: now - 10, difficulty: 7 },
    { itemId: 'a', dueAt: now - 10, difficulty: 3 },
    { itemId: 'future', dueAt: now + 100 },
  ];
  assert.deepEqual(selectDueReviews(items, now, 2).map((item) => item.itemId), ['a', 'b']);
});
