// Kategori Kapışması (Jeopardy-style category board): pure rules reducer.
// Columns are categories (topics or own packs), rows rise in value. The
// picking team plays for full value; every other team answers on its card
// too and earns half. One hidden double cell. Final: a secret wager
// (Arena/Stüdyo) or a whole-class Big Treasure (Oyun Parkı).
import { shuffleSeeded, rngFor } from '../../core/rng.mjs';
import { drawSeat } from '../../core/teams.mjs';
import { validateItem, presentMcq, presentVocab, wordCount } from '../../core/pack.mjs';

export const MAX_CATS = 6;

export function valuesFor(profile, rows) {
  const r = Math.max(2, Math.min(5, Number(rows) || (profile.mode === 'park' ? 3 : 5)));
  if (profile.mode === 'park') return [1, 2, 3, 4].slice(0, Math.min(4, r));
  return [100, 200, 300, 400, 500].slice(0, r);
}

// A rough "easier first" order: shorter stems and answers go to the top rows.
function effort(it) {
  if (it.type === 'vocab') return String(it.term || '').length;
  const opts = (it.options || []).join(' ');
  return wordCount(it.stem) * 3 + opts.length / 8;
}

export function createGame({ profile, cats, teams, rows = null, final = true, code, now = 0 }) {
  const values = valuesFor(profile, rows);
  const R = values.length;
  const items = {};
  const cells = [];
  const reserve = {};
  const columns = (cats || []).slice(0, MAX_CATS).map((c, col) => {
    const pool = shuffleSeeded((c.pack.items || []).filter((it) => validateItem(it).ok), `${code}:cat:${col}`);
    const capped = pool.filter((it) => wordCount(it.stem || it.statement || '') <= profile.wordCap);
    const usable = (capped.length >= R ? capped : pool).slice();
    const onBoard = usable.slice(0, R).sort((a, b) => effort(a) - effort(b));
    for (const it of usable) items[it.id] = { ...it, cat: col };
    onBoard.forEach((it, row) => cells.push({ id: `c${col}r${row}`, col, row, itemId: it.id, opened: false, by: null, result: null, double: false }));
    reserve[col] = usable.slice(R).map((it) => it.id);
    return { id: `cat${col}`, title: c.title, short: c.short || '' };
  });
  // One hidden double cell, never in the top row.
  const doubleable = cells.filter((c) => c.row > 0);
  if (doubleable.length) {
    const pick = doubleable[Math.floor(rngFor(`${code}:double`)() * doubleable.length)];
    pick.double = true;
  }
  return {
    v: 1,
    game: 'kategori',
    code,
    createdAt: now,
    profile,
    pack: { id: `board:${code}`, title: columns.map((c) => c.title).join(' · '), level: profile.level.toUpperCase(), origin: 'board' },
    cats: columns,
    values,
    items,
    cells,
    reserve,
    teams: teams.map((t) => ({ ...t, score: 0, right: 0, wrong: 0, shadowRight: 0, picks: 0 })),
    turn: 0,
    turnCount: 0,
    bags: {},
    phase: 'board',
    current: null,
    finalOn: !!final,
    final: null,
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
    const pool = Object.values(state.items).filter((it) => it.cat === item.cat);
    return presentVocab(item, pool, state.profile.optionCount, direction, seed);
  }
  return null;
}

export function cellValue(state, cell) {
  return state.values[cell.row] * (cell.double ? 2 : 1);
}

// Everyone else earns half (kids: one star), and never loses anything.
export function supportValue(state, cell) {
  if (state.profile.mode === 'park') return 1;
  return Math.max(10, Math.round(state.values[cell.row] / 2 / 10) * 10);
}

export function remainingCells(state) {
  return state.cells.filter((c) => !c.opened).length;
}

function cloneTeams(state) { return state.teams.map((t) => ({ ...t })); }
function bump(stats, id, right) { const s = stats[id] || { right: 0, total: 0 }; return { ...stats, [id]: { right: s.right + (right ? 1 : 0), total: s.total + 1 } }; }
function addMissed(list, id) { return list.includes(id) ? list : [...list, id]; }

