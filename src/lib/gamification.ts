/**
 * Languago — gamification layer (Step 2.5: Flow Theory + RPG progression).
 *
 * Pure, guarded math for the XP / level / streak / mastery progression that
 * sits ON TOP of the existing games. NOTHING here touches the network, throws
 * on bad input, or depends on Supabase — every function takes plain values
 * (or defensive default objects) and returns a plain object.
 *
 * The student's game activity is stored in a single `student_progress` row
 * (module = 'game'), upserted per student. Because quiz and yazim share that
 * one row, per-game mastery is kept as a nested map keyed by game name and
 * XP/level/streak are top-level accumulators. All reads are defensive so a
 * missing row, a partial payload, or legacy data (only lastScore/lastPct)
 * still yields a useful outcome.
 */

/** XP required to advance one level. */
export const XP_PER_LEVEL = 100;
/** Small XP awarded per correct answer (immediate-reward loop). */
export const PER_CORRECT_XP = 5;
/** Flat bonus for finishing a round while the timer is still running. */
export const TIME_BONUS_XP = 5;

export const GAME_KEYS = ['quiz', 'yazim'] as const;
export type GameKey = (typeof GAME_KEYS)[number];

/** Mastery bands — ascending lookup, highest threshold matched first. */
export type MasteryKey = 'usta' | 'ust' | 'orta' | 'yeni';
export const MASTERY_BANDS: {
  key: MasteryKey;
  label: string;
  emoji: string;
  min: number;
}[] = [
  { key: 'usta', label: 'Usta', emoji: '👑', min: 85 },
  { key: 'ust', label: 'Üst', emoji: '🔥', min: 70 },
  { key: 'orta', label: 'Orta', emoji: '🔶', min: 50 },
  { key: 'yeni', label: 'Yeni', emoji: '🌱', min: 0 },
];

export interface MasteryInfo {
  key: MasteryKey;
  label: string;
  emoji: string;
  pct: number;
}

export interface LevelInfo {
  /** Human level — starts at 1. */
  level: number;
  /** XP accumulated inside the current level. */
  xpIntoLevel: number;
  /** XP needed to reach the next level (constant per level). */
  xpForNextLevel: number;
  /** 0..100 progress toward the next level. */
  pctToNext: number;
}

export interface Progression {
  xp: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  pctToNext: number;
  streak: number;
  /** Per-game best/latest mastery, keyed by game id. */
  mastery: Partial<Record<GameKey, MasteryInfo>>;
  /** Local "YYYY-MM-DD" of the last round, if known. */
  lastPlayed: string;
}

