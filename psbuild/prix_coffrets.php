<?php
/**
 * Le prix des deux coffrets.
 *
 * Ils etaient a 411 DH (2 x 50 ml) et 549 DH (3 x 50 ml) alors que le flacon
 * de 50 ml se vend 69 DH : le coffret coutait pres du triple de son contenu.
 * La maison a tranche — 129 DH et 199 DH.
 *
 * Ce script ne decide rien. Il lit catalogue.json, qui est la source, et
 * n'ecrit QUE le prix, et seulement pour les references nommees ici. Il ne
 * touche ni aux stocks, ni aux images, ni aux descriptions, ni au prix des
 * autres produits : une synchronisation large effacerait sans bruit un tarif
 * ajuste a la main en Back Office.
 *
 * Rejouable : relance apres relance, il reecrit la meme valeur.
 *
 *   docker compose exec -u www-data shop php prix_coffrets.php
 */
if (!defined('_PS_VERSION_')) {
    $root = '/var/www/html';
    foreach (array_slice(isset($argv) ? $argv : [], 1) as $arg) {
        if (strpos($arg, '--root=') === 0) {
            $root = substr($arg, 7);
        }
    }
    require_once rtrim($root, '/') . '/config/config.inc.php';
}

if (!function_exists('say')) {
    function say(string $line): void
    {
        echo $line, PHP_EOL;
    }
}

/** Les seules references que ce script a le droit de retarifer. */
const ODYS_COFFRETS = ['DUO', 'TRIO'];

$dossier = isset($odysDossierCatalogue) ? $odysDossierCatalogue : __DIR__;
// maj-telephone.php depose ce fichier sous un autre nom, pour ne rien
// ecraser a la racine de la boutique, et passe son chemin complet.
// Chercher « catalogue.json » en dur le manquait.
$fichier = isset($odysFichierCatalogue) ? $odysFichierCatalogue : $dossier . '/catalogue.json';
$brut = @file_get_contents($fichier);
$catalogue = json_decode((string) $brut, true);
if (!is_array($catalogue)) {
    // `return` et non `exit` : ce script est inclus par
    // maj-telephone.php, et un exit emportait avec lui toutes les
    // etapes suivantes, sans que rien ne le signale.
    say('  ' . basename($fichier) . ' introuvable ou illisible, etape sautee');

    return;
}
$lignes = isset($catalogue['products']) && is_array($catalogue['products'])
    ? $catalogue['products']
    : $catalogue;

$idLang = (int) Configuration::get('PS_LANG_DEFAULT');
$idShop = (int) Context::getContext()->shop->id;
$ecrits = 0;
$inchanges = 0;
foreach ($lignes as $ligne) {
    if (!is_array($ligne) || !isset($ligne['reference'], $ligne['price'])) {
        continue;
    }
    $reference = (string) $ligne['reference'];
    if (!in_array($reference, ODYS_COFFRETS, true)) {
        continue;
    }

    $prix = (float) $ligne['price'];
    if ($prix <= 0) {
        say(sprintf('  %-5s prix absent du catalogue, ignore', $reference));
        continue;
    }

    $idProduct = (int) Db::getInstance()->getValue(
        'SELECT `id_product` FROM `' . _DB_PREFIX_ . 'product`
         WHERE `reference` = "' . pSQL($reference) . '"'
    );
    if (!$idProduct) {
        say(sprintf('  %-5s aucun produit avec cette reference', $reference));
        continue;
    }

    $product = new Product($idProduct, false, $idLang, $idShop);
    if (!Validate::isLoadedObject($product)) {
        say(sprintf('  %-5s produit illisible', $reference));
        continue;
    }

    // Comparaison au centime : un flottant relu depuis MySQL ne vaut jamais
    // exactement celui du fichier, et sans cette tolerance le script
    // reecrirait a chaque passage en annoncant un changement imaginaire.
    $avant = round((float) $product->price, 2);
    $apres = round($prix, 2);
    if (abs($avant - $apres) < 0.005) {
        ++$inchanges;
        say(sprintf('  %-5s %s deja a %s DH', $reference, $product->name, $apres));
        continue;
    }

    $product->price = $apres;
    if ($product->update()) {
        ++$ecrits;
        say(sprintf('  %-5s %-18s %s DH -> %s DH', $reference, $product->name, $avant, $apres));
    } else {
        say(sprintf('  %-5s echec de l' . chr(39) . 'ecriture', $reference));
    }
}

say('');
say($ecrits . ' prix mis a jour, ' . $inchanges . ' deja bon(s).');
say('Videz le cache : les prix sont memorises par page.');
