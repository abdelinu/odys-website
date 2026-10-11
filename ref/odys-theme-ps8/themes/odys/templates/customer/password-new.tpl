{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Nouveau mot de passe | ODYS Parfums{/block}
{* Meme remarque que password-email.tpl : la grille de classic n'existe pas ici. *}
{block name='content'}
<div style="max-width:480px;margin:0 auto;padding:64px max(20px,32px) 80px">
  <div style="text-align:center;margin-bottom:36px">
    <div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:10px">Espace Client</div>
    <h1 style="font-family:var(--serif);font-size:30px;font-weight:500">Nouveau mot de passe</h1>
  </div>
  <div style="background:var(--odys-surface);border:1px solid var(--border);border-radius:4px;padding:28px">
    <form action="{$urls.pages.password}" method="post">
      {foreach from=$errors item=erreur}
        <div class="cf-err">{$erreur}</div>
      {/foreach}
      <p style="font-size:12px;line-height:1.8;color:var(--mid);margin-bottom:20px">
        Compte&nbsp;: <strong style="color:var(--ink)">{$customer_email|stripslashes|escape:'html':'UTF-8'}</strong>
      </p>
      <div class="cf" style="margin-bottom:14px">
        <label for="passwd">Nouveau mot de passe *</label>
        <input type="password" id="passwd" name="passwd" required autocomplete="new-password"
               data-validate="isPasswd"
               {if isset($configuration.password_policy.minimum_length)}data-minlength="{$configuration.password_policy.minimum_length}"{/if}
               {if isset($configuration.password_policy.maximum_length)}data-maxlength="{$configuration.password_policy.maximum_length}"{/if}
               {if isset($configuration.password_policy.minimum_score)}data-minscore="{$configuration.password_policy.minimum_score}"{/if}
               placeholder="••••••••"/>
      </div>
      <div class="cf" style="margin-bottom:20px">
        <label for="confirmation">Confirmation *</label>
        <input type="password" id="confirmation" name="confirmation" required autocomplete="new-password"
               data-validate="isPasswd" placeholder="••••••••"/>
      </div>
      <input type="hidden" name="token" id="token" value="{$customer_token}"/>
      <input type="hidden" name="id_customer" id="id_customer" value="{$id_customer}"/>
      <input type="hidden" name="reset_token" id="reset_token" value="{$reset_token}"/>
      <button type="submit" name="submit" class="btn-p" style="width:100%;justify-content:center;padding:14px">
        Changer le mot de passe →
      </button>
    </form>
  </div>
  <div style="margin-top:18px;text-align:center;font-size:12px;color:var(--mid)">
    <a href="{$urls.pages.authentication}" style="color:var(--rose-deep)">← Retour à la connexion</a>
  </div>
</div>
{/block}
