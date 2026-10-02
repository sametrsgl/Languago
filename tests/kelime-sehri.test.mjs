import test from 'node:test';
import assert from 'node:assert/strict';

import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { makePack } from '../src/classroom/core/pack.mjs';
import {
  BOARD, STREETS, JOKERS, createGame, reduce, boardFor, presented, rollValue, rentDue, netWorth, ranking, endingTitles,
  canBuy, freePlaces, streetOwner, chanceCards, errorSentence, micPrompt,
} from '../src/classroom/games/kelime-sehri/logic.mjs';
import { NEST_BREAKS } from '../src/classroom/games/kelime-sehri/banks.mjs';
import { validSave } from '../src/classroom/games/kelime-sehri/app.mjs';

const mcq = (c, i) => ({ id: `${c}-${i}`, type: 'mcq', stem: `I ___ ${'word '.repeat(i % 5)}${c} ${i}.`, options: [`r${i}`, `w${i}a`, `w${i}b`, `w${i}c`], answer: 0 });
const topic = (c, n = 12) => ({ title: `Grammar · Topic ${c}`, pack: makePack({ id: c, title: `Topic ${c}`, level: 'B1', items: Array.from({ length: n }, (_, i) => mcq(c, i)) }) });

function game(groupId, { topics = 1, teams = 3, n = 12, starterDeed = false, overrides = {} } = {}) {
  const profile = audienceProfile(groupId, overrides);
  return createGame({ profile, topics: Array.from({ length: topics }, (_, i) => topic(`k${i}`, n)), teams: defaultTeams(teams, profile.mode), code: 'CITY-5', starterDeed });
}

// Put the active team just before a square and roll onto it.
function landOn(s, square, value = 1) {
  const pos = (square - value + 20) % 20;
  return reduce({ ...s, teams: s.teams.map((t, k) => (k === s.turn ? { ...t, pos } : t)) }, { type: 'ROLL', value });
}

function answer(s, rightTeams) {
  s = reduce(s, { type: 'REVEAL' });
  for (const t of s.teams) if (!rightTeams.includes(t.id)) s = reduce(s, { type: 'TOGGLE', teamId: t.id });
  return reduce(s, { type: 'CONTINUE' });
}

const setTeams = (s, patch) => ({ ...s, teams: s.teams.map((t) => ({ ...t, ...(patch[t.id] || {}) })) });
const own = (s, square, owner, level = 0) => ({ ...s, places: { ...s.places, [square]: { owner, level } } });
const withDeck = (s, ref) => ({ ...s, deck: [ref], deckPos: 0 });
const cash = (s) => s.teams.map((t) => t.cash);

test('board: 20 squares, specials per mode, prices rise with the tier', () => {
  assert.equal(BOARD.length, 20);
  const st = boardFor('studio');
  const ar = boardFor('arena');
  const pk = boardFor('park');
  assert.equal(st.filter((q) => q.kind === 'place').map((q) => q.street + q.tier).join(' '), 'A1 A2 A3 B1 B2 B3 C1 C2 C3 D1 D2 D3');
  assert.deepEqual([st[0].kind, st[5].kind, st[6].kind, st[10].kind, st[12].kind, st[16].kind], ['start', 'joker', 'garage', 'mic', 'everyone', 'gotoGarage']);
  assert.equal(ar[10].kind, 'wormhole');
  assert.equal(ar[6].name, 'Asteroid Belt');
  assert.deepEqual([pk[5].kind, pk[6].kind, pk[10].kind, pk[12].kind, pk[16].kind], ['everyone', 'nest', 'windy', 'everyone', 'slide']);
  assert.deepEqual([ar[1].price, ar[2].price, ar[4].price], [3, 4, 5]);
  assert.ok(st[1].price < st[2].price && st[2].price < st[4].price && st[4].price <= st[19].price);
  assert.equal(pk[1].price, 0);
  assert.equal(st[13].name, 'Station');
});

test('topics map to streets for 1, 2, 3 and 4 topics; the label is the English part', () => {
  const topicsOf = (n) => game('b1', { topics: n }).streets.map((x) => x.topic);
  assert.deepEqual(topicsOf(1), [0, 0, 0, 0]);
  assert.deepEqual(topicsOf(2), [0, 1, 0, 1]);
  assert.deepEqual(topicsOf(3), [0, 1, 2, 0]);
  assert.deepEqual(topicsOf(4), [0, 1, 2, 3]);
  const s = game('b1', { topics: 2 });
  assert.equal(s.streets[1].label, 'Topic k1');
  assert.equal(s.streets[0].title, 'Grammar · Topic k0');
  const t = s.topics[0].tiers;
  assert.deepEqual([t[1].length, t[2].length, t[3].length], [4, 4, 4]);
  // The same pack twice: the second topic is empty, so its streets reuse the first.
  const profile = audienceProfile('b1');
  const twice = createGame({ profile, topics: [topic('x'), topic('x')], teams: defaultTeams(2, 'studio'), code: 'CITY-5' });
  assert.deepEqual(twice.streets.map((x) => x.topic), [0, 0, 0, 0]);
});

