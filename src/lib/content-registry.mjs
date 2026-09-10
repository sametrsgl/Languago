import crypto from 'node:crypto';

const REGISTRY_VERSION = 1;
const APOSTROPHE_RE = /[\u2018\u2019\u201A\u201B\u2032\u02BC\uFF07]/g;
const DASH_RE = /[\u2010-\u2015\u2212]/g;
const QUOTE_RE = /[\u201C\u201D\u201E\u201F\u2033]/g;

export function normalizeTextForIdentity(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(APOSTROPHE_RE, "'")
    .replace(DASH_RE, '-')
    .replace(QUOTE_RE, '"')
    .toLocaleLowerCase('en-US')
    .replace(/\s+/gu, ' ')
    .replace(/[^\p{L}\p{N}'-]+/gu, ' ')
    .replace(/\s+/gu, ' ')
    .trim();
}

export function digestText(value, length = 16) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, length);
}

export function createEmptyRegistry(now = new Date().toISOString()) {
  return {
    version: REGISTRY_VERSION,
    generatedAt: now,
    entries: {},
  };
}

export function normalizeRegistry(registry = {}) {
  return {
    version: Number.isInteger(registry.version) ? registry.version : REGISTRY_VERSION,
    generatedAt: registry.generatedAt || new Date().toISOString(),
    entries: registry.entries && typeof registry.entries === 'object' ? { ...registry.entries } : {},
  };
}

export function buildQuestionRegistryKey(ref) {
  if (!ref || typeof ref !== 'object') throw new TypeError('question registry ref must be an object');
  const sourcePool = String(ref.sourcePool ?? '').trim();
  const stem = normalizeTextForIdentity(ref.stem ?? ref.q ?? ref.prompt ?? '');
  if (!sourcePool) throw new Error('sourcePool is required for stable question identity');
  if (!stem) throw new Error('stem is required for stable question identity');

  const contextParts = [
    ref.passageId ? `passage:${ref.passageId}` : '',
    ref.contextKey ? `context:${ref.contextKey}` : '',
  ].filter(Boolean).join('|');
  const stemDigest = digestText(contextParts ? `${contextParts}\n${stem}` : stem);
  return `${sourcePool}::${stemDigest}`;
}

function makeQuestionId(key, usedIds) {
  const base = `q_${digestText(key, 12)}`;
  if (!usedIds.has(base)) return base;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${base}_${i}`;
    if (!usedIds.has(candidate)) return candidate;
  }
  throw new Error(`unable to allocate stable question id for ${key}`);
}

export function assignStableQuestionIds(questionRefs, registryInput = createEmptyRegistry(), options = {}) {
  if (!Array.isArray(questionRefs)) throw new TypeError('questionRefs must be an array');
  const registry = normalizeRegistry(registryInput);
  const now = options.now || new Date().toISOString();
  const usedIds = new Set(Object.values(registry.entries).map((entry) => entry?.id).filter(Boolean));
  const errors = [];
  const seenKeys = new Map();

  const items = questionRefs.map((ref, index) => {
    let key;
    try {
      key = buildQuestionRegistryKey(ref);
    } catch (error) {
      errors.push({ index, message: error.message });
      return { ...ref, id: ref?.id ?? null, registryKey: null };
    }

    if (seenKeys.has(key)) {
      errors.push({
        index,
        message: `duplicate registry identity also seen at index ${seenKeys.get(key)}`,
        key,
      });
    } else {
      seenKeys.set(key, index);
    }

    let entry = registry.entries[key];
    if (!entry?.id) {
      entry = {
        id: makeQuestionId(key, usedIds),
        sourcePool: String(ref.sourcePool),
        stemDigest: key.split('::').at(-1),
        firstStem: String(ref.stem ?? ref.q ?? ref.prompt ?? ''),
        createdAt: now,
      };
      registry.entries[key] = entry;
      usedIds.add(entry.id);
    }

    return { ...ref, id: entry.id, registryKey: key };
  });

  registry.generatedAt = now;
  return { items, registry, errors };
}

export function registryStats(registryInput = {}) {
  const registry = normalizeRegistry(registryInput);
  const entries = Object.entries(registry.entries);
  const ids = new Map();
  const collisions = [];
  for (const [key, entry] of entries) {
    if (!entry?.id) continue;
    if (ids.has(entry.id)) collisions.push({ id: entry.id, keys: [ids.get(entry.id), key] });
    else ids.set(entry.id, key);
  }
  return { entries: entries.length, ids: ids.size, collisions };
}
