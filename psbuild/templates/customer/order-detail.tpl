{**
 * One order, tracked.
 *
 * Classic renders this as four bordered boxes and a two-column status table;
 * the rest of the account already left that behind, so this page is written in
 * the theme's own idiom. It is also the template guest tracking extends, so
 * everything here has to hold without a logged-in customer.
 *}
{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Commande {$order.details.reference} | ODYS Parfums{/block}

{block name='content'}
<div class="odys-order">

  <div class="odys-order-top">
    {if $customer.is_logged}
      <a class="odys-order-back" href="{$urls.pages.history}">← Mes commandes</a>
    {/if}
    <div class="odys-order-eyebrow">Suivi de commande</div>
    <h1 class="odys-order-ref">{$order.details.reference}</h1>
{* products_count counts order lines; two bottles of one perfume are
   two articles as far as the customer is concerned *}
{assign var='odysUnits' value=0}
{foreach from=$order.products item=line}{assign var='odysUnits' value=$odysUnits+$line.quantity}{/foreach}
    <div class="odys-order-sub">
      Passée le {$order.details.order_date}
      · {$odysUnits} article{if $odysUnits > 1}s{/if}
      · {$order.totals.total.value}
    </div>
  </div>

  {include file='_partials/order-tracking.tpl'}

  {* ── what is in the parcel ─────────────────────────────────────────── *}
  <section class="odys-order-card">
    <h2 class="odys-order-h2">Votre commande</h2>
    <ul class="odys-order-lines">
      {foreach from=$order.products item=product}
        <li class="odys-order-line">
          {if $product.cover}
            <img class="odys-order-thumb" src="{$product.cover.bySize.cart_default.url}"
                 alt="{$product.name|escape:'html':'UTF-8'}" loading="lazy" width="60" height="60"/>
          {else}
            <span class="odys-order-thumb odys-order-thumb--empty" aria-hidden="true"></span>
          {/if}
          <div class="odys-order-line-body">
            <div class="odys-order-line-name">{$product.name}</div>
            {if $product.attributes}
              <div class="odys-order-line-attr">
                {foreach from=$product.attributes item=attr name=a}{$attr}{if !$smarty.foreach.a.last} · {/if}{/foreach}
              </div>
            {/if}
            <div class="odys-order-line-qty">Quantité {$product.quantity} × {$product.price}</div>
          </div>
          <div class="odys-order-line-total">{$product.total}</div>
        </li>
      {/foreach}
    </ul>

    <dl class="odys-order-totals">
      {foreach from=$order.subtotals item=subtotal}
        {* getDiscounts() and friends return null when they do not apply, and
           reading ['label'] off null is a PHP 8 warning printed into the page *}
        {if $subtotal && $subtotal.label !== null && $subtotal.value !== null}
          <div><dt>{$subtotal.label}</dt><dd>{$subtotal.value}</dd></div>
        {/if}
      {/foreach}
      <div class="odys-order-grand">
        <dt>{$order.totals.total.label}</dt><dd>{$order.totals.total.value}</dd>
      </div>
    </dl>

    <div class="odys-order-actions">
      {if $order.details.invoice_url}
        <a class="btn-g" href="{$order.details.invoice_url}">Télécharger la facture</a>
      {/if}
      {if $order.details.reorder_url}
        <a class="btn-p" href="{$order.details.reorder_url}">Commander à nouveau</a>
      {/if}
    </div>
  </section>

  {* ── where it goes and how it was paid ─────────────────────────────── *}
  <div class="odys-order-grid">
    {if $order.addresses.delivery}
      <section class="odys-order-card">
        <h2 class="odys-order-h2">Livraison</h2>
        <address class="odys-order-address">{$order.addresses.delivery.formatted nofilter}</address>
        {if $order.carrier.name}<div class="odys-order-note">{$order.carrier.name}</div>{/if}
      </section>
    {/if}
    <section class="odys-order-card">
      <h2 class="odys-order-h2">Paiement</h2>
      <div class="odys-order-note">{$order.details.payment}</div>
      <address class="odys-order-address">{$order.addresses.invoice.formatted nofilter}</address>
    </section>
  </div>

  {if $order.details.gift_message}
    <section class="odys-order-card">
      <h2 class="odys-order-h2">Message cadeau</h2>
      <p class="odys-order-note">{$order.details.gift_message nofilter}</p>
    </section>
  {/if}

  {$HOOK_DISPLAYORDERDETAIL nofilter}

  {* ── messages, and the return request when the shop allows one ─────── *}
  {block name='order_messages'}
    {if $order.messages}
      <section class="odys-order-card">
        <h2 class="odys-order-h2">Échanges</h2>
        {foreach from=$order.messages item=message}
          <div class="odys-order-msg">
            <div class="odys-order-msg-meta">{$message.name} · {$message.message_date}</div>
            <p>{$message.message nofilter}</p>
          </div>
        {/foreach}
      </section>
    {/if}
  {/block}

  {block name='order_detail'}
    {if $order.details.is_returnable && !$orderIsVirtual}
      <section class="odys-order-card odys-order-return">
        {include file='customer/_partials/order-detail-return.tpl'}
      </section>
    {/if}
  {/block}

  <section class="odys-order-help">
    <h2 class="odys-order-h2">Une question sur cette commande ?</h2>
    <p>Indiquez la référence <strong>{$order.details.reference}</strong>, nous retrouvons le colis tout de suite.</p>
    {include file='_partials/contact-links.tpl'}
  </section>
</div>
{/block}