test('vocab distractors come from the same topic; tf items are skipped', () => {
  const vocab = (tp, word) => ({ id: `${tp}:${word}`, type: 'vocab', term: word, q: 'What is it?' });
  const animals = ['cat', 'dog', 'cow', 'pig', 'hen', 'fox'].map((w) => vocab('animals', w));
  const food = ['bread', 'rice', 'soup', 'cake', 'milk', 'egg'].map((w) => vocab('food', w));
  const tf = { id: 'tf1', type: 'tf', statement: 'Cats can fly.', isTrue: false };
  const pack = (id, items) => ({ title: id, pack: makePack({ id, title: id, level: 'A2', items }) });
  const s = createGame({ profile: audienceProfile('a2'), topics: [pack('Animals', [...animals, tf]), pack('Food', food)], teams: defaultTeams(2, 'studio'), code: 'CITY-5' });
  assert.equal(s.items.tf1, undefined);
  for (const id of ['animals:cat', 'food:soup']) {
    const p = presented(s, id, ':1');
    const own = (id.startsWith('animals') ? animals : food).map((a) => a.term);
    assert.equal(p.options.length, 4);
    assert.ok(p.options.every((o) => own.includes(o.text)));
  }
});

test('tier queues never repeat an item while unused items of the topic remain', () => {
  let s = game('b1', { teams: 2, n: 9 });
  const seen = [];
  for (let k = 0; k < 9; k++) {
    s = landOn(s, 1);
    assert.equal(s.pending.purpose, 'claim');
    assert.equal(s.pending.tier, 1);
    seen.push(s.pending.itemId);
    s = answer(s, []); // wrong: the place stays free
  }
  assert.equal(new Set(seen).size, 9);
  assert.deepEqual(seen.slice(0, 3).map((id) => s.items[id].tier), [1, 1, 1]);
  assert.deepEqual(seen.slice(3, 6).map((id) => s.items[id].tier), [2, 2, 2], 'the nearest tier comes next');
  s = landOn(s, 1);
  assert.ok(seen.includes(s.pending.itemId), 'everything used: the topic is recycled');
  // REPLACE (the teacher's N key) takes the next item of the same topic and tier.
  let r = landOn(game('b1'), 1);
  const first = r.pending.itemId;
  r = reduce(r, { type: 'REPLACE' });
  assert.notEqual(r.pending.itemId, first);
  assert.equal(r.items[r.pending.itemId].tier, 1);
  assert.equal(r.items[r.pending.itemId].cat, r.items[first].cat);
  assert.equal(reduce(reduce(r, { type: 'REVEAL' }), { type: 'REPLACE' }).pending.stage, 'revealed', 'no replace after the reveal');
  // The last tier-1 item, replaced again and again: a skipped item never comes back
  // for the same question while unused items remain.
  let q = game('b1', { teams: 2 });
  for (let k = 0; k < 3; k++) q = answer(landOn(q, 1), []);
  q = landOn(q, 1);
  const shown = [q.pending.itemId];
  for (let k = 0; k < 3; k++) {
    q = reduce(q, { type: 'REPLACE' });
    shown.push(q.pending.itemId);
  }
  assert.equal(new Set(shown).size, 4);
  assert.deepEqual(q.pending.skipped, shown.slice(0, 3));
});

test('movement: passing or landing on START pays the bonus; the on-screen roll is seeded', () => {
  const s = game('b1');
  const v = rollValue(s);
  assert.ok(v >= 1 && v <= 6);
  assert.equal(rollValue(game('b1')), v);
  const a = reduce(s, { type: 'ROLL' });
  assert.deepEqual(reduce(s, { type: 'ROLL' }), a);
  assert.equal(a.lastMove.value, v);
  assert.equal(a.teams[0].pos, v);
  assert.equal(reduce(s, { type: 'ROLL', value: 7 }), s);
  let m = reduce(setTeams(s, { t1: { pos: 18 } }), { type: 'ROLL', value: 4 });
  assert.deepEqual(m.lastMove, { teamId: 't1', from: 18, to: 2, value: 4, passedStart: true, via: 'roll' });
  assert.equal(m.teams[0].cash, 600);
  assert.equal(m.pending.purpose, 'claim');
  m = landOn(s, 0);
  assert.equal(m.teams[0].cash, 600);
  assert.deepEqual([m.pending.kind, m.pending.note], ['info', 'start']);
  m = reduce(m, { type: 'CARD_OK' });
  assert.deepEqual([m.turn, m.turnCount, m.phase], [1, 1, 'roll']);
  assert.ok(m.seat >= 1 && m.seat <= 5);
  assert.equal(landOn(game('b1g'), 0).teams[0].cash, 12);
  assert.equal(landOn(game('a1g'), 0).teams[0].cash, 1);
});

