import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { displayReadingPrompt } from '../src/lib/reading-prompts.mjs';

const syllabus = JSON.parse(fs.readFileSync(new URL('../src/data/learning-syllabus.json', import.meta.url), 'utf8'));
const tracks = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre'];
const requiredCategories = ['vocabulary', 'reading', 'grammar', 'review', 'game'];

test('learning syllabus covers every active CEFR and exam track', () => {
  assert.deepEqual(Object.keys(syllabus.tracks).sort(), tracks.slice().sort());
  for (const key of tracks) {
    const track = syllabus.tracks[key];
    for (const category of requiredCategories) {
      assert.ok(track.categories[category], `${key} is missing ${category}`);
      assert.ok(track.categories[category].focus.length >= 3, `${key}/${category} needs concrete focus items`);
      assert.ok(track.categories[category].evidence.length > 20, `${key}/${category} needs an evidence target`);
    }
    assert.equal(Object.keys(track.skill_targets).length, 3, `${key} needs listening, speaking and writing targets`);
    assert.ok(track.milestones.length >= 3, `${key} needs transfer milestones`);
  }
});

test('learner-facing reading prompts are unique within every active collection', async () => {
  for (const level of tracks) {
    const mod = await import(`../src/data/readings_${level}.js`);
    const passages = mod[`READINGS_${level.toUpperCase()}`];
    const prompts = passages.flatMap((passage) =>
      passage.questions.map((question) => displayReadingPrompt(question, passage.title).toLocaleLowerCase('en-US')),
    );
    assert.equal(new Set(prompts).size, prompts.length, `${level} contains a repeated learner-facing prompt`);
  }
});

test('grammar practice banks contain no exact duplicate stems', async () => {
  for (const level of ['a1', 'a2', 'b1', 'b2', 'c1']) {
    const mod = await import(`../src/data/grammar_${level}.js`);
    const grammar = mod[`GRAMMAR_${level.toUpperCase()}`];
    const prompts = grammar.units.flatMap((unit) => unit.practice.map((item) => item.q.trim().toLocaleLowerCase('en-US')));
    assert.equal(new Set(prompts).size, prompts.length, `${level} grammar practice repeats a stem`);
  }
});

test('all reading answer indexes still point to an option after content edits', async () => {
  for (const level of tracks) {
    const mod = await import(`../src/data/readings_${level}.js`);
    const passages = mod[`READINGS_${level.toUpperCase()}`];
    for (const passage of passages) {
      for (const question of passage.questions) {
        assert.ok(Number.isInteger(question.a), `${level}/${passage.id} has a non-integer answer`);
        assert.ok(question.a >= 0 && question.a < question.options.length, `${level}/${passage.id} has an invalid answer index`);
      }
    }
  }
});
