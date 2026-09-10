import test from 'node:test';
import assert from 'node:assert/strict';

import {
  PREFERENCE_VERSION,
  getPrivacyPreferences,
  savePrivacyPreferences,
  rejectAllPrivacyPreferences,
  canUseAnalytics,
} from '../src/lib/privacy-preferences.mjs';

function storage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
    dump() {
      return Object.fromEntries(data.entries());
    },
  };
}

test('defaults to denied consent and does not queue implied opt-in', () => {
  const prefs = getPrivacyPreferences({ storage: storage(), navigator: {} });

  assert.equal(prefs.version, PREFERENCE_VERSION);
  assert.equal(prefs.consent.analytics, false);
  assert.equal(prefs.consent.advertising, false);
  assert.equal(canUseAnalytics(prefs, { navigator: {} }), false);
});

test('reject and revoke are explicit and as easy as opt-in', () => {
  const localStorage = storage();
  const accepted = savePrivacyPreferences(
    { analytics: true, advertising: true },
    { storage: localStorage, navigator: {}, now: () => '2026-09-10T00:00:00.000Z' },
  );
  assert.equal(accepted.consent.analytics, true);
  assert.equal(accepted.consent.advertising, true);

  const rejected = rejectAllPrivacyPreferences({
    storage: localStorage,
    navigator: {},
    now: () => '2026-09-10T00:01:00.000Z',
  });
  assert.equal(rejected.consent.analytics, false);
  assert.equal(rejected.consent.advertising, false);
  assert.equal(getPrivacyPreferences({ storage: localStorage, navigator: {} }).consent.analytics, false);
});

test('blocked or corrupt storage falls back safely to denied consent', () => {
  const blockedStorage = {
    getItem() { throw new Error('blocked'); },
    setItem() { throw new Error('blocked'); },
  };
  assert.doesNotThrow(() => getPrivacyPreferences({ storage: blockedStorage, navigator: {} }));
  assert.equal(getPrivacyPreferences({ storage: blockedStorage, navigator: {} }).consent.analytics, false);

  const corruptStorage = storage({ 'languago:privacy-preferences:v1': '{not-json' });
  assert.equal(getPrivacyPreferences({ storage: corruptStorage, navigator: {} }).consent.advertising, false);
});

test('DNT and GPC override analytics consent to rejected', () => {
  const localStorage = storage();
  const prefs = savePrivacyPreferences(
    { analytics: true, advertising: true },
    { storage: localStorage, navigator: { doNotTrack: '1', globalPrivacyControl: true } },
  );

  assert.equal(prefs.consent.analytics, false);
  assert.equal(canUseAnalytics(prefs, { navigator: { doNotTrack: '1' } }), false);
});
