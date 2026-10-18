#!/usr/bin/env python3
"""ODYS Parfums — PrestaShop 8/9 theme build, v3.1 -> v5.0.

Takes the shipped odys-theme-ps8 tree and produces the 2026 identity:
  assets/css/theme.css  = existing rules, re-pointed at ODYS design tokens,
                          plus the identity layer and the PrestaShop bindings
  assets/js/app.js      = same behaviour, with the storefront bugs fixed
                          and a progressive-enhancement module appended
  templates/**.tpl      = the partials rewritten for the new design

Nothing in the PrestaShop integration (hooks, Smarty variables, module
wiring, theme.yml asset ids) changes shape.
"""
import re, shutil, sys, pathlib

import strip_flacons

HERE = pathlib.Path(__file__).parent
WS   = HERE.parent
SRC  = WS / "ref" / "odys-theme-ps8"
DIST = WS / "dist" / "odys-theme-ps8"
THEME = DIST / "themes" / "odys"

from nuit_prep import nuit_prep
NUIT = (HERE / "nuit.css").read_text(encoding="utf-8")
MOTION = (HERE / "motion.css").read_text(encoding="utf-8")
report = []
def ok(msg):  report.append(f"  ok  {msg}")
def must(cond, msg):
    if not cond:
        raise SystemExit(f"FAILED: {msg}")
    ok(msg)

# ── 0. Fresh copy of the shipped theme ──────────────────────────────────
# dist/odys-theme-ps8/themes/odys est monte dans le conteneur de recette.
# Supprimer le DOSSIER laissait ce montage accroche a un inode efface :
# la boutique locale continuait de servir la construction precedente, et
# tout ce qu'on y verifiait etait un mensonge tranquille — on relit une
# page, elle est en francais, et on cherche la cause dans le catalogue.
# On vide donc le CONTENU et on garde les dossiers, qui ne coutent rien.
if DIST.parent.exists():
    for _mort in sorted(DIST.parent.rglob("*"), key=lambda q: -len(q.parts)):
        if _mort.is_file() or _mort.is_symlink():
            _mort.unlink()
DIST.parent.mkdir(parents=True, exist_ok=True)
shutil.copytree(SRC, DIST, dirs_exist_ok=True)
ok("theme tree copied from v3.1")

# ═══════════════════════════════════════════════════════════════════════
# 1. theme.css
# ═══════════════════════════════════════════════════════════════════════
css_path = THEME / "assets" / "css" / "theme.css"
css = css_path.read_text(encoding="utf-8")

tokens = (WS / "tokens.css").read_text(encoding="utf-8").strip()
css, n = re.subn(r":root\{--rose:.*?--nav-h:68px\}", lambda m: tokens, css, count=1, flags=re.S)
must(n == 1, "theme.css :root replaced with the ODYS token system")

HEX = {
    "#C4956A": "#B4863D", "#C8A26A": "#B4863D", "#A87845": "#8F6A2F",
    "#E8C9A8": "#C9A66B", "#E8B07A": "#C9A66B", "#F0C070": "#C9A66B",
    "#D5B57A": "#C9A66B", "#B88A44": "#A87A33", "#8F6B32": "#7A5C29",
    "#F3E1AE": "#E4CFA4", "#8B6914": "#7A5C29", "#7A5C10": "#7A5C29",
    "#C8860A": "#B4863D", "#A86A08": "#8F6A2F", "#A06E08": "#8F6A2F",
    "#C8A84B": "#B4863D", "#F5C66B": "#C9A66B", "#E6D7B8": "#E4CFA4",
    "#B9A88F": "#A08F78",
    "#1B2A4A": "#0C1B26", "#16283D": "#0C1B26", "#2D3F62": "#16303F",
    "#2A3F6A": "#16303F", "#233C5A": "#16303F", "#0F1A30": "#0C1B26",
    "#0D1A2B": "#0C1B26", "#0A1628": "#070F16", "#9BC4D4": "#C9A66B",
    "#1A1612": "#111316", "#1B1B1B": "#1A1D21", "#060606": "#111316",
    "#000000": "#111316", "#0A0806": "#111316", "#111": "#111316",
    "#1C1408": "#111316", "#3D2E10": "#2A2118", "#221A0C": "#1A1D21",
    "#1A1208": "#111316", "#130C02": "#111316", "#1A0F03": "#111316",
    "#1A0810": "#0C1B26", "#0A0010": "#070F16", "#8B1A3B": "#111316",
    "#BE185D": "#8F6A2F", "#FDF2F8": "#F5EBDD", "#FBCFE8": "#CDB89E",
    "#FFD6E0": "#E4CFA4", "#FDE": "#F5EBDD",
    "#8B5CF6": "#B4863D", "#4285F4": "#0C1B26", "#4338CA": "#0C1B26",
    "#C7D2FE": "#CDB89E", "#EEF2FF": "#F5EBDD", "#F0F4FF": "#F5EBDD",
    "#F0E8F8": "#F5EBDD", "#0284C7": "#16303F", "#BAE6FD": "#CDB89E",
    "#F0F9FF": "#F5EBDD",
    "#C0392B": "#8A2B20", "#E63946": "#8A2B20", "#DC2626": "#8A2B20",
    "#DC2828": "#8A2B20", "#C00": "#8A2B20", "#FFB3B3": "#E8D6C0",
    "#FFF5F5": "#F5EBDD", "#FEF2F2": "#F5EBDD", "#FECACA": "#CDB89E",
    "#FEE": "#F5EBDD",
    "#FAF8F4": "#F5EBDD", "#F7F2EA": "#F5EBDD", "#FDF8F3": "#F5EBDD",
    "#FDF9F2": "#F5EBDD", "#F9F8F6": "#F5EBDD", "#F7F3EC": "#F5EBDD",
    "#F4F3F0": "#F5EBDD", "#F0EDE9": "#EFE3D2", "#FAFAF9": "#F5EBDD",
    "#F8F7F5": "#F5EBDD", "#F5F4F2": "#F5EBDD", "#FFF8E8": "#F5EBDD",
    "#FFFBF0": "#F5EBDD", "#FFF9F2": "#F5EBDD", "#FFF3CD": "#F5EBDD",
    "#FDE8D4": "#E8D6C0", "#F5F2ED": "#EFE3D2", "#EAE3D8": "#E8D6C0",
    "#EDE8E0": "#E8D6C0", "#EEE5D8": "#EFE3D2", "#E8E3DD": "#CDB89E",
    "#E0D8CE": "#CDB89E", "#856404": "#7A5C29", "#155724": "#2D6A4F",
    "#F0F0F0": "#EFE3D2",
    "#767676": "#756B61", "#7A6E65": "#756B61", "#B0A898": "#A08F78",
    "#999": "#756B61", "#888": "#756B61", "#BBB": "#A08F78", "#CCC": "#CDB89E",
    "#2A9D5C": "#2D6A4F", "#2ED37A": "#2D6A4F", "#5EBF8B": "#2D6A4F",
    "#2EA043": "#2D6A4F", "#059669": "#2D6A4F", "#D4EDDA": "#DCE9E0",
    "#F0FAF4": "#F0F6F1", "#B8DDC8": "#BFD6C6", "#7FD4A8": "#8FBFA5",
    "#160": "#2D6A4F", "#E07A00": "#B4863D", "#F8F4FF": "#F5EBDD",
    "#555": "#756B61", "#FFC83C": "#C9A66B", "#120022": "#0C1B26", "#0D1525": "#0C1B26",
    # kept: #25D366 (WhatsApp) — a real brand mark
}
hits = 0
for old, new in sorted(HEX.items(), key=lambda kv: -len(kv[0])):
    css, c = re.subn(re.escape(old) + r"(?![0-9A-Fa-f])", new, css, flags=re.I)
    hits += c
must(hits > 60, f"{hits} off-palette colour literals remapped in theme.css")

RGB = {
    "196,149,106": "180,134,61", "200,162,106": "180,134,61",
    "200,134,10": "180,134,61", "255,200,60": "201,166,107",
    "255,150,0": "180,134,61", "230,215,184": "228,207,164",
    "26,22,18": "17,19,22", "28,20,8": "17,19,22", "18,14,10": "17,19,22",
    "18,11,3": "17,19,22", "13,8,2": "17,19,22",
    "27,42,74": "12,27,38", "13,20,38": "12,27,38", "10,15,28": "12,27,38",
    "250,248,244": "245,235,221", "247,243,236": "245,235,221",
    "247,242,234": "245,235,221",
    "42,157,92": "45,106,79", "46,160,67": "45,106,79",
    "184,221,200": "191,214,198",
    "220,40,40": "138,43,32", "192,57,43": "138,43,32",
}
rgb_hits = 0
for old, new in RGB.items():
    a, b, c_ = old.split(",")
    pat = re.compile(r"(rgba?\()" + a + r",\s*" + b + r",\s*" + c_ + r"\b")
    css, k = pat.subn(lambda m, nv=new: m.group(1) + nv, css)
    rgb_hits += k
ok(f"{rgb_hits} legacy rgb() triples remapped in theme.css")

# The running shop writes its combined CSS/JS into the theme's assets/cache/.
# That folder is this build's output on a bind mount, so clear it: a build
# should produce the theme, not one shop's minified bundles.
cache_dir = THEME / "assets" / "cache"
if cache_dir.is_dir():
    n_cache = len(list(cache_dir.glob("*")))
    shutil.rmtree(cache_dir, ignore_errors=True)
    ok(f"assets/cache/ cleared ({n_cache} runtime bundle(s) from the running shop)")


identity  = (WS / "identity.css").read_text(encoding="utf-8")
additions = (HERE / "theme-additions.css").read_text(encoding="utf-8")

# One background rule per ambiance photograph that exists. A scent without a
# photo keeps its colour wash rather than requesting a file that 404s on every
# one of its product pages.
amb_photos = sorted((HERE / "img").glob("ambiance-*.webp"))
amb_rules = "\n".join(
    "body[data-ambiance=\"%s\"] .amb-hero{background-image:url('../img/%s')}"
    % (f.stem[len("ambiance-"):], f.name)
    for f in amb_photos)
marker = "/* @odys-ambiance-images"
must(marker in additions, "theme-additions.css carries the ambiance marker")
additions = additions.replace(marker, amb_rules + "\n" + marker, 1)
ok(f"{len(amb_photos)} ambiance photograph(s): "
   + ", ".join(f.stem[len("ambiance-"):] for f in amb_photos))
oud       = (HERE / "oud-theme.css").read_text(encoding="utf-8")

header = (
    "/* ================================================================\n"
    "   ODYS Parfums — PrestaShop Theme CSS v5.0\n"
    "   Champagne #E8D6C0 · Crème #F5EBDD · Noir #111316 · Marine #0C1B26\n"
    "   Or #B4863D · Or doux #C9A66B\n"
    "\n"
    "   Layer order — later layers win, earlier ones stay untouched:\n"
    "     1. Design tokens          (:root, the single source of truth)\n"
    "     2. Base + components      (inherited from v3.1, re-pointed at 1)\n"
    "     3. ODYS identity layer    (the 2026 visual system)\n"
    "     4. PrestaShop bindings    (Smarty class names -> the system)\n"
    "     5. Oud & Boukhour         (body.oud - the smoke-and-amber page)\n"
    "\n"
    "   Fonts: Cormorant Garamond (display) · Playfair Display (editorial)\n"
    "          Jost (body/UI)\n"
    "   ================================================================ */\n\n"
)
css = header + css + "\n" + identity + "\n" + additions + "\n" + oud
css, nuit_counts = nuit_prep(css)
must(nuit_counts["on_dark"] >= 15, f"nuit: {nuit_counts['on_dark']} cream-as-text colours -> --odys-on-dark")
must(nuit_counts["surface"] >= 25, f"nuit: {nuit_counts['surface']} white panels -> --odys-surface")
ok(f"nuit: {nuit_counts['ink_bg']} ink panels kept dark, {nuit_counts['glass']} light glass backgrounds darkened")
# L'or en COULEUR DE TEXTE. Sur l'ivoire, l'or doux donne 2.06:1 : illisible.
# Sur les aplats sombres qui restent (hero, signatures, pied de page), c'est
# l'inverse : l'or profond n'y ressort pas. Plutot que de reprendre 127
# declarations une par une, elles pointent toutes vers un jeton, et les rares
# zones sombres redefinissent ce jeton pour leurs descendants : une propriete
# personnalisee s'herite, donc un seul reglage par zone suffit.
_or_re = re.compile(
    r"color:\s*(?:var\(--(?:odys-gold|rose|odys-sand)\s*(?:,[^()]*)?\)"
    r"|#[Bb]4863[Dd]|#[Cc]9[Aa]66[Bb]|#[Cc]5[Aa]46[Aa]"
    r"|rgba\(\s*201\s*,\s*166\s*,\s*107[^)]*\)|rgba\(\s*180\s*,\s*134\s*,\s*61[^)]*\))"
    r"(?![-\w])")
_n_or = len(_or_re.findall(css))
must(_n_or >= 100, f"or en texte : {_n_or} declarations a rediriger")
css = _or_re.sub("color:var(--odys-gold-text)", css)
ok(f"or en texte : {_n_or} declarations pointent vers --odys-gold-text")

css += "\n/* 6. Nuit - whole site dark, loaded last */\n" + NUIT
css += "\n/* 7. Motion - the bottles */\n" + MOTION
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
# the same exclusion copy appears in the loyalty modal
modal_tpl = THEME / "templates" / "_partials" / "modals.tpl"
modal_tpl.write_text(strip_flacons.fix_loyalty_copy(modal_tpl.read_text(encoding="utf-8")), encoding="utf-8")
ok("Flacons Voyage page: loyalty modal copy cleaned")
css, fl_css_notes = strip_flacons.strip_css(css)
ok("Flacons Voyage page: CSS removed (" + "; ".join(fl_css_notes) + ")")
css_path.write_text(css, encoding="utf-8")
must("body.oud" in css, "Oud smoke-and-amber layer appended (scoped to body.oud)")

# A stylesheet that does not parse fails quietly: the browser skips the rules
# it cannot make sense of and the page simply looks wrong, with nothing in any
# log. This theme shipped for weeks with four @keyframes bodies whose headers
# had been lost when the CSS was split out of the prototype, and the animation
# they were meant to drive silently did nothing. Brace balance and animation
# names are cheap to check and the only way either gets noticed.
def css_is_sound(text):
    probe = re.sub(r"/\*.*?\*/", " ", text, flags=re.S)
    probe = re.sub(r'"(?:[^"\\]|\\.)*"', '""', probe)
    probe = re.sub(r"'(?:[^'\\]|\\.)*'", "''", probe)
    depth = stray = 0
    for ch in probe:
        if ch == "{":
            depth += 1
        elif ch == "}":
            if depth == 0:
                stray += 1
            else:
                depth -= 1
    defined = set(re.findall(r"@keyframes\s+([A-Za-z0-9_-]+)", text))
    used = {n for n in re.findall(r"animation(?:-name)?:\s*([A-Za-z][A-Za-z0-9_-]*)", text)
            if n != "none"}
    return depth, stray, sorted(used - defined)

depth, stray, orphan_anims = css_is_sound(css)
must(depth == 0 and stray == 0,
     f"theme.css parses: braces balanced (depth {depth}, {stray} stray closer(s))")
must(not orphan_anims,
     "theme.css: every animation name resolves to a @keyframes"
     + (f" (missing: {', '.join(orphan_anims)})" if orphan_anims else ""))
ok(f"identity + bindings + oud layer appended ({len(css):,} bytes)")

# ═══════════════════════════════════════════════════════════════════════
# 2. app.js — the storefront bugs the prototype surfaced
# ═══════════════════════════════════════════════════════════════════════
js_path = THEME / "assets" / "js" / "app.js"
js = js_path.read_text(encoding="utf-8")

js, n = re.subn(
    r"window\.prestashop = \{ cart: \{ products: \[\] \}, emit: function\(\) \{\} \};",
    "window.prestashop = { cart: { products: [], products_count: 0 },\n"
    "                        emit: function () {}, on: function () {}, off: function () {},\n"
    "                        urls: { pages: { cart: '/panier', order: '/commande' } } };",
    js, count=1)
must(n == 1, "prestashop fallback stub given on()/off() (it threw without them)")

js, n = re.subn(
    r"setTimeout\(\(\) => document\.getElementById\('loader'\)\.classList\.add\('done'\), 1600\);",
    "setTimeout(function () {\n"
    "    var l = document.getElementById('loader');\n"
    "    if (l) l.classList.add('done');\n"
    "  }, 1600);", js, count=1)
must(n == 1, "loader lookup null-guarded")

js, n = re.subn(r"document\.getElementById\('dTot'\)\.textContent = sum \+ ' DH';",
                "document.getElementById('dTotal').textContent = sum + ' DH';", js, count=1)
must(n == 1, "cart total wired to #dTotal (was #dTot — always null)")

NL = chr(10)

# #dCnt et #dTotal vivent dans le tiroir du panier. Sur une fiche produit ils
# n'existent pas : updateCartBadges() levait donc une TypeError a chaque ajout.
# L'exception remontait jusqu'au .catch du pont, qui rappelait le callback avec
# null — et le pont annoncait « Ce parfum n'a pas pu etre ajoute au panier »
# alors que PrestaShop venait de repondre 200 et que le parfum y etait bien.
# Le client voyait un refus, et son panier se remplissait quand meme.
old_badges = ("  document.getElementById('dCnt').textContent = total + ' article' + (total !== 1 ? 's' : '');" + NL
              + "  const sum = cart.reduce((a, i) => a + i.price * i.qty, 0);" + NL
              + "  document.getElementById('dTotal').textContent = sum + ' DH';")
new_badges = ("  var odysCnt = document.getElementById('dCnt');" + NL
              + "  if (odysCnt) { odysCnt.textContent = total + ' article' + (total !== 1 ? 's' : ''); }" + NL
              + "  const sum = cart.reduce((a, i) => a + i.price * i.qty, 0);" + NL
              + "  var odysTot = document.getElementById('dTotal');" + NL
              + "  if (odysTot) { odysTot.textContent = sum + ' DH'; }")
must(js.count(old_badges) == 1, "panier: found the badge writer")
js = js.replace(old_badges, new_badges, 1)
ok("panier: les compteurs du tiroir ne sont ecrits que s'ils existent")


for short, real in (("dsF", "dsFill"), ("dsV", "dsVal"), ("dsM", "dsMsg")):
    js, n = re.subn(r"document\.getElementById\('" + short + r"'\)",
                    "document.getElementById('" + real + "')", js, count=1)
    must(n == 1, f"free-shipping bar: #{short} -> #{real}")

