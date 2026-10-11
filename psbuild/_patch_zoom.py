"""La photo du produit s'ouvre et s'agrandit.

Le <img id="galMain"> etait fige : aucun clic, aucun agrandissement. Sur une
boutique de parfums ou le flacon est le produit, c'est la seule chose que le
client veut regarder de pres.

Trois morceaux : l'image principale devient un bouton, un <dialog> recoit la
visionneuse, et zoom.js est ajoute a la suite de nuit.js et motion.js.

<dialog> fournit l'arriere-plan, le piege a focus, Echap et le retour du focus
sur le bouton d'origine. Rien a installer.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "gallery: the main photo opens" in s:
    sys.exit("already patched")

# ── 1. zoom.js, ajoute comme nuit.js et motion.js ───────────────────────
js_anchor = 'js += (HERE / "motion.js").read_text(encoding="utf-8")\n'
if s.count(js_anchor) != 1:
    sys.exit("js anchor found %dx" % s.count(js_anchor))
s = s.replace(
    js_anchor,
    js_anchor + 'js += (HERE / "zoom.js").read_text(encoding="utf-8")\n'
    'must(js.count("zoomDlg") >= 1, "zoom.js appended: the photo viewer")\n',
    1)

# ── 2. le gabarit ───────────────────────────────────────────────────────
tpl_anchor = '    must(n == 1, "vol-cards: the cart button starts on the default combination")\n'
if s.count(tpl_anchor) != 1:
    sys.exit("tpl anchor found %dx" % s.count(tpl_anchor))

block = r'''
    # ── 3b-sexies. la photo s'ouvre ────────────────────────────────────
    # Un <img> seul n'est ni cliquable ni atteignable au clavier : il devient
    # le contenu d'un bouton, qui annonce ce qu'il fait.
    OLD_GAL = """      <img id="galMain"
"""
    NEW_GAL = """      <button type="button" class="gal-zoom" data-action="zoom-open"
              aria-label="Agrandir la photo de {$product.name|escape:'html':'UTF-8'}">
      <img id="galMain"
"""
    pt, n = pt.replace(OLD_GAL, NEW_GAL), pt.count(OLD_GAL)
    must(n == 1, "gallery: the main photo opens on click")

    OLD_GAL_END = """           width="800" height="800"/>
    </div>
"""
    NEW_GAL_END = """           width="800" height="800"/>
      </button>
    </div>
"""
    pt, n = pt.replace(OLD_GAL_END, NEW_GAL_END), pt.count(OLD_GAL_END)
    must(n == 1, "gallery: the zoom button is closed")

    # La visionneuse elle-meme, a la fin du bloc de contenu. <dialog> donne
    # l'arriere-plan, le piege a focus, Echap et le retour du focus.
    VISIONNEUSE = """
{* La visionneuse. <dialog> plutot qu'une bibliotheque : le navigateur
   fournit l'arriere-plan, le piege a focus, la fermeture par Echap et le
   retour du focus sur le bouton d'origine. zoom.js n'ecrit que la
   navigation entre photos et le passage a la taille reelle. *}
<dialog id="zoomDlg" class="zoom-dlg" aria-label="Photo du produit">
  <button type="button" class="zoom-x" data-action="zoom-close"
          aria-label="Fermer la photo">&times;</button>
  <div class="zoom-wrap" id="zoomWrap">
    <img id="zoomImg" alt=""/>
  </div>
  <div class="zoom-bar">
    <button type="button" class="zoom-nav" id="zoomPrev" data-action="zoom-prev"
            aria-label="Photo precedente" hidden>&#8249;</button>
    <span class="zoom-count" id="zoomCount" aria-live="polite" hidden></span>
    <button type="button" class="zoom-nav" id="zoomNext" data-action="zoom-next"
            aria-label="Photo suivante" hidden>&#8250;</button>
  </div>
</dialog>
"""
    ANCRE_FIN = "{/block}"
    must(pt.rstrip().endswith(ANCRE_FIN), "gallery: the content block ends as expected")
    coupe = pt.rstrip()[: -len(ANCRE_FIN)]
    pt = coupe + VISIONNEUSE + ANCRE_FIN + "\n"
    prod_tpl.write_text(pt, encoding="utf-8")
'''

s = s.replace(tpl_anchor, tpl_anchor + block, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: the product photo opens and zooms")
