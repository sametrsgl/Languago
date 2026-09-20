import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildDailyLearningPlan,
  mergeCompletedGoal,
  summarizeDailyEvidence,
} from '../src/lib/daily-learning-plan.mjs';

const syllabus = {
  tracks: {
    b1: {
      label: 'B1 · Orta',
      goal: 'Tanıdık ve işlevsel konularda iletişim kurmak.',
      vocabulary: { focus: ['iş ve okul', 'teknoloji'], evidence: 'Kelimeyi iki bağlamda kullan.' },
      reading: { focus: ['haber ve blog', 'neden-sonuç'], evidence: 'Ana fikir ve kanıtı ayır.' },
      grammar: { focus: ['present perfect', 'relative clauses'], evidence: 'İki cümleyi anlamı koruyarak birleştir.' },
      skill_targets: { speaking: 'Görüşlerini gerekçeyle anlat.', writing: 'Bağlantılı kısa paragraf yaz.' },
    },
  },
};

test('daily plan creates a twenty-minute adaptive spiral with measurable goals', () => {
  const plan = buildDailyLearningPlan({
    date: '2026-09-20',
    syllabus,
    progress: [
      { module: 'placement-test', payload: { level: 'b1', goal: 'general', confidence: 0.8 } },
      { module: 'grammar', payload: { attempted: 10, correct: 5 } },
      { module: 'reading', payload: { attempted: 10, correct: 9 } },
      { module: 'vocab', payload: { dueCount: 6 } },
    ],
  });

  assert.equal(plan.version, 1);
  assert.equal(plan.path, 'adaptive-spiral');
  assert.equal(plan.totalMinutes, 20);
  assert.equal(plan.level, 'b1');
  assert.equal(plan.goal, 'general');
  assert.equal(plan.focus.skill, 'grammar');
  assert.equal(plan.goals.length, 5);
  assert.equal(plan.goals.reduce((sum, goal) => sum + goal.minutes, 0), 20);
  assert.equal(new Set(plan.goals.map((goal) => goal.id)).size, 5);
  assert.ok(plan.goals.every((goal) => goal.objective && goal.evidence && goal.completion));
  assert.match(plan.goals[0].description, /6/);
});

test('daily plan uses goal weighting and avoids yesterday focus when selecting a new focus', () => {
  const plan = buildDailyLearningPlan({
    date: '2026-09-21',
    syllabus,
    storedPlan: { date: '2026-09-20', focusKey: 'reading:haber ve blog', completedAt: '2026-09-20T20:00:00Z' },
    progress: [
      { module: 'placement-test', payload: { level: 'b1', goal: 'yds' } },
      { module: 'grammar', payload: { attempted: 4, correct: 3 } },
      { module: 'reading', payload: { attempted: 4, correct: 3 } },
    ],
  });

  assert.equal(plan.goal, 'yds');
  assert.equal(plan.focus.skill, 'grammar');
  assert.notEqual(plan.focus.key, 'reading:haber ve blog');
  assert.equal(plan.selection.goalWeight, 'exam-reading-and-grammar');
});

test('incomplete previous day produces a short recovery plan without backlog inflation', () => {
  const plan = buildDailyLearningPlan({
    date: '2026-09-22',
    syllabus,
    storedPlan: { date: '2026-09-21', focusKey: 'grammar:present perfect', completedGoalIds: [] },
    progress: [{ module: 'placement-test', payload: { level: 'b1', goal: 'general' } }],
  });

  assert.equal(plan.mode, 'recovery');
  assert.equal(plan.totalMinutes, 8);
  assert.equal(plan.goals.reduce((sum, goal) => sum + goal.minutes, 0), 8);
  assert.equal(plan.backlogCount, 0);
});

test('evidence summary does not convert exposure into accuracy', () => {
  const evidence = summarizeDailyEvidence([
    { module: 'vocab', payload: { viewedCount: 40, dueCount: 5 } },
    { module: 'grammar', payload: { attempted: 4, correct: 1 } },
  ]);

  assert.equal(evidence.dueCount, 5);
  assert.equal(evidence.vocab.attempted, 0);
  assert.equal(evidence.grammar.accuracyPct, 25);
});

test('transfer goal requires real learner output and duplicate completion is idempotent', () => {
  const plan = buildDailyLearningPlan({
    date: '2026-09-23',
    syllabus,
    progress: [{ module: 'placement-test', payload: { level: 'b1', goal: 'general' } }],
  });
  const transfer = plan.goals.find((goal) => goal.kind === 'transfer');
  assert.ok(transfer);
  assert.equal(mergeCompletedGoal(plan, transfer.id, 'one').error, 'output_too_short');
  const completed = mergeCompletedGoal(plan, transfer.id, 'I use this target language today.');
  assert.equal(completed.ok, true);
  assert.equal(completed.plan.completedCount, 1);
  const duplicate = mergeCompletedGoal(completed.plan, transfer.id, 'I use this target language today.');
  assert.equal(duplicate.plan.completedCount, 1);
});
