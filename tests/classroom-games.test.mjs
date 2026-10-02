import test from 'node:test';
import assert from 'node:assert/strict';

import { shuffleSeeded, makeBoardCode, normalizeBoardCode } from '../src/classroom/core/rng.mjs';
import { audienceProfile, defaultModeFor, tilesForMinutes, GROUPS } from '../src/classroom/core/groups.mjs';
import { drawSeat, defaultTeams } from '../src/classroom/core/teams.mjs';
import { validateItem, itemsForBoard, presentMcq, presentVocab, makePack, mcqHint, itemHint, jamOk } from '../src/classroom/core/pack.mjs';
import { createStore, readSave } from '../src/classroom/core/store.mjs';
import { createGame, reduce, presented, isGold, remainingTiles, endingTitles, deckFor, CARDS, GOLD_CARDS, tileValue, hintKinds, nextHint, ranking } from '../src/classroom/games/kutu-avi/logic.mjs';
import { createClassBoard } from '../src/lib/game-classroom.mjs';

const mcq = (i, stem = `She ___ item ${i}.`) => ({ id: `q${i}`, type: 'mcq', stem, options: [`right${i}`, `wrong${i}a`, `wrong${i}b`, `wrong${i}c`], answer: 0, whyTr: 'neden', level: 'A2' });
const vocab = (word, topic = 'animals') => ({ id: `pic:${topic}:${word}`, type: 'vocab', term: word, pic: `/pictures/${word}.svg`, tr: word, q: 'What is it?', find: `Where's the ${word}?`, say: `It's a ${word}.`, topic });
const packOf = (items) => makePack({ id: 'test', title: 'Test', level: 'A2', items });

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k) };
}

function game(groupId, { size = 12, surprise = 0, teams = 3, items = 30, allowYellow = null, pack = null, overrides = {} } = {}) {
  const profile = audienceProfile(groupId, overrides);
  const p = pack || packOf(Array.from({ length: items }, (_, i) => mcq(i)));
  return createGame({ profile, pack: p, teams: defaultTeams(teams, profile.mode), boardSize: size, surpriseLevel: surprise, code: 'TEST-11', allowYellow });
}

function play(s, right) {
  s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
  s = answerCurrent(s, right);
  return reduce(s, { type: 'NEXT' });
}

function asCard(s, n, cardId) {
  return { ...s, tiles: s.tiles.map((t) => (t.n === n ? { ...t, kind: 'card', cardId, itemId: undefined } : t)) };
}

function answerCurrent(s, right) {
  const pres = presented(s, s.current.itemId, s.current.tries > 1 ? ':retry' : '');
  const choice = right ? pres.answer : (pres.answer + 1) % pres.options.length;
  return reduce(s, { type: 'ANSWER', choice });
}

function firstQuestionTile(s) {
  return s.tiles.find((t) => t.kind === 'question' && !t.opened).n;
}

test('seeded shuffle matches the existing /sinif-oyunu board code algorithm', () => {
  const board = createClassBoard({ topic: { qs: [] }, gridSize: 24, powerRate: 0.2, seed: 'MANGO-42' });
  const legacyPower = board.tiles.filter((t) => t.kind === 'power').map((t) => t.n).sort((a, b) => a - b);
  const ours = shuffleSeeded(Array.from({ length: 24 }, (_, i) => i + 1), 'MANGO-42:power').slice(0, legacyPower.length).sort((a, b) => a - b);
  assert.deepEqual(ours, legacyPower);
  assert.match(makeBoardCode('x'), /^[A-Z]+-\d{2}$/);
  assert.equal(normalizeBoardCode(' mango-42!! '), 'MANGO-42');
});

test('groups map to the right audience mode and caps', () => {
  assert.equal(GROUPS.length, 8);
  assert.equal(defaultModeFor('a1g'), 'park');
  assert.equal(defaultModeFor('a2g'), 'park');
  assert.equal(defaultModeFor('b1g'), 'arena');
  assert.equal(defaultModeFor('b2'), 'studio');
  const kids = audienceProfile('a1g');
  assert.equal(kids.optionCount, 3);
  assert.equal(kids.wordCap, 4);
  assert.equal(kids.autoRead, true);
  assert.equal(kids.scoring, 'stars');
  const adults = audienceProfile('b2');
  assert.equal(adults.optionCount, 4);
  assert.equal(adults.wordCap, 40);
  assert.equal(adults.autoRead, false);
  const override = audienceProfile('a1g', { mode: 'arena' });
  assert.equal(override.mode, 'arena');
  assert.equal(override.wordCap, 4, 'level caps stay with the level, not the skin');
  assert.ok(tilesForMinutes(20, kids) <= tilesForMinutes(20, adults));
});

