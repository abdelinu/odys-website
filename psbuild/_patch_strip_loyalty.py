"""Add the loyalty-module step to build_theme.py.

odys_loyalty ships from ref/ with a "Flacons excluded from points" rule and an
admin field for the Flacons category id. Both point at a line that no longer
exists, so the build strips them after the tree is copied.
"""
import ast
import pathlib
import sys

P = pathlib.Path(__file__).resolve().parent / "build_theme.py"
s = P.read_text(encoding="utf-8", newline="")

STEP = '''
# The loyalty module excluded the Flacons line from points and asked for its
# category id in its settings; that line is gone.
loyalty_dir = THEME / "modules" / "odys_loyalty"
loyalty_php = loyalty_dir / "odys_loyalty.php"
loyalty_bar = loyalty_dir / "views" / "templates" / "hook" / "loyalty_bar.tpl"
loyalty_guest = loyalty_dir / "views" / "templates" / "hook" / "loyalty_bar_guest.tpl"
(new_php, new_bar, new_guest), loyalty_notes = strip_flacons.strip_loyalty(
    loyalty_php.read_text(encoding="utf-8"),
    loyalty_bar.read_text(encoding="utf-8"),
    loyalty_guest.read_text(encoding="utf-8"))
loyalty_php.write_text(new_php, encoding="utf-8")
loyalty_bar.write_text(new_bar, encoding="utf-8")
loyalty_guest.write_text(new_guest, encoding="utf-8")
ok("Flacons Voyage page: loyalty module cleaned (" + "; ".join(loyalty_notes) + ")")
'''

anchor = 'css, fl_css_notes = strip_flacons.strip_css(css)'
if "strip_flacons.strip_loyalty" in s:
    print("already applied")
    sys.exit(0)
if anchor not in s:
    print("FAIL: anchor not found")
    sys.exit(1)
nl = "\r\n" if "\r\n" in s else "\n"
s = s.replace(anchor, STEP.strip("\n").replace("\n", nl) + nl + anchor, 1)
P.write_text(s, encoding="utf-8", newline="")
ast.parse(s)
print("build_theme.py: loyalty step added, parses")
