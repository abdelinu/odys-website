#!/usr/bin/env python3
"""Assemble dist/deploy/maj-contenu.php : le contenu de la boutique traduit.

Le theme est traduit par des fichiers livres avec lui. Le CONTENU — noms et
descriptions de categories, fiches produits, pages — vit en base, une ligne
par langue. Quand une langue est ajoutee, PrestaShop y recopie le francais :
c'est ce qui s'affiche aujourd'hui sur /ar/ et /en/.

Ce programme fabrique un script a deposer qui remplace ces copies par les
traductions de psbuild/contenu_langues.json — et seulement elles. Si une
phrase a ete retouchee en Back Office, elle ne vaut plus la copie du
francais, et le script passe son chemin : la maison a le dernier mot.

    python psbuild/make_maj_contenu.py
"""

import json
import pathlib
import sys

RACINE = pathlib.Path(__file__).parent.parent
CONTENU = RACINE / "psbuild" / "contenu_langues.json"
SORTIE = RACINE / "dist" / "deploy" / "maj-contenu.php"


def php(texte):
    """Une chaine PHP a guillemets doubles.

    Jamais d'apostrophe simple ici : dans ce fichier engendre depuis Python,
    \\' est une echappement de PYTHON et le backslash disparait avant
    d'arriver dans le PHP. Un lot de 880 Ko a deja fini comme ca, muet.
    """
    return ('"' + texte.replace("\\", "\\\\").replace('"', '\\"')
            .replace("$", "\\$").replace("\n", "\\n") + '"')


ENTETE = '''<?php
/**
 * Le contenu de la boutique en anglais et en arabe.
 *
 * A deposer dans public_html/, a ouvrir une fois, PUIS A SUPPRIMER.
 * Il peut etre relance : chaque ligne est regardee avant d'etre ecrite.
 *
 * Quand une langue est ajoutee, PrestaShop recopie le francais dans ses
 * lignes : c'est ce qui s'affiche sur /ar/ tant que personne n'a traduit.
 * Ce script remplace CES COPIES, et elles seules. Une phrase retouchee en
 * Back Office ne vaut plus la copie du francais : elle est laissee telle
 * quelle, et comptee a part dans le compte rendu.
 *
 * Les noms des parfums ne sont pas traduits : « L'Icone » est un nom propre
 * au meme titre qu'ODYS, et les marques citees en reference olfactive sont
 * des marques deposees.
 */
$racine = __DIR__;
if (!file_exists($racine . "/config/config.inc.php")) {
    exit("A deposer a la racine de la boutique (public_html/), a cote de config/.");
}
require_once $racine . "/config/config.inc.php";

header("Content-Type: text/plain; charset=utf-8");

function dire($ligne)
{
    echo $ligne, "\\n";
    @ob_flush();
    @flush();
}

dire("ODYS - le contenu en trois langues");
dire("==================================");
dire("");

$odysLangues = array();
foreach (array("en", "ar") as $odysIso) {
    $odysId = (int) Language::getIdByIso($odysIso);
    if ($odysId) {
        $odysLangues[$odysIso] = $odysId;
    }
}
$odysFr = (int) Language::getIdByIso("fr");
if (!$odysFr || !$odysLangues) {
    exit("Les langues ne sont pas installees : ouvrez maj-langues.php d'abord.\\n");
}

/**
 * Ecrit une colonne SI la langue d'arrivee porte encore la copie du francais.
 *
 * @return string "pose", "deja traduit" ou "retouche en Back Office"
 */
function odysPoser($table, $cle, $id, $idLang, $idFr, $colonne, $valeur)
{
    $pre = _DB_PREFIX_;
    $actuel = Db::getInstance()->getValue(
        "SELECT `" . bqSQL($colonne) . "` FROM `" . bqSQL($pre . $table) . "`"
        . " WHERE `" . bqSQL($cle) . "` = " . (int) $id
        . " AND id_lang = " . (int) $idLang);
    if ($actuel === false) {
        return "absent";
    }
    if (trim((string) $actuel) === trim((string) $valeur)) {
        return "deja traduit";
    }
    $francais = Db::getInstance()->getValue(
        "SELECT `" . bqSQL($colonne) . "` FROM `" . bqSQL($pre . $table) . "`"
        . " WHERE `" . bqSQL($cle) . "` = " . (int) $id
        . " AND id_lang = " . (int) $idFr);
    if (trim((string) $actuel) !== trim((string) $francais)) {
        return "retouche en Back Office";
    }
    Db::getInstance()->update($table, array($colonne => pSQL($valeur, true)),
        "`" . bqSQL($cle) . "` = " . (int) $id . " AND id_lang = " . (int) $idLang);
    return "pose";
}

'''

