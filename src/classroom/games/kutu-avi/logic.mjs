// Kutu Avı 2.0: game rules as a pure reducer (no DOM), so every rule is
// testable and undo/resume are just old states.
import { shuffleSeeded, rngFor } from '../../core/rng.mjs';
import { drawSeat } from '../../core/teams.mjs';
import { itemsForBoard, presentMcq, presentVocab, itemHint } from '../../core/pack.mjs';

export const SURPRISE_RATES = [0, 0.1, 0.2, 0.3];

// Surprise cards are engine data. Harshness: green (kind), yellow (targets a team).
export const CARDS = {
  treasure: { harshness: 'green', modes: ['park'], amount: 2, target: false, names: { park: 'Treasure!' }, say: { park: '+2 stars for your team.' } },
  rainbow: { harshness: 'green', modes: ['park'], amount: 1, target: false, names: { park: 'Rainbow!' }, say: { park: 'Every team gets a star.' } },
  brainbreak: { harshness: 'green', modes: ['park', 'arena', 'studio'], amount: 2, target: false, names: { park: 'Brain Break!', arena: 'Timeout', studio: 'Stretch break' }, say: { park: 'Everybody up! Do it together.', arena: '20-second challenge. Everyone stands!', studio: '20 seconds: stand up and stretch.' } },
  bonus: { harshness: 'green', modes: ['arena', 'studio'], amount: 10, target: false, names: { arena: 'Bonus +10', studio: 'Bonus' }, say: { arena: 'Free points!', studio: '+10 points.' } },
  everyone: { harshness: 'green', modes: ['arena', 'studio'], amount: 5, target: false, names: { arena: 'Everyone +5', studio: 'Round on the house' }, say: { arena: 'Every team +5.', studio: 'Every team +5.' } },
  double: { harshness: 'green', modes: ['arena', 'studio'], amount: 2, target: false, names: { arena: 'Double Up', studio: 'Double' }, say: { arena: 'Your next correct answer counts x2.', studio: 'Your next correct answer counts twice.' } },
  gift: { harshness: 'green', modes: ['studio'], amount: 10, target: true, names: { studio: 'Gift' }, say: { studio: 'Give 10 points to another team.' } },
  steal: { harshness: 'yellow', modes: ['arena', 'studio'], amount: 10, target: true, names: { arena: 'Steal 10', studio: 'Steal' }, say: { arena: 'Take 10 from a team you choose.', studio: 'Take 10 points from a team you choose.' } },
  swap: { harshness: 'yellow', modes: ['arena', 'studio'], amount: 0, target: true, names: { arena: 'Switch', studio: 'Change the order' }, say: { arena: 'Pick the team that plays next.', studio: 'Pick the team that plays next.' } },
};

// Cards whose reward doubles on a gold tile. Double and Switch have no amount.
export const GOLD_CARDS = new Set(['treasure', 'rainbow', 'brainbreak', 'bonus', 'everyone', 'gift', 'steal']);

export const BRAIN_BREAK_ACTIONS = ['Jump!', 'Clap your hands!', 'Turn around!', 'Touch your nose!', 'Wave hello!', 'Stamp your feet!', 'Sit down, stand up!', 'Hands up high!'];

export function deckFor(profile, allowYellow = null) {
  const yellow = allowYellow == null ? profile.harshness.includes('yellow') : allowYellow;
  return Object.entries(CARDS)
    .filter(([, c]) => c.modes.includes(profile.mode))
    .filter(([, c]) => c.harshness === 'green' || (c.harshness === 'yellow' && yellow && !profile.nazik))
    .map(([id]) => id);
}

export function baseValue(profile) {
  return profile.scoring === 'stars' ? 1 : 10;
}