export function reduce(state, action) {
  switch (action.type) {
    case 'OPEN': {
      if (state.phase !== 'board') return state;
      const cell = state.cells.find((c) => c.id === action.cellId);
      if (!cell || cell.opened) return state;
      const team = state.teams[state.turn];
      const { seat, bag } = drawSeat(state.bags[team.id], team.seats, rngFor(`${state.code}:seat:${state.turnCount}`));
      const chips = {};
      for (const t of state.teams) chips[t.id] = true;
      return { ...state, phase: 'question', bags: { ...state.bags, [team.id]: bag }, current: { cell: cell.id, itemId: cell.itemId, seat, stage: 'prompt', chips, double: cell.double } };
    }
    case 'STAGE': {
      const cur = state.phase === 'final' ? state.final : state.current;
      if (!cur || cur.stage === action.stage) return state;
      return state.phase === 'final' ? { ...state, final: { ...cur, stage: action.stage } } : { ...state, current: { ...cur, stage: action.stage } };
    }
    case 'REVEAL': {
      if (state.phase === 'final') {
        const f = state.final;
        if (!f || f.stage === 'revealed' || f.stage === 'wager') return state;
        return { ...state, final: { ...f, stage: 'revealed' } };
      }
      const cur = state.current;
      if (!cur || cur.stage === 'revealed') return state;
      return { ...state, current: { ...cur, stage: 'revealed' } };
    }
    case 'TOGGLE': {
      const cur = state.phase === 'final' ? state.final : state.current;
      if (!cur || cur.stage !== 'revealed' || !(action.teamId in cur.chips)) return state;
      const next = { ...cur, chips: { ...cur.chips, [action.teamId]: !cur.chips[action.teamId] } };
      return state.phase === 'final' ? { ...state, final: next } : { ...state, current: next };
    }
    case 'REPLACE': {
      const cur = state.current;
      if (state.phase !== 'question' || !cur || cur.stage === 'revealed') return state;
      const cell = state.cells.find((c) => c.id === cur.cell);
      const spare = (state.reserve[cell.col] || [])[0];
      if (!spare) return state;
      const reserve = { ...state.reserve, [cell.col]: [...state.reserve[cell.col].slice(1), cur.itemId] };
      const cells = state.cells.map((c) => (c.id === cell.id ? { ...c, itemId: spare } : c));
      return { ...state, reserve, cells, current: { ...cur, itemId: spare, stage: 'prompt' } };
    }
    case 'CONTINUE': return score(state);
    case 'WAGER_DONE': {
      const f = state.final;
      if (state.phase !== 'final' || !f || f.stage !== 'wager') return state;
      return { ...state, final: { ...f, stage: 'prompt' } };
    }
    case 'WAGER': {
      const f = state.final;
      if (state.phase !== 'final' || !f) return state;
      const team = state.teams.find((t) => t.id === action.teamId);
      if (!team) return state;
      const amount = Math.max(0, Math.min(team.score, Math.round(Number(action.amount) || 0)));
      return { ...state, final: { ...f, wagers: { ...f.wagers, [team.id]: amount } } };
    }
    case 'FINAL_APPLY': return applyFinal(state);
    case 'ADJUST': {
      const teams = cloneTeams(state);
      const t = teams.find((x) => x.id === action.teamId);
      if (!t) return state;
      t.score = Math.max(0, t.score + Number(action.delta || 0));
      return { ...state, teams };
    }
    case 'SET_TURN': {
      const i = Number(action.index);
      if (state.phase !== 'board' || !Number.isInteger(i) || i < 0 || i >= state.teams.length) return state;
      return { ...state, turn: i };
    }
    case 'TO_FINAL': return state.phase === 'board' || state.phase === 'question' ? startFinal({ ...state, current: null }) : state;
    case 'FINISH': return { ...state, phase: 'end', current: null, final: null, finishedEarly: remainingCells(state) > 0 };
    default: return state;
  }
}

