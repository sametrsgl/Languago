import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CEFR_LEVELS,
  createVocabularyDiagnostic,
  createAssessmentVocabulary,
  scoreVocabularyDiagnostic,
  buildVocabularyPath,
  buildPersonalizedVocabularyPath,
  buildMeaningOptions,
  pathStepTypes,
  selectNextVocabularyQuestion,
} from '../src/lib/vocab-path.mjs';

const words = CEFR_LEVELS.flatMap((level) => Array.from({ length: 20 }, (_, i) => ({
  w: `${level.toLowerCase()}word${i}`,
  t: `${level} anlam ${i}`,
  d: `${level} definition ${i}`,
  e: `I use ${level.toLowerCase()}word${i} in a real situation.`,
  p: 'noun',
  levels: [level],
})));

test('assessment vocabulary bank is capped, deterministic, and keeps Turkish options', () => {
  const questions = createAssessmentVocabulary({
    sets: Object.fromEntries(CEFR_LEVELS.map((level) => [level, words.filter((word) => word.levels[0] === level).map((word) => word.w)])),
    words: Object.fromEntries(words.map((word) => [word.w, word])),
  }, 5000);
  assert.equal(questions.length, words.length);
  assert.deepEqual(questions.map((q) => q.id), createAssessmentVocabulary({
    sets: Object.fromEntries(CEFR_LEVELS.map((level) => [level, words.filter((word) => word.levels[0] === level).map((word) => word.w)])),
    words: Object.fromEntries(words.map((word) => [word.w, word])),
  }, 5000).map((q) => q.id));
  assert.ok(questions.every((q) => q.source === 'vocabulary' && q.options.includes(words.find((word) => word.w === q.sourceId.replace('vocabulary-', '')).t)));
});
test('diagnostic contains exactly 80 questions ordered from easier to harder CEFR bands', () => {
  const questions = createVocabularyDiagnostic(words);
  assert.equal(questions.length, 80);
  assert.deepEqual([...new Set(questions.map((q) => q.level))], CEFR_LEVELS);
  for (const q of questions) {
    assert.equal(q.options.length, 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
  }
});

test('every diagnostic option is a Turkish meaning, never an English dictionary definition', () => {
  const questions = createVocabularyDiagnostic(words);
  const TurkishMeanings = new Set(words.map((word) => word.t));
  for (const question of questions) {
    assert.ok(question.options.every((option) => TurkishMeanings.has(option)), `${question.id} leaked a non-Turkish option`);
  }
});
test('diagnostic is deterministically shuffled within each CEFR band and context prompts name the target word', () => {
  const questions = createVocabularyDiagnostic(words);
  assert.notEqual(questions[0].word, 'a1word0');
  const contextual = questions.find((question) => question.mode === 2);
  assert.match(contextual.prompt, new RegExp(contextual.word));
});

test('adaptive vocabulary selection covers CEFR anchors before following performance', () => {
  const questions = createVocabularyDiagnostic(words);
  const responses = [];
  const asked = [];
  for (let i = 0; i < 24; i += 1) {
    const next = selectNextVocabularyQuestion(questions, responses, asked);
    assert.ok(next);
    asked.push(next.id);
    responses.push({ id: next.id, answer: next.answer, correct: true });
  }
  assert.deepEqual(CEFR_LEVELS.map((level) => questions.filter((q) => q.level === level && asked.includes(q.id)).length), [4, 4, 4, 4, 4, 4]);
  const harder = selectNextVocabularyQuestion(questions, responses, asked);
  assert.ok(harder && ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(harder.level));
});


test('diagnostic score returns a defensible level from per-band evidence', () => {
  const questions = createVocabularyDiagnostic(words);
  const answers = questions.map((q) => q.level === 'A1' || q.level === 'A2' ? q.answer : (q.answer + 1) % 4);
  const result = scoreVocabularyDiagnostic(questions, answers);
  assert.equal(result.level, 'A2');
  assert.equal(result.questionsAnswered, 80);
  assert.ok(result.confidence > 0);
});

test('meaning options exclude duplicate target meanings while preserving four choices when possible', () => {
  const target = { w: 'target', t: 'hedef anlam' };
  const words = [target, { w: 'other', t: 'başka anlam' }, { w: 'third', t: 'üçüncü anlam' }, { w: 'fourth', t: 'dördüncü anlam' }];
  const options = buildMeaningOptions(target, words);
  assert.equal(options.length, 4);
  assert.equal(options.filter((option) => option === target.t).length, 1);
  assert.deepEqual(new Set(options).size, options.length);
});
test('path has ten varied, contextual learning steps and limited words', () => {
  const path = buildVocabularyPath(words, 'B1');
  assert.equal(path.steps.length, 10);
  assert.deepEqual(path.steps.map((step) => step.type), pathStepTypes);
  assert.ok(path.words.length <= 100);
  assert.ok(path.steps.every((step) => step.words.length > 0));
  assert.ok(path.steps.some((step) => /Diyalog|Görev|situation/i.test(`${step.title} ${step.scenario}`)));
});

test('personalized path prioritizes due and lapsed words over unseen words', () => {
  const dueWord = words.find((word) => word.levels[0] === 'B1');
  const unseenWord = words.find((word) => word.levels[0] === 'B1' && word !== dueWord);
  const path = buildPersonalizedVocabularyPath(words, 'B1', {
    now: 1000,
    reviews: [{ itemId: `word:${dueWord.w}`, dueAt: 1, lapses: 2, repetitions: 1, lastRating: 0 }],
  });
  assert.equal(path.personalized, true);
  assert.ok(path.focus.due >= 1);
  assert.equal(path.words[0].w, dueWord.w);
  assert.notEqual(path.words[0].w, unseenWord.w);
  assert.ok(path.steps.every((step) => step.words.length > 0));
});
