import test from 'node:test';
import assert from 'node:assert/strict';

import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { rngFor } from '../src/classroom/core/rng.mjs';
import {
  createGame, reduce, audienceFor, targetFor, huddleFor, helperCount, startersShown, presentPrompt, ranking, endingTitles, highlights,
  reasonsFor, canChallenge, challengeLocked, comboMultiplier, spinIndex, hintLadder, modeAvailable, followUpTeam,
  GRADE_POINTS, STAR_KEYS, MAX_WRONG_CHALLENGES,
} from '../src/classroom/games/konusma-carki/logic.mjs';

// Fixture packs: per level, five open/ask prompts (modes cycle) and two wyr.
const MODES = ['talk', 'describe', 'opinion', 'hypothetical', 'ask'];
const speak = (c, lv, i) => ({
  id: `${c}-${lv}-${i}`, type: 'speak', mode: MODES[i % MODES.length], prompt: `Talk about ${c} number ${i}.`, label: `${c} ${i}`, emoji: '\u{1F43C}',
  starters: ['I like ...', 'It is ...', 'There is ...'], followUps: ['Why?', 'When?', 'What else?'], useful: ['big', 'small', 'happy', 'fast', 'funny'],
  model: 'I like big pandas.', tr: 'Pandalar', level: lv, cat: c,
});
const wyr = (c, lv, i) => ({
  id: `${c}-${lv}-w${i}`, type: 'speak', mode: 'wyr', prompt: 'Would you rather...?', label: 'Fly or swim', emoji: '\u{1F914}',
  optA: { text: `fly ${i}`, emoji: '\u{1F985}' }, optB: { text: `swim ${i}`, emoji: '\u{1F42C}' }, starters: [], followUps: [], useful: [], model: "I'd rather fly.", tr: 'Uçmak', level: lv, cat: c,
});
function topic(c, { levels = ['a1', 'a2', 'b1', 'b2'], per = 5, wyrs = 2, extra = [] } = {}) {
  const items = [...extra];
  for (const lv of levels) {
    for (let i = 0; i < per; i++) items.push(speak(c, lv, i));
    for (let i = 0; i < wyrs; i++) items.push(wyr(c, lv, i));
  }
  return { title: `Hayvanlar · ${c}`, pack: { schema: 'lg.pack/1', id: c, title: c, level: 'B1', origin: 'ai', kind: 'speaking', items } };
}

function game(groupId, { topics = 2, teams = 3, mode = 'wheel', options = {}, overrides = {}, topicOpts = {}, code = 'TALK-7' } = {}) {
  const profile = audienceProfile(groupId, overrides);
  return createGame({ profile, topics: Array.from({ length: topics }, (_, i) => topic(`k${i}`, topicOpts)), teams: defaultTeams(teams, profile.mode), code, mode, options });
}

const act = (s, ...actions) => actions.reduce((x, a) => reduce(x, typeof a === 'string' ? { type: a } : a), s);
const setTeams = (s, patch) => ({ ...s, teams: s.teams.map((t) => ({ ...t, ...(patch[t.id] || {}) })) });
const totals = (s) => s.teams.map((t) => (s.profile.mode === 'park' ? t.stars : t.score));

// One full wheel turn: spin, talk, follow-up (true/false judges it, null skips), award.
function wheelTurn(s, award, { followUp = null, hints = 0, sentences = 0 } = {}) {
  s = act(s, 'SPIN', 'NEXT');
  for (let i = 0; i < hints; i++) s = reduce(s, { type: 'HINT' });
  for (let i = 0; i < sentences; i++) s = reduce(s, { type: 'SENTENCE', delta: 1 });
  s = reduce(s, { type: 'NEXT' });
  s = followUp === null ? reduce(s, { type: 'NEXT' }) : reduce(s, { type: 'FOLLOWUP', ok: followUp });
  return reduce(s, { type: 'AWARD', ...award });
}

// One Just a Minute turn with no challenges (Park/Arena end on an award).
function jamTurn(s, award = { grade: 'good' }) {
  s = act(s, 'NEXT', 'NEXT', 'NEXT');
  if (s.current.stage === 'talk') s = act(s, 'NEXT');
  if (s.current.stage === 'whistle' && s.profile.mode === 'studio') return reduce(s, { type: 'NEXT' });
  s = act(s, 'NEXT');
  return reduce(s, { type: 'AWARD', ...award });
}

function deepFreeze(o) {
  if (o && typeof o === 'object' && !Object.isFrozen(o)) {
    Object.freeze(o);
    for (const v of Object.values(o)) deepFreeze(v);
  }
  return o;
}

test('createGame: pools, wheel, options and the first turn', () => {
  const s = game('b1g');
  assert.equal(s.game, 'konusma-carki');
  assert.equal(s.missedNone, true);
  assert.deepEqual(s.options, { segments: 8, removeUsed: true, difficulty: 'orta', easier: false, groupSize: 4, wyrVote: 'stand', bestReason: false });
  assert.equal(s.pool.talk.length, 10, 'two topics × five b1 prompts');
  assert.equal(s.pool.jam.length, 8, 'ask prompts never go into Just a Minute');
  assert.ok(s.pool.jam.every((id) => s.items[id].mode !== 'ask' && s.items[id].mode !== 'wyr'));
  assert.equal(s.pool.wyr.length, 4);
  assert.ok(Object.values(s.items).every((it) => it.level === 'b1'));
  assert.equal(s.wheel.length, 8);
  assert.deepEqual(s.wheel, s.pool.talk.slice(0, 8));
  // Round robin over the topics.
  assert.deepEqual(s.pool.talk.slice(0, 4).map((id) => s.items[id].topic), [0, 1, 0, 1]);
  assert.equal(s.topics[0].label, 'k0');
  assert.equal(s.mode, 'wheel');
  assert.equal(s.phase, 'play');
  assert.equal(s.current.stage, 'turn');
  assert.equal(s.current.teamId, 't1');
  assert.ok(s.seat >= 1 && s.seat <= 5);
  assert.equal(s.current.seat, s.seat);
  assert.ok(s.teams.every((t) => t.score === 0 && t.stars === 0 && t.turns === 0 && t.challengesWrong === 0));

  assert.equal(game('b1', { options: { segments: 20 } }).options.segments, 12);
  assert.equal(game('b1', { options: { segments: 2 } }).wheel.length, 6);
  const odd = game('b1', { options: { groupSize: 5, difficulty: 'x', wyrVote: 'jump' } }).options;
  assert.deepEqual([odd.groupSize, odd.difficulty, odd.wyrVote], [4, 'orta', 'stand']);
  assert.equal(game('b1', { teams: 8 }).teams.length, 6);

  // Broken items never reach the stage.
  const bad = [
    { id: 'x1', type: 'mcq', stem: 'a', options: ['a', 'b'], answer: 0, level: 'b1' },
    { id: 'x2', type: 'speak', mode: 'wyr', prompt: 'Would you rather?', optA: { text: 'a' }, level: 'b1' },
    { id: 'x3', type: 'speak', mode: 'sing', prompt: 'Sing', level: 'b1' },
    { id: 'x4', type: 'speak', mode: 'talk', prompt: '  ', level: 'b1' },
  ];
  const b = game('b1', { topics: 1, topicOpts: { extra: bad } });
  assert.ok(['x1', 'x2', 'x3', 'x4'].every((id) => !b.items[id]));
});

