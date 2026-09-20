const LEVEL_KEYS = new Set(['a1', 'a2', 'b1', 'b2', 'c1', 'c2', 'ielts', 'toefl', 'yds', 'yokdil', 'gre']);
const EXAM_GOALS = new Set(['ielts', 'toefl', 'yds', 'other']);
const GOAL_LABELS = Object.freeze({
  general: 'Genel İngilizce',
  ielts: 'IELTS',
  toefl: 'TOEFL',
  yds: 'YDS',
  other: 'Özel hedef',
});
const DEFAULT_FOCUS = Object.freeze({
  vocabulary: ['günlük ifadeler', 'iş ve okul', 'seyahat ve hizmetler'],
  grammar: ['temel cümle yapısı', 'zamanlar ve bağlaçlar', 'anlamı değiştiren yapılar'],
  reading: ['ana fikir ve ayrıntı', 'neden-sonuç', 'çıkarım ve kanıt'],
  game: ['hızlı geri çağırma', 'eşdizim', 'karışık tekrar'],
});
const ROTATION = ['grammar', 'reading', 'vocabulary', 'game'];
const DURATION = Object.freeze({ full: [3, 5, 5, 5, 2], recovery: [2, 2, 2, 1, 1] });

/** @typedef {Record<string, unknown>} JsonObject */
/** @typedef {{ module?: string, payload?: JsonObject|null, updated_at?: string }} ProgressRow */
/** @typedef {{ date?: Date|string, progress?: ProgressRow[], storedPlan?: JsonObject|null, syllabus?: JsonObject|null }} DailyPlanOptions */

export const DAILY_PLAN_VERSION = 1;