test('Stüdyo: a right claim pays +40 and opens the deed; Buy needs the coins; Pass; wrong stays free', () => {
  let s = landOn(game('b1'), 2); // A-t2, 120 coins
  assert.deepEqual([s.pending.purpose, s.pending.tier], ['claim', 2]);
  s = answer(s, ['t1', 't2']);
  assert.equal(s.pending.kind, 'deed');
  assert.deepEqual(cash(s), [540, 520, 500]);
  assert.equal(canBuy(s), true);
  s = reduce(s, { type: 'BUY' });
  assert.equal(s.places[2].owner, 't1');
  assert.equal(s.teams[0].cash, 420);
  assert.equal(s.turn, 1);
  s = answer(landOn(s, 1), ['t2']);
  s = reduce(s, { type: 'PASS' });
  assert.equal(s.places[1].owner, null);
  assert.equal(s.turn, 2);
  s = answer(landOn(setTeams(s, { t3: { cash: 0 } }), 19), ['t3']);
  assert.equal(s.teams[2].cash, 40);
  assert.equal(canBuy(s), false, 'the app shows "Not enough coins"');
  assert.equal(reduce(s, { type: 'BUY' }), s);
  s = reduce(s, { type: 'PASS' });
  const before = landOn(s, 4);
  s = answer(before, ['t2']);
  assert.equal(s.places[4].owner, null);
  assert.equal(s.phase, 'roll');
  assert.equal(s.teams[0].wrong, 1);
  assert.equal(s.teams[0].cash, 420, 'a wrong claim costs nothing');
  assert.ok(s.missed.includes(before.pending.itemId));
  assert.deepEqual(s.itemStats[before.pending.itemId], { right: 1, total: 3 });
});

test('Stüdyo A1 buys automatically when it can afford the place', () => {
  let s = answer(landOn(game('a1'), 1), ['t1']);
  assert.equal(s.places[1].owner, 't1');
  assert.equal(s.teams[0].cash, 500 + 40 - 100);
  assert.equal(s.lastEvent.auto, true);
  assert.equal(s.turn, 1);
  s = answer(landOn(setTeams(s, { t2: { cash: 0 } }), 2), ['t2']);
  assert.deepEqual([s.pending.kind, s.pending.note], ['info', 'cant-afford']);
  assert.equal(s.places[2].owner, null);
  s = reduce(s, { type: 'CARD_OK' });
  assert.equal(s.turn, 2);
});

test('Arena: a right claim pays +2 and claims the planet; the combo starts at a streak of 3', () => {
  let s = answer(landOn(game('b1g', { teams: 2 }), 1), ['t1', 't2']);
  assert.equal(s.places[1].owner, 't1');
  assert.deepEqual(cash(s), [9, 11]);
  assert.equal(s.teams[0].streak, 1);
  s = answer(landOn(setTeams(s, { t2: { streak: 2, cash: 0 } }), 2), ['t2']);
  assert.equal(s.teams[1].cash, 3, '+2 and +1 combo, too little for a 4-credit planet');
  assert.equal(s.places[2].owner, null);
  assert.equal(s.teams[1].bestStreak, 3);
  assert.equal(s.teams[0].cash, 9);
});

test('Arena steal: the right team with the fewest credits that can pay half price', () => {
  const base = game('b1g', { teams: 4 });
  // Shadow credits first (t2 7, t3 2, t4 10); t3 cannot pay 3, so t2 steals.
  let s = answer(landOn(setTeams(base, { t2: { cash: 6 }, t3: { cash: 1 }, t4: { cash: 9 } }), 4), ['t2', 't3', 't4']);
  assert.equal(s.places[4].owner, 't2');
  assert.equal(s.lastEvent.type, 'steal');
  assert.deepEqual(cash(s), [10, 4, 2, 10]);
  assert.equal(s.teams[0].streak, 0);
  s = answer(landOn(setTeams(base, { t2: { cash: 6 }, t3: { cash: 2 }, t4: { cash: 9 } }), 4), ['t2', 't3', 't4']);
  assert.equal(s.places[4].owner, 't3');
  s = answer(landOn(setTeams(base, { t2: { cash: 5 }, t3: { cash: 5 }, t4: { cash: 5 } }), 4), ['t2', 't3', 't4']);
  assert.equal(s.places[4].owner, 't2', 'ties: turn order after the active team');
  s = reduce(setTeams(base, { t1: { cash: 5 }, t2: { cash: 5 }, t4: { cash: 5 } }), { type: 'SET_TURN', index: 2 });
  s = answer(landOn(s, 4), ['t1', 't2', 't4']);
  assert.equal(s.places[4].owner, 't4');
  s = answer(landOn(setTeams(base, { t2: { cash: 0 }, t3: { cash: 1 } }), 4), ['t2', 't3']);
  assert.equal(s.places[4].owner, null, 'nobody can pay: no steal');
  assert.equal(s.teams[0].cash, 10);
});

test('Oyun Parkı: a right answer collects the treasure, a wrong one leaves it asleep, home gives a star', () => {
  let s = answer(landOn(game('a1g', { teams: 2 }), 1), ['t1', 't2']);
  assert.equal(s.places[1].owner, 't1');
  assert.deepEqual(cash(s), [1, 1]);
  s = answer(landOn(s, 2), []);
  assert.equal(s.places[2].owner, null);
  assert.deepEqual(cash(s), [1, 1]);
  s = landOn(s, 1);
  assert.deepEqual([s.pending.kind, s.pending.note], ['info', 'home']);
  s = reduce(s, { type: 'CARD_OK' });
  assert.deepEqual(cash(s), [2, 1]);
});