test('"Bir seviye kolaylaştır" takes prompts one level lower when a topic has them', () => {
  const s = game('b1', { options: { easier: true } });
  assert.ok(Object.values(s.items).every((it) => it.level === 'a2'));
  const a1 = game('a1', { options: { easier: true } });
  assert.ok(Object.values(a1.items).every((it) => it.level === 'a1'), 'A1 has no lower level');
  // Topic 0 has an A2 set, topic 1 only B1: each falls back on its own.
  const profile = audienceProfile('b1');
  const mixed = createGame({ profile, topics: [topic('lo', { levels: ['a2', 'b1'] }), topic('hi', { levels: ['b1'] })], teams: defaultTeams(2, profile.mode), code: 'MIX-1', options: { easier: true } });
  const levelsOf = (t) => [...new Set(Object.values(mixed.items).filter((it) => it.topic === t).map((it) => it.level))];
  assert.deepEqual(levelsOf(0), ['a2']);
  assert.deepEqual(levelsOf(1), ['b1']);
});

test('targets per level, look and difficulty; helpers, starters, huddle, audience', () => {
  const t = (g, difficulty = 'orta', overrides = {}) => targetFor(game(g, { options: { difficulty }, overrides }));
  assert.deepEqual(t('a1g'), { kind: 'sentences', n: 3 });
  assert.deepEqual(t('a1g', 'kolay'), { kind: 'sentences', n: 2 });
  assert.deepEqual(t('a1g', 'zor'), { kind: 'sentences', n: 4 });
  assert.deepEqual(t('a2'), { kind: 'sentences', n: 4 });
  assert.deepEqual(t('a2g', 'zor'), { kind: 'sentences', n: 5 });
  assert.deepEqual(t('b1g'), { kind: 'seconds', n: 40 });
  assert.deepEqual(t('b1g', 'kolay'), { kind: 'seconds', n: 30 });
  assert.deepEqual(t('b2g'), { kind: 'seconds', n: 45 });
  assert.deepEqual(t('b2g', 'zor', { mode: 'park' }), { kind: 'seconds', n: 55 });
  assert.deepEqual(t('b1'), { kind: 'seconds', n: 60 });
  assert.deepEqual(t('b2', 'zor'), { kind: 'seconds', n: 70 });
  assert.equal(targetFor(game('b1'), { mode: 'wyr' }), null);

  const k = game('b1g', { options: { difficulty: 'kolay' } });
  const o = game('b1g');
  const z = game('b1g', { options: { difficulty: 'zor' } });
  assert.deepEqual([helperCount(k), helperCount(o), helperCount(z)], [5, 3, 0]);
  assert.deepEqual([startersShown(k), startersShown(o), startersShown(z)], [true, true, false]);
  const id = o.wheel[0];
  assert.equal(presentPrompt(k, id).useful.length, 5);
  assert.equal(presentPrompt(o, id).useful.length, 3);
  assert.deepEqual(presentPrompt(z, id).useful, []);
  assert.deepEqual(presentPrompt(z, id).starters, []);
  assert.equal(presentPrompt(o, id).starters.length, 3);
  assert.equal(presentPrompt(o, 'nope'), null);

  assert.equal(huddleFor(game('a1g')), 10);
  assert.equal(huddleFor(game('b1g')), 15);
  assert.equal(huddleFor(game('b1')), 20);
  assert.equal(huddleFor(game('b1'), 'jam'), 10, 'Just a Minute: a 10 s think');
  assert.equal(audienceFor(audienceProfile('a1g')), 'kids');
  assert.equal(audienceFor(audienceProfile('b1g')), 'teens');
  assert.equal(audienceFor(audienceProfile('a1g', { mode: 'arena' })), 'teens');
  assert.equal(audienceFor(audienceProfile('b2')), 'adults');
});

test('seat bag: every seat speaks once before anyone repeats; SET_TURN puts the seat back', () => {
  let s = game('b1', { teams: 2 });
  const seats = { t1: [], t2: [] };
  for (let k = 0; k < 10; k++) {
    seats[s.current.teamId].push(s.current.seat);
    s = wheelTurn(s, { grade: 'good' });
  }
  assert.deepEqual([...seats.t1].sort(), [1, 2, 3, 4, 5]);
  assert.deepEqual([...seats.t2].sort(), [1, 2, 3, 4, 5]);
  assert.equal(s.turnCount, 10);
  assert.equal(s.round, 6);
  assert.notEqual(s.current.seat, seats.t1[4], 'no seat twice in a row across bags');

  const g = game('b1', { teams: 3 });
  assert.equal(g.bags.t1.left.length, 4);
  const moved = reduce(g, { type: 'SET_TURN', index: 2 });
  assert.equal(moved.current.teamId, 't3');
  assert.equal(moved.turn, 2);
  assert.equal(moved.bags.t1, null, 't1 gets its drawn seat back');
  assert.equal(moved.bags.t3.left.length, 4);
  assert.equal(reduce(moved, { type: 'SET_TURN', index: 2 }), moved, 'same team');
  assert.equal(reduce(moved, { type: 'SET_TURN', index: 9 }), moved);
  const spun = reduce(moved, { type: 'SPIN' });
  assert.equal(reduce(spun, { type: 'SET_TURN', index: 0 }), spun, 'not in the middle of a turn');
});

test('spin: seeded per turn, so the same state always lands on the same segment', () => {
  const s0 = game('b1g');
  const a = reduce(s0, { type: 'SPIN' });
  const b = reduce(s0, { type: 'SPIN' });
  assert.deepEqual(a, b);
  assert.equal(a.current.segment, Math.floor(rngFor('TALK-7:spin:0')() * s0.wheel.length));
  assert.equal(a.current.segment, spinIndex(s0));
  assert.equal(a.current.itemId, s0.wheel[a.current.segment]);
  assert.equal(a.current.stage, 'card');
  assert.deepEqual(a.current.target, { kind: 'seconds', n: 40 });
  assert.equal(a.lastEvent.type, 'spin');
  assert.equal(reduce(a, { type: 'SPIN' }), a, 'one spin a turn');
  // Another board code lands elsewhere at least sometimes.
  const codes = ['A-1', 'B-2', 'C-3', 'D-4', 'E-5', 'F-6'].map((code) => reduce(game('b1g', { code }), { type: 'SPIN' }).current.segment);
  assert.ok(new Set(codes).size > 1);
});

