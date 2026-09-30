// A tiny store: a pure reducer, full undo history, and autosave so an
// accidental refresh (F5) never loses a game.

export function createStore(initial, reducer, { saveKey = null, historyLimit = 80, storage = null } = {}) {
  let state = initial;
  let past = [];
  let future = [];
  const listeners = new Set();
  const store = storage || safeStorage();

  function emit(meta) {
    for (const fn of listeners) fn(state, meta);
  }

  function persist() {
    if (!saveKey || !store) return;
    try { store.setItem(saveKey, JSON.stringify({ savedAt: Date.now(), state })); } catch { /* quota or private mode */ }
  }

  // Save the starting state too, so a refresh right after "Başlat" resumes.
  persist();

  return {
    get state() { return state; },
    dispatch(action) {
      const next = reducer(state, action);
      if (next === state) return false;
      if (!action.transient) {
        past.push(state);
        if (past.length > historyLimit) past = past.slice(-historyLimit);
        future = [];
      }
      state = next;
      persist();
      emit({ action });
      return true;
    },
    undo() {
      if (!past.length) return false;
      future.push(state);
      state = past.pop();
      persist();
      emit({ action: { type: 'UNDO' } });
      return true;
    },
    redo() {
      if (!future.length) return false;
      past.push(state);
      state = future.pop();
      persist();
      emit({ action: { type: 'REDO' } });
      return true;
    },
    canUndo() { return past.length > 0; },
    replace(next) {
      state = next; past = []; future = [];
      persist();
      emit({ action: { type: 'REPLACE' } });
    },
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    clearSave() { if (saveKey && store) try { store.removeItem(saveKey); } catch { /* ignore */ } },
  };
}

export function readSave(saveKey, maxAgeMs = 1000 * 60 * 60 * 24 * 14, storage = null) {
  const store = storage || safeStorage();
  if (!store) return null;
  try {
    const raw = store.getItem(saveKey);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state || Date.now() - Number(parsed.savedAt || 0) > maxAgeMs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function safeStorage() {
  try {
    if (typeof localStorage === 'undefined') return null;
    const k = '__lg_probe__';
    localStorage.setItem(k, '1');
    localStorage.removeItem(k);
    return localStorage;
  } catch {
    return null;
  }
}

export function readJson(key, fallback) {
  const store = safeStorage();
  if (!store) return fallback;
  try { const v = JSON.parse(store.getItem(key) || 'null'); return v ?? fallback; } catch { return fallback; }
}

export function writeJson(key, value) {
  const store = safeStorage();
  if (!store) return;
  try { store.setItem(key, JSON.stringify(value)); } catch { /* ignore */ }
}
