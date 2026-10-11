{extends file='layouts/layout-full-width.tpl'}
{* $listing.label is the meta label PrestaShop builds — "Catégorie : Homme".
   The visitor came for Homme. Listings with no category of their own (search,
   best sellers) keep the label. *}
{assign var='odysListTitle' value=$listing.label}
{if isset($category.name) && $category.name}{assign var='odysListTitle' value=$category.name}{/if}
{* a category that has been given its own meta title has been given it for a
   reason; the section name is only the fallback *}
{assign var='odysMetaTitle' value=$odysListTitle}
{if isset($category.meta_title) && $category.meta_title}{assign var='odysMetaTitle' value=$category.meta_title}{/if}
{block name='head_title'}{$odysMetaTitle|escape:'html':'UTF-8'} | ODYS Parfums Maroc{/block}

{block name='content'}
{* see layout-full-width.tpl: guard the array access behind the controller *}
{assign var='isOud' value=(isset($page.page_name) && $page.page_name == 'category' && isset($category.link_rewrite) && $category.link_rewrite == 'oud-boukhour')}

{if $isOud}
  {include file='_partials/oud-intro.tpl'}
{/if}

<nav aria-label="Fil d'Ariane">
  <ol class="bc">
    <li><a href="{$urls.base_url}">Accueil</a></li>
    <li class="sep" aria-hidden="true">›</li>
    <li aria-current="page"><b>{$odysListTitle|escape:'html':'UTF-8'}</b></li>
  </ol>
</nav>

