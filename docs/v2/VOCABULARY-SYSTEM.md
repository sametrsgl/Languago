# Vocabulary Path: Research and Design

## Decision

The old vocabulary page exposed the entire catalogue. That is convenient for browsing but weak for learning: it encourages recognition-only scanning, gives no reliable level signal, and provides no reason to retrieve a word again later. `/dashboard/kelimeler` is now a gated route:

1. Authenticated student completes an 80-item diagnostic.
2. The server scores evidence by CEFR band and stores the result.
3. The server returns one limited, level-appropriate 10-step path.
4. Only the current step is unlocked; completion is persisted in `student_progress`.

The browser never receives the complete word catalogue or all level lists.

## Pedagogical basis

- **Retrieval practice:** asking the learner to recall a meaning or word is stronger than repeatedly re-showing a flash card. Every path step after preview requires a decision, recall, or constrained production.
- **Spacing:** the same path words recur across ten distinct activities instead of appearing once in a list. The persisted step/mastery state is the hook for future scheduled reviews.
- **Contextual learning:** examples are presented in short readings, cloze sentences, dialogues, and missions. The goal is usable meaning, not isolated translation.
- **Four strands:** the path balances meaning-focused input (preview/reading), meaning-focused output (recall/mission), language-focused learning (matching/meaning/cloze/collocation), and fluency/automaticity (short repeated choices).
- **Real-life transfer:** scenarios use practical situations such as appointments, travel, shopping, workplace communication, and problem solving. A mission step asks the student to produce a short message or sentence.
- **CEFR evidence:** the diagnostic samples A1–C2 in a fixed easy-to-difficult progression and reports per-band accuracy. The level is the highest band meeting the threshold, not the result of one lucky item.

## Current implementation

- `src/lib/vocab-path.mjs`: deterministic diagnostic generation, scoring, and path construction.
- `src/pages/api/vocab/diagnostic.ts`: authenticated, server-side scoring and profile/progress persistence.
- `src/pages/api/vocab/path.ts`: authenticated limited-path delivery.
- `src/pages/dashboard/kelimeler.astro`: diagnostic and ten-step learner UI.
- `src/pages/dashboard/progress.ts`: allows the `vocab-path` module.
- `tests/vocab-path.test.mjs`: count, ordering, score, and ten-step invariants.

The diagnostic currently contains 80 questions distributed as A1 16, A2 16, B1 14, B2 14, C1 10, and C2 10. A path contains at most 100 selected words and ten activity types: preview, matching, meaning, cloze, collocation, dialogue, sorting, recall, reading, and mission.

## Important next iteration

The current route is a sound vertical slice, not the final spaced-repetition engine. The next upgrade should add per-word review scheduling (for example: next review, interval, ease, lapses) and make the 10-step path select words based on diagnostic uncertainty, prior errors, and scheduled reviews. Human review is also needed for any source record with a weak or missing example; the system must not invent a precise sense from an incomplete record.

## Sources

- Council of Europe, CEFR level descriptions: https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions
- Paul Nation, *The Four Strands*: https://www.wgtn.ac.nz/lals/resources/paul-nations-resources/paul-nations-publications/publications/documents/2007-Four-strands.pdf
- British Council, vocabulary recycling games: https://www.britishcouncil.org/voices-magazine/three-games-recycle-vocabulary-english-language-classroom
- Cambridge English, teacher resources and assessment principles: https://www.cambridgeenglish.org/teaching-english/resources-for-teachers/

These principles justify the product decisions; they do not claim that a single 80-item screen can diagnose every aspect of lexical knowledge. The confidence field should be interpreted as placement confidence, not a complete language assessment.
