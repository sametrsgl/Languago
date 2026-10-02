// Konuşma Çarkı (speaking wheel): pure rules reducer.
// One turn engine, four surfaces chosen by state.mode: the Çark ('wheel'),
// Just a Minute ('jam': kids "Talk Rocket", Arena "Mic Challenge", Stüdyo
// "Just a Minute"), Would You Rather ('wyr') and Herkes konuşur ('everyone':
// small groups all talk at once, unscored). The teacher always judges; the
// app never listens. Teams take turns in order and the seat is drawn from a
// fair bag. Randomness is seeded by the board code, so an undo never
// re-spins the wheel or re-draws a seat.
import { shuffleSeeded, rngFor } from '../../core/rng.mjs';
import { drawSeat } from '../../core/teams.mjs';

export const MAX_TOPICS = 4;
export const MAX_TEAMS = 6;
export const MODES = ['wheel', 'jam', 'wyr', 'everyone'];
export const MODE_LABELS = { wheel: 'Çark', jam: 'Just a Minute', wyr: 'Would You Rather', everyone: 'Herkes konuşur' };
export const JAM_NAMES = { park: 'Talk Rocket', arena: 'Mic Challenge', studio: 'Just a Minute' };
export const SHOW_NAMES = { park: 'Talk Island', arena: 'Mic Challenge', studio: 'Speaking Night' };
export const SPEAK_MODES = ['talk', 'describe', 'opinion', 'hypothetical', 'ask', 'wyr'];
// Only "open" prompts can fill a minute.
export const JAM_MODES = ['talk', 'describe', 'opinion', 'hypothetical'];
export const LEVEL_ORDER = ['a1', 'a2', 'b1', 'b2'];

export const SEGMENTS = { min: 6, max: 12 };
export const DEFAULT_OPTIONS = { segments: 8, removeUsed: true, difficulty: 'orta', easier: false, groupSize: 4, wyrVote: 'stand', bestReason: false };

// A1-A2 count tapped sentences; B1-B2 count seconds (Stüdyo talks longer).
export const TARGETS = {
  sentences: { a1: 3, a2: 4 },
  seconds: { park: { b1: 40, b2: 45 }, arena: { b1: 40, b2: 45 }, studio: { b1: 60, b2: 60 } },
};
// "Kolay / Orta / Zor": target, helper words shown, starters on screen.
export const DIFFICULTY = {
  kolay: { sentences: -1, seconds: -10, helpers: 5, starters: true },
  orta: { sentences: 0, seconds: 0, helpers: 3, starters: true },
  zor: { sentences: 1, seconds: 10, helpers: 0, starters: false },
};
export const HUDDLE = { park: 10, arena: 15, studio: 20 };
export const HUDDLE_PLUS = 10;
export const JAM_THINK = 10;
export const MAX_SENTENCES = 20;

// Oyun Parkı: up to three stars a turn, and stars never go down.
export const STAR_KEYS = ['spoke', 'helper', 'finished'];
export const STAR_LABELS = {
  spoke: { en: 'You spoke!', tr: 'Konuştu' },
  helper: { en: 'Helper words', tr: 'Yardımcı kelime veya kalıp kullandı' },
  finished: { en: 'Finished!', tr: 'Hedefi tamamladı' },
};
// Arena and Stüdyo: one grade a turn. Great is a "clean turn".
export const GRADES = ['great', 'good', 'tried'];
export const GRADE_POINTS = { great: 3, good: 2, tried: 1 };
export const GRADE_LABELS = { great: { en: 'Great', tr: 'Harika' }, good: { en: 'Good', tr: 'İyi' }, tried: { en: 'Tried', tr: 'Denedi' } };
// Arena combo for a team's consecutive clean turns (rounded up).
export const COMBO = [{ at: 5, x: 2 }, { at: 3, x: 1.5 }];
export const POINTS = { followUp: 1, sharpEars: 1, wrongChallenge: 1, whistle: 2, cleanMinute: 3, bestReason: 1, hint: 1 };

// Just a Minute challenge reasons, and the level each one starts at.
export const REASONS = {
  H: { en: 'Hesitation', tr: 'Duraksama', from: 'a2' },
  D: { en: 'Off topic', tr: 'Konu dışı', from: 'b1' },
  R: { en: 'Repetition', tr: 'Tekrar', from: 'b2' },
};
export const HESITATION_SECS = { a1: 5, a2: 5, b1: 4, b2: 3 };
export const MAX_WRONG_CHALLENGES = 2;

// Help rungs per look (Arena pays 1 point a rung, from that turn only).
export const HINT_LADDER = { park: ['picture', 'starter', 'model'], arena: ['useful', 'starter', 'model'], studio: ['useful', 'starter', 'tr'] };

// Would You Rather: the class votes with the body (only the text changes).
export const VOTE_TEXT = {
  stand: { a: 'Stand up for A', b: 'Sit down for B' },
  walls: { a: 'Go to the left wall for A', b: 'Go to the right wall for B' },
  cards: { a: 'Show card A', b: 'Show card B' },
};
export const WYR_FRAMES = { reason: "I'd rather ... because ...", back: "But if you ..., you'd ...", concession: "Even though ..., I'd still ..." };

const LOG_MAX = 30;
const SPEECH_KINDS = ['wheel', 'jam'];
const WHEEL_STAGES = ['turn', 'card', 'talk', 'followup', 'award'];

export function audienceFor(profile) {
  if (!profile || !profile.young) return 'adults';
  return profile.mode === 'park' ? 'kids' : 'teens';
}

