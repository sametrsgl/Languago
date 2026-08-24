import re
p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
txt = open(p, encoding="utf-8").read()
print("literal 'a2-01':", re.findall(r'"a2-01"', txt))
print("pat A:", re.findall(r'"a2-\d\d"', txt))
print("pat B:", re.findall(r'"[a-z]{2}-\d\d"', txt))
print("pat C:", re.findall(r'"[a-z]{2}-\d+":', txt))
m = re.search(r'"[a-z]{2}-\d+"\s*:\s*\[', txt)
print("pat D match:", bool(m))
print("count 'q':", txt.count('"q":'))