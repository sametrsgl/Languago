import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const root = path.resolve('C:/hermes/workspaces/languago-v2');
const read = (rel) => readFileSync(path.join(root, rel), 'utf8');
const migrationRel = 'supabase/migrations/20260911_v2_security_launch_blockers.sql';

function withoutComments(sql) {
  return sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
}

test('material generator requires a validated Supabase user before any costly generation work', () => {
  const source = read('src/pages/api/materials/generate.ts');
  const postStart = source.indexOf('export const POST');
  assert.ok(postStart > -1, 'POST handler must exist');
  const post = source.slice(postStart);
  const authIdx = post.indexOf('getSessionUser(');
  const llmIdx = post.indexOf('callLLM(');
  assert.ok(source.includes("from '../../../lib/auth'"), 'route must import server auth helper');
  assert.ok(authIdx > -1, 'POST must validate the server-side user');
  assert.ok(llmIdx > -1, 'POST must still call the LLM after validation');
  assert.ok(authIdx < llmIdx, 'auth check must happen before the LLM call');
  assert.match(post, /return\s+jsonError\(401,/, 'signed-out requests must fail 401');
});

test('material generator bounds untrusted input and sanitizes with a parser, not regex-only HTML stripping', () => {
  const source = read('src/pages/api/materials/generate.ts');
  assert.match(source, /MAX_REQUEST_BYTES\s*=\s*(?:[1-9]\d{2,3}|4_?096)/, 'request body must be byte bounded');
  assert.match(source, /MAX_PAGES\s*=\s*[1-6]\b/, 'page count must be capped to a small paid-cost bound');
  assert.match(source, /import\(['"]parse5['"]\)|from ['"]parse5['"]/, 'sanitizer must use the existing parse5 parser dependency');
  const sanitizer = source.slice(source.indexOf('async function sanitizeModelHtml'));
  assert.ok(!/function sanitizeModelHtml[\s\S]{0,2500}\.replace\(\/<script/i.test(source), 'sanitizer must not be regex-only script stripping');
  assert.match(sanitizer, /ALLOWED_TAGS/, 'parser sanitizer should keep an explicit tag allowlist');
});

test('PDF rendering disables page JavaScript and blocks browser network requests', () => {
  const source = read('src/pages/api/materials/generate.ts');
  assert.match(source, /setJavaScriptEnabled\(false\)/, 'Chromium page JavaScript must be disabled before rendering model HTML');
  assert.match(source, /setRequestInterception\(true\)/, 'Chromium request interception must be enabled');
  assert.match(source, /request\.abort\(\)/, 'network requests must be aborted');
  assert.doesNotMatch(source, /waitUntil:\s*['"]networkidle0['"]/, 'rendering should not wait on network once network is blocked');
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
  assert.match(executable, /update\s+public\.tutor_slots[\s\S]*where[\s\S]*status\s*=\s*'open'[\s\S]*returning/is, 'claim RPC must atomically update only open slots and use RETURNING');
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
  ]) {
    const source = read(rel);
    assert.match(source, /readJsonBody\(request,/, `${rel} uses the shared bounded JSON parser`);
    assert.match(source, /RequestBodyError/, `${rel} handles oversized bodies`);
  }
});
