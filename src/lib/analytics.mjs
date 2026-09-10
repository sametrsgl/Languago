import { canUseAnalytics, getPrivacyPreferences } from './privacy-preferences.mjs';

export const ALLOWED_ANALYTICS_EVENTS = Object.freeze([
  'lesson_completed',
  'skill_practiced',
  'item_attempted',
  'result_viewed',
]);

export const SAFE_ANALYTICS_FIELDS = Object.freeze([
  'level',
  'skill',
  'item',
  'attempts',
  'attempt_count',
  'correct_count',
  'incorrect_count',
]);

const COUNT_FIELDS = new Set(['attempts', 'attempt_count', 'correct_count', 'incorrect_count']);
const TOKEN_FIELDS = new Set(['level', 'skill', 'item']);
const TOKEN_PATTERN = /^[a-zA-Z0-9ğüşöçıİĞÜŞÖÇ_.:-]{1,48}$/;

function resolveWindow(env = {}) {
  if (Object.prototype.hasOwnProperty.call(env, 'window')) return env.window;
  try {
    return globalThis.window;
  } catch {
    return undefined;
  }
}

function resolvePreferences(env = {}) {
  if (typeof env.getPreferences === 'function') return env.getPreferences();
  return getPrivacyPreferences(env);
}

function assertAllowedEvent(name) {
  if (!ALLOWED_ANALYTICS_EVENTS.includes(name)) {
    throw new Error(`disallowed analytics event: ${name}`);
  }
}

function assertAllowedField(key) {
  if (!SAFE_ANALYTICS_FIELDS.includes(key)) {
    throw new Error(`disallowed analytics field: ${key}`);
  }
}

function sanitizeCount(key, value) {
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    throw new Error(`invalid analytics count field: ${key}`);
  }
  return value;
}

function sanitizeToken(key, value) {
  if (typeof value !== 'string' || !TOKEN_PATTERN.test(value)) {
    throw new Error(`invalid analytics token field: ${key}`);
  }
  return value;
}

export function sanitizeAnalyticsPayload(payload = {}) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new Error('analytics payload must be an object');
  }

  const safe = {};
  for (const [key, value] of Object.entries(payload)) {
    assertAllowedField(key);
    if (value === undefined || value === null) continue;

    if (COUNT_FIELDS.has(key)) {
      safe[key] = sanitizeCount(key, value);
    } else if (TOKEN_FIELDS.has(key)) {
      safe[key] = sanitizeToken(key, value);
    }
  }

  return safe;
}

export function createAnalyticsEvent(name, payload = {}) {
  assertAllowedEvent(name);
  return {
    name,
    payload: sanitizeAnalyticsPayload(payload),
  };
}

export function trackLearningEvent(name, payload = {}, env = {}) {
  const event = createAnalyticsEvent(name, payload);
  const preferences = resolvePreferences(env);
  if (!canUseAnalytics(preferences, env)) {
    return { ok: false, reason: 'analytics_consent_required' };
  }

  const win = resolveWindow(env);
  if (!win || typeof win.dispatchEvent !== 'function' || typeof win.CustomEvent !== 'function') {
    return { ok: false, reason: 'custom_event_sink_unavailable' };
  }

  win.dispatchEvent(new win.CustomEvent('languago:analytics', { detail: event }));
  return { ok: true, sink: 'custom_event', event };
}

export const futureProviderAdapterContract = Object.freeze({
  status: 'documented_only',
  description:
    'A future analytics provider may listen for languago:analytics CustomEvent after explicit opt-in. This module does not load external scripts, make network requests, persist identifiers, or queue events before consent.',
});
