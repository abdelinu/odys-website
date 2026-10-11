"""50 ml only, everywhere in the standalone prototype.

The user asked to drop 30 ml and 100 ml "from the site". The PrestaShop theme
was done in build_theme.py; this does the same to odys-preview-v5.0.html:
the product volume picker, the Flacons Voyage page, the Formats Decouverte
ladder (it existed only to advertise the other sizes), and the copy that
named a size.
"""
import pathlib, re, sys

SRC = pathlib.Path(__file__).resolve().parent.parent / "odys-preview-v5.0.html"
h = SRC.read_text(encoding="utf-8")
fails = []

def must(cond, what):
    print(("  OK   " if cond else "  FAIL ") + what)
    if not cond:
        fails.append(what)

def sub(old, new, what, count=1):
    global h
    n = h.count(old)
    must(n == count, "%s (%d occurrence%s)" % (what, count, "" if count == 1 else "s"))
    if n == count:
        h = h.replace(old, new)

# ── 1. product page volume picker: keep the 50 ml card only ───────────────
pick = re.search(
    r'\n\n        <button class="vc" data-vol="30".*?</button>\n\n'
    r'(        <button class="vc on" data-vol="50".*?</button>)\n\n'
    r'        <button class="vc" data-vol="100".*?</button>\n\n',
    h, re.S)
must(pick is not None, "product page: 30/50/100 ml picker found")
if pick:
    h = h[:pick.start()] + "\n\n" + pick.group(1) + "\n\n" + h[pick.end():]

# one card, so the label and the 3-up grid no longer make sense
sub('<div class="vol-lbl">Choisissez votre format</div>',
    '<div class="vol-lbl">Format</div>',
    "volume label reworded", count=2)
sub('.vol-cards{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}',
    '.vol-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px}',
    "volume grid no longer forced to 3 columns")

# ── 2. Formats Decouverte ladder: 5/20/50/100 ml — delete the section ─────
start = h.index('  <div style="background:var(--marble);border-top:1px solid var(--border);'
                'border-bottom:1px solid var(--border);padding:56px max(20px,calc(52px + var(--safe-l)))">\n'
                '    <div style="max-width:1280px;margin:0 auto">\n'
                '      <div style="display:flex;align-items:flex-end')
end_marker = '\n\n\n<div class="bc"><a href="#" data-action="go" data-page="home">Accueil</a>'
end = h.index(end_marker, start)
block = h[start:end]
must("Formats Découverte" in block and "100 ml" in block and "20 ml" in block,
     "ladder section isolated (%d chars)" % len(block))
must(block.count("<div") - block.count("</div>") == 0, "ladder section: divs balanced")
h = h[:start] + h[end + 3:]   # keep one newline before the breadcrumb

# ── 3. Flacons Voyage page: 50 ml only ───────────────────────────────────
fl = re.search(
    r'        <button class="vc" data-vol="20".*?</button>\n'
    r'        <button class="vc on" data-vol="30".*?</button>\n'
    r'        (<button class="vc" data-vol="50".*?</button>)\n'
    r'        <button class="vc" data-vol="100".*?</button>\n',
    h, re.S)
must(fl is not None, "flacons page: 20/30/50/100 ml picker found")
if fl:
    card = fl.group(1).replace('<button class="vc" data-vol="50"', '<button class="vc on" data-vol="50"')
    h = h[:fl.start()] + "        " + card + "\n" + h[fl.end():]

sub("<!-- Volume selector — 4 sizes -->", "<!-- Volume selector — 50 ml only -->",
    "flacons picker comment")
sub("Flacons voyage <strong>20ml · 30ml · 50ml · 100ml</strong>disponibles",
    "Flacons <strong>50 ml</strong>disponibles", "flacons announcement bar", count=2)
sub('<span class="lp-price" id="fl-livePrice">39 DH</span>',
    '<span class="lp-price" id="fl-livePrice">69 DH</span>', "flacons live price")
sub('<span class="lp-vol" id="fl-liveVol">· Format 30ml</span>',
    '<span class="lp-vol" id="fl-liveVol">· Format 50ml</span>', "flacons live volume")
sub('<span class="lp-free" id="fl-liveFree">+ 261 DH → Livraison gratuite</span>',
    '<span class="lp-free" id="fl-liveFree">+ 231 DH → Livraison gratuite</span>',
    "flacons free-shipping remainder")
sub('<span class="blbl" id="fl-btnLbl">Ajouter au Panier · 30ml</span>',
    '<span class="blbl" id="fl-btnLbl">Ajouter au Panier · 50ml</span>', "flacons cart button")
sub("Format voyage 30ml de L'Icône", "Flacon 50 ml de L'Icône", "flacons description")
sub("1–2 pulvérisations suffisent pour un format voyage.",
    "1–2 pulvérisations suffisent.", "flacons usage copy")

# JS: the size table and the default selection
sub("""const FL_SIZES = [
  { vol:20,  price:29,  desc:'Découverte', cpml:'1,45' },
  { vol:30,  price:39,  desc:'Voyage',     cpml:'1,30' },
  { vol:50,  price:69,  desc:'Quotidien',  cpml:'1,38' },
  { vol:100, price:119, desc:'Meilleur rapport', cpml:'1,19' },""",
    """const FL_SIZES = [
  { vol:50,  price:69,  desc:'Quotidien',  cpml:'1,38' },""",
    "FL_SIZES reduced to 50 ml")
sub("let flCurVol  = 30;", "let flCurVol  = 50;", "flacons default volume")

# ── 4. copy that still named another size ────────────────────────────────
sub('<h2 class="cc-title">Flacons 20–50ml</h2>', '<h2 class="cc-title">Flacons 50 ml</h2>',
    "home category card title")
sub('Extrait de Parfum · 30 ml', 'Extrait de Parfum · 50 ml', "signature card meta", count=3)
sub(', 30 ml"/>', ', 50 ml"/>', "signature card alt text", count=3)
sub('<div class="odys-value-t">Flacon 30 ml</div>', '<div class="odys-value-t">Flacon 50 ml</div>',
    "value card")
sub('Boukhour artisanal + Flacon voyage 20ml.', 'Boukhour artisanal + Flacon 50 ml.',
    "Pack Oud description")
sub("Icône 60ml depuis la page produit", "Icône 50ml depuis la page produit",
    "QA checklist label")
sub("Tester les prix du format 20ml (29 DH → 25 DH)",
    "Tester les prix du Duo Classique (411 DH → 399 DH)", "analytics priority item")
sub("- Gamme : 6 parfums (39–119 DH) + Oud au gramme + Flacons voyage",
    "- Gamme : 6 parfums 50 ml (69–89 DH) + Oud au gramme + Coffrets", "brief summary line")

# ── 5. nothing but 50 ml left ────────────────────────────────────────────
left = [m.group(0) for m in re.finditer(r'(?<![\d,–-])(?!50\s*ml)\d{1,3}\s*ml', h, re.I)]
must(not left, "no other size remains (found %s)" % (sorted(set(left)) or "none"))
must(h.count('data-vol="30"') == 0 and h.count('data-vol="100"') == 0
     and h.count('data-vol="20"') == 0, "no 20/30/100 ml buttons remain")
must(h.count('data-vol="50"') == 2, "one 50 ml button per product page")
must(h.count("<div") - h.count("</div>") == 0, "document divs balanced")

if fails:
    print("\n%d FAILED" % len(fails)); sys.exit(1)
SRC.write_text(h, encoding="utf-8")
print("\nprototype patched — 50 ml only")
