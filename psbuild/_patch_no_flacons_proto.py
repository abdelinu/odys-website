"""Remove the Flacons Voyage page from the standalone prototype.

Deletes the #pg-flacons page, its JS (data, handlers, init), its page-only CSS
and every link into it. "Flacons & Coffrets" links become Coffrets, which is
where they were half-pointing anyway.

The script asserts nothing references the page afterwards, so re-running it is
the check.
"""
import pathlib
import re
import sys

SRC = pathlib.Path(__file__).resolve().parent.parent / "odys-preview-v5.0.html"
h = SRC.read_text(encoding="utf-8")
fails = []


def must(cond, what):
    print(("  OK   " if cond else "  FAIL ") + what)
    if not cond:
        fails.append(what)


def cut(start_marker, end_marker, what, keep_end=False):
    """Delete start_marker .. end_marker inclusive (end exclusive if keep_end)."""
    global h
    if start_marker not in h:
        must(end_marker not in h or keep_end, what + " (already removed)")
        return
    start = h.index(start_marker)
    end = h.index(end_marker, start)
    block = h[start:end if keep_end else end + len(end_marker)]
    must(block.count("<div") == block.count("</div>"), what + ": divs balanced")
    must(block.count("{") == block.count("}"), what + ": braces balanced")
    h = h[:start] + h[(end if keep_end else end + len(end_marker)):]
    print("  OK   %s (%d chars)" % (what, len(block)))


def sub(old, new, what, count=1):
    global h
    n = h.count(old)
    if n == 0 and (new == "" or new in h):
        print("  OK   %s (already applied)" % what)
        return
    must(n == count, "%s (expected %d, found %d)" % (what, count, n))
    if n == count:
        h = h.replace(old, new)


# ── 1. the page itself ───────────────────────────────────────────────────
cut('<div id="pg-flacons" class="page">', '</div><!-- end pg-flacons -->', "page markup")

# ── 2. its JavaScript: data, functions, delegation, init ─────────────────
cut("/* ══ FLACONS DATA & LOGIC",
    "/* ================================================================\n"
    "   PRESTASHOP 8 AJAX BRIDGE", "page JS", keep_end=True)

fl_handlers = re.search(
    r"(\n)(  if \(act2 === 'fl-pick-frag'\)[\s\S]*?act2 === 'fl-quick-add'\)[^\n]*\n)", h)
if fl_handlers:
    h = h[:fl_handlers.start(2)] + h[fl_handlers.end(2):]
    print("  OK   fl-* click delegation removed")
else:
    must("fl-pick-frag" not in h, "fl-* click delegation removed (already applied)")

sub("""// ── FLACONS SIZE ──
function selFl(btn, size) {
  document.querySelectorAll('.fsz').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
}

""", "", "selFl() removed")
sub("  pickVol, chgQty, addProd, switchThumb, toggleAcc, selFl, toggleWish,",
    "  pickVol, chgQty, addProd, switchThumb, toggleAcc, toggleWish,", "selFl export removed")
sub("    case 'sel-fl':        ODYS.selFl(t, p.size); break;\n", "", "sel-fl action removed")

# ── 3. links into the page ───────────────────────────────────────────────
sub('  <button class="sw-btn"       data-action="go" data-page="flacons">Flacons</button>\n', "",
    "page switcher button removed")
sub('      <li><a data-action="go" data-page="flacons" href="#">Flacons</a></li>\n', "",
    "nav entry removed")
sub('<li><a href="#" data-action="go" data-page="flacons">Flacons</a></li>', "",
    "collection-page nav entry removed")
sub('<li><a data-action="go" data-page="flacons" href="#">Flacons</a></li>', "",
    "product-page nav entry removed")
sub('      <li><a data-action="go" data-page="flacons" href="#">Flacons & Coffrets</a></li>',
    '      <li><a data-action="go" data-page="bundles" href="#">Coffrets</a></li>',
    "Flacons & Coffrets -> Coffrets")
sub('          <li><a href="#" data-action="go" data-page="flacons">Flacons &amp; Coffrets</a></li>',
    '          <li><a href="#" data-action="go" data-page="bundles">Coffrets</a></li>',
    "footer Flacons & Coffrets -> Coffrets")
sub("      {id:'n4',label:'Flacons — Format voyage, packs',act:'go',pg:'flacons'},\n", "",
    "QA checklist row removed")

# the home category card: Parfums / Oud / Flacons becomes Parfums / Oud
card = re.search(r'    <div class="cc cc-flacons" data-action="go" data-page="flacons">.*?</div></div>\n',
                 h, re.S)
if card:
    h = h[:card.start()] + h[card.end():]
    print("  OK   home category card removed")
else:
    must("cc-flacons" not in h, "home category card removed (already applied)")

# ── 4. its page-only CSS ─────────────────────────────────────────────────
cut("/* ══ FLACONS PAGE", ".ff-btn.on span{color:var(--rose)}\n", "page CSS")
sub(".cc-flacons .cc-lnk{background:rgba(180,134,61,.85);color:#fff}\n", "",
    "category card CSS removed")

# the travel-format section: .fl-sec / .fl-sizes / .fsz had no markup left
cut("/* FLACONS */", ".pack-card{", "section CSS", keep_end=True)
sub(".sec,.fl-sec,.bsec,", ".sec,.bsec,", "media query selector list")

# ── 5. nothing left pointing at it ───────────────────────────────────────
for token, what in (('data-page="flacons"', "no link to the page"),
                    ("pg-flacons", "no page element"),
                    ("FL_SIZES", "no size table"),
                    ("FLACONS_DB", "no fragrance table"),
                    ("flCurVol", "no volume state"),
                    ("fl-pick-vol", "no picker action"),
                    ("selFl", "no selFl()"),
                    ("ff-btn", "no fragrance buttons"),
                    ("cc-flacons", "no category card"),
                    ("fl-sec", "no section CSS"),
                    (".fsz", "no size-button CSS")):
    must(h.count(token) == 0, "%s (%s)" % (what, token))

for fn in re.findall(r"\bfl[A-Z]\w*", h):
    must(False, "leftover flacons function: " + fn)

must(h.count("<div") == h.count("</div>"), "document divs balanced")
must(h.count("<script") == h.count("</script>"), "script tags balanced")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
SRC.write_text(h, encoding="utf-8")
print("\nprototype: Flacons Voyage page removed")
