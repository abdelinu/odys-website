"""L'etui du flacon : plan de decoupe a plat, aux mesures reelles.

Produit, pour chaque parfum :

  * `etui/odys-NN.svg` — le trace de decoupe ET le decor, a plat, taille
    reelle. C'est le fichier qu'un cartonnier ouvre.
  * `dieline-odys.svg` — le trace seul, sans decor, pour verification.
  * `apercu.html` — pour regarder a l'ecran.

Conventions de trace, celles que lit un cartonnier :

    magenta, trait plein    -> COUPE
    bleu, pointilles        -> RAINAGE (pli)
    vert, hachures          -> ZONE DE COLLE

Etui a rabats rentrants inverses (reverse tuck end), le pliage le plus
courant en parfumerie : il se monte a la main, sans machine.

    ┌────┬────────┬──────┬────────┬──────┐
    │colle│ FACE  │ COTE │  DOS   │ COTE │
    └────┴────────┴──────┴────────┴──────┘

Flacon mesure : 54 de large, 30 d'epaisseur, 100 de haut bouchon compris
(corps 89, bouchon 30, recouvrement du col ~19). Contenance 50 ml.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
SORTIE = WS / "dist" / "emballage"

# ── le flacon, en millimetres ───────────────────────────────────────────
LARGEUR_FLACON = 54.0
HAUTEUR_FLACON = 100.0
PROFONDEUR_FLACON = 30.0      # mesuree sur le flacon
# corps seul 89 mm, bouchon 30 mm, recouvrement du col ~19 mm -> 100 mm
JEU = 2.0                     # aisance : le carton ne doit pas serrer

# ── l'etui qui en decoule ───────────────────────────────────────────────
W = LARGEUR_FLACON + JEU      # face et dos
D = PROFONDEUR_FLACON + JEU   # cotes
HT = HAUTEUR_FLACON + JEU     # hauteur du corps

COLLE = 14.0                  # patte de collage
RABAT = D - 2.0               # rabat rentrant
POUSSIERE = D - 3.0           # rabats anti-poussiere, sur les cotes
LANGUETTE = 8.0               # la patte qui passe derriere le panneau
RETRAIT = 3.0                 # elle est plus etroite que le rabat
ARRONDI = 3.0                 # ses coins, pour qu'elle glisse
BISEAU = 1.0                  # le rabat se retrecit vers l'exterieur

# ── le trace ────────────────────────────────────────────────────────────
C_COUPE, C_PLI, C_COLLE = "#E6007E", "#0090D4", "#2E9E4F"
T_COUPE, T_PLI = 0.25, 0.2

# ── le decor, celui de la maquette ──────────────────────────────────────
CARTON = "#D9CFBE"
OR = "#A98A50"
ENCRE = "#6B5B41"
BODONI = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif"
JOST = "Jost, 'Helvetica Neue', Arial, sans-serif"

# Deux partis pris, meme plan de decoupe :
#   "signature" — celui de votre maquette : filets dores, etoile, logo en or
#   "sobre"     — carton nu, une seule encre, aucun ornement
DECOR = "signature"

# Une seule boite pour les treize references : rien d'imprime ne nomme le
# parfum. Le numero et le nom arrivent sur une pastille autocollante posee
# a la main, dans l'emplacement reserve ci-dessous. Un seul outil de
# decoupe, un seul tirage, un seul stock.
STANDARD = True
PASTILLE_L, PASTILLE_H = 30.0, 20.0
C_REPERE = "#8A8A8A"

CARTON_NU = "#CFC4B2"
ENCRE_NUE = "#4A4034"

CONTENANCE = "50 ML"
FL_OZ = "1.7 FL.OZ."


def fl(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def ajuste(texte, dispo, taille, inter, ratio=0.62):
    """Reduit corps et interlettrage jusqu'a tenir dans `dispo` millimetres.

    Les noms ne font pas tous la meme longueur : « L'Or » tient partout,
    « Le Serment Absolu » debordait du panneau et empietait sur le pli.
    Le ratio 0.62 est la largeur moyenne d'une capitale de Jost, verifiee
    ensuite dans le navigateur sur les treize etuis.
    """
    largeur = len(texte) * (taille * ratio + inter)
    if largeur <= dispo:
        return taille, inter
    k = dispo / largeur
    return taille * k, inter * k


def xml(s):
    """Un SVG est du XML : une esperluette nue le rend illisible, et
    « Dolce & Gabbana » en contient une."""
    return (str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;"))


# Origine du plan : coin haut-gauche de la patte de collage.
X_COLLE = 0.0
X_FACE = COLLE
X_COTE1 = X_FACE + W
X_DOS = X_COTE1 + D
X_COTE2 = X_DOS + W
LARGEUR_PLAN = X_COTE2 + D

Y_HAUT = 0.0                        # bord exterieur de la languette
Y_CORPS = RABAT + LANGUETTE         # haut du corps
Y_BAS = Y_CORPS + HT                # bas du corps
HAUTEUR_PLAN = Y_BAS + RABAT + LANGUETTE


def sparkle(cx, cy, h, w, couleur, opacite=1.0):
    k = h * 0.17
    return (f'<path d="M {fl(cx)} {fl(cy - h)} '
            f'Q {fl(cx + k)} {fl(cy - k)} {fl(cx + w)} {fl(cy)} '
            f'Q {fl(cx + k)} {fl(cy + k)} {fl(cx)} {fl(cy + h)} '
            f'Q {fl(cx - k)} {fl(cy + k)} {fl(cx - w)} {fl(cy)} '
            f'Q {fl(cx - k)} {fl(cy - k)} {fl(cx)} {fl(cy - h)} Z" '
            f'fill="{couleur}" opacity="{opacite}"/>')


def logo_odys(cx, cy, taille, couleur=OR):
    """Le logo du site : ODYS en Bodoni sur PARFUM en Jost, memes rapports."""
    inter = taille * 0.20
    corps_p = taille * 0.28
    inter_p = corps_p * 0.60
    ecart = taille * 0.24
    return "\n".join([
        f'    <text x="{fl(cx - inter / 2)}" y="{fl(cy)}" fill="{couleur}"'
        f' text-anchor="middle" font-family="{BODONI}"'
        f' font-size="{fl(taille)}" letter-spacing="{fl(inter)}">ODYS</text>',
        f'    <text x="{fl(cx - inter_p / 2)}" y="{fl(cy + ecart + corps_p)}" fill="{couleur}"'
        f' text-anchor="middle" font-family="{JOST}" opacity="0.85"'
        f' font-size="{fl(corps_p)}" letter-spacing="{fl(inter_p)}">PARFUM</text>',
    ])


def decor_face_sobre(x0, y0, numero, nom):
    """Carton nu, une seule encre, aucun ornement. Tout l'effet vient du
    blanc tournant et de la petitesse des caracteres."""
    cx = x0 + W / 2
    tn, it = ajuste(nom.upper(), W - 8.0, 3.2, 1.4)
    return "\n    ".join([
        logo_odys(cx, y0 + HT * 0.26, 8.4, ENCRE_NUE),
        f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.60)}" fill="{ENCRE_NUE}"'
        f' text-anchor="middle" font-family="{JOST}"'
        f' font-size="3.0" letter-spacing="1.6">{numero}</text>',
        f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.655)}" fill="{ENCRE_NUE}"'
        f' text-anchor="middle" font-family="{JOST}"'
        f' font-size="{fl(tn)}" letter-spacing="{fl(it)}">{xml(nom.upper())}</text>',
        f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.93)}" fill="{ENCRE_NUE}" opacity="0.8"'
        f' text-anchor="middle" font-family="{JOST}"'
        f' font-size="2.4" letter-spacing="0.9">EXTRAIT DE PARFUM &#183; {CONTENANCE}</text>',
    ])


def decor_face(x0, y0, numero, nom):
    """La face avant, d'apres la maquette : logo haut, numero et nom au
    tiers bas, mention et contenance en pied, deux filets dores en S."""
    cx = x0 + W / 2
    el = []
    # les deux filets qui serpentent, du bas vers le haut a droite
    # Les deux filets restent dans le tiers droit : le texte est centre et
    # « EXTRAIT DE PARFUM » occupe presque toute la largeur du panneau.
    el.append(f'<path d="M {fl(x0 + W * 0.46)} {fl(y0 + HT)} '
              f'C {fl(x0 + W * 0.86)} {fl(y0 + HT * 0.84)} '
              f'{fl(x0 + W * 0.74)} {fl(y0 + HT * 0.48)} '
              f'{fl(x0 + W * 1.02)} {fl(y0 + HT * 0.06)}" '
              f'fill="none" stroke="{OR}" stroke-width="0.4" opacity="0.85"/>')
    el.append(f'<path d="M {fl(x0 + W * 0.88)} {fl(y0 + HT)} '
              f'C {fl(x0 + W * 1.00)} {fl(y0 + HT * 0.72)} '
              f'{fl(x0 + W * 0.84)} {fl(y0 + HT * 0.36)} '
              f'{fl(x0 + W * 0.97)} {fl(y0)}" '
              f'fill="none" stroke="{OR}" stroke-width="0.32" opacity="0.7"/>')
    # la petite etoile, a gauche
    el.append(sparkle(x0 + W * 0.13, y0 + HT * 0.44, 2.8, 1.0, OR, 0.95))
    # le logo
    el.append(logo_odys(cx, y0 + HT * 0.235, 9.5))
    if STANDARD:
        # L'emplacement de la pastille. Trace sur un calque a part : c'est un
        # repere de pose, il ne s'imprime pas.
        px, py = cx - PASTILLE_L / 2, y0 + HT * 0.505
        el.append(f'<g class="repere-pastille">'
                  f'<rect x="{fl(px)}" y="{fl(py)}" width="{fl(PASTILLE_L)}"'
                  f' height="{fl(PASTILLE_H)}" rx="1.5" fill="none"'
                  f' stroke="{C_REPERE}" stroke-width="0.2" stroke-dasharray="1.6 1.2"/>'
                  f'<text x="{fl(cx)}" y="{fl(py + PASTILLE_H + 3.4)}" fill="{C_REPERE}"'
                  f' text-anchor="middle" font-family="{JOST}" font-size="1.9"'
                  f' letter-spacing="0.3">pastille {fl(PASTILLE_L)} &#215; {fl(PASTILLE_H)} mm'
                  f' &#183; ne pas imprimer</text></g>')
    else:
        # le numero, son filet, le nom
        el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.545)}" fill="{ENCRE}"'
                  f' text-anchor="middle" font-family="{JOST}"'
                  f' font-size="4.4" letter-spacing="1.0">{numero}</text>')
        el.append(f'<line x1="{fl(cx - 4.5)}" y1="{fl(y0 + HT * 0.572)}"'
                  f' x2="{fl(cx + 4.5)}" y2="{fl(y0 + HT * 0.572)}"'
                  f' stroke="{OR}" stroke-width="0.3"/>')
        tn, it = ajuste(nom.upper(), W - 6.0, 3.6, 1.5)
        el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.625)}" fill="{ENCRE}"'
                  f' text-anchor="middle" font-family="{JOST}"'
                  f' font-size="{fl(tn)}" letter-spacing="{fl(it)}">{xml(nom.upper())}</text>')
    # le pied
    el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.905)}" fill="{ENCRE}"'
              f' text-anchor="middle" font-family="{JOST}"'
              f' font-size="3.0" letter-spacing="1.1">EXTRAIT DE PARFUM</text>')
    el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.955)}" fill="{ENCRE}"'
              f' text-anchor="middle" font-family="{JOST}"'
              f' font-size="3.0" letter-spacing="0.6">{CONTENANCE} &#183; {FL_OZ}</text>')
    return "\n    ".join(el)


def decor_dos_standard(x0, y0):
    """Le dos d'une boite unique : rien qui nomme une reference.

    Le code-barres aussi reste en reserve — un EAN est un numero enregistre,
    il ne s'invente pas. Posez-le quand vous l'aurez, ou collez-le.
    """
    cx = x0 + W / 2
    g = cx - 21.0          # colonne de gauche, pour le texte courant
    el = []
    for txt, taille, inter, pos, ancre, x in (
        ("ODYS PARFUMS", 3.2, 1.2, 0.085, "middle", cx),
        ("EXTRAIT DE PARFUM", 2.3, 0.9, 0.125, "middle", cx),
    ):
        el.append(f'<text x="{fl(x)}" y="{fl(y0 + HT * pos)}" fill="{ENCRE}"'
                  f' text-anchor="{ancre}" font-family="{JOST}"'
                  f' font-size="{fl(taille)}" letter-spacing="{fl(inter)}">{txt}</text>')

    el.append(f'<line x1="{fl(g)}" y1="{fl(y0 + HT * 0.165)}" x2="{fl(g + 42)}"'
              f' y2="{fl(y0 + HT * 0.165)}" stroke="{OR}" stroke-width="0.3"/>')

    el.append(f'<text x="{fl(g)}" y="{fl(y0 + HT * 0.225)}" fill="{ENCRE}"'
              f' font-family="{JOST}" font-size="2.4" letter-spacing="0.9">'
              f'CONSEILS D&#8217;UTILISATION</text>')
    for i, ligne in enumerate((
            "Vaporisez sur les points de pulsation :",
            "poignets, cou, derri&#232;re les oreilles.",
            "&#201;vitez le contact avec les yeux.",
            "Conservez &#224; l&#8217;abri de la lumi&#232;re.")):
        el.append(f'<text x="{fl(g)}" y="{fl(y0 + HT * (0.265 + i * 0.030))}" fill="{ENCRE}"'
                  f' font-family="{JOST}" font-size="2.1" letter-spacing="0.08"'
                  f' opacity="0.9">{ligne}</text>')

    el.append(f'<line x1="{fl(g)}" y1="{fl(y0 + HT * 0.415)}" x2="{fl(g + 42)}"'
              f' y2="{fl(y0 + HT * 0.415)}" stroke="{OR}" stroke-width="0.3"/>')
    for i, ligne in enumerate((
            "Composition originale d&#8217;inspiration.",
            "Tenir hors de port&#233;e des enfants.",
            "Inflammable. Ne pas exposer &#224; la chaleur.")):
        el.append(f'<text x="{fl(g)}" y="{fl(y0 + HT * (0.455 + i * 0.030))}" fill="{ENCRE}"'
                  f' font-family="{JOST}" font-size="2.0" letter-spacing="0.08"'
                  f' opacity="0.85">{ligne}</text>')

    for i, ligne in enumerate((
            "ODYS Parfums &#183; Sidi Maarouf, Casablanca, Maroc",
            "contact@odysparfum.com &#183; odysparfum.com",
            "Fabriqu&#233; au Maroc")):
        el.append(f'<text x="{fl(g)}" y="{fl(y0 + HT * (0.585 + i * 0.030))}" fill="{ENCRE}"'
                  f' font-family="{JOST}" font-size="2.0" letter-spacing="0.08"'
                  f' opacity="0.85">{ligne}</text>')

    # la reserve du code-barres : un EAN ne s'invente pas
    bw, bh = 38.0, 16.0
    bx, by = cx - bw / 2, y0 + HT * 0.74
    el.append(f'<g class="repere-ean">'
              f'<rect x="{fl(bx)}" y="{fl(by)}" width="{fl(bw)}" height="{fl(bh)}"'
              f' fill="none" stroke="{C_REPERE}" stroke-width="0.2"'
              f' stroke-dasharray="1.6 1.2"/>'
              f'<text x="{fl(cx)}" y="{fl(by + bh + 3.2)}" fill="{C_REPERE}"'
              f' text-anchor="middle" font-family="{JOST}" font-size="1.9"'
              f' letter-spacing="0.3">code-barres EAN &#183; ne pas imprimer</text></g>')
    return "\n    ".join(el)


def decor_dos(x0, y0, numero, nom, inspire):
    """Le dos : ce que la loi et le client demandent."""
    cx = x0 + W / 2
    if STANDARD:
        return decor_dos_standard(x0, y0)
    td, idd = ajuste(f"{numero} - {nom.upper()}", W - 6.0, 2.8, 1.0)
    lignes = [
        ("ODYS PARFUMS", 3.2, 1.2, 0.30),
        (f"{numero} &#183; {xml(nom.upper())}", td, idd, 0.37),
        (f"EXTRAIT DE PARFUM &#183; {CONTENANCE}", 2.4, 0.7, 0.44),
        ("Sidi Maarouf, Casablanca, Maroc", 2.2, 0.2, 0.56),
        ("contact@odysparfum.com", 2.2, 0.2, 0.60),
        ("odysparfum.com", 2.2, 0.2, 0.64),
        ("Fabriqué au Maroc", 2.2, 0.3, 0.72),
        ("Tenir hors de portée des enfants.", 1.9, 0.1, 0.80),
        ("Ne pas exposer à la chaleur ni au soleil.", 1.9, 0.1, 0.835),
        ("Inflammable.", 1.9, 0.1, 0.87),
    ]
    el = [f'<text x="{fl(cx)}" y="{fl(y0 + HT * p)}" fill="{ENCRE}"'
          f' text-anchor="middle" font-family="{JOST}"'
          f' font-size="{fl(t)}" letter-spacing="{fl(i)}">{txt}</text>'
          for txt, t, i, p in lignes]
    # La mention « inspire de », la ou elle doit etre. Sur deux lignes : en
    # une seule elle faisait 60.8 mm sur un panneau de 56.
    el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.915)}" fill="{ENCRE}"'
              f' text-anchor="middle" font-family="{JOST}" opacity="0.8"'
              f' font-size="1.8" letter-spacing="0.1">Composition originale'
              f" d&#8217;inspiration.</text>")
    if inspire:
        el.append(f'<text x="{fl(cx)}" y="{fl(y0 + HT * 0.945)}" fill="{ENCRE}"'
                  f' text-anchor="middle" font-family="{JOST}" opacity="0.8"'
                  f' font-size="1.8" letter-spacing="0.1">Inspir&#233; de'
                  f" {xml(inspire)}.</text>")
    return "\n    ".join(el)


def decor_cote(x0, y0, texte, brut=None):
    """Un cote : le texte, petit, dans le sens de la hauteur."""
    cx, cy = x0 + D / 2, y0 + HT / 2
    tc, ic = ajuste(brut or texte, HT - 10.0, 2.8, 2.2)
    couleur = ENCRE_NUE if DECOR == "sobre" else OR
    return (f'<g transform="rotate(-90 {fl(cx)} {fl(cy)})">'
            f'<text x="{fl(cx)}" y="{fl(cy + 1.1)}" fill="{couleur}"'
            f' text-anchor="middle" font-family="{JOST}"'
            f' font-size="{fl(tc)}" letter-spacing="{fl(ic)}">{texte}</text></g>')


def trace():
    """Le plan de decoupe : coupes, rainages, zone de colle."""
    coupes, plis = [], []

    def rect_coupe(x, y, w, h, r=0.0):
        coupes.append(f'<rect x="{fl(x)}" y="{fl(y)}" width="{fl(w)}" height="{fl(h)}"'
                      + (f' rx="{fl(r)}"' if r else "") + "/>")

    def ligne_pli(x1, y1, x2, y2):
        plis.append(f'<line x1="{fl(x1)}" y1="{fl(y1)}" x2="{fl(x2)}" y2="{fl(y2)}"/>')

    # le contour du corps, d'un bout a l'autre
    rect_coupe(X_COLLE, Y_CORPS, LARGEUR_PLAN, HT)

    # les plis verticaux entre panneaux
    for x in (X_FACE, X_COTE1, X_DOS, X_COTE2):
        ligne_pli(x, Y_CORPS, x, Y_BAS)

    # Rabat rentrant du haut, sur le DOS ; du bas, sur la FACE.
    #
    # Chaque rabat se termine par une LANGUETTE DE VERROUILLAGE : une patte
    # plus etroite, arrondie, separee du rabat par un rainage. C'est elle qui
    # passe derriere le panneau et retient la boite fermee. Sans elle le
    # rabat ne fait que reposer dans l'ouverture et ressort au premier choc —
    # c'est ce qui manquait.
    #
    # Le rabat se retrecit aussi de 1 mm par cote en s'eloignant du pli :
    # un rabat parfaitement rectangulaire force a l'insertion.
    def rabat_a_languette(x, y_pli, sens):
        """sens = -1 vers le haut, +1 vers le bas."""
        y_lang = y_pli + sens * RABAT          # rainage rabat / languette
        y_bout = y_lang + sens * LANGUETTE     # bord exterieur
        coupes.append(
            f'<path d="M {fl(x)} {fl(y_pli)} '
            f'L {fl(x + BISEAU)} {fl(y_lang)} '
            f'L {fl(x + RETRAIT)} {fl(y_lang)} '
            f'L {fl(x + RETRAIT)} {fl(y_bout - sens * ARRONDI)} '
            f'Q {fl(x + RETRAIT)} {fl(y_bout)} {fl(x + RETRAIT + ARRONDI)} {fl(y_bout)} '
            f'L {fl(x + W - RETRAIT - ARRONDI)} {fl(y_bout)} '
            f'Q {fl(x + W - RETRAIT)} {fl(y_bout)} {fl(x + W - RETRAIT)} {fl(y_bout - sens * ARRONDI)} '
            f'L {fl(x + W - RETRAIT)} {fl(y_lang)} '
            f'L {fl(x + W - BISEAU)} {fl(y_lang)} '
            f'L {fl(x + W)} {fl(y_pli)}"/>')
        ligne_pli(x, y_pli, x + W, y_pli)                      # panneau / rabat
        ligne_pli(x + RETRAIT, y_lang, x + W - RETRAIT, y_lang)  # rabat / languette

    rabat_a_languette(X_DOS, Y_CORPS, -1)
    rabat_a_languette(X_FACE, Y_BAS, +1)

    # rabats anti-poussiere, sur les deux cotes, en haut et en bas
    for x in (X_COTE1, X_COTE2):
        coupes.append(f'<path d="M {fl(x + 0.6)} {fl(Y_CORPS)} '
                      f'L {fl(x + 1.6)} {fl(Y_CORPS - POUSSIERE)} '
                      f'L {fl(x + D - 1.6)} {fl(Y_CORPS - POUSSIERE)} '
                      f'L {fl(x + D - 0.6)} {fl(Y_CORPS)}"/>')
        ligne_pli(x, Y_CORPS, x + D, Y_CORPS)
        coupes.append(f'<path d="M {fl(x + 0.6)} {fl(Y_BAS)} '
                      f'L {fl(x + 1.6)} {fl(Y_BAS + POUSSIERE)} '
                      f'L {fl(x + D - 1.6)} {fl(Y_BAS + POUSSIERE)} '
                      f'L {fl(x + D - 0.6)} {fl(Y_BAS)}"/>')
        ligne_pli(x, Y_BAS, x + D, Y_BAS)

    hachures = "".join(
        f'<line x1="{fl(X_COLLE)}" y1="{fl(y)}" x2="{fl(COLLE)}" y2="{fl(y - COLLE)}"/>'
        for y in range(int(Y_CORPS) + 3, int(Y_BAS) + int(COLLE), 4))

    return f"""  <g id="colle" stroke="{C_COLLE}" stroke-width="0.12" opacity="0.6"
     clip-path="url(#zoneColle)">{hachures}</g>
  <g id="rainage" fill="none" stroke="{C_PLI}" stroke-width="{T_PLI}"
     stroke-dasharray="2.4 1.6">
    {chr(10).join('    ' + p for p in plis).strip()}
  </g>
  <g id="coupe" fill="none" stroke="{C_COUPE}" stroke-width="{T_COUPE}">
    {chr(10).join('    ' + c for c in coupes).strip()}
  </g>"""


def etui_svg(numero, nom, inspire, avec_decor=True):
    decor = ""
    if avec_decor:
        decor = f"""  <g id="decor">
    <rect x="{fl(X_COLLE)}" y="{fl(Y_CORPS - RABAT)}" width="{fl(LARGEUR_PLAN)}"
          height="{fl(HAUTEUR_PLAN)}" fill="{CARTON_NU if DECOR == 'sobre' else CARTON}"/>
    {(decor_face_sobre if DECOR == "sobre" else decor_face)(X_FACE, Y_CORPS, numero, nom)}
    {decor_dos(X_DOS, Y_CORPS, numero, nom, inspire)}
    {decor_cote(X_COTE1, Y_CORPS, 'ODYS PARFUM')}
    {decor_cote(X_COTE2, Y_CORPS, f'{numero} &#183; {xml(nom.upper())}', f'{numero} - {nom.upper()}')}
  </g>
