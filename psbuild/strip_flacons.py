"""Strip the Flacons Voyage page out of the theme's app.js and theme.css.

The page is gone (one 50 ml size made it a duplicate of Parfums), so shipping
its data tables, handlers and CSS to every visitor is dead weight. The markers
are the section banners the prototype uses, so both files cut at the same
places.

Run this file directly for the self-check.
"""
import re

JS_START = "/* ══ FLACONS DATA & LOGIC"
JS_END = "/* ================================================================\n   PRESTASHOP 8 AJAX BRIDGE"
JS_SELFL = """// ── FLACONS SIZE ──
function selFl(btn, size) {"""
CSS_SECTIONS = (("/* FLACONS */", ".pack-card{"),
                ("/* ══ FLACONS PAGE", "/* ══"))


def _cut(text, start, end, what):
    i = text.index(start) if start in text else -1
    if i < 0:
        raise ValueError("missing block: " + what)
    j = text.index(end, i + len(start))
    block = text[i:j]
    if block.count("{") != block.count("}"):
        raise ValueError("unbalanced braces in " + what)
    return text[:i] + text[j:], len(block)


def strip_js(js):
    """Remove the flacons data/logic block, selFl() and the fl-* handlers."""
    notes = []

    js, n = _cut(js, JS_START, JS_END, "flacons data & logic")
    notes.append("data & logic (%d chars)" % n)

    # selFl() sits on its own between two other helpers
    m = re.search(re.escape(JS_SELFL) + r"[\s\S]*?\n\}\n\n", js)
    if not m:
        raise ValueError("missing selFl()")
    js = js[:m.start()] + js[m.end():]
    js = js.replace(", selFl, toggleWish,", ", toggleWish,")
    js = re.sub(r"[ \t]*case 'sel-fl':.*\n", "", js)
    notes.append("selFl() + its action")

    # the fl-* click delegation block, and the QA row that links to the page
    m = re.search(r"[ \t]*if \(act2 === 'fl-pick-frag'\)[\s\S]*?act2 === 'fl-quick-add'\)[^\n]*\n", js)
    if not m:
        raise ValueError("missing fl-* delegation")
    js = js[:m.start()] + js[m.end():]
    js = re.sub(r"[ \t]*\{id:'n4',label:'[^']*Flacons[^']*',act:'go',pg:'flacons'\},\n", "", js)
    notes.append("fl-* delegation + QA row")

    # the file header lists what app.js contains
    js, n = re.subn(r"[ \t]*-[ \t]*Flacons page:[^\n]*\n", "", js)
    if n:
        notes.append("header comment")

    # demo copy in the QA panel: a range and a line that no longer exist
    js = js.replace("Gamme : 6 parfums (39–119 DH) + Oud au gramme + Flacons voyage",
                    "Gamme : 6 parfums 50 ml (69–89 DH) + Oud au gramme + Coffrets")
    js = js.replace("(Oud/Flacons exclus des points)", "(Oud exclu des points)")
    notes.append("demo copy")

    left = sorted(set(re.findall(r"\bfl[A-Z]\w*", js)) | set(re.findall(r"FLACONS_DB|FL_SIZES", js)))
    if left:
        raise ValueError("flacons code left in app.js: " + ", ".join(left))
    return js, notes


def strip_css(css):
    """Remove the flacons section and page CSS."""
    notes = []
    for start, end in CSS_SECTIONS:
        # the page block's end marker is the next banner, so search past it
        if start not in css:
            raise ValueError("missing CSS block: " + start)
        i = css.index(start)
        j = css.index(end, i + len(start))
        css, n = css[:i] + css[j:], j - i
        notes.append("%s (%d chars)" % (start.strip("/* ═"), n))
    # the Nuit layer rewrites colours before this runs, so match the selector
    css, n = re.subn(r"\.cc-flacons [^\n{]*\{[^}]*\}\n?", "", css)
    if n != 1:
        raise ValueError("expected one .cc-flacons rule, found %d" % n)
    css = css.replace(".sec,.fl-sec,.bsec,", ".sec,.bsec,")
    css = css.replace("oud gram cards · flacons page · cart drawer",
                      "oud gram cards · cart drawer")
    css = css.replace("OUD/FLACONS — NOT eligible", "OUD — NOT eligible")
    left = sorted(set(re.findall(r"\.(?:fl-[\w-]+|fsz[\w-]*|ff-btn|cc-flacons)", css)))
    if left:
        raise ValueError("flacons selectors left in theme.css: " + ", ".join(left))
    return css, notes


def fix_loyalty_copy(text):
    """"Oud · Boukhour · Flacons exclus" — there is no Flacons line to exclude."""
    out = text.replace("Oud · Boukhour · Flacons exclus", "Oud · Boukhour exclus")
    if "flacons" in out.lower():
        raise ValueError("flacons left in loyalty copy")
    return out


