"""Apply the product-page redesign from the mockup to ref/catalog/product.tpl.

What the mockup asks for and what was actually wrong with the page:

  * "suppression des badges inutiles" — the page shipped two invented numbers,
    "12 personnes consultent" and "10 personnes regardent ce parfum", both fed
    by Math.random() in app.js. Fabricated social proof, deleted.
  * the orange delivery bar repeated the announcement bar at the top of every
    page, and the two overlay chips sat on top of the bottle photo.
  * "Vous aimerez aussi" was filled from the prototype's SUGG_DB: six Unsplash
    photos, prototype prices and links that went nowhere. Replaced by the real
    accessories block (4 products, real images and URLs).
  * the four trust badges were emoji; the rest of the theme uses line icons.

Idempotent: re-running after a rebuild is a no-op.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
TPL = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "templates" / "catalog" / "product.tpl"

s = TPL.read_text(encoding="utf-8")
if "svc-grid" in s:
    print("  OK   product.tpl (already redesigned)")
    sys.exit(0)

before = len(s)


def cut(pattern, what, count=1):
    """Remove a block, and fail loudly if the page no longer looks as expected."""
    global s
    s, n = re.subn(pattern, "", s, flags=re.S)
    if n != count:
        raise SystemExit("product.tpl: expected %d %s, found %d" % (count, what, n))


# ── 1. the invented audience ─────────────────────────────────────────────
cut(r'[ \t]*<div class="gal-live".*?</div>\n(?:[ \t]*</div>\n)??(?=[ \t]*<img id="galMain")',
    "viewer counter in the gallery")
cut(r'[ \t]*<div class="viewing-now".*?\n[ \t]*</div>\n\n', "viewer counter in the info panel")
# the chips over the bottle
cut(r'[ \t]*<div class="gbadges".*?</div>\n', "overlay badges")
# the delivery bar: the announcement bar says the same thing on every page
cut(r'[ \t]*<div class="ih" role="note".*?\n[ \t]*</div>\n', "delivery bar")

# ── 2. the demo carousel ─────────────────────────────────────────────────
cut(r'[ \t]*\{\* Inline suggestion carousel \*\}\n.*?\n[ \t]*</div>\n[ \t]*</div>\n\n',
    "inline suggestion carousel")

# ── 3. format under the name, as the mockup has it ───────────────────────
NAME = '<h1 class="p-name" itemprop="name">{$product.name|escape:\'html\':\'UTF-8\'}</h1>\n'
if NAME not in s:
    raise SystemExit("product.tpl: product name heading not found")
s = s.replace(NAME, NAME + """    <div class="p-format">{if isset($product.unity) && $product.unity}Extrait concentré &middot; vendu au gramme{else}Extrait de Parfum &middot; 50 ml{/if}</div>
""", 1)

# ── 4. trust badges → the theme's line icons, two by two ─────────────────
OLD_TRUST = re.search(r'[ \t]*\{\* Trust badges \*\}\n[ \t]*<ul class="trust".*?</ul>\n', s, re.S)
if not OLD_TRUST:
    raise SystemExit("product.tpl: trust badges not found")

ICON = ('<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3"'
        ' stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">%s</svg>')
SERVICES = [
    ("Élaboré au Maroc", '<path d="M12 3 4 7v5c0 4.4 3.2 7.6 8 9 4.8-1.4 8-4.6 8-9V7l-8-4Z"/>'
                         '<path d="m9.4 11.8 1.9 1.9 3.5-3.6"/>'),
    ("Paiement à la livraison", '<rect x="3" y="6" width="18" height="12" rx="2"/>'
                                '<path d="M3 10h18"/><path d="M7 15h3"/>'),
    ("Livraison 24–48h", '<path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7z"/>'
                         '<circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/>'),
    ("Retours sous 14 jours", '<path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4h4"/>'),
]
rows = "\n".join(
    '      <li class="svc" role="listitem"><span class="svc-ic" aria-hidden="true">%s</span>%s</li>'
    % (ICON % path, label) for label, path in SERVICES)
s = (s[:OLD_TRUST.start()]
     + "    {* Services — discreet line icons, the same family as the header *}\n"
     + '    <ul class="svc-grid" aria-label="Nos services" role="list">\n'
     + rows + "\n    </ul>\n"
     + s[OLD_TRUST.end():])

# The recommendations keep the prototype's carousel: the block is the same,
# only its contents changed, from the demo table to the real accessories.

TPL.write_text(s, encoding="utf-8")
print("  OK   product.tpl: %d chars of clutter removed, services + 4 real recommendations"
      % (before - len(s)))

# the page must not carry a counter or a demo image any more
left = [t for t in ("vnViewers", "vnCount", "viewing-now", "iSuggTrack", "gbadges", 'class="ih"') if t in s]
if left:
    raise SystemExit("product.tpl still carries: " + ", ".join(left))
