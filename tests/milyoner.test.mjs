import test from 'node:test';
import assert from 'node:assert/strict';

import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { makePack } from '../src/classroom/core/pack.mjs';
import { ladderFor, rankName, rungValue, createGame, reduce, presented, standings, endingTitles } from '../src/classroom/games/milyoner/logic.mjs';

const mcq = (i) => ({ id: `q${i}`, type: 'mcq', stem: `I ___ item ${i}.`, options: [`right${i}`, `wrong${i}a`, `wrong${i}b`, `wrong${i}c`], answer: 0, level: 'A2' });
const pack = (n = 60) => makePack({ id: 't', title: 'Test', level: 'A2', items: Array.from({ length: n }, (_, i) => mcq(i)) });

function game(groupId, { teams = 3, together = true, n = 60, length = null } = {}) {
  const profile = audienceProfile(groupId);
  return createGame({ profile, pack: pack(n), teams: defaultTeams(teams, profile.mode), together, ladderLength: length, code: 'LADDER-7' });
}

const keyOf = (s) => presented(s, s.current.itemId, s.current.salt).answer;
const wrongOf = (s) => (keyOf(s) + 1) % presented(s, s.current.itemId, s.current.salt).options.length;

function relay(s, right) {
  s = reduce(s, { type: 'NEXT_QUESTION' });
  assert.equal(s.current.kind, 'relay');
  s = reduce(s, { type: 'LOCK', choice: right ? keyOf(s) : wrongOf(s) });
  s = reduce(s, { type: 'REVEAL' });
  return s;
}

test('ladder length and safe steps per class', () => {
  assert.deepEqual(ladderFor(audienceProfile('a1g')), { length: 8, safe: [3, 5] });
  assert.equal(ladderFor(audienceProfile('a2g')).length, 10);
  assert.deepEqual(ladderFor(audienceProfile('b1')), { length: 12, safe: [4, 8] });
  assert.equal(ladderFor(audienceProfile('a1')).length, 10);
  assert.equal(ladderFor(audienceProfile('b1'), 6).length, 6);
  assert.equal(rankName(12, 12), 'Legend');
  assert.equal(rankName(1, 12), 'Bronze I');
  assert.equal(rungValue(12, 12), 1000000);
});

test('low rungs are played together: every right team climbs', () => {
  let s = game('b1', { teams: 3 });
  assert.equal(s.togetherLeft, 4);
  s = reduce(s, { type: 'NEXT_QUESTION' });
  assert.equal(s.current.kind, 'together');
  s = reduce(s, { type: 'REVEAL' });
  s = reduce(s, { type: 'TOGGLE', teamId: 't2' });
  s = reduce(s, { type: 'CONTINUE' });
  assert.deepEqual(s.teams.map((t) => t.rung), [1, 0, 1]);
  assert.equal(s.togetherLeft, 3);
  assert.equal(s.phase, 'ladder');
});

test('Stüdyo: a miss falls back to the last safe step; Arena stays; Park never falls', () => {
  let s = game('b1', { teams: 1, together: false });
  for (let i = 0; i < 5; i++) { s = relay(s, true); s = reduce(s, { type: 'CONTINUE' }); }
  assert.equal(s.teams[0].rung, 5);
  assert.equal(s.teams[0].safeRung, 4);
  s = relay(s, false);
  assert.equal(s.teams[0].rung, 4, 'fell to the safe step');
  assert.equal(s.current.fell, 1);

  let a = game('b1g', { teams: 1, together: false });
  for (let i = 0; i < 3; i++) { a = relay(a, true); a = reduce(a, { type: 'CONTINUE' }); }
  a = relay(a, false);
  assert.equal(a.teams[0].rung, 3, 'Arena stays put');
  assert.ok(a.teams[0].xp > 0);

  let k = game('a1g', { teams: 1, together: false });
  k = relay(k, true); k = reduce(k, { type: 'CONTINUE' });
  k = relay(k, false);
  assert.equal(k.teams[0].rung, 1, 'kids never fall');
  k = reduce(k, { type: 'SAID' });
  assert.equal(k.teams[0].rung, 2, 'saying the answer after Kommo still climbs');
  assert.equal(k.teams[0].stars, 1, 'but without a star');
});

test('relay turns rotate, other teams earn sparks, and 3 sparks refill a used lifeline', () => {
  let s = game('b1', { teams: 2, together: false });
  s = reduce(s, { type: 'NEXT_QUESTION' });
  s = reduce(s, { type: 'LIFELINE', name: 'fifty' });
  const pres = presented(s, s.current.itemId, s.current.salt);
  assert.equal(s.current.removed.length, 2);
  assert.ok(!s.current.removed.includes(pres.answer));
  assert.equal(s.teams[0].lifelines.fifty, false);
  assert.equal(reduce(s, { type: 'LOCK', choice: s.current.removed[0] }), s, 'a removed option cannot be locked');
  s = reduce(s, { type: 'LOCK', choice: pres.answer });
  s = reduce(s, { type: 'REVEAL' });
  s = reduce(s, { type: 'CONTINUE' });
  assert.equal(s.turn, 1);
  assert.equal(s.teams[1].sparks, 1);
  // team 1 plays; team 0's shadow cards earn 3 sparks over its turns -> fifty back
  for (let i = 0; i < 5; i++) { s = relay(s, true); s = reduce(s, { type: 'CONTINUE' }); }
  assert.equal(s.teams[0].lifelines.fifty, true, 'three sparks refilled 50:50');
});

test('ask a friend needs another team; single-team games have no friend lifeline', () => {
  let s = game('b1', { teams: 1, together: false });
  assert.equal(s.teams[0].lifelines.friend, null);
  s = reduce(s, { type: 'NEXT_QUESTION' });
  assert.equal(reduce(s, { type: 'LIFELINE', name: 'friend', teamId: 't1' }), s);
  let t = game('b1', { teams: 2, together: false });
  t = reduce(t, { type: 'NEXT_QUESTION' });
  t = reduce(t, { type: 'LIFELINE', name: 'friend', teamId: 't2' });
  assert.equal(t.current.friend, 't2');
  t = reduce(t, { type: 'LIFELINE', name: 'poll' });
  assert.deepEqual(t.current.poll, [0, 0, 0, 0]);
  t = reduce(t, { type: 'POLL', option: 2, level: 3 });
  assert.equal(t.current.poll[2], 3);
});

test('reaching the top finishes the round so every team gets equal turns', () => {
  let s = game('b1', { teams: 2, together: false, length: 6 });
  // team 0 answers right every turn, team 1 always wrong
  for (let i = 0; i < 20; i++) {
    const right = s.turn === 0;
    s = relay(s, right);
    s = reduce(s, { type: 'CONTINUE' });
    if (s.phase === 'end') break;
  }
  assert.equal(s.phase, 'end');
  assert.equal(s.teams[0].rung, 6);
  assert.equal(s.teams[0].turns, s.teams[1].turns, 'equal turns');
  const st = standings(s);
  assert.equal(st[0].id, 't1');
  assert.equal(endingTitles(s).length, 2);
});

test('the game ends when the questions run out, and FINISH ends at once', () => {
  let s = game('b1', { teams: 1, together: false, n: 12 });
  let guard = 0;
  while (s.phase !== 'end' && guard++ < 40) { s = relay(s, false); s = reduce(s, { type: 'CONTINUE' }); }
  assert.equal(s.phase, 'end');
  assert.equal(s.outOfQuestions, true);
  const f = reduce(reduce(game('b1'), { type: 'NEXT_QUESTION' }), { type: 'FINISH' });
  assert.equal(f.phase, 'end');
});
