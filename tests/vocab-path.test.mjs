import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CEFR_LEVELS,
  createVocabularyDiagnostic,
  scoreVocabularyDiagnostic,
  buildVocabularyPath,
  buildMeaningOptions,
  learnerExample,
  pathStepTypes,
} from '../src/lib/vocab-path.mjs';

const words = CEFR_LEVELS.flatMap((level) => Array.from({ length: 20 }, (_, i) => ({
  w: `${level.toLowerCase()}word${i}`,
  t: `${level} anlam ${i}`,
  d: `${level} definition ${i}`,
  e: `I use ${level.toLowerCase()}word${i} in a real situation.`,
  p: 'noun',
  levels: [level],
})));

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
test('learner examples replace dictionary fragments and sensitive source artifacts', () => {
  assert.doesNotMatch(learnerExample({ w: 'allow', e: 'allow somebody/something to do something, Example.' }), /somebody|something/i);
  assert.doesNotMatch(learnerExample({ w: 'addiction', e: 'cocaine addiction' }), /cocaine/i);
  assert.match(learnerExample({ w: 'visit', e: 'My parents visit me.' }), /My parents visit me/);
});
test('path has ten varied, contextual learning steps and limited words', () => {
  const path = buildVocabularyPath(words, 'B1');
  assert.equal(path.steps.length, 10);
  assert.deepEqual(path.steps.map((step) => step.type), pathStepTypes);
  assert.ok(path.words.length <= 100);
  assert.ok(path.steps.every((step) => step.words.length > 0));
  assert.ok(path.steps.some((step) => /Diyalog|Görev|situation/i.test(`${step.title} ${step.scenario}`)));
});
