#!/usr/bin/env python3
"""Convert data/final/words.json -> android/.../assets/words.js (window.WORD_DATA)."""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SRC = os.path.join(ROOT, "data", "final", "words.json")
OUT = os.path.join(ROOT, "android", "app", "src", "main", "assets", "words.js")


def main():
    with open(SRC, encoding="utf-8") as f:
        data = json.load(f)
    body = json.dumps(data, ensure_ascii=False, separators=(",", ":"))
    js = "window.WORD_DATA = " + body + ";\n"
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, "w", encoding="utf-8") as f:
        f.write(js)
    print(f"wrote {OUT} ({os.path.getsize(OUT)} bytes, {len(data['words'])} words)")


if __name__ == "__main__":
    main()
