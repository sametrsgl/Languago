# Classroom round-state audit — 2026-09-21

Task: `20260921-languago-loop-0918`

## Reproduced findings

- **Medium / scoring integrity:** acknowledge an İki Katı Puan card, quit to the lobby, start again, open a question. The new game inherits the old double-points bonus. Deterministic Puppeteer reproduction failed locally before the fix and on production with `actual: '2× +10 puan'`. Root cause: `startGame` reset scores and questions but not `powerDouble`.
- **Low / classroom UX:** name a team, start, score, reset. The board reverted to `Takım 1` while the lobby input retained the configured name. Browser reproduction failed before the second fix. Root cause: reset handler erased team configuration before calling the shared initializer.

## Changes

- `src/pages/sinif-oyunu.astro`: reset the bonus in the shared new-round initializer; remove redundant reset-handler state clearing so team names persist.
- `scripts/smoke-classroom-restart.mjs`: deterministic browser regression for bonus isolation, scoring, team-name retention, fresh 24-tile board, zeroed score and console errors at 1440px/390px. Math.random is stubbed only inside the isolated test browser, never production code.

No question content, answer key, distractor, identity, authentication, RLS, storage, dependency or analytics changes. This improves fair scoring and repeat classroom use, not CEFR alignment.

## Verification

- New restart regression: both widths pass, zero page/console errors.
- Existing `smoke-classroom-level.mjs`: both widths pass; level selection, launch, reveal explanation, scoring, full board/power tiles, completion, replay, reset and no horizontal overflow.
- Full Node suite: 174 passed, zero failures. Typecheck exit 0.
- Production build exit 0, client/server completion verified; complete log scanned for Unexpected / Build failed / error TS / is not defined: none. Existing oversized vocabulary chunk warning remains.
- Content validator: zero errors, 1,068 warnings; 3,167 active registered questions; 3,177 registry entries and unique IDs, zero collisions. Existing pedagogical debt remains; no semantic content audit claimed.
- Live HTTP: `/`, `/sinif-oyunu`, `/mascot.png` 200; unauthenticated `/dashboard/oyunlar` ends at `/signin` 200. Live restart regression still fails as expected: local fix not deployed.
- Local evidence: `C:/hermes/workspace/languago-0918-{tests,types,build,content}.log`.
- Pre-existing generated content-report/registry working-tree changes left unstaged; validator also refreshes their metadata.

## Boundaries / next action

Deployment held under operations-hub approval boundary; do not interpret healthy live routes as proof of this fix being live. Authenticated dashboard navigation, roles, back/forward, refresh persistence, offline/stale service workers, audio and A1–C2 semantic coverage were not certified. No paid or credential operations, production data, private learner records or secrets accessed.

Game catalog unchanged and not counted in this run; 30-game roadmap remains outstanding. No new game or whole-game QA certification claimed.

Next bounded test: Escape currently hides a question modal after the tile is marked used; verify last-tile completion and keyboard focus before changing cancellation semantics.

Suggestions: offer an explicit teacher-controlled skip/cancel policy; make classroom reset semantics clear (retain teams/topic, clear round scores and bonuses). Continue the curated-bank content contract review before swapping builders.
