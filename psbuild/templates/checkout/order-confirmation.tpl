{**
 * The page a customer sees the moment they have ordered.
 *
 * With payment on delivery this is the whole receipt: nothing has been paid,
 * no card statement will carry a trace, and the confirmation e-mail only
 * arrives if the shop has a working mail server. So the three things that
 * matter are said first and plainly — the reference to keep, the cash to have
 * ready, and that somebody will call before anything ships.
 *
 * Classic announced "un e-mail vous a été envoyé" unconditionally. On a shop
 * whose mail is not configured that is simply untrue, and a customer who waits
 * for it and gets nothing telephones instead — or decides the order never went
 * through. The line now appears only when the shop is actually set up to send.
 *}
{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Commande confirmée | ODYS Parfums{/block}

{block name='content'}
<div class="odys-order">

  <section class="odys-confirm-top">
    <span class="odys-confirm-mark" aria-hidden="true">✓</span>
    <h1 class="odys-confirm-h1">{l s='Merci, votre commande est confirmée' d='Shop.Theme.Odys'}</h1>
    <p class="odys-confirm-lede">
      {l s='Rien n\'est à régler maintenant. Vous paierez à la livraison.' d='Shop.Theme.Odys'}
    </p>
  </section>

  {* the reference is what guest tracking asks for; it has to be impossible
     to miss, not a line in a table at the bottom of the page *}
  <section class="odys-confirm-ref">
    <span class="odys-confirm-reflabel">{l s='Votre référence' d='Shop.Theme.Odys'}</span>
    <strong class="odys-confirm-refcode">{$order.details.reference}</strong>
    <p class="odys-confirm-refnote">
      Notez-la. Elle suffit à suivre votre colis
      {if isset($urls.pages.guest_tracking)}
        — <a href="{$urls.pages.guest_tracking}">{l s='suivre ma commande' d='Shop.Theme.Odys'}</a>
      {/if}.
    </p>
  </section>

  <section class="odys-order-card">
    <dl class="odys-confirm-facts">
      <div>
        <dt>{l s='À préparer pour la livraison' d='Shop.Theme.Odys'}</dt>
        <dd class="odys-confirm-cash">{$order.totals.total.value}</dd>
      </div>
      {if $order.carrier.name}
        <div><dt>{l s='Livraison' d='Shop.Theme.Odys'}</dt><dd>{$order.carrier.name}{if $order.carrier.delay} · {$order.carrier.delay}{/if}</dd></div>
      {/if}
      {if $order.addresses.delivery}
        <div><dt>{l s='Adresse' d='Shop.Theme.Odys'}</dt>
          <dd><address class="odys-order-address">{$order.addresses.delivery.formatted nofilter}</address></dd></div>
      {/if}
    </dl>

    {assign var='odysCodNote' value=Configuration::get('ODYS_COD_NOTE')}
    {if $odysCodNote}
      <p class="odys-cod-note">{$odysCodNote|escape:'html':'UTF-8'}</p>
    {/if}

    {* PS_MAIL_METHOD 2 is SMTP — a shop that has actually been configured to
       send. Method 1 is PHP mail(), which on a host with no mail transport
       fails silently, and promising an e-mail that never lands is worse than
       promising nothing. *}
    {if Configuration::get('PS_MAIL_METHOD') == 2}
      <p class="odys-order-note">
        Un e-mail de confirmation part vers {$order.details.email|default:''|escape:'html':'UTF-8'}.
      </p>
    {/if}
  </section>

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
            <div class="odys-order-line-qty">{l s='Quantité %nombre% × %prix%' sprintf=['%nombre%' => $product.quantity, '%prix%' => $product.price] d='Shop.Theme.Odys'}</div>
          </div>
          <div class="odys-order-line-total">{$product.total}</div>
        </li>
      {/foreach}
    </ul>
    <dl class="odys-order-totals">
      {foreach from=$order.subtotals item=subtotal}
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
      <a class="btn-p" href="{$odysUrlParfums}">{l s='Continuer mes achats' d='Shop.Theme.Odys'}</a>
    </div>
  </section>

  <section class="odys-order-help">
    <h2 class="odys-order-h2">{l s='Une question sur cette commande ?' d='Shop.Theme.Odys'}</h2>
    <p>{l s='Indiquez la référence' d='Shop.Theme.Odys'} <strong>{$order.details.reference}</strong>{l s=', nous retrouvons le colis tout de suite.' d='Shop.Theme.Odys'}</p>
    {* La reference part avec le message. Sans elle, « indiquez la
       reference » demandait au client de recopier neuf caracteres a la
       main, depuis une page qu'il doit quitter pour ouvrir WhatsApp.
       Elle lui sert aussi de trace ecrite, horodatee dans sa propre
       conversation : avec le paiement a la livraison et un serveur de
       courrier qui n'envoie rien, c'est le seul recu qu'il aura. *}
    {include file='_partials/contact-links.tpl'
             subject="Bonjour ODYS, ma commande `$order.details.reference`."}
  </section>

  {$HOOK_ORDER_CONFIRMATION nofilter}
  {$HOOK_PAYMENT_RETURN nofilter}
</div>
{/block}
