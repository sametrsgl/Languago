import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'esbuild';
import * as placement from '../src/lib/placement-test.mjs';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };

const first = pool.questions[0];
const variant = pool.questions.find((q) => q.sourceId === first.sourceId && q.id !== first.id);
const choice = (q) => ({ id: q.id, selectedIndex: q.answer });
function completedAttempt(correct = true) {
  let state = placement.createPlacementState();
  while (!state.completed) {
    const question = placement.selectNextPlacementQuestion({ state, pool: pool.questions });
    const index = correct ? question.answer : (question.answer + 1) % question.options.length;
    state = placement.recordPlacementAnswer(state, question, index === question.answer, index);
  }
  return state;
}

test('replay ignores malformed rows and impossible choices rather than treating them as mistakes', () => {
  const bad = [null, false, 'row', {}, { id: 3, selectedIndex: 0 }, { id: 'unknown', selectedIndex: 0 },
    ...[-1, first.options.length, 1.5, '0', null].map((selectedIndex) => ({ id: first.id, selectedIndex }))];
  assert.deepEqual(placement.replayPlacementAnswers(bad, pool.questions), placement.createPlacementState());
  for (const value of [null, {}, 'answers']) {
    assert.deepEqual(placement.replayPlacementAnswers(value, pool.questions), placement.createPlacementState());
  }
});

test('replay deduplicates IDs and normalized task identities using the real pool', () => {
  const rows = [choice(first), choice(first), choice(variant)];
  const state = placement.replayPlacementAnswers(rows, pool.questions);
  assert.equal(state.questions.length, 1);
  assert.equal(state.nextLevel, 'A1');
  assert.deepEqual(state.questions[0], { ...choice(first), level: first.level, source: first.source, correct: true });
  assert.deepEqual(rows, [choice(first), choice(first), choice(variant)], 'input is not mutated');
});

test('replay recomputes correctness and metadata instead of trusting draft fields', () => {
  const state = placement.replayPlacementAnswers([{ ...choice(first), correct: false, level: 'C2', source: 'reading' }], pool.questions);
  assert.equal(state.questions[0].correct, true);
  assert.equal(state.questions[0].level, first.level);
  assert.equal(state.questions[0].source, first.source);
});

test('replay preserves passage context when generic reading stems are equal', () => {
  const q = pool.questions.find((item) => item.source === 'reading');
  const otherPassage = { ...q, id: 'test-other-passage', sourceId: 'test-passage-1' };
  const normalizedVariant = { ...q, id: 'test-normalized', prompt: `  ${q.prompt.toUpperCase()}  ` };
  const state = placement.replayPlacementAnswers([choice(q), choice(normalizedVariant), choice(otherPassage)], [q, normalizedVariant, otherPassage]);
  assert.equal(state.questions.length, 2);
});

test('replay stops at actual completion and round-trips real adaptive attempts', () => {
  for (const correct of [true, false]) {
    const expected = completedAttempt(correct);
    const extra = pool.questions.find((q) => !expected.questions.some((row) => row.id === q.id));
    const state = placement.replayPlacementAnswers([...expected.questions, choice(extra)], pool.questions);
    assert.deepEqual(state, expected);
    assert.ok(state.questions.length <= placement.PLACEMENT_LIMITS.max);
  }
});

// Execute the actual route, replacing only the external Supabase boundary.
// No credentials, network requests, learner data or database writes are used.
const compiled = await build({ entryPoints: ['src/pages/api/placement/save.ts'], bundle: true,
  platform: 'node', format: 'esm', write: false, logLevel: 'silent', plugins: [{
    name: 'fake-supabase-boundary', setup(builder) {
      builder.onResolve({ filter: /\/lib\/supabase$/ }, () => ({ path: 'supabase', namespace: 'test' }));
      builder.onLoad({ filter: /.*/, namespace: 'test' }, () => ({ contents:
        'export const pageCookieSource = ({cookies}) => cookies; export const createSupabaseClient = (client) => client;' }));
    },
  }] });
const { POST } = await import(`data:text/javascript;base64,${Buffer.from(compiled.outputFiles[0].text).toString('base64')}`);
async function request(answers, authenticated = true, profile = {}) {
  const writes = [];
  const client = {
    auth: { getUser: async () => ({ data: { user: authenticated ? { id: 'test-user' } : null }, error: null }) },
    from: (table) => ({
      upsert: async (row, options) => { writes.push({ table, row, options }); return { error: null }; },
      update: (row) => ({ eq: async (column, id) => { writes.push({ table, row, column, id }); return { error: null }; } }),
    }),
  };
  const response = await POST({ cookies: client, request: new Request('https://example.invalid/api/placement/save', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...profile, answers }),
  }) });
  return { response, writes };
}

test('save refuses incomplete evidence without changing progress or profile level', async () => {
  const { response, writes } = await request([choice(first)]);
  assert.equal(response.status, 400);
  assert.deepEqual(writes, []);
});

test('save persists exactly the deduplicated completed history and its count', async () => {
  const expected = completedAttempt();
  const extra = pool.questions.find((q) => !expected.questions.some((row) => row.id === q.id));
  const answers = [expected.questions[0], expected.questions[0], choice(variant), ...expected.questions.slice(1), choice(extra)];
  const { response, writes } = await request(answers);
  assert.equal(response.status, 200);
  const payload = writes.find((write) => write.table === 'student_progress').row.payload;
  assert.deepEqual(payload.answers, expected.questions);
  assert.equal(payload.questionsAnswered, expected.questions.length);
  assert.equal(payload.level, placement.placementResult(expected).level);
  assert.equal(writes.find((write) => write.table === 'profiles').id, 'test-user');
});

test('save retains goals but never persists client-supplied scores or numeric confidence', async () => {
  const completed = completedAttempt();
  for (const goal of ['general', 'ielts', 'toefl', 'yds', 'other']) {
    const { response, writes } = await request(completed.questions, true, {
      learnerName: 'Alex', goal, estimatedScore: 120, confidence: 0.99, scoreLabel: 'Injected score',
    });
    assert.equal(response.status, 200);
    const payload = writes.find((write) => write.table === 'student_progress').row.payload;
    assert.equal(payload.goal, goal);
    assert.equal(payload.learnerName, 'Alex');
    assert.equal(payload.estimatedScore, null);
    assert.equal(payload.confidence, null);
    assert.equal(payload.scoreLabel, 'Başlangıç için CEFR tahmini');
    assert.equal(payload.accuracy, 100);
    assert.equal((await response.json()).confidence, null);
  }
});

test('replay bounds oversized drafts and retains the existing 40-row API limit', () => {
  const answers = Array.from({ length: 1000 }, () => choice(first));
  answers[40] = choice(pool.questions[1]);
  const state = placement.replayPlacementAnswers(answers, pool.questions);
  assert.equal(state.questions.length, 1);
});

test('save cannot use repeated copies of one task as completion evidence', async () => {
  const answers = Array.from({ length: 24 }, (_, index) => choice(index % 2 ? variant : first));
  const { response, writes } = await request(answers);
  assert.equal(response.status, 400);
  assert.deepEqual(writes, []);
});

test('save still requires authentication and cannot save an empty history', async () => {
  const anonymous = await request(completedAttempt().questions, false);
  assert.equal(anonymous.response.status, 401);
  assert.deepEqual(anonymous.writes, []);
  const empty = await request([null, { id: first.id, selectedIndex: -1 }]);
  assert.equal(empty.response.status, 400);
  assert.deepEqual(empty.writes, []);
});
