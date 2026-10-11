"""Le selecteur de format lit les vraies declinaisons PrestaShop.

Le template interrogeait $product.combinations[].attributes.volume, une forme
heritee du prototype : dans PrestaShop 8 cette cle existe mais reste toujours
vide, donc la branche n'a jamais rendu une seule carte. Un produit decline en
50 / 100 / 150 ml affichait un unique format, celui de sa caracteristique
« Contenance », et le bouton d'ajout postait id_product_attribute=0.

Les declinaisons arrivent dans $combinations, une variable de premier niveau
posee par ProductController, indexee par id_product_attribute. Son .price est
l'ecart au prix de base hors taxe, pas le prix affiche.

Ce patch reecrit la branche contre cette structure et fait suivre le format
choisi jusqu'au bouton d'ajout. Les volumes et leurs prix restent entierement
dans le Back Office : fiche produit -> Declinaisons.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "vol-cards: real PrestaShop combinations" in s:
    sys.exit("already patched")

# -- 1. le template -----------------------------------------------------
tpl_anchor = (
    '    must("$odysShort" in pt, "product page: the format comes from the product")\n'
    '    ok("product page: one format card, priced from the product itself")\n'
)
if s.count(tpl_anchor) != 1:
    sys.exit("tpl anchor found %dx" % s.count(tpl_anchor))

tpl_block = r'''
    # -- 3b-ter. les formats vendables ---------------------------------
    # $product.combinations est une relique du prototype : la cle existe
    # dans PrestaShop 8 mais reste vide, donc la branche ne rendait jamais
    # rien. Les declinaisons sont dans $combinations, posee par
    # ProductController, indexee par id_product_attribute.
    OLD_COMBOS = """        {if $product.combinations}
          {foreach from=$product.combinations item=combo}
            <button class="vc {if $combo@first}on{/if}"
                    role="radio"
                    aria-checked="{if $combo@first}true{else}false{/if}"
                    data-vol="{$combo.attributes.volume|default:'50'|replace:'ml':''}"
                    data-price="{$combo.price_amount|intval}"
                    data-id-combination="{$combo.id_combination}"
                    data-action="pick-vol">
              {if $combo@first}<div class="vc-badge" aria-hidden="true">⭐ Populaire</div>{/if}
              <div class="vc-ml">{$combo.attributes.volume|default:'50ml'|replace:'ml':''}<span>ml</span></div>
              <div class="vc-price">{$combo.price|intval} DH</div>
            </button>
          {/foreach}
        {else}
"""
    NEW_COMBOS = """        {* Les formats vendables du produit. PrestaShop appelle cela des
           declinaisons : une par volume, chacune avec son prix et son
           stock, et c'est la fiche produit -> Declinaisons qui decide
           lesquelles existent. Aucun volume ni aucun prix n'est ecrit ici.

           $combinations[].price est l'ecart au prix de base, hors taxe, et
           non le prix affiche. Le prix d'une carte est donc celui du
           produit tel qu'il est presente, corrige de la difference entre
           son ecart et celui de la declinaison par defaut. *}
        {if $combinations}
          {assign var='odysTaxF' value=1}
          {if isset($product.price_tax_exc) && $product.price_tax_exc > 0}
            {assign var='odysTaxF' value=$product.price_amount / $product.price_tax_exc}
          {/if}
          {assign var='odysEcartDef' value=0}
          {if isset($combinations[$product.id_product_attribute])}
            {assign var='odysEcartDef' value=$combinations[$product.id_product_attribute].price}
          {/if}
          {* Un format epuise reste visible mais ne s'achete pas : le masquer
             ferait croire qu'il n'existe pas. On lit le reglage global ; un
             produit qui autorise lui-meme la commande en rupture sera
             signale a tort, ce qui est le sens prudent. *}
          {assign var='odysBloqueRupture' value=(Configuration::get('PS_STOCK_MANAGEMENT') && !Configuration::get('PS_ORDER_OUT_OF_STOCK'))}
          {foreach from=$combinations key=odysIdPa item=odysCombo}
            {* Le libelle est celui de l'attribut, affiche tel quel :
               « 100 ml », « 5 g » ou « Coffret 3 x 50 ml » conviennent
               aussi bien. *}
            {assign var='odysVol' value=''}
            {foreach from=$odysCombo.attributes_values item=odysVal}{assign var='odysVol' value=$odysVal}{/foreach}
            {assign var='odysPrix' value=$product.price_amount + ($odysCombo.price - $odysEcartDef) * $odysTaxF}
            {assign var='odysDefaut' value=($odysIdPa == $product.id_product_attribute)}
            {assign var='odysDispo' value=($odysCombo.quantity > 0 || !$odysBloqueRupture)}
            <button class="vc{if $odysDefaut} on{/if}{if !$odysDispo} vc-off{/if}"
                    type="button" role="radio"
                    aria-checked="{if $odysDefaut}true{else}false{/if}"
                    {if !$odysDispo}disabled aria-disabled="true"{/if}
                    data-vol="{$odysVol|escape:'html':'UTF-8'}"
                    data-price="{$odysPrix|intval}"
                    data-id-product-attribute="{$odysIdPa|intval}"
                    data-action="pick-vol">
              <div class="vc-ml">{$odysVol|escape:'html':'UTF-8'}</div>
              <div class="vc-price">{$odysPrix|intval} DH</div>
              {if !$odysDispo}<div class="vc-oos">Épuisé</div>{/if}
            </button>
          {/foreach}
        {else}
