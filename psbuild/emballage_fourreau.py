"""La boite fourreau + tiroir, celle de la video Eione.

Deux pieces, comme une boite d'allumettes :

  * le FOURREAU — un tube ouvert aux deux bouts, qui porte le decor ;
  * le TIROIR   — un tube a fond ferme, qui tient le flacon et coulisse
    dedans.

Rien a voir avec l'etui a rabats rentrants de `emballage.py` : celui-la
s'ouvre par le haut, celui-ci se tire par le bas. Le decor, lui, ne change
pas — c'est celui de votre maquette, repris tel quel depuis emballage.py.

Les jeux comptent plus ici qu'ailleurs : un fourreau trop serre ne coulisse
pas, trop large le tiroir tombe tout seul. JEU_COULISSE est l'ecart entre les
deux pieces ; 0.8 mm est la valeur courante pour du carton de 0.5 mm.
"""
import importlib.util
import json
import pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
SORTIE = WS / "dist" / "boite"

# on reprend le decor, les polices et les couleurs de l'etui
_spec = importlib.util.spec_from_file_location("emb", HERE / "emballage.py")
emb = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(emb)

fl, xml, ajuste = emb.fl, emb.xml, emb.ajuste
OR, ENCRE, CARTON = emb.OR, emb.ENCRE, emb.CARTON
C_COUPE, C_PLI, C_COLLE = emb.C_COUPE, emb.C_PLI, emb.C_COLLE
T_COUPE, T_PLI = emb.T_COUPE, emb.T_PLI

# ── le flacon ───────────────────────────────────────────────────────────
LARGEUR_FLACON = 54.0
HAUTEUR_FLACON = 100.0
PROFONDEUR_FLACON = 30.0      # mesuree sur le flacon
CARTON_EP = 0.5               # epaisseur du carton

JEU_FLACON = 2.0              # aisance du flacon dans le tiroir
JEU_COULISSE = 0.8            # jeu entre tiroir et fourreau

# ── le tiroir, qui enveloppe le flacon ──────────────────────────────────
TW = LARGEUR_FLACON + JEU_FLACON        # 56
TD = PROFONDEUR_FLACON + JEU_FLACON     # 32
TH = HAUTEUR_FLACON + JEU_FLACON        # 102
FOND = min(TW, TD) * 0.55               # rabats du fond, qui se recouvrent
TAB = 12.0

# ── le fourreau, qui enveloppe le tiroir ────────────────────────────────
FW = TW + 2 * CARTON_EP + JEU_COULISSE  # 57.8
FD = TD + 2 * CARTON_EP + JEU_COULISSE  # 33.8
FH = TH + 3.0                           # un peu plus haut : le tiroir ne
                                        # depasse pas quand il est rentre


def _plan(panneaux, hauteur, tab=TAB):
    """Les abscisses des plis d'un tube : patte + les quatre panneaux."""
    xs, x = [tab], tab
    for p in panneaux:
        x += p
        xs.append(x)
    return xs, x


def _groupes(coupes, plis, hachures=""):
    return f"""  <g id="colle" stroke="{C_COLLE}" stroke-width="0.12" opacity="0.6">{hachures}</g>
  <g id="rainage" fill="none" stroke="{C_PLI}" stroke-width="{T_PLI}"
     stroke-dasharray="2.4 1.6">
    {chr(10).join('    ' + p for p in plis).strip()}
  </g>
  <g id="coupe" fill="none" stroke="{C_COUPE}" stroke-width="{T_COUPE}">
    {chr(10).join('    ' + c for c in coupes).strip()}
  </g>"""


def _hachures(x0, x1, y0, y1):
    return "".join(
        f'<line x1="{fl(x0)}" y1="{fl(y)}" x2="{fl(x1)}" y2="{fl(max(y0, y - (x1 - x0)))}"/>'
        for y in range(int(y0) + 3, int(y1) + int(x1 - x0), 4)
        if y - (x1 - x0) < y1)