test('rent: Stüdyo half or full and never below 0; Arena docking fee; Park visit gives both a star', () => {
  let s = own(game('b1', { teams: 2 }), 2, 't2');
  assert.deepEqual([rentDue(s, 2, false), rentDue(s, 2, true)], [40, 20]);
  s = landOn(s, 2);
  assert.deepEqual([s.pending.purpose, s.pending.tier], ['rent', 2]);
  s = answer(s, ['t1']);
  assert.deepEqual(cash(s), [480, 520]);
  let f = own(game('b1', { teams: 2 }), 4, 't2', 2);
  assert.equal(rentDue(f, 4, false), 170);
  assert.equal(landOn(f, 4).pending.tier, 3);
  assert.deepEqual(cash(answer(landOn(f, 4), [])), [330, 670]);
  f = answer(landOn(setTeams(f, { t1: { cash: 30 } }), 4), []);
  assert.deepEqual(cash(f), [0, 530]);
  assert.deepEqual([f.lastEvent.amount, f.lastEvent.due], [30, 170]);

  const a = own(game('b1g', { teams: 2 }), 4, 't2', 1);
  assert.deepEqual(cash(answer(landOn(a, 4), [])), [6, 14]);
  assert.deepEqual(cash(answer(landOn(a, 4), ['t1'])), [10, 10]);
  assert.deepEqual(cash(answer(landOn(setTeams(a, { t1: { cash: 2 } }), 4), [])), [0, 12]);

  const p = own(game('a1g', { teams: 2 }), 1, 't2');
  const v = answer(landOn(p, 1), ['t1']);
  assert.deepEqual(cash(v), [1, 1]);
  assert.equal(v.teams[0].visits, 1);
  assert.deepEqual(cash(answer(landOn(p, 1), [])), [0, 0]);
});

test('a full street doubles Stüdyo base rent, adds 1 to the Arena fee and opens a Park chest', () => {
  let s = reduce(own(own(game('b1', { teams: 2 }), 7, 't2'), 8, 't2'), { type: 'SET_TURN', index: 1 });
  s = reduce(answer(landOn(s, 9), ['t2']), { type: 'BUY' });
  assert.equal(s.lastEvent.streetComplete, 'B');
  assert.equal(streetOwner(s, 'B'), 't2');
  assert.equal(streetOwner(s, 'A'), null);
  assert.deepEqual([rentDue(s, 7, false), rentDue(s, 7, true)], [80, 40]);
  assert.equal(rentDue(own(s, 7, 't2', 1), 7, false), 100, 'only level 0 is doubled');
  // Rounded first, then doubled: A2 (120) rents for 40, so 80; B3 (180) for 50, so 100.
  const sa = own(own(own(game('b1', { teams: 2 }), 1, 't2'), 2, 't2'), 4, 't2');
  assert.deepEqual([rentDue(sa, 2, false), rentDue(sa, 2, true)], [80, 40]);
  const sb = own(own(own(game('b1', { teams: 2 }), 7, 't2'), 8, 't2'), 9, 't2');
  assert.deepEqual([rentDue(sb, 9, false), rentDue(sb, 9, true)], [100, 50]);

  const a = own(own(own(game('b1g', { teams: 2 }), 7, 't2'), 8, 't2'), 9, 't2');
  assert.equal(rentDue(a, 7, false), 2);

  let p = answer(landOn(own(own(game('a1g', { teams: 2 }), 7, 't1'), 8, 't1'), 9), ['t1']);
  assert.equal(p.teams[0].cash, 1 + 3);
  assert.deepEqual([p.lastEvent.chest, p.lastEvent.streetComplete], [3, 'B']);
  assert.equal(p.completed.B, 't1');
});

test('building: a right answer builds up to level 2, then pays the answer bonus', () => {
  let s = own(game('b1', { teams: 2 }), 4, 't1'); // A-t3, 140 coins: a building costs 70
  s = landOn(s, 4);
  assert.deepEqual([s.pending.purpose, s.pending.tier], ['build', 3]);
  s = answer(s, ['t1']);
  assert.deepEqual([s.places[4].level, s.teams[0].cash], [1, 430]);
  s = answer(landOn(reduce(s, { type: 'SET_TURN', index: 0 }), 4), ['t1']);
  assert.deepEqual([s.places[4].level, s.teams[0].cash], [2, 360]);
  s = answer(landOn(reduce(s, { type: 'SET_TURN', index: 0 }), 4), ['t1']);
  assert.deepEqual([s.places[4].level, s.teams[0].cash], [2, 400]);
  s = answer(landOn(reduce(s, { type: 'SET_TURN', index: 0 }), 4), []);
  assert.deepEqual([s.places[4].level, s.teams[0].cash], [2, 400]);
  assert.equal(landOn(own(game('b1'), 1, 't1'), 1).pending.tier, 2);
  const poor = answer(landOn(setTeams(own(game('b1'), 1, 't1'), { t1: { cash: 10 } }), 1), ['t1']);
  assert.deepEqual([poor.places[1].level, poor.teams[0].cash], [0, 50]);
  const a = answer(landOn(own(game('b1g', { teams: 2 }), 1, 't1'), 1), ['t1']);
  assert.deepEqual([a.places[1].level, a.teams[0].cash], [1, 8]);
});

