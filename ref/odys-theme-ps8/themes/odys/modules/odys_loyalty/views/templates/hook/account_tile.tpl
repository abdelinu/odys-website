{* "Mon compte" tile — the page the fidélité rules send people to *}
<a href="{$odys_rewards_url|escape:'html':'UTF-8'}" class="account-link odys-account-tile">
  <span class="link-item">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2"
         stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
      <path d="M12 3.2 13.9 9l5.9 1.9-5.9 1.9L12 18.8 10.1 12.8 4.2 10.9 10.1 9z"/>
    </svg>
    {l s='Mes points ODYS' d='Shop.Theme.Odys'}
    <span class="odys-tile-pts">{if $odys_points == 1}{l s='%nombre% pt' sprintf=['%nombre%' => $odys_points|intval]' d='Shop.Theme.Odys'}{else}{l s='%nombre% pts' sprintf=['%nombre%' => $odys_points|intval]' d='Shop.Theme.Odys'}{/if} · {$odys_tier|escape:'html':'UTF-8'}</span>
  </span>
</a>