test('seat bag: everyone speaks once before anyone speaks twice, never twice in a row', () => {
  let bag = null;
  const seen = [];
  let rngI = 0;
  const rng = () => [0.1, 0.7, 0.3, 0.9, 0.5, 0.2, 0.8][rngI++ % 7];
  for (let i = 0; i < 10; i++) {
    const r = drawSeat(bag, 5, rng);
    seen.push(r.seat);
    bag = r.bag;
  }
  assert.deepEqual([...seen.slice(0, 5)].sort(), [1, 2, 3, 4, 5]);
  for (let i = 1; i < seen.length; i++) assert.notEqual(seen[i], seen[i - 1]);
  assert.ok(seen.every((x) => x >= 1 && x <= 5));
});

test('item validation rejects broken MCQs', () => {
  assert.equal(validateItem(mcq(1)).ok, true);
  assert.equal(validateItem({ ...mcq(1), answer: 7 }).ok, false);
  assert.equal(validateItem({ ...mcq(1), options: ['a', 'A ', 'b'] }).ok, false);
  assert.equal(validateItem({ type: 'vocab', term: 'cat' }).ok, true);
  assert.equal(validateItem({ type: 'nope' }).ok, false);
});

test('speak items: prompt, mode, emoji, a 1-2 word label, list limits, two options for Would You Rather', () => {
  const speak = (extra = {}) => ({ id: 's1', type: 'speak', mode: 'talk', prompt: 'Talk about your dream pet.', label: 'Dream pet', emoji: '🐶', starters: ['I want ...'], followUps: ['Why?'], useful: ['fluffy'], model: 'I want a cat.', tr: 'Hayalindeki evcil hayvan', level: 'a1', cat: 'animals', ...extra });
  assert.equal(validateItem(speak()).ok, true);
  assert.deepEqual(validateItem(speak({ prompt: ' ' })).problems, ['empty-prompt']);
  assert.deepEqual(validateItem(speak({ mode: 'debate' })).problems, ['bad-mode']);
  assert.deepEqual(validateItem(speak({ emoji: '' })).problems, ['no-emoji']);
  assert.deepEqual(validateItem(speak({ label: 'My very big pet' })).problems, ['label-words']);
  assert.deepEqual(validateItem(speak({ label: '' })).problems, ['label-words']);
  assert.deepEqual(validateItem(speak({ starters: ['a', 'b', 'c', 'd'] })).problems, ['starters-list']);
  assert.deepEqual(validateItem(speak({ followUps: [''] })).problems, ['followups-list']);
  assert.deepEqual(validateItem(speak({ useful: 'fluffy' })).problems, ['useful-list']);
  assert.equal(validateItem(speak({ starters: undefined, followUps: undefined, useful: undefined })).ok, true, 'lists may be left out');
  const wyr = speak({ mode: 'wyr', prompt: 'Would you rather...?', label: 'Pet pick', optA: { text: 'have a cat', emoji: '🐱' }, optB: { text: 'have a dog', emoji: '🐶' } });
  assert.equal(validateItem(wyr).ok, true);
  assert.deepEqual(validateItem({ ...wyr, optB: { text: ' ', emoji: '🐶' } }).problems, ['wyr-options']);
  assert.deepEqual(validateItem({ ...wyr, optA: undefined }).problems, ['wyr-options']);
  // Just a Minute takes only open modes.
  assert.deepEqual(['talk', 'describe', 'opinion', 'hypothetical', 'ask', 'wyr'].map((mode) => jamOk(speak({ mode }))), [true, true, true, true, false, false]);
  assert.equal(jamOk(mcq(1)), false);
  // Quiz checks are unchanged, and quiz packs carry no kind.
  assert.deepEqual(validateItem(mcq(1)).problems, []);
  assert.equal('kind' in makePack({ id: 'x', title: 'X', level: 'A2' }), false);
  assert.equal('kind' in makePack({ id: 'x', title: 'X', level: 'A2', kind: 'quiz' }), false);
  assert.equal(makePack({ id: 'x', title: 'X', level: 'A2', kind: 'speaking', items: [speak()] }).kind, 'speaking');
});