test('removeUsed: a used prompt leaves the wheel and an unused one takes its segment', () => {
  let s = game('b1g', { teams: 2 });
  const spun = reduce(s, { type: 'SPIN' });
  const { itemId, segment } = spun.current;
  s = wheelTurn(s, { grade: 'good' });
  assert.ok(s.used.includes(itemId));
  assert.ok(!s.wheel.includes(itemId));
  assert.equal(s.wheel.length, 8);
  assert.equal(s.wheel[segment], s.pool.talk[8], 'the first unused prompt, in the same segment');

  let keep = game('b1g', { teams: 2, options: { removeUsed: false } });
  const before = keep.wheel;
  const landed = reduce(keep, { type: 'SPIN' }).current.itemId;
  keep = wheelTurn(keep, { grade: 'good' });
  assert.deepEqual(keep.wheel, before);
  assert.ok(keep.used.includes(landed));

  // Five prompts only: the wheel shrinks, then recycles when all are used.
  let small = game('b1g', { teams: 2, topics: 1, topicOpts: { levels: ['b1'] } });
  assert.equal(small.wheel.length, 5);
  const sizes = [];
  for (let k = 0; k < 5; k++) { small = wheelTurn(small, { grade: 'tried' }); sizes.push(small.wheel.length); }
  assert.deepEqual(sizes, [4, 3, 2, 1, 5]);
  assert.equal(small.recycles, 1);
  assert.deepEqual(small.used, []);
  assert.deepEqual([...small.wheel].sort(), [...small.pool.talk].sort());
});

test('wheel flow end to end: Oyun Parkı stars, sentence counter, chorus follow-up', () => {
  let s = game('a1g', { teams: 2 });
  assert.equal(s.profile.mode, 'park');
  s = reduce(s, { type: 'SPIN' });
  assert.deepEqual(s.current.target, { kind: 'sentences', n: 3 });
  assert.equal(reduce(s, { type: 'SENTENCE', delta: 1 }), s, 'counter only while talking');
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.current.stage, 'talk');
  s = act(s, { type: 'SENTENCE', delta: 1 }, { type: 'SENTENCE', delta: 1 }, { type: 'SENTENCE', delta: -1 }, { type: 'SENTENCE', delta: 1 }, { type: 'SENTENCE', delta: 1 });
  assert.equal(s.current.sentences, 3);
  assert.equal(s.current.stage, 'talk', 'the wheel waits for the teacher');
  assert.equal(reduce({ ...s, current: { ...s.current, sentences: 0 } }, { type: 'SENTENCE', delta: -1 }).current.sentences, 0);
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.current.stage, 'followup');
  assert.equal(s.current.followUp.askerId, null, 'the class reads it in chorus');
  assert.equal(s.current.followUp.shown, 1);
  s = act(s, 'DIG', 'HINT');
  assert.equal(s.current.followUp.shown, 3);
  assert.equal(reduce(s, { type: 'DIG' }), s, 'the ladder has three rungs');
  s = reduce(s, { type: 'FOLLOWUP' });
  assert.equal(s.current.stage, 'award');
  assert.deepEqual(totals(s), [0, 0], 'no points for a Park follow-up');
  assert.equal(s.stats.followUps, 1);
  s = reduce(s, { type: 'AWARD', stars: ['spoke', 'helper', 'finished'] });
  assert.equal(s.teams[0].stars, 3);
  assert.equal(s.teams[0].turns, 1);
  assert.equal(s.teams[0].great, 1);
  assert.equal(s.turn, 1);
  assert.equal(s.current.teamId, 't2');
  assert.equal(s.current.stage, 'turn');
  assert.equal(s.lastEvent.type, 'award');
  s = wheelTurn(s, { stars: 2 });
  assert.deepEqual(totals(s), [3, 2]);
  assert.equal(s.round, 2);
  assert.deepEqual(STAR_KEYS, ['spoke', 'helper', 'finished']);
});

test('wheel flow end to end: Arena and Stüdyo grades with the In English tick', () => {
  let a = game('b1g', { teams: 3 });
  assert.equal(a.profile.mode, 'arena');
  a = wheelTurn(a, { grade: 'good' }, { followUp: true });
  assert.deepEqual(totals(a), [2, 1, 0], 'Good 2; the next team asked a real question');
  a = wheelTurn(a, { grade: 'great', english: false }, { followUp: false });
  assert.deepEqual(totals(a), [2, 1, 0], 'not in English: nothing');
  assert.equal(a.teams[1].clean, 0);
  a = wheelTurn(a, { grade: 'tried' });
  assert.deepEqual(totals(a), [2, 1, 1]);
  assert.equal(a.round, 2);
  assert.ok(a.teams.every((t) => t.turns === 1));

  let st = game('b2', { teams: 2 });
  assert.equal(st.profile.mode, 'studio');
  st = act(st, 'SPIN', 'NEXT');
  assert.deepEqual(st.current.target, { kind: 'seconds', n: 60 });
  assert.equal(reduce(st, { type: 'SENTENCE', delta: 1 }), st, 'seconds, not sentences');
  st = act(st, 'NEXT', { type: 'FOLLOWUP', ok: true });
  assert.equal(reduce(st, { type: 'AWARD', grade: 'superb' }), st);
  st = reduce(st, { type: 'AWARD', grade: 'great' });
  assert.deepEqual(totals(st), [3, 1]);
  assert.deepEqual(GRADE_POINTS, { great: 3, good: 2, tried: 1 });
});

test('Arena combo: x1.5 at 3 clean turns in a row, x2 at 5, rounded up; Stüdyo has none', () => {
  let s = game('b2g', { teams: 2 });
  const t1 = [];
  for (let k = 0; k < 6; k++) {
    s = wheelTurn(s, { grade: 'great' });
    t1.push(s.teams[0].score);
    s = wheelTurn(s, { grade: 'tried' });
  }
  assert.deepEqual(t1, [3, 6, 11, 16, 22, 28]);
  assert.equal(s.teams[0].bestClean, 6);
  s = wheelTurn(s, { grade: 'good' });
  assert.equal(s.teams[0].score, 30);
  assert.equal(s.teams[0].clean, 0, 'a Good turn breaks the streak');
  s = wheelTurn(wheelTurn(s, { grade: 'tried' }), { grade: 'great', english: false });
  assert.equal(s.teams[0].score, 30);
  assert.deepEqual([comboMultiplier(2), comboMultiplier(3), comboMultiplier(4), comboMultiplier(5), comboMultiplier(9)], [1, 1.5, 1.5, 2, 2]);

  let st = game('b2', { teams: 2 });
  for (let k = 0; k < 5; k++) st = wheelTurn(wheelTurn(st, { grade: 'great' }), { grade: 'tried' });
  assert.equal(st.teams[0].score, 15);
  assert.equal(st.teams[0].bestClean, 5);
});

