export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

const MIN_QUESTIONS = 8;
const MAX_QUESTIONS = 24;

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

export function createPlacementState() {
  return {
    version: 1,
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
  return {
    level,
    confidence,
    questionsAnswered: state.questions.length,
    stats: state.stats,
  };
}

export function shouldFinishPlacement(stateInput) {
  const state = stateInput || createPlacementState();
  if (state.questions.length >= MAX_QUESTIONS) return true;
  if (state.questions.length < MIN_QUESTIONS) return false;
  const result = placementResult(state);
  const target = state.stats[state.nextLevel] || { asked: 0 };
  return result.confidence >= 0.68 && target.asked >= 2;
}

export function selectNextPlacementQuestion({ state: stateInput, pool = [] } = {}) {
  const state = stateInput || createPlacementState();
  const seen = new Set(state.questions.map((row) => row.id));
  const available = pool.filter((question) => question?.id && !seen.has(question.id));
  if (!available.length) return null;

  const targetIndex = levelIndex(state.nextLevel);
  const ranked = [...available].sort((a, b) => {
    const distanceA = Math.abs(levelIndex(a.level) - targetIndex);
    const distanceB = Math.abs(levelIndex(b.level) - targetIndex);
    return distanceA - distanceB || String(a.id).localeCompare(String(b.id));
  });
  return ranked[0];
}

export const PLACEMENT_LIMITS = Object.freeze({ min: MIN_QUESTIONS, max: MAX_QUESTIONS });
