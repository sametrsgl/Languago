import test from 'node:test';
import assert from 'node:assert/strict';

import { audienceProfile } from '../src/classroom/core/groups.mjs';
import { defaultTeams } from '../src/classroom/core/teams.mjs';
import { validateItem, wordCount, makePack, SPEAK_MODES } from '../src/classroom/core/pack.mjs';
import { unsafeWords, unsafeEmoji, privacyHits } from '../src/classroom/core/generate.mjs';
import { createGame, audienceFor } from '../src/classroom/games/konusma-carki/logic.mjs';
import { KIDS, TEENS, ADULTS, bankFor, categoriesFor, WYR_TOPIC } from '../src/classroom/games/konusma-carki/banks.mjs';

const LEVELS = ['a1', 'a2', 'b1', 'b2'];
const BANKS = { kids: KIDS, teens: TEENS, adults: ADULTS };
const LABEL_MAX = 18;   // characters on a wheel segment (generate.mjs SPEAK_LABEL_MAX)
const STARTER_MAX = 5;  // words per starter for young groups, "..." counted

const promptsOf = (bank) => bank.categories.flatMap((c) => LEVELS.flatMap((lv) => c.prompts[lv]));
const wyrOf = (bank) => [...bank.wyr.low, ...bank.wyr.high];
const itemsOf = (bank) => [...promptsOf(bank), ...wyrOf(bank)];
// The group's word cap: Genç caps for kids and teens, adult caps for adults.
const capFor = (audience, level) => audienceProfile(audience === 'adults' ? level : `${level}g`).wordCap;

test('every bank has 8 categories × 4 levels × 6 prompts plus 15 + 15 Would You Rather cards', () => {
  for (const [audience, bank] of Object.entries(BANKS)) {
    assert.equal(bank.audience, audience);
    assert.equal(bank.categories.length, 8, audience);
    assert.equal(new Set(bank.categories.map((c) => c.id)).size, 8, `${audience}: category ids`);
    for (const c of bank.categories) {
      assert.ok(c.title.includes(' · ') && c.emoji, `${audience}/${c.id}: title "Türkçe · English" and emoji`);
      assert.deepEqual(Object.keys(c.prompts).sort(), LEVELS, `${audience}/${c.id}: levels`);
      for (const lv of LEVELS) {
        assert.equal(c.prompts[lv].length, 6, `${audience}/${c.id}/${lv}`);
        for (const it of c.prompts[lv]) {
          assert.equal(it.level, lv, it.id);
          assert.equal(it.cat, c.id, it.id);
          assert.notEqual(it.mode, 'wyr', it.id);
        }
      }
    }
    assert.equal(bank.wyr.low.length, 15, `${audience}: wyr low`);
    assert.equal(bank.wyr.high.length, 15, `${audience}: wyr high`);
    for (const it of bank.wyr.low) assert.ok(['a1', 'a2'].includes(it.level), it.id);
    for (const it of bank.wyr.high) assert.ok(['b1', 'b2'].includes(it.level), it.id);
    for (const it of wyrOf(bank)) assert.ok(it.mode === 'wyr' && it.cat === 'wyr', it.id);
    assert.equal(itemsOf(bank).length, 8 * 4 * 6 + 15 + 15, audience);
  }
});

test('every bank item is a complete speak item that passes validateItem', () => {
  for (const [audience, bank] of Object.entries(BANKS)) {
    for (const it of itemsOf(bank)) {
      const v = validateItem(it);
      assert.ok(v.ok, `${it.id}: ${v.problems.join(', ')}`);
      assert.equal(it.type, 'speak', it.id);
      assert.ok(SPEAK_MODES.includes(it.mode), it.id);
      assert.ok(it.id.startsWith(`${audience}-`), it.id);
      for (const key of ['prompt', 'label', 'emoji', 'model', 'tr']) assert.ok(String(it[key] || '').trim(), `${it.id}: ${key}`);
      for (const key of ['starters', 'followUps', 'useful']) assert.ok(Array.isArray(it[key]) && it[key].length, `${it.id}: ${key}`);
      assert.ok(it.label.length <= LABEL_MAX, `${it.id}: label "${it.label}" over ${LABEL_MAX} characters`);
      if (it.mode === 'wyr') assert.ok(it.optA.emoji && it.optB.emoji && it.optA.text !== it.optB.text, `${it.id}: options`);
    }
  }
});

test('labels and emojis do not repeat inside a category or a Would You Rather deck', () => {
  for (const [audience, bank] of Object.entries(BANKS)) {
    const groups = [...bank.categories.map((c) => [c.id, LEVELS.flatMap((lv) => c.prompts[lv])]), ['wyr-low', bank.wyr.low], ['wyr-high', bank.wyr.high]];
    for (const [name, list] of groups) {
      for (const key of ['label', 'emoji']) {
        const values = list.map((it) => it[key]);
        assert.deepEqual(values.filter((v, i) => values.indexOf(v) !== i), [], `${audience}/${name}: repeated ${key}`);
      }
    }
  }
});

