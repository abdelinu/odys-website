#!/usr/bin/env python3
"""Put the Nuit home page into the standalone preview.

The preview (dist/.../preview/index.html) is the clickable prototype: every
page, the local cart, Oud grams. Its home still carried the v5.0 hero,
category grid, trio and values strip. This swaps those for the sections the
theme templates render (themecheck/home.html), rewired to the prototype's
page switcher. Run after build_theme.py and render_check.py.
"""
import pathlib, re, shutil, sys

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
PREVIEW = WS / "dist" / "odys-theme-ps8" / "preview"
RENDER = WS / "themecheck"


def must(cond, msg):
    if not cond:
        sys.exit(f"FAILED: {msg}")
    print(f"  ok  {msg}")


def block(html, opener, tag):
    """Return the element that starts with `opener`, balanced on `tag`."""
    start = html.find(opener)
    must(start >= 0 and html.count(opener) == 1, f"one {opener!r} in the rendered home")
    depth, pos = 0, start
    pat = re.compile(r"<(/?)" + tag + r"\b")
    for m in pat.finditer(html, start):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            end = html.find(">", m.end()) + 1
            return html[start:end]
    sys.exit(f"FAILED: unbalanced {tag} after {opener!r}")


home = (RENDER / "home.html").read_text(encoding="utf-8")
hero = block(home, '<section class="nv-hero"', "section")
fam = block(home, '<section class="nv-fam"', "section")
sig = block(home, '<section class="nv-sig', "section")
duo = block(home, '<section class="nv-duo', "section")
assure = block(home, '<section class="nv-assure"', "section")
quiz = block(home, '<dialog class="nv-quiz"', "dialog")


def rewire(h):
    h = h.replace('src="assets/img/', 'src="img/')
    # quiz openers must not also switch page
    h = re.sub(r'<a href="[^"]*"([^>]*data-nv-quiz-open)', r'<a href="#"\1', h)
    h = re.sub(r'href="#collection#fam-([a-z]+)"', r'href="#" data-action="go" data-page="collection" data-nv-fam="\1"', h)
    h = h.replace('href="#collection"', 'href="#" data-action="go" data-page="collection"')
    h = h.replace('href="#oud-boukhour"', 'href="#" data-action="go" data-page="oud"')
    h = h.replace('href="#produit"', 'href="#" data-action="go" data-page="parfum"')
    h = h.replace('action="#collection"', 'action="#"')   # quiz form: JS switches page
    return h


new_top = "\n".join(rewire(b) for b in (hero, fam, sig, duo))

idx = PREVIEW / "index.html"
page = idx.read_text(encoding="utf-8")
home_at = page.find('id="pg-home"')
must(home_at > 0, "preview has #pg-home")

old_start = page.find('<div class="hero"', home_at)
old_end = page.find('<section class="odys-essence', home_at)
must(0 < old_start < old_end, "old hero … values strip located inside #pg-home")
page = page[:old_start] + new_top + "\n" + page[old_end:]

reviews_at = page.find('<div id="home-reviews"', home_at)
must(reviews_at > 0, "reassurance slot (#home-reviews) located")
page = page[:reviews_at] + rewire(assure) + "\n" + page[reviews_at:]

script = """
<style id="odys-nuit-preview">
/* the prototype's nav sits in the page flow, so the hero doesn't slide under it */
#pg-home .nv-hero-in{padding-top:clamp(40px,6vw,80px)}
#pg-home .nv-hero{min-height:clamp(560px,86vh,820px)}
</style>
""" + rewire(quiz) + """
<script>
/* Nuit home in the prototype: family circles and the quiz open the
   collection page with that family filter pressed. */
(function () {
  'use strict';
  function pressFamily(fam) {
    setTimeout(function () {
      var b = document.querySelector('#pg-collection .ff[data-fam="' + fam + '"]');
      if (b && !b.classList.contains('on')) b.click();
    }, 60);
  }
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-nv-fam]');
    if (a) pressFamily(a.getAttribute('data-nv-fam'));
  });
  var dlg = document.getElementById('nvQuiz');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var form = dlg.querySelector('form');
  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-nv-quiz-open]')) { e.preventDefault(); if (!dlg.open) dlg.showModal(); }
    else if (e.target.closest('[data-nv-quiz-close]')) dlg.close();
    else if (e.target === dlg) dlg.close();
  });
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fam = new FormData(form).get('fam');
    if (!fam) return;
    dlg.close();
    ODYS.go('collection');
    pressFamily(fam);
  });
})();
</script>
"""
must(page.count("</body>") == 1, "one </body> in the preview")
page = page.replace("</body>", script + "</body>")

