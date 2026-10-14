{*
 * ODYS Parfums — la page 404, ET le message d'une liste vide.
 *
 * PrestaShop se sert du meme fragment pour deux choses tres differentes :
 *
 *   * la vraie page 404, rendue seule ;
 *   * une liste de produits vide — recherche sans resultat, categorie sans
 *     produit — ou `catalog/listing/product-list.tpl` l'inclut au milieu des
 *     resultats, en lui passant $errorContent.
 *
 * Sans cette distinction, une recherche sans resultat affichait « Erreur 404 —
 * cette page s'est evaporee » sous le titre « Resultats de la recherche », avec
 * deux <h1> dans la meme page. C'est $errorContent qui dit dans quel cas on est.
 *
 * Fragment, pas page : l'etendre en layout rendait l'en-tete et le bandeau
 * d'annonce une seconde fois.
 *}
{assign var='odysListeVide' value=isset($errorContent)}
<section class="odys-404">
  {if $odysListeVide}
    {* liste vide : le <h1> de la page existe deja au-dessus, on n'en remet pas *}
    <p class="odys-404-eyebrow">{l s='Aucun résultat' d='Shop.Theme.Odys'}</p>
    <p class="odys-404-title">
      {if isset($search_string) && $search_string}
        Rien ne correspond à «&nbsp;{$search_string|escape:'html':'UTF-8'}&nbsp;».
      {else}
        Cette sélection est vide pour le moment.
      {/if}
    </p>
    <p class="odys-404-lede">
      {l s='Essayez un nom de parfum, une note olfactive, ou l\'inspiration qui vous plaît.' d='Shop.Theme.Odys'}
    </p>
  {else}
    <p class="odys-404-eyebrow">{l s='Erreur 404' d='Shop.Theme.Odys'}</p>
    <h1 class="odys-404-title">{l s='Cette page s\'est évaporée.' d='Shop.Theme.Odys'}</h1>
    <p class="odys-404-lede">
      {l s='Le lien est peut-être ancien, ou l\'adresse mal recopiée. Voici par où continuer.' d='Shop.Theme.Odys'}
    </p>
  {/if}

  <form class="odys-404-search" action="{$urls.pages.search}" method="get" role="search">
    <label class="sr-only" for="odys404q">{l s='Rechercher un parfum' d='Shop.Theme.Odys'}</label>
    <input id="odys404q" type="text" name="s" required minlength="2" maxlength="64"
           inputmode="search" autocomplete="off"
           value="{if isset($search_string)}{$search_string|escape:'html':'UTF-8'}{/if}"
           placeholder="{l s='Parfum, note olfactive, inspiration…' d='Shop.Theme.Odys'}"/>
    <button type="submit">{l s='Rechercher' d='Shop.Theme.Odys'}</button>
  </form>

  <nav class="odys-404-links" aria-label="{l s='Pages principales' d='Shop.Theme.Odys'}">
    <a href="{$odysUrlParfums}">{l s='Tous les parfums' d='Shop.Theme.Odys'}</a>
    {* « parfum homme » ne renvoie rien : la recherche de PrestaShop lit les
       produits, pas les noms de categorie. C'est pourtant une des facons
       les plus naturelles de chercher un parfum. Les trois rayons sont
       proposes ici, et disparaissent si la boutique ne les a pas. *}
    {if $odysUrlHomme != $odysUrlParfums}<a href="{$odysUrlHomme}">{l s='Pour homme' d='Shop.Theme.Odys'}</a>{/if}
    {if $odysUrlFemme != $odysUrlParfums}<a href="{$odysUrlFemme}">{l s='Pour femme' d='Shop.Theme.Odys'}</a>{/if}
    {if $odysUrlUnisexe != $odysUrlParfums}<a href="{$odysUrlUnisexe}">{l s='Unisexe' d='Shop.Theme.Odys'}</a>{/if}
    <a href="{$odysUrlOud}">{l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}</a>
    <a href="{$odysUrlCoffrets}">{l s='Coffrets' d='Shop.Theme.Odys'}</a>
    <a href="{$odysUrlLivraison}">{l s='Livraison' d='Shop.Theme.Odys'}</a>
    <a href="{$urls.pages.contact}">{l s='Contact' d='Shop.Theme.Odys'}</a>
  </nav>

  {if !$odysListeVide}
    <a class="odys-404-home" href="{$urls.base_url}">{l s='← Retour à l\'accueil' d='Shop.Theme.Odys'}</a>
  {/if}
</section>
