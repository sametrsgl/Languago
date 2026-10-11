// One id rule for vocabulary words, shared by the card drafting script, the
// vocabulary analysis and the vocabulary path (so "known" words line up).
// A word listed twice in a level (e.g. "clean | adjective" and "clean | verb")
// gets its part of speech appended; words without a hint default to "verb".
export function wordId(level, word, hint, isDuplicate) {
  const s = String(word).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${String(level).toLowerCase()}-${s}${isDuplicate ? '-' + String(hint || 'verb').slice(0, 4) : ''}`;
}

/** Parse a word-list file: "word [| pos] [= Turkish]" lines, "#" comments. */
export function parseWordList(text) {
  const rows = String(text).split(/\r?\n/).map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => {
    const [left, tr] = l.split(' = ');
    const [word, hint] = left.split('|').map((s) => s.trim());
    return { key: left.trim(), word, hint: hint || null, tr: tr ? tr.trim() : null };
  });
  const count = new Map();
  for (const r of rows) count.set(r.word.toLowerCase(), (count.get(r.word.toLowerCase()) || 0) + 1);
  return rows.map((r) => ({ ...r, dup: count.get(r.word.toLowerCase()) > 1 }));
}
