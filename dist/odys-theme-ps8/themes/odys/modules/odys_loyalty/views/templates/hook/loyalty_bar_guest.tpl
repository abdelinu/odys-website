{* Loyalty card — visitor. The bonus is credited with the first paid order,
   never at registration, so the copy no longer promises it on sign-up. *}
<section class="loyalty-card" aria-labelledby="odys-loyalty-hd">
  <span class="lc-ic" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"
         stroke-linecap="round" stroke-linejoin="round" focusable="false">
      <path d="M12 3.2 13.9 9l5.9 1.9-5.9 1.9L12 18.8 10.1 12.8 4.2 10.9 10.1 9z"/>
    </svg>
  </span>
  <div class="lc-body">
    <h2 class="lc-name" id="odys-loyalty-hd">{l s='Programme ODYS' d='Shop.Theme.Odys'}</h2>
    <p class="lc-sub">{l s='Cumulez des points à chaque commande réglée et échangez-les contre des avantages exclusifs.' d='Shop.Theme.Odys'}</p>
    <a class="lc-link" href="{$loyalty_url|escape:'html':'UTF-8'}">
      {l s='Découvrir le programme' d='Shop.Theme.Odys'} <span aria-hidden="true">→</span>
    </a>
  </div>
</section>
