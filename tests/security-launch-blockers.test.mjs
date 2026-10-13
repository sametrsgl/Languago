import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const migrationRel = 'supabase/migrations/20260911_v2_security_launch_blockers.sql';

function withoutComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

test('AI material generator is teacher-only and authorizes before any AI call', () => {
  const source = read('src/pages/api/materials/create.ts');
  const post = source.slice(source.indexOf('export const POST'));
  const authIdx = post.indexOf('apiUser(ctx)');
  const aiIdx = post.indexOf('aiJson(');
  assert.ok(authIdx > -1 && aiIdx > -1 && authIdx < aiIdx, 'auth must come before the AI call');
  assert.match(post, /u\.role !== 'teacher' && u\.role !== 'admin'/, 'teachers only');
  // bounded body: room for a pasted text ("Metinden üret", 6000 characters) but no more
  const bound = Number((post.match(/request\.text\(\)\)\.slice\(0, (\d+)\)/) || [])[1]);
  assert.ok(bound > 0 && bound <= 16000, 'request body is bounded');
  assert.match(post, />= 20/, 'daily limit before spending AI time');
  assert.ok(!existsSync(new URL('../src/pages/api/materials/generate.ts', import.meta.url)), 'the old public generator is gone');
});

test('AI drafts are checked before a teacher sees them', async () => {
  const { checkDraft, applyBlind } = await import('../src/lib/material-check.mjs');
  assert.equal(checkDraft(null, { level: 'A1', count: 8 }).ok, false);
  assert.equal(checkDraft({ title: 'x' }, { level: 'A1', count: 8 }).ok, false);
  const q = (s) => ({ q: s + ' ___ here.', o: ['is', 'are', 'am', 'be'] });
  const text = Array.from({ length: 100 }, (_, i) => 'word' + i).join(' ');
  const draft = { title: 'To be', tr: 'Olmak', theme: 'Me', explain: ['a', 'b'], examples: [['I am', 'Ben'], ['You are', 'Sen']], mistake: 'm',
    grammar: [q('He'), q('She'), q('It'), q('This'), q('That'), { q: 'no blank', o: ['a', 'b', 'c', 'd'] }, { q: 'dup ___', o: ['a', 'a', 'c', 'd'] }],
    reading: { title: 'T', text, questions: [{ q: '1?', o: ['a', 'b', 'c', 'd'] }, { q: '2?', o: ['a', 'b', 'c', 'd'] }, { q: '3?', o: ['a', 'b', 'c', 'd'] }] },
    writing: { prompt_en: 'Write', prompt: 'Yaz', focus: 'f', model: 'm' }, speaking: { read: ['a', 'b'], ask: 'q?' } };
  const r = checkDraft(draft, { level: 'A1', count: 8 });
  assert.equal(r.ok, true);
  assert.equal(r.day.grammar.questions.length, 5, 'items without one blank or with duplicate options are dropped');
  // sorted options: am, are, be, is → the key "is" is D
  const { day, dropped } = applyBlind(r.day, { grammar: ['D', 'B', 'D', 'D', 'D'], reading: [] });
  assert.equal(dropped, 1);
  assert.equal(day.grammar.questions.length, 4);
});