test('boards prefer items within the word cap and keep a reserve', () => {
  const items = [mcq(1, 'A very long sentence with far too many words for the kids ___.'), ...Array.from({ length: 10 }, (_, i) => mcq(i + 2, `I ___ ${i}.`))];
  const { onBoard, reserve } = itemsForBoard(packOf(items), 8, 'seed', { wordCap: 4 });
  assert.equal(onBoard.length, 8);
  assert.ok(onBoard.every((it) => it.id !== 'q1'), 'the long stem is not on a young board when short ones exist');
  assert.equal(reserve.length, 3);
});

test('3-option presentation always keeps the key and is deterministic', () => {
  for (let i = 0; i < 20; i++) {
    const p = presentMcq(mcq(i), 3, `seed${i}`);
    assert.equal(p.options.length, 3);
    assert.equal(p.options[p.answer].text, `right${i}`);
    assert.deepEqual(presentMcq(mcq(i), 3, `seed${i}`), p);
  }
  const p = presentMcq(mcq(1), 4, 's');
  const fifty = mcqHint(p, 'fifty', 's');
  assert.equal(fifty.removed.length, 2);
  assert.ok(!fifty.removed.includes(p.answer));
  assert.equal(mcqHint(p, 'first-letter', 's').text, 'R…');
});

test('picture words: A1 kids find the picture, others name it; distractors share the topic', () => {
  const pool = ['cat', 'dog', 'lion', 'frog'].map((w) => vocab(w)).concat([vocab('apple', 'fruit')]);
  const find = presentVocab(pool[0], pool, 3, 'find', 's');
  assert.equal(find.direction, 'find');
  assert.equal(find.stem, "Where's the cat?");
  assert.equal(find.optionImgs, true);
  assert.equal(find.options.length, 3);
  assert.equal(find.options[find.answer].text, 'cat');
  assert.ok(find.options.every((o) => o.text !== 'apple'), 'no distractor from another topic');
  const name = presentVocab(pool[1], pool, 4, 'name', 's');
  assert.equal(name.img, '/pictures/dog.svg');
  assert.equal(name.stem, 'What is it?');
  assert.equal(name.say, "It's a dog.");
  assert.equal(new Set(name.options.map((o) => o.text)).size, 4);
});

test('a new board has the right number of surprise tiles and questions', () => {
  const s = game('b1g', { size: 20, surprise: 2 });
  assert.equal(s.tiles.length, 20);
  assert.equal(s.tiles.filter((t) => t.kind === 'card').length, 4);
  assert.equal(s.tiles.filter((t) => t.kind === 'question').length, 16);
  const kids = game('a1g', { size: 12, surprise: 3 });
  assert.ok(kids.tiles.filter((t) => t.kind === 'card').length <= Math.round(12 * 0.2), 'kids never get Kaos');
  for (const id of deckFor(kids.profile)) assert.equal(CARDS[id].harshness, 'green');
});

test('Oyun Parkı: a first miss gives a second try on a fresh item, and stars never go down', () => {
  let s = game('a1g', { teams: 2 });
  s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
  const first = s.current.itemId;
  s = answerCurrent(s, false);
  assert.equal(s.current.stage, 'retry');
  assert.notEqual(s.current.itemId, first, 'the retry is a new item');
  assert.equal(s.teams[0].score, 0);
  s = answerCurrent(s, true);
  assert.equal(s.current.stage, 'revealed');
  assert.equal(s.teams[0].score, 1);
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.phase, 'board');
  assert.equal(s.turn, 1);
  assert.ok(s.teams.every((t) => t.score >= 0));
});

