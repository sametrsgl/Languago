import test from 'node:test';
import assert from 'node:assert/strict';
import { GRAMMAR_MCQ_A1 } from '../../src/data/grammar_mcq_a1.js';
import pool from '../../src/data/placement-question-pool.json' with { type: 'json' };
import registry from '../../docs/v2/question-registry.json' with { type: 'json' };
import { replayPlacementAnswers } from '../../src/lib/placement-test.mjs';
import { classQuestionFeedback } from '../../src/lib/game-classroom.mjs';

const prompt = 'The students ___ English every day. (study)';
const source = GRAMMAR_MCQ_A1['a1-05'].find((q) => q.q === prompt);
const variants = pool.questions.filter((q) => q.source === 'grammar' && q.sourceId === 'a1-05-8');

test('plural students takes study, not the third-person singular studies', () => {
  assert.equal(source.options[source.a], 'study');
  assert.equal(source.why.length, source.options.length);
  assert.match(source.why[source.a], /çoğul.*study/);
  assert.match(source.why[source.options.indexOf('studies')], /tekil/);
});

test('every stored option rotation scores study correctly and rejects studies during replay', () => {
  assert.equal(variants.length, 4);
  for (const question of variants) {
    assert.equal(question.options[question.answer], 'study', question.id);
    assert.equal(question.why, source.why[source.a], question.id);
    for (const [option, correct] of [['study', true], ['studies', false]]) {
      const state = replayPlacementAnswers([{ id: question.id, selectedIndex: question.options.indexOf(option) }], pool.questions);
      assert.equal(state.questions[0].correct, correct, `${question.id}: ${option}`);
      assert.equal(state.stats.A1.correct, Number(correct));
    }
  }
});

test('classroom feedback credits the plural form and explains the singular distractor', () => {
  const right = classQuestionFeedback(source, source.options.indexOf('study'));
  const wrong = classQuestionFeedback(source, source.options.indexOf('studies'));
  assert.equal(right.correct, true);
  assert.match(right.message, /Doğru cevap: study ·.*çoğul/);
  assert.equal(wrong.correct, false);
  assert.match(wrong.message, /tekil/);
});

test('answer-key repair preserves the prompt, registry identity and existing placement IDs', () => {
  const entry = Object.values(registry.entries).find((q) => q.sourcePool === 'grammar:a1:a1-05' && q.firstStem === prompt);
  assert.equal(entry.id, 'q_fafebf4fd61e');
  assert.ok(variants.every((q) => q.prompt === prompt));
  assert.deepEqual(variants.map((q) => q.id), ['placement-00096', 'placement-03263', 'placement-06430', 'placement-09597']);
});

test('all generated grammar options, answer text and explanation match the actual source bank', async () => {
  const banks = {};
  for (const level of ['A1', 'A2', 'B1', 'B2', 'C1']) {
    banks[level] = (await import(`../../src/data/grammar_mcq_${level.toLowerCase()}.js`))[`GRAMMAR_MCQ_${level}`];
  }
  for (const q of pool.questions.filter((q) => q.source === 'grammar')) {
    const [, unit, index] = q.sourceId.match(/^(.+)-(\d+)$/);
    const original = banks[q.level][unit][Number(index) - 1];
    assert.equal(q.prompt, original.q, q.id);
    assert.deepEqual([...q.options].sort(), [...original.options].sort(), q.id);
    assert.equal(q.options[q.answer], original.options[original.a], q.id);
    assert.equal(q.why, original.why?.[original.a] || '', q.id);
  }
});
