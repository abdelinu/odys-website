{**
 * Every message PrestaShop has to give the customer arrives in $notifications:
 * a rejected voucher, a failed login, a saved address, a validation error at
 * checkout. The layout rendered none of them, so the site failed in silence.
 *
 * role=alert for errors so a screen reader hears them without hunting.
 *}
{if isset($notifications)}
  <div class="odys-notif-wrap">
    {foreach from=['error','warning','success','info'] item=kind}
      {if isset($notifications[$kind]) && $notifications[$kind]}
        <div class="odys-notif odys-notif--{$kind}"
             role="{if $kind == 'error' || $kind == 'warning'}alert{else}status{/if}">
          <ul>
            {foreach from=$notifications[$kind] item=notif}
              <li>{$notif nofilter}</li>
            {/foreach}
          </ul>
        </div>
      {/if}
    {/foreach}
  </div>
{/if}