test('Garage: go-to-garage skips START; fix frees and rolls now, not yet or wait ends the turn, pay goes to the pot', () => {
  let s = reduce(setTeams(game('b1', { teams: 2 }), { t1: { pos: 14 } }), { type: 'ROLL', value: 2 });
  assert.deepEqual([s.pending.kind, s.pending.note], ['info', 'toGarage']);
  assert.deepEqual([s.teams[0].pos, s.teams[0].jail, s.teams[0].cash], [6, 1, 500]);
  s = reduce(s, { type: 'CARD_OK' });
  s = landOn(s, 6);
  assert.equal(s.pending.note, 'visiting');
  const g = reduce(s, { type: 'CARD_OK' });
  assert.deepEqual([g.turn, g.phase, g.pending.kind], [0, 'pending', 'garage']);
  assert.equal(reduce(g, { type: 'ROLL' }), g);

  let fix = reduce(g, { type: 'FIX_START' });
  assert.deepEqual([fix.pending.purpose, fix.pending.stage], ['fix', 'prompt']);
  assert.ok(errorSentence(fix, fix.pending.errorIdx).wrong);
  assert.notEqual(reduce(fix, { type: 'REPLACE' }).pending.errorIdx, fix.pending.errorIdx);
  fix = reduce(fix, { type: 'REVEAL' });
  const freed = reduce(fix, { type: 'CONTINUE', ok: true });
  assert.deepEqual([freed.turn, freed.phase, freed.teams[0].jail, freed.teams[0].right], [0, 'roll', 0, 1]);
  assert.notEqual(reduce(freed, { type: 'ROLL', value: 1 }), freed);
  const notYet = reduce(fix, { type: 'CONTINUE', ok: false });
  assert.deepEqual([notYet.turn, notYet.teams[0].jail, notYet.teams[0].wrong], [1, 0, 1]);

  const paid = reduce(g, { type: 'PAY_OUT' });
  assert.deepEqual([paid.teams[0].cash, paid.pot, paid.phase, paid.turn], [450, 150, 'roll', 0]);
  const waited = reduce(g, { type: 'WAIT' });
  assert.deepEqual([waited.turn, waited.teams[0].jail, waited.phase], [1, 0, 'roll']);

  let a = reduce(landOn(setTeams(game('b1g', { teams: 2 }), { t2: { jail: 1 } }), 6), { type: 'CARD_OK' });
  assert.equal(a.pending.kind, 'garage');
  assert.equal(reduce(a, { type: 'PAY_OUT' }), a, 'no paying out in Arena');
  a = reduce(a, { type: 'WAIT' });
  assert.deepEqual([a.turn, a.phase], [0, 'roll']);
});

test('jokers: fifty hides wrong options, swap replaces the item, shield blocks rent, two at most', () => {
  const s = landOn(setTeams(game('b1', { teams: 2 }), { t1: { jokers: ['fifty', 'swap'] } }), 1);
  const f = reduce(s, { type: 'JOKER', kind: 'fifty' });
  const pres = presented(f, f.pending.itemId, f.pending.salt);
  assert.equal(f.pending.hidden.length, 2);
  assert.ok(!f.pending.hidden.includes(pres.answer));
  assert.deepEqual(f.teams[0].jokers, ['swap']);
  assert.equal(reduce(f, { type: 'JOKER', kind: 'fifty' }), f);
  assert.equal(reduce(f, { type: 'JOKER', kind: 'shield' }), f, 'the shield is never played by hand');
  const w = reduce(f, { type: 'JOKER', kind: 'swap' });
  assert.notEqual(w.pending.itemId, f.pending.itemId);
  assert.deepEqual([w.pending.tier, w.pending.hidden, w.teams[0].jokers], [1, [], []]);
  const n = reduce(s, { type: 'REPLACE' });
  assert.deepEqual(n.teams[0].jokers, ['fifty', 'swap'], 'the teacher replace spends nothing');
  assert.equal(reduce(reduce(s, { type: 'REVEAL' }), { type: 'JOKER', kind: 'fifty' }).teams[0].jokers.length, 2);

  const three = landOn(setTeams(game('a2g', { teams: 2, overrides: { mode: 'arena' } }), { t1: { jokers: ['fifty'] } }), 1);
  assert.equal(reduce(three, { type: 'JOKER', kind: 'fifty' }).pending.hidden.length, 1);

  const sh = answer(landOn(setTeams(own(game('b1', { teams: 2 }), 2, 't2'), { t1: { jokers: ['shield'] } }), 2), []);
  assert.deepEqual(cash(sh), [500, 500]);
  assert.deepEqual([sh.teams[0].jokers, sh.lastEvent.type], [[], 'shield']);
  const shr = answer(landOn(setTeams(own(game('b1g', { teams: 2 }), 2, 't2'), { t1: { jokers: ['shield'] } }), 2), ['t1']);
  assert.deepEqual(shr.teams[0].jokers, ['shield'], 'no fee due: the shield is kept');

  const box = landOn(game('b1'), 5);
  assert.deepEqual([box.pending.kind, box.pending.note], ['info', 'joker']);
  assert.ok(JOKERS.includes(box.teams[0].jokers[0]));
  const full = landOn(setTeams(game('b1'), { t1: { jokers: ['fifty', 'swap'] } }), 5);
  assert.deepEqual([full.teams[0].jokers.length, full.teams[0].cash, full.pending.amount], [2, 550, 50]);
  assert.equal(landOn(setTeams(game('b1g'), { t1: { jokers: ['fifty', 'fifty'] } }), 5).teams[0].cash, 12);
});

