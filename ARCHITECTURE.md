# Architecture

## Overview

```
english-word-coach/
├── README.md / DECISIONS.md / ARCHITECTURE.md
├── data/                       # (git-ignored) raw sources + cache + final words.json
├── scripts/
│   ├── build_data.py           # fetch → merge → enrich → data/final/words.json
│   ├── make_words_js.py        # words.json → android/.../assets/words.js
│   ├── make_icon.py            # launcher icons
│   └── build_apk.sh            # package data + gradle assembleRelease + verify
└── android/                    # Gradle project (AGP 8.5.2, compileSdk 34, minSdk 24)
    └── app/src/main/
        ├── AndroidManifest.xml
        ├── java/com/kingfish/wordcoach/MainActivity.java   # WebView host + TTS + bridge
        ├── res/mipmap-*/ic_launcher.png
        └── assets/             # the actual app (bundled, offline)
            ├── index.html
            ├── style.css
            ├── app.js          # SPA logic
            └── words.js        # window.WORD_DATA = {meta, words, sets}
```

## Data model (`words.js`)

```js
window.WORD_DATA = {
  meta: { app, version, sources, note },
  words: { "<key>": { w, p, d, e, i } },   // word, POS, definition, example, IPA
  sets:  { "a1": [ "<key>", ... ], ... }    // set -> ordered word keys
};
```

Words are stored **once** (deduped by lowercase key) and referenced by key from each set,
so exam sets that share vocabulary (IELTS ⊂ TOEFL ⊂ YDS, etc.) cost almost no extra space.

### Set composition

| Set | Composition |
|-----|-------------|
| a1–c1 | Oxford 3000/5000 by CEFR level |
| c2 | Octanove C2 words |
| ielts | AWL 570 headwords |
| toefl | AWL + Oxford C1 (academic + advanced general) |
| yokdil | AWL + Oxford C1 + C2 (academic reading) |
| yds | Oxford B2 + C1 + C2 + AWL (broad advanced) |
| gre | Octanove C2 + AWL sublists 9–10 (hardest) |

## Client architecture (`app.js`)

Single-page app, no framework. State: `progress` (localStorage), `currentView`,
`currentSet`, `currentSetMode` (`cards|quiz|list`), `session` (flashcard queue),
`quiz` (question list).

- **Views** rendered into `#content` by `render(view)`; bottom tab bar (Ana Sayfa / Kelimeler / Tekrar / Ara / İlerleme) + top back button.
- **Spaced repetition (Leitner)** — each studied word has `{ box: 1..6, due: "YYYY-MM-DD", reps }`;
  intervals are `[1,2,4,7,15,30]` days. "know" advances a box and schedules the next review;
  "again" resets to box 1 due today. Words with `due <= today` form the review queue
  (per-set via the "Kartlar" tab, or globally via the "Tekrar" tab).
- **Persistence** — `AndroidBridge.saveProgress/loadProgress` mirror progress into
  Android `SharedPreferences` (reliable on `file://` origins where localStorage may not
  persist); localStorage is kept as a fallback. Migration converts the old `levels`
  map into `srs` on first run.
- **Quiz** — distractors drawn from the same set (fallback: whole vocab), 4 options,
  both directions (word→meaning, meaning→word).
- **Streak** — `lastStudy` date compared against yesterday/today.
- **Native bridge** — `AndroidBridge.speak(word)` (TTS) and `AndroidBridge.exit()`;
  hardware back is routed to the SPA via `window.__handleBack()`.

## Build pipeline

1. `build_data.py` — downloads Oxford 3000/5000, Octanove C1/C2, AWL; merges into the
   master word dict; enriches missing definitions from the Free Dictionary API (cached,
   resumable); writes `data/final/words.json`.
2. `make_words_js.py` — wraps the JSON as `window.WORD_DATA = {...}` in `assets/words.js`.
3. `build_apk.sh` — runs the above, then `gradle assembleRelease`, then verifies the
   signature and prints the APK path.

## Testing

`.test/smoke.js` boots the SPA headlessly with jsdom and exercises the full user flow
(boot → sets → flashcards → quiz → list → modal → search → stats → back navigation),
asserting on rendered DOM and collecting any runtime errors. Run it with:

```bash
cd .test && npm install && node smoke.js   # expect "31 passed, 0 failed"
```

Note: the harness renames the `$`/`$$` helpers to `_q`/`_qq` because jsdom mishandles
those identifiers (verified in native V8 that the identifiers are distinct and correct).
