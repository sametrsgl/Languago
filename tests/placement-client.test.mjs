import test from 'node:test';
import assert from 'node:assert/strict';
import { checkPlacementAnswer, PLACEMENT_CHECK_TIMEOUT_MS } from '../src/lib/placement-client.mjs';

test('placement answer client returns the grading payload and clears its timer', async () => {
  let scheduled;
  let cleared;
  const payload = { correct: true, correctIndex: 1, why: '' };
  const result = await checkPlacementAnswer(async (url, options) => {
    assert.equal(url, '/api/placement/check');
    assert.equal(options.method, 'POST');
    assert.equal(options.headers['Content-Type'], 'application/json');
    assert.deepEqual(JSON.parse(options.body), { id: 'q-1', selectedIndex: 1 });
    assert.ok(options.signal);
    return { ok: true, json: async () => payload };
  }, 'q-1', 1, {
    setTimeoutImpl(callback, ms) {
      scheduled = { callback, ms };
      return 7;
    },
    clearTimeoutImpl(id) {
      cleared = id;
    },
  });

  assert.deepEqual(result, payload);
  assert.equal(scheduled.ms, PLACEMENT_CHECK_TIMEOUT_MS);
  assert.equal(cleared, 7);
});

test('placement answer client rejects non-success responses', async () => {
  await assert.rejects(
    checkPlacementAnswer(async () => ({ ok: false, json: async () => ({}) }), 'q-1', 0),
    /check/,
  );
});

test('placement answer client aborts a stalled request at the deadline', async () => {
  let timeoutCallback;
  let cleared;
  const pending = checkPlacementAnswer((_url, { signal }) => new Promise((resolve, reject) => {
    signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
  }), 'q-1', 0, {
    timeoutMs: 10,
    setTimeoutImpl(callback) {
      timeoutCallback = callback;
      return 9;
    },
    clearTimeoutImpl(id) {
      cleared = id;
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  timeoutCallback();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cleared, 9);
});

test('placement answer client also times out while reading a stalled response body', async () => {
  let timeoutCallback;
  let cleared;
  const pending = checkPlacementAnswer((_url, { signal }) => Promise.resolve({
    ok: true,
    json: () => new Promise((resolve, reject) => {
      signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })), { once: true });
    }),
  }), 'q-1', 0, {
    timeoutMs: 10,
    setTimeoutImpl(callback) {
      timeoutCallback = callback;
      return 13;
    },
    clearTimeoutImpl(id) {
      cleared = id;
    },
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(cleared, undefined);
  timeoutCallback();
  await assert.rejects(pending, { name: 'AbortError' });
  assert.equal(cleared, 13);
});
