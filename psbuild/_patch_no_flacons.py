"""Remove the Flacons Voyage page from the theme.

With a single 50 ml size it only duplicated Parfums, so the nav entries, the
layout's URL lookup, the category the importer created and the README row all
go. The importer now also deletes a Flacons Voyage category an earlier run
created — unless products still sit in it.

Re-runnable: an edit already applied is reported and skipped.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
fails = []


def edit(rel, pairs):
    """Apply replacements to one file, matching whatever line ending it uses."""
    path = HERE / rel
    text = path.read_text(encoding="utf-8", newline="")
    nl = "\r\n" if "\r\n" in text else "\n"
    for pair in pairs:
        old, new = pair[0].replace("\n", nl), pair[1].replace("\n", nl)
        what = pair[2] if len(pair) > 2 else pair[0].split("\n")[0][:48]
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


# ── nav: header, footer, mobile menu ─────────────────────────────────────
edit("templates/_partials/header.tpl", [
    ('      <li><a href="{$urls.base_url}flacons-voyage">Flacons</a></li>\n', "",
     "nav entry removed")])
edit("templates/_partials/footer.tpl", [
    ('          <li><a href="{$urls.base_url}flacons-voyage">Flacons Voyage</a></li>\n', "",
     "footer entry removed")])
edit("templates/_partials/mobile-menu.tpl", [
    ('    <li><a href="{$urls.base_url}flacons-voyage">Flacons Voyage</a></li>\n', "",
     "mobile menu entry removed")])

# ── layout: the URL lookup has nothing left to point at ──────────────────
edit("templates/layouts/layout-full-width.tpl", [
    ("{assign var='odysUrlFlacons' value=\"`$urls.base_url`flacons-voyage\"}\n"
     "{if Configuration::get('ODYS_CAT_FLACONS')}{assign var='odysUrlFlacons'"
     " value=$link->getCategoryLink(Configuration::get('ODYS_CAT_FLACONS'))}{/if}\n", "",
     "$odysUrlFlacons assign removed")])

# ── build: the URL rewrite map entry and the README row ──────────────────
edit("build_theme.py", [
    ('    "{$urls.base_url}flacons-voyage": "{$odysUrlFlacons}",\n', "",
     "URL rewrite map entry removed"),
    ('    ("| `flacons-voyage` | Flacons Voyage | Travel sizes 20–100ml |",\n'
     '     "| `flacons-voyage` | Flacons Voyage | 50 ml bottles |", "category table"),\n',
     '    ("| `flacons-voyage` | Flacons Voyage | 50 ml bottles |\\n", "", "category table row"),\n',
     "README category row deleted, not reworded"),
])

# ── importer: stop creating the category, and drop an existing one ───────
PHP_DELETE = """Configuration::updateValue('ODYS_CAT_COFFRETS', (int) $categories['Coffrets']);

// Flacons Voyage is gone - with a single 50 ml size it duplicated Parfums. An
// earlier run may have created it, so drop it rather than leave an empty
// category in the menus, the search and the sitemap.
$idFlacons = (int) Db::getInstance()->getValue(
    'SELECT c.id_category FROM ' . _DB_PREFIX_ . 'category c
     JOIN ' . _DB_PREFIX_ . 'category_lang cl ON cl.id_category = c.id_category
     WHERE cl.link_rewrite = "flacons-voyage"'
);
if ($idFlacons) {
    $flacons = new Category($idFlacons);
    $nb = (int) $flacons->getProducts(null, null, null, null, null, true);
    if ($nb) {
        say("  Flacons Voyage kept: $nb product(s) still in it - move them first");
    } else {
        $flacons->delete();
        say('  Flacons Voyage category removed (single 50 ml size)');
    }
}
Configuration::deleteByName('ODYS_CAT_FLACONS');
"""

edit("import_catalogue.php", [
    ("// The theme links to /parfums, /oud-boukhour, /coffrets and /flacons-voyage.",
     "// The theme links to /parfums, /oud-boukhour and /coffrets.",
     "URL-scheme comment"),
    ("    'Coffrets' => ensureCategory('Coffrets', 'coffrets', $home, $idLang),\n"
     "    'Flacons Voyage' => ensureCategory('Flacons Voyage', 'flacons-voyage', $home, $idLang),\n",
     "    'Coffrets' => ensureCategory('Coffrets', 'coffrets', $home, $idLang),\n",
     "category no longer created"),
    ("Configuration::updateValue('ODYS_CAT_COFFRETS', (int) $categories['Coffrets']);\n"
     "Configuration::updateValue('ODYS_CAT_FLACONS', (int) $categories['Flacons Voyage']);\n",
     PHP_DELETE,
     "existing category deleted, ODYS_CAT_FLACONS dropped"),
])

# ── nothing left pointing at it ──────────────────────────────────────────
for rel in ("templates/_partials/header.tpl", "templates/_partials/footer.tpl",
            "templates/_partials/mobile-menu.tpl", "templates/layouts/layout-full-width.tpl"):
    bad = "flacons" in (HERE / rel).read_text(encoding="utf-8").lower()
    print(("  FAIL " if bad else "  OK   ") + "%s: no flacons reference left" % rel)
    if bad:
        fails.append("%s: flacons reference left" % rel)

php = (HERE / "import_catalogue.php").read_text(encoding="utf-8")
ok = php.count("ensureCategory('Flacons Voyage'") == 0 and "flacons-voyage\"'" in php
print(("  OK   " if ok else "  FAIL ") + "import_catalogue.php: creates 3 categories, deletes flacons")
if not ok:
    fails.append("import_catalogue.php: category handling")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\ntheme sources: Flacons Voyage removed")
