#!/usr/bin/env python3
"""Build the Languago vocabulary dataset.

Sources:
  - Oxford 3000/5000 (winterdl/oxford-5000-vocabulary-audio-definition) -> A1-C1,
    with POS, IPA, English definition, example.
  - Octanove Vocabulary Profile C1/C2 (openlanguageprofiles/olp-en-cefrj, CC BY-SA 4.0)
    -> C2 words (and C1 supplement) with POS + CEFR.
  - Academic Word List / AWL (lpmi-13/machine_readable_wordlists) -> IELTS/TOEFL core.

Missing definitions are enriched via the Free Dictionary API (Wiktionary, CC BY-SA)
with an on-disk cache so re-runs are cheap and resumable.

Output: data/final/words.json  ->  {"meta": {...}, "words": {key: {...}}, "sets": {name: [keys]}}
"""
import csv
import json
import os
import re
import sys
import time
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(os.path.dirname(HERE), "data")
FINAL = os.path.join(DATA, "final")
CACHE = os.path.join(DATA, "dict_cache.json")
os.makedirs(FINAL, exist_ok=True)

API = "https://api.dictionaryapi.dev/api/v2/entries/en/{word}"
DELAY = 0.35  # be polite to the free API


def load_json(name):
    with open(os.path.join(DATA, name), encoding="utf-8") as f:
        return json.load(f)


def load_cache():
    if os.path.exists(CACHE):
        with open(CACHE, encoding="utf-8") as f:
            return json.load(f)
    return {}


def save_cache(cache):
    tmp = CACHE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(cache, f, ensure_ascii=False)
    os.replace(tmp, CACHE)


POS_MAP = {
    "noun": "noun", "verb": "verb", "adjective": "adjective", "adverb": "adverb",
    "pronoun": "pronoun", "preposition": "preposition", "conjunction": "conjunction",
    "exclamation": "exclamation", "interjection": "exclamation", "determiner": "determiner",
    "number": "number", "modal verb": "modal verb", "auxiliary verb": "modal verb",
    "indefinite article": "article", "definite article": "article", "article": "article",
    "vern": "verb", "": "",
}


def norm_pos(pos):
    p = (pos or "").strip().lower()
    return POS_MAP.get(p, p)


def clean_def(text):
    if not text:
        return ""
    t = text.strip()
    # Wiktionary verb defs often start "To " -> keep readable, lowercase it
    if t.startswith("To ") and len(t) > 3:
        t = t[3].lower() + t[4:]
    # collapse whitespace
    t = re.sub(r"\s+", " ", t)
    # drop trailing "etc." noise is fine; just cap length for a flashcard
    if len(t) > 220:
        # cut at a word boundary
        t = t[:220].rsplit(" ", 1)[0] + " …"
    return t


def fetch_api(word, cache):
    """Return dict with p/d/e/i or None. Uses/updates cache."""
    key = word.lower()
    if key in cache:
        return cache[key]  # may be None (known-miss)
    url = API.format(word=urllib.parse.quote(word))
    result = None
    for attempt in range(3):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "EnglishWordCoach/1.0"})
            with urllib.request.urlopen(req, timeout=15) as r:
                data = json.load(r)
            # pick first entry, first meaning, first definition
            entry = data[0]
            pos = norm_pos(entry.get("meanings", [{}])[0].get("partOfSpeech", ""))
            defs = entry.get("meanings", [{}])[0].get("definitions", [])
            definition = clean_def(defs[0].get("definition", "")) if defs else ""
            example = ""
            for d in defs:
                if d.get("example"):
                    example = re.sub(r"\s+", " ", d["example"]).strip()
                    break
            ipa = ""
            for ph in entry.get("phonetics", []):
                if ph.get("text"):
                    ipa = ph["text"]
                    break
            if definition:
                result = {"p": pos, "d": definition, "e": example, "i": ipa}
            break
        except urllib.error.HTTPError as e:
            if e.code == 404:
                result = None  # known-miss
                break
            time.sleep(1.5)
        except Exception:
            time.sleep(1.5)
    cache[key] = result
    if len(cache) % 25 == 0:
        save_cache(cache)
    time.sleep(DELAY)
    return result