dup = re.compile(
    r"document\.addEventListener\('click', function\(e\) \{\n"
    r"  const t = e\.target\.closest\('\[data-action\]'\);\n"
    r"  if \(!t\) return;\n\n"
    r"  const action = t\.dataset\.action;\n"
    r"  const code   = t\.dataset\.code;\n\n"
    r"  switch \(action\) \{\n"
    r".*?\n  \}\n\}\);\n", re.S)
js, n = dup.subn(
    "/* Removed in v5.0: duplicate cart delegation. Every action it handled\n"
    "   (chg-item, remove-item, add-to-cart, go-page, open-account) is already\n"
    "   dispatched by the ODYS delegation above, and its bare function calls\n"
    "   were not in scope — each click threw a ReferenceError. */\n", js, count=1)
must(n == 1, "duplicate cart click-delegation removed")

js, n = re.subn(
    r"  const t = document\.getElementById\('annTrack'\);\n"
    r"  if \(t\) \{ const c = t\.innerHTML; t\.innerHTML = c \+ c; \}",
    "  document.querySelectorAll('.ann-track').forEach(function (t) {\n"
    "    const c = t.innerHTML; t.innerHTML = c + c;\n"
    "  });", js, count=1)
must(n == 1, "ticker duplication keyed off .ann-track, not a duplicated id")

# The EAA cart block (aria-hidden, focus in/out, Escape, live count) still
# used the v3.1 drawer names. The drawer is #drawer / .d-close / .dp now, so
# `if (cartDrawer)` was false and the whole block silently never ran.
for old, new, label in (
    ("document.getElementById('cart-drawer')", "document.getElementById('drawer')", "#cart-drawer -> #drawer"),
    ("cartDrawer.querySelector('.cd-close')", "cartDrawer.querySelector('.d-close')", ".cd-close -> .d-close"),
    ("document.querySelectorAll('#cartItems .cart-item')", "document.querySelectorAll('#dItems .dp')", "#cartItems .cart-item -> #dItems .dp"),
):
    js, n = re.subn(re.escape(old), new, js, count=1)
    must(n == 1, f"a11y cart block: {label}")

# The wrappers above patched window.openCart / window.closeCart, but the ODYS
# namespace had already captured the originals, so the cart button bypassed
# them: the drawer opened while still aria-hidden="true". Every open/close
# path toggles #drawer.on, so observe that class instead.
wrap_re = re.compile(
    r"(  if \(cartDrawer\) \{\n)    var origOpen = window\.openCart;.*?(\n  \}\n\n  /\* ── Form validation)",
    re.S)
observer = (
    "    // Every open/close path (openCart/closeCart, ODYS.*, overlay, Escape)\n"
    "    // toggles .on, so follow the class rather than wrapping functions.\n"
    "    new MutationObserver(function () {\n"
    "      var open = cartDrawer.classList.contains('on');\n"
    "      if (cartDrawer.getAttribute('aria-hidden') === (open ? 'false' : 'true')) return;\n"
    "      cartDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');\n"
    "      if (open) {\n"
    "        var closeBtn = cartDrawer.querySelector('.d-close');\n"
    "        if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 80);\n"
    "      } else if (cartBtn && cartDrawer.contains(document.activeElement)) {\n"
    "        cartBtn.focus();\n"
    "      }\n"
    "    }).observe(cartDrawer, { attributes: true, attributeFilter: ['class'] });"
)
js, n = wrap_re.subn(lambda m: m.group(1) + observer + m.group(2), js, count=1)
must(n == 1, "a11y cart block: function wrappers -> class MutationObserver")

# Add to cart. Theme buttons carry data-id-product and are owned by the
# PrestaShop bridge, but three listeners matched them:
#   - the prototype ODYS delegation called addToCart(undefined) -> TypeError;
#   - two copies of the PS bridge each POSTed -> every click added 2.
js, n = re.subn(re.escape("case 'add-to-cart':   ODYS.addToCart(p.code, p.name, Number(p.price), t); break;"),
                "case 'add-to-cart':   if (!p.idProduct) ODYS.addToCart(p.code, p.name, Number(p.price), t); break;  // PS buttons: bridge below",
                js, count=1)
must(n == 1, "add-to-cart: ODYS delegation skips PrestaShop buttons")
dup_re = re.compile(r"  function psAddToCart\(idProduct, idAttr, qty, cb\) \{\n.*?\n  if\(typeof prestashop!=='undefined'\)\{\n    prestashop\.on\('updateCart'.*?\n  \}\n", re.S)
js, n = dup_re.subn("  /* Removed in v5.0: second copy of the PS add-to-cart bridge (and its\n     updateCart listener). Both copies handled every click, so each click\n     POSTed twice and added 2. The bridge above is the one kept. */\n", js, count=1)
must(n == 1, "add-to-cart: duplicate PrestaShop bridge removed")
must(js.count("function psAddToCart(") == 1, "add-to-cart: exactly one psAddToCart")

# The product page's button is data-action="add-prod" with a real
# data-id-product: send it through the PrestaShop bridge instead of the
# prototype's in-page cart, or a live shop never receives the order.
js, n = re.subn(
    re.escape("""var btn = e.target.closest('[data-action="add-to-cart"][data-id-product]');"""),
    """var btn = e.target.closest('[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product], [data-action="add-gift"][data-id-product]');""",
    js, count=1)
must(n == 1, "add-prod: PrestaShop bridge also handles the product page button")

js, n = re.subn(
    re.escape("    case 'add-prod':      ODYS.addProd(); break;"),
    "    case 'add-prod':      if (!p.idProduct) ODYS.addProd(); break;  // PS buttons: bridge below",
    js, count=1)
must(n == 1, "add-prod: prototype handler skips PrestaShop buttons")

# bridge: tolerate a non-JSON cart reply, and always emit updateCart so the
# ps_shoppingcart widget refreshes (see nuit.js).
old_then = """    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (prestashop.emit) prestashop.emit('updateCart', { reason: { idProduct: idProduct }, resp: data });
      if (callback) callback(data);
    })"""
new_then = """    .then(function(r) { return r.text(); })
    .then(function(body) {
      var data = null;
      try { data = JSON.parse(body); } catch (e) { /* PrestaShop may answer HTML; the add still happened */ }
      if (window.prestashop && prestashop.emit) prestashop.emit('updateCart', { reason: { idProduct: idProduct }, resp: data });
      if (callback) callback(data);
    })"""
must(js.count(old_then) == 1, "bridge: found the cart response handler")
js = js.replace(old_then, new_then, 1)
ok("bridge: non-JSON cart replies no longer swallow the updateCart event")

# The updateCart listener has to attach to the real `prestashop` object, but
# app.js installs a stub first and its own execution time varies, so the
# listener sometimes ended up on the stub and the header counter never moved.
# Refresh the widget straight from the bridge as well (nuit.js exposes it).
LF = chr(10)
emit_line = "      if (window.prestashop && prestashop.emit) prestashop.emit('updateCart', { reason: { idProduct: idProduct }, resp: data });"
must(js.count(emit_line) == 1, "bridge: found the updateCart emit")
# ...and wrap the emit: one throwing listener (ps_productcomments does throw
# on a product page, its templates are never rendered here) used to take the
# rest of the chain with it, so the counter never refreshed.
# ...et n'annoncer le changement que s'il a eu lieu. PrestaShop ecoute
# `updateCart` pour afficher SA confirmation « produit ajoute au panier » :
# l'emettre sur un echec donnait au client deux messages contraires — le
# bouton disant « Indisponible » et un bandeau disant « ajoute au panier ».
# Une reponse illisible (HTML au lieu de JSON) compte comme un succes :
# l'ajout a eu lieu, c'est la reponse qui a mal tourne.
js = js.replace(emit_line,
                "      var odysChange = !data || (data.success && !data.hasError" + LF
                + "        && (Number(data.quantity) > 0 || (data.cart && Number(data.cart.products_count) > 0)));" + LF
                + "      if (odysChange) {" + LF
                + "      try {" + LF
                + "  " + emit_line + LF
                + "      } catch (err) { console.warn('an updateCart listener failed:', err); }" + LF
                + "      if (window.odysRefreshCart) window.odysRefreshCart();" + LF
                + "      }", 1)
ok("bridge: refreshes the widget directly, and a throwing listener cannot stop it")
ok("bridge: a failed add no longer triggers PrestaShop's success banner")

# Sans `ajax=1`, PrestaShop AJOUTE bien le produit mais repond avec la page HTML
# du panier : JSON.parse echoue, `resp` reste null, et le bloc de succes ne
# tourne jamais. Le client cliquait, la marchandise entrait dans son panier, et
# rien ne bougeait a l'ecran — il recliquait, ou il partait.
old_body = """        action: 'update',
        add: 1,"""
new_body = """        action: 'update',
        ajax: 1,
        add: 1,"""
must(js.count(old_body) == 1, "bridge: found the cart POST body")
js = js.replace(old_body, new_body, 1)
ok("bridge: the cart POST asks for JSON (ajax=1), not the HTML cart page")

# Et la reponse de PrestaShop 8 porte `success`, pas `hasError` : tester
# l'absence de hasError laissait passer n'importe quelle reponse, y compris un
# echec.
old_test = "        if (resp && !resp.hasError) {"
new_test = "        if (resp && resp.success) {"
must(js.count(old_test) == 1, "bridge: found the success test")
js = js.replace(old_test, new_test, 1)
ok("bridge: success is read from PrestaShop's own `success` flag")

# PrestaShop peut repondre success:true sans rien ajouter : stock
# insuffisant, quantite minimale non atteinte, panier deja transforme en
# commande. Vu sur la boutique de developpement, la reponse etait
# {"success":true, "quantity":0, "cart":{"products":[]}} : le bouton
# affichait « Ajoute ! » sur un panier reste vide. Et l'echec franc ne
# montrait rien du tout — pas de message, pas de bouton qui bouge, le
# client reclique ou s'en va.
#
# Deux ancres courtes plutot qu'un bloc entier : le corps du gestionnaire
# est reecrit par d'autres retouches plus bas, et un bloc complet casserait
# des qu'une seule d'entre elles changerait.
old_cond = "        if (resp && resp.success) {"
new_cond = ("        var odysPlein = resp && resp.cart && Number(resp.cart.products_count) > 0;" + LF
            + "        if (resp && resp.success && !resp.hasError && (Number(resp.quantity) > 0 || odysPlein)) {")
must(js.count(old_cond) == 1, "panier: found the success condition")
js = js.replace(old_cond, new_cond, 1)

old_tail = """          /* PS8 will fire updateCart event — listen for it */
        }"""
new_tail = """          /* PS8 will fire updateCart event — listen for it */
        } else {
          /* Rien n'est entre dans le panier. PrestaShop donne la raison dans
             `errors` ; sans raison, on reste factuel plutot que d'en
             inventer une. */
          var odysRaison = resp && resp.errors ? resp.errors : '';
          if (Array.isArray(odysRaison)) { odysRaison = odysRaison.join(' '); }
          odysRaison = String(odysRaison).replace(/<[^>]*>/g, '').trim();
          if (!odysRaison) { odysRaison = 'Ce parfum n’a pas pu être ajouté au panier.'; }
          if (btn) {
            var odysAvant = btn.textContent;
            btn.classList.add('ko');
            btn.textContent = MOT('panierIndispo');
            setTimeout(function () { btn.classList.remove('ko'); btn.textContent = odysAvant; }, 2600);
          }
          /* Le toast de fidelite n'existe pas sur toutes les pages : la
             raison s'affiche a cote du bouton, ou elle est toujours la.
             role=alert pour qu'un lecteur d'ecran l'annonce sans la
             chercher. */
          var odysZone = btn ? (btn.closest('.cta-row') || btn.parentNode) : null;
          if (odysZone) {
            var odysMsg = odysZone.parentNode.querySelector('.cart-ko');
            if (!odysMsg) {
              odysMsg = document.createElement('p');
              odysMsg.className = 'cart-ko';
              odysMsg.setAttribute('role', 'alert');
              odysZone.parentNode.insertBefore(odysMsg, odysZone.nextSibling);
            }
            odysMsg.textContent = odysRaison;
          } else if (typeof showPtsToast === 'function') {
            showPtsToast(odysRaison);
          }
        }"""
must(js.count(old_tail) == 1, "panier: found the end of the add handler")
js = js.replace(old_tail, new_tail, 1)
ok("panier: a cart that did not change no longer reports success")


# guard: prestashop.on may not exist yet (see the note above)
old_guard = "  if (typeof prestashop !== 'undefined') {"
new_guard = "  if (typeof prestashop !== 'undefined' && typeof prestashop.on === 'function') {"
must(js.count(old_guard) == 1, "guard: found the prestashop.on block")
js = js.replace(old_guard, new_guard, 1)
must("typeof prestashop.on === 'function'" in js, "guard: prestashop.on checked before use")
must(js.count('[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product], [data-action="add-gift"][data-id-product]') == 1, "add-to-cart: one PS click listener, covering the product page and gift buttons")

# Scope. cart / addToCart / openCart / updateCartBadges live inside the ODYS
# IIFE, so code outside it cannot see them: the bridge's
# `typeof addToCart === 'function'` was always false (a successful PS add
# never updated the drawer), and the a11y block wrapped a window.updateCartBadges
# that never existed. Use the public ODYS API; mirror #dCnt for the live count.
for old, new, label in (
    ("if (typeof addToCart === 'function') addToCart('ps-' + idProduct, name, price, btn);",
     "ODYS.addToCart('ps-' + idProduct, name, price, btn);", "bridge success -> ODYS.addToCart"),
    ("} else if (typeof addToCart === 'function') {", "} else {", "bridge fallback guard removed"),
    ("addToCart(btn.dataset.code || 'prod', name, price, btn);",
     "ODYS.addToCart(btn.dataset.code || 'prod', name, price, btn);", "bridge fallback -> ODYS.addToCart"),
):
    js, n = re.subn(re.escape(old), new, js, count=1)
    must(n == 1, f"scope: {label}")
js, fl_notes = strip_flacons.strip_js(js)
ok("Flacons Voyage page: JS removed (" + "; ".join(fl_notes) + ")")
live_re = re.compile(r"  var cartLiveRegion = document\.getElementById\('cartCount'\);\n  var origUpdateBadges = window\.updateCartBadges;\n  window\.updateCartBadges = function \(\) \{.*?\n  \};\n", re.S)
# Ce bloc annoncait le nombre d'articles aux lecteurs d'ecran. Il lisait
# #dCnt, que seul le panier de la maquette ecrivait, et parlait a #cartCount
# en posant une etiquette « Ouvrir le panier — » sur #cartBtn. Aucun des
# trois n'est dans un gabarit livre : il n'y avait rien a annoncer, rien pour
# l'entendre, et la phrase etait en francais pour les trois langues. Le vrai
# compte vit dans le tiroir de PrestaShop (tiroir_panier.js).
live_new = ""
js, n = live_re.subn(lambda m: live_new, js, count=1)
must(n == 1, "scope: le bloc qui miroitait #dCnt est retire")
must("typeof addToCart" not in js and "window.updateCartBadges" not in js, "scope: no dead guards or wrappers left")

js += """

/* ══════════════════════════════════════════════════════════════════════
   ODYS 2026 — progressive enhancement
   Sticky-header state and the luxury scroll reveal. Layout and behaviour
   do not depend on this: if it never runs the page still renders and
   works exactly as before.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('stuck', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var targets = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    for (var i = 0; i < targets.length; i++) targets[i].classList.add('in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
})();
"""
js += (HERE / "nuit.js").read_text(encoding="utf-8")
js += (HERE / "motion.js").read_text(encoding="utf-8")
js += (HERE / "zoom.js").read_text(encoding="utf-8")
must(js.count("zoomDlg") >= 1, "zoom.js appended: the photo viewer")
must(js.count("odys-tilt-inner") >= 1, "motion.js appended: reveal, tilt, parallax")
must(js.count("nvQuiz") == 1, "nuit.js appended: family deep links + quiz dialog")
# The QA panel and the analytics to-do list are demo rows lifted from the
# prototype; they still advertised sizes the shop does not sell.
for _old, _new, _what in (
    ("Icône 60ml depuis la page produit", "Icône 50ml depuis la page produit",
     "QA checklist row"),
    ("Tester les prix du format 20ml (29 DH → 25 DH)",
     "Tester les prix du Duo Classique (411 DH → 399 DH)", "analytics to-do row"),
):
    js, n = js.replace(_old, _new), js.count(_old)
    must(n == 1, f"app.js: 50 ml only in the {_what}")

# pickVol tenait le volume pour un nombre - parseInt('Coffret 3 x 50 ml') vaut
# 3 - et ne disait rien au bouton d'ajout, qui postait donc toujours la
# declinaison par defaut quel que soit le format clique.
OLD_PICKVOL = """  const vol   = parseInt(btn.dataset.vol);
  const price = parseInt(btn.dataset.price);"""
NEW_PICKVOL = """  if (btn.disabled) { return; }
  // le libelle vient de l'attribut et s'affiche tel quel
  const vol   = btn.dataset.vol || '';
  const price = parseInt(btn.dataset.price, 10) || 0;
  // ce que le panier recevra : la declinaison que porte la carte choisie
  const addB  = document.getElementById('addBtn');
  if (addB && btn.dataset.idProductAttribute) {
    addB.dataset.idProductAttribute = btn.dataset.idProductAttribute;
  }"""
js, n = js.replace(OLD_PICKVOL, NEW_PICKVOL), js.count(OLD_PICKVOL)
must(n == 1, "pickVol: the chosen format is what goes in the cart")

for _old, _new, _what in (
    ("  selVol   = vol;",
     "  selVol   = parseInt(vol, 10) || selVol;",
     "pickVol: selVol stays a number"),
    ("  if (lv) lv.textContent = '· Format ' + vol + 'ml';",
     "  if (lv) lv.textContent = '· ' + vol;",
     "pickVol: the live line prints the format's own label"),
    ("    if (lbl) lbl.textContent = 'Ajouter au Panier · ' + vol + 'ml';",
     "    if (lbl) lbl.textContent = 'Ajouter au Panier · ' + vol;",
     "pickVol: the cart button prints the format's own label"),
    ("""  document.querySelectorAll('.vc').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');""",
     """  document.querySelectorAll('.vc').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-checked', 'false');
  });
  btn.classList.add('on');
  btn.setAttribute('aria-checked', 'true');""",
     "pickVol: aria-checked follows the selection"),
):
    js, n = js.replace(_old, _new), js.count(_old)
    must(n == 1, _what)


