# Placement grading response contract — 2026-09-21

## Bounded improvement

`checkPlacementAnswer` previously accepted any JSON on HTTP 200. The homepage and anonymous-draft replay coerced `correct` with `Boolean()`: a string `"false"` became a correct answer, and missing fields could become incorrect answers. Validate the response at the shared network boundary before learner state changes. Require a boolean grade, nonnegative integer answer index, and agreement between the grade and selected index. The client does not know the option count here; the server remains responsible for checking the question and option bounds.

No API, auth, content, database, or dependency changes. Existing error/retry UI is reused. A failed draft replay retains the original stored draft.

## Verification

- New malformed-response regression failed before the fix (missing expected rejection).
- Focused client tests: 6 passed; includes 12 malformed payloads and valid incorrect grades.
- Full Node suite: 168 passed, zero failures/skips.
- Typecheck: passed.
- Production build: client and server completed; no Unexpected / Build failed / error TS / is not defined markers. Existing words bundle exceeds 500 kB.
- Browser smoke at 1440px and 390px: live answer and draft resume each reject an explicitly injected malformed HTTP-200 payload, preserve progress, then retry against the real grading API. Four scenarios passed locally, no console/page errors, no horizontal overflow, no progress-save requests.
- `scripts/smoke-placement-grading.mjs` is reusable on production via `PLACEMENT_SMOKE_BASE`.

## Measured audit baseline (unchanged by this release)

- Stored placement records: 10,000; unique IDs: 10,000; canonical source tasks: 3,167. These are NOT 10,000 independent approved questions.
- Stored CEFR distribution: A1 2,313; A2 1,702; B1 1,785; B2 2,130; C1 1,530; C2 540.
- Canonical source CEFR distribution: A1 617; A2 555; B1 595; B2 710; C1 510; C2 180.
- Stored review status absent on all 10,000 records: approved/pending/quarantined/rejected counts are not tracked, not zero. This run added/repaired/quarantined/rejected zero questions.
- Text-only normalized duplicate prompt excess: 6,960 stored records; 127 canonical source tasks. Generic reading stems across different passages are not automatically semantic duplicates.
- Stored answer positions 0/1/2/3: 3,122 / 1,347 / 2,561 / 2,970. Empty/missing stored explanations: 4,464.
- Served assessment pool adds 5,000 vocabulary records: 15,000 unique IDs total. CEFR A1 3,021; A2 2,344; B1 2,415; B2 3,342; C1 2,667; C2 1,211. No `answer` keys exposed.
- Content validator: zero blocking errors; 1,068 warnings: 73 answer-imbalance, 990 missing reading explanations, 5 cross-passage repeated-stem warnings. Registry: 3,177 entries and unique IDs, no collisions; active registered questions 3,167 (registry retains historical entries).
- Game hub contains three implemented game routes: spelling, vocabulary quiz, classroom grid. No placeholder entries in that three-card hub. Only one is a classroom-specific game; the requested 30-game homepage catalog is absent, not complete.
- Live classroom bank: 97 topics, minimum 20 distinct stems per topic, no within-topic duplicate stems or invalid answer indexes; A1–C1 coverage. This verifies bank structure, not pedagogical quality of generated distractors or all teacher controls.

## Remaining debt

No semantic-duplicate, ambiguity, weak-distractor, reading-leakage, vocabulary-appropriateness, or psychometric approval audit was completed in this bounded engineering fix. No learner-response analytics were examined. Do not claim 5,000 approved high-quality questions or psychometric reliability. Next content priority: review-status/audit tracking and a small pedagogically reviewed canonical batch, rather than more option-rotation variants. Classroom catalog remains a separate substantial product gap.
