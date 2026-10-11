{**
 * Le champ « code promo » du recapitulatif.
 *
 * Le theme classic le rend sans libelle : seul un `placeholder` porte le
 * sens. Un placeholder n'est pas un libelle. Il disparait des que le
 * client tape — celui qui s'interrompt et revient ne sait plus dans quoi
 * il ecrivait — et les lecteurs d'ecran ne l'annoncent pas de maniere
 * fiable : le champ s'y presente comme « zone de texte », sans nom.
 *
 * On ne reecrit que ce bloc : `{extends file="parent:..."}` laisse le
 * reste du gabarit a PrestaShop, donc une mise a jour du coeur continue
 * de s'appliquer partout ailleurs.
 *
 * Le libelle est visuellement masque, pas supprime : la ligne reste aussi
 * compacte qu'avant, et le champ a desormais un nom.
 *}
{extends file="parent:checkout/_partials/cart-voucher.tpl"}

{block name='cart_voucher_form'}
  <form action="{$urls.pages.cart}" data-link-action="add-voucher" method="post">
    <input type="hidden" name="token" value="{$static_token}">
    <input type="hidden" name="addDiscount" value="1">
    <label class="sr-only" for="odys-code-promo">{l s='Promo code' d='Shop.Theme.Checkout'}</label>
    <input class="promo-input" id="odys-code-promo" type="text" name="discount_name"
           autocomplete="off"
           placeholder="{l s='Promo code' d='Shop.Theme.Checkout'}">
    <button type="submit" class="btn btn-primary"><span>{l s='Add' d='Shop.Theme.Actions'}</span></button>
  </form>
{/block}