OLD_FILTERFAM = """function filterFam(btn, fam) {
  const container = btn.closest('.sec, .page') || document;
  container.querySelectorAll('.ff').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const grids = container.querySelectorAll('#featGrid, #collGrid');
  grids.forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      if (fam === 'all' || pc.dataset.fam.includes(fam)) pc.style.display = '';
      else { pc.style.display = 'none'; }
    });
  });
}"""
NEW_FILTERFAM = """function filterFam(btn, fam) {
  // le groupe auquel appartient le bouton, pas une classe que la page ne
  // porte pas : .closest('.sec, .page') retombait toujours sur document
  const group = btn.closest('.fam-filters');
  (group || document).querySelectorAll('.ff').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');   // seule .on bougeait avant,
  });                                          // un lecteur d'ecran lisait
  btn.classList.add('on');                     // toujours « Tout » actif
  btn.setAttribute('aria-pressed', 'true');

  odysFiltres();
}

// L'accueil porte deux rangees de boutons : les onglets (parfums, oud,
// diffuseurs) et les familles olfactives. Chacune filtrait la grille pour
// son compte, donc la derniere cliquee effacait l'autre. Les deux etats
// sont lus ici, sur les boutons eux-memes, et appliques ensemble.
function filterOnglet(btn, onglet) {
  var groupe = btn.closest('.og-onglets');
  (groupe || document).querySelectorAll('.og').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('on');
  btn.setAttribute('aria-pressed', 'true');
  odysFiltres();
}

function odysFiltres() {
  var fam = document.querySelector('.fam-filters .ff.on');
  var ong = document.querySelector('.og-onglets .og.on');
  fam = fam ? (fam.dataset.fam || 'all') : 'all';
  ong = ong ? (ong.dataset.onglet || 'all') : 'all';

  var restants = 0;
  document.querySelectorAll('#featGrid, #collGrid').forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      var garde = (fam === 'all' || pc.dataset.fam.indexOf(fam) !== -1)
               && (ong === 'all' || (pc.dataset.onglet || '') === ong);
      pc.style.display = garde ? '' : 'none';
      if (garde) { restants += 1; }
    });
  });

  // Sans ceci la grille tombe a zero pixel et la boutique parait vide.
  var vide = document.getElementById('collEmpty');
  if (vide) { vide.hidden = (restants > 0); }
  var rien = document.getElementById('accVide');
  if (rien) { rien.hidden = (restants > 0); }
}"""
js, n = js.replace(OLD_FILTERFAM, NEW_FILTERFAM), js.count(OLD_FILTERFAM)
must(n == 1, "filter: the empty result is announced, aria-pressed follows")

# filterOnglet doit etre joignable : la maquette n'exporte et ne branche que
# filterFam. Sans ces deux lignes, le clic sur un onglet ne fait rien.
_old_exp = "  filterFam, qPick,"
_new_exp = "  filterFam, filterOnglet, qPick,"
js, n = js.replace(_old_exp, _new_exp), js.count(_old_exp)
must(n == 1, "onglets: filterOnglet est exporte avec filterFam")

_old_case = "    case 'filter-fam':    ODYS.filterFam(t, p.fam); break;"
_new_case = _old_case + LF + "    case 'filter-onglet': ODYS.filterOnglet(t, p.onglet); break;"
js, n = js.replace(_old_case, _new_case), js.count(_old_case)
must(n == 1, "onglets: le clic sur un onglet atteint filterOnglet")

# Le bandeau du bas (« X — ajoute au panier ») se declenchait AU CLIC,
# avant toute reponse du serveur : un parfum en rupture l'affichait quand
# meme, pendant que le bouton disait « Indisponible ». Il part maintenant
# d'ici, une fois PrestaShop d'accord. Pose en dernier, apres toutes les
# retouches du gestionnaire, pour s'ancrer sur sa forme finale.
old_toast = "          ODYS.addToCart('ps-' + idProduct, name, price, btn);"
new_toast = ("          /* Le tiroir montre ce que PrestaShop vient de confirmer. */" + LF
             + "          if (window.odysTiroirApresAjout) { window.odysTiroirApresAjout(resp); }" + LF
             + old_toast + LF
             + "          /* Le bandeau du bas, maintenant que PrestaShop a confirme. */" + LF
             + "          if (window.odysToast) {" + LF
             + "            window.odysToast(String(name || 'Article').trim().slice(0, 48) + ' \u2014 ajout\u00e9 au panier');" + LF
             + "          }" + LF
             + "          /* Le refus precedent n a plus lieu d etre : un" + LF
             + "             message d erreur qui survit a un ajout reussi" + LF
             + "             devient un mensonge au coup suivant. */" + LF
             + "          var odysVieux = document.querySelector('.cart-ko');" + LF
             + "          if (odysVieux) { odysVieux.remove(); }")
must(js.count(old_toast) == 1, "panier: found the confirmed-success branch")
js = js.replace(old_toast, new_toast, 1)
ok("panier: the bottom banner waits for PrestaShop to confirm")

# Les deux fenetres de maquette (compte et commande) ont quitte
# modals.tpl : leur formulaire n'authentifiait personne et leur
# inscription ne creait rien. Le script qui les ouvrait reste en place
# mais ne trouve plus ses elements : sans garde, il lancerait une erreur
# au premier appel. Et les identifiants de demonstration n'ont rien a
# faire dans une page publique.
for _fn, _el in (("function openAccount() {", "accModal"),
                 ("function openCheckout() {", "coModal")):
    must(js.count(_fn) == 1, "maquette: found " + _fn)
    js = js.replace(_fn, _fn + LF
                    + "  /* fenetre de maquette retiree du theme : voir modals.tpl */" + LF
                    + "  if (!document.getElementById('" + _el + "')) { return; }", 1)
ok("maquette: les fenetres retirees ne peuvent plus lever d'erreur")

# La ligne porte une sequence echappee et un accent : on la vise par
# motif plutot que de la reecrire a l'identique.
_mdemo = re.search(r"^.*alert\('Email ou mot de passe incorrect\..*demo@odys\.ma.*$",
                   js, re.M)
must(_mdemo is not None, "maquette: found the demo credentials alert")
js = js.replace(_mdemo.group(0),
                "    alert('Email ou mot de passe incorrect.');", 1)
ok("maquette: les identifiants de demonstration ne sont plus dans la page")

# Le couple en dur que testait doLogin() est devenu du code mort, mais il
# restait lisible dans la source publique. On le remplace par une valeur
# qu'on ne peut pas saisir.
js = js.replace("'demo@odys.ma'", "'(retire)'").replace("'odys2026'", "'(retire)'")
js = js.replace('demo@odys.ma / odys2026', 'compte de demonstration retire')
must('demo@odys.ma' not in js, 'maquette: no demo credentials left in app.js')
ok('maquette: plus aucun identifiant de demonstration dans la page')

# « Offrir a quelqu'un » emprunte le meme chemin que l'achat ; ce qui le
# distingue tient en une intention, retenue le temps du tunnel. A l'etape de
# livraison la case cadeau est cochee pour le client, et le champ du message
# s'ouvre tout seul — il n'a rien a chercher. Il peut toujours la decocher :
# l'intention est consommee au premier passage et ne revient pas.
# Ces deux lignes se retrouvent dans d'autres gestionnaires : on s'ancre
# sur le selecteur qui les precede, lui unique.
old_gift = ("""    var btn = e.target.closest('[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product], [data-action="add-gift"][data-id-product]');""" + NL
            + "    if (!btn) return;" + NL + "    e.preventDefault();")
new_gift = (old_gift + NL
            + "    if (btn.dataset.action === 'add-gift') {" + NL
            + "      try { sessionStorage.setItem('odysCadeau', '1'); } catch (err) {}" + NL
            + "    }")
must(js.count(old_gift) == 1, "cadeau: found the add handler head")
js = js.replace(old_gift, new_gift, 1)
ok("cadeau: le bouton Offrir retient son intention")

js += """

/* ══════════════════════════════════════════════════════════════════════
   OFFRIR — l'intention suit le client jusqu'a l'etape de livraison

   Rien ici ne conditionne la vente : sans script, le parfum entre au
   panier par le meme pont et la case cadeau reste a cocher a la main,
   la ou elle a toujours ete.
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var caseCadeau = document.getElementById('input_gift');
  if (!caseCadeau) { return; }
  var veut = false;
  try { veut = sessionStorage.getItem('odysCadeau') === '1'; } catch (e) { return; }
  if (!veut) { return; }
  /* consommee au premier passage : decocher doit tenir */
  try { sessionStorage.removeItem('odysCadeau'); } catch (e) {}
  if (!caseCadeau.checked) {
    caseCadeau.checked = true;
    caseCadeau.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
"""
ok("cadeau: la case est cochee d'avance pour qui est venu par Offrir")

# Et la cause structurelle, pas seulement celle-ci : le verdict d'un ajout
# appartient au serveur. Tant que le callback s'executait DANS la chaine de
# promesses, la moindre erreur d'affichage retombait dans son .catch et se
# transformait en « ajout refuse ». On l'en sort : une panne d'interface se
# voit dans la console, elle ne dement plus le panier.
old_cb = "      if (callback) callback(data);"
new_cb = ("      if (callback) {" + NL
          + "        /* Le serveur a repondu : son verdict est pose. Ce qui casse" + NL
          + "           ensuite dans l'affichage ne doit pas le contredire. */" + NL
          + "        try { callback(data); }" + NL
          + "        catch (err) { console.warn('affichage du panier :', err); }" + NL
          + "      }")
must(js.count(old_cb) == 1, "panier: found the bridge callback")
js = js.replace(old_cb, new_cb, 1)
ok("panier: une erreur d'affichage ne fait plus passer un ajout reussi pour un echec")

# ── Les fenetres du module d'avis ──────────────────────────────────────
# productcomments est le module officiel : il tient la liste, le formulaire,
# la moderation et le RGPD. Mais il ouvre ses fenetres avec $(x).modal(),
# une extension de Bootstrap — et ce theme ne charge pas Bootstrap
# (use_parent_assets: false). Resultat : aucune fenetre ne s'ouvrait, et
# comme .modal{display:none} n'existait pas non plus, les quatre fenetres se
# deroulaient en clair au bas de la fiche produit (« Votre avis ne peut pas
# etre envoye », « Signaler le commentaire »...).
#
# Vingt lignes rendent le module utilisable, plutot que de recopier ses six
# gabarits dans le theme — une copie qu'il faudrait suivre a chaque mise a
# jour de PrestaShop.
SHIM_MODAL = LF + LF.join([
    "",
    "/* ── Fenetres du module d'avis (sans Bootstrap) ── */",
    "(function () {",
    "  var $ = window.jQuery;",
    "  if (!$ || $.fn.modal) { return; }   /* Bootstrap present : on se tait */",
    "",
    "  function montre(el, ouvert) {",
    "    el.classList.toggle('odys-modal-on', ouvert);",
    "    el.setAttribute('aria-hidden', ouvert ? 'false' : 'true');",
    "    document.body.classList.toggle('odys-modal-ouvert',",
    "      !!document.querySelector('.modal.odys-modal-on'));",
    "    if (ouvert) {",
    "      var premier = el.querySelector('input, textarea, button, [href]');",
    "      if (premier) { try { premier.focus(); } catch (e) {} }",
    "    }",
    "  }",
    "",
    "  $.fn.modal = function (ordre) {",
    "    return this.each(function () { montre(this, ordre !== 'hide'); });",
    "  };",
    "",
    "  /* Bootstrap ferme aussi sur la croix, sur le fond et sur Echap. */",
    "  document.addEventListener('click', function (e) {",
    "    var fermeur = e.target.closest('[data-dismiss=\"modal\"]');",
    "    if (fermeur) {",
    "      var f = fermeur.closest('.modal');",
    "      if (f) { montre(f, false); }",
    "      return;",
    "    }",
    "    if (e.target.classList && e.target.classList.contains('modal')) {",
    "      montre(e.target, false);",
    "    }",
    "  });",
    "  document.addEventListener('keydown', function (e) {",
    "    if (e.key !== 'Escape') { return; }",
    "    document.querySelectorAll('.modal.odys-modal-on').forEach(function (f) {",
    "      montre(f, false);",
    "    });",
    "  });",
    "})();",
    "",
])
must(SHIM_MODAL not in js, "avis: le pont vers les fenetres n'est pose qu'une fois")
js = js + SHIM_MODAL
ok("avis: les fenetres du module officiel s'ouvrent sans Bootstrap")


# Le tiroir du panier. Il vit dans son propre fichier parce qu'il parle a
# PrestaShop, pas a la maquette : psbuild/tiroir_panier.js.
_tiroir = (HERE / 'tiroir_panier.js').read_text(encoding='utf-8')
must(_tiroir not in js, 'tiroir: le module du panier n est ajoute qu une fois')
js = js + LF + _tiroir
ok('tiroir: le panier s ouvre sur le cote avec le contenu du serveur')


# ─── app.js parle les trois langues ──────────────────
# Un .js est servi tel quel : aucune de ses phrases ne pouvait etre
# traduite, et la boutique anglaise disait encore « Ajouter au Panier ».
# Le gabarit les pose maintenant dans window.odysMots ; ici, chaque
# phrase ecrite en dur devient une lecture du dictionnaire. Le francais
# reste en repli dans MOT.FR : rien ne devient muet s il manque.
_AIDE_MOTS = "\n/* ─── Les phrases traduites ──────────────────────────────────────────\n   Un .js est servi tel quel : les memes octets pour les trois langues.\n   C'est pourquoi la boutique anglaise disait encore « Ajouter au\n   Panier » — la phrase n'etait pas dans un gabarit, elle etait ici.\n\n   Le gabarit les depose donc, deja traduites, dans window.odysMots\n   (voir layouts/layout-full-width.tpl), et on les lit par leur cle.\n   Sans dictionnaire — page servie par un autre gabarit, bloc absent —\n   MOT rend le francais : la boutique parle francais au lieu de se\n   taire. La declaration est hissee, sa place dans le fichier n'a donc\n   pas d'importance. */\nfunction MOT(cle) {\n  var d = window.odysMots;\n  if (d && typeof d[cle] === 'string' && d[cle]) { return d[cle]; }\n  return MOT.FR[cle] || cle;\n}\nMOT.FR = {\n%s\n};\n"
# Le repli francais de MOT() est lu DANS le gabarit : le dictionnaire du
# gabarit est la seule source. Une phrase ajoutee la-bas arrive donc ici
# sans qu on y pense, et ne peut pas rester muette.
_layout_src = (HERE / 'templates' / 'layouts' / 'layout-full-width.tpl').read_text(encoding='utf-8')
_dico_deb = _layout_src.index('window.odysMots = {')
_dico_src = _layout_src[_dico_deb:_layout_src.index('};', _dico_deb)]
_paires = re.findall(
    r'"(\w+)": "\{l s=' + chr(39) + r'(.*?)' + chr(39) + r" d='Shop\.Theme\.Odys'",
    _dico_src)
must(len(_paires) >= 10, 'mots: le dictionnaire du gabarit est lisible')

# chaque apostrophe doit porter un antislash : {l s='...'} se terminerait
# dessus, et comme ces lignes sont engendrees, rien ne le dirait avant la
# page blanche. Le meme echappement convient a une chaine JS a apostrophes,
# donc la phrase se recopie telle quelle.
_mauvaises = [c for c, fr in _paires
              if chr(39) in fr.replace(chr(92) + chr(39), '')]
must(not _mauvaises,
     'mots: apostrophe non echappee dans le dictionnaire -> ' + str(_mauvaises))

_aide_mots = ("\n" + _AIDE_MOTS
              % ",\n".join("  '%s': '%s'" % (c, fr) for c, fr in _paires))
must(_aide_mots not in js, 'mots: l aide n est posee qu une fois')
_apres = js.index('*/') + 2
js = js[:_apres] + _aide_mots + js[_apres:]

_mots_remplaces = 0
for _vieux, _neuf in [
    ("'✓ Livraison gratuite incluse'",
     "'✓ ' + MOT('livraisonIncluse')"),
    ("'\\u2713 Livraison gratuite incluse'",
     "'\\u2713 ' + MOT('livraisonIncluse')"),
    ("'+ ' + remaining + ' DH → Livraison gratuite'",
     "MOT('livraisonReste').replace('%montant%', remaining)"),
    ("'+ ' + left + ' DH \\u2192 Livraison gratuite'",
     "MOT('livraisonReste').replace('%montant%', left)"),
    ("'Ajouter au Panier · ' + vol",
     "MOT('panierAjouter') + ' · ' + vol"),
    ("'Ajouter au Panier \\u00b7 ' + grams",
     "MOT('panierAjouter') + ' \\u00b7 ' + grams"),
    ("added ? '♥ Enregistré dans mes envies' : '♡ Ajouter à mes envies'",
     "added ? '♥ ' + MOT('enviesEnregistre') : '♡ ' + MOT('enviesAjouter')"),
    ('aria-label="Retirer \'\n      + wishEscape(it.name) + \' de mes envies">Retirer</button></li>\'',
     'aria-label="\'\n      + wishEscape(MOT(\'enviesRetirer\').replace(\'%nom%\', it.name))\n      + \'">\' + wishEscape(MOT(\'retirer\')) + \'</button></li>\''),
    ("String(name || 'Article').trim().slice(0, 48) + ' — ajouté au panier'",
     "MOT('panierAjoute').replace('%nom%',\n              String(name || MOT('article')).trim().slice(0, 48))"),
    ("'Ce parfum n’a pas pu être ajouté au panier.'",
     "MOT('panierEchec')"),
    ("open ? 'Ouvrir le menu de navigation' : 'Fermer le menu de navigation'",
     "MOT(open ? 'menuOuvrir' : 'menuFermer')"),
    ("open ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation'",
     "MOT(open ? 'menuFermer' : 'menuOuvrir')"),
    ("'Retirer un exemplaire de ' + prod.name",
     "MOT('exemplaireRetirer').replace('%nom%', prod.name)"),
    ("'Ajouter un exemplaire de ' + prod.name",
     "MOT('exemplaireAjouter').replace('%nom%', prod.name)"),
    ("'Retirer ' + prod.name + ' du panier'",
     "MOT('panierRetirer').replace('%nom%', prod.name)"),
    # wishToggle() traduisait son libelle, wishRestore() non : au clic le
    # bouton de la fiche disait « Saved to my wishlist », et au
    # rechargement suivant « Enregistre dans mes envies ». La meme
    # phrase, deux fois ecrite, une seule fois traduite.
    ("btn.textContent = full ? '♥ Enregistré dans mes envies' : '♥';",
     "btn.textContent = full ? '♥ ' + MOT('enviesEnregistre') : '♥';"),
    # Le hamburger : l'echappee du premier bloc a11y reposait l'etiquette
    # en francais. Le second bloc du menu la reecrit traduite dans le meme
    # evenement, donc personne ne la voyait — mais elle est fausse, et
    # c'est l'ordre d'enregistrement des ecouteurs qui la cache.
    ("hamBtn.setAttribute('aria-label', 'Ouvrir le menu de navigation');",
     "hamBtn.setAttribute('aria-label', MOT('menuOuvrir'));"),
]:
    # le libelle du rapport est l indice, pas la phrase : la console
    # Windows ne sait pas ecrire les caracteres qu elle contient
    _mots_remplaces += 1
    must(js.count(_vieux) == 1,
         'mots: phrase %d sur %d a remplacer' % (_mots_remplaces, 17))
    js = js.replace(_vieux, _neuf)