test('hint ladder: Arena pays 1 a rung from that turn only, never below 0; Park and Stüdyo free', () => {
  let a = game('b1g', { teams: 2 });
  const ladder = hintLadder(a, a.wheel[0]).map((r) => r.kind);
  assert.deepEqual(ladder, ['useful', 'starter', 'model']);
  a = wheelTurn(a, { grade: 'great' }, { hints: 2 });
  assert.equal(a.teams[0].score, 1);
  a = wheelTurn(a, { grade: 'tried' }, { hints: 3 });
  assert.equal(a.teams[1].score, 0, 'floor 0 for the turn');
  a = wheelTurn(a, { grade: 'good' });
  assert.equal(a.teams[0].score, 3, 'the cost does not carry over');
  let more = act(game('b1g'), 'SPIN', 'NEXT', 'HINT', 'HINT', 'HINT');
  assert.equal(more.current.hints, 3);
  assert.equal(reduce(more, { type: 'HINT' }), more);

  const p = game('a1g', { teams: 2 });
  assert.deepEqual(hintLadder(p, p.wheel[0]).map((r) => r.kind), ['picture', 'starter', 'model']);
  assert.equal(wheelTurn(p, { stars: 3 }, { hints: 3 }).teams[0].stars, 3);
  const st = game('b2', { teams: 2 });
  assert.deepEqual(hintLadder(st, st.wheel[0]).map((r) => r.kind), ['useful', 'starter', 'tr']);
  assert.equal(wheelTurn(st, { grade: 'great' }, { hints: 3 }).teams[0].score, 3);
  assert.equal(presentPrompt(st, st.wheel[0]).hints[2].text, 'Pandalar');
});

test('Just a Minute, Oyun Parkı: the Talk Rocket never fails and has no challenges', () => {
  let s = game('a1g', { teams: 2, mode: 'jam' });
  assert.equal(s.mode, 'jam');
  assert.equal(s.current.kind, 'jam');
  assert.equal(s.current.stage, 'turn');
  assert.equal(reduce(s, { type: 'SPIN' }), s, 'no wheel in Just a Minute');
  s = act(s, 'NEXT');
  assert.equal(s.current.stage, 'card');
  assert.ok(s.pool.jam.includes(s.current.itemId));
  s = act(s, 'NEXT');
  assert.equal(canChallenge(s, 't2'), false);
  assert.equal(reduce(s, { type: 'CHALLENGE', teamId: 't2' }), s);
  s = act(s, { type: 'SENTENCE', delta: 1 }, { type: 'SENTENCE', delta: 1 });
  assert.equal(s.current.stage, 'talk');
  s = reduce(s, { type: 'SENTENCE', delta: 1 });
  assert.equal(s.current.stage, 'whistle', 'the rocket lands at the sentence target');
  assert.equal(s.current.landed, true);
  assert.deepEqual(totals(s), [0, 0]);
  s = act(s, 'NEXT', { type: 'AWARD', stars: 3 });
  assert.deepEqual(totals(s), [3, 0]);
  assert.equal(s.current.teamId, 't2');

  // B1 kids: a seconds rocket; time up lands it too.
  let b = game('b1g', { teams: 2, mode: 'jam', overrides: { mode: 'park' } });
  b = act(b, 'NEXT', 'NEXT', 'NEXT');
  assert.equal(b.current.stage, 'whistle');
  assert.equal(b.current.landed, true);
  assert.deepEqual(reasonsFor(b), []);
});

test('Just a Minute, Arena: gentle challenges, reasons by level, two wrong calls lock a key', () => {
  let s = game('b1g', { teams: 3, mode: 'jam' });
  assert.deepEqual(reasonsFor(s), ['H', 'D']);
  s = act(s, 'NEXT', 'NEXT');
  assert.equal(s.current.stage, 'talk');
  assert.equal(reduce(s, { type: 'CHALLENGE', teamId: 't1' }), s, 'the speaker cannot challenge');
  s = reduce(s, { type: 'CHALLENGE', teamId: 't2' });
  assert.deepEqual(s.current.pending, { teamId: 't2' });
  assert.equal(reduce(s, { type: 'NEXT' }), s, 'the timer is frozen');
  assert.equal(reduce(s, { type: 'CHALLENGE', teamId: 't3' }), s);
  assert.equal(reduce(s, { type: 'RULE', reason: 'R', valid: true }), s, 'repetition only at B2');
  assert.equal(reduce(s, { type: 'RULE', reason: 'H' }), s, 'needs a ruling');
  s = reduce(s, { type: 'RULE', reason: 'h', valid: true });
  assert.deepEqual(totals(s), [0, 1, 0], 'Sharp ears +1');
  assert.equal(s.teams[1].sharpEars, 1);
  assert.equal(s.current.speakerTeam, 't1', 'the speaker keeps the floor');
  assert.equal(s.current.pending, null);
  s = act(s, { type: 'CHALLENGE', teamId: 't3' }, { type: 'RULE', reason: 'D', valid: false });
  assert.deepEqual(totals(s), [0, 1, 0], 'a wrong call costs nothing in Arena');
  assert.equal(s.teams[2].challengesWrong, 1);
  s = act(s, { type: 'CHALLENGE', teamId: 't3' }, { type: 'RULE', valid: false });
  assert.equal(s.teams[2].challengesWrong, MAX_WRONG_CHALLENGES);
  assert.equal(challengeLocked(s, 't3'), true);
  assert.equal(reduce(s, { type: 'CHALLENGE', teamId: 't3' }), s);
  s = act(s, 'NEXT');
  assert.equal(s.current.stage, 'whistle');
  assert.deepEqual(s.current.results, []);
  s = act(s, 'NEXT', { type: 'AWARD', grade: 'great' });
  assert.deepEqual(totals(s), [3, 1, 0], 'the speaker keeps every point');
  assert.equal(s.current.teamId, 't2');
  s = jamTurn(s);
  assert.equal(challengeLocked(s, 't3'), true, 'locked until the round ends');
  s = jamTurn(s);
  assert.equal(s.round, 2);
  assert.equal(challengeLocked(s, 't3'), false);

  const a2 = act(game('a2g', { mode: 'jam', overrides: { mode: 'arena' } }), 'NEXT', 'NEXT');
  assert.deepEqual(reasonsFor(a2), ['H']);
  assert.deepEqual(a2.current.target, { kind: 'sentences', n: 4 });
  const a1 = act(game('a1g', { mode: 'jam', overrides: { mode: 'arena' } }), 'NEXT', 'NEXT');
  assert.deepEqual(reasonsFor(a1), []);
  assert.equal(reduce(a1, { type: 'CHALLENGE', teamId: 't2' }), a1, 'no challenges at A1');
  assert.deepEqual(reasonsFor(game('b2g')), ['H', 'D', 'R']);
});

