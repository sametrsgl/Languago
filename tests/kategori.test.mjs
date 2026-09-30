import test from 'node:test';
import assert from 'node:assert/strict';

import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { makePack } from '../src/classroom/core/pack.mjs';
import { createGame, reduce, valuesFor, cellValue, supportValue, remainingCells, ranking, endingTitles } from '../src/classroom/games/kategori/logic.mjs';

const mcq = (c, i) => ({ id: `${c}-${i}`, type: 'mcq', stem: `I ___ ${'word '.repeat(i % 4)}${c} ${i}.`, options: [`r${i}`, `w${i}a`, `w${i}b`, `w${i}c`], answer: 0 });
const cat = (c, n = 8) => ({ title: `Cat ${c}`, pack: makePack({ id: c, title: `Cat ${c}`, level: 'B1', items: Array.from({ length: n }, (_, i) => mcq(c, i)) }) });

function game(groupId, { cats = 4, rows = null, final = true, teams = 3 } = {}) {
  const profile = audienceProfile(groupId);
  return createGame({ profile, cats: Array.from({ length: cats }, (_, i) => cat(`k${i}`)), teams: defaultTeams(teams, profile.mode), rows, final, code: 'JEOP-3' });
}

function play(s, cellId, rightTeams) {
  s = reduce(s, { type: 'OPEN', cellId });
  s = reduce(s, { type: 'REVEAL' });
  for (const t of s.teams) if (!rightTeams.includes(t.id)) s = reduce(s, { type: 'TOGGLE', teamId: t.id });
  return reduce(s, { type: 'CONTINUE' });
}

test('board shape, values and one hidden double cell', () => {
  const s = game('b1');
  assert.equal(s.cats.length, 4);
  assert.equal(s.cells.length, 20);
  assert.deepEqual(s.values, [100, 200, 300, 400, 500]);
  assert.equal(s.cells.filter((c) => c.double).length, 1);
  assert.ok(s.cells.find((c) => c.double).row > 0, 'never a top-row double');
  assert.deepEqual(valuesFor(audienceProfile('a1g')), [1, 2, 3]);
});

test('picker earns full value, other right teams half, nobody loses points', () => {
  let s = game('b1');
  const cell = s.cells.find((c) => !c.double && c.row === 2);
  s = play(s, cell.id, ['t1', 't3']);
  assert.equal(s.teams[0].score, 300);
  assert.equal(s.teams[1].score, 0);
  assert.equal(s.teams[2].score, 150);
  assert.equal(s.turn, 1);
  assert.equal(s.cells.find((c) => c.id === cell.id).result, 'right');
  const d = s.cells.find((c) => c.double);
  s = play(s, d.id, ['t2']);
  assert.equal(s.teams[1].score, cellValue(s, d));
  assert.equal(cellValue(s, d), d.row === 0 ? 200 : s.values[d.row] * 2);
  assert.equal(supportValue(s, d), s.values[d.row] / 2);
});

test('Oyun Parkı: stars by row, one star for other right teams', () => {
  let s = game('a1g', { cats: 3 });
  const cell = s.cells.find((c) => !c.double && c.row === 1);
  s = play(s, cell.id, ['t1', 't2', 't3']);
  assert.deepEqual(s.teams.map((t) => t.score), [2, 1, 1]);
});

test('clearing the board starts the final: wagers for adults, Big Treasure for kids', () => {
  let s = game('b1', { cats: 2, rows: 2, teams: 2 });
  for (const c of s.cells) s = play(s, c.id, ['t1']);
  assert.equal(remainingCells(s), 0);
  assert.equal(s.phase, 'final');
  assert.equal(s.final.stage, 'wager');
  const before = s.teams[0].score;
  s = reduce(s, { type: 'WAGER_DONE' });
  s = reduce(s, { type: 'REVEAL' });
  s = reduce(s, { type: 'WAGER', teamId: 't1', amount: 99999 });
  assert.equal(s.final.wagers.t1, before, 'a wager is capped at the team score');
  s = reduce(s, { type: 'TOGGLE', teamId: 't2' });
  s = reduce(s, { type: 'FINAL_APPLY' });
  assert.equal(s.phase, 'end');
  assert.equal(s.teams[0].score, before * 2);
  assert.equal(ranking(s)[0].id, 't1');

  let k = game('a2g', { cats: 2, rows: 2, teams: 2 });
  for (const c of k.cells) k = play(k, c.id, ['t1', 't2']);
  assert.equal(k.final.stage, 'prompt', 'no wager for kids');
  k = reduce(k, { type: 'REVEAL' });
  k = reduce(k, { type: 'FINAL_APPLY' });
  assert.ok(k.teams.every((t) => t.score >= 3));
  assert.equal(endingTitles(k).length, 2);
});

test('replace swaps in a spare from the same category; FINISH ends at once', () => {
  let s = game('b1');
  const cell = s.cells[0];
  s = reduce(s, { type: 'OPEN', cellId: cell.id });
  const first = s.current.itemId;
  s = reduce(s, { type: 'REPLACE' });
  assert.notEqual(s.current.itemId, first);
  assert.equal(s.items[s.current.itemId].cat, cell.col);
  s = reduce(s, { type: 'FINISH' });
  assert.equal(s.phase, 'end');
  assert.equal(s.finishedEarly, true);
});
