import re
txt=open(r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js",encoding="utf-8").read()
for m in re.finditer(r'"([a-z]{2}-\d+)": \[', txt):
    seg=txt[m.end():]; end=seg.index("\n  ]")
    print(m.group(1), seg[:end].count('"q":'))