test('Everybody: a tier-2 question for the whole class; every right team earns the bonus', () => {
  let s = landOn(game('b1', { topics: 4 }), 12);
  assert.deepEqual([s.pending.purpose, s.pending.tier], ['everyone', 2]);
  assert.equal(s.items[s.pending.itemId].cat, s.streets[STREETS.indexOf(s.pending.street)].topic);
  assert.equal(reduce(setTeams(s, { t1: { jokers: ['fifty'] } }), { type: 'JOKER', kind: 'fifty' }).pending.hidden.length, 0);
  const id = s.pending.itemId;
  s = answer(s, ['t1', 't3']);
  assert.deepEqual(cash(s), [550, 500, 550]);
  assert.deepEqual(s.teams.map((t) => t.right + t.wrong), [0, 0, 0]);
  assert.deepEqual(s.teams.map((t) => t.shadowRight), [1, 0, 1]);
  assert.ok(s.missed.includes(id));
  const a = answer(landOn(setTeams(game('b1g'), { t1: { streak: 2 } }), 12), ['t1']);
  assert.deepEqual([a.teams[0].cash, a.teams[0].streak], [12, 2]);
  const p = landOn(game('a1g', { teams: 2 }), 5);
  assert.equal(p.pending.purpose, 'everyone');
  assert.deepEqual(cash(answer(p, ['t1', 't2'])), [1, 1]);
});

test('Open Mic: great wins the pot, OK half, Try again keeps the prompt', () => {
  let s = landOn(game('b1', { teams: 2 }), 10);
  assert.equal(s.pending.kind, 'mic');
  const idx = s.pending.micIdx;
  assert.ok(micPrompt(s, idx).text);
  assert.equal(reduce(s, { type: 'RATE', grade: 'wow' }), s);
  s = reduce(s, { type: 'RATE', grade: 'try' });
  assert.deepEqual([s.pot, s.micPos, s.turn], [100, 0, 1]);
  s = landOn(s, 10);
  assert.equal(s.pending.micIdx, idx);
  s = reduce(s, { type: 'RATE', grade: 'ok' });
  assert.deepEqual([s.teams[1].cash, s.pot, s.micPos], [550, 50, 1]);
  s = landOn(s, 10);
  assert.notEqual(s.pending.micIdx, idx);
  s = reduce(s, { type: 'RATE', grade: 'great' });
  assert.deepEqual([s.teams[0].cash, s.pot], [550, 0]);
});

test('Chance: tasks are rated; events apply at once; steps resolves the new square; toGarage pays no bonus', () => {
  let s = landOn(withDeck(game('b1', { teams: 2 }), 'task:flight'), 3);
  assert.deepEqual([s.pending.kind, s.pending.card.id], ['chance-task', 'flight']);
  assert.equal(reduce(s, { type: 'CARD_OK' }), s);
  s = reduce(s, { type: 'RATE', grade: 'great' });
  assert.deepEqual([s.teams[0].cash, s.turn, s.deckPos], [600, 1, 1]);
  s = landOn(s, 3);
  assert.deepEqual([s.deckRound, s.deckPos, s.deck.length], [1, 1, chanceCards(s.profile).length], 'the deck reshuffles');
  assert.equal(reduce(landOn(withDeck(game('b1g'), 'task:strange-day'), 3), { type: 'RATE', grade: 'ok' }).teams[0].cash, 12);

  const b = landOn(withDeck(game('b1'), 'event:bonus'), 3);
  assert.deepEqual([b.pending.kind, b.pending.note, b.teams[0].cash], ['info', 'event', 550]);
  assert.equal(reduce(b, { type: 'CARD_OK' }).turn, 1);
  const pot = landOn(withDeck(game('b1'), 'event:parking'), 3);
  assert.deepEqual([pot.teams[0].cash, pot.pot], [450, 150]);
  const home = landOn(withDeck(game('b1'), 'event:start'), 15);
  assert.deepEqual([home.teams[0].pos, home.teams[0].cash], [0, 600]);
  const taxi = landOn(withDeck(game('b1'), 'event:taxi'), 15, 2);
  assert.deepEqual([taxi.teams[0].pos, taxi.pending.kind, taxi.pending.purpose, taxi.pending.square], [18, 'question', 'claim', 18]);
  // lastMove keeps the roll (the die shows 2); the taxi ride follows it.
  assert.deepEqual([taxi.lastMove.from, taxi.lastMove.to, taxi.lastMove.value, taxi.lastMove.via], [13, 15, 2, 'roll']);
  assert.deepEqual(taxi.lastMove.then.map((m) => [m.from, m.to, m.value, m.via]), [[15, 18, 3, 'event:taxi']]);
  const tyre = landOn(withDeck(game('b1'), 'event:flat-tyre'), 15);
  assert.deepEqual([tyre.teams[0].pos, tyre.teams[0].jail, tyre.teams[0].cash, tyre.pending.kind], [6, 1, 500, 'info']);
  const jk = landOn(withDeck(game('b1'), 'event:joker'), 3);
  assert.equal(jk.teams[0].jokers.length, 1);

  const kids = chanceCards(audienceProfile('a1g'));
  assert.ok(!kids.some((c) => c.kind === 'event' && c.effect.type === 'toGarage'));
  assert.ok(kids.some((c) => c.id === 'count-10') && !kids.some((c) => c.id === 'count-twos' || c.id === 'see-3'));
  assert.ok(chanceCards(audienceProfile('b1g', { mode: 'park' })).some((c) => c.id === 'see-3'));
  let m = landOn(withDeck(game('a1g', { teams: 2 }), 'task:penguin'), 3);
  assert.equal(m.pending.magic, true);
  assert.equal(reduce(m, { type: 'RATE', grade: 'great' }), m);
  m = reduce(m, { type: 'CARD_OK' });
  assert.deepEqual(cash(m), [1, 1]);
  assert.deepEqual(cash(landOn(withDeck(game('a1g', { teams: 2 }), 'event:stars-all'), 3)), [1, 1]);
  const hop = landOn(withDeck(game('a1g', { teams: 2 }), 'event:hop'), 3);
  assert.deepEqual([hop.teams[0].pos, hop.pending.purpose], [5, 'everyone']);
});

