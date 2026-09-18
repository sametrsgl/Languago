import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };

test('placement pool has exactly 10,000 stored records across CEFR levels (not calibrated items)', () => {
  assert.equal(pool.total, 10_000);
  assert.equal(pool.questions.length, 10_000);
  const ids = new Set(pool.questions.map((question) => question.id));
  assert.equal(ids.size, 10_000);
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.ok(pool.questions.some((question) => question.level === level), level);
  }
});

test('placement pool items have valid answer indexes and source identity', () => {
  for (const question of pool.questions) {
    assert.ok(question.sourceId);
    assert.ok(Array.isArray(question.options));
    assert.ok(question.options.length >= 2);
    assert.ok(Number.isInteger(question.answer));
    assert.ok(question.answer >= 0 && question.answer < question.options.length);
  }
});