function score(state) {
  const cur = state.current;
  if (state.phase !== 'question' || !cur || cur.stage !== 'revealed') return state;
  const cell = state.cells.find((c) => c.id === cur.cell);
  const teams = cloneTeams(state);
  const picker = teams[state.turn];
  let stats = state.itemStats;
  let anyWrong = false;
  for (const t of teams) {
    const right = !!cur.chips[t.id];
    stats = bump(stats, cur.itemId, right);
    if (!right) { if (t === picker) picker.wrong += 1; anyWrong = true; continue; }
    if (t === picker) { t.score += cellValue(state, cell); t.right += 1; }
    else { t.score += supportValue(state, cell); t.shadowRight += 1; }
  }
  picker.picks += 1;
  const cells = state.cells.map((c) => (c.id === cell.id ? { ...c, opened: true, by: picker.id, result: cur.chips[picker.id] ? 'right' : 'wrong' } : c));
  const next = {
    ...state,
    teams,
    cells,
    itemStats: stats,
    missed: anyWrong ? addMissed(state.missed, cur.itemId) : state.missed,
    current: null,
    turn: (state.turn + 1) % teams.length,
    turnCount: state.turnCount + 1,
    phase: 'board',
  };
  return cells.every((c) => c.opened) ? (state.finalOn ? startFinal(next) : { ...next, phase: 'end' }) : next;
}

// Final question: the hardest unused item (longest), from any category.
function startFinal(state) {
  const used = new Set(state.cells.map((c) => c.itemId));
  const spare = Object.values(state.reserve).flat().filter((id) => !used.has(id));
  const pool = spare.length ? spare : state.cells.map((c) => c.itemId);
  const itemId = pool.map((id) => state.items[id]).filter(Boolean).sort((a, b) => effort(b) - effort(a))[0]?.id;
  if (!itemId) return { ...state, phase: 'end' };
  const chips = {};
  for (const t of state.teams) chips[t.id] = true;
  const kids = state.profile.mode === 'park';
  return { ...state, phase: 'final', current: null, final: { itemId, stage: kids ? 'prompt' : 'wager', chips, wagers: {} } };
}

function applyFinal(state) {
  const f = state.final;
  if (state.phase !== 'final' || !f || f.stage !== 'revealed') return state;
  const teams = cloneTeams(state);
  const kids = state.profile.mode === 'park';
  let stats = state.itemStats;
  for (const t of teams) {
    const right = !!f.chips[t.id];
    stats = bump(stats, f.itemId, right);
    if (kids) { if (right) t.score += 3; continue; }
    const w = Math.min(t.score, f.wagers[t.id] || 0);
    t.score = Math.max(0, t.score + (right ? w : -w));
  }
  return { ...state, teams, itemStats: stats, phase: 'end', final: { ...f, applied: true } };
}

export function ranking(state) {
  const r = state.teams.map((t) => ({ ...t })).sort((a, b) => b.score - a.score || a.index - b.index);
  r.forEach((t, k) => { t.place = k === 0 || t.score !== r[k - 1].score ? k : r[k - 1].place; });
  return r;
}

const PARK_TITLES = ['Treasure Hunters', 'Super Listeners', 'Star Catchers', 'Best Helpers', 'Brave Explorers', 'Sharp Eyes'];
export function endingTitles(state) {
  if (state.profile.mode === 'park') {
    return ranking(state).map((t, k) => ({ teamId: t.id, title: PARK_TITLES[k % PARK_TITLES.length] }));
  }
  const used = new Set();
  const awards = [];
  const pick = (label, v, ok = () => true) => {
    const c = state.teams.filter((t) => !used.has(t.id) && ok(t)).map((t) => ({ t, v: v(t) })).sort((a, b) => b.v - a.v)[0];
    if (c) { used.add(c.t.id); awards.push({ teamId: c.t.id, title: label }); }
  };
  pick('Top score', (t) => t.score);
  pick('Sharpest cards', (t) => t.shadowRight, (t) => t.shadowRight > 0);
  pick('Clean sheet', (t) => t.right, (t) => t.wrong === 0 && t.right > 0);
  for (const t of state.teams) if (!used.has(t.id)) { used.add(t.id); awards.push({ teamId: t.id, title: 'Team spirit' }); }
  return awards;
}
