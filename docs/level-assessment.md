# Languago level assessment

## Current contract

The homepage `#level-test` assessment asks for:

- the learner's name;
- the learner's target: General English, IELTS, TOEFL, YDS/YÖKDİL or another target;
- at least 30 adaptive questions, with a hard cap of 40;
- grammar, vocabulary and reading items selected from the learner's current level target.

Two consecutive correct answers move the target up one CEFR band. A wrong answer moves it down one band, never below A1. The assessment stores only answer indexes in the browser draft. After completion, the authenticated save endpoint recomputes correctness from the server pool before writing the `placement-test` row and updating the profile CEFR level.

## Results

Every result reports:

- a provisional CEFR starting-level estimate (A1–C2);
- observed answered/correct counts and accuracy, including per-band evidence;
- the learner's selected target label, not an exam-specific assessment claim.

`estimatedScore` and `confidence` remain in the result/save payload for compatibility, but are explicitly `null`. There is no calibrated exam-score mapping or confidence probability. The removed arithmetic formulas must not be restored without validation against real response data and exam outcomes. Accuracy is the observed proportion correct, not an exam score or a confidence estimate.

The homepage explicitly says the test does not produce IELTS/TOEFL/YDS scores and does not measure speaking, listening or writing. A CEFR label is only a starting point for choosing study material; it is neither certification nor a validated four-skill level assessment. Older stored results are not migrated by this change.

## Question inventory verified in the repository

- Grammar: 6,445 adaptive records from the existing checked-in pool.
- Reading: 3,555 adaptive records from the existing checked-in pool.
- Vocabulary: 5,000 deterministic records built from the validated word records and Turkish meanings.
- Combined homepage assessment endpoint: 15,000 records.

This is not a claim of 5,000 independently authored items in every domain. Reading currently has 3,555 verified records. Duplicating stems or rotating answer positions to reach an arbitrary number would make the level estimate less trustworthy, so additional reading items require authored passages and semantic QA.

## Account and teacher flow

An anonymous learner gets a local draft. After signup or signin, the existing optional draft transfer posts the completed evidence to the authenticated endpoint. A signed-in student without a completed assessment sees a dashboard callout linking back to the homepage assessment. The saved evidence remains in the student's `student_progress` row for teacher-facing analysis; no secret or credential is written to the browser draft.

## Next implementation slice

1. Add authored, validated exam-specific task types instead of treating general grammar/reading as an official IELTS/TOEFL/YDS test.
2. Expand reading with new passage-specific questions until the target inventory is reached; preserve stable IDs and passage context.
3. Collect real response data and benchmark observations before considering calibrated exam-score mappings or confidence estimates.
4. Add rate limiting or authenticated test sessions if automated answer probing becomes an operational risk; the answer key is no longer included in the public pool, while the checker returns only the result for a submitted item.