// pool: extra items (e.g. the whole original pack when replaying missed items) used
// for picture distractors and for the reserve, never placed on the board.
export function createGame({ profile, pack, teams, boardSize = 16, surpriseLevel = 1, code, allowYellow = null, now = 0, pool = [] }) {
  const level = Math.max(0, Math.min(profile.mode === 'studio' ? 3 : 2, Number(surpriseLevel) || 0));
  const size = Math.max(4, Math.min(30, Number(boardSize) || 16));
  const surpriseCount = Math.round(size * SURPRISE_RATES[level]);
  const positions = new Set(shuffleSeeded(Array.from({ length: size }, (_, i) => i + 1), `${code}:power`).slice(0, surpriseCount));
  const questionCount = size - surpriseCount;
  const { onBoard, reserve } = itemsForBoard(pack, questionCount, code, { wordCap: profile.wordCap });
  const deck = deckFor(profile, allowYellow);
  const items = {};
  for (const it of [...onBoard, ...reserve]) items[it.id] = it;
  const extra = shuffleSeeded((pool || []).filter((it) => it && it.id && !items[it.id]), `${code}:pool`);
  for (const it of extra) items[it.id] = it;
  const reserveIds = [...reserve.map((it) => it.id), ...extra.map((it) => it.id)];
  let qi = 0;
  const tiles = [];
  for (let n = 1; n <= size; n++) {
    if (positions.has(n) && deck.length) {
      const pick = deck[Math.floor(rngFor(`${code}:card:${n}`)() * deck.length)];
      tiles.push({ n, kind: 'card', cardId: pick, opened: false, by: null, result: null });
    } else {
      const it = onBoard[qi++];
      tiles.push(it ? { n, kind: 'question', itemId: it.id, opened: false, by: null, result: null } : { n, kind: 'empty', opened: true, by: null, result: 'empty' });
    }
  }
  return {
    v: 1,
    game: 'kutu-avi',
    code,
    createdAt: now,
    profile,
    pack: { id: pack.id, title: pack.title, level: pack.level, origin: pack.origin },
    teams: teams.map((t) => ({ ...t, score: 0, right: 0, wrong: 0, streak: 0, bestStreak: 0, shadowRight: 0, steals: 0, gifts: 0, double: false, halfScore: null })),
    items,
    tiles,
    reserve: reserveIds,
    turn: 0,
    turnCount: 0,
    forcedNext: null,
    resumeTurn: null,
    skips: [],
    bags: {},
    phase: 'board',
    current: null,
    classStars: 0,
    missed: [],
    itemStats: {},
    allowYellow: deck.some((id) => CARDS[id].harshness === 'yellow'),
  };
}

export function remainingTiles(state) {
  return state.tiles.filter((t) => !t.opened && t.kind !== 'empty').length;
}

// The last 3 unopened tiles are gold and count double.
export function isGold(state, tile) {
  // Tiny boards (e.g. replaying 2-3 missed items) are not all gold.
  const playable = state.tiles.filter((t) => t.kind !== 'empty').length;
  return !tile.opened && playable > 3 && remainingTiles(state) <= 3;
}

// How an item looks on screen for this class (options order, pictures).
// Deterministic from the board code, so undo/resume show the same question.
export function presented(state, itemId, salt = '') {
  const item = state.items[itemId];
  if (!item) return null;
  const seed = `${state.code}:${itemId}${salt}`;
  if (item.type === 'mcq') return presentMcq(item, state.profile.optionCount, seed);
  if (item.type === 'vocab') {
    const direction = state.profile.young && state.profile.level === 'a1' ? 'find' : 'name';
    return presentVocab(item, Object.values(state.items), state.profile.optionCount, direction, seed);
  }
  return null;
}

export function tileValue(state, cur) {
  const base = baseValue(state.profile);
  let v = base * (cur.gold ? 2 : 1);
  const hints = (cur.hints || []).length;
  if (state.profile.mode === 'arena') v = Math.max(0, v - 2 * hints);
  if (state.profile.mode === 'studio') v = Math.max(0, Math.round(v * (1 - 0.2 * hints)));
  // Oyun Parkı second try: one star less, never below one.
  if (state.profile.mode === 'park' && cur.tries > 1) v = Math.max(1, v - 1);
  return v;
}

// The hint kinds this question can really serve, in ladder order. Kinds with
// nothing to show for this item are left out, so İpucu never costs points
// for an empty hint. The app disables İpucu once cur.hints.length reaches
// this list's length (or when nextHint returns null).
export function hintKinds(state, cur = state.current) {
  if (!cur || cur.kind !== 'question') return [];
  const { item, pres, seed } = hintContext(state, cur);
  const kinds = [];
  for (const kind of state.profile.hints || []) {
    if (kinds.includes(kind)) continue;
    if (kind === 'turkish' && state.profile.trGloss === false) continue;
    if (itemHint(item, pres, kind, seed)) kinds.push(kind);
  }
  return kinds;
}

