# Placement reading context — 2026-09-18

## Root cause and bounded repair

The placement generator copied reading stems and passage titles but discarded the passage text. The homepage rendered only a stem. The live API returned 10,000 records, 3,555 reading records and no `passages` field before this change. All four new regression tests failed before the fix.

Pool format 2 adds a `passages` dictionary containing each original title/text once, keyed by the existing globally unique passage ID. All 351 entries are copied verbatim from the eleven reading source pools, not authored or regenerated. The existing `${passage.id}-${questionIndex}` source ID resolves each reading task to its original context. Missing/empty text and passage-ID collisions fail generation.

The homepage displays the correct title and paragraph-preserving text before the reading question. It uses text nodes, not HTML interpolation; English text has `lang="en"`. Focus moves to the named reading region on start/next/resume. Grammar questions clear and hide previous passage content. An incomplete pool is rejected before any answer is recorded, with a visible alert and retry action (the previous loading error was inside the hidden test panel). The pool request is versioned to avoid an old browser-cache entry without passages.

No changes to auth, result-save behavior, adaptive thresholds, question IDs, answer order/keys, explanations, dependencies, credentials, paid services or database state.

## Artifact/item audit trail

- Old artifact: `src/data/placement-question-pool.json`, format 1 at `34372a73d7b76d5aaec9735765c0264b906af1d1`.
- New artifact: the same file, format 2 in this release.
- Affected item IDs: exactly the 3,555 existing records whose `source` is `reading` (1,185 source tasks). They retain their existing `id` and `sourceId`; none are renamed, approved or replaced.
- Flaw: missing source context in the delivered placement task. Reason: a reading response without its passage is not valid reading evidence.
- Validation: every affected ID resolves its original source title/text and its original keyed answer in `tests/placement-reading.test.mjs`.
- Source-item old/new versions: no source-item version field exists; item objects are unchanged, not assigned invented review/version metadata. The audited transition is delivery format 1 → 2.

The immutable old artifact and this release's data/tests preserve the per-item mapping without duplicating the entire bank into another registry. Emit the exact affected IDs and their validation status from the versioned artifact:

```sh
node --input-type=module -e "import p from './src/data/placement-question-pool.json' with {type:'json'}; import {getPlacementPassage} from './src/lib/placement-test.mjs'; console.log(JSON.stringify(p.questions.filter(q=>q.source==='reading').map(q=>({id:q.id,sourceId:q.sourceId,oldPoolVersion:1,newPoolVersion:2,flaw:'missing-reading-context',reason:'reading-requires-source-passage',validation:getPlacementPassage(q,p.passages)?'pass':'fail'})),null,2));"
```

## Measured inventory before → after

| Measurement | Before | After |
| --- | ---: | ---: |
| Stored questions / unique IDs | 10,000 / 10,000 | 10,000 / 10,000 |
| Passage-aware distinct tasks / source IDs | 3,167 / 3,167 | 3,167 / 3,167 |
| Option-variant excess records | 6,833 | 6,833 |
| Normalized-prompt excess (includes valid generic stems in different passages) | 6,965 | 6,965 |
| Reading records missing context | 3,555 | 0 |
| Original passages delivered | 0 | 351 |
| Missing explanation text | 4,464 | 4,464 |
| Schema errors / invalid answer indexes / duplicate options | 0 / 0 / 0 | 0 / 0 / 0 |

CEFR stored / distinct: A1 2,313 / 617; A2 1,702 / 555; B1 1,785 / 595; B2 2,130 / 710; C1 1,530 / 510; C2 540 / 180. Answer-index counts (0–3) remain 3,122 / 1,350 / 2,558 / 2,970.

Recorded approved/pending/quarantined/rejected counts remain zero; **all 10,000 review statuses are unknown/unrecorded**, not approved. Added, editorially repaired, approved, quarantined and rejected source items this run: zero. Delivery-context repairs: 3,555 records. The target of 5,000 approved, genuinely distinct questions remains unmet/unverified.

A deep comparison against the old artifact confirms all 10,000 question objects unchanged; only `version`, `generatedAt` and `passages` changed. Serialized JSON grows from 2,943,655 to 3,316,689 bytes; the passage dictionary is 373,022 bytes, avoiding repetition per question/variant.

Classroom catalog unchanged: 3 existing implemented routes, 0 listed placeholders — spelling (A1–B2), vocabulary meaning quiz (A1–C1), team grammar grid (A1–C1). This is route/source inventory, not full teacher-control certification. No homepage “Sınıf İçi Oyunlar” catalog, 30-game coverage or C2 game coverage is claimed.

## Release gates actually executed locally

- New regression suite: 4 failing before, 4 passing after. Focused placement suites: 19 passing.
- Full `npm test`: 88 passing, no failures/skips.
- `npm run typecheck` (`tsc --noEmit`): exit 0. This configured check does not typecheck `.astro` scripts; browser execution and build are separate checks, not a claim of full `astro check` coverage.
- `npm run build`: exit 0. Complete client/server output inspected; no `Unexpected`, `Build failed`, `error TS` or `is not defined`. Existing 1,314.86 kB minified word-data chunk warning remains.
- Content validator before/after: zero blocking errors, 3,167 registry entries and unique IDs, zero collisions. **1,069 warnings remain:** 74 answer-distribution warnings, 990 missing reading explanations, 5 generic reading-stem reuse warnings. Timestamp-only generated audit/registry changes were restored.
- Headless Chrome, 1440px and 390px: 8 reading scenarios pass — real full-pool adaptive path reaching reading, controlled real-record reading/next/resume/grammar transition, multi-paragraph C2 reading, and missing-context alert/retry. No horizontal overflow or console/page errors. Keyboard activation and focus/region/language attributes checked; not a screen-reader device audit.
- Existing no-repeat browser regression: 4 scenarios pass locally, including real full-pool and option-variant fixtures, keyboard and resume.
- Local homepage, pool, mascot and sign-in: HTTP 200. Protected games hub: redirect to sign-in, final HTTP 200.
- No smoke-test result-save calls or learner-data writes. Service worker bypassed for deterministic browser fixtures; offline behavior is not tested.
- Syntax checks, semantic data comparison, new-text brand/privacy scan and `git diff --check` pass.

The final cron report records the actual release commit, Git-connected Vercel status and production smoke results after push; successful local verification alone is not a deployment claim.

## Remaining QA debt / next bounded work

Audit anonymous draft and server answer replay for out-of-range choices, option-variant duplicate evidence and post-completion answers. Establish explicit review/quarantine metadata before growing the genuinely distinct approved bank. Full semantic-duplicate, ambiguity, distractor plausibility, reading leakage, CEFR/register appropriateness and shallow rule-recognition reviews have not been performed. No learner-response statistics or psychometric reliability were measured.
