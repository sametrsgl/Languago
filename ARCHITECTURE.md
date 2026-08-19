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

- **Views** rendered into `#content` by `render(view)`; bottom tab bar + top back button.
- **Spaced repetition** — each word has a mastery level 0–5; "know" +1, "again" −1
  (min 1); mastered = level ≥ 4. Flashcard queue prioritizes unseen words.
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
