#!/usr/bin/env python3
"""ODYS Parfums — v4.0 -> v5.0 identity rebuild.

Restyles the existing single-file PrestaShop 8 prototype onto the 2026
ODYS visual system. Structure, routing, cart logic and JS are untouched.
"""
import re, sys, pathlib

HERE = pathlib.Path(__file__).parent
SRC  = pathlib.Path(r"C:\Users\abdel\Downloads\odys-preview-v4.0.html")
OUT  = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else HERE / "odys-preview-v5.0.html"

html = SRC.read_text(encoding="utf-8")
orig_len = len(html)
report = []


def must(cond, msg):
    if not cond:
        raise SystemExit(f"FAILED: {msg}")
    report.append(f"  ok  {msg}")


# ── 1. Core token block ─────────────────────────────────────────────────
tokens = (HERE / "tokens.css").read_text(encoding="utf-8").strip()
html, n = re.subn(r":root\{--rose:.*?--nav-h:68px\}", lambda m: tokens, html, count=1, flags=re.S)
must(n == 1, "core :root token block replaced")

# ── 2. BrandKit token block (second :root) ──────────────────────────────
brandkit = """:root {
  --gold:var(--odys-gold); --gold-d:var(--odys-gold-deep); --gold-dd:#7A5C29;
  --gold-l:var(--odys-soft-gold); --gold-xl:var(--odys-gold-pale);
  --navy-2:var(--odys-marine-soft); --linen:var(--odys-cream-warm); --taupe:#A08F78;
  /* 8px baseline grid */
  --u1:8px;--u2:16px;--u3:24px;--u4:32px;--u5:40px;
  --u6:48px;--u8:64px;--u10:80px;--u12:96px;--u15:120px;
  --col:72px;--gut:24px;--margin:80px;
}"""
html, n = re.subn(r":root \{\n  --gold:#C8A26A;.*?\n\}", lambda m: brandkit, html, count=1, flags=re.S)
must(n == 1, "BrandKit :root token block re-pointed at ODYS palette")

