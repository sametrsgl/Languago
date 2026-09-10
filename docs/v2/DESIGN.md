---
version: alpha
name: Languago V2
description: Clear Turkish-first learning navigation for students and teacher tools.
colors:
  primary: "#0d9488"
  primary-dark: "#0f766e"
  accent: "#f59e0b"
  accent-text: "#111827"
  ink: "#111827"
  ink-soft: "#4b5563"
  surface: "#ffffff"
  surface-soft: "#f6f8fb"
  line: "#e5e7eb"
typography:
  h1:
    fontFamily: system-ui
    fontSize: 3.5rem
    fontWeight: 850
    lineHeight: 1.02
    letterSpacing: "-0.04em"
  h2:
    fontFamily: system-ui
    fontSize: 2rem
    fontWeight: 800
    lineHeight: 1.15
  body-md:
    fontFamily: system-ui
    fontSize: 1rem
    fontWeight: 400
    lineHeight: 1.65
rounded:
  md: 14px
  lg: 22px
  xl: 30px
spacing:
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.accent-text}"
    rounded: "999px"
    padding: 12px
  card-learning:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: 24px
---

## Overview

Languago V2 is a visible, coherent product layout for Turkish English learners. The homepage sells one primary student action first, then separates teacher tools. The signed-in dashboard uses a recommended path, not a mastery score, because existing progress data is partial and module-specific.

## Colors

- **Teal #0d9488:** primary navigation, links, progress, and calm learning surfaces.
- **Orange #f59e0b:** high-emphasis actions only. Use dark text on orange for contrast.
- **Ink #111827:** default text, including text on amber/orange CTAs.
- **Soft surfaces:** use #f6f8fb and teal/amber tints for cards, guide blocks, and empty states.

## Typography

Use the system font stack for fast Turkish rendering. Headlines are short, heavy, and high contrast. Body copy should state what exists now: A1-C1 grammar, C2/exam reading, games with distinct objectives, and teacher material tooling.

## Layout

- Public pages keep one `<main id="main-content">` landmark in `Layout.astro`.
- App pages provide their own `<main>` landmarks; `AppLayout.astro` must not nest another main around the slot.
- Mobile navigation remains available as horizontal scroll tabs; links are never hidden without a replacement.
- Spacing uses 8/16/24/40px rhythm with large rounded cards and visible section grouping.

## Elevation & Depth

Cards use a soft teal shadow and a 1px border. Hover lift must be subtle and disabled for reduced-motion users. Focus rings are more important than hover treatments.

## Shapes

Primary cards use 22-30px radii. Pills and CTAs use full radius. Learning path badges are circular and numbered/check-marked, but labels must say recommended/touched, not mastered.

## Components

- `MobilePublicNav.astro`: public horizontal mobile navigation.
- `MobileAppNav.astro`: app learning-area navigation with `aria-current`.
- `LearningPath.astro`: recommended path component; does not claim mastery.
- `LearningGuideCard.astro`: reusable guide/empty-state panel with links.

## Do's and Don'ts

- Do say **A1-C1 grammar** and **C2/exam reading**.
- Do keep student and teacher tracks visually distinct.
- Do show valid vocabulary activity from distinct known word keys.
- Do keep skip links, visible keyboard focus, and reduced-motion behavior.
- Don't show placeholder social links.
- Don't say every game is vocabulary-only.
- Don't promise unfinished student material-maker features.
- Don't infer mastery from the current `/dashboard/yol` data.
