#!/usr/bin/env bash
# Build the Languago APK end-to-end and verify the result.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
TOOLS="$HOME/synth-app/android-tools"
export JAVA_HOME="$TOOLS/jdk-17.0.20+8"
export ANDROID_HOME="$TOOLS/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
GRADLE="$TOOLS/gradle-8.7/bin/gradle"

cd "$ROOT"

# 1. ensure dataset exists
if [ ! -f data/final/words.json ]; then
  echo "[1/5] building dataset (network)…"
  python scripts/build_data.py
else
  echo "[1/5] dataset present, skipping fetch"
fi

# 2. add Turkish translations
echo "[2/5] adding Turkish translations…"
python scripts/add_turkish.py

# 3. package data into the web assets
echo "[3/5] packaging words.js…"
python scripts/make_words_js.py

# 4. build + sign
echo "[4/5] gradle assembleRelease…"
cd android
"$GRADLE" assembleRelease

# 5. verify
APK="$ROOT/android/app/build/outputs/apk/release/app-release.apk"
echo "[5/5] verifying…"
"$JAVA_HOME/bin/java.exe" -jar "$ANDROID_HOME/build-tools/34.0.0/lib/apksigner.jar" verify --print-certs "$APK" | head -6
echo "--- badging ---"
"$ANDROID_HOME/build-tools/34.0.0/aapt2.exe" dump badging "$APK" | grep -E "package:|application-label:|launchable-activity:"
echo ""
echo "APK: $APK"
ls -la "$APK"
