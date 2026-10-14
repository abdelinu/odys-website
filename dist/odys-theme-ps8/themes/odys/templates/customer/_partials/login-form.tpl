{* Le formulaire de connexion ODYS. Pose ici et non dans authentication.tpl
   parce que c'est le gabarit du formulaire qui recoit $errors et $action. *}
<form action="{$action}" method="post">
  {* Un mot de passe faux renvoyait la page sans un mot d'explication.
 $errors vient de getTemplateVariables() : [champ => [messages]], la cle
 vide portant les erreurs generales comme « Echec de l'authentification ». *}
  {foreach from=$errors item=messages}
{foreach from=$messages item=message}
  <div class="cf-err">{$message}</div>
{/foreach}
  {/foreach}
  <div class="cf" style="margin-bottom:14px"><label for="field-email">{l s='Email ou téléphone *' d='Shop.Theme.Odys'}</label><input type="text" id="field-email" name="email" required maxlength="100" autocomplete="username" placeholder="{l s='votre@email.ma ou 0612345678' d='Shop.Theme.Odys'}"/></div>
  <div class="cf" style="margin-bottom:20px"><label for="field-password">{l s='Mot de passe *' d='Shop.Theme.Odys'}</label><input type="password" id="field-password" name="password" required maxlength="100" autocomplete="current-password" placeholder="••••••••"/></div>
  <input type="hidden" name="token" value="{$token}"/>
  <input type="hidden" name="back"  value="{if isset($back)}{$back|escape:'html':'UTF-8'}{/if}"/>
  <button type="submit" id="submit-login" name="submitLogin" value="1" class="btn-p" style="width:100%;justify-content:center;padding:14px">{l s='Se connecter →' d='Shop.Theme.Odys'}</button>

  {* Ces deux blocs vivent ici et non dans authentication.tpl parce que le
     tunnel de commande n'affiche pas authentication.tpl : son etape
     « Informations personnelles » rend ce partial, qu'elle herite par
     {extends}. Un client qui a oublie son mot de passe au moment de payer
     n'avait aucune issue : il abandonnait son panier. *}
  <div class="lf-oubli"><a href="{$urls.pages.password}">{l s='Mot de passe oublié ?' d='Shop.Theme.Odys'}</a></div>

  {* Meme precaution que sur la page d'inscription : si le module social
     n'est pas installe, le hook ne rend rien et le bloc entier disparait,
     plutot que de laisser un separateur « ou » au-dessus du vide. *}
  {capture name='odysSocialLogin'}{hook h='displayWebsourceSocialLogin' place='login'}{/capture}
  {if trim($smarty.capture.odysSocialLogin)}
    <div class="odys-social-login">{$smarty.capture.odysSocialLogin nofilter}</div>
  {/if}
</form>