test('Arena: combo after two in a row, rebound to the first right board, +5 shadow points', () => {
  let s = game('b1g', { teams: 3 });
  const play = (right) => {
    s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
    s = answerCurrent(s, right);
    s = reduce(s, { type: 'NEXT' });
  };
  // team 0 right twice (on its own turns); others right in between
  play(true); play(true); play(true); play(true);
  assert.equal(s.teams[0].streak, 2);
  // second correct answer of team 0 is x1.5 of 10 = 15, plus the first 10, plus +5 shadow for team 2's turn
  assert.equal(s.teams[0].score, 10 + 5 + 5 + 15);
  // team 1 now misses; team 2 (first in order with a right board) rebounds half the value
  const before = s.teams[2].score;
  s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
  s = answerCurrent(s, false);
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.teams[1].streak, 0);
  assert.equal(s.teams[2].score, before + 5 + 5, 'rebound = half of 10 + shadow 5');
  assert.equal(s.teams[2].steals, 1);
});

test('a rebound always pays more than a plain right board, even after a hint', () => {
  for (const g of ['b1g', 'b1']) {
    let s = game(g, { teams: 3 });
    s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
    s = reduce(s, { type: 'HINT' });
    assert.equal(s.current.hints.length, 1);
    const v = tileValue(s, s.current);
    s = answerCurrent(s, false);
    s = reduce(s, { type: 'NEXT' });
    assert.equal(s.teams[1].score, Math.max(1, Math.round(v / 2)) + 5, `${g}: rebound = half of ${v} + shadow 5`);
    assert.equal(s.teams[2].score, 5, `${g}: second right board`);
    assert.ok(s.teams[1].score > s.teams[2].score, `${g}: the steal outscores a plain right board`);
  }
});

test('hints: only kinds the item can serve are offered, and each one shows something', () => {
  const served = (h) => !!h.text || (Array.isArray(h.removed) && h.removed.length > 0) || h.kind === 'listen';
  const takeAll = (s) => {
    s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
    const kinds = hintKinds(s);
    for (let k = 0; k < 6; k++) s = reduce(s, { type: 'HINT' });
    return { s, kinds };
  };
  // B2 grammar MCQ: definition/example/turkish have no data, 50:50 and the first letter do.
  let { s, kinds } = takeAll(game('b2'));
  assert.deepEqual(kinds, ['fifty', 'first-letter']);
  assert.deepEqual(s.current.hints.map((h) => h.kind), kinds);
  assert.ok(s.current.hints.every(served));
  assert.equal(nextHint(s), null);
  assert.equal(reduce(s, { type: 'HINT' }), s, 'no hint left: nothing changes, no points lost');
  assert.equal(tileValue(s, s.current), 6, 'Stüdyo: two real hints = -40%');
  // A1 adult: 'picture' has no source, so it never costs points.
  ({ kinds } = takeAll(game('a1')));
  assert.deepEqual(kinds, ['first-letter', 'listen']);
  // B1: 'example' needs item data.
  ({ kinds } = takeAll(game('b1')));
  assert.deepEqual(kinds, ['first-letter', 'fifty']);
  // B2 picture words: the Turkish gloss is a hint, unless the teacher switched glosses off.
  const words = [['cat', 'kedi'], ['dog', 'köpek'], ['lion', 'aslan'], ['frog', 'kurbağa'], ['bird', 'kuş'], ['fish', 'balık']];
  const pics = packOf(words.map(([w, tr]) => ({ ...vocab(w), tr })));
  ({ s, kinds } = takeAll(game('b2', { pack: pics, size: 4, items: 0 })));
  assert.deepEqual(kinds, ['fifty', 'first-letter', 'turkish']);
  assert.ok(s.current.hints.every(served));
  assert.equal(s.current.hints[2].text, s.items[s.current.itemId].tr);
  ({ kinds } = takeAll(game('b2', { pack: pics, size: 4, overrides: { trGloss: false } })));
  assert.deepEqual(kinds, ['fifty', 'first-letter']);
  // A1 kids find the picture: the word is already in the prompt, so only listening helps.
  ({ kinds } = takeAll(game('a1g', { pack: pics, size: 4 })));
  assert.deepEqual(kinds, ['listen']);
  // Example and definition come from item data, with the key blanked out.
  const pres = presentMcq(mcq(1), 4, 's');
  assert.equal(itemHint({ ...mcq(1), example: 'Right1 now, right1 later.' }, pres, 'example', 's').text, '___ now, ___ later.');
  assert.equal(itemHint(mcq(1), pres, 'example', 's'), null);
  assert.equal(itemHint(mcq(1), pres, 'picture', 's'), null);
  assert.equal(itemHint(mcq(1), presentMcq({ ...mcq(1), options: ['right1', 'wrong'] }, 2, 's'), 'fifty', 's'), null, '50:50 needs 3+ options');
});

