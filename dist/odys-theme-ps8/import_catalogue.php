<?php
/**
 * Load the ODYS catalogue (catalogue.json) into PrestaShop.
 *
 *   php import_catalogue.php                 # create/update products
 *   php import_catalogue.php --remove-demo   # also delete PrestaShop's samples
 *   php import_catalogue.php --refresh-images  # re-read the photos in img/
 *
 * Idempotent: products are matched on `reference`, so re-running updates
 * instead of duplicating. Prices come from the prototype — check them against
 * your real price list before going live.
 *
 * Run it from the PrestaShop root (or pass --root=/path/to/prestashop).
 */
// En ligne, il n'y a pas d'$argv et la racine n'est pas /var/www/html : le
// fichier est dans un sous-dossier de public_html, donc la boutique est juste
// au-dessus. On le déduit plutôt que de le demander.
$root = PHP_SAPI === 'cli' ? '/var/www/html' : dirname(__DIR__);
if (PHP_SAPI !== 'cli') {
    header('Content-Type: text/plain; charset=utf-8');
}
$removeDemo = false;
$refreshImages = false;
foreach (array_slice($argv ?? [], 1) as $arg) {
    if ($arg === '--remove-demo') {
        $removeDemo = true;
    } elseif ($arg === '--refresh-images') {
        $refreshImages = true;
    } elseif (strpos($arg, '--root=') === 0) {
        $root = substr($arg, 7);
    }
}

require_once rtrim($root, '/') . '/config/config.inc.php';

// HTMLPurifier, appelé par CMS::update, refuse d'écrire si son dossier de
// cache manque — ce qui arrive après un vidage de cache — et imprime trois
// avertissements au milieu du compte rendu.
@mkdir(_PS_CACHE_DIR_ . 'purifier', 0775, true);

$catalogue = json_decode(file_get_contents(__DIR__ . '/catalogue.json'), true);
if (!is_array($catalogue)) {
    exit("catalogue.json missing or unreadable\n");
}

$idLang = (int) Configuration::get('PS_LANG_DEFAULT');
$idShop = (int) Configuration::get('PS_SHOP_DEFAULT');
$home = (int) Configuration::get('PS_HOME_CATEGORY');

function say($msg)
{
    echo $msg, PHP_EOL;
}

/** Find or create a category, keeping the friendly URL the theme expects. */
function ensureCategory($name, $linkRewrite, $idParent, $idLang)
{
    $id = (int) Db::getInstance()->getValue(
        'SELECT c.id_category FROM ' . _DB_PREFIX_ . 'category c
         JOIN ' . _DB_PREFIX_ . 'category_lang cl ON cl.id_category = c.id_category
         WHERE cl.link_rewrite = "' . pSQL($linkRewrite) . '"'
    );
    if ($id) {
        return $id;
    }
    $category = new Category();
    $category->id_parent = (int) $idParent;
    $category->active = true;
    foreach (Language::getLanguages(false) as $lang) {
        $l = (int) $lang['id_lang'];
        $category->name[$l] = $name;
        $category->link_rewrite[$l] = $linkRewrite;
    }
    $category->add();
    say("  category created: $name (/$linkRewrite)");

    return (int) $category->id;
}

/** The scent family drives the theme's filters; store it as a feature. */
function ensureFeature($name, $idLang)
{
    $id = (int) Db::getInstance()->getValue(
        'SELECT id_feature FROM ' . _DB_PREFIX_ . 'feature_lang WHERE name = "' . pSQL($name) . '"'
    );
    if ($id) {
        return $id;
    }
    $feature = new Feature();
    foreach (Language::getLanguages(false) as $lang) {
        $feature->name[(int) $lang['id_lang']] = $name;
    }
    $feature->add();

    return (int) $feature->id;
}

function ensureFeatureValue($idFeature, $value)
{
    $id = (int) Db::getInstance()->getValue(
        'SELECT fv.id_feature_value FROM ' . _DB_PREFIX_ . 'feature_value fv
         JOIN ' . _DB_PREFIX_ . 'feature_value_lang fvl ON fvl.id_feature_value = fv.id_feature_value
         WHERE fv.id_feature = ' . (int) $idFeature . ' AND fvl.value = "' . pSQL($value) . '"'
    );
    if ($id) {
        return $id;
    }
    $fv = new FeatureValue();
    $fv->id_feature = (int) $idFeature;
    $fv->custom = false;
    foreach (Language::getLanguages(false) as $lang) {
        $fv->value[(int) $lang['id_lang']] = $value;
    }
    $fv->add();

    return (int) $fv->id;
}

/**
 * The photo for one product.
 *
 * Every product used to get the same perfume packshot, so a reed diffuser was
 * illustrated by a bottle of extrait. Look for the most specific file first:
 *
 *   img/DIF-ROSEAUX-200.jpg   one product
 *   img/cat-diffuseurs.jpg    a whole family
 *   img/odys-packshot.jpg     everything else
 *
 * Dropping a real photograph in under the product's reference and re-running
 * with --refresh-images is the whole workflow for replacing the placeholders.
 */
function productImage(string $reference, string $category, string $dir): string
{
    $slug = Tools::str2url(Tools::replaceAccentedChars($category));
    foreach ([$reference, 'cat-' . $slug] as $stem) {
        foreach (['jpg', 'jpeg', 'png', 'webp'] as $ext) {
            $file = $dir . '/' . $stem . '.' . $ext;
            if (is_file($file)) {
                return $file;
            }
        }
    }

    return $dir . '/odys-packshot.jpg';
}

function attachImage($product, $file, $idLang)
{
    if (!is_file($file)) {
        return false;
    }
    global $refreshImages;
    $existing = Db::getInstance()->executeS(
        'SELECT id_image FROM ' . _DB_PREFIX_ . 'image WHERE id_product = ' . (int) $product->id
    );
    if ($existing) {
        if (!$refreshImages) {
            return true;   // already has one
        }
        // the caller asked for the photographs to be re-read from img/
        foreach ($existing as $row) {
            (new Image((int) $row['id_image']))->delete();
        }
    }
    $image = new Image();
    $image->id_product = (int) $product->id;
    $image->position = 1;
    $image->cover = true;
    foreach (Language::getLanguages(false) as $lang) {
        $image->legend[(int) $lang['id_lang']] = $product->name[$idLang] ?? 'ODYS';
    }
    if (!$image->add()) {
        return false;
    }
    $dest = $image->getPathForCreation();
    // ImageManager reads webp only on a GD built with it; converting once here
    // means a .webp master in img/ works on any host
    if (strtolower(pathinfo($file, PATHINFO_EXTENSION)) === 'webp' && function_exists('imagecreatefromwebp')) {
        if ($gd = @imagecreatefromwebp($file)) {
            $tmp = tempnam(sys_get_temp_dir(), 'odys') . '.jpg';
            imagejpeg($gd, $tmp, 92);
            imagedestroy($gd);
            $file = $tmp;
        }
    }
    if (!ImageManager::resize($file, $dest . '.jpg')) {
        return false;
    }
    foreach (ImageType::getImagesTypes('products') as $type) {
        ImageManager::resize($file, $dest . '-' . $type['name'] . '.jpg', (int) $type['width'], (int) $type['height']);
    }

    return true;
}

