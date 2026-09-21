# Classroom level-selection integrity — 2026-09-21

## Scope and reproduction

A C1 topic selected under Yetişkin remained startable after switching to İlkokul (A1/A2). The topic grid dropped the selected card, but `state.topicId` and the enabled start button survived. The browser regression failed before the fix with `hidden stale topic must not remain startable`.

- Clear the selected topic only when it is outside the visible level group; disable start and request a new topic.
- Keep a selection that is still valid.
- Check the level/topic invariant inside `startGame`, before resetting any game state, including when a synthetic click bypasses the disabled button.
- Mobile smoke testing also exposed a 394px-wide board at a 390px viewport: desktop negative margins (-16px) exceeded mobile container padding (12px). Match board margins to the mobile padding; do not hide overflow.
- No content, auth, scoring, database, or provider changes.

## Verification

`node scripts/smoke-classroom-level.mjs` reproduces the real UI interaction in headless Chrome at 1440px and 390px: valid selection preservation, keyboard level switch, stale selection rejection, synthetic-click guard, new valid topic, 24 tiles, correct topic modal, reveal/score/advance, no horizontal overflow, no console/page errors.

`CLASSROOM_SMOKE_BASE=https://www.languago.site node scripts/smoke-classroom-level.mjs` runs the same assertions against production, without login or persistent writes.

Focused game tests: 6 passed. Full Node suite: 168 passed. Typecheck and production build passed. Build retains the existing large vocabulary chunk warning. No hidden client build error markers were found.

## Measured baseline (unchanged by this release)

Placement data: 10,000 rows / 10,000 unique IDs / 3,167 content keys / 3,040 normalized prompt strings. Prompt equality across reading passages is not by itself a semantic duplicate. Rows include option-order variants; 10,000 rows must not be advertised as 10,000 distinct approved questions.

CEFR row distribution: A1 2,313; A2 1,702; B1 1,785; B2 2,130; C1 1,530; C2 540. Answer-index distribution (0–3): 3,122 / 1,347 / 2,561 / 2,970. Invalid answer indexes: 0. Empty explanations: 4,464 rows. Review-status metadata absent on all 10,000 rows; approved/pending/quarantined/rejected statuses are not established. Added/repaired/quarantined/rejected this run: 0 each. The 5,000 approved-question target is not verified.

Content validator: 0 errors, 1,068 warnings (73 answer-distribution imbalances, 990 missing explanations, 5 repeated-reading-stem warning groups). Active registered questions: 3,167; registry entries and unique IDs: 3,177 each; collisions: 0. The registry retains historical entries; do not confuse its total with the current active-question count.

Live classroom bank: 97 unique topic IDs; A1 21 / A2 20 / B1 22 / B2 22 / C1 12 topics. Every topic has at least 20 distinct normalized stems, no within-topic repeats, and valid answer indexes. These are topics within ONE game, not 97 different games.

The inspected game hub lists 3 implemented routes (spelling/productive recall, vocabulary MCQ, classroom team grid), not a 30-game catalog. Only the classroom flow was browser-tested in this run; other routes were not authenticated. No placeholder cards occur in that hub. The homepage has no dedicated Sınıf İçi Oyunlar catalog. These product targets remain open.

No new semantic/pedagogical review or learner-response analysis was performed; ambiguity, weak distractors, unnatural English, reading leakage and psychometric quality remain unmeasured here. Next high-value work: classroom curated-bank parity (the page currently also converts practice items, unlike the curated-only helper) and a versioned approval audit before expanding the placement pool.
