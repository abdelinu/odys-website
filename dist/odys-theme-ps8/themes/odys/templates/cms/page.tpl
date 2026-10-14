{extends file='layouts/layout-full-width.tpl'}
{*
 * ODYS Parfums — CMS page (livraison, retours, CGV, mentions légales…)
 * The text itself lives in Back Office → Design → Pages; this template only
 * gives it the house setting. Paste the files from legal/ as page content.
 *}
{block name='head_title'}{$cms.meta_title|escape:'html':'UTF-8'} | ODYS Parfums{/block}
{block name='head_desc'}{$cms.meta_description|escape:'html':'UTF-8'}{/block}

{block name='content'}
<nav aria-label="{l s='Fil d\'Ariane' d='Shop.Theme.Odys'}">
  <ol class="bc">
    <li><a href="{$urls.base_url}">{l s='Accueil' d='Shop.Theme.Odys'}</a></li>
    <li class="sep" aria-hidden="true">›</li>
    <li aria-current="page"><b>{$cms.meta_title|escape:'html':'UTF-8'}</b></li>
  </ol>
</nav>

{* `page-cms` is not decoration: checkout.js fetches this page and lifts
   `.page-cms` out of it into the terms modal, so without the class the modal
   opens empty and the customer has nothing to agree to. *}
<article class="cms-page page-cms">
  <header class="cms-hd">
    <p class="acc-eyebrow">{l s='Informations ODYS' d='Shop.Theme.Odys'}</p>
    <h1>{$cms.meta_title|escape:'html':'UTF-8'}</h1>
  </header>

  <div class="legal-body">
    {$cms.content nofilter}
  </div>

  <aside class="legal-help">
    <p><b>{l s='Une question ?' d='Shop.Theme.Odys'}</b> {l s='Notre service client répond sur WhatsApp, du lundi au samedi, 9h–18h.' d='Shop.Theme.Odys'}</p>
    {assign var='odysWa' value=Configuration::get('ODYS_WA_NUMBER')}
    {if $odysWa}
    <a class="btn-g" href="https://wa.me/{$odysWa|escape:'url'}"
       target="_blank" rel="noopener noreferrer">{l s='Écrire sur WhatsApp' d='Shop.Theme.Odys'}</a>
    {else}
    <a class="btn-g" href="{$urls.pages.contact}">{l s='Nous écrire' d='Shop.Theme.Odys'}</a>
    {/if}
  </aside>
</article>
{/block}
