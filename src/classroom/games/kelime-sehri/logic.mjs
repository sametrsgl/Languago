// Kelime Şehri (Monopoly-style city board): pure rules reducer.
// One engine, three rulesets chosen by profile.mode: Stüdyo "Word City"
// (coins, buy, rent and build), Arena "Orbit Match" (credits, planets and
// steals) and Oyun Parkı "Treasure Island" (stars that only ever go up).
// Teams roll and hop round a 20-square ring; every place asks a question from
// its street's topic, and every other team answers on its card too.
// Randomness is seeded by the board code, so an undo never re-rolls.
import { shuffleSeeded, rngFor } from '../../core/rng.mjs';
import { drawSeat } from '../../core/teams.mjs';
import { validateItem, presentMcq, presentVocab, wordCount } from '../../core/pack.mjs';
import { ERROR_SENTENCES, MIC_PROMPTS, CHANCE, NEST_BREAKS, SQUARES } from './banks.mjs';

export const MAX_TOPICS = 4;
export const MAX_TEAMS = 6;
export const SQUARE_COUNT = 20;
export const START = 0;
export const GARAGE = 6;
export const STREETS = ['A', 'B', 'C', 'D'];

export const START_VALUES = { studio: 500, arena: 10, park: 0 };
export const PASS_BONUS = { studio: 100, arena: 2, park: 1 };
export const SHADOW = { studio: 20, arena: 1, park: 1 };
export const ANSWER_BONUS = { studio: 40, arena: 2, park: 1 };
export const EVERYONE_BONUS = { studio: 50, arena: 2, park: 1 };
export const JOKER_BONUS = { studio: 50, arena: 2, park: 0 };
export const NO_FREE_BONUS = { studio: 0, arena: 2, park: 1 };
export const TASK_REWARDS = { studio: { great: 100, ok: 50, try: 0 }, arena: { great: 3, ok: 2, try: 0 } };
export const CURRENCY = {
  studio: { one: 'coin', many: 'coins', tr: 'jeton' },
  arena: { one: 'credit', many: 'credits', tr: 'kredi' },
  park: { one: 'star', many: 'stars', tr: 'yıldız' },
};
export const DEFAULT_MINUTES = { park: 20, arena: 30, studio: 40 };
export const POT_START = 100;
export const PAY_OUT_FEE = 50;
export const CHEST_STARS = 3;
export const RENT_RATES = [0.3, 0.7, 1.2];
export const MAX_LEVEL = 2;
export const ARENA_BUILD_COST = 2;
export const JOKERS = ['fifty', 'swap', 'shield'];
export const MAX_JOKERS = 2;
export const GRADES = ['great', 'ok', 'try'];

// Stüdyo prices rise round the board; Arena planets cost 3/4/5 by tier.
export const STUDIO_PRICES = { A: [100, 120, 140], B: [140, 160, 180], C: [180, 200, 220], D: [220, 260, 300] };
export const ARENA_PRICES = [3, 4, 5];

const PLAYABLE = ['mcq', 'vocab'];
const MIN_PER_TOPIC = 9; // enough for three tiers before the word cap is dropped
const LOG_MAX = 30;
const STAGES = ['prompt', 'talk'];
const OWN_PURPOSES = ['claim', 'rent', 'build'];

// Square 0 is the bottom-right corner, then clockwise. Kinds are Stüdyo's;
// boardFor() swaps in Arena's and Oyun Parkı's own specials.
const LAYOUT = [
  ['start'], ['place', 'A', 1], ['place', 'A', 2], ['chance'], ['place', 'A', 3], ['joker'],
  ['garage'], ['place', 'B', 1], ['place', 'B', 2], ['place', 'B', 3],
  ['mic'], ['place', 'C', 1], ['everyone'], ['place', 'C', 2], ['place', 'C', 3], ['chance'],
  ['gotoGarage'], ['place', 'D', 1], ['place', 'D', 2], ['place', 'D', 3],
];
export const BOARD = LAYOUT.map(([kind, street = null, tier = null], index) => ({ index, kind, street, tier }));
const MODE_KINDS = { studio: {}, arena: { 10: 'wormhole' }, park: { 5: 'everyone', 6: 'nest', 10: 'windy', 16: 'slide' } };

// 1 topic: every street; 2: A+C and B+D; 3: A, B, C and D reuses the first.
const TOPIC_MAP = { 1: [0, 0, 0, 0], 2: [0, 1, 0, 1], 3: [0, 1, 2, 0], 4: [0, 1, 2, 3] };

export function round10(x) {
  return Math.round(x / 10) * 10;
}

function placePrice(mode, street, tier) {
  if (mode === 'arena') return ARENA_PRICES[tier - 1];
  if (mode === 'park') return 0;
  return STUDIO_PRICES[street][tier - 1];
}

export function boardFor(mode) {
  const names = SQUARES[mode] || SQUARES.studio;
  const kinds = MODE_KINDS[mode] || {};
  return BOARD.map((sq) => ({
    ...sq,
    kind: kinds[sq.index] || sq.kind,
    name: names[sq.index].name,
    icon: names[sq.index].icon,
    price: sq.kind === 'place' ? placePrice(mode, sq.street, sq.tier) : 0,
  }));
}

