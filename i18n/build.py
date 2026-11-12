"""Builds assets/js/i18n-dict.js from i18n/strings.txt (blocks of English, Greek, Swedish)."""
import json, os, re, sys

here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, "strings.txt"), encoding="utf-8").read()
blocks = [b for b in re.split(r"\n\s*\n", src)]
el, sv, problems = {}, {}, []
for b in blocks:
    lines = [l for l in b.split("\n") if l.strip() and not l.lstrip().startswith("#")]
    if not lines:
        continue
    if len(lines) != 3:
        problems.append(lines[0][:60] if lines else "?")
        continue
    en, g, s = lines
    if en in el:
        problems.append("duplicate: " + en[:60])
    el[en] = g
    sv[en] = s
if problems:
    print("Problems:", *problems, sep="\n  ")
    sys.exit(1)
out = os.path.join(here, "..", "assets", "js", "i18n-dict.js")
with open(out, "w", encoding="utf-8") as f:
    f.write("/* Generated from i18n/strings.txt by i18n/build.py. Edit the .txt, not this file. */\n")
    f.write("window.AP_I18N = " + json.dumps({"el": el, "sv": sv}, ensure_ascii=False, indent=0) + ";\n")
print(f"{len(el)} entries")
