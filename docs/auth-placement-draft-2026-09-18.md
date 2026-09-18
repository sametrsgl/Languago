# Optional placement transfer must not block authentication — 2026-09-18

## Scope and root cause

The sign-in and sign-up inline scripts read `localStorage` before their error boundary. A storage getter/read exception therefore reached the authentication catch handler **after a successful auth response**, showed a false failure, and prevented dashboard navigation. A placement-save request with no response kept navigation pending indefinitely. A successful slow save also unconditionally deleted whichever draft was currently in storage, including a newer attempt from another tab. Sign-up without a session attempted the authenticated save endpoint unnecessarily.

This bounded change makes optional draft transfer failure-contained on both pages:

- Guard the storage getter, read, JSON parse, fetch and removal together.
- Skip absent, malformed, empty or non-array draft histories without deleting unknown data.
- Abort only the optional placement-save fetch after 3,000 ms and continue navigation; keep the unsaved draft for retry from the homepage. This is a browser timer, not a background-tab real-time SLA; aborting a request cannot guarantee server rollback.
- Remove a successfully submitted draft only if the currently stored value still matches the submitted snapshot.
- Do not transfer before sign-up has a session; keep the email-confirmation success message and draft intact.

Authentication endpoints, form payloads, server ownership checks, cookie/session handling, OAuth, authorization policies and error messages are unchanged. No credentials, paid services, dependencies, question content, question IDs, registry entries, schema or production learner data were changed. The two existing inline functions remain local: no global helper, module migration or new abstraction was introduced for this small fix.

References: MDN documents `localStorage` `SecurityError` even when accessing the property; `AbortController.abort()` aborts fetch. Astro's official Context7 docs confirm `is:inline` scripts are shipped as written, without TypeScript transformation; these remain plain browser JavaScript.

## Reproduction and verification

- New tests execute the **actual inline form scripts** in Node VM, doubling only DOM/storage/network/timer boundaries. Before the fix: **20 failures, 14 passes**. After: **34/34 pass**.
- Cases: denied storage getter/read/remove, absent/corrupt/null/wrong-shape/empty drafts, HTTP errors, rejected/synchronously thrown fetch, normal transfer, changed draft while a request is pending, timeout/abort/timer cleanup, rejected authentication and sign-up requiring email confirmation.
- Browser regression against the old production page reproduced the first case: blocked draft storage prevented navigation after a successful auth test response (8-second assertion timeout).
- Local Chrome smoke at **1440px and 390px: 22/22 scenarios pass**, no page/console errors or horizontal overflow. Covers keyboard submission, blocked storage, stalled save, success, newer draft, corrupt JSON and email confirmation. Stalled saves continued navigation in **3,041–3,053 ms** in this local run.
- All auth/save requests are explicitly intercepted test doubles, and dashboard navigation is intercepted to assert its destination without creating a session. This verifies real delivered client behavior, **not a real Supabase login, account creation or database save**. Production re-run results are reported after deployment. No test credentials are sent to the real auth endpoints.
- Full `npm test`: **132 passed**, zero failures/skips/cancellations. `npm run typecheck`: exit 0. The configured `tsc --noEmit` is not `astro check`; inline scripts are separately executed by the VM/browser tests.
- `npm run build`: exit 0; server and client complete; full 61-line output inspected. No `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing **1,314.86 kB word-data chunk** warning remains.
- Both new `.mjs` files pass `node --check`; `git diff --check` passes. Changed code reviewed for secrets, unrelated files and accidental auth-policy changes.
- Source content validator before/after: **0 errors**, **3,167 registry entries/unique IDs**, no collisions; **1,069 existing warnings**: 74 answer-distribution, 990 missing reading explanations, 5 generic reading-stem reuse. Only timestamp-only generated report diffs were restored, after checking semantic equality with HEAD.

## Measured unchanged inventories (before → after)

| Placement measurement | Before | After |
| --- | ---: | ---: |
| Stored questions / unique IDs | 10,000 / 10,000 | 10,000 / 10,000 |
| Passage-aware distinct tasks | 3,167 | 3,167 |
| Option-variant excess records | 6,833 | 6,833 |
| Normalized-prompt excess, including valid cross-passage generic stems | 6,965 | 6,965 |
| Invalid answer indexes / duplicate options | 0 / 0 | 0 / 0 |
| Missing explanation text | 4,464 | 4,464 |

CEFR stored / distinct: A1 2,313 / 617; A2 1,702 / 555; B1 1,785 / 595; B2 2,130 / 710; C1 1,530 / 510; C2 540 / 180. Answer-index distribution (0–3): 3,122 / 1,350 / 2,558 / 2,970.

Recorded approved/pending/quarantined/rejected: **0 each**; all **10,000 unrecorded**, not approved. Added/editorially repaired/approved/quarantined/rejected this run: **0 each**. The 5,000-approved-distinct-item target remains unmet/unverified. This is not a semantic or psychometric approval of the bank; ambiguity, weak distractors, unnatural English, shallow rule recognition, reading leakage, semantic duplicates and vocabulary appropriateness still need editorial review. No learner-response statistics or calibrated reliability were measured.

Games: **3 implemented catalog routes, 0 listed placeholders**, unchanged — spelling/productive recall A1–B2, vocabulary meaning quiz A1–C1, team grammar grid A1–C1. Route existence and regression tests do not certify all requested teacher controls. The homepage has no classroom catalog; 30 games and C2 games remain outstanding. The existing team grid is public by current architecture; its access policy was not changed.

Live `/sinif-oyunu` JSON, parsed from the served `cm-topics` script: **97 topics / 97 unique IDs, 2,377 questions**, minimum **20 distinct stems per topic**, zero within-topic duplicate stems or invalid answer indexes. Topics per CEFR: A1 21, A2 20, B1 22, B2 22, C1 12. This verifies pool capacity on the served data, not distractor quality or every game interaction.

## Release and next priority

Commit/push only the two auth pages, regression test, browser smoke script and this note. Use the Git-connected Vercel deployment; verify the exact commit through GitHub deployment status, fetch the changed pages/mascot and re-run the production browser scenarios before reporting success.

Next high-value bounded task: establish explicit editorial review/quarantine metadata and review a small contextual-question batch. Do not count rotated options or unreviewed records as approved questions. No credential-gated or paid work is needed for that next step.