export function normalizeOptions(options) {
  const o = options || {};
  const seg = Math.round(Number(o.segments));
  return {
    segments: o.segments == null || !Number.isFinite(seg) ? DEFAULT_OPTIONS.segments : Math.max(SEGMENTS.min, Math.min(SEGMENTS.max, seg)),
    removeUsed: o.removeUsed !== false,
    difficulty: DIFFICULTY[o.difficulty] ? o.difficulty : DEFAULT_OPTIONS.difficulty,
    easier: !!o.easier,
    groupSize: Number(o.groupSize) === 3 ? 3 : 4,
    wyrVote: VOTE_TEXT[o.wyrVote] ? o.wyrVote : DEFAULT_OPTIONS.wyrVote,
    bestReason: !!o.bestReason,
  };
}

// The structural minimum a speak item needs to reach the stage (packs are
// fully validated upstream by validateItem).
export function isSpeakItem(it) {
  if (!it || typeof it !== 'object' || it.type !== 'speak' || !it.id) return false;
  if (!SPEAK_MODES.includes(it.mode) || !String(it.prompt || '').trim()) return false;
  if (it.mode === 'wyr') return !!(String(it.optA?.text || '').trim() && String(it.optB?.text || '').trim());
  return true;
}

export function labelOf(title) {
  return String(title || '').split(' · ').pop().trim();
}

function lowerLevel(level) {
  const i = LEVEL_ORDER.indexOf(level);
  return i > 0 ? LEVEL_ORDER[i - 1] : level;
}

// "Bir seviye kolaylaştır": the level below when the topic has it, else the
// group's own level, else whatever the topic has.
function byLevel(list, want, base) {
  const at = (lv) => list.filter((it) => it.level === lv);
  const w = at(want);
  if (w.length) return w;
  const b = at(base);
  return b.length ? b : list;
}

// Round robin over the topics, so a wheel mixes them evenly.
function interleave(lists) {
  const out = [];
  const longest = Math.max(0, ...lists.map((l) => l.length));
  for (let k = 0; k < longest; k++) for (const l of lists) if (k < l.length) out.push(l[k]);
  return out;
}

export function createGame({ profile, topics, teams, code, now = 0, mode = 'wheel', options = {} }) {
  const opts = normalizeOptions(options);
  const base = profile.level;
  const want = opts.easier ? lowerLevel(base) : base;
  const items = {};
  const talkLists = [];
  const wyrLists = [];
  const rows = (topics || []).slice(0, MAX_TOPICS).map((tp, t) => {
    // An item already used by an earlier topic stays there (no duplicates).
    const seen = new Set();
    const all = (tp.pack?.items || [])
      .filter((it) => isSpeakItem(it) && !items[it.id] && !seen.has(it.id) && seen.add(it.id))
      .map((it) => ({ ...it, level: String(it.level || '').toLowerCase() || null, topic: t }));
    const talk = byLevel(all.filter((it) => it.mode !== 'wyr'), want, base);
    const wyr = byLevel(all.filter((it) => it.mode === 'wyr'), want, base);
    for (const it of [...talk, ...wyr]) items[it.id] = it;
    talkLists.push(shuffleSeeded(talk.map((it) => it.id), `${code}:talk:${t}`));
    wyrLists.push(shuffleSeeded(wyr.map((it) => it.id), `${code}:wyr:${t}`));
    return { title: tp.title || '', label: labelOf(tp.title), count: talk.length + wyr.length };
  });
  const talk = interleave(talkLists);
  const pool = { talk, jam: talk.filter((id) => JAM_MODES.includes(items[id].mode)), wyr: interleave(wyrLists) };
  const state = {
    v: 1,
    game: 'konusma-carki',
    code,
    createdAt: now,
    profile,
    options: opts,
    topics: rows,
    items,
    pool,
    wheel: talk.slice(0, opts.segments),
    used: [],
    recycles: 0,
    teams: (teams || []).slice(0, MAX_TEAMS).map((t) => ({
      ...t, score: 0, stars: 0, turns: 0, great: 0, clean: 0, bestClean: 0, challengesWrong: 0, followUps: 0, bestReasons: 0, sharpEars: 0, cleanMinutes: 0,
    })),
    turn: 0,
    turnCount: 0,
    round: 1,
    seat: null,
    seatFrom: null,
    bags: {},
    mode: 'wheel',
    phase: 'play',
    current: null,
    stats: { turns: 0, clean: 0, followUps: 0, challenges: 0, cleanMinutes: 0, wyr: 0, topics: 0, hints: 0 },
    log: [],
    lastEvent: null,
    missedNone: true,
  };
  const start = MODES.includes(mode) && modeAvailable(state, mode) ? mode : MODES.find((m) => modeAvailable(state, m)) || 'wheel';
  return enterMode(state, start);
}

export function modeAvailable(state, mode) {
  if (mode === 'wheel') return state.wheel.length > 0;
  if (mode === 'jam') return state.pool.jam.length > 0;
  if (mode === 'wyr') return state.pool.wyr.length > 0;
  if (mode === 'everyone') return state.pool.talk.length > 0;
  return false;
}

// Target for a speaking turn: { kind: 'sentences' | 'seconds', n }.
export function targetFor(state, item = null) {
  if (item && item.mode === 'wyr') return null;
  const level = state.profile.level;
  const d = DIFFICULTY[state.options?.difficulty] || DIFFICULTY.orta;
  if (TARGETS.sentences[level]) return { kind: 'sentences', n: Math.max(1, TARGETS.sentences[level] + d.sentences) };
  const secs = (TARGETS.seconds[state.profile.mode] || TARGETS.seconds.studio)[level] || 60;
  return { kind: 'seconds', n: Math.max(10, secs + d.seconds) };
}

