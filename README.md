# English Word Coach (Android APK)

Offline English vocabulary coach for Android — a self-contained, dependency-free
`WebView` app that ships word sets from **CEFR A1–C2** plus exam-prep sets for
**IELTS, TOEFL, YDS, YÖKDİL and GRE**.

Built for Kingfish (Turkish-first brand): the UI is Turkish, definitions are in
English (Oxford/Wiktionary-sourced) with example sentences, IPA phonetics and
native text-to-speech pronunciation.

## Features

- **11 word sets** — A1–C2 (CEFR) + IELTS, TOEFL, YDS, YÖKDİL, GRE (~6,000 unique words)
- **Spaced repetition (SRS)** — Leitner-style boxes (1–6) with growing intervals (1→30 days);
  every "know / again" answer schedules the next review date and progress persists
  across app restarts (SharedPreferences-backed)
- **"Tekrar" (review) tab** — see every learned word + its next review date, and a one-tap
  global review of everything due today
- **Flashcards** — tap to flip, "know / again" SRS grading
- **Quizzes** — multiple-choice, 10/20/30 questions, word→meaning or meaning→word
- **Word list** — searchable per-set list, tap any word for a detail card
- **Word of the day**, daily streak, per-set and global progress, quiz accuracy stats
- **Pronunciation** — IPA shown + tap-to-hear (Android TTS, en-US)
- **100% offline** — all data bundled; no network permission, no ads, no tracking

## Quickstart

```bash
# 1. fetch word-list sources + build dataset (needs network once)
python scripts/build_data.py

# 2. package data + build the signed APK
bash scripts/build_apk.sh
```

APK output: `android/app/build/outputs/apk/release/app-release.apk`

See `ARCHITECTURE.md` for structure, `DECISIONS.md` for source/licensing rationale.

## Toolchain (no Android Studio, no admin)

- JDK 17 (Adoptium) + Android SDK `platforms;android-34`, `build-tools;34.0.0` + Gradle 8.7
- Installed at `~/synth-app/android-tools/` (see `android/local.properties` for the SDK path)

## Notes

- `local.properties` and `android/keystore/` are git-ignored (machine paths + signing secret).
  Regenerate the keystore with:
  ```bash
  keytool -genkeypair -keystore android/keystore/wordcoach.keystore -alias wordcoach \
    -keyalg RSA -keysize 2048 -validity 10000 -storepass kingfish2026 -keypass kingfish2026 \
    -dname "CN=Kingfish,OU=English Word Coach,O=Kingfish,C=TR"
  ```
