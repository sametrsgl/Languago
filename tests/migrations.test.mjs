import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';

// Every function body in a migration opens and closes with $$ (a lost $ once
// broke a migration before it reached the database).
test('migration function bodies are well delimited', () => {
  const dir = new URL('../supabase/migrations/', import.meta.url);
  for (const f of readdirSync(dir).filter((x) => x.startsWith('2026101') && x.endsWith('.sql'))) {
    const sql = readFileSync(new URL(f, dir), 'utf8');
    const fns = (sql.match(/create or replace function/g) || []).length;
    const open = (sql.match(/\bas \$\$\s*$/gm) || []).length;
    assert.equal(open, fns, `${f}: every function has "as $$"`);
    assert.equal((sql.split('$$').length - 1) % 2, 0, `${f}: $$ pairs`);
    assert.doesNotMatch(sql, /(\bas \$|^\$;)$/m, `${f}: no single $ delimiters`);
  }
});
