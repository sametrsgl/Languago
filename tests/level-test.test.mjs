import test from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, SECTIONS, estimate, levelOf, levelB, createSession, nextStep, recordAnswer, result, optionOrder, startTheta, rng } from '../src/lib/level-test.mjs';

// A tiny synthetic bank: 30 items per skill per level, 6 units per skill per level.
function fakeBank() {
  const items = [], units = [];
  for (const skill of ['vocab', 'grammar']) for (const level of LEVELS) for (let i = 0; i < 30; i++) items.push({ id: `${skill}-${level}-${i}`, skill, level });
  for (const skill of ['reading', 'listening']) for (const level of LEVELS) for (let i = 0; i < 6; i++) {
    units.push({ id: `${skill}-${level}-u${i}`, skill, level, questions: [0, 1, 2, 3].map((q) => ({ id: `${skill}-${level}-u${i}-q${q}`, skill, level })) });
  }
  return { items, units };
}

// Simulate a learner of true ability `theta` taking the whole test.
function simulate(trueTheta, seed, selfReport = 2) {
  const bank = fakeBank();
  const r = rng(seed * 31 + 7);
  const p = (b) => 1 / (1 + Math.exp(-1.7 * (trueTheta - b)));
  let s = createSession({ selfReport, seed });
  for (let guard = 0; guard < 200; guard++) {
    const step = nextStep(s, bank);
    if (step.type === 'done') break;
    if (step.type === 'item') s = recordAnswer(s, step.item, 0, r() < p(levelB(step.item.level)));
    else for (const q of step.unit.questions) s = recordAnswer(s, q, 0, r() < p(levelB(q.level)), step.unit.id);
  }
  return { s, res: result(s.answers, selfReport) };
}

test('levels map from ability with a mastery margin', () => {
  assert.equal(levelOf(3.5).level, 'B1');
  assert.equal(levelOf(3.2).level, 'A2');
  assert.equal(levelOf(0.5).level, 'A1');
  assert.equal(levelOf(0.5).below, true);
  assert.equal(levelOf(6.9).level, 'C2');
});

test('estimate moves with answers and stays finite when all right or all wrong', () => {
  const allRight = estimate(Array(12).fill({ b: 3, correct: true }), 3);
  const allWrong = estimate(Array(12).fill({ b: 3, correct: false }), 3);
  assert.ok(allRight.theta > 4 && allRight.theta <= 7);
  assert.ok(allWrong.theta < 2 && allWrong.theta >= 0);
  assert.ok(estimate([], 3).sd > 1);
});

test('a full test has the planned length and ends', () => {
  const { s } = simulate(3.5, 11);
  const by = (k) => s.answers.filter((a) => a.skill === k).length;
  assert.equal(by('vocab'), 12);
  assert.equal(by('grammar'), 12);
  assert.equal(by('reading'), 12); // 3 units x 4
  assert.equal(by('listening'), 16); // 4 units x 4 in the fake bank
  assert.equal(new Set(s.answers.map((a) => a.id)).size, s.answers.length, 'no item twice');
});

test('simulated learners land near their true level', () => {
  for (const [trueTheta, expected] of [[1.6, ['A1']], [2.9, ['A2', 'B1']], [3.9, ['B1', 'B2']], [5.0, ['B2', 'C1']], [6.6, ['C1', 'C2']]]) {
    let hits = 0;
    for (let seed = 1; seed <= 20; seed++) if (expected.includes(simulate(trueTheta, seed).res.overall.level)) hits++;
    assert.ok(hits >= 17, `theta ${trueTheta}: ${hits}/20 in ${expected}`);
  }
});

test('the self-report only nudges the start, answers decide', () => {
  const low = simulate(5.0, 3, 0).res.overall.theta;
  const high = simulate(5.0, 3, 4).res.overall.theta;
  assert.ok(Math.abs(low - high) < 0.8);
  assert.ok(startTheta(9) === startTheta(4));
});

test('result names strongest and weakest skill', () => {
  const answers = [
    ...Array(12).fill(0).map((_, i) => ({ skill: 'vocab', b: 4, correct: i < 10 })),
    ...Array(12).fill(0).map((_, i) => ({ skill: 'grammar', b: 3, correct: i < 5 })),
  ];
  const r = result(answers, 2);
  assert.equal(r.strongest, 'vocab');
  assert.equal(r.weakest, 'grammar');
  assert.ok(r.skills.vocab.correct === 10);
});

test('option order is fixed per item and is a permutation', () => {
  const a = optionOrder('vocab-x', 4), b = optionOrder('vocab-x', 4);
  assert.deepEqual(a, b);
  assert.deepEqual([...a].sort(), [0, 1, 2, 3]);
  // the authored-first correct answer does not always stay first
  const firsts = new Set(Array.from({ length: 40 }, (_, i) => optionOrder('id' + i, 4).indexOf(0)));
  assert.ok(firsts.size >= 3);
});

test('sections are the agreed four', () => {
  assert.deepEqual(SECTIONS.map((s) => s.key), ['vocab', 'grammar', 'reading', 'listening']);
});