export function labelOf(title) {
  return String(title || '').split(' · ').pop().trim();
}

// A rough "easier first" order (copied from Kategori): it splits the tiers.
function effort(it) {
  if (it.type === 'vocab') return String(it.term || '').length;
  const opts = (it.options || []).join(' ');
  return wordCount(it.stem) * 3 + opts.length / 8;
}

export function createGame({ profile, topics, teams, code, now = 0, starterDeed = false, minutes = null }) {
  const mode = profile.mode;
  const items = {};
  const rows = (topics || []).slice(0, MAX_TOPICS).map((tp, t) => {
    // An item already used by an earlier topic stays there (no duplicates).
    const pool = shuffleSeeded((tp.pack?.items || []).filter((it) => PLAYABLE.includes(it.type) && validateItem(it).ok && !items[it.id]), `${code}:topic:${t}`);
    const capped = pool.filter((it) => wordCount(it.stem || '') <= profile.wordCap);
    const usable = (capped.length >= MIN_PER_TOPIC ? capped : pool).slice().sort((a, b) => effort(a) - effort(b));
    const cut = [Math.round(usable.length / 3), Math.round((usable.length * 2) / 3)];
    const tiers = { 1: [], 2: [], 3: [] };
    usable.forEach((it, k) => {
      const tier = k < cut[0] ? 1 : k < cut[1] ? 2 : 3;
      items[it.id] = { ...it, cat: t, tier };
      tiers[tier].push(it.id);
    });
    return { title: tp.title, label: labelOf(tp.title), tiers };
  });
  const filled = rows.findIndex((r) => r.tiers[1].length + r.tiers[2].length + r.tiers[3].length > 0);
  const map = TOPIC_MAP[Math.max(1, rows.length)];
  const streets = STREETS.map((id, k) => {
    const r = rows[map[k]];
    const empty = !r || !(r.tiers[1].length + r.tiers[2].length + r.tiers[3].length);
    const topic = empty && filled >= 0 ? filled : map[k];
    return { id, title: rows[topic]?.title || '', label: rows[topic]?.label || '', color: null, topic };
  });
  const board = boardFor(mode);
  const places = {};
  for (const sq of board) if (sq.kind === 'place') places[sq.index] = { owner: null, level: 0 };
  const roster = (teams || []).slice(0, MAX_TEAMS).map((t) => ({
    ...t, pos: START, cash: START_VALUES[mode], right: 0, wrong: 0, shadowRight: 0, streak: 0, bestStreak: 0, jail: 0, jokers: [], visits: 0,
  }));
  // Starter deeds: one distinct tier-1 or tier-2 place per team, so rent
  // happens within one lesson.
  if (starterDeed) {
    const deeds = shuffleSeeded(board.filter((sq) => sq.kind === 'place' && sq.tier <= 2).map((sq) => sq.index), `${code}:deeds`);
    roster.forEach((t, k) => { if (deeds[k] != null) places[deeds[k]] = { owner: t.id, level: 0 }; });
  }
  const state = {
    v: 1,
    game: 'kelime-sehri',
    code,
    createdAt: now,
    profile,
    minutes: Number(minutes) || DEFAULT_MINUTES[mode],
    starterDeed: !!starterDeed,
    board,
    topics: rows,
    streets,
    items,
    queues: rows.map((r) => ({ 1: r.tiers[1].slice(), 2: r.tiers[2].slice(), 3: r.tiers[3].slice() })),
    places,
    completed: {},
    teams: roster,
    turn: 0,
    turnCount: 0,
    seat: null,
    bags: {},
    phase: 'roll',
    pending: null,
    lastMove: null,
    lastEvent: null,
    pot: mode === 'studio' ? POT_START : 0,
    deck: shuffleSeeded(chanceCards(profile).map((c) => c.ref), `${code}:deck:0`),
    deckPos: 0,
    deckRound: 0,
    micPos: 0,
    errPos: 0,
    finalRound: false,
    missed: [],
    itemStats: {},
    log: [],
  };
  return startTurn(state);
}

export function presented(state, itemId, salt = '') {
  const item = state.items[itemId];
  if (!item) return null;
  const seed = `${state.code}:${itemId}${salt}`;
  if (item.type === 'mcq') return presentMcq(item, state.profile.optionCount, seed);
  if (item.type === 'vocab') {
    const direction = state.profile.young && state.profile.level === 'a1' ? 'find' : 'name';
    const pool = Object.values(state.items).filter((it) => it.cat === item.cat);
    return presentVocab(item, pool, state.profile.optionCount, direction, seed);
  }
  return null;
}

// The on-screen die is seeded per turn, so an undo cannot re-roll.
export function rollValue(state) {
  return 1 + Math.floor(rngFor(`${state.code}:roll:${state.turnCount}`)() * 6);
}

export function priceOf(state, square) {
  return state.board[square]?.price || 0;
}

export function buildCost(state, square) {
  if (state.profile.mode === 'arena') return ARENA_BUILD_COST;
  if (state.profile.mode === 'park') return 0;
  return round10(priceOf(state, square) / 2);
}

export function freePlaces(state) {
  return state.board.filter((sq) => sq.kind === 'place' && !state.places[sq.index].owner).map((sq) => sq.index);
}

