"""La ligne « Inspire de » n'ecrit plus le libelle deux fois, ni « &amp; ».

Deux defauts sur la meme ligne, fiche produit et carte de liste :

  Inspire de   Inspire de Dolce &amp; Gabbana L'Imperatrice. Extrait de...

1. Le libelle est dans le template, et description_short commence deja par
   « Inspire de » : le visiteur lisait la mention deux fois, suivie d'une
   phrase de catalogue tronquee au milieu.

2. description_short est un champ HTML : PrestaShop y stocke « Dolce &amp;
   Gabbana », ce qui est correct. strip_tags retire les balises mais pas les
   entites, et l'affichage echappait une seconde fois - d'ou le « &amp; »
   visible a l'ecran.

Le template extrait donc la seule inspiration, decode une fois, echappe une
fois. Le motif rend le sujet inchange quand il ne correspond pas, ce qui
distingue un parfum d'un oud vendu au gramme : pour celui-la, la ligne ne
s'affiche plus du tout au lieu d'annoncer « Inspire de Oud naturel vendu au
gramme ».
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "inspiration: the label is not written twice" in s:
    sys.exit("already patched")

anchor = '    must(n == 1, "vol-cards: the cart button starts on the default combination")\n'
if s.count(anchor) != 1:
    sys.exit("anchor found %dx" % s.count(anchor))

block = r'''
    # ── 3b-quinquies. « Inspire de », une seule fois et sans entite ─────
    EXTRAIT = """    {* description_short vaut « Inspiré de X. Extrait de parfum… » et le
       libellé est déjà dans la page : seul X doit s'afficher. C'est un champ
       HTML, où PrestaShop stocke « Dolce &amp; Gabbana » ; strip_tags retire
       les balises mais pas les entités, donc on décode une fois avant de
       rééchapper une fois. regex_replace rend le sujet inchangé quand il ne
       correspond pas : un oud vendu au gramme n'affiche plus la ligne. *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\\s+(.+?)\\.\\s.*$/su':'$1'}
"""

    OLD_INS = """    <div class="ins-line">
      <span style="font-family:var(--alt);font-size:10px;font-style:italic;color:var(--mid)">Inspiré de</span>
      <span style="font-size:12px;font-weight:700">{$product.description_short|strip_tags|truncate:60}</span>
    </div>
"""
    NEW_INS = EXTRAIT + """    {if $odysInsp != $odysDesc}
    <div class="ins-line">
      <span style="font-family:var(--alt);font-size:10px;font-style:italic;color:var(--mid)">Inspiré de</span>
      <span style="font-size:12px;font-weight:700">{$odysInsp|escape:'html':'UTF-8'}</span>
    </div>
    {/if}
"""
    pt, n = pt.replace(OLD_INS, NEW_INS), pt.count(OLD_INS)
    must(n == 1, "inspiration: the label is not written twice on the product page")
    prod_tpl.write_text(pt, encoding="utf-8")

    mini = THEME / "templates" / "catalog" / "_partials" / "miniatures" / "product.tpl"
    mt = mini.read_text(encoding="utf-8")
    OLD_PILL = """    {if $product.description_short}
      <div class="pc-pill">
        <span class="pp-by">Inspiré de</span>
        <span class="pp-b">{$product.description_short|strip_tags|truncate:46:'…'}</span>
      </div>
    {/if}
"""
    NEW_PILL = """    {* même extraction que sur la fiche : le libellé est dans la pastille,
       description_short le répétait, et son « &amp; » ressortait tel quel *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\\s+(.+?)\\.\\s.*$/su':'$1'}
    {if $odysInsp != $odysDesc}
      <div class="pc-pill">
        <span class="pp-by">Inspiré de</span>
        <span class="pp-b">{$odysInsp|truncate:46:'…'|escape:'html':'UTF-8'}</span>
      </div>
    {/if}
"""
    mt, n = mt.replace(OLD_PILL, NEW_PILL), mt.count(OLD_PILL)
    must(n == 1, "inspiration: the listing card states it once")
    mini.write_text(mt, encoding="utf-8")
'''

s = s.replace(anchor, anchor + block, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: the inspiration line is written once, unescaped once")