"""
    pt, n = pt.replace(OLD_COMBOS, NEW_COMBOS), pt.count(OLD_COMBOS)
    must(n == 1, "vol-cards: real PrestaShop combinations, priced per format")

    # le libelle du selecteur
    OLD_LBL = "{if $product.combinations}Choisissez votre format{else}Format{/if}"
    NEW_LBL = "{if $combinations}Choisissez votre format{else}Format{/if}"
    pt, n = pt.replace(OLD_LBL, NEW_LBL), pt.count(OLD_LBL)
    must(n == 1, "vol-cards: the label follows the real combinations")

    # Un produit decline annonce le format que le client a devant lui - celui
    # de la declinaison par defaut, qui est aussi celle mise au panier tant
    # qu'il n'a rien choisi - et non la ligne « Contenance » de sa fiche.
    SHORT_ANCHOR = """    <div class="p-format">{$odysFormat nofilter}</div>"""
    SHORT_BLOCK = """    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
    {/if}
""" + SHORT_ANCHOR
    pt, n = pt.replace(SHORT_ANCHOR, SHORT_BLOCK), pt.count(SHORT_ANCHOR)
    must(n == 1, "vol-cards: a declined product states its default format")

    # Le bouton d'ajout partait sur la cle morte, donc toujours a 0 : la
    # declinaison par defaut est ce que PrestaShop attend quand rien n'est
    # choisi, et pickVol remplace la valeur des qu'une carte est cliquee.
    OLD_BTN = 'data-id-product-attribute="{$product.combinations[0].id_combination|default:0}"'
    NEW_BTN = 'data-id-product-attribute="{$product.id_product_attribute|intval}"'
    pt, n = pt.replace(OLD_BTN, NEW_BTN), pt.count(OLD_BTN)
    must(n == 1, "vol-cards: the cart button starts on the default combination")

    prod_tpl.write_text(pt, encoding="utf-8")
'''

s = s.replace(tpl_anchor, tpl_anchor + tpl_block, 1)

# -- 2. app.js ----------------------------------------------------------
js_anchor = 'js_path.write_text(js, encoding="utf-8")\n'
if s.count(js_anchor) != 1:
    sys.exit("js anchor found %dx" % s.count(js_anchor))

js_block = r'''
# pickVol tenait le volume pour un nombre - parseInt('Coffret 3 x 50 ml') vaut
# 3 - et ne disait rien au bouton d'ajout, qui postait donc toujours la
# declinaison par defaut quel que soit le format clique.
OLD_PICKVOL = """  const vol   = parseInt(btn.dataset.vol);
  const price = parseInt(btn.dataset.price);"""
NEW_PICKVOL = """  if (btn.disabled) { return; }
  // le libelle vient de l'attribut et s'affiche tel quel
  const vol   = btn.dataset.vol || '';
  const price = parseInt(btn.dataset.price, 10) || 0;
  // ce que le panier recevra : la declinaison que porte la carte choisie
  const addB  = document.getElementById('addBtn');
  if (addB && btn.dataset.idProductAttribute) {
    addB.dataset.idProductAttribute = btn.dataset.idProductAttribute;
  }"""
js, n = js.replace(OLD_PICKVOL, NEW_PICKVOL), js.count(OLD_PICKVOL)
must(n == 1, "pickVol: the chosen format is what goes in the cart")

for _old, _new, _what in (
    ("  selVol   = vol;",
     "  selVol   = parseInt(vol, 10) || selVol;",
     "pickVol: selVol stays a number"),
    ("  if (lv) lv.textContent = '· Format ' + vol + 'ml';",
     "  if (lv) lv.textContent = '· ' + vol;",
     "pickVol: the live line prints the format's own label"),
    ("    if (lbl) lbl.textContent = 'Ajouter au Panier · ' + vol + 'ml';",
     "    if (lbl) lbl.textContent = 'Ajouter au Panier · ' + vol;",
     "pickVol: the cart button prints the format's own label"),
    ("""  document.querySelectorAll('.vc').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');""",
     """  document.querySelectorAll('.vc').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-checked', 'false');
  });
  btn.classList.add('on');
  btn.setAttribute('aria-checked', 'true');""",
     "pickVol: aria-checked follows the selection"),
):
    js, n = js.replace(_old, _new), js.count(_old)
    must(n == 1, _what)
'''

s = s.replace(js_anchor, js_block + "\n" + js_anchor, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: vol-cards read real combinations")
