import test from 'node:test';
import assert from 'node:assert/strict';
import * as client from '../src/lib/placement-client.mjs';
import { createPlacementState, recordPlacementAnswer, replayPlacementAnswers, selectNextPlacementQuestion } from '../src/lib/placement-test.mjs';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };

const questions = pool.questions;
const publicPool = questions.map(({ answer, ...question }) => question);
const byId = new Map(questions.map(question => [question.id, question]));
const first = questions[0];
const variant = questions.find(question => question.id !== first.id && question.contentKey === first.contentKey);
const choice = question => ({ id: question.id, selectedIndex: question.answer });
async function replay(draft, calls = []) {
  return client.replayPlacementDraft(draft, publicPool, async (id, selectedIndex) => {
    calls.push({ id, selectedIndex });
    return { correct: selectedIndex === byId.get(id).answer };
  });
}

test('anonymous replay skips corrupt rows before calling the answer checker', async () => {
  const answers = [null, false, 'row', {}, { id: 3, selectedIndex: 0 }, { id: 'unknown', selectedIndex: 0 },
    ...[-1, first.options.length, 1.5, '0', null].map(selectedIndex => ({ id: first.id, selectedIndex })), choice(first)];
  const calls = [];
  assert.deepEqual(await replay({ answers }, calls), replayPlacementAnswers(answers, questions));
  assert.deepEqual(calls, [choice(first)]);
  for (const draft of [null, {}, { answers: 'bad' }, { answers: {} }]) {
    assert.deepEqual(await replay(draft), createPlacementState());
  }
});

test('anonymous replay counts/checks a task once, including option rotations', async () => {
  const answers = [choice(first), choice(first), choice(variant), choice(questions[1])];
  const calls = [];
  assert.deepEqual(await replay({ answers }, calls), replayPlacementAnswers(answers, questions));
  assert.deepEqual(calls, [choice(first), choice(questions[1])]);
});

test('anonymous replay derives evidence from the real pool and checker, not stored metadata', async () => {
  const draft = { learnerName: ' Alex ', goal: 'ielts', answers: [
    { ...choice(first), correct: false, level: 'C2', source: 'reading', contentKey: 'injected' },
  ], completed: true, nextLevel: 'C2', stats: { C2: { asked: 30, correct: 30 } } };
  const original = structuredClone(draft);
  const state = await replay(draft);
  assert.deepEqual(state, { ...replayPlacementAnswers(draft.answers, questions), learnerName: 'Alex', goal: 'ielts' });
  assert.deepEqual(draft, original);
});

test('anonymous replay stops grading at completion and matches real correct/incorrect attempts', async () => {
  for (const correct of [true, false]) {
    let expected = createPlacementState();
    while (!expected.completed) {
      const question = selectNextPlacementQuestion({ state: expected, pool: questions });
      const selectedIndex = correct ? question.answer : (question.answer + 1) % question.options.length;
      expected = recordPlacementAnswer(expected, question, correct, selectedIndex);
    }
    const extra = questions.find(question => !expected.questions.some(row => row.id === question.id));
    const calls = [];
    assert.deepEqual(await replay({ answers: [...expected.questions, choice(extra)] }, calls), expected);
    assert.equal(calls.length, expected.questions.length);
  }
});

test('anonymous replay limits input to the same 40 rows as server replay', async () => {
  const answers = Array.from({ length: 1000 }, () => choice(first));
  answers[40] = choice(questions[1]);
  const calls = [];
  assert.deepEqual(await replay({ answers }, calls), replayPlacementAnswers(answers, questions));
  assert.deepEqual(calls, [choice(first)]);
});

test('anonymous replay retains distinct passages while deduplicating normalized stems', async () => {
  const q = questions.find(question => question.source === 'reading');
  const normalized = { ...q, id: 'normalized', prompt: `  ${q.prompt.toUpperCase()}  ` };
  const other = { ...q, id: 'other', sourceId: 'other-passage-1' };
  const fixtures = [q, normalized, other];
  const answers = fixtures.map(choice);
  const calls = [];
  const result = await client.replayPlacementDraft({ answers }, fixtures.map(({ answer, ...question }) => question), async id => {
    calls.push(id);
    return { correct: true };
  });
  assert.deepEqual(result, replayPlacementAnswers(answers, fixtures));
  assert.deepEqual(calls, [q.id, other.id]);
});

test('checker failures abort replay without mutating or returning a partially graded draft', async () => {
  const draft = { learnerName: 'Alex', answers: [choice(first), choice(questions[1])] };
  const original = structuredClone(draft);
  let calls = 0;
  await assert.rejects(client.replayPlacementDraft(draft, publicPool, async () => {
    if (++calls === 2) throw Object.assign(new Error('offline'), { name: 'AbortError' });
    return { correct: true };
  }), { name: 'AbortError' });
  assert.equal(calls, 2);
  assert.deepEqual(draft, original);
});
