{*
 * ODYS Parfums — Ce qu'en disent les clients
 *
 * Rien n'est ecrit ici : la bande vient de ps_product_comment, par
 * OdysAccueil::avis(), et ne prend que les avis que la moderation a
 * valides. Sans avis, le gabarit n'imprime rien du tout — pas de titre,
 * pas de cadre vide, et surtout aucun temoignage de complaisance.
 *
 * La note est affichee telle qu'elle a ete donnee, sur cinq. Le prenom est
 * celui que le client a laisse. Aucune pastille « verifie » : la boutique
 * ne verifie rien de plus que d'avoir publie ce qu'on lui a ecrit.
 *}
{if isset($odysAvis) && $odysAvis}
<section class="avis-sec reveal" aria-labelledby="home-avis-title">
  <div>
    <div class="sec-hd">
      <div class="sec-hd-left">
        <p>{l s='Leurs mots' d='Shop.Theme.Odys'}</p>
        <h2 id="home-avis-title">{l s='Ce qu\'en disent nos clients' d='Shop.Theme.Odys'}</h2>
      </div>
    </div>

    <ul class="avis-grid" role="list">
      {foreach from=$odysAvis item=odysAv}
        <li class="avis-card">
          <p class="avis-note" aria-label="{$odysAv.note|intval} sur 5">
            <span aria-hidden="true">{section name=e start=1 loop=6}{if $smarty.section.e.index <= $odysAv.note}&#9733;{else}&#9734;{/if}{/section}</span>
          </p>
          {if $odysAv.titre}
            <p class="avis-titre">{$odysAv.titre|escape:'html':'UTF-8'}</p>
          {/if}
          <blockquote class="avis-texte">{$odysAv.texte|escape:'html':'UTF-8'}</blockquote>
          <p class="avis-pied">
            <span class="avis-nom">{$odysAv.auteur|escape:'html':'UTF-8'}</span>
            <a class="avis-prod" href="{$odysAv.url|escape:'html':'UTF-8'}">{$odysAv.produit|escape:'html':'UTF-8'}</a>
          </p>
        </li>
      {/foreach}
    </ul>
  </div>
</section>
{/if}