// Team talk before speaking (Just a Minute: a fixed 10 s think).
export function huddleFor(state, mode = state.mode) {
  if (mode === 'jam') return JAM_THINK;
  return Number(state.profile.huddle) || HUDDLE[state.profile.mode] || HUDDLE.studio;
}

export function helperCount(state) {
  return (DIFFICULTY[state.options?.difficulty] || DIFFICULTY.orta).helpers;
}

export function startersShown(state) {
  return (DIFFICULTY[state.options?.difficulty] || DIFFICULTY.orta).starters;
}

export function comboMultiplier(clean) {
  const step = COMBO.find((c) => clean >= c.at);
  return step ? step.x : 1;
}

// Which challenge reasons this class may call (none in Park, none at A1).
export function reasonsFor(stateOrProfile) {
  const p = stateOrProfile.profile || stateOrProfile;
  if (p.mode === 'park') return [];
  const i = LEVEL_ORDER.indexOf(p.level);
  return Object.keys(REASONS).filter((k) => i >= LEVEL_ORDER.indexOf(REASONS[k].from));
}

export function challengeLocked(state, teamId) {
  const t = state.teams.find((x) => x.id === teamId);
  return !t || t.challengesWrong >= MAX_WRONG_CHALLENGES;
}

export function canChallenge(state, teamId) {
  const cur = state.current;
  if (state.phase !== 'play' || state.mode !== 'jam' || !cur || cur.stage !== 'talk' || cur.pending) return false;
  if (!reasonsFor(state).length) return false;
  return teamId !== cur.speakerTeam && !challengeLocked(state, teamId);
}

// The listener who asks the follow-up comes from the next team in order.
export function followUpTeam(state) {
  if (!state.teams.length) return null;
  return state.teams[(state.turn + 1) % state.teams.length].id;
}

// The landed segment is seeded per turn, so an undo cannot re-spin. A
// skipped prompt re-spins on its own seed; when used prompts stay on the
// wheel ("Kullanılan konuyu çıkar" off), the re-spin steps past the prompts
// skipped in this turn.
export function spinIndex(state) {
  const n = state.wheel.length;
  if (!n) return -1;
  const skips = state.current?.skips || 0;
  const at = Math.floor(rngFor(`${state.code}:spin:${state.turnCount}${skips ? `:${skips}` : ''}`)() * n);
  const skipped = state.current?.skipped || [];
  for (let k = 0; k < n; k++) {
    const i = (at + k) % n;
    if (!skipped.includes(state.wheel[i])) return i;
  }
  return at;
}

// The help rungs this item can actually serve, in order.
export function hintLadder(state, item) {
  const it = typeof item === 'string' ? state.items[item] : item;
  if (!it) return [];
  const text = {
    picture: it.emoji || '',
    starter: (it.starters || []).filter(Boolean)[0] || '',
    model: it.model || '',
    useful: (it.useful || []).filter(Boolean).slice(0, 5).join(' · '),
    tr: it.tr || '',
  };
  return (HINT_LADDER[state.profile.mode] || HINT_LADDER.studio).map((kind) => ({ kind, text: text[kind] })).filter((r) => r.text);
}

export function wyrFrames(level) {
  const i = LEVEL_ORDER.indexOf(level);
  const frames = [{ key: 'reason', text: WYR_FRAMES.reason }];
  if (i >= 2) frames.push({ key: 'back', text: WYR_FRAMES.back });
  if (i >= 3) frames.push({ key: 'concession', text: WYR_FRAMES.concession });
  return frames;
}

// Everything the stage shows for one prompt, after the difficulty dials.
export function presentPrompt(state, itemId) {
  const it = state.items[itemId];
  if (!it) return null;
  const out = {
    id: it.id,
    mode: it.mode,
    prompt: String(it.prompt || ''),
    label: it.label || String(it.prompt || '').split(/\s+/).slice(0, 2).join(' '),
    emoji: it.emoji || '\u{1F4AC}',
    starters: startersShown(state) ? (it.starters || []).filter(Boolean).slice(0, 3) : [],
    useful: (it.useful || []).filter(Boolean).slice(0, helperCount(state)),
    followUps: (it.followUps || []).filter(Boolean).slice(0, 3),
    model: it.model || '',
    tr: it.tr || '',
    level: it.level,
    cat: it.cat || null,
    topic: it.topic,
    jamOk: JAM_MODES.includes(it.mode),
    target: targetFor(state, it),
    hints: hintLadder(state, it),
  };
  if (it.mode === 'wyr') {
    out.optA = { text: String(it.optA.text), emoji: it.optA.emoji || '' };
    out.optB = { text: String(it.optB.text), emoji: it.optB.emoji || '' };
    out.frames = wyrFrames(state.profile.level);
    out.vote = VOTE_TEXT[state.options.wyrVote] || VOTE_TEXT.stand;
  }
  return out;
}

export function totalOf(state, team) {
  return state.profile.mode === 'park' ? team.stars : team.score;
}

function look(s) { return s.profile.mode; }
function byId(s, id) { return s.teams.find((t) => t.id === id); }

// A working copy: every part an action may change is copied, so the
// helpers below can update it in place and the input state stays untouched.
function draft(state) {
  return {
    ...state,
    teams: state.teams.map((t) => ({ ...t })),
    bags: { ...state.bags },
    used: [...state.used],
    wheel: [...state.wheel],
    stats: { ...state.stats },
    log: [...state.log],
    current: state.current ? { ...state.current } : null,
  };
}