// ── currency ────────────────────────────────────────────────────────────
// An ODYS shop prices in dirhams; a shop installed for another country ends
// up in euros and every price on the site reads "69,00 €".
$idMad = (int) Currency::getIdByIsoCode('MAD');
if (!$idMad) {
    $mad = new Currency();
    $mad->iso_code = 'MAD';
    $mad->numeric_iso_code = '504';
    $mad->active = true;
    $mad->conversion_rate = 1;
    $mad->precision = 2;
    foreach (Language::getLanguages(false) as $lang) {
        $mad->name[(int) $lang['id_lang']] = 'Dirham marocain';
    }
    if ($mad->add()) {
        $idMad = (int) $mad->id;
        say('Currency: MAD (dirham) created');
    }
}
if ($idMad && (int) Configuration::get('PS_CURRENCY_DEFAULT') !== $idMad) {
    Configuration::updateValue('PS_CURRENCY_DEFAULT', $idMad);
    Db::getInstance()->execute('UPDATE ' . _DB_PREFIX_ . 'currency SET conversion_rate = 1 WHERE id_currency = ' . $idMad);
    say('Currency: MAD set as the shop default (prices display in DH)');
}
// A hand-made currency has no CLDR symbol, so prices printed as "69,00 ".
if ($idMad) {
    Db::getInstance()->execute(
        'UPDATE ' . _DB_PREFIX_ . 'currency_lang SET symbol = "DH" WHERE id_currency = ' . (int) $idMad
    );
    say('Currency: symbol set to DH');
}

// One currency, or PrestaShop shows a switcher and visitors keep browsing in
// whatever their session picked first (the shop kept pricing in euros).
if ($idMad) {
    $others = Db::getInstance()->executeS(
        'SELECT id_currency, iso_code FROM ' . _DB_PREFIX_ . 'currency WHERE id_currency <> ' . (int) $idMad . ' AND active = 1'
    );
    foreach ((array) $others as $row) {
        $c = new Currency((int) $row['id_currency']);
        $c->active = false;
        $c->update();
        say('Currency: ' . $row['iso_code'] . ' deactivated');
    }
}

$idMa = (int) Country::getByIso('MA');
if ($idMa && (int) Configuration::get('PS_COUNTRY_DEFAULT') !== $idMa) {
    Configuration::updateValue('PS_COUNTRY_DEFAULT', $idMa);
    Db::getInstance()->execute('UPDATE ' . _DB_PREFIX_ . 'country SET active = 1 WHERE id_country = ' . $idMa);
    say('Country: Maroc set as the default');
}

// Le filtre par famille masque des cartes deja rendues : il ne voit que la
// page courante. Avec 12 produits par page et 13 parfums, « Frais » sur la
// page 1 omettait en silence ce qui correspondait page 2. Le catalogue tient
// largement sous 24 ; au-dela, il faudra un filtre cote serveur.
if ((int) Configuration::get('PS_PRODUCTS_PER_PAGE') < 24) {
    Configuration::updateValue('PS_PRODUCTS_PER_PAGE', 24);
    say('Listing: 24 produits par page (le filtre de famille ne voit que la page courante)');
}

// PS_COUNTRY_DEFAULT alone is not enough. With PS_DETECT_COUNTRY on,
// PrestaShop reads the browser's Accept-Language and overrides the default, so
// a visitor whose phone is set to English opened the checkout with "Etats-Unis"
// preselected - no carrier serves it, so the tunnel stalls at delivery with
// nothing on screen explaining why. The shop ships to Morocco, cash on
// delivery; the address form should say so before anyone touches it.
if ((int) Configuration::get('PS_DETECT_COUNTRY') !== 0) {
    Configuration::updateValue('PS_DETECT_COUNTRY', 0);
    say('Country: browser-locale detection off (the default would be overridden)');
}

