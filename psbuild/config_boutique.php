<?php
/**
 * La configuration de boutique que `docker compose down` emporte.
 *
 * Le conteneur supprime relance PS_INSTALL_AUTO, qui reinstalle PrestaShop
 * par dessus la base : le theme, les modules et le catalogue se rejouent avec
 * leurs scripts, mais les reglages faits a la main en Back Office, non. La
 * suite de verification les reclamait alors comme des defauts.
 *
 * Cinq choses, toutes rejouables :
 *   1. les trois flacons de la bande « Collection signature » ;
 *   2. les campagnes de lancement et le bon LANCEMENT15 ;
 *   3. blockwishlist, desactive (318 Ko de client GraphQL par page) ;
 *   4. la duree pendant laquelle un produit porte la pastille « Nouveau » ;
 *   5. le plan du site — en dernier : son inclusion termine le script.
 *
 *   docker compose exec -u www-data shop php config_boutique.php
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

// ── 1. Les trois flacons de la bande signature ──────────────────────────
// Lesquels est un reglage, pas une retouche de gabarit. Le trio de la maison :
// L'Oriental, La Nuit, L'Or.
$slot = 1;
foreach (['14', '07', '11'] as $reference) {
    $idProduct = (int) Db::getInstance()->getValue(
        'SELECT `id_product` FROM `' . _DB_PREFIX_ . 'product`
         WHERE `reference` = "' . pSQL($reference) . '"'
    );
    if ($idProduct) {
        Configuration::updateValue('ODYS_SIG_' . $slot, $idProduct);
        say('Signature ' . $slot . ' : ODYS ' . $reference . ' (produit ' . $idProduct . ')');
    } else {
        say('Signature ' . $slot . ' : reference ' . $reference . ' introuvable');
    }
    ++$slot;
}

// ── 2. Les campagnes de lancement ───────────────────────────────────────
// Un lien par canal pour savoir d'ou viennent les commandes, plus le bon a
// 15 % que porte le visuel de lancement. create() fabrique le bon lui-meme
// et en tire le code depuis le lien : « lancement15 » -> LANCEMENT15.
require_once $root . '/modules/odys_crm/classes/OdysCampaign.php';
OdysCampaign::installDb();

$fin = date('Y-m-d', strtotime('+90 days'));
$campagnes = [
    ['Lancement Instagram', 'instagram', 'lancement-ig', 0.0],
    ['Lancement TikTok', 'tiktok', 'lancement-tt', 0.0],
    ['Lancement WhatsApp', 'whatsapp', 'lancement-wa', 0.0],
    ['Lancement influenceurs', 'influenceur', 'lancement-inf', 0.0],
    ['Lancement — 15 %', 'autre', 'lancement15', 15.0],
];
foreach ($campagnes as [$nom, $source, $slug, $remise]) {
    $deja = (int) Db::getInstance()->getValue(
        'SELECT `id_campaign` FROM `' . _DB_PREFIX_ . 'odys_campaign`
         WHERE `slug` = "' . pSQL($slug) . '"'
    );
    if ($deja) {
        say('Campagne ' . $slug . ' : deja la');
        continue;
    }
    $r = OdysCampaign::create($nom, $source, $slug, $remise, $fin);
    say('Campagne ' . $slug . ' : ' . (!empty($r['ok']) ? 'creee' : ('refusee — ' . ($r['error'] ?? '?'))));
}

// ── 3. blockwishlist ────────────────────────────────────────────────────
// Le coeur du theme gere les envies lui-meme ; ce module chargeait son client
// GraphQL sur chaque page sans qu'on lui parle jamais.
$wl = Module::getInstanceByName('blockwishlist');
if ($wl && $wl->id && $wl->active) {
    $wl->disable();
    say('blockwishlist : desactive');
} else {
    say('blockwishlist : deja hors service');
}

// ── 4. La duree de la pastille « Nouveau » ──────────────────
// La carte de collection ne porte plus qu'une pastille, et « Nouveau » est
// celle qui s'affiche quand il n'y a pas de remise. Elle ne distingue rien
// tant que tout le catalogue la porte : ce reglage decide combien de jours
// apres sa date d'ajout un produit la garde. Trente, choisi par la maison.
//
// Elle se compte depuis la date d'ajout de CHAQUE produit, pas depuis
// l'ouverture de la boutique : un catalogue importe le meme jour la perd
// le meme jour.
Configuration::updateValue('PS_NB_DAYS_NEW_PRODUCT', 30);
say('Pastille « Nouveau » : 30 jours apres la date d' . chr(39) . 'ajout du produit');

// gsitemap-cron.php se termine par un exit : l'inclusion ne rend jamais
// la main. Tout ce qu'on ecrit apres est du code mort — c'est ce qui est
// arrive au reglage ci-dessus, pose d'abord ici et jamais joue, et au
// « Fait. » de la fin, qui ne s'affichait plus depuis longtemps.
// Cette etape reste donc la derniere, et rien ne se glisse en dessous.
// ── 5. Le plan du site — EN DERNIER, ET POUR CAUSE ────────────
// La logique vit dans plan_du_site.php, pour qu'elle parte aussi avec la
// mise a jour de la boutique en ligne sans etre ecrite deux fois.
//
// gsitemap-cron.php se termine par un exit : l'inclusion ne rend jamais la
// main. Rien ne doit etre ajoute sous cette ligne.
$planDuSite = __DIR__ . '/plan_du_site.php';
if (is_file($planDuSite)) {
    say('');
    say('Fait. Videz le cache si quelque chose semble inchange.');
    require $planDuSite;
} else {
    say('Plan du site : plan_du_site.php absent, etape sautee');
    say('');
    say('Fait. Videz le cache si quelque chose semble inchange.');
}