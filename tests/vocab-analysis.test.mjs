import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { parseWordList, wordId } from '../src/lib/word-id.mjs';

const read = (f) => fs.readFileSync(new URL(`../src/data/wordlists/${f}`, import.meta.url), 'utf8');
const a1Tr = new Map(parseWordList(read('a1-tr.txt')).map((r) => [r.key, r.tr]));
const cards = new Map(JSON.parse(fs.readFileSync(new URL('../src/data/vocab/a1.json', import.meta.url), 'utf8')).map((c) => [c.word, c.tr]));

for (const [lv, file] of [['A1', 'a1-words.txt'], ['A2', 'a2-words.txt'], ['B1', 'b1-words.txt']]) {
  test(`${lv} word list: unique ids, a Turkish meaning for every word`, () => {
    const rows = parseWordList(read(file));
    const ids = rows.map((r) => wordId(lv, r.word, r.hint, r.dup));
    assert.equal(new Set(ids).size, ids.length, 'duplicate ids');
    const missing = rows.filter((r) => !(r.tr || (lv === 'A1' && (a1Tr.get(r.key) || cards.get(r.word))))).map((r) => r.word);
    assert.deepEqual(missing, []);
    assert.ok(rows.length >= 600, 'enough words for the recommended 600');
  });
}

test('analysis ids match the existing A1 cards', () => {
  const ids = new Set(parseWordList(read('a1-words.txt')).map((r) => wordId('A1', r.word, r.hint, r.dup)));
  const cardIds = JSON.parse(fs.readFileSync(new URL('../src/data/vocab/a1.json', import.meta.url), 'utf8')).map((c) => c.id);
  for (const id of cardIds) assert.ok(ids.has(id), id);
});
