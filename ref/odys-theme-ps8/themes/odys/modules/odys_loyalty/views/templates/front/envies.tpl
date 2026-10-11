{**
 * Mes envies.
 *
 * The list lives in the visitor's own browser, so it needs no account — which
 * is the point: making people register before they can save anything loses
 * about a fifth of the shoppers who were interested enough to try. Nothing
 * here reaches the server, and the page renders itself from that store.
 *}
{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Mes envies | ODYS Parfums{/block}
{block name='head_desc'}Les parfums ODYS que vous avez mis de côté.{/block}

{block name='content'}
<div class="odys-order">
  <div class="odys-order-top">
    <div class="odys-order-eyebrow">Votre sélection</div>
    <h1 class="odys-order-ref odys-order-ref--page">Mes envies</h1>
    <p class="odys-order-sub">
      Gardée sur cet appareil, sans compte. Elle vous attend à votre prochaine visite.
    </p>
  </div>

  <section class="odys-order-card">
    <ul class="odys-order-lines" id="odysWishList"></ul>
    <div id="odysWishEmpty" hidden>
      <p class="odys-order-note">
        Rien de mis de côté pour l'instant. Touchez le ♡ sur un parfum et vous le
        retrouverez ici.
      </p>
      <div class="odys-order-actions">
        <a href="{$odysUrlParfums}" class="btn-p">Découvrir la collection →</a>
      </div>
    </div>
  </section>
</div>
{/block}
