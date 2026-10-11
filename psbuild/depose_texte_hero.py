"""Retire le texte incruste dans l'image du hero.

Le visuel d'accueil porte une mise en page complete gravee dans le pixel :
surtitre, titre, chapeau et bouton. Deux problemes.

D'abord l'orthographe. Le texte grave dit « Des esrences rares, un
cavoir-faire infemporel. Decouvrec l'univers ODYS. » et « DECOUVRIE LA
COLLECTION » — quatre fautes qu'aucune relecture ne peut corriger, puisque
ce sont des pixels et non des caracteres.

Ensuite la duplication : le theme ecrit les memes phrases en vrai texte, par
dessus. Le hero disait donc tout deux fois.

La parade en place etait un voile NOIR OPAQUE sur le tiers gauche de la
photo. Il cachait le texte grave, mais il se voyait : un rectangle plat, en
#08090A — un noir froid — pose sur une image dont les ombres sont #180E08,
un brun chaud. L'oeil voyait la couture avant de voir le parfum.

Mesure sur l'image servie, bande par bande, a mi-hauteur :

    0 a  3 %   mediane   2   p99    7     noir pur
    6 a 27 %   mediane   3   p99  240     le texte grave
   30 %        mediane   9   p99   32     propre
   36 a 54 %   mediane  19   p99  224     la fumee et le flacon

Les lettres et leur fond ne se chevauchent donc pas : le fond est a 3, les
lettres a plus de 220. On peut retirer les unes sans abimer l'autre, ce qui
ne serait pas vrai si le texte etait pose sur la fumee.

Ce script remplace, dans cette bande seulement, tout pixel plus clair que le
seuil par la couleur sombre de sa propre ligne. Pas de retouche inventee :
la couleur vient de l'image, a la meme hauteur, a cote.

Rejouable : une deuxieme execution ne trouve plus rien a retirer et le dit.
L'original est conserve en .avec-texte a cote.

    python psbuild/depose_texte_hero.py
"""

import pathlib
import statistics
import sys

from PIL import Image, ImageFilter

HERE = pathlib.Path(__file__).parent
IMG = HERE / "img" / "hero" / "odys-essence-poster.webp"
SAUVEGARDE = IMG.with_suffix(".webp.avec-texte")

# La bande ou le texte est grave, en fraction de l'image. Prise un peu plus
# large que la mesure (6-27 % / 18-62 %) pour emporter les jambages et les
# ombres portees des lettres.
BANDE_X = (0.035, 0.315)
BANDE_Y = (0.10, 0.70)

# Le fond de la bande est a 3 de luminance (p99 a 7 hors texte), les lettres
# au-dela de 220. Le seuil se pose juste au-dessus du fond : a 16 il laissait
# les bords adoucis des glyphes, qui redessinaient les mots en filigrane.
SEUIL = 9.0


def luminance(rgb):
    r, g, b = rgb
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def main():
    if not IMG.exists():
        print("  image introuvable : " + str(IMG))
        return 1

    im = Image.open(IMG).convert("RGB")
    W, H = im.size
    px = im.load()

    x0, x1 = int(W * BANDE_X[0]), int(W * BANDE_X[1])
    y0, y1 = int(H * BANDE_Y[0]), int(H * BANDE_Y[1])

    # Un masque des pixels a remplacer, pour pouvoir adoucir la jointure
    # ensuite sans toucher au reste de la photo.
    masque = Image.new("L", (W, H), 0)
    mpx = masque.load()

    touches = 0
    for y in range(y0, y1):
        # La couleur de fond de CETTE ligne, prise sur ses propres pixels
        # sombres. Une couleur unique pour toute la bande ferait une tache
        # la ou l'image a un degrade.
        sombres = [px[x, y] for x in range(x0, x1) if luminance(px[x, y]) <= SEUIL]
        if len(sombres) < 20:
            # Ligne presque entierement claire : ce n'est pas du texte sur
            # du noir, on n'y touche pas.
            continue
        fond = (
            int(statistics.median(c[0] for c in sombres)),
            int(statistics.median(c[1] for c in sombres)),
            int(statistics.median(c[2] for c in sombres)),
        )
        for x in range(x0, x1):
            if luminance(px[x, y]) > SEUIL:
                px[x, y] = fond
                mpx[x, y] = 255
                touches += 1

    if not touches:
        print("  aucun pixel clair dans la bande : le texte est deja retire")
        return 0

    # Le remplissage ligne par ligne laisse des rangees plates la ou l'image
    # est texturee : la bande se voyait comme un rectangle. On adoucit toute
    # la zone traitee, bords compris, avec un masque degrade sur une
    # quarantaine de pixels — la jointure disparait au lieu de se deplacer.
    #
    # Le flou est calcule APRES le remplissage : applique avant, il ramenait
    # les pixels clairs des lettres dans la zone qu'on venait de nettoyer.
    marge = Image.new("L", (W, H), 0)
    mp = marge.load()
    for y in range(max(0, y0 - 24), min(H, y1 + 24)):
        for x in range(max(0, x0 - 24), min(W, x1 + 24)):
            mp[x, y] = 255
    marge = marge.filter(ImageFilter.GaussianBlur(radius=22))
    flou = im.filter(ImageFilter.GaussianBlur(radius=5))
    im = Image.composite(flou, im, marge)

    if not SAUVEGARDE.exists():
        SAUVEGARDE.write_bytes(IMG.read_bytes())
        print("  original conserve : " + SAUVEGARDE.name)

    im.save(IMG, "WEBP", quality=88, method=6)
    print("  %d pixels de texte retires dans la bande %d-%d x %d-%d"
          % (touches, x0, x1, y0, y1))
    print("  %s : %d octets" % (IMG.name, IMG.stat().st_size))
    return 0


if __name__ == "__main__":
    sys.exit(main())
