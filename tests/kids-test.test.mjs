import test from 'node:test';
import assert from 'node:assert/strict';
import { kidsBank, publicKids, kidCorrect, scoreKids, kidLevel } from '../src/lib/kids-test.ts';

test('kids bank: three levels, four distinct options, no keys in the public copy', () => {
  const b = kidsBank();
  const qs = [...b.items, ...b.units.flatMap((u) => u.questions)];
  assert.equal(new Set(qs.map((q) => q.id)).size, qs.length);
  for (const q of qs) { assert.equal(q.options.length, 4); assert.equal(new Set(q.options).size, 4, q.stem); }
  for (const lv of [1, 2, 3]) assert.ok(b.items.filter((i) => i.b === lv && i.skill === 'grammar').length >= 10);
  assert.doesNotMatch(JSON.stringify(publicKids()), /"answer"/);
});

test('kids scoring follows the answers and can skip listening', () => {
  const b = kidsBank();
  const pick = (skill, n) => b.items.filter((i) => i.skill === skill && i.b === 3).slice(0, n);
  const units = (skill) => b.units.filter((u) => u.skill === skill && u.b === 3).flatMap((u) => u.questions);
  const set = [...pick('words', 10), ...pick('grammar', 8), ...units('reading'), ...units('listening')];
  const right = scoreKids(set.map((q) => ({ id: q.id, choice: q.answer })), 11);
  assert.equal(right.result.overall.level, 'A2');
  const noListen = set.filter((q) => q.skill !== 'listening');
  assert.equal(scoreKids(noListen.map((q) => ({ id: q.id, choice: q.answer })), 11), null);
  assert.ok(scoreKids(noListen.map((q) => ({ id: q.id, choice: q.answer })), 11, { skipListening: true }));
  assert.equal(kidCorrect(set[0].id, set[0].answer), true);
  assert.equal(kidLevel(0.5), 'Pre-A1');
});
