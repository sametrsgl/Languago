import test from 'node:test';
import assert from 'node:assert/strict';
import pool from '../src/data/placement-question-pool.json' with { type: 'json' };
import * as placement from '../src/lib/placement-test.mjs';

const sourcePassages = new Map();
for (const level of ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre']) {
  const data = await import(`../src/data/readings_${level}.js`);
  for (const passage of data[`READINGS_${level.toUpperCase()}`]) {
    assert.ok(!sourcePassages.has(passage.id), `source passage collision: ${passage.id}`);
    sourcePassages.set(passage.id, passage);
  }
}

test('placement API data includes each source passage once, verbatim, without answer keys', () => {
  assert.ok(pool.passages, 'reading passages must be exported with the pool');
  assert.equal(Object.keys(pool.passages).length, sourcePassages.size);
  for (const [id, source] of sourcePassages) {
    assert.deepEqual(pool.passages[id], { title: source.title, text: source.text }, id);
  }
});

test('every reading record resolves its own source text and retains its keyed answer', () => {
  assert.equal(typeof placement.getPlacementPassage, 'function');
  const readings = pool.questions.filter((question) => question.source === 'reading');
  assert.ok(readings.length);
  for (const question of readings) {
    const source = sourcePassages.get(question.sourceId.replace(/-\d+$/, ''));
    assert.ok(source, question.id);
    const sourceQuestion = source.questions[Number(question.sourceId.match(/-(\d+)$/)[1]) - 1];
    const passage = placement.getPlacementPassage(question, pool.passages);
    assert.deepEqual(passage, { title: source.title, text: source.text }, question.id);
    assert.equal(question.prompt, sourceQuestion.q, question.id);
    assert.equal(question.options[question.answer], sourceQuestion.options[sourceQuestion.a], question.id);
  }
});

test('passage lookup never attaches reading text to grammar or malformed/missing context', () => {
  assert.equal(typeof placement.getPlacementPassage, 'function');
  const reading = { source: 'reading', sourceId: 'a1-r01-1' };
  const passages = { 'a1-r01': { title: 'Context', text: 'Read this.' } };
  assert.equal(placement.getPlacementPassage({ ...reading, source: 'grammar' }, passages), null);
  for (const bad of [undefined, null, {}, { 'a1-r01': { title: 'Title only' } }, { 'a1-r01': { text: '   ' } }]) {
    assert.equal(placement.getPlacementPassage(reading, bad), null);
  }
  assert.equal(placement.getPlacementPassage({ source: 'reading', sourceId: 'a1-r01' }, passages), null);
  assert.equal(placement.getPlacementPassage(null, passages), null);
});

test('reused generic stems resolve different passages, not a title or prompt match', () => {
  assert.equal(typeof placement.getPlacementPassage, 'function');
  const question = { source: 'reading', sourceId: 'gre-r01-1', prompt: 'What is the main point?', passageTitle: 'Same title' };
  const passages = { 'gre-r01': { title: 'Same title', text: 'First context.' }, 'c2-r01': { title: 'Same title', text: 'Different context.' } };
  assert.equal(placement.getPlacementPassage(question, passages).text, 'First context.');
  assert.equal(placement.getPlacementPassage({ ...question, sourceId: 'c2-r01-1' }, passages).text, 'Different context.');
});
