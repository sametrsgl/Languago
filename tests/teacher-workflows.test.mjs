import test from 'node:test';
import assert from 'node:assert/strict';
import { moduleEvidence } from '../src/lib/teacher-evidence.mjs';
import { moduleSummary } from '../src/lib/teacher-summary.mjs';

test('teacher module evidence rejects impossible percentages and gives an actionable state', () => {
  assert.deepEqual(moduleEvidence({ payload: { percent: 140 }, updated_at: '2026-09-01T10:00:00Z' }), {
    label: 'Kanıt bekleniyor',
    tone: 'neutral',
    next: 'Öğrenci bu modülde geçerli bir çalışma tamamladığında burada görünür.',
  });
});

test('teacher module evidence separates started, completed and accuracy signals', () => {
  assert.deepEqual(moduleEvidence({ payload: { completed: 3, total: 5, correct: 2 }, updated_at: '2026-09-01T10:00:00Z' }), {
    label: '3/5 tamamlandı · %67 doğruluk',
    tone: 'progress',
    next: 'Kalan 2 etkinliği tamamla; ardından yanlışlarını yeniden dene.',
  });
});

test('teacher summary remains backwards compatible for meaningful legacy payloads', () => {
  assert.equal(moduleSummary({ payload: { correct: 4, total: 5 } }), '4/5');
  assert.equal(moduleSummary({ payload: { percent: 40 } }), '%40');
});
