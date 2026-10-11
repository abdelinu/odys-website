<?php
/**
 * Le champ « Numero de TVA » de l'etape Adresses.
 *
 * Le format d'adresse du Maroc, tel que PrestaShop le livre, contient une
 * ligne `vat_number`. Le mode B2B de la boutique est desactive : ce numero
 * n'est jamais demande, jamais verifie, jamais imprime sur quoi que ce soit.
 * Il reste pourtant affiche au moment ou le client remplit son adresse,
 * c'est-a-dire au pas le plus couteux du tunnel, sur un telephone.
 *
 * Onze champs, dont un qu'aucun particulier marocain ne peut remplir. On le
 * retire du format ; PrestaShop cesse alors de le rendre, aussi bien dans le
 * formulaire que dans les adresses affichees.
 *
 * Ce que ce script NE fait PAS : toucher a `company`. Une livraison au
 * bureau est un cas reel pour un parfum qu'on offre, et le champ est
 * facultatif. Le retirer serait une decision commerciale, pas une
 * correction.
 *
 * Reversible : la ligne retiree est reinscrite en remettant 'vat_number'
 * dans le format, en Back Office -> International -> Pays -> Maroc.
 *
 * Rejouable.
 *
 *   docker compose exec -u www-data shop php formulaire_adresse.php
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

// Si la boutique active un jour le B2B, le numero de TVA redevient utile :
// on ne touche a rien dans ce cas.
if (Configuration::get('PS_B2B_ENABLE')) {
    say('  mode B2B actif : le numero de TVA est conserve');

    return;
}

// Tous les pays actifs, pas seulement le Maroc : une boutique qui en
// ouvrirait d'autres aurait le meme champ inutile.
$pays = Db::getInstance()->executeS(
    'SELECT c.`id_country`, c.`iso_code`, f.`format`
       FROM `' . _DB_PREFIX_ . 'country` c
       INNER JOIN `' . _DB_PREFIX_ . 'address_format` f ON f.`id_country` = c.`id_country`
      WHERE c.`active` = 1'
);
if (!$pays) {
    say('  aucun pays actif, rien a faire');

    return;
}

$touches = 0;
$deja = 0;
foreach ($pays as $p) {
    $avant = (string) $p['format'];

    // Le format est une liste de lignes ; on retire celles qui ne portent
    // que vat_number. Decouper plutot que remplacer une sous-chaine :
    // « vat_number » peut apparaitre a cote d'autres champs sur une meme
    // ligne, et un str_replace y laisserait une ligne vide ou un espace
    // orphelin.
    $lignes = preg_split('/\r\n|\r|\n/', $avant);
    $gardees = [];
    foreach ($lignes as $ligne) {
        $champs = array_filter(array_map('trim', explode(' ', trim($ligne))), 'strlen');
        $champs = array_values(array_filter($champs, function ($champ) {
            return $champ !== 'vat_number';
        }));
        if ($champs) {
            $gardees[] = implode(' ', $champs);
        }
    }
    $apres = implode("\n", $gardees);

    if ($apres === $avant) {
        ++$deja;
        continue;
    }

    $ok = Db::getInstance()->update(
        'address_format',
        ['format' => pSQL($apres, true)],
        'id_country = ' . (int) $p['id_country']
    );
    if ($ok) {
        ++$touches;
        say(sprintf('  %-4s champ « Numero de TVA » retire du formulaire', $p['iso_code']));
    } else {
        say(sprintf('  %-4s echec de l' . chr(39) . 'ecriture', $p['iso_code']));
    }
}

say('');
say($touches . ' pays corrige(s), ' . $deja . ' deja sans numero de TVA.');
say('Videz le cache : le format d' . chr(39) . 'adresse est memorise.');
