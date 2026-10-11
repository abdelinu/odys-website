{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}{$cms.meta_title|default:$cms.name|escape:'html':'UTF-8'} | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:780px;margin:0 auto;padding:64px max(20px,32px) 80px">
  <h1 style="font-family:var(--serif);font-size:32px;font-weight:500;margin-bottom:28px">{$cms.name|escape:'html':'UTF-8'}</h1>
  <div style="font-size:14px;line-height:1.9;color:var(--ink)">{$cms.content}</div>
</div>
{/block}