<section class="bsec">
  <div>
    <div class="sec-hd"{if $isOud} hidden{/if}>
      <div class="sec-hd-left">
        <p>Collection ODYS</p>
        <h1>{$odysListTitle|escape:'html':'UTF-8'}</h1>
      </div>

    </div>

    {* ── La barre de collection ──────────────────────────────────────────
       Les deux groupes étaient dans la ligne de titre : la navigation entre
       sections flottait au milieu, sans point d'appui, et les familles
       étaient collées au bord droit. Ils sont maintenant sur leur propre
       ligne, alignés à gauche sous le titre, entre deux filets qui les
       lisent comme un seul bandeau.

       Trois défauts corrigés ici.

       1. Les sections n'étaient rendues que sur la catégorie parente, à
          partir de $subcategories. Une fois sur Homme, elles disparaissaient
          et il n'existait plus aucun chemin vers Femme. Elles sont
          construites à partir des catégories que l'import enregistre, donc
          présentes sur les quatre pages.

       2. Rien ne marquait la section courante, ni à l'œil ni pour un lecteur
          d'écran. aria-current="page" et une pastille dorée s'en chargent.

       3. Les cinq familles s'affichaient partout, sans regarder le contenu.
          Sur Oud & Boukhour, Coffrets, Diffuseurs et Unisexe, douze
          combinaisons page/filtre vidaient la grille — hauteur zéro, sans un
          mot. On ne rend que les familles réellement présentes, et seulement
          s'il y en a au moins deux : un filtre qui n'offre qu'un choix ne
          filtre rien.                                                      *}
    {assign var='odysCatId' value=$category.id|default:0|intval}
    {assign var='odysSecIds' value=[Configuration::get('ODYS_CAT_PARFUMS')|intval,
                                    Configuration::get('ODYS_CAT_HOMME')|intval,
                                    Configuration::get('ODYS_CAT_FEMME')|intval,
                                    Configuration::get('ODYS_CAT_UNISEXE')|intval]}
    {assign var='odysSecNoms' value=['Tous','Homme','Femme','Unisexe']}
    {assign var='odysDansParfums' value=($odysCatId && ($odysCatId|in_array:$odysSecIds))}
    {* Deux familles tirees d'un seul produit ne filtrent rien : Unisexe, avec
       son unique « oud oriental », affichait Oriental et Oud pointant tous deux
       sur le meme article. Il faut deux familles ET deux produits. *}
    {assign var='odysAssezDeProduits' value=($listing.products|@count > 1)}

    {* Les familles réellement portées par les produits de cette page. La
       valeur peut en contenir deux (« sweet oriental »), d'où le découpage. *}
    {assign var='odysFams' value=[]}
    {foreach from=$listing.products item=odysP}
      {assign var='odysF' value=''}
      {if isset($odysP.features)}
        {foreach from=$odysP.features item=odysFt}
          {if $odysFt.name == 'Famille olfactive'}{assign var='odysF' value=$odysFt.value|lower}{/if}
        {/foreach}
      {/if}
      {foreach from=' '|explode:$odysF item=odysW}
        {assign var='odysW' value=$odysW|trim}
        {if $odysW && !($odysW|in_array:$odysFams)}{append var='odysFams' value=$odysW}{/if}
      {/foreach}
    {/foreach}

    {if ($odysDansParfums || ($odysFams|@count > 1 && $odysAssezDeProduits)) && !$isOud}
    <div class="coll-bar">
      {if $odysDansParfums}
        <nav class="odys-subcats" aria-label="Sections de la collection">
          {foreach from=$odysSecIds item=odysSecId name=sec}
            {if $odysSecId}
              <a href="{$link->getCategoryLink($odysSecId)}"
                 {if $odysSecId == $odysCatId}class="on" aria-current="page"{/if}>{$odysSecNoms[$smarty.foreach.sec.index]}</a>
            {/if}
          {/foreach}
        </nav>
      {/if}

      {if $odysFams|@count > 1 && $odysAssezDeProduits}
        {assign var='odysFamNoms' value=['fresh'=>'Frais','oriental'=>'Oriental','sweet'=>'Sucré','oud'=>'Oud']}
        <div class="fam-filters" role="group" aria-labelledby="fam-lbl">
          <span class="fam-lbl" id="fam-lbl">Famille</span>
          <button class="ff on" type="button" data-action="filter-fam" data-fam="all" aria-pressed="true">Tout</button>
          {foreach from=$odysFamNoms key=odysFamCle item=odysFamNom}
            {if $odysFamCle|in_array:$odysFams}
              <button class="ff" type="button" data-action="filter-fam"
                      data-fam="{$odysFamCle}" aria-pressed="false">{$odysFamNom}</button>
            {/if}
          {/foreach}
        </div>
      {/if}
    </div>
    {/if}
    </div>

      {* the family buttons narrow, this orders — classic's own control, kept
         so routing categories through this template takes nothing away *}
      {if isset($listing.sort_orders) && $listing.sort_orders|@count > 1}
        <div class="sec-hd-sort">
          {include file='catalog/_partials/sort-orders.tpl' sort_orders=$listing.sort_orders}
        </div>
      {/if}
    {* The category's own words. Written for the visitor who just landed
       here from a search and wants to know what this section is; a page with
       nothing on it but a grid gives a search engine nothing to rank either.
       Edited in Catalogue → Catégories. *}
    {if isset($category.description) && $category.description}
      <div class="odys-cat-intro">{$category.description nofilter}</div>
    {/if}
    <div class="pg" id="collGrid">
      {* Le filtre masque des cartes déjà rendues : quand il n'en reste
         aucune, la grille tombait à zéro pixel sans un mot, et le visiteur
         voyait une boutique vide. role="status" le fait annoncer. *}
      <p class="pg-empty" id="collEmpty" role="status" hidden>
        Aucun parfum de cette famille dans cette section.
      </p>
      {foreach from=$listing.products item=product}
        {include file='catalog/_partials/miniatures/product.tpl' product=$product}
      {foreachelse}
        <p style="grid-column:1/-1;text-align:center;padding:80px 20px;
                  font-family:var(--font-display);font-size:16px;color:var(--odys-muted)">
          Aucun parfum dans cette collection pour le moment.
        </p>
      {/foreach}
    </div>

    {* PrestaShop's pagination has no total_pages - it publishes pages_count and
       should_be_displayed. Reading the wrong key printed an "Undefined array
       key" warning into every category page. *}
    {if isset($listing.pagination.should_be_displayed) && $listing.pagination.should_be_displayed}
      <nav class="pagination" aria-label="Pagination"
           style="display:flex;justify-content:center;gap:8px;margin-top:var(--spacing-lg)">
        {foreach from=$listing.pagination.pages item=page}
          <a href="{$page.url}" class="pg-btn{if $page.current} on{/if}"
             {if $page.current}aria-current="page"{/if}>{$page.page}</a>
        {/foreach}
      </nav>
    {/if}
  </div>
</section>
{/block}
