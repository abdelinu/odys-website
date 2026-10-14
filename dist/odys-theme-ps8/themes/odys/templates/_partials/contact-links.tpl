{*
 * ODYS Parfums — reach a human
 *
 * Cash on delivery means a stranger arrives at the door asking for money, so
 * the question "who am I buying from?" is asked before the order, not after.
 * WhatsApp is how it gets asked in Morocco.
 *
 * Both numbers are set in Back Office → Apparence → Thème ODYS (WhatsApp and
 * Téléphone). Neither set, nothing renders — no dead link, no empty icon.
 *
 * Params: style = 'icons' (header) | 'inline' (product, cart)
 *         subject = what the message should be about (optional)
 *}
{assign var='odysWa' value=Configuration::get('ODYS_WA_NUMBER')}
{assign var='odysTel' value=Configuration::get('ODYS_PHONE')}
{if $odysWa || $odysTel}
  {assign var='odysWaText' value=$subject|default:"Bonjour ODYS, j'ai une question."}
  <div class="odys-contact odys-contact--{$style|default:'inline'}">
    {if $odysWa}
      <a class="oc-wa" href="https://wa.me/{$odysWa|escape:'html':'UTF-8'}?text={$odysWaText|escape:'url'}"
         target="_blank" rel="noopener"
         aria-label="{l s='Écrire à ODYS sur WhatsApp' d='Shop.Theme.Odys'}">
        <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
          <path d="M12 2a10 10 0 0 0-8.6 15l-1.3 4.7 4.8-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-2.9.8.8-2.8-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.7 6.7 0 0 1-2-1.2 7.4 7.4 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5l.4-.5.2-.4v-.4c0-.1-.5-1.3-.7-1.8s-.4-.4-.5-.4h-.5a.9.9 0 0 0-.7.3 2.8 2.8 0 0 0-.9 2.1 4.9 4.9 0 0 0 1 2.6 11.2 11.2 0 0 0 4.3 3.8c.6.3 1.1.4 1.5.5a3.6 3.6 0 0 0 1.6.1 2.6 2.6 0 0 0 1.7-1.2 2.1 2.1 0 0 0 .1-1.2c0-.1-.2-.2-.4-.3z"/>
        </svg>
        <span class="oc-lbl">{l s='WhatsApp' d='Shop.Theme.Odys'}</span>
      </a>
    {/if}
    {if $odysTel}
      <a class="oc-tel" href="tel:{$odysTel|replace:' ':''|escape:'html':'UTF-8'}"
         aria-label="{l s='Appeler ODYS' d='Shop.Theme.Odys'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"
             stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
          <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8.1 9.7a16 16 0 0 0 6 6l1.2-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.9 2.2z"/>
        </svg>
        <span class="oc-lbl">{$odysTel|escape:'html':'UTF-8'}</span>
      </a>
    {/if}
  </div>
{/if}
