{* ODYS – Product miniature (used in grids, carousels, search) *}
<article class="pc" data-fam="{$product.extra_attributes.famille_olfactive|default:'fresh'}"
         itemscope itemtype="https://schema.org/Product">
  <meta itemprop="name" content="{$product.name|escape:'html':'UTF-8'}"/>
  <div class="pc-img">
    <div class="pc-live"><span class="ldot"></span><span>{l s='Populaire' d='Shop.Theme.Odys'}</span></div>
    <button class="pc-wish" data-action="toggle-wish" data-id="{$product.id_product}" aria-label="{l s='Wishlist' d='Shop.Theme.Odys'}">♡</button>
    <a href="{$product.url}" aria-label="Voir {$product.name|escape:'html':'UTF-8'}">
      <img src="{$product.cover.bySize.home_default.url}" loading="lazy" width="400" height="400"
           alt="ODYS {$product.reference} {$product.name|escape:'html':'UTF-8'}" itemprop="image"/>
    </a>
  </div>
  <div class="pc-body">
    <div class="pc-code">ODYS {$product.reference}</div>
    <h2 class="pc-name"><a href="{$product.url}">{$product.name|escape:'html':'UTF-8'}</a></h2>
    <div class="pc-pill">
      <span class="pp-by">{l s='Inspiré de' d='Shop.Theme.Odys'}</span>
      <span class="pp-b">{$product.description_short|strip_tags|truncate:50:'...'}</span>
    </div>
    <div class="pc-prow" itemprop="offers" itemscope itemtype="https://schema.org/Offer">
      <span class="pc-price" itemprop="price">{$product.price|intval} DH</span>
      <meta itemprop="priceCurrency" content="MAD"/>
      {if $product.regular_price_amount > $product.price_amount}
        <span class="pc-old">{$product.regular_price|intval} DH</span>
        <span class="pc-sv">−{(($product.regular_price_amount - $product.price_amount) / $product.regular_price_amount * 100)|intval}%</span>
      {/if}
      <span class="pc-pts-badge">⭐ +{($product.price_amount/100)|intval} pts</span>
    </div>
    <button class="pc-add" data-action="add-to-cart"
            data-id-product="{$product.id_product}"
            data-id-product-attribute="{$product.id_product_attribute|default:0}"
            data-name="{$product.name|escape:'html':'UTF-8'}"
            data-price="{$product.price_amount|intval}">
      {l s='Ajouter au Panier' d='Shop.Theme.Odys'}
    </button>
  </div>
</article>
