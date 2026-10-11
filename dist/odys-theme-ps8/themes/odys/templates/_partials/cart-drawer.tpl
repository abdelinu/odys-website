{*
 * ODYS Parfums — Cart drawer v5.0 · EAA
 *
 * v3.1 shipped this with its own class/id vocabulary (.cart-drawer, .cd-*,
 * #cartItems, #cartTotal, #cartShipFill) that neither theme.css nor app.js
 * knew about — the panel had no styles and sat in the page flow, and the
 * script wrote its totals into elements that did not exist. It now uses the
 * .drawer / .d-* / .ds-* vocabulary both of them already implement, and
 * keeps the richer ARIA and the cross-sell / trust sections from v3.1.
 *}
<div id="ov" class="ov" data-action="close-cart" aria-hidden="true"></div>

<aside id="drawer" class="drawer"
       role="dialog" aria-modal="true"
       aria-labelledby="drawer-title" aria-hidden="true">

  <div class="d-hd">
    <div>
      <h2 class="d-title" id="drawer-title">Mon panier</h2>
      <p class="d-cnt" id="dCnt" aria-live="polite" aria-atomic="true">0 article</p>
    </div>
    <button class="d-close" type="button" data-action="close-cart"
            aria-label="Fermer le panier">&times;</button>
  </div>

  <p class="d-added" id="dAdded" role="status" aria-live="polite">Article ajouté</p>

  <div class="d-body">
    <div class="d-items" id="dItems" role="list" aria-label="Articles dans votre panier">
      <div class="d-empty" role="listitem">
        <p style="font-family:var(--font-editorial);font-size:20px;margin-bottom:8px">Votre panier est vide</p>
        <p style="font-size:13px;color:var(--odys-muted);font-family:var(--font-display)">
          Découvrez la collection ODYS.
        </p>
        <a href="{$odysUrlParfums}" class="btn-p" style="margin-top:20px;display:inline-flex">
          Voir la collection
        </a>
      </div>
    </div>

    <div class="d-xs" id="dXs" style="display:none" aria-label="Produits complémentaires">
      <p class="dxs-t">Souvent achetés ensemble</p>
      <div class="dxs-list" id="dXsList" role="list"></div>
    </div>
  </div>

  <div class="d-ship">
    <div class="ds-top">
      <span>Livraison gratuite</span>
      <span id="dsVal">0 / 300 DH</span>
    </div>
    <div class="ds-bar" role="progressbar"
         aria-valuemin="0" aria-valuemax="300" aria-valuenow="0"
         aria-label="Progression vers la livraison gratuite">
      <div class="ds-fill" id="dsFill" style="width:0%"></div>
    </div>
    <p class="ds-msg" id="dsMsg">Ajoutez 300 DH pour la livraison gratuite</p>
  </div>

  <div class="d-ft">
    <div class="d-tot-row">
      <span class="d-tot-lbl">Total</span>
      <span class="d-tot-price" id="dTotal" aria-live="polite" aria-atomic="true">0 DH</span>
    </div>

    <button class="btn-p btn-chk" type="button" data-action="open-checkout"
            aria-haspopup="dialog" style="width:100%;justify-content:center">
      Commander
    </button>

    <a href="{$urls.pages.cart}"
       style="display:block;text-align:center;margin-top:12px;
              font-family:var(--font-body);font-size:10px;
              letter-spacing:var(--tracking-wide);text-transform:uppercase;
              color:var(--odys-muted)">
      Voir le panier complet
    </a>

    <div class="d-band" role="list" aria-label="Garanties">
      <span role="listitem">Paiement à la livraison</span>
      <span role="listitem">Paiement sécurisé</span>
      <span role="listitem">Livraison 24–48h</span>
      <span role="listitem">Retours 14 jours</span>
    </div>
  </div>

  {* app.js keeps this live region in sync with the header badge *}
  <span id="cartCount" class="sr-only" aria-live="polite" aria-atomic="true">0 article</span>
  {* the last doubt before ordering is answered here, not after *}
  {include file='_partials/contact-links.tpl' style='inline'
    subject="Bonjour ODYS, une question sur ma commande."}
</aside>
