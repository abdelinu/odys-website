"""Five links in the nav and footer 404'd, and a hook lost its product.

/a-propos (in the main nav), /savoir-faire and /fidelite pointed at pages that
were never written: they are CMS pages now, published by the importer like the
legal ones, and the templates ask $link for their real address.

/parfums-frais and /parfums-orientaux were never categories - the families are
a filter on the Parfums listing, so those links carry the theme's own #fam-
hash instead.

And {hook h='displayProductAdditionalInfo'} was called without the product, so
ps_emailalerts threw "Undefined array key product" three times per page.
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
        print(("  OK   " if n >= 1 else "  FAIL ") + "%s: %s%s" % (
            label, what, "" if n == 1 else " (x%d)" % n))
        if n == 0:
            fails.append("%s: %s" % (label, what))
            continue
        text = text.replace(old, new)
    path.write_text(text, encoding="utf-8", newline="")


# ── 1. the hook that lost its product ────────────────────────────────────
edit(REF / "templates" / "catalog" / "product.tpl", [
    ("{hook h='displayProductAdditionalInfo'}",
     "{* Modules read $params['product'] here; without it ps_emailalerts warns\n"
     "       three times per page. *}\n"
     "    {hook h='displayProductAdditionalInfo' product=$product}",
     "displayProductAdditionalInfo gets the product"),
])

# ── 2. the three pages the footer promised ───────────────────────────────
edit(HERE / "import_catalogue.php", [
    ("    'mentions-legales' => ['Mentions légales', 'ODYS_CMS_MENTIONS'],\n",
     "    'mentions-legales' => ['Mentions légales', 'ODYS_CMS_MENTIONS'],\n"
     "    // the nav and footer link to these three; without them they 404\n"
     "    'a-propos' => ['À propos', 'ODYS_CMS_APROPOS'],\n"
     "    'savoir-faire' => ['Savoir-faire', 'ODYS_CMS_SAVOIRFAIRE'],\n"
     "    'fidelite' => ['Programme fidélité', 'ODYS_CMS_FIDELITE'],\n",
     "three more CMS pages published"),
])

edit(HERE / "templates" / "layouts" / "layout-full-width.tpl", [
    ("{assign var='odysUrlMentions' value=\"`$urls.base_url`mentions-legales\"}\n"
     "{if Configuration::get('ODYS_CMS_MENTIONS')}{assign var='odysUrlMentions'"
     " value=$link->getCMSLink(Configuration::get('ODYS_CMS_MENTIONS'))}{/if}\n",
     "{assign var='odysUrlMentions' value=\"`$urls.base_url`mentions-legales\"}\n"
     "{if Configuration::get('ODYS_CMS_MENTIONS')}{assign var='odysUrlMentions'"
     " value=$link->getCMSLink(Configuration::get('ODYS_CMS_MENTIONS'))}{/if}\n"
     "{assign var='odysUrlApropos' value=\"`$urls.base_url`a-propos\"}\n"
     "{if Configuration::get('ODYS_CMS_APROPOS')}{assign var='odysUrlApropos'"
     " value=$link->getCMSLink(Configuration::get('ODYS_CMS_APROPOS'))}{/if}\n"
     "{assign var='odysUrlSavoirFaire' value=\"`$urls.base_url`savoir-faire\"}\n"
     "{if Configuration::get('ODYS_CMS_SAVOIRFAIRE')}{assign var='odysUrlSavoirFaire'"
     " value=$link->getCMSLink(Configuration::get('ODYS_CMS_SAVOIRFAIRE'))}{/if}\n"
     "{assign var='odysUrlFidelite' value=\"`$urls.base_url`fidelite\"}\n"
     "{if Configuration::get('ODYS_CMS_FIDELITE')}{assign var='odysUrlFidelite'"
     " value=$link->getCMSLink(Configuration::get('ODYS_CMS_FIDELITE'))}{/if}\n",
     "URLs for the three new pages"),
])

# ── 3. the links themselves ──────────────────────────────────────────────
edit(HERE / "templates" / "_partials" / "header.tpl", [
    ('<li><a href="{$urls.base_url}a-propos">À propos</a></li>',
     '<li><a href="{$odysUrlApropos}">À propos</a></li>', "nav À propos"),
])
edit(HERE / "templates" / "_partials" / "mobile-menu.tpl", [
    ('<li><a href="{$urls.base_url}a-propos">À propos</a></li>',
     '<li><a href="{$odysUrlApropos}">À propos</a></li>', "mobile À propos"),
])
edit(HERE / "templates" / "_partials" / "footer.tpl", [
    ('<li><a href="{$urls.base_url}a-propos">Notre histoire</a></li>',
     '<li><a href="{$odysUrlApropos}">Notre histoire</a></li>', "footer Notre histoire"),
    ('<li><a href="{$urls.base_url}savoir-faire">Savoir-faire</a></li>',
     '<li><a href="{$odysUrlSavoirFaire}">Savoir-faire</a></li>', "footer Savoir-faire"),
    ('<li><a href="{$urls.base_url}fidelite">Programme fidélité</a></li>',
     '<li><a href="{$odysUrlFidelite}">Programme fidélité</a></li>', "footer fidélité"),
    # the families are a filter on the listing, never categories of their own
    ('<li><a href="{$urls.base_url}parfums-frais">Frais &amp; Aquatiques</a></li>',
     '<li><a href="{$odysUrlParfums}#fam-fresh">Frais &amp; Aquatiques</a></li>',
     "footer Frais & Aquatiques"),
    ('<li><a href="{$urls.base_url}parfums-orientaux">Orientaux &amp; Épicés</a></li>',
     '<li><a href="{$odysUrlParfums}#fam-oriental">Orientaux &amp; Épicés</a></li>',
     "footer Orientaux & Épicés"),
])
edit(HERE / "templates" / "_partials" / "home-signatures.tpl", [
    ("{assign var='sigUrlNoir'   value=\"`$urls.base_url`parfums-orientaux\"}",
     "{assign var='sigUrlNoir'   value=\"`$odysUrlParfums`#fam-oriental\"}",
     "signature card (noir)"),
    ("{assign var='sigUrlMarine' value=\"`$urls.base_url`parfums-frais\"}",
     "{assign var='sigUrlMarine' value=\"`$odysUrlParfums`#fam-fresh\"}",
     "signature card (marine)"),
])

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\nbroken links repaired, hook given its product")