must(_mots_remplaces == 17,
     'mots: les 17 phrases vivantes d app.js sont traduisibles')
ok(f'mots: {_mots_remplaces} phrases d app.js lisent le dictionnaire du gabarit')


# ─── le prototype mort ────────────────────────────────────────────────
# app.js vient d'un prototype HTML monopage. Des pans entiers ne
# s'accrochent a rien dans PrestaShop : leur conteneur n'existe dans aucun
# gabarit livre, donc la fonction qui les monte sort sur son premier
# `if (!el) return;`. Ils pesaient pourtant dans le fichier servi a chaque
# page, et deux d'entre eux y promenaient des PRIX INVENTES (219 a 249 DH)
# et des images unsplash.com.
#
# Chaque pan ci-dessous a ete prouve mort trois fois : son conteneur absent
# de tout gabarit, son `data-action` absent de tout gabarit, et le DOM d'une
# page reellement servie (document.getElementById(...) === null).
#
# Ce qui RESTE, et pourquoi :
#   * showPtsToast : #ptsToast existe dans modals.tpl, et le pont d'ajout
#     au panier s'en sert pour dire pourquoi un ajout a echoue ;
#   * openAccount / closeAccount : reduits a rien, mais gardes. Le bouton
#     « Mon compte » que ce fichier injecte dans l'en-tete porte
#     data-action="open-account" ; retirer la fonction ferait lever une
#     TypeError au clic. Le bouton n'ouvre rien aujourd'hui non plus — ce
#     n'est pas a cette passe de decider s'il doit disparaitre ;
#   * closeNotes : data-action="close-notes" existe, lui ;
#   * le panier du prototype, le quiz, les envies, updateShip et consorts :
#     vivants ou appeles par du vivant. On ne touche pas.

def _sur(condition, plainte):
    """Arreter la construction si la condition est fausse, sans rien dire
    quand elle est vraie.

    must() reaffiche son message en cas de SUCCES. Pour une garde interne
    formulee comme un echec — « la fonction anTab est introuvable » — le
    rapport annoncait donc le contraire de ce qui venait de se passer, et
    soixante lignes de bruit par-dessus. Ici le message ne sort que quand il
    est vrai.
    """
    if not condition:
        raise SystemExit('FAILED ' + plainte)


def _js_equilibre(txt, depart):
    """La fin du bloc ouvert apres `depart` : accolades et crochets.

    Les accolades d'une chaine ou d'un commentaire ne comptent pas. Sans
    ce masquage, un `${...}` de gabarit ou un `/* } */` deplacerait la
    fin du bloc et couperait le fichier n'importe ou.
    """
    i, n = depart, len(txt)
    prof, demarre = 0, False
    while i < n:
        c = txt[i]
        if c == "/" and i + 1 < n and txt[i + 1] == "/":
            i = txt.find(chr(10), i)
            if i == -1:
                return n
            continue
        if c == "/" and i + 1 < n and txt[i + 1] == "*":
            j = txt.find("*/", i + 2)
            i = n if j == -1 else j + 2
            continue
        if c in "'\"" + chr(96):
            quote, j = c, i + 1
            while j < n:
                if txt[j] == chr(92):
                    j += 2
                    continue
                if txt[j] == quote:
                    j += 1
                    break
                if quote != chr(96) and txt[j] == chr(10):
                    break
                j += 1
            i = j
            continue
        if c in "{[":
            prof += 1
            demarre = True
        elif c in "}]":
            prof -= 1
            if demarre and prof <= 0:
                return i + 1
        i += 1
    return n


def _js_retirer_fonction(js, nom):
    """Retirer `function nom(...) { ... }`, corps compris."""
    marque = "function " + nom + "("
    i = js.find(marque)
    _sur(i != -1, "retrait: la fonction " + nom + " est introuvable")
    _sur(js.find(marque, i + 1) == -1,
         "retrait: la fonction " + nom + " est declaree deux fois")
    # remonter au debut de sa ligne, pour emporter l'indentation
    deb = js.rfind(chr(10), 0, i) + 1
    # Sauter la liste des parametres AVANT d equilibrer le corps. Une valeur
    # par defaut comme opts={} ouvre et referme une accolade des la
    # signature : l equilibrage s y arretait, la coupe emportait la seule
    # premiere ligne et laissait le corps orphelin derriere un ) { tout seul.
    # node --check l a vu ; le rapport de construction, non.
    _prof, _j = 0, js.index("(", i)
    while _j < len(js):
        if js[_j] == "(":
            _prof += 1
        elif js[_j] == ")":
            _prof -= 1
            if _prof == 0:
                break
        _j += 1
    _sur(_prof == 0, "retrait: parametres de " + nom + " mal fermes")
    fin = _js_equilibre(js, _j)
    # et la fin de ligne qui suit
    if fin < len(js) and js[fin] == ";":
        fin += 1
    if fin < len(js) and js[fin] == chr(10):
        fin += 1
    return js[:deb] + js[fin:]


def _js_retirer_donnee(js, declaration):
    """Retirer `const X = [...];` ou `let X = {...};`, valeur comprise.

    Une declaration sans crochet ni accolade — `let a = 0, b = null;` — n'a
    rien a equilibrer : elle finit a son point-virgule. Sans ce cas,
    l equilibrage cherchait une fermeture jusqu a la fin du fichier et
    emportait tout ce qui suivait.
    """
    i = js.find(declaration)
    _sur(i != -1, "retrait: la donnee " + declaration + " est introuvable")
    deb = js.rfind(chr(10), 0, i) + 1
    _pv = js.find(";", i)
    _ouvre = min([p for p in (js.find("{", i), js.find("[", i)) if p != -1]
                 or [len(js)])
    if _pv != -1 and _pv < _ouvre:
        fin = _pv
    else:
        fin = _js_equilibre(js, i)
    if fin < len(js) and js[fin] == ";":
        fin += 1
    if fin < len(js) and js[fin] == chr(10):
        fin += 1
    return js[:deb] + js[fin:]


def _js_retirer_exact(js, bout, combien=1):
    """Retirer un morceau precis, en exigeant son nombre d'occurrences."""
    n = js.count(bout)
    _sur(n == combien,
         "retrait: %d occurrence(s) au lieu de %d pour %r"
         % (n, combien, bout[:58]))
    return js.replace(bout, "")


def _js_retirer_api(js, noms):
    """Retirer des noms du `return { ... }` de l'IIFE ODYS.

    Un nom oublie ici cite une fonction disparue : l'IIFE leve une
    ReferenceError a l'evaluation et le script entier ne tourne pas.
    """
    _marque = chr(10) + "return {" + chr(10)
    _sur(js.count(_marque) == 1,
         "retrait: un seul return { au premier niveau (l API publique)")
    deb = js.index(_marque) + 1
    fin = js.index("};", deb)
    bloc = avant = js[deb:fin]
    for nom in noms:
        for variante in (" " + nom + ",", nom + ", ", nom + ",", nom):
            if variante in bloc:
                bloc = bloc.replace(variante, " " if variante.startswith(" ") else "", 1)
                break
        _sur(not re.search(r"(?<![\w$.])" + re.escape(nom) + r"(?![\w$])", bloc),
             "retrait: " + nom + " reste dans l API publique")
    _sur(bloc != avant, "retrait: l API publique n a pas bouge")
    # des virgules et des lignes vides restent : on les range
    bloc = re.sub(r",\s*,", ",", bloc)
    bloc = re.sub(r"\n[ \t]*,", ",", bloc)
    bloc = re.sub(r"\n[ \t]*\n", chr(10), bloc)
    bloc = re.sub(r",(\s*)$", r"\1", bloc)
    return js[:deb] + bloc + js[fin:]


_av = len(js)

# ── 1. le tableau de bord d'analytique simule
#    Monte par un DOMContentLoaded garde par #pg-analytics, absent de tout
#    gabarit. Il portait aussi une invite pour une API de modele de langage
#    et des chiffres de vente inventes.
for _f in ("anTab", "anChangePeriod", "getCurrentTab", "anRenderTab",
           "anRenderOverview", "anRenderSEO", "anRenderProducts",
           "anRenderMarketing", "anRenderCustomers", "anRenderAI",
           "anAddMessage", "anQuick", "anRunAI",
           # anSendChat n a qu un appelant, anQuick, retire juste
           # au-dessus ; anGenerateReport n est appele que par un
           # onclick ecrit dans le HTML que anRenderMarketing
           # fabriquait. Aucun gabarit ne les nomme et
           # #anChatInput n existe nulle part.
           "anSendChat", "anGenerateReport",
           "drawLineChart", "drawBarChart", "drawDonutChart"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "const AN_DATA = {")
js = _js_retirer_donnee(js, "const AN_SYSTEM_PROMPT = ")
js = _js_retirer_donnee(js, "let anChatHistory = [")
js = _js_retirer_donnee(js, "let chartsDrawn = {")
ok("retrait: le tableau de bord d analytique simule")

# ── 2. le panneau de recette de 74 tests manuels
#    « DevTools -> Elements », « Console : taper ODYS ». Monte sur
#    #reviewSections, absent de tout gabarit.
js = _js_retirer_fonction(js, "initReview")
js = _js_retirer_fonction(js, "rvCheck")
js = _js_retirer_donnee(js, "const REVIEW_SECTIONS = [")
js = _js_retirer_donnee(js, "let rvChecked = {")
js = _js_retirer_exact(
    js, "document.addEventListener('DOMContentLoaded', () => { initReview(); });\n")
ok("retrait: le panneau de recette de 74 tests")

# ── 3. le carrousel en ligne du prototype (#iSuggTrack, absent)
for _f in ("initInlineSugg", "getISCVisible", "iSuggGoTo", "iSuggScroll",
           "updateISCNav", "startISCAutoplay", "stopISCAutoplay",
           "resetISCAutoplay"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "let iSuggOffset = 0, iSuggTimer = null;")
js = _js_retirer_donnee(js, "const ISC_W = 132, ISC_CYCLE = 3500;")
ok("retrait: le carrousel en ligne du prototype")

# ── 4. les suggestions et le « souvent achetes ensemble » du prototype
#    SUGG_DB portait des parfums inventes, a des prix inventes, avec des
#    images unsplash.com. initSuggestions ne peignait pas par-dessus les
#    vrais produits parce que PrestaShop remplit #suggTrack avant lui — et
#    parce que ce noeud n'existe que dans un {if $accessories}. Le fichier
#    servi promenait quand meme ces prix.
for _f in ("initSuggestions", "initFBT",
           "toggleFBT", "updateFBTTotal", "addFBT", "initUpsellStrip",
           "initViewingNow"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "const SUGG_DB = [")
js = _js_retirer_donnee(js, "const FBT_BUNDLES = {")
js = _js_retirer_donnee(js, "let fbtSelected = new Set();")
# suggOffset et SUGG_CARD_W restent : scrollSugg les lit, et
# scrollSugg fait marcher les fleches du carrousel de la fiche.
ok("retrait: les suggestions inventees du prototype")

# ── 5. la caisse du prototype (#checkoutModal, #coStep1, #payStep absents)
#    PrestaShop sert son propre tunnel de commande.
for _f in ("openCheckout", "closeCheckout", "renderCoSummary", "setCoStep",
           "coBack", "coNext", "selectPM", "markField", "validatePhone",
           "validateEmail", "validateText", "rateLimit"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "const _rateBuckets = {};")
js = _js_retirer_exact(js, """document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCheckout();
});
""")
ok("retrait: la caisse du prototype")

# ── 6. le panneau de fidelite du prototype
#    #accModal, #rewardsGrid, #lbPtsVal absents. Le vrai programme de
#    fidelite est tenu par le module odys_loyalty, en base.
for _f in ("initLoyaltyDemo", "updateLoyaltyUI", "renderRewards",
           "redeemReward", "renderHistory", "renderLastOrders",
           "awardLoyaltyPoints", "showAccTab", "showAccLogin",
           "showRegister", "showLogin", "doLogin", "doRegister", "doLogout"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "const REWARDS = [")
js = _js_retirer_exact(js, "  initLoyaltyDemo();\n")
ok("retrait: le panneau de fidelite du prototype")

# openAccount et closeAccount restent, mais ne font plus rien : le bouton
# « Mon compte » injecte dans l'en-tete porte data-action="open-account", et
# une fonction absente ferait lever une TypeError au clic. Il n'ouvre rien
# aujourd'hui non plus, faute de #accModal.
js = _js_retirer_fonction(js, "openAccount")
js = _js_retirer_fonction(js, "closeAccount")
js = js.replace("/* Account Modal */", """/* La fenetre « mon compte » du prototype a ete retiree du theme : son
   gabarit n'existe plus (voir modals.tpl). Ces deux fonctions restent
   parce que le bouton injecte dans l'en-tete porte
   data-action="open-account" ; sans elles, un clic leverait une
   TypeError. Elles ne font rien, ce qui est exactement ce que faisait la
   fenetre absente. */
function openAccount() {}
function closeAccount() {}
""", 1)
must("function openAccount() {}" in js, "retrait: openAccount devient inerte")
ok("retrait: la fenetre du compte devient inerte, le bouton ne leve rien")

# ── 7. la recherche par note du prototype
#    data-action="search-note" n'existe dans aucun gabarit : les notes sont
#    devenues de vrais liens vers /recherche. PARFUMS_DB etait son
#    catalogue, avec vingt-sept prix inventes.
js = _js_retirer_fonction(js, "searchNote")
js = _js_retirer_donnee(js, "const PARFUMS_DB = [")
ok("retrait: la recherche par note du prototype et son catalogue invente")

# ── 8. les noms disparus, dans l'API publique et dans le repartiteur
js = _js_retirer_api(js, [
    "openCheckout", "closeCheckout", "coNext", "coBack", "selectPM",
    "showAccTab", "doLogin", "doRegister", "doLogout",
    "showRegister", "showLogin", "redeemReward", "searchNote",
    "renderCoSummary",
])
for _case in ("open-checkout", "close-checkout", "co-next", "co-back",
              "select-pm", "do-login", "do-register", "do-logout",
              "show-register", "show-login", "acc-tab", "redeem-reward",
              "search-note"):
    _lignes = [l for l in js.split(chr(10)) if ("case '" + _case + "':") in l]
    must(len(_lignes) == 1,
         "retrait: un seul case pour " + _case + " (trouve %d)" % len(_lignes))
    js = js.replace(_lignes[0] + chr(10), "")
ok("retrait: l API publique et le repartiteur ne citent plus de disparu")

# ── 9. ce que les deux injections vivantes ecrivent a l'ecran
#    Le bouton « Mon compte » et la pastille « +N points fidelite » sont
#    poses par ce fichier dans l'en-tete et sur chaque carte produit. Ils
#    sont VISIBLES, donc ils restent — mais ils parlaient francais dans les
#    trois langues. Un controle sur le HTML servi ne pouvait pas les voir :
#    ils n'existent qu'apres l'execution du script.
js = _js_retirer_exact(js, """      btn.setAttribute('title', 'Mon compte');
      btn.setAttribute('aria-label', 'Mon compte fidélité');""")
js = js.replace("""      btn.className = 'ni ni-acc';
      btn.dataset.action = 'open-account';""",
                """      btn.className = 'ni ni-acc';
      btn.dataset.action = 'open-account';
      btn.setAttribute('title', MOT('monCompte'));
      btn.setAttribute('aria-label', MOT('monCompteFidelite'));""", 1)
must("MOT('monCompteFidelite')" in js, "retrait: le bouton du compte se traduit")

_pastille = ("          const star = document.createTextNode('⭐ +' + pts + "
             "' point' + (pts>1?'s':'') + ' fidélité');")
js = _js_retirer_exact(js, _pastille + chr(10))
js = js.replace("""          const pill = document.createElement('div');
          pill.className = 'pc-pts-pill';""",
                """          const pill = document.createElement('div');
          pill.className = 'pc-pts-pill';
          const star = document.createTextNode('⭐ ' +
            MOT(pts > 1 ? 'pointsFidelite' : 'pointFidelite')
              .replace('%nombre%', pts));""", 1)
must("MOT(pts > 1 ? 'pointsFidelite' : 'pointFidelite')" in js,
     "retrait: la pastille de points se traduit")
ok("retrait: les deux injections visibles suivent enfin la langue")

# ─── 11. le questionnaire du prototype ───────────────────────
# Trois preuves concordantes : aucun de ses conteneurs (#qResult, #qs1,
# #qs2, #qs3, #qReset) n existe dans un gabarit livre ; aucun de ses cinq
# data-action n y est ecrit ; ses sept fonctions ne s appellent qu entre
# elles. Et quizResults porte quatre parfums a 219, 229 et 249 DH — des
# prix qui ne sont pas ceux du catalogue — avec « Inspire de Dior Sauvage
# EDP » et des photographies prises sur images.unsplash.com.
for _f in ("qPick", "qPick2", "qPick3", "showQuizResult", "addQuizResult",
           "resetQuiz", "updateQProg"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "const quizResults = {")
js = _js_retirer_donnee(js, "let qAnswers = {};")
js = _js_retirer_donnee(js, "let qStep = 1;")
js = _js_retirer_exact(js, "// ── QUIZ DATA ──" + chr(10))
js = _js_retirer_api(js, ["qPick", "qPick2", "qPick3", "addQuizResult",
                          "resetQuiz"])
for _case in ("q-pick", "q-pick2", "q-pick3", "add-quiz-result",
              "reset-quiz"):
    _lignes = [l for l in js.split(chr(10)) if ("case '" + _case + "':") in l]
    _sur(len(_lignes) == 1,
         "retrait: un seul case pour " + _case + " (trouve %d)" % len(_lignes))
    js = js.replace(_lignes[0] + chr(10), "")
ok("retrait: le questionnaire du prototype et ses prix inventes")

