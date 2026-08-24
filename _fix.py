p = r"C:/Users/Samet Tıraşoğlu.DESKTOP-V1NEC06/synth-app/languago-platform/src/data/grammar_mcq_a2.js"
raw = open(p, "rb").read().decode("utf-8")
lines = raw.split("\n")
out, fixed = [], 0
for ln in lines:
    s = ln.rstrip("\r")
    core = s.rstrip(",").rstrip("\r").rstrip()
    if core.endswith("};"):
        out.append(s); continue
    if core.endswith("}"):
        out.append(core + ","); fixed += 1
    else:
        out.append(s)
open(p, "w", encoding="utf-8", newline="").write("\n".join(out))
print("normalized element-close lines:", fixed)