{extends file='layouts/layout-full-width.tpl'}
{* A result shows roughly 60 characters; past that the title is cut mid-word
   and the shop's name — the part a returning customer recognises — is the bit
   that disappears. Name, format and brand fit; the "inspiré de" line is the
   meta description's job, where there is room for it. *}
{* $odysShort is worked out in the content block, which renders after this
   one, so the format is read here from the product's own Contenance. It is
   appended only when the name leaves room: "Diffuseur à roseaux — Nuit
   d'Ambre" already says what it is, and a title cut mid-word loses the shop's
   name, which is the part a returning customer recognises. *}
{block name='head_title'}{strip}
  {assign var='odysFmt' value=''}
  {foreach from=$product.features item=odysF}{if $odysF.name == 'Contenance'}{assign var='odysFmt' value=$odysF.value}{/if}{/foreach}
  {if !$odysFmt}{if isset($product.unity) && $product.unity}{assign var='odysFmt' value='Oud naturel au gramme'}{else}{assign var='odysFmt' value='Extrait de Parfum 50 ml'}{/if}{/if}
  {$product.name|escape:'html':'UTF-8'}{if ($product.name|strlen) < 24} — {$odysFmt}{/if} | ODYS Parfums Maroc
{/strip}{/block}
{block name='head_schema'}
{* The JSON braces must stay out of Smarty's parser and the values must stay
   in it. Wrapping the whole object in {literal} did the first and broke the
   second: the page shipped "{$product.name}" to Google verbatim, so each
   interpolation breaks out of the literal and back in. *}
{* La description structuree du produit, seule et complete.

   Elle etait doublee par des microdonnees eparpillees dans le HTML, qui
   annoncaient le prix tel qu'il s'affiche — « 69 DH » — la ou schema.org
   attend un nombre, et dont le itemscope ne contenait pas la photo. Google
   repondait « Invalid floating point number » et « Missing field image ».
   Les microdonnees sont parties ; il ne reste que ce bloc.

   Construit comme un tableau puis encode : plus de concatenation a la main
   entre des {literal}, donc plus de guillemet ni d'accent a echapper. *}
{assign var='odysLdDesc' value=$product.description_short|strip_tags|unescape:'html'|regex_replace:'/\s+/u':' '|trim}
{assign var='odysLdImgs' value=[]}
{if $product.cover}{append var='odysLdImgs' value=$product.cover.bySize.large_default.url}{/if}
{foreach from=$product.images item=odysLdImg}
  {if !($odysLdImg.bySize.large_default.url|in_array:$odysLdImgs)}
    {append var='odysLdImgs' value=$odysLdImg.bySize.large_default.url}
  {/if}
{/foreach}
{* Smarty n'accepte pas un ternaire coupe par un retour a la ligne dans un
   tableau : on le resout avant. *}
{assign var='odysLdDispo' value='https://schema.org/OutOfStock'}
{if $product.quantity > 0}{assign var='odysLdDispo' value='https://schema.org/InStock'}{/if}
{assign var='odysLd' value=[
  '@context' => 'https://schema.org',
  '@type' => 'Product',
  'name' => $product.name|unescape:'html',
  'sku' => $product.reference|unescape:'html',
  'description' => $odysLdDesc,
  'image' => $odysLdImgs,
  'brand' => ['@type' => 'Brand', 'name' => 'ODYS Parfums'],
  'offers' => [
    '@type' => 'Offer',
    'url' => $product.url,
    'priceCurrency' => 'MAD',
    'price' => $product.price_amount|string_format:'%.2f',
    'itemCondition' => 'https://schema.org/NewCondition',
    'availability' => $odysLdDispo,
    'seller' => ['@type' => 'Organization', 'name' => 'ODYS Parfums']
  ]
]}
{* Une note ne s'affiche que si des clients l'ont donnee. *}
{if isset($product.nb_comments) && $product.nb_comments > 0}
  {assign var='odysLd' value=$odysLd|@array_merge:['aggregateRating' => [
    '@type' => 'AggregateRating',
    'ratingValue' => $product.rating|default:5,
    'reviewCount' => $product.nb_comments|intval
  ]]}
{/if}
<script type="application/ld+json">{$odysLd|@json_encode:320 nofilter}</script>
{/block}
{block name='content'}

{* Breadcrumb — EAA: nav + aria-label *}
<nav aria-label="Fil d'Ariane">
  <ol class="bc" style="display:flex;align-items:center;gap:0;list-style:none;padding:0">
    <li><a href="{$urls.base_url}">Accueil</a></li>
    <li aria-hidden="true" class="sep">›</li>
    {* $product.category_url is an array on PS 8, so printing it put the word
       "Array" in the href and a PHP warning in the middle of the breadcrumb.
       The category's own link is built from its id. *}
    {assign var='odysCatUrl' value=''}
    {if isset($product.id_category_default) && $product.id_category_default}
      {assign var='odysCatUrl' value=$link->getCategoryLink($product.id_category_default)}
    {/if}
    <li>{if $odysCatUrl}<a href="{$odysCatUrl}">{$product.category_name|default:'Parfums'}</a>
      {else}<span>{$product.category_name|default:'Parfums'}</span>{/if}</li>
    <li aria-hidden="true" class="sep">›</li>
    <li aria-current="page"><b>{$product.name|escape:'html':'UTF-8'}</b></li>
  </ol>
</nav>

{* the ingredient's own photograph, behind the page and out of the way of
   a screen reader; it only appears once a file exists for that ambiance *}
{if $odysAmbiance}<div class="amb-hero" aria-hidden="true"></div>{/if}
<div class="prod-wrap">

  {* ── GALLERY ── *}
  <div class="gal" role="region" aria-label="Galerie photos du produit">
    <div class="gal-main">
      {* Ce coin répétait « Élaboré au Maroc », déjà écrit deux fois plus bas
         (sous le nom, et dans les garanties). Il est réservé aux offres.
         Rien n'est inventé ici : la pastille ne paraît que si la boutique a
         réellement posé un prix spécial ou marqué le produit comme nouveau. *}
      {if $product.has_discount}
        <span class="p-flag p-flag-promo">{if $product.discount_percentage}{$product.discount_percentage|escape:'html':'UTF-8'}{else}Offre{/if}</span>
      {elseif isset($product.flags.new)}
        <span class="p-flag p-flag-new">{$product.flags.new.label|escape:'html':'UTF-8'}</span>
      {/if}
      <button type="button" class="gal-zoom" data-action="zoom-open"
              aria-label="Agrandir la photo de {$product.name|escape:'html':'UTF-8'}">
      <img id="galMain"
           {* a product with no photo has cover = false, and reading .bySize
              off it prints a PHP warning into this very src *}
           src="{if $product.cover}{$product.cover.bySize.large_default.url}{else}{$urls.no_picture_image.bySize.large_default.url}{/if}"
           loading="eager"
           fetchpriority="high"
           alt="{$product.name|escape:'html':'UTF-8'} — ODYS Parfums Maroc, flacon 50ml"
           width="800" height="800"/>
      </button>
    </div>
    <ul class="thumbs" id="galThumbs" role="list" aria-label="Vignettes de la galerie">
      {foreach from=$product.images item=image}
        <li class="{if $image@first}on{/if}" role="listitem">
          <button class="thumb-btn"
                  data-action="switch-thumb"
                  data-src="{$image.bySize.large_default.url}"
                  aria-label="Voir la photo {$image@iteration}"
                  aria-pressed="{if $image@first}true{else}false{/if}">
            <img src="{$image.bySize.small_default.url}"
                 loading="lazy"
                 alt="{$image.legend|default:$product.name|escape:'html':'UTF-8'}"
                 width="98" height="98"/>
          </button>
        </li>
      {/foreach}
    </ul>
  </div>

  {* ── INFO PANEL ── *}
  <div class="info">

    <div class="p-code">Collection Inspiration · ODYS {$product.reference}</div>
    <h1 class="p-name">{$product.name|escape:'html':'UTF-8'}</h1>
    {* What this product is, resolved once so the heading, the live price line
       and the cart button cannot disagree. A product carrying a "Contenance"
       feature states its own format; oud is sold by the gram; everything else
       is the 50 ml extrait. *}
    {assign var='odysFormat' value=''}
    {assign var='odysShort' value=''}
    {foreach from=$product.features item=odysFeat}
      {if $odysFeat.name == 'Contenance'}{assign var='odysFormat' value=$odysFeat.value}{/if}
    {/foreach}
    {if $odysFormat}
      {assign var='odysShort' value=$odysFormat|regex_replace:'/^.*\xc2\xb7\s*/':''}
    {elseif isset($product.unity) && $product.unity}
      {assign var='odysFormat' value='Extrait concentré &middot; vendu au gramme'}
      {assign var='odysShort' value='5 g'}
    {else}
      {assign var='odysFormat' value='Extrait de Parfum &middot; 50 ml'}
      {assign var='odysShort' value='50 ml'}
    {/if}

    {if $combinations && isset($combinations[$product.id_product_attribute])}
      {foreach from=$combinations[$product.id_product_attribute].attributes_values item=odysVal}
        {assign var='odysShort' value=$odysVal}
      {/foreach}
      {* ce qui precede le point median dit la nature - « Diffuseur
         d'ambiance », « Extrait de Parfum » - et se garde ; ce qui suit etait
         la contenance, que la declinaison remplace. *}
      {assign var='odysNature' value=$odysFormat|regex_replace:'/\s*\xc2\xb7.*$/':''}
      {assign var='odysFormat' value=$odysNature|cat:' &middot; '|cat:$odysShort}
    {/if}
    <div class="p-format">{$odysFormat nofilter}</div>
    {* description_short vaut « Inspiré de X. Extrait de parfum… » et le
       libellé est déjà dans la page : seul X doit s'afficher. C'est un champ
       HTML, où PrestaShop stocke « Dolce &amp; Gabbana » ; strip_tags retire
       les balises mais pas les entités, donc on décode une fois avant de
       rééchapper une fois. regex_replace rend le sujet inchangé quand il ne
       correspond pas : un oud vendu au gramme n'affiche plus la ligne. *}
    {assign var='odysDesc' value=$product.description_short|strip_tags|unescape:'html'}
    {assign var='odysInsp' value=$odysDesc|regex_replace:'/^Inspiré de\s+(.+?)\.\s.*$/su':'$1'}
    {if $odysInsp != $odysDesc}
    <div class="ins-line">
      <span style="font-family:var(--alt);font-size:10px;font-style:italic;color:var(--mid)">Inspiré de</span>
      <span style="font-size:12px;font-weight:700">{$odysInsp|escape:'html':'UTF-8'}</span>
    </div>
    {/if}

    {* La note telle qu'elle s'affiche ; sa valeur structuree est dans le JSON-LD, une seule fois. *}
    {* A score the shop has not earned yet is a fake review signal,
       and Google reads this markup. Show it when reviews exist. *}
    {if isset($product.nb_comments) && $product.nb_comments > 0}
    <div class="rating">
      <span class="stars" aria-hidden="true">★★★★★</span>
      <span class="sr-only">Note : </span>
      <span style="font-size:12px;font-weight:700">4.9</span>
      <span class="sr-only"> sur 5 —</span>
      <span class="rat-t">· {$product.nb_comments|default:0} avis</span>
    </div>
    {/if}

    {if $product.quantity <= 10 && $product.quantity > 0}
    <div class="scarcity-alert" role="alert">
      <div class="sa-icon" aria-hidden="true">⚠</div>
      <div class="sa-txt">
        <strong>Stock limité · {$product.quantity} unités restantes</strong>
        <small>Commandez maintenant pour garantir votre livraison</small>
      </div>
    </div>
    {/if}

    {if isset($product.unity) && $product.unity}
    {* Sold by weight (Oud & Boukhour): the cards set the quantity in grams,
       and the shop's own minimum is 5 g. *}
    <div class="vol-sel" role="group" aria-labelledby="gram-sel-label">
      <div class="vol-lbl" id="gram-sel-label">Choisissez votre grammage</div>
      {* resolved once, so the markup and the script cannot disagree *}
      {assign var='odysGramMin' value=Configuration::get('ODYS_GRAM_MIN')|intval}
      {if !$odysGramMin}{assign var='odysGramMin' value=5}{/if}
      <div class="vol-cards" id="gramCards" role="radiogroup" aria-label="Grammage"
           data-min="{$odysGramMin}">
        {* the ladder and the minimum are set in Back Office → Apparence →
           Thème ODYS; the price per gram is the product's own price *}
        {assign var='odysSteps' value=Configuration::get('ODYS_GRAM_STEPS')}
        {if !$odysSteps}{assign var='odysSteps' value='5,10,25,50'}{/if}
        {foreach from=','|explode:$odysSteps item=odysStep name=grams}
        {assign var='gram' value=$odysStep|trim|intval}{if $gram > 0}
          <button class="vc{if $smarty.foreach.grams.first} on{/if}" type="button"
                  role="radio" aria-checked="{if $smarty.foreach.grams.first}true{else}false{/if}"
                  data-grams="{$gram}"
                  data-price="{($product.price_amount * $gram)|intval}"
                  data-action="pick-gram">
            <div class="vc-ml">{$gram}<span>g</span></div>
            <div class="vc-price">{($product.price_amount * $gram)|intval} DH</div>
          </button>
        {/if}{/foreach}
      </div>
      <p class="vol-note">{$product.price|intval} DH le gramme &middot; minimum {$odysGramMin} g</p>
    </div>
    {else}
    {* Volume selector — EAA: radiogroup.
       Sans déclinaison il n'y a rien à choisir : la carte unique affichait
       « 50 ml / 89 DH » juste au-dessus d'un bloc de prix qui redisait
       « 89 DH · 50 ml ». Le format reste annoncé sous le nom du produit. *}
    {if $combinations}
    <div class="vol-sel" role="group" aria-labelledby="vol-sel-label">
      <div class="vol-lbl" id="vol-sel-label">{if $combinations}Choisissez votre format{else}Format{/if}</div>
      <div class="vol-cards" id="volCards" role="radiogroup" aria-label="Format du parfum">
        {* Les formats vendables du produit. PrestaShop appelle cela des
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
          {* The prototype filled this with three invented sizes at invented
             prices whenever a product had no combinations, and the build had
             to patch them out afterwards. A product with a single format now
             states that format here, at its own price - which also lets a
             diffuser say its real contenance instead of the flacon's. *}
          <button class="vc on" type="button" role="radio" aria-checked="true"
                  data-vol="{$odysShort|regex_replace:'/[^0-9]/':''}"
                  data-price="{$product.price_amount|intval}" data-action="pick-vol">
            <div class="vc-ml">{$odysShort}</div>
            <div class="vc-price">{$product.price|intval} DH</div>
          </button>
        {/if}
      </div>
    </div>
    {/if}
    {/if}

    <div class="live-price-block">
      <span class="lp-price" id="livePrice" aria-live="polite" aria-atomic="true">{if isset($product.unity) && $product.unity}{($product.price_amount * 5)|intval}{else}{$product.price|intval}{/if} DH</span>
      {* le volume ne bouge que s'il y a un choix de format ; sinon il est
         déjà écrit sous le nom et le répéter ici ne dit rien de plus *}
      {if $combinations || (isset($product.unity) && $product.unity)}
      <span class="lp-vol"   id="liveVol"   aria-live="polite">· {$odysShort}</span>
      {/if}
      <span class="lp-free"  id="liveFree"  aria-live="polite"></span>
    </div>

    {* Le contenu d'un coffret.
       Ce theme ne reprenait pas le bloc « pack » de classic : un coffret
       montrait son prix et rien de ce qu'il y a dedans. « Duo Classique,
       129 DH » sous la photo d'un flacon, c'est tout ce que le client
       voyait.

       $packItems est rempli par PrestaShop quand le produit est declare
       comme pack en Back Office (fiche produit -> Declinaisons -> Pack).
       Tant qu'il ne l'est pas, le bloc n'existe pas : rien n'est invente
       ici, aucune liste n'est ecrite en dur, et un coffret mal renseigne
       ne promet pas un contenu qu'il n'a pas.

       Declarer le pack fait aussi tenir les stocks : PrestaShop decompte
       les flacons du coffret quand il se vend. *}
    {if isset($packItems) && $packItems}
      <section class="pk-box" aria-labelledby="pk-title">
        <h2 class="pk-hd" id="pk-title">Ce coffret contient</h2>
        <ul class="pk-list">
          {foreach from=$packItems item=odysPk}
            <li class="pk-item">
              <a href="{$odysPk.url}">
                <img class="pk-img" loading="lazy" decoding="async"
                     width="80" height="80"
                     src="{if $odysPk.cover}{$odysPk.cover.bySize.small_default.url}{else}{$urls.no_picture_image.bySize.small_default.url}{/if}"
                     alt="{$odysPk.name|escape:'html':'UTF-8'}"/>
                <span class="pk-txt">
                  <span class="pk-name">{$odysPk.name|escape:'html':'UTF-8'}</span>
                  {if isset($odysPk.pack_quantity) && $odysPk.pack_quantity > 1}
                    <span class="pk-qty">&times;&nbsp;{$odysPk.pack_quantity|intval}</span>
                  {/if}
                </span>
              </a>
            </li>
          {/foreach}
        </ul>
      </section>
    {/if}

    {* Olfactory pyramid — only when the product actually has one: oud has
       a family feature but no tiers, and the block rendered as a heading
       with nothing under it. *}
    {* La pyramide. Chaque note est une valeur de caracteristique a part,
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
    {* Ces notes sont celles de la fragrance d'inspiration, pas une analyse
       du jus ODYS. Les presenter comme « notre » pyramide contredisait la
       page A propos — « composition originale d'inspiration » — et la
       mention au bas de la description, qui le redit. Le titre le reconnait,
       en une ligne, sans dejuger le produit. *}
    <div class="olf-pyr" role="region" aria-label="Pyramide de l'inspiration">
      <div class="olf-hd" id="olf-hd-label">Pyramide de l'inspiration</div>
      <p class="olf-src">Les notes de la fragrance dont ce parfum s'inspire.
        La composition ODYS cherche a en retrouver l'accord.</p>
      {if $odysTete}
        <div class="olf-tier olf-top" role="group" aria-label="Notes de tête">
          <div class="olf-lbl"><div class="ol-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" aria-hidden="true" focusable="false"><path d="M3 8h9a3 3 0 1 0-3-3"/><path d="M3 13h13a3.2 3.2 0 1 1-3.2 3.2"/><path d="M3 18h6"/></svg></div><div class="ol-name">Tête</div></div>
          <div class="olf-notes">{foreach from=$odysTete item=odysNote}
            <a class="note" href="{$urls.pages.search}?s={$odysNote|escape:'url'}"
                  data-note="{$odysNote|escape:'html':'UTF-8'}" data-type="tête"
                  aria-label="Voir les parfums avec la note {$odysNote|escape:'html':'UTF-8'}">{$odysNote|escape:'html':'UTF-8'}</a>
          {/foreach}</div>
        </div>
      {/if}
      {if $odysCoeur}
        <div class="olf-tier olf-heart" role="group" aria-label="Notes de cœur">
          <div class="olf-lbl"><div class="ol-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="2.4"/><path d="M12 9.6c0-2.4 1-4.1 2.6-4.1S17 7 15.6 8.7"/><path d="M14.4 12c2.4 0 4.1 1 4.1 2.6S16.9 17 15.2 15.6"/><path d="M12 14.4c0 2.4-1 4.1-2.6 4.1S7 16.9 8.4 15.2"/><path d="M9.6 12c-2.4 0-4.1-1-4.1-2.6S7.1 7 8.8 8.4"/></svg></div><div class="ol-name">Cœur</div></div>
          <div class="olf-notes">{foreach from=$odysCoeur item=odysNote}
            <a class="note" href="{$urls.pages.search}?s={$odysNote|escape:'url'}"
                  data-note="{$odysNote|escape:'html':'UTF-8'}" data-type="cœur"
                  aria-label="Voir les parfums avec la note {$odysNote|escape:'html':'UTF-8'}">{$odysNote|escape:'html':'UTF-8'}</a>
          {/foreach}</div>
        </div>
      {/if}
      {if $odysFond}
        <div class="olf-tier olf-base" role="group" aria-label="Notes de fond">
          <div class="olf-lbl"><div class="ol-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 7.2 10h9.6L12 3Z"/><path d="M12 8.4 6 16.2h12L12 8.4Z"/><path d="M12 16.2V21"/><path d="M9.6 21h4.8"/></svg></div><div class="ol-name">Fond</div></div>
          <div class="olf-notes">{foreach from=$odysFond item=odysNote}
            <a class="note" href="{$urls.pages.search}?s={$odysNote|escape:'url'}"
                  data-note="{$odysNote|escape:'html':'UTF-8'}" data-type="fond"
                  aria-label="Voir les parfums avec la note {$odysNote|escape:'html':'UTF-8'}">{$odysNote|escape:'html':'UTF-8'}</a>
          {/foreach}</div>
        </div>
      {/if}
    </div>
    {/if}

    {* Un produit epuise proposait quand meme « Ajouter au Panier ». Le
       clic etait condamne d'avance : PrestaShop refuse l'ajout et le
       client recoit un refus apres coup. Mieux vaut le dire avant.

       La regle est celle du selecteur de format, plus haut : on lit le
       reglage global de la boutique. Un produit qui autorise lui-meme la
       commande en rupture sera annonce epuise a tort — c'est le sens
       prudent, on ne promet pas ce qu'on n'a pas. *}
    {assign var='odysRuptureBloque' value=(Configuration::get('PS_STOCK_MANAGEMENT') && !Configuration::get('PS_ORDER_OUT_OF_STOCK'))}
    {assign var='odysAchetable' value=($product.quantity > 0 || !$odysRuptureBloque)}

    {* CTA — EAA: quantity labelled, button descriptive *}
    <div class="cta-row">
      <div class="qty" role="group" aria-label="{if isset($product.unity) && $product.unity}Grammes{else}Quantité{/if}">
        <button data-action="chg-qty" data-delta="-1"
                aria-label="Diminuer la quantité">−</button>
        {* typing the number is quicker than pressing + eleven times, and on a
           phone inputmode=numeric brings up the number pad rather than a
           keyboard. The buttons still work for small adjustments. *}
        <input class="qty-v" id="qtyV" type="number" inputmode="numeric"
               min="1" step="1" autocomplete="off"
               value="{if isset($product.unity) && $product.unity}5{else}1{/if}"
               aria-label="{if isset($product.unity) && $product.unity}Grammes{else}Quantité{/if}"/>
        <button data-action="chg-qty" data-delta="1"
                aria-label="Augmenter la quantité">+</button>
      </div>
      {* Le coeur se tient entre la quantite et l'achat, a portee du pouce.
         Il ne porte plus son libelle : l'icone suffit la ou la ligne est
         deja longue, et aria-label dit la phrase entiere a qui ne voit
         pas l'icone. aria-pressed dit s'il est deja dans les envies. *}
      <button class="btn-wish btn-wish--icone" data-action="toggle-wish-full"
              aria-label="Ajouter {$product.name|escape:'html':'UTF-8'} à mes envies"
              data-id-product="{$product.id_product}"
              aria-pressed="false">
        <span aria-hidden="true">♡</span>
      </button>
      {if $odysAchetable}
      <button class="btn-cart" id="addBtn" data-action="add-prod"
              data-id-product="{$product.id_product}"
              data-id-product-attribute="{$product.id_product_attribute|intval}"
              aria-label="Ajouter {$product.name|escape:'html':'UTF-8'} au panier">
        <span class="blbl">Ajouter au Panier · {$odysShort}</span>
        <div class="bspin" aria-hidden="true"></div>
      </button>
      {else}
      <button class="btn-cart btn-cart-oos" type="button" disabled aria-disabled="true">
        <span class="blbl">Épuisé</span>
      </button>
      {/if}
    </div>

    {if !$odysAchetable}
      {* Epuise n'est pas « parti pour toujours » : on laisse une porte,
         la meme que partout ailleurs sur le site. *}
      <p class="oos-note">Ce parfum revient bientôt. Écrivez-nous pour être prévenu.</p>
      {include file='_partials/contact-links.tpl' style='inline'
               subject="Bonjour ODYS, prévenez-moi du retour de `$product.name`."}
    {/if}

    {* The delivery cost belongs here, not three steps later at the checkout:
       with payment on delivery a fee nobody mentioned is a parcel handed back
       at the door, and the shop pays the carriage twice. *}
    {if $odysShipMin > 0}
      <p class="odys-ship-note">
        {if $odysShipFrom > 0 && $product.price_amount >= $odysShipFrom}
          <strong>Livraison offerte</strong> — au-delà de {$odysShipFrom|intval} DH.
        {else}
          Livraison {$odysShipMin|intval}{if $odysShipMax > $odysShipMin}–{$odysShipMax|intval}{/if} DH
          {if $odysShipFrom > 0}· <strong>offerte dès {$odysShipFrom|intval} DH</strong>{/if}
        {/if}
      </p>
    {/if}
    {if $odysCodNote}
      <p class="odys-cod-note">{$odysCodNote|escape:'html':'UTF-8'}</p>
    {/if}
    {* Offrir est un geste different d'acheter pour soi : il merite son
       bouton. Celui-ci met le parfum au panier comme l'autre, et retient
       qu'il s'agit d'un cadeau — a l'etape de livraison la case sera deja
       cochee et le champ du message ouvert, sans que le client ait a le
       chercher. Si le script ne tourne pas, le parfum entre quand meme au
       panier et la case reste a cocher a la main : rien ne se perd. *}
    {if $odysAchetable}
      <button class="btn-gift" data-action="add-gift"
              data-id-product="{$product.id_product}"
              data-id-product-attribute="{$product.id_product_attribute|intval}"
              aria-label="Offrir {$product.name|escape:'html':'UTF-8'} — ajouter au panier avec un message">
        <span aria-hidden="true">✦</span> Offrir à quelqu'un
      </button>
    {/if}

    {* a COD buyer wants a human before a driver turns up asking for cash *}
    {include file='_partials/contact-links.tpl' style='inline'
      subject="Bonjour ODYS, je souhaite des informations sur `$product.name`."}

    {* Services — discreet line icons, the same family as the header *}
    <ul class="svc-grid" aria-label="Nos services" role="list">
      <li class="svc" role="listitem"><span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M12 3 4 7v5c0 4.4 3.2 7.6 8 9 4.8-1.4 8-4.6 8-9V7l-8-4Z"/><path d="m9.4 11.8 1.9 1.9 3.5-3.6"/></svg></span>{assign var='odysSvc1' value=Configuration::get('ODYS_SVC_1')}{if $odysSvc1}{$odysSvc1|escape:'html':'UTF-8'}{else}Élaboré au Maroc{/if}</li>
      <li class="svc" role="listitem"><span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/><path d="M7 15h3"/></svg></span>{assign var='odysSvc2' value=Configuration::get('ODYS_SVC_2')}{if $odysSvc2}{$odysSvc2|escape:'html':'UTF-8'}{else}Paiement à la livraison{/if}</li>
      <li class="svc" role="listitem"><span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M3 7h10v9H3z"/><path d="M13 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg></span>{assign var='odysSvc3' value=Configuration::get('ODYS_SVC_3')}{if $odysSvc3}{$odysSvc3|escape:'html':'UTF-8'}{else}Livraison 24–48h{/if}</li>
      <li class="svc" role="listitem"><span class="svc-ic" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 12a8 8 0 1 0 2.6-5.9"/><path d="M4 4v4h4"/></svg></span>{assign var='odysSvc4' value=Configuration::get('ODYS_SVC_4')}{if $odysSvc4}{$odysSvc4|escape:'html':'UTF-8'}{else}Retours sous 14 jours{/if}</li>
    </ul>

    {* Accordion — EAA: button[aria-expanded] *}
    <div class="acc" role="region" aria-label="Informations produit">
      <div class="acc-i">
        <button class="acc-h" data-action="toggle-acc" aria-expanded="false" aria-controls="acc-desc">
          <span>Description</span><span class="acc-ic" aria-hidden="true">+</span>
        </button>
        <div class="acc-b" id="acc-desc" role="region" aria-label="Description du produit">{$product.description nofilter}</div>
      </div>
      <div class="acc-i">
        <button class="acc-h" data-action="toggle-acc" aria-expanded="false" aria-controls="acc-use">
          <span>Comment utiliser</span><span class="acc-ic" aria-hidden="true">+</span>
        </button>
        <div class="acc-b" id="acc-use" role="region" aria-label="Instructions d'utilisation">
          <p>Vaporisez sur les points de chaleur (poignet, cou, nuque). 2–3 pulvérisations pour un sillage optimal.</p>
        </div>
      </div>
      <div class="acc-i">
        <button class="acc-h" data-action="toggle-acc" aria-expanded="false" aria-controls="acc-ship">
          <span>Livraison &amp; Retours</span><span class="acc-ic" aria-hidden="true">+</span>
        </button>
        <div class="acc-b" id="acc-ship" role="region" aria-label="Informations livraison et retours">
          <p>Livraison 24–48h. 20 DH Casa · 30 DH Maroc · Gratuite dès 300 DH. COD disponible. Retours 14 jours (non ouvert).</p>
        </div>
      </div>
    </div>

    {* Modules read $params['product'] here; without it ps_emailalerts warns
       three times per page. *}
    {hook h='displayProductAdditionalInfo' product=$product}
  </div>
</div>

{if $accessories}
<section class="sec" style="padding-top:0" aria-label="Produits complémentaires">
  <div class="sugg-section">
    <div class="sugg-hd">
      <h2 class="sugg-title">Vous aimerez aussi</h2>
      <div class="sugg-nav" role="group" aria-label="Navigation suggestions">
        <button class="sugg-arr" id="suggPrev" data-action="sugg-prev" aria-label="Parfum précédent">‹</button>
        <button class="sugg-arr" id="suggNext" data-action="sugg-next" aria-label="Parfum suivant">›</button>
      </div>
    </div>
    <div class="sugg-track-wrap"><div class="sugg-track" id="suggTrack" role="list">
      {foreach from=$accessories item=acc}
        <div class="sc" role="listitem">
          <div class="sc-img">
            <a href="{$acc.url}" aria-label="Voir {$acc.name|escape:'html':'UTF-8'}">
              <img src="{if $acc.cover}{$acc.cover.bySize.medium_default.url}{else}{$urls.no_picture_image.bySize.medium_default.url}{/if}" loading="lazy"
                   alt="{$acc.name|escape:'html':'UTF-8'}" width="160" height="160"/>
            </a>
            <button class="sc-add-quick" data-action="add-to-cart"
                    data-id-product="{$acc.id_product}"
                    data-name="{$acc.name|escape:'html':'UTF-8'}"
                    data-price="{$acc.price_amount|intval}"
                    aria-label="Ajouter {$acc.name|escape:'html':'UTF-8'} au panier">+</button>
          </div>
          <div class="sc-body">
            <div class="sc-ref">ODYS {$acc.reference}</div>
            <div class="sc-name"><a href="{$acc.url}">{$acc.name|escape:'html':'UTF-8'}</a></div>
            <div class="sc-price-row">
              <span class="sc-price">{$acc.price|intval} DH</span>
              <button class="sc-add-full" data-action="add-to-cart"
                      data-id-product="{$acc.id_product}"
                      data-name="{$acc.name|escape:'html':'UTF-8'}"
                      data-price="{$acc.price_amount|intval}"
                      aria-label="Ajouter {$acc.name|escape:'html':'UTF-8'} au panier">Ajouter</button>
            </div>
          </div>
        </div>
      {/foreach}
    </div></div>
  </div>
</section>
{/if}

{* Les avis. Le module officiel de PrestaShop (productcomments) tient la
   liste, le formulaire et la moderation ; il ne rend rien tant que personne
   n'a ecrit, et seuls les clients connectes peuvent poster. Le gabarit
   appelait deja displayProductAdditionalInfo, qui n'affiche que la note
   moyenne et le lien : sans ce crochet-ci, le lien ne menait nulle part et
   le formulaire n'existait sur aucune page. *}
<section class="pr-avis" id="avis">
  {hook h='displayFooterProduct' product=$product category=$category}
</section>

{hook h='displayReassurance'}

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
{/block}