function note(s, ev) {
  s.log = [...s.log, ev].slice(-LOG_MAX);
  s.lastEvent = ev;
  return ev;
}

// Next unused id of a pool (skipping avoid); recycle the pool when it is
// all used.
function draw(s, name, avoid = []) {
  const ids = s.pool[name];
  if (!ids.length) return null;
  let id = ids.find((x) => !s.used.includes(x) && !avoid.includes(x));
  if (!id) {
    const set = new Set(ids);
    s.used = s.used.filter((x) => !set.has(x));
    s.recycles += 1;
    id = ids.find((x) => !avoid.includes(x)) || ids[0];
    // The recycled prompts are free again: the wheel takes them back.
    topUp(s);
  }
  return id;
}

// The wheel keeps its segments while unused prompts are left: prompts freed
// by a Just a Minute or group-topic recycle fill the segments the wheel had
// to give up.
function topUp(s) {
  const want = s.options.segments;
  if (s.wheel.length >= want) return;
  const wheel = s.wheel.slice();
  for (const id of s.pool.talk) {
    if (wheel.length >= want) break;
    if (!s.used.includes(id) && !wheel.includes(id)) wheel.push(id);
  }
  if (wheel.length !== s.wheel.length) s.wheel = wheel;
}

// A used prompt leaves the wheel ("Kullanılan konuyu çıkar"): its segment
// takes the next unused prompt, or goes when none is left; an empty wheel
// recycles every prompt.
function markUsed(s, id) {
  if (!id) return;
  if (!s.used.includes(id)) s.used = [...s.used, id];
  if (!s.options.removeUsed) return;
  const at = s.wheel.indexOf(id);
  if (at < 0) return;
  const fresh = s.pool.talk.find((x) => !s.used.includes(x) && !s.wheel.includes(x));
  const wheel = s.wheel.slice();
  if (fresh) wheel[at] = fresh;
  else wheel.splice(at, 1);
  s.wheel = wheel;
  if (!wheel.length && s.pool.talk.length) {
    const talk = new Set(s.pool.talk);
    s.used = s.used.filter((x) => !talk.has(x));
    s.recycles += 1;
    s.wheel = shuffleSeeded(s.pool.talk, `${s.code}:wheel:${s.recycles}`).slice(0, s.options.segments);
  }
  topUp(s);
}

function enterMode(s, mode) {
  s.mode = mode;
  if (mode === 'wheel') topUp(s);
  if (mode === 'wheel' || mode === 'jam') return startTurn(s);
  if (mode === 'wyr') return wyrCard(s);
  return newTopic(s);
}

// A turn: the team in order, its seat drawn once (a mode switch keeps it).
function startTurn(s) {
  const team = s.teams[s.turn];
  if (!team) { s.current = null; return s; }
  if (s.seat == null) {
    const before = s.bags[team.id] || null;
    const { seat, bag } = drawSeat(before, team.seats, rngFor(`${s.code}:seat:${s.turnCount}`));
    s.bags = { ...s.bags, [team.id]: bag };
    s.seat = seat;
    s.seatFrom = { teamId: team.id, bag: before };
  }
  s.current = s.mode === 'jam'
    ? { kind: 'jam', stage: 'turn', teamId: team.id, seat: s.seat, itemId: null }
    : { kind: 'wheel', stage: 'turn', teamId: team.id, seat: s.seat, itemId: null, segment: null, skips: 0 };
  return s;
}

// The turn is over: the prompt is used, the next team speaks. A round ends
// when the order wraps; the wrong-challenge locks open again.
function endTurn(s) {
  const cur = s.current;
  const team = byId(s, cur.teamId);
  if (team) team.turns += 1;
  s.stats.turns += 1;
  markUsed(s, cur.itemId);
  s.turn = (s.turn + 1) % s.teams.length;
  s.turnCount += 1;
  s.seat = null;
  s.seatFrom = null;
  if (s.turn === 0) {
    s.round += 1;
    for (const t of s.teams) t.challengesWrong = 0;
  }
  return startTurn(s);
}

function jamCard(s, cur, avoid = []) {
  const itemId = draw(s, 'jam', avoid);
  if (!itemId) return null;
  return {
    kind: 'jam', stage: 'card', teamId: cur.teamId, seat: cur.seat, itemId,
    target: targetFor(s, s.items[itemId]), sentences: 0, hints: 0, hintCost: 0,
    speakerTeam: cur.teamId, speakerSeat: cur.seat, challenges: [], pending: null, valid: 0,
  };
}

function wyrCard(s, avoid = []) {
  const itemId = draw(s, 'wyr', avoid);
  s.current = itemId ? { kind: 'wyr', stage: 'wyr', itemId, votes: { a: 0, b: 0 }, best: null } : null;
  return s;
}

function newTopic(s, avoid = []) {
  const itemId = draw(s, 'talk', avoid);
  s.current = itemId ? { kind: 'everyone', stage: 'topic', itemId, speaker: 0, groupSize: s.options.groupSize, target: targetFor(s, s.items[itemId]) } : null;
  return s;
}

function toFollowup(s) {
  const cur = s.current;
  const ups = (s.items[cur.itemId]?.followUps || []).filter(Boolean);
  s.current = { ...cur, stage: 'followup', followUp: { askerId: look(s) === 'park' ? null : followUpTeam(s), shown: Math.min(1, ups.length), ok: null } };
  return s;
}

