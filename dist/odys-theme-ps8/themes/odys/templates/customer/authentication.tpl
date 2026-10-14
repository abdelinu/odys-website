{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Connexion | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:480px;margin:0 auto;padding:64px max(20px,32px) 80px">
  <div style="text-align:center;margin-bottom:36px">
    <div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:10px">{l s='Espace Client' d='Shop.Theme.Odys'}</div>
    <h1 style="font-family:var(--serif);font-size:30px;font-weight:500">{l s='Connexion' d='Shop.Theme.Odys'}</h1>
  </div>
  <div style="background:var(--odys-surface);border:1px solid var(--border);border-radius:4px;padding:28px">
    {hook h='displayCustomerLoginFormAfter'}
    {block name='login_form_container'}
    {render file='customer/_partials/login-form.tpl' ui=$login_form}
    {/block}
  </div>
  <div style="margin-top:18px;text-align:center;font-size:12px;color:var(--mid)">{l s='Pas encore de compte ?' d='Shop.Theme.Odys'} <a href="{$urls.pages.register}" style="color:var(--rose-deep);font-weight:700">{l s='Créer un compte · +2 pts ⭐' d='Shop.Theme.Odys'}</a></div>
  <div style="margin-top:24px;background:linear-gradient(135deg,var(--navy),#16303F);border-radius:3px;padding:18px;text-align:center">
    <div style="font-size:20px;margin-bottom:8px">⭐</div>
    <div style="font-size:12px;font-weight:700;color:#fff;margin-bottom:4px">{l s='Programme Fidélité ODYS' d='Shop.Theme.Odys'}</div>
    <div style="font-size:11px;color:rgba(255,255,255,.64);line-height:1.7">{l s='+2 points à l\'inscription · 1 pt = 100 DH' d='Shop.Theme.Odys'}<br>{l s='10 pts → un parfum offert · 20 pts → un coffret' d='Shop.Theme.Odys'}</div>
  </div>
</div>
{/block}
