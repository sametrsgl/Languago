import re
p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
txt = open(p, encoding="utf-8").read()
units = sorted(set(re.findall(r'"([a-z]{2}-\d+)"\s*:\s*\[', txt)))
print("units found:", len(units), units[:5])
for u in units:
    i = txt.index('  "%s": [' % u)
    j = txt.index("\n  ]", i)
    print(u, txt[i:j].count('"q":'))