# UI redesign shell notes

## Scope

Shared public shell, mobile navigation, lesson explorer, and sign-in/sign-up presentation only. The homepage page and existing visual tour script were not changed.

## Evidence reviewed

- `C:/hermes/qa/languago-before/tour.json` recorded `overflow: true` at 390px for `/`, `/ogren`, `/signin`, `/materyal-uretici`, and `/sinif-oyunu`.
- The same capture showed concatenated public mobile links on desktop and mobile because `MobilePublicNav` had no desktop visibility rule and its flex scroller had no spacing treatment.
- Before capture showed the sign-in illustration occupying the primary form area and the lesson page rendering cards without explorer controls.

## Changes

- Added a focus-revealed persistent skip link and keyboard-visible controls.
- Made `MobilePublicNav` desktop-hidden and mobile-only; its links are non-wrapping, scrollable within the nav rather than forcing page width.
- Removed the global `body { overflow-x: hidden; }` mask so width regressions remain observable.
- Added restrained lesson explorer controls: native search, button-based level filters with `aria-pressed`, live result count, reset action, and an accessible empty state. Cards link directly from the existing `public-lessons.json` slugs; no lessons were fabricated.
- Replaced auth mascot imagery with a compact brand accent while leaving all inline auth request and placement-draft logic unchanged.
- Added static regression tests in `tests/ui-redesign-shell.test.mjs`.
