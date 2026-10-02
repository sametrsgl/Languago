// Konuşma Çarkı (speaking wheel): the built-in speaking banks in one place.
// Pure data access, no DOM. Three banks, one per audience (see audienceFor
// in logic.mjs): kids (Oyun Parkı), teens (Arena, young groups) and adults
// (Stüdyo). Each bank has 8 categories × 4 levels × 6 `speak` items plus a
// Would You Rather deck: `low` (a1/a2) and `high` (b1/b2), 15 cards each.
// The bank files themselves are in banks-kids.mjs, banks-teens.mjs and
// banks-adults.mjs; ids are stable, so saved games keep working.
import { KIDS } from './banks-kids.mjs';
import { TEENS } from './banks-teens.mjs';
import { ADULTS } from './banks-adults.mjs';

export { KIDS, TEENS, ADULTS };

const BANKS = { kids: KIDS, teens: TEENS, adults: ADULTS };
const LEVELS = ['a1', 'a2', 'b1', 'b2'];

// The Would You Rather deck as a setup topic (teacher text is Turkish).
export const WYR_TOPIC = { id: 'wyr', title: 'Hangisini seçerdiniz? · Would You Rather', emoji: '⚖️' };

/**
 * The bank for an audience ('kids' | 'teens' | 'adults'), or null.
 * @param {string} audience
 */
export function bankFor(audience) {
  return BANKS[audience] || null;
}

/**
 * The topics a group can pick: the bank's 8 categories, then the Would You
 * Rather deck of the level's band (`wyr: true`). `items` holds the cards at
 * `level` and at the level below, so "Bir seviye kolaylaştır" has cards
 * (createGame keeps the level it needs); `count` counts the cards at `level`.
 * Unknown audience or level: [].
 * @param {string} audience
 * @param {string} level 'a1'..'b2'
 * @returns {{ id: string, title: string, emoji: string, count: number, items: object[], wyr?: boolean }[]}
 */
export function categoriesFor(audience, level) {
  const bank = bankFor(audience);
  const lv = String(level || '').toLowerCase();
  const i = LEVELS.indexOf(lv);
  if (!bank || i < 0) return [];
  const below = i > 0 ? LEVELS[i - 1] : null;
  const topics = bank.categories.map((c) => ({
    id: c.id, title: c.title, emoji: c.emoji,
    count: c.prompts[lv].length,
    items: [...c.prompts[lv], ...(below ? c.prompts[below] : [])],
  }));
  // Would You Rather cards carry their own level inside the low/high decks.
  const wyr = [...bank.wyr.low, ...bank.wyr.high];
  const at = (l) => wyr.filter((it) => it.level === l);
  topics.push({ ...WYR_TOPIC, wyr: true, count: at(lv).length, items: [...at(lv), ...(below ? at(below) : [])] });
  return topics;
}
