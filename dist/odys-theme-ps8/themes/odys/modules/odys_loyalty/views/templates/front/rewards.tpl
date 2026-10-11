{extends file='page.tpl'}

{block name='page_title'}Mes points ODYS{/block}

{block name='page_content'}
<div class="odys-rewards">

  <div class="orw-head">
    <div class="orw-bal">
      <span class="orw-n">{$odys_points|intval}</span>
      <span class="orw-u">point{if $odys_points != 1}s{/if}</span>
    </div>
    <div class="orw-meta">
      <div class="orw-tier">{$odys_tier|escape:'html':'UTF-8'}</div>
      {if $odys_expires_on}
        <div class="orw-exp">Valables jusqu'au {$odys_expires_on|escape:'html':'UTF-8'} —
          un achat remet le compteur à zéro.</div>
      {/if}
    </div>
  </div>

  {if $odys_error}
    <p class="orw-msg orw-err" role="alert">{$odys_error|escape:'html':'UTF-8'}</p>
  {/if}
  {if $odys_notice}
    <div class="orw-msg orw-ok" role="status">
      <strong>{$odys_notice.label|escape:'html':'UTF-8'}</strong> — votre code&nbsp;:
      <code class="orw-code">{$odys_notice.code|escape:'html':'UTF-8'}</code>
      <span>Saisissez-le dans votre panier. Valable {$odys_voucher_months|intval} mois,
        une seule fois, une seule récompense par commande.</span>
    </div>
  {/if}

  <h2 class="orw-h2">Les récompenses</h2>
  {if !$odys_can_redeem}
    <p class="orw-wait">Les récompenses s'ouvrent à partir de {$odys_min|intval} points —
      encore {$odys_min - $odys_points|intval} à cumuler.</p>
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
          <p class="orw-note">Une remise de {$reward.value|string_format:"%.0f"} DH,
            la valeur de 5&nbsp;g de notre oud d'entrée de gamme.</p>
        {else}
          {section name=slot loop=$reward.count step=1 start=0}
            {assign var='slot' value=$smarty.section.slot.index + 1}
            <label class="orw-lbl" for="pick-{$reward.key}-{$slot}">
              {if $reward.count > 1}Choix {$slot}{else}Votre choix{/if}
            </label>
            <select id="pick-{$reward.key}-{$slot}" name="pick_{$reward.key}_{$slot}"
                    {if !$reward.affordable}disabled{/if} required>
              {foreach from=$reward.choices item=choice}
                <option value="{$choice.id_product|intval}">{$choice.name|escape:'html':'UTF-8'}</option>
              {/foreach}
            </select>
          {/section}
          {if !$reward.choices}
            <p class="orw-note">Aucun article en stock pour cette récompense.</p>
          {/if}
        {/if}

        <button type="submit" name="reward" value="{$reward.key|escape:'html':'UTF-8'}" class="orw-btn"
                {if !$reward.affordable || ($reward.key != 'oud' && !$reward.choices) || ($reward.key == 'oud' && $reward.value <= 0)}disabled{/if}>
          {if $reward.affordable}Échanger {$reward.cost|intval} points{else}Encore {$reward.cost - $odys_points|intval} pts{/if}
        </button>
      </form>
    {/foreach}
  </div>

  <h2 class="orw-h2">Votre historique</h2>
  {if $odys_ledger}
  <table class="orw-table">
    <caption class="sr-only">Mouvements de points</caption>
    <thead><tr><th scope="col">Date</th><th scope="col">Motif</th><th scope="col">Points</th></tr></thead>
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
    <p class="orw-wait">Aucun mouvement pour l'instant.</p>
  {/if}

  <p class="orw-rules">
    <a href="{$urls.base_url}fidelite">Les règles du programme</a>
  </p>
</div>
{/block}