test('shadow boards can be switched off per team before moving on', () => {
  let s = game('b1', { teams: 3 });
  s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
  s = answerCurrent(s, true);
  s = reduce(s, { type: 'SHADOW', teamId: 't2' });
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.teams[0].score, 10);
  assert.equal(s.teams[1].score, 0);
  assert.equal(s.teams[2].score, 5);
});

test('surprise cards: steal is capped at the target score, swap sets the next team', () => {
  let s = game('b1', { size: 12, surprise: 3, teams: 3, allowYellow: true });
  const stealTile = s.tiles.find((t) => t.kind === 'card');
  s = { ...s, tiles: s.tiles.map((t) => (t === stealTile ? { ...t, cardId: 'steal' } : t)), teams: s.teams.map((t, i) => ({ ...t, score: i === 1 ? 4 : 0 })) };
  s = reduce(s, { type: 'OPEN', n: stealTile.n });
  assert.equal(s.phase, 'card');
  assert.equal(reduce(s, { type: 'CARD_APPLY' }), s, 'a targeted card waits for a target');
  s = reduce(s, { type: 'CARD_TARGET', teamId: 't2' });
  s = reduce(s, { type: 'CARD_APPLY' });
  assert.equal(s.teams[1].score, 0);
  assert.equal(s.teams[0].score, 4);
  const swapTile = s.tiles.find((t) => t.kind === 'card' && !t.opened);
  if (swapTile) {
    s = { ...s, tiles: s.tiles.map((t) => (t.n === swapTile.n ? { ...t, cardId: 'swap' } : t)) };
    s = reduce(s, { type: 'OPEN', n: swapTile.n });
    s = reduce(s, { type: 'CARD_TARGET', teamId: 't1' });
    s = reduce(s, { type: 'CARD_APPLY' });
    assert.equal(s.turn, 0, 'the chosen team plays next');
  }
});

test('Switch: the chosen team jumps the queue without anyone losing or gaining a turn', () => {
  let s = game('b1', { size: 16, teams: 4, allowYellow: true });
  s = asCard(s, 1, 'swap');
  const order = [s.turn];
  s = reduce(s, { type: 'OPEN', n: 1 });
  s = reduce(s, { type: 'CARD_TARGET', teamId: 't4' });
  s = reduce(s, { type: 'CARD_APPLY' });
  for (let k = 0; k < 7; k++) { order.push(s.turn); s = play(s, true); }
  assert.deepEqual(order, [0, 3, 1, 2, 0, 1, 2, 3], 'Team 4 plays now, the rotation resumes, Team 4 is skipped once');
  const counts = [0, 0, 0, 0];
  for (const i of order) counts[i] += 1;
  assert.deepEqual(counts, [2, 2, 2, 2], 'every team has played twice after two laps');
  // Picking the team that was due anyway changes nothing.
  let u = asCard(game('b1', { size: 16, teams: 4, allowYellow: true }), 1, 'swap');
  u = reduce(u, { type: 'OPEN', n: 1 });
  u = reduce(u, { type: 'CARD_TARGET', teamId: 't2' });
  u = reduce(u, { type: 'CARD_APPLY' });
  const plain = [u.turn];
  for (let k = 0; k < 4; k++) { u = play(u, true); plain.push(u.turn); }
  assert.deepEqual(plain, [1, 2, 3, 0, 1]);
  // A manual turn change clears a pending Switch.
  let m = asCard(game('b1', { size: 16, teams: 4, allowYellow: true }), 1, 'swap');
  m = reduce(m, { type: 'OPEN', n: 1 });
  m = reduce(m, { type: 'CARD_TARGET', teamId: 't4' });
  m = reduce(m, { type: 'CARD_APPLY' });
  m = reduce(m, { type: 'SET_TURN', index: 2 });
  m = play(m, true);
  assert.equal(m.turn, 3, 'plain rotation after the teacher picks the turn');
});