test("Oyun Parkı corners: Kommo's Nest, the Rainbow Slide and Windy Corner; the Arena Wormhole", () => {
  let s = landOn(game('a1g', { teams: 2 }), 6);
  assert.equal(s.pending.kind, 'nest');
  assert.ok(NEST_BREAKS[s.pending.breakIdx].text);
  s = reduce(s, { type: 'CARD_OK' });
  assert.deepEqual(cash(s), [1, 1]);
  s = landOn(s, 16);
  assert.deepEqual([s.teams[1].pos, s.teams[1].cash, s.pending.note], [0, 2, 'slide']);
  s = reduce(s, { type: 'CARD_OK' });
  s = landOn(s, 10);
  assert.equal(s.pending.kind, 'pick');
  assert.equal(reduce(s, { type: 'PICK', square: 5 }), s, 'only a free place can be picked');
  s = reduce(s, { type: 'PICK', square: 7 });
  assert.deepEqual([s.pending.purpose, s.pending.square, s.pending.tier, s.teams[0].pos], ['claim', 7, 1, 10]);
  s = answer(s, ['t1']);
  assert.equal(s.places[7].owner, 't1');

  let full = game('a1g', { teams: 2 });
  for (const sq of freePlaces(full)) full = own(full, sq, 't2');
  full = landOn(full, 10);
  assert.deepEqual([full.pending.note, full.teams[0].cash], ['no-free', 1]);
  let a = game('b1g', { teams: 2 });
  assert.equal(landOn(a, 10).pending.kind, 'pick');
  for (const sq of freePlaces(a)) a = own(a, sq, 't2');
  assert.equal(landOn(a, 10).teams[0].cash, 12);
});

test('the final round ends when the turn wraps to the first team; FINISH ends at once', () => {
  let s = reduce(game('b1', { teams: 3 }), { type: 'SET_TURN', index: 1 });
  assert.equal(s.turn, 1);
  assert.equal(reduce(s, { type: 'SET_TURN', index: 7 }), s);
  s = reduce(s, { type: 'FINAL_ROUND' });
  assert.equal(s.finalRound, true);
  assert.equal(reduce(s, { type: 'FINAL_ROUND' }), s);
  s = reduce(landOn(s, 6), { type: 'CARD_OK' });
  assert.deepEqual([s.turn, s.phase], [2, 'roll']);
  s = reduce(landOn(s, 6), { type: 'CARD_OK' });
  assert.equal(s.phase, 'end');
  assert.equal(reduce(s, { type: 'ROLL' }), s);
  const f = reduce(landOn(game('b1'), 1), { type: 'FINISH' });
  assert.deepEqual([f.phase, f.pending, f.finishedEarly], ['end', null, true]);
  assert.equal(reduce(f, { type: 'FINISH' }), f);
});

test('ranking: Stüdyo and Arena by net worth, Oyun Parkı by stars; ending titles', () => {
  let s = own(own(game('b1'), 19, 't2', 2), 1, 't3');
  s = setTeams(s, { t1: { cash: 700 }, t2: { cash: 100 }, t3: { cash: 500, right: 2, shadowRight: 3 } });
  assert.equal(netWorth(s, 't2'), 100 + 300 + 2 * 150);
  const r = ranking(s);
  assert.deepEqual(r.map((t) => t.id), ['t1', 't2', 't3']);
  assert.deepEqual(r.map((t) => t.place), [0, 0, 2]);
  assert.deepEqual(endingTitles(s), [{ teamId: 't1', title: 'Top net worth' }, { teamId: 't3', title: 'Language MVP' }]);

  const a = own(game('b1g', { teams: 2 }), 1, 't2', 1);
  assert.equal(netWorth(a, 't2'), 10 + 3 + 2);
  assert.equal(ranking(a)[0].id, 't2');
  assert.deepEqual(endingTitles(a).map((x) => x.title), ['Most planets', 'Top credits']);

  const p = setTeams(own(game('a1g'), 1, 't3'), { t1: { cash: 2 }, t2: { cash: 5 } });
  assert.deepEqual(ranking(p).map((t) => t.id), ['t2', 't1', 't3']);
  const titles = endingTitles(p);
  assert.equal(titles.length, 3);
  assert.deepEqual(titles[0], { teamId: 't3', title: 'Treasure Hunters', treasures: 1 });
});

