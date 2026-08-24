import re, collections
p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
txt = open(p, encoding="utf-8").read()
# per-unit counts
print("=== per-unit ===")
for m in re.finditer(r'"([a-z]{2}-\d+)": \[', txt):
    u = m.group(1); seg = txt[m.end():]; end = seg.index("\n  ]")
    print(u, seg[:end].count('"q":'))
# uniqueness of stems
qs = re.findall(r'"q":\s*"(.*?)"', txt)
dups = [k for k, v in collections.Counter(qs).items() if v > 1]
print("=== total qs ===", len(qs), "duplicates:", dups)
# each has exactly 4 options
opts = re.findall(r'"options":\s*\[(.*?)\]', txt)
bad = [i for i, o in enumerate(opts) if len(re.findall(r'"(?:[^"\\]|\\.)*"', o)) != 4]
print("=== qs with !=4 options ===", len(bad))
# each 'a' index in [0,3]
a_vals = [int(x) for x in re.findall(r'"a":\s*(\d+)', txt)]
print("=== a index range ===", min(a_vals), max(a_vals), "invalid:", [x for x in a_vals if x < 0 or x > 3])
# every question has a 'why' with 4 entries iff it has why; check parallelism: count why entries vs options
why_objs = re.findall(r'"why":\s*\[(.*?)\]', txt)
mism = [i for i, w in enumerate(why_objs) if len(re.findall(r'"(?:[^"\\]|\\.)*"', w)) != 4]
print("=== why arrays with !=4 entries ===", len(mism))
# questions count with why vs without
print("=== total why arrays ===", len(why_objs), "of", len(qs), "questions")