test('gold cards double their amount; Double and Switch are not gold cards', () => {
  const goldCard = (cardId, scores = [0, 0, 0]) => {
    let s = game('b1', { size: 4, teams: 3, allowYellow: true });
    s = play(s, true); // 3 tiles left: all gold
    s = { ...s, teams: s.teams.map((t, i) => ({ ...t, score: scores[i] })) };
    const n = s.tiles.find((t) => !t.opened).n;
    s = reduce(asCard(s, n, cardId), { type: 'OPEN', n });
    assert.equal(s.current.gold, true);
    if (CARDS[cardId].target) s = reduce(s, { type: 'CARD_TARGET', teamId: s.teams[(s.turn + 1) % 3].id });
    return reduce(s, { type: 'CARD_APPLY' });
  };
  // after one tile, team 1 (index 1) holds the card and targets team 2 (index 2)
  assert.deepEqual(goldCard('everyone').teams.map((t) => t.score), [10, 10, 10]);
  assert.deepEqual(goldCard('gift').teams.map((t) => t.score), [0, 0, 20]);
  assert.deepEqual(goldCard('steal', [0, 0, 30]).teams.map((t) => t.score), [0, 20, 10]);
  assert.deepEqual(goldCard('steal', [0, 0, 12]).teams.map((t) => t.score), [0, 12, 0], 'still capped at the target score');
  assert.deepEqual(goldCard('bonus').teams.map((t) => t.score), [0, 20, 0]);
  assert.equal(GOLD_CARDS.has('double'), false);
  assert.equal(GOLD_CARDS.has('swap'), false);
  for (const id of GOLD_CARDS) assert.ok(CARDS[id], id);
});

test('Oyun Parkı: the second try shows and awards the same stars, gold or not', () => {
  let s = game('a1g', { size: 4, teams: 2 });
  s = play(s, true);
  s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
  assert.equal(s.current.gold, true);
  assert.equal(tileValue(s, s.current), 2, 'gold first try: two stars');
  s = answerCurrent(s, false);
  assert.equal(s.current.stage, 'retry');
  assert.equal(tileValue(s, s.current), 1, 'gold second try: one star less');
  const before = s.teams[s.turn].score;
  s = answerCurrent(s, true);
  assert.equal(s.current.points, 1);
  assert.equal(s.teams[s.turn].score, before + 1);
  let k = game('a1g', { teams: 2 });
  k = reduce(k, { type: 'OPEN', n: firstQuestionTile(k) });
  k = answerCurrent(k, false);
  assert.equal(tileValue(k, k.current), 1, 'a second try never drops below one star');
});

test('last three tiles are gold, FINISH ends at once, and every team gets a title', () => {
  let s = game('a2g', { size: 6, teams: 3, items: 20 });
  assert.equal(isGold(s, s.tiles[0]), false);
  for (let k = 0; k < 3; k++) {
    s = reduce(s, { type: 'OPEN', n: firstQuestionTile(s) });
    s = answerCurrent(s, true);
    s = reduce(s, { type: 'NEXT' });
  }
  assert.equal(remainingTiles(s), 3);
  assert.equal(isGold(s, s.tiles.find((t) => !t.opened)), true);
  s = reduce(s, { type: 'FINISH' });
  assert.equal(s.phase, 'end');
  assert.equal(s.finishedEarly, true);
  const titles = endingTitles(s);
  assert.equal(titles.length, 3);
  assert.equal(new Set(titles.map((t) => t.title)).size, 3, 'titles are distinct');
  const arena = endingTitles({ ...s, profile: audienceProfile('b1g') });
  assert.equal(new Set(arena.map((t) => t.teamId)).size, 3, 'every Arena team gets an award');
  // Back to the board, play it out: the natural end is not an early finish.
  s = reduce(s, { type: 'RESUME_BOARD' });
  assert.equal(s.phase, 'board');
  assert.equal(s.finishedEarly, false);
  while (remainingTiles(s) > 0) s = play(s, true);
  assert.equal(s.phase, 'end');
  assert.equal(s.finishedEarly, false);
  assert.equal(reduce(s, { type: 'RESUME_BOARD' }), s, 'no empty board to go back to');
});

