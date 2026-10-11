{*
 * ODYS Parfums — Header v5.0
 * Cream / champagne bar, black wordmark, gold on hover only.
 * ARIA preserved from v3.1; decorative emoji removed.
 *}
<header id="header" role="banner">
  <nav class="odys-nav" aria-label="Navigation principale">

    {* Primary logo — European Maison: ODYS over tracked PARFUM *}
    <a href="{$urls.base_url}" class="odys-logo" aria-label="ODYS Parfum — Retour à l'accueil">
      <span class="odys-logo-w" aria-hidden="true">ODYS</span>
      <span class="odys-logo-p" aria-hidden="true">Parfum</span>
    </a>

    <ul class="nav-links" role="list">
      {* Perfume is chosen for who it is for before anything else, so the three
         sections are one hover away instead of three clicks deep. The parent
         link still works on its own: a touch device opens Collection rather
         than trapping the visitor in a menu that needs a hover. *}
      <li class="has-sub{if $page.page_name == 'category'} cur{/if}"
          {if $page.page_name == 'category'}aria-current="page"{/if}>
        <a href="{$odysUrlParfums}">Collection</a>
        <ul class="nav-sub" role="list">
          <li><a href="{$odysUrlHomme}">Homme</a></li>
          <li><a href="{$odysUrlFemme}">Femme</a></li>
          <li><a href="{$odysUrlUnisexe}">Unisexe</a></li>
          <li><a href="{$odysUrlParfums}">Tous les parfums</a></li>
        </ul>
      </li>
      <li class="nl-oud"><a href="{$urls.base_url}oud-boukhour">Oud &amp; Boukhour</a></li>
      <li><a href="{$urls.base_url}coffrets">Coffrets</a></li>
      <li><a href="{$odysUrlDiffuseurs}">Diffuseurs</a></li>
      <li><a href="{$odysUrlApropos}">À propos</a></li>
    </ul>

    <div class="nav-icons" role="group" aria-label="Actions">
      {hook h='displayNav2'}

      {include file='_partials/contact-links.tpl' style='icons'}

      {* A button with no panel and no handler did nothing; the search page
         is a real page, so link to it and let it do the work. *}
      <a class="ni" id="searchBtn" href="{$urls.pages.search}"
         aria-label="Rechercher des parfums">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
      </a>

      {if isset($urls.pages.wishlist)}
      <a href="{$urls.pages.wishlist}" class="ni" aria-label="Ma liste de souhaits">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true" focusable="false">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      </a>
      {/if}

      {* Account and cart come from PrestaShop itself, through displayNav2
         above (ps_customersignin and ps_shoppingcart): they carry the real
         session, the real cart contents and the real totals. The theme's own
         icons used to sit here too and duplicated them — they are styled to
         match in theme.css instead. *}

      <button class="ham" id="hamBtn" type="button" data-action="toggle-menu"
              aria-label="Ouvrir le menu de navigation"
              aria-expanded="false" aria-controls="mobMenu">
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
        <span aria-hidden="true"></span>
      </button>
    </div>

  </nav>
</header>
