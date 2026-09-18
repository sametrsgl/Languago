# Placement draft and save replay — 2026-09-18

## Primary improvement and root cause

Browser resume and the save API previously had separate replay loops. Browser resume dereferenced null rows, accepted out-of-range integers as wrong answers, and counted option-order variants and post-completion answers. The API checked answer bounds but appended duplicate IDs to its saved `answers` even when the engine rejected them; variant IDs were new evidence, and one answer could overwrite a profile level.

`replayPlacementAnswers` now rebuilds a fresh state from the actual pool for both callers. It validates row shape, ID, CEFR and option range; reuses the existing passage-aware normalized identity; retains the first valid response per task; recomputes correctness and metadata; and stops at the engine's actual completion boundary. Processing retains the API's existing 40-input-row cap. Invalid rows are not scored as wrong answers. Browser resume replaces its local draft with the sanitized history.

The API persists only `state.questions`, derives the count from that same state and rejects incomplete evidence with HTTP 400 before either database write. Auth still uses `getUser`, writes still bind to the authenticated user, and the body-size check is unchanged.

No question edits, IDs, answer keys, adaptive thresholds, result precision, database schemas, auth policy, paid services, credentials or dependencies changed. This is consistent replay, not anti-cheat protection or psychometric calibration; it does not authenticate historical question order or privately hide public answer keys.

## Reproduction and tests

- Before implementation, the new route test reproduced an incomplete history returning 200 instead of 400; another reproduced duplicate/variant/post-completion records in the saved payload. The first eight tests had seven failures (five were the not-yet-implemented shared helper) and one pass.
- Before deployment, the new browser script against the old production homepage timed out on the malformed-row resume case: no enabled answer buttons became available.
- After repair: **10 new regression tests**, **29 focused placement tests**, **98 full-suite tests** pass; no failures or skipped tests.
- Route tests compile and execute the real TypeScript endpoint with esbuild. Only the Supabase boundary is replaced with an explicit test double; progress payloads, profile ownership and absence of writes on rejected requests are asserted. No production learner writes occur.
- New browser smoke: **10 scenarios**, covering malformed rows, out-of-range choices, duplicate IDs/variants, post-completion answers and corrupt JSON at 1440px/390px. Checks include actual served pool data, sanitized local storage, keyboard resume/start, question focus, displayed counts, console/page errors and horizontal overflow.
- Completion smoke intercepts the save request and uses an explicit success test double to inspect the outgoing canonical history. It is not a claim of a live authenticated database save. All other requests use the real served site/pool.
- Existing reading smoke: **8 scenarios** pass; existing no-repeat smoke: **4 scenarios** pass. Service worker bypassed for deterministic fixtures; offline behavior and physical screen-reader use not tested.
- `npm run typecheck` (`tsc --noEmit`) exits 0. This configured check does not cover `.astro` scripts as `astro check` would; build and browser execution are separate checks.
- `npm run build` exits 0, both client and server complete. Full output inspected: no `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing 1,314.86 kB word-data chunk warning remains.
- Content validator before/after: 0 errors, 3,167 registry entries/unique IDs, 0 collisions. **1,069 warnings:** 74 answer-distribution warnings, 990 missing reading explanations, 5 generic reading-stem reuse warnings. Timestamp-only generated audit/registry changes excluded from the commit.
- Syntax checks and `git diff --check` pass. Final diff reviewed for unintended data/auth/credential changes.

## Measured inventory (before → after, unchanged)

| Measurement | Before | After |
| --- | ---: | ---: |
| Stored questions / unique IDs | 10,000 / 10,000 | 10,000 / 10,000 |
| Passage-aware distinct tasks / source IDs | 3,167 / 3,167 | 3,167 / 3,167 |
| Option-variant excess records | 6,833 | 6,833 |
| Normalized-prompt excess (includes valid generic stems in different passages) | 6,965 | 6,965 |
| Invalid answer indexes / duplicate options | 0 / 0 | 0 / 0 |
| Missing explanation text | 4,464 | 4,464 |

CEFR stored / distinct: A1 2,313 / 617; A2 1,702 / 555; B1 1,785 / 595; B2 2,130 / 710; C1 1,530 / 510; C2 540 / 180. Answer-index distribution (0–3): 3,122 / 1,350 / 2,558 / 2,970.

Recorded approved/pending/quarantined/rejected counts are all zero; review status is **unrecorded for all 10,000 records**, not approved. Added, editorially repaired, approved, quarantined and rejected questions this run: zero. The 5,000-approved-distinct-question target is still unmet/unverified.

Games: 3 implemented catalog routes, 0 listed placeholders; spelling/productive recall A1–B2, vocabulary meaning quiz A1–C1, team grammar grid A1–C1. Route existence and the existing game regression suite were checked, not a fresh full teacher-control audit. No homepage “Sınıf İçi Oyunlar” section, 30-game catalog or C2 game coverage is claimed.

## Release and remaining debt

The final cron report records the real commit, Git-connected Vercel status, live health checks and production browser results after push. Vercel CLI is logged out; do not add credentials or bypass the normal Git deployment. GitHub's deployment status and actual public route behavior provide release evidence.

Next high-value bounded work: establish explicit review/quarantine metadata and audit a small contextual-question batch. The bank currently lacks recorded editorial approval, has option-order padding and many missing explanations. Full semantic-duplicate, ambiguity, weak-distractor, shallow-rule-recognition, unnatural-English, reading-leakage and inappropriate-vocabulary audits remain pending; no fabricated zero counts are assigned to them. No real learner-response statistics or psychometric reliability were measured.
