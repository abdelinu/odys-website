{* ODYS – Header v3.1 · EAA ARIA compliant *}
<header id="header" role="banner">
  <nav class="odys-nav" aria-label="{l s='Navigation principale' d='Shop.Theme.Odys'}" role="navigation">

    <a href="{$urls.base_url}" class="logo-link" aria-label="{l s='ODYS Parfums — Retour à l\'accueil' d='Shop.Theme.Odys'}">
      <svg class="logo-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
        <path d="M9 3h6v2H9zM7 5h10l1 2H6L7 5z" fill="#C4956A" opacity=".9"/>
        <rect x="6" y="7" width="12" height="1.5" rx=".75" fill="#C4956A" opacity=".6"/>
        <path d="M7 8.5C6.5 10 6 12 6 14c0 3.5 1.5 6.5 6 6.5s6-3 6-6.5c0-2-.5-4-1-5.5H7z" fill="#C4956A" opacity=".2"/>
        <path d="M7 8.5C6.5 10 6 12 6 14c0 3.5 1.5 6.5 6 6.5s6-3 6-6.5c0-2-.5-4-1-5.5H7z" stroke="#C4956A" stroke-width="1.2" fill="none"/>
        <circle cx="12" cy="2.5" r="1" fill="#C4956A" opacity=".7"/>
      </svg>
      <div class="logo-text-group" aria-hidden="true">
        <span class="lw">{l s='𝒪DYS' d='Shop.Theme.Odys'}</span>
        <span class="lt">{l s='Élaboré au Maroc · Est. 2026' d='Shop.Theme.Odys'}</span>
      </div>
    </a>

    <ul class="nav-links" role="list">
      <li{if $page.page_name=='category'} class="cur" aria-current="page"{/if}>
        <a href="{$urls.pages.category}">{l s='Collection' d='Shop.Theme.Odys'}</a>
      </li>
      <li class="nl-oud">
        <a href="{$urls.base_url}oud-boukhour">{l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}</a>
      </li>
      <li>
        <a href="{$urls.base_url}flacons-voyage">
          <span aria-hidden="true">🧪</span> {l s='Flacons' d='Shop.Theme.Odys'}
        </a>
      </li>
      <li>
        <a href="{$urls.base_url}coffrets">
          <span aria-hidden="true">🎁</span> {l s='Offres' d='Shop.Theme.Odys'}
        </a>
      </li>
    </ul>

    <div class="nav-icons" role="group" aria-label="{l s='Actions' d='Shop.Theme.Odys'}">
      {hook h='displayNav2'}

      <button class="ni" id="searchBtn"
              aria-label="{l s='Rechercher des parfums' d='Shop.Theme.Odys'}"
              aria-expanded="false"
              aria-controls="searchPanel">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </button>

      {if isset($urls.pages.wishlist)}
      <a href="{$urls.pages.wishlist}" class="ni" aria-label="{l s='Ma liste de souhaits' d='Shop.Theme.Odys'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </a>
      {/if}

      <a href="{$urls.pages.my_account}" class="ni" aria-label="Mon compte{if $customer.is_logged} — {$customer.firstname|escape:'html':'UTF-8'}{/if}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
        </svg>
      </a>

      <button class="ni" id="cartBtn" data-action="open-cart"
              aria-label="Ouvrir le panier — {$cart.products_count} article{if $cart.products_count != 1}s{/if}"
              aria-haspopup="dialog"
              style="position:relative">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
        <span class="cb" id="navCb"
              aria-live="polite" aria-atomic="true"
              style="{if $cart.products_count == 0}display:none{/if}">
          {$cart.products_count}
        </span>
      </button>

      <button class="ham" id="hamBtn"
              aria-label="{l s='Ouvrir le menu de navigation' d='Shop.Theme.Odys'}"
              aria-expanded="false"
              aria-controls="mobMenu">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </div>

  </nav>
</header>
