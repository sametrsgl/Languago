import test from 'node:test';
import assert from 'node:assert/strict';

import { WORD_DATA } from '../src/data/words.js';

const words = WORD_DATA.words;
const levelOf = new Map();
for (const [level, entries] of Object.entries(WORD_DATA.sets)) {
  for (const key of entries) levelOf.set(key, level);
}

const curatedLearnerKeys = [
  'a',
  'about',
  'activity',
  'actor',
  'add',
  'advice',
  'afternoon',
  'ago',
  'air',
  'amazing',
  'april',
  'art',
  'article',
  'ask',
  'ball',
  'band',
  'beach',
  'bed',
  'bread',
  'bus',
  'buy',
  'can',
  'capital',
  'body',
];

function assertCompleteLearnerRecord(key) {
  const row = words[key];
  assert.ok(row, `missing word record: ${key}`);
  for (const field of ['w', 'p', 'd', 'e', 't']) {
    assert.equal(typeof row[field], 'string', `${key}.${field} must be a string`);
    assert.ok(row[field].trim(), `${key}.${field} must not be blank`);
  }
}

test('A1 primary senses for a/about/air match beginner classroom meanings', () => {
  assert.equal(words.a.p, 'article');
  assert.equal(words.a.t, 'bir');
  assert.match(words.a.d, /one person or thing/i);
  assert.equal(words.a.e, 'I have a pen.');

  assert.equal(words.about.p, 'preposition');
  assert.equal(words.about.t, 'hakkında');
  assert.match(words.about.d, /on the subject of/i);
  assert.equal(words.about.e, 'This book is about animals.');

  assert.equal(words.air.p, 'noun');
  assert.equal(words.air.t, 'hava');
  assert.match(words.air.d, /breathe/i);
  assert.equal(words.air.e, 'Open the window for some fresh air.');
});

test('word examples do not contain classroom-unsafe imported artifact text', () => {
  const blocked = [
    /\[expletive\]/i,
    /drive over .*corpse/i,
    /\bfuck(?:ed|ing)?\b/i,
    /\bshit(?:ty)?\b/i,
    /\bbitch(?:es)?\b/i,
    /\bcunt(?:s)?\b/i,
    /\bfaggot(?:s)?\b/i,
    /\bnigg(?:er|a)(?:s)?\b/i,
    /\basshole(?:s)?\b/i,
    /\bwhore(?:s)?\b/i,
  ];
  const offenders = [];
  for (const [key, row] of Object.entries(words)) {
    const example = String(row.e ?? '');
    if (blocked.some((pattern) => pattern.test(example))) offenders.push(`${key}: ${example}`);
  }
  assert.deepEqual(offenders, []);
});

test('A1/A2 examples avoid graphic violent classroom contexts unless the headword requires it', () => {
  const allowedHeadwords = new Set(['die', 'dead', 'kill']);
  const unsafeContext = /\b(killed|murder(?:ed)?|rape(?:d)?|suicide|corpse|corpses)\b/i;
  const offenders = [];
  for (const [key, row] of Object.entries(words)) {
    const level = levelOf.get(key);
    if (!['a1', 'a2'].includes(level) || allowedHeadwords.has(key)) continue;
    const example = String(row.e ?? '');
    if (unsafeContext.test(example)) offenders.push(`${key}: ${example}`);
  }
  assert.deepEqual(offenders, []);
});

test('curated A1/A2 learner records use natural examples rather than dictionary artifacts', () => {
  const badExampleShape = /\/|\(=|^\+|^[a-z]+ (?:somebody|something|A|adv\.|adj\.|prep\.).*,/;
  const offenders = [];
  for (const key of curatedLearnerKeys) {
    assertCompleteLearnerRecord(key);
    const row = words[key];
    assert.ok(['a1', 'a2'].includes(levelOf.get(key)), `${key} should remain in A1/A2 sets`);
    if (badExampleShape.test(row.e)) offenders.push(`${key}: ${row.e}`);
  }
  assert.deepEqual(offenders, []);
});