seg = page[home_at:page.find('id="pg-', home_at + 10)]
must('class="hero"' not in seg and "odys-trio-wrap" not in seg, "old hero/trio gone from #pg-home")
must(all(c in seg for c in ("nv-hero", "nv-fam", "nv-sig", "nv-duo", "nv-assure")), "Nuit sections inside #pg-home")
must(page.count('id="nvQuiz"') == 1 and page.count("data-nv-quiz-open") >= 2, "quiz dialog + openers present")
must("assets/img/" not in page and "#collection" not in page, "links and image paths rewired")

# European Maison identity: one logo on every prototype page
balance_before = len(re.findall(r"<div\b", page)) - page.count("</div>")
LOGO = ('<span class="odys-logo-w" aria-hidden="true">ODYS</span>'
        '<span class="odys-logo-p" aria-hidden="true">Parfum</span>')


def logo(m):
    attrs = m.group(1).replace('class="logo-link"', 'class="odys-logo"')
    if "aria-label" not in attrs:
        attrs += ' aria-label="ODYS Parfum — Accueil"'
    # One prototype nav never closed its logo-text-group <div>; a stray </div>
    # later in the page balanced it. Dropping that <div> made the stray one
    # close the whole page early, so re-open as many as the old logo left open.
    unclosed = len(re.findall(r"<div\b", m.group(2))) - m.group(2).count("</div>")
    return "<a" + attrs + ">" + LOGO + "</a>" + '<div style="display:contents">' * max(unclosed, 0)


page, n = re.subn(r'<a([^>]*class="logo-link"[^>]*)>(.*?)</a>', logo, page, flags=re.S)
must(n >= 10 and "𝒪DYS" not in page, f"{n} prototype logos -> ODYS / PARFUM")
must(len(re.findall(r"<div\b", page)) - page.count("</div>") == balance_before,
     "logo swap keeps the preview's <div> balance unchanged")
page, n = re.subn(r'(fonts\.googleapis\.com/css2\?[^"]*?)&display=swap',
                  r'\1&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&display=swap', page, count=1)
must(n == 1, "Bodoni Moda added to the preview font request")

# stock perfume bottles -> the real ODYS packshot (oud, boukhour, attar stay)
BOTTLES = ("1598634222670-87c5f558119c", "1638295916768-459f6cf440bc", "1640869116016-93c00ba94b28",
           "1705899844877-81bb0a0665c1", "1720423514789-15a33e59fc81", "1774682061055-3bfe402e5a12")
swapped = 0
for pid in BOTTLES:
    swapped += page.count(f"img/{pid}.webp")
    page = page.replace(f"img/{pid}.webp", "img/odys-packshot.webp")
must(swapped >= 40, f"{swapped} stock perfume photos -> ODYS 01 packshot")

# footer legal links -> the rendered CMS pages (published beside the preview)
LEGAL_LINKS = {"Livraison": "legal-livraison.html", "Retours": "legal-retours.html"}
linked = 0
for label, target in LEGAL_LINKS.items():
    page, n = re.subn(r'<a href="#"([^>]*)>(\s*' + label + r'\s*)</a>',
                      r'<a href="' + target + r'"\1>\2</a>', page)
    linked += n
must(linked >= 2, f"{linked} footer legal links -> rendered CMS pages")
# The prototype footer stops at Retours — no CGV, no small print. Add the
# three remaining pages there so every rendered policy is reachable.
extra = "".join(
    '<li><a href="legal-%s.html">%s</a></li>' % (slug, label)
    for slug, label in (("cgv", "Termes et conditions"),
                        ("confidentialite", "Confidentialité"),
                        ("mentions-legales", "Mentions légales"))
)
page, n = re.subn(r'(<li><a href="legal-retours\.html"[^>]*>\s*Retours\s*</a></li>)',
                  lambda m: m.group(1) + extra, page)
must(n >= 1, f"{n} footers extended with CGV, confidentialité and mentions légales")
must(linked >= 2, f"{linked} footer legal links rewritten")
for slug in ("livraison", "retours", "cgv", "confidentialite", "mentions-legales"):
    src = RENDER / f"legal-{slug}.html"
    must(src.exists(), f"legal-{slug}.html rendered")
    shutil.copy(src, PREVIEW / f"legal-{slug}.html")
shutil.copy(RENDER / "theme.css", PREVIEW / "theme.css")

used = sorted(set(re.findall(r'src="img/([a-z-]+\.webp)"', page)))
for name in used:
    src = RENDER / "assets" / "img" / name
    if src.exists():
        shutil.copy(src, PREVIEW / "img" / name)
missing = [n for n in used if not (PREVIEW / "img" / n).exists()]
must(not missing, f"{len(used)} named images present in preview/img ({missing or 'none missing'})")

idx.write_text(page, encoding="utf-8")
print(f"  preview home rebuilt ({len(page):,} bytes)")
