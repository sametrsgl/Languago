export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const MIN_QUESTIONS = 30;
const MAX_QUESTIONS = 40;

const GOALS = Object.freeze({
  general: 'Genel İngilizce',
  ielts: 'IELTS',
  toefl: 'TOEFL',
  yds: 'YDS / YÖKDİL',
  other: 'Diğer sınav / hedef',
});

function normalizeGoal(goal) {
  const key = String(goal || 'general').toLowerCase();
  return Object.hasOwn(GOALS, key) ? key : 'general';
}

function levelIndex(level) {
  const index = CEFR_LEVELS.indexOf(String(level || '').toUpperCase());
  return index < 0 ? 0 : index;
}

function clampLevel(index) {
  return CEFR_LEVELS[Math.max(0, Math.min(CEFR_LEVELS.length - 1, index))];
}

function emptyStats() {
  return Object.fromEntries(CEFR_LEVELS.map((level) => [level, { asked: 0, correct: 0 }]));
}

export function createPlacementState(profile = {}) {
  return {
    version: 2,
    learnerName: String(profile.learnerName || '').trim().slice(0, 120),
    goal: normalizeGoal(profile.goal),
    nextLevel: 'A1',
    streak: 0,
    questions: [],
    stats: emptyStats(),
    completed: false,
  };
}

export function recordPlacementAnswer(inputState, question, correct, selectedIndex = null) {
  const state = structuredClone(inputState || createPlacementState());
  const level = CEFR_LEVELS.includes(question?.level) ? question.level : state.nextLevel;
  const id = String(question?.id || '').trim();
  if (!id || state.questions.some((row) => row.id === id)) return state;

  const stat = state.stats[level] || { asked: 0, correct: 0 };
  stat.asked += 1;
  if (correct) stat.correct += 1;
  state.stats[level] = stat;
  state.questions.push({
    id,
    level,
    source: question.source || 'grammar',
    selectedIndex: Number.isInteger(selectedIndex) ? selectedIndex : null,
    correct: Boolean(correct),
  });

  if (correct) {
    state.streak += 1;
    if (state.streak >= 2) {
      state.nextLevel = clampLevel(levelIndex(state.nextLevel) + 1);
      state.streak = 0;
    }
  } else {
    state.streak = 0;
    state.nextLevel = clampLevel(levelIndex(state.nextLevel) - 1);
  }

  state.completed = shouldFinishPlacement(state);
  return state;
}

function mastery(stats, level) {
  const row = stats?.[level] || { asked: 0, correct: 0 };
  return (row.correct + 1) / (row.asked + 2);
}

function estimatedExamScore(goal, level, accuracy) {
  const normalized = Math.max(0, Math.min(100, Number(accuracy) || 0));
  const levelBonus = levelIndex(level) * 5;
  if (goal === 'general') return Math.max(0, Math.min(100, Math.round(normalized * 0.7 + levelBonus)));
  if (goal === 'ielts') return Math.max(0, Math.min(9, Math.round((normalized / 100 * 6 + levelBonus / 10) * 2) / 2));
  if (goal === 'toefl') return Math.max(0, Math.min(120, Math.round(normalized * 1.2 + levelBonus)));
  if (goal === 'yds') return Math.max(0, Math.min(100, Math.round(normalized * 0.82 + levelBonus)));
  return Math.max(0, Math.min(100, Math.round(normalized * 0.9 + levelBonus)));
}

function scoreLabel(goal, score) {
  if (score == null) return 'Genel İngilizce · CEFR tahmini';
  return `${GOALS[goal]} tahmini · ${score}`;
}

export function placementResult(stateInput) {
  const state = stateInput || createPlacementState();
  let level = 'A1';
  for (const candidate of CEFR_LEVELS) {
    const row = state.stats[candidate];
    if ((row?.asked || 0) >= 2 && mastery(state.stats, candidate) >= 0.6) level = candidate;
  }

  const evidence = Math.min(1, state.questions.length / 12);
  const levelRow = state.stats[level] || { asked: 0, correct: 0 };
  const local = levelRow.asked ? Math.abs(mastery(state.stats, level) - 0.5) * 2 : 0;
  const confidence = Math.round(Math.min(0.99, evidence * 0.65 + local * 0.35) * 100) / 100;
  const answered = state.questions.length;
  const correct = state.questions.filter((question) => question.correct).length;
  const bands = CEFR_LEVELS.map((band) => {
    const bandStats = state.stats[band] || { asked: 0, correct: 0 };
    return {
      level: band,
      asked: bandStats.asked,
      correct: bandStats.correct,
      accuracy: bandStats.asked ? Math.round((bandStats.correct / bandStats.asked) * 100) : null,
    };
  });
  const accuracy = answered ? Math.round((correct / answered) * 100) : 0;
  const goal = normalizeGoal(state.goal);
  const estimatedScore = estimatedExamScore(goal, level, accuracy);
  return {
    learnerName: String(state.learnerName || '').trim(),
    goal,
    goalLabel: GOALS[goal],
    level,
    confidence,
    questionsAnswered: answered,
    correctAnswers: correct,
    accuracy,
    estimatedScore,
    scoreLabel: scoreLabel(goal, estimatedScore),
    bands,
    stats: state.stats,
  };
}

