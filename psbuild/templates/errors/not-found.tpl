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
    <p class="odys-404-eyebrow">Aucun résultat</p>
    <p class="odys-404-title">
      {if isset($search_string) && $search_string}
        Rien ne correspond à «&nbsp;{$search_string|escape:'html':'UTF-8'}&nbsp;».
      {else}
        Cette sélection est vide pour le moment.
      {/if}
    </p>
    <p class="odys-404-lede">
      Essayez un nom de parfum, une note olfactive, ou l'inspiration qui vous plaît.
    </p>
  {else}
    <p class="odys-404-eyebrow">Erreur 404</p>
    <h1 class="odys-404-title">Cette page s'est évaporée.</h1>
    <p class="odys-404-lede">
      Le lien est peut-être ancien, ou l'adresse mal recopiée. Voici par où continuer.
    </p>
  {/if}

  <form class="odys-404-search" action="{$urls.pages.search}" method="get" role="search">
    <label class="sr-only" for="odys404q">Rechercher un parfum</label>
    <input id="odys404q" type="text" name="s" required minlength="2" maxlength="64"
           inputmode="search" autocomplete="off"
           value="{if isset($search_string)}{$search_string|escape:'html':'UTF-8'}{/if}"
           placeholder="Parfum, note olfactive, inspiration…"/>
    <button type="submit">Rechercher</button>
  </form>

  <nav class="odys-404-links" aria-label="Pages principales">
    <a href="{$odysUrlParfums}">Tous les parfums</a>
    {* « parfum homme » ne renvoie rien : la recherche de PrestaShop lit les
       produits, pas les noms de categorie. C'est pourtant une des facons
       les plus naturelles de chercher un parfum. Les trois rayons sont
       proposes ici, et disparaissent si la boutique ne les a pas. *}
    {if $odysUrlHomme != $odysUrlParfums}<a href="{$odysUrlHomme}">Pour homme</a>{/if}
    {if $odysUrlFemme != $odysUrlParfums}<a href="{$odysUrlFemme}">Pour femme</a>{/if}
    {if $odysUrlUnisexe != $odysUrlParfums}<a href="{$odysUrlUnisexe}">Unisexe</a>{/if}
    <a href="{$odysUrlOud}">Oud &amp; Boukhour</a>
    <a href="{$odysUrlCoffrets}">Coffrets</a>
    <a href="{$odysUrlLivraison}">Livraison</a>
    <a href="{$urls.pages.contact}">Contact</a>
  </nav>

  {if !$odysListeVide}
    <a class="odys-404-home" href="{$urls.base_url}">← Retour à l'accueil</a>
  {/if}
</section>
