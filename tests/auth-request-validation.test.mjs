import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';

// Execute the actual handlers with only the external auth boundary stubbed.
const helperSource = stripTypeScriptTypes(readFileSync(new URL('../src/lib/request-body.ts', import.meta.url), 'utf8'));
const helper = await import(`data:text/javascript;base64,${Buffer.from(helperSource).toString('base64')}`);

function loadHandler(route, calls) {
  const source = stripTypeScriptTypes(readFileSync(new URL(`../src/pages/api/auth/${route}.ts`, import.meta.url), 'utf8'))
    .replace(/^import .* from .*;\r?\n/gm, '')
    .replace('export const POST', 'const POST');
  const createSupabaseClient = () => {
    calls.push('createClient');
    return { auth: {
      signInWithPassword: async (payload) => { calls.push(payload); return { error: null }; },
      signUp: async (payload) => { calls.push(payload); return { data: { session: null }, error: null }; },
    } };
  };
  return new Function('readJsonBody', 'RequestBodyError', 'createSupabaseClient', 'pageCookieSource', `${source}\nreturn POST;`)(
    helper.readJsonBody, helper.RequestBodyError, createSupabaseClient, () => ({}),
  );
}

for (const route of ['signin', 'signup']) {
  function invoke(handler, body) {
    return handler({ request: new Request(`https://example.test/api/auth/${route}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body,
    }), cookies: {} });
  }

  test(`${route}: rejects non-object JSON before contacting auth`, async () => {
    const calls = [];
    const handler = loadHandler(route, calls);
    for (const body of ['null', '[]', '[{}]', 'true', 'false', '42', '"text"']) {
      const response = await invoke(handler, body);
      assert.equal(response.status, 400, body);
      assert.match(response.headers.get('content-type'), /application\/json/);
      assert.equal((await response.json()).error.message, 'Geçersiz istek. Lütfen tekrar dene.');
    }
    assert.deepEqual(calls, []);
  });

  test(`${route}: preserves malformed, oversized and field validation responses`, async () => {
    const calls = [];
    const handler = loadHandler(route, calls);
    for (const body of ['', '{']) assert.equal((await invoke(handler, body)).status, 400);
    assert.equal((await invoke(handler, JSON.stringify({ email: 'x'.repeat(8192) }))).status, 413);
    for (const body of [{}, { email: 123, password: [] }, { email: 'invalid', password: '' }]) {
      const response = await invoke(handler, JSON.stringify(body));
      assert.equal(response.status, 400);
      const { error } = await response.json();
      assert.ok(error.fields.email);
      assert.ok(error.fields.password);
    }
    assert.deepEqual(calls, []);
  });

  test(`${route}: valid objects still reach auth with trimmed email`, async () => {
    const calls = [];
    const handler = loadHandler(route, calls);
    const response = await invoke(handler, JSON.stringify({ email: ' learner@example.test ', password: 'test-only-password', fullName: ' Learner ' }));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).ok, true);
    assert.equal(calls.length, 2);
    assert.equal(calls[1].email, 'learner@example.test');
    assert.equal(calls[1].password, 'test-only-password');
    if (route === 'signup') assert.equal(calls[1].options.data.full_name, 'Learner');
  });
}