function number(value) {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

function nonNegative(value) {
  return Math.max(0, number(value));
}

function payloadOf(row) {
  return row?.payload && typeof row.payload === 'object' ? row.payload : {};
}

function firstNumber(payload, keys) {
  for (const key of keys) {
    const value = number(payload[key]);
    if (value > 0) return value;
  }
  return 0;
}

function normalizeGoal(value) {
  const goal = String(value ?? 'general').trim().toLowerCase();
  return Object.hasOwn(GOAL_LABELS, goal) ? goal : 'general';
}

function normalizeLevel(value) {
  const level = String(value ?? '').trim().toLowerCase();
  return LEVEL_KEYS.has(level) ? level : 'a1';
}

export function normalizeDateKey(value = new Date()) {
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return new Date().toISOString().slice(0, 10);
  return date.toISOString().slice(0, 10);
}

function dayNumber(value) {
  const date = new Date(`${normalizeDateKey(value)}T00:00:00Z`);
  return Math.floor(date.getTime() / 86_400_000);
}

function trackFor(syllabus, level) {
  const track = syllabus?.tracks?.[level];
  return track && typeof track === 'object' ? track : {};
}

function focusList(track, skill) {
  const values = track?.[skill]?.focus;
  if (Array.isArray(values) && values.length > 0) return values.map((value) => String(value));
  return DEFAULT_FOCUS[skill] ?? DEFAULT_FOCUS.game;
}

function levelLabel(level, track) {
  return String(track?.label ?? level.toUpperCase());
}

function routeFor(skill, level) {
  if (skill === 'vocabulary') return '/dashboard/kelimeler';
  if (skill === 'reading') return `/dashboard/okuma/${level}`;
  if (skill === 'grammar' && ['a1', 'a2', 'b1', 'b2', 'c1'].includes(level)) return `/dashboard/dilbilgisi/${level}`;
  if (skill === 'grammar') return '/dashboard/dilbilgisi';
  if (skill === 'game') return '/dashboard/oyunlar';
  return '/dashboard';
}

function accuracyFor(payload) {
  const attempted = nonNegative(payload.attempted ?? payload.answered ?? payload.questionsAttempted);
  const correct = Math.min(attempted, nonNegative(payload.correct ?? payload.correctCount));
  return {
    attempted: Math.floor(attempted),
    correct: Math.floor(correct),
    accuracyPct: attempted > 0 ? Math.round((correct / attempted) * 100) : null,
  };
}

/**
 * @param {ProgressRow[]} progress
 */
export function summarizeDailyEvidence(progress = []) {
  const modules = {};
  let dueCount = 0;

  for (const row of Array.isArray(progress) ? progress : []) {
    const module = String(row?.module ?? '').trim();
    if (!module || module === 'daily-plan') continue;
    const payload = payloadOf(row);
    dueCount += firstNumber(payload, ['dueCount', 'reviewDue', 'due']);
    const current = modules[module] ?? { attempted: 0, correct: 0, accuracyPct: null, exposure: 0 };
    const accuracy = accuracyFor(payload);
    current.attempted += accuracy.attempted;
    current.correct += accuracy.correct;
    current.exposure += Math.floor(nonNegative(payload.exposureCount ?? payload.viewedCount));
    current.accuracyPct = current.attempted > 0
      ? Math.round((current.correct / current.attempted) * 100)
      : null;
    modules[module] = current;
  }

  const normalized = {};
  for (const [module, value] of Object.entries(modules)) {
    normalized[module] = Object.freeze(value);
  }
  return Object.freeze({
    dueCount: Math.floor(dueCount),
    vocab: normalized.vocab ?? Object.freeze({ attempted: 0, correct: 0, accuracyPct: null, exposure: 0 }),
    grammar: normalized.grammar ?? Object.freeze({ attempted: 0, correct: 0, accuracyPct: null, exposure: 0 }),
    reading: normalized.reading ?? Object.freeze({ attempted: 0, correct: 0, accuracyPct: null, exposure: 0 }),
    game: normalized.game ?? Object.freeze({ attempted: 0, correct: 0, accuracyPct: null, exposure: 0 }),
    modules: normalized,
  });
}

function resolveProfile(progress) {
  const rows = Array.isArray(progress) ? progress : [];
  const placement = rows.find((row) => row?.module === 'placement-test');
  const vocabulary = rows.find((row) => row?.module === 'vocab-path');
  const placementPayload = payloadOf(placement);
  const vocabularyPayload = payloadOf(vocabulary);
  const level = normalizeLevel(placementPayload.level ?? vocabularyPayload.level);
  const goal = normalizeGoal(placementPayload.goal);
  return { level, goal };
}

function focusCandidate({ date, level, goal, track, evidence, previousFocusKey }) {
  const day = dayNumber(date);
  const goalWeight = EXAM_GOALS.has(goal) ? 'exam-reading-and-grammar' : 'general-balance';
  const weak = ROTATION
    .map((skill) => ({ skill, evidence: evidence[skill] }))
    .filter(({ evidence: item }) => item && item.attempted >= 3 && item.accuracyPct !== null)
    .sort((a, b) => a.evidence.accuracyPct - b.evidence.accuracyPct)[0];

  let skill;
  let reason;
  if (goal === 'yds' && evidence.grammar.attempted < 3) {
    skill = 'grammar';
    reason = 'YDS hedefin için dilbilgisi ve cümle kontrolü önceliklendirildi.';
  } else if (goal === 'yds' && evidence.grammar.accuracyPct !== null && evidence.grammar.accuracyPct < 80) {
    skill = 'grammar';
    reason = 'YDS hedefinle ilişkili dilbilgisi doğruluğun güçlendirilecek.';
  } else if (goal !== 'general' && evidence.reading.accuracyPct !== null && evidence.reading.accuracyPct < 80) {
    skill = 'reading';
    reason = 'Hedef sınavın için okuma kanıtı ve çıkarım becerisi önceliklendirildi.';
  } else if (weak && weak.evidence.accuracyPct < 80) {
    skill = weak.skill === 'game' ? 'vocabulary' : weak.skill;
    reason = `${skillLabel(skill)} alanındaki mevcut doğruluk kanıtın daha düşük.`;
  } else {
    skill = ROTATION[((day % ROTATION.length) + ROTATION.length) % ROTATION.length];
    reason = 'Syllabus sırasını korurken becerileri dengeli biçimde döndürüyoruz.';
  }

  const candidates = [skill, ...ROTATION.filter((item) => item !== skill)];
  const selectedSkill = candidates.find((item) => {
    const title = focusList(track, item)[day % focusList(track, item).length];
    return `${item}:${title}` !== previousFocusKey;
  }) ?? skill;
  const list = focusList(track, selectedSkill);
  const title = list[day % list.length];
  const key = `${selectedSkill}:${title}`;
  return { skill: selectedSkill, title, key, reason, goalWeight };
}

function skillLabel(skill) {
  return ({ vocabulary: 'kelime', grammar: 'dilbilgisi', reading: 'okuma', game: 'oyun' })[skill] ?? skill;
}

function previousWasIncomplete(storedPlan, date) {
  if (!storedPlan || typeof storedPlan !== 'object') return false;
  const previousDate = normalizeDateKey(storedPlan.date);
  return previousDate < date && !storedPlan.completedAt;
}

function completedIdsFor(storedPlan, date, goalIds) {
  if (!storedPlan || storedPlan.date !== date || !Array.isArray(storedPlan.completedGoalIds)) return [];
  const valid = new Set(goalIds);
  return storedPlan.completedGoalIds.filter((id) => valid.has(id));
}

function makeGoals({ date, mode, level, focus, track, evidence }) {
  const [reviewMinutes, focusMinutes, practiceMinutes, transferMinutes, exitMinutes] = DURATION[mode];
  const reviewTarget = evidence.dueCount > 0 ? evidence.dueCount : 6;
  const practiceSkill = focus.skill === 'reading' ? 'grammar' : 'reading';
  const practiceTitle = focusList(track, practiceSkill)[dayNumber(date) % focusList(track, practiceSkill).length];
  const transferTarget = track?.skill_targets?.writing ?? track?.skill_targets?.speaking ?? 'Hedef dili kendi cümlende kullan.';

  return [
    {
      id: `${date}:review`, slot: 'review', kind: 'review', minutes: reviewMinutes,
      title: 'Aralıklı tekrar',
      description: `${reviewTarget} eski öğeyi ipucu açmadan geri çağır; sonra hatanı düzelt.`,
      objective: 'Daha önce öğrenilen kelime veya yapıyı gecikmeli olarak hatırlamak.',
      evidence: 'Doğru geri çağırma, hata sonrası düzeltme ve tekrar zamanı kaydı.',
      completion: `${reviewTarget} öğenin tamamını denemek ve cevaplarını kontrol etmek.`,
      href: routeFor('vocabulary', level), target: reviewTarget,
    },
    {
      id: `${date}:focus`, slot: 'focus', kind: 'focus', minutes: focusMinutes,
      title: `Odak: ${focus.title}`,
      description: `${skillLabel(focus.skill)} becerisinde tek bir hedefe odaklan. ${focus.reason}`,
      objective: track?.[focus.skill]?.evidence ?? `${focus.title} hedefini kontrollü alıştırmayla kullanmak.`,
      evidence: 'Hedef etkinlikteki doğruluk ve düzeltilen hata türü.',
      completion: 'Odak etkinliğini tamamlamak ve en az bir düzeltmeyi incelemek.',
      href: routeFor(focus.skill, level), target: 1,
    },
    {
      id: `${date}:practice`, slot: 'practice', kind: 'practice', minutes: practiceMinutes,
      title: `Bağlamda pekiştir: ${practiceTitle}`,
      description: 'Hedef dili yeni bir metin veya soru bağlamında kullan; aynı soruyu ezberden tekrarlama.',
      objective: track?.[practiceSkill]?.evidence ?? `${practiceTitle} becerisini yeni bağlamda uygulamak.`,
      evidence: 'Yeni bağlamdaki cevap doğruluğu ve metin kanıtı.',
      completion: 'Kısa bağlam etkinliğini tamamlamak ve cevabın kanıtını görmek.',
      href: routeFor(practiceSkill, level), target: 1,
    },
    {
      id: `${date}:transfer`, slot: 'transfer', kind: 'transfer', minutes: transferMinutes,
      title: 'Üret ve kullan',
      description: `${transferTarget} En az üç anlamlı İngilizce cümle yaz; mümkünse sesli oku.`,
      objective: 'Öğrenilen dili kişisel veya gerçekçi bir iletişim bağlamına taşımak.',
      evidence: 'Bağımsız yazılı üretim; gelecekte konuşma/dinleme kanıtı eklendiğinde genişletilebilir.',
      completion: 'En az üç İngilizce kelimeden oluşan anlamlı bir yanıt göndermek.',
      href: null, target: 3,
    },
    {
      id: `${date}:exit`, slot: 'exit', kind: 'exit', minutes: exitMinutes,
      title: 'Çıkış bileti',
      description: 'Bugünkü hedefi seçeneklere bakmadan bir cümleyle hatırla ve yarınki tekrara bırak.',
      objective: 'Öğrenme kanıtını öz değerlendirme ve gecikmeli tekrar için işaretlemek.',
      evidence: 'Çıkış yanıtı ve öğrencinin kendi güven değerlendirmesi.',
      completion: 'Çıkış biletini göndererek bugünkü planı kapatmak.',
      href: null, target: 1,
    },
  ];
}

/**
 * Build a deterministic, explainable 20-minute (or recovery) plan.
 * @param {DailyPlanOptions} options
 */
export function buildDailyLearningPlan({ date = new Date(), progress = [], storedPlan = null, syllabus = null } = {}) {
  const day = normalizeDateKey(date);
  const evidence = summarizeDailyEvidence(progress);
  const profile = resolveProfile(progress);
  const track = trackFor(syllabus, profile.level);
  const previousFocusKey = storedPlan?.date === day ? storedPlan.focusKey : storedPlan?.focusKey;
  const focus = focusCandidate({
    date: day,
    level: profile.level,
    goal: profile.goal,
    track,
    evidence,
    previousFocusKey,
  });
  const mode = previousWasIncomplete(storedPlan, day) ? 'recovery' : 'full';
  const goals = makeGoals({ date: day, mode, level: profile.level, focus, track, evidence });
  const goalIds = goals.map((goal) => goal.id);
  const completedGoalIds = completedIdsFor(storedPlan, day, goalIds);
  const completedCount = completedGoalIds.length;

  return {
    version: DAILY_PLAN_VERSION,
    date: day,
    path: 'adaptive-spiral',
    mode,
    totalMinutes: mode === 'recovery' ? 8 : 20,
    backlogCount: 0,
    level: profile.level,
    levelLabel: levelLabel(profile.level, track),
    goal: profile.goal,
    goalLabel: GOAL_LABELS[profile.goal],
    focus,
    selection: {
      reason: focus.reason,
      goalWeight: focus.goalWeight,
      dueCount: evidence.dueCount,
      weakestSkill: focus.skill,
      previousFocusKey: previousFocusKey ?? null,
    },
    goals,
    completedGoalIds,
    completedCount,
    completed: completedCount === goals.length,
  };
}

export function mergeCompletedGoal(plan, goalId, output = '') {
  const validGoal = plan?.goals?.find((goal) => goal.id === goalId);
  if (!validGoal) return { ok: false, error: 'invalid_goal' };
  if (validGoal.kind === 'transfer' && String(output).trim().split(/\s+/).filter(Boolean).length < 3) {
    return { ok: false, error: 'output_too_short' };
  }
  const completedGoalIds = Array.from(new Set([...(plan.completedGoalIds ?? []), goalId]));
  const completed = completedGoalIds.length === plan.goals.length;
  return {
    ok: true,
    plan: {
      ...plan,
      completedGoalIds,
      completedCount: completedGoalIds.length,
      completed,
      completedAt: completed ? new Date().toISOString() : undefined,
      lastOutput: validGoal.kind === 'transfer' ? String(output).trim().slice(0, 1000) : plan.lastOutput,
    },
  };
}
