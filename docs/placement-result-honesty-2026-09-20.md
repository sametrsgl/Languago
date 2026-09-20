# Placement result honesty — 2026-09-20

## Bounded improvement and root cause

The shared `placementResult` converted general-English accuracy and a CEFR level bonus into exam scores without outcome calibration. Reproduction at baseline `841e7ae`: the same B1/67%-accuracy fixture produced IELTS 5, TOEFL 90, YDS 65, general 57, other 70, plus confidence 0.76. A disclaimer did not make these invented conversions defensible.

Removed the exam-score and numeric-confidence formulas from the shared result boundary. `estimatedScore` and `confidence` remain explicit `null` fields for payload compatibility. Observed accuracy, answered/correct counts, CEFR starting estimate, band evidence, learner name and selected goal remain. Both the homepage and authenticated save route consume the corrected result; auth, adaptive movement, answer checking, completion limits, source data and IDs are unchanged.

The homepage now renders a CEFR starting estimate instead of an exam score. Turkish copy separates the learner's goal from the general-English questions and explicitly says the test does not produce IELTS/TOEFL/YDS scores or measure speaking, listening and writing. The next step calls for checking suitability with the teacher and the other skills. This is not a claim that the remaining CEFR heuristic is psychometrically calibrated.

No production data migration or learner writes. Older stored scores are unchanged. The separate vocabulary diagnostic's numeric confidence remains a follow-up issue, not part of this placement-result fix.

## Verification actually executed before commit

- Baseline full Node suite: 158 passing. New/updated root-cause assertions: 3 tests failed before implementation; focused result/replay suites subsequently passed 18/18.
- Model regression covers all five goals and all-correct, all-incorrect, mixed and empty histories. API regression executes the actual save route with only Supabase replaced by an explicit test boundary, checks all goals, and ensures supplied score/confidence values cannot override the null server results.
- `npm test` and explicit full `node --test tests/*.mjs tests/**/*.mjs`: exit 0; full suite 159 passing, 0 failures, 0 skips.
- `npm run typecheck`: exit 0 (`tsc --noEmit`, not full `.astro` semantic checking).
- `npm run build`: exit 0; complete 62-line log inspected, client and server completed, `Server built in 27.70s` / `Complete!`; no `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing word-data chunk warning: 1,314.86 kB minified.
- `scripts/smoke-placement-results.mjs`: 10 local Chrome scenarios, five goals at both 1440px and 390px. Real source records and live answer checks replay 30 answers per scenario; result values, explicit limits, goal metadata, signup link, keyboard resume/restart, cleared draft and absence of horizontal overflow checked. Zero console/page errors. Only result saving is intercepted to prevent real learner writes; persistence is separately tested above. Service worker bypassed, not an offline or physical screen-reader test.
- Local home, pool, mascot, signin, lesson explorer and class game: HTTP 200. Protected games hub ends at signin, HTTP 200.
- Content validator before/after: zero blocking errors, unchanged inventory. Active registered questions = active unique IDs = 3,167. Historical registry entries = unique IDs = 3,177, zero collisions. Timestamp-only generated outputs were restored.
- `git diff --check` and smoke script syntax check passed. Final deployment commit/status and production smoke are reported in the cron delivery after pushing, not presumed here.

## Measured inventory before → after (no question edits)

| Metric | Before | After |
| --- | ---: | ---: |
| Stored pool records | 10,000 | 10,000 |
| Combined served records / unique IDs | 15,000 / 15,000 | 15,000 / 15,000 |
| Distinct source tasks | 8,167 | 8,167 |
| Option-variant excess records | 6,833 | 6,833 |
| Normalized prompt excess | 6,960 | 6,960 |
| Passage-aware prompt excess | 6,833 | 6,833 |
| Missing explanation text | 4,464 | 4,464 |
| Schema errors / duplicate-option records | 0 / 0 | 0 / 0 |
| Implemented catalog routes / listed placeholders | 3 / 0 | 3 / 0 |

Sources: grammar 6,445, reading 3,555, vocabulary 5,000. Combined CEFR counts: A1 3,021; A2 2,344; B1 2,415; B2 3,342; C1 2,667; C2 1,211. Distinct source tasks by CEFR: A1 1,325; A2 1,197; B1 1,225; B2 1,922; C1 1,647; C2 851. Answer positions 0–3: 4,372 / 2,597 / 3,811 / 4,220. Generic reading prompts across different passages are not automatically duplicates; punctuation is retained during normalization.

Recorded approved/pending/quarantined/rejected statuses: zero each; all 15,000 records have unrecorded review status. Added, editorially repaired, approved, quarantined or rejected items this run: zero each. This is not 15,000 approved items; the 5,000 approved, high-quality target remains unverified. The vocabulary portion currently uses Turkish-translation prompts and does not satisfy the requested non-translation assessment standard.

Game source/route inventory: spelling/productive recall A1–B2, vocabulary meaning quiz A1–C1, team grammar grid A1–C1. No C2 game, homepage classroom catalog, 30-game claim or full teacher-control certification. Existing game unit tests are included in the full suite; authenticated play was not newly audited.

## Explicit QA debt

Content warnings remain **1,068**: 73 answer-position imbalance, 990 missing reading explanations, 5 generic reading-stem reuse. A semantic-duplicate, ambiguous-key, distractor, rule-recognition, unnatural-English, reading-leakage and CEFR-vocabulary review was not completed in this bounded run; their counts are unknown, not zero. No learner response dataset or facility/discrimination/time/abandonment statistics were analyzed. No psychometric reliability claim.

Next high-value bounded work: establish review/quarantine metadata and audit a small contextual question batch; do not expand the bank by rotating options or changing names. Anonymous draft replay validation and the separate vocabulary confidence display also need follow-up. The 30-game catalog remains substantial uncompleted product scope.
