"""Sell Oud & Boukhour by the gram.

The importer already prices those products per gram (`unity = 'g'`), but every
page still spoke the language of a 50 ml perfume: a "Choisissez votre format /
50 ml" card, "Format 50ml" under the price, "Ajouter au Panier · 50ml", and a
card price with no unit. This makes the weight products say grams instead:

  * product page: gram cards (5 / 10 / 25 / 50 g) that set the quantity, a
    price line "15 DH / g", and a cart button that names the grammage;
  * product card: "15 DH /g" and a link to the page, since the grammage is
    chosen there (the shop refuses fewer than 5 g anyway);
  * app.js gets `pick-gram`, appended through nuit.js.

`$product.unity` is PrestaShop's own field, so nothing here hard-codes which
products are sold by weight.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
REF = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys"
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
            fails.append("%s: %s (%d matches)" % (label, what, n))
            continue
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8", newline="")


# ── 1. product page: gram cards instead of the 50 ml card ────────────────
GRAMS = """    {if $product.unity}
    {* Sold by weight (Oud & Boukhour): the cards set the quantity in grams,
       and the shop's own minimum is 5 g. *}
    <div class="vol-sel" role="group" aria-labelledby="gram-sel-label">
      <div class="vol-lbl" id="gram-sel-label">Choisissez votre grammage</div>
      <div class="vol-cards" id="gramCards" role="radiogroup" aria-label="Grammage">
        {foreach from=[5, 10, 25, 50] item=gram name=grams}
          <button class="vc{if $smarty.foreach.grams.first} on{/if}" type="button"
                  role="radio" aria-checked="{if $smarty.foreach.grams.first}true{else}false{/if}"
                  data-grams="{$gram}"
                  data-price="{($product.price_amount * $gram)|intval}"
                  data-action="pick-gram">
            <div class="vc-ml">{$gram}<span>g</span></div>
            <div class="vc-price">{($product.price_amount * $gram)|intval} DH</div>
          </button>
        {/foreach}
      </div>
      <p class="vol-note">{$product.price|intval} DH le gramme &middot; minimum 5 g</p>
    </div>
    {else}
"""

edit(REF / "templates" / "catalog" / "product.tpl", [
    ('    {* Volume selector — EAA: radiogroup *}\n'
     '    <div class="vol-sel" role="group" aria-labelledby="vol-sel-label">',
     GRAMS
     + '    {* Volume selector — EAA: radiogroup *}\n'
       '    <div class="vol-sel" role="group" aria-labelledby="vol-sel-label">',
     "gram cards added before the volume selector"),

    ('      </div>\n'
     '    </div>\n'
     '\n'
     '    <div class="live-price-block" itemprop="offers"',
     '      </div>\n'
     '    </div>\n'
     '    {/if}\n'
     '\n'
     '    <div class="live-price-block" itemprop="offers"',
     "volume selector closed off in the {else} branch"),

    ('<span class="lp-price" id="livePrice" itemprop="price" aria-live="polite" '
     'aria-atomic="true">{$product.price|intval} DH</span>',
     '<span class="lp-price" id="livePrice" itemprop="price" aria-live="polite" '
     'aria-atomic="true">{if $product.unity}{($product.price_amount * 5)|intval}'
     '{else}{$product.price|intval}{/if} DH</span>',
     "live price starts at the 5 g total"),

    ('      <span class="lp-vol"   id="liveVol"   aria-live="polite">· Format 50ml</span>',
     '      <span class="lp-vol"   id="liveVol"   aria-live="polite">'
     '{if $product.unity}· 5 g{else}· Format 50 ml{/if}</span>',
     "price line names grams for weight products"),

    ('        <span class="blbl">Ajouter au Panier · 50ml</span>',
     '        <span class="blbl">Ajouter au Panier · '
     '{if $product.unity}5 g{else}50 ml{/if}</span>',
     "cart button names grams for weight products"),

    ('        <span class="qty-v" id="qtyV" aria-live="polite" aria-atomic="true">1</span>',
     '        <span class="qty-v" id="qtyV" aria-live="polite" aria-atomic="true">'
     '{if $product.unity}5{else}1{/if}</span>',
     "quantity starts at the 5 g minimum"),

    ('      <div class="qty" role="group" aria-label="Quantité">',
     '      <div class="qty" role="group" '
     'aria-label="{if $product.unity}Grammes{else}Quantité{/if}">',
     "quantity control labelled in grams"),

    ('<span><span class="vn-count" id="vnCount">10</span> personnes regardent ce parfum</span>',
     '<span><span class="vn-count" id="vnCount">10</span> personnes regardent '
     '{if $product.unity}cet oud{else}ce parfum{/if}</span>',
     "social proof wording"),
])

# ── 2. product card: price per gram, and send weight products to the page ─
MINI = HERE / "templates" / "catalog" / "_partials" / "miniatures" / "product.tpl"
edit(MINI, [
    ('      <span class="pc-price" itemprop="price" content="{$product.price_amount}">'
     '{$product.price|intval} DH</span>',
     '      <span class="pc-price" itemprop="price" content="{$product.price_amount}">'
     '{$product.price|intval} DH{if $product.unity}<span class="pc-unit">'
     '&#8239;/&#8239;{$product.unity|escape:\'html\':\'UTF-8\'}</span>{/if}</span>',
     "price shows the unit"),

    ('    <button class="pc-add" type="button" data-action="add-to-cart"\n',
     '    {if $product.unity}\n'
     '      {* Sold by weight: the grammage is chosen on the product page, and\n'
     '         the shop refuses anything under the 5 g minimum anyway. *}\n'
     '      <a class="pc-add" href="{$product.url}">Choisir le grammage</a>\n'
     '    {else}\n'
     '    <button class="pc-add" type="button" data-action="add-to-cart"\n',
     "weight products link to the page"),

    ('      Ajouter au panier\n'
     '    </button>\n',
     '      Ajouter au panier\n'
     '    </button>\n'
     '    {/if}\n',
     "add-to-cart button closed off"),
], label="miniatures/product.tpl")

# ── 3. the gram cards need a click handler and a little CSS ──────────────
JS = """
/* ── Oud & Boukhour: grams ───────────────────────────────────────────
   The cards set the quantity the cart bridge reads (#qtyV), so buying
   25 g is buying 25 units of a product priced per gram. */
(function () {
  function pickGram(btn) {
    var grams = parseInt(btn.dataset.grams, 10);
    var price = parseInt(btn.dataset.price, 10);
    if (!grams) return;

    var cards = document.querySelectorAll('#gramCards .vc');
    for (var i = 0; i < cards.length; i++) {
      var on = cards[i] === btn;
      cards[i].classList.toggle('on', on);
      cards[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }

    var qty = document.getElementById('qtyV');
    if (qty) qty.textContent = grams;

    var live = document.getElementById('livePrice');
    if (live) live.textContent = price + ' DH';
    var vol = document.getElementById('liveVol');
    if (vol) vol.textContent = '\\u00b7 ' + grams + ' g';
    var free = document.getElementById('liveFree');
    if (free) {
      var left = 300 - price;
      free.textContent = left > 0 ? '+ ' + left + ' DH \\u2192 Livraison gratuite'
                                  : '\\u2713 Livraison gratuite incluse';
    }
    var label = document.querySelector('#addBtn .blbl');
    if (label) label.textContent = 'Ajouter au Panier \\u00b7 ' + grams + ' g';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="pick-gram"]');
    if (!btn) return;
    e.preventDefault();
    pickGram(btn);
  });

  // the − / + buttons move in grams too, never below the 5 g minimum
  document.addEventListener('click', function (e) {
    var step = e.target.closest('#gramCards ~ * [data-action="chg-qty"], .qty [data-action="chg-qty"]');
    if (!step || !document.getElementById('gramCards')) return;
    var qty = document.getElementById('qtyV');
    if (!qty) return;
    var value = Math.max(5, parseInt(qty.textContent, 10) || 5);
    qty.textContent = value;
  });
})();
"""

js_path = HERE / "nuit.js"
js = js_path.read_text(encoding="utf-8", newline="")
if "pick-gram" in js:
    print("  OK   nuit.js: gram handler (already applied)")
else:
    nl = "\r\n" if "\r\n" in js else "\n"
    js_path.write_text(js.rstrip() + nl + JS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   nuit.js: gram handler appended")

CSS = """
/* ── Oud & Boukhour sold by the gram ─────────────────────────────────── */
.vol-note{margin:10px 0 0;font-family:var(--font-sans,sans-serif);font-size:11px;
  letter-spacing:.4px;color:var(--odys-muted,rgba(237,227,211,.5))}
.pc-unit{font-size:.62em;letter-spacing:.5px;color:var(--odys-muted,rgba(237,227,211,.5))}
a.pc-add{display:block;text-align:center;text-decoration:none}
"""
css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "Oud & Boukhour sold by the gram" in css:
    print("  OK   theme-additions.css: gram styles (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: gram styles")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\noud & boukhour: priced, picked and added by the gram")
