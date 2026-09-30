// Team identities per audience mode, and the seat bag that picks who speaks.
// Colours are always paired with a shape, so no information is colour-only.

export const TEAM_COLORS = [
  { key: 'blue', hex: '#2f6fed', ink: '#ffffff', tr: 'Mavi', en: 'Blue', shape: 'circle' },
  { key: 'red', hex: '#e04f39', ink: '#ffffff', tr: 'Kırmızı', en: 'Red', shape: 'triangle' },
  { key: 'green', hex: '#23995a', ink: '#ffffff', tr: 'Yeşil', en: 'Green', shape: 'square' },
  { key: 'yellow', hex: '#f4b400', ink: '#3b2a00', tr: 'Sarı', en: 'Yellow', shape: 'star' },
  { key: 'purple', hex: '#8a55d6', ink: '#ffffff', tr: 'Mor', en: 'Purple', shape: 'diamond' },
  { key: 'orange', hex: '#f2792b', ink: '#ffffff', tr: 'Turuncu', en: 'Orange', shape: 'hexagon' },
  { key: 'teal', hex: '#119c97', ink: '#ffffff', tr: 'Turkuaz', en: 'Teal', shape: 'heart' },
  { key: 'pink', hex: '#e0508f', ink: '#ffffff', tr: 'Pembe', en: 'Pink', shape: 'moon' },
];

const PARK_ANIMALS = ['Pandas', 'Foxes', 'Frogs', 'Lions', 'Penguins', 'Tigers', 'Turtles', 'Rabbits'];
const ARENA_EMBLEMS = ['bolt', 'flame', 'wave', 'comet', 'crown', 'diamond', 'rocket', 'shield'];
const ARENA_NAMES = ['Bolt', 'Flame', 'Wave', 'Comet', 'Crown', 'Diamond', 'Rocket', 'Shield'];
const STUDIO_NAMES = [
  'The Irregular Verbs', 'Present Perfectionists', 'Flat Whites', 'The Phrasal Verbs',
  'Past Masters', 'Double Espressos', 'The Modal Minds', 'Silent Letters',
];

export function defaultTeams(count, modeId) {
  const n = Math.max(2, Math.min(8, Number(count) || 4));
  return Array.from({ length: n }, (_, i) => makeTeam(i, modeId));
}

export function makeTeam(i, modeId) {
  const c = TEAM_COLORS[i % TEAM_COLORS.length];
  let name;
  if (modeId === 'park') name = `${c.en} ${PARK_ANIMALS[i % PARK_ANIMALS.length]}`;
  else if (modeId === 'arena') name = `Team ${ARENA_NAMES[i % ARENA_NAMES.length]}`;
  else name = STUDIO_NAMES[i % STUDIO_NAMES.length];
  return {
    id: `t${i + 1}`,
    index: i,
    name,
    color: c.key,
    hex: c.hex,
    ink: c.ink,
    shape: c.shape,
    emblem: ARENA_EMBLEMS[i % ARENA_EMBLEMS.length],
    animal: PARK_ANIMALS[i % PARK_ANIMALS.length].replace(/s$/, '').replace(/xe$/, 'x'),
    seats: 5,
    motto: '',
  };
}

// Seat bag: every present seat speaks once before anyone speaks twice,
// and the same seat is never drawn twice in a row.
export function drawSeat(bagState, seats, rng = Math.random) {
  const count = Math.max(1, Math.min(8, Number(seats) || 1));
  const state = bagState && Array.isArray(bagState.left) ? bagState : { left: [], last: null };
  let left = state.left.filter((s) => s >= 1 && s <= count);
  if (!left.length) left = Array.from({ length: count }, (_, i) => i + 1);
  let pool = left.length > 1 ? left.filter((s) => s !== state.last) : left;
  if (!pool.length) pool = left;
  const seat = pool[Math.floor(rng() * pool.length)];
  return { seat, bag: { left: left.filter((s) => s !== seat), last: seat } };
}

// Small inline SVG glyphs for team shapes and Arena emblems (no icon font).
export const SHAPE_PATHS = {
  circle: '<circle cx="12" cy="12" r="9"/>',
  triangle: '<path d="M12 3 22 20H2z"/>',
  square: '<rect x="3.5" y="3.5" width="17" height="17" rx="2.5"/>',
  star: '<path d="m12 2.5 2.9 6.1 6.6.8-4.9 4.5 1.3 6.6L12 17.2l-5.9 3.3 1.3-6.6-4.9-4.5 6.6-.8z"/>',
  diamond: '<path d="M12 2 22 12 12 22 2 12z"/>',
  hexagon: '<path d="M7 3h10l5 9-5 9H7l-5-9z"/>',
  heart: '<path d="M12 21s-8.5-5.4-8.5-11.3C3.5 6.5 6 4.5 8.6 4.5c1.6 0 2.8.8 3.4 2 .6-1.2 1.8-2 3.4-2 2.6 0 5.1 2 5.1 5.2C20.5 15.6 12 21 12 21z"/>',
  moon: '<path d="M15.5 3.2A9 9 0 1 0 20.8 15 7.2 7.2 0 0 1 15.5 3.2z"/>',
};

export const EMBLEM_PATHS = {
  bolt: '<path d="M13.5 2 5 13.5h6L9.5 22 19 9.5h-6z"/>',
  flame: '<path d="M12 22c4.1 0 7-2.8 7-6.8 0-3.4-2.1-5.5-3.6-7.2-.3 1.8-1.1 3-2.3 3.6.3-3.4-1.3-6.6-4.6-9.6.4 3.9-1.4 6.1-3 8.1C4.3 11.6 5 13.6 5 15.2 5 19.2 7.9 22 12 22z"/>',
  wave: '<path d="M2 15c2.2 0 2.8-2.5 5-2.5S9.8 15 12 15s2.8-2.5 5-2.5 2.8 2.5 5 2.5v5H2zM2 9c2.2 0 2.8-2.5 5-2.5S9.8 9 12 9s2.8-2.5 5-2.5S19.8 9 22 9v3c-2.2 0-2.8-2.5-5-2.5S14.2 12 12 12s-2.8-2.5-5-2.5S4.2 12 2 12z"/>',
  comet: '<circle cx="16" cy="8" r="5"/><path d="M12.5 11.5 3 21M11 8.8 4 12M15.2 12.9 12 20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" fill="none"/>',
  crown: '<path d="M3 7.5 7.5 12 12 5l4.5 7L21 7.5 19.5 18h-15zM4.5 19.5h15V21h-15z"/>',
  diamond: '<path d="M6.5 3h11L22 9l-10 12L2 9zM2 9h20" />',
  rocket: '<path d="M12 2c3.5 2.3 5.5 6.2 5.5 10.2L15 16H9l-2.5-3.8C6.5 8.2 8.5 4.3 12 2zm0 6.2a1.9 1.9 0 1 0 0 3.8 1.9 1.9 0 0 0 0-3.8zM9 17.5h6L12 22z"/>',
  shield: '<path d="M12 2 20 5v6.5c0 5-3.4 8.9-8 10.5-4.6-1.6-8-5.5-8-10.5V5z"/>',
};

export function glyph(kind, name, cls = '') {
  const body = (kind === 'emblem' ? EMBLEM_PATHS : SHAPE_PATHS)[name] || SHAPE_PATHS.circle;
  return `<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">${body}</svg>`;
}
