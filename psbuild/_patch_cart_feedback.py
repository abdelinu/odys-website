"""The cart drawer could only ever be wrong, and adding gave no confirmation.

The drawer is the prototype's client-side cart. PrestaShop owns the real one,
so the panel sat in every page saying "Votre panier est vide" while the header
counter said 11 — and nothing opened it anyway, since the theme's own cart icon
was replaced by PrestaShop's widget.

So: drop the drawer, and confirm an add where the visitor is looking, reusing
the toast the theme already has (`.pts-toast`) with a link to the real cart.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
fails = []


def edit(path, pairs, label=None):
    label = label or path.name
    text = path.read_text(encoding="utf-8", newline="")
    nl = "\r\n" if "\r\n" in text else "\n"
    for old, new, what in pairs:
        old, new = old.replace("\n", nl), new.replace("\n", nl)
        if old not in text and (new == "" or new in text):
            print("  OK   %s: %s (already applied)" % (label, what))
            continue
        n = text.count(old)
        print(("  OK   " if n == 1 else "  FAIL ") + "%s: %s" % (label, what))
        if n != 1:
            fails.append("%s: %s (%d)" % (label, what, n))
            continue
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8", newline="")


edit(HERE / "templates" / "layouts" / "layout-full-width.tpl", [
    ("  {include file='_partials/cart-drawer.tpl'}\n",
     "  {* No cart drawer: PrestaShop owns the cart, and a second panel with its\n"
     "     own idea of the contents could only ever disagree with it. Adding to\n"
     "     the cart confirms itself with a toast (see nuit.js). *}\n"
     "  <div class=\"odys-toast\" id=\"odysToast\" role=\"status\" aria-live=\"polite\">\n"
     "    <span id=\"odysToastMsg\"></span>\n"
     "    <a href=\"{$urls.pages.cart}?action=show\">Voir le panier</a>\n"
     "  </div>\n",
     "drawer replaced by a toast"),
])

CSS = """
/* ── Add-to-cart confirmation ────────────────────────────────────────
   Same shape as the loyalty toast, one per page, polite live region. */
.odys-toast{position:fixed;left:50%;bottom:24px;z-index:900;display:flex;align-items:center;gap:14px;
  max-width:min(520px,calc(100vw - 32px));padding:13px 18px;border-radius:3px;
  background:var(--odys-surface,#111316);border:1px solid var(--odys-hairline,rgba(233,211,174,.28));
  box-shadow:0 18px 40px rgba(0,0,0,.5);color:var(--odys-text,#EDE3D3);
  font-family:var(--font-sans,sans-serif);font-size:12px;letter-spacing:.3px;
  transform:translateX(-50%) translateY(20px);opacity:0;pointer-events:none;
  transition:opacity .25s ease,transform .25s ease}
.odys-toast.show{opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto}
.odys-toast a{color:var(--odys-sand,#E9D3AE);text-decoration:none;white-space:nowrap;
  font-size:10px;letter-spacing:2px;text-transform:uppercase;border-bottom:1px solid currentColor}
@media (max-width:767px){.odys-toast{bottom:16px}}
@media (prefers-reduced-motion:reduce){.odys-toast{transition:opacity .01s}}
"""

css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "Add-to-cart confirmation" in css:
    print("  OK   theme-additions.css (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: toast")

JS = """
/* ── Add-to-cart confirmation ────────────────────────────────────────
   The header counter moves, but on a phone that is 40px of type in the
   corner. Say it where the thumb is, and link to the real cart. */
(function () {
  var toast = document.getElementById('odysToast');
  if (!toast) return;
  var label = document.getElementById('odysToastMsg');
  var timer = null;

  function show(message) {
    if (label) label.textContent = message;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }
  window.odysToast = show;

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest(
      '[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product]');
    if (!btn) return;
    var name = btn.dataset.name || (document.querySelector('.p-name') || {}).textContent || 'Article';
    var qty = parseInt((document.getElementById('qtyV') || {}).textContent || '1', 10);
    var unit = document.getElementById('gramCards') ? ' g' : '';
    show((qty > 1 ? qty + unit + ' \\u00d7 ' : '') + name.trim().slice(0, 48) + ' \\u2014 ajout\\u00e9 au panier');
  });
})();
"""

js_path = HERE / "nuit.js"
js = js_path.read_text(encoding="utf-8", newline="")
if "odysToast" in js:
    print("  OK   nuit.js (already applied)")
else:
    nl = "\r\n" if "\r\n" in js else "\n"
    js_path.write_text(js.rstrip() + nl + JS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   nuit.js: toast on add")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\ncart feedback replaces the drawer that could not be right")
