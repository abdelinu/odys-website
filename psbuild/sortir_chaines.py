"""Sortir du HTML les phrases ecrites en dur, pour qu'elles aient une cle.

Les 49 gabarits du theme ont ete ecrits en francais, dans le texte. Une
phrase ne peut exister en trois langues que si elle porte une cle : c'est
ce que fait {l s='...' d='Shop.Theme.Odys'}.

La cle EST la phrase francaise, a l'octet pres. Tant qu'aucune traduction
n'est posee, PrestaShop rend la cle : le francais ne bouge pas, et ne peut
pas bouger.

Ce que ce programme NE touche pas, et pourquoi :

  * ce qui est dans <script>, <style> ou <svg> : ce n'est pas du texte lu,
    et un {l} au milieu d'un script le casserait ;
  * tout ce qui contient { ou } : une phrase melee a une variable Smarty
    demande un %paramètre% et une relecture a la main, pas une regle ;
  * les fleches, les croix, les chiffres seuls : rien a traduire ;
  * ce qui est deja sorti : le programme peut tourner deux fois.

    python psbuild/sortir_chaines.py            # pose les {l}
    python psbuild/sortir_chaines.py --liste    # montre sans rien changer
"""

import json
import pathlib
import re
import sys

DOMAINE = "Shop.Theme.Odys"
RACINE = pathlib.Path(__file__).parent.parent
SOURCES = [
    RACINE / "psbuild" / "templates",
    RACINE / "ref" / "odys-theme-ps8" / "themes" / "odys" / "templates",
]
CATALOGUE = RACINE / "psbuild" / "traductions.json"

# Les zones ou le texte n'est pas du texte.
MUET = re.compile(r"<(script|style|svg)\b.*?</\1>", re.S | re.I)
COMMENTAIRE = re.compile(r"\{\*.*?\*\}", re.S)
# Un noeud de texte : entre un > et un <, sans accolade (donc sans Smarty).
NOEUD = re.compile(r">([^<>{}]+)<")
ATTRIBUT = re.compile(r'(aria-label|alt|placeholder|title)="([^"{}]+)"')


def traduisible(t):
    t = t.strip()
    if len(t) < 3:
        return False
    if not re.search(r"[A-Za-zÀ-ÿ]{3,}", t):
        return False          # fleches, croix, chiffres, unites
    if t.startswith("&") and t.endswith(";"):
        return False
    return True


def masque(s):
    """Remplace les zones muettes par des blocs de meme longueur."""
    return MUET.sub(lambda m: "\x00" * len(m.group(0)), s)


def smarty(phrase):
    return "{l s='" + phrase.replace("'", "\\'") + "' d='" + DOMAINE + "'}"


def sortir(texte):
    """@return (texte modifie, [phrases])"""
    sourd = masque(COMMENTAIRE.sub(lambda m: "\x00" * len(m.group(0)), texte))
    phrases = []
    morceaux = []
    fin = 0

    evenements = []
    for m in NOEUD.finditer(sourd):
        if traduisible(m.group(1)):
            evenements.append((m.start(1), m.end(1), m.group(1), "noeud"))
    for m in ATTRIBUT.finditer(sourd):
        if traduisible(m.group(2)):
            evenements.append((m.start(2), m.end(2), m.group(2), "attribut"))
    evenements.sort()

    for debut, bout, _vu, _genre in evenements:
        if debut < fin:
            continue                      # chevauchement : on laisse
        # La phrase se prend dans le texte REEL, pas dans la copie masquee :
        # un noeud a cheval sur un <script> y rendait une suite de zeros, et
        # trois {l s='(zeros)'} sont partis dans les gabarits.
        brut = texte[debut:bout]
        if chr(0) in brut or not traduisible(brut):
            continue
        avant = len(brut) - len(brut.lstrip())
        apres = len(brut) - len(brut.rstrip())
        phrase = brut.strip()
        morceaux.append(texte[fin:debut])
        morceaux.append(brut[:avant] + smarty(phrase) + (brut[len(brut) - apres:] if apres else ""))
        phrases.append(phrase)
        fin = bout

    morceaux.append(texte[fin:])
    return "".join(morceaux), phrases


def main():
    liste_seule = "--liste" in sys.argv
    catalogue = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    mots = catalogue["mots"]

    total = 0
    nouvelles = []
    for racine in SOURCES:
        if not racine.exists():
            continue
        for p in sorted(racine.rglob("*.tpl")):
            texte = p.read_text(encoding="utf-8")
            neuf, phrases = sortir(texte)
            if not phrases:
                continue
            total += len(phrases)
            for ph in phrases:
                if ph not in mots:
                    mots[ph] = {"en": "", "ar": ""}
                    nouvelles.append(ph)
            if not liste_seule:
                p.write_text(neuf, encoding="utf-8")
            print("  %-56s %3d" % (str(p.relative_to(RACINE)), len(phrases)))

    if not liste_seule:
        CATALOGUE.write_text(
            json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print()
    print("  %d chaines sorties, %d nouvelles cles au catalogue" % (total, len(nouvelles)))
    manquantes = sum(1 for v in mots.values() if not v.get("ar") or not v.get("en"))
    print("  %d cles encore sans traduction" % manquantes)
    return 0


if __name__ == "__main__":
    sys.exit(main())