test('starter deeds: every team starts with one distinct tier-1 or tier-2 place; at most 6 teams', () => {
  const s = game('b1', { teams: 6, starterDeed: true });
  const owned = Object.entries(s.places).filter(([, p]) => p.owner);
  assert.equal(owned.length, 6);
  assert.equal(new Set(owned.map(([, p]) => p.owner)).size, 6);
  assert.ok(owned.every(([sq]) => s.board[sq].tier <= 2));
  assert.equal(game('b1', { teams: 8 }).teams.length, 6);
  assert.equal(Object.values(game('b1').places).filter((p) => p.owner).length, 0);
});

// A driver that always takes the obvious next step, for every mode.
function nextAction(s, k) {
  const p = s.pending;
  if (s.phase === 'roll') return { type: 'ROLL' };
  if (p.kind === 'question') {
    if (p.stage !== 'revealed') return { type: 'REVEAL' };
    if (k % 3 === 0 && p.purpose !== 'fix' && p.chips[s.teams[1].id]) return { type: 'TOGGLE', teamId: s.teams[1].id };
    return { type: 'CONTINUE', ok: k % 2 === 0 };
  }
  if (p.kind === 'deed') return canBuy(s) ? { type: 'BUY' } : { type: 'PASS' };
  if (p.kind === 'garage') return { type: 'FIX_START' };
  if (p.kind === 'pick') return { type: 'PICK', square: freePlaces(s)[0] };
  if (p.kind === 'mic' || (p.kind === 'chance-task' && s.profile.mode !== 'park')) return { type: 'RATE', grade: ['great', 'ok', 'try'][k % 3] };
  return { type: 'CARD_OK' };
}

test('undo-safety: reduce never mutates its input and is deterministic; Park stars never go down', () => {
  for (const group of ['b1', 'a1', 'b1g', 'a1g']) {
    let s = game(group, { topics: 2, teams: 3, starterDeed: group !== 'a1g' });
    for (let k = 0; k < 150 && s.phase !== 'end'; k++) {
      const action = nextAction(s, k);
      const before = JSON.stringify(s);
      const next = reduce(s, action);
      assert.equal(JSON.stringify(s), before, `${group}: ${action.type} mutated its input`);
      assert.deepEqual(reduce(s, action), next);
      assert.notEqual(next, s, `${group}: ${action.type} should be valid here`);
      if (s.profile.mode === 'park') next.teams.forEach((t, i) => assert.ok(t.cash >= s.teams[i].cash, 'stars only go up'));
      assert.ok(next.teams.every((t) => t.cash >= 0));
      assert.ok(next.log.length <= 30);
      s = next;
    }
    assert.ok(s.turnCount > 20, `${group} played a real game`);
  }
  const s = game('b1');
  for (const a of [{ type: 'BUY' }, { type: 'PASS' }, { type: 'CARD_OK' }, { type: 'PICK', square: 1 }, { type: 'RATE', grade: 'great' }, { type: 'WAIT' }, { type: 'CONTINUE' }, { type: 'NOPE' }, { type: 'ADJUST', teamId: 'zz', delta: 5 }]) {
    assert.equal(reduce(s, a), s, `${a.type} is a no-op here`);
  }
  const adj = reduce(s, { type: 'ADJUST', teamId: 't2', delta: -9999 });
  assert.equal(adj.teams[1].cash, 0);
  assert.equal(adj.lastEvent, s.lastEvent);
  assert.deepEqual(adj.log.at(-1), { type: 'adjust', teamId: 't2', amount: -500 }, 'the log shows what was applied');
  assert.equal(reduce(adj, { type: 'ADJUST', teamId: 't2', delta: -5 }), adj, 'nothing left to take: a no-op');
  const park = game('a1g');
  assert.equal(reduce(park, { type: 'ADJUST', teamId: 't1', delta: -5 }), park);
  assert.equal(reduce(park, { type: 'ADJUST', teamId: 't1', delta: 2 }).teams[0].cash, 2);
  assert.deepEqual(game('b1', { starterDeed: true }), game('b1', { starterDeed: true }));
});

test('saves: only a whole, well-formed game is resumed (a broken one never bricks the setup)', () => {
  const ok = (state) => validSave({ savedAt: Date.now(), state });
  const s = game('b1', { starterDeed: true });
  const q = landOn(s, 4, 4); // a free tier-3 place: a claim question
  assert.equal(q.pending.kind, 'question');
  assert.equal(ok(s), true);
  assert.equal(ok(q), true);
  assert.equal(ok(reduce(s, { type: 'FINISH' })), true);
  assert.equal(ok(game('a1g', { teams: 6 })), true);
  assert.equal(validSave(null), false);
  const team0 = (patch) => ({ ...s, teams: s.teams.map((t, i) => (i ? t : { ...t, ...patch })) });
  const broken = {
    'no topics': { ...s, topics: undefined },
    'no jokers': team0({ jokers: undefined }),
    'a bad colour': team0({ hex: '#fff" onmouseover="x' }),
    'a token off the board': team0({ pos: 20 }),
    'a bad score': team0({ cash: '5<img>' }),
    'the turn out of range': { ...s, turn: s.teams.length },
    'pending without a card': { ...s, phase: 'pending', pending: null },
    'a card while rolling': { ...q, phase: 'roll' },
    'three streets': { ...s, streets: s.streets.slice(1) },
    'an unknown item': { ...q, pending: { ...q.pending, itemId: 'nope' } },
    'an unknown card': { ...q, pending: { kind: 'nope' } },
  };
  for (const [why, state] of Object.entries(broken)) assert.equal(ok(state), false, why);
});
