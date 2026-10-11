{**
 * The same order page, reached without an account: the timeline is the point of
 * the visit, so nothing about it changes. Returns are not offered here (they
 * need a customer account) and the offer to keep the account is appended.
 *}
{extends file='customer/order-detail.tpl'}

{block name='order_detail'}{/block}

{block name='content' append}
  {if !$registered_customer_exists}
    <div class="odys-order">
      <section class="odys-order-card">
        <h2 class="odys-order-h2">Gardez votre historique</h2>
        <p class="odys-order-note">
          Choisissez un mot de passe et cette commande — et les suivantes —
          resteront dans votre espace client, avec vos points ODYS.
        </p>
        {include file='customer/_partials/account-transformation-form.tpl'}
      </section>
    </div>
  {/if}
{/block}
