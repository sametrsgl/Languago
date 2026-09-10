#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import {
  assignStableQuestionIds,
  createEmptyRegistry,
  normalizeTextForIdentity,
  registryStats,
} from '../src/lib/content-registry.mjs';

const DEFAULT_GRAMMAR_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1'];
const DEFAULT_READING_LEVELS = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre'];
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AUDIT_PATH = path.join(ROOT, 'docs/v2/content-audit.json');
const REGISTRY_PATH = path.join(ROOT, 'docs/v2/question-registry.json');

function fileUrl(rel, root = ROOT) {
  return pathToFileURL(path.join(root, rel)).href;
}

function cleanString(value) {
  return String(value ?? '').trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function makeCollector() {
  const errors = [];
  const warnings = [];
  return {
    errors,
    warnings,
    error(scope, message, extra = {}) { errors.push({ scope, message, ...extra }); },
    warn(scope, message, extra = {}) { warnings.push({ scope, message, ...extra }); },
  };
}

function questionPrompt(q) {
  return cleanString(q?.q ?? q?.prompt ?? q?.question);
}

function questionOptions(q) {
  if (Array.isArray(q?.options)) return q.options;
  if (Array.isArray(q?.o)) return q.o;
  return [];
}

function questionAnswerIndex(q) {
  if (Number.isInteger(q?.a)) return q.a;
  if (Number.isInteger(q?.answer)) return q.answer;
  return null;
}

function checkDuplicateIds(scope, rows, out) {
  const seen = new Map();
  for (const [idx, row] of asArray(rows).entries()) {
    const id = cleanString(row?.id);
    if (!id) continue;
    if (seen.has(id)) out.error(`${scope}[${idx}]`, `duplicate id '${id}' also used at ${scope}[${seen.get(id)}]`);
    else seen.set(id, idx);
  }
}

function validateWhy(where, q, optionCount, out, { warnWhenMissing = false } = {}) {
  if (q?.why == null) {
    if (warnWhenMissing) out.warn(where, 'missing why explanations');
    return;
  }
  if (!Array.isArray(q.why)) {
    out.error(where, 'why must be an array aligned with options');
    return;
  }
  if (q.why.length !== optionCount) {
    out.error(where, `why length ${q.why.length} does not match ${optionCount} options`);
  }
  q.why.forEach((why, idx) => {
    if (!cleanString(why)) out.error(`${where}.why[${idx}]`, 'empty why explanation');
  });
}

function validateExample(where, item, out) {
  const prompt = cleanString(item?.q ?? item?.prompt);
  const answers = item?.a ?? item?.answers;
  if (!prompt || !Array.isArray(answers) || answers.length === 0 || answers.some((a) => !cleanString(a))) {
    out.error(where, 'malformed practice example');
  }
}

function validateMcqPool(scope, items, out, options = {}) {
  if (!Array.isArray(items)) {
    out.error(scope, 'question pool is not an array');
    return { total: 0, uniqueRawPrompts: 0, uniqueNormalizedPrompts: 0, answerDistribution: {}, questionRefs: [] };
  }

  const minClassBankUnique = options.minClassBankUnique ?? 20;
  const rawPrompts = new Map();
  const normalizedPrompts = new Map();
  const answerDistribution = {};
  const questionRefs = [];
  checkDuplicateIds(scope, items, out);

  for (const [idx, q] of items.entries()) {
    const where = `${scope}[${idx}]`;
    const prompt = questionPrompt(q);
    if (!prompt) out.error(where, 'empty prompt');

    const rawKey = prompt;
    const normalizedKey = normalizeTextForIdentity(prompt);
    if (rawKey) {
      if (rawPrompts.has(rawKey)) out.error(where, `duplicate raw prompt also used at ${rawPrompts.get(rawKey)}`);
      else rawPrompts.set(rawKey, where);
    }
    if (normalizedKey) {
      if (normalizedPrompts.has(normalizedKey)) out.error(where, `duplicate normalized prompt also used at ${normalizedPrompts.get(normalizedKey)}`);
      else normalizedPrompts.set(normalizedKey, where);
    }

    const opts = questionOptions(q);
    if (!Array.isArray(opts) || opts.length < 2) out.error(where, 'fewer than two options');
    if (opts.some((opt) => !cleanString(opt))) out.error(where, 'empty option');
    const rawOptions = new Map();
    const normalizedOptions = new Map();
    opts.forEach((opt, optIdx) => {
      const rawOpt = cleanString(opt);
      const normOpt = normalizeTextForIdentity(opt);
      if (rawOpt) {
        if (rawOptions.has(rawOpt)) out.error(`${where}.options[${optIdx}]`, `duplicate raw option also used at option ${rawOptions.get(rawOpt)}`);
        else rawOptions.set(rawOpt, optIdx);
      }
      if (normOpt) {
        if (normalizedOptions.has(normOpt)) out.error(`${where}.options[${optIdx}]`, `duplicate normalized option '${normOpt}' also used at option ${normalizedOptions.get(normOpt)}`);
        else normalizedOptions.set(normOpt, optIdx);
      }
    });

    const answer = questionAnswerIndex(q);
    if (answer == null) out.error(where, 'missing integer answer index');
    else if (answer < 0 || answer >= opts.length) out.error(where, `answer index ${answer} outside ${opts.length} options`);
    else answerDistribution[answer] = (answerDistribution[answer] ?? 0) + 1;

    validateWhy(where, q, opts.length, out, { warnWhenMissing: false });
    if (prompt) questionRefs.push({ sourcePool: scope, stem: prompt, explicitId: q?.id });
  }

  if (normalizedPrompts.size < minClassBankUnique) {
    out.error(scope, `class question bank has only ${normalizedPrompts.size} unique normalized prompts; expected at least ${minClassBankUnique}`);
  }

  const counts = Object.values(answerDistribution);
  if (counts.length > 1) {
    const max = Math.max(...counts);
    const min = Math.min(...counts);
    if (max - min > Math.max(3, Math.ceil(items.length * 0.35))) {
      out.warn(scope, `answer distribution is imbalanced: ${JSON.stringify(answerDistribution)}`);
    }
  }

  return {
    total: items.length,
    uniqueRawPrompts: rawPrompts.size,
    uniqueNormalizedPrompts: normalizedPrompts.size,
    answerDistribution,
    questionRefs,
  };
}

function validateGrammar(grammarLevels, grammar, grammarMcq, out, options) {
  const summary = [];
  const questionRefs = [];

  for (const level of grammarLevels) {
    const data = grammar[level];
    const unitRows = asArray(data?.units);
    if (!data || !Array.isArray(data.units)) out.error(`grammar_${level}`, 'missing grammar units array');
    checkDuplicateIds(`grammar_${level}.units`, unitRows, out);
    const unitIds = new Set(unitRows.map((u) => cleanString(u?.id)).filter(Boolean));
    const mcqGroups = grammarMcq[level] || {};

    for (const key of Object.keys(mcqGroups)) {
      if (!unitIds.has(key)) out.error(`grammar_mcq_${level}.${key}`, 'unknown grammar MCQ unit key');
    }

    for (const [unitIdx, unit] of unitRows.entries()) {
      const unitId = cleanString(unit?.id);
      const where = `grammar_${level}.units[${unitIdx}]`;
      if (!unitId) out.error(where, 'missing unit id');
      if (!cleanString(unit?.title)) out.error(where, 'missing unit title');
      if (!Array.isArray(unit?.slides) || unit.slides.length < 1) out.error(where, 'missing grammar slides');
      asArray(unit?.slides).forEach((slide, slideIdx) => {
        if (!cleanString(slide?.h) || !cleanString(slide?.b)) out.error(`${where}.slides[${slideIdx}]`, 'malformed slide');
      });
      asArray(unit?.practice).forEach((item, practiceIdx) => validateExample(`${where}.practice[${practiceIdx}]`, item, out));

      const mcqScope = `grammar_mcq_${level}.${unitId}`;
      const mcqStats = validateMcqPool(mcqScope, mcqGroups[unitId] ?? [], out, options);
      questionRefs.push(...mcqStats.questionRefs.map((ref) => ({ ...ref, sourcePool: `grammar:${level}:${unitId}` })));
      summary.push({ level, unit: unitId, title: cleanString(unit?.title), ...mcqStats, questionRefs: undefined });
    }
  }

  return { summary, questionRefs };
}

function validateReadings(readingLevels, readings, out) {
  const summary = [];
  const questionRefs = [];
  const readingIds = new Map();
  const crossPassagePromptUse = new Map();

  for (const level of readingLevels) {
    const rows = readings[level];
    if (!Array.isArray(rows)) {
      out.error(`readings_${level}`, 'reading collection is not an array');
      continue;
    }
    checkDuplicateIds(`readings_${level}`, rows, out);
    const textKeys = new Map();
    let questionsTotal = 0;

    for (const [idx, row] of rows.entries()) {
      const passageId = cleanString(row?.id);
      const where = `readings_${level}[${idx}]`;
      if (!passageId) out.error(where, 'missing reading id');
      if (passageId) {
        if (readingIds.has(passageId)) out.error(where, `reading id collision with ${readingIds.get(passageId)}`);
        else readingIds.set(passageId, where);
      }
      if (!cleanString(row?.title)) out.error(where, 'missing title');
      if (!cleanString(row?.text)) out.error(where, 'missing text');
      const textKey = normalizeTextForIdentity(row?.text).slice(0, 220);
      if (textKey) {
        if (textKeys.has(textKey)) out.warn(where, `structural near-duplicate reading text also near ${textKeys.get(textKey)}`);
        else textKeys.set(textKey, where);
      }

      const questions = asArray(row?.questions ?? row?.qs);
      if (questions.length < 3) out.warn(where, `only ${questions.length} comprehension questions`);
      const passagePrompts = new Map();
      for (const [qidx, q] of questions.entries()) {
        questionsTotal += 1;
        const qWhere = `${where}.questions[${qidx}]`;
        const prompt = questionPrompt(q);
        if (!prompt) out.error(qWhere, 'empty question prompt');
        const pNorm = normalizeTextForIdentity(prompt);
        if (pNorm) {
          if (passagePrompts.has(pNorm)) out.error(qWhere, `duplicate normalized prompt within passage also used at ${passagePrompts.get(pNorm)}`);
          else passagePrompts.set(pNorm, qWhere);
          const prior = crossPassagePromptUse.get(pNorm) || [];
          prior.push(`${level}:${passageId}`);
          crossPassagePromptUse.set(pNorm, prior);
        }
        const opts = questionOptions(q);
        if (opts.length < 2) out.error(qWhere, 'malformed option list');
        if (opts.some((opt) => !cleanString(opt))) out.error(qWhere, 'empty option');
        const answer = questionAnswerIndex(q);
        if (answer == null) out.error(qWhere, 'missing integer answer index');
        else if (answer < 0 || answer >= opts.length) out.error(qWhere, `answer index ${answer} outside ${opts.length} options`);
        validateWhy(qWhere, q, opts.length, out, { warnWhenMissing: true });
        if (prompt) questionRefs.push({ sourcePool: `reading:${level}:${passageId}`, passageId, stem: prompt, explicitId: q?.id });
      }
    }

    summary.push({ level, passages: rows.length, questions: questionsTotal });
  }

  for (const [prompt, pools] of crossPassagePromptUse) {
    const uniquePools = new Set(pools);
    if (uniquePools.size >= 8) {
      out.warn('readings', `structural near-duplicate reading prompt reused ${uniquePools.size}x across passages: '${prompt}'`);
    }
  }

  return { summary, questionRefs };
}

function validateWords(wordsData, out) {
  const words = wordsData?.words && typeof wordsData.words === 'object' ? wordsData.words : {};
  if (!wordsData?.words || typeof wordsData.words !== 'object') out.error('words', 'WORD_DATA.words must be an object');
  const levelCounts = {};
  let total = 0;
  for (const [key, row] of Object.entries(words)) {
    total += 1;
    const where = `words.${key}`;
    if (!cleanString(row?.w)) out.error(where, 'missing word text');
    if (!cleanString(row?.p)) out.error(where, 'missing part of speech');
    if (!cleanString(row?.d)) out.error(where, 'missing definition');
    const examples = row?.examples ?? row?.ex ?? row?.e;
    if (Array.isArray(examples)) {
      if (examples.length === 0 || examples.some((example) => !cleanString(example))) out.error(where, 'malformed word example');
    } else if (!cleanString(examples)) {
      out.error(where, 'malformed word example');
    }
    const level = cleanString(row?.level ?? row?.l ?? row?.cefr ?? 'unknown').toLowerCase();
    levelCounts[level] = (levelCounts[level] ?? 0) + 1;
  }
  return { total, levelCounts };
}

async function readJsonIfExists(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, 'utf8'));
  } catch (error) {
    if (error?.code === 'ENOENT') return fallback;
    throw error;
  }
}

