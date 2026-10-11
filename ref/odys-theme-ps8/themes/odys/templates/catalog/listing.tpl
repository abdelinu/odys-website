{extends file='layouts/layout-full-width.tpl'}
{* $listing.label is the meta label PrestaShop builds — "Catégorie : Homme".
   The visitor came for Homme. Fall back to the label for listings that have
   no category of their own (search, best sellers). *}
{assign var='odysListTitle' value=$listing.label}
{if isset($category.name) && $category.name}{assign var='odysListTitle' value=$category.name}{/if}
{block name='head_title'}{$odysListTitle|escape:'html':'UTF-8'} | ODYS Parfums Maroc{/block}
{block name='content'}
<div class="bc"><a href="{$urls.base_url}">Accueil</a><span class="sep">›</span><b>{$odysListTitle|escape:'html':'UTF-8'}</b></div>
<section class="bsec">
  <div style="max-width:1280px;margin:0 auto">
    <div class="sec-hd">
      <div class="sec-hd-left"><p>✦ ODYS · odys.ma</p><h1>{$odysListTitle|escape:'html':'UTF-8'}</h1></div>
      <div class="fam-filters">
        <button class="ff on" data-action="filter-fam" data-fam="all">Tout</button>
        <button class="ff"    data-action="filter-fam" data-fam="fresh">🌊 Frais</button>
        <button class="ff"    data-action="filter-fam" data-fam="oriental">🌙 Oriental</button>
        <button class="ff"    data-action="filter-fam" data-fam="sweet">🍯 Sucré</button>
        <button class="ff oud" data-action="filter-fam" data-fam="oud">🪵 Oud</button>
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
          <p>Aucun produit dans cette catégorie.</p>
        </div>
      {/foreach}
    </div>
    {* PrestaShop's pagination has no total_pages - it publishes pages_count and
       should_be_displayed. Reading the wrong key printed an "Undefined array
       key" warning into every category page. *}
    {if isset($listing.pagination.should_be_displayed) && $listing.pagination.should_be_displayed}
    <nav class="pagination" aria-label="Pagination" style="display:flex;justify-content:center;gap:8px;margin-top:40px">
      {foreach from=$listing.pagination.pages item=page}
        <a href="{$page.url}" class="pg-btn {if $page.current}on{/if}" aria-current="{if $page.current}page{/if}">{$page.page}</a>
      {/foreach}
    </nav>
    {/if}
  </div>
</section>
{/block}