# ─── 10. le cablage reste orphelin ───────────────────────────
# Retirer une fonction ne suffit pas : ce qui l appelait reste. Ces blocs
# de montage tournaient au DOMContentLoaded et citaient des noms
# disparus — ReferenceError, et tout app.js s arretait la, panier
# compris. Chacun etait deja mort : #pg-analytics, #inlineSugg et les
# quatre data-action du second repartiteur n existent dans aucun
# gabarit, et _origSetCoStep n etait lu nulle part.
js = _js_retirer_exact(js, "/* ── Initialize on page show ─────────────────────────────────── */\ndocument.addEventListener('DOMContentLoaded', () => {\n  if (document.getElementById('pg-analytics')) {\n    // Render overview when analytics page becomes visible\n    const obs = new MutationObserver(() => {\n      if (document.getElementById('pg-analytics').classList.contains('on')) {\n        anRenderTab('overview');\n      }\n    });\n    obs.observe(document.getElementById('pg-analytics'), { attributes: true, attributeFilter: ['class'] });\n  }\n});")
ok('retrait: le montage du tableau de bord')
js = _js_retirer_exact(js, "  initSuggestions();" + chr(10))
ok('retrait: l appel mort a initSuggestions, l ecouteur reste')
js = _js_retirer_exact(js,
    "  if (act2 === " + chr(39) + "add-fbt" + chr(39) + ")     { e2.preventDefault(); addFBT(); }" + chr(10) +
    "  if (act2 === " + chr(39) + "toggle-fbt" + chr(39) + ")  { e2.preventDefault(); toggleFBT(t2.dataset.code); }" + chr(10))
ok('retrait: les deux cas morts du second repartiteur ; sugg-prev et sugg-next restent')
js = _js_retirer_exact(js, "/* ══ INLINE PRODUCT CAROUSEL — auto-cycling ═══════════════ */\ndocument.addEventListener('DOMContentLoaded', () => {\n  initInlineSugg();\n  const w=document.getElementById('inlineSugg');\n  if(w){w.addEventListener('mouseenter',stopISCAutoplay);w.addEventListener('mouseleave',startISCAutoplay);}\n  document.getElementById('iSuggPrev')?.addEventListener('click',()=>iSuggScroll(-1));\n  document.getElementById('iSuggNext')?.addEventListener('click',()=>iSuggScroll(1));\n  window.addEventListener('resize',()=>{iSuggOffset=0;updateISCNav();});\n});")
ok('retrait: le montage du carrousel en ligne')
js = _js_retirer_exact(js, "/* Hook into checkout confirmation to award points */\nconst _origSetCoStep = typeof setCoStep === 'function' ? setCoStep : null;\n// Patch points award into the order submission timeout\n// This is done by augmenting coNext via a proxy pattern\n")
ok('retrait: le raccord mort vers la caisse du prototype')
js = _js_retirer_exact(js, '/* ══════════════════════════════════════════════════════════\n   FULL REVIEW PAGE — 74 interactive tests\n   ══════════════════════════════════════════════════════════ */\n')
ok('retrait: la banniere du panneau de recette retire')

# et le dernier commentaire qui promettait des points dans une caisse
# qui n existe plus
js = _js_retirer_exact(js, '// Points awarded directly inside coNext' + chr(10) + chr(10))
ok('retrait: la derniere note sur la caisse du prototype')

# ── 13. le panier de la maquette — le dernier pan
#    Son tiroir et ses boites (#drawer, #ov, #dItems, #dCnt, #dTotal, #dXs,
#    #dXsList, #dAdded, #cartBtn, #dsFill, #dsVal, #dsMsg, .cb) ne sont dans
#    aucun gabarit livre, et aucune des trente pages servies — dix types,
#    trois langues — n'en porte un seul. Le vrai tiroir est #odysTiroir,
#    rendu par _partials/cart-drawer.tpl et pilote par tiroir_panier.js ;
#    il lit le panier de PrestaShop.
#
#    Ce pan avait ete garde parce qu'il tenait a une action VIVANTE : le
#    repartiteur portait `case 'add-to-cart':` et `case 'add-prod':`, tous
#    deux gardes par `if (!p.idProduct)`. Un bouton d'achat sans identifiant
#    de produit serait donc tombe dans ce panier-la, qui ne commande rien.
#    Sa mort ne reposait pas sur un conteneur absent mais sur une invariante
#    de gabarit, ce qui est une preuve plus faible. Elle a ete relevee : les
#    cinq boutons d'achat des gabarits ecrivent `data-id-product` en dur dans
#    la balise — les deux de la fiche sous `{if $odysAchetable}`, les deux du
#    carrousel dans `{foreach from=$accessories}`, celui de la carte dans la
#    branche `{else}` d'un produit achetable — et les 187 boutons releves sur
#    les pages servies le portent tous. docker/verify.sh tient maintenant
#    cette invariante, sans quoi elle se perdrait au premier gabarit neuf.
#
#    Mort partout, sauf a un endroit, et c'est ce qui manquait a la preuve :
#    la branche de succes du pont appelait ODYS.addToCart pour le seul
#    clignotement du bouton. Ce clignotement EST visible — sur /ar/ le
#    bouton arabe affichait « ✓ Ajouté ! » en francais, et sur /en/ aussi.
#    Il reste donc, mais traduit, et sans remplacer le contenu du bouton :
#    textContent emportait <span class="blbl"> et <div class="bspin">, et
#    l'etiquette du volume ne suivait plus apres un ajout.
_vieux_pont = "          ODYS.addToCart('ps-' + idProduct, name, price, btn);"
_neuf_pont = (
    "          /* Le bouton dit lui-meme que c'est entre. La phrase passe" + LF
    + "             par le dictionnaire : le panier de la maquette ecrivait" + LF
    + "             « ✓ Ajouté ! » en francais dans les trois langues. Et elle" + LF
    + "             va dans .blbl quand il y en a un — ecrire dans le" + LF
    + "             textContent du bouton emportait son libelle et son" + LF
    + "             rouet, que l'etiquette du volume cherche ensuite. */" + LF
    + "          var odysCible = btn.querySelector('.blbl') || btn;" + LF
    + "          var odysAvantAjout = odysCible.textContent;" + LF
    + "          btn.classList.add('done');" + LF
    + "          odysCible.textContent = MOT('panierAjouteBouton');" + LF
    + "          setTimeout(function () {" + LF
    + "            btn.classList.remove('done');" + LF
    + "            odysCible.textContent = odysAvantAjout;" + LF
    + "          }, 1600);")
must(js.count(_vieux_pont) == 1, "panier: la branche de succes du pont est unique")
js = js.replace(_vieux_pont, _neuf_pont, 1)

# Le repli du pont : son selecteur exige deja [data-id-product], donc cette
# branche ne s'atteint qu'avec un attribut present mais vide. Elle ne doit
# rien ajouter du tout plutot qu'entrer dans un panier que PrestaShop ignore.
_vieux_repli = ("    } else {" + LF
                + "      /* Fallback for prototype mode */" + LF
                + "      ODYS.addToCart(btn.dataset.code || 'prod', name, price, btn);" + LF
                + "    }")
must(js.count(_vieux_repli) == 1, "panier: la branche de repli du pont est unique")
js = js.replace(_vieux_repli, "    }", 1)
js = js.replace("    if (idProduct) {", (
    "    /* Pas de repli : le selecteur du pont exige [data-id-product] et" + LF
    + "       les cinq boutons d'achat des gabarits le portent en dur." + LF
    + "       docker/verify.sh echoue si un bouton d'achat parait sans lui. */" + LF
    + "    if (idProduct) {"), 1)
# Et la note qui annoncait la mise a jour du panier de la maquette.
js = _js_retirer_exact(js, "          /* Also update ODYS cart UI */" + LF, 1)

must(js.count("/* Pas de repli :") == 1,
     "panier: le pont n'a plus de repli vers la maquette")

# Le repartiteur. open-cart, close-cart et add-oud ne sont ecrits dans aucun
# gabarit ; chg-item et remove-item n'etaient poses que par renderCart, qui
# disparait. add-to-cart et add-prod partent avec leur garde : un bouton sans
# identifiant ne fera plus rien, au lieu de faire quelque chose d'invisible.
for _case in ("open-cart", "close-cart", "add-to-cart", "add-prod",
              "chg-item", "remove-item", "add-oud"):
    _lignes = [_l for _l in js.split(LF) if ("case '" + _case + "':") in _l]
    must(len(_lignes) == 1,
         "panier: un seul case pour " + _case + " (trouve %d)" % len(_lignes))
    js = js.replace(_lignes[0] + LF, "")

# Le seul ecouteur de `change` du prototype : #coVille etait la ville de sa
# caisse, et selectPM et renderCoSummary ont disparu avec elle. Deux appels a
# des methodes qui n'existent plus, que seule l'absence de #coVille et de .pm
# empechait de lever.
js = _js_retirer_exact(js, (
    'document.addEventListener(QchangeQ, function(e) {' + LF
    + '  if (e.target.closest(Q[data-action="select-pm"]Q))'
    + ' ODYS.selectPM(e.target.closest(Q.pmQ));' + LF
    + '  if (e.target.id === QcoVilleQ)'
    + ' { ODYS.updateShip(); ODYS.renderCoSummary(); }' + LF
    + '});' + LF).replace('Q', chr(39)), 1)

# Les voiles des fenetres du prototype.
js = _js_retirer_exact(js, "document.getElementById('ov')       "
    "?.addEventListener('click', () => ODYS.closeCart());" + LF, 1)
js = _js_retirer_exact(js, "document.getElementById('coOv')     "
    "?.addEventListener('click', () => ODYS.closeCheckout());" + LF, 1)

# La touche Echap. ODYS.closeCheckout n'existe plus depuis que l'etape 8 l'a
# retiree de l'API publique, et cette ligne l'appelait SANS garde : chaque
# Echap, sur n'importe quelle page, levait
#   Uncaught TypeError: ODYS.closeCheckout is not a function
# La garde des disparus ne pouvait pas le voir : son motif exclut ce qui est
# precede d'un point, donc tout ce qui passe par ODYS. Elle le voit
# maintenant, dans sa seconde passe plus bas.
_vieux_echap = ("  ODYS.closeCheckout(); ODYS.closeAccount();"
                " ODYS.closeNotes(); ODYS.closeCart();")
must(js.count(_vieux_echap) == 1, "panier: la ligne d'Echap est unique")
js = js.replace(_vieux_echap, "  ODYS.closeAccount(); ODYS.closeNotes();", 1)

# Le bloc d'accessibilite du tiroir de la maquette : il suit la classe de
# #drawer, qui n'est nulle part. Son commentaire cite openCart et closeCart.
js = _js_retirer_exact(js, (
    "  /* ── Cart drawer: aria-hidden + focus management "
    + "─" * 14 + " */" + LF
    + "  var cartDrawer = document.getElementById('drawer');" + LF
    + "  var cartBtn = document.getElementById('cartBtn');" + LF
    + "  if (cartDrawer) {" + LF
    + "    // Every open/close path (openCart/closeCart, ODYS.*, overlay, Escape)" + LF
    + "    // toggles .on, so follow the class rather than wrapping functions." + LF
    + "    new MutationObserver(function () {" + LF
    + "      var open = cartDrawer.classList.contains('on');" + LF
    + "      if (cartDrawer.getAttribute('aria-hidden') === (open ? 'false' : 'true')) return;" + LF
    + "      cartDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');" + LF
    + "      if (open) {" + LF
    + "        var closeBtn = cartDrawer.querySelector('.d-close');" + LF
    + "        if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 80);" + LF
    + "      } else if (cartBtn && cartDrawer.contains(document.activeElement)) {" + LF
    + "        cartBtn.focus();" + LF
    + "      }" + LF
    + "    }).observe(cartDrawer, { attributes: true, attributeFilter: ['class'] });" + LF
    + "  }" + LF + LF), 1)

# Les fonctions. renderCart fabriquait les lignes du tiroir — une photo
# unsplash en dur pour chacune, « Élaboré au Maroc », « Retirer » et
# « Votre panier est vide » ; renderXS proposait trois parfums a 219, 229 et
# 249 DH, prix inventes et photos unsplash ; updateShip ecrivait
# « Livraison gratuite debloquee ! » dans une barre absente. addProd ajoutait
# « L'Icône » quel que soit le parfum regarde, et addOud un poids d'oud
# depuis un bouton add-oud qu'aucun gabarit ne porte. getCartTotal n'avait
# aucun appelant.
for _f in ("addToCart", "renderCart", "chgItem", "removeItem",
           "updateCartBadges", "getShipZone", "getShipCost", "updateShip",
           "getCartTotal", "renderXS", "openCart", "closeCart",
           "addProd", "addOud"):
    js = _js_retirer_fonction(js, _f)
js = _js_retirer_donnee(js, "let cart = [];")
js = _js_retirer_donnee(js, "const SHIPPING = {")

# go() mettait a jour les pastilles du panier de la maquette a chaque page.
js = _js_retirer_exact(js, "  updateCartBadges();" + LF, 1)

js = _js_retirer_api(js, [
    "openCart", "closeCart", "addToCart", "chgItem", "removeItem",
    "addProd", "addOud", "updateShip",
])
must(js.count("'✓ Ajouté !'") == 1,
     "panier: la phrase du bouton ne subsiste que dans le repli de MOT")
must("images.unsplash.com" not in js,
     "panier: plus une photo inventee dans app.js")
must(js.count("Votre panier est vide") == 1,
     "panier: le panier vide ne subsiste que dans le repli de MOT")

# Les deux titres de section restent seuls, au-dessus du vide : « CART » et
# le filet de SHIPPING, qui annoncait 20 DH Casa et 30 DH partout au Maroc.
# Les vrais frais de port sont ceux de PrestaShop, que le tiroir lit.
js, _n = re.subn("// \u2500\u2500 CART \u2500\u2500\n+"
                 "/\\* \u2500\u2500 SHIPPING \u2014[^\n]*\n+",
                 "", js, count=1)
must(_n == 1, "panier: les deux titres de section du prototype partent")

# Et la note d'en-tete qui donnait addToCart comme la chose a remplacer :
# c'est fait, le pont parle a PrestaShop.
js = _js_retirer_exact(js,
    " *   - Cart operations: replace addToCart() with"
    " prestashop.emit('updateCart')" + LF, 1)
ok("retrait: le panier de la maquette, ses prix inventes et ses phrases en dur")


# Plus aucun nom retire ne doit rester cite. Les listes ci-dessus sont
# ecrites a la main, et une liste ecrite a la main oublie : anSendChat et
# anGenerateReport avaient survecu en appelant anTab et anQuick, disparues.
# Le fichier se chargeait jusque-la, puis levait une ReferenceError et tout
# app.js s arretait. Cette garde fait le compte a notre place.
_disparus = [
    "anTab", "anChangePeriod", "getCurrentTab", "anRenderTab",
    "anRenderOverview", "anRenderSEO", "anRenderProducts",
    "anRenderMarketing", "anRenderCustomers", "anRenderAI", "anAddMessage",
    "anQuick", "anRunAI", "anSendChat", "anGenerateReport",
    "drawLineChart", "drawBarChart", "drawDonutChart",
    "AN_DATA", "AN_SYSTEM_PROMPT", "anChatHistory", "chartsDrawn",
    "initReview", "rvCheck", "REVIEW_SECTIONS",
    "initInlineSugg", "getISCVisible", "iSuggGoTo", "iSuggScroll",
    "updateISCNav", "startISCAutoplay", "stopISCAutoplay", "resetISCAutoplay",
    "initSuggestions", "initFBT", "toggleFBT",
    "updateFBTTotal", "addFBT", "initUpsellStrip", "initViewingNow",
    "SUGG_DB", "FBT_BUNDLES",
    "openCheckout", "closeCheckout", "renderCoSummary", "setCoStep",
    "coBack", "coNext", "selectPM", "markField", "validatePhone",
    "validateEmail", "validateText", "rateLimit",
    "initLoyaltyDemo", "updateLoyaltyUI", "renderRewards", "redeemReward",
    "renderHistory", "renderLastOrders", "awardLoyaltyPoints", "showAccTab",
    "showAccLogin", "showRegister", "showLogin", "doLogin", "doRegister",
    "doLogout", "REWARDS",
    "searchNote", "PARFUMS_DB",
    "addToCart", "renderCart", "chgItem", "removeItem",
    "updateCartBadges", "getShipZone", "getShipCost", "updateShip",
    "getCartTotal", "renderXS", "openCart", "closeCart",
    "addProd", "addOud", "SHIPPING",
    "qPick", "qPick2", "qPick3", "showQuizResult",
    "addQuizResult", "resetQuiz", "updateQProg",
    "quizResults", "qAnswers", "qStep",
]
_restes = [_n for _n in _disparus
           if re.search(r"(?<![\w$.])" + re.escape(_n) + r"(?![\w$])", js)]
_sur(not _restes,
     "retrait: aucun nom retire n est encore cite dans app.js (restes: %s)"
     % ", ".join(_restes))

# Seconde passe : ce qui passe par l'API publique. Le motif ci-dessus exclut
# ce qui est precede d'un point, pour ne pas confondre `i.qty` avec une
# variable `qty`. ODYS.closeCheckout() lui a donc echappe : l'etape 8 avait
# retire closeCheckout de l'API, la touche Echap l'appelait toujours sans
# garde, et chaque Echap sur n'importe quelle page de la boutique levait
#   Uncaught TypeError: ODYS.closeCheckout is not a function
# Le rapport de construction etait vert, node --check aussi : une methode
# absente ne se voit qu'a l'execution. Celle-ci la cherche a l'ecrit.
_restes_api = [_n for _n in _disparus
               if re.search(r"ODYS\s*\.\s*" + re.escape(_n) + r"(?![\w$])", js)]
_sur(not _restes_api,
     "retrait: l API publique ODYS.* ne cite plus de disparu (restes: %s)"
     % ", ".join(_restes_api))
ok("retrait: les %d noms retires ne sont plus cites nulle part, "
   "ni en direct ni par ODYS.*" % len(_disparus))

ok("retrait: app.js passe de %d a %d octets (-%d)"
   % (_av, len(js), _av - len(js)))

# ─── 12. la croix de la barre d'annonce ──────────────────────
# Le gabarit porte data-action="close-ann" depuis la maquette, et aucun
# fichier .js ne l'a jamais traite — ni ici, ni dans ref/. Le client
# cliquait sur la croix, le bandeau restait. Le refus tient la visite
# (sessionStorage : le serveur n'a rien a faire de ce choix, donc pas de
# cookie), et la tete du gabarit relit le drapeau avant le premier rendu,
# sinon le bandeau s'afficherait une fraction de seconde a chaque page.
_ann_avant = "    case 'dismiss-sbn':"
_ann_apres = (
    "    case 'close-ann':     { document.documentElement.classList.add('ann-fermee');" + NL
    + "                            try { sessionStorage.setItem('odysAnnFermee', '1'); } catch (err) {} } break;" + NL
    + "    case 'dismiss-sbn':")
