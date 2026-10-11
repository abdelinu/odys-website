"""Get PrestaShop's demo content off the ODYS home, and style what stays.

A stock PrestaShop install hooks sample content to displayHome: Lorem slides
("Sample 1"), a "20% OFF ON CLOTHES" banner, a custom text block and product
rails. The ODYS home is built by the theme, so the importer unhooks them.

The newsletter block is real, not demo, but it rendered raw *after* the footer
because displayFooterBefore sat below the footer include. It moves above the
footer and gets styling.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
fails = []


def edit(rel, pairs):
    path = HERE / rel
    text = path.read_text(encoding="utf-8", newline="")
    nl = "\r\n" if "\r\n" in text else "\n"
    for old, new, what in pairs:
        old, new = old.replace("\n", nl), new.replace("\n", nl)
        if old not in text and (new == "" or new in text):
            print("  OK   %s: %s (already applied)" % (rel, what))
            continue
        n = text.count(old)
        print(("  OK   " if n == 1 else "  FAIL ") + "%s: %s" % (rel, what))
        if n != 1:
            fails.append("%s: %s (%d matches)" % (rel, what, n))
            continue
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8", newline="")


# ── 1. displayFooterBefore belongs before the footer ─────────────────────
edit("templates/layouts/layout-full-width.tpl", [
    ("  {include file='_partials/footer.tpl'}\n",
     "  {* Modules hooked here (the newsletter, for one) render above the footer;\n"
     "     below it they landed after </footer> with no styling. *}\n"
     "  {hook h='displayFooterBefore'}\n\n"
     "  {include file='_partials/footer.tpl'}\n",
     "displayFooterBefore moved above the footer"),
    ("\n  {hook h='displayFooterBefore'}\n</body>", "\n</body>",
     "old hook call after the footer removed"),
])

# ── 2. style the newsletter, hide leftover icon glyphs ───────────────────
CSS = """
/* ── PrestaShop's newsletter block (displayFooterBefore) ──────────────
   Classic ships it with Bootstrap 4 alpha classes this theme never had,
   so both submit buttons showed and the form had no styling at all. */
.block_newsletter{max-width:var(--content-max,1280px);margin:0 auto;padding:var(--spacing-xl,48px) var(--page-gutter,24px);
  border-top:1px solid var(--odys-hairline,rgba(233,211,174,.14));text-align:center}
.block_newsletter .row{display:block;margin:0}
.block_newsletter [class^="col-"]{width:auto;padding:0;max-width:none;flex:none}
.block_newsletter #block-newsletter-label{font-family:var(--font-display,serif);font-size:clamp(20px,2.4vw,28px);
  color:var(--odys-text,#EDE3D3);margin:0 0 18px}
.block_newsletter form{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;align-items:center}
.block_newsletter .input-wrapper{flex:1 1 280px;max-width:360px;order:1}
.block_newsletter input[type="email"]{width:100%;padding:13px 16px;background:transparent;
  border:1px solid var(--odys-hairline,rgba(233,211,174,.22));border-radius:2px;
  color:var(--odys-text,#EDE3D3);font-family:var(--font-sans,sans-serif);font-size:13px}
.block_newsletter input[type="email"]::placeholder{color:var(--odys-muted,rgba(237,227,211,.45))}
.block_newsletter input[type="email"]:focus{outline:none;border-color:var(--odys-sand,#E9D3AE)}
.block_newsletter input[type="submit"]{order:2;padding:13px 26px;border:1px solid var(--odys-sand,#E9D3AE);
  background:transparent;color:var(--odys-sand,#E9D3AE);font-family:var(--font-sans,sans-serif);
  font-size:10px;letter-spacing:2.5px;text-transform:uppercase;cursor:pointer;border-radius:2px;
  transition:background .2s ease,color .2s ease}
.block_newsletter input[type="submit"]:hover{background:var(--odys-sand,#E9D3AE);color:#0A0B0D}
.block_newsletter .hidden-sm-up{display:none}           /* the mobile "ok" duplicate */
.block_newsletter form > .row:last-child p,
.block_newsletter p:not(#block-newsletter-label){order:3;flex:1 1 100%;margin:8px 0 0;
  font-size:11px;line-height:1.7;color:var(--odys-muted,rgba(237,227,211,.45))}
.block_newsletter .clearfix{display:none}

/* Classic uses the Material Icons webfont for a handful of glyphs; the theme
   ships no such font, so they rendered as empty boxes. It uses its own SVG
   and text marks instead. */
.material-icons{display:none}

/* nothing hooked to displayHome should leave a gap */
.home-modules:empty{display:none}
"""

css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "PrestaShop's newsletter block" in css:
    print("  OK   theme-additions.css: newsletter styles (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: newsletter styles + icon fallback")

# ── 3. the importer unhooks PrestaShop's demo content ────────────────────
PHP = """
// ── PrestaShop's demo content ───────────────────────────────────────────
// A stock install hooks sample blocks to displayHome: Lorem slides labelled
// "Sample 1", a "20% OFF ON CLOTHES" banner, a custom text block and product
// rails. The ODYS home is the theme's own, so unhook them - unhooked, not
// uninstalled, so a shop owner can hook one back with real content.
say('Home modules:');
$demoHome = ['ps_imageslider', 'ps_banner', 'ps_customtext', 'ps_newproducts',
    'ps_featuredproducts', 'ps_categoryproducts', 'ps_bestsellers', 'ps_specials'];
$unhooked = 0;
foreach ($demoHome as $moduleName) {
    $module = Module::getInstanceByName($moduleName);
    if (!$module || !Validate::isLoadedObject($module) || !$module->id) {
        continue;
    }
    if (Hook::isModuleRegisteredOnHook($module, 'displayHome', (int) Context::getContext()->shop->id)) {
        $module->unregisterHook('displayHome');
        say("  $moduleName unhooked from displayHome");
        ++$unhooked;
    }
}
say($unhooked ? "  $unhooked module(s) removed from the home page" : '  home already clean');
"""

php_path = HERE / "import_catalogue.php"
php = php_path.read_text(encoding="utf-8", newline="")
anchor = "// ── legal pages ─"
if "PrestaShop's demo content" in php:
    print("  OK   import_catalogue.php: demo modules unhooked (already applied)")
elif anchor not in php:
    fails.append("import_catalogue.php: legal-pages anchor not found")
    print("  FAIL import_catalogue.php: anchor")
else:
    nl = "\r\n" if "\r\n" in php else "\n"
    php = php.replace(anchor, PHP.strip("\n").replace("\n", nl) + nl + nl + anchor, 1)
    php_path.write_text(php, encoding="utf-8", newline="")
    print("  OK   import_catalogue.php: demo modules unhooked")

# oud is sold by the gram: 5 g is the smallest cut worth weighing
edit("import_catalogue.php", [
    ("    $product->minimal_quantity = 1;\n",
     "    $product->minimal_quantity = $perGram ? 5 : 1;\n",
     "oud minimum order is 5 g"),
])

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\nhome cleaned, newsletter styled, oud minimum set")