// and the countries nothing can be delivered to are not offered at all
if ($idMa) {
    $strays = Db::getInstance()->executeS(
        'SELECT c.id_country, cl.name FROM ' . _DB_PREFIX_ . 'country c
         JOIN ' . _DB_PREFIX_ . 'country_lang cl
           ON cl.id_country = c.id_country AND cl.id_lang = ' . (int) $idLang . '
         WHERE c.active = 1 AND c.id_country <> ' . (int) $idMa
    );
    foreach ((array) $strays as $row) {
        Db::getInstance()->execute('UPDATE ' . _DB_PREFIX_ . 'country SET active = 0
             WHERE id_country = ' . (int) $row['id_country']);
        say('Country: ' . $row['name'] . ' deactivated (no carrier serves it)');
    }
}

// Cash on delivery means somebody telephones before the parcel moves. An order
// with no number is a parcel that cannot be delivered and a refusal that costs
// the carriage twice, so the field stops being optional.
//
// PS_ONE_PHONE_AT_LEAST is a 1.6 setting and does nothing in PrestaShop 8; the
// list of extra required fields lives in the required_field table, which is
// what Back Office > Customers > Addresses writes to.
// Two object names, because the two halves of PrestaShop disagree about what
// this object is called: the Back Office screen writes rows as "Address",
// while the front-office form asks AddressFormat::getFieldsRequired(), which
// instantiates CustomerAddress and so only ever sees rows under that name. A
// row under one name alone makes the field required on one side only.
foreach (['Address', 'CustomerAddress'] as $objectName) {
    $already = (int) Db::getInstance()->getValue(
        'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'required_field
         WHERE object_name = "' . pSQL($objectName) . '" AND field_name = "phone"'
    );
    if ($already) {
        continue;
    }
    Db::getInstance()->insert('required_field', [
        'object_name' => $objectName,
        'field_name' => 'phone',
    ]);
    // the list is cached per request and in PrestaShop's own cache, so without
    // this the form keeps calling the field optional
    Tools::clearAllCache();
    say('Address: a phone number is now required as ' . $objectName
        . ' (payment on delivery)');
}

// A friendly URL with a space in it is a broken link: PrestaShop's own French
// pack ships "meilleures ventes" for the best-sellers page, and every link to
// it 404s. Normalise any route that has one.
$spaced = Db::getInstance()->executeS(
    'SELECT id_meta, id_lang, url_rewrite FROM ' . _DB_PREFIX_ . 'meta_lang
     WHERE url_rewrite LIKE "% %"'
);
foreach ((array) $spaced as $row) {
    $fixed = Tools::link_rewrite($row['url_rewrite']);
    Db::getInstance()->update('meta_lang', ['url_rewrite' => pSQL($fixed)],
        'id_meta = ' . (int) $row['id_meta'] . ' AND id_lang = ' . (int) $row['id_lang']);
    say(sprintf('URL corrigée : "%s" -> "%s" (une url_rewrite qui contient un espace)',
        $row['url_rewrite'], $fixed));
}

// ── URL scheme ──────────────────────────────────────────────────────────
// The theme links to /parfums, /oud-boukhour and /coffrets.
// PrestaShop's default category route is {id}-{rewrite}, so those links 404
// until the route drops the id. (Back Office: Traffic & SEO → URL schema.)
if (Configuration::get('PS_ROUTE_category') !== '{rewrite}') {
    Configuration::updateValue('PS_ROUTE_category', '{rewrite}');
    say('URL schema: category route set to {rewrite} so /oud-boukhour resolves');
}
// The rewrite rules live in .htaccess; changing the route in the database is
// not enough — without this Apache never hands /parfums to PrestaShop.
if (function_exists('Tools::generateHtaccess') || method_exists('Tools', 'generateHtaccess')) {
    Tools::generateHtaccess();
    say('.htaccess regenerated for the new URL schema');
}

/**
 * A carrier that actually serves Morocco.
 *
 * The shop shipped with PrestaShop's demo carriers, all of them restricted to
 * Europe and North America — and Morocco sits in the Africa zone, so the
 * checkout offered no delivery at all and no order could be placed. These two
 * match what every page of the site promises: 20 DH in Casablanca, 30 DH
 * elsewhere, free above 300 DH (that threshold is PS_SHIPPING_FREE_PRICE,
 * set below).
 */
function ensureCarrier(string $name, string $delay, float $price, int $idZone, int $idLang): int
{
    $idCarrier = (int) Db::getInstance()->getValue(
        'SELECT id_carrier FROM ' . _DB_PREFIX_ . 'carrier
         WHERE name = "' . pSQL($name) . '" AND deleted = 0'
    );
    if ($idCarrier) {
        return $idCarrier;
    }

    $carrier = new Carrier();
    $carrier->name = $name;
    $carrier->active = true;
    $carrier->deleted = false;
    $carrier->shipping_handling = false;      // the price below is the price
    $carrier->range_behavior = 0;
    $carrier->is_module = false;
    $carrier->shipping_external = false;
    $carrier->need_range = true;
    $carrier->shipping_method = Carrier::SHIPPING_METHOD_PRICE;
    $carrier->max_width = $carrier->max_height = $carrier->max_depth = 0;
    $carrier->max_weight = 0;
    $carrier->grade = 9;
    foreach (Language::getLanguages(false) as $lang) {
        $carrier->delay[(int) $lang['id_lang']] = $delay;
    }
    if (!$carrier->add()) {
        return 0;
    }

    // one price range covering every basket; the free-shipping threshold does
    // the rest
    $range = new RangePrice();
    $range->id_carrier = (int) $carrier->id;
    $range->delimiter1 = 0;
    $range->delimiter2 = 1000000;
    $range->add();

    Db::getInstance()->insert('carrier_zone', [
        'id_carrier' => (int) $carrier->id,
        'id_zone' => $idZone,
    ]);
    Db::getInstance()->insert('delivery', [
        'id_carrier' => (int) $carrier->id,
        'id_range_price' => (int) $range->id,
        'id_range_weight' => 0,
        'id_zone' => $idZone,
        'price' => $price,
    ]);

    foreach (Group::getGroups($idLang) as $group) {
        Db::getInstance()->insert('carrier_group', [
            'id_carrier' => (int) $carrier->id,
            'id_group' => (int) $group['id_group'],
        ], false, true, Db::INSERT_IGNORE);
    }

    return (int) $carrier->id;
}

/**
 * Let the payment modules actually be offered.
 *
 * PrestaShop restricts every payment module by country, currency, carrier and
 * customer group, and the installer filled those tables with the demo shop's
 * values: country 8, currency 1 (EUR) and the four demo carriers. The result
 * at checkout was "aucun moyen de paiement n'est disponible" - for every
 * customer, on every order. The rows below say: Morocco, dirhams, the carriers
 * this shop actually uses, every group.
 */
function ensurePaymentAvailable(int $idCountry, int $idCurrency, array $carrierRefs, int $idShop, int $idLang): int
{
    $modules = Db::getInstance()->executeS(
        'SELECT DISTINCT m.id_module, m.name
         FROM ' . _DB_PREFIX_ . 'module m
         JOIN ' . _DB_PREFIX_ . 'hook_module hm ON hm.id_module = m.id_module
         JOIN ' . _DB_PREFIX_ . 'hook h ON h.id_hook = hm.id_hook
         WHERE h.name = "paymentOptions" AND m.active = 1'
    );
    $groups = array_column(Group::getGroups($idLang), 'id_group');

    foreach ((array) $modules as $module) {
        $id = (int) $module['id_module'];
        $rows = [
            'module_country' => [['id_country' => $idCountry]],
            'module_currency' => [['id_currency' => $idCurrency]],
            'module_carrier' => array_map(function ($ref) {
                return ['id_reference' => (int) $ref];
            }, $carrierRefs),
            'module_group' => array_map(function ($g) {
                return ['id_group' => (int) $g];
            }, $groups),
        ];
        foreach ($rows as $table => $values) {
            foreach ($values as $value) {
                Db::getInstance()->insert(
                    $table,
                    array_merge(['id_module' => $id, 'id_shop' => $idShop], $value),
                    false,
                    true,
                    Db::INSERT_IGNORE
                );
            }
        }
        say('  ' . $module['name'] . ' autorisé (Maroc, MAD, ' . count($carrierRefs) . ' transporteur(s))');
    }

    return count((array) $modules);
}

// ── categories ──────────────────────────────────────────────────────────
say('Categories:');
$categories = [
    'Parfums' => ensureCategory('Parfums', 'parfums', $home, $idLang),
    'Oud & Boukhour' => ensureCategory('Oud & Boukhour', 'oud-boukhour', $home, $idLang),
    'Coffrets' => ensureCategory('Coffrets', 'coffrets', $home, $idLang),
    'Diffuseurs' => ensureCategory('Diffuseurs', 'diffuseurs', $home, $idLang),
];

// Perfume is shopped for by who it is for before anything else, so Homme,
// Femme and Unisexe are real sections with addresses of their own. The
// olfactory family stays a filter inside them: with one Oriental per gender,
// a category per gender-and-family would be a dozen pages holding one bottle
// each. The families are already on the cards (data-fam), and can be promoted
// to sub-categories later without touching a single product.
$genders = [
    'homme' => ensureCategory('Homme', 'parfums-homme', $categories['Parfums'], $idLang),
    'femme' => ensureCategory('Femme', 'parfums-femme', $categories['Parfums'], $idLang),
    'unisexe' => ensureCategory('Unisexe', 'parfums-unisexe', $categories['Parfums'], $idLang),
];
Configuration::updateValue('ODYS_CAT_HOMME', (int) $genders['homme']);
Configuration::updateValue('ODYS_CAT_FEMME', (int) $genders['femme']);
Configuration::updateValue('ODYS_CAT_UNISEXE', (int) $genders['unisexe']);

// The theme cannot guess category ids, and PrestaShop insists on {id} in
// category URLs, so publish them as configuration and let the layout ask
// $link for the real URL (see layout-full-width.tpl).
Configuration::updateValue('ODYS_CAT_PARFUMS', (int) $categories['Parfums']);
Configuration::updateValue('ODYS_CAT_OUD', (int) $categories['Oud & Boukhour']);
Configuration::updateValue('ODYS_CAT_COFFRETS', (int) $categories['Coffrets']);
Configuration::updateValue('ODYS_CAT_DIFFUSEURS', (int) $categories['Diffuseurs']);

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
say('  category ids stored for the theme (ODYS_CAT_*)');

// ── coordonnées ────────────────────────────────────────────────────────
// Le thème ne code aucune coordonnée en dur : le bandeau WhatsApp, le lien
// « appeler » et la page de contact lisent tous ces clés. Tant qu'elles sont
// vides, le bouton WhatsApp ne s'affiche pas du tout - ce qui, sur une
// boutique payée à la livraison au Maroc, retire le moyen de contact que les
// clients utilisent réellement avant de commander.
//
// Le numéro est stocké deux fois : lisible pour l'affichage et le lien tel:,
// et au format international sans signe ni espace pour wa.me, qui n'accepte
// que des chiffres.
$coordonnees = [
    'ODYS_PHONE' => '06 84 51 94 44',
    'ODYS_WA_NUMBER' => '212684519444',
    'PS_SHOP_EMAIL' => 'contact@odysparfum.com',
    'PS_SHOP_PHONE' => '06 84 51 94 44',
    'PS_SHOP_ADDR1' => 'Sidi Maarouf',
    'PS_SHOP_CITY' => 'Casablanca',
];
$idMaroc = (int) Country::getByIso('MA');
if ($idMaroc) {
    $coordonnees['PS_SHOP_COUNTRY_ID'] = $idMaroc;
}
// Une clé peut exister en double dans ps_configuration - deux lignes, même
// nom, id_shop NULL des deux côtés. Configuration::get() en choisit une, et
// pas forcément celle qui porte une valeur : ODYS_WA_NUMBER avait une ligne
// à 212684519444 et une vide, c'est la vide qui gagnait, et le bouton
// WhatsApp ne s'affichait nulle part sans que rien ne signale d'erreur.
// updateValue() écrit alors dans la mauvaise ligne et le problème persiste.
foreach (array_keys($coordonnees) as $key) {
    $lignes = Db::getInstance()->executeS(
        'SELECT id_configuration FROM ' . _DB_PREFIX_ . 'configuration
         WHERE name = "' . pSQL($key) . '" ORDER BY id_configuration'
    ) ?: [];
    if (count($lignes) < 2) {
        continue;
    }
    $garde = (int) $lignes[0]['id_configuration'];
    Db::getInstance()->execute(
        'DELETE FROM ' . _DB_PREFIX_ . 'configuration
         WHERE name = "' . pSQL($key) . '" AND id_configuration <> ' . $garde
    );
    say('  ' . $key . ' : ' . (count($lignes) - 1) . ' ligne(s) en double supprimee(s)');
}

say('Coordonnées :');
foreach ($coordonnees as $key => $value) {
    if ((string) Configuration::get($key) === (string) $value) {
        continue;
    }
    Configuration::updateValue($key, $value);
    // relire : si une ligne fantôme subsiste, l'écriture n'a servi à rien
    if ((string) Configuration::get($key) !== (string) $value) {
        say('  !! ' . $key . ' ne se relit pas (' . Configuration::get($key) . ')');
        continue;
    }
    say('  ' . $key . ' = ' . $value);
}

// Le formulaire de contact distribue selon le sujet choisi. Les deux boîtes
// existent ; autant que « service client » arrive chez le service client.
$routage = ['SAV' => 'sav@odysparfum.com', 'Service client' => 'sav@odysparfum.com'];
foreach (Db::getInstance()->executeS(
    'SELECT c.id_contact, cl.name FROM ' . _DB_PREFIX_ . 'contact c
     JOIN ' . _DB_PREFIX_ . 'contact_lang cl ON cl.id_contact = c.id_contact
     WHERE cl.id_lang = ' . (int) $idLang) ?: [] as $row) {
    $cible = $routage[$row['name']] ?? 'contact@odysparfum.com';
    if ((string) Db::getInstance()->getValue(
        'SELECT email FROM ' . _DB_PREFIX_ . 'contact WHERE id_contact = ' . (int) $row['id_contact']
    ) === $cible) {
        continue;
    }
    Db::getInstance()->update('contact', ['email' => pSQL($cible)],
        'id_contact = ' . (int) $row['id_contact']);
    say('  formulaire « ' . $row['name'] .' » -> ' . $cible);
}

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

// The shop name signs every page title and every transactional e-mail; a
// fresh install calls itself "PrestaShop".
if (Configuration::get('PS_SHOP_NAME') !== 'ODYS Parfums') {
    Configuration::updateValue('PS_SHOP_NAME', 'ODYS Parfums');
    say('Shop name set to ODYS Parfums');
}

// A fresh PrestaShop ships with vouchers switched off, and the loyalty
// programme pays in vouchers: without this a customer redeems 15 points and
// gets a code the cart refuses to take.
if (!Configuration::get('PS_CART_RULE_FEATURE_ACTIVE')) {
    Configuration::updateValue('PS_CART_RULE_FEATURE_ACTIVE', 1);
    say('Vouchers enabled (the loyalty rewards are cart rules)');
}

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
// odys_loyalty owns the ODYS settings page (WhatsApp, socials, and the
// signature slots above). It ships inside the theme, which does not make it
// a module PrestaShop knows: copy it into modules/ and install it once.
$loyaltyDir = _PS_MODULE_DIR_ . 'odys_loyalty';
$loyaltySrc = _PS_ALL_THEMES_DIR_ . 'odys/modules/odys_loyalty';
if (!is_dir($loyaltyDir) && is_dir($loyaltySrc)) {
    $copy = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($loyaltySrc, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );
    @mkdir($loyaltyDir, 0755, true);
    foreach ($copy as $item) {
        $target = $loyaltyDir . DIRECTORY_SEPARATOR . $copy->getSubPathName();
        $item->isDir() ? @mkdir($target, 0755, true) : @copy($item->getPathname(), $target);
    }
    say('  odys_loyalty copied from the theme into modules/');
}
// Module::install() cannot run from the CLI: PrestaShop's own translation
// step needs the Symfony container, fatals without it, and leaves the module
// half-installed - a row in ps_module, no tables, no hooks, and a points
// system that silently does nothing. Use the console command instead.
if (!Module::isInstalled('odys_loyalty') && is_dir($loyaltyDir)) {
    say('  odys_loyalty is not installed yet. Install it with:');
    say('      php bin/console prestashop:module install odys_loyalty');
    say('  (or Back Office -> Modules). Then re-run this script.');
}
$loyalty = Module::getInstanceByName('odys_loyalty');
if ($loyalty && Validate::isLoadedObject($loyalty) && $loyalty->id
    && !Hook::isModuleRegisteredOnHook($loyalty, 'actionFrontControllerSetMedia',
        (int) Context::getContext()->shop->id)
) {
    $loyalty->registerHook('actionFrontControllerSetMedia');
    say('  odys_loyalty now feeds the home page its signatures');
}

// ── legal pages ─────────────────────────────────────────────────────────
$legalDir = is_dir(__DIR__ . '/legal') ? __DIR__ . '/legal' : __DIR__ . '/../legal';
$legalPages = [
    'livraison' => ["Politique d'expédition et de livraison", 'ODYS_CMS_LIVRAISON'],
    'retours' => ["Politique d'échange et de remboursement", 'ODYS_CMS_RETOURS'],
    'cgv' => ['Termes et conditions', 'ODYS_CMS_CGV'],
    'confidentialite' => ['Politique de confidentialité', 'ODYS_CMS_CONFIDENTIALITE'],
    'mentions-legales' => ['Mentions légales', 'ODYS_CMS_MENTIONS'],
    // the nav and footer link to these three; without them they 404
    'a-propos' => ['À propos', 'ODYS_CMS_APROPOS'],
    'savoir-faire' => ['Savoir-faire', 'ODYS_CMS_SAVOIRFAIRE'],
    'fidelite' => ['Programme fidélité', 'ODYS_CMS_FIDELITE'],
];
if (is_dir($legalDir)) {
    say('Legal pages:');
    foreach ($legalPages as $slug => $meta) {
        $file = $legalDir . '/' . $slug . '.html';
        if (!is_file($file)) {
            continue;
        }
        $content = file_get_contents($file);
        $idCms = (int) Db::getInstance()->getValue(
            'SELECT c.id_cms FROM ' . _DB_PREFIX_ . 'cms c
             JOIN ' . _DB_PREFIX_ . 'cms_lang cl ON cl.id_cms = c.id_cms
             WHERE cl.link_rewrite = "' . pSQL($slug) . '"'
        );
        $cms = new CMS($idCms ?: null);
        $cms->active = true;
        $cms->id_cms_category = 1;
        foreach (Language::getLanguages(false) as $lang) {
            $l = (int) $lang['id_lang'];
            $cms->meta_title[$l] = $meta[0];
            $cms->meta_description[$l] = $meta[0] . ' — ODYS Parfums, Casablanca.';
            $cms->link_rewrite[$l] = $slug;
            $cms->content[$l] = $content;
        }
        $idCms ? $cms->update() : $cms->add();
        Configuration::updateValue($meta[1], (int) $cms->id);
        say(sprintf('  %-18s %s', $slug, $idCms ? 'updated' : 'created'));
    }

    // The legal pages link to each other as /retours, /cgv and so on, but
    // PrestaShop serves a CMS page at /content/<id>-<slug>, so every one of
    // those links answered 404. Rewrite them once all the pages exist, using
    // the ids this shop actually gave them.
    $link = Context::getContext()->link ?: new Link();
    $relinkCms = 0;
    $slugs = array_keys($legalPages);
    foreach ($legalPages as $slug => $meta) {
        $idCms = (int) Configuration::get($meta[1]);
        if (!$idCms) {
            continue;
        }
        $cms = new CMS($idCms);
        $changed = false;
        foreach (Language::getLanguages(false) as $lang) {
            $l = (int) $lang['id_lang'];
            $body = (string) ($cms->content[$l] ?? '');
            foreach ($slugs as $target) {
                $idTarget = (int) Configuration::get($legalPages[$target][1]);
                if (!$idTarget) {
                    continue;
                }
                $url = $link->getCMSLink($idTarget, $target);
                $before = $body;
                $body = str_replace(
                    ['href="/' . $target . '"', "href='/" . $target . "'"],
                    ['href="' . $url . '"', "href='" . $url . "'"],
                    $body
                );
                if ($body !== $before) {
                    ++$relinkCms;
                }
            }
            if ($body !== ($cms->content[$l] ?? '')) {
                $cms->content[$l] = $body;
                $changed = true;
            }
        }
        if ($changed) {
            $cms->update();
        }
    }
    say(sprintf('  %-18s %d lien(s) interne(s) corrigé(s)', 'liens CMS', $relinkCms));
}

$idFeature = ensureFeature('Famille olfactive', $idLang);
// The product page renders its olfactory pyramid from these three, one
// value per tier, notes separated by commas.
$noteFeatures = [
    'notes_tete' => ensureFeature('Notes de tête', $idLang),
    'notes_coeur' => ensureFeature('Notes de cœur', $idLang),
    'notes_fond' => ensureFeature('Notes de fond', $idLang),
];
// What the product actually is, in its own words. The product page used to
// print "Extrait de Parfum · 50 ml" for everything that was not sold by the
// gram, so a 200 ml Diffuseur a roseaux was labelled a 50 ml extrait - on the
// page, on the live price line and on the add-to-cart button.
$formatFeature = ensureFeature('Contenance', $idLang);
// Which ingredient the page should feel like. A diffuser of orange blossom
// wants ivory and citrus leaf, not the amber of the night collection; the
// theme reads this and re-tints the page around it.
$ambianceFeature = ensureFeature('Ambiance', $idLang);
$image = __DIR__ . '/img/odys-packshot.jpg';

// The checkout's "j'ai lu les conditions" link is governed by
// PS_CONDITIONS_CMS_ID. PrestaShop ships it pointing at its own sample page,
// which is Lorem ipsum - so the one legal text a customer is actually asked to
// agree to, in the modal, said nothing at all. Point it at the real CGV.
$idCgv = (int) Configuration::get('ODYS_CMS_CGV');
if ($idCgv && (int) Configuration::get('PS_CONDITIONS_CMS_ID') !== $idCgv) {
    Configuration::updateValue('PS_CONDITIONS_CMS_ID', $idCgv);
    Configuration::updateValue('PS_CONDITIONS', 1);
    say('Legal: the checkout now shows the real CGV (page ' . $idCgv . ')');
}

// PrestaShop's own sample pages stay published otherwise: they are indexed,
// they are crawled, and they are Lorem ipsum under the shop's own domain.
$ours = [];
foreach ($legalPages as $slug => $meta) {
    $ours[] = (int) Configuration::get($meta[1]);
}
$ours = array_filter($ours);
if ($ours) {
    $samples = Db::getInstance()->executeS(
        'SELECT c.id_cms, cl.link_rewrite FROM ' . _DB_PREFIX_ . 'cms c
         JOIN ' . _DB_PREFIX_ . 'cms_lang cl ON cl.id_cms = c.id_cms AND cl.id_lang = ' . (int) $idLang . '
         WHERE c.active = 1 AND c.id_cms NOT IN (' . implode(',', $ours) . ')
           AND (cl.content LIKE "%Lorem ipsum%" OR CHAR_LENGTH(cl.content) < 300)'
    );
    foreach ((array) $samples as $row) {
        Db::getInstance()->update('cms', ['active' => 0], 'id_cms = ' . (int) $row['id_cms']);
        say('Legal: sample page "' . $row['link_rewrite'] . '" unpublished (placeholder text)');
    }
}

// ── shop identity ───────────────────────────────────────────────────────
// PS_SHOP_NAME and the shop *record* are two different things: the record is
// what $context->shop->name returns, and the installer leaves it as
// "PrestaShop". Cash on delivery prints it on every confirmation page -
// "Votre commande sur PrestaShop a bien été enregistrée".
$shopName = (string) Configuration::get('PS_SHOP_NAME');
if ($shopName !== '') {
    $current = (string) Db::getInstance()->getValue(
        'SELECT name FROM ' . _DB_PREFIX_ . 'shop WHERE id_shop = ' . $idShop
    );
    if ($current !== $shopName) {
        Db::getInstance()->update('shop', ['name' => pSQL($shopName)], 'id_shop = ' . $idShop);
        say('Boutique: « ' . $current . ' » renommée « ' . $shopName . ' »');
    }
}

// ── performance ─────────────────────────────────────────────────────────
// Out of the box PrestaShop serves every module's CSS and JS as its own file:
// 25 requests on the home page, theme.css fetched twice, and none of it
// versioned, so a returning visitor keeps yesterday's stylesheet after an
// update. Combining and minifying them makes it 8 requests, each at a URL that
// changes when its contents do. On a phone on 3G in Casablanca that is the
// difference the customer actually feels.
$ccc = [
    'PS_CSS_THEME_CACHE' => 1,
    'PS_JS_THEME_CACHE' => 1,
    'PS_HTML_THEME_COMPRESSION' => 1,
];
$cccChanged = 0;
foreach ($ccc as $key => $value) {
    if ((int) Configuration::get($key) !== $value) {
        Configuration::updateValue($key, $value);
        ++$cccChanged;
    }
}
if ($cccChanged) {
    say('Performance: CSS et JS combines et minifies (' . $cccChanged . ' reglage(s))');
}

// ── delivery ────────────────────────────────────────────────────────────
$idZoneMa = (int) Db::getInstance()->getValue(
    'SELECT id_zone FROM ' . _DB_PREFIX_ . 'country WHERE iso_code = "MA"'
);
if ($idZoneMa) {
    say('Delivery:');
    $carriers = [
        ['Livraison Casablanca', 'Livré en 24 h', 20.0],
        ['Livraison Maroc', 'Livré en 24–48 h', 30.0],
    ];
    foreach ($carriers as $c) {
        $id = ensureCarrier($c[0], $c[1], $c[2], $idZoneMa, $idLang);
        say(sprintf('  %-24s %s', $c[0], $id ? sprintf('%.0f DH', $c[2]) : 'échec'));
    }
    // the demo carriers serve Europe and North America and confuse the
    // checkout; they are switched off rather than deleted, so an existing
    // order still knows what carried it
    $demo = Db::getInstance()->executeS(
        'SELECT id_carrier, name FROM ' . _DB_PREFIX_ . 'carrier
         WHERE deleted = 0 AND active = 1 AND name NOT LIKE "Livraison %"'
    );
    foreach ((array) $demo as $row) {
        Db::getInstance()->update('carrier', ['active' => 0],
            'id_carrier = ' . (int) $row['id_carrier']);
        say('  ' . $row['name'] . ' désactivé (zone Europe/Amérique)');
    }
    // the site says "offerte dès 300 DH" on every page; make that true
    if ((float) Configuration::get('PS_SHIPPING_FREE_PRICE') != 300.0) {
        Configuration::updateValue('PS_SHIPPING_FREE_PRICE', 300);
        say('  livraison offerte dès 300 DH');
    }

    $refs = array_column((array) Db::getInstance()->executeS(
        'SELECT id_reference FROM ' . _DB_PREFIX_ . 'carrier
         WHERE deleted = 0 AND active = 1'
    ), 'id_reference');
    $idCountryMa = (int) Country::getByIso('MA');
    $paid = ensurePaymentAvailable(
        $idCountryMa,
        (int) Configuration::get('PS_CURRENCY_DEFAULT'),
        $refs,
        $idShop,
        $idLang
    );
    if (!$paid) {
        say('  ATTENTION: aucun module de paiement actif - la commande sera impossible');
    }
}

// ── category copy ───────────────────────────────────────────────────────
// Every category shipped with an empty meta title, an empty description and no
// text on the page at all. These are the pages someone lands on searching
// "oud boukhour maroc" or "diffuseur parfum casablanca", and they had nothing
// to land on. The copy below is the shop's own words, not keywords piled up:
// it is written for the person reading it, and says what the section is, what
// it costs and how it arrives. It is ordinary PrestaShop category text, so it
// can be rewritten any time in Catalogue → Catégories.
$categorySeo = [
    'Parfums' => [
        'Parfums & Extraits de Parfum au Maroc',
        "Extraits de parfum élaborés au Maroc, 18 à 20 % de concentration, en flacon de 50 ml. "
        . "Livraison en 24–48 h partout au Maroc, paiement à la livraison.",
        "<p>Nos extraits de parfum sont composés et assemblés au Maroc. La concentration, "
        . "entre 18 et 20 %, est celle d'un extrait et non d'une eau de toilette : la tenue "
        . "se compte en heures, pas en minutes, et il en faut peu.</p>"
        . "<p>Chaque flacon fait 50 ml. Vous payez à la livraison, partout au Maroc, "
        . "en 24 à 48 heures — et la livraison est offerte au-delà de 300 DH.</p>",
    ],
    'Oud & Boukhour' => [
        'Oud Naturel & Boukhour Vendus au Gramme',
        "Oud naturel et boukhour vendus au gramme, à partir de 5 g. Hindi, Thaï, Boukhour "
        . "Prestige. Livraison 24–48 h au Maroc, paiement à la livraison.",
        "<p>Le oud se choisit au gramme, parce qu'on n'achète pas un bois précieux comme on "
        . "achète un flacon. Nos copeaux se commandent à partir de 5 g : de quoi essayer une "
        . "provenance avant de s'y attacher.</p>"
        . "<p>Vous trouverez ici du Hindi et du Thaï en plusieurs grades, ainsi que notre "
        . "Boukhour Prestige pour le mabkhara. Le prix affiché est le prix au gramme ; "
        . "le total suit la quantité que vous choisissez.</p>",
    ],
    'Coffrets' => [
        'Coffrets de Parfums à Offrir',
        "Coffrets ODYS : duo, trio découverte et pack oud. À offrir ou à s'offrir. "
        . "Livraison offerte dès 300 DH, paiement à la livraison.",
        "<p>Un coffret évite la question qui bloque tout cadeau de parfum : lequel ? "
        . "Le duo et le trio réunissent plusieurs signatures, de quoi laisser la personne "
        . "trouver la sienne.</p>"
        . "<p>Tous nos coffrets dépassent le seuil de livraison offerte.</p>",
    ],
    'Diffuseurs' => [
        "Diffuseurs à Roseaux, Parfums d'Intérieur",
        "Diffuseurs à roseaux ODYS en 100 et 200 ml, et leurs recharges. Une maison qui "
        . "sent bon sans flamme ni prise. Livraison 24–48 h au Maroc.",
        "<p>Un diffuseur à roseaux parfume une pièce en continu, sans flamme, sans "
        . "électricité et sans qu'on ait à y penser. Les tiges montent le parfum peu à peu ; "
        . "on les retourne quand on veut raviver la diffusion.</p>"
        . "<p>Nos diffuseurs existent en 100 et 200 ml, et les recharges permettent de garder "
        . "le flacon.</p>",
    ],
    'Homme' => [
        'Parfums Homme — Extrait de Parfum au Maroc',
        "Extraits de parfum homme élaborés au Maroc : boisés, frais, orientaux. Flacon 50 ml, "
        . "livraison 24–48 h, paiement à la livraison.",
        "<p>Les signatures masculines de la maison, du frais boisé à l'oriental épicé. "
        . "Filtrez par famille olfactive pour aller droit à ce que vous aimez déjà porter.</p>",
    ],
    'Femme' => [
        'Parfums Femme — Extrait de Parfum au Maroc',
        "Extraits de parfum femme élaborés au Maroc : floraux, gourmands, orientaux. "
        . "Flacon 50 ml, livraison 24–48 h, paiement à la livraison.",
        "<p>Les signatures féminines de la maison. La collection s'étoffe : "
        . "revenez-y, ou écrivez-nous pour savoir ce qui arrive.</p>",
    ],
    'Unisexe' => [
        'Parfums Mixtes & Unisexes au Maroc',
        "Extraits de parfum mixtes, portés par tous : oud, boisés, ambrés. Flacon 50 ml, "
        . "livraison 24–48 h au Maroc.",
        "<p>Des compositions qui ne se rangent d'aucun côté — le oud et les boisés ambrés "
        . "s'en accommodent mal. À porter par qui les aime.</p>",
    ],
];

$seoRows = 0;
foreach ($categorySeo as $catName => $copy) {
    $idCategory = 0;
    if (isset($categories[$catName])) {
        $idCategory = (int) $categories[$catName];
    } elseif (isset($genders[Tools::strtolower($catName)])) {
        $idCategory = (int) $genders[Tools::strtolower($catName)];
    }
    if (!$idCategory) {
        continue;
    }
    $category = new Category($idCategory, $idLang);
    if (!Validate::isLoadedObject($category)) {
        continue;
    }
    // only fill what is still empty: a shop that has rewritten its own copy in
    // the Back Office must not have it overwritten by the next import
    $changed = false;
    if (trim((string) $category->meta_title) === '') {
        $category->meta_title = $copy[0];
        $changed = true;
    }
    if (trim((string) $category->meta_description) === '') {
        $category->meta_description = $copy[1];
        $changed = true;
    }
    if (trim(strip_tags((string) $category->description)) === '') {
        $category->description = $copy[2];
        $changed = true;
    }
    if ($changed) {
        $category->update();
        ++$seoRows;
    }
}
if ($seoRows) {
    say('SEO: ' . $seoRows . ' categorie(s) dotees d un titre, d une description et d un texte');
}

// ── sitemap & robots ────────────────────────────────────────────────────
// The shop had no sitemap at all (404) and robots.txt never mentioned one, so
// a search engine had to find every page by following links. gsitemap is
// installed; it just had never been told what to leave out or asked to run.
if (Module::isInstalled('gsitemap')) {
    // A basket, an account page or a 404 has nothing to offer a search result.
    // Listing them spends the crawler's time on pages that will never rank.
    $skipPages = ['pagenotfound', 'password', 'my-account', 'identity', 'address',
        'addresses', 'history', 'order', 'order-confirmation', 'order-follow',
        'cart', 'discount', 'authentication', 'guest-tracking'];
    $skip = array_column((array) Db::getInstance()->executeS(
        'SELECT id_meta FROM ' . _DB_PREFIX_ . 'meta
         WHERE page IN ("' . implode('","', array_map('pSQL', $skipPages)) . '")'
    ), 'id_meta');
    if ($skip) {
        Configuration::updateValue('GSITEMAP_DISABLE_LINKS', implode(',', array_map('intval', $skip)));
        say('SEO: ' . count($skip) . ' page(s) privee(s) exclue(s) du sitemap');
    }

    // robots.txt is regenerated from the Back Office and loses anything added
    // by hand, so the line is (re)written here and stays idempotent.
    $robots = _PS_ROOT_DIR_ . '/robots.txt';
    $sitemapUrl = (Configuration::get('PS_SSL_ENABLED') ? 'https://' : 'http://')
        . Configuration::get('PS_SHOP_DOMAIN') . '/1_index_sitemap.xml';
    if (is_writable($robots) || is_writable(dirname($robots))) {
        $body = is_file($robots) ? (string) file_get_contents($robots) : '';
        if (strpos($body, 'Sitemap:') === false) {
            file_put_contents($robots, rtrim($body) . "\n\nSitemap: " . $sitemapUrl . "\n");
            say('SEO: robots.txt indique le sitemap');
        }
    }

    say('SEO: regenerer le sitemap apres un changement de catalogue —');
    say('     ' . (Configuration::get('PS_SSL_ENABLED') ? 'https://' : 'http://')
        . Configuration::get('PS_SHOP_DOMAIN')
        . '/modules/gsitemap/gsitemap-cron.php?token='
        . Tools::substr(Tools::hash('gsitemap/cron'), 0, 10) . '&id_shop=' . $idShop);
}

// ── products ────────────────────────────────────────────────────────────
say('Products:');
$refs = [];
$created = $updated = $noteRows = 0;
foreach ($catalogue as $item) {
    $refs[] = $item['reference'];
    $idProduct = (int) Db::getInstance()->getValue(
        'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "' . pSQL($item['reference']) . '"'
    );
    // No id_lang here: with one, PrestaShop exposes name/description as plain
    // strings, and `$product->name[$idLang] = '…'` then writes a *string
    // offset* — "L'Icône" came out as "LLIcône". Without it they are arrays.
    $product = new Product($idProduct ?: null);
    $isNew = !$idProduct;

    $perGram = $item['kind'] === 'oud';
    $short = $item['inspired_by']
        ? 'Inspiré de ' . $item['inspired_by'] . '. Extrait de parfum élaboré au Maroc.'
        : ($perGram ? 'Oud naturel vendu au gramme. Origine certifiée.' : 'Sélection ODYS Parfums.');
    $desc = $perGram
        ? '<p>Vendu au gramme, à ' . rtrim(rtrim(number_format($item['price'], 2, ',', ' '), '0'), ',') . ' DH le gramme. '
          . 'Choisissez votre grammage sur la page Oud &amp; Boukhour.</p>'
          . '<p>Produit non éligible au retour (nature périssable et hygiène).</p>'
        : '<p>' . $short . '</p>';

    foreach (Language::getLanguages(false) as $lang) {
        $l = (int) $lang['id_lang'];
        $product->name[$l] = $item['name'];
        $product->description_short[$l] = $short;
        $product->description[$l] = $desc;
        // description_short est un champ HTML : PrestaShop y range « Dolce
        // &amp; Gabbana ». Faute de meta_description propre, PrestaShop s'en
        // sert comme repli et l'echappe une seconde fois — la balise
        // annoncait « Dolce &amp;amp; Gabbana » à Google. On pose donc le
        // texte brut, qui n'est echappe qu'une fois à l'affichage.
        $product->meta_description[$l] = Tools::substr($short, 0, 160);
        $product->link_rewrite[$l] = Tools::link_rewrite($item['name'] ?: $item['reference']);
    }
    $product->reference = $item['reference'];
    $product->price = (float) $item['price'];
    $product->id_category_default = (int) $categories[$item['category']];
    $product->active = true;
    $product->available_for_order = true;
    $product->show_price = true;
    $product->minimal_quantity = $perGram ? 5 : 1;
    $product->id_tax_rules_group = 0;
    $product->visibility = 'both';
    if ($perGram) {
        $product->unity = 'g';
        $product->unit_price_ratio = 1;
    }

    if ($isNew) {
        $product->add();
        $created++;
    } else {
        $product->update();
        $updated++;
    }

    $cats = [(int) $categories[$item['category']], $home];
    // a perfume also lives in its own section; the parent Parfums page keeps
    // showing all of them, so nothing disappears from the collection
    if (!empty($item['gender']) && isset($genders[$item['gender']])) {
        $cats[] = (int) $genders[$item['gender']];
    }
    $product->updateCategories($cats);
    // Le stock d'un produit décliné vit sur ses déclinaisons : écrire ici
    // écraserait ce que la boutique a saisi par format, et désynchroniserait
    // l'agrégat que PrestaShop tient à jour tout seul. On ne pose donc un
    // stock de départ que sur un produit qui n'a pas de déclinaison.
    $aDesDeclinaisons = (bool) Db::getInstance()->getValue(
        'SELECT 1 FROM ' . _DB_PREFIX_ . 'product_attribute
         WHERE id_product = ' . (int) $product->id
    );
    if (!$aDesDeclinaisons) {
        StockAvailable::setQuantity((int) $product->id, 0, $perGram ? 1000 : 50, $idShop);
    }

    if (!empty($item['family'])) {
        $idValue = ensureFeatureValue($idFeature, $item['family']);
        // addFeaturesToDB() inserts blindly and a re-run hits the primary key,
        // so clear this product's rows for the feature first.
        Db::getInstance()->delete('feature_product',
            'id_product = ' . (int) $product->id . ' AND id_feature = ' . (int) $idFeature);
        $product->addFeaturesToDB($idFeature, $idValue);
    }

    // the pyramid: tête / cœur / fond, only where the catalogue has one
    foreach ($noteFeatures as $column => $idNoteFeature) {
        Db::getInstance()->delete('feature_product',
            'id_product = ' . (int) $product->id . ' AND id_feature = ' . (int) $idNoteFeature);
        // Une ligne par note, et non « Néroli, Citron » dans une seule valeur.
        // ps_feature_product a pour clé (id_feature, id_product, id_feature_value)
        // depuis PrestaShop 1.7 : une caractéristique peut donc porter
        // plusieurs valeurs sur le même produit. Chaque note devient une
        // valeur à part, modifiable seule dans la fiche, proposée dans la
        // liste déroulante aux produits suivants, et indexée telle quelle par
        // la recherche — « Néroli » cesse d'être un fragment de chaîne.
        $notes = array_filter(array_map('trim', explode(',', (string) ($item[$column] ?? ''))), 'strlen');
        foreach (array_unique($notes) as $note) {
            $product->addFeaturesToDB($idNoteFeature, ensureFeatureValue($idNoteFeature, $note));
            ++$noteRows;
        }
    }
    foreach (['format' => $formatFeature, 'ambiance' => $ambianceFeature] as $key => $idFeature) {
        Db::getInstance()->delete('feature_product',
            'id_product = ' . (int) $product->id . ' AND id_feature = ' . (int) $idFeature);
        if (!empty($item[$key])) {
            $product->addFeaturesToDB($idFeature, ensureFeatureValue($idFeature, $item[$key]));
        }
    }

    attachImage($product, productImage($item['reference'], $item['category'], __DIR__ . '/img'), $idLang);

    say(sprintf('  %-22s %-26s %6.0f %s  %s', $item['reference'], $item['name'],
        $item['price'], $perGram ? 'DH/g' : 'DH  ', $isNew ? 'created' : 'updated'));
}

// ── PrestaShop's sample catalogue ───────────────────────────────────────
if ($removeDemo) {
    $keep = "'" . implode("','", array_map('pSQL', $refs)) . "'";
    $demo = Db::getInstance()->executeS(
        'SELECT id_product, reference FROM ' . _DB_PREFIX_ . 'product WHERE reference NOT IN (' . $keep . ') OR reference IS NULL OR reference = ""'
    );
    say('Removing PrestaShop sample products:');
    foreach ((array) $demo as $row) {
        $p = new Product((int) $row['id_product']);
        $p->delete();
        say('  deleted #' . $row['id_product'] . ' ' . $row['reference']);
    }

    // and the sample categories (Clothes, Men, Women, Accessories…), which
    // are empty now but still show up in menus and the sitemap
    $keepCats = array_map('intval', array_values($categories));
    $keepCats[] = (int) $home;
    $keepCats[] = (int) Configuration::get('PS_ROOT_CATEGORY');
    $demoCats = Db::getInstance()->executeS(
        'SELECT c.id_category, cl.name FROM ' . _DB_PREFIX_ . 'category c
         JOIN ' . _DB_PREFIX_ . 'category_lang cl ON cl.id_category = c.id_category AND cl.id_lang = ' . (int) $idLang . '
         WHERE c.id_category NOT IN (' . implode(',', $keepCats) . ')'
    );
    say('Removing PrestaShop sample categories:');
    foreach ((array) $demoCats as $row) {
        $c = new Category((int) $row['id_category']);
        $c->delete();
        say('  deleted category ' . $row['name']);
    }

    // PrestaShop ships five orders for its demo customer (John DOE). They sit
    // in the Back Office order list, in the sales statistics and in the
    // best-seller ranking, where they read as real trading history.
    $demoCustomers = Db::getInstance()->executeS(
        'SELECT id_customer, email FROM ' . _DB_PREFIX_ . 'customer
         WHERE email IN ("pub@prestashop.com", "john.doe@prestashop.com")'
    );
    foreach ((array) $demoCustomers as $row) {
        $idCustomer = (int) $row['id_customer'];
        $orders = Db::getInstance()->executeS(
            'SELECT id_order, reference FROM ' . _DB_PREFIX_ . 'orders
             WHERE id_customer = ' . $idCustomer
        );
        foreach ((array) $orders as $order) {
            // the object's delete() takes the details, history, invoices and
            // carrier rows with it; a bare DELETE would orphan all four
            (new Order((int) $order['id_order']))->delete();
            say('  commande de démonstration ' . $order['reference'] . ' supprimée');
        }
        (new Customer($idCustomer))->delete();
        say('  client de démonstration ' . $row['email'] . ' supprimé');
    }
}

// ── recommendations ─────────────────────────────────────────────────────
// The product page used to fill "Vous aimerez aussi" from the prototype's
// JS table: Unsplash photos, prototype prices and links that went nowhere.
// It reads $accessories now, so every perfume points at four real siblings.
$links = $linked = 0;
// a product is recommended its own kind: perfumes with perfumes, oud with oud
foreach (['Parfums', 'Oud & Boukhour', 'Coffrets', 'Diffuseurs'] as $family) {
    $siblings = array_map('intval', array_column((array) Db::getInstance()->executeS(
        'SELECT p.id_product FROM ' . _DB_PREFIX_ . 'product p
         JOIN ' . _DB_PREFIX_ . 'category_product cp ON cp.id_product = p.id_product
         WHERE cp.id_category = ' . (int) $categories[$family] . ' AND p.active = 1
         ORDER BY p.id_product'
    ), 'id_product'));

    foreach ($siblings as $i => $idProduct) {
        Db::getInstance()->delete('accessory', 'id_product_1 = ' . $idProduct);
        // the next four, wrapping round, so nothing recommends itself
        for ($n = 1; $n <= 4 && $n < count($siblings); ++$n) {
            Db::getInstance()->insert('accessory', [
                'id_product_1' => $idProduct,
                'id_product_2' => $siblings[($i + $n) % count($siblings)],
            ]);
            ++$links;
        }
        ++$linked;
    }
}
say(sprintf('Recommendations: %d links across %d products', $links, $linked));

// Le vocabulaire des formats : le groupe d'attributs « Contenance » et son
// echelle de volumes. C'est lui qui rend le volume vendable plutot que
// decoratif - un produit decline en 50 / 100 / 150 ml, chacun avec son prix.
// Le fichier ne cree aucune declinaison : quels formats existent pour quel
// produit se decide dans le Back Office.
$volumes = __DIR__ . '/volumes.php';
if (is_file($volumes)) {
    require $volumes;
}

// Le ménage des notes : l'import écrit déjà une ligne par note, mais une
// boutique remplie avant ce changement garde des valeurs composées — « Néroli,
// Citron » — que plus aucun produit ne porte et qui encombrent la liste
// déroulante. Le fichier les découpe et retire les orphelines ; sur une
// boutique déjà propre il ne fait rien.
$notes = __DIR__ . '/notes.php';
if (is_file($notes)) {
    require $notes;
}

Search::indexation(true);
say(sprintf("\n%d created, %d updated, %d products in the ODYS catalogue.", $created, $updated, count($catalogue)));
say(sprintf("%d olfactory pyramid rows written (tête, cœur, fond).", $noteRows));
say('Clear the cache in Back Office (Advanced Parameters → Performance) if pages look stale.');
