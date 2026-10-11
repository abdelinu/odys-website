{**
 * "Où est mon colis ?" for someone who has no account - or who has one and
 * cannot remember. PrestaShop calls this template guest-login; it is the form
 * that leads to guest-tracking.tpl.
 *}
{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Suivre ma commande | ODYS Parfums{/block}

{block name='content'}
<div class="odys-guest">
  <div class="odys-guest-head">
    <div class="odys-order-eyebrow">Suivi de commande</div>
    <h1 class="odys-guest-h1">Où est mon colis ?</h1>
    <p class="odys-guest-lede">
      La référence figure sur l'email de confirmation — neuf lettres, par exemple
      <span class="odys-guest-sample">XKBKNABJK</span>.
    </p>
  </div>

  {* classic submits this by GET, which puts the customer's email in the URL
     and from there into logs and browser history; postProcess() reads it with
     Tools::getValue(), which takes POST just as happily *}
  <form class="odys-guest-form" action="{$urls.pages.guest_tracking}" method="post">
    <div class="cf">
      <label for="guest-ref">Référence de commande *</label>
      <input type="text" id="guest-ref" name="order_reference" required
             autocomplete="off" spellcheck="false"
             style="text-transform:uppercase" placeholder="XKBKNABJK"/>
    </div>
    <div class="cf">
      <label for="guest-email">Email utilisé pour la commande *</label>
      <input type="email" id="guest-email" name="email" required
             autocomplete="email" placeholder="votre@email.ma"/>
    </div>
    <button type="submit" class="btn-p odys-guest-submit">
      Suivre ma commande →
    </button>
  </form>

  <div class="odys-guest-alt">
    <p>Vous avez un compte ? <a href="{$urls.pages.history}">Vos commandes y sont déjà listées</a>.</p>
    {include file='_partials/contact-links.tpl'}
  </div>
</div>
{/block}
