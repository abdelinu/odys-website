<?php
/**
 * Trois langues pour ODYS : francais, anglais, arabe.
 *
 * A deposer dans public_html/, a ouvrir une fois, PUIS A SUPPRIMER.
 * Il peut etre relance : chaque etape regarde avant d'ecrire.
 *
 * Ce que PrestaShop fait mal tout seul, et que ce script repare :
 *
 *   1. L'ajout d'une langue telecharge son paquet de traductions puis
 *      regenere les feuilles de style RTL — y compris celles du Back
 *      Office. Le dossier d'administration est renomme sur une boutique en
 *      service, et la generation leve alors une exception qui interrompt
 *      l'ajout a mi-chemin. La langue existe, mais pas tout ce qui va avec.
 *
 *   2. Premiere victime : ps_currency_lang. Sans ligne pour la nouvelle
 *      langue, la devise n'a pas de symbole, et la boutique repond une
 *      erreur fatale « Unknown locale code » sur chaque page de cette
 *      langue. C'est arrive ici : /ar/ renvoyait une page blanche.
 *
 * Le script ajoute donc les langues en isolant la generation RTL, puis
 * rattrape les devises et les tables multilingues, et retire la feuille RTL
 * automatique, qui cassait le voile du hero (voir l'etape 3).
 */
$racine = __DIR__;
if (!file_exists($racine . '/config/config.inc.php')) {
    exit('A deposer a la racine de la boutique (public_html/), a cote de config/.');
}
require_once $racine . '/config/config.inc.php';

header('Content-Type: text/plain; charset=utf-8');

function dire($ligne)
{
    echo $ligne, "\n";
    if (function_exists('ob_flush')) {
        @ob_flush();
    }
    @flush();
}

dire('ODYS — trois langues');
dire('===================');
dire('');

// ── 1. Les langues ────────────────────────────────────────────────────
// checkAndAddLanguage telecharge le paquet de traductions depuis
// i18n.prestashop-project.org. Le serveur doit pouvoir sortir en HTTPS.
$voulues = array('en' => 'English', 'ar' => 'العربية');
foreach ($voulues as $iso => $nom) {
    if (Language::getIdByIso($iso)) {
        dire("  $iso : deja installee");
        continue;
    }
    try {
        $ok = Language::checkAndAddLanguage($iso);
        dire("  $iso : " . ($ok ? 'installee' : 'refusee par PrestaShop'));
    } catch (Throwable $e) {
        // L'exception vient presque toujours de la generation RTL du Back
        // Office (dossier d'admin renomme). La langue, elle, est posee.
        dire("  $iso : posee, mais une etape a echoue — " . $e->getMessage());
    }
}
dire('');

