<?php
/**
 * Le plan du site : ce qu'on n'y met pas, puis on le regenere.
 *
 * Mesure faite sur la boutique en ligne : sur les 47 adresses que le plan
 * annoncait a Google, neuf ne menaient nulle part — huit points d'entree de
 * module (`module-ps_shoppingcart-ajax`, les retours de paiement...) qui
 * repondent 404, et /fournisseurs qui redirige. Un plan du site qui declare
 * ses propres 404 use le budget d'exploration et abime la confiance que le
 * moteur accorde au reste.
 *
 * Ces adresses ne sont pas des pages : ce sont les points d'arrivee ajax et
 * les retours de paiement des modules. Personne ne doit y arriver par une
 * recherche.
 *
 * Exclure, ce n'est pas supprimer : les pages restent servies, elles ne sont
 * simplement plus proposees a l'indexation.
 *
 * Le script desactive aussi les marques et les fournisseurs qui n'ont aucun
 * produit actif — sur la boutique en ligne, les deux marques fictives de la
 * demonstration PrestaShop, « Studio Design » et « Graphic Corner », qui
 * avaient chacune leur page indexee.
 *
 * gsitemap compare sa liste d'exclusions aux IDENTIFIANTS de ps_meta, pas
 * aux noms de page — in_array($meta['id_meta'], ...) — et ces identifiants
 * changent d'une boutique a l'autre. On les relit donc en base a chaque
 * passage plutot que de les ecrire en dur.
 *
 * Rejouable.
 *
 *   docker compose exec -u www-data shop php plan_du_site.php
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
$root = rtrim(isset($root) ? $root : _PS_ROOT_DIR_, '/');

if (!function_exists('say')) {
    function say(string $line): void
    {
        echo $line, PHP_EOL;
    }
}

$gs = Module::getInstanceByName('gsitemap');
if (!$gs || !$gs->id) {
    say('Plan du site : gsitemap absent, rien a faire');

    return;
}

// ── Les marques et fournisseurs de la demonstration ────────────────────
//
// Verification faite sur la boutique en ligne : /marques repond 200, porte
// le titre « Marques | ODYS Parfums Maroc », et liste DEUX marques —
// « Studio Design » et « Graphic Corner ». Ce sont les fixtures de la
// demonstration PrestaShop. Chacune a sa propre adresse, /brand/1-… et
// /brand/2-…, et toutes les trois sont dans le plan du site envoye a
// Google : une maison de parfum a Casablanca annonce donc qu'elle
// distribue « Graphic Corner ».
//
// La note qui se trouvait ici disait qu'ecarter /marques « serait decider a
// leur place, le jour ou la boutique aura des marques ». Juste sur le
// principe, faux sur les faits : la page n'est pas vide en attente, elle
// est remplie de travers.
//
// La regle ne nomme personne : une marque sans aucun produit actif ne
// decrit rien et n'a pas de page a offrir. Sur la boutique de
// developpement, qui porte encore le catalogue de demonstration, les deux
// marques ont neuf produits actifs chacune et ne sont pas touchees — c'est
// la donnee qui decide, pas une liste d'identifiants.
//
// Reversible : Back Office -> Catalogue -> Marques (ou Fournisseurs),
// bouton Activer.
$odysVides = [
    ['manufacturer', 'id_manufacturer', 'marque', 'PS_DISPLAY_MANUFACTURERS'],
    ['supplier', 'id_supplier', 'fournisseur', 'PS_DISPLAY_SUPPLIERS'],
];
$odysRestants = [];
foreach ($odysVides as $odysCas) {
    list($table, $cle, $mot, $reglage) = $odysCas;
    $lignes = Db::getInstance()->executeS(
        'SELECT t.`' . bqSQL($cle) . '` AS id, t.`name` AS nom,
                (SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'product` p
                  WHERE p.`' . bqSQL($cle) . '` = t.`' . bqSQL($cle) . '`
                    AND p.`active` = 1) AS actifs
           FROM `' . _DB_PREFIX_ . bqSQL($table) . '` t
          WHERE t.`active` = 1'
    );
    $restants = 0;
    foreach ((array) $lignes as $ligne) {
        if ((int) $ligne['actifs'] > 0) {
            ++$restants;
            continue;
        }
        Db::getInstance()->update(
            $table,
            ['active' => 0],
            bqSQL($cle) . ' = ' . (int) $ligne['id']
        );
        say(sprintf('    %s « %s » desactivee : aucun produit actif', $mot, $ligne['nom']));
    }
    // Deux conditions, toutes deux necessaires, pour qu'une page de ce
    // type merite d'etre indexee : que la boutique l'affiche, et qu'il y
    // ait quelque chose dessus. /fournisseurs repond 302 vers la 404 non
    // pas faute de fournisseurs — il y en a deux, avec des produits — mais
    // parce que PS_DISPLAY_SUPPLIERS vaut 0. Ne regarder que la donnee
    // aurait remis dans le plan du site une adresse qui redirige.
    $odysRestants[$table] = Configuration::get($reglage) ? $restants : 0;
}

// Les pages nommement ecartees. On reste etroit : /magasins et /promotions
// repondent 200 et porteront du contenu le jour ou la boutique aura des
// points de vente ou une remise. Les ecarter aujourd'hui serait decider a
// leur place.
//
// /marques et /fournisseurs, eux, ne sont proposes a l'indexation que s'il
// reste quelque chose a y montrer. Le jour ou la boutique saisit une vraie
// marque, le passage suivant les y remet d'elle-meme : c'est la meme regle
// lue dans l'autre sens.
$aEcarter = ['pagenotfound'];
if (empty($odysRestants['manufacturer'])) {
    $aEcarter[] = 'manufacturer';
}
if (empty($odysRestants['supplier'])) {
    $aEcarter[] = 'supplier';
}

$lignes = Db::getInstance()->executeS(
    'SELECT `id_meta`, `page` FROM `' . _DB_PREFIX_ . 'meta`'
);
$metas = [];
$noms = [];
foreach ($lignes as $ligne) {
    $page = (string) $ligne['page'];
    // Tout point d'entree de module : ce ne sont pas des pages.
    if (strpos($page, 'module-') === 0 || in_array($page, $aEcarter, true)) {
        $metas[] = (int) $ligne['id_meta'];
        $noms[] = $page;
    }
}

if (!$metas) {
    say('Plan du site : aucune page a ecarter');
} else {
    sort($metas);
    Configuration::updateValue('GSITEMAP_DISABLE_LINKS', implode(',', $metas));
    say('Plan du site : ' . count($metas) . ' adresses ecartees de l' . chr(39) . 'indexation');
    foreach ($noms as $nom) {
        say('    ' . $nom);
    }
}

// Le point d'entree cron ecrit les fichiers. On l'inclut au lieu de l'appeler
// par le reseau : depuis un conteneur, l'adresse publique de la boutique
// pointe sur l'hote, pas sur elle.
//
// ATTENTION : ce fichier se termine par un exit. Rien de ce qui suit
// l'inclusion ne s'executera, d'ou le dernier mot dit avant.
$cron = $root . '/modules/gsitemap/gsitemap-cron.php';
if (!is_file($cron)) {
    say('Plan du site : point d' . chr(39) . 'entree cron introuvable, exclusions posees sans regeneration');

    return;
}

// Premiere tentative : baisser error_reporting avant l'inclusion. Sans
// effet — gsitemap-cron.php reinclut config.inc.php, qui le remet a sa
// valeur. La vraie mecanique est ailleurs : le cron se termine par un
// exit, donc le ob_end_clean() plus bas n'est jamais atteint et PHP vide
// le tampon tout seul en fin de requete. Tout ce que le cron a ecrit —
// ses avertissements compris — ressort alors apres notre dernier mot.
//
// Les fonctions d'arret s'executent AVANT ce vidage : on y ferme le
// tampon nous-memes. Le niveau est releve maintenant, pour ne jamais
// fermer un tampon qui ne nous appartient pas.
$odysNiveau = ob_get_level();
register_shutdown_function(function () use ($odysNiveau) {
    while (ob_get_level() > $odysNiveau) {
        ob_end_clean();
    }
});

$_GET['token'] = Tools::substr(Tools::hash('gsitemap/cron'), 0, 10);
$_GET['id_shop'] = (int) Context::getContext()->shop->id;
say('Plan du site : regeneration, derniere etape');
ob_start();
include $cron;
ob_end_clean();
