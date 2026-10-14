{* ODYS – Mobile Menu v3.1 · EAA *}
<div class="mob-menu" id="mobMenu"
     role="dialog"
     aria-modal="true"
     aria-label="{l s='Menu de navigation mobile' d='Shop.Theme.Odys'}"
     aria-hidden="true">
  <ul role="list">
    <li><a href="{$urls.base_url}"><span aria-hidden="true">🏠</span> {l s='Accueil' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.pages.category}"><span aria-hidden="true">📦</span> {l s='Collection' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.base_url}oud-boukhour" class="mm-oud"><span aria-hidden="true">🪵</span> {l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.base_url}flacons-voyage"><span aria-hidden="true">🧪</span> {l s='Flacons' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.base_url}coffrets"><span aria-hidden="true">🎁</span> {l s='Coffrets' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.pages.contact}"><span aria-hidden="true">💬</span> {l s='Contact' d='Shop.Theme.Odys'}</a></li>
    {if $customer.is_logged}
      <li><a href="{$urls.pages.my_account}"><span aria-hidden="true">⭐</span> {$customer.firstname|escape:'html':'UTF-8'} · Fidélité</a></li>
    {else}
      <li><a href="{$urls.pages.authentication}"><span aria-hidden="true">👤</span> {l s='Connexion · +2 pts' d='Shop.Theme.Odys'}</a></li>
    {/if}
  </ul>
  <div style="padding:16px 20px;border-top:1px solid rgba(255,255,255,.06);font-size:9px;color:rgba(255,255,255,.2);letter-spacing:2px" aria-hidden="true">
    {l s='ODYS PARFUMS · CASABLANCA · odys.ma' d='Shop.Theme.Odys'}
  </div>
</div>
