{*
 * ODYS Parfums — Footer v5.0
 * Deep black ground, cream type, gold headings and hover.
 *}
<footer class="site-footer" role="contentinfo">
  <div>
    <div class="footer-grid">

      <div class="footer-brand">
        {* Monogram + secondary lockup — European Maison *}
        <a href="{$urls.base_url}" class="footer-logo" aria-label="{l s='ODYS Parfum — Accueil' d='Shop.Theme.Odys'}">
          <span class="odys-mono" aria-hidden="true"><span>O</span><span>D</span></span>
          <span class="odys-lockup" aria-hidden="true">
            <span class="odys-logo"><span class="odys-logo-w">{l s='ODYS' d='Shop.Theme.Odys'}</span><span class="odys-logo-p">{l s='Parfum' d='Shop.Theme.Odys'}</span></span>
            <span class="odys-lockup-rule"></span>
            <span class="odys-lockup-sub">{l s='Extrait' d='Shop.Theme.Odys'}<br>{l s='de parfum' d='Shop.Theme.Odys'}</span>
          </span>
        </a>
        {assign var='odysBlurb' value=Configuration::get('ODYS_FOOTER_BLURB')}
        <p>{if $odysBlurb}{$odysBlurb|escape:'html':'UTF-8'}{else}Une maison de parfum née de la rencontre entre l'élégance
          contemporaine et l'âme du Maroc. Élaboré à Casablanca, avec passion.{/if}</p>

        <div style="display:flex;gap:10px;margin-top:20px">
          {assign var='odysSocialInstagram' value=Configuration::get('ODYS_INSTAGRAM')}{if $odysSocialInstagram}<a href="{$odysSocialInstagram}"
             target="_blank" rel="noopener" class="social-btn" aria-label="{l s='ODYS Parfums sur Instagram' d='Shop.Theme.Odys'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/>
              <circle cx="17.5" cy="6.5" r="1.2" fill="currentColor" stroke="none"/>
            </svg>
          </a>{/if}
          {assign var='odysSocialFacebook' value=Configuration::get('ODYS_FACEBOOK')}{if $odysSocialFacebook}<a href="{$odysSocialFacebook}"
             target="_blank" rel="noopener" class="social-btn" aria-label="{l s='ODYS Parfums sur Facebook' d='Shop.Theme.Odys'}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true">
              <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V9H7v3h2v9h3v-9h2.4l.6-3H12V6.8c0-.5.4-.8.9-.8H15z"/>
            </svg>
          </a>{/if}
          {assign var='odysSocialTikTok' value=Configuration::get('ODYS_TIKTOK')}{if $odysSocialTikTok}<a href="{$odysSocialTikTok}"
             target="_blank" rel="noopener" class="social-btn" aria-label="{l s='ODYS Parfums sur TikTok' d='Shop.Theme.Odys'}">
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.77a8.16 8.16 0 0 0 4.79 1.54V7.86a4.85 4.85 0 0 1-1.02-.17z"/>
            </svg>
          </a>{/if}
        </div>
      </div>

      <nav class="footer-col" aria-label="{l s='Collection' d='Shop.Theme.Odys'}">
        <h2 class="footer-col-title">{l s='Collection' d='Shop.Theme.Odys'}</h2>
        <ul>
          <li><a href="{$odysUrlParfums}">{l s='Tous les parfums' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlParfums}#fam-fresh">{l s='Frais &amp; Aquatiques' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlParfums}#fam-oriental">{l s='Orientaux &amp; Épicés' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlOud}" class="footer-oud">{l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlCoffrets}">{l s='Coffrets' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlDiffuseurs}">{l s='Diffuseurs' d='Shop.Theme.Odys'}</a></li>
        </ul>
      </nav>

      <nav class="footer-col" aria-label="{l s='Maison' d='Shop.Theme.Odys'}">
        <h2 class="footer-col-title">{l s='Maison' d='Shop.Theme.Odys'}</h2>
        <ul>
          <li><a href="{$odysUrlApropos}">{l s='Notre histoire' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlSavoirFaire}">{l s='Savoir-faire' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$urls.pages.contact}">{l s='Contact' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlLivraison}">{l s='Livraison' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$odysUrlRetours}">{l s='Retours' d='Shop.Theme.Odys'}</a></li>
          <li><a href="{$urls.pages.sitemap}">{l s='Plan du site' d='Shop.Theme.Odys'}</a></li>
        </ul>
      </nav>

      <nav class="footer-col" aria-label="{l s='Mon compte' d='Shop.Theme.Odys'}">
        <h2 class="footer-col-title">{l s='Mon compte' d='Shop.Theme.Odys'}</h2>
        <ul>
          {if $customer.is_logged}
            <li><a href="{$urls.pages.my_account}">{l s='Espace fidélité' d='Shop.Theme.Odys'}</a></li>
            <li><a href="{$urls.pages.history}">{l s='Mes commandes' d='Shop.Theme.Odys'}</a></li>
            {if isset($urls.pages.wishlist)}<li><a href="{$urls.pages.wishlist}">{l s='Ma wishlist' d='Shop.Theme.Odys'}</a></li>{/if}
            <li><a href="{$urls.pages.authentication}?logout=1">{l s='Déconnexion' d='Shop.Theme.Odys'}</a></li>
          {else}
            <li><a href="{$urls.pages.authentication}">{l s='Se connecter' d='Shop.Theme.Odys'}</a></li>
            <li><a href="{$urls.pages.register}">{l s='Créer un compte' d='Shop.Theme.Odys'}</a></li>
            {* paiement à la livraison: most customers order without an account
               and then want to know where the parcel is *}
            <li><a href="{$urls.pages.guest_tracking}">{l s='Suivre ma commande' d='Shop.Theme.Odys'}</a></li>
          {/if}
          <li><a href="{$odysUrlFidelite}">{l s='Programme fidélité' d='Shop.Theme.Odys'}</a></li>
        </ul>

        <h2 class="footer-col-title" style="margin-top:28px">{l s='Paiement sécurisé' d='Shop.Theme.Odys'}</h2>
        <div class="pay-wrap dark" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
          <span class="pbadge cod">{l s='Paiement à la livraison' d='Shop.Theme.Odys'}</span>
          <span class="pbadge">{l s='CMI' d='Shop.Theme.Odys'}</span>
          <span class="pbadge">{l s='Visa / Mastercard' d='Shop.Theme.Odys'}</span>
          <span class="pbadge">{l s='Virement' d='Shop.Theme.Odys'}</span>
        </div>
      </nav>

    </div>

    <div class="ft-hr" role="presentation"></div>

    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <p class="ft-copy">© {$smarty.now|date_format:'%Y'} ODYS Parfums · Casablanca, Maroc · Tous droits réservés</p>
      <div style="display:flex;gap:20px">
        <a href="{$odysUrlMentions}" class="ft-legal">{l s='Mentions légales' d='Shop.Theme.Odys'}</a>
        <a href="{$odysUrlConfidentialite}" class="ft-legal">{l s='Confidentialité' d='Shop.Theme.Odys'}</a>
        <a href="{$odysUrlCgv}" class="ft-legal">{l s='CGV' d='Shop.Theme.Odys'}</a>
      </div>
    </div>

    <p class="ft-disc">{l s='ODYS Parfums crée des compositions originales d\'inspiration.
      Les marques citées à titre de référence olfactive appartiennent à leurs
      propriétaires respectifs et n\'ont aucun lien avec ODYS Parfums.' d='Shop.Theme.Odys'}</p>
  </div>
</footer>