test('Just a Minute, Stüdyo: takeover, wrong-call penalty, whistle +2 and the clean minute', () => {
  let s = game('b2', { teams: 3, mode: 'jam' });
  s = act(s, 'NEXT', 'NEXT');
  s = act(s, { type: 'CHALLENGE', teamId: 't2' }, { type: 'RULE', reason: 'R', valid: true });
  assert.deepEqual(totals(s), [0, 1, 0]);
  assert.equal(s.current.speakerTeam, 't2', 'the challenger takes over the same topic');
  assert.ok(s.current.speakerSeat >= 1 && s.current.speakerSeat <= 5);
  assert.equal(s.current.challenges[0].takeover, true);
  assert.equal(s.bags.t2.left.length, 4, 'the new speaker comes out of the seat bag');
  assert.equal(reduce(s, { type: 'CHALLENGE', teamId: 't2' }), s);
  s = act(s, { type: 'CHALLENGE', teamId: 't1' }, { type: 'RULE', reason: 'H', valid: false });
  assert.deepEqual(totals(s), [0, 2, 0], 'speaker +1, challenger -1 with floor 0');
  s = act(s, { type: 'CHALLENGE', teamId: 't3' }, { type: 'RULE', valid: false });
  assert.deepEqual(totals(s), [0, 3, 0]);
  s = act(s, 'NEXT');
  assert.equal(s.current.stage, 'whistle');
  assert.deepEqual(totals(s), [0, 5, 0], 'whoever speaks at the whistle +2');
  assert.equal(s.current.cleanMinute, undefined);
  assert.equal(reduce(s, { type: 'AWARD', grade: 'great' }), s, 'Stüdyo scores itself at the whistle');
  s = act(s, 'NEXT');
  assert.equal(s.current.teamId, 't2');
  assert.equal(s.current.stage, 'turn');
  assert.equal(s.teams[0].turns, 1, 'the turn belongs to the original team');

  s = act(s, 'NEXT', 'NEXT', 'NEXT');
  assert.equal(s.current.cleanMinute, true);
  assert.deepEqual(totals(s), [0, 10, 0], 'no valid challenge: +2 and +3');
  assert.deepEqual(s.current.results.map((r) => r.why), ['whistle', 'clean']);
  assert.equal(s.teams[1].cleanMinutes, 1);
  // A wrong challenge never takes a team below 0, and a wrong call does
  // not spoil the clean minute.
  s = act(s, 'NEXT', 'NEXT', 'NEXT', { type: 'CHALLENGE', teamId: 't1' }, { type: 'RULE', valid: false }, 'NEXT');
  assert.deepEqual(totals(s), [0, 10, 6]);

  // A2 adults: a sentence minute; the target ends it and scores it.
  let a2 = act(game('a2', { teams: 2, mode: 'jam' }), 'NEXT', 'NEXT');
  for (let k = 0; k < 4; k++) a2 = reduce(a2, { type: 'SENTENCE', delta: 1 });
  assert.equal(a2.current.stage, 'whistle');
  assert.deepEqual(totals(a2), [5, 0]);
});

test('follow-up: the next team in order asks; +1 in Arena and Stüdyo, nothing in Park', () => {
  let s = game('b1g', { teams: 3 });
  const atFollow = (x) => act(x, 'SPIN', 'NEXT', 'NEXT');
  let f = atFollow(s);
  assert.equal(f.current.followUp.askerId, 't2');
  assert.equal(followUpTeam(f), 't2');
  assert.equal(reduce(f, { type: 'FOLLOWUP' }), f, 'Arena needs a ruling');
  s = reduce(reduce(f, { type: 'FOLLOWUP', ok: true }), { type: 'AWARD', grade: 'tried' });
  assert.deepEqual(totals(s), [1, 1, 0]);
  assert.equal(s.teams[1].followUps, 1);
  f = atFollow(s);
  assert.equal(f.current.followUp.askerId, 't3');
  s = reduce(reduce(f, { type: 'FOLLOWUP', ok: false }), { type: 'AWARD', grade: 'tried' });
  assert.deepEqual(totals(s), [1, 2, 0]);
  f = atFollow(s);
  assert.equal(f.current.followUp.askerId, 't1', 'wraps round the order');
  s = reduce(reduce(f, { type: 'FOLLOWUP', ok: true }), { type: 'AWARD', grade: 'tried' });
  assert.deepEqual(totals(s), [2, 2, 1]);
  assert.equal(s.stats.followUps, 2);

  const st = wheelTurn(game('b1', { teams: 2 }), { grade: 'tried' }, { followUp: true });
  assert.deepEqual(totals(st), [1, 1]);
  const pk = wheelTurn(game('a2g', { teams: 2 }), { stars: 1 }, { followUp: true });
  assert.deepEqual(totals(pk), [1, 0]);
  assert.equal(pk.teams[1].followUps, 0);
});

test('Would You Rather: vote counts, stages, optional best reason, frames by level', () => {
  let s = game('b1g', { mode: 'wyr', options: { bestReason: true, wyrVote: 'walls' } });
  assert.equal(s.current.kind, 'wyr');
  assert.equal(s.current.stage, 'wyr');
  const first = s.current.itemId;
  const card = presentPrompt(s, first);
  assert.deepEqual(card.optA, { text: 'fly 0', emoji: '\u{1F985}' });
  assert.equal(card.vote.a, 'Go to the left wall for A');
  assert.deepEqual(card.frames.map((f) => f.key), ['reason', 'back']);
  assert.equal(reduce(s, { type: 'VOTE', side: 'a', delta: 1 }), s, 'votes after the card');
  s = act(s, 'NEXT', { type: 'VOTE', side: 'a', delta: 5 }, { type: 'VOTE', side: 'B', delta: 3 }, { type: 'VOTE', side: 'b', delta: -9 });
  assert.deepEqual(s.current.votes, { a: 5, b: 0 });
  assert.equal(reduce(s, { type: 'VOTE', side: 'c', delta: 1 }), s);
  assert.equal(reduce(s, { type: 'VOTE', side: 'b', delta: -1 }), s, 'never below 0');
  s = act(s, 'NEXT');
  assert.equal(s.current.stage, 'reasons');
  s = act(s, { type: 'BEST_REASON', teamId: 't2' }, { type: 'BEST_REASON', teamId: 't2' });
  assert.equal(s.current.best, null, 'a toggle');
  s = act(s, { type: 'BEST_REASON', teamId: 't3' });
  assert.deepEqual(totals(s), [0, 0, 0], 'given on the next card');
  s = act(s, 'NEXT');
  assert.deepEqual(totals(s), [0, 0, 1]);
  assert.equal(s.teams[2].bestReasons, 1);
  assert.equal(s.current.stage, 'wyr');
  assert.notEqual(s.current.itemId, first);
  assert.ok(s.used.includes(first));
  assert.equal(s.stats.wyr, 1);
  assert.equal(s.turnCount, 0, 'Would You Rather does not use team turns');

  const off = act(game('b1g', { mode: 'wyr' }), 'NEXT', 'NEXT');
  assert.equal(reduce(off, { type: 'BEST_REASON', teamId: 't1' }), off, 'unscored by default');
  const kids = act(game('a1g', { mode: 'wyr', options: { bestReason: true } }), 'NEXT', 'NEXT', { type: 'BEST_REASON', teamId: 't1' }, 'NEXT');
  assert.equal(kids.teams[0].stars, 1);
  assert.deepEqual(presentPrompt(kids, kids.current.itemId).frames.map((f) => f.key), ['reason']);
  const b2 = game('b2', { mode: 'wyr' });
  assert.deepEqual(presentPrompt(b2, b2.current.itemId).frames.map((f) => f.key), ['reason', 'back', 'concession']);
  assert.equal(presentPrompt(b2, b2.current.itemId).vote.a, 'Stand up for A');
});