must(js.count(_ann_avant) == 1, "annonce: le cas dismiss-sbn du repartiteur sert d'ancre")
js = js.replace(_ann_avant, _ann_apres, 1)
ok("annonce: la croix ferme le bandeau et s'en souvient le temps de la visite")

# ─── 13. les fleches du clavier ne cherchent plus un mot francais ───
# L'ecouteur trouvait les boutons du carrousel par leur aria-label en
# francais. Ces libelles sont traduits depuis : sur /en/ et /ar/ le
# selecteur ne ramenait plus rien et les fleches ne defilaient plus. Les
# data-action, eux, ne changent pas de langue. Et le conteneur cite en
# premier, #inlineSugg, est parti avec son carrousel : .sugg-section
# porte le seul qui reste.
_kb_avant = (
    "    if (focused && focused.closest('#inlineSugg, .sugg-section')) {" + NL
    + "      var prev = focused.closest('[role=\"region\"]')?.querySelector('[aria-label*=\"précédent\"], [aria-label*=\"Précédent\"]');" + NL
    + "      var next = focused.closest('[role=\"region\"]')?.querySelector('[aria-label*=\"suivant\"], [aria-label*=\"Suivant\"]');")
_kb_apres = (
    "    var sugg = focused && focused.closest('.sugg-section');" + NL
    + "    if (sugg) {" + NL
    + "      var prev = sugg.querySelector('[data-action=\"sugg-prev\"]');" + NL
    + "      var next = sugg.querySelector('[data-action=\"sugg-next\"]');")
must(js.count(_kb_avant) == 1, "clavier: les deux lignes qui cherchaient un libelle francais")
js = js.replace(_kb_avant, _kb_apres, 1)
must("aria-label*=" not in js, "clavier: plus aucun selecteur d'app.js ne lit un libelle traduit")
ok("clavier: les fleches trouvent le carrousel par data-action, dans les trois langues")

js_path.write_text(js, encoding="utf-8")
ok(f"progressive-enhancement module appended ({len(js):,} bytes)")

# ═══════════════════════════════════════════════════════════════════════
# 3. Templates
# ═══════════════════════════════════════════════════════════════════════
tpl_src = HERE / "templates"
written = []
for path in sorted(tpl_src.rglob("*.tpl")):
    rel = path.relative_to(tpl_src)
    dest = THEME / "templates" / rel
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    written.append(str(rel).replace("\\", "/"))
must(len(written) >= 11, f"{len(written)} templates written")

# PS renders the home from templates/index.tpl, not pages/index.tpl
home_src = THEME / "templates" / "pages" / "index.tpl"
must(home_src.exists(), "pages/index.tpl present")
shutil.copy(home_src, THEME / "templates" / "index.tpl")
ok("templates/index.tpl written (PrestaShop's home template)")

# Render PrestaShop's asset collections, or no module CSS/JS ever loads
layout_path = THEME / "templates" / "layouts" / "layout-full-width.tpl"
layout = layout_path.read_text(encoding="utf-8")
layout, n_css = re.subn(
    r'  <link rel="stylesheet" href="\{\$urls\.theme_assets\}css/theme\.css"/>\n',
    '  {include file="_partials/stylesheets.tpl" stylesheets=$stylesheets}\n',
    layout, count=1)
must(n_css == 1, "layout: theme.css link -> PrestaShop stylesheets collection")
layout, n_js = re.subn(
    r'  <script src="\{\$urls\.theme_assets\}js/app\.js" defer></script>\n',
    '  {include file="_partials/javascript.tpl" javascript=$javascript.bottom}\n',
    layout, count=1)
must(n_js == 1, "layout: app.js script -> PrestaShop javascript collection")
if "javascript.head" not in layout:
    layout, n_head = re.subn(
        r'(  \{hook h=.displayHeader.\}\n)',
        '  {include file="_partials/javascript.tpl" javascript=$javascript.head vars=$js_custom_vars}\n\\1',
        layout, count=1)
    must(n_head == 1, "layout: head javascript collection added")
layout_path.write_text(layout, encoding="utf-8")

# The v3.1 partials this build does not rewrite (modals.tpl, customer/*,
# checkout/*, cms/*) still carry legacy colours in inline style="" — run the
# same palette pass over every template so nothing off-system survives.
# Smarty owns { and }, so a raw JSON-LD block is a compile error and every
# page using that layout dies with "Syntax error in template". Only a real
# PrestaShop surfaces this — the static renderer and the browser preview both
# happily showed the page. Wrap those scripts in {literal}.
LD_JSON = re.compile(
    r'(<script[^>]*application/ld\+json[^>]*>)(?!\s*\{literal\})(.*?)(</script>)', re.S)
ld_wrapped = 0

# Hard-coded paths -> the URLs the layout resolves from PrestaShop
ODYS_LINKS = {
    "{$urls.pages.category}": "{$odysUrlParfums}",
    "{$urls.base_url}parfums-orientaux": "{$odysUrlParfums}",
    "{$urls.base_url}parfums-frais": "{$odysUrlParfums}",
    "{$urls.base_url}oud-boukhour": "{$odysUrlOud}",
    "{$urls.base_url}coffrets": "{$odysUrlCoffrets}",
    "{$urls.base_url}livraison": "{$odysUrlLivraison}",
    "{$urls.base_url}retours": "{$odysUrlRetours}",
    "{$urls.base_url}cgv": "{$odysUrlCgv}",
    "{$urls.base_url}confidentialite": "{$odysUrlConfidentialite}",
    "{$urls.base_url}mentions-legales": "{$odysUrlMentions}",
}
link_swaps = 0

tpl_hits = 0
for path in sorted((THEME / "templates").rglob("*.tpl")):
    t = path.read_text(encoding="utf-8")
    before = t
    for old, new in sorted(HEX.items(), key=lambda kv: -len(kv[0])):
        # (?<!&) keeps numeric HTML entities intact — &#120022; (the ODYS
        # wordmark glyph) and &#160; contain what looks like a hex colour.
        t = re.sub(r"(?<!&)" + re.escape(old) + r"(?![0-9A-Fa-f])", new, t, flags=re.I)
    for old, new in RGB.items():
        a, b, c_ = old.split(",")
        t = re.sub(r"(rgba?\()" + a + r",\s*" + b + r",\s*" + c_ + r"\b",
                   lambda m, nv=new: m.group(1) + nv, t)
    t = nuit_prep(t)[0]
    if path.name != "layout-full-width.tpl":   # the layout defines the fallbacks
        for old_link, new_link in ODYS_LINKS.items():
            if old_link in t:
                link_swaps += t.count(old_link)
                t = t.replace(old_link, new_link)
    t, n_ld = LD_JSON.subn(lambda m: m.group(1) + "{literal}" + m.group(2) + "{/literal}" + m.group(3), t)
    ld_wrapped += n_ld
    if t != before:
        path.write_text(t, encoding="utf-8")
        tpl_hits += 1
ok(f"palette pass applied to inline styles in {tpl_hits} inherited templates")
must(ld_wrapped >= 3, f"JSON-LD wrapped in {{literal}} in {ld_wrapped} templates (Smarty would not compile them otherwise)")
# The source templates now carry the $odysUrl* variables themselves, so this
# pass only catches what is left in the inherited ones.
must(link_swaps >= 10, f"{link_swaps} hard-coded paths -> PrestaShop URLs")
for w in written:
    report.append(f"        templates/{w}")

# product <title>: no duplicate Inspiré
if prod_tpl_title := (THEME / "templates" / "catalog" / "product.tpl"):
    if prod_tpl_title.exists():
        tt = prod_tpl_title.read_text(encoding="utf-8")
        old_title = "{$product.name|escape:'html':'UTF-8'} \u2014 Inspir\u00e9 {$product.description_short|strip_tags|truncate:40}"
        new_title = "{$product.name|escape:'html':'UTF-8'} \u2014 {$product.description_short|strip_tags|truncate:60:'\u2026'}"
        if old_title in tt:
            tt = tt.replace(old_title, new_title, 1)
            prod_tpl_title.write_text(tt, encoding="utf-8")
            ok("product page: title no longer repeats \"Inspir\u00e9\"")

# ── 3b-bis. one format, the product's own ──────────────────────────────
# The prototype's 30/50/100 ml fallback used to be rewritten here. The source
# template now renders a single card from $odysShort and the product's real
# price, so a 200 ml diffuser says 200 ml instead of being forced to 50 - and
# there is one place to read rather than a template plus a patch.
prod_tpl = THEME / "templates" / "catalog" / "product.tpl"
if prod_tpl.exists():
    pt = prod_tpl.read_text(encoding="utf-8")
    must('data-price="39"' not in pt and 'data-price="119"' not in pt,
         "product page: no invented format or price")
    must("$odysShort" in pt, "product page: the format comes from the product")
    ok("product page: one format card, priced from the product itself")

    # -- 3b-ter. les formats vendables ---------------------------------
    # $product.combinations est une relique du prototype : la cle existe
    # dans PrestaShop 8 mais reste vide, donc la branche ne rendait jamais
    # rien. Les declinaisons sont dans $combinations, posee par
    # ProductController, indexee par id_product_attribute.
    OLD_COMBOS = """        {if $product.combinations}
          {foreach from=$product.combinations item=combo}
            <button class="vc {if $combo@first}on{/if}"
                    role="radio"
                    aria-checked="{if $combo@first}true{else}false{/if}"
                    data-vol="{$combo.attributes.volume|default:'50'|replace:'ml':''}"
                    data-price="{$combo.price_amount|intval}"
                    data-id-combination="{$combo.id_combination}"
                    data-action="pick-vol">
              {if $combo@first}<div class="vc-badge" aria-hidden="true">{l s='⭐ Populaire' d='Shop.Theme.Odys'}</div>{/if}
              <div class="vc-ml">{$combo.attributes.volume|default:'50ml'|replace:'ml':''}<span>ml</span></div>
              <div class="vc-price">{$combo.price|intval} DH</div>
            </button>
          {/foreach}
        {else}
"""
    NEW_COMBOS = """        {* Les formats vendables du produit. PrestaShop appelle cela des
           declinaisons : une par volume, chacune avec son prix et son
           stock, et c'est la fiche produit -> Declinaisons qui decide
           lesquelles existent. Aucun volume ni aucun prix n'est ecrit ici.

           $combinations[].price est l'ecart au prix de base, hors taxe, et
           non le prix affiche. Le prix d'une carte est donc celui du
           produit tel qu'il est presente, corrige de la difference entre
           son ecart et celui de la declinaison par defaut. *}
        {if $combinations}
          {assign var='odysTaxF' value=1}
          {if isset($product.price_tax_exc) && $product.price_tax_exc > 0}
            {assign var='odysTaxF' value=$product.price_amount / $product.price_tax_exc}
          {/if}
          {assign var='odysEcartDef' value=0}
          {if isset($combinations[$product.id_product_attribute])}
            {assign var='odysEcartDef' value=$combinations[$product.id_product_attribute].price}
          {/if}
          {* Un format epuise reste visible mais ne s'achete pas : le masquer
             ferait croire qu'il n'existe pas. On lit le reglage global ; un
             produit qui autorise lui-meme la commande en rupture sera
             signale a tort, ce qui est le sens prudent. *}
          {assign var='odysBloqueRupture' value=(Configuration::get('PS_STOCK_MANAGEMENT') && !Configuration::get('PS_ORDER_OUT_OF_STOCK'))}
          {foreach from=$combinations key=odysIdPa item=odysCombo}
            {* Le libelle est celui de l'attribut, affiche tel quel :
               « 100 ml », « 5 g » ou « Coffret 3 x 50 ml » conviennent
               aussi bien. *}
            {assign var='odysVol' value=''}
            {foreach from=$odysCombo.attributes_values item=odysVal}{assign var='odysVol' value=$odysVal}{/foreach}
            {assign var='odysPrix' value=$product.price_amount + ($odysCombo.price - $odysEcartDef) * $odysTaxF}
            {assign var='odysDefaut' value=($odysIdPa == $product.id_product_attribute)}
            {assign var='odysDispo' value=($odysCombo.quantity > 0 || !$odysBloqueRupture)}
            <button class="vc{if $odysDefaut} on{/if}{if !$odysDispo} vc-off{/if}"
                    type="button" role="radio"
                    aria-checked="{if $odysDefaut}true{else}false{/if}"
                    {if !$odysDispo}disabled aria-disabled="true"{/if}
                    data-vol="{$odysVol|escape:'html':'UTF-8'}"
                    data-price="{$odysPrix|intval}"
                    data-id-product-attribute="{$odysIdPa|intval}"
                    data-action="pick-vol">
              <div class="vc-ml">{$odysVol|escape:'html':'UTF-8'}</div>
              <div class="vc-price">{$odysPrix|intval} DH</div>
              {if !$odysDispo}<div class="vc-oos">{l s='Épuisé' d='Shop.Theme.Odys'}</div>{/if}
            </button>
          {/foreach}
        {else}
"""
    pt, n = pt.replace(OLD_COMBOS, NEW_COMBOS), pt.count(OLD_COMBOS)
    must(n == 1, "vol-cards: real PrestaShop combinations, priced per format")

    # le libelle du selecteur
    # le gabarit porte maintenant des cles de traduction : l ancre suit
    OLD_LBL = "{if $product.combinations}{l s='Choisissez votre format' d='Shop.Theme.Odys'}{else}{l s='Format' d='Shop.Theme.Odys'}{/if}"
    NEW_LBL = "{if $combinations}{l s='Choisissez votre format' d='Shop.Theme.Odys'}{else}{l s='Format' d='Shop.Theme.Odys'}{/if}"
    pt, n = pt.replace(OLD_LBL, NEW_LBL), pt.count(OLD_LBL)
    must(n == 1, "vol-cards: the label follows the real combinations")

    # Un produit decline annonce le format que le client a devant lui - celui
    # de la declinaison par defaut, qui est aussi celle mise au panier tant
    # qu'il n'a rien choisi - et non la ligne « Contenance » de sa fiche.
    SHORT_ANCHOR = """    <div class="p-format">{$odysFormat nofilter}</div>"""
    SHORT_BLOCK = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
    {/if}
""" + SHORT_ANCHOR
    pt, n = pt.replace(SHORT_ANCHOR, SHORT_BLOCK), pt.count(SHORT_ANCHOR)
    must(n == 1, "vol-cards: a declined product states its default format")

    # $odysFormat restait la caracteristique de la fiche : un diffuseur
    # decline en trois volumes annoncait « Diffuseur d'ambiance - 100 ml »
    # au-dessus de cartes qui en proposaient deux autres. La caracteristique
    # garde la nature du produit, la declinaison donne la contenance.
    OLD_SHORT = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
    {/if}
"""
    NEW_SHORT = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
      {* ce qui precede le point median dit la nature - « Diffuseur
         d'ambiance », « Extrait de Parfum » - et se garde ; ce qui suit etait
         la contenance, que la declinaison remplace. *}
      {assign var='odysNature' value=$odysFormat|regex_replace:'/\\s*\\xc2\\xb7.*$/':''}
      {assign var='odysFormat' value=$odysNature|cat:' &middot; '|cat:$odysShort}
    {/if}
