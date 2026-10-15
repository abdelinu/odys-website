{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}{l s='Mot de passe oublié | ODYS Parfums' d='Shop.Theme.Odys'}{/block}
{*
 * Les gabarits de mot de passe de PrestaShop sont ecrits pour la grille
 * Bootstrap de classic (col-md-3, card card-block, hidden-xs-down) que ce
 * theme n'embarque pas : les champs partaient sur toute la largeur de l'ecran
 * et les libelles tombaient hors cadre. Celui-ci reprend la mise en page de la
 * page de connexion — une colonne de 480 px, centree.
 *}
{block name='content'}
<div style="max-width:480px;margin:0 auto;padding:64px max(20px,32px) 80px">
  <div style="text-align:center;margin-bottom:36px">
    <div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:10px">{l s='Espace Client' d='Shop.Theme.Odys'}</div>
    <h1 style="font-family:var(--serif);font-size:30px;font-weight:500">{l s='Mot de passe oublié' d='Shop.Theme.Odys'}</h1>
  </div>
  <div style="background:var(--odys-surface);border:1px solid var(--border);border-radius:4px;padding:28px">
    <form action="{$urls.pages.password}" method="post">
      {foreach from=$errors item=erreur}
        <div class="cf-err">{$erreur}</div>
      {/foreach}
      <p style="font-size:12px;line-height:1.8;color:var(--mid);margin-bottom:20px">
        {l s='Indiquez l\'adresse e-mail de votre compte. Vous recevrez un lien
        temporaire pour choisir un nouveau mot de passe.' d='Shop.Theme.Odys'}
      </p>
      <div class="cf" style="margin-bottom:20px">
        <label for="email">{l s='Adresse e-mail *' d='Shop.Theme.Odys'}</label>
        <input type="email" id="email" name="email" required maxlength="100" autocomplete="email"
               value="{if isset($smarty.post.email)}{$smarty.post.email|stripslashes|escape:'html':'UTF-8'}{/if}"
               placeholder="{l s='votre@email.ma' d='Shop.Theme.Odys'}"/>
      </div>
      <button type="submit" name="submit" class="btn-p" style="width:100%;justify-content:center;padding:14px">
        {l s='Envoyer le lien →' d='Shop.Theme.Odys'}
      </button>
    </form>
  </div>
  {* Une issue quand l'e-mail n'arrive pas.
     La boutique envoie par la fonction mail() de PHP, pas par SMTP : chez
     certains hebergeurs le courrier part sans bruit et n'arrive jamais. Ce
     lien est maintenant propose au moment de payer, dans le tunnel de
     commande — c'est le pire endroit ou laisser quelqu'un sans recours.
     Vraie quelle que soit la configuration, la ligne ne coute rien ; le
     bloc de contact ne s'affiche pas si aucun numero n'est renseigne. *}
  <div style="margin-top:22px;text-align:center">
    <p style="font-size:12px;line-height:1.8;color:var(--mid);margin-bottom:10px">
      {l s='Rien ne vous parvient&nbsp;? Écrivez-nous, nous rouvrons votre compte
      avec vous.' d='Shop.Theme.Odys'}
    </p>
    {include file='_partials/contact-links.tpl' style='inline'
             subject="Bonjour ODYS, je n'arrive pas à reinitialiser mon mot de passe."}
  </div>

  <div style="margin-top:18px;text-align:center;font-size:12px;color:var(--mid)">
    <a href="{$urls.pages.authentication}" style="color:var(--rose-deep)">{l s='← Retour à la connexion' d='Shop.Theme.Odys'}</a>
  </div>
</div>
{/block}
