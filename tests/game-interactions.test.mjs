import test from 'node:test';
import assert from 'node:assert/strict';

import {
  visibleGrammarActivities,
  grammarProgressSnapshot,
  grammarFeedbackForChoice,
  grammarProgressPayload,
} from '../src/lib/game-grammar.mjs';
import {
  scopedViewedWords,
  repetitionPrompt,
  repetitionGrade,
} from '../src/lib/game-vocab.mjs';
import {
  normalizeSpellingMode,
  buildSpellingPrompt,
  gradeTypedSpelling,
} from '../src/lib/game-spelling.mjs';
import {
  buildCuratedClassTopics,
  createClassBoard,
  answerClassQuestion,
  classQuestionFeedback,
} from '../src/lib/game-classroom.mjs';

test('grammar progress uses only visible meaningful activities and caps display', () => {
  const activities = visibleGrammarActivities({ quizCount: 2, practiceCount: 1, pronounRelated: false, guidedCount: 2, productionCount: 1 });
  assert.deepEqual(activities.map((a) => a.key), ['guided', 'mcq', 'gap', 'production']);
  assert.equal(activities.reduce((sum, a) => sum + a.total, 0), 6);

  const snap = grammarProgressSnapshot({ totals: { guided: 2, mcq: 2, gap: 1, production: 1 }, done: { guided: 4, mcq: 2, gap: 1, production: 1 }, correct: { guided: 1, mcq: 1, gap: 1, production: 1 } });
  assert.equal(snap.completed, 6);
  assert.equal(snap.total, 6);
  assert.equal(snap.displayPct, 100);
  assert.equal(snap.completionPct, 100);
  assert.equal(snap.masteryPct, 67);
});

test('grammar feedback names the chosen misconception and the correct explanation', () => {
  const qq = {
    q: 'She ___ a doctor.',
    options: ['am', 'is', 'are', 'be'],
    a: 1,
    why: ['“am” sadece I öznesiyle kullanılır.', 'Correct: She üçüncü tekil olduğu için is gerekir.', '“are” çoğul/you ile kullanılır.', '“be” çekimsizdir.'],
  };
  const fb = grammarFeedbackForChoice(qq, 0);
  assert.equal(fb.correct, false);
  assert.match(fb.message, /Seçimin: am/);
  assert.match(fb.message, /“am” sadece I/);
  assert.match(fb.message, /Doğru cevap: is/);
  assert.match(fb.message, /She üçüncü tekil/);

  const fallback = grammarFeedbackForChoice({ ...qq, why: 'Use is with she/he/it.' }, 2);
  assert.match(fallback.message, /Use is with she\/he\/it/);
});

test('grammar progress payload separates completion from mastery and excludes jumble', () => {
  const payload = grammarProgressPayload({ level: 'a1', unit: 'u1', title: 'Unit 1', totals: { mcq: 2, gap: 2, production: 1 }, done: { mcq: 2, gap: 2, production: 1, jumble: 10 }, correct: { mcq: 1, gap: 2, production: 1, jumble: 10 }, shownIds: ['mcq:0', 'gap:0', 'prod:0'] });
  assert.equal(payload.completionPct, 100);
  assert.equal(payload.masteryPct, 80);
  assert.equal(payload.total, 5);
  assert.equal(payload.correct, 4);
  assert.deepEqual(payload.shownIds, ['mcq:0', 'gap:0', 'prod:0']);
  assert.equal('jumble' in payload, false);
});

test('vocabulary viewed progress is level-scoped and repetition reveal does not grade mastery', () => {
  const words = {
    apple: { w: 'apple', t: 'elma', d: 'a fruit', lv: ['a1'] },
    thesis: { w: 'thesis', t: 'tez', d: 'long research paper', lv: ['b2'] },
  };
  assert.deepEqual(scopedViewedWords({ viewed: { apple: 3, thesis: 1 }, words, scope: 'a1' }), ['apple']);
  assert.deepEqual(scopedViewedWords({ viewed: { apple: 3, thesis: 1 }, words, scope: 'all' }), ['apple', 'thesis']);

  const prompt = repetitionPrompt(words.apple, false);
  assert.equal(prompt.mode, 'recall-en-from-tr');
  assert.match(prompt.cue, /elma/);
  assert.doesNotMatch(prompt.cue, /apple/);
  assert.equal(prompt.canGrade, false);

  const reveal = repetitionPrompt(words.apple, true);
  assert.equal(reveal.canGrade, true);
  assert.equal(repetitionGrade({ word: 'apple', grade: 'reveal' }).mastered, false);
  assert.equal(repetitionGrade({ word: 'apple', grade: 'known' }).mastered, true);
});

test('spelling game defaults to productive English typing and counts mistakes', () => {
  assert.equal(normalizeSpellingMode(), 'tr2en');
  assert.equal(normalizeSpellingMode('both'), 'tr2en');
  assert.equal(normalizeSpellingMode('en2tr'), 'en2tr');

  const word = { w: 'beautiful', t: 'güzel', d: 'pleasing to look at' };
  const prompt = buildSpellingPrompt(word, undefined);
  assert.equal(prompt.mode, 'tr2en');
  assert.match(prompt.label, /Türkçe ipucundan İngilizce yaz/);
  assert.equal(prompt.target, 'beautiful');
  assert.match(prompt.clue, /güzel/);

  assert.deepEqual(gradeTypedSpelling('beautifull', 'beautiful', 2), { correct: false, mistakes: 3 });
  assert.deepEqual(gradeTypedSpelling(' Beautiful ', 'beautiful', 0), { correct: true, mistakes: 0 });
});

test('class game uses curated MCQs only, keeps 24 tiles, no repeats, and prevents double scoring', () => {
  const curated = {
    'a1-01': Array.from({ length: 22 }, (_, i) => ({ q: `Question ${i}?`, options: ['A', 'B', 'C', 'D'], a: i % 4, why: ['A why', 'B why', 'C why', 'D why'] })),
    'a1-short': Array.from({ length: 19 }, (_, i) => ({ q: `Short ${i}?`, options: ['A', 'B', 'C', 'D'], a: 0 })),
  };
  const grammar = { units: [{ id: 'a1-01', title: 'To be', short: 'Be forms', objective: 'Choose am/is/are.' }, { id: 'a1-short', title: 'Short', short: 'Too few' }] };
  const topics = buildCuratedClassTopics({ level: 'a1', levelLabel: 'A1', grammar, mcqGroups: curated });
  assert.equal(topics.length, 1);
  assert.equal(topics[0].qs.length, 22);
  assert.equal(topics[0].objective, 'Choose am/is/are.');

  const board = createClassBoard({ topic: topics[0], gridSize: 24, powerRate: 0.2, seed: 'fixed' });
  assert.equal(board.tiles.length, 24);
  const questionIds = board.tiles.filter((t) => t.kind === 'question').map((t) => t.question.id);
  assert.equal(new Set(questionIds).size, questionIds.length);
  assert.ok(questionIds.length <= topics[0].qs.length);

  const state = { scores: [0, 0], active: 0, answered: {} };
  const qid = questionIds[0];
  const first = answerClassQuestion(state, { questionId: qid, correct: true, points: 10 });
  const second = answerClassQuestion(state, { questionId: qid, correct: true, points: 10 });
  assert.equal(first.accepted, true);
  assert.equal(second.accepted, false);
  assert.deepEqual(state.scores, [10, 0]);

  const fb = classQuestionFeedback(topics[0].qs[0], 1);
  assert.match(fb.message, /Seçilen cevap/);
  assert.match(fb.message, /Doğru cevap/);
});