def strip_loyalty(php, bar_tpl, guest_tpl):
    """The loyalty module excluded Flacons from points; there is no such line now."""
    notes = []
    # the points rules were rewritten and no longer name the category at all,
    # so this is a tidy-up rather than a requirement
    php = re.sub(r"[ \t]*\(int\)\s?Configuration::get\('ODYS_CAT_FLACONS'\),\n", "", php)
    # the key lists gained other entries since; drop the flacons one wherever
    # it sits rather than matching a fixed neighbourhood
    php = php.replace("'ODYS_CAT_FLACONS',", "")
    php, n = re.subn(r"[ \t]*\[[^\n]*'ID Catégorie Flacons'[^\n]*\],\n", "", php)
    if n != 1:
        raise ValueError("expected one Flacons settings field, found %d" % n)
    php = php.replace("Oud/Boukhour/Flacons excluded", "Oud/Boukhour excluded")
    php = php.replace("Oud/Boukhour/Flacons exclus", "Oud/Boukhour exclus")
    # "flacon" is also just the French for bottle: check for the setting and
    # the removed product line, not for the word
    leftovers = [t for t in ("ODYS_CAT_FLACONS", "Catégorie Flacons", "Flacons Voyage") if t in php]
    if leftovers:
        raise ValueError("flacons left in odys_loyalty.php: " + ", ".join(leftovers))
    notes.append("odys_loyalty.php")

    out = [fix_loyalty_copy(tpl) for tpl in (bar_tpl, guest_tpl)]
    notes.append("loyalty bar copy")
    return (php, out[0], out[1]), notes


if __name__ == "__main__":
    js = ("function other() {}\n\n" + JS_SELFL + "\n  x();\n}\n\n"
          "  pickVol, chgQty, selFl, toggleWish,\n"
          "    case 'sel-fl':        ODYS.selFl(t, p.size); break;\n"
          "      {id:'n4',label:'Flacons - Format voyage',act:'go',pg:'flacons'},\n"
          "  if (act2 === 'fl-pick-frag')   { flPickFrag(1); }\n"
          "  if (act2 === 'fl-quick-add')   { flAddToCart(); }\n"
          + JS_START + " ══ */\nconst FLACONS_DB = [];\nfunction flPickVol(v) { return v; }\n"
          + JS_END + " */\n")
    out, notes = strip_js(js)
    assert "flacons" not in out.lower(), out
    assert "selFl" not in out and "sel-fl" not in out, out
    assert "pickVol, chgQty, toggleWish," in out, out
    assert "function other() {}" in out, out
    print("strip_js OK:", "; ".join(notes))

    css = (".cc-flacons .cc-lnk{background:rgba(196,149,106,.85);color:#fff}\n"
           "/* FLACONS */\n.fl-sec{color:red}\n.fsz{color:red}\n"
           ".pack-card{display:flex}\n"
           "  .sec,.fl-sec,.bsec,.reviews{padding:0}\n"
           "/* ══ FLACONS PAGE ══ */\n.ff-btn{color:red}\n"
           "/* ══ NEXT SECTION ══ */\n.keep{color:blue}\n")
    out, notes = strip_css(css)
    assert ".keep{color:blue}" in out and ".pack-card{display:flex}" in out, out
    assert "fl-sec" not in out and "ff-btn" not in out and "fsz" not in out, out
    assert "  .sec,.bsec,.reviews{padding:0}" in out, out
    print("strip_css OK:", "; ".join(notes))

    php = ("/* points (parfums only — Oud/Boukhour/Flacons excluded) */\n"
           "$excluded = array_filter([\n"
           "            (int)Configuration::get('ODYS_CAT_OUD'),\n"
           "            (int)Configuration::get('ODYS_CAT_BOUKHOUR'),\n"
           "            (int)Configuration::get('ODYS_CAT_FLACONS'),\n"
           "        ]);\n"
           "foreach (['ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_CAT_FLACONS','ODYS_EMAIL'] as $k) {}\n"
           "                    ['type'=>'text','label'=>'ID Catégorie Flacons',    'name'=>'ODYS_CAT_FLACONS'],\n"
           "                    ['type'=>'text','label'=>'Numéro WhatsApp','name'=>'ODYS_WA_NUMBER'],\n")
    bar = "<div>⚠ Oud · Boukhour · Flacons exclus du programme</div>"
    (php_out, bar_out, guest_out), notes = strip_loyalty(php, bar, bar)
    assert "FLACONS" not in php_out.upper(), php_out
    assert "ODYS_CAT_BOUKHOUR'),\n        ]);" in php_out, php_out
    assert "'ODYS_CAT_BOUKHOUR','ODYS_EMAIL'" in php_out, php_out
    assert "Numéro WhatsApp" in php_out, php_out
    assert bar_out == guest_out == "<div>⚠ Oud · Boukhour exclus du programme</div>", bar_out
    print("strip_loyalty OK:", "; ".join(notes))
