{extends file='page.tpl'}

{block name='page_title'}{l s='Mes points ODYS' d='Shop.Theme.Odys'}{/block}

{block name='page_content'}
<div class="odys-rewards">

  <div class="orw-head">
    <div class="orw-bal">
      <span class="orw-n">{$odys_points|intval}</span>
      <span class="orw-u">{if $odys_points == 1}{l s='point' d='Shop.Theme.Odys'}{else}{l s='points' d='Shop.Theme.Odys'}{/if}</span>
    </div>
    <div class="orw-meta">
      <div class="orw-tier">{$odys_tier|escape:'html':'UTF-8'}</div>
      {if $odys_expires_on}
        <div class="orw-exp">{l s='Valables jusqu\'au %date% — un achat remet le compteur à zéro.' sprintf=['%date%' => $odys_expires_on|escape:'html':'UTF-8'] d='Shop.Theme.Odys'}</div>
      {/if}
    </div>
  </div>

  {if $odys_error}
    <p class="orw-msg orw-err" role="alert">{$odys_error|escape:'html':'UTF-8'}</p>
  {/if}
  {if $odys_notice}
    <div class="orw-msg orw-ok" role="status">
      <strong>{$odys_notice.label|escape:'html':'UTF-8'}</strong> {l s='— votre code&nbsp;:' d='Shop.Theme.Odys'}
      <code class="orw-code">{$odys_notice.code|escape:'html':'UTF-8'}</code>
      <span>{l s='Saisissez-le dans votre panier. Valable %mois% mois, une seule fois, une seule récompense par commande.' sprintf=['%mois%' => $odys_voucher_months|intval] d='Shop.Theme.Odys'}</span>
    </div>
  {/if}

  <h2 class="orw-h2">{l s='Les récompenses' d='Shop.Theme.Odys'}</h2>
  {if !$odys_can_redeem}
    <p class="orw-wait">{l s='Les récompenses s\'ouvrent à partir de %seuil% points — encore %reste% à cumuler.' sprintf=['%seuil%' => $odys_min|intval, '%reste%' => $odys_min - $odys_points|intval] d='Shop.Theme.Odys'}</p>
  {/if}

  <div class="orw-form">
    {foreach from=$odys_rewards item=reward}
      {* each reward is its own form: the choices posted belong to the reward
         asked for, and a locked one cannot be submitted at all *}
      <form method="post" class="orw-card{if !$reward.affordable} is-locked{/if}">
        <input type="hidden" name="token" value="{$odys_token|escape:'html':'UTF-8'}">
        <input type="hidden" name="odys_redeem" value="1">

        <div class="orw-cost">{$reward.cost|intval} <span>pts</span></div>
        <h3 class="orw-name">{$reward.label|escape:'html':'UTF-8'}</h3>

        {if $reward.key == 'oud'}
          <p class="orw-note">{l s='Une remise de %montant% DH, la valeur de 5&nbsp;g de notre oud d\'entrée de gamme.' sprintf=['%montant%' => $reward.value|string_format:"%.0f"] d='Shop.Theme.Odys'}</p>
        {else}
          {section name=slot loop=$reward.count step=1 start=0}
            {assign var='slot' value=$smarty.section.slot.index + 1}
            <label class="orw-lbl" for="pick-{$reward.key}-{$slot}">
              {if $reward.count > 1}{l s='Choix %rang%' sprintf=['%rang%' => $slot] d='Shop.Theme.Odys'}{else}{l s='Votre choix' d='Shop.Theme.Odys'}{/if}
            </label>
            <select id="pick-{$reward.key}-{$slot}" name="pick_{$reward.key}_{$slot}"
                    {if !$reward.affordable}disabled{/if} required>
              {foreach from=$reward.choices item=choice}
                <option value="{$choice.id_product|intval}">{$choice.name|escape:'html':'UTF-8'}</option>
              {/foreach}
            </select>
          {/section}
          {if !$reward.choices}
            <p class="orw-note">{l s='Aucun article en stock pour cette récompense.' d='Shop.Theme.Odys'}</p>
          {/if}
        {/if}

        <button type="submit" name="reward" value="{$reward.key|escape:'html':'UTF-8'}" class="orw-btn"
                {if !$reward.affordable || ($reward.key != 'oud' && !$reward.choices) || ($reward.key == 'oud' && $reward.value <= 0)}disabled{/if}>
          {if $reward.affordable}{l s='Échanger %nombre% points' sprintf=['%nombre%' => $reward.cost|intval] d='Shop.Theme.Odys'}{else}{l s='Encore %nombre% pts' sprintf=['%nombre%' => $reward.cost - $odys_points|intval] d='Shop.Theme.Odys'}{/if}
        </button>
      </form>
    {/foreach}
  </div>

  <h2 class="orw-h2">{l s='Votre historique' d='Shop.Theme.Odys'}</h2>
  {if $odys_ledger}
  <table class="orw-table">
    <caption class="sr-only">{l s='Mouvements de points' d='Shop.Theme.Odys'}</caption>
    <thead><tr><th scope="col">{l s='Date' d='Shop.Theme.Odys'}</th><th scope="col">{l s='Motif' d='Shop.Theme.Odys'}</th><th scope="col">{l s='Points' d='Shop.Theme.Odys'}</th></tr></thead>
    <tbody>
      {foreach from=$odys_ledger item=row}
        <tr>
          <td>{$row.date_add|date_format:'%d/%m/%Y'}</td>
          <td>{$row.label|escape:'html':'UTF-8'}</td>
          <td class="orw-pts {if $row.points < 0}is-out{/if}">{if $row.points > 0}+{/if}{$row.points|intval}</td>
        </tr>
      {/foreach}
    </tbody>
  </table>
  {else}
    <p class="orw-wait">{l s='Aucun mouvement pour l\'instant.' d='Shop.Theme.Odys'}</p>
  {/if}

  <p class="orw-rules">
    <a href="{$urls.base_url}fidelite">{l s='Les règles du programme' d='Shop.Theme.Odys'}</a>
  </p>
</div>
{/block}
