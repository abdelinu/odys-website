{* ODYS – Footer *}
<footer class="site-footer" role="contentinfo">
  <div style="max-width:1280px;margin:0 auto;padding:64px max(20px,calc(52px + var(--safe-l))) 40px">
    <div class="footer-grid">
      <div class="footer-brand">
        <a href="{$urls.base_url}" class="logo-link" style="margin-bottom:16px">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none"><path d="M9 3h6v2H9zM7 5h10l1 2H6L7 5z" fill="#C4956A" opacity=".9"/><rect x="6" y="7" width="12" height="1.5" rx=".75" fill="#C4956A" opacity=".6"/><path d="M7 8.5C6.5 10 6 12 6 14c0 3.5 1.5 6.5 6 6.5s6-3 6-6.5c0-2-.5-4-1-5.5H7z" fill="#C4956A" opacity=".2"/><path d="M7 8.5C6.5 10 6 12 6 14c0 3.5 1.5 6.5 6 6.5s6-3 6-6.5c0-2-.5-4-1-5.5H7z" stroke="#C4956A" stroke-width="1.2" fill="none"/><circle cx="12" cy="2.5" r="1" fill="#C4956A" opacity=".7"/></svg>
          <div class="logo-text-group"><span class="lw">𝒪DYS</span><span class="lt">Élaboré au Maroc · Est. 2026</span></div>
        </a>
        <p style="font-family:var(--alt);font-size:12px;font-style:italic;color:rgba(255,255,255,.35);line-height:1.9;max-width:280px">L'inspiration des plus grandes maisons de parfumerie mondiale — élaborée au Maroc, au prix juste.</p>
        <div style="display:flex;gap:10px;margin-top:20px">
          <a href="{Configuration::get('ODYS_INSTAGRAM')|default:'https://instagram.com/odys.parfums'}" target="_blank" rel="noopener" class="social-btn" aria-label="Instagram"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg></a>
          <a href="{Configuration::get('ODYS_TIKTOK')|default:'https://tiktok.com/@odys.ma'}" target="_blank" rel="noopener" class="social-btn" aria-label="TikTok"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.77a8.16 8.16 0 0 0 4.79 1.54V7.86a4.85 4.85 0 0 1-1.02-.17z"/></svg></a>
          <a href="https://wa.me/{Configuration::get('ODYS_WA_NUMBER')|default:'212600000000'}" target="_blank" rel="noopener" class="social-btn" aria-label="WhatsApp"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52c.149-.174.198-.298.298-.497c.099-.198.05-.371-.025-.52c-.075-.149-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51c-.173-.008-.371-.01-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074c.149.198 2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413c.248-.694.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882l6.174-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.518-5.16-1.42l-.37-.22-3.66.855.87-3.56-.24-.38A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg></a>
        </div>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Collection</div>
        <ul>
          <li><a href="{$urls.pages.category}">Tous les parfums</a></li>
          <li><a href="{$urls.base_url}parfums-frais">Frais &amp; Aquatiques</a></li>
          <li><a href="{$urls.base_url}parfums-orientaux">Orientaux &amp; Épicés</a></li>
          <li><a href="{$urls.base_url}oud-boukhour" class="footer-oud">Oud &amp; Boukhour</a></li>
          <li><a href="{$urls.base_url}flacons-voyage">Flacons Voyage</a></li>
          <li><a href="{$urls.base_url}coffrets">Coffrets &amp; Offres</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Informations</div>
        <ul>
          <li><a href="{$urls.pages.contact}">Contact &amp; Support</a></li>
          <li><a href="{$urls.base_url}livraison">Livraison &amp; Délais</a></li>
          <li><a href="{$urls.base_url}retours">Politique de retour</a></li>
          <li><a href="{$urls.base_url}fidelite">Programme Fidélité</a></li>
          <li><a href="{$urls.base_url}a-propos">À propos d'ODYS</a></li>
          <li><a href="{$urls.pages.sitemap}">Plan du site</a></li>
        </ul>
      </div>
      <div class="footer-col">
        <div class="footer-col-title">Mon Compte</div>
        <ul>
          {if $customer.is_logged}
            <li><a href="{$urls.pages.my_account}">Mon espace fidélité ⭐</a></li>
            <li><a href="{$urls.pages.history}">Mes commandes</a></li>
            <li><a href="{$urls.pages.wishlist}">Ma wishlist</a></li>
            <li><a href="{$urls.pages.authentication}?logout=1">Déconnexion</a></li>
          {else}
            <li><a href="{$urls.pages.authentication}">Se connecter</a></li>
            <li><a href="{$urls.pages.register}">Créer un compte · +2 pts ⭐</a></li>
          {/if}
        </ul>
        <div style="margin-top:20px">
          <div class="footer-col-title">Paiement sécurisé</div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px">
            <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:4px 10px;border-radius:2px;font-size:10px;color:rgba(255,255,255,.5)">💚 COD</span>
            <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:4px 10px;border-radius:2px;font-size:10px;color:rgba(255,255,255,.5)">🏦 CMI</span>
            <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:4px 10px;border-radius:2px;font-size:10px;color:rgba(255,255,255,.5)">💳 Visa/MC</span>
            <span style="background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);padding:4px 10px;border-radius:2px;font-size:10px;color:rgba(255,255,255,.5)">🏛 Virement</span>
          </div>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.07);margin-top:48px;padding-top:24px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px">
      <div style="font-size:10px;color:rgba(255,255,255,.25)">© {$smarty.now|date_format:'%Y'} ODYS Parfums · Casablanca, Maroc · Tous droits réservés</div>
      <div style="display:flex;gap:16px">
        <a href="{$urls.base_url}mentions-legales" style="font-size:10px;color:rgba(255,255,255,.25)">Mentions légales</a>
        <a href="{$urls.base_url}confidentialite"  style="font-size:10px;color:rgba(255,255,255,.25)">Confidentialité</a>
        <a href="{$urls.base_url}cgv"              style="font-size:10px;color:rgba(255,255,255,.25)">CGV</a>
      </div>
    </div>
  </div>
</footer>
