"""Fabrique maj-formats.php : les quatre fichiers de theme dans un seul PHP.

Le gestionnaire de fichiers de Hostinger repond 409 Conflict des qu'une
archive veut ecrire sur un chemin qui existe deja, et themes/odys/ existe
depuis la mise en ligne. Extraire odys-formats.tar.gz n'a donc jamais pu
marcher ; il fallait un deuxieme fichier, l'installeur, pour contourner.

Un seul fichier supprime l'etape : les quatre fichiers voyagent dedans,
compresses puis encodes, et PHP les pose lui-meme. Un envoi, une ouverture,
une suppression.
"""
import base64
import gzip
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
THEME = WS / "dist" / "odys-theme-ps8" / "themes" / "odys"

FICHIERS = [
    "templates/catalog/product.tpl",
    "templates/checkout/cart.tpl",
    "assets/js/app.js",
    "assets/css/theme.css",
]

morceaux = []
total_brut = 0
for rel in FICHIERS:
    src = THEME / rel
    brut = src.read_bytes()
    total_brut += len(brut)
    paquet = base64.b64encode(gzip.compress(brut, 9)).decode("ascii")
    # des lignes coupees : un editeur de texte en ligne ne bute pas sur une
    # ligne de 200 000 caracteres, et une diff reste lisible
    lignes = "\n".join("    '" + paquet[i:i + 76] + "'," for i in range(0, len(paquet), 76))
    morceaux.append(
        "    // %s - %d octets\n    '%s' => [\n%s\n    ],"
        % (rel, len(brut), rel, lignes.replace("    '", "        '"))
    )

TETE = '''<?php
/**
 * Met a jour les quatre fichiers du theme ODYS qui portent les formats
 * vendables (les declinaisons de volume).
 *
 * Un seul fichier, rien a extraire : le gestionnaire de fichiers de Hostinger
 * repond 409 Conflict des qu'une archive veut ecrire sur un chemin existant,
 * et themes/odys/ est en place depuis la mise en ligne. Les quatre fichiers
 * voyagent donc ici meme, compresses et encodes, et PHP les pose.
 *
 *   1. deposer ce fichier dans public_html/
 *   2. ouvrir https://odysparfum.com/maj-formats.php
 *   3. lire le compte rendu
 *   4. SUPPRIMER ce fichier
 *
 * Il n'ecrit que sous themes/odys/, garde une copie de chaque fichier
 * remplace en .avant-formats, et vide les bundles CSS/JS - dont le nom est
 * calcule sur la liste des fichiers et non leur contenu, donc sans ce vidage
 * la boutique continuerait de servir l'ancienne feuille.
 */
header('Content-Type: text/plain; charset=utf-8');

$racine = __DIR__;

$paquets = [
'''

PIED = '''
];

if (!function_exists('gzdecode')) {
    exit("L'extension zlib manque sur cet hebergement.\\n");
}

$poses = 0;
foreach ($paquets as $rel => $morceaux) {
    $contenu = gzdecode(base64_decode(implode('', $morceaux)));
    if ($contenu === false) {
        printf("  %-46s contenu illisible\\n", $rel);
        continue;
    }
    $dst = $racine . '/themes/odys/' . $rel;
    if (!is_dir(dirname($dst))) {
        printf("  %-46s dossier absent\\n", $rel);
        continue;
    }
    // une copie de secours, pour revenir en arriere sans rien redeployer
    if (is_file($dst) && !is_file($dst . '.avant-formats')) {
        @copy($dst, $dst . '.avant-formats');
    }
    if (file_put_contents($dst, $contenu) === false) {
        printf("  %-46s ECHEC D'ECRITURE (droits du dossier ?)\\n", $rel);
        continue;
    }
    // PHP garde en cache le resultat du is_file() ci-dessus : sans ce vidage
    // le compte rendu annonce la taille de l'ancien fichier.
    clearstatcache(true, $dst);
    printf("  %-46s %6d octets\\n", $rel, filesize($dst));
    ++$poses;
}

echo "\\n$poses fichier(s) pose(s) sur " . count($paquets) . ".\\n";

if ($poses !== count($paquets)) {
    exit("Rien n'a ete vide du cache : corrigez d'abord ce qui precede.\\n");
}

$n = 0;
foreach (glob($racine . '/themes/odys/assets/cache/*') as $f) {
    if (is_file($f) && @unlink($f)) {
        ++$n;
    }
}
echo "Bundles CSS/JS supprimes : $n\\n";

echo "\\nIl reste :\\n";
echo "  1. Back Office -> Parametres avances -> Performances -> Vider le cache\\n";
echo "  2. SUPPRIMER maj-formats.php\\n";
echo "\\nLes copies .avant-formats restent a cote des fichiers remplaces ;\\n";
echo "supprimez-les une fois la boutique verifiee.\\n";
'''

sortie = WS / "dist" / "deploy" / "maj-formats.php"
sortie.parent.mkdir(parents=True, exist_ok=True)
sortie.write_text(TETE + "\n".join(morceaux) + PIED, encoding="utf-8")
print("maj-formats.php : %d octets de theme -> %d octets de PHP"
      % (total_brut, sortie.stat().st_size))
