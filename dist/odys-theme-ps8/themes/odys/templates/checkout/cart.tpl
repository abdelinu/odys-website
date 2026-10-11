{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Mon Panier | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:900px;margin:0 auto;padding:48px max(20px,32px) 80px">
  <div style="margin-bottom:28px">
    <a href="{$odysUrlParfums}" class="odys-order-back" style="font-size:11px;color:var(--mid)">← Continuer mes achats</a>
    <h1 style="font-family:var(--serif);font-size:28px;font-weight:500;margin-top:8px">Mon Panier</h1>
  </div>

  {if $cart.products}
    <div class="cart-grid" style="display:grid;grid-template-columns:1fr 340px;gap:28px;align-items:start">

      {* Products list *}
      <div>
        {foreach from=$cart.products item=product}
        <div class="cart-line" style="display:flex;gap:16px;padding:16px 0;border-bottom:1px solid var(--border);align-items:flex-start">
          <a href="{$product.url}">
            <img src="{$product.cover.bySize.cart_default.url}" loading="lazy" width="80" height="90"
                 alt="{$product.name|escape:'html':'UTF-8'}" style="border-radius:2px;object-fit:cover;border:1px solid var(--border)"/>
          </a>
          <div style="flex:1">
            <div style="font-size:9px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:3px">ODYS {$product.reference}</div>
            <div style="font-family:var(--serif);font-size:16px;font-weight:500;margin-bottom:4px"><a href="{$product.url}" style="color:var(--ink)">{$product.name|escape:'html':'UTF-8'}</a></div>
            {* $product.attributes est un tableau [groupe => valeur] : l'imprimer
               tel quel ecrivait « Array » sur la ligne de panier, precede d'un
               avertissement PHP que la production aurait masque — le client
               aurait simplement lu « Array » a la place de « 150 ml ». *}
            {if $product.attributes}
              <div style="font-size:11px;color:var(--mid);margin-bottom:8px">
                {foreach from=$product.attributes item=odysAttr name=pa}{$odysAttr|escape:'html':'UTF-8'}{if !$smarty.foreach.pa.last} &middot; {/if}{/foreach}
              </div>
            {/if}
            <div style="display:flex;align-items:center;gap:12px">
              <div style="display:flex;align-items:center;gap:0;border:1px solid var(--border);border-radius:2px;overflow:hidden">
                <a href="{$product.update_quantity_url}&amp;op=down" style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--mid);text-decoration:none;background:var(--odys-surface)">−</a>
                {* the quantity can be typed here too; the field carries the
                   URL PrestaShop already uses for + and -, and the script
                   works out the difference from what is in the cart now *}
                <input class="cart-qty" type="number" inputmode="numeric" min="1" step="1"
                       autocomplete="off" value="{$product.cart_quantity|intval}"
                       data-qty-url="{$product.update_quantity_url}"
                       data-qty-now="{$product.cart_quantity|intval}"
                       aria-label="Quantité pour {$product.name|escape:'html':'UTF-8'}"
                       style="width:46px;text-align:center;font-size:13px;font-weight:600;line-height:32px"/>
                <a href="{$product.update_quantity_url}&amp;op=up"   style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--mid);text-decoration:none;background:var(--odys-surface)">+</a>
              </div>
              <a class="cart-remove" href="{$product.remove_from_cart_url}" style="font-size:10px;color:var(--mid);text-decoration:none;opacity:.6">Supprimer</a>
            </div>
          </div>
          <div class="cart-line-price" style="text-align:right">
            <div style="font-family:var(--serif);font-size:18px;font-weight:500;color:var(--rose-deep)">{$product.total|intval} DH</div>
            <div style="font-size:10px;color:var(--mid)">{$product.price|intval} DH / {if isset($product.unity) && $product.unity}{$product.unity|escape:'html':'UTF-8'}{else}unité{/if}</div>
          </div>
        </div>
        {/foreach}

        {* Promo code *}
        <div class="cart-promo" style="margin-top:20px;padding:16px;background:var(--marble);border-radius:3px">
          <div style="font-size:11px;font-weight:700;margin-bottom:10px">Code promo</div>
          {* $cart.add_voucher_url does not exist: the presenter returns [] for an
             unknown key, so the action attribute was a PHP warning followed by
             the word "Array" and the promo code silently did nothing. The cart
             page posts to itself, exactly as classic does. *}
          <form class="cart-promo-form" action="{$urls.pages.cart}" method="post" style="display:flex;gap:8px">
            <input type="hidden" name="token" value="{$static_token}"/>
            <input type="hidden" name="addDiscount" value="1"/>
            {* Un placeholder n'est pas un libelle : il disparait des que le
               client tape, et les lecteurs d'ecran ne l'annoncent pas de
               maniere fiable. Le nom est donne pour de bon, masque a
               l'oeil pour garder la ligne compacte. *}
            <label class="sr-only" for="odys-code-promo-panier">Code promo</label>
            <input type="text" id="odys-code-promo-panier" name="discount_name"
                   autocomplete="off" placeholder="Entrez votre code"
                   style="flex:1;padding:10px 14px;border:1px solid var(--border);border-radius:2px;font-size:12px"/>
            <button type="submit" class="btn-g" style="padding:10px 16px;font-size:10px;white-space:nowrap">Appliquer</button>
          </form>
        </div>
      </div>

      {* Order summary *}
      <div style="background:var(--odys-surface);border:1px solid var(--border);border-radius:4px;padding:24px;position:sticky;top:calc(var(--nav-h) + 16px)">
        <div style="font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:var(--mid);margin-bottom:18px">Récapitulatif</div>
        <div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px;font-size:13px">
          <div style="display:flex;justify-content:space-between"><span style="color:var(--mid)">Sous-total</span><span>{$cart.subtotals.products.value}</span></div>
          {if isset($cart.subtotals.shipping.value) && $cart.subtotals.shipping.value}<div style="display:flex;justify-content:space-between"><span style="color:var(--mid)">Livraison</span><span>{$cart.subtotals.shipping.value}</span></div>{/if}
          {* the presenter calls it discounts, not vouchers; with the wrong key the
             reduction row never appeared and the totals did not add up *}
          {if $cart.subtotals.discounts && $cart.subtotals.discounts.value}<div style="display:flex;justify-content:space-between"><span style="color:#2D6A4F">Réduction</span><span style="color:#2D6A4F">−{$cart.subtotals.discounts.value}</span></div>{/if}
        </div>
        <div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:14px;border-top:2px solid var(--border);margin-bottom:20px">
          <span style="font-size:13px;font-weight:700">Total</span>
          <span style="font-family:var(--serif);font-size:24px;font-weight:500;color:var(--rose-deep)">{$cart.totals.total.value}</span>
        </div>
        <a href="{$urls.pages.order}" class="btn-p" style="width:100%;display:flex;justify-content:center;padding:14px;margin-bottom:12px">Commander →</a>
        <div style="display:flex;justify-content:center;gap:12px;font-size:10px;color:var(--mid)">
          <span>💚 COD</span><span>🔒 SSL</span><span>🚚 24–48h</span>
        </div>
        {if isset($odysFreeShipLeft) && $odysFreeShipLeft > 0}
        <div style="margin-top:14px;background:rgba(180,134,61,.06);border:1px solid rgba(180,134,61,.2);border-radius:2px;padding:10px 12px;font-size:11px;text-align:center;color:var(--rose-deep)">
          Plus que <strong>{$odysFreeShipLeft|string_format:"%d"} DH</strong> pour la livraison gratuite 🚚
        </div>
        {/if}
      </div>
    </div>

  {else}
    <div style="text-align:center;padding:80px 20px;color:var(--mid)">
      <div style="font-size:64px;margin-bottom:20px">🛍</div>
      <p style="font-family:var(--serif);font-size:22px;margin-bottom:8px">Votre panier est vide</p>
      <p style="font-size:13px;margin-bottom:28px">Découvrez notre collection de parfums d'inspiration luxe</p>
      <a href="{$odysUrlParfums}" class="btn-p">Découvrir la collection →</a>
    </div>
  {/if}
</div>
{/block}
