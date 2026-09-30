// Seeded randomness for the classroom games.
// hashSeed + mulberry32 are byte-for-byte the algorithm used by
// src/lib/game-classroom.mjs, so a board code gives the same shuffle in both.

export function hashSeed(str) {
  let h = 2166136261;
  const s = String(str || '');
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function rngFor(seed) {
  return mulberry32(hashSeed(seed));
}

export function shuffleSeeded(list, seed) {
  const arr = Array.from(list || []);
  const rng = rngFor(seed);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
  }
  return arr;
}

// Board codes are easy English words plus a number ("MANGO-42"), so reading
// one out to another class is a tiny bit of English too.
const CODE_WORDS = [
  'MANGO', 'PANDA', 'TIGER', 'LEMON', 'ROCKET', 'PLANET', 'PIRATE', 'DRAGON',
  'CASTLE', 'GARDEN', 'ORANGE', 'PENCIL', 'RABBIT', 'SPIDER', 'TURTLE', 'WIZARD',
  'COOKIE', 'MONKEY', 'ISLAND', 'COMET', 'ZEBRA', 'OCEAN', 'CANDLE', 'BANANA',
];

export function makeBoardCode(entropy) {
  const rng = rngFor(`code:${entropy}`);
  const word = CODE_WORDS[Math.floor(rng() * CODE_WORDS.length)];
  const num = 10 + Math.floor(rng() * 90);
  return `${word}-${num}`;
}

export function normalizeBoardCode(code) {
  const clean = String(code || '').toUpperCase().replace(/[^A-Z0-9-]/g, '').slice(0, 24);
  return clean || null;
}
