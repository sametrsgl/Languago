import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };
import {
  createPlacementState,
  recordPlacementAnswer,
  selectNextPlacementQuestion,
  shouldFinishPlacement,
} from '../src/lib/placement-test.mjs';

function answered(question) {
  return recordPlacementAnswer(createPlacementState(), question, false, 0);
}

const grammar = { id: 'first', source: 'grammar', level: 'A1', prompt: 'She ___ a teacher.' };

test('does not select a rotated copy from the actual placement pool', () => {
  const original = pool.questions[0];
  const variants = pool.questions.filter((question) => question.sourceId === original.sourceId);
  assert.ok(variants.length > 1);
  assert.equal(selectNextPlacementQuestion({ state: answered(original), pool: variants }), null);
});

test('skips the same normalized grammar stem even with a different ID, source ID or level', () => {
  const copy = { ...grammar, id: 'copy', sourceId: 'another-unit-1', level: 'A2', prompt: '  SHE   ___ a teacher.  ' };
  const fresh = { ...grammar, id: 'fresh', level: 'A2', prompt: 'They ___ at school.' };
  assert.equal(selectNextPlacementQuestion({ state: answered(grammar), pool: [grammar, copy, fresh] }).id, 'fresh');
});

test('preserves contractions, possessives and punctuation when comparing stems', () => {
  const original = { ...grammar, prompt: "The teacher's ready." };
  const distinct = { ...grammar, id: 'distinct', prompt: 'The teachers ready.' };
  assert.equal(selectNextPlacementQuestion({ state: answered(original), pool: [original, distinct] }).id, 'distinct');
});

test('reading variants are excluded without collapsing generic stems in different passages', () => {
  const original = { ...grammar, source: 'reading', sourceId: 'a1-r01-1', passageTitle: 'The visit', prompt: 'What is the main idea?' };
  const copy = { ...original, id: 'copy' };
  const otherPassage = { ...original, id: 'other', sourceId: 'a1-r02-1' };
  assert.equal(selectNextPlacementQuestion({ state: answered(original), pool: [original, copy, otherPassage] }).id, 'other');
});

test('reading questions without a source ID retain their passage title context', () => {
  const original = { ...grammar, source: 'reading', passageTitle: 'The visit', prompt: 'What is the main idea?' };
  const copy = { ...original, id: 'copy' };
  const otherPassage = { ...original, id: 'other', passageTitle: 'The meeting' };
  assert.equal(selectNextPlacementQuestion({ state: answered(original), pool: [original, copy, otherPassage] }).id, 'other');
});

test('legacy ID-only histories resolve seen stems from the current pool without mutation', () => {
  const state = { ...createPlacementState(), questions: [{ id: grammar.id }] };
  const questions = [grammar, { ...grammar, id: 'copy' }];
  const before = structuredClone({ state, questions });
  assert.equal(selectNextPlacementQuestion({ state, pool: questions }), null);
  assert.deepEqual({ state, questions }, before);
});

test('unknown historical IDs do not block fresh questions', () => {
  const state = { ...createPlacementState(), questions: [{ id: 'removed-from-pool' }] };
  assert.equal(selectNextPlacementQuestion({ state, pool: [grammar] }).id, grammar.id);
});

test('real-pool adaptive attempts retain gradual levels, stop and never reuse content', () => {
  for (const pattern of [() => true, () => false, (index) => index % 3 !== 2]) {
    let state = createPlacementState();
    const seen = new Set();
    while (!shouldFinishPlacement(state)) {
      const question = selectNextPlacementQuestion({ state, pool: pool.questions });
      assert.ok(question, 'real pool must have enough distinct questions');
      const identity = JSON.stringify([
        question.source,
        question.source === 'reading' ? question.sourceId.replace(/-\d+$/, '') : '',
        question.prompt.trim().toLowerCase().replace(/\s+/g, ' '),
      ]);
      assert.ok(!seen.has(identity), `repeated content: ${question.id}`);
      seen.add(identity);
      const previousLevel = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(state.nextLevel);
      state = recordPlacementAnswer(state, question, pattern(state.questions.length));
      const nextLevel = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].indexOf(state.nextLevel);
      assert.ok(Math.abs(nextLevel - previousLevel) <= 1);
      assert.ok(state.questions.length <= 24);
    }
    assert.ok(state.questions.length >= 8);
  }
});
