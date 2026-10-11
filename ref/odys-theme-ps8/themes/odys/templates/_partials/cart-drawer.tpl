{* ODYS – Cart Drawer v3.1 · EAA *}
<div id="ov" class="ov" data-action="close-cart" aria-hidden="true"></div>
<aside id="cart-drawer" class="cart-drawer"
       role="dialog"
       aria-modal="true"
       aria-label="Votre panier d'achat"
       aria-hidden="true">
  <div class="cd-hd">
    <div>
      <div class="cd-title" id="cart-drawer-title">Mon Panier</div>
      <div class="cd-sub" id="cartCount" aria-live="polite" aria-atomic="true">0 article</div>
    </div>
    <button class="cd-close" data-action="close-cart"
            aria-label="Fermer le panier">✕</button>
  </div>

  <div class="cd-shipping" id="cartShipInfo" aria-live="polite">
    <div class="cd-ship-bar" role="progressbar" aria-valuemin="0" aria-valuemax="300" aria-valuenow="0" aria-label="Progression vers la livraison gratuite">
      <div class="cd-ship-fill" id="cartShipFill" style="width:0%"></div>
    </div>
    <div class="cd-ship-msg" id="cartShipMsg">Ajoutez 300 DH pour la livraison gratuite</div>
  </div>

  <div class="cd-items" id="cartItems" role="list" aria-label="Articles dans votre panier">
    <div class="cart-empty" role="listitem">
      <div style="font-size:48px;margin-bottom:16px" aria-hidden="true">🛍</div>
      <div style="font-family:var(--serif);font-size:20px;margin-bottom:8px">Votre panier est vide</div>
      <div style="font-size:12px;color:var(--mid)">Découvrez notre collection de parfums</div>
      <a href="{$urls.pages.category}" class="btn-p" style="margin-top:20px;display:inline-flex">Voir la collection →</a>
    </div>
  </div>

  <div class="cd-xs" id="cartXS" style="display:none" aria-label="Produits complémentaires">
    <div class="cd-xs-title">Souvent achetés ensemble</div>
    <div class="cd-xs-track" id="cartXSTrack" role="list"></div>
  </div>

  <div class="cd-ft" id="cartFt" style="display:none">
    <div id="dAdded" class="d-added" role="status" aria-live="polite">✓ Article ajouté !</div>
    <div class="cd-total">
      <span>Total</span>
      <span id="cartTotal" class="cd-total-val" aria-live="polite" aria-atomic="true">0 DH</span>
    </div>
    <div class="cd-ship-note" id="cartShipNote">+ 30 DH livraison</div>
    <button class="btn-p cd-checkout" data-action="open-checkout"
            aria-haspopup="dialog"
            style="width:100%;justify-content:center;padding:14px">
      Commander →
    </button>
    <a href="{$urls.pages.cart}" style="display:block;text-align:center;margin-top:8px;font-size:11px;color:var(--mid)">
      Voir le panier complet
    </a>
    <div class="cd-trust" aria-label="Garanties" role="list">
      <span role="listitem">💚 COD</span>
      <span role="listitem">🔒 Sécurisé</span>
      <span role="listitem">🚚 24–48h</span>
      <span role="listitem">↩ 14j</span>
    </div>
  </div>
</aside>
