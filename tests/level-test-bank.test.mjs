import test from 'node:test';
import assert from 'node:assert/strict';
import { bank, publicBank, isCorrect, scoreTest } from '../src/lib/level-test-bank.ts';

test('bank has the planned size, unique ids and four options each', () => {
  const b = bank();
  const qs = [...b.items, ...b.units.flatMap((u) => u.questions)];
  assert.equal(qs.length, 438);
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
  for (const q of qs) {
    assert.equal(q.options.length, 4, q.stem);
    assert.equal(new Set(q.options).size, 4, q.stem);
    assert.ok(q.answer >= 0 && q.answer < 4);
  }
  for (const skill of ['vocab', 'grammar']) for (const l of ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']) {
    assert.equal(b.items.filter((i) => i.skill === skill && i.level === l).length, 24, `${skill} ${l}`);
  }
});

test('the public bank leaks no answer keys', () => {
  const text = JSON.stringify(publicBank());
  assert.doesNotMatch(text, /"answer"/);
  // listening scripts are sent for the device-voice fallback; keys never are
});

test('checking and scoring use the server keys', () => {
  const b = bank();
  const item = b.items[0];
  assert.equal(isCorrect(item.id, item.answer), true);
  assert.equal(isCorrect(item.id, (item.answer + 1) % 4), false);
  assert.equal(isCorrect('nope', 0), null);
  // a learner who answers everything right gets a high level; too few answers -> null
  const all = [...b.items.filter((i) => i.skill === 'vocab').slice(0, 12), ...b.items.filter((i) => i.skill === 'grammar').slice(0, 12),
    ...b.units.filter((u) => u.skill === 'reading').slice(0, 3).flatMap((u) => u.questions),
    ...b.units.filter((u) => u.skill === 'listening').slice(0, 3).flatMap((u) => u.questions)];
  const right = scoreTest(all.map((q) => ({ id: q.id, choice: q.answer })), 2);
  const wrong = scoreTest(all.map((q) => ({ id: q.id, choice: (q.answer + 1) % 4 })), 2);
  assert.ok(right && wrong);
  assert.ok(right.result.overall.theta > wrong.result.overall.theta + 2);
  assert.equal(scoreTest(all.slice(0, 5).map((q) => ({ id: q.id, choice: q.answer })), 2), null);
  // a forged "correct" flag from the page is ignored
  const forged = scoreTest(all.map((q) => ({ id: q.id, choice: (q.answer + 1) % 4, correct: true })), 2);
  assert.equal(forged.result.overall.level, wrong.result.overall.level);
});