// The hint the next İpucu press gives, or null when none is left.
export function nextHint(state) {
  const cur = state.current;
  if (!cur || cur.kind !== 'question' || cur.stage === 'revealed') return null;
  const kind = hintKinds(state, cur)[(cur.hints || []).length];
  if (!kind) return null;
  const { item, pres, seed } = hintContext(state, cur);
  return itemHint(item, pres, kind, seed);
}

function hintContext(state, cur) {
  return {
    item: state.items[cur.itemId],
    pres: presented(state, cur.itemId, cur.tries > 1 ? ':retry' : ''),
    seed: `${state.code}:${cur.itemId}`,
  };
}

function comboMultiplier(team) {
  // Counted on the team's own turns only: 2 in a row = x1.5, 3+ = x2.
  if (team.streak >= 3) return 2;
  if (team.streak >= 2) return 1.5;
  return 1;
}

function isTrailing(state, team) {
  const scores = state.teams.map((t) => t.score);
  const min = Math.min(...scores);
  const max = Math.max(...scores);
  return team.score === min && max - min >= 20 && scores.filter((s) => s === min).length === 1;
}

function cloneTeams(state) {
  return state.teams.map((t) => ({ ...t }));
}

function nextTurnIndex(state, from = state.turn) {
  return (from + 1) % state.teams.length;
}

// Who plays next when no card steps in. After a Switch the rotation goes
// back to the team that was due (resumeTurn), and the chosen team's own turn
// in the rotation is skipped once (skips), so nobody loses or gains a turn.
function naturalNext(state) {
  let resumeTurn = state.resumeTurn ?? null;
  const skips = [...(state.skips || [])];
  let turn;
  if (resumeTurn != null) { turn = resumeTurn; resumeTurn = null; } else turn = nextTurnIndex(state);
  for (let guard = 0; guard < state.teams.length && skips.includes(turn); guard++) {
    skips.splice(skips.indexOf(turn), 1);
    turn = nextTurnIndex(state, turn);
  }
  return { turn, resumeTurn, skips };
}

export function reduce(state, action) {
  switch (action.type) {
    case 'OPEN': return open(state, action);
    case 'STAGE': {
      if (!state.current || state.current.stage === action.stage) return state;
      return { ...state, current: { ...state.current, stage: action.stage } };
    }
    case 'HINT': return hint(state);
    case 'REPLACE': return replace(state);
    case 'ANSWER': return answer(state, action);
    case 'SHADOW': {
      const cur = state.current;
      if (!cur || cur.stage !== 'revealed') return state;
      const id = action.teamId;
      return { ...state, current: { ...cur, shadow: { ...cur.shadow, [id]: !cur.shadow[id] } } };
    }
    case 'SHADOW_ALL': {
      const cur = state.current;
      if (!cur || cur.stage !== 'revealed') return state;
      const shadow = {};
      for (const k of Object.keys(cur.shadow)) shadow[k] = !!action.value;
      return { ...state, current: { ...cur, shadow } };
    }
    case 'NEXT': return next(state);
    case 'CARD_TARGET': {
      const cur = state.current;
      if (!cur || cur.kind !== 'card') return state;
      return { ...state, current: { ...cur, target: action.teamId } };
    }
    case 'CARD_APPLY': return applyCard(state, action);
    case 'CARD_SKIP': return state.current && state.current.kind === 'card' ? closeTile(state, { result: 'skipped' }, state.teams) : state;
    case 'ADJUST': {
      const teams = cloneTeams(state);
      const t = teams.find((x) => x.id === action.teamId);
      if (!t) return state;
      t.score = Math.max(0, t.score + Number(action.delta || 0));
      return { ...state, teams };
    }
    case 'SET_TURN': {
      const i = Number(action.index);
      if (!Number.isInteger(i) || i < 0 || i >= state.teams.length || state.phase !== 'board') return state;
      return { ...state, turn: i, forcedNext: null, resumeTurn: null, skips: [] };
    }
    case 'SET_SEATS': {
      const teams = cloneTeams(state);
      const t = teams.find((x) => x.id === action.teamId);
      if (!t) return state;
      t.seats = Math.max(1, Math.min(8, Number(action.seats) || t.seats));
      return { ...state, teams };
    }
    case 'FINISH': return { ...state, phase: 'end', current: null, finishedEarly: remainingTiles(state) > 0 };
    case 'RESUME_BOARD': return state.phase === 'end' && remainingTiles(state) > 0 ? { ...state, phase: 'board', finishedEarly: false } : state;
    default: return state;
  }
}

