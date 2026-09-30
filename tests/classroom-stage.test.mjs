// Kutu Avı stage helpers: blanks, what the voice says, stage language, saves.
import test from 'node:test';
import assert from 'node:assert/strict';

import { blankParts, fillBlanks, langOf } from '../src/classroom/core/dom.mjs';
import { spokenText } from '../src/classroom/core/speech.mjs';
import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { makePack } from '../src/classroom/core/pack.mjs';
import { createGame, reduce } from '../src/classroom/games/kutu-avi/logic.mjs';
import { validSave } from '../src/classroom/games/kutu-avi/app.mjs';

const mcq = (i) => ({ id: `q${i}`, type: 'mcq', stem: `She ___ item ${i}.`, options: [`right${i}`, `wrong${i}a`, `wrong${i}b`, `wrong${i}c`], answer: 0, whyTr: 'neden', level: 'A2' });

function game(groupId = 'a2') {
  const profile = audienceProfile(groupId);
  const pack = makePack({ id: 'builtin:grammar:test', title: 'Test', level: 'A2', items: Array.from({ length: 20 }, (_, i) => mcq(i)) });
  return createGame({ profile, pack, teams: defaultTeams(3, profile.mode), boardSize: 12, surpriseLevel: 0, code: 'TEST-11' });
}

test('two-blank stems take one part of the key per blank', () => {
  assert.deepEqual(blankParts('What ___ you ___ at ten last night?', 'were ... doing'), ['were', 'doing']);
  assert.equal(fillBlanks('What ___ you ___ at ten last night?', 'were ... doing'), 'What were you doing at ten last night?');
  assert.equal(fillBlanks('Your eyes are red. ___ you ___ a lot lately?', 'Have, been working'), 'Your eyes are red. Have you been working a lot lately?');
  assert.equal(fillBlanks('She ___ to school and ___ lunch there.', 'walks / has'), 'She walks to school and has lunch there.');
  // One blank: the whole key, even with a comma in it.
  assert.equal(fillBlanks("I ___ it, I'm afraid.", 'can, not'), "I can, not it, I'm afraid.");
  // A key that does not split: only the first blank is filled, never repeated.
  assert.equal(blankParts('What ___ you ___ at ten?', 'were doing'), null);
  assert.equal(fillBlanks('What ___ you ___ at ten?', 'were doing'), 'What were doing you ___ at ten?');
  // No blank: unchanged.
  assert.equal(fillBlanks('Which sentence is correct?', 'x'), 'Which sentence is correct?');
});

test('the voice never reads parenthetical cues, Turkish or English', () => {
  assert.equal(spokenText('She lives in a small flat. (small)'), 'She lives in a small flat.');
  assert.equal(spokenText("Students mustn't use their phones during the exam. (yasak)"), "Students mustn't use their phones during the exam.");
  assert.equal(spokenText("They didn't (not/come) come to school last Friday."), "They didn't come to school last Friday.");
  assert.equal(spokenText('Their car is red. (they)'), 'Their car is red.');
  assert.equal(spokenText("It's a deer."), "It's a deer.");
});

test('stage text language: Turkish letters mean Turkish casing', () => {
  assert.equal(langOf('Animals'), 'en');
  assert.equal(langOf('Team Tigers'), 'en');
  assert.equal(langOf('Şimşekler'), 'tr');
  assert.equal(langOf('Kartallar'), 'en');
});

test('saves: only this game and state shape are resumed', () => {
  const s = game();
  assert.equal(validSave({ savedAt: Date.now(), state: s }), true);
  assert.equal(validSave({ state: { phase: 'board', v: 0 } }), false);
  assert.equal(validSave(null), false);
  const badHex = { ...s, teams: s.teams.map((t, i) => (i ? t : { ...t, hex: '#fff" onmouseover="x' })) };
  assert.equal(validSave({ state: badHex }), false);
  const badScore = { ...s, teams: s.teams.map((t, i) => (i ? t : { ...t, score: '5<img>' })) };
  assert.equal(validSave({ state: badScore }), false);
  const badHuddle = { ...s, profile: { ...s.profile, huddle: '<b>' } };
  assert.equal(validSave({ state: badHuddle }), false);
  // A game ended early with "Bitir" is still a valid save and returns to its board.
  const ended = reduce(s, { type: 'FINISH' });
  assert.equal(ended.phase, 'end');
  assert.equal(ended.finishedEarly, true);
  assert.equal(validSave({ state: ended }), true);
  assert.equal(reduce(ended, { type: 'RESUME_BOARD' }).phase, 'board');
  // An open question needs a real seat number.
  const open = reduce(s, { type: 'OPEN', n: s.tiles.find((t) => t.kind === 'question').n });
  assert.equal(validSave({ state: open }), true);
  assert.equal(validSave({ state: { ...open, current: { ...open.current, seat: '<i>' } } }), false);
});