export function ownedBy(state, teamId) {
  return state.board.filter((sq) => sq.kind === 'place' && state.places[sq.index].owner === teamId).map((sq) => sq.index);
}

// The team that owns all three places of a street, or null.
export function streetOwner(state, street) {
  const sqs = state.board.filter((sq) => sq.kind === 'place' && sq.street === street);
  const owner = sqs.length ? state.places[sqs[0].index].owner : null;
  return owner && sqs.every((sq) => state.places[sq.index].owner === owner) ? owner : null;
}

// What the visitor owes before the shield and the "nobody below 0" cap.
export function rentDue(state, square, right) {
  const place = state.places[square];
  const sq = state.board[square];
  if (!place || !place.owner) return 0;
  const full = streetOwner(state, sq.street) === place.owner;
  if (state.profile.mode === 'studio') {
    // Rounded first, then doubled, so the whole-street rent is twice the card's.
    const base = round10(sq.price * RENT_RATES[place.level]);
    const rent = place.level === 0 && full ? base * 2 : base;
    return right ? round10(rent / 2) : rent;
  }
  if (state.profile.mode === 'arena') return right ? 0 : sq.tier + place.level + (full ? 1 : 0);
  return 0;
}

// The deed card's Buy button: the app shows "Not enough coins" when false.
export function canBuy(state) {
  const p = state.pending;
  if (state.phase !== 'pending' || !p || p.kind !== 'deed') return false;
  return state.teams[state.turn].cash >= priceOf(state, p.square);
}

export function netWorth(state, team) {
  const t = typeof team === 'string' ? state.teams.find((x) => x.id === team) : team;
  if (!t) return 0;
  if (state.profile.mode === 'park') return t.cash;
  return ownedBy(state, t.id).reduce((sum, sq) => sum + priceOf(state, sq) + state.places[sq].level * buildCost(state, sq), t.cash);
}

// Chance (Stüdyo), Signal (Arena) and Magic (Park) cards for this class:
// band A is A1-A2, band B is B1-B2; Park tasks may be limited to some levels.
export function chanceCards(profile) {
  const band = profile.level === 'b1' || profile.level === 'b2' ? 'B' : 'A';
  const bank = profile.mode === 'park' ? CHANCE.park : (CHANCE[profile.mode] || CHANCE.studio)[band];
  const tasks = bank.tasks.filter((c) => !c.levels || c.levels.includes(profile.level));
  const events = bank.events.filter((c) => profile.mode !== 'park' || c.effect.type !== 'toGarage');
  return [
    ...tasks.map((c) => ({ ...c, kind: 'task', ref: `task:${c.id}` })),
    ...events.map((c) => ({ ...c, kind: 'event', ref: `event:${c.id}` })),
  ];
}

export function errorSentence(state, idx) {
  return (ERROR_SENTENCES[state.profile.level] || ERROR_SENTENCES.a1)[idx] || null;
}

export function micPrompt(state, idx) {
  return (MIC_PROMPTS[state.profile.level] || MIC_PROMPTS.a1)[idx] || null;
}

function active(s) { return s.teams[s.turn]; }
function isPending(state, kind) { return state.phase === 'pending' && !!state.pending && state.pending.kind === kind; }
function bump(stats, id, right) { const s = stats[id] || { right: 0, total: 0 }; return { ...stats, [id]: { right: s.right + (right ? 1 : 0), total: s.total + 1 } }; }
function addMissed(list, id) { return list.includes(id) ? list : [...list, id]; }

// A working copy: every part an action may change is copied, so the
// helpers below can update it in place and the input state stays untouched.
function draft(state) {
  const places = {};
  for (const k of Object.keys(state.places)) places[k] = { ...state.places[k] };
  return {
    ...state,
    teams: state.teams.map((t) => ({ ...t, jokers: [...t.jokers] })),
    places,
    queues: [...state.queues],
    completed: { ...state.completed },
    bags: { ...state.bags },
    missed: [...state.missed],
    itemStats: { ...state.itemStats },
    log: [...state.log],
  };
}

function note(s, ev) {
  s.log = [...s.log, ev].slice(-LOG_MAX);
  s.lastEvent = ev;
  return ev;
}

function pend(s, pending) {
  s.phase = 'pending';
  s.pending = pending;
  return s;
}

function info(s, extra) {
  return pend(s, { kind: 'info', ...extra });
}

// A new turn: draw the speaker; a team in the Garage first gets the choice card.
function startTurn(s) {
  const team = active(s);
  const { seat, bag } = drawSeat(s.bags[team.id], team.seats, rngFor(`${s.code}:seat:${s.turnCount}`));
  s.bags = { ...s.bags, [team.id]: bag };
  s.seat = seat;
  if (team.jail > 0) return pend(s, { kind: 'garage' });
  s.phase = 'roll';
  s.pending = null;
  return s;
}

// The final round ends when the turn would wrap back to the first team,
// so every team gets the same number of turns.
function endTurn(s) {
  const next = (s.turn + 1) % s.teams.length;
  s.turn = next;
  s.turnCount += 1;
  s.pending = null;
  if (s.finalRound && next === 0) { s.phase = 'end'; return s; }
  return startTurn(s);
}