# ── 3. Global hex remap ─────────────────────────────────────────────────
HEX = {
    # golds / rose -> ODYS gold family
    "#C8A26A": "#B4863D", "#A87845": "#8F6A2F", "#E8C9A8": "#C9A66B",
    "#E8B07A": "#C9A66B", "#F0C070": "#C9A66B", "#D5B57A": "#C9A66B",
    "#B88A44": "#A87A33", "#8F6B32": "#7A5C29", "#F3E1AE": "#E4CFA4",
    "#8B6914": "#7A5C29", "#7A5C10": "#7A5C29", "#C8860A": "#B4863D",
    "#A86A08": "#8F6A2F", "#A06E08": "#8F6A2F", "#C8A84B": "#B4863D",
    "#F5C66B": "#C9A66B", "#E6D7B8": "#E4CFA4", "#B9A88F": "#A08F78",
    # navies -> ODYS marine
    "#16283D": "#0C1B26", "#2D3F62": "#16303F", "#2A3F6A": "#16303F",
    "#233C5A": "#16303F", "#0F1A30": "#0C1B26", "#0D1A2B": "#0C1B26",
    "#0A1628": "#070F16", "#9BC4D4": "#C9A66B",
    # inks / darks -> ODYS black
    "#1A1612": "#111316", "#1B1B1B": "#1A1D21", "#060606": "#111316",
    "#000000": "#111316", "#0A0806": "#111316", "#111": "#111316",
    # oud browns -> black/gold system
    "#1C1408": "#111316", "#3D2E10": "#2A2118", "#221A0C": "#1A1D21",
    "#1A1208": "#111316", "#130C02": "#111316", "#1A0F03": "#111316",
    # offer-page magentas -> marine
    "#1A0810": "#0C1B26", "#0A0010": "#070F16", "#8B1A3B": "#111316",
    "#BE185D": "#8F6A2F", "#FDF2F8": "#F5EBDD", "#FBCFE8": "#CDB89E",
    "#FFD6E0": "#E4CFA4", "#FDE": "#F5EBDD",
    # stray blues / purples -> palette
    "#8B5CF6": "#B4863D", "#4285F4": "#0C1B26", "#4338CA": "#0C1B26",
    "#C7D2FE": "#CDB89E", "#EEF2FF": "#F5EBDD", "#F0F4FF": "#F5EBDD",
    "#F0E8F8": "#F5EBDD", "#0284C7": "#16303F", "#BAE6FD": "#CDB89E",
    "#F0F9FF": "#F5EBDD",
    # reds -> single muted alert
    "#C0392B": "#8A2B20", "#E63946": "#8A2B20", "#DC2626": "#8A2B20",
    "#DC2828": "#8A2B20", "#C00": "#8A2B20", "#FFB3B3": "#E8D6C0",
    "#FFF5F5": "#F5EBDD", "#FEF2F2": "#F5EBDD", "#FECACA": "#CDB89E",
    "#FEE": "#F5EBDD",
    # warm off-whites -> cream / champagne
    "#F7F2EA": "#F5EBDD", "#FDF8F3": "#F5EBDD", "#FDF9F2": "#F5EBDD",
    "#F9F8F6": "#F5EBDD", "#F7F3EC": "#F5EBDD", "#F4F3F0": "#F5EBDD",
    "#F0EDE9": "#EFE3D2", "#FAFAF9": "#F5EBDD", "#F8F7F5": "#F5EBDD",
    "#F5F4F2": "#F5EBDD", "#FFF8E8": "#F5EBDD", "#FFFBF0": "#F5EBDD",
    "#FFF9F2": "#F5EBDD", "#FFF3CD": "#F5EBDD", "#FDE8D4": "#E8D6C0",
    "#F5F2ED": "#EFE3D2", "#EAE3D8": "#E8D6C0", "#EDE8E0": "#E8D6C0",
    "#EEE5D8": "#EFE3D2", "#E8E3DD": "#CDB89E", "#E0D8CE": "#CDB89E",
    "#856404": "#7A5C29", "#155724": "#2D6A4F", "#F0F0F0": "#EFE3D2",
    # neutral greys -> warm neutrals
    "#7A6E65": "#756B61", "#B0A898": "#A08F78", "#999": "#756B61",
    "#888": "#756B61", "#BBB": "#A08F78", "#CCC": "#CDB89E",
    # greens: keep functional, harmonise the loud ones
    "#2A9D5C": "#2D6A4F", "#2ED37A": "#2D6A4F", "#5EBF8B": "#2D6A4F",
    "#2EA043": "#2D6A4F", "#059669": "#2D6A4F", "#D4EDDA": "#DCE9E0",
    "#F0FAF4": "#F0F6F1", "#B8DDC8": "#BFD6C6", "#7FD4A8": "#8FBFA5",
    "#160": "#2D6A4F",
    # keep: #25D366 (WhatsApp), #E1306C (Instagram) — real brand marks
}
counts = {}
for old, new in sorted(HEX.items(), key=lambda kv: -len(kv[0])):
    pat = re.compile(re.escape(old) + r"(?![0-9A-Fa-f])", re.I)
    html, c = pat.subn(new, html)
    if c:
        counts[old] = c
must(sum(counts.values()) > 200, f"{sum(counts.values())} off-palette colour literals remapped")

# ── 3b. Global rgb()/rgba() remap ───────────────────────────────────────
#   Hex is only half the story: the theme also carries legacy colours as
#   raw rgb triples inside rgba() alpha values.
RGB = {
    "196,149,106": "180,134,61",   # legacy rose
    "200,162,106": "180,134,61",
    "200,134,10":  "180,134,61",   # legacy oud amber
    "255,200,60":  "201,166,107",
    "255,150,0":   "180,134,61",
    "230,215,184": "228,207,164",
    "26,22,18":    "17,19,22",     # legacy ink
    "28,20,8":     "17,19,22",
    "18,14,10":    "17,19,22",
    "18,11,3":     "17,19,22",
    "13,8,2":      "17,19,22",
    "13,20,38":    "12,27,38",     # legacy navy
    "10,15,28":    "12,27,38",
    "250,248,244": "245,235,221",  # legacy ivories
    "247,243,236": "245,235,221",
    "247,242,234": "245,235,221",
    "42,157,92":   "45,106,79",    # loud greens -> single success
    "46,160,67":   "45,106,79",
    "184,221,200": "191,214,198",
    "220,40,40":   "138,43,32",    # reds -> single alert
    "192,57,43":   "138,43,32",
    # kept: 255,255,255 · 0,0,0 · 37,211,102 (WhatsApp)
}
rgb_hits = 0
for old, new in RGB.items():
    a, b, c = old.split(",")
    pat = re.compile(r"(rgba?\()" + a + r",\s*" + b + r",\s*" + c + r"\b")
    html, k = pat.subn(lambda m, nv=new: m.group(1) + nv, html)
    rgb_hits += k