PIED = '''
dire("");
dire("SUPPRIMEZ CE FICHIER de public_html/ maintenant.");
'''


def section_categories(cats):
    lignes = ['dire("Categories");']
    for id_cat, bloc in sorted(cats.items(), key=lambda kv: int(kv[0])):
        for iso in ("en", "ar"):
            part = bloc.get(iso) or {}
            for colonne, cle_json in (("name", "nom"), ("description", "description")):
                valeur = part.get(cle_json)
                if not valeur:
                    continue
                lignes.append(
                    '$odysEtat = isset($odysLangues["%s"]) ? odysPoser("category_lang",'
                    ' "id_category", %s, $odysLangues["%s"], $odysFr, "%s", %s)'
                    ' : "langue absente";'
                    % (iso, int(id_cat), iso, colonne, php(valeur)))
                lignes.append(
                    'dire("  categorie %s %s (%s) : " . $odysEtat);'
                    % (id_cat, colonne, iso))
    return "\n".join(lignes) + "\n"


def section_produits(prods):
    """Les fiches : le texte court et le texte long.

    Le NOM n'est pas touche. « L'Icone » est un nom propre au meme titre
    qu'ODYS, et les maisons de parfum gardent leurs noms en lettres latines
    sur leurs sites arabes. Les marques citees en reference olfactive non
    plus : ce sont des marques deposees.
    """
    if not prods:
        return ""
    lignes = ['dire("");', 'dire("Fiches produits");']
    for id_prod, bloc_p in sorted(prods.items(), key=lambda kv: int(kv[0])):
        for iso in ("en", "ar"):
            part = bloc_p.get(iso) or {}
            # le nom n'est ecrit que s'il est donne : un nom propre reste
            for colonne, cle_json in (("name", "nom"),
                                      ("description_short", "court"),
                                      ("description", "long")):
                valeur = part.get(cle_json)
                if not valeur:
                    continue
                lignes.append(
                    '$odysEtat = isset($odysLangues["%s"]) ? odysPoser("product_lang",'
                    ' "id_product", %s, $odysLangues["%s"], $odysFr, "%s", %s)'
                    ' : "langue absente";'
                    % (iso, int(id_prod), iso, colonne, php(valeur)))
                lignes.append('dire("  fiche %s %s (%s) : " . $odysEtat);'
                              % (id_prod, colonne, iso))
    return chr(10).join(lignes) + chr(10)


def section_pages(pages):
    """Les pages CMS : titre, meta et contenu.

    L'adresse (link_rewrite) ne bouge pas : une URL arabe tiendrait mal dans
    un lien partage sur WhatsApp, et changer l'adresse d'une page deja
    indexee se paie en visites perdues.
    """
    if not pages:
        return ""
    lignes = ['dire("");', 'dire("Pages");']
    for id_cms, bloc_p in sorted(pages.items(), key=lambda kv: int(kv[0])):
        for iso in ("en", "ar"):
            part = bloc_p.get(iso) or {}
            for colonne, cle_json in (("meta_title", "titre"),
                                      ("meta_description", "meta"),
                                      ("content", "contenu")):
                valeur = part.get(cle_json)
                if not valeur:
                    continue
                lignes.append(
                    '$odysEtat = isset($odysLangues["%s"]) ? odysPoser("cms_lang",'
                    ' "id_cms", %s, $odysLangues["%s"], $odysFr, "%s", %s)'
                    ' : "langue absente";'
                    % (iso, int(id_cms), iso, colonne, php(valeur)))
                lignes.append('dire("  page %s %s (%s) : " . $odysEtat);'
                              % (id_cms, colonne, iso))
    return chr(10).join(lignes) + chr(10)


def main():
    contenu = json.loads(CONTENU.read_text(encoding="utf-8"))
    corps = (ENTETE + section_categories(contenu.get("categories", {}))
             + section_produits(contenu.get("produits", {}))
             + section_pages(contenu.get("pages", {})) + PIED)
    SORTIE.parent.mkdir(parents=True, exist_ok=True)
    SORTIE.write_text(corps, encoding="utf-8")
    nc = sum(1 for b in contenu.get("categories", {}).values() for i in ("en", "ar") if b.get(i))
    np = sum(1 for b in contenu.get("produits", {}).values() for i in ("en", "ar") if b.get(i))
    print("  maj-contenu.php : %d categories, %d fiches, %d octets"
          % (nc, np, len(corps.encode("utf-8"))))
    return 0


if __name__ == "__main__":
    sys.exit(main())