function payPass(s, team) {
  const amount = PASS_BONUS[s.profile.mode];
  team.cash += amount;
  note(s, { type: 'pass', teamId: team.id, amount });
}

function moveBy(s, team, n, via = 'roll') {
  const from = team.pos;
  const to = (from + n) % SQUARE_COUNT;
  const passedStart = from + n >= SQUARE_COUNT;
  team.pos = to;
  const move = { teamId: team.id, from, to, value: n, passedStart, via };
  note(s, { type: 'move', ...move });
  if (passedStart) payPass(s, team);
  return move;
}

function sendToGarage(s, team) {
  const from = team.pos;
  team.pos = GARAGE;
  team.jail = 1;
  note(s, { type: 'jail', teamId: team.id, from, to: GARAGE });
  return { from, to: GARAGE };
}

function giveJoker(s, team) {
  const mode = s.profile.mode;
  if (team.jokers.length >= MAX_JOKERS) {
    const amount = JOKER_BONUS[mode];
    team.cash += amount;
    note(s, { type: 'joker', teamId: team.id, joker: null, amount });
    return { joker: null, amount };
  }
  const joker = JOKERS[Math.floor(rngFor(`${s.code}:joker:${s.turnCount}:${team.jokers.length}`)() * JOKERS.length)];
  team.jokers = [...team.jokers, joker];
  note(s, { type: 'joker', teamId: team.id, joker, amount: 0 });
  return { joker, amount: 0 };
}

// A place changes owner; a whole street flags the splash (Park: a chest).
function take(s, square, team, ev) {
  s.places[square] = { ...s.places[square], owner: team.id };
  const street = s.board[square].street;
  if (streetOwner(s, street) === team.id && s.completed[street] !== team.id) {
    s.completed = { ...s.completed, [street]: team.id };
    ev.streetComplete = street;
    if (s.profile.mode === 'park') { team.cash += CHEST_STARS; ev.chest = CHEST_STARS; }
  }
  note(s, ev);
}

// Tier queues are per topic: draw the next unused item, falling back to the
// nearest tier (the easier one first); when the topic is used up, recycle it.
// Items in avoid (the ones a replace skipped) are passed over.
function nearTiers(tier) {
  return tier === 1 ? [1, 2, 3] : tier === 2 ? [2, 1, 3] : [3, 2, 1];
}

function drawItem(s, topic, tier, avoid = []) {
  const row = s.topics[topic];
  if (!row) return null;
  const fresh = (q) => nearTiers(tier).find((t) => q[t].some((id) => !avoid.includes(id)));
  let q = s.queues[topic];
  if (!fresh(q)) {
    q = { 1: row.tiers[1].filter((id) => !avoid.includes(id)), 2: row.tiers[2].filter((id) => !avoid.includes(id)), 3: row.tiers[3].filter((id) => !avoid.includes(id)) };
  }
  const t = fresh(q);
  if (!t) return null;
  const id = q[t].find((x) => !avoid.includes(x));
  s.queues[topic] = { ...q, [t]: q[t].filter((x) => x !== id) };
  return id;
}

function ask(s, purpose, square, tier, street = s.board[square].street) {
  const topic = s.streets[STREETS.indexOf(street)].topic;
  const itemId = drawItem(s, topic, tier);
  if (!itemId) return info(s, { note: 'no-items', square });
  const chips = {};
  for (const t of s.teams) chips[t.id] = true;
  return pend(s, { kind: 'question', purpose, square, street, topic, tier, itemId, salt: `:${s.turnCount}`, stage: 'prompt', chips, hidden: [] });
}

function errorOrder(s) {
  const list = ERROR_SENTENCES[s.profile.level] || ERROR_SENTENCES.a1;
  return shuffleSeeded(list.map((_, i) => i), `${s.code}:errors`);
}

function nextError(s) {
  const order = errorOrder(s);
  const errorIdx = order[s.errPos % order.length];
  s.errPos += 1;
  return errorIdx;
}

function micIndex(s) {
  const list = MIC_PROMPTS[s.profile.level] || MIC_PROMPTS.a1;
  const order = shuffleSeeded(list.map((_, i) => i), `${s.code}:mic`);
  return order[s.micPos % order.length];
}

// Resolve the square the active team stands on.
function land(s, square) {
  const team = active(s);
  const mode = s.profile.mode;
  const sq = s.board[square];
  switch (sq.kind) {
    case 'place': {
      const place = s.places[square];
      if (!place.owner) return ask(s, 'claim', square, sq.tier);
      if (place.owner === team.id) {
        if (mode === 'park') return info(s, { note: 'home', square });
        return ask(s, 'build', square, Math.min(3, sq.tier + 1));
      }
      return ask(s, 'rent', square, Math.min(3, sq.tier + place.level));
    }
    case 'chance': return drawChance(s);
    case 'joker': return info(s, { note: 'joker', square, ...giveJoker(s, team) });
    case 'everyone': {
      const street = STREETS[Math.floor(rngFor(`${s.code}:everyone:${s.turnCount}`)() * STREETS.length)];
      return ask(s, 'everyone', square, 2, street);
    }
    case 'mic': return pend(s, { kind: 'mic', square, micIdx: micIndex(s) });
    case 'wormhole':
    case 'windy': {
      if (freePlaces(s).length) return pend(s, { kind: 'pick', square });
      const amount = NO_FREE_BONUS[mode];
      team.cash += amount;
      note(s, { type: 'gain', teamId: team.id, square, amount });
      return info(s, { note: 'no-free', square, amount });
    }
    case 'nest': return pend(s, { kind: 'nest', square, breakIdx: Math.floor(rngFor(`${s.code}:nest:${s.turnCount}`)() * NEST_BREAKS.length) });
    case 'slide': {
      // Slide to the Harbour: the pass bonus is the one star.
      team.pos = START;
      payPass(s, team);
      return info(s, { note: 'slide', square, from: square, to: START, amount: PASS_BONUS[mode] });
    }
    case 'gotoGarage': return info(s, { note: 'toGarage', square, ...sendToGarage(s, team) });
    case 'garage': return info(s, { note: 'visiting', square });
    default: return info(s, { note: 'start', square, amount: PASS_BONUS[mode] });
  }
}

