# Classroom feedback audit — 2026-09-21

Task: `20260921-languago-loop-0840`

## Finding and fix

Medium / pedagogical UX: the classroom reveal displayed the answer but discarded the existing `why` explanation. Reproduced in production: browser regression failed because `#answerExplanation` did not exist. The root cause is the question-modal renderer, not absent bank data.

`src/pages/sinif-oyunu.astro` now renders the correct option's explanation (or a string explanation) inside the initially hidden answer box. Missing explanations get a Turkish invitation to explain the answer together; this is not a fabricated rationale. All rendered content uses the existing HTML escape function. No answers, distractors, IDs, auth, RLS, storage or scoring rules changed.

`scripts/smoke-classroom-level.mjs` verifies the explanation against the served JSON, reveal-only visibility, complete 24-tile games including power tiles, winner screen, replay, reset, score reset, mobile overflow and console errors.

## Evidence

- Production baseline: public classroom entry, keyboard level change, valid/stale topic selection, launch and scoring pass at 1440px and 390px. Reported inability to reach the public game was not reproduced.
- Explanation regression: failed on production before the change, passed locally at both widths after the change.
- Local complete-board/winner/replay/reset assertions pass at both widths; zero browser console/page errors.
- Full Node suite: 174 passed, 0 failed. Typecheck: exit 0.
- Production build: exit 0; both client and server complete. Full log checked; no Unexpected / Build failed / error TS / is not defined markers. Existing >500kB vocabulary chunk warning remains.
- Live HTTP: `/`, `/sinif-oyunu`, `/mascot.png` return 200; unauthenticated `/dashboard/oyunlar` ends at `/signin` with 200. This does not verify authenticated navigation/role gates.
- Content validator: 0 errors, 1,068 warnings; 3,167 active registered questions, 3,177 registry entries and unique IDs, 0 collisions. Existing debt: 73 distribution warnings, 990 missing explanations, 5 repeated-reading-stem warning groups. No dataset edits; generator timestamp-only diffs reverted.
- Evidence logs local: `C:/hermes/workspace/languago-0840-{tests,types,build}.log`.

## Boundaries and next work

Local verified fix only; production deployment held under operations-hub approval gate. No credentials, paid services, production data or learner records touched. Live site still has the old renderer until release.

This bounded run did not certify A1–C2 content, authenticated navigation, back/forward, cached service-worker behavior, audio, or all game mechanics. No game-catalog changes or new game claims.

Next: curated classroom bank parity needs an explicit content contract first: the shared helper rejects fewer than four options, while existing curated sources include three-option MCQs. Blindly switching builders could remove topics. Do not ship that substitution without measured topic/pool coverage.

Suggestions: (1) add a teacher-controlled “explain your choice” discussion step; (2) prioritize a distinct pair information-gap mechanic in the future 30-game roadmap rather than another quiz skin.
