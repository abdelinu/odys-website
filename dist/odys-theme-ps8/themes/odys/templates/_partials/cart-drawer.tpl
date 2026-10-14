{*
 * ODYS Parfums — le panier qui s'ouvre sur le cote
 *
 * L'ancien tiroir existait depuis la maquette, avec ses styles et son
 * script, mais il n'etait inclus nulle part — et pour cause : son contenu
 * venait d'un tableau JavaScript, le panier simule de la maquette. Le
 * livrer aurait montre un faux panier a cote du vrai. Ajouter un parfum ne
 * faisait donc rien de visible, sinon un chiffre qui bouge dans la barre.
 *
 * Celui-ci montre le panier de PrestaShop. Il est rendu par le serveur,
 * avec ce que le panier contient a l'instant ou la page part : sans
 * JavaScript, le bouton du haut l'ouvre, les quantites se changent par des
 * liens ordinaires, et commander marche. Le script, quand il tourne, le
 * remplit sans recharger la page apres chaque ajout.
 *
 * Le seuil de livraison offerte est celui qu'annonce le bandeau du haut :
 * il vient du transporteur, pas d'un nombre recopie ici.
 *}
{assign var='odysSeuil' value=Configuration::get('ODYS_FREE_SHIPPING')|default:300}
{if !$odysSeuil}{assign var='odysSeuil' value=300}{/if}
{* Le seuil de livraison offerte se mesure sur les produits : compter la
   livraison dedans ferait dire « encore 4 DH » a un panier qui n'y est
   pas, parce que les 20 DH de livraison auraient compte pour lui. *}
{assign var='odysTotalPanier' value=$cart.subtotals.products.amount|default:0}
{assign var='odysReste' value=$odysSeuil - $odysTotalPanier}

<div class="odys-tiroir-fond" id="odysTiroirFond" data-action="fermer-tiroir" hidden></div>

<aside class="odys-tiroir" id="odysTiroir" aria-labelledby="odysTiroirTitre"
       role="dialog" aria-modal="true" hidden>
  <div class="ot-hd">
    <h2 class="ot-titre" id="odysTiroirTitre">{l s='Mon panier' d='Shop.Theme.Odys'}</h2>
    <button class="ot-fermer" type="button" data-action="fermer-tiroir"
            aria-label="{l s='Fermer le panier' d='Shop.Theme.Odys'}">&times;</button>
  </div>

  {* La barre de livraison offerte. Elle dit ce qui manque, pas un
     pourcentage : « encore 120 DH » se comprend sans calcul. *}
  {* Les deux phrases sont ecrites ici, donc traduites comme le reste : le
     script les recopiait en francais, et le tiroir parlait francais sur
     une page arabe. Il remplace %d par ce qui manque. *}
  <div class="ot-liv" id="odysTiroirLiv" data-seuil="{$odysSeuil|intval}"
       data-mot-reste="{l s='Encore %montant% DH et la livraison est offerte' d='Shop.Theme.Odys'}"
       data-mot-offerte="{l s='Livraison offerte' d='Shop.Theme.Odys'}">
    <p class="ot-liv-mot" id="odysTiroirLivMot">
      {if $odysReste > 0}{l s='Encore %montant% DH et la livraison est offerte' sprintf=['%montant%' => $odysReste|intval] d='Shop.Theme.Odys'}
      {else}{l s='Livraison offerte' d='Shop.Theme.Odys'}{/if}
    </p>
    <div class="ot-liv-bar" role="progressbar" aria-valuemin="0"
         aria-valuemax="{$odysSeuil|intval}"
         aria-valuenow="{if $odysTotalPanier > $odysSeuil}{$odysSeuil|intval}{else}{$odysTotalPanier|intval}{/if}"
         aria-label="{l s='Progression vers la livraison offerte' d='Shop.Theme.Odys'}">
      <span class="ot-liv-fill" id="odysTiroirLivFill"
            style="width:{if $odysSeuil > 0}{min(100, 100 * $odysTotalPanier / $odysSeuil)|intval}{else}0{/if}%"></span>
    </div>
  </div>

  <div class="ot-corps">
    <ul class="ot-liste" id="odysTiroirListe" role="list">
      {foreach from=$cart.products item=odysLigne}
        <li class="ot-ligne" data-id-product="{$odysLigne.id_product|intval}"
            data-id-product-attribute="{$odysLigne.id_product_attribute|intval}">
          {if $odysLigne.cover}
            <img class="ot-img" src="{$odysLigne.cover.bySize.small_default.url}"
                 alt="" width="60" height="60" loading="lazy"/>
          {/if}
          <div class="ot-txt">
            <p class="ot-nom">{$odysLigne.name|escape:'html':'UTF-8'}</p>
            {if $odysLigne.attributes_small}
              <p class="ot-decl">{$odysLigne.attributes_small|escape:'html':'UTF-8'}</p>
            {/if}
            <p class="ot-prix">{$odysLigne.price}</p>
            <div class="ot-qte">
              <a class="ot-moins" href="{$odysLigne.down_quantity_url}"
                 aria-label="Retirer un exemplaire de {$odysLigne.name|escape:'html':'UTF-8'}">&minus;</a>
              <span class="ot-nb">{$odysLigne.quantity|intval}</span>
              <a class="ot-plus" href="{$odysLigne.up_quantity_url}"
                 aria-label="Ajouter un exemplaire de {$odysLigne.name|escape:'html':'UTF-8'}">+</a>
              <a class="ot-oter" href="{$odysLigne.remove_from_cart_url}"
                 aria-label="Retirer {$odysLigne.name|escape:'html':'UTF-8'} du panier">{l s='Retirer' d='Shop.Theme.Odys'}</a>
            </div>
          </div>
        </li>
      {foreachelse}
        <li class="ot-vide">
          <p>{l s='Votre panier est vide.' d='Shop.Theme.Odys'}</p>
          <a href="{$odysUrlParfums}" class="btn-p">{l s='Voir la collection' d='Shop.Theme.Odys'}</a>
        </li>
      {/foreach}
    </ul>
  </div>

  <div class="ot-pied">
    {* Le montant est sur le bouton : on sait ce qu'on engage en cliquant,
       sans remonter la colonne pour lire un total ailleurs. *}
    <a class="ot-commander" id="odysTiroirCommander" href="{$urls.pages.order}">
      <span>{l s='Commander' d='Shop.Theme.Odys'}</span>
      <span class="ot-total" id="odysTiroirTotal">{$cart.totals.total.value}</span>
    </a>
    <a class="ot-voir" href="{$urls.pages.cart}">{l s='Voir le panier' d='Shop.Theme.Odys'}</a>
    <p class="ot-rass">
      {l s='Paiement à la livraison · Livraison 24–48h · Retours sous 14 jours' d='Shop.Theme.Odys'}
    </p>
  </div>
</aside>