test('Herkes konuşur: speakers rotate 1..groupSize, then questions, then a new topic; no scores', () => {
  let s = game('b1g', { mode: 'everyone', options: { groupSize: 3 } });
  assert.equal(s.current.kind, 'everyone');
  assert.equal(s.current.stage, 'topic');
  assert.deepEqual(s.current.target, { kind: 'seconds', n: 40 });
  const first = s.current.itemId;
  const speakers = [];
  s = reduce(s, { type: 'NEXT' });
  while (s.current.stage === 'speaking') { speakers.push(s.current.speaker); s = reduce(s, { type: 'NEXT_SPEAKER' }); }
  assert.deepEqual(speakers, [1, 2, 3]);
  assert.equal(s.current.stage, 'questions');
  assert.equal(reduce(s, { type: 'NEXT_SPEAKER' }), s);
  s = reduce(s, { type: 'NEW_TOPIC' });
  assert.equal(s.current.stage, 'topic');
  assert.notEqual(s.current.itemId, first);
  assert.equal(s.stats.topics, 1);
  assert.ok(s.teams.every((t) => t.score === 0 && t.stars === 0));
  assert.equal(reduce(s, { type: 'AWARD', grade: 'great' }), s);

  let four = game('a1g', { mode: 'everyone' });
  assert.deepEqual(four.current.target, { kind: 'sentences', n: 3 });
  four = act(four, 'NEXT_SPEAKER', 'NEXT_SPEAKER', 'NEXT_SPEAKER', 'NEXT_SPEAKER');
  assert.equal(four.current.speaker, 4);
  four = act(four, 'NEXT_SPEAKER');
  assert.equal(four.current.stage, 'questions');
});

test('SET_MODE: any time, same teams and scores; the speaker keeps the turn', () => {
  let s = game('b1g', { teams: 3 });
  s = wheelTurn(s, { grade: 'great' }, { followUp: true });
  const scores = totals(s);
  s = act(s, 'SPIN');
  const { teamId, seat, itemId } = s.current;
  const j = reduce(s, { type: 'SET_MODE', mode: 'jam' });
  assert.equal(j.mode, 'jam');
  assert.deepEqual(totals(j), scores);
  assert.equal(j.current.kind, 'jam');
  assert.equal(j.current.stage, 'turn');
  assert.deepEqual([j.current.teamId, j.current.seat], [teamId, seat]);
  assert.equal(j.turnCount, s.turnCount);
  assert.ok(!j.used.includes(itemId), 'an unfinished prompt stays on the wheel');
  const w = reduce(reduce(j, { type: 'SET_MODE', mode: 'wyr' }), { type: 'SET_MODE', mode: 'wheel' });
  assert.deepEqual([w.current.teamId, w.current.seat, w.current.stage], [teamId, seat, 'turn']);
  assert.deepEqual(w.teams, s.teams);
  const e = reduce(w, { type: 'SET_MODE', mode: 'everyone' });
  assert.equal(e.current.kind, 'everyone');
  assert.equal(e.lastEvent.type, 'mode');
  assert.equal(reduce(e, { type: 'SET_MODE', mode: 'everyone' }), e);
  assert.equal(reduce(e, { type: 'SET_MODE', mode: 'karaoke' }), e);

  const noWyr = game('b1', { topicOpts: { wyrs: 0 } });
  assert.equal(modeAvailable(noWyr, 'wyr'), false);
  assert.equal(reduce(noWyr, { type: 'SET_MODE', mode: 'wyr' }), noWyr);
  assert.equal(game('b1', { mode: 'wyr', topicOpts: { wyrs: 0 } }).mode, 'wheel', 'falls back to the wheel');
});

test('SKIP swaps the prompt: the wheel re-spins on its own seed, Just a Minute draws another', () => {
  let s = act(game('b1g'), 'SPIN');
  const skipped = s.current.itemId;
  s = reduce(s, { type: 'SKIP' });
  assert.equal(s.current.stage, 'turn');
  assert.equal(s.current.skips, 1);
  assert.equal(s.turnCount, 0);
  assert.ok(!s.wheel.includes(skipped));
  assert.equal(spinIndex(s), Math.floor(rngFor('TALK-7:spin:0:1')() * s.wheel.length));
  assert.equal(reduce(s, { type: 'SKIP' }), s, 'nothing to skip before a spin');

  let j = act(game('b1g', { mode: 'jam' }), 'NEXT');
  const old = j.current.itemId;
  j = reduce(j, { type: 'SKIP' });
  assert.equal(j.current.stage, 'card');
  assert.notEqual(j.current.itemId, old);
  j = act(j, 'NEXT', { type: 'CHALLENGE', teamId: 't2' }, { type: 'RULE', reason: 'H', valid: false });
  assert.equal(reduce(j, { type: 'SKIP' }), j, 'not once the minute has really started');
});

test('SKIP with used prompts kept on the wheel never re-spins onto a prompt skipped this turn', () => {
  let s = game('b1', { options: { removeUsed: false }, code: 'Z-3' });
  const wheel = s.wheel;
  const landed = [];
  for (let k = 0; k < 7; k++) {
    s = reduce(s, { type: 'SPIN' });
    landed.push(s.current.itemId);
    s = reduce(s, { type: 'SKIP' });
  }
  assert.equal(new Set(landed).size, 7, 'seven skips, seven different prompts');
  assert.deepEqual(s.current.skipped, landed);
  assert.deepEqual(s.wheel, wheel, 'the wheel keeps every segment');
  s = reduce(s, { type: 'SPIN' });
  assert.ok(!landed.includes(s.current.itemId), 'the eighth spin lands on the one prompt left');
  // A new turn forgets the skips.
  s = act(s, 'NEXT', 'NEXT', 'NEXT', { type: 'AWARD', grade: 'good' });
  assert.equal(s.current.skipped, undefined);
  assert.equal(spinIndex(s), Math.floor(rngFor('Z-3:spin:1')() * s.wheel.length));
});

test('Stüdyo Just a Minute: the whistle closes the turn for a mode switch and Bitir', () => {
  const start = act(game('b1', { teams: 2, mode: 'jam', code: 'R-1' }), 'NEXT', 'NEXT', 'NEXT');
  assert.equal(start.current.stage, 'whistle');
  assert.deepEqual(totals(start), [5, 0]);
  const itemId = start.current.itemId;
  let s = act(start, { type: 'SET_MODE', mode: 'wyr' }, { type: 'SET_MODE', mode: 'jam' });
  assert.equal(s.current.teamId, 't2', 'the next team speaks');
  assert.equal(s.turnCount, 1);
  assert.deepEqual(s.teams.map((t) => t.turns), [1, 0]);
  assert.ok(s.used.includes(itemId));
  s = act(s, 'NEXT');
  assert.notEqual(s.current.itemId, itemId, 'the same prompt is not drawn again');
  s = act(s, 'NEXT', 'NEXT');
  assert.deepEqual(totals(s), [5, 5], 'no second payout for team 1');
  assert.equal(reduce(start, { type: 'SET_MODE', mode: 'wheel' }).current.teamId, 't2', 'no second turn in a row');
  const end = reduce(start, { type: 'FINISH' });
  assert.deepEqual(totals(end), [5, 0]);
  assert.deepEqual(end.teams.map((t) => t.turns), [1, 0]);
  assert.equal(end.stats.turns, 1);
  assert.equal(highlights(end).find((h) => h.key === 'turns').value, 1);
  // A turn still in its talk stays open: the team keeps it.
  const talk = act(game('b1', { teams: 2, mode: 'jam', code: 'R-1' }), 'NEXT', 'NEXT');
  const back = act(talk, { type: 'SET_MODE', mode: 'wyr' }, { type: 'SET_MODE', mode: 'jam' });
  assert.deepEqual([back.current.teamId, back.turnCount, back.used.length], ['t1', 0, 0]);
});