export async function loadActualContentData(root = ROOT) {
  const grammarLevels = DEFAULT_GRAMMAR_LEVELS;
  const readingLevels = DEFAULT_READING_LEVELS;
  const grammar = {};
  const grammarMcq = {};
  const readings = {};

  for (const level of grammarLevels) {
    const suffix = level.toUpperCase();
    const grammarMod = await import(fileUrl(`src/data/grammar_${level}.js`, root));
    const mcqMod = await import(fileUrl(`src/data/grammar_mcq_${level}.js`, root));
    grammar[level] = grammarMod[`GRAMMAR_${suffix}`];
    grammarMcq[level] = mcqMod[`GRAMMAR_MCQ_${suffix}`];
  }

  for (const level of readingLevels) {
    const suffix = level.toUpperCase();
    const mod = await import(fileUrl(`src/data/readings_${level}.js`, root));
    readings[level] = mod[`READINGS_${suffix}`];
  }

  const wordsMod = await import(fileUrl('src/data/words.js', root));
  return { grammarLevels, readingLevels, grammar, grammarMcq, readings, words: wordsMod.WORD_DATA };
}

export async function validateContentData(data, options = {}) {
  const out = makeCollector();
  const grammarLevels = data.grammarLevels || DEFAULT_GRAMMAR_LEVELS;
  const readingLevels = data.readingLevels || DEFAULT_READING_LEVELS;

  const grammarResult = validateGrammar(grammarLevels, data.grammar || {}, data.grammarMcq || {}, out, options);
  const readingResult = validateReadings(readingLevels, data.readings || {}, out);
  const wordsSummary = validateWords(data.words || {}, out);
  const questionRefs = [...grammarResult.questionRefs, ...readingResult.questionRefs];

  const registryIn = options.registry || (options.registryPath ? await readJsonIfExists(options.registryPath, createEmptyRegistry()) : createEmptyRegistry());
  const assigned = assignStableQuestionIds(questionRefs, registryIn, { now: options.now });
  assigned.errors.forEach((err) => out.error(`registry[${err.index}]`, err.message, err.key ? { key: err.key } : {}));

  const idSeen = new Map();
  for (const item of assigned.items) {
    if (!item.id) continue;
    if (idSeen.has(item.id)) out.error(item.sourcePool, `question id collision '${item.id}' also used at ${idSeen.get(item.id)}`);
    else idSeen.set(item.id, item.sourcePool);
  }

  const report = {
    generatedAt: options.now || new Date().toISOString(),
    status: out.errors.length ? 'fail' : 'pass',
    totals: {
      grammarLevels: grammarLevels.length,
      grammarUnits: grammarResult.summary.length,
      grammarMcqQuestions: grammarResult.summary.reduce((sum, row) => sum + row.total, 0),
      readingLevels: readingLevels.length,
      readingPassages: readingResult.summary.reduce((sum, row) => sum + row.passages, 0),
      readingQuestions: readingResult.summary.reduce((sum, row) => sum + row.questions, 0),
      wordEntries: wordsSummary.total,
      registeredQuestions: assigned.items.length,
      errors: out.errors.length,
      warnings: out.warnings.length,
    },
    grammar: grammarResult.summary.map(({ questionRefs: _questionRefs, ...row }) => row),
    readings: readingResult.summary,
    words: wordsSummary,
    registry: registryStats(assigned.registry),
    errors: out.errors,
    warnings: out.warnings,
  };

  if (options.writeReports) {
    await fs.mkdir(path.dirname(options.auditPath || AUDIT_PATH), { recursive: true });
    await fs.writeFile(options.auditPath || AUDIT_PATH, `${JSON.stringify(report, null, 2)}\n`);
    await fs.writeFile(options.registryPath || REGISTRY_PATH, `${JSON.stringify(assigned.registry, null, 2)}\n`);
  }

  return { ...report, assignedQuestions: assigned.items, registryData: assigned.registry };
}

async function main() {
  const data = await loadActualContentData(ROOT);
  const result = await validateContentData(data, {
    writeReports: true,
    registryPath: REGISTRY_PATH,
    auditPath: AUDIT_PATH,
  });

  console.log('Languago content validation');
  console.log(JSON.stringify({ status: result.status, totals: result.totals, registry: result.registry }, null, 2));
  if (result.warnings.length) {
    console.log('\nWarnings:');
    for (const warning of result.warnings.slice(0, 80)) console.log(`- [${warning.scope}] ${warning.message}`);
    if (result.warnings.length > 80) console.log(`- ... ${result.warnings.length - 80} more warnings`);
  }
  if (result.errors.length) {
    console.error('\nErrors:');
    for (const error of result.errors.slice(0, 120)) console.error(`- [${error.scope}] ${error.message}`);
    if (result.errors.length > 120) console.error(`- ... ${result.errors.length - 120} more errors`);
    process.exitCode = 1;
  } else {
    console.log('\nNo blocking content errors found.');
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
