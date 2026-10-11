"""Let the shop choose the three bottles in "Collection signature".

The band fell back to three hard-coded house entries, so changing it meant
editing a template. It now reads `ODYS_SIG_1..3` — three product pickers in
the ODYS settings form — and the module assigns `$signatures`, which the
template already prefers over its defaults. Leave a slot empty and the block
simply shows fewer bottles; clear all three and the house defaults return.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
MOD = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "modules" / "odys_loyalty" / "odys_loyalty.php"
KEYS = "'ODYS_SIG_1','ODYS_SIG_2','ODYS_SIG_3',"

s = MOD.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in s else "\n"
if "ODYS_SIG_1" in s:
    print("  OK   odys_loyalty (already applied)")
    sys.exit(0)

# ── 1. the hook that feeds the home page ─────────────────────────────────
s = s.replace("            && $this->registerHook('displayProductAdditionalInfo')",
              "            && $this->registerHook('displayProductAdditionalInfo')" + nl
              + "            && $this->registerHook('actionFrontControllerSetMedia')", 1)

HOOK = nl.join([
    "",
    "    /**",
    "     * The home page's \"Collection signature\" band.",
    "     *",
    "     * The template keeps three house defaults so the page never renders",
    "     * empty; whatever is assigned here wins. The slots hold product ids,",
    "     * picked in this module's settings, so choosing which flacons appear",
    "     * never means editing a template.",
    "     */",
    "    public function hookActionFrontControllerSetMedia()",
    "    {",
    "        $controller = $this->context->controller;",
    "        if (!isset($controller->php_self) || $controller->php_self !== 'index') {",
    "            return;",
    "        }",
    "",
    "        // position decides the glow, so the trio keeps its noir / marine /",
    "        // crème rhythm whichever products are chosen",
    "        $tones = ['noir', 'marine', 'creme'];",
    "        $eyebrows = ['Noir & Or', 'Marine & Or', 'Crème & Or'];",
    "        $tiers = ['Prestige', 'Élégant', 'Classique'];",
    "",
    "        $idLang = (int) $this->context->language->id;",
    "        $signatures = [];",
    "        foreach ([1, 2, 3] as $slot) {",
    "            $idProduct = (int) Configuration::get('ODYS_SIG_' . $slot);",
    "            if (!$idProduct) {",
    "                continue;",
    "            }",
    "            $product = new Product($idProduct, false, $idLang);",
    "            if (!Validate::isLoadedObject($product) || !$product->active) {",
    "                continue;",
    "            }",
    "            $slotIndex = count($signatures);",
    "            $reference = trim((string) $product->reference);",
    "            $signatures[] = [",
    "                'num' => $reference !== '' ? $reference : (string) $product->id,",
    "                'code' => $reference !== '' ? 'ODYS ' . $reference : (string) $product->name,",
    "                'tone' => $tones[$slotIndex % 3],",
    "                'eyebrow' => $eyebrows[$slotIndex % 3],",
    "                'tier' => $tiers[$slotIndex % 3],",
    "                'name' => (string) $product->name,",
    "                'volume' => 'Extrait de Parfum · 50 ml',",
    "                'mood' => $this->signatureMood($product, $idLang),",
    "                'desc' => trim(strip_tags((string) $product->description_short)),",
    "                'url' => $this->context->link->getProductLink($product),",
    "            ];",
    "        }",
    "",
    "        if ($signatures) {",
    "            $this->context->smarty->assign('signatures', $signatures);",
    "        }",
    "    }",
    "",
    "    /** The family the catalogue gave the product, else its short text. */",
    "    private function signatureMood(Product $product, int $idLang): string",
    "    {",
    "        foreach ((array) $product->getFrontFeatures($idLang) as $feature) {",
    "            if (isset($feature['name']) && $feature['name'] === 'Famille olfactive') {",
    "                return Tools::ucfirst((string) $feature['value']);",
    "            }",
    "        }",
    "",
    "        return Tools::substr(trim(strip_tags((string) $product->description_short)), 0, 48);",
    "    }",
    "",
])
anchor = "    public function getContent(): string"
assert anchor in s, "getContent anchor"
s = s.replace(anchor, HOOK + anchor, 1)

# ── 2. the settings: three product pickers ───────────────────────────────
s = s.replace("foreach (['ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_CAT_FLACONS','ODYS_WA_NUMBER',"
              "'ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_TIKTOK'] as $key) {",
              "foreach ([" + KEYS + "'ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_CAT_FLACONS','ODYS_WA_NUMBER',"
              "'ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_TIKTOK'] as $key) {", 1)
s = s.replace("foreach (['ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_CAT_FLACONS','ODYS_WA_NUMBER',"
              "'ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_TIKTOK'] as $k) {",
              "foreach ([" + KEYS + "'ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_CAT_FLACONS','ODYS_WA_NUMBER',"
              "'ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_TIKTOK'] as $k) {", 1)

FIELDS = nl.join([
    "        // the products to choose from, plus an empty slot",
    "        $choices = array_merge(",
    "            [['id_product' => 0, 'name' => '— aucun —']],",
    "            (array) Product::getSimpleProducts((int) $this->context->language->id)",
    "        );",
    "        $signatureField = function ($slot) use ($choices) {",
    "            return [",
    "                'type' => 'select',",
    "                'label' => 'Signature ' . $slot . ' (accueil)',",
    "                'name' => 'ODYS_SIG_' . $slot,",
    "                'desc' => $slot === 1",
    "                    ? 'Les trois flacons de la bande « Collection signature ». Vide : les trois par défaut.'",
    "                    : '',",
    "                'options' => ['query' => $choices, 'id' => 'id_product', 'name' => 'name'],",
    "            ];",
    "        };",
    "",
    "        return $helper->generateForm([[",
])
s = s.replace("        return $helper->generateForm([[", FIELDS, 1)
s = s.replace("                'input'  => [" + nl,
              "                'input'  => [" + nl
              + "                    $signatureField(1)," + nl
              + "                    $signatureField(2)," + nl
              + "                    $signatureField(3)," + nl, 1)

MOD.write_text(s, encoding="utf-8", newline="")
print("  OK   odys_loyalty: hook + three product pickers")

# ── 3. the importer seeds the slots and registers the hook ───────────────
PHP = """
// ── Home page signatures ────────────────────────────────────────────────
// The "Collection signature" band shows three flacons; which three is a
// setting (Modules → ODYS Loyalty), not a template edit. Seed the slots with
// the house trio the theme used to hard-code, and register the hook on a
// module that is already installed.
$signatureRefs = ['14', '07', '11'];
$slot = 1;
foreach ($signatureRefs as $reference) {
    $key = 'ODYS_SIG_' . $slot;
    if (!Configuration::get($key)) {
        $idProduct = (int) Db::getInstance()->getValue(
            'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "' . pSQL($reference) . '"'
        );
        if ($idProduct) {
            Configuration::updateValue($key, $idProduct);
            say("  signature $slot: ODYS $reference");
        }
    }
    ++$slot;
}
$loyalty = Module::getInstanceByName('odys_loyalty');
if ($loyalty && Validate::isLoadedObject($loyalty) && $loyalty->id
    && !Hook::isModuleRegisteredOnHook($loyalty, 'actionFrontControllerSetMedia',
        (int) Context::getContext()->shop->id)
) {
    $loyalty->registerHook('actionFrontControllerSetMedia');
    say('  odys_loyalty now feeds the home page its signatures');
}
"""
imp = HERE / "import_catalogue.php"
php = imp.read_text(encoding="utf-8", newline="")
nl2 = "\r\n" if "\r\n" in php else "\n"
anchor = "// ── legal pages ─"
if "ODYS_SIG_" in php:
    print("  OK   import_catalogue.php (already applied)")
else:
    assert anchor in php, "importer anchor"
    imp.write_text(php.replace(anchor, PHP.strip("\n").replace("\n", nl2) + nl2 + nl2 + anchor, 1),
                   encoding="utf-8", newline="")
    print("  OK   import_catalogue.php: slots seeded, hook registered")

print("\nthe signature trio is a setting now")