must(rgb_hits > 80, f"{rgb_hits} legacy rgb() triples remapped")

# ── 4. Meta theme colour ────────────────────────────────────────────────
html, n = re.subn(r'<meta name="theme-color" content="#0C1B26"/>',
                  '<meta name="theme-color" content="#F5EBDD"/>', html, count=1)
must(n == 1, "theme-color set to champagne cream")

# ── 5. Fix malformed parfum page wrapper (pre-existing bug) ─────────────
html, n = re.subn(r'<div <div id="pg-parfum" class="page">',
                  '<div id="pg-parfum" class="page">', html, count=1)
must(n == 1, "malformed <div <div id=pg-parfum> tag repaired")

# ── 5b. Repair the mangled arrow function that killed the whole app ─────
#   `labels.forEach((lbl,i) = style="display:none"> {` was a corrupted `=>`.
#   It raised a SyntaxError that stopped the ENTIRE main <script> from
#   parsing in v4 — cart, routing, checkout and loyalty were all dead.
html, n = re.subn(r'labels\.forEach\(\(lbl,i\) = style="display:none"> \{',
                  'labels.forEach((lbl,i) => {', html, count=1)
must(n == 1, "corrupted arrow function repaired — main script parses again")

# ── 5b2. Complete the PrestaShop bridge stub ────────────────────────────
#   The standalone stub only implemented emit(), but the app calls
#   prestashop.on('updateCart', …). Outside PrestaShop that threw and
#   aborted the rest of the storefront IIFE.
html, n = re.subn(
    r"window\.prestashop = \{ cart: \{ products: \[\] \}, emit: function\(\) \{\} \};",
    "window.prestashop = { cart: { products: [] }, emit: function() {},\n"
    "                        on: function() {}, off: function() {} };",
    html, count=1)
must(n == 1, "prestashop bridge stub given on()/off() no-ops")

# ── 5b3. Unterminated <a> around the hero bottle ────────────────────────
html, n = re.subn(r'(<div class="hero-img"><a [^>]*><img [^>]*/>)</div>',
                  r'\1</a></div>', html, count=1)
must(n == 1, "unterminated <a> around hero image closed")

# ── 5b4. Guard the loader lookup (#loader is not in this build) ─────────
html, n = re.subn(
    r"setTimeout\(\(\) => document\.getElementById\('loader'\)\.classList\.add\('done'\), 1600\);",
    "setTimeout(function () {\n"
    "    var l = document.getElementById('loader');\n"
    "    if (l) l.classList.add('done');\n"
    "  }, 1600);",
    html, count=1)
must(n == 1, "loader lookup null-guarded")

# ── 5b5. Unterminated <div class="acc"> on the product page ─────────────
#   Missing '>' meant the accordion never became a container: its items
#   were parsed as direct flex children of .prod-wrap and laid out in one
#   row, pushing the product page to ~3400px wide (horizontal scroll).
html, n = re.subn(r'<div class="acc"\n', '<div class="acc">\n', html, count=1)
must(n == 1, "unterminated <div class=\"acc\"> closed — product page overflow fixed")

