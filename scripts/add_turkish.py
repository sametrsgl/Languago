#!/usr/bin/env python3
"""Add Turkish translations to words.json.

Source: firatkaya1/dictionary (free EN->TR dictionary, ~1.46M entries) with a
"Common Usage" category that carries natural, high-quality translations; "General"
is the fallback. Translation is chosen by part-of-speech when available.

Adds a `t` field to every word object in data/final/words.json (empty when no match).
"""
import json
import os
import urllib.request
import zipfile
from collections import defaultdict

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
DATA = os.path.join(ROOT, "data")
FINAL = os.path.join(DATA, "final")
ZIP_PATH = os.path.join(DATA, "dictionary-json.zip")
ZIP_URL = "https://raw.githubusercontent.com/firatkaya1/dictionary/master/dictionary-json.zip"

# category priority (best first)
CAT_PRIORITY = ["Common Usage", "General"]
# types to skip (not real translations)
SKIP_TYPES = {"pref.", "suf.", "abrev."}
SKIP_CATS = {"Irregular Verb", "Verbs"}

POS_MAP = {
    "noun": "n.", "verb": "v.", "adjective": "adj.", "adverb": "adv.",
    "pronoun": "pron.", "preposition": "prep.", "conjunction": "conj.",
    "exclamation": "interj.", "interjection": "interj.",
    "modal verb": "v.", "auxiliary verb": "v.",
}

# hand-curated fallbacks for common words absent from the dictionary
MANUAL = {
    "according to": "göre, uyarınca",
    "all right": "tamam, peki",
    "any more": "artık, daha fazla",
    "blog": "blog, günce",
    "dvd": "dvd",
    "false": "yanlış, sahte",
    "have to": "zorunda olmak, -meli",
    "high-profile": "tanınmış, öne çıkan",
    "ice cream": "dondurma",
    "next to": "yanında, bitişiğinde",
    "no one": "hiç kimse",
    "non-profit": "kâr amacı gütmeyen",
    "per cent": "yüzde",
    "post-war": "savaş sonrası",
    "smartphone": "akıllı telefon",
    "used to": "eskiden, alışkın olmak",
    "website": "web sitesi, internet sitesi",
    "bona fide": "gerçek, samimi, iyi niyetli",
    "cultish": "kült benzeri",
    "collider": "çarpıştırıcı",
    "ad lib": "doğaçlama yapmak",
    "ecotourism": "ekoturizm, doğa turizmi",
}


def ensure_zip():
    if not os.path.exists(ZIP_PATH):
        print("downloading EN->TR dictionary…")
        urllib.request.urlretrieve(ZIP_URL, ZIP_PATH)
    return ZIP_PATH


def build_lookup():
    z = zipfile.ZipFile(ensure_zip())
    data = json.loads(z.read("dictionary.json").decode("utf-8"))
    lookup = defaultdict(list)
    for e in data:
        w = (e.get("word") or "").strip().lower()
        cat = (e.get("category") or "").strip()
        typ = (e.get("type") or "").strip()
        tr = (e.get("tr") or "").strip()
        if not w or not tr:
            continue
        if typ in SKIP_TYPES or cat in SKIP_CATS:
            continue
        lookup[w].append({"cat": cat, "type": typ, "tr": tr})
    return lookup


def join_translations(entries):
    seen, out = set(), []
    for e in entries:
        t = e["tr"]
        if t not in seen:
            seen.add(t)
            out.append(t)
        if len(out) >= 3:
            break
    return ", ".join(out)


def pick(entries, pos):
    t = POS_MAP.get(pos)
    if t:
        m = [e for e in entries if e["type"] == t]
        if m:
            return join_translations(m)
    return join_translations(entries)


def best_translation(lookup, word, pos):
    key = word.lower()
    if key in MANUAL:
        return MANUAL[key]
    if key not in lookup:
        return ""
    entries = lookup[key]
    for cat in CAT_PRIORITY:
        subset = [e for e in entries if e["cat"] == cat]
        if subset:
            return pick(subset, pos)
    return pick(entries, pos)


def main():
    lookup = build_lookup()
    path = os.path.join(FINAL, "words.json")
    wj = json.load(open(path, encoding="utf-8"))
    words = wj["words"]
    missing = 0
    for k, w in words.items():
        t = best_translation(lookup, k, w.get("p", ""))
        w["t"] = t
        if not t:
            missing += 1
    with open(path, "w", encoding="utf-8") as f:
        json.dump(wj, f, ensure_ascii=False, separators=(",", ":"))
    total = len(words)
    print(f"Turkish translations added: {total - missing}/{total} ({100 * (total - missing) / total:.1f}%)")


if __name__ == "__main__":
    main()