function open(state, { n }) {
  if (state.phase !== 'board') return state;
  const tile = state.tiles.find((t) => t.n === n);
  if (!tile || tile.opened) return state;
  const team = state.teams[state.turn];
  const gold = isGold(state, tile);
  if (tile.kind === 'card') {
    return { ...state, phase: 'card', current: { kind: 'card', tile: n, cardId: tile.cardId, target: null, gold } };
  }
  const rng = rngFor(`${state.code}:seat:${state.turnCount}`);
  const { seat, bag } = drawSeat(state.bags[team.id], team.seats, rng);
  const shadow = {};
  for (const t of state.teams) if (t.id !== team.id) shadow[t.id] = true;
  return {
    ...state,
    phase: 'question',
    bags: { ...state.bags, [team.id]: bag },
    current: { kind: 'question', tile: n, itemId: tile.itemId, seat, stage: 'prompt', tries: 1, hints: [], chosen: null, activeRight: null, shadow, gold, points: 0 },
  };
}

function hint(state) {
  const data = nextHint(state);
  if (!data) return state;
  const cur = state.current;
  return { ...state, current: { ...cur, hints: [...cur.hints, data] } };
}

function replace(state) {
  const cur = state.current;
  if (!cur || cur.kind !== 'question' || cur.stage === 'revealed' || !state.reserve.length) return state;
  const [fresh, ...rest] = state.reserve;
  const tiles = state.tiles.map((t) => (t.n === cur.tile ? { ...t, itemId: fresh } : t));
  return { ...state, tiles, reserve: [...rest, cur.itemId], current: { ...cur, itemId: fresh, stage: 'prompt', hints: [] } };
}

function answer(state, { choice, right }) {
  const cur = state.current;
  if (!cur || cur.kind !== 'question' || cur.stage === 'revealed') return state;
  const pres = presented(state, cur.itemId, cur.tries > 1 ? ':retry' : '');
  const isRight = typeof right === 'boolean' ? right : (pres ? choice === pres.answer : false);
  const teams = cloneTeams(state);
  const team = teams[state.turn];
  const p = state.profile;

  // Oyun Parkı: a first miss gets a second try on a FRESH item (the answer to
  // the first one is already visible on the other teams' cards).
  if (!isRight && p.mode === 'park' && cur.tries === 1 && state.reserve.length) {
    const [fresh, ...rest] = state.reserve;
    const items = state.items;
    const stats = bumpStats(state.itemStats, cur.itemId, false);
    return {
      ...state,
      reserve: rest,
      itemStats: stats,
      missed: addMissed(state.missed, cur.itemId),
      current: { ...cur, firstItemId: cur.itemId, firstChoice: choice, itemId: fresh, tries: 2, stage: 'retry', hints: [], chosen: null },
      items,
    };
  }

  let points = 0;
  if (isRight) {
    let v = tileValue(state, cur);
    team.streak += 1;
    team.bestStreak = Math.max(team.bestStreak, team.streak);
    if (p.combo) v = Math.round(v * comboMultiplier(team));
    if (p.comeback === 'slipstream' && isTrailing(state, team)) v = Math.round(v * 1.5);
    if (team.double) { v *= 2; team.double = false; }
    team.score += v;
    team.right += 1;
    points = v;
  } else {
    team.streak = 0;
    team.wrong += 1;
  }
  const classStars = state.classStars + (p.mode === 'park' ? 1 : 0);
  return {
    ...state,
    teams,
    classStars,
    itemStats: bumpStats(state.itemStats, cur.itemId, isRight),
    missed: isRight ? state.missed : addMissed(state.missed, cur.itemId),
    current: { ...cur, stage: 'revealed', chosen: choice ?? null, activeRight: isRight, points },
  };
}