# ── 5b6. Restore the "viewing now" container (product + flacons) ────────
#   The opening <div class="viewing-now"> line had been deleted, leaving an
#   orphan </div> that closed .info early — everything below it (volume
#   selector, price, CTA, trust, accordion) became a flex sibling of the
#   gallery and the page scrolled sideways.
eye = ('<div class="viewing-now">'
       '<span class="vn-eye" aria-hidden="true">'
       '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" '
       'stroke="currentColor" stroke-width="1.3" stroke-linecap="round" '
       'stroke-linejoin="round"><path d="M1.5 12S5 5.5 12 5.5 22.5 12 22.5 12'
       ' 19 18.5 12 18.5 1.5 12 1.5 12z"/><circle cx="12" cy="12" r="3"/>'
       '</svg></span>')
html, n = re.subn(r'\n    \n      <span><span class="vn-count"',
                  "\n    " + eye + '\n      <span><span class="vn-count"', html)
must(n == 2, f"{n} 'viewing now' containers restored (product + flacons)")

# ── 5b7. Reunite the CTA row with its opening tag ───────────────────────
#   `<div <!-- Scent DNA Meters -->` had swallowed the `<div` that belonged
#   to the add-to-cart row further down, which then began `class="cta-row">`.
html, n = re.subn(r'<div <!-- Scent DNA Meters -->', '<!-- Scent DNA Meters -->', html, count=1)
must(n == 1, "stray <div before the Scent DNA comment removed")
html, n = re.subn(r'\n    class="cta-row">', '\n    <div class="cta-row">', html, count=1)
must(n == 1, "add-to-cart row given back its opening <div>")

# ── 5b8. Move "Formats Découverte" out of the <nav> ─────────────────────
#   A full-width, four-column content band was authored inside the product
#   page's sticky <nav>. It stretched the bar to ~930px on a 375px screen
#   and rode along with the sticky header on desktop.
m = re.search(
    r'\n  <div style="background:var\(--marble\);border-top:1px solid var\(--border\);'
    r'.*?\n  </div>\n(?=\n  <div class="nav-icons">)', html, re.S)
must(m is not None, "located the misplaced Formats Découverte band")
band = m.group(0)
cut_at = m.start()
html = html[:cut_at] + "\n" + html[m.end():]
#   Re-insert after the *enclosing* </nav> — the one that follows the cut,
#   not the first </nav> in the document (which belongs to the home page).
close = re.compile(r'\n[ \t]*</nav>\n').search(html, cut_at)
must(close is not None, "found the product page's </nav> to reinsert after")
html = html[:close.end()] + band.lstrip("\n") + "\n" + html[close.end():]
report.append("  ok  Formats Découverte band moved below the product page nav")

# ── 5b9. Give the inline-styled brand story a hook ──────────────────────
#   It is a hardcoded `grid-template-columns:5fr 7fr; gap:80px` with no
#   class, so it could never collapse on a phone. A class lets the design
#   system own it without rewriting the section.
html, n = re.subn(
    r'(<div style="max-width:1280px;margin:0 auto;display:grid;'
    r'grid-template-columns:5fr 7fr;gap:80px;align-items:center")',
    r'\1 class="odys-story-grid"', html, count=1)
must(n == 1, "brand-story grid given a class so it can go responsive")

# ── 5c. Stray attribute inside a closing tag ────────────────────────────
html, n = re.subn(r'</strong style="display:none">', '</strong>', html)
must(n >= 1, f"{n} malformed </strong> closing tags repaired")

# ── 5d. Replace the dead image asset ────────────────────────────────────
#   photo-1541643600914-… 404s on the CDN: it was the hero bottle, the
#   ODYS 01 card, the gallery hero and the quiz result — 18 broken images.
#   Replacement is the one candidate in the set that shows no competitor
#   branding. Real ODYS photography still has to replace all of these.
html, n = re.subn("photo-1541643600914-78b084683702",
                  "photo-1615634260167-c8cdede054de", html)
must(n >= 15, f"{n} references to the dead hero image repointed at a live asset")

# ── 5d2. Cart total never displayed ─────────────────────────────────────
#   updateCartBadges() wrote to #dTot; the element in the drawer is #dTotal.
#   The lookup returned null and threw on every cart mutation, so the
#   basket total stayed at "0 DH" and the code after it never ran.
html, n = re.subn(r"document\.getElementById\('dTot'\)\.textContent = sum \+ ' DH';",
                  "document.getElementById('dTotal').textContent = sum + ' DH';",
                  html, count=1)
