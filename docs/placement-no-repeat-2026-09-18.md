# Placement option-variant repeat guard — 2026-09-18

## Bounded change

The selector previously excluded only answered IDs. The checked-in/live bank rotates options into new IDs, so an answered stem could be selected again as apparently new evidence. A fixture containing actual records `placement-00001` and `placement-03168` reproduced this before editing. The deployed old client also failed the browser regression with `real-variant-subset: repeated stem after answering placement-00001`.

The selector now resolves answered IDs against the current pool and excludes previously answered content identities. It folds case/whitespace only, preserving apostrophes and punctuation. Reading identity includes the source passage ID (the existing source-ID convention minus its question-index suffix), with passage title as fallback. Generic reading stems in different passages remain distinct. Exhaustion returns `null`, never a reseeded repeat. Ranking, adaptive thresholds, persisted state, deterministic IDs, auth and source content are unchanged.

Files: `src/lib/placement-test.mjs`, `tests/placement-no-repeat.test.mjs`, `scripts/smoke-placement-no-repeat.mjs`, this note.

## Inventory before → after (no dataset edits)

| Measurement | Before | After |
| --- | ---: | ---: |
| Stored placement questions / unique IDs | 10,000 / 10,000 | 10,000 / 10,000 |
| Unique source IDs / passage-aware content identities | 3,167 / 3,167 | 3,167 / 3,167 |
| Unique normalized prompt strings, ignoring passage | 3,035 | 3,035 |
| Excess records over passage-aware identities (option variants) | 6,833 | 6,833 |
| Excess records over normalized strings (includes legitimate passage reuse) | 6,965 | 6,965 |
| Placement entries missing explanation text | 4,464 | 4,464 |
| Placement reading records lacking passage text | 3,555 | 3,555 |
| Schema errors / invalid answer indexes / duplicate-option items | 0 / 0 / 0 | 0 / 0 / 0 |

CEFR stored / passage-aware unique counts: A1 2,313 / 617; A2 1,702 / 555; B1 1,785 / 595; B2 2,130 / 710; C1 1,530 / 510; C2 540 / 180. Answer-index counts (0–3): 3,122 / 1,350 / 2,558 / 2,970. These counts are descriptive, not psychometric calibration.

All 10,000 records lack review-status metadata. Recorded approved, pending, quarantined and rejected counts are therefore all zero; 10,000 have **unknown/unrecorded** status, not approved status. This run added, repaired, quarantined and rejected zero source questions. No item-version transition occurred. The target of 5,000 approved, genuinely distinct questions is NOT verified/met by this inventory. Different wording with the same semantic task, ambiguity, distractor plausibility, reading leakage, register/CEFR suitability and shallow rule-recognition have not received a full item-level audit. No learner response statistics were queried; no reliability claim is made.

## Classroom inventory (unchanged)

The existing dashboard lists three implemented routes, no placeholder entries: spelling (`/dashboard/oyunlar/yazim`, advertised A1–B2), vocabulary quiz (`/dashboard/oyunlar/quiz`, A1–C1), and team grammar grid (`/sinif-oyunu`, A1–C1). This is source/route inventory, not a claim of 30 complete classroom games or full teacher-control coverage. The redesigned homepage currently has no “Sınıf İçi Oyunlar” catalog. C2 game coverage and the 30-game requirement remain open.

## Verification before release

- New regression suite: before fix 5 failing / 3 passing; after fix 8 passing.
- Focused placement suites: 15 passing.
- Full `npm test`: 84 passing, 0 failures/skips.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; inspected the entire log, both client and server complete. No `Unexpected`, `Build failed`, `error TS`, or `is not defined` errors. Existing oversized word-data chunk warning remains (1,314.86 kB minified, 433.18 kB gzip).
- `node scripts/validate-content.mjs` before and after: 0 blocking errors; 3,167 registry entries/unique IDs, no collisions; 1,069 existing warnings (74 answer-distribution, 990 missing reading explanations, 5 generic reading-stem reuse warnings). The general validator covers the source grammar/reading/vocabulary registry; separate checks above inspected the generated placement pool. Timestamp-only generated-report edits were reverted.
- Headless Chrome at 1440px and 390px: real full-pool start/answer/next/resume and controlled real-record variant fixture pass locally; no horizontal overflow or console/page errors. Keyboard Enter activates start, answer, next and resume. The fixture uses only records fetched from the target API, explicitly intercepts that response, and does not write production learner data. Service worker is bypassed for this deterministic test, so this is not an offline/PWA test.
- Syntax checks and `git diff --check` pass. No dependencies, credentials, services, auth, migrations or question data changed.

Release requires the Git-connected deployment and the same browser smoke test against production, plus route and asset checks. Final cron report records the actual commit and deployment outcome, not an assumption based on a successful push.

## Next highest-value work

Restore reading passage context end-to-end before treating placement reading tasks as valid: the generator exports `passageTitle` and question stems but omits passage text, while the homepage renders only the stem. All 3,555 reading records (1,185 original tasks) need that source context. Then establish explicit review/quarantine status and replace option-rotation inflation with genuinely distinct reviewed content. Also investigate draft replay validation and the hidden placement-pool loading-error message in a later bounded run.
