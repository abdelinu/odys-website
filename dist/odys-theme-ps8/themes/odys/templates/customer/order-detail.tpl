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
      <a class="odys-order-back" href="{$urls.pages.history}">{l s='← Mes commandes' d='Shop.Theme.Odys'}</a>
    {/if}
    <div class="odys-order-eyebrow">{l s='Suivi de commande' d='Shop.Theme.Odys'}</div>
    <h1 class="odys-order-ref">{$order.details.reference}</h1>
{* products_count counts order lines; two bottles of one perfume are
   two articles as far as the customer is concerned *}
{assign var='odysUnits' value=0}
{foreach from=$order.products item=line}{assign var='odysUnits' value=$odysUnits+$line.quantity}{/foreach}
    <div class="odys-order-sub">
      {l s='Passée le %date%' sprintf=['%date%' => $order.details.order_date] d='Shop.Theme.Odys'}
      · {$odysUnits} article{if $odysUnits > 1}s{/if}
      · {$order.totals.total.value}
    </div>
  </div>

  {include file='_partials/order-tracking.tpl'}

  {* ── what is in the parcel ─────────────────────────────────────────── *}
  <section class="odys-order-card">
    <h2 class="odys-order-h2">{l s='Votre commande' d='Shop.Theme.Odys'}</h2>
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
            <div class="odys-order-line-qty">{l s='Quantité %nombre% × %prix%' sprintf=['%nombre%' => $product.quantity, '%prix%' => $product.price] d='Shop.Theme.Odys'}</div>
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
        <a class="btn-g" href="{$order.details.invoice_url}">{l s='Télécharger la facture' d='Shop.Theme.Odys'}</a>
      {/if}
      {if $order.details.reorder_url}
        <a class="btn-p" href="{$order.details.reorder_url}">{l s='Commander à nouveau' d='Shop.Theme.Odys'}</a>
      {/if}
    </div>
  </section>

  {* ── where it goes and how it was paid ─────────────────────────────── *}
  <div class="odys-order-grid">
    {if $order.addresses.delivery}
      <section class="odys-order-card">
        <h2 class="odys-order-h2">{l s='Livraison' d='Shop.Theme.Odys'}</h2>
        <address class="odys-order-address">{$order.addresses.delivery.formatted nofilter}</address>
        {if $order.carrier.name}<div class="odys-order-note">{$order.carrier.name}</div>{/if}
      </section>
    {/if}
    <section class="odys-order-card">
      <h2 class="odys-order-h2">{l s='Paiement' d='Shop.Theme.Odys'}</h2>
      <div class="odys-order-note">{$order.details.payment}</div>
      <address class="odys-order-address">{$order.addresses.invoice.formatted nofilter}</address>
    </section>
  </div>

  {if $order.details.gift_message}
    <section class="odys-order-card">
      <h2 class="odys-order-h2">{l s='Message cadeau' d='Shop.Theme.Odys'}</h2>
      <p class="odys-order-note">{$order.details.gift_message nofilter}</p>
    </section>
  {/if}

  {$HOOK_DISPLAYORDERDETAIL nofilter}

  {* ── messages, and the return request when the shop allows one ─────── *}
  {block name='order_messages'}
    {if $order.messages}
      <section class="odys-order-card">
        <h2 class="odys-order-h2">{l s='Échanges' d='Shop.Theme.Odys'}</h2>
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

  {* ── l'invitation a donner son avis ───────────────────────────────── *}
  {* C'est le seul endroit ou la boutique peut demander un avis aujourd'hui :
     l'envoi d'e-mails n'est pas encore configure (PS_MAIL_SERVER vaut
     « smtp. »), donc aucune relance automatique ne partirait. Ici, la
     demande arrive quand le client revient voir sa commande, et elle ne
     promet rien : le module officiel n'accepte l'avis que d'un client
     connecte, et la moderation passe avant la publication. *}
  {if $order.products}
    <section class="odys-order-card odys-order-avis">
      <h2 class="odys-order-h2">{l s='Votre colis est arrivé ?' d='Shop.Theme.Odys'}</h2>
      <p>{l s='Dites-nous ce que vous en pensez — votre avis aide les prochains à
        choisir. Il est relu avant d\'être publié.' d='Shop.Theme.Odys'}</p>
      <ul class="odys-avis-liens" role="list">
        {foreach from=$order.products item=product}
          <li><a href="{$product.url|escape:'html':'UTF-8'}#avis">{l s='Donner mon avis sur %nom%' sprintf=['%nom%' => $product.name|escape:'html':'UTF-8'] d='Shop.Theme.Odys'}</a></li>
        {/foreach}
      </ul>
    </section>
  {/if}

  <section class="odys-order-help">
    <h2 class="odys-order-h2">{l s='Une question sur cette commande ?' d='Shop.Theme.Odys'}</h2>
    <p>{l s='Indiquez la référence' d='Shop.Theme.Odys'} <strong>{$order.details.reference}</strong>{l s=', nous retrouvons le colis tout de suite.' d='Shop.Theme.Odys'}</p>
    {include file='_partials/contact-links.tpl'}
  </section>
</div>
{/block}
