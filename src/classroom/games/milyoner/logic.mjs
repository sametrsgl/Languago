// Milyoner Merdiveni: game rules as a pure reducer (no DOM).
// Each team climbs its own ladder; the low rungs are played together, then
// teams take turns (relay). Lock-in -> "Göster" -> reveal, three phone-free
// lifelines, safe steps. Kids never fall; Arena stays put; Stüdyo falls back
// to the last safe step.
import { shuffleSeeded, rngFor } from '../../core/rng.mjs';
import { drawSeat } from '../../core/teams.mjs';
import { itemsForBoard, presentMcq, presentVocab } from '../../core/pack.mjs';

export const LIFELINES = ['fifty', 'poll', 'friend'];
export const SPARKS_PER_REFILL = 3;

// Ladder length and safe steps per class (teacher may override the length).
export function ladderFor(profile, length = null) {
  let n = Number(length) || 0;
  if (![6, 8, 10, 12].includes(n)) {
    if (profile.mode === 'park') n = profile.level === 'a1' ? 8 : 10;
    else if (profile.mode === 'arena') n = profile.level === 'a1' || profile.level === 'a2' ? 10 : 12;
    else n = profile.level === 'a1' ? 10 : 12;
  }
  const safe = [Math.round(n / 3), Math.round((2 * n) / 3)];
  return { length: n, safe };
}

// Arena rank names for a tower of n rungs (checkpoint rungs are the safe steps).
const RANKS_12 = ['Bronze I', 'Bronze II', 'Bronze III', 'Silver I', 'Silver II', 'Gold I', 'Gold II', 'Platinum', 'Diamond I', 'Diamond II', 'Master', 'Legend'];
export function rankName(rung, length) {
  if (rung <= 0) return 'Rookie';
  const idx = Math.round(((rung - 1) * (RANKS_12.length - 1)) / Math.max(1, length - 1));
  return RANKS_12[Math.min(RANKS_12.length - 1, idx)];
}

// Stüdyo shows a light-hearted points ladder (100 ... 1 000 000).
const VALUES_12 = [100, 200, 300, 500, 1000, 2000, 4000, 8000, 16000, 64000, 250000, 1000000];
export function rungValue(rung, length) {
  if (rung <= 0) return 0;
  const idx = Math.round(((rung - 1) * (VALUES_12.length - 1)) / Math.max(1, length - 1));
  return VALUES_12[Math.min(VALUES_12.length - 1, idx)];
}

// Arena XP by band: low 10, middle 20, top 30.
export function bandXp(rung, length) {
  const f = rung / length;
  return f <= 1 / 3 ? 10 : f <= 2 / 3 ? 20 : 30;
}

export function createGame({ profile, pack, teams, ladderLength = null, together = true, code, now = 0 }) {
  const ladder = ladderFor(profile, ladderLength);
  // Enough questions for every team to reach the top, plus spares.
  const need = Math.max(12, ladder.length * Math.max(1, teams.length) + 6);
  const { onBoard, reserve } = itemsForBoard(pack, need, code, { wordCap: profile.wordCap });
  const all = [...onBoard, ...reserve];
  const items = {};
  for (const it of all) items[it.id] = it;
  const togetherLeft = together && teams.length > 1 ? Math.max(0, ladder.safe[0]) : 0;
  return {
    v: 1,
    game: 'milyoner',
    code,
    createdAt: now,
    profile,
    pack: { id: pack.id, title: pack.title, level: pack.level, origin: pack.origin },
    ladder,
    items,
    queue: all.map((it) => it.id),
    teams: teams.map((t) => ({
      ...t, rung: 0, safeRung: 0, stars: 0, xp: 0, streak: 0, bestStreak: 0, sparks: 0,
      lifelines: { fifty: true, poll: true, friend: teams.length > 1 ? true : null }, right: 0, wrong: 0, turns: 0, lifelinesUsed: 0,
    })),
    togetherLeft,
    turn: 0,
    turnCount: 0,
    finishing: false,
    bags: {},
    phase: 'ladder',
    current: null,
    last: null,
    classStars: 0,
    missed: [],
    itemStats: {},
  };
}

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

function cloneTeams(state) {
  return state.teams.map((t) => ({ ...t, lifelines: { ...t.lifelines } }));
}

function bump(stats, itemId, right) {
  const s = stats[itemId] || { right: 0, total: 0 };
  return { ...stats, [itemId]: { right: s.right + (right ? 1 : 0), total: s.total + 1 } };
}

function addMissed(list, id) { return list.includes(id) ? list : [...list, id]; }

