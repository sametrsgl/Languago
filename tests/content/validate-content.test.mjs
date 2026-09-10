import test from 'node:test';
import assert from 'node:assert/strict';

import { validateContentData } from '../../scripts/validate-content.mjs';

test('validator treats apostrophe-only option differences as distinct valid distractors', async () => {
  const result = await validateContentData({
    grammarLevels: ['a1'],
    readingLevels: [],
    grammar: {
      a1: { units: [{ id: 'a1-01', title: 'Possessives', slides: [{ h: 'x', b: 'y' }, { h: 'z', b: 'w' }], practice: [] }] },
    },
    grammarMcq: {
      a1: {
        'a1-01': [
          { q: 'The ___ are here.', options: ['boys', "boy's", 'boy', 'boys are'], a: 1, why: ['a', 'b', 'c', 'd'] },
        ],
      },
    },
    readings: {},
    words: { words: {} },
  }, { writeReports: false, minClassBankUnique: 1 });

  assert.equal(result.errors.some((e) => /duplicate option/.test(e.message)), false);
});

test('validator blocks malformed keys, why shape, examples, duplicate IDs, and under-sized class banks', async () => {
  const result = await validateContentData({
    grammarLevels: ['a1'],
    readingLevels: ['a1'],
    grammar: {
      a1: { units: [{ id: 'a1-01', title: 'Unit', slides: [{ h: 'x', b: 'y' }, { h: 'z', b: 'w' }], practice: [{ q: 'Bad example', a: [] }] }] },
    },
    grammarMcq: {
      a1: {
        'a1-01': [
          { id: 'dup', q: 'One?', options: ['A', 'A', 'B'], a: 9, why: ['short'] },
          { id: 'dup', q: 'One?', options: ['A', 'B', 'C'], a: 1 },
        ],
        'ghost-unit': [{ q: 'Ghost?', options: ['A', 'B'], a: 0 }],
      },
    },
    readings: {
      a1: [
        { id: 'r1', title: 'P', text: 'Passage', questions: [{ q: 'Q?', options: ['A'], a: 0, why: 'bad' }] },
        { id: 'r1', title: 'P2', text: 'Passage2', questions: [] },
      ],
    },
    words: { words: { hello: { w: 'hello', p: 'interjection', d: 'greeting', e: '' } } },
  }, { writeReports: false, minClassBankUnique: 20 });

  const messages = result.errors.map((e) => e.message).join('\n');
  assert.match(messages, /unknown grammar MCQ unit key/);
  assert.match(messages, /duplicate id/);
  assert.match(messages, /answer index/);
  assert.match(messages, /why/);
  assert.match(messages, /malformed practice example/);
  assert.match(messages, /malformed word example/);
  assert.match(messages, /class question bank has only/);
});
