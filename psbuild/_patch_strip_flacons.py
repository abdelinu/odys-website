"""Wire strip_flacons into build_theme.py.

app.js and theme.css come straight from ref/, so the Flacons Voyage code has to
be cut at build time. The old `scope: flacons add/open` patch rewrote calls
inside the block we now delete, so it goes.
"""
import ast
import pathlib
import sys

P = pathlib.Path(__file__).resolve().parent / "build_theme.py"
s = P.read_text(encoding="utf-8", newline="")
NL = "\r\n" if "\r\n" in s else "\n"
done = []


def swap(old, new, what, optional_if_missing=False):
    """build_theme.py has mixed line endings, so try both spellings."""
    global s
    crlf, lf = old.replace("\n", NL), old.replace("\n", "\n")
    old = crlf if crlf in s else lf
    new = new.replace("\n", NL if old is crlf else "\n")
    if old not in s:
        if optional_if_missing or (new and new in s):
            print("  OK   %s (already applied)" % what)
            return
        print("  FAIL %s (not found)" % what)
        sys.exit(1)
    if s.count(old) != 1:
        print("  FAIL %s (%d matches)" % (what, s.count(old)))
        sys.exit(1)
    s = s.replace(old, new, 1)
    done.append(what)
    print("  OK   %s" % what)


swap("import re, shutil, sys, pathlib",
     "import re, shutil, sys, pathlib\n\nimport strip_flacons",
     "strip_flacons imported")

# the Flacons page is gone, so its JS is dead weight: cut it instead of
# rewriting the cart calls inside it
swap('fl_re = re.compile(r"(for \\(let i = 0; i < flQty; i\\+\\+\\) )addToCart\\((code, name,'
     ' flCurPrice, null\\);)([\\s\\S]{0,400}?)(?<![\\w.$])openCart\\(\\);")\n'
     'js, n = fl_re.subn(lambda m: m.group(1) + "ODYS.addToCart(" + m.group(2) + m.group(3) +'
     ' "ODYS.openCart();", js, count=1)\n'
     'must(n == 1, "scope: flacons add/open -> ODYS.*")\n',
     'js, fl_notes = strip_flacons.strip_js(js)\n'
     'ok("Flacons Voyage page: JS removed (" + "; ".join(fl_notes) + ")")\n',
     "app.js: flacons JS stripped instead of rewritten")

swap('css_path.write_text(css, encoding="utf-8")',
     'css, fl_css_notes = strip_flacons.strip_css(css)\n'
     'ok("Flacons Voyage page: CSS removed (" + "; ".join(fl_css_notes) + ")")\n'
     'css_path.write_text(css, encoding="utf-8")',
     "theme.css: flacons CSS stripped")

# README: two more rows describe the page and its four volumes
swap('    ("| `#pg-flacons` | `templates/catalog/product.tpl` (Flacons category) |" + NEWLINE,\n'
     '     "", "Flacons prototype-to-template row"),',
     '    ("| `#pg-flacons` | `templates/catalog/product.tpl` (Flacons category) |" + NEWLINE,\n'
     '     "", "Flacons prototype-to-template row"),\n'
     '    ("| ID Catégorie Flacons | ID of Flacons category |" + NEWLINE, "",\n'
     '     "Flacons loyalty-setting row"),\n'
     '    ("| \U0001f9ea Flacons | Fragrance selector · 4 volumes · Auto-carousel |" + NEWLINE,'
     ' "",\n     "Flacons feature row"),\n'
     '    ("| ⭐ Loyalty | odys_loyalty module · Oud/Flacons excluded",\n'
     '     "| ⭐ Loyalty | odys_loyalty module · Oud excluded", "loyalty feature row"),',
     "README: remaining Flacons rows removed")

P.write_text(s, encoding="utf-8", newline="")
ast.parse(s)
print("\nbuild_theme.py: %d edit(s), parses" % len(done))
