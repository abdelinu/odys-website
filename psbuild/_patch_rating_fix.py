"""Three real defects found while testing the oud page.

1. `prestashop.emit('updateCart')` ran before the cart-widget refresh, so one
   throwing listener killed the refresh. PrestaShop's own ps_productcomments
   JS throws on every product page here (the theme never renders that module's
   templates, so its variables are undefined), and that is exactly what
   happened: the header counter stayed put after an add. The emit is now in a
   try/catch, and the module is disabled by the importer.

2. The product page hard-coded a 4.9 rating with `reviewCount` 0 - a review
   score the shop does not have, in schema.org markup Google reads. It now
   renders only when real comments exist.

3. The announcement bar claimed "4.9/5 - Plus de 1 284 clients" on a shop with
   no customers yet. Replaced with something true.
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


# 1. the updateCart try/catch lives in build_theme.py (the refresh call it
#    guards is added there too) - nothing to do here.

# ── 2. no rating until there are real reviews ────────────────────────────
edit(REF / "templates" / "catalog" / "product.tpl", [
    (',\n "aggregateRating":{"@type":"AggregateRating","ratingValue":"4.9",'
     '"reviewCount":"{$product.nb_comments|default:0}"}}',
     '{if $product.nb_comments > 0},\n'
     ' "aggregateRating":{"@type":"AggregateRating",'
     '"ratingValue":"{$product.rating|default:5}",'
     '"reviewCount":"{$product.nb_comments}"}{/if}}',
     "JSON-LD rating only with real reviews"),
])

tpl = REF / "templates" / "catalog" / "product.tpl"
text = tpl.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in text else "\n"
start = text.find('    <div class="rating" itemprop="aggregateRating"')
if "fake review signal" in text:
    print("  OK   product.tpl: rating block gated (already applied)")
elif start < 0:
    fails.append("product.tpl: rating block not found")
    print("  FAIL product.tpl: rating block not found")
else:
    end = text.index("</div>", text.index("avis</span>", start)) + len("</div>")
    block = text[start:end]
    text = (text[:start] + "    {* A score the shop has not earned yet is a fake review signal,"
            + nl + "       and Google reads this markup. Show it when reviews exist. *}" + nl
            + "    {if $product.nb_comments > 0}" + nl + block + nl + "    {/if}"
            + text[end:])
    tpl.write_text(text, encoding="utf-8", newline="")
    print("  OK   product.tpl: rating row shown only with real reviews (%d chars)" % len(block))

# ── 3. the announcement bar claimed customers the shop does not have ─────
edit(HERE / "templates" / "_partials" / "announcement-bar.tpl", [
    ("4.9/5 · Plus de <strong>1 284 clients</strong> satisfaits ce mois",
     "<strong>Élaboré au Maroc</strong> · Extrait de parfum 18–20 % concentré",
     "invented review score replaced"),
])

# ── 4. four gram cards, four columns ─────────────────────────────────────
css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "#gramCards" in css:
    print("  OK   theme-additions.css: gram grid (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(
        css.rstrip() + nl
        + "#gramCards{grid-template-columns:repeat(4,minmax(0,1fr))}".replace("\n", nl) + nl
        + "@media (max-width:640px){#gramCards{grid-template-columns:repeat(2,minmax(0,1fr))}}" + nl,
        encoding="utf-8", newline="")
    print("  OK   theme-additions.css: gram cards in one row")

# ── 5. the importer disables the module whose JS throws here ─────────────
PHP = """
// ps_productcomments loads its JavaScript on every product page but the theme
// renders none of its templates, so the variables that JS expects are never
// defined and it throws - which, through the updateCart listeners, stopped the
// cart widget from refreshing. Disabled, not uninstalled: re-enable it after
// adding the module's hooks to templates/catalog/product.tpl.
// (PrestaShop ships it as `productcomments`; older builds prefix it.)
foreach (['productcomments', 'ps_productcomments'] as $commentsName) {
    $comments = Module::getInstanceByName($commentsName);
    if ($comments && Validate::isLoadedObject($comments) && $comments->active) {
        $comments->disable();
        say("  $commentsName disabled (its JS throws without its templates)");
    }
}
"""
php_path = HERE / "import_catalogue.php"
php = php_path.read_text(encoding="utf-8", newline="")
anchor = "say($unhooked ? \"  $unhooked module(s) removed from the home page\" : '  home already clean');"
if "ps_productcomments" in php:
    print("  OK   import_catalogue.php: ps_productcomments disabled (already applied)")
elif anchor not in php:
    fails.append("import_catalogue.php: home-modules anchor not found")
    print("  FAIL import_catalogue.php: anchor")
else:
    nl = "\r\n" if "\r\n" in php else "\n"
    php_path.write_text(php.replace(anchor, anchor + nl + PHP.strip("\n").replace("\n", nl), 1),
                        encoding="utf-8", newline="")
    print("  OK   import_catalogue.php: ps_productcomments disabled")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\ncart refresh, ratings and the announcement bar fixed")