// Climb one rung; reaching a safe step makes it the new floor.
function climb(team, ladder) {
  team.rung = Math.min(ladder.length, team.rung + 1);
  if (ladder.safe.includes(team.rung) || team.rung === ladder.length) team.safeRung = Math.max(team.safeRung, team.rung);
}

// Shadow sparks: 3 sparks give back one used lifeline.
function addSpark(team) {
  team.sparks += 1;
  if (team.sparks >= SPARKS_PER_REFILL) {
    // Lifelines are true (ready), false (used) or null (not in this game).
    const used = LIFELINES.find((k) => team.lifelines[k] === false);
    if (used) { team.lifelines[used] = true; team.sparks -= SPARKS_PER_REFILL; team.refilled = (team.refilled || 0) + 1; }
    else team.sparks = SPARKS_PER_REFILL; // nothing to refill: keep it full
  }
}

export function reduce(state, action) {
  switch (action.type) {
    case 'NEXT_QUESTION': return nextQuestion(state);
    case 'STAGE': {
      if (!state.current || state.current.stage === action.stage) return state;
      return { ...state, current: { ...state.current, stage: action.stage } };
    }
    case 'LOCK': {
      const cur = state.current;
      if (!cur || cur.kind !== 'relay' || cur.stage === 'revealed') return state;
      const pres = presented(state, cur.itemId, cur.salt);
      const i = Number(action.choice);
      if (!pres || !Number.isInteger(i) || i < 0 || i >= pres.options.length || (cur.removed || []).includes(i)) return state;
      return { ...state, current: { ...cur, lock: i, stage: 'locked' } };
    }
    case 'UNLOCK': {
      const cur = state.current;
      if (!cur || cur.stage !== 'locked') return state;
      return { ...state, current: { ...cur, lock: null, stage: 'talk' } };
    }
    case 'REVEAL': return reveal(state);
    case 'TOGGLE': {
      const cur = state.current;
      if (!cur || cur.stage !== 'revealed' || !(action.teamId in cur.chips)) return state;
      return { ...state, current: { ...cur, chips: { ...cur.chips, [action.teamId]: !cur.chips[action.teamId] } } };
    }
    case 'ALL_CHIPS': {
      const cur = state.current;
      if (!cur || cur.stage !== 'revealed') return state;
      const chips = {};
      for (const k of Object.keys(cur.chips)) chips[k] = !!action.value;
      return { ...state, current: { ...cur, chips } };
    }
    case 'SAID': {
      // Oyun Parkı: after a miss the team repeats the answer and still climbs (no star).
      const cur = state.current;
      if (!cur || cur.kind !== 'relay' || cur.stage !== 'revealed' || cur.activeRight || cur.said || state.profile.mode !== 'park') return state;
      const teams = cloneTeams(state);
      climb(teams[state.turn], state.ladder);
      return { ...state, teams, current: { ...cur, said: true } };
    }
    case 'LIFELINE': return lifeline(state, action);
    case 'POLL': {
      const cur = state.current;
      if (!cur || !cur.poll || cur.stage === 'revealed') return state;
      const i = Number(action.option);
      const level = Math.max(0, Math.min(3, Number(action.level) || 0));
      const poll = cur.poll.slice(); poll[i] = level;
      return { ...state, current: { ...cur, poll } };
    }
    case 'REPLACE': {
      const cur = state.current;
      if (!cur || cur.stage === 'revealed' || !state.queue.length) return state;
      const [fresh, ...rest] = state.queue;
      return { ...state, queue: [...rest, cur.itemId], current: { ...cur, itemId: fresh, stage: 'prompt', lock: null, removed: [], poll: null, friend: null } };
    }
    case 'CONTINUE': return proceed(state);
    case 'ADJUST_RUNG': {
      const teams = cloneTeams(state);
      const t = teams.find((x) => x.id === action.teamId);
      if (!t) return state;
      t.rung = Math.max(0, Math.min(state.ladder.length, t.rung + Number(action.delta || 0)));
      t.safeRung = Math.min(t.safeRung, t.rung);
      if (state.ladder.safe.includes(t.rung)) t.safeRung = Math.max(t.safeRung, t.rung);
      return { ...state, teams };
    }
    case 'SET_TURN': {
      const i = Number(action.index);
      if (state.phase !== 'ladder' || !Number.isInteger(i) || i < 0 || i >= state.teams.length) return state;
      return { ...state, turn: i };
    }
    case 'FINISH': return { ...state, phase: 'end', current: null, finishedEarly: true };
    default: return state;
  }
}