"""
    pt, n = pt.replace(OLD_SHORT, NEW_SHORT), pt.count(OLD_SHORT)
    must(n == 1, "vol-cards: the format line follows the default combination")

    # Le bouton d'ajout partait sur la cle morte, donc toujours a 0 : la
    # declinaison par defaut est ce que PrestaShop attend quand rien n'est
    # choisi, et pickVol remplace la valeur des qu'une carte est cliquee.
    OLD_BTN = 'data-id-product-attribute="{$product.combinations[0].id_combination|default:0}"'
    NEW_BTN = 'data-id-product-attribute="{$product.id_product_attribute|intval}"'
    # Deux boutons portent desormais cette cle : « Ajouter au panier » et
    # « Offrir a quelqu'un ». Offrir met le meme flacon au panier : il part
    # donc sur la meme declinaison, sans quoi il ajouterait la mauvaise.
    pt, n = pt.replace(OLD_BTN, NEW_BTN), pt.count(OLD_BTN)
    must(n == 2, "vol-cards: les deux boutons partent sur la declinaison par defaut")

    # ── 3b-septies. une seule description structuree ───────────────────
    _deb = pt.index('<script type="application/ld+json">')
    _fin = pt.index('</script>', _deb) + len('</script>')
    must('"@type":"Product"' in pt[_deb:_fin], "schema: the old JSON-LD block was found")

    NOUVEAU_LD = """{* La description structuree du produit, seule et complete.

   Elle etait doublee par des microdonnees eparpillees dans le HTML, qui
   annoncaient le prix tel qu'il s'affiche — « 69 DH » — la ou schema.org
   attend un nombre, et dont le itemscope ne contenait pas la photo. Google
   repondait « Invalid floating point number » et « Missing field image ».
   Les microdonnees sont parties ; il ne reste que ce bloc.

   Construit comme un tableau puis encode : plus de concatenation a la main
   entre des {literal}, donc plus de guillemet ni d'accent a echapper. *}
{assign var='odysLdDesc' value=$product.description_short|strip_tags|unescape:'html'|regex_replace:'/\\s+/u':' '|trim}
{assign var='odysLdImgs' value=[]}
{if $product.cover}{append var='odysLdImgs' value=$product.cover.bySize.large_default.url}{/if}
{foreach from=$product.images item=odysLdImg}
  {if !($odysLdImg.bySize.large_default.url|in_array:$odysLdImgs)}
    {append var='odysLdImgs' value=$odysLdImg.bySize.large_default.url}
  {/if}
{/foreach}
{* Smarty n'accepte pas un ternaire coupe par un retour a la ligne dans un
   tableau : on le resout avant. *}
{assign var='odysLdDispo' value='https://schema.org/OutOfStock'}
{if $product.quantity > 0}{assign var='odysLdDispo' value='https://schema.org/InStock'}{/if}
{assign var='odysLd' value=[
  '@context' => 'https://schema.org',
  '@type' => 'Product',
  'name' => $product.name|unescape:'html',
  'sku' => $product.reference|unescape:'html',
  'description' => $odysLdDesc,
  'image' => $odysLdImgs,
  'brand' => ['@type' => 'Brand', 'name' => 'ODYS Parfums'],
  'offers' => [
    '@type' => 'Offer',
    'url' => $product.url,
    'priceCurrency' => 'MAD',
    'price' => $product.price_amount|string_format:'%.2f',
    'itemCondition' => 'https://schema.org/NewCondition',
    'availability' => $odysLdDispo,
    'seller' => ['@type' => 'Organization', 'name' => 'ODYS Parfums']
  ]
]}
{* Une note ne s'affiche que si des clients l'ont donnee. *}
{if isset($product.nb_comments) && $product.nb_comments > 0}
  {assign var='odysLd' value=$odysLd|@array_merge:['aggregateRating' => [
    '@type' => 'AggregateRating',
    'ratingValue' => $product.rating|default:5,
    'reviewCount' => $product.nb_comments|intval
  ]]}
{/if}
<script type="application/ld+json">{$odysLd|@json_encode:320 nofilter}</script>"""

    pt = pt[:_deb] + NOUVEAU_LD + pt[_fin:]
    must(pt.count("application/ld+json") == 1, "schema: one structured description per page")

    # Les microdonnees concurrentes s'en vont.
    MICRO = [
        ("  <div class=\"info\" itemscope itemtype=\"https://schema.org/Product\">",
         "  <div class=\"info\">",
         "schema: the duplicate Product scope is gone"),
        ("    <meta itemprop=\"name\" content=\"{$product.name|escape:'html':'UTF-8'}\"/>\n",
         "", "schema: the duplicate name meta is gone"),
        ("    <meta itemprop=\"sku\"  content=\"{$product.reference}\"/>\n",
         "", "schema: the duplicate sku meta is gone"),
        ("<h1 class=\"p-name\" itemprop=\"name\">", "<h1 class=\"p-name\">",
         "schema: the heading is a heading again"),
        ("           itemprop=\"image\"\n", "",
         "schema: the stray image itemprop is gone"),
        ("<div class=\"live-price-block\" itemprop=\"offers\" itemscope itemtype=\"https://schema.org/Offer\">",
         "<div class=\"live-price-block\">",
         "schema: the broken Offer scope is gone"),
        ("      <meta itemprop=\"priceCurrency\" content=\"MAD\"/>\n", "",
         "schema: the duplicate currency meta is gone"),
        ("      <meta itemprop=\"availability\" content=\"https://schema.org/{if $product.quantity > 0}InStock{else}OutOfStock{/if}\"/>\n",
         "", "schema: the duplicate availability meta is gone"),
        ("<span class=\"lp-price\" id=\"livePrice\" itemprop=\"price\"",
         "<span class=\"lp-price\" id=\"livePrice\"",
         "schema: the price that read 69 DH is no longer a schema value"),
        ("<div class=\"rating\" itemprop=\"aggregateRating\" itemscope itemtype=\"https://schema.org/AggregateRating\">",
         "<div class=\"rating\">", "schema: the hardcoded 4.9 rating scope is gone"),
        ("<span style=\"font-size:12px;font-weight:700\" itemprop=\"ratingValue\">",
         "<span style=\"font-size:12px;font-weight:700\">",
         "schema: the rating value is display only"),
        ("<span class=\"rat-t\" itemprop=\"reviewCount\">", "<span class=\"rat-t\">",
         "schema: the review count is display only"),
        ("{* EAA: rating with itemprop + screen-reader text *}",
         "{* La note telle qu'elle s'affiche ; sa valeur structuree est dans le JSON-LD, une seule fois. *}",
         "schema: the rating comment no longer mentions microdata"),
    ]
    for _vieux, _neuf, _quoi in MICRO:
        pt, n = pt.replace(_vieux, _neuf), pt.count(_vieux)
        must(n == 1, _quoi)

    must("itemprop" not in pt, "schema: one structured description, no microdata left")
    prod_tpl.write_text(pt, encoding="utf-8")

    # ── 3b-sexies. la photo s'ouvre ────────────────────────────────────
    # Un <img> seul n'est ni cliquable ni atteignable au clavier : il devient
    # le contenu d'un bouton, qui annonce ce qu'il fait.
    OLD_GAL = """      <img id="galMain"
"""
    NEW_GAL = """      <button type="button" class="gal-zoom" data-action="zoom-open"
              aria-label="Agrandir la photo de {$product.name|escape:'html':'UTF-8'}">
      <img id="galMain"
"""
    pt, n = pt.replace(OLD_GAL, NEW_GAL), pt.count(OLD_GAL)
    must(n == 1, "gallery: the main photo opens on click")

    OLD_GAL_END = """           width="800" height="800"/>
    </div>
"""
    NEW_GAL_END = """           width="800" height="800"/>
      </button>
    </div>
"""
    pt, n = pt.replace(OLD_GAL_END, NEW_GAL_END), pt.count(OLD_GAL_END)
    must(n == 1, "gallery: the zoom button is closed")

    # La visionneuse elle-meme, a la fin du bloc de contenu. <dialog> donne
    # l'arriere-plan, le piege a focus, Echap et le retour du focus.
    VISIONNEUSE = """
{* La visionneuse. <dialog> plutot qu'une bibliotheque : le navigateur
   fournit l'arriere-plan, le piege a focus, la fermeture par Echap et le
   retour du focus sur le bouton d'origine. zoom.js n'ecrit que la
   navigation entre photos et le passage a la taille reelle. *}
<dialog id="zoomDlg" class="zoom-dlg" aria-label="{l s='Photo du produit' d='Shop.Theme.Odys'}">
  <button type="button" class="zoom-x" data-action="zoom-close"
          aria-label="{l s='Fermer la photo' d='Shop.Theme.Odys'}">&times;</button>
  <div class="zoom-wrap" id="zoomWrap">
    <img id="zoomImg" alt=""/>
  </div>
  <div class="zoom-bar">
    <button type="button" class="zoom-nav" id="zoomPrev" data-action="zoom-prev"
            aria-label="{l s='Photo précédente' d='Shop.Theme.Odys'}" hidden>&#8249;</button>
    <span class="zoom-count" id="zoomCount" aria-live="polite" hidden></span>
    <button type="button" class="zoom-nav" id="zoomNext" data-action="zoom-next"
            aria-label="{l s='Photo suivante' d='Shop.Theme.Odys'}" hidden>&#8250;</button>
  </div>
</dialog>
"""
    ANCRE_FIN = "{/block}"
    must(pt.rstrip().endswith(ANCRE_FIN), "gallery: the content block ends as expected")
    coupe = pt.rstrip()[: -len(ANCRE_FIN)]
    pt = coupe + VISIONNEUSE + ANCRE_FIN + "\n"
    prod_tpl.write_text(pt, encoding="utf-8")

    # ── 3b-quinquies. « Inspire de », une seule fois et sans entite ─────
    EXTRAIT = """    {* description_short vaut « Inspiré de X. Extrait de parfum… » et le
       libellé est déjà dans la page : seul X doit s'afficher. C'est un champ
       HTML, où PrestaShop stocke « Dolce &amp; Gabbana » ; strip_tags retire
       les balises mais pas les entités, donc on décode une fois avant de
       rééchapper une fois. regex_replace rend le sujet inchangé quand il ne
       correspond pas : un oud vendu au gramme n'affiche plus la ligne. *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\\s+(.+?)\\.\\s.*$/su':'$1'}
"""

    OLD_INS = """    <div class="ins-line">
      <span style="font-family:var(--alt);font-size:10px;font-style:italic;color:var(--mid)">{l s='Inspiré de' d='Shop.Theme.Odys'}</span>
      <span style="font-size:12px;font-weight:700">{$product.description_short|strip_tags|truncate:60}</span>
    </div>
"""
    NEW_INS = EXTRAIT + """    {if $odysInsp != $odysDesc}
    <div class="ins-line">
      <span style="font-family:var(--alt);font-size:10px;font-style:italic;color:var(--mid)">{l s='Inspiré de' d='Shop.Theme.Odys'}</span>
      <span style="font-size:12px;font-weight:700">{$odysInsp|escape:'html':'UTF-8'}</span>
    </div>
    {/if}
"""
    pt, n = pt.replace(OLD_INS, NEW_INS), pt.count(OLD_INS)
    must(n == 1, "inspiration: the label is not written twice on the product page")
    prod_tpl.write_text(pt, encoding="utf-8")

    mini = THEME / "templates" / "catalog" / "_partials" / "miniatures" / "product.tpl"
    mt = mini.read_text(encoding="utf-8")
    OLD_PILL = """    {if $product.description_short}
      <div class="pc-pill">
        <span class="pp-by">{l s='Inspiré de' d='Shop.Theme.Odys'}</span>
        <span class="pp-b">{$product.description_short|strip_tags|truncate:46:'…'}</span>
      </div>
    {/if}
"""
    NEW_PILL = """    {* même extraction que sur la fiche : le libellé est dans la pastille,
       description_short le répétait, et son « &amp; » ressortait tel quel *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\\s+(.+?)\\.\\s.*$/su':'$1'}
    {if $odysInsp != $odysDesc}
      <div class="pc-pill">
        <span class="pp-by">{l s='Inspiré de' d='Shop.Theme.Odys'}</span>
        <span class="pp-b">{$odysInsp|truncate:46:'…'|escape:'html':'UTF-8'}</span>
      </div>
    {else}
      {* Un coffret n'est inspire de rien : la pastille restait vide et la
         carte ne disait pas ce qu'il y a dedans. « Duo Classique — 129 DH »
         sous la photo d'un seul flacon se lisait comme un flacon a 129 DH.
         La contenance occupe la place laissee libre, et elle vient de la
         caracteristique du produit, pas d'un texte ecrit ici. *}
      {assign var='odysCont' value=''}
      {if isset($product.features)}
        {foreach from=$product.features item=odysFtC}
          {if $odysFtC.name == 'Contenance'}{assign var='odysCont' value=$odysFtC.value}{/if}
        {/foreach}
      {/if}
      {if $odysCont}
        <div class="pc-pill pc-pill-cont">
          <span class="pp-b">{$odysCont|escape:'html':'UTF-8'}</span>
        </div>
      {/if}
    {/if}
"""
    mt, n = mt.replace(OLD_PILL, NEW_PILL), mt.count(OLD_PILL)
    must(n == 1, "inspiration: the listing card states it once")
    mini.write_text(mt, encoding="utf-8")

    # ── 3b-quater. une note par valeur ─────────────────────────────────
    # Les notes sont desormais des valeurs de caracteristique distinctes :
    # $product.features porte plusieurs entrees du meme nom, et le template
    # rendait un bloc d'etage par entree. On rassemble d'abord, on rend
    # ensuite.
    import re as _re

    # 1. le detecteur de pyramide et les trois blocs d'etage sont remplaces
    #    par une collecte unique suivie de trois rendus.
    _debut = pt.index("    {assign var='odysFeatTete' value=Configuration::get('ODYS_FEAT_TETE')}")
    # la fermeture du bloc, pas le premier {/if} rencontre : celui-la est a
    # l'interieur du premier etage
    _base = pt.index("olf-tier olf-base")
    _ferme = "      {/foreach}\n    </div>\n    {/if}\n"
    _fin = pt.index(_ferme, _base) + len(_ferme)
    ancien = pt[_debut:_fin]
    must('olf-tier olf-base' in ancien, "pyramid: the three tiers were found")

    # les trois icones restent celles du theme : on les relit dans l'ancien
    # bloc plutot que d'en inventer
    icones = _re.findall(r'<div class="ol-icon" aria-hidden="true">(<svg.*?</svg>)</div>', ancien, _re.S)
    must(len(icones) == 3, f"pyramid: three tier icons recovered ({len(icones)})")

    etages = (
        ("odysTete", "olf-top", "Notes de tête", "Tête", "tête", icones[0]),
        ("odysCoeur", "olf-heart", "Notes de cœur", "Cœur", "cœur", icones[1]),
        ("odysFond", "olf-base", "Notes de fond", "Fond", "fond", icones[2]),
    )

    collecte = """    {* La pyramide. Chaque note est une valeur de caracteristique a part,
       donc $product.features porte plusieurs entrees du meme nom : on les
       rassemble par etage avant d'afficher quoi que ce soit, sinon le bloc
       « Tete » se repete autant de fois qu'il y a de notes.

       Le decoupage sur la virgule reste, a l'interieur de chaque valeur :
       une boutique qui retape « Neroli, Citron » dans un seul champ obtient
       toujours deux pastilles. *}
    {assign var='odysFeatTete' value=Configuration::get('ODYS_FEAT_TETE')}
    {assign var='odysFeatCoeur' value=Configuration::get('ODYS_FEAT_COEUR')}
    {assign var='odysFeatFond' value=Configuration::get('ODYS_FEAT_FOND')}
    {assign var='odysTete' value=[]}
    {assign var='odysCoeur' value=[]}
    {assign var='odysFond' value=[]}
    {if isset($product.features)}
      {foreach from=$product.features item=odysFeat}
        {assign var='odysEtage' value=''}
        {if $odysFeat.name == 'Notes de tête' || ($odysFeatTete && $odysFeat.id_feature == $odysFeatTete)}
          {assign var='odysEtage' value='odysTete'}
        {elseif $odysFeat.name == 'Notes de cœur' || ($odysFeatCoeur && $odysFeat.id_feature == $odysFeatCoeur)}
          {assign var='odysEtage' value='odysCoeur'}
        {elseif $odysFeat.name == 'Notes de fond' || ($odysFeatFond && $odysFeat.id_feature == $odysFeatFond)}
          {assign var='odysEtage' value='odysFond'}
        {/if}
        {if $odysEtage}
          {foreach from=','|explode:$odysFeat.value item=odysNote}
            {assign var='odysNote' value=$odysNote|trim}
            {if $odysNote}{append var=$odysEtage value=$odysNote}{/if}
          {/foreach}
        {/if}
      {/foreach}
    {/if}
    {if $odysTete || $odysCoeur || $odysFond}
    {* Ces notes sont celles de la fragrance d'inspiration, pas une analyse
       du jus ODYS. Les presenter comme « notre » pyramide contredisait la
       page A propos — « composition originale d'inspiration » — et la
       mention au bas de la description, qui le redit. Le titre le reconnait,
       en une ligne, sans dejuger le produit. *}
    <div class="olf-pyr" role="region" aria-label="{l s='Pyramide de l\\'inspiration' d='Shop.Theme.Odys'}">
      <div class="olf-hd" id="olf-hd-label">{l s='Pyramide de l\\'inspiration' d='Shop.Theme.Odys'}</div>
      <p class="olf-src">{l s='Les notes de la fragrance dont ce parfum s\\'inspire.
        La composition ODYS cherche à en retrouver l\\'accord.' d='Shop.Theme.Odys'}</p>
"""

    for _var, _classe, _aria, _nom, _type, _svg in etages:
        collecte += """      {if $%s}
        <div class="olf-tier %s" role="group" aria-label="%s">
          <div class="olf-lbl"><div class="ol-icon" aria-hidden="true">%s</div><div class="ol-name">%s</div></div>
          <div class="olf-notes">{foreach from=$%s item=odysNote}
            <a class="note" href="{$urls.pages.search}?s={$odysNote|escape:'url'}"
                  data-note="{$odysNote|escape:'html':'UTF-8'}" data-type="%s"
                  aria-label="Voir les parfums avec la note {$odysNote|escape:'html':'UTF-8'}">{$odysNote|escape:'html':'UTF-8'}</a>
          {/foreach}</div>
        </div>
      {/if}
""" % (_var, _classe, _aria, _svg, _nom, _var, _type)

    collecte += "    </div>\n    {/if}\n"

    pt = pt[:_debut] + collecte + pt[_fin:]
    must(pt.count('<div class="olf-pyr"') == 1, "pyramid: one tier block per tier")
    must(pt.count("{append var=$odysEtage") == 1, "pyramid: notes gathered before rendering")
    prod_tpl.write_text(pt, encoding="utf-8")

    prod_tpl.write_text(pt, encoding="utf-8")

# ── 3b. Placeholder imagery so the theme renders on a clean install ────
img_dir = THEME / "assets" / "img"
img_dir.mkdir(parents=True, exist_ok=True)
for f in sorted((HERE / "img").glob("*.webp")):
    shutil.copy(f, img_dir / f.name)
    ok(f"assets/img/{f.name} (Unsplash License photo)")

# the hero film and its poster: the campaign footage, kept out of the flat
# img/ folder because it is the shop's own material, not a placeholder
hero_src = HERE / "img" / "hero"
if hero_src.exists():
    hero_dst = img_dir / "hero"
    hero_dst.mkdir(parents=True, exist_ok=True)
    for f in sorted(hero_src.iterdir()):
        if f.is_file():
            shutil.copy(f, hero_dst / f.name)
            ok(f"assets/img/hero/{f.name} ({f.stat().st_size // 1024} KB)")

# ── 3c. The CRM module and the legal copy ──────────────────────────────
#   The module is a separate PrestaShop install (copy it into modules/), and
#   legal/ holds the text to paste into the CMS pages in Back Office.
mod_src = HERE / "module"
if mod_src.exists():
    mod_dst = DIST / "modules"
    if mod_dst.exists():
        shutil.rmtree(mod_dst, ignore_errors=True)
    shutil.copytree(mod_src, mod_dst)
    php = sorted(f.name for f in mod_dst.rglob("*.php"))
    must(len(php) >= 4, f"modules/odys_crm shipped ({len(php)} PHP files, {', '.join(php)})")

legal_src = HERE / "legal"
if legal_src.exists():
    legal_dst = DIST / "legal"
    legal_dst.mkdir(exist_ok=True)
    pages = 0
    for f in sorted(legal_src.glob("*.html")):
        shutil.copy(f, legal_dst / f.name)
        pages += 1
    # the launch copy travels beside the CMS text: same folder, same job —
    # words the shop pastes somewhere rather than code it runs
    notes = 0
    for f in sorted(legal_src.glob("*.md")):
        shutil.copy(f, legal_dst / f.name)
        notes += 1
    must(pages >= 3, f"legal/ copy for the CMS pages ({pages} pages, {notes} note(s))")

# the launch visuals: the shop posts these, it does not deploy them
launch_src = HERE / "launch"
if launch_src.exists():
    launch_dst = DIST / "launch"
    launch_dst.mkdir(exist_ok=True)
    shots = 0
    for f in sorted(launch_src.glob("*.png")):
        shutil.copy(f, launch_dst / f.name)
        shots += 1
    ok(f"launch/ visuals shipped ({shots} image(s))")

# the catalogue and its importer travel with the theme
cat_files = [f for f in ("catalogue.json", "catalogue.csv", "import_catalogue.php", "volumes.php", "notes.php", "catalogue.py", "import_contacts.php", "upgrade_loyalty.php", "upgrade_crm.php") if (HERE / f).exists()]
# the pre-launch crawler travels with the theme: it is the thing to run before
# announcing anything
crawler = HERE.parent / "docker" / "crawl.py"
if crawler.exists():
    shutil.copy(crawler, DIST / "crawl.py")
    ok("crawl.py shipped (parcours complet du site)")
for name in cat_files:
    shutil.copy(HERE / name, DIST / name)
must(len(cat_files) >= 3, f"catalogue tools shipped ({', '.join(cat_files)})")

# ═══════════════════════════════════════════════════════════════════════
# 4. theme.yml — version bump only, asset ids and module lists untouched
# ═══════════════════════════════════════════════════════════════════════
yml_path = THEME / "config" / "theme.yml"
yml = yml_path.read_text(encoding="utf-8")
yml, n = re.subn(r'version: "3\.1\.0"', 'version: "5.0.0"', yml, count=1)
must(n == 1, "theme.yml version bumped to 5.0.0")

# PrestaShop's ThemeValidator refuses a theme missing any of 32 files or 13
# properties; v3.1 was missing 23 files and 2 properties, so it could never be
# enabled. See theme_yml.py.
from theme_yml import fix_theme_yml

yml, yml_notes = fix_theme_yml(yml)
for note in yml_notes:
    ok(note)


# ─── les dernieres phrases francaises des gabarits ────────
# sortir_chaines.py saute tout fragment qui contient { ou } : une phrase
# melee a une variable Smarty demande un %parametre% et une relecture a
# la main. Ces phrases-la n avaient donc jamais eu de cle, et un
# aria-label francais se lisait a voix haute sur /en/ et /ar/.
#
# La passe tourne sur les gabarits BATIS : certaines de ces phrases sont
# posees par build_theme lui-meme, d autres viennent de ref/ ou de
# psbuild/. Ici, le texte est celui qui sera servi.
#
# Ce qui n est PAS touche : $odysFeat.name == 'Notes de tete', qui n est
# pas du texte lu mais une comparaison avec le nom de la caracteristique
# en base. Le traduire couperait la pyramide olfactive.
_cles_tpl = [
    ('aria-label="Agrandir la photo de {$product.name|escape:\'html\':\'UTF-8\'}"',
     'aria-label="{l s=\'Agrandir la photo de %nom%\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('<strong>Stock limité · {$product.quantity} unités restantes</strong>',
     "<strong>{l s='Stock limité · %nombre% unités restantes' sprintf=['%nombre%' => $product.quantity] d='Shop.Theme.Odys'}</strong>"),
    ('aria-label="Notes de tête"',
     'aria-label="{l s=\'Notes de tête\' d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Notes de cœur"',
     'aria-label="{l s=\'Notes de cœur\' d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Notes de fond"',
     'aria-label="{l s=\'Notes de fond\' d=\'Shop.Theme.Odys\'}"'),
    ('<div class="ol-name">Tête</div>',
     '<div class="ol-name">{l s=\'Tête\' d=\'Shop.Theme.Odys\'}</div>'),
    ('<div class="ol-name">Cœur</div>',
     '<div class="ol-name">{l s=\'Cœur\' d=\'Shop.Theme.Odys\'}</div>'),
    ('<div class="ol-name">Fond</div>',
     '<div class="ol-name">{l s=\'Fond\' d=\'Shop.Theme.Odys\'}</div>'),
    ('aria-label="Voir les parfums avec la note {$odysNote|escape:\'html\':\'UTF-8\'}"',
     'aria-label="{l s=\'Voir les parfums avec la note %note%\' sprintf=[\'%note%\' => $odysNote|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Ajouter {$product.name|escape:\'html\':\'UTF-8\'} à mes envies"',
     'aria-label="{l s=\'Ajouter %nom% à mes envies\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Ajouter {$product.name|escape:\'html\':\'UTF-8\'} au panier"',
     'aria-label="{l s=\'Ajouter %nom% au panier\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Ajouter {$acc.name|escape:\'html\':\'UTF-8\'} au panier"',
     'aria-label="{l s=\'Ajouter %nom% au panier\' sprintf=[\'%nom%\' => $acc.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Offrir {$product.name|escape:\'html\':\'UTF-8\'} — ajouter au panier avec un message"',
     'aria-label="{l s=\'Offrir %nom% — ajouter au panier avec un message\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Ajouter {$product.name|escape:\'html\':\'UTF-8\'} à ma liste de souhaits"',
     'aria-label="{l s=\'Ajouter %nom% à ma liste de souhaits\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Retirer un exemplaire de {$odysLigne.name|escape:\'html\':\'UTF-8\'}"',
     'aria-label="{l s=\'Retirer un exemplaire de %nom%\' sprintf=[\'%nom%\' => $odysLigne.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Ajouter un exemplaire de {$odysLigne.name|escape:\'html\':\'UTF-8\'}"',
     'aria-label="{l s=\'Ajouter un exemplaire de %nom%\' sprintf=[\'%nom%\' => $odysLigne.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Retirer {$odysLigne.name|escape:\'html\':\'UTF-8\'} du panier"',
     'aria-label="{l s=\'Retirer %nom% du panier\' sprintf=[\'%nom%\' => $odysLigne.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Quantité pour {$product.name|escape:\'html\':\'UTF-8\'}"',
     'aria-label="{l s=\'Quantité pour %nom%\' sprintf=[\'%nom%\' => $product.name|escape:\'html\':\'UTF-8\'] d=\'Shop.Theme.Odys\'}"'),
    ('aria-label="Étape {$odysStep} sur 4 : {$odysSteps[$odysStep-1][\'label\']}"',
     'aria-label="{l s=\'Étape %rang% sur 4 : %etape%\' sprintf=[\'%rang%\' => $odysStep, \'%etape%\' => $odysSteps[$odysStep-1][\'label\']] d=\'Shop.Theme.Odys\'}"'),
    ('<div class="odys-track-eyebrow">Étape {$odysStep} sur 4</div>',
     '<div class="odys-track-eyebrow">{l s=\'Étape %rang% sur 4\' sprintf=[\'%rang%\' => $odysStep] d=\'Shop.Theme.Odys\'}</div>'),
    ('aria-label="{$odysAv.note|intval} sur 5"',
     'aria-label="{l s=\'%note% sur 5\' sprintf=[\'%note%\' => $odysAv.note|intval] d=\'Shop.Theme.Odys\'}"'),
    ('<p class="ft-copy">© {$smarty.now|date_format:\'%Y\'} ODYS Parfums · Casablanca, Maroc · Tous droits réservés</p>',
     '<p class="ft-copy">{l s=\'© %annee% ODYS Parfums · Casablanca, Maroc · Tous droits réservés\' sprintf=[\'%annee%\' => $smarty.now|date_format:\'%Y\'] d=\'Shop.Theme.Odys\'}</p>'),
    ("{block name='head_title'}Commande confirmée | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Commande confirmée | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Connexion | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Connexion | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Suivre ma commande | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Suivre ma commande | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Mes Commandes | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Mes Commandes | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Mon Compte | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Mon Compte | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Mot de passe oublié | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Mot de passe oublié | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Mot de passe | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Mot de passe | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Nouveau mot de passe | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Nouveau mot de passe | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Page introuvable | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Page introuvable | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
    ("{block name='head_title'}Contact | ODYS Parfums{/block}",
     "{block name='head_title'}{l s='Contact | ODYS Parfums' d='Shop.Theme.Odys'}{/block}"),
]
_poses_tpl = 0
for _p in sorted((THEME / 'templates').rglob('*.tpl')):
    _t = _p.read_text(encoding='utf-8')
    _avant = _t
    for _vieux, _neuf in _cles_tpl:
        if _vieux in _t:
            _poses_tpl += _t.count(_vieux)
            _t = _t.replace(_vieux, _neuf)
    if _t != _avant:
        _p.write_text(_t, encoding='utf-8')
must(_poses_tpl >= 32,
     'cles: les phrases a parametre des gabarits portent une cle')
ok(f'cles: {_poses_tpl} phrases de gabarit ont recu une cle de traduction')

preview = HERE / "preview.png"
must(preview.exists(), "preview.png present (ThemeValidator requires it)")
shutil.copy(preview, THEME / "preview.png")
yml_path.write_text(yml, encoding="utf-8")

# ═══════════════════════════════════════════════════════════════════════
# 5. Ship notes
# ═══════════════════════════════════════════════════════════════════════
(DIST / "THEME-NOTES-v5.md").write_text((HERE / "THEME-NOTES-v5.md").read_text(encoding="utf-8"),
                                        encoding="utf-8")
ok("THEME-NOTES-v5.md added")

# README ships with the theme, so it may not document sizes we removed.
readme_path = DIST / "README.md"
readme = readme_path.read_text(encoding="utf-8")
NEWLINE = chr(13) + chr(10) if chr(13) in readme_path.read_text(encoding="utf-8", newline="") else chr(10)
for _old, _new, _what in (
    ("| `flacons-voyage` | Flacons Voyage | Travel sizes 20–100ml |" + NEWLINE,
     "", "Flacons Voyage category row"),
    ("| `#pg-flacons` | `templates/catalog/product.tpl` (Flacons category) |" + NEWLINE,
     "", "Flacons prototype-to-template row"),
    ("| ID Catégorie Flacons | ID of Flacons category |" + NEWLINE, "",
     "Flacons loyalty-setting row"),
    ("| 🧪 Flacons | Fragrance selector · 4 volumes · Auto-carousel |" + NEWLINE, "",
     "Flacons feature row"),
    ("| ⭐ Loyalty | odys_loyalty module · Oud/Flacons excluded",
     "| ⭐ Loyalty | odys_loyalty module · Oud excluded", "loyalty feature row"),
    ("**Parfums** → Create attribute `Volume` with values: `30ml`, `50ml`, `100ml`",
     "**Parfums** → One size only (50 ml): no `Volume` attribute needed. Add one if you ever sell other sizes — the product page renders whatever combinations exist.",
     "attribute step"),
):
    must(readme.count(_old) == 1, f"README: {_what}")
    readme = readme.replace(_old, _new)
readme_path.write_text(readme, encoding="utf-8")
ok("README: 50 ml only, no Flacons Voyage")

# Preview file: keep the standalone prototype in sync with the theme
preview_src = WS / "odys-preview-v5.0.html"
if preview_src.exists():
    (DIST / "preview").mkdir(exist_ok=True)
    shutil.copy(preview_src, DIST / "preview" / "index.html")
    ok("preview/index.html refreshed from the v5.0 prototype")

    # ── Self-host the preview's photography ────────────────────────────
    #   preview/ is what deploy-preview.yml publishes to GitHub Pages; ship
    #   its images inside it instead of hot-linking Unsplash. One WebP per
    #   photo at the largest width any slot asks for, cached across builds.
    import urllib.request
    idx = DIST / "preview" / "index.html"
    page = idx.read_text(encoding="utf-8")
    url_re = re.compile(r"https://images\.unsplash\.com/photo-(\d{10,13}-[0-9a-f]{12})(\?[^\"'\s)]*)?")
    widths = {}
    for m in url_re.finditer(page):
        w = re.search(r"w=(\d+)", m.group(2) or "")
        widths[m.group(1)] = max(widths.get(m.group(1), 0), int(w.group(1)) if w else 1200)
    cache = HERE / "preview-img"; cache.mkdir(exist_ok=True)
    out = DIST / "preview" / "img"; out.mkdir(parents=True, exist_ok=True)
    for pid, w in sorted(widths.items()):
        f = cache / f"{pid}.webp"
        if not f.exists():
            src = f"https://images.unsplash.com/photo-{pid}?w={min(w, 1600)}&fm=webp&q=75"
            with urllib.request.urlopen(src, timeout=60) as r:
                data = r.read()
            assert data[:4] == b"RIFF" and data[8:12] == b"WEBP", f"{pid}: not a WebP"
            f.write_bytes(data)
        shutil.copy(f, out / f.name)
    page, n = url_re.subn(lambda m: f"img/{m.group(1)}.webp", page)
    page = page.replace('<link rel="dns-prefetch" href="https://images.unsplash.com"/>\n', "")  # no remote images left to prefetch
    must("unsplash.com" not in page, f"preview self-hosted: {n} image refs -> {len(widths)} local WebP files")
    page = nuit_prep(page)[0]
    page, n = re.subn(r'<meta name="theme-color" content="[^"]*"', '<meta name="theme-color" content="#08090B"', page)
    must(page.rfind("<style") < page.find("</head>"), "preview: every <style> is in <head>, so Nuit loads last")
    page = page.replace("</head>", '<style id="odys-nuit">\n' + NUIT + "\n</style>\n</head>", 1)
    ok(f"preview: Nuit layer injected ({n} theme-color meta updated)")
    idx.write_text(page, encoding="utf-8")

print("ODYS PrestaShop theme v5.0")
# PrestaShop names a combined bundle from the list of files that went into it,
# not from their contents, so editing the stylesheet leaves the URL unchanged
# and a returning browser keeps yesterday's CSS. There is no Cache-Control on
# these files either, only an ETag, and without an explicit lifetime a browser
# is free to guess one. This asks for a revalidation every time: the ETag makes
# that a 304 and a few bytes, and a deploy is visible immediately.
cache_dir.mkdir(parents=True, exist_ok=True)
(cache_dir / ".htaccess").write_text("""# Combined CSS/JS keeps its filename when its contents change, so the
# browser must ask whether it is still current. The ETag answers in a
# 304 when nothing moved.
<IfModule mod_headers.c>
  Header set Cache-Control "no-cache, must-revalidate"
</IfModule>
""", encoding="utf-8")
ok("assets/cache/.htaccess written (a deploy is seen without a hard refresh)")

# ── Les gabarits en fins de ligne UNIX ──────────────────────────────────
# Une cle de traduction, c'est la phrase francaise elle-meme, octet pour
# octet. Les gabarits sont ecrits sous Windows, donc en CRLF ; le catalogue
# XLIFF, lui, est ecrit par Python en LF. Une phrase qui tient sur deux
# lignes dans un {l s='...'} porte donc un retour chariot que sa cle n'a
# pas : la traduction n'est jamais trouvee et la phrase reste francaise
# dans les trois langues. Huit phrases etaient dans ce cas, dont la
# presentation de la pyramide olfactive, sur chaque fiche produit.
# Rien ne se voyait : la page s'affiche, simplement en francais.
_crlf = 0
for _t in sorted(THEME.rglob("*.tpl")):
    _octets = _t.read_bytes()
    if b"\r\n" in _octets:
        _crlf += 1
        _t.write_bytes(_octets.replace(b"\r\n", b"\n"))
ok("gabarits: %d fichiers passes en fins de ligne UNIX" % _crlf)

# Une apostrophe non echappee ferme le {l s='...'} en plein milieu :
# Smarty rend alors une erreur fatale, et seulement a la visite de la page.
# La construction, elle, n'a rien a dire. On la lui fait dire ici.
_ouvertes = []
for _t in sorted(THEME.rglob("*.tpl")):
    _s = _t.read_bytes().decode("utf-8")
    _j = _s.find("{l s='")
    while _j != -1:
        _k = _j + 6
        while _k < len(_s):
            if _s[_k] == chr(92):
                _k += 2
                continue
            if _s[_k] == chr(39):
                break
            _k += 1
        if _k + 1 < len(_s) and _s[_k + 1] not in " }":
            _ouvertes.append(_t.name + ": " + _s[_j:_j + 60])
        _j = _s.find("{l s='", _k + 1)
must(not _ouvertes,
     "gabarits: chaque apostrophe d'une cle de traduction est echappee"
     + (" (" + "; ".join(_ouvertes) + ")" if _ouvertes else ""))

_CLE = re.compile(r"""{l\s+s=(['"])((?:\\.|(?!\1).)*?)\1""", re.S)
_portent_cr = sorted({_t.name for _t in THEME.rglob("*.tpl")
                      for _m in _CLE.finditer(_t.read_bytes().decode("utf-8"))
                      if "\r" in _m.group(2)})
must(not _portent_cr,
     "gabarits: aucune cle {l s=} ne porte de retour chariot"
     + (" (" + ", ".join(_portent_cr) + ")" if _portent_cr else ""))

# ── Le sol de l'ambiance est celui du site ──────────────────────────────
# odys_loyalty borne les couleurs d'une ambiance pour qu'elles se lisent sur
# AMB_SOL, recopie a la main depuis --odys-cream. Si l'ivoire du site change
# sans que cette constante suive, le module continue de calculer — juste,
# pour un fond qui n'existe plus. C'est la derive qui a rendu les prix
# illisibles la premiere fois ; elle ne peut plus passer en silence.
_mod_src = (THEME / "modules" / "odys_loyalty" / "odys_loyalty.php").read_text(encoding="utf-8")
_sol_php = re.search(r"AMB_SOL = '(#[0-9A-Fa-f]{6})'", _mod_src)
_sol_css = re.search(r"--odys-cream:\s*(#[0-9A-Fa-f]{6})", NUIT)
must(_sol_php and _sol_css and _sol_php.group(1).upper() == _sol_css.group(1).upper(),
     "ambiance: le sol du module est l'ivoire de la feuille de style"
     + ((" (module %s, feuille %s)" % (_sol_php.group(1) if _sol_php else "?",
                                       _sol_css.group(1) if _sol_css else "?"))
        if not (_sol_php and _sol_css and _sol_php.group(1).upper() == _sol_css.group(1).upper())
        else ""))

# Les mots du theme en anglais et en arabe, livres avec le theme.
# Voir psbuild/traductions_xlf.py : un domaine qui n'a pas de fichier
# n'est jamais relu en base, et les trois langues servaient le francais.
from traductions_xlf import ecrire as _ecrire_traductions
_faits = _ecrire_traductions(HERE / 'traductions.json', DIST / 'themes' / 'odys')
ok('traductions du theme : ' + ', '.join('%s %d mots' % f for f in _faits))

# Le fichier de mise a jour vit dans dist/, que ce script efface au
# demarrage. L'oublier laissait une livraison perimee sur le disque et
# faisait echouer la suite de verification loin de la cause reelle.
# On le refait ici : une construction produit toujours un lot complet.
_maj = HERE / 'make_maj_telephone.py'
if _maj.exists():
    import subprocess
    _r = subprocess.run([sys.executable, str(_maj)], capture_output=True, text=True)
    if _r.returncode == 0:
        _ligne = (_r.stdout.strip().splitlines() or ['maj-telephone.php refait'])[0]
        ok('deploy: ' + _ligne)
    else:
        must(False, 'deploy: make_maj_telephone.py a echoue' + _r.stderr[-400:])

# Le script des trois langues part dans le meme dossier de livraison que le
# lot : il s'ouvre une fois, apres lui, puis se supprime.
_lang_dst = WS / 'dist' / 'deploy' / 'maj-langues.php'
_lang_dst.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(HERE / 'maj_langues.php', _lang_dst)
ok('deploy: maj-langues.php (%d octets)' % _lang_dst.stat().st_size)

print("\n".join(report))
print(f"\n  written: {DIST}")
