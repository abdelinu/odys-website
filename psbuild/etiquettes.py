"""Les etiquettes de flacon : 76 x 31 mm, dont 31 x 31 pour le logo.

Produit deux choses a partir des memes mesures :

  * `etiquettes-odys.html` — une planche A4 a imprimer soi-meme, etiquettes
    a la taille exacte, avec des reperes de coupe. Chrome -> Imprimer ->
    Enregistrer en PDF, echelle 100 %, sans mise a l'echelle.

  * `svg/odys-NN.svg` — une etiquette par fichier, en vectoriel, a la taille
    reelle, avec 2 mm de fond perdu et des traits de coupe. C'est ce qu'un
    imprimeur demande.

Tout est en millimetres, y compris dans le SVG (viewBox en unites = mm,
width/height declares en mm) : ce qui sort de l'imprimeur mesure ce qui est
ecrit ici.

LE LOGO est celui du site, pas un dessin. Mesure sur odysparfum.com :

    ODYS    Bodoni Moda  25 px, interlettrage 5 px   (0.20 em)
    PARFUM  Jost          7 px, interlettrage 4.2 px (0.60 em), majuscules
    empiles, centres, 6 px d'ecart, largeur totale 83 px

Les rapports sont conserves et mis a l'echelle du carre de 31 mm, pour que
l'etiquette et l'en-tete du site portent la meme signature.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
SORTIE = WS / "dist" / "etiquettes"

# ── les mesures, en millimetres ─────────────────────────────────────────
L, H = 76.0, 31.0          # l'etiquette
LOGO = 31.0                # le carre du logo, a gauche
FOND_PERDU = 2.0           # pour l'imprimeur
MARGE = 1.3                # le filet interieur
TRAIT = 0.25               # son epaisseur

# ── la palette, celle du site ───────────────────────────────────────────
CREME = "#F3EBDF"
OR = "#B0854A"
OR_CLAIR = "#C9A66B"
ENCRE = "#2A2218"

# ── les polices du site ─────────────────────────────────────────────────
BODONI = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif"
JOST = "Jost, 'Helvetica Neue', Arial, sans-serif"

# ── la contenance ───────────────────────────────────────────────────────
# Confirme par la boutique : flacon de 50 ml. Le 30 ml de la premiere
# maquette etait une erreur. Changez ici, les deux sorties suivent.
CONTENANCE_PAR_DEFAUT = "50 ml"

# Ce que porte la grande ligne, a droite du logo :
#   "code" — « ODYS 11 », comme la maquette. ODYS apparait alors deux fois.
#   "nom"  — « L'Or », et le numero passe en petit avec la contenance.
VARIANTE = "nom"


# Pas de signe « e estime » (U+212E) : absent de Jost comme de Bodoni
# Moda, donc rendu par une police de secours et perdu a la vectorisation.
# C'est en outre une marque europeenne de quantite estimee, qui suppose
# une conformite que la boutique n'a pas faite.
def fl_oz(ml):
    """ml -> fl oz US (1 fl oz = 29.5735 ml), au dixieme comme la maquette."""
    return f"{round(ml / 29.5735, 1):.1f}".rstrip("0").rstrip(".") or "0"


def logo_odys(cx, cy, taille):
    """Le logo du site, aux rapports mesures sur odysparfum.com.

    `taille` est le corps de ODYS ; tout le reste en decoule, comme dans le
    CSS du theme. Centre sur (cx, cy).
    """
    inter_odys = taille * 0.20          # 5 px pour 25 px
    corps_parfum = taille * 0.28        # 7 px pour 25 px
    inter_parfum = corps_parfum * 0.60  # 4.2 px pour 7 px
    ecart = taille * 0.24               # 6 px pour 25 px

    # text-anchor=middle centre la chaine, mais l'interlettrage ajoute un
    # blanc apres la derniere lettre : on retranche la moitie pour que le
    # bloc soit optiquement centre, comme le flex du site.
    dx_odys = -inter_odys / 2
    dx_parfum = -inter_parfum / 2

    y_odys = cy - ecart / 2
    y_parfum = y_odys + ecart + corps_parfum

    return "\n".join([
        f'    <text x="{cx + dx_odys:.2f}" y="{y_odys:.2f}" fill="{OR}"'
        f' text-anchor="middle" font-family="{BODONI}"'
        f' font-size="{taille:.2f}" letter-spacing="{inter_odys:.2f}">ODYS</text>',
        f'    <text x="{cx + dx_parfum:.2f}" y="{y_parfum:.2f}" fill="{OR}"'
        f' text-anchor="middle" font-family="{JOST}" opacity="0.78"'
        f' font-size="{corps_parfum:.2f}" letter-spacing="{inter_parfum:.2f}">PARFUM</text>',
    ])


def etiquette_svg(code, nom, contenance, concentration, bleed=False, variante=None):
    """Une etiquette, en coordonnees millimetriques."""
    variante = variante or VARIANTE
    d = FOND_PERDU if bleed else 0.0
    lt, ht = L + 2 * d, H + 2 * d
    ml = float(contenance.split()[0])
    numero = code.replace("ODYS", "").strip()

    if variante == "code":
        titre, taille_titre = code, 7.4
        pied = f"{contenance} &#183; {fl_oz(ml)} FL.OZ"
    else:
        titre, taille_titre = nom, 7.4
        pied = f"N&#176; {numero} &#183; {contenance} &#183; {fl_oz(ml)} FL.OZ"

    reperes = ""
    if bleed:
        t = []
        for x in (d, d + L):
            t.append(f'<line x1="{x}" y1="0" x2="{x}" y2="{d - 0.6:.2f}"/>')
            t.append(f'<line x1="{x}" y1="{ht - d + 0.6:.2f}" x2="{x}" y2="{ht}"/>')
        for y in (d, d + H):
            t.append(f'<line x1="0" y1="{y}" x2="{d - 0.6:.2f}" y2="{y}"/>')
            t.append(f'<line x1="{lt - d + 0.6:.2f}" y1="{y}" x2="{lt}" y2="{y}"/>')
        reperes = ('\n  <g stroke="#000" stroke-width="0.1" opacity="0.7">'
                   + "".join(t) + "</g>")

    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     width="{lt}mm" height="{ht}mm" viewBox="0 0 {lt} {ht}">
  <title>Etiquette {code} — {nom} — {L:.0f}x{H:.0f} mm</title>
  <rect x="{d}" y="{d}" width="{L}" height="{H}" rx="1.6" fill="{CREME}"/>
  <g transform="translate({d},{d})">
    <rect x="{MARGE}" y="{MARGE}" width="{L - 2 * MARGE}" height="{H - 2 * MARGE}" rx="1.0"
          fill="none" stroke="{OR_CLAIR}" stroke-width="{TRAIT}"/>
    <line x1="{LOGO}" y1="{MARGE + 2.6}" x2="{LOGO}" y2="{H - MARGE - 2.6}"
          stroke="{OR_CLAIR}" stroke-width="{TRAIT}"/>
{logo_odys(LOGO / 2, H / 2, 6.1)}
    <text x="{LOGO + 4.6}" y="{H / 2 - 1.6}" fill="{ENCRE}"
          font-family="{BODONI}"
          font-size="{taille_titre}" letter-spacing="0.3">{titre}</text>
    <text x="{LOGO + 4.9}" y="{H / 2 + 3.6}" fill="{OR}"
          font-family="{JOST}"
          font-size="2.0" letter-spacing="0.78">{concentration.upper()}</text>
    <text x="{LOGO + 4.9}" y="{H - 6.6}" fill="{ENCRE}"
          font-family="{JOST}"
          font-size="2.1" letter-spacing="0.3">{pied}</text>
  </g>{reperes}
</svg>"""


