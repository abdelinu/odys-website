"""La ligne de format d'un produit decline suit la declinaison par defaut.

Le patch precedent faisait suivre $odysShort - le prix vif, le libelle du
bouton - mais laissait $odysFormat, la ligne sous le titre, lire la
caracteristique « Contenance » de la fiche. Un diffuseur decline en 50 / 100 /
150 ml annoncait donc « Diffuseur d'ambiance - 100 ml » juste au-dessus de
trois cartes, dont deux contredisaient la phrase.

La caracteristique garde ce qu'elle dit de nature - « Diffuseur d'ambiance »,
« Extrait de Parfum » - et c'est la declinaison qui donne la contenance.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "vol-cards: the format line follows the default combination" in s:
    sys.exit("already patched")

anchor = '    must(n == 1, "vol-cards: a declined product states its default format")\n'
if s.count(anchor) != 1:
    sys.exit("anchor found %dx" % s.count(anchor))

block = r'''
    # $odysFormat restait la caracteristique de la fiche : un diffuseur
    # decline en trois volumes annoncait « Diffuseur d'ambiance - 100 ml »
    # au-dessus de cartes qui en proposaient deux autres. La caracteristique
    # garde la nature du produit, la declinaison donne la contenance.
    OLD_SHORT = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
    {/if}
"""
    NEW_SHORT = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
      {* ce qui precede le point median dit la nature - « Diffuseur
         d'ambiance », « Extrait de Parfum » - et se garde ; ce qui suit etait
         la contenance, que la declinaison remplace. *}
      {assign var='odysNature' value=$odysFormat|regex_replace:'/\\s*\\xc2\\xb7.*$/':''}
      {assign var='odysFormat' value=$odysNature|cat:' &middot; '|cat:$odysShort}
    {/if}
"""
    pt, n = pt.replace(OLD_SHORT, NEW_SHORT), pt.count(OLD_SHORT)
    must(n == 1, "vol-cards: the format line follows the default combination")
'''

s = s.replace(anchor, anchor + block, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: the format line follows the default combination")