// ── 2. Les tables multilingues ────────────────────────────────────────
// Une langue ajoutee a mi-chemin laisse des trous : ps_country_lang n'avait
// aucune ligne en arabe, et la page d'accueil s'ouvrait sur un avertissement
// PHP (« Undefined array key 3 ») parce que l'adresse de la boutique
// cherchait le nom du pays dans cette langue.
//
// PrestaShop sait copier une langue dans une autre (Language::copyLanguageData),
// mais il EFFACE la langue d'arrivee avant d'ecrire : relance le script et
// tout ce qui aura ete traduit en Back Office disparait. On copie donc
// table par table, et seulement celles qui sont vides.
$idFrSource = (int) Language::getIdByIso('fr');
$remplies = array();
foreach ($voulues as $iso => $nom) {
    $idCible = (int) Language::getIdByIso($iso);
    if (!$idCible || $idCible === $idFrSource) {
        continue;
    }
    $tables = Db::getInstance()->executeS(
        'SELECT TABLE_NAME FROM information_schema.TABLES
         WHERE TABLE_SCHEMA = DATABASE()
           AND TABLE_NAME LIKE "' . _DB_PREFIX_ . '%_lang"');
    $copiees = 0;
    foreach ((array) $tables as $t) {
        $table = $t['TABLE_NAME'];
        if ($table === _DB_PREFIX_ . 'lang') {
            continue;
        }
        $aDeja = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . bqSQL($table) . '` WHERE id_lang = ' . $idCible);
        if ($aDeja) {
            continue;   // la langue a deja du contenu ici : on n'y touche pas
        }
        $colonnes = Db::getInstance()->executeS('SHOW COLUMNS FROM `' . bqSQL($table) . '`');
        if (!$colonnes) {
            continue;
        }
        $noms = array();
        $valeurs = array();
        foreach ($colonnes as $col) {
            $noms[] = '`' . bqSQL($col['Field']) . '`';
            $valeurs[] = ($col['Field'] === 'id_lang')
                ? (string) $idCible
                : '`' . bqSQL($col['Field']) . '`';
        }
        $ok = Db::getInstance()->execute(
            'INSERT IGNORE INTO `' . bqSQL($table) . '` (' . implode(',', $noms) . ')'
            . ' SELECT ' . implode(',', $valeurs)
            . ' FROM `' . bqSQL($table) . '` WHERE id_lang = ' . $idFrSource);
        // On compte les lignes posees, pas les tables visitees : une table
        // vide des deux cotes ne doit pas se compter comme remplie.
        if ($ok && Db::getInstance()->Affected_Rows() > 0) {
            ++$copiees;
        }
    }
    $remplies[] = "$iso : $copiees table(s) remplie(s) depuis le francais";
}
foreach ($remplies as $ligne) {
    dire('  ' . $ligne);
}
dire('');

// ── 2. Les devises, pour chaque langue ────────────────────────────────
// C'est la ligne manquante qui rendait /ar/ inaccessible.
$langues = Language::getLanguages(false);
$manquantes = (int) Db::getInstance()->getValue(
    'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'lang l
     JOIN ' . _DB_PREFIX_ . 'currency c
     LEFT JOIN ' . _DB_PREFIX_ . 'currency_lang cl
            ON cl.id_lang = l.id_lang AND cl.id_currency = c.id_currency
     WHERE cl.id_currency IS NULL'
);
if (!$manquantes) {
    dire('  devises : toutes les langues ont leur symbole');
} else {
    try {
        $cache = new PrestaShop\PrestaShop\Core\Localization\CLDR\DataLayer\LocaleCache(
            new Symfony\Component\Cache\Adapter\FilesystemAdapter(
                'CLDR', 0, _PS_CACHE_DIR_ . '/localization')
        );
        $cache->setLowerLayer(
            new PrestaShop\PrestaShop\Core\Localization\CLDR\DataLayer\LocaleReference(
                new PrestaShop\PrestaShop\Core\Localization\CLDR\Reader()
            )
        );
        $depot = new PrestaShop\PrestaShop\Core\Localization\CLDR\LocaleRepository(
            new PrestaShop\PrestaShop\Core\Localization\CLDR\LocaleDataSource($cache)
        );
        $faites = 0;
        // getCurrencies($object, $active) : le premier argument rendait des
        // objets Currency, pas des lignes.
        foreach (Currency::getCurrencies(false, false) as $c) {
            $devise = new Currency((int) $c['id_currency']);
            $devise->refreshLocalizedCurrencyData($langues, $depot);
            $devise->save();
            ++$faites;
        }
        dire("  devises : $faites rafraichie(s), $manquantes ligne(s) manquaient");
    } catch (Throwable $e) {
        dire('  devises : ECHEC — ' . $e->getMessage());
        dire('    (sans cette etape, les pages de la nouvelle langue repondent');
        dire('     « Unknown locale code » : a corriger avant d\'ouvrir)');
    }
}
dire('');