function drawChance(s) {
  const cards = chanceCards(s.profile);
  if (s.deckPos >= s.deck.length) {
    s.deckRound += 1;
    s.deck = shuffleSeeded(cards.map((c) => c.ref), `${s.code}:deck:${s.deckRound}`);
    s.deckPos = 0;
  }
  const ref = s.deck[s.deckPos];
  s.deckPos += 1;
  const card = cards.find((c) => c.ref === ref);
  const team = active(s);
  note(s, { type: 'chance', teamId: team.id, ref });
  if (!card) return info(s, { note: 'event', ref, card: null });
  if (card.kind === 'task') return pend(s, { kind: 'chance-task', ref, card, magic: s.profile.mode === 'park' });
  const e = card.effect;
  const base = { note: 'event', ref, card };
  switch (e.type) {
    case 'gain':
      team.cash += e.n;
      note(s, { type: 'gain', teamId: team.id, amount: e.n });
      return info(s, { ...base, amount: e.n });
    case 'payPot': {
      const paid = Math.min(team.cash, e.n);
      team.cash -= paid;
      s.pot += paid;
      note(s, { type: 'payPot', teamId: team.id, amount: paid });
      return info(s, { ...base, amount: paid });
    }
    case 'allGain':
      for (const t of s.teams) t.cash += e.n;
      note(s, { type: 'allGain', amount: e.n });
      return info(s, { ...base, amount: e.n });
    case 'toStart': {
      const from = team.pos;
      team.pos = START;
      payPass(s, team);
      return info(s, { ...base, from, to: START, amount: PASS_BONUS[s.profile.mode] });
    }
    case 'toGarage': return info(s, { ...base, ...sendToGarage(s, team) });
    case 'steps': {
      // lastMove keeps the roll (the die and its hops); the card's move follows in then.
      const move = moveBy(s, team, e.n, ref);
      s.lastMove = s.lastMove ? { ...s.lastMove, then: [...(s.lastMove.then || []), move] } : move;
      return land(s, team.pos);
    }
    case 'joker': return info(s, { ...base, ...giveJoker(s, team) });
    default: return info(s, base);
  }
}

// Swap the question on screen for the next one of the same topic and tier;
// the old item goes back to the end of its own queue, but an item skipped
// for this question never comes back for it. Fix cards take the next error
// sentence.
function swapItem(s) {
  const p = s.pending;
  if (p.purpose === 'fix') { s.pending = { ...p, errorIdx: nextError(s), stage: 'prompt' }; return true; }
  const skipped = [...(p.skipped || []), p.itemId];
  const next = drawItem(s, p.topic, p.tier, skipped);
  if (!next) return false;
  const own = s.items[p.itemId].tier;
  const q = s.queues[p.topic];
  s.queues[p.topic] = { ...q, [own]: [...q[own], p.itemId] };
  s.pending = { ...p, itemId: next, skipped, stage: 'prompt', hidden: [] };
  return true;
}

function spend(team, kind) {
  const k = team.jokers.indexOf(kind);
  team.jokers = team.jokers.filter((_, i) => i !== k);
}

function playJoker(state, kind) {
  const p = state.pending;
  if (!isPending(state, 'question') || !OWN_PURPOSES.includes(p.purpose) || p.stage === 'revealed') return state;
  if (!state.teams[state.turn].jokers.includes(kind)) return state;
  if (kind === 'fifty') {
    if (p.hidden.length) return state;
    const pres = presented(state, p.itemId, p.salt);
    if (!pres) return state;
    const n = pres.options.length >= 4 ? 2 : pres.options.length === 3 ? 1 : 0;
    if (!n) return state;
    const wrong = pres.options.map((_, i) => i).filter((i) => i !== pres.answer);
    const hidden = shuffleSeeded(wrong, `${state.code}:fifty:${p.itemId}:${state.turnCount}`).slice(0, n).sort((a, b) => a - b);
    const s = draft(state);
    spend(active(s), 'fifty');
    s.pending = { ...p, hidden };
    note(s, { type: 'useJoker', teamId: active(s).id, joker: 'fifty' });
    return s;
  }
  if (kind === 'swap') {
    const s = draft(state);
    if (!swapItem(s)) return state;
    spend(active(s), 'swap');
    note(s, { type: 'useJoker', teamId: active(s).id, joker: 'swap' });
    return s;
  }
  return state; // the shield is spent automatically on rent
}