"""
    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     width="{fl(LARGEUR_PLAN)}mm" height="{fl(HAUTEUR_PLAN)}mm"
     viewBox="0 0 {fl(LARGEUR_PLAN)} {fl(HAUTEUR_PLAN)}">
  <title>Etui ODYS {numero} — {xml(nom)} — flacon {fl(LARGEUR_FLACON)}x{fl(PROFONDEUR_FLACON)}x{fl(HAUTEUR_FLACON)} mm</title>
  <defs><clipPath id="zoneColle">
    <rect x="{fl(X_COLLE)}" y="{fl(Y_CORPS)}" width="{fl(COLLE)}" height="{fl(HT)}"/>
  </clipPath></defs>
{decor}{trace()}
</svg>"""


def main():
    catalogue = json.loads((HERE / "catalogue.json").read_text(encoding="utf-8"))
    parfums = [p for p in catalogue if p.get("kind") == "perfume"]

    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / "etui").mkdir(exist_ok=True)

    for p in parfums:
        num = p["code"].replace("ODYS", "").strip()
        svg = etui_svg(num, p["name"], p.get("inspired_by", ""))
        (SORTIE / "etui" / f"odys-{p['reference']}.svg").write_text(svg, encoding="utf-8")

    (SORTIE / "dieline-odys.svg").write_text(
        etui_svg("00", "GABARIT", "", avec_decor=False), encoding="utf-8")

    polices = ("https://fonts.googleapis.com/css2?"
               "family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500"
               "&amp;family=Jost:wght@300;400;500&amp;display=swap")
    vignettes = "\n".join(
        f'<figure><figcaption>{p["code"]} &middot; {p["name"]}</figcaption>'
        f'<img src="etui/odys-{p["reference"]}.svg" alt="Etui {p["name"]}"/></figure>'
        for p in parfums)

    (SORTIE / "apercu.html").write_text(f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Etuis ODYS — plan a plat</title>
<link href="{polices}" rel="stylesheet"/>
<style>
 body{{margin:0;background:#2b2b2b;color:#eee;
      font:13px/1.6 ui-sans-serif,system-ui,sans-serif}}
 .tete{{max-width:{fl(LARGEUR_PLAN)}mm;margin:16mm auto 6mm}}
 figure{{margin:0 0 14mm;background:#fff;padding:4mm;width:max-content}}
 figcaption{{color:#333;font-weight:600;margin-bottom:3mm}}
 img{{display:block;width:{fl(LARGEUR_PLAN)}mm;height:{fl(HAUTEUR_PLAN)}mm}}
 .liste{{display:flex;flex-direction:column;align-items:center}}
 code{{background:#444;padding:1px 5px;border-radius:3px}}
 .alerte{{border-left:3px solid #E6007E;padding-left:10px}}
</style></head><body>
<div class="tete">
 <h1>Etuis ODYS — plan a plat</h1>
 <p>Flacon 54 &times; 30 &times; 100 mm (bouchon compris), 50 ml.
 Etui a rabats rentrants inverses, monte a la main. Interieur
 {fl(W)} &times; {fl(D)} &times; {fl(HT)} mm, soit le flacon plus {fl(JEU)} mm
 d'aisance. Plan a plat : {fl(LARGEUR_PLAN)} &times; {fl(HAUTEUR_PLAN)} mm.</p>
 <p><span style="color:#E6007E">&#9644;</span> coupe &nbsp;
    <span style="color:#0090D4">&#9644;</span> rainage (pli) &nbsp;
    <span style="color:#2E9E4F">&#9644;</span> zone de colle</p>
 <p>Le fichier <code>dieline-odys.svg</code> est le trace seul, sans decor.
 Donnez les deux au cartonnier.</p>
</div>
<div class="liste">
{vignettes}
</div>
</body></html>""", encoding="utf-8")

    print(f"{len(parfums)} etuis")
    print(f"  flacon : {fl(LARGEUR_FLACON)} x {fl(PROFONDEUR_FLACON)} x {fl(HAUTEUR_FLACON)} mm, 50 ml")
    print(f"  interieur etui : {fl(W)} x {fl(D)} x {fl(HT)} mm  (jeu {fl(JEU)} mm)")
    print(f"  plan a plat    : {fl(LARGEUR_PLAN)} x {fl(HAUTEUR_PLAN)} mm")
    print(f"  sortie         : {SORTIE}")


if __name__ == "__main__":
    main()