test('OAuth start derives callback from a safe request/configured origin, not production SITE_URL fallback', () => {
  const source = read('src/pages/api/auth/oauth/google.ts');
  assert.doesNotMatch(source, /const\s+SITE\s*=\s*import\.meta\.env\.SITE_URL\s*\|\|\s*['"]https:\/\/www\.languago\.site['"]/, 'do not hard-default OAuth callback to production');
  assert.match(source, /resolveAllowedOrigin\(/, 'route must use a safe origin resolver');
  assert.match(source, /new URL\(request\.url\)\.origin/, 'local/staging callback should derive from current request origin after allowlist checks');
  assert.match(source, /redirectTo:\s*`\$\{origin\}\/api\/auth\/callback`/, 'OAuth redirectTo should use the resolved origin');
});

test('OAuth callback validates the exchanged session with getUser before redirecting into the app', () => {
  const source = read('src/pages/api/auth/callback.ts');
  const exchangeIdx = source.indexOf('exchangeCodeForSession');
  const getUserIdx = source.indexOf('auth.getUser(');
  const redirectIdx = source.indexOf('return redirect(next');
  assert.ok(exchangeIdx > -1, 'callback must exchange the auth code');
  assert.ok(getUserIdx > exchangeIdx, 'callback must validate session with auth.getUser after exchange');
  assert.ok(getUserIdx < redirectIdx, 'callback must validate before app redirect');
});

test('follow-up SQL migration closes launch-blocker RLS/RPC gaps without silent data deletion', () => {
  assert.ok(existsSync(path.join(root, migrationRel)), 'follow-up security migration must exist');
  const sql = read(migrationRel);
  const executable = withoutComments(sql);

  assert.match(executable, /raise\s+exception[^;]*duplicate[^;]*tutor_bookings[^;]*slot_id/is, 'unique(slot_id) migration must fail clearly when duplicate slot bookings already exist');
  assert.match(executable, /alter\s+table\s+public\.tutor_bookings\s+add\s+constraint\s+tutor_bookings_slot_id_unique\s+unique\s*\(slot_id\)/is, 'one booking per slot must be enforced by a unique(slot_id) constraint');
  assert.match(executable, /create\s+or\s+replace\s+function\s+public\.claim_tutor_slot\(/is, 'atomic slot-claim RPC must exist');
  const claimBody = executable.match(/create\s+or\s+replace\s+function\s+public\.claim_tutor_slot\([\s\S]*?\$\$;\s*/i)?.[0] || '';
  assert.match(claimBody, /join\s+public\.roster_members[\s\S]*rm\.student_id\s*=\s*auth\.uid\(\)/is, 'claim RPC must restrict booking to an enrolled student');
  assert.match(claimBody, /insert\s+into\s+public\.tutor_bookings/is, 'claim RPC must create the booking atomically');
  assert.doesNotMatch(executable, /delete\s+from\s+public\.tutor_bookings/i, 'migration must never delete duplicate booking data silently');

  assert.match(executable, /drop\s+policy\s+if\s+exists\s+"profiles_update_own"/is, 'profile owner update policy must be replaced');
  assert.match(executable, /create\s+policy\s+"profiles_update_own_safe"[\s\S]*with\s+check[\s\S]*role\s*=\s*\(\s*select\s+role\s+from\s+public\.profiles/is, 'profile update policy/trigger must preserve existing role');
  assert.match(executable, /drop\s+policy\s+if\s+exists\s+"subs_owner_all"/is, 'subscription owner write policy must be dropped');
  assert.match(executable, /create\s+policy\s+"subs_owner_select"/is, 'subscription owners should only get read policy');
  assert.doesNotMatch(executable, /create\s+policy\s+"subs_owner_(insert|update|delete|all)"/i, 'subscription owner write policies must not be recreated');

  assert.match(executable, /get_teacher_students[\s\S]*join\s+public\.class_roster[\s\S]*cr\.teacher_id\s*=\s*p_teacher/is, 'teacher student RPC must stay bounded to the teacher roster');
  assert.match(executable, /get_booking_students[\s\S]*p_teacher\s+<>\s+auth\.uid\(\)/is, 'booking roster RPC must bind p_teacher to auth.uid()');
  assert.match(executable, /revoke\s+execute\s+on\s+function\s+public\.get_child_by_email\(uuid,\s*text\)\s+from\s+authenticated/is, 'child email lookup must not let clients self-authorize arbitrary links');
  assert.doesNotMatch(executable, /with\s+check\s*\([^;]*auth\.uid\(\)\s*=\s*parent_id[^;]*\)[^;]*;/is, 'family_links must not keep direct parent self-insert authorization');
  assert.doesNotMatch(executable, /raw_user_meta_data|user_metadata/i, 'migration must not grant parent/teacher role from client metadata');
  assert.match(executable, /create\s+or\s+replace\s+function\s+public\.book_tutor_slot\(/is, 'booking RPC must exist');
  assert.match(executable, /book_tutor_slot[\s\S]*update\s+public\.tutor_slots[\s\S]*insert\s+into\s+public\.tutor_bookings/is, 'booking RPC must close the slot and insert the booking in one transaction');
});

test('state-changing JSON endpoints bound request bodies before parsing', () => {
  for (const rel of [
    'src/pages/api/auth/signin.ts',
    'src/pages/api/auth/signup.ts',
    'src/pages/api/student/tutor-book.ts',
    'src/pages/api/notifications.ts',
    'src/pages/api/vocab/review.ts',
    'src/pages/dashboard/progress.ts',
  ]) {
    const source = read(rel);
    assert.match(source, /readJsonBody(?:<[^>]+>)?\(request,/, `${rel} uses the shared bounded JSON parser`);
    assert.match(source, /RequestBodyError/, `${rel} handles oversized bodies`);
  }
});

test('durable vocabulary review reports unavailable persistence instead of pretending to save', () => {
  const source = read('src/pages/api/vocab/review.ts');
  assert.match(source, /review_unavailable/, 'review migration failures have a distinct client-visible error');
  assert.match(source, /status\s*===\s*503|,\s*503\)/, 'unavailable review persistence returns 503');
});

