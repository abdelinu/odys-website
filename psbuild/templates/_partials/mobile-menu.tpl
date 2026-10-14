{* ODYS Parfums — Mobile menu v5.0 · EAA *}
<div class="mob-menu" id="mobMenu"
     role="dialog" aria-modal="true"
     aria-label="{l s='Menu de navigation' d='Shop.Theme.Odys'}" aria-hidden="true">
  <button class="mob-x" type="button" data-action="close-menu"
          aria-label="{l s='Fermer le menu' d='Shop.Theme.Odys'}">&times;</button>
  <ul role="list">
    <li><a href="{$urls.base_url}">{l s='Accueil' d='Shop.Theme.Odys'}</a></li>
    {* « Collection » se déplie au clic, au lieu d'étaler ses trois sections
       dès l'ouverture du menu : sur un écran de téléphone elles poussaient
       Oud, Coffrets et Diffuseurs sous la ligne de flottaison.

       <details> fait cela sans une ligne de script — fermé par défaut, ouvert
       au clavier comme à la main, annoncé aux lecteurs d'écran. Les trois
       liens étaient d'ailleurs des <a> posés directement dans le <ul>, ce que
       la spécification interdit ; les voici dans un <li>.

       « Toute la collection » reprend le lien que le titre portait avant de
       devenir un dépliant. *}
    <li class="mm-group">
      <details class="mm-det">
        <summary class="mm-sum">{l s='Collection' d='Shop.Theme.Odys'}</summary>
        <a href="{$odysUrlParfums}" class="mm-sub">{l s='Toute la collection' d='Shop.Theme.Odys'}</a>
        <a href="{$odysUrlHomme}" class="mm-sub">{l s='Homme' d='Shop.Theme.Odys'}</a>
        <a href="{$odysUrlFemme}" class="mm-sub">{l s='Femme' d='Shop.Theme.Odys'}</a>
        <a href="{$odysUrlUnisexe}" class="mm-sub">{l s='Unisexe' d='Shop.Theme.Odys'}</a>
      </details>
    </li>
    <li class="mm-oud"><a href="{$urls.base_url}oud-boukhour">{l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.base_url}coffrets">{l s='Coffrets' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$odysUrlDiffuseurs}">{l s='Diffuseurs' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$odysUrlApropos}">{l s='À propos' d='Shop.Theme.Odys'}</a></li>
    <li><a href="{$urls.pages.contact}">{l s='Contact' d='Shop.Theme.Odys'}</a></li>
    {if $customer.is_logged}
      <li><a href="{$urls.pages.my_account}">{$customer.firstname|escape:'html':'UTF-8'} · {l s='Fidélité' d='Shop.Theme.Odys'}</a></li>
    {else}
      <li><a href="{$urls.pages.authentication}">{l s='Connexion' d='Shop.Theme.Odys'}</a></li>
    {/if}
  </ul>

  <div class="mob-pay">
    <span class="mob-b cod">{l s='Paiement à la livraison' d='Shop.Theme.Odys'}</span>
    <span class="mob-b">{l s='CMI' d='Shop.Theme.Odys'}</span>
    <span class="mob-b">{l s='Visa / Mastercard' d='Shop.Theme.Odys'}</span>
  </div>
</div>