test('a judged follow-up or a ruled challenge closes the turn on a mode switch, so it is never paid twice', () => {
  let s = act(game('b1g', { teams: 2, code: 'R-1' }), 'SPIN', 'NEXT', 'NEXT', { type: 'FOLLOWUP', ok: true });
  const first = s.current.itemId;
  assert.deepEqual(totals(s), [0, 1]);
  s = act(s, { type: 'SET_MODE', mode: 'wyr' }, { type: 'SET_MODE', mode: 'wheel' });
  assert.equal(s.current.teamId, 't2');
  assert.equal(s.turnCount, 1);
  assert.ok(s.used.includes(first) && !s.wheel.includes(first));
  s = act(s, 'SPIN');
  assert.notEqual(s.current.itemId, first);
  s = act(s, 'NEXT', 'NEXT', { type: 'FOLLOWUP', ok: true });
  assert.deepEqual(totals(s), [1, 1], 'the next asker is team 1');
  assert.equal(s.teams[1].followUps, 1);

  // Arena Sharp ears: the challenged prompt is used and not drawn again.
  let j = act(game('b1g', { teams: 2, mode: 'jam', code: 'R-1' }), 'NEXT', 'NEXT', { type: 'CHALLENGE', teamId: 't2' }, { type: 'RULE', reason: 'H', valid: true });
  const jamItem = j.current.itemId;
  assert.deepEqual(totals(j), [0, 1]);
  j = act(j, { type: 'SET_MODE', mode: 'wheel' }, { type: 'SET_MODE', mode: 'jam' }, 'NEXT');
  assert.deepEqual([j.current.teamId, j.turnCount], ['t2', 1]);
  assert.notEqual(j.current.itemId, jamItem);
  assert.deepEqual(totals(j), [0, 1]);
});

test('a chosen best reason is paid on Bitir, a mode switch and Skip', () => {
  const at = act(game('b1', { mode: 'wyr', teams: 2, options: { bestReason: true } }), 'NEXT', 'NEXT', { type: 'BEST_REASON', teamId: 't2' });
  const card = at.current.itemId;
  for (const a of [{ type: 'FINISH' }, { type: 'SET_MODE', mode: 'wheel' }, { type: 'SKIP' }]) {
    const s = reduce(at, a);
    assert.deepEqual(totals(s), [0, 1], a.type);
    assert.equal(s.teams[1].bestReasons, 1, a.type);
    assert.equal(s.stats.wyr, 1, a.type);
    assert.ok(s.used.includes(card), a.type);
  }
  assert.notEqual(reduce(at, { type: 'SKIP' }).current.itemId, card);
  assert.equal(reduce(reduce(at, { type: 'SET_MODE', mode: 'wheel' }), { type: 'SET_MODE', mode: 'wyr' }).stats.wyr, 1);
  // Before the reasons the card is not counted.
  const voting = act(game('b1', { mode: 'wyr', teams: 2, options: { bestReason: true } }), 'NEXT');
  assert.equal(reduce(voting, { type: 'FINISH' }).stats.wyr, 0);
});

test('the wheel takes back prompts a Just a Minute recycle frees', () => {
  let s = game('b1', { teams: 2, mode: 'jam' });
  assert.deepEqual([s.pool.talk.length, s.pool.jam.length, s.wheel.length], [10, 8, 8]);
  for (let k = 0; k < 9; k++) s = jamTurn(s);
  assert.ok(s.recycles >= 1);
  const unused = (x) => x.pool.talk.filter((id) => !x.used.includes(id));
  s = reduce(s, { type: 'SET_MODE', mode: 'wheel' });
  assert.equal(s.wheel.length, 8);
  for (let k = 0; k < 6; k++) {
    assert.equal(s.wheel.length, Math.min(8, unused(s).length), `turn ${k}`);
    assert.ok(s.wheel.every((id) => !s.used.includes(id)));
    s = wheelTurn(s, { grade: 'good' });
  }
});

test('Oyun Parkı never loses stars', () => {
  let s = game('a2g', { teams: 2, options: { bestReason: true } });
  const steps = [
    (x) => wheelTurn(x, { stars: 3 }, { followUp: true, hints: 2 }),
    (x) => wheelTurn(x, { stars: 3, english: false }),
    (x) => reduce(x, { type: 'ADJUST', teamId: 't1', delta: -2 }),
    (x) => reduce(x, { type: 'SET_MODE', mode: 'jam' }),
    (x) => jamTurn(x, { stars: 2 }),
    (x) => reduce(x, { type: 'CHALLENGE', teamId: 't1' }),
    (x) => act(x, { type: 'SET_MODE', mode: 'wyr' }, 'NEXT', 'NEXT', { type: 'BEST_REASON', teamId: 't2' }, 'NEXT'),
    (x) => reduce(x, { type: 'ADJUST', teamId: 't2', delta: 2 }),
  ];
  let before = totals(s);
  for (const step of steps) {
    s = step(s);
    const now = totals(s);
    now.forEach((v, k) => assert.ok(v >= before[k], `stars went down: ${before} -> ${now}`));
    before = now;
  }
  // t1: three stars, then a two-star rocket; t2: one English-less star,
  // the best reason and +2 by hand.
  assert.deepEqual(totals(s), [5, 4]);
});

test('ADJUST, SET_TURN, FINISH from anywhere', () => {
  let s = game('b1g');
  s = reduce(s, { type: 'ADJUST', teamId: 't2', delta: 4 });
  assert.equal(s.teams[1].score, 4);
  s = reduce(s, { type: 'ADJUST', teamId: 't2', delta: -10 });
  assert.equal(s.teams[1].score, 0);
  assert.equal(reduce(s, { type: 'ADJUST', teamId: 't2', delta: -1 }), s);
  assert.equal(reduce(s, { type: 'ADJUST', teamId: 'tx', delta: 1 }), s);

  const places = [
    act(game('b1g', { mode: 'jam' }), 'NEXT', 'NEXT', { type: 'CHALLENGE', teamId: 't2' }),
    act(game('b1g', { mode: 'wyr' }), 'NEXT'),
    act(game('b1g', { mode: 'everyone' }), 'NEXT'),
    act(game('b1g'), 'SPIN', 'NEXT', 'NEXT'),
  ];
  for (const p of places) {
    const end = reduce(p, { type: 'FINISH' });
    assert.equal(end.phase, 'end');
    assert.equal(end.current, null);
    assert.equal(reduce(end, { type: 'FINISH' }), end);
    assert.equal(reduce(end, { type: 'SET_MODE', mode: 'wheel' }), end);
    assert.equal(reduce(end, { type: 'SPIN' }), end);
  }
});