def fourreau_svg(numero, nom, inspire=""):
    """Le tube qui porte le decor. Ouvert en haut et en bas."""
    xs, largeur = _plan([FW, FD, FW, FD], FH)
    hauteur = FH
    coupes = [f'<rect x="0" y="0" width="{fl(largeur)}" height="{fl(hauteur)}"/>']
    plis = [f'<line x1="{fl(x)}" y1="0" x2="{fl(x)}" y2="{fl(hauteur)}"/>' for x in xs]

    # le decor de la maquette, sur le premier grand panneau
    emb.W, emb.HT, emb.D = FW, FH, FD
    face = emb.decor_face(xs[0], 0.0, numero, nom)
    dos = emb.decor_dos(xs[2], 0.0, numero, nom, inspire)
    cote1 = emb.decor_cote(xs[1], 0.0, "ODYS PARFUM")
    cote2 = emb.decor_cote(xs[3], 0.0, f"{numero} &#183; {xml(nom.upper())}",
                           f"{numero} - {nom.upper()}")

    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     width="{fl(largeur)}mm" height="{fl(hauteur)}mm"
     viewBox="0 0 {fl(largeur)} {fl(hauteur)}">
  <title>Fourreau ODYS {numero} — {xml(nom)} — {fl(FW)}x{fl(FD)}x{fl(FH)} mm</title>
  <g id="decor">
    <rect x="0" y="0" width="{fl(largeur)}" height="{fl(hauteur)}" fill="{CARTON}"/>
    {face}
    {dos}
    {cote1}
    {cote2}
  </g>
{_groupes(coupes, plis, _hachures(0, TAB, 0, hauteur))}
</svg>"""


def tiroir_svg(numero, nom):
    """Le tube a fond ferme, qui recoit le flacon."""
    xs, largeur = _plan([TW, TD, TW, TD], TH)
    hauteur = TH + FOND
    coupes = [f'<rect x="0" y="0" width="{fl(largeur)}" height="{fl(TH)}"/>']
    plis = [f'<line x1="{fl(x)}" y1="0" x2="{fl(x)}" y2="{fl(TH)}"/>' for x in xs]
    plis.append(f'<line x1="{fl(TAB)}" y1="{fl(TH)}" x2="{fl(largeur)}" y2="{fl(TH)}"/>')

    # quatre rabats de fond qui se recouvrent et se collent
    for i in range(4):
        a, b = xs[i], xs[i + 1]
        coupes.append(f'<path d="M {fl(a)} {fl(TH)} '
                      f'L {fl(a + 1.2)} {fl(TH + FOND)} '
                      f'L {fl(b - 1.2)} {fl(TH + FOND)} '
                      f'L {fl(b)} {fl(TH)}"/>')

    # une encoche en haut du premier panneau : le doigt attrape le tiroir
    cx = (xs[0] + xs[1]) / 2
    coupes.append(f'<path d="M {fl(cx - 7)} 0 A 7 7 0 0 0 {fl(cx + 7)} 0" />')

    return f"""<svg xmlns="http://www.w3.org/2000/svg"
     width="{fl(largeur)}mm" height="{fl(hauteur)}mm"
     viewBox="0 0 {fl(largeur)} {fl(hauteur)}">
  <title>Tiroir ODYS {numero} — {xml(nom)} — interieur {fl(TW)}x{fl(TD)}x{fl(TH)} mm</title>
  <g id="decor">
    <rect x="0" y="0" width="{fl(largeur)}" height="{fl(hauteur)}" fill="{CARTON}"/>
    <text x="{fl(cx)}" y="{fl(TH / 2)}" fill="{OR}" text-anchor="middle"
          font-family="{emb.JOST}" font-size="2.6" letter-spacing="2.0"
          opacity="0.55">ODYS PARFUM</text>
  </g>
{_groupes(coupes, plis, _hachures(0, TAB, 0, TH))}
</svg>"""


def main():
    catalogue = json.loads((HERE / "catalogue.json").read_text(encoding="utf-8"))
    parfums = [p for p in catalogue if p.get("kind") == "perfume"]

    SORTIE.mkdir(parents=True, exist_ok=True)
    (SORTIE / "fourreau").mkdir(exist_ok=True)
    (SORTIE / "tiroir").mkdir(exist_ok=True)

    for p in parfums:
        num = p["code"].replace("ODYS", "").strip()
        (SORTIE / "fourreau" / f"odys-{p['reference']}.svg").write_text(
            fourreau_svg(num, p["name"], p.get("inspired_by", "")), encoding="utf-8")
        (SORTIE / "tiroir" / f"odys-{p['reference']}.svg").write_text(
            tiroir_svg(num, p["name"]), encoding="utf-8")

    polices = ("https://fonts.googleapis.com/css2?"
               "family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500"
               "&amp;family=Jost:wght@300;400;500&amp;display=swap")
    vignettes = "\n".join(
        f'<figure><figcaption>{p["code"]} &middot; {p["name"]}</figcaption>'
        f'<img class="f" src="fourreau/odys-{p["reference"]}.svg" alt="Fourreau"/>'
        f'<img class="t" src="tiroir/odys-{p["reference"]}.svg" alt="Tiroir"/></figure>'
        for p in parfums)

    xs_f, larg_f = _plan([FW, FD, FW, FD], FH)
    xs_t, larg_t = _plan([TW, TD, TW, TD], TH)

    (SORTIE / "apercu.html").write_text(f"""<!doctype html>