// Time is up (or the sentence rocket landed). Stüdyo scores here: the
// speaker at the whistle +2, and a minute with no valid challenge +3.
function whistle(s) {
  const cur = s.current;
  const next = { ...cur, stage: 'whistle', pending: null, results: [] };
  if (look(s) === 'park') next.landed = cur.target?.kind === 'sentences' ? cur.sentences >= cur.target.n : true;
  if (look(s) === 'studio') {
    const sp = byId(s, cur.speakerTeam);
    sp.score += POINTS.whistle;
    next.results.push({ teamId: sp.id, points: POINTS.whistle, why: 'whistle' });
    if (!cur.valid) {
      const own = byId(s, cur.teamId);
      own.score += POINTS.cleanMinute;
      own.cleanMinutes += 1;
      s.stats.cleanMinutes += 1;
      next.cleanMinute = true;
      next.results.push({ teamId: own.id, points: POINTS.cleanMinute, why: 'clean' });
    }
  }
  s.current = next;
  note(s, { type: 'whistle', teamId: cur.teamId, speakerTeam: cur.speakerTeam, results: next.results, turnCount: s.turnCount });
  return s;
}

// The card is done: the chosen best reason earns its point, the card counts
// and is used.
function closeWyr(s) {
  const cur = s.current;
  if (cur.best) {
    const t = byId(s, cur.best);
    if (look(s) === 'park') t.stars += POINTS.bestReason;
    else t.score += POINTS.bestReason;
    t.bestReasons += 1;
    note(s, { type: 'best', teamId: t.id, itemId: cur.itemId });
  }
  s.stats.wyr += 1;
  markUsed(s, cur.itemId);
  return s;
}

function nextWyr(s) {
  const id = s.current.itemId;
  closeWyr(s);
  return wyrCard(s, [id]);
}

// Before the lesson leaves the current turn or card (a mode switch, Bitir):
// a speaking turn whose talk is over (wheel: the award stage, after the
// follow-up; Just a Minute: the whistle or the award) or that already booked
// points (a ruled challenge) is closed without an award, so it cannot be
// replayed and paid twice. A Would You Rather card that reached its reasons
// is closed with its best reason. A turn still before or in its talk stays
// open: the team keeps it and the prompt stays on the wheel.
function settle(s) {
  const cur = s.current;
  if (!cur) return s;
  if (cur.kind === 'wyr') return cur.stage === 'reasons' ? closeWyr(s) : s;
  if (!SPEECH_KINDS.includes(cur.kind) || !cur.itemId) return s;
  const over = cur.kind === 'wheel'
    ? cur.stage === 'award'
    : cur.stage === 'whistle' || cur.stage === 'award' || (cur.challenges || []).length > 0;
  return over ? endTurn(s) : s;
}

function nextTopic(s) {
  const cur = s.current;
  if (cur.stage !== 'topic') s.stats.topics += 1;
  markUsed(s, cur.itemId);
  return newTopic(s, [cur.itemId]);
}

// One step forward (Space): the stage after this one, if nothing else is
// needed first (a spin, an award or a ruling).
function advance(state) {
  const cur = state.current;
  if (state.phase !== 'play' || !cur || cur.pending) return state;
  const stageTo = (stage, extra = {}) => ({ ...state, current: { ...cur, stage, ...extra } });
  if (cur.kind === 'wheel') {
    if (cur.stage === 'card') return stageTo('talk');
    if (cur.stage === 'talk') return toFollowup(draft(state));
    if (cur.stage === 'followup') return stageTo('award');
    return state;
  }
  if (cur.kind === 'jam') {
    if (cur.stage === 'turn') {
      const s = draft(state);
      const card = jamCard(s, cur);
      if (!card) return state;
      s.current = card;
      return s;
    }
    if (cur.stage === 'card') return stageTo('talk');
    if (cur.stage === 'talk') return whistle(draft(state));
    if (cur.stage === 'whistle') return look(state) === 'studio' ? endTurn(draft(state)) : stageTo('award');
    return state;
  }
  if (cur.kind === 'wyr') {
    if (cur.stage === 'wyr') return stageTo('vote');
    if (cur.stage === 'vote') return stageTo('reasons');
    return nextWyr(draft(state));
  }
  if (cur.kind === 'everyone') {
    if (cur.stage === 'topic') return stageTo('speaking', { speaker: 1 });
    if (cur.stage === 'speaking') return nextSpeaker(state);
    return nextTopic(draft(state));
  }
  return state;
}

function nextSpeaker(state) {
  const cur = state.current;
  if (cur.stage === 'topic') return { ...state, current: { ...cur, stage: 'speaking', speaker: 1 } };
  if (cur.stage !== 'speaking') return state;
  if (cur.speaker < cur.groupSize) return { ...state, current: { ...cur, speaker: cur.speaker + 1 } };
  return { ...state, current: { ...cur, stage: 'questions' } };
}

// Stars for a Park award: a count (0-3) or the list of star keys. Without
// English only the "spoke" star stays.
function parkStars(action, english) {
  let n = null;
  if (Array.isArray(action.stars)) n = new Set(action.stars.filter((k) => STAR_KEYS.includes(k))).size;
  else if (action.stars != null && Number.isFinite(Number(action.stars))) n = Math.max(0, Math.min(3, Math.round(Number(action.stars))));
  else if (GRADE_POINTS[action.grade]) n = GRADE_POINTS[action.grade];
  if (n == null) return null;
  return english ? n : Math.min(n, 1);
}

