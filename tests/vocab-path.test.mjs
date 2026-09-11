import test from 'node:test';
import assert from 'node:assert/strict';
import {
  CEFR_LEVELS,
  createVocabularyDiagnostic,
  scoreVocabularyDiagnostic,
  buildVocabularyPath,
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
    assert.ok(q.options.length === 4);
    assert.ok(q.answer >= 0 && q.answer < 4);
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

test('path has ten varied, contextual learning steps and limited words', () => {
  const path = buildVocabularyPath(words, 'B1');
  assert.equal(path.steps.length, 10);
  assert.deepEqual(path.steps.map((step) => step.type), pathStepTypes);
  assert.ok(path.words.length <= 100);
  assert.ok(path.steps.every((step) => step.words.length > 0));
  assert.ok(path.steps.some((step) => /Diyalog|Görev|situation/i.test(`${step.title} ${step.scenario}`)));
});
