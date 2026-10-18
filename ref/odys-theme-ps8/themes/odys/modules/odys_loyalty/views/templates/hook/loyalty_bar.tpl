{* Loyalty card — signed-in customer *}
<section class="loyalty-card" aria-labelledby="odys-loyalty-hd">
  <span class="lc-ic" aria-hidden="true">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"
         stroke-linecap="round" stroke-linejoin="round" focusable="false">
      <path d="M12 3.2 13.9 9l5.9 1.9-5.9 1.9L12 18.8 10.1 12.8 4.2 10.9 10.1 9z"/>
    </svg>
  </span>
  <div class="lc-body">
    <h2 class="lc-name" id="odys-loyalty-hd">{l s='Programme ODYS' d='Shop.Theme.Odys'}</h2>
    <p class="lc-sub">
      <strong>{if $loyalty_points == 1}{l s='%nombre% point' sprintf=['%nombre%' => $loyalty_points]' d='Shop.Theme.Odys'}{else}{l s='%nombre% points' sprintf=['%nombre%' => $loyalty_points]' d='Shop.Theme.Odys'}{/if}</strong> &middot; {$loyalty_tier}
      {if $next_reward.remaining > 0} &middot; {if $next_reward.remaining == 1}{l s='plus que %nombre% pt pour %recompense%' sprintf=['%nombre%' => $next_reward.remaining, '%recompense%' => $next_reward.label]' d='Shop.Theme.Odys'}{else}{l s='plus que %nombre% pts pour %recompense%' sprintf=['%nombre%' => $next_reward.remaining, '%recompense%' => $next_reward.label]' d='Shop.Theme.Odys'}{/if}{/if}
    </p>
    <a class="lc-link" href="{$loyalty_url|escape:'html':'UTF-8'}">
      {l s='Découvrir le programme' d='Shop.Theme.Odys'} <span aria-hidden="true">→</span>
    </a>
  </div>
  <div class="lc-pts" aria-hidden="true">{$loyalty_points}<span>pts</span></div>
</section>
<p class="lc-note">{l s='Oud &middot; Boukhour exclus du programme' d='Shop.Theme.Odys'}</p>