function gradeOf(action) {
  if (GRADES.includes(action.grade)) return action.grade;
  const n = Number(action.stars);
  return n === 3 ? 'great' : n === 2 ? 'good' : n === 1 ? 'tried' : null;
}

// Score the speaking turn for its team (cur.teamId), then end the turn.
function award(state, action) {
  const cur = state.current;
  const english = action.english !== false;
  const mode = look(state);
  const stars = mode === 'park' ? parkStars(action, english) : null;
  const grade = mode === 'park' ? null : gradeOf(action);
  if (mode === 'park' ? stars == null : !grade && english) return state;
  const s = draft(state);
  const t = byId(s, cur.teamId);
  let result;
  if (mode === 'park') {
    const clean = stars === 3;
    t.stars += stars;
    t.great += clean ? 1 : 0;
    t.clean = clean ? t.clean + 1 : 0;
    t.bestClean = Math.max(t.bestClean, t.clean);
    s.stats.clean += clean ? 1 : 0;
    result = { stars, english };
  } else {
    const clean = english && grade === 'great';
    t.clean = clean ? t.clean + 1 : 0;
    t.bestClean = Math.max(t.bestClean, t.clean);
    t.great += clean ? 1 : 0;
    s.stats.clean += clean ? 1 : 0;
    const combo = mode === 'arena' && clean ? comboMultiplier(t.clean) : 1;
    const raw = english ? Math.ceil(GRADE_POINTS[grade] * combo) : 0;
    const cost = mode === 'arena' ? cur.hintCost || 0 : 0;
    const points = Math.max(0, raw - cost);
    t.score += points;
    result = { grade: grade || null, english, combo, hintCost: cost, points };
  }
  s.current = { ...cur, award: result };
  note(s, { type: 'award', teamId: t.id, seat: cur.seat, itemId: cur.itemId, kind: cur.kind, ...result, turnCount: s.turnCount });
  return endTurn(s);
}

function rule(state, action) {
  const cur = state.current;
  if (state.phase !== 'play' || state.mode !== 'jam' || !cur || !cur.pending || typeof action.valid !== 'boolean') return state;
  const reason = action.reason == null ? null : String(action.reason).toUpperCase();
  const allowed = reasonsFor(state);
  if (action.valid ? !allowed.includes(reason) : reason != null && !allowed.includes(reason)) return state;
  const s = draft(state);
  const challenger = byId(s, cur.pending.teamId);
  const speaker = byId(s, cur.speakerTeam);
  const call = { teamId: challenger.id, against: speaker.id, reason, valid: action.valid, takeover: false };
  const next = { ...cur, pending: null };
  if (action.valid) {
    // Sharp ears: the challenger +1 in both looks.
    challenger.score += POINTS.sharpEars;
    challenger.sharpEars += 1;
    s.stats.challenges += 1;
    next.valid = cur.valid + 1;
    if (look(s) === 'studio') {
      // Full BBC: the challenger's own speaker takes over the same topic.
      const { seat, bag } = drawSeat(s.bags[challenger.id], challenger.seats, rngFor(`${s.code}:take:${s.turnCount}:${cur.challenges.length}`));
      s.bags = { ...s.bags, [challenger.id]: bag };
      next.speakerTeam = challenger.id;
      next.speakerSeat = seat;
      call.takeover = true;
    }
  } else {
    challenger.challengesWrong += 1;
    if (look(s) === 'studio') {
      speaker.score += POINTS.wrongChallenge;
      challenger.score = Math.max(0, challenger.score - POINTS.wrongChallenge);
    }
  }
  next.challenges = [...cur.challenges, call];
  s.current = next;
  note(s, { type: 'rule', ...call, turnCount: s.turnCount });
  return s;
}

function skip(state) {
  const cur = state.current;
  if (state.phase !== 'play' || !cur || !cur.itemId) return state;
  if (cur.kind === 'wheel') {
    if (cur.stage !== 'card' && cur.stage !== 'talk') return state;
    const s = draft(state);
    markUsed(s, cur.itemId);
    s.current = { kind: 'wheel', stage: 'turn', teamId: cur.teamId, seat: cur.seat, itemId: null, segment: null, skips: (cur.skips || 0) + 1, skipped: [...(cur.skipped || []), cur.itemId] };
    note(s, { type: 'skip', teamId: cur.teamId, itemId: cur.itemId });
    return s;
  }
  if (cur.kind === 'jam') {
    // Only before the minute has really started.
    if (!(cur.stage === 'card' || (cur.stage === 'talk' && !cur.challenges.length && !cur.pending && !cur.sentences))) return state;
    const s = draft(state);
    markUsed(s, cur.itemId);
    const card = jamCard(s, cur, [cur.itemId]);
    if (!card || card.itemId === cur.itemId) return state;
    s.current = card;
    note(s, { type: 'skip', teamId: cur.teamId, itemId: cur.itemId });
    return s;
  }
  const s = draft(state);
  // A Would You Rather card skipped after its votes still counts, with its
  // best reason.
  if (cur.kind === 'wyr' && cur.stage === 'reasons') closeWyr(s);
  else markUsed(s, cur.itemId);
  if (cur.kind === 'wyr') wyrCard(s, [cur.itemId]);
  else newTopic(s, [cur.itemId]);
  if (!s.current || s.current.itemId === cur.itemId) return state;
  return s;
}