function nextQuestion(state) {
  if (state.phase !== 'ladder') return state;
  if (!state.queue.length) return { ...state, phase: 'end', current: null, outOfQuestions: true };
  const [itemId, ...rest] = state.queue;
  if (state.togetherLeft > 0) {
    const chips = {};
    for (const t of state.teams) chips[t.id] = true;
    return { ...state, queue: rest, phase: 'question', current: { kind: 'together', itemId, salt: '', stage: 'prompt', lock: null, removed: [], poll: null, friend: null, chips, seat: null } };
  }
  const team = state.teams[state.turn];
  const rng = rngFor(`${state.code}:seat:${state.turnCount}`);
  const { seat, bag } = drawSeat(state.bags[team.id], team.seats, rng);
  const chips = {};
  for (const t of state.teams) if (t.id !== team.id) chips[t.id] = true;
  return {
    ...state,
    queue: rest,
    bags: { ...state.bags, [team.id]: bag },
    phase: 'question',
    current: { kind: 'relay', itemId, salt: '', stage: 'prompt', lock: null, removed: [], poll: null, friend: null, chips, seat },
  };
}

function lifeline(state, { name, teamId }) {
  const cur = state.current;
  if (!cur || cur.kind !== 'relay' || cur.stage === 'revealed' || cur.stage === 'locked') return state;
  const teams = cloneTeams(state);
  const team = teams[state.turn];
  if (!team.lifelines[name]) return state;
  const pres = presented(state, cur.itemId, cur.salt);
  let next = { ...cur };
  if (name === 'fifty') {
    // Remove wrong options (2 of 3 with 4 options, 1 with 3), seeded.
    const wrong = pres.options.map((o, i) => (o.correct ? -1 : i)).filter((i) => i >= 0 && !(cur.removed || []).includes(i));
    const n = pres.options.length >= 4 ? 2 : 1;
    const removed = shuffleSeeded(wrong, `${state.code}:${cur.itemId}:fifty`).slice(0, n);
    next.removed = [...(cur.removed || []), ...removed];
  } else if (name === 'poll') {
    next.poll = pres.options.map(() => 0);
  } else if (name === 'friend') {
    const helper = teams.find((t) => t.id === teamId && t.id !== team.id);
    if (!helper) return state;
    next.friend = helper.id;
  } else return state;
  team.lifelines[name] = false;
  team.lifelinesUsed += 1;
  return { ...state, teams, current: next };
}

function reveal(state) {
  const cur = state.current;
  if (!cur || cur.stage === 'revealed') return state;
  const pres = presented(state, cur.itemId, cur.salt);
  if (!pres) return state;
  if (cur.kind === 'together') {
    return { ...state, current: { ...cur, stage: 'revealed' } };
  }
  if (cur.lock == null) return state;
  const right = cur.lock === pres.answer;
  const teams = cloneTeams(state);
  const team = teams[state.turn];
  const p = state.profile;
  const before = team.rung;
  let fell = 0;
  let gained = 0;
  if (right) {
    climb(team, state.ladder);
    team.right += 1;
    team.streak += 1;
    team.bestStreak = Math.max(team.bestStreak, team.streak);
    if (p.mode === 'park') team.stars += 1;
    if (p.mode === 'arena') {
      const combo = team.streak >= 5 ? 2 : team.streak >= 3 ? 1.5 : 1;
      gained = Math.round(bandXp(team.rung, state.ladder.length) * combo);
      team.xp += gained;
    }
  } else {
    team.wrong += 1;
    team.streak = 0;
    if (p.mode === 'studio') { fell = team.rung - team.safeRung; team.rung = team.safeRung; }
  }
  // A friend who helped earns a spark when the answer was right.
  if (right && cur.friend && p.mode !== 'park') {
    const helper = teams.find((t) => t.id === cur.friend);
    if (helper) addSpark(helper);
  }
  return {
    ...state,
    teams,
    itemStats: bump(state.itemStats, cur.itemId, right),
    missed: right ? state.missed : addMissed(state.missed, cur.itemId),
    classStars: state.classStars + (p.mode === 'park' && !right ? 1 : 0),
    current: { ...cur, stage: 'revealed', activeRight: right, from: before, fell, gained },
  };
}

