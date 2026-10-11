"""Fabrique maj-catalogue.php : l'import du catalogue en un seul fichier.

L'import a besoin de quatre choses a cote de lui - catalogue.json, img/,
volumes.php, notes.php - et le gestionnaire de fichiers de Hostinger repond
409 Conflict des qu'on extrait une arborescence sur de l'existant. Tout
voyage donc dans ce PHP, qui se deplie dans un dossier temporaire, lance
l'import depuis la, puis efface le dossier. Un envoi, une ouverture, une
suppression - et rien a nettoyer apres.
"""
import base64
import gzip
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent

# productImage() ne cherche que <reference>.jpg, cat-<categorie>.jpg et le
# packshot : inutile d'embarquer les 3 Mo de visuels du theme.
FICHIERS = [
    ("catalogue.json", HERE / "catalogue.json"),
    ("volumes.php", HERE / "volumes.php"),
    ("notes.php", HERE / "notes.php"),
    ("import_catalogue.php", HERE / "import_catalogue.php"),
    ("img/odys-packshot.jpg", HERE / "img" / "odys-packshot.jpg"),
    ("img/cat-diffuseurs.jpg", HERE / "img" / "cat-diffuseurs.jpg"),
]

morceaux = []
total = 0
for rel, src in FICHIERS:
    brut = src.read_bytes()
    total += len(brut)
    paquet = base64.b64encode(gzip.compress(brut, 9)).decode("ascii")
    lignes = "\n".join("        '" + paquet[i:i + 76] + "',"
                       for i in range(0, len(paquet), 76))
    morceaux.append("    // %s - %d octets\n    '%s' => [\n%s\n    ]," % (rel, len(brut), rel, lignes))

MODELE = '''<?php
/**
 * Met a jour le catalogue des parfums.
 *
 *   - corrige les six pyramides olfactives, qui ne correspondaient pas aux
 *     fragrances dont la boutique s'inspire ;
 *   - cree sept parfums ;
 *   - redecoupe les notes, une valeur par note ;
 *   - verifie le groupe d'attributs Contenance.
 *
 * L'import a besoin de catalogue.json et d'img/ a cote de lui. Plutot que
 * d'extraire une arborescence - ce que le gestionnaire de fichiers refuse sur
 * de l'existant, 409 Conflict - tout voyage ici, se deplie dans un dossier
 * temporaire, tourne, et le dossier disparait.
 *
 *   1. deposer ce fichier dans public_html/
 *   2. ouvrir https://odysparfum.com/maj-catalogue.php
 *   3. lire le compte rendu
 *   4. SUPPRIMER ce fichier
 *
 * Il remet aussi a jour ce qui ne bouge pas : pages legales, coordonnees,
 * categories. Ce sont les memes valeurs qu'aujourd'hui, donc rien ne change.
 * Il ne touche pas au stock d'un produit qui a des declinaisons.
 */
header('Content-Type: text/plain; charset=utf-8');

$paquets = [
%PAQUETS%
];

if (!function_exists('gzdecode')) {
    exit("L'extension zlib manque sur cet hebergement.\\n");
}

$travail = __DIR__ . '/.odys-maj-' . bin2hex(random_bytes(4));
if (!mkdir($travail, 0755) || !mkdir($travail . '/img', 0755)) {
    exit("Impossible de creer le dossier de travail.\\n");
}

$efface = static function ($chemin) use (&$efface) {
    if (is_dir($chemin)) {
        foreach (scandir($chemin) as $e) {
            if ($e !== '.' && $e !== '..') {
                $efface($chemin . '/' . $e);
            }
        }
        @rmdir($chemin);

        return;
    }
    @unlink($chemin);
};

foreach ($paquets as $rel => $bouts) {
    $contenu = gzdecode(base64_decode(implode('', $bouts)));
    if ($contenu === false || file_put_contents($travail . '/' . $rel, $contenu) === false) {
        $efface($travail);
        exit('Impossible d\\'ecrire ' . $rel . "\\n");
    }
}

// L'import lit __DIR__ pour trouver catalogue.json et img/, et dirname(__DIR__)
// pour trouver la boutique : le dossier temporaire est bien sous public_html.
try {
    require $travail . '/import_catalogue.php';
} finally {
    $efface($travail);
}

echo "\\nDossier de travail efface.\\n";
echo "SUPPRIMEZ maintenant maj-catalogue.php, et videz le cache dans le Back\\n";
echo "Office (Parametres avances -> Performances).\\n";
'''

sortie = WS / "dist" / "deploy" / "maj-catalogue.php"
sortie.parent.mkdir(parents=True, exist_ok=True)
sortie.write_text(MODELE.replace("%PAQUETS%", "\n".join(morceaux)), encoding="utf-8")
print("maj-catalogue.php : %d octets embarques -> %d octets"
      % (total, sortie.stat().st_size))
