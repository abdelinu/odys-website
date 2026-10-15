{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}{l s='Mon Compte | ODYS Parfums' d='Shop.Theme.Odys'}{/block}

{*
 * ODYS Parfums — Account dashboard v5.0
 * v3.1 used .acc-link-card / .alc-* with no CSS rule (unstyled), emoji
 * icons and legacy colours. Same links, same hook, house style.
 *}
{block name='content'}
<section class="acc-page" aria-labelledby="acc-title">

  <header class="ma-hd">
    <p class="acc-eyebrow">{l s='Espace personnel' d='Shop.Theme.Odys'}</p>
    <h1 id="acc-title">Bonjour, {$customer.firstname|escape:'html':'UTF-8'}</h1>
  </header>

  <div class="acc-loyalty">
    <div>
      <p class="acc-loyalty-lbl">{l s='Vos points fidélité ODYS' d='Shop.Theme.Odys'}</p>
      <div class="acc-loyalty-pts">{hook h='displayLoyaltyPoints'}</div>
      <p class="acc-loyalty-sub">{l s='points accumulés · 1 pt = 100 DH dépensés' d='Shop.Theme.Odys'}</p>
    </div>
    <div>
      <p class="acc-loyalty-lbl">{l s='Prochaine récompense' d='Shop.Theme.Odys'}</p>
      <p class="acc-loyalty-reward">{l s='Un parfum à 10 pts &middot; deux à 15 &middot; un coffret à 20' d='Shop.Theme.Odys'}</p>
      <p class="acc-loyalty-sub">
        <a href="{$link->getModuleLink('odys_loyalty', 'rewards')}">{l s='Échanger mes points →' d='Shop.Theme.Odys'}</a>
      </p>
    </div>
  </div>

  <div class="acc-links" role="navigation" aria-label="{l s='Mon compte' d='Shop.Theme.Odys'}">
    {* the rules send people here to redeem, so it leads the grid *}
    <a href="{$link->getModuleLink('odys_loyalty', 'rewards')}" class="acc-link-card">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 4l2.6 7.8L26.4 14l-7.8 2.6L16 24.4l-2.6-7.8L5.6 14l7.8-2.2z"/></svg>
      <span class="alc-lbl">{l s='Mes points ODYS' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Solde, échange, historique' d='Shop.Theme.Odys'}</span>
    </a>
    <a href="{$urls.pages.history}" class="acc-link-card">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M4 10l12-6 12 6v12l-12 6-12-6z"/><path d="M4 10l12 6 12-6M16 16v12"/></svg>
      <span class="alc-lbl">{l s='Mes commandes' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Suivre, retourner' d='Shop.Theme.Odys'}</span>
    </a>
    <a href="{$urls.pages.address}" class="acc-link-card">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 29s9-8.4 9-15a9 9 0 0 0-18 0c0 6.6 9 15 9 15z"/><circle cx="16" cy="14" r="3.2"/></svg>
      <span class="alc-lbl">{l s='Mes adresses' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Gérer la livraison' d='Shop.Theme.Odys'}</span>
    </a>
    <a href="{$urls.pages.identity}" class="acc-link-card">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="11" r="5"/><path d="M6 27c1.4-5 5.3-8 10-8s8.6 3 10 8"/></svg>
      <span class="alc-lbl">{l s='Mes informations' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Profil, mot de passe' d='Shop.Theme.Odys'}</span>
    </a>
    {* the saved list is the theme's own now - kept in the visitor's browser,
       so it needs no account and the card is always here *}
    <a href="{$link->getModuleLink('odys_loyalty', 'envies')}" class="acc-link-card">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M16 27S4 19.6 4 11.6A6.6 6.6 0 0 1 16 8a6.6 6.6 0 0 1 12 3.6C28 19.6 16 27 16 27z"/></svg>
      <span class="alc-lbl">{l s='Mes envies' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Parfums mis de côté' d='Shop.Theme.Odys'}</span>
    </a>
    <a href="{$urls.pages.authentication}?logout=1" class="acc-link-card acc-link-quiet">
      <svg class="alc-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path d="M13 5H7a2 2 0 0 0-2 2v18a2 2 0 0 0 2 2h6"/><path d="M20 10l6 6-6 6M26 16H12"/></svg>
      <span class="alc-lbl">{l s='Se déconnecter' d='Shop.Theme.Odys'}</span>
      <span class="alc-sub">{l s='Fermer la session' d='Shop.Theme.Odys'}</span>
    </a>
  </div>

</section>
{/block}