function proceed(state) {
  const cur = state.current;
  if (!cur || cur.stage !== 'revealed') return state;
  const teams = cloneTeams(state);
  const p = state.profile;
  let stats = state.itemStats;
  let missed = state.missed;
  let classStars = state.classStars;
  const climbed = [];
  if (cur.kind === 'together') {
    let rightCount = 0;
    for (const t of teams) {
      const r = !!cur.chips[t.id];
      stats = bump(stats, cur.itemId, r);
      if (r) {
        const before = t.rung;
        climb(t, state.ladder);
        rightCount += 1;
        t.right += 1;
        if (p.mode === 'park') t.stars += 1;
        if (p.mode === 'arena') t.xp += bandXp(t.rung, state.ladder.length);
        if (t.rung > before) climbed.push(t.id);
      } else {
        t.wrong += 1;
      }
    }
    if (rightCount < teams.length) missed = addMissed(missed, cur.itemId);
    if (p.mode === 'park' && rightCount * 2 >= teams.length) classStars += 1;
    return finishStep({ ...state, teams, itemStats: stats, missed, classStars, togetherLeft: Math.max(0, state.togetherLeft - 1), last: { kind: 'together', climbed } }, false);
  }
  // Relay: other teams' cards. Arena: +5 XP "BONUS"; Arena/Stüdyo: a spark.
  let shadowRight = 0;
  for (const t of teams) {
    if (!(t.id in cur.chips)) continue;
    const r = !!cur.chips[t.id];
    stats = bump(stats, cur.itemId, r);
    if (r) {
      shadowRight += 1;
      if (p.mode === 'arena') t.xp += 5;
      if (p.mode !== 'park') addSpark(t);
    }
  }
  if (p.mode === 'park' && shadowRight * 2 >= Math.max(1, teams.length - 1) && teams.length > 1) classStars += 1;
  const active = teams[state.turn];
  active.turns += 1;
  const moved = active.rung !== (cur.from ?? active.rung);
  return finishStep({ ...state, teams, itemStats: stats, classStars, last: { kind: 'relay', team: active.id, right: !!cur.activeRight || !!cur.said, moved } }, true);
}

// After a question: move the turn on, and end when a team is at the top and
// every team has had the same number of turns (or the questions run out).
function finishStep(state, advance) {
  const top = state.teams.some((t) => t.rung >= state.ladder.length);
  const finishing = state.finishing || top;
  let turn = state.turn;
  let turnCount = state.turnCount;
  if (advance) {
    turn = (state.turn + 1) % state.teams.length;
    turnCount += 1;
  }
  const roundDone = advance ? turn === 0 : state.togetherLeft === 0 && top;
  const end = (finishing && (roundDone || state.teams.length === 1)) || !state.queue.length;
  return { ...state, turn, turnCount, finishing, phase: end ? 'end' : 'ladder', current: null, outOfQuestions: !state.queue.length && !top };
}

// ---- endings ---------------------------------------------------------------

export function standings(state) {
  const key = (t) => (state.profile.mode === 'arena' ? t.rung * 10000 + t.xp : t.rung * 100 + (t.stars || 0));
  const r = state.teams.map((t) => ({ ...t })).sort((a, b) => key(b) - key(a) || b.sparks - a.sparks || a.index - b.index);
  r.forEach((t, k) => { t.place = k === 0 || key(t) !== key(r[k - 1]) ? k : r[k - 1].place; });
  return r;
}

const PARK_TITLES = ['Moon Explorers', 'Star Pilots', 'Super Listeners', 'Brave Rocketeers', 'Best Helpers', 'Sharp Eyes', 'Space Heroes', 'Galaxy Team'];
export function endingTitles(state) {
  const teams = state.teams;
  if (state.profile.mode === 'park') {
    const order = teams.map((t, i) => ({ t, i, k: t.rung * 10 + t.stars })).sort((a, b) => b.k - a.k || a.i - b.i);
    return order.map(({ t }, k) => ({ teamId: t.id, title: PARK_TITLES[k % PARK_TITLES.length] }));
  }
  const awards = [];
  const used = new Set();
  const pick = (label, score, ok = () => true) => {
    const c = teams.filter((t) => !used.has(t.id) && ok(t)).map((t) => ({ t, v: score(t) })).sort((a, b) => b.v - a.v)[0];
    if (c) { used.add(c.t.id); awards.push({ teamId: c.t.id, title: label }); }
  };
  pick('Highest climb', (t) => t.rung * 100 + t.xp);
  pick('Longest streak', (t) => t.bestStreak, (t) => t.bestStreak > 1);
  pick('Sharpest cards', (t) => t.sparks + (t.refilled || 0) * SPARKS_PER_REFILL, (t) => t.sparks + (t.refilled || 0) > 0);
  pick('Clean sheet', (t) => t.right, (t) => t.lifelinesUsed === 0 && t.right > 0);
  for (const t of teams) if (!used.has(t.id)) { used.add(t.id); awards.push({ teamId: t.id, title: 'Team spirit' }); }
  return awards;
}
