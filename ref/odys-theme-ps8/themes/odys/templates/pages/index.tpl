{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}ODYS Parfums | Acheter Parfum Luxe Maroc — Livraison Gratuite dès 300 DH{/block}
{block name='head_desc'}ODYS Parfums — Inspiré Dior, Chanel, Tom Ford. Élaboré au Maroc. 24h · COD · À partir de 39 DH.{/block}
{block name='head_schema'}
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://odys.ma/#org","name":"ODYS Parfums","url":"https://odys.ma","foundingDate":"2026","address":{"@type":"PostalAddress","addressLocality":"Casablanca","addressCountry":"MA"}},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"ODYS livre-t-il dans tout le Maroc ?","acceptedAnswer":{"@type":"Answer","text":"Oui. 20 DH à Casablanca, 30 DH partout au Maroc. Gratuite dès 300 DH."}},{"@type":"Question","name":"Le COD est-il disponible ?","acceptedAnswer":{"@type":"Answer","text":"Oui, paiement à la livraison partout au Maroc."}},{"@type":"Question","name":"Comment fonctionne le programme fidélité ?","acceptedAnswer":{"@type":"Answer","text":"100 DH = 1 point. À 15 points : 5g Oud ou coffret gratuit. Oud/Flacons exclus."}}]}]}</script>
{/block}
{block name='content'}
<section class="hero" aria-label="ODYS Parfums">
  <div class="hero-txt">
    <div class="hero-eyebrow">ODYS.MA · ÉLABORÉ AU MAROC · EST. 2026</div>
    <h1 class="hero-h">L'Odyssée<br><em>du Senteur</em></h1>
    <p class="hero-sub">L'inspiration des plus grandes maisons de parfumerie mondiale — élaborée au Maroc, au prix juste.</p>
    <div class="hero-btns">
      <a href="{$urls.pages.category}" class="btn-p">DÉCOUVRIR LA COLLECTION</a>
      <a href="{$urls.base_url}oud-boukhour" class="btn-g">OUD &amp; BOUKHOUR</a>
    </div>
    <div class="hero-proof">
      <div class="hp-item"><strong>1 284+</strong><span>clients satisfaits</span></div>
      <div class="hp-sep">·</div>
      <div class="hp-item"><strong>4.9/5</strong><span>satisfaction</span></div>
      <div class="hp-sep">·</div>
      <div class="hp-item"><strong>24–48h</strong><span>livraison</span></div>
    </div>
  </div>
  <div class="hero-img">
    <a href="{$urls.pages.category}">
      <img src="{$urls.theme_assets}img/hero.jpg" loading="eager" fetchpriority="high" alt="ODYS Parfums Collection Maroc" width="560" height="640"/>
    </a>
  </div>
</section>
<section class="cat-strip"><div style="max-width:1280px;margin:0 auto"><div class="cat-grid">
  <a href="{$urls.pages.category}" class="cat-card"><div class="cat-ic">🌹</div><div class="cat-lbl">Parfums<br><small>30–100ml</small></div></a>
  <a href="{$urls.base_url}oud-boukhour" class="cat-card cat-oud"><div class="cat-ic">🪵</div><div class="cat-lbl">Oud &amp; Boukhour<br><small>Au gramme</small></div></a>
  <a href="{$urls.base_url}flacons-voyage" class="cat-card"><div class="cat-ic">🧪</div><div class="cat-lbl">Flacons Voyage<br><small>20·30·50·100ml</small></div></a>
  <a href="{$urls.base_url}coffrets" class="cat-card"><div class="cat-ic">🎁</div><div class="cat-lbl">Coffrets<br><small>Duo &amp; Trio, prêts à offrir</small></div></a>
</div></div></section>
<section class="bsec"><div style="max-width:1280px;margin:0 auto">
  <div class="sec-hd"><div class="sec-hd-left"><p>✦ Notre sélection</p><h2>Parfums d'Inspiration Luxe</h2></div><a href="{$urls.pages.category}" class="sec-see-all">Voir tout →</a></div>
  <div class="pg" id="home-grid">
    {hook h='displayHome'}
    {foreach from=$featuredProducts item=product}
      {include file='catalog/_partials/miniatures/product.tpl' product=$product}
    {/foreach}
  </div>
</div></section>
<section class="why-sec"><div style="max-width:1280px;margin:0 auto">
  <div style="text-align:center;margin-bottom:48px"><div style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--rose);margin-bottom:10px">Pourquoi choisir ODYS</div><h2 style="font-family:var(--serif);font-size:clamp(24px,4vw,38px);font-weight:500">L'inspiration du luxe,<br><em>le prix ODYS</em></h2></div>
  <div class="why-grid">
    <div class="why-card"><div class="why-icon">🌹</div><h3>Formules de Luxe</h3><p>Inspirés des plus grandes maisons mondiales.</p></div>
    <div class="why-card"><div class="why-icon">🇲🇦</div><h3>Élaboré au Maroc</h3><p>Production locale, ingrédients sélectionnés.</p></div>
    <div class="why-card"><div class="why-icon">💰</div><h3>Prix Accessible</h3><p>À partir de 39 DH. Le luxe pour tous.</p></div>
    <div class="why-card"><div class="why-icon">🚚</div><h3>Livraison 24–48h</h3><p>20 DH Casa · 30 DH Maroc · Gratuite dès 300 DH.</p></div>
    <div class="why-card"><div class="why-icon">💚</div><h3>Paiement COD</h3><p>Payez en cash à la réception. Aucun risque.</p></div>
    <div class="why-card"><div class="why-icon">⭐</div><h3>Programme Fidélité</h3><p>100 DH = 1 point. 15 pts = 5g Oud offert.</p></div>
  </div>
</div></section>
{hook h='displayReassurance'}
{/block}