def main():
    catalogue = json.loads((HERE / "catalogue.json").read_text(encoding="utf-8"))
    parfums = [p for p in catalogue if p.get("kind") == "perfume"]

    SORTIE.mkdir(parents=True, exist_ok=True)
    for variante in ("nom", "code"):
        (SORTIE / variante).mkdir(exist_ok=True)
        for p in parfums:
            svg = etiquette_svg(p["code"], p["name"], CONTENANCE_PAR_DEFAUT,
                                "Extrait de Parfum", bleed=True, variante=variante)
            (SORTIE / variante / f"odys-{p['reference']}.svg").write_text(svg, encoding="utf-8")

    # ── la planche A4, dans la variante retenue ─────────────────────────
    vignettes = []
    for p in parfums:
        svg = etiquette_svg(p["code"], p["name"], CONTENANCE_PAR_DEFAUT, "Extrait de Parfum")
        vignettes.append(f'<div class="et" data-ref="{p["reference"]}">{svg}</div>')
    while len(vignettes) < 16:
        vignettes.append(vignettes[len(vignettes) % len(parfums)])

    polices = ("https://fonts.googleapis.com/css2?"
               "family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500"
               "&amp;family=Jost:wght@300;400;500&amp;display=swap")

    html = f"""<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8"/>
<title>Etiquettes ODYS Parfums — {L:.0f} x {H:.0f} mm</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="{polices}" rel="stylesheet"/>
<style>
  @page {{ size: A4 portrait; margin: 10mm; }}
  html,body {{ margin:0; padding:0; background:#555; }}
  .feuille {{ width:190mm; margin:0 auto; background:#fff;
              display:grid; grid-template-columns:repeat(2, {L}mm);
              gap:4mm 6mm; justify-content:center; align-content:start; }}
  .et {{ width:{L}mm; height:{H}mm; outline:0.1mm dashed #bbb; outline-offset:0.8mm; }}
  .et svg {{ display:block; width:{L}mm; height:{H}mm; }}
  .notice {{ max-width:190mm; margin:12mm auto; color:#eee;
             font:13px/1.65 ui-sans-serif,system-ui,sans-serif; }}
  .notice code {{ background:#333; padding:1px 5px; border-radius:3px; }}
  @media print {{
    html,body {{ background:#fff; }}
    .notice {{ display:none; }}
    .et {{ outline:none; }}
    .feuille {{ margin:0; }}
  }}
</style>
</head>
<body>
<div class="notice">
  <p><b>Le logo</b> est celui du site : ODYS en Bodoni Moda sur PARFUM en Jost,
  aux rapports mesures sur odysparfum.com (interlettrage 0,20 em et 0,60 em).
  Ce n'est pas un redessin.</p>
  <p><b>Impression.</b> Chrome &rarr; Imprimer &rarr; Destination
  « Enregistrer au format PDF » &rarr; Papier A4 &rarr; Marges « Aucune » &rarr;
  <b>Echelle 100 %</b> (surtout pas « Ajuster a la page », qui fausserait les
  millimetres). Verifiez a la regle sur la premiere sortie :
  une etiquette doit mesurer {L:.0f} &times; {H:.0f} mm.</p>
  <p><b>Pour un imprimeur</b>, envoyez les fichiers de <code>nom/</code> ou de
  <code>code/</code> : un par reference, vectoriel, taille reelle,
  {FOND_PERDU:.0f} mm de fond perdu et traits de coupe. Demandez-lui de
  vectoriser les textes, ou fournissez-lui <i>Bodoni Moda</i> et <i>Jost</i>
  (Google Fonts, licence OFL, libres d'usage commercial).</p>
  <p>Le trait pointille gris autour de chaque etiquette est un repere d'ecran :
  il ne s'imprime pas.</p>
</div>
<div class="feuille">
{chr(10).join(vignettes)}
</div>
</body>
</html>"""
    (SORTIE / "etiquettes-odys.html").write_text(html, encoding="utf-8")

    print(f"{len(parfums)} etiquettes — {L:.0f} x {H:.0f} mm, dont {LOGO:.0f} x {LOGO:.0f} de logo")
    print(f"  logo       : wordmark du site (Bodoni Moda + Jost), pas un dessin")
    print(f"  planche A4 : etiquettes-odys.html  (variante « {VARIANTE} »)")
    print(f"  vectoriels : nom/ et code/, {len(parfums)} fichiers chacune, fond perdu {FOND_PERDU:.0f} mm")
    print(f"  contenance : {CONTENANCE_PAR_DEFAUT} -> {fl_oz(float(CONTENANCE_PAR_DEFAUT.split()[0]))} FL.OZ")


if __name__ == "__main__":
    main()
