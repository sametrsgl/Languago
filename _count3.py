import re
p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
txt = open(p, encoding="utf-8").read()
units = re.findall(r'"a2-\d\d"', txt)
seen = []
for u in units:
    if u not in seen:
        seen.append(u)
for u in sorted(set(units)):
    u = u.strip('"')
    i = txt.index('  "%s": [' % u)
    j = txt.index("\n  ]", i)
    print(u, txt[i:j].count('"q":'))