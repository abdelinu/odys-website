"""Three more things the checkout showed.

* blockreassurance printed its unconfigured demo text ("Security policy (edit
  with the Customer Reassurance module)") in black on the dark theme, with
  icons whose src is `//modules/...` — a protocol-relative URL with no host,
  so every icon 404'd. The theme has its own reassurance band, so the importer
  unhooks it; the `{hook h='displayReassurance'}` call stays for a shop that
  configures the module properly.
* The guest / login switch is a Bootstrap `.nav-inline` tab list the theme had
  no rules for, so it rendered as bullets.
* Every page title ended up "PrestaShop | ODYS Parfums Maroc" because the shop
  name was never set — it also signs the transactional e-mails.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
fails = []

# ── 1. the importer unhooks the demo reassurance block and names the shop ──
PHP_HOOK = """
// blockreassurance ships unconfigured demo text in black, and its icon URLs
// start with // (no host), so they 404. The theme carries its own reassurance
// band; unhook the module rather than show "edit with the Customer
// Reassurance module" to a customer at checkout.
$reassurance = Module::getInstanceByName('blockreassurance');
if ($reassurance && Validate::isLoadedObject($reassurance) && $reassurance->id) {
    foreach (['displayReassurance', 'displayProductAdditionalInfo', 'displayFooterBefore',
        'displayHome', 'displayCheckoutSummaryTop', 'displayShoppingCartFooter'] as $hookName) {
        if (Hook::isModuleRegisteredOnHook($reassurance, $hookName, (int) Context::getContext()->shop->id)) {
            $reassurance->unregisterHook($hookName);
            say("  blockreassurance unhooked from $hookName");
        }
    }
}
"""

PHP_NAME = """
// The shop name signs every page title and every transactional e-mail; a
// fresh install calls itself "PrestaShop".
if (Configuration::get('PS_SHOP_NAME') !== 'ODYS Parfums') {
    Configuration::updateValue('PS_SHOP_NAME', 'ODYS Parfums');
    say('Shop name set to ODYS Parfums');
}
"""

php_path = HERE / "import_catalogue.php"
php = php_path.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in php else "\n"
anchor = "// ── legal pages ─"
if "blockreassurance" in php:
    print("  OK   import_catalogue.php: reassurance + shop name (already applied)")
elif anchor not in php:
    fails.append("import_catalogue.php anchor")
    print("  FAIL import_catalogue.php: anchor")
else:
    block = (PHP_HOOK.strip("\n") + nl + nl + PHP_NAME.strip("\n") + nl + nl).replace("\n", nl)
    php_path.write_text(php.replace(anchor, block + anchor, 1), encoding="utf-8", newline="")
    print("  OK   import_catalogue.php: reassurance unhooked, shop name set")

# ── 2. the guest / login tabs ────────────────────────────────────────────
CSS = """
/* the guest / login switch at checkout is a Bootstrap tab list */
.nav-inline,.nav-tabs,ul.nav[role="tablist"]{display:flex;flex-wrap:wrap;gap:6px;list-style:none;
  margin:0 0 18px;padding:0;border-bottom:1px solid var(--odys-hairline,rgba(233,211,174,.14))}
.nav-inline .nav-item,.nav-tabs .nav-item{margin:0}
.nav-link{display:inline-block;padding:10px 16px;text-decoration:none;
  font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:2px;text-transform:uppercase;
  color:var(--odys-muted,rgba(237,227,211,.55));border-bottom:2px solid transparent}
.nav-link:hover{color:var(--odys-text,#EDE3D3)}
.nav-link.active{color:var(--odys-sand,#E9D3AE);border-bottom-color:var(--odys-sand,#E9D3AE)}
.tab-content > .tab-pane{display:none}
.tab-content > .tab-pane.active,.tab-content > .tab-pane.in{display:block}
"""
css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "guest / login switch" in css:
    print("  OK   theme-additions.css: tabs (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: checkout tabs")

if fails:
    print("\n%d FAILED" % len(fails))
    sys.exit(1)
print("\nreassurance unhooked, tabs styled, shop named")
