"""50 ml only in the two files the build copies verbatim from ref/.

app.js carries the prototype's QA/analytics demo rows and README.md documents
a Volume attribute; both still named 30 / 100 / 20 ml sizes that the shop no
longer sells. dist/ is regenerated from ref/ on every run, so the fix belongs
in build_theme.py, not in dist.
"""
import pathlib, sys

P = pathlib.Path(__file__).resolve().parent / "build_theme.py"
s = P.read_text(encoding="utf-8", newline="")   # CRLF file — keep it byte-exact
NL = "\r\n"

anchor = 'js_path.write_text(js, encoding="utf-8")' + NL
assert anchor in s, "app.js write anchor"
if "50 ml only in the QA" in s:
    print("already patched"); sys.exit(0)

block = NL.join([
    '# The QA panel and the analytics to-do list are demo rows lifted from the',
    '# prototype; they still advertised sizes the shop does not sell.',
    'for _old, _new, _what in (',
    '    ("Icône 60ml depuis la page produit", "Icône 50ml depuis la page produit",',
    '     "QA checklist row"),',
    '    ("Tester les prix du format 20ml (29 DH \u2192 25 DH)",',
    '     "Tester les prix du Duo Classique (411 DH \u2192 399 DH)", "analytics to-do row"),',
    '):',
    '    js, n = js.replace(_old, _new), js.count(_old)',
    '    must(n == 1, f"app.js: 50 ml only in the {_what}")',
    '',
])
s = s.replace(anchor, block + anchor, 1)

# README: the install guide documented a 30/50/100 ml Volume attribute
readme = NL.join([
    '',
    '# README ships with the theme, so it may not document sizes we removed.',
    'readme_path = DIST / "README.md"',
    'readme = readme_path.read_text(encoding="utf-8")',
    'for _old, _new, _what in (',
    '    ("| `flacons-voyage` | Flacons Voyage | Travel sizes 20\u2013100ml |",',
    '     "| `flacons-voyage` | Flacons Voyage | 50 ml bottles |", "category table"),',
    '    ("**Parfums** \u2192 Create attribute `Volume` with values: `30ml`, `50ml`, `100ml`",',
    '     "**Parfums** \u2192 One size only (50 ml): no `Volume` attribute needed. Add one'
    ' if you ever sell other sizes \u2014 the product page renders whatever combinations exist.",',
    '     "attribute step"),',
    '):',
    '    must(readme.count(_old) == 1, f"README: 50 ml only in the {_what}")',
    '    readme = readme.replace(_old, _new)',
    'readme_path.write_text(readme, encoding="utf-8")',
    'ok("README: 50 ml only")',
    '',
])
tail_anchor = 'ok("THEME-NOTES-v5.md added")' + NL
assert tail_anchor in s, "notes anchor"
s = s.replace(tail_anchor, tail_anchor + readme, 1)

P.write_text(s, encoding="utf-8", newline="")
print("build_theme.py patched")
