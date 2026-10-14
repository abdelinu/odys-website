{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Mot de passe | ODYS Parfums{/block}
{*
 * La confirmation. Classic y pose un <svg viewBox="0 0 24 24"> SANS largeur ni
 * hauteur : sans la feuille de classic pour le borner, le navigateur l'etire a
 * toute la largeur du bloc — d'ou la coche geante en travers de la page. Ici il
 * est dimensionne.
 *}
{block name='content'}
<div style="max-width:480px;margin:0 auto;padding:64px max(20px,32px) 80px;text-align:center">
  <div style="width:48px;height:48px;margin:0 auto 22px;border-radius:50%;
              border:1px solid var(--rose-deep);display:flex;align-items:center;justify-content:center">
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false">
      <path fill="currentColor" style="color:var(--rose-deep)" d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z"/>
    </svg>
  </div>
  <h1 style="font-family:var(--serif);font-size:26px;font-weight:500;margin-bottom:14px">{l s='C\'est envoyé.' d='Shop.Theme.Odys'}</h1>
  {foreach from=$successes item=message}
    <p style="font-size:13px;line-height:1.8;color:var(--mid);margin-bottom:8px">{$message}</p>
  {/foreach}
  <p style="font-size:12px;line-height:1.8;color:var(--mid);margin-top:16px">
    {l s='Le lien est valable un temps limité. Pensez à regarder vos indésirables.' d='Shop.Theme.Odys'}
  </p>
  {* « C'est envoye » est une promesse. Si le courrier ne part pas — mail()
     sans SMTP echoue sans un mot — le client attend devant une page qui
     lui a dit que tout allait bien. On lui laisse une porte. *}
  <div style="margin-top:24px">
    <p style="font-size:12px;line-height:1.8;color:var(--mid);margin-bottom:10px">
      {l s='Toujours rien après quelques minutes&nbsp;? Écrivez-nous.' d='Shop.Theme.Odys'}
    </p>
    {include file='_partials/contact-links.tpl' style='inline'
             subject="Bonjour ODYS, je n'ai pas recu le lien de mot de passe."}
  </div>

  <div style="margin-top:26px;font-size:12px">
    <a href="{$urls.pages.authentication}" style="color:var(--rose-deep)">{l s='← Retour à la connexion' d='Shop.Theme.Odys'}</a>
  </div>
</div>
{/block}
