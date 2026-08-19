# Decisions

## 1. App shell — WebView wrapper (in-house) vs native Android

**Decision:** wrap a static HTML/JS/CSS app in an `android.webkit.WebView` (no androidx,
no third-party libs).

**Why:** the product is a vocabulary coach — list/detail/flashcard/quiz UI with rich
interaction. A WebView ships that in one lightweight APK with zero dependencies, and the
existing `android-apk-build` toolchain (JDK 17 + SDK 34 + Gradle 8.7, already installed)
builds it without Android Studio or admin rights. Native (RecyclerView + Room) would need
AndroidX, more build surface and more time for no UX gain at this scale.

## 2. Word-list sources

| Set | Source | License / basis |
|-----|--------|-----------------|
| A1–C1 | Oxford 3000/5000 word lists (via `winterdl/oxford-5000-vocabulary-audio-definition`) | Oxford's publicly published free word lists; definitions/examples republished for personal/educational use |
| C2 | Octanove Vocabulary Profile C1/C2 (`openlanguageprofiles/olp-en-cefrj`) | CC BY-SA 4.0 |
| IELTS | Academic Word List (Averil Coxhead, 570 headwords) | `lpmi-13/machine_readable_wordlists` |
| TOEFL / YDS / YÖKDİL / GRE | Composed from AWL + Oxford C1 + Octanove C1/C2 (see `ARCHITECTURE.md`) | as above |

**Enrichment:** words missing definitions (C2 + ~59 AWL headwords) are filled from the
Free Dictionary API (Wiktionary, CC BY-SA), cached to `data/dict_cache.json`.

**Why not rebuild the lists in-house:** the Oxford 3000/5000 and AWL are the canonical,
research-backed lists for exactly this purpose; re-curating frequency-graded vocabulary
from scratch would be strictly worse and slower. Repos above were chosen for being
machine-readable JSON/CSV with CEFR + definition fields.

## 3. Turkish UI + Turkish translations

The brand is Turkish-first, so all chrome/labels are Turkish. Word **translations are in
Turkish** (added alongside the English definition): sourced from the free
`firatkaya1/dictionary` EN→TR dataset (~1.46M entries), prioritizing its "Common Usage"
category and matching by part of speech; a small hand-curated fallback covers the last
few words absent from that dictionary (100% coverage). English definitions stay because
they mirror how IELTS/TOEFL/GRE actually test vocabulary.

## 4. JavaScript bridge

`MainActivity` exposes a minimal `AndroidBridge` (`speak`, `exit`). This is safe here
because the WebView loads **only local `file:///android_asset` content** — no remote URLs,
no user-supplied pages — so it is not an XSS surface. The lint flag is suppressed with a
justifying comment.

## 5. Offline-first, no permissions

No `INTERNET` permission is declared. The app is fully offline; the only network use is the
one-time *build-time* data fetch. No ads, no analytics, no tracking.
