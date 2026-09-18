# A1 plural-subject answer-key repair — 2026-09-18

## Primary improvement and evidence

`The students ___ English every day. (study)` was keyed to **studies** and explained the singular `-y → -ies` rule while incorrectly rejecting **study**. The first incorrect boundary was `GRAMMAR_MCQ_A1['a1-05'][7]`: the subject is plural. That key propagated to grammar practice, the server-built classroom game and all four option rotations in the placement pool.

Production `/api/placement/pool?v=2` was read before editing: all four records returned **studies**. Five new regression tests reproduced three failures (source key, placement replay, classroom feedback) and two passes. Cambridge Grammar confirms the base form for plural subjects, with `-s`/`-ies` for third-person singular only:

https://dictionary.cambridge.org/grammar/british-grammar/present-simple-i-work

The source now keys **study** and provides a specific Turkish explanation for every option. Distractors, stem, source index, registry identity and placement IDs are unchanged. The existing generator refreshed the placement artifact; semantic comparison with the parent commit proved only the four records' `answer` and `why` fields changed (plus the artifact generation timestamp). No whole-bank rewriting, artificial expansion or new approval claim.

The homepage requests `pool?v=3`, avoiding a browser's still-fresh cached v2 answer key after reload. The service worker already passes API requests through. Already-open pages retain their in-memory pool until reloaded; no forced reload or historical learner-data rewrite is attempted. The save API already recomputes correctness from the current server pool.

## Versioned item audit

Previous content revision: baseline 1 at parent commit `9618e4933c26391ac57f28d32da2d0abf8669d74`. New item revision: 2, represented by this repair commit. This is an answer-key review, **not full placement-item approval**.

- Source pool: `grammar:a1:a1-05`, source ID: `a1-05-8`, registry ID: `q_fafebf4fd61e`.
- Flaws: incorrect subject–verb agreement key; false rejection of a correct answer; incorrect explanatory feedback.
- Reason: `the students` is plural; `every day` describes a habit; the finite present-simple form is `study`, not `studies`.
- Source answer index: **1 → 0**. Validation: source key, option-aligned explanations, replay and classroom feedback pass.

| Item ID | Old revision / index / answer | New revision / index / answer | Validation |
| --- | --- | --- | --- |
| placement-00096 | 1 / 1 / studies | 2 / 0 / study | pass |
| placement-03263 | 1 / 0 / studies | 2 / 3 / study | pass |
| placement-06430 | 1 / 3 / studies | 2 / 2 / study | pass |
| placement-09597 | 1 / 2 / studies | 2 / 1 / study | pass |

## Verification before release

- New focused tests: **5/5 pass**, previously 3 failed. Includes correct/incorrect replay for every rotation and a source-parity regression across **all generated grammar records** (prompt, option set, keyed text, explanation).
- Full Node suite: **137 passed**, zero failures/skips/cancellations. `npm run typecheck` (`tsc --noEmit`): exit 0; not a claim of `astro check` coverage.
- `npm run build`: exit 0; full 61-line log inspected, client and server complete, no `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing **1,314.86 kB word-data chunk** warning remains.
- Local Chrome smoke at **1440px and 390px: 10/10 pass**, no console/page errors or horizontal overflow; keyboard start/resume, focus, corrupt drafts, option-variant dedupe, completion and canonical outgoing history checked. Save endpoint is explicitly intercepted in completion scenarios: **no real account or database write** is claimed.
- Local served placement pool equals the checked-in artifact; served classroom JSON keys the repaired item to `study` and provides its plural-subject explanation.
- Content validator: **0 blocking errors** before and after; **3,167 registry entries / unique IDs**, no collisions. Registry timestamp-only diff restored after semantic equality check.
- Warnings **1,069 → 1,068**: answer-distribution **74 → 73**, missing reading explanations **990**, generic reading-stem reuse **5**. Fixing the key incidentally brings this unit below the validator's imbalance threshold; it does not establish psychometric quality. The content-audit report is intentionally updated.
- Syntax check and `git diff --check` pass; final diff checked for unrelated content, secrets, auth changes and identity churn. No dependencies, credentials, policies, migrations or production learner data changed.

## Measured inventories (before → after)

- Placement records / unique IDs: **10,000 / 10,000 → 10,000 / 10,000**.
- Passage-aware distinct tasks: **3,167 → 3,167**; option-rotation excess **6,833 → 6,833**. Normalized-prompt excess **6,965 → 6,965**, including legitimate generic stems across different passages.
- Invalid answer indexes / duplicate option sets: **0 / 0**, unchanged. This structural check alone did not detect the pedagogically wrong key.
- Missing explanation text: **4,464**, unchanged. Answer-index distribution 0–3: **3,122 / 1,350 / 2,558 / 2,970**, unchanged because all four rotations were repaired.
- CEFR stored / distinct: **A1 2,313 / 617; A2 1,702 / 555; B1 1,785 / 595; B2 2,130 / 710; C1 1,530 / 510; C2 540 / 180**, unchanged.
- Repaired this run: **1 distinct source item / 4 placement records**. Added, approved, quarantined, rejected: **0 each**. The pool still records no approved/pending/quarantined/rejected statuses: **10,000 unrecorded**. A narrow key correction is not a full editorial approval; the **5,000-approved-distinct-item target remains unmet**.
- Catalog: **3 implemented routes / 0 listed placeholders**, unchanged. Spelling/productive recall A1–B2; vocabulary-meaning quiz A1–C1; team grammar grid A1–C1. This does not certify every requested teacher control. Homepage classroom catalog, 30 distinct games and C2 game coverage remain outstanding.
- Served classroom data: **97 topics / unique IDs, 2,377 questions**, minimum **20 unique normalized stems per topic**, no within-topic duplicates or invalid answer indexes. Topic CEFR counts: A1 **21**, A2 **20**, B1 **22**, B2 **22**, C1 **12**. No claims of complete distractor/semantic QA from these counts.

## Release and remaining work

Commit only the source bank, generated pool, homepage cache-version change, focused test, updated content-audit and this note. Push main through the existing Git-connected Vercel deployment. Final cron report records the exact deployment commit/status, public-route checks, live corrected answer keys and production browser smoke after push.

Next bounded priority: quarantine or repair context-free tense/article items where more than one offered answer is defensible, with explicit editorial status metadata. Examples found during discovery include `She ___ in a bank. (work)` with both `works` and `worked`, and `I read ___ book yesterday.` with both `a` and `the`; no count of all such flaws is claimed. Broader semantic duplicates, shallow rule-recognition, unnatural wording, reading leakage, weak distractors and inappropriate vocabulary remain unreviewed. No real learner-response statistics were queried and no calibrated reliability is claimed.