// ── 3. Pas de feuille de style inversee ───────────────────────────────
// PrestaShop sait fabriquer une theme_rtl.css en miroir de theme.css. Essai
// fait, resultat refuse : son miroir retourne aussi les POURCENTAGES des
// degrades. Le voile du hero, mesure palier par palier pour tenir 5,0:1 sur
// le titre, en ressortait avec son premier palier a 100 % et les autres
// inchanges — un degrade incoherent, donc un titre dore pose sur un ciel
// clair.
//
// Le theme s'inverse tres bien tout seul : dir="rtl" sur <html> retourne
// deja l'ordre des boites flex et grille, l'alignement du texte et les
// proprietes logiques. Ce qui doit etre corrige a la main l'est dans
// theme.css, sous [dir="rtl"], ou chaque regle est voulue et mesuree.
//
// Une feuille laissee par un essai precedent serait servie a l'arabe : on
// la retire.
$feuilleRtl = _PS_ALL_THEMES_DIR_ . 'odys/assets/css/theme_rtl.css';
if (file_exists($feuilleRtl)) {
    @unlink($feuilleRtl);
    dire('  feuille RTL automatique : retiree (elle cassait le voile du hero)');
} else {
    dire("  feuille RTL automatique : aucune, le theme s'inverse seul");
}

// ── 4. Les mots du theme ──────────────────────────────────────────────
// Ils ne passent pas par ici. Essai fait, resultat refuse : PrestaShop ne
// va chercher en base que les domaines qu'il connait DEJA par un fichier.
// Un domaine invente — ShopThemeOdys — n'y existe pas, et les lignes posees
// n'etaient jamais relues : les trois langues servaient le francais.
//
// Les traductions voyagent donc avec le theme (themes/odys/translations/),
// livrees par maj-telephone.php comme le reste du theme. Le Back Office,
// sous International -> Traductions, peut toujours les reecrire : ce qui
// est ecrit la gagne sur le fichier, et ce script n'y touche pas.

// ── 4. Le francais reste la langue par defaut ─────────────────────────
$idFr = (int) Language::getIdByIso('fr');
if ($idFr && (int) Configuration::get('PS_LANG_DEFAULT') !== $idFr) {
    Configuration::updateValue('PS_LANG_DEFAULT', $idFr);
    dire('  langue par defaut : francais (retablie)');
} else {
    dire('  langue par defaut : francais');
}

// ── 5. Les anciennes adresses mènent aux nouvelles, pour de bon ───────
// Des qu'une deuxieme langue existe, PrestaShop prefixe toutes ses adresses
// par la langue : /parfums/20-l-icone.html devient /fr/parfums/...  Les
// anciennes continuent de repondre, par une redirection — mais en 302,
// c'est-a-dire « deplacee pour un moment ». Google garde alors l'ancienne
// adresse et la nouvelle ne prend jamais sa place.
//
// 2 = 301, « deplacee pour de bon ». C'est ce que dit la verite ici.
if ((int) Configuration::get('PS_CANONICAL_REDIRECT') !== 2) {
    Configuration::updateValue('PS_CANONICAL_REDIRECT', 2);
    dire('  anciennes adresses : redirigees en 301 (elles l etaient en 302)');
} else {
    dire('  anciennes adresses : redirigees en 301');
}
dire('');

// ── 5. Les caches ─────────────────────────────────────────────────────
foreach (array('dev', 'prod') as $env) {
    $dossier = _PS_ROOT_DIR_ . '/var/cache/' . $env;
    if (is_dir($dossier)) {
        foreach (new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dossier, FilesystemIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST) as $f) {
            $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
        }
    }
}
foreach ((array) glob(_PS_ALL_THEMES_DIR_ . 'odys/assets/cache/*') as $f) {
    if (is_file($f)) {
        @unlink($f);
    }
}
dire('  caches : vides');
dire('');

$liste = array();
foreach (Language::getLanguages(false) as $l) {
    $liste[] = $l['iso_code'] . ($l['is_rtl'] ? ' (droite a gauche)' : '')
        . ($l['active'] ? '' : ' — eteinte');
}
dire('Langues de la boutique : ' . implode(', ', $liste));
dire('');
dire('SUPPRIMEZ CE FICHIER de public_html/ maintenant.');
