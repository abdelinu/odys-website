{extends file='parent:customer/registration.tpl'}

{**
 * « Continuer avec Google » sur la page de creation de compte.
 *
 * PrestaShop n'appelle aucun hook utilisable au-dessus du formulaire
 * d'inscription : `displayCustomerAccountForm` est rendu a l'interieur du
 * formulaire, et c'est tout. D'ou ce gabarit, qui ajoute l'emplacement
 * `register` avant le formulaire — la ou un bouton social se place.
 *
 * La page de connexion, elle, n'a besoin de rien : authentication.tpl appelle
 * deja `displayCustomerLoginFormAfter`.
 *
 * Si le module n'est pas installe, le hook ne rend rien : on capture sa sortie
 * et on n'affiche le bloc que si elle n'est pas vide. Ce gabarit est donc sans
 * effet tant que Google n'est pas configure, et ne laisse pas de cadre vide.
 *
 * Le separateur (« ou ») et la mention RGPD viennent du module, qui a ses
 * propres reglages en Back Office. Rien a styler ici.
 *}
{* `prepend` insere ce bloc avant celui du parent. Smarty ne definit
   $smarty.block.parent que dans certains cas d'heritage, et pas ici. *}
{block name='register_form_container' prepend}
  {capture name='odysSocial'}{hook h='displayWebsourceSocialLogin' place='register'}{/capture}
  {if trim($smarty.capture.odysSocial) !== ''}
    <div class="odys-social-register">{$smarty.capture.odysSocial nofilter}</div>
  {/if}
{/block}
