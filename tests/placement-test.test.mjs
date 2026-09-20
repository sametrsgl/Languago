import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CEFR_LEVELS,
  createPlacementState,
  recordPlacementAnswer,
  selectNextPlacementQuestion,
  placementResult,
  shouldFinishPlacement,
} from '../src/lib/placement-test.mjs';

test('starts at the easiest CEFR band and never repeats an item', () => {
  const state = createPlacementState();
  assert.equal(state.nextLevel, 'A1');
  const first = selectNextPlacementQuestion({
    state,
    pool: [
      { id: 'a1-1', level: 'A1', source: 'grammar' },
      { id: 'a1-2', level: 'A1', source: 'grammar' },
    ],
  });
  assert.equal(first.id, 'a1-1');
  const nextState = recordPlacementAnswer(state, first, true);
  const second = selectNextPlacementQuestion({
    state: nextState,
    pool: [
      { id: 'a1-1', level: 'A1', source: 'grammar' },
      { id: 'a1-2', level: 'A1', source: 'grammar' },
    ],
  });
  assert.equal(second.id, 'a1-2');
});

test('two correct answers move the adaptive target upward', () => {
  let state = createPlacementState();
  const a1 = { id: 'a1-1', level: 'A1', source: 'grammar' };
  state = recordPlacementAnswer(state, a1, true);
  state = recordPlacementAnswer(state, { id: 'a1-2', level: 'A1', source: 'grammar' }, true);
  assert.equal(state.nextLevel, 'A2');
});

test('a wrong answer moves the target down but never below A1', () => {
  let state = createPlacementState();
  state = recordPlacementAnswer(state, { id: 'a1-1', level: 'A1', source: 'grammar' }, false);
  assert.equal(state.nextLevel, 'A1');
  state.nextLevel = 'B2';
  state = recordPlacementAnswer(state, { id: 'b2-1', level: 'B2', source: 'grammar' }, false);
  assert.equal(state.nextLevel, 'B1');
});

test('the result reports observed evidence without invented confidence', () => {
  let state = createPlacementState();
  for (let i = 0; i < 3; i += 1) {
    state = recordPlacementAnswer(state, { id: `a1-${i}`, level: 'A1', source: 'grammar' }, true);
    state = recordPlacementAnswer(state, { id: `a2-${i}`, level: 'A2', source: 'grammar' }, true);
    state = recordPlacementAnswer(state, { id: `b1-${i}`, level: 'B1', source: 'grammar' }, false);
  }
  const result = placementResult(state);
  assert.ok(CEFR_LEVELS.includes(result.level));
  assert.equal(result.confidence, null);
  assert.equal(result.questionsAnswered, 9);
  assert.equal(result.correctAnswers, 6);
  assert.equal(result.accuracy, 67);
  assert.equal(result.bands.find((band) => band.level === 'A1').accuracy, 100);
  assert.equal(shouldFinishPlacement(state), false);
});

test('the result exposes an honest empty-band state', () => {
  const result = placementResult(createPlacementState());
  assert.equal(result.accuracy, 0);
  assert.equal(result.bands.find((band) => band.level === 'C2').accuracy, null);
});

test('assessment requires at least 30 answered questions and retains learner goal metadata', () => {
  const state = createPlacementState({ learnerName: 'Ada', goal: 'ielts' });
  assert.equal(state.learnerName, 'Ada');
  assert.equal(state.goal, 'ielts');
  for (let i = 0; i < 29; i += 1) {
    const question = { id: `q-${i}`, level: i % 2 ? 'A2' : 'A1', source: 'grammar' };
    Object.assign(state, recordPlacementAnswer(state, question, true));
  }
  assert.equal(shouldFinishPlacement(state), false);
  const completed = recordPlacementAnswer(state, { id: 'q-29', level: 'A2', source: 'grammar' }, true);
  assert.equal(shouldFinishPlacement(completed), true);
  assert.equal(placementResult(completed).goal, 'ielts');
});

test('all goals retain observed accuracy and a CEFR estimate, never an exam score', () => {
  for (const goal of ['general', 'ielts', 'toefl', 'yds', 'other']) {
    for (const pattern of ['correct', 'incorrect', 'mixed', 'empty']) {
      let state = createPlacementState({ learnerName: 'Alex', goal });
      for (let i = 0; i < (pattern === 'empty' ? 0 : 30); i += 1) {
        const correct = pattern === 'correct' || (pattern === 'mixed' && i % 3 !== 0);
        state = recordPlacementAnswer(state, { id: `t-${i}`, level: 'B1', source: 'grammar' }, correct);
      }
      const result = placementResult(state);
      assert.equal(result.goal, goal);
      assert.equal(result.learnerName, 'Alex');
      assert.equal(result.estimatedScore, null, `${goal}/${pattern}: no calibrated exam mapping exists`);
      assert.equal(result.confidence, null, `${goal}/${pattern}: no calibrated probability exists`);
      assert.equal(result.scoreLabel, 'Başlangıç için CEFR tahmini');
      assert.equal(result.accuracy, { correct: 100, incorrect: 0, mixed: 67, empty: 0 }[pattern]);
      assert.ok(CEFR_LEVELS.includes(result.level));
    }
  }
});