def main():
    cache = load_cache()
    print(f"cache entries loaded: {len(cache)}")

    # ---- Oxford 5000 (A1-C1) ----
    ox = load_json("oxford_5000.json")
    ox_words = {}  # key -> word obj (full)
    for v in ox.values():
        w = v["word"].strip()
        key = w.lower()
        if not w or v.get("cefr") in ("", None):
            continue
        ox_words[key] = {
            "w": w,
            "p": norm_pos(v.get("type", "")),
            "d": clean_def(v.get("definition", "")),
            "e": (v.get("example") or "").strip(),
            "i": v.get("phon_br") or v.get("phon_n_am") or "",
        }
        ox_words[key]["_cefr"] = v["cefr"]

    # ---- Octanove C2 ----
    oct_rows = list(csv.DictReader(open(os.path.join(DATA, "octanove_c1c2.csv"), encoding="utf-8")))
    oct_c2 = []
    for r in oct_rows:
        hw = (r["headword"] or "").strip()
        if not hw:
            continue
        lvl = (r["CEFR"] or "").strip().upper()
        if lvl == "C2":
            oct_c2.append({"w": hw, "p": norm_pos(r.get("pos", "")), "_cefr": "c2"})

    # ---- AWL ----
    awl = load_json("AWL.json")
    awl_records = []  # {w, p, sublist}
    for sub, words in awl.items():
        sl = int(sub.split("_")[1])
        for hw in words:
            awl_records.append({"w": hw, "p": "", "sublist": sl})

    # ---- Build master word dict (unique by lowercase key) ----
    master = {}  # key -> {w,p,d,e,i}  (no internal _cefr)

    def add_word(rec, prefer_oxford=True):
        key = rec["w"].lower()
        if key in master:
            return key
        # try Oxford definition first (best quality)
        if prefer_oxford and key in ox_words and ox_words[key]["d"]:
            o = ox_words[key]
            master[key] = {"w": o["w"], "p": o["p"] or rec.get("p", ""),
                           "d": o["d"], "e": o["e"], "i": o["i"]}
            return key
        # try cache/API
        got = fetch_api(rec["w"], cache)
        if got and got.get("d"):
            master[key] = {"w": rec["w"], "p": got.get("p") or rec.get("p", ""),
                           "d": got["d"], "e": got.get("e", ""), "i": got.get("i", "")}
        else:
            # no definition available; still include with pos only
            master[key] = {"w": rec["w"], "p": rec.get("p", ""), "d": "", "e": "", "i": ""}
        return key

    # ---- CEFR sets ----
    def cefr_keys(level):
        return [k for k, o in ox_words.items() if o["_cefr"] == level]

    sets = {
        "a1": sorted(cefr_keys("a1")),
        "a2": sorted(cefr_keys("a2")),
        "b1": sorted(cefr_keys("b1")),
        "b2": sorted(cefr_keys("b2")),
        "c1": sorted(cefr_keys("c1")),
    }
    # ensure every CEFR word is in master (it already is via ox_words)
    for k, o in ox_words.items():
        if k not in master:
            master[k] = {"w": o["w"], "p": o["p"], "d": o["d"], "e": o["e"], "i": o["i"]}

    # ---- C2 (octanove C2, dedup against existing) ----
    c2_keys = []
    for rec in oct_c2:
        k = add_word(rec)
        if k not in c2_keys:
            c2_keys.append(k)
    sets["c2"] = c2_keys

    # ---- AWL / IELTS ----
    awl_keys = []
    for rec in awl_records:
        k = add_word(rec)
        if k not in awl_keys:
            awl_keys.append(k)
    sets["ielts"] = awl_keys

    # ---- exam sets (reuse Oxford definitions; no extra C1 fetches) ----
    oxford_c1 = sets["c1"]
    oxford_b2 = [k for k in ox_words if ox_words[k]["_cefr"] == "b2"]

    # TOEFL = AWL + Oxford C1 (academic + advanced general)
    toefl = list(awl_keys)
    for k in oxford_c1:
        if k not in toefl:
            toefl.append(k)
    sets["toefl"] = toefl

    # YOKDIL = AWL + Oxford C1 + C2 (academic reading)
    yokdil = list(awl_keys)
    for k in oxford_c1 + c2_keys:
        if k not in yokdil:
            yokdil.append(k)
    sets["yokdil"] = yokdil

    # YDS = Oxford B2 + C1 + C2 + AWL (broad advanced)
    yds = []
    for k in oxford_b2 + oxford_c1 + c2_keys + awl_keys:
        if k not in yds:
            yds.append(k)
    sets["yds"] = yds

    # ---- GRE = octanove C2 + AWL sublists 9-10 (hardest) ----
    gre = list(c2_keys)
    for rec in awl_records:
        if rec["sublist"] in (9, 10):
            k = add_word(rec)
            if k not in gre:
                gre.append(k)
    sets["gre"] = gre

    # ---- drop words with no definition AND no pos (junk) ----
    def keep(k):
        o = master[k]
        return bool(o["d"])

    # remove word-objects without definitions from master, and filter sets
    drop = [k for k in master if not master[k]["d"]]
    for k in drop:
        del master[k]
    for name in sets:
        sets[name] = [k for k in sets[name] if k in master]

    # strip internal fields
    for k in master:
        master[k].pop("_cefr", None)

    # ---- write output ----
    meta = {
        "app": "Languago",
        "version": 1,
        "sources": [
            "Oxford 3000/5000 (A1-C1)",
            "Octanove Vocabulary Profile C1/C2 (CC BY-SA 4.0)",
            "Academic Word List (Averil Coxhead)",
            "Free Dictionary API / Wiktionary (CC BY-SA) for enrichment",
        ],
        "note": "Definitions for A1-C1 are Oxford-derived; C2/AWL-missing enriched from Wiktionary.",
    }
    out = {"meta": meta, "words": master, "sets": sets}

    sizes = {n: len(v) for n, v in sets.items()}
    print("set sizes:", json.dumps(sizes, indent=2))

    with open(os.path.join(FINAL, "words.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, separators=(",", ":"))

    save_cache(cache)
    print(f"done. cache size {len(cache)}")
    print(f"total unique words: {len(master)}")
    print(f"output bytes: {os.path.getsize(os.path.join(FINAL, 'words.json'))}")


if __name__ == "__main__":
    main()