/** Coerce an unknown value to a finite, non-negative number (else fallback). */
function num(v: unknown, fallback = 0): number {
  const n = typeof v === 'number' ? v : typeof v === 'string' ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/**
 * XP earned for a completed round.
 * Base accuracy award (half the percentage, capped ~50) plus an optional time
 * bonus. The per-correct reward (PER_CORRECT_XP × correct) is added by the
 * caller so the count of correctly answered items drives the immediate loop.
 */
export function xpFromScore(pct: unknown, timeBonus = 0): number {
  const p = Math.max(0, Math.min(100, num(pct)));
  const base = Math.round(p / 2);
  return base + Math.max(0, Math.round(num(timeBonus)));
}

/** Total XP for a round including per-correct rewards. */
export function xpForRound(
  pct: unknown,
  correct: unknown,
  timeBonus = 0
): number {
  return xpFromScore(pct, timeBonus) + Math.round(PER_CORRECT_XP * num(correct));
}

/**
 * Level derived from total XP. Level 1 at 0 XP; every XP_PER_LEVEL after that
 * is one more level. Always returns a well-formed LevelInfo.
 */
export function levelFromXp(xp: unknown): LevelInfo {
  const t = Math.max(0, Math.floor(num(xp)));
  const xpIntoLevel = t % XP_PER_LEVEL;
  const xpForNextLevel = XP_PER_LEVEL;
  const pctToNext = Math.min(100, Math.round((xpIntoLevel / xpForNextLevel) * 100));
  return { level: Math.floor(t / XP_PER_LEVEL) + 1, xpIntoLevel, xpForNextLevel, pctToNext };
}

/** Mastery band for a percentage result (0..100). Defensive on garbage input. */
export function masteryFromPct(pct: unknown): MasteryInfo {
  const p = Math.max(0, Math.min(100, num(pct)));
  const band = MASTERY_BANDS.find((b) => p >= b.min) ?? MASTERY_BANDS[MASTERY_BANDS.length - 1];
  return { key: band.key, label: band.label, emoji: band.emoji, pct: p };
}

/** "YYYY-MM-DD" for a Date, or for "now" when omitted. */
export function dateStr(d?: Date): string {
  const t = d || new Date();
  const m = String(t.getMonth() + 1).padStart(2, '0');
  const day = String(t.getDate()).padStart(2, '0');
  return `${t.getFullYear()}-${m}-${day}`;
}

function dayNum(s: string): number {
  const t = Date.parse(String(s || ''));
  return Number.isFinite(t) ? Math.floor(t / 86400000) : NaN;
}

/**
 * Consecutive-day streak, derived best-effort.
 * Pass the previously stored {streak, lastPlayed} plus "today" to get the
 * updated streak for the round being recorded. A bare `legacyStreak` (no date)
 * is kept as-is; same-day replays hold the streak; a run following yesterday
 * increments it; a gap resets to 1. All inputs are tolerated.
 */
export function nextStreak(
  streak: unknown,
  lastPlayed: unknown,
  today?: string
): number {
  const t = dateStr(today instanceof Date ? today : undefined);
  const prev = num(streak, 1);
  if (!lastPlayed) return prev === 0 ? 1 : prev;
  const a = dayNum(String(lastPlayed));
  const b = dayNum(t);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return prev === 0 ? 1 : prev;
  if (a === b) return Math.max(1, prev); // same day (replay) — hold streak
  if (b - a === 1) return prev + 1; // played yesterday — extend streak
  return 1; // gap — reset
}

/**
 * Best-effort streak from a list of progress rows (server-side, when history
 * is available). Counts consecutive days ending today (or the most recent day)
 * among unique dates. Handles missing/duplicate/malformed rows gracefully.
 */
export function streakFromRows(rows: unknown[], today?: string): number {
  const t = dateStr(today);
  const seen = new Set<number>();
  for (const r of rows) {
    const row = r as Record<string, unknown> | null;
    const d = row && typeof row === 'object' ? row.updated_at : undefined;
    const dn = typeof d === 'string' ? dayNum(d) : NaN;
    if (Number.isFinite(dn)) seen.add(dn);
  }
  if (seen.size === 0) return 0;
  const days = [...seen].sort((x, y) => y - x);
  const anchor = dayNum(t);
  // Align the very first seen day to today-or-earlier so mid-day gaps don't
  // wrongly zero a run that simply was recorded before today touched yesterday.
  let expect = Number.isFinite(anchor) ? Math.min(days[0], anchor) : days[0];
  let count = 0;
  for (const d of days) {
    if (d === expect) { count++; expect--; }
    else if (d < expect - 1) break; // gap
  }
  return count;
}

/**
 * Sum total XP from either a single progress payload ({xp} or {lastScore})
 * or an array of rows containing nested payloads. Whichever the caller hands
 * us, this reads what exists and never throws.
 */
export function totalXp(rowsOrPayload: unknown): number {
  const arr = Array.isArray(rowsOrPayload) ? rowsOrPayload : [rowsOrPayload];
  let sum = 0;
  for (const item of arr) {
    const row = (item as Record<string, unknown>) ?? {};
    const payload =
      row && typeof row.payload === 'object' ? (row.payload as Record<string, unknown>) : row;
    sum += num(payload.xp, num(payload.lastScore));
  }
  return sum;
}

/** Defensive extractor of a nested per-game mastery record. */
function readMastery(payload: Record<string, unknown>): Partial<Record<GameKey, MasteryInfo>> {
  const out: Partial<Record<GameKey, MasteryInfo>> = {};
  const raw = payload?.mastery;
  if (raw && typeof raw === 'object') {
    for (const key of GAME_KEYS) {
      const m = (raw as Record<string, unknown>)[key];
      if (m && typeof m === 'object') {
        const mm = m as Record<string, unknown>;
        const pct = num(mm.pct, num(mm.lastPct));
        out[key] = {
          key: masteryFromPct(pct).key,
          label: masteryFromPct(pct).label,
          emoji: masteryFromPct(pct).emoji,
          pct,
        };
      }
    }
  }
  // Legacy payloads (no nesting yet): derive the just-played game's mastery.
  const game = payload?.game;
  if (game && !out[game as GameKey] && typeof payload?.lastPct === 'number') {
    out[game as GameKey] = masteryFromPct(payload.lastPct);
  }
  return out;
}

/**
 * Normalize any game progress payload into a well-formed Progression.
 * This is the single read entry point for the games hub and the game pages.
 */
export function readProgression(payload: Record<string, unknown> | null | undefined): Progression {
  const p = payload && typeof payload === 'object' ? payload : {};
  const xp = num(p.xp, num(p.lastScore));
  const levelInfo = levelFromXp(xp);
  const streakRaw = num(p.streak, num(p.streak ? p.streak : 0));
  const streak =
    streakRaw > 0 || (p.lastPlayed && p.streak !== undefined) ? streakRaw : 0;
  return {
    xp,
    level: levelInfo.level,
    xpIntoLevel: levelInfo.xpIntoLevel,
    xpForNextLevel: levelInfo.xpForNextLevel,
    pctToNext: levelInfo.pctToNext,
    streak,
    mastery: readMastery(p),
    lastPlayed: typeof p.lastPlayed === 'string' ? p.lastPlayed : '',
  };
}