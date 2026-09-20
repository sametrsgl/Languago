# Anonymous placement draft parity — 2026-09-20

## Primary improvement and reproduction

Baseline `1f6b2b5` had two replay implementations. The save route validated and deduplicated evidence, but the homepage's inline async replay trusted each stored row and counted option rotations separately. Executing that actual inline function with real pool records reproduced:

- A null row throws `Cannot read properties of null (reading 'id')` before any answer check.
- An impossible choice reaches the checker and aborts the whole resume operation.
- Two option rotations count as two answers; server replay correctly counts one.

Extracted the existing server row-validation logic into `placementAnswerEntries`, shared by server replay and the new asynchronous `replayPlacementDraft`. Both preserve the 40-input-row bound, validate choices against the actual pool, retain reading passage context, deduplicate tasks, and stop at completion. The browser still grades through the answer API: no answer keys or stored correctness are trusted. Network failures reject without overwriting the original draft; successful resume writes only rebuilt evidence. Learner name and goal normalization remain intact. No auth, data, IDs, scoring, question selection, dependencies, credentials or database changes.

Reference: MDN's `JSON.parse` return-value documentation (queried through Context7) explicitly permits arrays, primitives and null. Successful JSON parsing does not validate stored row shape.

## Verification before commit

- Added seven focused tests. The actual baseline failures above were reproduced before implementation; the new helper's tests first failed, then passed after implementation.
- Focused draft/client/replay/no-repeat suites: **31 passed**, zero failures.
- `npm test` and explicit `node --test tests/*.mjs tests/**/*.mjs`: **166 passed**, zero failures/skips in each execution.
- `npm run typecheck`: exit 0 (`tsc --noEmit`; not full `.astro` semantic analysis).
- `npm run build`: exit 0. Entire 62-line output inspected: client build succeeded, server built in 42.33s, `Complete!`; no `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing 1,314.86 kB word-data chunk warning remains.
- Updated the existing stale replay smoke script: fixtures now use checked-in keys instead of expecting the public pool to expose them; learner profile and current result text are respected. It asserts the public pool contains no `answer` fields and records actual checker requests.
- Local Chrome smoke: five scenarios at **1440px and 390px**, ten passed. Malformed rows, invalid indexes, duplicate rotations, extra post-completion answers and corrupt JSON covered. Real pool/check API used; only persistence intercepted to prevent learner writes. Keyboard launch, focus, next question, sanitized draft, completion payload, no horizontal overflow, zero page/console errors verified. Not an offline/service-worker or physical screen-reader test.
- Local home, pool, mascot, signin, lesson explorer and class game: HTTP 200; protected games hub redirects to signin and renders HTTP 200.
- `node scripts/validate-content.mjs` before/after: zero blocking errors; 3,167 active questions/unique IDs, 3,177 historical registry entries/unique IDs, zero collisions. Generated timestamp-only differences restored.
- `git diff --check` and smoke script syntax check passed. Production status is verified after commit/push and reported in the scheduled delivery, not presumed here.

## Inventory before → after (source data unchanged)

| Metric | Before | After |
| --- | ---: | ---: |
| Stored placement records | 10,000 | 10,000 |
| Combined records / unique IDs | 15,000 / 15,000 | 15,000 / 15,000 |
| Distinct source tasks | 8,167 | 8,167 |
| Option-variant excess / passage-aware prompt excess | 6,833 / 6,833 | 6,833 / 6,833 |
| Raw normalized prompt excess | 6,960 | 6,960 |
| Missing explanation text | 4,464 | 4,464 |
| Schema errors / duplicate-option records | 0 / 0 | 0 / 0 |
| Implemented catalog routes / listed placeholders | 3 / 0 | 3 / 0 |

CEFR record distribution: A1 3,021; A2 2,344; B1 2,415; B2 3,342; C1 2,667; C2 1,211. Distinct tasks by CEFR: 1,325 / 1,197 / 1,225 / 1,922 / 1,647 / 851. Sources: grammar 6,445, reading 3,555, vocabulary 5,000. Answer indexes 0–3: 4,372 / 2,597 / 3,811 / 4,220. Normalization retains punctuation; generic stems in different passages are not automatically duplicate tasks.

Recorded approved, pending, quarantined and rejected: **zero each**, with **15,000 unrecorded review statuses**. Added, editorially repaired, approved, quarantined and rejected this run: **zero each**. The 5,000 approved-quality target is not verified; record count is not approval or psychometric evidence.

Games: spelling/productive recall A1–B2; vocabulary meaning quiz A1–C1; team grammar grid A1–C1. No C2 game or homepage classroom catalog; the 30-game target remains unmet. Live `/sinif-oyunu` JSON was parsed (not source-counted): **97 topics, 2,378 questions/unique IDs, minimum 20 distinct stems per topic, zero within-topic duplicate stems, undersized topics or schema/index errors**. This does not certify all teacher controls, pedagogical quality or authenticated game flows.

## Warnings and next priority

**1,068 content warnings remain:** 73 answer-position imbalance, 990 missing reading explanations, five generic reading-stem reuse warnings. Semantic duplicates, ambiguity, weak distractors, shallow rule-recognition, unnatural English, reading leakage and inappropriate vocabulary were not exhaustively reviewed; their counts are unknown, not zero. The vocabulary assessment still uses translation prompts. No real learner-response data or psychometric reliability analysis was performed.

Next high-value bounded improvement: establish item review/quarantine metadata and audit a small contextual batch before increasing question counts. The separate vocabulary diagnostic's numeric confidence and the classroom catalog remain follow-up scope.
