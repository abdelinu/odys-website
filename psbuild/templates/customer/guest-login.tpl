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
    <div class="odys-order-eyebrow">{l s='Suivi de commande' d='Shop.Theme.Odys'}</div>
    <h1 class="odys-guest-h1">{l s='Où est mon colis ?' d='Shop.Theme.Odys'}</h1>
    <p class="odys-guest-lede">
      {l s='La référence figure sur l\'email de confirmation — neuf lettres, par exemple' d='Shop.Theme.Odys'}
      <span class="odys-guest-sample">{l s='XKBKNABJK' d='Shop.Theme.Odys'}</span>.
    </p>
  </div>

  {* classic submits this by GET, which puts the customer's email in the URL
     and from there into logs and browser history; postProcess() reads it with
     Tools::getValue(), which takes POST just as happily *}
  <form class="odys-guest-form" action="{$urls.pages.guest_tracking}" method="post">
    <div class="cf">
      <label for="guest-ref">{l s='Référence de commande *' d='Shop.Theme.Odys'}</label>
      <input type="text" id="guest-ref" name="order_reference" required
             autocomplete="off" spellcheck="false"
             style="text-transform:uppercase" placeholder="{l s='XKBKNABJK' d='Shop.Theme.Odys'}"/>
    </div>
    <div class="cf">
      <label for="guest-email">{l s='Email utilisé pour la commande *' d='Shop.Theme.Odys'}</label>
      <input type="email" id="guest-email" name="email" required
             autocomplete="email" placeholder="{l s='votre@email.ma' d='Shop.Theme.Odys'}"/>
    </div>
    <button type="submit" class="btn-p odys-guest-submit">
      {l s='Suivre ma commande →' d='Shop.Theme.Odys'}
    </button>
  </form>

  <div class="odys-guest-alt">
    <p>{l s='Vous avez un compte ?' d='Shop.Theme.Odys'} <a href="{$urls.pages.history}">{l s='Vos commandes y sont déjà listées' d='Shop.Theme.Odys'}</a>.</p>
    {include file='_partials/contact-links.tpl'}
  </div>
</div>
{/block}
