{* ODYS – Mobile Menu v3.1 · EAA *}
<div class="mob-menu" id="mobMenu"
     role="dialog"
     aria-modal="true"
     aria-label="Menu de navigation mobile"
     aria-hidden="true">
  <ul role="list">
    <li><a href="{$urls.base_url}"><span aria-hidden="true">🏠</span> Accueil</a></li>
    <li><a href="{$urls.pages.category}"><span aria-hidden="true">📦</span> Collection</a></li>
    <li><a href="{$urls.base_url}oud-boukhour" class="mm-oud"><span aria-hidden="true">🪵</span> Oud &amp; Boukhour</a></li>
    <li><a href="{$urls.base_url}flacons-voyage"><span aria-hidden="true">🧪</span> Flacons</a></li>
    <li><a href="{$urls.base_url}coffrets"><span aria-hidden="true">🎁</span> Coffrets</a></li>
    <li><a href="{$urls.pages.contact}"><span aria-hidden="true">💬</span> Contact</a></li>
    {if $customer.is_logged}
      <li><a href="{$urls.pages.my_account}"><span aria-hidden="true">⭐</span> {$customer.firstname|escape:'html':'UTF-8'} · Fidélité</a></li>
    {else}
      <li><a href="{$urls.pages.authentication}"><span aria-hidden="true">👤</span> Connexion · +2 pts</a></li>
    {/if}
  </ul>
  <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:rgba(255,255,255,.2);letter-spacing:2px" aria-hidden="true">
    ODYS PARFUMS · CASABLANCA · odys.ma
  </div>
</div>