export function reduce(state, action) {
  if (!action || !state) return state;
  const cur = state.current;
  switch (action.type) {
    case 'SPIN': {
      if (state.phase !== 'play' || state.mode !== 'wheel' || !cur || cur.stage !== 'turn' || !state.wheel.length) return state;
      const s = draft(state);
      const segment = spinIndex(state);
      const itemId = s.wheel[segment];
      s.current = { ...cur, stage: 'card', segment, itemId, target: targetFor(s, s.items[itemId]), sentences: 0, hints: 0, hintCost: 0, followUp: null };
      note(s, { type: 'spin', teamId: cur.teamId, seat: cur.seat, segment, itemId, turnCount: s.turnCount });
      return s;
    }
    case 'NEXT': return advance(state);
    case 'STAGE': {
      // A jump forward inside the same turn or card, step by step.
      if (state.phase !== 'play' || !cur || !action.stage || cur.stage === action.stage) return state;
      let s = state;
      for (let k = 0; k < 8; k++) {
        const n = advance(s);
        if (n === s || n.turnCount !== state.turnCount || n.mode !== state.mode || !n.current) return state;
        if (cur.itemId && n.current.itemId !== cur.itemId) return state;
        s = n;
        if (s.current.stage === action.stage) return s;
      }
      return state;
    }
    case 'SENTENCE': {
      const delta = Math.round(Number(action.delta) || 0);
      if (state.phase !== 'play' || !cur || !SPEECH_KINDS.includes(cur.kind) || cur.stage !== 'talk' || cur.pending || cur.target?.kind !== 'sentences' || !delta) return state;
      const n = Math.max(0, Math.min(MAX_SENTENCES, cur.sentences + delta));
      if (n === cur.sentences) return state;
      const s = draft(state);
      s.current = { ...cur, sentences: n };
      // The rocket lands (and the minute ends) when the sentence target is met.
      if (cur.kind === 'jam' && n >= cur.target.n) return whistle(s);
      return s;
    }
    case 'HINT': {
      if (state.phase !== 'play' || !cur) return state;
      if (cur.stage === 'followup') return reduce(state, { type: 'DIG' });
      if (!SPEECH_KINDS.includes(cur.kind) || (cur.stage !== 'card' && cur.stage !== 'talk') || cur.pending) return state;
      if (cur.hints >= hintLadder(state, cur.itemId).length) return state;
      const s = draft(state);
      const cost = look(s) === 'arena' ? POINTS.hint : 0;
      s.current = { ...cur, hints: cur.hints + 1, hintCost: (cur.hintCost || 0) + cost };
      s.stats.hints += 1;
      return s;
    }
    case 'DIG': {
      if (state.phase !== 'play' || !cur || cur.kind !== 'wheel' || cur.stage !== 'followup') return state;
      const ups = (state.items[cur.itemId]?.followUps || []).filter(Boolean).length;
      if (cur.followUp.shown >= ups) return state;
      return { ...state, current: { ...cur, followUp: { ...cur.followUp, shown: cur.followUp.shown + 1 } } };
    }
    case 'CHALLENGE': {
      if (!canChallenge(state, action.teamId)) return state;
      const s = draft(state);
      s.current = { ...cur, pending: { teamId: action.teamId } };
      note(s, { type: 'challenge', teamId: action.teamId, against: cur.speakerTeam, turnCount: s.turnCount });
      return s;
    }
    case 'RULE': return rule(state, action);
    case 'FOLLOWUP': {
      if (state.phase !== 'play' || state.mode !== 'wheel' || !cur || cur.stage !== 'followup') return state;
      const park = look(state) === 'park';
      if (!park && typeof action.ok !== 'boolean') return state;
      const ok = action.ok !== false;
      const s = draft(state);
      if (ok) s.stats.followUps += 1;
      // Arena and Stüdyo: +1 to the asking team for a real, on-topic question.
      if (ok && !park) {
        const asker = byId(s, cur.followUp.askerId);
        if (asker) { asker.score += POINTS.followUp; asker.followUps += 1; }
      }
      s.current = { ...cur, stage: 'award', followUp: { ...cur.followUp, ok } };
      note(s, { type: 'followup', teamId: park ? null : cur.followUp.askerId, ok, points: ok && !park ? POINTS.followUp : 0, turnCount: s.turnCount });
      return s;
    }
    case 'AWARD': {
      if (state.phase !== 'play' || !cur || !SPEECH_KINDS.includes(cur.kind) || cur.stage !== 'award') return state;
      return award(state, action);
    }
    case 'VOTE': {
      const side = String(action.side || '').toLowerCase();
      const delta = Math.round(Number(action.delta) || 0);
      if (state.phase !== 'play' || !cur || cur.kind !== 'wyr' || cur.stage !== 'vote' || (side !== 'a' && side !== 'b') || !delta) return state;
      const n = Math.max(0, Math.min(99, cur.votes[side] + delta));
      if (n === cur.votes[side]) return state;
      return { ...state, current: { ...cur, votes: { ...cur.votes, [side]: n } } };
    }
    case 'BEST_REASON': {
      if (state.phase !== 'play' || !cur || cur.kind !== 'wyr' || cur.stage !== 'reasons' || !state.options.bestReason) return state;
      if (!byId(state, action.teamId)) return state;
      // A toggle; the point is given when the class moves to the next card.
      return { ...state, current: { ...cur, best: cur.best === action.teamId ? null : action.teamId } };
    }
    case 'NEXT_SPEAKER': {
      if (state.phase !== 'play' || !cur || cur.kind !== 'everyone') return state;
      return nextSpeaker(state);
    }
    case 'NEW_TOPIC': {
      if (state.phase !== 'play' || !cur || cur.kind !== 'everyone') return state;
      const s = nextTopic(draft(state));
      return s.current && s.current.itemId !== cur.itemId ? s : state;
    }
    case 'SKIP': return skip(state);
    case 'SET_MODE': {
      const m = action.mode;
      if (state.phase !== 'play' || !MODES.includes(m) || m === state.mode || !modeAvailable(state, m)) return state;
      const s = settle(draft(state));
      note(s, { type: 'mode', from: state.mode, to: m, turnCount: s.turnCount });
      return enterMode(s, m);
    }
    case 'ADJUST': {
      const delta = Math.round(Number(action.delta) || 0);
      const i = state.teams.findIndex((t) => t.id === action.teamId);
      const park = look(state) === 'park';
      if (i < 0 || !delta || (park && delta < 0)) return state; // Park stars never go down
      const key = park ? 'stars' : 'score';
      const value = Math.max(0, state.teams[i][key] + delta);
      if (value === state.teams[i][key]) return state;
      const s = draft(state);
      s.teams[i][key] = value;
      note(s, { type: 'adjust', teamId: action.teamId, amount: value - state.teams[i][key] });
      return s;
    }
    case 'SET_TURN': {
      const i = Number(action.index);
      const idle = state.mode === 'wyr' || state.mode === 'everyone' || (cur && cur.stage === 'turn');
      if (state.phase !== 'play' || !idle || !Number.isInteger(i) || i < 0 || i >= state.teams.length || i === state.turn) return state;
      const s = draft(state);
      // The seat drawn for the skipped team goes back into its bag.
      if (s.seatFrom) s.bags = { ...s.bags, [s.seatFrom.teamId]: s.seatFrom.bag };
      s.seat = null;
      s.seatFrom = null;
      s.turn = i;
      return SPEECH_KINDS.includes(s.mode) ? startTurn(s) : s;
    }
    case 'FINISH': {
      if (state.phase === 'end') return state;
      const s = settle(draft(state));
      s.phase = 'end';
      s.current = null;
      return s;
    }
    default: return state;
  }
}