<html lang="fr"><head><meta charset="utf-8"/>
<title>Boite fourreau + tiroir — ODYS</title>
<link href="{polices}" rel="stylesheet"/>
<style>
 body{{margin:0;background:#2b2b2b;color:#eee;font:13px/1.6 ui-sans-serif,system-ui,sans-serif}}
 .tete{{max-width:220mm;margin:16mm auto 6mm}}
 figure{{margin:0 0 14mm;background:#fff;padding:4mm;width:max-content}}
 figcaption{{color:#333;font-weight:600;margin-bottom:3mm}}
 img.f{{display:block;width:{fl(larg_f)}mm;height:{fl(FH)}mm;margin-bottom:4mm}}
 img.t{{display:block;width:{fl(larg_t)}mm;height:{fl(TH + FOND)}mm}}
 .liste{{display:flex;flex-direction:column;align-items:center}}
 code{{background:#444;padding:1px 5px;border-radius:3px}}
 .alerte{{border-left:3px solid #E6007E;padding-left:10px}}
</style></head><body>
<div class="tete">
 <h1>Boite fourreau + tiroir</h1>
 <p>Deux pieces, comme une boite d'allumettes : le <b>fourreau</b> porte le
 decor et coulisse sur le <b>tiroir</b>, qui tient le flacon.</p>
 <p>Flacon 54 &times; 30 &times; 100 mm (bouchon compris), 50 ml.</p>
 <p>Fourreau {fl(FW)} &times; {fl(FD)} &times; {fl(FH)} mm &middot;
    tiroir interieur {fl(TW)} &times; {fl(TD)} &times; {fl(TH)} mm &middot;
    jeu de coulissement {fl(JEU_COULISSE)} mm.</p>
 <p><span style="color:#E6007E">&#9644;</span> coupe &nbsp;
    <span style="color:#0090D4">&#9644;</span> rainage &nbsp;
    <span style="color:#2E9E4F">&#9644;</span> colle</p>
</div>
<div class="liste">
{vignettes}
</div>
</body></html>""", encoding="utf-8")

    print(f"{len(parfums)} boites — fourreau + tiroir")
    print(f"  flacon : {fl(LARGEUR_FLACON)} x {fl(PROFONDEUR_FLACON)} x {fl(HAUTEUR_FLACON)} mm, 50 ml")
    print(f"  tiroir interieur : {fl(TW)} x {fl(TD)} x {fl(TH)} mm")
    print(f"  fourreau exterieur : {fl(FW)} x {fl(FD)} x {fl(FH)} mm"
          f"  (jeu de coulissement {fl(JEU_COULISSE)} mm)")
    print(f"  plans a plat : fourreau {fl(larg_f)} x {fl(FH)} mm,"
          f" tiroir {fl(larg_t)} x {fl(TH + FOND)} mm")
    print(f"  sortie : {SORTIE}")


if __name__ == "__main__":
    main()
