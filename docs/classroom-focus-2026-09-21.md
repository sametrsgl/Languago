# Classroom keyboard and mobile dialog audit — 2026-09-21

Task: `20260921-languago-loop-focus`.

## Scope and ranked findings

1. **Medium / Accessibility — confirmed:** opening a classroom tile by keyboard left focus outside the overlay. Reproduced before editing with `node scripts/smoke-classroom-focus.mjs`: `opening a tile must move keyboard focus into its dialog`, actual false. The overlay was a plain div without modality or focus management; board re-render also removed the original trigger.
2. **Mobile resilience:** the card had no height bound or internal overflow. Added a viewport-bound scroll container and verified long feedback with synthetic DOM-only text (not persisted content).
3. **Test correctness:** the existing level smoke test randomly selected an item without `why` and failed its assumption that every sample had an explanation. Match the existing explicit discussion fallback as well as actual explanations; missing content remains QA debt, not silently invented feedback.

## Changes

- `src/pages/sinif-oyunu.astro`: labeled native dialog, browser-managed modality, grading focus after reveal, next playable tile/replay focus after resolution, long-card scrolling. Scoring, question data, existing Escape semantics and branding unchanged.
- `scripts/smoke-classroom-focus.mjs`: actual Chrome desktop/mobile keyboard regression and optional screenshots.
- `scripts/smoke-classroom-level.mjs`: account for documented missing-explanation fallback.
- `docs/classroom-games-roadmap.md`: 30 distinct mechanics, explicit implementation status and all requested pedagogy/control/accessibility fields. Only G01 has scoped QA evidence; 29 are ideas, not shipped games.
- `DECISIONS.md`: official MDN reference and dependency-free implementation choice.

## Local verification

- Full Node suite: 174 passed, 0 failed.
- Typecheck: passed.
- Build: client and server passed; complete log checked, no `Unexpected`, `Build failed`, `error TS`, or `is not defined`. Existing >500 kB vocabulary bundle warning remains.
- Content: 0 errors, 1,068 warnings: 73 answer-distribution, 990 missing explanations, 5 cross-passage structural near-duplicate warnings. 3,167 active questions = 3,167 unique active IDs. Historical registry: 3,177 entries/unique IDs, no collisions. No source content changes.
- Chrome at 1440×950 and 390×650: native modal/focus, feedback scrolling, keyboard completion, replay focus; zero console errors.
- Existing dismiss, restart and level-selection smoke tests passed at 1440 and 390 pixels. These include scoring, power cards, board completion, reset and replay.
- Roadmap parsed: exactly 30 mechanics.
- Git diff review: only intended application/test/docs files staged; pre-existing generated audit/registry JSON diffs excluded.

## Security and limitations

No auth, credentials, RLS, schema, production data, dependencies or learner records changed. Existing text escaping retained; native modality prevents background document interaction. Screenshots use only public questions and default teams. No logged-in browser, assistive-technology user testing, Safari/iOS, real learner data or complete pedagogical audit. Puppeteer + installed Chrome used because dedicated browser tools are not exposed.

Screenshots, release commit and post-deploy verification are recorded in the private operations task:
`https://github.com/sametrsgl/samet-agent-operations/tree/main/tasks/20260921-languago-loop-focus`

Next: A2 pair information-gap prototype (G02), following content ambiguity/empty-state checks; separately pay down missing-explanation debt.
