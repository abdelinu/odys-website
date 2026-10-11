<?php
/**
 * Les descriptions des treize parfums.
 *
 * La fiche produit disait une phrase : « Inspiré de Tom Ford Oud Wood. Extrait
 * de parfum élaboré au Maroc. » On ne choisit pas un parfum sans le sentir avec
 * ça. Chaque fiche porte maintenant ses accords, son intensité, le déroulé de
 * la fragrance — écrit depuis sa pyramide réelle — et le moment où la porter.
 *
 * Le texte vit dans descriptions.json, pas ici : il se relit et se corrige sans
 * toucher au code.
 *
 * Quatorze autres fiches — coffrets, diffuseurs, oud — partageaient deux
 * phrases pour quatorze produits : « Selection ODYS Parfums. » et « Oud
 * naturel vendu au gramme. Origine certifiee. » La meme phrase servait de
 * meta description, de resume sous le nom et de description complete. Huit
 * pages disaient donc exactement la meme chose a Google, et quatre mots au
 * client. Elles portent maintenant leur propre texte, ecrit depuis leurs
 * caracteristiques reelles — contenance, notes, prix au gramme.
 *
 * Ce script n'ecrit QUE les champs de texte. Il ne touche ni aux prix, ni aux
 * stocks, ni aux images, ni aux caractéristiques. Rejouable.
 *
 *   docker compose exec -u www-data shop php descriptions.php
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

$dossier = isset($odysDossierDescriptions) ? $odysDossierDescriptions : __DIR__;
// maj-telephone.php depose ce fichier sous un autre nom, pour ne rien
// ecraser a la racine de la boutique, et passe son chemin complet.
// Chercher « descriptions.json » en dur le manquait.
$fichier = isset($odysFichierDescriptions) ? $odysFichierDescriptions : $dossier . '/descriptions.json';
$textes = json_decode((string) @file_get_contents($fichier), true);
if (!is_array($textes)) {
    // `return` et non `exit` : ce script est inclus par
    // maj-telephone.php, et un exit emportait avec lui toutes les
    // etapes suivantes, sans que rien ne le signale.
    say('  ' . basename($fichier) . ' introuvable ou illisible, etape sautee');

    return;
}
unset($textes['_lisez_moi']);

/** Échappe pour du HTML. Les noms portent des apostrophes et des « & ». */
function h($s)
{
    return htmlspecialchars((string) $s, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$idLang = (int) Configuration::get('PS_LANG_DEFAULT');
$idShop = (int) Context::getContext()->shop->id;

$ecrits = 0;
$absents = [];
foreach ($textes as $reference => $t) {
    $idProduct = (int) Db::getInstance()->getValue(
        'SELECT p.`id_product` FROM `' . _DB_PREFIX_ . 'product` p
         WHERE p.`reference` = "' . pSQL((string) $reference) . '"'
    );
    if (!$idProduct) {
        $absents[] = $reference;
        continue;
    }

    $product = new Product($idProduct, false, $idLang, $idShop);
    if (!Validate::isLoadedObject($product)) {
        $absents[] = $reference;
        continue;
    }

    // Deux formes d'entree. Les parfums portent accords / intensite /
    // texte / occasion, et leur meta description — « Inspire de X. Extrait
    // de parfum elabore au Maroc. » — est deja distincte produit par
    // produit : on n'y touche pas. Les autres portent meta / court / long.
    if (!isset($t['accords'])) {
        if (!isset($t['meta'], $t['court'], $t['long']) || !is_array($t['long'])) {
            $absents[] = $reference . ' (entree incomplete)';
            continue;
        }
        $corps = '';
        foreach ($t['long'] as $paragraphe) {
            $corps .= '<p>' . h($paragraphe) . '</p>' . "\n";
        }
        $product->meta_description = [$idLang => Tools::substr((string) $t['meta'], 0, 512)];
        $product->description_short = [$idLang => '<p>' . h($t['court']) . '</p>'];
        $product->description = [$idLang => $corps];
        if ($product->update()) {
            ++$ecrits;
            say(sprintf('  %-22s %-34s %s car. de meta',
                $reference, $product->name, Tools::strlen((string) $t['meta'])));
        }
        continue;
    }


    // L'inspiration : elle est deja dans description_short, sous la forme
    // « Inspiré de Tom Ford Oud Wood. Extrait de parfum élaboré au Maroc. ».
    // On la relit la plutot que de la ressaisir — une seule source, pas deux
    // qui divergent. (Il n'existe pas de caracteristique « Inspiration ».)
    $inspiration = '';
    $court = html_entity_decode(strip_tags((string) $product->description_short),
        ENT_QUOTES | ENT_HTML5, 'UTF-8');
    if (preg_match('/Inspir[ée]e?\s+de\s+([^.]{2,120})\./ui', $court, $m)) {
        $inspiration = trim($m[1]);
    }

    $html = '<p class="pd-accords"><strong>' . h($t['accords']) . '</strong>'
        . ' &middot; intensité ' . h(mb_strtolower($t['intensite'], 'UTF-8')) . '</p>' . "\n"
        . '<p>' . h($t['texte']) . '</p>' . "\n"
        . '<p class="pd-pour"><strong>À porter :</strong> ' . h($t['occasion']) . '</p>' . "\n";

    if ($inspiration !== '') {
        $html .= '<p class="pd-insp">Composition originale ODYS, inspirée de '
            . h($inspiration) . '. Les marques citées appartiennent à leurs '
            . 'propriétaires respectifs et n\'ont aucun lien avec ODYS Parfums.</p>' . "\n";
    }
    $html .= '<p class="pd-maison">Extrait de parfum élaboré au Maroc, '
        . 'concentration 18&ndash;20&nbsp;%.</p>';

    $product->description = [$idLang => $html];
    if ($product->update()) {
        ++$ecrits;
        say(sprintf('  %-4s %-20s %s', $reference, $product->name, $t['accords']));
    }
}

say('');
say($ecrits . ' description(s) écrite(s).');
if ($absents) {
    say('Références sans produit correspondant : ' . implode(', ', $absents));
}
say('Videz le cache si les fiches semblent inchangées.');
