// The 8 class groups and the audience profile every game reads.
// Level (A1-B2) and audience mode (Oyun Parkı / Arena / Stüdyo) are two
// independent axes: a 13-year-old A1 class can play Arena with A1 content.

export const LEVELS = ['a1', 'a2', 'b1', 'b2'];

export const GROUPS = [
  { id: 'a1', level: 'a1', young: false, label: 'A1', long: 'A1 · Yetişkin' },
  { id: 'a2', level: 'a2', young: false, label: 'A2', long: 'A2 · Yetişkin' },
  { id: 'b1', level: 'b1', young: false, label: 'B1', long: 'B1 · Yetişkin' },
  { id: 'b2', level: 'b2', young: false, label: 'B2', long: 'B2 · Yetişkin' },
  { id: 'a1g', level: 'a1', young: true, label: 'A1 Genç', long: 'A1 · Genç (7-14)' },
  { id: 'a2g', level: 'a2', young: true, label: 'A2 Genç', long: 'A2 · Genç (7-14)' },
  { id: 'b1g', level: 'b1', young: true, label: 'B1 Genç', long: 'B1 · Genç (7-14)' },
  { id: 'b2g', level: 'b2', young: true, label: 'B2 Genç', long: 'B2 · Genç (7-14)' },
];

// Level profile: how much language a prompt may carry and how answers look.
export const LEVEL_PROFILES = {
  a1: { wordCapYoung: 4, wordCapAdult: 10, options: { young: 3, adult: 4 }, openAnswers: false, hint: ['picture', 'first-letter', 'listen'] },
  a2: { wordCapYoung: 8, wordCapAdult: 15, options: { young: 3, adult: 4 }, openAnswers: false, hint: ['first-letter', 'fifty', 'listen'] },
  b1: { wordCapYoung: 14, wordCapAdult: 25, options: { young: 4, adult: 4 }, openAnswers: true, hint: ['first-letter', 'fifty', 'example'] },
  b2: { wordCapYoung: 20, wordCapAdult: 40, options: { young: 4, adult: 4 }, openAnswers: true, hint: ['definition', 'example', 'fifty', 'first-letter', 'turkish'] },
};
// A game offers only the rungs the current item can serve (see itemHint in
// pack.mjs): 'picture' has no source yet, and 'example'/'definition' need the
// item's own data, so B2 also carries 50:50 and the first letter.

// Audience modes: look, host and rule pack. Numbers are classroom defaults
// the teacher can override; they are starting points to test in class.
export const MODES = {
  park: {
    id: 'park', label: 'Oyun Parkı', ages: '7-11', blurb: 'Parlak, sevimli, Kommo sunar',
    mascot: true, scoring: 'stars', rulePack: 'nazik',
    timer: { on: false, secs: 40 }, huddle: 10, optionsDelay: 3, secsPerTile: 90,
    harshness: ['green'], combo: false, rebound: false, comeback: 'none',
    shadowScoring: 'class', celebrateMs: 2000, boardSize: 12, surprise: 1,
    teamStyle: 'animals', captions: 'mascot',
  },
  arena: {
    id: 'arena', label: 'Arena', ages: '12-14', blurb: 'Koyu, neon, maç havası',
    mascot: false, scoring: 'points', rulePack: 'nazik',
    timer: { on: true, secs: 30 }, huddle: 15, optionsDelay: 2.5, secsPerTile: 70,
    harshness: ['green'], combo: true, rebound: true, comeback: 'slipstream',
    shadowScoring: 'teams', celebrateMs: 1200, boardSize: 16, surprise: 2,
    teamStyle: 'emblems', captions: 'commentator',
  },
  studio: {
    id: 'studio', label: 'Stüdyo', ages: 'Yetişkin', blurb: 'Sakin, zarif bir quiz gecesi',
    mascot: false, scoring: 'points', rulePack: 'standart',
    timer: { on: false, secs: 30 }, huddle: 20, optionsDelay: 2, secsPerTile: 60,
    harshness: ['green', 'yellow'], combo: false, rebound: true, comeback: 'trailing-picks',
    shadowScoring: 'teams', celebrateMs: 600, boardSize: 16, surprise: 1,
    teamStyle: 'studio', captions: 'neutral',
  },
};

export function groupById(id) {
  return GROUPS.find((g) => g.id === id) || GROUPS[0];
}

export function defaultModeFor(group) {
  const g = typeof group === 'string' ? groupById(group) : group;
  if (!g.young) return 'studio';
  return g.level === 'a1' || g.level === 'a2' ? 'park' : 'arena';
}

// One merged object: every game and the content generator read this.
export function audienceProfile(groupId, overrides = {}) {
  const group = groupById(groupId);
  const modeId = MODES[overrides.mode] ? overrides.mode : defaultModeFor(group);
  const mode = MODES[modeId];
  const lvl = LEVEL_PROFILES[group.level];
  const young = group.young;
  const autoRead = young && (group.level === 'a1' || group.level === 'a2');
  const timerOn = typeof overrides.timerOn === 'boolean' ? overrides.timerOn : mode.timer.on;
  return {
    group: group.id,
    groupLabel: group.label,
    level: group.level,
    young,
    mode: modeId,
    modeLabel: mode.label,
    mascot: mode.mascot,
    scoring: mode.scoring,
    nazik: mode.rulePack === 'nazik',
    wordCap: young ? lvl.wordCapYoung : lvl.wordCapAdult,
    optionCount: young ? lvl.options.young : lvl.options.adult,
    openAnswers: lvl.openAnswers,
    hints: lvl.hint,
    autoRead: typeof overrides.autoRead === 'boolean' ? overrides.autoRead : autoRead,
    // The prompt is heard while it is read, so options can come sooner.
    optionsDelay: autoRead ? Math.min(mode.optionsDelay, 2.5) : mode.optionsDelay,
    huddle: clampInt(overrides.huddle, 5, 60, mode.huddle),
    timerOn,
    timerSecs: clampInt(overrides.timerSecs, 10, 120, mode.timer.secs),
    secsPerTile: mode.secsPerTile,
    harshness: mode.harshness,
    combo: mode.combo,
    rebound: typeof overrides.rebound === 'boolean' ? overrides.rebound : mode.rebound,
    comeback: mode.comeback,
    shadowScoring: mode.shadowScoring,
    celebrateMs: mode.celebrateMs,
    teamStyle: mode.teamStyle,
    captions: mode.captions,
    trGloss: overrides.trGloss !== false,
  };
}

export function profileSummary(p) {
  const bits = [p.groupLabel, p.modeLabel, p.nazik ? 'Nazik' : 'Standart', p.timerOn ? `${p.timerSecs} sn` : 'Süresiz'];
  return bits.join(' · ');
}

// Lesson-fit: how many tiles fit in the minutes the teacher has.
export function tilesForMinutes(minutes, profile, sizes = [12, 16, 20, 24]) {
  const usable = Math.max(5, Number(minutes) || 20) * 60 * 0.85;
  const fit = Math.floor(usable / profile.secsPerTile);
  let best = sizes[0];
  for (const s of sizes) if (s <= fit) best = s;
  return best;
}

function clampInt(v, lo, hi, fallback) {
  const n = Number(v);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(lo, Math.min(hi, Math.round(n)));
}
