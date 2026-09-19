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

- CEFR estimate (A1–C2);
- answered/correct counts and accuracy;
- target label;
- confidence based on answered volume and band evidence;
- an estimated target score for IELTS, TOEFL, YDS/YÖKDİL or another target.

Exam scores are explicitly estimates, not official exam results or a substitute for a full four-skill exam. The current formula is a bounded orientation score; it must not be presented as a calibrated prediction until it is validated against real exam outcomes.

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
3. Calibrate score mappings with real benchmark observations before exposing score bands as anything stronger than orientation estimates.
4. Add rate limiting or authenticated test sessions if automated answer probing becomes an operational risk; the answer key is no longer included in the public pool, while the checker returns only the result for a submitted item.