function answerBonus(s, team) {
  return ANSWER_BONUS[s.profile.mode] + (s.profile.mode === 'arena' && team.streak >= 3 ? 1 : 0);
}

// CONTINUE: apply the revealed question by its purpose. The active team's
// chip decides; every other right team earns the shadow reward.
function settle(s, ok) {
  const p = s.pending;
  const team = active(s);
  if (p.purpose === 'fix') {
    team.jail = 0;
    if (ok) {
      team.right += 1;
      note(s, { type: 'free', teamId: team.id, how: 'fix' });
      s.pending = null;
      s.phase = 'roll';
      return s;
    }
    team.wrong += 1;
    note(s, { type: 'free', teamId: team.id, how: 'not-yet' });
    return endTurn(s);
  }
  const mode = s.profile.mode;
  const everyone = p.purpose === 'everyone';
  const winners = [];
  let anyWrong = false;
  for (const t of s.teams) {
    const r = !!p.chips[t.id];
    s.itemStats = bump(s.itemStats, p.itemId, r);
    if (!r) { anyWrong = true; continue; }
    if (everyone) { t.cash += EVERYONE_BONUS[mode]; t.shadowRight += 1; winners.push(t.id); }
    else if (t !== team) { t.cash += SHADOW[mode]; t.shadowRight += 1; }
  }
  if (anyWrong) s.missed = addMissed(s.missed, p.itemId);
  if (everyone) {
    note(s, { type: 'everyone', teams: winners, amount: EVERYONE_BONUS[mode] });
    return endTurn(s);
  }
  const right = !!p.chips[team.id];
  if (right) team.right += 1; else team.wrong += 1;
  if (mode === 'arena') {
    team.streak = right ? team.streak + 1 : 0;
    team.bestStreak = Math.max(team.bestStreak, team.streak);
  }
  s.pending = null;
  if (p.purpose === 'claim') return settleClaim(s, p, right);
  if (p.purpose === 'rent') return settleRent(s, p, right);
  return settleBuild(s, p, right);
}

function settleClaim(s, p, right) {
  const mode = s.profile.mode;
  const team = active(s);
  const price = priceOf(s, p.square);
  if (mode === 'arena' && !right) return steal(s, p);
  if (!right) {
    note(s, { type: 'wrong', teamId: team.id, square: p.square, purpose: 'claim' });
    return endTurn(s);
  }
  if (mode === 'park') {
    team.cash += ANSWER_BONUS.park;
    take(s, p.square, team, { type: 'treasure', teamId: team.id, square: p.square, amount: ANSWER_BONUS.park });
    return endTurn(s);
  }
  const bonus = answerBonus(s, team);
  team.cash += bonus;
  note(s, { type: 'bonus', teamId: team.id, square: p.square, amount: bonus });
  if (mode === 'arena') {
    if (team.cash >= price) {
      team.cash -= price;
      take(s, p.square, team, { type: 'claim', teamId: team.id, square: p.square, amount: price, bonus });
    }
    return endTurn(s);
  }
  // Stüdyo: A1 buys automatically; everyone else decides on the deed card.
  if (s.profile.level !== 'a1') return pend(s, { kind: 'deed', square: p.square });
  if (team.cash < price) return info(s, { note: 'cant-afford', square: p.square, amount: price });
  team.cash -= price;
  take(s, p.square, team, { type: 'buy', teamId: team.id, square: p.square, amount: price, auto: true });
  return endTurn(s);
}

// Arena: after a wrong claim, the right team with the fewest credits that can
// pay half price steals the planet (ties: turn order after the active team).
function steal(s, p) {
  const team = active(s);
  const n = s.teams.length;
  const half = Math.ceil(priceOf(s, p.square) / 2);
  const order = (t) => (s.teams.indexOf(t) - s.turn + n) % n;
  const thief = s.teams
    .filter((t) => t !== team && p.chips[t.id])
    .sort((a, b) => a.cash - b.cash || order(a) - order(b))
    .find((t) => t.cash >= half);
  if (!thief) {
    note(s, { type: 'wrong', teamId: team.id, square: p.square, purpose: 'claim' });
    return endTurn(s);
  }
  thief.cash -= half;
  take(s, p.square, thief, { type: 'steal', teamId: thief.id, from: team.id, square: p.square, amount: half });
  return endTurn(s);
}

function settleRent(s, p, right) {
  const team = active(s);
  const owner = s.teams.find((t) => t.id === s.places[p.square].owner);
  if (!owner) return endTurn(s);
  if (s.profile.mode === 'park') {
    // "Visit a friend!": a right visitor and the host both get a star.
    if (right) {
      team.cash += 1;
      owner.cash += 1;
      team.visits += 1;
      note(s, { type: 'visit', teamId: team.id, owner: owner.id, square: p.square, amount: 1 });
    } else note(s, { type: 'wrong', teamId: team.id, square: p.square, purpose: 'rent' });
    return endTurn(s);
  }
  const due = rentDue(s, p.square, right);
  if (due > 0 && team.jokers.includes('shield')) {
    spend(team, 'shield');
    note(s, { type: 'shield', teamId: team.id, owner: owner.id, square: p.square, amount: due });
    return endTurn(s);
  }
  // Nobody goes below 0: pay what you have, the rest is forgiven.
  const paid = Math.min(team.cash, due);
  team.cash -= paid;
  owner.cash += paid;
  note(s, { type: 'rent', teamId: team.id, owner: owner.id, square: p.square, amount: paid, due, right });
  return endTurn(s);
}

