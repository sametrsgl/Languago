import test from 'node:test';
import assert from 'node:assert/strict';

import {
  assignStableQuestionIds,
  buildQuestionRegistryKey,
  createEmptyRegistry,
  normalizeTextForIdentity,
} from '../../src/lib/content-registry.mjs';

test('identity normalization keeps apostrophes semantically distinct while folding case whitespace and unicode punctuation', () => {
  assert.equal(normalizeTextForIdentity('  DON’T\u00a0STOP!  '), "don't stop");
  assert.equal(normalizeTextForIdentity('dont stop'), 'dont stop');
  assert.notEqual(normalizeTextForIdentity('don’t'), normalizeTextForIdentity('dont'));
});

test('stable IDs are reused from registry regardless of current source order', () => {
  const registry = createEmptyRegistry();
  const first = assignStableQuestionIds([
    { sourcePool: 'grammar:a1:a1-01', stem: 'She ___ a teacher.' },
    { sourcePool: 'grammar:a1:a1-01', stem: 'I ___ a student.' },
  ], registry);

  const second = assignStableQuestionIds([
    { sourcePool: 'grammar:a1:a1-01', stem: 'I ___ a student.' },
    { sourcePool: 'grammar:a1:a1-01', stem: 'She ___ a teacher.' },
  ], registry);

  assert.equal(second.items[0].id, first.items[1].id);
  assert.equal(second.items[1].id, first.items[0].id);
});

test('generic reading stems are scoped by passage context and do not collide across passages', () => {
  const keyA = buildQuestionRegistryKey({
    sourcePool: 'reading:a1:a1-r01',
    stem: 'What is the main idea of the passage?',
    passageId: 'a1-r01',
  });
  const keyB = buildQuestionRegistryKey({
    sourcePool: 'reading:a1:a1-r02',
    stem: 'What is the main idea of the passage?',
    passageId: 'a1-r02',
  });

  assert.notEqual(keyA, keyB);
});
