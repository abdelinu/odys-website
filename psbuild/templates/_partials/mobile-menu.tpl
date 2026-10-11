{* ODYS Parfums — Mobile menu v5.0 · EAA *}
<div class="mob-menu" id="mobMenu"
     role="dialog" aria-modal="true"
     aria-label="Menu de navigation" aria-hidden="true">
  <button class="mob-x" type="button" data-action="close-menu"
          aria-label="Fermer le menu">&times;</button>
  <ul role="list">
    <li><a href="{$urls.base_url}">Accueil</a></li>
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
        <summary class="mm-sum">Collection</summary>
        <a href="{$odysUrlParfums}" class="mm-sub">Toute la collection</a>
        <a href="{$odysUrlHomme}" class="mm-sub">Homme</a>
        <a href="{$odysUrlFemme}" class="mm-sub">Femme</a>
        <a href="{$odysUrlUnisexe}" class="mm-sub">Unisexe</a>
      </details>
    </li>
    <li class="mm-oud"><a href="{$urls.base_url}oud-boukhour">Oud &amp; Boukhour</a></li>
    <li><a href="{$urls.base_url}coffrets">Coffrets</a></li>
    <li><a href="{$odysUrlDiffuseurs}">Diffuseurs</a></li>
    <li><a href="{$odysUrlApropos}">À propos</a></li>
    <li><a href="{$urls.pages.contact}">Contact</a></li>
    {if $customer.is_logged}
      <li><a href="{$urls.pages.my_account}">{$customer.firstname|escape:'html':'UTF-8'} · Fidélité</a></li>
    {else}
      <li><a href="{$urls.pages.authentication}">Connexion</a></li>
    {/if}
  </ul>

  <div class="mob-pay">
    <span class="mob-b cod">Paiement à la livraison</span>
    <span class="mob-b">CMI</span>
    <span class="mob-b">Visa / Mastercard</span>
  </div>
</div>