function settleBuild(s, p, right) {
  const team = active(s);
  if (!right) {
    note(s, { type: 'wrong', teamId: team.id, square: p.square, purpose: 'build' });
    return endTurn(s);
  }
  const place = s.places[p.square];
  const cost = buildCost(s, p.square);
  if (place.level < MAX_LEVEL && team.cash >= cost) {
    team.cash -= cost;
    s.places[p.square] = { ...place, level: place.level + 1 };
    note(s, { type: 'build', teamId: team.id, square: p.square, level: place.level + 1, amount: cost });
  } else {
    const amount = answerBonus(s, team);
    team.cash += amount;
    note(s, { type: 'bonus', teamId: team.id, square: p.square, amount });
  }
  return endTurn(s);
}

function rate(state, grade) {
  if (!GRADES.includes(grade)) return state;
  const mode = state.profile.mode;
  if (isPending(state, 'chance-task') && mode !== 'park') {
    const s = draft(state);
    const team = active(s);
    const amount = TASK_REWARDS[mode][grade];
    team.cash += amount;
    note(s, { type: 'task', teamId: team.id, ref: state.pending.ref, grade, amount });
    return endTurn(s);
  }
  if (isPending(state, 'mic')) {
    // Great wins the whole pot, OK half; Try again keeps the same prompt.
    const s = draft(state);
    const team = active(s);
    const amount = grade === 'great' ? s.pot : grade === 'ok' ? Math.min(s.pot, round10(s.pot / 2)) : 0;
    team.cash += amount;
    s.pot -= amount;
    if (grade !== 'try') s.micPos += 1;
    note(s, { type: 'mic', teamId: team.id, grade, amount });
    return endTurn(s);
  }
  return state;
}

function cardOk(state) {
  const p = state.pending;
  if (state.phase !== 'pending' || !p) return state;
  if (p.kind === 'info') {
    const s = draft(state);
    if (p.note === 'home') {
      const team = active(s);
      team.cash += 1;
      note(s, { type: 'home', teamId: team.id, square: p.square, amount: 1 });
    }
    return endTurn(s);
  }
  // Kommo's Nest and Park Magic tasks are whole-class: every team gets a star.
  if (p.kind === 'nest' || (p.kind === 'chance-task' && state.profile.mode === 'park')) {
    const s = draft(state);
    for (const t of s.teams) t.cash += 1;
    note(s, { type: 'allGain', amount: 1, ref: p.ref || null });
    return endTurn(s);
  }
  return state;
}

