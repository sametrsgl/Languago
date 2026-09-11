import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (rel) => readFileSync(join(root, rel), 'utf8');
const lessons = JSON.parse(read('src/data/public-lessons.json'));

const requiredSlugs = [
  'a1-present-simple-routines',
  'a1-place-prepositions',
  'a2-past-simple',
  'b1-present-perfect-vs-past',
  'b1-restaurant-communication',
  'b2-inference-reading',
];

test('public lesson data has six substantial original previews with stable practice', () => {
  assert.equal(lessons.meta?.newlyAuthoredLessons, 6);
  assert.equal(lessons.meta?.newlyAuthoredPracticeQuestions, 25);
  assert.equal(lessons.meta?.pendingIndependentEslQa, true);
  assert.equal(lessons.lessons.length, 6);
  assert.deepEqual(lessons.lessons.map((lesson) => lesson.slug), requiredSlugs);

  const allQuestionIds = new Set();
  for (const lesson of lessons.lessons) {
    assert.match(lesson.level, /^(A1|A2|B1|B2)$/);
    assert.match(lesson.title, /\S/);
    assert.match(lesson.objective, /By the end, learners can/i);
    assert.ok(lesson.explanation.length >= 2, `${lesson.slug} has a real explanation`);
    assert.ok(lesson.examples.length >= 3, `${lesson.slug} has examples`);
    assert.ok(lesson.practice.length >= 4, `${lesson.slug} has 4+ practice questions`);
    assert.ok(lesson.nextSteps.length >= 2, `${lesson.slug} has next steps`);
    assert.doesNotMatch(JSON.stringify(lesson), /mastery|ustalık|tam öğrendin|konuyu bitirdin/i);

    for (const item of lesson.practice) {
      assert.match(item.id, new RegExp(`^${lesson.slug}-(q\\d{2}|p\\d{2})$`));
      assert.equal(allQuestionIds.has(item.id), false, `${item.id} is globally unique`);
      allQuestionIds.add(item.id);
      assert.equal(item.options.length, 4, `${item.id} has four options`);
      assert.equal(new Set(item.options).size, 4, `${item.id} has distinct options`);
      assert.equal(Number.isInteger(item.answerIndex), true, `${item.id} has numeric answerIndex`);
      assert.ok(item.answerIndex >= 0 && item.answerIndex < item.options.length, `${item.id} answerIndex in range`);
      assert.equal(typeof item.why, 'string', `${item.id} has one answer key explanation`);
      assert.match(item.why, /because|shows|means|refers|works|correct|specific|past|present|routine|place|evidence/i);
      assert.match(item.feedback?.correct ?? '', /correct|right|good|yes/i, `${item.id} has correct feedback`);
      assert.match(item.feedback?.incorrect ?? '', /not quite|try again|look at|check|remember/i, `${item.id} has incorrect feedback`);
    }
  }
});

test('lesson topics include grammar, situational communication, and reading without conflating them', () => {
  const restaurant = lessons.lessons.find((lesson) => lesson.slug === 'b1-restaurant-communication');
  assert.equal(restaurant.skill, 'speaking');
  assert.equal(restaurant.type, 'situational-communication');
  assert.doesNotMatch(restaurant.title + restaurant.objective, /grammar/i);
  assert.match(JSON.stringify(restaurant.examples), /Could we|I ordered|bill|recommend/i);

  const inference = lessons.lessons.find((lesson) => lesson.slug === 'b2-inference-reading');
  assert.equal(inference.skill, 'reading');
  assert.equal(inference.type, 'reading-strategy');
  assert.match(inference.readingText, /\balthough\b|\bhowever\b|\bnot directly stated\b/i);
});