function next(state) {
  const cur = state.current;
  if (!cur) return state;
  if (cur.kind === 'card') return state;
  if (cur.stage !== 'revealed') return state;
  const teams = cloneTeams(state);
  const p = state.profile;
  let stats = state.itemStats;
  const active = teams[state.turn];
  let rebound = null;
  if (p.shadowScoring === 'teams') {
    const order = [];
    for (let k = 1; k < teams.length; k++) order.push(teams[(state.turn + k) % teams.length]);
    if (!cur.activeRight && p.rebound) {
      rebound = order.find((t) => cur.shadow[t.id]) || null;
      if (rebound) {
        rebound.score += Math.max(1, Math.round(tileValue(state, cur) / 2));
        rebound.steals += 1;
      }
    }
    // Every right board earns +5, the rebound team too: a steal never pays
    // less than a plain right board.
    for (const t of order) {
      const right = !!cur.shadow[t.id];
      stats = bumpStats(stats, cur.itemId, right);
      if (right) {
        t.shadowRight += 1;
        t.score += 5;
      }
    }
  }
  const result = cur.activeRight ? 'right' : 'wrong';
  return closeTile({ ...state, itemStats: stats }, { result, by: active.id }, teams);
}

function closeTile(state, { result, by = null }, teams) {
  const cur = state.current;
  const turnTeam = state.teams[state.turn];
  const tiles = state.tiles.map((t) => (t.n === cur.tile ? { ...t, opened: true, by: by || turnTeam.id, result } : t));
  const withTiles = { ...state, tiles, teams: teams.map((t) => ({ ...t })) };
  const left = remainingTiles(withTiles);
  const half = state.tiles.length / 2;
  const opened = state.tiles.length - left;
  const halfMark = opened >= half && withTiles.teams.every((t) => t.halfScore == null)
    ? withTiles.teams.map((t) => ({ ...t, halfScore: t.score }))
    : withTiles.teams;
  const nxt = state.forcedNext != null
    ? { turn: state.forcedNext, resumeTurn: state.resumeTurn ?? null, skips: state.skips || [] }
    : naturalNext(state);
  return {
    ...withTiles,
    teams: halfMark,
    current: null,
    phase: left === 0 ? 'end' : 'board',
    finishedEarly: false,
    turn: nxt.turn,
    forcedNext: null,
    resumeTurn: nxt.resumeTurn,
    skips: nxt.skips,
    turnCount: state.turnCount + 1,
  };
}

function applyCard(state) {
  const cur = state.current;
  if (!cur || cur.kind !== 'card') return state;
  const card = CARDS[cur.cardId];
  if (!card) return closeTile(state, { result: 'card' }, state.teams);
  if (card.target && !cur.target) return state;
  const teams = cloneTeams(state);
  const active = teams[state.turn];
  const mult = cur.gold ? 2 : 1;
  let forcedNext = null;
  let resumeTurn = state.resumeTurn ?? null;
  let skips = state.skips || [];
  let classStars = state.classStars;
  switch (cur.cardId) {
    case 'treasure': active.score += card.amount * mult; break;
    case 'rainbow': for (const t of teams) t.score += card.amount * mult; break;
    case 'brainbreak': active.score += (state.profile.scoring === 'stars' ? card.amount : 5) * mult; classStars += state.profile.mode === 'park' ? 1 : 0; break;
    case 'bonus': active.score += card.amount * mult; break;
    case 'everyone': for (const t of teams) t.score += card.amount * mult; break;
    case 'double': active.double = true; break;
    case 'gift': {
      const target = teams.find((t) => t.id === cur.target);
      if (target && target !== active) { target.score += card.amount * mult; active.gifts += 1; }
      break;
    }
    case 'steal': {
      const target = teams.find((t) => t.id === cur.target);
      if (target && target !== active) {
        const take = Math.min(card.amount * mult, target.score);
        target.score -= take; active.score += take; active.steals += 1;
      }
      break;
    }
    case 'swap': {
      // The chosen team jumps the queue: it plays now, the rotation then goes
      // back to the team that was due, and the chosen team's own turn in the
      // rotation is skipped once.
      const idx = teams.findIndex((t) => t.id === cur.target);
      if (idx >= 0 && idx !== state.turn) {
        const due = naturalNext(state);
        forcedNext = idx;
        resumeTurn = due.resumeTurn;
        skips = due.skips;
        if (idx !== due.turn) { resumeTurn = due.turn; skips = [...due.skips, idx]; }
      }
      break;
    }
    default: break;
  }
  return closeTile({ ...state, classStars, forcedNext, resumeTurn, skips }, { result: 'card' }, teams);
}

