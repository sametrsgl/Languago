const STORAGE_PREFIX = 'languago:v2:question-history';

function safeUser(value) {
  return String(value ?? 'anonymous').trim() || 'anonymous';
}

function safeActivity(value) {
  return String(value ?? 'default').trim() || 'default';
}

function storageKey({ userId, activityKey }) {
  return `${STORAGE_PREFIX}:${encodeURIComponent(safeUser(userId))}:${encodeURIComponent(safeActivity(activityKey))}`;
}

function uniqueIds(ids) {
  const out = [];
  const seen = new Set();
  for (const id of ids ?? []) {
    const key = String(id ?? '').trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export function createMemoryQuestionHistoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return {
    getItem(key) {
      return map.has(key) ? map.get(key) : null;
    },
    setItem(key, value) {
      map.set(key, String(value));
    },
    removeItem(key) {
      map.delete(key);
    },
    dump() {
      return Object.fromEntries(map.entries());
    },
  };
}

function normalizeHistory(raw) {
  const shown = Array.isArray(raw?.shown) ? raw.shown : [];
  const clean = [];
  for (const row of shown) {
    const id = String(row?.id ?? '').trim();
    if (!id) continue;
    const lastShownAt = Number.isFinite(Number(row?.lastShownAt)) ? Number(row.lastShownAt) : 0;
    const shownCount = Number.isFinite(Number(row?.shownCount)) ? Math.max(1, Number(row.shownCount)) : 1;
    clean.push({ id, lastShownAt, shownCount });
  }
  clean.sort((a, b) => a.lastShownAt - b.lastShownAt || a.id.localeCompare(b.id));
  return {
    version: 1,
    lastShownId: typeof raw?.lastShownId === 'string' ? raw.lastShownId : clean.at(-1)?.id ?? null,
    shown: clean,
  };
}

export function getQuestionHistory({ userId, activityKey, storage = globalThis.localStorage } = {}) {
  if (!storage?.getItem) return normalizeHistory({});
  try {
    const text = storage.getItem(storageKey({ userId, activityKey }));
    if (!text) return normalizeHistory({});
    return normalizeHistory(JSON.parse(text));
  } catch (_error) {
    return normalizeHistory({});
  }
}

function writeQuestionHistory({ userId, activityKey, storage = globalThis.localStorage, history }) {
  if (!storage?.setItem) return false;
  try {
    storage.setItem(storageKey({ userId, activityKey }), JSON.stringify(normalizeHistory(history)));
    return true;
  } catch (_error) {
    return false;
  }
}

export function selectQuestionIds({ ids, count, userId, activityKey, storage = globalThis.localStorage } = {}) {
  const pool = uniqueIds(ids);
  const limit = Math.max(0, Math.min(Number.isFinite(Number(count)) ? Math.floor(Number(count)) : pool.length, pool.length));
  if (limit === 0 || pool.length === 0) return [];

  const history = getQuestionHistory({ userId, activityKey, storage });
  const seenById = new Map(history.shown.map((row) => [row.id, row]));
  const lastShownId = history.lastShownId;

  const unseen = pool.filter((id) => !seenById.has(id));
  const seen = pool
    .filter((id) => seenById.has(id))
    .sort((a, b) => (seenById.get(a).lastShownAt - seenById.get(b).lastShownAt) || a.localeCompare(b));

  let ordered = [...unseen, ...seen];
  if (ordered.length > 1 && ordered[0] === lastShownId) {
    const alternative = ordered.findIndex((id) => id !== lastShownId);
    if (alternative > 0) {
      const [moved] = ordered.splice(alternative, 1);
      ordered.unshift(moved);
    }
  }

  return uniqueIds(ordered).slice(0, limit);
}

export function recordShownQuestionIds({ ids, userId, activityKey, storage = globalThis.localStorage, now = Date.now() } = {}) {
  const shownNow = uniqueIds(ids);
  if (!shownNow.length) return getQuestionHistory({ userId, activityKey, storage });

  const history = getQuestionHistory({ userId, activityKey, storage });
  const byId = new Map(history.shown.map((row) => [row.id, { ...row }]));
  let timestamp = Number.isFinite(Number(now)) ? Number(now) : Date.now();

  for (const id of shownNow) {
    const row = byId.get(id) || { id, shownCount: 0, lastShownAt: 0 };
    row.shownCount += 1;
    row.lastShownAt = timestamp;
    timestamp += 0.001;
    byId.set(id, row);
  }

  const next = normalizeHistory({
    version: 1,
    lastShownId: shownNow.at(-1),
    shown: Array.from(byId.values()),
  });
  writeQuestionHistory({ userId, activityKey, storage, history: next });
  return next;
}

export function resetQuestionHistory({ userId, activityKey, storage = globalThis.localStorage } = {}) {
  if (!storage?.removeItem) return false;
  try {
    storage.removeItem(storageKey({ userId, activityKey }));
    return true;
  } catch (_error) {
    return false;
  }
}

export const QUESTION_HISTORY_STORAGE_PREFIX = STORAGE_PREFIX;