export function ranking(state) {
  const r = state.teams.map((t, k) => ({ ...t, order: k, total: totalOf(state, t) })).sort((a, b) => b.total - a.total || a.order - b.order);
  r.forEach((t, k) => { t.place = k === 0 || t.total !== r[k - 1].total ? k : r[k - 1].place; });
  return r;
}

const PARK_TITLES = ['Super Speakers', 'Rocket Riders', 'Brave Talkers', 'Story Stars', 'Word Explorers', 'Happy Chatterboxes'];
export function endingTitles(state) {
  const mode = state.profile.mode;
  if (mode === 'park') {
    return ranking(state).map((t, k) => ({ teamId: t.id, title: PARK_TITLES[k % PARK_TITLES.length], stars: t.stars }));
  }
  if (mode === 'studio') {
    // The table is the result; "Best speaker" rewards the speaking itself.
    const top = ranking(state)[0];
    const awards = top ? [{ teamId: top.id, title: 'Top score' }] : [];
    const best = state.teams.map((t, k) => ({ t, k, v: t.great + t.cleanMinutes }))
      .sort((a, b) => b.v - a.v || b.t.score - a.t.score || a.k - b.k)[0];
    if (best && best.v > 0) awards.push({ teamId: best.t.id, title: 'Best speaker' });
    return awards;
  }
  const used = new Set();
  const awards = [];
  const pick = (label, v, ok = () => true) => {
    const c = state.teams.filter((t) => !used.has(t.id) && ok(t)).map((t) => ({ t, v: v(t) })).sort((a, b) => b.v - a.v)[0];
    if (c) { used.add(c.t.id); awards.push({ teamId: c.t.id, title: label }); }
  };
  pick('Top score', (t) => t.score);
  pick('Clean streak', (t) => t.bestClean, (t) => t.bestClean >= 2);
  pick('Sharp ears', (t) => t.sharpEars, (t) => t.sharpEars > 0);
  pick('Best questions', (t) => t.followUps, (t) => t.followUps > 0);
  pick('Best reasons', (t) => t.bestReasons, (t) => t.bestReasons > 0);
  for (const t of state.teams) if (!used.has(t.id)) { used.add(t.id); awards.push({ teamId: t.id, title: 'Team spirit' }); }
  return awards;
}

// "Speaking highlights" for the end screen (there is no missed list: a
// speaking game has no wrong answers). The first three always show.
export function highlights(state) {
  const st = state.stats;
  const list = [
    { key: 'turns', en: 'Speaking turns', tr: 'Konuşma sırası', value: st.turns },
    { key: 'clean', en: state.profile.mode === 'park' ? 'Three-star turns' : 'Clean turns', tr: state.profile.mode === 'park' ? 'Üç yıldızlı sıra' : 'Temiz sıra', value: st.clean },
    { key: 'followUps', en: 'Follow-up questions', tr: 'Takip sorusu', value: st.followUps },
    { key: 'challenges', en: 'Sharp ears', tr: 'Haklı itiraz', value: st.challenges },
    { key: 'cleanMinutes', en: 'Clean minutes', tr: 'Temiz dakika', value: st.cleanMinutes },
    { key: 'wyr', en: 'Would You Rather cards', tr: 'Would You Rather kartı', value: st.wyr },
    { key: 'topics', en: 'Group topics', tr: 'Grup konusu', value: st.topics },
  ];
  return list.filter((h, k) => k < 3 || h.value > 0);
}
