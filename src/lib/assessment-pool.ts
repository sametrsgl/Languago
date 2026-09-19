import pool from '../data/placement-question-pool.json';
import { WORD_DATA } from '../data/words.js';
import { createAssessmentVocabulary } from './vocab-path.mjs';

export const assessmentVocabulary = createAssessmentVocabulary(WORD_DATA, 5000);
export const assessmentQuestions = [...pool.questions, ...assessmentVocabulary];

export function publicAssessmentQuestion(question: (typeof assessmentQuestions)[number]) {
  const { answer: _answer, ...publicQuestion } = question;
  return publicQuestion;
}

export const publicAssessmentPool = {
  ...pool,
  total: assessmentQuestions.length,
  counts: {
    ...pool.counts,
    vocabulary: assessmentVocabulary.length,
  },
  questions: assessmentQuestions.map(publicAssessmentQuestion),
};
