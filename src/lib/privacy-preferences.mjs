export const PREFERENCE_VERSION = 1;
export const STORAGE_KEY = 'languago:privacy-preferences:v1';

const DEFAULT_CONSENT = Object.freeze({
  analytics: false,
  advertising: false,
});

function timestamp(now) {
  try {
    if (typeof now === 'function') return String(now());
  } catch {
    // Fall through to a generated timestamp.
  }
  return new Date().toISOString();
}

function clonePreferences(consent = DEFAULT_CONSENT, updatedAt = null) {
  return {
    version: PREFERENCE_VERSION,
    updatedAt,
    consent: {
      analytics: consent.analytics === true,
      advertising: consent.advertising === true,
    },
  };
}

function resolveStorage(env = {}) {
  if (Object.prototype.hasOwnProperty.call(env, 'storage')) return env.storage;
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}

function resolveNavigator(env = {}) {
  if (Object.prototype.hasOwnProperty.call(env, 'navigator')) return env.navigator;
  try {
    return globalThis.navigator;
  } catch {
    return null;
  }
}

function safeRead(storage) {
  if (!storage || typeof storage.getItem !== 'function') return null;
  try {
    return storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function safeWrite(storage, prefs) {
  if (!storage || typeof storage.setItem !== 'function') return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    return true;
  } catch {
    return false;
  }
}

export function getBrowserPrivacySignals(navigatorLike = resolveNavigator()) {
  const nav = navigatorLike || {};
  let windowDnt;
  try {
    windowDnt = globalThis.window?.doNotTrack;
  } catch {
    windowDnt = undefined;
  }

  const dntValues = [nav.doNotTrack, nav.msDoNotTrack, windowDnt]
    .filter((value) => value !== undefined && value !== null)
    .map((value) => String(value).toLowerCase());

  return {
    doNotTrack: dntValues.some((value) => value === '1' || value === 'yes'),
    globalPrivacyControl: nav.globalPrivacyControl === true,
  };
}

export function hasPrivacyOptOutSignal(env = {}) {
  const signals = getBrowserPrivacySignals(resolveNavigator(env));
  return signals.doNotTrack || signals.globalPrivacyControl;
}

function applyPrivacySignals(consent, env = {}) {
  const normalized = {
    analytics: consent.analytics === true,
    advertising: consent.advertising === true,
  };

  if (hasPrivacyOptOutSignal(env)) {
    normalized.analytics = false;
  }

  return normalized;
}

function parseStoredPreferences(raw, env = {}) {
  if (!raw) return clonePreferences(DEFAULT_CONSENT, null);

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || parsed.version !== PREFERENCE_VERSION || typeof parsed.consent !== 'object') {
      return clonePreferences(DEFAULT_CONSENT, null);
    }

    return clonePreferences(applyPrivacySignals(parsed.consent, env), parsed.updatedAt || null);
  } catch {
    return clonePreferences(DEFAULT_CONSENT, null);
  }
}

export function getPrivacyPreferences(env = {}) {
  return parseStoredPreferences(safeRead(resolveStorage(env)), env);
}

function consentFromInput(input = {}) {
  const source = input.consent && typeof input.consent === 'object' ? input.consent : input;
  return {
    analytics: source.analytics === true,
    advertising: source.advertising === true,
  };
}

export function savePrivacyPreferences(input = {}, env = {}) {
  const prefs = clonePreferences(applyPrivacySignals(consentFromInput(input), env), timestamp(env.now));
  safeWrite(resolveStorage(env), prefs);
  return prefs;
}

export function rejectAllPrivacyPreferences(env = {}) {
  return savePrivacyPreferences({ analytics: false, advertising: false }, env);
}

export function acceptAllPrivacyPreferences(env = {}) {
  return savePrivacyPreferences({ analytics: true, advertising: true }, env);
}

export function canUseAnalytics(preferences = getPrivacyPreferences(), env = {}) {
  if (hasPrivacyOptOutSignal(env)) return false;
  return preferences?.consent?.analytics === true;
}

export function canUseAdvertising(preferences = getPrivacyPreferences()) {
  return preferences?.consent?.advertising === true;
}

export function clearPrivacyPreferences(env = {}) {
  const storage = resolveStorage(env);
  if (!storage || typeof storage.removeItem !== 'function') return false;
  try {
    storage.removeItem(STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}
