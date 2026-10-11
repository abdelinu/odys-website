<?php
/**
 * Une note par valeur.
 *
 * Les trois étages de la pyramide étaient stockés comme une phrase :
 * « Néroli, Citron » dans une seule valeur de caractéristique. La fiche
 * produit l'affichait découpée en pastilles, ce qui donnait le change, mais
 * en Back Office la ligne était indivisible : changer Citron demandait de
 * retaper toute la liste, et la liste déroulante proposait « Néroli, Citron »
 * comme un bloc, jamais « Néroli » seul. La recherche, elle, indexait une
 * chaîne où « Néroli » n'était qu'un fragment.
 *
 * ps_feature_product a pour clé (id_feature, id_product, id_feature_value)
 * depuis PrestaShop 1.7 : une même caractéristique peut porter plusieurs
 * valeurs sur un produit. Ce fichier découpe donc l'existant — une ligne par
 * note — et supprime les valeurs composées devenues orphelines.
 *
 * Il tourne deux fois sans rien casser : une valeur sans virgule est déjà au
 * bon format et n'est pas touchée.
 *
 * En ligne : déposer dans public_html/, ouvrir une fois, puis supprimer.
 */
if (!defined('_PS_VERSION_')) {
    $config = __DIR__ . '/config/config.inc.php';
    if (!is_file($config)) {
        $config = __DIR__ . '/../config/config.inc.php';
    }
    require_once $config;
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: text/plain; charset=utf-8');
    }
}

$db = Db::getInstance();
$langs = array_column(Language::getLanguages(false), 'id_lang');
$idLang = (int) Configuration::get('PS_LANG_DEFAULT');

/** L'id d'une valeur de caractéristique, créée au besoin. */
$valeur = static function ($idFeature, $texte) use ($db, $langs) {
    $id = (int) $db->getValue(
        'SELECT fv.id_feature_value FROM ' . _DB_PREFIX_ . 'feature_value fv
         JOIN ' . _DB_PREFIX_ . 'feature_value_lang fvl
           ON fvl.id_feature_value = fv.id_feature_value
         WHERE fv.id_feature = ' . (int) $idFeature . '
           AND fvl.value = "' . pSQL($texte) . '"'
    );
    if ($id) {
        return $id;
    }
    $fv = new FeatureValue();
    $fv->id_feature = (int) $idFeature;
    // custom = false : la valeur rejoint la liste deroulante et sert aux
    // produits suivants, au lieu d'etre une saisie libre attachee a un seul
    $fv->custom = false;
    foreach ($langs as $l) {
        $fv->value[$l] = $texte;
    }
    $fv->add();

    return (int) $fv->id;
};

// Les trois étages, retrouvés par la clé que l'import a posée, et à défaut
// par leur nom.
$etages = [];
foreach ([
    'ODYS_FEAT_TETE' => 'Notes de tête',
    'ODYS_FEAT_COEUR' => 'Notes de cœur',
    'ODYS_FEAT_FOND' => 'Notes de fond',
] as $cle => $nom) {
    $id = (int) Configuration::get($cle);
    if (!$id) {
        $id = (int) $db->getValue(
            'SELECT id_feature FROM ' . _DB_PREFIX_ . 'feature_lang
             WHERE name = "' . pSQL($nom) . '" AND id_lang = ' . $idLang
        );
    }
    if ($id) {
        $etages[$id] = $nom;
    } else {
        echo "  !! caractéristique introuvable : $nom\n";
    }
}

if (!$etages) {
    exit("Aucun étage de pyramide trouvé : rien à faire.\n");
}

$decoupees = 0;
$lignes = 0;
foreach ($etages as $idFeature => $nom) {
    echo $nom . "\n";
    $rows = $db->executeS(
        'SELECT fp.id_product, fp.id_feature_value, fvl.value
         FROM ' . _DB_PREFIX_ . 'feature_product fp
         JOIN ' . _DB_PREFIX_ . 'feature_value_lang fvl
           ON fvl.id_feature_value = fp.id_feature_value AND fvl.id_lang = ' . $idLang . '
         WHERE fp.id_feature = ' . (int) $idFeature
    ) ?: [];

    foreach ($rows as $row) {
        if (strpos($row['value'], ',') === false) {
            continue;                       // déjà une note seule
        }
        $notes = array_unique(array_filter(array_map('trim', explode(',', $row['value'])), 'strlen'));
        if (!$notes) {
            continue;
        }
        $db->delete('feature_product',
            'id_product = ' . (int) $row['id_product']
            . ' AND id_feature = ' . (int) $idFeature
            . ' AND id_feature_value = ' . (int) $row['id_feature_value']);
        foreach ($notes as $note) {
            $db->insert('feature_product', [
                'id_feature' => (int) $idFeature,
                'id_product' => (int) $row['id_product'],
                'id_feature_value' => $valeur($idFeature, $note),
            ], false, true, Db::INSERT_IGNORE);
            ++$lignes;
        }
        ++$decoupees;
        printf("  produit %-4d %s\n", $row['id_product'], implode(' · ', $notes));
    }

    // Les valeurs composées que plus aucun produit ne porte encombreraient la
    // liste déroulante — « Néroli, Citron » proposé à côté de « Néroli ».
    $orphelines = $db->executeS(
        'SELECT fv.id_feature_value, fvl.value
         FROM ' . _DB_PREFIX_ . 'feature_value fv
         JOIN ' . _DB_PREFIX_ . 'feature_value_lang fvl
           ON fvl.id_feature_value = fv.id_feature_value AND fvl.id_lang = ' . $idLang . '
         LEFT JOIN ' . _DB_PREFIX_ . 'feature_product fp
           ON fp.id_feature_value = fv.id_feature_value
         WHERE fv.id_feature = ' . (int) $idFeature . '
           AND fvl.value LIKE "%,%"
           AND fp.id_product IS NULL'
    ) ?: [];
    foreach ($orphelines as $o) {
        (new FeatureValue((int) $o['id_feature_value']))->delete();
        printf("  retiré de la liste : %s\n", $o['value']);
    }
}

echo "\n$decoupees valeur(s) composée(s) découpée(s), $lignes ligne(s) écrite(s).\n";

// Sans réindexation, la recherche continue de répondre sur l'ancien contenu.
Search::indexation(true);
echo "Index de recherche reconstruit.\n";

Tools::clearAllCache();
echo "Cache vidé.\n";

echo "\nLes notes se modifient maintenant une par une : fiche produit ->\n";
echo "Détails -> Caractéristiques, une ligne par note, et la liste déroulante\n";
echo "propose chaque note déjà employée ailleurs.\n";
