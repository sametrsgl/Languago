import { writeFile } from 'node:fs/promises';
import { GRAMMAR_MCQ_A1 } from '../src/data/grammar_mcq_a1.js';
import { GRAMMAR_MCQ_A2 } from '../src/data/grammar_mcq_a2.js';
import { GRAMMAR_MCQ_B1 } from '../src/data/grammar_mcq_b1.js';
import { GRAMMAR_MCQ_B2 } from '../src/data/grammar_mcq_b2.js';
import { GRAMMAR_MCQ_C1 } from '../src/data/grammar_mcq_c1.js';
import { READINGS_A1 } from '../src/data/readings_a1.js';
import { READINGS_A2 } from '../src/data/readings_a2.js';
import { READINGS_B1 } from '../src/data/readings_b1.js';
import { READINGS_B2 } from '../src/data/readings_b2.js';
import { READINGS_C1 } from '../src/data/readings_c1.js';
import { READINGS_C2 } from '../src/data/readings_c2.js';
import { READINGS_IELTS } from '../src/data/readings_ielts.js';
import { READINGS_TOEFL } from '../src/data/readings_toefl.js';
import { READINGS_YDS } from '../src/data/readings_yds.js';
import { READINGS_YOKDIL } from '../src/data/readings_yokdil.js';
import { READINGS_GRE } from '../src/data/readings_gre.js';

const TARGET = 10_000;
const pools = [
  ['A1', 'grammar', GRAMMAR_MCQ_A1],
  ['A2', 'grammar', GRAMMAR_MCQ_A2],
  ['B1', 'grammar', GRAMMAR_MCQ_B1],
  ['B2', 'grammar', GRAMMAR_MCQ_B2],
  ['C1', 'grammar', GRAMMAR_MCQ_C1],
  ['A1', 'reading', READINGS_A1],
  ['A2', 'reading', READINGS_A2],
  ['B1', 'reading', READINGS_B1],
  ['B2', 'reading', READINGS_B2],
  ['C1', 'reading', READINGS_C1],
  ['C2', 'reading', READINGS_C2],
  ['B2', 'reading', READINGS_IELTS],
  ['B2', 'reading', READINGS_TOEFL],
  ['C1', 'reading', READINGS_YDS],
  ['C1', 'reading', READINGS_YOKDIL],
  ['C2', 'reading', READINGS_GRE],
];

function flatten() {
  const result = [];
  for (const [level, source, data] of pools) {
    if (source === 'grammar') {
      for (const [unitId, questions] of Object.entries(data)) {
        questions.forEach((question, index) => result.push({
          sourceId: `${unitId}-${index + 1}`,
          level,
          source,
          prompt: question.q,
          options: question.options,
          answer: question.a,
          why: question.why?.[question.a] || '',
        }));
      }
      continue;
    }
    for (const passage of data) {
      (passage.questions || []).forEach((question, index) => result.push({
        sourceId: `${passage.id}-${index + 1}`,
        level,
        source,
        passageTitle: passage.title,
        prompt: question.q,
        options: question.options,
        answer: question.a,
        why: question.why?.[question.a] || '',
      }));
    }
  }
  return result;
}

function rotateOptions(item, variant) {
  const count = item.options.length;
  const shift = variant % count;
  const order = item.options.map((_, index) => (index + shift) % count);
  const options = order.map((index) => item.options[index]);
  return { options, answer: order.indexOf(item.answer) };
}

const base = flatten();
if (base.length === 0) throw new Error('The source bank is empty');
const pool = [];
let variant = 0;
while (pool.length < TARGET) {
  for (const item of base) {
    if (pool.length >= TARGET) break;
    const rotated = rotateOptions(item, variant);
    pool.push({
      id: `placement-${String(pool.length + 1).padStart(5, '0')}`,
      sourceId: item.sourceId,
      level: item.level,
      source: item.source,
      passageTitle: item.passageTitle || null,
      prompt: item.prompt,
      options: rotated.options,
      answer: rotated.answer,
      why: item.why,
      variant,
    });
  }
  variant += 1;
}

const counts = Object.fromEntries(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => [level, pool.filter((q) => q.level === level).length]));
const output = {
  version: 1,
  generatedAt: new Date().toISOString(),
  total: pool.length,
  baseItems: base.length,
  variants: variant,
  counts,
  questions: pool,
};
await writeFile(new URL('../src/data/placement-question-pool.json', import.meta.url), `${JSON.stringify(output)}\n`);
console.log(JSON.stringify({ total: pool.length, baseItems: base.length, variants: variant, counts }, null, 2));
