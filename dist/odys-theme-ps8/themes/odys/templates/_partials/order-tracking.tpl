{**
 * The tracking timeline. Include with $order (the order presenter); pass
 * compact=true for the one-line version used in the order list.
 *
 * The step reached is taken from the order's *history*, not from its current
 * state alone: an order can be put back to "en préparation" after a failed
 * delivery attempt, and the steps it really passed through are still true.
 *
 * A cancelled, refunded or failed order gets a terminal panel instead of a
 * progress bar - drawing three quarters of a bar for an order that will never
 * arrive is a lie the customer service desk pays for.
 *
 * $order.history arrives newest first. Nothing here calls a PHP function:
 * Smarty's security policy is not the place to find out at render time. The
 * state ids come from $odysOrderSteps / $odysOrderFailed, which odys_loyalty
 * builds from Configuration - a shop that renames a state keeps a true timeline.
 *}
{assign var='odysStep' value=0}
{assign var='odysFailed' value=false}
{assign var='odysFailedLabel' value=''}
{assign var='odysFailedDate' value=''}

{foreach from=$order.history item=h}
  {if isset($odysOrderFailed[$h.id_order_state])}
    {if !$odysFailed}
      {assign var='odysFailed' value=true}
      {assign var='odysFailedLabel' value=$h.ostate_name}
      {assign var='odysFailedDate' value=$h.history_date}
    {/if}
  {elseif isset($odysOrderSteps[$h.id_order_state]) && $odysOrderSteps[$h.id_order_state] > $odysStep}
    {assign var='odysStep' value=$odysOrderSteps[$h.id_order_state]}
  {/if}
{/foreach}
{if $odysStep < 1}{assign var='odysStep' value=1}{/if}

{assign var='odysSteps' value=[
  ['label' => "{l s='Commande reçue' d='Shop.Theme.Odys'}",
   'hint' => "{l s='Nous avons votre commande' d='Shop.Theme.Odys'}"],
  ['label' => "{l s='En préparation' d='Shop.Theme.Odys'}",
   'hint' => "{l s='Votre flacon est emballé à la main' d='Shop.Theme.Odys'}"],
  ['label' => "{l s='Expédiée' d='Shop.Theme.Odys'}",
   'hint' => "{l s='En route vers vous' d='Shop.Theme.Odys'}"],
  ['label' => "{l s='Livrée' d='Shop.Theme.Odys'}",
   'hint' => "{l s='Bonne découverte' d='Shop.Theme.Odys'}"]
]}

{if isset($compact) && $compact}

  {* the order list: enough to see where a parcel is without opening it *}
  <div class="odys-mini{if $odysFailed} odys-mini--stopped{/if}">
    <span class="odys-mini-label">
      {if $odysFailed}{$odysFailedLabel}{else}{$odysSteps[$odysStep-1]['label']}{/if}
    </span>
    {if !$odysFailed}
      <span class="odys-mini-dots" role="img"
            aria-label="{l s='Étape %rang% sur 4 : %etape%' sprintf=['%rang%' => $odysStep, '%etape%' => $odysSteps[$odysStep-1]['label']] d='Shop.Theme.Odys'}">
        {section name=d loop=4}
          {assign var='n' value=$smarty.section.d.index+1}
          <i class="{if $n < $odysStep}is-done{elseif $n == $odysStep}is-now{/if}"></i>
        {/section}
      </span>
    {/if}
  </div>

{else}

<section class="odys-track{if $odysFailed} odys-track--stopped{/if}" aria-label="{l s='Suivi de la commande' d='Shop.Theme.Odys'}">

  {if $odysFailed}
    <div class="odys-track-stop" role="status">
      <span class="odys-track-stop-dot" aria-hidden="true"></span>
      <div>
        <div class="odys-track-stop-label">{$odysFailedLabel}</div>
        <div class="odys-track-stop-date">{$odysFailedDate}</div>
        <p class="odys-track-stop-help">
          {l s='Cette commande n\'est plus en cours de livraison.
          Une question&nbsp;? Écrivez-nous, nous reprenons le dossier avec vous.' d='Shop.Theme.Odys'}
        </p>
      </div>
    </div>
  {else}
    <div class="odys-track-head">
      <div>
        <div class="odys-track-eyebrow">{l s='Étape %rang% sur 4' sprintf=['%rang%' => $odysStep] d='Shop.Theme.Odys'}</div>
        <div class="odys-track-now">{$odysSteps[$odysStep-1]['label']}</div>
      </div>
      {if $order.carrier.name}
        <div class="odys-track-carrier">
          <span>{l s='Transporteur' d='Shop.Theme.Odys'}</span>
          <strong>{$order.carrier.name}</strong>
        </div>
      {/if}
    </div>

    <ol class="odys-track-rail">
      {foreach from=$odysSteps item=step name=st}
        {assign var='n' value=$smarty.foreach.st.iteration}
        {* the oldest history row for this step wins, so the date shown is when
           the step was reached and not the last time it was touched *}
        {* an order paid on delivery is created straight in "en préparation",
           so step 1 has no history row of its own - it happened when the
           order did *}
        {assign var='dt' value=''}
        {if $n == 1}{assign var='dt' value=$order.details.order_date}{/if}
        {foreach from=$order.history item=h}
          {if isset($odysOrderSteps[$h.id_order_state]) && $odysOrderSteps[$h.id_order_state] == $n}
            {assign var='dt' value=$h.history_date}
          {/if}
        {/foreach}
        <li class="odys-track-step{if $n < $odysStep} is-done{elseif $n == $odysStep} is-now{/if}"
            {if $n == $odysStep}aria-current="step"{/if}>
          <span class="odys-track-dot" aria-hidden="true"></span>
          <span class="odys-track-label">{$step['label']}</span>
          <span class="odys-track-meta">
            {if $dt}{$dt}{elseif $n == $odysStep}{$step['hint']}{else}—{/if}
          </span>
        </li>
      {/foreach}
    </ol>
  {/if}

  {* the carrier's own tracking number, when the shop has entered one *}
  {foreach from=$order.shipping item=line}
    {if $line.tracking && $line.tracking != '-'}
      <div class="odys-track-number">
        <span>{l s='Numéro de suivi' d='Shop.Theme.Odys'}</span>
        <strong>{$line.tracking nofilter}</strong>
      </div>
    {/if}
  {/foreach}
  {if $order.follow_up}
    <a class="odys-track-followup" href="{$order.follow_up}" target="_blank" rel="noopener">
      {l s='Suivre le colis chez le transporteur →' d='Shop.Theme.Odys'}
    </a>
  {/if}
</section>

{/if}
