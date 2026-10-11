<?php
/**
 * Le groupe d'attributs « Contenance » : ce qui rend le volume modifiable
 * depuis le Back Office.
 *
 * PrestaShop appelle « déclinaison » une variante vendable d'un produit. Un
 * diffuseur en 50, 100 et 150 ml, c'est un produit et trois déclinaisons,
 * chacune avec son prix et son stock. Le volume cessait d'être une
 * caractéristique décorative — une ligne de texte dans l'onglet
 * « Caractéristiques », que personne ne pouvait acheter — pour devenir ce que
 * le client choisit avant d'ajouter au panier.
 *
 * Ce fichier ne crée que le vocabulaire : le groupe et ses valeurs. Il
 * n'invente aucun prix et n'attache rien à aucun produit. Quels volumes
 * existent pour quel parfum, et à quel prix, se décide dans le Back Office,
 * produit par produit — c'était la demande.
 *
 * Il tourne deux fois sans rien casser.
 *
 * En ligne : déposer dans public_html/, ouvrir une fois, puis supprimer.
 */
if (!defined('_PS_VERSION_')) {
    $config = __DIR__ . '/config/config.inc.php';          // racine de la boutique
    if (!is_file($config)) {
        $config = __DIR__ . '/../config/config.inc.php';   // depuis psbuild/
    }
    require_once $config;
    if (PHP_SAPI !== 'cli') {
        header('Content-Type: text/plain; charset=utf-8');
    }
}

$db = Db::getInstance();
$langs = array_column(Language::getLanguages(false), 'id_lang');
$dire = static function ($s) { echo $s . "\n"; };

// ── le groupe ───────────────────────────────────────────────────────────
// Nom public « Format » plutôt que « Contenance » : c'est ce que le thème
// écrit déjà au-dessus des cartes, et un coffret de trois 50 ml a un format
// mais pas vraiment une contenance.
$idGroup = (int) $db->getValue(
    'SELECT id_attribute_group FROM ' . _DB_PREFIX_ . 'attribute_group_lang
     WHERE name = "Contenance"'
);
$group = new AttributeGroup($idGroup ?: null);
$group->group_type = 'select';
$group->is_color_group = false;
foreach ($langs as $l) {
    $group->name[$l] = 'Contenance';
    $group->public_name[$l] = 'Format';
}
$idGroup ? $group->update() : $group->add();
$idGroup = (int) $group->id;
$dire('Groupe « Contenance » : #' . $idGroup . ($idGroup ? '' : ' ÉCHEC'));

// ── les valeurs ─────────────────────────────────────────────────────────
// Une échelle de départ, pas une contrainte : Catalogue → Attributs et
// caractéristiques → Contenance permet d'en ajouter, d'en retirer et de les
// réordonner. Le libellé est affiché tel quel sur la fiche produit, donc
// « 5 g » ou « Coffret 3 × 50 ml » fonctionnent aussi bien que « 100 ml ».
$valeurs = ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml'];
$pos = 0;
$dire('Valeurs :');
foreach ($valeurs as $nom) {
    $id = (int) $db->getValue(
        'SELECT a.id_attribute FROM ' . _DB_PREFIX_ . 'attribute a
         JOIN ' . _DB_PREFIX_ . 'attribute_lang al ON al.id_attribute = a.id_attribute
         WHERE a.id_attribute_group = ' . $idGroup . ' AND al.name = "' . pSQL($nom) . '"
        '
    );
    // PHP 8 s'est réservé le nom « Attribute » pour ses propres attributs de
    // classe ; PrestaShop 8 a renommé le sien ProductAttribute.
    $attr = new ProductAttribute($id ?: null);
    $attr->id_attribute_group = $idGroup;
    $attr->position = $pos++;
    foreach ($langs as $l) {
        $attr->name[$l] = $nom;
    }
    $id ? $attr->update() : $attr->add();
    $dire(sprintf('  %-10s #%-4d %s', $nom, (int) $attr->id, $id ? 'déjà là' : 'créée'));
}

// ── le décor laissé par l'installation ──────────────────────────────────
// PrestaShop installe Taille, Couleur, Dimension et Type de papier pour sa
// boutique de démonstration. Aucune déclinaison ne s'en sert ici, et le
// générateur de déclinaisons les propose toutes : quatorze couleurs de
// t-shirt à écarter chaque fois qu'on crée un format. On ne les retire que
// si rien ne les utilise — la vérification compte, parce que supprimer un
// attribut utilisé emporterait les déclinaisons avec lui.
$dire('Groupes de démonstration :');
foreach ($db->executeS(
    'SELECT ag.id_attribute_group, agl.name FROM ' . _DB_PREFIX_ . 'attribute_group ag
     JOIN ' . _DB_PREFIX_ . 'attribute_group_lang agl
       ON agl.id_attribute_group = ag.id_attribute_group AND agl.id_lang = ' . (int) $langs[0] . '
     WHERE ag.id_attribute_group <> ' . $idGroup) ?: [] as $row) {
    $utilise = (int) $db->getValue(
        'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'product_attribute_combination pac
         JOIN ' . _DB_PREFIX_ . 'attribute a ON a.id_attribute = pac.id_attribute
         WHERE a.id_attribute_group = ' . (int) $row['id_attribute_group']
    );
    if ($utilise) {
        $dire(sprintf('  %-16s gardé, %d déclinaison(s) s\'en servent', $row['name'], $utilise));
        continue;
    }
    (new AttributeGroup((int) $row['id_attribute_group']))->delete();
    $dire(sprintf('  %-16s supprimé', $row['name']));
}

// Le thème lit cette clé pour savoir quel groupe est le format, au cas où un
// autre groupe apparaîtrait plus tard (une couleur de flacon, par exemple).
Configuration::updateValue('ODYS_ATTR_VOLUME', $idGroup);

Tools::clearAllCache();
$dire("\nTerminé. Les formats se gèrent dans Catalogue → Attributs et caractéristiques.");
$dire('Pour un produit : fiche produit → onglet Déclinaisons → Générer, puis');
$dire('un prix par format (« Impact sur le prix » ou prix fixe) et un stock.');
