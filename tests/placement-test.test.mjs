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

test('the result reports a level and confidence after enough evidence', () => {
  let state = createPlacementState();
  for (let i = 0; i < 3; i += 1) {
    state = recordPlacementAnswer(state, { id: `a1-${i}`, level: 'A1', source: 'grammar' }, true);
    state = recordPlacementAnswer(state, { id: `a2-${i}`, level: 'A2', source: 'grammar' }, true);
    state = recordPlacementAnswer(state, { id: `b1-${i}`, level: 'B1', source: 'grammar' }, false);
  }
  const result = placementResult(state);
  assert.ok(CEFR_LEVELS.includes(result.level));
  assert.ok(result.confidence > 0);
  assert.equal(result.questionsAnswered, 9);
  assert.equal(result.correctAnswers, 6);
  assert.equal(result.accuracy, 67);
  assert.equal(result.bands.find((band) => band.level === 'A1').accuracy, 100);
  assert.equal(shouldFinishPlacement(state), true);
});

test('the result exposes an honest empty-band state', () => {
  const result = placementResult(createPlacementState());
  assert.equal(result.accuracy, 0);
  assert.equal(result.bands.find((band) => band.level === 'C2').accuracy, null);
});
