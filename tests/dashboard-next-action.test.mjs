import test from 'node:test';
import assert from 'node:assert/strict';
import { getNextLearningAction } from '../src/lib/dashboard-next-action.mjs';

test('next action prioritizes due review with an evidence reason', () => {
  const result = getNextLearningAction({ progress: [{ module: 'vocab', payload: { dueCount: 3 } }], steps: [{ module: 'vocab', done: true }] });
  assert.deepEqual(result, { href: '/dashboard/kelimeler', label: 'Kelime tekrarını başlat', reason: '3 kelimenin tekrar zamanı geldi.', evidence: 'due' });
});

test('next action distinguishes a new learner from an incomplete module', () => {
  const fresh = getNextLearningAction({ progress: [], steps: [{ module: 'vocab', done: false }] });
  assert.equal(fresh.evidence, 'unseen');
  assert.match(fresh.reason, /tanılama|başla/i);

  const learner = getNextLearningAction({ progress: [{ module: 'vocab', payload: { viewedCount: 4 } }], steps: [{ module: 'vocab', done: true }, { module: 'grammar', done: false }] });
  assert.equal(learner.href, '/dashboard/dilbilgisi');
  assert.equal(learner.evidence, 'next-module');
});

test('invalid due counts never create a misleading recommendation', () => {
  const result = getNextLearningAction({ progress: [{ module: 'vocab', payload: { dueCount: -2 } }], steps: [{ module: 'vocab', done: true }] });
  assert.notEqual(result.evidence, 'due');
});