test('Arena titles come from real stats; leftover teams get neutral titles', () => {
  const team = (id, over) => ({ id, index: Number(id.slice(1)) - 1, score: 0, right: 0, wrong: 0, streak: 0, bestStreak: 0, shadowRight: 0, steals: 0, gifts: 0, halfScore: null, ...over });
  const teams = [
    team('t1', { score: 60, right: 5, wrong: 1, bestStreak: 4, shadowRight: 3, halfScore: 30 }),
    team('t2', { score: 40, right: 3, wrong: 2, bestStreak: 2, shadowRight: 4, halfScore: 40 }),
    team('t3', { score: 30, right: 2, wrong: 6, bestStreak: 1, shadowRight: 0, halfScore: 30 }),
    team('t4', { score: 20, right: 1, wrong: 5, bestStreak: 1, shadowRight: 1, halfScore: 20 }),
  ];
  const titles = Object.fromEntries(endingTitles({ profile: audienceProfile('b1g'), teams }).map((a) => [a.teamId, a.title]));
  assert.equal(titles.t1, 'Longest streak');
  assert.equal(titles.t2, 'Sharpest boards');
  assert.equal(titles.t3, 'Team spirit', 'no comeback (gain 0), no clean sheet (6 misses)');
  assert.equal(titles.t4, 'Cool heads');
  assert.ok(!Object.values(titles).includes('Clean sheet'), 'nobody finished without a miss');
  assert.ok(!Object.values(titles).includes('Comeback'));
  const earned = endingTitles({ profile: audienceProfile('b1g'), teams: [teams[0], teams[1], team('t3', { right: 2, score: 20, halfScore: 5 }), team('t4', { right: 1, score: 10, halfScore: 10 })] });
  assert.deepEqual(Object.fromEntries(earned.map((a) => [a.teamId, a.title])), { t1: 'Longest streak', t2: 'Sharpest boards', t3: 'Comeback', t4: 'Clean sheet' });
});

test('ranking gives tied scores the same place', () => {
  const s = game('b1', { teams: 4 });
  const r = ranking({ ...s, teams: s.teams.map((t, i) => ({ ...t, score: [50, 30, 50, 10][i] })) });
  assert.deepEqual(r.map((t) => t.id), ['t1', 't3', 't2', 't4']);
  assert.deepEqual(r.map((t) => t.place), [0, 0, 2, 3]);
});

test('store: undo restores the previous state and the game is saved from the start', () => {
  const storage = memoryStorage();
  const s0 = game('b1', { teams: 2 });
  const store = createStore(s0, reduce, { saveKey: 'k', storage });
  assert.ok(storage.getItem('k'), 'saved before the first action');
  store.dispatch({ type: 'OPEN', n: firstQuestionTile(s0) });
  assert.equal(store.state.phase, 'question');
  store.dispatch({ type: 'STAGE', stage: 'huddle', transient: true });
  store.undo();
  assert.equal(store.state.phase, 'board', 'transient stage changes are not undo steps');
  assert.equal(readSave('k', undefined, storage).state.phase, 'board');
});

test('picture distractors avoid confusable groups and never mix colours with shapes', async () => {
  const { presentVocab: pv } = await import('../src/classroom/core/pack.mjs');
  const v = (w, extra = {}) => ({ id: `pic:t:${w}`, type: 'vocab', term: w, pic: `/p/${w}.svg`, topic: 't', ...extra });
  const pool = [v('whale', { cg: 'sea' }), v('dolphin', { cg: 'sea' }), v('fish', { cg: 'sea' }), v('cat'), v('dog'), v('lion')];
  for (let i = 0; i < 30; i++) {
    const p = pv(pool[0], pool, 4, 'name', `s${i}`);
    const words = p.options.map((o) => o.text);
    assert.ok(!words.includes('dolphin') && !words.includes('fish'), 'no sea-animal distractor for whale');
  }
  const shapes = [v('red', { cat: 'colour' }), v('blue', { cat: 'colour' }), v('green', { cat: 'colour' }), v('square', { cat: 'shape' }), v('circle', { cat: 'shape' }), v('star', { cat: 'shape' }), v('heart', { cat: 'shape' })];
  for (let i = 0; i < 30; i++) {
    const p = pv(shapes[3], shapes, 4, 'name', `c${i}`);
    assert.ok(p.options.every((o) => ['square', 'circle', 'star', 'heart'].includes(o.text)), 'shape questions only offer shapes');
  }
});

