{*
 * ODYS Parfums — Pyramide de senteurs + "Composez votre ODYS" panel
 * The pyramid is three ingredient photographs clipped into one triangle
 * (img/pyr-tete|coeur|fond.webp). An ODYS pyramid render can replace the
 * .nv-bands column later. The panel opens the quiz dialog; its three
 * criteria are the quiz's three questions.
 *}
<section class="nv-duo reveal" aria-labelledby="nv-pyr-title">
  <div class="nv-pyr">
    <div class="nv-pyr-fig">
      <div class="nv-layer">
        <p class="nv-layer-lbl"><b>{l s='Tête' d='Shop.Theme.Odys'}</b><span>{l s='Fraîcheur · Énergie' d='Shop.Theme.Odys'}</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-1">
          <img src="{$urls.theme_assets}img/pyr-tete.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
      <div class="nv-layer">
        <p class="nv-layer-lbl"><b>Cœur</b><span>{l s='Caractère · Émotion' d='Shop.Theme.Odys'}</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-2">
          <img src="{$urls.theme_assets}img/pyr-coeur.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
      <div class="nv-layer">
        <p class="nv-layer-lbl"><b>{l s='Fond' d='Shop.Theme.Odys'}</b><span>{l s='Profondeur · Signature' d='Shop.Theme.Odys'}</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-3">
          <img src="{$urls.theme_assets}img/pyr-fond.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
    </div>

    <div class="nv-pyr-txt">
      <p class="nv-eyebrow">{l s='Expérience olfactive' d='Shop.Theme.Odys'}</p>
      <h2 class="nv-h2" id="nv-pyr-title">{l s='Une pyramide de senteurs' d='Shop.Theme.Odys'}</h2>
      <p class="nv-lede">{l s='Chaque fragrance est une histoire, un voyage en trois temps :
        fraîcheur, cœur et profondeur.' d='Shop.Theme.Odys'}</p>
      <a href="{$odysUrlParfums}" class="nv-btn">{l s='Explorer les notes' d='Shop.Theme.Odys'}
        <span class="arw" aria-hidden="true">&rarr;</span></a>
    </div>
  </div>

  <div class="nv-quizp">
    <figure class="nv-bg" aria-hidden="true">
      <img src="{$urls.theme_assets}img/nuit-riad.webp" alt="" width="900" height="900"
           loading="lazy" decoding="async"/>
    </figure>
    <p class="nv-eyebrow">{l s='Sur mesure' d='Shop.Theme.Odys'}</p>
    <h2 class="nv-h2 nv-h2-sm">{l s='Composez votre ODYS' d='Shop.Theme.Odys'}</h2>
    <p class="nv-sub">{l s='Un parfum, mille possibilités.' d='Shop.Theme.Odys'}</p>
    <a href="{$odysUrlParfums}" class="nv-btn nv-btn-pill" data-nv-quiz-open>{l s='Commencer' d='Shop.Theme.Odys'}</a>
    <ul class="nv-crit" role="list">
      <li>{l s='Famille' d='Shop.Theme.Odys'}</li>
      <li>{l s='Occasion' d='Shop.Theme.Odys'}</li>
      <li>{l s='Intensité' d='Shop.Theme.Odys'}</li>
    </ul>
  </div>
</section>
