{**
 * WhatsApp on the order page.
 *
 * Each message opens already written; the employee reads it, edits if they
 * want, and sends. Nothing is sent automatically and no message is stored.
 *}
<div class="card mt-2">
  <div class="card-header">
    <h3 class="card-header-title">Prévenir le client sur WhatsApp</h3>
  </div>
  <div class="card-body">
    {if $odysWaNumber}
      <p class="text-muted small">
        Vers le <strong>+{$odysWaNumber|escape:'html':'UTF-8'}</strong>.
        Le message s'ouvre déjà rédigé — relisez-le avant d'envoyer.
      </p>
      <div class="d-grid gap-2">
        {foreach from=$odysWaLinks item=link key=key}
          <a href="{$link.href|escape:'html':'UTF-8'}" target="_blank" rel="noopener"
             class="btn btn-{if $key == 'shipped' && $odysWaState == $odysWaShipped}primary{else}outline-secondary{/if} btn-sm mb-1 w-100 text-start">
            {$link.label|escape:'html':'UTF-8'}
          </a>
        {/foreach}
      </div>
      <p class="text-muted small mt-2 mb-0">
        Confirmer avant l'expédition est ce qui fait le plus baisser les refus
        à la porte : entre 15 % et 30 % des commandes payées à la livraison sont
        refusées, et chaque refus coûte le transport deux fois.
      </p>
    {else}
      <p class="text-muted small mb-0">
        {if $odysWaRaw}
          Le numéro enregistré (<code>{$odysWaRaw|escape:'html':'UTF-8'}</code>) n'est pas
          un mobile marocain reconnaissable, donc aucun lien n'est proposé :
          mieux vaut ne rien envoyer que d'écrire à un inconnu.
        {else}
          Aucun numéro de téléphone sur l'adresse de livraison.
        {/if}
      </p>
    {/if}
  </div>
</div>