export function reduce(state, action) {
  const p = state.pending;
  switch (action.type) {
    case 'ROLL': {
      if (state.phase !== 'roll') return state;
      const value = action.value == null ? rollValue(state) : Number(action.value);
      if (!Number.isInteger(value) || value < 1 || value > 6) return state;
      const s = draft(state);
      const team = active(s);
      s.lastMove = moveBy(s, team, value);
      return land(s, team.pos);
    }
    case 'STAGE': {
      if (!isPending(state, 'question') || p.stage === 'revealed' || p.stage === action.stage || !STAGES.includes(action.stage)) return state;
      return { ...state, pending: { ...p, stage: action.stage } };
    }
    case 'REVEAL': {
      if (!isPending(state, 'question') || p.stage === 'revealed') return state;
      return { ...state, pending: { ...p, stage: 'revealed' } };
    }
    case 'TOGGLE': {
      if (!isPending(state, 'question') || p.stage !== 'revealed' || !(action.teamId in p.chips)) return state;
      return { ...state, pending: { ...p, chips: { ...p.chips, [action.teamId]: !p.chips[action.teamId] } } };
    }
    case 'REPLACE': {
      if (!isPending(state, 'question') || p.stage === 'revealed') return state;
      const s = draft(state);
      return swapItem(s) ? s : state;
    }
    case 'JOKER': return playJoker(state, action.kind);
    case 'CONTINUE': {
      if (!isPending(state, 'question') || p.stage !== 'revealed') return state;
      return settle(draft(state), !!action.ok);
    }
    case 'BUY': {
      if (!canBuy(state)) return state;
      const s = draft(state);
      const team = active(s);
      const price = priceOf(s, p.square);
      team.cash -= price;
      take(s, p.square, team, { type: 'buy', teamId: team.id, square: p.square, amount: price });
      return endTurn(s);
    }
    case 'PASS': {
      if (!isPending(state, 'deed')) return state;
      const s = draft(state);
      note(s, { type: 'passDeed', teamId: active(s).id, square: p.square });
      return endTurn(s);
    }
    case 'RATE': return rate(state, action.grade);
    case 'CARD_OK': return cardOk(state);
    case 'PICK': {
      const square = Number(action.square);
      if (!isPending(state, 'pick') || !freePlaces(state).includes(square)) return state;
      return ask(draft(state), 'claim', square, state.board[square].tier);
    }
    case 'FIX_START': {
      if (!isPending(state, 'garage')) return state;
      const s = draft(state);
      return pend(s, { kind: 'question', purpose: 'fix', errorIdx: nextError(s), stage: 'prompt', chips: {}, hidden: [] });
    }
    case 'PAY_OUT': {
      if (!isPending(state, 'garage') || state.profile.mode !== 'studio' || state.teams[state.turn].cash < PAY_OUT_FEE) return state;
      const s = draft(state);
      const team = active(s);
      team.cash -= PAY_OUT_FEE;
      team.jail = 0;
      s.pot += PAY_OUT_FEE;
      note(s, { type: 'free', teamId: team.id, how: 'pay', amount: PAY_OUT_FEE });
      s.phase = 'roll';
      s.pending = null;
      return s;
    }
    case 'WAIT': {
      if (!isPending(state, 'garage')) return state;
      const s = draft(state);
      active(s).jail = 0;
      note(s, { type: 'free', teamId: active(s).id, how: 'wait' });
      return endTurn(s);
    }
    case 'ADJUST': {
      const delta = Math.round(Number(action.delta) || 0);
      const i = state.teams.findIndex((t) => t.id === action.teamId);
      const cash = i < 0 ? 0 : Math.max(0, state.teams[i].cash + delta);
      if (i < 0 || cash === state.teams[i].cash) return state; // no delta, or nothing left to take
      const s = draft(state);
      const t = s.teams[i];
      const amount = cash - t.cash;
      t.cash = cash;
      // Logged only, as applied: a score fix never replaces the centre line.
      s.log = [...s.log, { type: 'adjust', teamId: t.id, amount }].slice(-LOG_MAX);
      return s;
    }
    case 'SET_TURN': {
      const i = Number(action.index);
      if (!(state.phase === 'roll' || isPending(state, 'garage')) || !Number.isInteger(i) || i < 0 || i >= state.teams.length || i === state.turn) return state;
      const s = draft(state);
      s.turn = i;
      return startTurn(s);
    }
    case 'FINAL_ROUND': {
      if (state.phase === 'end' || state.finalRound) return state;
      const s = draft(state);
      s.finalRound = true;
      note(s, { type: 'finalRound' });
      return s;
    }
    case 'FINISH': {
      if (state.phase === 'end') return state;
      return { ...state, phase: 'end', pending: null, finishedEarly: true };
    }
    default: return state;
  }
}

// Stüdyo and Arena rank by net worth, Oyun Parkı by stars.
export function ranking(state) {
  const r = state.teams.map((t, k) => ({ ...t, order: k, worth: netWorth(state, t), owned: ownedBy(state, t.id).length }))
    .sort((a, b) => b.worth - a.worth || a.order - b.order);
  r.forEach((t, k) => { t.place = k === 0 || t.worth !== r[k - 1].worth ? k : r[k - 1].place; });
  return r;
}

const PARK_TITLES = ['Brave Explorers', 'Star Catchers', 'Happy Sailors', 'Best Helpers', 'Sharp Eyes', 'Island Friends'];
export function endingTitles(state) {
  const mode = state.profile.mode;
  const owned = (t) => ownedBy(state, t.id).length;
  if (mode === 'studio') {
    // The net-worth table is the result; the MVP ribbon rewards the language.
    const top = ranking(state)[0];
    const mvp = state.teams.map((t) => ({ t, v: t.right + t.shadowRight })).sort((a, b) => b.v - a.v)[0];
    const awards = top ? [{ teamId: top.id, title: 'Top net worth' }] : [];
    if (mvp && mvp.v > 0) awards.push({ teamId: mvp.t.id, title: 'Language MVP' });
    return awards;
  }
  const used = new Set();
  const awards = [];
  const pick = (label, v, ok = () => true) => {
    const c = state.teams.filter((t) => !used.has(t.id) && ok(t)).map((t) => ({ t, v: v(t) })).sort((a, b) => b.v - a.v)[0];
    if (c) { used.add(c.t.id); awards.push({ teamId: c.t.id, title: label }); }
  };
  if (mode === 'arena') {
    pick('Most planets', owned, (t) => owned(t) > 0);
    pick('Longest streak', (t) => t.bestStreak, (t) => t.bestStreak > 1);
    pick('Top credits', (t) => t.cash);
    pick('Clean sheet', (t) => t.right, (t) => t.wrong === 0 && t.right > 0);
    for (const t of state.teams) if (!used.has(t.id)) { used.add(t.id); awards.push({ teamId: t.id, title: 'Team spirit' }); }
    return awards;
  }
  pick('Treasure Hunters', owned, (t) => owned(t) > 0);
  pick('Kind Visitors', (t) => t.visits, (t) => t.visits > 0);
  pick('Super Listeners', (t) => t.shadowRight, (t) => t.shadowRight > 0);
  let k = 0;
  for (const t of ranking(state)) if (!used.has(t.id)) { used.add(t.id); awards.push({ teamId: t.id, title: PARK_TITLES[k++ % PARK_TITLES.length] }); }
  return awards.map((a) => ({ ...a, treasures: ownedBy(state, a.teamId).length }));
}
