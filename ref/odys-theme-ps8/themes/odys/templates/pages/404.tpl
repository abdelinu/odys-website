{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Page introuvable | ODYS Parfums{/block}
{block name='content'}
<div style="min-height:70vh;display:flex;align-items:center;justify-content:center;padding:60px 20px;text-align:center">
  <div style="max-width:480px">
    <div style="font-family:var(--serif);font-size:110px;font-weight:500;color:var(--rose);line-height:1;margin-bottom:16px">404</div>
    <h1 style="font-family:var(--serif);font-size:28px;font-weight:500;margin-bottom:12px">{l s='Page introuvable' d='Shop.Theme.Odys'}</h1>
    <p style="color:var(--mid);font-size:14px;margin-bottom:32px;line-height:1.8">{l s='La page que vous recherchez n\'existe pas ou a été déplacée.' d='Shop.Theme.Odys'}</p>
    <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap">
      <a href="{$urls.base_url}" class="btn-p">{l s='← Accueil' d='Shop.Theme.Odys'}</a>
      <a href="{$urls.pages.category}" class="btn-g">{l s='Voir la collection' d='Shop.Theme.Odys'}</a>
    </div>
  </div>
</div>
{/block}
