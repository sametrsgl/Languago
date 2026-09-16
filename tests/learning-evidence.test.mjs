import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeLearningEvidence } from '../src/lib/learning-evidence.mjs';

test('evidence keeps exposure, completion, accuracy, confidence, mastery, and recency separate', () => {
  const result = summarizeLearningEvidence([
    { module: 'grammar', updated_at: '2026-09-15T10:00:00Z', payload: {
      viewedCount: 8, attempted: 5, correct: 4, completedCount: 2, masteryPct: 72,
    } },
    { module: 'vocab-path', updated_at: '2026-09-16T08:00:00Z', payload: {
      status: 'diagnosed', confidence: 0.64, dueCount: 3,
    } },
  ]);

  assert.deepEqual(result.modules, ['grammar', 'vocab-path']);
  assert.equal(result.exposure, 8);
  assert.equal(result.completed, 2);
  assert.equal(result.attempted, 5);
  assert.equal(result.correct, 4);
  assert.equal(result.accuracyPct, 80);
  assert.equal(result.confidencePct, 64);
  assert.equal(result.masteryPct, 72);
  assert.equal(result.dueCount, 3);
  assert.equal(result.lastActivityAt, '2026-09-16T08:00:00Z');
});

test('evidence does not infer accuracy or mastery from viewed counts and ignores invalid numbers', () => {
  const result = summarizeLearningEvidence([
    { module: 'vocab', payload: { viewedCount: 12, latestResult: 90, masteryPct: 'not-a-number' } },
    { module: 'reading', payload: { attempted: 0, correct: 4, completedCount: -2 } },
  ]);

  assert.equal(result.exposure, 12);
  assert.equal(result.attempted, 0);
  assert.equal(result.correct, 0);
  assert.equal(result.accuracyPct, null);
  assert.equal(result.masteryPct, null);
  assert.equal(result.completed, 0);
});

test('duplicate module rows are counted independently for evidence but module labels are unique', () => {
  const result = summarizeLearningEvidence([
    { module: 'game', payload: { attempted: 2, correct: 1 } },
    { module: 'game', payload: { attempted: 3, correct: 3 } },
  ]);

  assert.deepEqual(result.modules, ['game']);
  assert.equal(result.attempted, 5);
  assert.equal(result.correct, 4);
  assert.equal(result.accuracyPct, 80);
});
