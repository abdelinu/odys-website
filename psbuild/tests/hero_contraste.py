"""Le titre du hero reste-t-il lisible sur chaque visuel ?

Le hero superpose un titre dore (#C5A46A) a une photographie. Entre les deux,
un voile. Trois choses peuvent casser la lisibilite sans que personne ne s'en
apercoive :

  * on remplace la photo par une plus claire ;
  * on allege le voile pour « aerer » ;
  * on ajoute un visuel au carrousel sans regarder le premier.

Ce test mesure, pour chaque image du hero, le contraste reel du titre apres
application du voile tel qu'il est ecrit dans la feuille de style. Il ne lit
pas une valeur recopiee : il relit les paliers du gradient dans theme.css.

Mesure faite le jour ou il a ete ecrit :

    odys-essence-poster.webp   8,2:1   (image sombre)
    nuit-riad.webp             6,2:1   (cour de riad, bien plus claire)

Sans voile, le riad tombe a 2,1:1 — sous le seuil des grands textes. C'est
pourquoi le voile reste dense : ce n'est pas son opacite qui faisait le
« rectangle noir » reproche a l'ancienne version, mais sa teinte froide et
son palier opaque.

Seuil retenu : 4,5:1, celui du texte courant, alors que le titre est un grand
texte pour lequel 3:1 suffirait. On garde la marge.

    python psbuild/tests/hero_contraste.py
"""

import pathlib
import re
import sys

from PIL import Image

HERE = pathlib.Path(__file__).parent
RACINE = HERE.parent.parent
CSS = RACINE / "dist" / "odys-theme-ps8" / "themes" / "odys" / "assets" / "css" / "theme.css"
IMAGES = RACINE / "dist" / "odys-theme-ps8" / "themes" / "odys" / "assets" / "img"

TITRE = (197, 164, 106)      # --odys-gold, la couleur du h1 du hero
SEUIL = 4.5
# La zone que le titre occupe, en fraction de la largeur du hero.
TEXTE_X = (0.06, 0.34)
TEXTE_Y = (0.20, 0.70)


def lin(v):
    v /= 255.0
    return v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4


def luminance(rgb):
    r, g, b = rgb
    return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)


def lis_le_voile(css):
    """Les paliers du gradient horizontal, relus dans la feuille livree."""
    bloc = re.search(
        r"\.nv-hero\.odys-film-hero::before\{.*?linear-gradient\(90deg,(.*?)\),",
        css, re.S)
    if not bloc:
        return None, None
    couleur = re.search(r"rgba\((\d+),(\d+),(\d+)", bloc.group(1))
    paliers = [(float(p) / 100.0, float(a))
               for a, p in re.findall(r"rgba\(\d+,\d+,\d+,([\d.]+)\)\s*([\d.]+)%",
                                      bloc.group(1))]
    return tuple(int(c) for c in couleur.groups()), sorted(paliers)


def alpha(paliers, p):
    if p <= paliers[0][0]:
        return paliers[0][1]
    for i in range(1, len(paliers)):
        p0, a0 = paliers[i - 1]
        p1, a1 = paliers[i]
        if p <= p1:
            return a0 + (a1 - a0) * (p - p0) / (p1 - p0) if p1 != p0 else a1
    return paliers[-1][1]


def contraste(chemin, voile, paliers):
    im = Image.open(chemin).convert("RGB")
    W, H = im.size
    cible_w, cible_h = 1400, 600
    r = max(cible_w / W, cible_h / H)
    im = im.resize((int(W * r), int(H * r)))
    gx = (im.width - cible_w) // 2
    gy = (im.height - cible_h) // 2
    im = im.crop((gx, gy, gx + cible_w, gy + cible_h))
    px = im.load()

    Ltxt = luminance(TITRE)
    pire = 0.0
    pas = int((TEXTE_X[1] - TEXTE_X[0]) / 0.01)
    for i in range(pas):
        p = TEXTE_X[0] + i * 0.01
        a = alpha(paliers, p)
        x = min(cible_w - 1, int(cible_w * p))
        vals = []
        for y in range(int(cible_h * TEXTE_Y[0]), int(cible_h * TEXTE_Y[1]), 2):
            c = px[x, y]
            comp = tuple(a * voile[k] + (1 - a) * c[k] for k in range(3))
            vals.append(luminance(comp))
        vals.sort()
        pire = max(pire, vals[int(len(vals) * 0.95)])
    return (Ltxt + 0.05) / (pire + 0.05)


def main():
    if not CSS.exists():
        print("  theme.css introuvable : lancez psbuild/build_theme.py d'abord")
        return 1
    voile, paliers = lis_le_voile(CSS.read_text(encoding="utf-8"))
    if not paliers:
        print("  ECHEC : le voile du hero est introuvable dans theme.css")
        return 1
    if max(a for _, a in paliers) >= 1.0:
        print("  ECHEC : le voile atteint l'opacite pleine — c'est un panneau,")
        print("          pas un degrade, et il se voit comme un rectangle.")
        return 1
    print("  voile rgba%s, opacite max %.2f" % (voile, max(a for _, a in paliers)))

    rates = 0
    mesures = 0
    for nom in ["hero/odys-essence-poster.webp", "nuit-riad.webp"]:
        chemin = IMAGES / nom
        if not chemin.exists():
            print("  ABSENTE %-27s rien a mesurer" % nom)
            rates += 1
            continue
        mesures += 1
        c = contraste(chemin, voile, paliers)
        bon = c >= SEUIL
        if not bon:
            rates += 1
        print("  %s %-30s %.2f:1" % ("ok  " if bon else "ECHEC", nom, c))

    print("")
    # Un visuel absent faisait passer le test en silence : il annoncait
    # « tous les visuels tiennent le contraste » sans en avoir mesure un
    # seul. Une banniere qui n'arrive pas en ligne est un defaut, pas un
    # succes.
    if not mesures:
        print("  aucun visuel mesure : la banniere n'a pas ete construite.")
        return 1
    if rates:
        print("  %d visuel(s) sous %.1f:1 ou absent(s) : le titre du hero"
              " deviendrait dur a lire." % (rates, SEUIL))
        return 1
    print("  Tous les visuels du hero tiennent le contraste.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
