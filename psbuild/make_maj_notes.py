"""Fabrique maj-notes.php : le template de la pyramide + le decoupage des notes.

Les deux vont ensemble et ne doivent pas etre separes. Decouper les notes sans
le nouveau template ferait apparaitre le bloc « Tete » autant de fois qu'il y
a de notes ; poser le template sans decouper ne changerait rien de visible.
Un seul fichier, donc, qui fait les deux dans l'ordre.

Le gestionnaire de fichiers de Hostinger repond 409 Conflict des qu'une
archive veut ecrire sur un chemin existant, d'ou le fichier unique plutot
qu'une archive a extraire.
"""
import base64
import gzip
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
THEME = WS / "dist" / "odys-theme-ps8" / "themes" / "odys"

# Ce qui a change depuis la derniere mise en ligne. app.js est identique,
# inutile de renvoyer ses 160 Ko.
FICHIERS = [
    "templates/catalog/product.tpl",
    "templates/catalog/_partials/miniatures/product.tpl",
    "templates/catalog/listing.tpl",
    "templates/_partials/mobile-menu.tpl",
    "assets/css/theme.css",
    "assets/js/app.js",
]

morceaux = []
total = 0
for rel in FICHIERS:
    brut = (THEME / rel).read_bytes()
    total += len(brut)
    paquet = base64.b64encode(gzip.compress(brut, 9)).decode("ascii")
    lignes = "\n".join("        '" + paquet[i:i + 76] + "',"
                       for i in range(0, len(paquet), 76))
    morceaux.append("    // %s - %d octets\n    '%s' => [\n%s\n    ]," % (rel, len(brut), rel, lignes))

# le corps de notes.php, sans son propre <?php : _PS_VERSION_ est deja defini
# ici, donc son amorcage se saute tout seul
notes = (HERE / "notes.php").read_text(encoding="utf-8")
assert notes.startswith("<?php\n")
notes = notes[len("<?php\n"):]

TETE = '''<?php
/**
 * Une note par valeur, et la pyramide qui va avec.
 *
 * Deux choses indissociables :
 *
 *   1. le template de la fiche produit, qui rassemble les notes d'un etage
 *      avant de les afficher - sans lui, le bloc « Tete » se repeterait
 *      autant de fois qu'il y a de notes ;
 *   2. le decoupage des valeurs composees - « Neroli, Citron » devient deux
 *      lignes, modifiables separement en Back Office.
 *
 * A deposer dans public_html/, a ouvrir une fois, PUIS A SUPPRIMER.
 */
require_once __DIR__ . '/config/config.inc.php';
header('Content-Type: text/plain; charset=utf-8');

$racine = __DIR__;

$paquets = [
'''

MILIEU = '''
];

if (!function_exists('gzdecode')) {
    exit("L'extension zlib manque sur cet hebergement.\\n");
}

echo "Fichiers de theme\\n";
$poses = 0;
foreach ($paquets as $rel => $bouts) {
    $contenu = gzdecode(base64_decode(implode('', $bouts)));
    $dst = $racine . '/themes/odys/' . $rel;
    if ($contenu === false || !is_dir(dirname($dst))) {
        printf("  %-46s impossible\\n", $rel);
        continue;
    }
    if (is_file($dst) && !is_file($dst . '.avant-notes')) {
        @copy($dst, $dst . '.avant-notes');
    }
    if (file_put_contents($dst, $contenu) === false) {
        printf("  %-46s ECHEC D'ECRITURE\\n", $rel);
        continue;
    }
    clearstatcache(true, $dst);
    printf("  %-46s %6d octets\\n", $rel, filesize($dst));
    ++$poses;
}
if ($poses !== count($paquets)) {
    exit("\\nLes notes ne sont pas decoupees : le template doit etre en place d'abord.\\n");
}
foreach (glob($racine . '/themes/odys/assets/cache/*') as $f) {
    if (is_file($f)) {
        @unlink($f);
    }
}

echo "\\n";
'''

PIED = '''
echo "\\nSUPPRIMEZ maintenant maj-notes.php, et videz le cache dans le Back\\n";
echo "Office (Parametres avances -> Performances).\\n";
'''

sortie = WS / "dist" / "deploy" / "maj-notes.php"
sortie.parent.mkdir(parents=True, exist_ok=True)
sortie.write_text(TETE + "\n".join(morceaux) + MILIEU + notes + PIED, encoding="utf-8")
print("maj-notes.php : %d octets de theme + la migration -> %d octets"
      % (total, sortie.stat().st_size))
