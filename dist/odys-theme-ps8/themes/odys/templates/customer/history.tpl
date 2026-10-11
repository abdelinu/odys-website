{**
 * Mes commandes.
 *
 * The previous version read $order.reference, $order.date_add, $order.total_paid
 * and $order.details_url. HistoryController hands each row to the *order
 * presenter*, which has none of those keys - and a lazy array returns [] for a
 * key it does not know, so every row printed "Array" and every "Voir" button
 * linked to href="Array". The keys below are the presenter's own.
 *}
{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Mes Commandes | ODYS Parfums{/block}
{block name='content'}
<div class="odys-order">
  <div class="odys-order-top">
    <a class="odys-order-back" href="{$urls.pages.my_account}">← Mon compte</a>
    <div class="odys-order-eyebrow">Espace client</div>
    <h1 class="odys-order-ref odys-order-ref--page">Mes commandes</h1>
  </div>

  {if $orders}
    <ul class="odys-hist">
      {foreach from=$orders item=order}
{* products_count counts order lines; two bottles of one perfume are
   two articles as far as the customer is concerned *}
{assign var='odysUnits' value=0}
{foreach from=$order.products item=line}{assign var='odysUnits' value=$odysUnits+$line.quantity}{/foreach}
        <li class="odys-hist-row">
          <a class="odys-hist-link" href="{$order.details.details_url}">
            <div class="odys-hist-main">
              <div class="odys-hist-ref">{$order.details.reference}</div>
              <div class="odys-hist-meta">
                {$order.details.order_date}
                · {$odysUnits} article{if $odysUnits > 1}s{/if}
                · {$order.totals.total.value}
              </div>
            </div>
            {include file='_partials/order-tracking.tpl' compact=true}
            <span class="odys-hist-go" aria-hidden="true">→</span>
          </a>
        </li>
      {/foreach}
    </ul>
    <p class="odys-hist-foot">
      Pas de compte à portée de main ? <a href="{$urls.pages.guest_tracking}">Suivez une commande avec sa référence</a>.
    </p>
  {else}
    <div class="odys-hist-empty">
      <p class="odys-hist-empty-title">Aucune commande pour le moment</p>
      <p class="odys-order-note">Votre première commande vous rapporte un point par 100 DH.</p>
      <a href="{$odysUrlParfums}" class="btn-p">Découvrir la collection →</a>
    </div>
  {/if}
</div>
{/block}
