{*
 * ODYS Parfums — Product miniature v5.0
 * Editorial card: cream ground, gold reference, serif name, hairline rules.
 * Used by the home grid, category listings, search and carousels.
 *}
{* The family drives the collection filters. PrestaShop has no
   extra_attributes.famille_olfactive out of the box, so read the
   "Famille olfactive" feature that import_catalogue.php sets. *}
{assign var='odysFam' value=$product.extra_attributes.famille_olfactive|default:''}
{if !$odysFam && isset($product.features)}
  {foreach from=$product.features item=odysFeature}
    {if $odysFeature.name == 'Famille olfactive'}{assign var='odysFam' value=$odysFeature.value|lower}{/if}
  {/foreach}
{/if}
{* L'onglet d'ou vient la carte sur l'accueil (parfums, oud, diffuseurs).
   Ailleurs il n'est pas pose : l'attribut reste vide et ne filtre rien. *}
{* Pas de famille inventee. « fresh » etait servi par defaut a tout ce qui
   n'en declare pas : tant que la grille ne se filtrait pas, personne ne le
   voyait. Depuis que l'accueil a des onglets, la pastille « Frais » sortait
   neuf boukhours et trois diffuseurs, qui n'ont pas de famille olfactive du
   tout. Vide, la carte se montre sous « Tout » et sous aucune famille. *}
<article class="pc" data-fam="{$odysFam|escape:'html':'UTF-8'}"
         {if isset($odysOnglet) && $odysOnglet}data-onglet="{$odysOnglet|escape:'html':'UTF-8'}"{/if}
         itemscope itemtype="https://schema.org/Product">
  <meta itemprop="name" content="{$product.name|escape:'html':'UTF-8'}"/>

  <div class="pc-img">
    {* Une seule pastille, et la même règle que sur la fiche produit : la
       remise réellement posée passe avant tout le reste. Les deux
       s'affichaient ensemble et se chevauchaient, et aucune ne disait la
       seule chose qui intéresse un acheteur qui parcourt la collection.
       « on_sale » est une case à cocher du Back Office qui n'engage aucun
       prix : elle reste en dernier, et ne parle pas d'offre. *}
    {if $product.has_discount}
      <span class="pcb pcb-promo">{if $product.discount_percentage}{$product.discount_percentage|escape:'html':'UTF-8'}{else}Offre{/if}</span>
    {elseif $product.new}
      <span class="pcb pcb-new">Nouveau</span>
    {elseif $product.on_sale}
      <span class="pcb pcb-sale">Édition</span>
    {/if}

    <button class="pc-wish" type="button" data-action="toggle-wish"
            data-id="{$product.id_product}"
            aria-label="Ajouter {$product.name|escape:'html':'UTF-8'} à ma liste de souhaits">♡</button>

    <a href="{$product.url}" aria-label="Voir {$product.name|escape:'html':'UTF-8'}">
      <img src="{if $product.cover}{$product.cover.bySize.home_default.url}{else}{$urls.no_picture_image.bySize.home_default.url}{/if}"
           loading="lazy" decoding="async" width="400" height="400"
           alt="ODYS {$product.reference|escape:'html':'UTF-8'} {$product.name|escape:'html':'UTF-8'} — ODYS Parfums, Maroc"
           itemprop="image"/>
    </a>
  </div>

  <div class="pc-body">
    <p class="pc-code">ODYS {$product.reference|escape:'html':'UTF-8'}</p>
    <h3 class="pc-name"><a href="{$product.url}">{$product.name|escape:'html':'UTF-8'}</a></h3>

    {* même extraction que sur la fiche : le libellé est dans la pastille,
       description_short le répétait, et son « &amp; » ressortait tel quel *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\s+(.+?)\.\s.*$/su':'$1'}
    {if $odysInsp != $odysDesc}
      <div class="pc-pill">
        <span class="pp-by">Inspiré de</span>
        <span class="pp-b">{$odysInsp|truncate:46:'…'|escape:'html':'UTF-8'}</span>
      </div>
    {else}
      {* Un coffret n'est inspire de rien : la pastille restait vide et la
         carte ne disait pas ce qu'il y a dedans. « Duo Classique — 129 DH »
         sous la photo d'un seul flacon se lisait comme un flacon a 129 DH.
         La contenance occupe la place laissee libre, et elle vient de la
         caracteristique du produit, pas d'un texte ecrit ici. *}
      {assign var='odysCont' value=''}
      {if isset($product.features)}
        {foreach from=$product.features item=odysFtC}
          {if $odysFtC.name == 'Contenance'}{assign var='odysCont' value=$odysFtC.value}{/if}
        {/foreach}
      {/if}
      {if $odysCont}
        <div class="pc-pill pc-pill-cont">
          <span class="pp-b">{$odysCont|escape:'html':'UTF-8'}</span>
        </div>
      {/if}
    {/if}

    <div class="pc-prow" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <span class="pc-price" itemprop="price" content="{$product.price_amount}">{$product.price|intval} DH{if isset($product.unity) && $product.unity}<span class="pc-unit">&#8239;/&#8239;{$product.unity|escape:'html':'UTF-8'}</span>{/if}</span>
      <meta itemprop="priceCurrency" content="MAD"/>
      {if $product.regular_price_amount > $product.price_amount}
        <span class="pc-old">{$product.regular_price|intval} DH</span>
      {/if}
    </div>

    {* Aucune carte ne regardait le stock : un parfum epuise affichait
       « Ajouter au panier » sur l'accueil comme en collection. Meme regle
       que la fiche produit — le reglage global de la boutique. *}
    {assign var='odysCarteRupture' value=(Configuration::get('PS_STOCK_MANAGEMENT') && !Configuration::get('PS_ORDER_OUT_OF_STOCK'))}
    {assign var='odysCarteAchetable' value=(!isset($product.quantity) || $product.quantity > 0 || !$odysCarteRupture)}

    {if !$odysCarteAchetable}
      {* Epuise : la carte le dit au lieu de proposer un bouton dont le
         clic sera refuse. Elle mene a la fiche, ou le client trouve la
         date de retour et de quoi nous ecrire. *}
      <a class="pc-add pc-add-oos" href="{$product.url}">Épuisé &mdash; voir la fiche</a>
    {elseif isset($product.unity) && $product.unity}
      {* Sold by weight: the grammage is chosen on the product page, and
         the shop refuses anything under the 5 g minimum anyway. *}
      <a class="pc-add" href="{$product.url}">Choisir le grammage</a>
    {else}
    <button class="pc-add" type="button" data-action="add-to-cart"
            data-id-product="{$product.id_product}"
            data-id-product-attribute="{$product.id_product_attribute|default:0}"
            data-name="{$product.name|escape:'html':'UTF-8'}"
            data-price="{$product.price_amount|intval}">
      Ajouter au panier
    </button>
    {/if}
  </div>
</article>