export function shouldFinishPlacement(stateInput) {
  const state = stateInput || createPlacementState();
  if (state.questions.length >= MAX_QUESTIONS) return true;
  if (state.questions.length < MIN_QUESTIONS) return false;
  return state.questions.length >= MIN_QUESTIONS;
}

export function getPlacementPassage(question, passages = {}) {
  if (question?.source !== 'reading') return null;
  const match = String(question.sourceId || '').match(/^(.+)-\d+$/);
  const passage = match ? passages?.[match[1]] : null;
  return typeof passage?.text === 'string' && passage.text.trim() ? passage : null;
}

// Reading source IDs are `${passage.id}-${questionIndex}`. Keep that passage
// context: a generic stem in another passage is a different reading task.
function placementQuestionIdentity(question) {
  const source = question?.source || 'grammar';
  const sourceId = String(question?.sourceId || '');
  const expectedContentKey = sourceId ? `${source}:${sourceId}` : '';
  if (question?.contentKey && (!sourceId || String(question.contentKey) === expectedContentKey)) {
    return String(question.contentKey);
  }
  const prompt = String(question?.prompt || '').trim().toLowerCase().replace(/\s+/g, ' ');
  if (!prompt) return null;
  const passage = source === 'reading'
    ? sourceId.replace(/-\d+$/, '') || question.passageTitle || ''
    : '';
  return JSON.stringify([source, passage, prompt]);
}

function readingPassageIdentity(question) {
  if (question?.source !== 'reading') return null;
  const sourceId = String(question.sourceId || '').trim();
  return sourceId.replace(/-\d+$/, '') || String(question.passageTitle || '').trim().toLowerCase() || null;
}

export function selectNextPlacementQuestion({ state: stateInput, pool = [] } = {}) {
  const state = stateInput || createPlacementState();
  const seen = new Set(state.questions.map((row) => row.id));
  // Resolve legacy/draft histories against the real pool; never trust stored
  // prompt text, and never treat an option-order variant as new evidence.
  const seenContent = new Set(pool
    .filter((question) => seen.has(question?.id))
    .map(placementQuestionIdentity)
    .filter(Boolean));
  const available = pool.filter((question) => question?.id
    && !seen.has(question.id)
    && !seenContent.has(placementQuestionIdentity(question)));
  if (!available.length) return null;

  const lastAnswer = state.questions.at(-1);
  const lastQuestion = pool.find((question) => question?.id === lastAnswer?.id);
  const lastPassage = readingPassageIdentity(lastQuestion);
  const diversified = lastPassage
    ? available.filter((question) => readingPassageIdentity(question) !== lastPassage)
    : available;
  const candidates = diversified.length ? diversified : available;

  const targetIndex = levelIndex(state.nextLevel);
  const sourceCounts = state.questions.reduce((counts, row) => {
    counts[row.source || 'grammar'] = (counts[row.source || 'grammar'] || 0) + 1;
    return counts;
  }, {});
  const examGoal = ['ielts', 'toefl', 'yds', 'other'].includes(normalizeGoal(state.goal));
  const sources = ['grammar', 'vocabulary', 'reading'];
  const preferredSource = [...sources].sort((a, b) => {
    const scoreA = (sourceCounts[a] || 0) + (examGoal && a === 'reading' ? -1 : 0);
    const scoreB = (sourceCounts[b] || 0) + (examGoal && b === 'reading' ? -1 : 0);
    return scoreA - scoreB || sources.indexOf(a) - sources.indexOf(b);
  })[0];
  const ranked = [...candidates].sort((a, b) => {
    const distanceA = Math.abs(levelIndex(a.level) - targetIndex);
    const distanceB = Math.abs(levelIndex(b.level) - targetIndex);
    const sourceA = a.source === preferredSource ? 0 : 1;
    const sourceB = b.source === preferredSource ? 0 : 1;
    return distanceA - distanceB || sourceA - sourceB || String(a.id).localeCompare(String(b.id));
  });
  return ranked[0];
}

// Drafts and API submissions are untrusted. Rebuild both from the same pool,
// counting a task only once even when its options have been reordered.
export function replayPlacementAnswers(answers, pool = []) {
  let state = createPlacementState();
  if (!Array.isArray(answers)) return state;
  const byId = new Map(pool.map((question) => [question.id, question]));
  const seenContent = new Set();
  for (const row of answers.slice(0, 40)) {
    if (state.completed) break;
    if (typeof row?.id !== 'string' || !Number.isInteger(row?.selectedIndex)) continue;
    const question = byId.get(row.id);
    if (!question || !CEFR_LEVELS.includes(question.level)) continue;
    if (row.selectedIndex < 0 || row.selectedIndex >= question.options.length) continue;
    const identity = placementQuestionIdentity(question);
    if (!identity || seenContent.has(identity)) continue;
    seenContent.add(identity);
    state = recordPlacementAnswer(state, question, row.selectedIndex === question.answer, row.selectedIndex);
  }
  return state;
}

export const PLACEMENT_LIMITS = Object.freeze({ min: MIN_QUESTIONS, max: MAX_QUESTIONS });