function bumpStats(stats, itemId, right) {
  const s = stats[itemId] || { right: 0, total: 0 };
  return { ...stats, [itemId]: { right: s.right + (right ? 1 : 0), total: s.total + 1 } };
}

function addMissed(list, itemId) {
  return list.includes(itemId) ? list : [...list, itemId];
}

// ---- endings ---------------------------------------------------------------

const PARK_TITLES = ['Super Listeners', 'Star Catchers', 'Bravest Guessers', 'Best Helpers', 'Loudest Echo', 'Brilliant Brains', 'Happy Hoppers', 'Team Sunshine'];

export function endingTitles(state) {
  const teams = state.teams;
  const mode = state.profile.mode;
  if (mode === 'park') {
    // Every team gets a warm title; no ranking is shown.
    const order = teams.map((t, i) => ({ t, i, key: t.right * 10 + t.bestStreak * 3 + t.score }))
      .sort((a, b) => b.key - a.key || a.i - b.i);
    return order.map(({ t }, k) => ({ teamId: t.id, title: PARK_TITLES[k % PARK_TITLES.length] }));
  }
  if (mode === 'arena') {
    // A stat title goes to the best team still without one, and only if that
    // team really earned it; a backwards label would read as mockery. Teams
    // left over get neutral titles that make no claim.
    const awards = [];
    const used = new Set();
    const gain = (t) => (t.halfScore == null ? null : t.score - t.halfScore);
    const pick = (label, scoreFn, earned) => {
      const cand = teams.filter((t) => !used.has(t.id)).map((t) => ({ t, v: scoreFn(t) })).sort((a, b) => b.v - a.v)[0];
      if (cand && earned(cand.t)) { used.add(cand.t.id); awards.push({ teamId: cand.t.id, title: label }); }
    };
    pick('Longest streak', (t) => t.bestStreak * 100 + t.score, (t) => t.bestStreak >= 2);
    pick('Sharpest boards', (t) => t.shadowRight * 100 + t.score, (t) => t.shadowRight > 0);
    pick('Comeback', (t) => gain(t) ?? -Infinity, (t) => gain(t) != null && gain(t) > 0);
    pick('Clean sheet', (t) => -t.wrong * 100 + t.right, (t) => t.wrong === 0 && t.right > 0);
    pick('Steal master', (t) => t.steals * 100 + t.score, (t) => t.steals > 0);
    const neutral = ['Team spirit', 'Cool heads', 'Never give up'];
    let k = 0;
    for (const t of teams) {
      if (!used.has(t.id)) awards.push({ teamId: t.id, title: neutral[k++ % neutral.length] });
    }
    return awards;
  }
  return [];
}

// Standings with a shared place for tied scores (competition ranking:
// 50, 50, 30 -> places 0, 0, 2). Show `place + 1`, not the array position.
export function ranking(state) {
  const r = state.teams.map((t, i) => ({ ...t, index: t.index ?? i }))
    .sort((a, b) => b.score - a.score || a.index - b.index);
  r.forEach((t, k) => { t.place = k === 0 || t.score !== r[k - 1].score ? k : r[k - 1].place; });
  return r;
}

export function hardestItem(state) {
  let worst = null;
  for (const [id, s] of Object.entries(state.itemStats)) {
    if (!s.total) continue;
    const share = s.right / s.total;
    if (!worst || share < worst.share || (share === worst.share && s.total > worst.total)) worst = { id, share, total: s.total };
  }
  return worst ? { item: state.items[worst.id], share: worst.share } : null;
}