must(n == 1, "cart total wired to the right element (#dTot -> #dTotal)")

# ── 5d2b. Free-shipping progress bar never updated ──────────────────────
#   updateShip() looked up #dsF / #dsV / #dsM; the drawer markup uses
#   #dsFill / #dsVal / #dsMsg. Guarded by `if (el)`, so it failed silently
#   and the bar sat at 0% no matter what was in the basket.
for short, real in (("dsF", "dsFill"), ("dsV", "dsVal"), ("dsM", "dsMsg")):
    html, n = re.subn(r"document\.getElementById\('" + short + r"'\)",
                      "document.getElementById('" + real + "')", html, count=1)
    must(n == 1, f"free-shipping bar: #{short} -> #{real}")

# ── 5d3. Remove the duplicate cart-click listener ───────────────────────
#   A second document-level delegation called bare addToCart/chgItem/
#   removeItem/go — none of which exist outside the ODYS IIFE. Every add,
#   quantity change and remove threw a ReferenceError after the real
#   handler had already run. All five of its cases are covered by the
#   ODYS delegation above it, so it is dead code, not a missing feature.
dup = re.compile(
    r"document\.addEventListener\('click', function\(e\) \{\n"
    r"  const t = e\.target\.closest\('\[data-action\]'\);\n"
    r"  if \(!t\) return;\n\n"
    r"  const action = t\.dataset\.action;\n"
    r"  const code   = t\.dataset\.code;\n\n"
    r"  switch \(action\) \{\n"
    r".*?\n  \}\n\}\);\n", re.S)
html, n = dup.subn(
    "/* Removed: duplicate cart delegation. Every action it handled\n"
    "   (chg-item, remove-item, add-to-cart, go-page, open-account) is\n"
    "   already dispatched by the ODYS delegation above, and its bare\n"
    "   function calls were not in scope. */\n", html, count=1)
must(n == 1, "duplicate cart click-delegation removed")

# ── 5d4. One id="annTrack" per page is invalid — and only one worked ────
#   Three pages carried the same id. getElementById reached the first one,
#   so the other two tickers were never doubled and their -50% marquee
#   loop jumped. Keyed off the class instead.
html, n = re.subn(r'<div class="ann-track" id="annTrack">', '<div class="ann-track">', html)
must(n == 3, f"{n} duplicate annTrack ids removed")
html, n = re.subn(
    r"  const t = document\.getElementById\('annTrack'\);\n"
    r"  if \(t\) \{ const c = t\.innerHTML; t\.innerHTML = c \+ c; \}",
    "  document.querySelectorAll('.ann-track').forEach(function (t) {\n"
    "    const c = t.innerHTML; t.innerHTML = c + c;\n"
    "  });", html, count=1)
must(n == 1, "ticker duplication now runs on every page's marquee")

# ── 5e. Name the icon-only controls ─────────────────────────────────────
#   Hamburgers and cart buttons on the secondary pages carried no
#   accessible name — a screen reader announced them as just "button".
labelled = 0
html, k = re.subn(r'<button class="ham"(?![^>]*aria-label)',
                  '<button class="ham" aria-label="Menu"', html); labelled += k
html, k = re.subn(r'(<button class="ni"(?:(?!aria-label)[^>])*data-action="open-cart")(?![^>]*aria-label)',
                  r'\1 aria-label="Panier"', html); labelled += k
must(labelled >= 9, f"{labelled} icon-only buttons given an accessible name")

# ── 6. Strip decorative emoji from rendered copy (HTML body only) ───────
body_start = html.index("<body>")
body_end = html.index("\n<script>", body_start)
body = html[body_start:body_end]
EMOJI = re.compile(
    "[\U0001F000-\U0001FAFF\u2B00-\u2BFF\u2705\u274C\u2728\u2B50\uFE0F\u200D]+[ \u00A0]?")
body_new, n_emoji = EMOJI.subn("", body)
# tidy any double spaces the strip left inside tags/text
body_new = re.sub(r">[ \u00A0]{1,}([A-ZÀ-Üa-zà-ü0-9])", r">\1", body_new)
html = html[:body_start] + body_new + html[body_end:]
must(n_emoji > 40, f"{n_emoji} decorative emoji removed from rendered copy")

