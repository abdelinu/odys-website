{extends file='layouts/layout-full-width.tpl'}
{* $listing.label is the meta label PrestaShop builds — "Catégorie : Homme".
   The visitor came for Homme. Fall back to the label for listings that have
   no category of their own (search, best sellers). *}
{assign var='odysListTitle' value=$listing.label}
{if isset($category.name) && $category.name}{assign var='odysListTitle' value=$category.name}{/if}
{block name='head_title'}{$odysListTitle|escape:'html':'UTF-8'} | ODYS Parfums Maroc{/block}
{block name='content'}
<div class="bc"><a href="{$urls.base_url}">{l s='Accueil' d='Shop.Theme.Odys'}</a><span class="sep">›</span><b>{$odysListTitle|escape:'html':'UTF-8'}</b></div>
<section class="bsec">
  <div style="max-width:1280px;margin:0 auto">
    <div class="sec-hd">
      <div class="sec-hd-left"><p>{l s='✦ ODYS · odys.ma' d='Shop.Theme.Odys'}</p><h1>{$odysListTitle|escape:'html':'UTF-8'}</h1></div>
      <div class="fam-filters">
        <button class="ff on" data-action="filter-fam" data-fam="all">{l s='Tout' d='Shop.Theme.Odys'}</button>
        <button class="ff"    data-action="filter-fam" data-fam="fresh">{l s='🌊 Frais' d='Shop.Theme.Odys'}</button>
        <button class="ff"    data-action="filter-fam" data-fam="oriental">{l s='🌙 Oriental' d='Shop.Theme.Odys'}</button>
        <button class="ff"    data-action="filter-fam" data-fam="sweet">{l s='🍯 Sucré' d='Shop.Theme.Odys'}</button>
        <button class="ff oud" data-action="filter-fam" data-fam="oud">{l s='🪵 Oud' d='Shop.Theme.Odys'}</button>
      </div>
      {* the family buttons narrow, this orders - classic's control, kept so
         the switch to the theme's own listing takes nothing away *}
      {if isset($listing.sort_orders) && $listing.sort_orders|@count > 1}
        <div class="sec-hd-sort">
          {include file='catalog/_partials/sort-orders.tpl' sort_orders=$listing.sort_orders}
        </div>
      {/if}
    </div>
    <div class="pg" id="collGrid">
      {foreach from=$listing.products item=product}
        {include file='catalog/_partials/miniatures/product.tpl' product=$product}
      {foreachelse}
        <div style="grid-column:1/-1;text-align:center;padding:80px 20px;color:var(--mid)">
          <div style="font-size:48px;margin-bottom:16px">🌹</div>
          <p>{l s='Aucun produit dans cette catégorie.' d='Shop.Theme.Odys'}</p>
        </div>
      {/foreach}
    </div>
    {* PrestaShop's pagination has no total_pages - it publishes pages_count and
       should_be_displayed. Reading the wrong key printed an "Undefined array
       key" warning into every category page. *}
    {if isset($listing.pagination.should_be_displayed) && $listing.pagination.should_be_displayed}
    <nav class="pagination" aria-label="{l s='Pagination' d='Shop.Theme.Odys'}" style="display:flex;justify-content:center;gap:8px;margin-top:40px">
      {foreach from=$listing.pagination.pages item=page}
        <a href="{$page.url}" class="pg-btn {if $page.current}on{/if}" aria-current="{if $page.current}page{/if}">{$page.page}</a>
      {/foreach}
    </nav>
    {/if}
  </div>
</section>
{/block}