test('ranking, ending titles per look and speaking highlights', () => {
  const tie = setTeams(game('b1g', { teams: 3 }), { t1: { score: 5 }, t2: { score: 9 }, t3: { score: 5 } });
  assert.deepEqual(ranking(tie).map((t) => [t.id, t.place]), [['t2', 0], ['t1', 1], ['t3', 1]]);

  const park = setTeams(game('a1g', { teams: 3 }), { t1: { stars: 2 }, t2: { stars: 7 }, t3: { stars: 4 } });
  const pt = endingTitles(park);
  assert.equal(pt.length, 3, 'a title for every team');
  assert.equal(pt[0].teamId, 't2');
  assert.equal(new Set(pt.map((a) => a.title)).size, 3);

  const arena = setTeams(game('b1g', { teams: 5 }), {
    t1: { score: 20 }, t2: { score: 9, bestClean: 4 }, t3: { score: 8, sharpEars: 2 }, t4: { score: 3, followUps: 3 }, t5: { score: 1 },
  });
  const at = Object.fromEntries(endingTitles(arena).map((a) => [a.teamId, a.title]));
  assert.deepEqual(at, { t1: 'Top score', t2: 'Clean streak', t3: 'Sharp ears', t4: 'Best questions', t5: 'Team spirit' });

  const studio = setTeams(game('b2', { teams: 3 }), { t1: { score: 12, great: 1 }, t2: { score: 10, great: 2, cleanMinutes: 1 } });
  assert.deepEqual(endingTitles(studio), [{ teamId: 't1', title: 'Top score' }, { teamId: 't2', title: 'Best speaker' }]);
  assert.deepEqual(endingTitles(game('b2')), [{ teamId: 't1', title: 'Top score' }]);

  let played = wheelTurn(game('b1g', { teams: 2 }), { grade: 'great' }, { followUp: true });
  played = wheelTurn(played, { grade: 'good' });
  const h = highlights(played);
  assert.deepEqual(h.map((x) => [x.key, x.value]), [['turns', 2], ['clean', 1], ['followUps', 1]]);
  const hs = highlights(act(game('b2', { teams: 2, mode: 'jam' }), 'NEXT', 'NEXT', 'NEXT'));
  assert.deepEqual(hs.map((x) => x.key), ['turns', 'clean', 'followUps', 'cleanMinutes']);
});

// A long scripted lesson through every mode and look.
function script(groupId) {
  const s = game(groupId, { teams: 3, options: { bestReason: true } });
  const park = s.profile.mode === 'park';
  const award = park ? { type: 'AWARD', stars: 2 } : { type: 'AWARD', grade: 'great' };
  return [
    s,
    [
      'SPIN', 'NEXT', 'HINT', { type: 'SENTENCE', delta: 1 }, 'NEXT', 'DIG', { type: 'FOLLOWUP', ok: true }, award,
      'SPIN', 'SKIP', 'SPIN', 'NEXT', 'NEXT', 'NEXT', award,
      { type: 'SET_TURN', index: 0 },
      { type: 'SET_MODE', mode: 'jam' }, 'NEXT', 'NEXT', { type: 'CHALLENGE', teamId: 't2' }, { type: 'RULE', reason: 'H', valid: true },
      { type: 'CHALLENGE', teamId: 't3' }, { type: 'RULE', valid: false }, 'NEXT', 'NEXT', award,
      { type: 'SET_MODE', mode: 'wyr' }, 'NEXT', { type: 'VOTE', side: 'a', delta: 4 }, 'NEXT', { type: 'BEST_REASON', teamId: 't1' }, 'NEXT',
      { type: 'SET_MODE', mode: 'everyone' }, 'NEXT', 'NEXT_SPEAKER', 'NEXT_SPEAKER', 'NEXT_SPEAKER', 'NEXT_SPEAKER', 'NEW_TOPIC',
      { type: 'ADJUST', teamId: 't3', delta: 2 }, { type: 'SET_MODE', mode: 'wheel' }, 'SPIN', 'FINISH',
    ].map((a) => (typeof a === 'string' ? { type: a } : a)),
  ];
}

test('never mutates its input, and the same input + action gives the same output', () => {
  for (const g of ['a1g', 'b1g', 'b2', 'a2']) {
    const [start, actions] = script(g);
    const snapshot = JSON.stringify(start);
    let s = deepFreeze(start);
    let t = script(g)[0];
    for (const a of actions) {
      const before = JSON.stringify(s);
      const next = reduce(s, a);
      assert.equal(JSON.stringify(s), before, `${g} ${a.type} changed its input`);
      t = reduce(t, a);
      assert.deepEqual(next, t, `${g} ${a.type} is not deterministic`);
      s = deepFreeze(next);
    }
    assert.equal(JSON.stringify(start), snapshot);
    assert.equal(s.phase, 'end');
  }
});

test('invalid actions return the same state object', () => {
  const s = game('b1g');
  for (const a of [
    { type: 'NOPE' }, { type: 'NEXT' }, { type: 'AWARD', grade: 'great' }, { type: 'RULE', reason: 'H', valid: true }, { type: 'VOTE', side: 'a', delta: 1 },
    { type: 'BEST_REASON', teamId: 't1' }, { type: 'NEXT_SPEAKER' }, { type: 'NEW_TOPIC' }, { type: 'SENTENCE', delta: 1 }, { type: 'HINT' },
    { type: 'DIG' }, { type: 'FOLLOWUP', ok: true }, { type: 'CHALLENGE', teamId: 't2' }, { type: 'SKIP' }, { type: 'STAGE', stage: 'talk' },
    { type: 'SET_MODE', mode: 'wheel' }, { type: 'ADJUST', teamId: 't1', delta: 0 },
  ]) assert.equal(reduce(s, a), s, a.type);
  assert.equal(reduce(s, null), s);

  // STAGE jumps forward inside one turn only.
  const card = reduce(s, { type: 'SPIN' });
  const award = reduce(card, { type: 'STAGE', stage: 'award' });
  assert.equal(award.current.stage, 'award');
  assert.equal(award.current.itemId, card.current.itemId);
  assert.equal(reduce(award, { type: 'STAGE', stage: 'talk' }), award, 'never backwards');
  const st = act(game('b2', { mode: 'jam' }), 'NEXT', 'NEXT');
  assert.equal(reduce(st, { type: 'STAGE', stage: 'whistle' }).current.stage, 'whistle');
  assert.equal(reduce(st, { type: 'STAGE', stage: 'card' }), st, 'not across a turn');
});