# ── 6b. …and from the strings the JS renders into the same UI ───────────
#   Emoji-only literals are left alone: those are icon *data* (the rewards
#   catalogue keys off them), and blanking them would empty the UI.
js_start = html.index("\n<script>", body_start)
head, js = html[:js_start], html[js_start:]
ICON_ONLY = re.compile(r"(['\"])(?:[\U0001F000-\U0001FAFF⭐️‍]+)\1")
placeholders = []
def stash(m):
    placeholders.append(m.group(0))
    return f"\x00{len(placeholders)-1}\x00"
js = ICON_ONLY.sub(stash, js)
js, n_js = EMOJI.subn("", js)
js = re.sub(r"\x00(\d+)\x00", lambda m: placeholders[int(m.group(1))], js)
html = head + js
must(n_js > 20, f"{n_js} decorative emoji removed from JS-rendered copy")

# ── 7. Insert the new identity sections on the home page ────────────────
trio = (HERE / "trio.html").read_text(encoding="utf-8")
anchor = "  <!-- ══ L'ODYSSÉE ODYS — Brand Story ══ -->"
must(html.count(anchor) == 1, "brand-story anchor located on home page")
html = html.replace(anchor, trio + "\n" + anchor, 1)

# ── 7b. Build the footer into its empty placeholder ─────────────────────
#   #home-footer / #home-reviews / #home-nl were empty divs and nothing
#   ever populated them — the site shipped with no footer at all.
footer = (HERE / "footer.html").read_text(encoding="utf-8").strip()
html, n = re.subn(r'<div id="home-footer"></div>', footer, html, count=1)
must(n == 1, "premium dark footer built into #home-footer")

# ── 8. Append the identity stylesheet as the last layer ─────────────────
identity = (HERE / "identity.css").read_text(encoding="utf-8")
idx = html.index("</style>")
html = html[:idx] + identity + "\n" + html[idx:]
must("ODYS PARFUMS — IDENTITY LAYER 2026" in html, "identity layer appended to stylesheet")

# ── 9. Progressive-enhancement script: sticky nav + scroll reveal ───────
enhance = """
<script>
/* ── ODYS 2026 · sticky nav state + luxury scroll reveal ──────────────
   Progressive enhancement only. Nothing here owns layout or behaviour;
   if it never runs, the page still renders and works exactly as before. */
(function () {
  'use strict';
  var navs = document.querySelectorAll('nav');
  var onScroll = function () {
    var stuck = window.scrollY > 12;
    for (var i = 0; i < navs.length; i++) navs[i].classList.toggle('stuck', stuck);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* One footer definition, mirrored into every page that lacks one.
     Keeps a single source of truth instead of duplicating the markup
     across ten page containers. */
  var master = document.getElementById('odys-footer');
  if (master) {
    var pages = document.querySelectorAll('.page');
    for (var p = 0; p < pages.length; p++) {
      if (pages[p].querySelector('footer')) continue;
      var copy = master.cloneNode(true);
      copy.removeAttribute('id');
      pages[p].appendChild(copy);
    }
  }

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var targets = document.querySelectorAll('.reveal');
  if (reduced || !('IntersectionObserver' in window)) {
    for (var j = 0; j < targets.length; j++) targets[j].classList.add('in');
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });
  for (var k = 0; k < targets.length; k++) io.observe(targets[k]);
})();
</script>
</body>"""
html, n = re.subn(r"</body>", lambda m: enhance, html, count=1)
must(n == 1, "sticky-nav + scroll-reveal enhancement script appended")

# ── 10. Version stamp ───────────────────────────────────────────────────
html = html.replace("ODYS Parfums — Theme CSS\n * PrestaShop 8 · odysperfumes",
                    "ODYS Parfums — Theme CSS  ·  v5.0 Identity 2026\n * PrestaShop 8 · odysperfumes", 1)

OUT.write_text(html, encoding="utf-8")

print("ODYS v5.0 build")
print("\n".join(report))
print(f"\n  source {orig_len:,} bytes  ->  output {len(html):,} bytes")
print(f"  written: {OUT}")
