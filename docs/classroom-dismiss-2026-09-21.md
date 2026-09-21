# Classroom Escape dismissal — 2026-09-21

Task: `20260921-languago-loop-0956`

## Finding (Medium / functional)

Reproduced locally and in the live public classroom game using Chrome/Puppeteer: select a topic and two teams, acknowledge a double-points card, open a question, press Escape. The modal disappears but the active team stays unchanged. The tile was already marked used by `openTile`; Escape only called `closeModal`, bypassing answer resolution, bonus consumption, turn advancement and the final-tile completion check. Consequently dismissal could retain a bonus and strand the final board without a winner.

The new regression fails before the fix, both locally and live, at `dismissal must advance the turn` (actual Team 2, expected Team 1).

## Small fix

`src/pages/sinif-oyunu.astro`: ignore Escape outside an open modal; resolve dismissed questions using the existing skip path, and advance declined power cards without applying their effect. No new dependency, scoring algorithm, dataset or persistent state. Existing answer resolution consumes the pending bonus and guards repeated answers. Internal `closeModal` behavior is unchanged.

`scripts/smoke-classroom-dismiss.mjs`: real browser coverage at 1440px and 390px for turn advancement, repeated Escape, bonus consumption, dismissal before/after reveal, declined power cards, complete-board winner screen, zero scores and replay.

## Verification

- All three browser smoke scripts (dismiss, restart, level): pass at both widths, zero console/page errors. Existing score, reset, team-name, stale topic selection, explanation and normal full-board completion behavior remains covered.
- `npm test`: 174 passed, 0 failed.
- `npm run typecheck`: exit 0.
- `npm run build`: exit 0; client built, server built and Complete. Full log inspected and no Unexpected / Build failed / error TS / is not defined markers. Existing >500kB vocabulary bundle warning remains.
- Public live `/sinif-oyunu`: HTTP 200 and game launches; reported inability to reach it not reproduced. Live Escape regression does reproduce.
- Local logs: `C:/hermes/workspace/languago-0956-{tests,types,build}.log`.
- Pre-existing timestamp-only changes in `docs/v2/content-audit.json` and `docs/v2/question-registry.json` excluded and left intact. No content-validator rerun or new content-cleanliness claim; previous run's warning debt remains unresolved.

## Scope and boundaries

One bounded functional fix, not an exhaustive site audit. No authenticated learner/teacher navigation, role matrix, service-worker cache lifecycle or comprehensive A1–C2 pedagogical certification. No learner data, credentials, auth, RLS or provider configuration changed. No content edits, new games or catalog status changes. No visual screenshots were captured; evidence is executable browser assertions and terminal results.

Production push/deploy remains held under the operations-hub approval gate, consistent with the previous runs; this document does not claim the live bug is fixed.

Next: keyboard focus containment and return in classroom overlays need a separate accessibility regression; the current div overlay is not a native modal dialog. Suggestions: use a native dialog after checking dismissal semantics, and provide a visible Turkish hint that Escape skips the current card. Reference: https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/dialog
