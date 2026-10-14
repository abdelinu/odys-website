{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Recherche{if isset($searchQuery)} : {$searchQuery|escape:'html':'UTF-8'}{/if} | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:1280px;margin:0 auto;padding:48px max(20px,calc(52px + var(--safe-l))) 80px">
  <h1 style="font-family:var(--serif);font-size:28px;font-weight:500;margin-bottom:20px">
    {if isset($searchQuery) && $searchQuery}Résultats pour « {$searchQuery|escape:'html':'UTF-8'} »{else}Rechercher{/if}
  </h1>
  <form action="{$urls.pages.search}" method="get" style="display:flex;gap:10px;max-width:500px;margin-bottom:36px">
    <input type="text" name="s" value="{if isset($searchQuery)}{$searchQuery|escape:'html':'UTF-8'}{/if}"
           placeholder="{l s='Parfum, note olfactive, inspiration...' d='Shop.Theme.Odys'}" autocomplete="off"
           required minlength="2" maxlength="64" inputmode="search" aria-label="{l s='Votre recherche' d='Shop.Theme.Odys'}"
           style="flex:1;padding:12px 16px;border:1px solid var(--border);border-radius:2px;font-size:13px;outline:none"/>
    <button type="submit" class="btn-p" style="padding:12px 20px">{l s='Rechercher' d='Shop.Theme.Odys'}</button>
  </form>
  {if isset($listing.products) && $listing.products}
    <div class="pg" id="collGrid">
      {foreach from=$listing.products item=product}
        {include file='catalog/_partials/miniatures/product.tpl' product=$product}
      {/foreach}
    </div>
  {elseif isset($searchQuery) && $searchQuery}
    <div style="text-align:center;padding:60px 20px;color:var(--mid)">
      <div style="font-size:48px;margin-bottom:16px">🔍</div>
      <p style="font-size:16px;margin-bottom:24px">Aucun résultat pour « {$searchQuery|escape:'html':'UTF-8'} »</p>
      <a href="{$odysUrlParfums}" class="btn-p">{l s='Voir tous les parfums →' d='Shop.Theme.Odys'}</a>
    </div>
  {/if}
</div>
{/block}
