import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createMemoryQuestionHistoryStorage,
  getQuestionHistory,
  recordShownQuestionIds,
  selectQuestionIds,
} from '../../src/lib/question-history.mjs';

const ids = ['q1', 'q2', 'q3'];

test('selects unseen IDs first without duplicates and does not record until shown', () => {
  const storage = createMemoryQuestionHistoryStorage();
  const selected = selectQuestionIds({ ids, count: 2, userId: 'u1', activityKey: 'grammar:a1', storage, now: 10 });

  assert.equal(new Set(selected).size, selected.length);
  assert.deepEqual(selected, ['q1', 'q2']);
  assert.deepEqual(getQuestionHistory({ userId: 'u1', activityKey: 'grammar:a1', storage }).shown, []);

  recordShownQuestionIds({ ids: selected.slice(0, 1), userId: 'u1', activityKey: 'grammar:a1', storage, now: 11 });
  assert.deepEqual(getQuestionHistory({ userId: 'u1', activityKey: 'grammar:a1', storage }).shown.map((r) => r.id), ['q1']);
});

test('uses per user and activity namespaces', () => {
  const storage = createMemoryQuestionHistoryStorage();
  recordShownQuestionIds({ ids: ['q1'], userId: 'u1', activityKey: 'quiz', storage, now: 1 });

  assert.deepEqual(selectQuestionIds({ ids: ['q1', 'q2'], count: 1, userId: 'u2', activityKey: 'quiz', storage }), ['q1']);
  assert.deepEqual(selectQuestionIds({ ids: ['q1', 'q2'], count: 1, userId: 'u1', activityKey: 'reading', storage }), ['q1']);
  assert.deepEqual(selectQuestionIds({ ids: ['q1', 'q2'], count: 1, userId: 'u1', activityKey: 'quiz', storage }), ['q2']);
});

test('falls back to least recently used after unseen are exhausted', () => {
  const storage = createMemoryQuestionHistoryStorage();
  recordShownQuestionIds({ ids: ['q1'], userId: 'u1', activityKey: 'game', storage, now: 100 });
  recordShownQuestionIds({ ids: ['q2'], userId: 'u1', activityKey: 'game', storage, now: 200 });

  assert.deepEqual(selectQuestionIds({ ids: ['q1', 'q2'], count: 1, userId: 'u1', activityKey: 'game', storage }), ['q1']);
});

test('avoids immediate prior repeat when alternatives exist', () => {
  const storage = createMemoryQuestionHistoryStorage();
  recordShownQuestionIds({ ids: ['q1'], userId: 'u1', activityKey: 'game', storage, now: 100 });
  recordShownQuestionIds({ ids: ['q2'], userId: 'u1', activityKey: 'game', storage, now: 200 });

  assert.deepEqual(selectQuestionIds({ ids: ['q1', 'q2'], count: 1, userId: 'u1', activityKey: 'game', storage }), ['q1']);
});

test('caps request to available pool and tolerates corrupt or denied storage', () => {
  const corruptStorage = {
    value: '{not-json',
    getItem() { return this.value; },
    setItem() { throw new Error('denied'); },
    removeItem() {},
  };

  assert.deepEqual(selectQuestionIds({ ids: ['q1'], count: 5, userId: 'u1', activityKey: 'quiz', storage: corruptStorage }), ['q1']);
  assert.doesNotThrow(() => recordShownQuestionIds({ ids: ['q1'], userId: 'u1', activityKey: 'quiz', storage: corruptStorage }));
});
