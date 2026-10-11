"""La pyramide rassemble les notes d'un etage avant de les afficher.

Chaque note est desormais une valeur de caracteristique a part - une ligne
modifiable seule en Back Office, une entree propre dans la liste deroulante,
un mot entier pour la recherche. $product.features livre donc plusieurs
entrees portant le meme nom, et le template, qui rendait un bloc par entree,
affichait « Tete » trois fois de suite avec une pastille chacun.

Il collecte maintenant les notes de chaque etage en une liste avant de rendre
le bloc, une seule fois. Le decoupage sur la virgule est conserve a
l'interieur de chaque valeur : une boutique qui retape « Neroli, Citron » a la
main dans un seul champ obtient toujours deux pastilles.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "pyramid: one tier block per tier" in s:
    sys.exit("already patched")

anchor = '    must(n == 1, "vol-cards: the cart button starts on the default combination")\n'
if s.count(anchor) != 1:
    sys.exit("anchor found %dx" % s.count(anchor))

block = r'''
    # ── 3b-quater. une note par valeur ─────────────────────────────────
    # Les notes sont desormais des valeurs de caracteristique distinctes :
    # $product.features porte plusieurs entrees du meme nom, et le template
    # rendait un bloc d'etage par entree. On rassemble d'abord, on rend
    # ensuite.
    import re as _re

    # 1. le detecteur de pyramide et les trois blocs d'etage sont remplaces
    #    par une collecte unique suivie de trois rendus.
    _debut = pt.index("    {assign var='odysFeatTete' value=Configuration::get('ODYS_FEAT_TETE')}")
    _fin = pt.index("    {/if}", pt.index('<div class="olf-pyr"')) + len("    {/if}\n")
    ancien = pt[_debut:_fin]
    must('olf-tier olf-base' in ancien, "pyramid: the three tiers were found")

    # les trois icones restent celles du theme : on les relit dans l'ancien
    # bloc plutot que d'en inventer
    icones = _re.findall(r'<div class="ol-icon" aria-hidden="true">(<svg.*?</svg>)</div>', ancien, _re.S)
    must(len(icones) == 3, f"pyramid: three tier icons recovered ({len(icones)})")

    etages = (
        ("odysTete", "olf-top", "Notes de tête", "Tête", "tête", icones[0]),
        ("odysCoeur", "olf-heart", "Notes de cœur", "Cœur", "cœur", icones[1]),
        ("odysFond", "olf-base", "Notes de fond", "Fond", "fond", icones[2]),
    )

    collecte = """    {* La pyramide. Chaque note est une valeur de caracteristique a part,
       donc $product.features porte plusieurs entrees du meme nom : on les
       rassemble par etage avant d'afficher quoi que ce soit, sinon le bloc
       « Tete » se repete autant de fois qu'il y a de notes.

       Le decoupage sur la virgule reste, a l'interieur de chaque valeur :
       une boutique qui retape « Neroli, Citron » dans un seul champ obtient
       toujours deux pastilles. *}
    {assign var='odysFeatTete' value=Configuration::get('ODYS_FEAT_TETE')}
    {assign var='odysFeatCoeur' value=Configuration::get('ODYS_FEAT_COEUR')}
    {assign var='odysFeatFond' value=Configuration::get('ODYS_FEAT_FOND')}
    {assign var='odysTete' value=[]}
    {assign var='odysCoeur' value=[]}
    {assign var='odysFond' value=[]}
    {if isset($product.features)}
      {foreach from=$product.features item=odysFeat}
        {assign var='odysEtage' value=''}
        {if $odysFeat.name == 'Notes de tête' || ($odysFeatTete && $odysFeat.id_feature == $odysFeatTete)}
          {assign var='odysEtage' value='odysTete'}
        {elseif $odysFeat.name == 'Notes de cœur' || ($odysFeatCoeur && $odysFeat.id_feature == $odysFeatCoeur)}
          {assign var='odysEtage' value='odysCoeur'}
        {elseif $odysFeat.name == 'Notes de fond' || ($odysFeatFond && $odysFeat.id_feature == $odysFeatFond)}
          {assign var='odysEtage' value='odysFond'}
        {/if}
        {if $odysEtage}
          {foreach from=','|explode:$odysFeat.value item=odysNote}
            {assign var='odysNote' value=$odysNote|trim}
            {if $odysNote}{append var=$odysEtage value=$odysNote}{/if}
          {/foreach}
        {/if}
      {/foreach}
    {/if}
    {if $odysTete || $odysCoeur || $odysFond}
    <div class="olf-pyr" role="region" aria-label="Pyramide olfactive">
      <div class="olf-hd" id="olf-hd-label">Pyramide Olfactive</div>
"""

    for _var, _classe, _aria, _nom, _type, _svg in etages:
        collecte += """      {if $%s}
        <div class="olf-tier %s" role="group" aria-label="%s">
          <div class="olf-lbl"><div class="ol-icon" aria-hidden="true">%s</div><div class="ol-name">%s</div></div>
          <div class="olf-notes">{foreach from=$%s item=odysNote}
            <a class="note" href="{$urls.pages.search}?s={$odysNote|escape:'url'}"
                  data-note="{$odysNote|escape:'html':'UTF-8'}" data-type="%s"
                  aria-label="Voir les parfums avec la note {$odysNote|escape:'html':'UTF-8'}">{$odysNote|escape:'html':'UTF-8'}</a>
          {/foreach}</div>
        </div>
      {/if}
""" % (_var, _classe, _aria, _svg, _nom, _var, _type)

    collecte += "    </div>\n    {/if}\n"

    pt = pt[:_debut] + collecte + pt[_fin:]
    must(pt.count('<div class="olf-pyr"') == 1, "pyramid: one tier block per tier")
    must(pt.count("{append var=$odysEtage") == 1, "pyramid: notes gathered before rendering")
    prod_tpl.write_text(pt, encoding="utf-8")
'''

s = s.replace(anchor, anchor + block, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: the pyramid gathers notes per tier")
