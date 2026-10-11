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
        <p class="nv-layer-lbl"><b>Tête</b><span>Fraîcheur · Énergie</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-1">
          <img src="{$urls.theme_assets}img/pyr-tete.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
      <div class="nv-layer">
        <p class="nv-layer-lbl"><b>Cœur</b><span>Caractère · Émotion</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-2">
          <img src="{$urls.theme_assets}img/pyr-coeur.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
      <div class="nv-layer">
        <p class="nv-layer-lbl"><b>Fond</b><span>Profondeur · Signature</span></p>
        <div class="nv-bands"><div class="nv-band nv-band-3">
          <img src="{$urls.theme_assets}img/pyr-fond.webp" alt="" width="600" height="220" loading="lazy" decoding="async"/>
        </div></div>
      </div>
    </div>

    <div class="nv-pyr-txt">
      <p class="nv-eyebrow">Expérience olfactive</p>
      <h2 class="nv-h2" id="nv-pyr-title">Une pyramide de senteurs</h2>
      <p class="nv-lede">Chaque fragrance est une histoire, un voyage en trois temps :
        fraîcheur, cœur et profondeur.</p>
      <a href="{$odysUrlParfums}" class="nv-btn">Explorer les notes
        <span class="arw" aria-hidden="true">&rarr;</span></a>
    </div>
  </div>

  <div class="nv-quizp">
    <figure class="nv-bg" aria-hidden="true">
      <img src="{$urls.theme_assets}img/nuit-riad.webp" alt="" width="900" height="900"
           loading="lazy" decoding="async"/>
    </figure>
    <p class="nv-eyebrow">Sur mesure</p>
    <h2 class="nv-h2 nv-h2-sm">Composez votre ODYS</h2>
    <p class="nv-sub">Un parfum, mille possibilités.</p>
    <a href="{$odysUrlParfums}" class="nv-btn nv-btn-pill" data-nv-quiz-open>Commencer</a>
    <ul class="nv-crit" role="list">
      <li><svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 5c0 6-7 7-7 13a7 7 0 0 0 14 0c0-6-7-7-7-13z"/></svg>Famille</li>
      <li><svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="6" y="8" width="20" height="18" rx="1.5"/><path d="M6 13h20M11 5v6M21 5v6"/></svg>Occasion</li>
      <li><svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M8 26v-6M14 26V16M20 26V12M26 26V6"/></svg>Intensité</li>
    </ul>
  </div>
</section>
