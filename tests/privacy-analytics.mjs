import test from 'node:test';
import assert from 'node:assert/strict';

import {
  ALLOWED_ANALYTICS_EVENTS,
  SAFE_ANALYTICS_FIELDS,
  trackLearningEvent,
  sanitizeAnalyticsPayload,
} from '../src/lib/analytics.mjs';

function windowSink() {
  const events = [];
  return {
    events,
    CustomEvent: class CustomEvent {
      constructor(type, init = {}) {
        this.type = type;
        this.detail = init.detail;
      }
    },
    dispatchEvent(event) {
      events.push(event);
      return true;
    },
  };
}

test('denied consent drops analytics events without queueing or dispatching', () => {
  const win = windowSink();
  const result = trackLearningEvent('lesson_completed', { level: 'A1', skill: 'reading' }, {
    window: win,
    getPreferences: () => ({ consent: { analytics: false } }),
  });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'analytics_consent_required');
  assert.deepEqual(win.events, []);
  assert.equal(Array.isArray(globalThis.__languagoAnalyticsQueue), false);
});

test('revoked consent stops later events after a previous opt-in dispatch', () => {
  const win = windowSink();
  let allowed = true;
  const env = {
    window: win,
    getPreferences: () => ({ consent: { analytics: allowed } }),
  };

  assert.equal(trackLearningEvent('lesson_completed', { level: 'A1', attempts: 2 }, env).ok, true);
  allowed = false;
  assert.equal(trackLearningEvent('lesson_completed', { level: 'A1', attempts: 3 }, env).ok, false);

  assert.equal(win.events.length, 1);
  assert.equal(win.events[0].type, 'languago:analytics');
});

test('event names and payload fields are allowlisted only', () => {
  assert.deepEqual(ALLOWED_ANALYTICS_EVENTS.includes('ad_click'), false);
  assert.deepEqual(SAFE_ANALYTICS_FIELDS.includes('email'), false);

  assert.throws(
    () => sanitizeAnalyticsPayload({ email: 'student@example.com', level: 'A1' }),
    /disallowed analytics field: email/,
  );
  assert.throws(
    () => sanitizeAnalyticsPayload({ url: 'https://example.test/?q=name' }),
    /disallowed analytics field: url/,
  );
  assert.throws(
    () => trackLearningEvent('ad_click', {}, { window: windowSink(), getPreferences: () => ({ consent: { analytics: true } }) }),
    /disallowed analytics event: ad_click/,
  );
});

test('safe learning payload dispatches through CustomEvent sink only when opted in', () => {
  const win = windowSink();
  const result = trackLearningEvent('item_attempted', {
    level: 'B1',
    skill: 'vocabulary',
    item: 'word-card',
    attempts: 4,
    correct_count: 3,
  }, {
    window: win,
    getPreferences: () => ({ consent: { analytics: true } }),
  });

  assert.equal(result.ok, true);
  assert.equal(result.sink, 'custom_event');
  assert.equal(win.events.length, 1);
  assert.deepEqual(win.events[0].detail, {
    name: 'item_attempted',
    payload: {
      level: 'B1',
      skill: 'vocabulary',
      item: 'word-card',
      attempts: 4,
      correct_count: 3,
    },
  });
});
