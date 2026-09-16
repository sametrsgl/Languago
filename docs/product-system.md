# Languago product/design system

## Product promise

Every signed-in screen answers: **Şimdi ne yapmalıyım ve neden?**
Evidence is separated into activity, completion, accuracy, confidence, mastery, and recency. A recommendation is not a mastery claim.

## Information architecture

- Panel: today's next action, reason, honest activity snapshot.
- Öğrenim Yolu: level/unit prerequisites and the next unlocked action.
- Kelime Yolu: diagnostic, contextual learning, retrieval, and review.
- Dilbilgisi / Okuma / Oyunlar: skill practice with local evidence.
- Teacher: classes, students, evidence, assignments, needs attention, materials.
- Parent: linked-child progress only.
- Account/tools: lessons, bookings, notifications, subscription.

Primary navigation stays stable on desktop and becomes a horizontally scrollable, keyboard-accessible mobile navigation at small widths. Do not put account utilities ahead of the next learning action.

## Tokens

- Brand teal: `#0d9488`; deep teal: `#0f766e`; warm action orange: `#f59e0b`.
- Ink: `#17324d`; muted ink: `#5d7185`; line: `#d7e3e8`; surface: `#ffffff`; soft surface: `#f4faf9`.
- Spacing: 4px base; common rhythm 8 / 12 / 16 / 24 / 32 / 48.
- Radius: 12px cards, 999px pills; shadows are subtle and never carry meaning alone.
- Body text is at least 16px; controls have a 44px minimum target.

## Component states

Every data-dependent surface has loading, ready, empty, error/retry, and unavailable states. Empty means no evidence; unavailable means the backing capability is not configured or its migration is not verified. Never render an unavailable durable feature as if it saved successfully.

Buttons disable during writes, announce results through `role=status`/`aria-live`, and recover with a retry that does not duplicate a score or booking.

## Evidence rules

- Unseen is distinct from wrong; a revealed card is not a mastery event.
- Completion means the required activity was finished, not that the skill is mastered.
- Accuracy is correct / attempted for a defined activity.
- Confidence is the diagnostic model's evidence confidence, not learner certainty.
- Mastery requires repeated evidence across time and contexts; avoid CEFR claims from one quiz.
- Recency is shown separately from skill performance.
- Recommendations name the evidence and the action: e.g. “3 kelime zamanı geldi; 5 dakikalık tekrar başlat.”

## Accessibility and responsive behavior

Semantic headings, landmarks, labels, visible `:focus-visible`, keyboard operation, logical focus order, sufficient contrast, no color-only status, and `prefers-reduced-motion: reduce` are required. Test layouts at 320, 375, 768, and desktop widths. Tables must remain readable through responsive overflow or a card alternative. Locked actions explain the prerequisite in text, not only a tooltip.

## Research boundary

This system was informed by a verified sample of official or primary sources: Duolingo's path redesign article, Busuu's official study-plan page, British Council LearnEnglish Teens, Material 3 progress-indicator guidance, Council of Europe CEFR descriptor pages, and official Astro, Supabase, and Vercel documentation. This is not an analysis of 1,000 sites or videos. Search results are not counted as watched videos; no video was claimed as watched in this project.