test('ids are unique across all three banks', () => {
  const ids = [KIDS, TEENS, ADULTS].flatMap((b) => itemsOf(b).map((it) => it.id));
  const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
  assert.deepEqual(dupes, []);
  assert.equal(ids.length, 3 * 222);
});

test('prompts stay within the word cap of their audience and level', () => {
  for (const [audience, bank] of Object.entries(BANKS)) {
    for (const it of itemsOf(bank)) {
      const cap = capFor(audience, it.level);
      assert.ok(wordCount(it.prompt) <= cap, `${it.id}: "${it.prompt}" has ${wordCount(it.prompt)} words (cap ${cap})`);
    }
  }
  // The caps themselves (spec: A1 Genç 4, A2 Genç 8, B1 Genç 14, B2 Genç 20; adults 10/15/25/40).
  assert.deepEqual(LEVELS.map((lv) => capFor('kids', lv)), [4, 8, 14, 20]);
  assert.deepEqual(LEVELS.map((lv) => capFor('adults', lv)), [10, 15, 25, 40]);
});

test('kids and teens starters have at most 5 words', () => {
  for (const bank of [KIDS, TEENS]) {
    for (const it of itemsOf(bank)) {
      for (const s of it.starters) assert.ok(wordCount(s) <= STARTER_MAX, `${it.id}: starter "${s}"`);
    }
  }
});

test('kids and teens items pass the young safety and privacy checks', () => {
  // The same rule as the AI speaking packs (validateSpeakItems): the safety
  // and privacy word lists on everything shown, personal frames such as
  // "your room" on everything the class is asked.
  for (const bank of [KIDS, TEENS]) {
    for (const it of itemsOf(bank)) {
      const asked = [it.prompt, it.label, ...it.starters, ...it.followUps, it.optA?.text, it.optB?.text].filter(Boolean);
      const shown = [...asked, ...it.useful, it.model, it.tr];
      for (const text of shown) {
        assert.deepEqual(unsafeWords(text), [], `${it.id}: unsafe words in "${text}"`);
        assert.deepEqual(privacyHits(text, { frames: false }), [], `${it.id}: private words in "${text}"`);
      }
      for (const text of asked) assert.deepEqual(privacyHits(text), [], `${it.id}: private frame in "${text}"`);
      assert.deepEqual(unsafeEmoji([it.emoji, it.optA?.emoji, it.optB?.emoji].filter(Boolean).join(' ')), [], `${it.id}: emoji`);
    }
  }
});

test('bankFor and categoriesFor', () => {
  assert.equal(bankFor('kids'), KIDS);
  assert.equal(bankFor('teens'), TEENS);
  assert.equal(bankFor('adults'), ADULTS);
  assert.equal(bankFor('nobody'), null);
  assert.deepEqual(categoriesFor('nobody', 'a1'), []);
  assert.deepEqual(categoriesFor('kids', 'c1'), []);

  for (const [audience, bank] of Object.entries(BANKS)) {
    for (const [i, lv] of LEVELS.entries()) {
      const below = LEVELS[i - 1];
      const topics = categoriesFor(audience, lv);
      assert.equal(topics.length, 9, `${audience}/${lv}`);
      assert.deepEqual(topics.slice(0, 8).map((t) => t.id), bank.categories.map((c) => c.id));
      for (const t of topics.slice(0, 8)) {
        assert.equal(t.count, 6);
        assert.equal(t.items.length, below ? 12 : 6, `${audience}/${lv}/${t.id}`);
        assert.ok(t.items.every((it) => it.level === lv || it.level === below));
      }
      const deck = topics[8];
      assert.equal(deck.id, WYR_TOPIC.id);
      assert.ok(deck.wyr && deck.count > 0);
      assert.equal(deck.count, wyrOf(bank).filter((it) => it.level === lv).length);
      assert.ok(deck.items.every((it) => it.mode === 'wyr' && (it.level === lv || it.level === below)));
    }
  }
  assert.equal(categoriesFor('teens', 'B1').length, 9, 'level is case-insensitive');
});

test('built-in topics feed a game at the group level, and one level easier', () => {
  for (const [groupId, mode] of [['a2g', 'park'], ['b2g', 'arena'], ['b1', 'studio']]) {
    const profile = audienceProfile(groupId, { mode });
    const topics = categoriesFor(audienceFor(profile), profile.level);
    const picked = [topics[0], topics[3], topics[8]].map((t) => ({
      title: t.title, pack: makePack({ id: `speak:${t.id}`, title: t.title, level: profile.level.toUpperCase(), kind: 'speaking', items: t.items }),
    }));
    for (const easier of [false, true]) {
      const s = createGame({ profile, topics: picked, teams: defaultTeams(2, profile.mode), code: 'BANK-1', options: { easier } });
      const want = easier ? LEVELS[LEVELS.indexOf(profile.level) - 1] : profile.level;
      assert.equal(s.pool.talk.length, 12, `${groupId} easier=${easier}`);
      assert.ok(s.pool.wyr.length > 0, `${groupId} easier=${easier}: wyr`);
      assert.ok([...s.pool.talk, ...s.pool.wyr].every((id) => s.items[id].level === want), `${groupId} easier=${easier}: level`);
      assert.equal(s.wheel.length, 8);
    }
  }
});