test('blank checks catch doubled words and unsplittable multi-blank keys, not real English', async () => {
  const { blankProblem } = await import('../src/classroom/core/pack.mjs');
  assert.equal(blankProblem('I have a ___ house.', 'big house'), 'doubled-word');
  assert.equal(blankProblem('We ___ watch TV at night.', 'usually watch'), 'doubled-word');
  assert.equal(blankProblem('She ___ to school and ___ lunch there.', 'goes'), 'multi-blank');
  assert.equal(blankProblem('What ___ you ___ at ten last night?', 'were ... doing'), null);
  assert.equal(blankProblem('___ is he? — He is my brother.', 'Who'), null);
  assert.equal(blankProblem('I would have called you if I ___ your number.', 'had had'), null);
  assert.equal(blankProblem('What is it?', 'cat'), null);
});

test('replaying missed items uses the original pack for distractors and reserve; tiny boards are not all gold', () => {
  const profile = audienceProfile('a1g');
  const all = ['cat', 'dog', 'lion', 'frog', 'bird', 'fish'].map((w) => vocab(w));
  const missed = all.slice(0, 2);
  const s = createGame({ profile, pack: packOf(missed), teams: defaultTeams(2, profile.mode), boardSize: 2, surpriseLevel: 0, code: 'REPLAY-1', pool: all });
  const q = s.tiles.find((t) => t.kind === 'question');
  assert.equal(isGold(s, q), false, 'a 2-question board is not gold');
  assert.ok(s.reserve.length >= 4, 'the pool refills the reserve for the second try');
  const p = presented(s, q.itemId);
  assert.equal(p.options.length, 3, 'three picture options even with two missed items');
});

test('setup remembers the step-2 choice per content kind; speaking never clears the quiz choice', async () => {
  const { savedSelection, withSelection } = await import('../src/classroom/core/setup.mjs');
  // Quiz games read the top-level fields, exactly as before.
  const legacy = { group: 'a2', topicKey: 'a2:a2-04', tab: 'builtin', myPackId: 'quiz-1' };
  assert.deepEqual(savedSelection(legacy), { topicKey: 'a2:a2-04', tab: 'builtin', myPackId: 'quiz-1' });
  assert.deepEqual(savedSelection(legacy, 'speaking'), { topicKey: null, tab: 'builtin', myPackId: null });
  // A speaking choice goes under sel.speaking and leaves the quiz fields alone.
  const afterSpeak = withSelection(legacy, 'speaking', { topicKey: 'speak:kids:animals', tab: 'ai', myPackId: 'speak-1' });
  assert.deepEqual(savedSelection(afterSpeak), savedSelection(legacy));
  assert.deepEqual(savedSelection(afterSpeak, 'speaking'), { topicKey: 'speak:kids:animals', tab: 'ai', myPackId: 'speak-1' });
  assert.equal(afterSpeak.group, 'a2');
  // A quiz choice writes the top level and keeps the speaking one.
  const afterQuiz = withSelection(afterSpeak, 'quiz', { topicKey: 'b1:b1-02', tab: 'builtin', myPackId: null });
  assert.deepEqual(savedSelection(afterQuiz), { topicKey: 'b1:b1-02', tab: 'builtin', myPackId: null });
  assert.deepEqual(savedSelection(afterQuiz, 'speaking'), savedSelection(afterSpeak, 'speaking'));
  // Broken saves fall back to nothing chosen.
  assert.deepEqual(savedSelection(null, 'speaking'), { topicKey: null, tab: 'builtin', myPackId: null });
  assert.deepEqual(savedSelection({ sel: 'x', topicKey: 3 }), { topicKey: null, tab: 'builtin', myPackId: null });
});
