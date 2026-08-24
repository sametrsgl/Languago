import re
p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
txt = open(p, encoding="utf-8").read()
tests = [
 ('class-two', r'"[a-z]{2}-01"'),
 ('class-one-quant', r'"[a-z]{2}'),
 ('class-single', r'"a[z]a'),
 ('class-pluscomma', r'"a[z]{1}'),
 ('dash', r'"a2\-\d\d"'),
 ('digits-class', r'"a2-[0-9]{2}"'),
 ('colon-brace', r'": \[ '),
]
for name, pat in tests:
    print(name, re.findall(pat, txt)[:2])
# also try without character class quantifier split
print('class as literal a|b|c:', re.findall(r'"[abc2]{3}-\d\d"', txt)[:2])
print('re.fullmatch etc fine?')