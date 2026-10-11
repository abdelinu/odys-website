"""Les pastilles 30 x 20 mm : ce qui nomme le parfum sur une boite unique.

La boite est imprimee une seule fois pour les treize references, avec un
emplacement laisse vide. C'est cette pastille, collee a la main, qui dit
laquelle. Un tirage de carton au lieu de treize, et un nouveau parfum ne
demande plus qu'une planche d'autocollants.

Produit :

  * `pastilles-odys.html` — une planche A4 de 8 colonnes x 13 rangees, soit
    104 pastilles, groupees par reference. Chrome -> Imprimer -> PDF,
    echelle 100 %.
  * `svg/odys-NN.svg` — une pastille par reference, taille reelle, 1.5 mm de
    fond perdu.

Le fond est laisse transparent : sur du papier autocollant creme la pastille
se fond dans le carton. Si vous imprimez sur du blanc, decommentez le fond.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
SORTIE = WS / "dist" / "pastilles"

L, H = 30.0, 20.0
FOND_PERDU = 1.5
OR = "#B0854A"
ENCRE = "#2A2218"
BODONI = "'Bodoni Moda', Didot, 'Bodoni 72', Georgia, serif"
JOST = "Jost, 'Helvetica Neue', Arial, sans-serif"


def fl(x):
    return f"{x:.2f}".rstrip("0").rstrip(".")


def xml(s):
    return str(s).replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def ajuste(texte, dispo, taille, inter, ratio=0.62):
    """Reduit jusqu'a tenir : « LE SERMENT ABSOLU » ne fait pas la meme
    longueur que « L'OR »."""
    largeur = len(texte) * (taille * ratio + inter)
    if largeur <= dispo:
        return taille, inter
    k = dispo / largeur
    return taille * k, inter * k


def pastille_svg(numero, nom, bleed=False):
    d = FOND_PERDU if bleed else 0.0
    lt, ht = L + 2 * d, H + 2 * d
    cx, cy = d + L / 2, d + H / 2
    tn, it = ajuste(nom.upper(), L - 4.0, 2.9, 1.1)

    reperes = ""
    if bleed:
        t = []
        for x in (d, d + L):
            t.append(f'<line x1="{fl(x)}" y1="0" x2="{fl(x)}" y2="{fl(d - 0.4)}"/>')
            t.append(f'<line x1="{fl(x)}" y1="{fl(ht - d + 0.4)}" x2="{fl(x)}" y2="{fl(ht)}"/>')
        for y in (d, d + H):
            t.append(f'<line x1="0" y1="{fl(y)}" x2="{fl(d - 0.4)}" y2="{fl(y)}"/>')
            t.append(f'<line x1="{fl(lt - d + 0.4)}" y1="{fl(y)}" x2="{fl(lt)}" y2="{fl(y)}"/>')
        reperes = ('\n  <g stroke="#000" stroke-width="0.08" opacity="0.7">'
                   + "".join(t) + "</g>")

    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     width="{fl(lt)}mm" height="{fl(ht)}mm" viewBox="0 0 {fl(lt)} {fl(ht)}">
  <title>Pastille ODYS {numero} — {xml(nom)} — {fl(L)}x{fl(H)} mm</title>
  <!-- fond transparent : prevu pour du papier autocollant creme.
       Sur du blanc, retirer le commentaire de la ligne suivante.
  <rect x="{fl(d)}" y="{fl(d)}" width="{fl(L)}" height="{fl(H)}" rx="1.2" fill="#F3EBDF"/> -->
  <text x="{fl(cx)}" y="{fl(cy - 1.0)}" fill="{ENCRE}" text-anchor="middle"
        font-family="{BODONI}" font-size="5.4" letter-spacing="0.5">{numero}</text>
  <line x1="{fl(cx - 4.0)}" y1="{fl(cy + 1.1)}" x2="{fl(cx + 4.0)}" y2="{fl(cy + 1.1)}"
        stroke="{OR}" stroke-width="0.25"/>
  <text x="{fl(cx)}" y="{fl(cy + 5.4)}" fill="{ENCRE}" text-anchor="middle"
        font-family="{JOST}" font-size="{fl(tn)}" letter-spacing="{fl(it)}">{xml(nom.upper())}</text>{reperes}
</svg>"""


def main():
    catalogue = json.loads((HERE / "catalogue.json").read_text(encoding="utf-8"))
    parfums = [p for p in catalogue if p.get("kind") == "perfume"]

    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / "svg").mkdir(exist_ok=True)

    rangees = []
    for p in parfums:
        num = p["code"].replace("ODYS", "").strip()
        (SORTIE / "svg" / f"odys-{p['reference']}.svg").write_text(
            pastille_svg(num, p["name"], bleed=True), encoding="utf-8")
        une = pastille_svg(num, p["name"])
        rangees.append('<div class="rangee">'
                       + "".join(f'<div class="p">{une}</div>' for _ in range(8))
                       + "</div>")

    polices = ("https://fonts.googleapis.com/css2?"
               "family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500"
               "&amp;family=Jost:wght@300;400;500&amp;display=swap")

    (SORTIE / "pastilles-odys.html").write_text(f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Pastilles ODYS — {fl(L)} x {fl(H)} mm</title>
<link href="{polices}" rel="stylesheet"/>
<style>
 @page {{ size: A4 portrait; margin: 8mm; }}
 html,body{{margin:0;background:#555}}
 .feuille{{width:194mm;margin:0 auto;background:#fff;padding:0}}
 .rangee{{display:flex;gap:2mm;margin-bottom:2mm}}
 .p{{width:{fl(L)}mm;height:{fl(H)}mm;outline:0.1mm dashed #ccc;background:#F3EBDF}}
 .p svg{{display:block;width:{fl(L)}mm;height:{fl(H)}mm}}
 .notice{{max-width:194mm;margin:10mm auto;color:#eee;
          font:13px/1.6 ui-sans-serif,system-ui,sans-serif}}
 code{{background:#444;padding:1px 5px;border-radius:3px}}
 @media print{{html,body{{background:#fff}} .notice{{display:none}}
               .p{{outline:none;background:transparent}}}}
</style></head><body>
<div class="notice">
 <p>104 pastilles : 8 par reference, 13 rangees, une reference par rangee.
 Sur papier autocollant A4, <b>echelle 100 %</b>, marges « Aucune ».</p>
 <p>Elles se collent dans l'emplacement reserve de la boite standard —
 le rectangle en pointilles marque « pastille 30 &times; 20 mm ». Le fond est
 transparent : prevu pour de l'autocollant creme. Sur du blanc, ouvrez
 <code>pastilles.py</code> et retirez le commentaire du rectangle de fond.</p>
 <p>Les fichiers de <code>svg/</code> ont {fl(FOND_PERDU)} mm de fond perdu et
 des traits de coupe, pour un imprimeur qui les decoupe a la forme.</p>
</div>
<div class="feuille">
{chr(10).join(rangees)}
</div>
</body></html>""", encoding="utf-8")

    print(f"{len(parfums)} pastilles — {fl(L)} x {fl(H)} mm")
    print(f"  planche A4 : {len(parfums) * 8} pastilles, 8 par reference")
    print(f"  vectoriels : svg/, fond perdu {fl(FOND_PERDU)} mm")
    print(f"  sortie     : {SORTIE}")


if __name__ == "__main__":
    main()
