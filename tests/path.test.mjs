import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { presentQuestions, scoreQuestions, readAloudScore, vocabSession, listenChoices, vocabMastery, PASS, LEVEL_XP, TASK_XP, countWords } from '../src/lib/path.mjs';

const qs = Array.from({ length: 10 }, (_, i) => ({ q: `Q${i}`, o: [`right${i}`, `w${i}a`, `w${i}b`, `w${i}c`], why: 'çünkü' }));

test('questions are shown shuffled without the key and scored back correctly', () => {
  const shown = presentQuestions(qs, 'a1-d1-grammar');
  assert.ok(shown.every((s) => !('why' in s)));
  const right = shown.map((s, i) => s.o.indexOf(`right${i}`));
  assert.ok(new Set(right).size > 1, 'correct answers are not always in the same place');
  const all = scoreQuestions(qs, 'a1-d1-grammar', right);
  assert.equal(all.score, 100);
  assert.equal(all.passed, true);
  const oneWrong = scoreQuestions(qs, 'a1-d1-grammar', right.map((r, i) => (i === 0 ? (r + 1) % 4 : r)));
  assert.equal(oneWrong.score, 90);
  assert.equal(oneWrong.passed, true, 'one mistake in ten still passes (85)');
  const twoWrong = scoreQuestions(qs, 'a1-d1-grammar', right.map((r, i) => (i < 2 ? (r + 1) % 4 : r)));
  assert.equal(twoWrong.passed, false);
  assert.equal(twoWrong.review[0].why, 'çünkü');
});

test('read-aloud score follows the words said', () => {
  assert.equal(readAloudScore('My name is Ali and I am a student.', 'my name is ali and i am a student'), 100);
  assert.ok(readAloudScore('My name is Ali and I am a student.', 'my name ali and I am student') < PASS);
  assert.equal(readAloudScore('I’m from İzmir.', "i'm from izmir"), 100); // Turkish letters are folded
  assert.equal(readAloudScore('Hello', ''), 0);
  assert.equal(countWords('I have two brothers.'), 4);
});

const list = Array.from({ length: 40 }, (_, i) => ({ id: `a1-${i}`, word: ['cat', 'car', 'cap', 'bag', 'big', 'book', 'look', 'cook'][i % 8] + (i >= 8 ? String.fromCharCode(97 + Math.floor(i / 8)) : '') }));

test('vocabulary session: 13 new words in order plus due reviews', () => {
  const cards = [{ word_id: 'a1-0', due_on: '2026-10-10', box: 1 }, { word_id: 'a1-1', due_on: '2026-10-20', box: 2 }];
  const s = vocabSession(list, cards, '2026-10-11');
  assert.equal(s.fresh.length, 13);
  assert.equal(s.fresh[0].id, 'a1-2');
  assert.deepEqual(s.due.map((w) => w.id), ['a1-0']);
});

test('listen-and-choose gives the word and three different look-alikes', () => {
  const c = listenChoices(list[0], list);
  assert.equal(c.options.length, 4);
  assert.equal(new Set(c.options).size, 4);
  assert.equal(c.options[c.answer], list[0].word);
});

test('mastery counts words learned to box 4 or more', () => {
  const cards = list.slice(0, 34).map((w) => ({ word_id: w.id, box: 4 }));
  assert.ok(vocabMastery(list, cards) >= 0.85);
  assert.ok(vocabMastery(list, cards.slice(0, 10)) < 0.85);
});

test('XP numbers match the database rules', () => {
  const sql = readFileSync(new URL('../supabase/migrations/20261014_learning_path.sql', import.meta.url), 'utf8');
  assert.match(sql, /p_score >= 85/);
  assert.match(sql, /when 'writing' then 25 when 'speaking' then 25 else 20/);
  assert.equal(TASK_XP.writing, 25);
  assert.equal(LEVEL_XP, 120 * 110);
  assert.match(sql, /check \(lesson_min = 40\)/);
  assert.match(sql, /array\[1, 3, 7, 16, 35, 75\]/);
});
