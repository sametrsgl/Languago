import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const draftKey = 'languago:placement-draft';
const draft = JSON.stringify({ answers: [{ id: 'placement-00001', selectedIndex: 0 }] });
const flush = () => new Promise((resolve) => setImmediate(resolve));

// Execute the actual inline form script. Only browser/network boundaries are doubles.
function formHarness(page, { raw = draft, storageFailure, save = 'success', auth = { ok: true, hasSession: true } } = {}) {
  const source = readFileSync(new URL(`../src/pages/${page}.astro`, import.meta.url), 'utf8');
  const script = source.match(/<script is:inline>([\s\S]*?)<\/script>/)[1];
  const elements = new Map();
  let submit;
  const form = { addEventListener: (event, listener) => { if (event === 'submit') submit = listener; } };
  const element = (id) => {
    if (id === `${page}-form`) return form;
    if (!elements.has(id)) elements.set(id, { value: '', textContent: '', innerHTML: '', disabled: false });
    return elements.get(id);
  };
  const values = new Map(raw === null ? [] : [[draftKey, raw]]);
  const storage = {
    getItem(key) { if (storageFailure === 'read') throw new Error('SecurityError'); return values.get(key) ?? null; },
    removeItem(key) { if (storageFailure === 'remove') throw new Error('SecurityError'); values.delete(key); },
  };
  const timers = new Map();
  const calls = [];
  let pendingSave;
  const location = { href: '' };
  const context = {
    document: { getElementById: element }, window: { location }, AbortController,
    setTimeout(callback, ms) { const id = timers.size + 1; timers.set(id, { callback, ms }); return id; },
    clearTimeout(id) { timers.delete(id); },
    fetch(url, options) {
      calls.push({ url, options });
      if (url === `/api/auth/${page}`) return Promise.resolve({ json: async () => auth });
      assert.equal(url, '/api/placement/save');
      if (save === 'network-error') return Promise.reject(new Error('offline'));
      if (save === 'throw') throw new Error('fetch unavailable');
      if (save === 'pending') return new Promise((resolve, reject) => {
        pendingSave = resolve;
        options.signal?.addEventListener('abort', () => reject(new Error('AbortError')), { once: true });
      });
      return Promise.resolve({ ok: save === 'success' });
    },
  };
  Object.defineProperty(context, 'localStorage', { get() {
    if (storageFailure === 'getter') throw new Error('SecurityError');
    return storage;
  } });
  vm.runInNewContext(script, context);
  return {
    values, timers, calls, location, element,
    submit: async () => { submit({ preventDefault() {} }); await flush(); },
    completeSave: async () => { pendingSave({ ok: true }); await flush(); },
  };
}

for (const page of ['signin', 'signup']) {
  for (const failure of ['getter', 'read', 'remove']) {
    test(`${page}: ${failure} storage failure cannot undo successful authentication`, async () => {
      const app = formHarness(page, { storageFailure: failure });
      await app.submit();
      assert.equal(app.location.href, '/dashboard');
      assert.equal(app.element(`${page}-feedback`).innerHTML, '');
      assert.equal(app.timers.size, 0);
    });
  }

  for (const raw of [null, '{broken', 'null', '{}', '{"answers":[]}', '{"answers":"invalid"}']) {
    test(`${page}: ignores absent or malformed draft ${raw}`, async () => {
      const app = formHarness(page, { raw });
      await app.submit();
      assert.equal(app.location.href, '/dashboard');
      assert.equal(app.calls.length, 1, 'no placement request for an unusable draft');
      assert.equal(app.values.get(draftKey) ?? null, raw, 'do not discard unknown data');
    });
  }

  for (const save of ['http-error', 'network-error', 'throw']) {
    test(`${page}: ${save} preserves the draft and still navigates`, async () => {
      const app = formHarness(page, { save });
      await app.submit();
      assert.equal(app.location.href, '/dashboard');
      assert.equal(app.values.get(draftKey), draft);
      assert.equal(app.timers.size, 0);
    });
  }

  test(`${page}: successful transfer sends the draft and removes only the saved value`, async () => {
    const app = formHarness(page);
    await app.submit();
    assert.equal(app.location.href, '/dashboard');
    assert.equal(app.values.has(draftKey), false);
    assert.equal(app.calls[1].options.method, 'POST');
    assert.deepEqual(JSON.parse(app.calls[1].options.body), JSON.parse(draft));
    assert.equal(app.timers.size, 0);
  });

  test(`${page}: slow transfer cannot erase a newer draft from another tab`, async () => {
    const app = formHarness(page, { save: 'pending' });
    await app.submit();
    const newer = JSON.stringify({ answers: [{ id: 'placement-00002', selectedIndex: 1 }] });
    app.values.set(draftKey, newer);
    await app.completeSave();
    assert.equal(app.location.href, '/dashboard');
    assert.equal(app.values.get(draftKey), newer);
    assert.equal(app.timers.size, 0);
  });

  test(`${page}: hung optional transfer is aborted after three seconds, keeping the draft`, async () => {
    const app = formHarness(page, { save: 'pending' });
    await app.submit();
    assert.equal(app.location.href, '');
    assert.equal(app.timers.size, 1);
    const timer = [...app.timers.values()][0];
    assert.equal(timer.ms, 3000);
    timer.callback();
    await flush();
    assert.equal(app.calls[1].options.signal.aborted, true);
    assert.equal(app.location.href, '/dashboard');
    assert.equal(app.values.get(draftKey), draft);
    assert.equal(app.timers.size, 0);
  });

  test(`${page}: failed authentication never transfers a draft or redirects`, async () => {
    const app = formHarness(page, { auth: { ok: false, error: { message: 'Test error' } } });
    await app.submit();
    assert.equal(app.location.href, '');
    assert.equal(app.calls.length, 1);
    assert.equal(app.element(`${page}-submit`).disabled, false);
    assert.match(app.element(`${page}-feedback`).innerHTML, /Test error/);
    assert.equal(app.values.get(draftKey), draft);
  });
}

test('signup without a session shows email confirmation without transferring or touching the draft', async () => {
  const app = formHarness('signup', { storageFailure: 'getter', auth: { ok: true, hasSession: false } });
  await app.submit();
  assert.equal(app.calls.length, 1);
  assert.equal(app.location.href, '');
  assert.match(app.element('signup-feedback').innerHTML, /Hesabın oluşturuldu/);
  assert.equal(app.values.get(draftKey), draft);
});

test('signup without a session does not call the authenticated placement endpoint', async () => {
  const app = formHarness('signup', { auth: { ok: true, hasSession: false } });
  await app.submit();
  assert.equal(app.calls.length, 1);
  assert.equal(app.values.get(draftKey), draft);
});
