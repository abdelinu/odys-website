{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}ODYS Parfums | Acheter Parfum Luxe Maroc — Livraison Gratuite dès 300 DH{/block}
{block name='head_desc'}ODYS Parfums — Inspiré Dior, Chanel, Tom Ford. Élaboré au Maroc. 24h · COD · À partir de 39 DH.{/block}
{block name='head_schema'}
<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://odys.ma/#org","name":"ODYS Parfums","url":"https://odys.ma","foundingDate":"2026","address":{"@type":"PostalAddress","addressLocality":"Casablanca","addressCountry":"MA"}},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"ODYS livre-t-il dans tout le Maroc ?","acceptedAnswer":{"@type":"Answer","text":"Oui. 20 DH à Casablanca, 30 DH partout au Maroc. Gratuite dès 300 DH."}},{"@type":"Question","name":"Le COD est-il disponible ?","acceptedAnswer":{"@type":"Answer","text":"Oui, paiement à la livraison partout au Maroc."}},{"@type":"Question","name":"Comment fonctionne le programme fidélité ?","acceptedAnswer":{"@type":"Answer","text":"100 DH = 1 point. À 15 points : 5g Oud ou coffret gratuit. Oud/Flacons exclus."}}]}]}</script>
{/block}
{block name='content'}
<section class="hero" aria-label="{l s='ODYS Parfums' d='Shop.Theme.Odys'}">
  <div class="hero-txt">
    <div class="hero-eyebrow">{l s='ODYS.MA · ÉLABORÉ AU MAROC · EST. 2026' d='Shop.Theme.Odys'}</div>
    <h1 class="hero-h">{l s='L\'Odyssée' d='Shop.Theme.Odys'}<br><em>{l s='du Senteur' d='Shop.Theme.Odys'}</em></h1>
    <p class="hero-sub">{l s='L\'inspiration des plus grandes maisons de parfumerie mondiale — élaborée au Maroc, au prix juste.' d='Shop.Theme.Odys'}</p>
    <div class="hero-btns">
      <a href="{$urls.pages.category}" class="btn-p">{l s='DÉCOUVRIR LA COLLECTION' d='Shop.Theme.Odys'}</a>
      <a href="{$urls.base_url}oud-boukhour" class="btn-g">{l s='OUD &amp; BOUKHOUR' d='Shop.Theme.Odys'}</a>
    </div>
    <div class="hero-proof">
      <div class="hp-item"><strong>1 284+</strong><span>{l s='clients satisfaits' d='Shop.Theme.Odys'}</span></div>
      <div class="hp-sep">·</div>
      <div class="hp-item"><strong>4.9/5</strong><span>{l s='satisfaction' d='Shop.Theme.Odys'}</span></div>
      <div class="hp-sep">·</div>
      <div class="hp-item"><strong>24–48h</strong><span>{l s='livraison' d='Shop.Theme.Odys'}</span></div>
    </div>
  </div>
  <div class="hero-img">
    <a href="{$urls.pages.category}">
      <img src="{$urls.theme_assets}img/hero.jpg" loading="eager" fetchpriority="high" alt="{l s='ODYS Parfums Collection Maroc' d='Shop.Theme.Odys'}" width="560" height="640"/>
    </a>
  </div>
</section>
<section class="cat-strip"><div style="max-width:1280px;margin:0 auto"><div class="cat-grid">
  <a href="{$urls.pages.category}" class="cat-card"><div class="cat-ic">🌹</div><div class="cat-lbl">{l s='Parfums' d='Shop.Theme.Odys'}<br><small>30–100ml</small></div></a>
  <a href="{$urls.base_url}oud-boukhour" class="cat-card cat-oud"><div class="cat-ic">🪵</div><div class="cat-lbl">{l s='Oud &amp; Boukhour' d='Shop.Theme.Odys'}<br><small>{l s='Au gramme' d='Shop.Theme.Odys'}</small></div></a>
  <a href="{$urls.base_url}flacons-voyage" class="cat-card"><div class="cat-ic">🧪</div><div class="cat-lbl">{l s='Flacons Voyage' d='Shop.Theme.Odys'}<br><small>20·30·50·100ml</small></div></a>
  <a href="{$urls.base_url}coffrets" class="cat-card"><div class="cat-ic">🎁</div><div class="cat-lbl">{l s='Coffrets' d='Shop.Theme.Odys'}<br><small>{l s='Duo &amp; Trio, prêts à offrir' d='Shop.Theme.Odys'}</small></div></a>
</div></div></section>
<section class="bsec"><div style="max-width:1280px;margin:0 auto">
  <div class="sec-hd"><div class="sec-hd-left"><p>{l s='✦ Notre sélection' d='Shop.Theme.Odys'}</p><h2>{l s='Parfums d\'Inspiration Luxe' d='Shop.Theme.Odys'}</h2></div><a href="{$urls.pages.category}" class="sec-see-all">{l s='Voir tout →' d='Shop.Theme.Odys'}</a></div>
  <div class="pg" id="home-grid">
    {hook h='displayHome'}
    {foreach from=$featuredProducts item=product}
      {include file='catalog/_partials/miniatures/product.tpl' product=$product}
    {/foreach}
  </div>
</div></section>
<section class="why-sec"><div style="max-width:1280px;margin:0 auto">
  <div style="text-align:center;margin-bottom:48px"><div style="font-size:9px;letter-spacing:5px;text-transform:uppercase;color:var(--rose);margin-bottom:10px">{l s='Pourquoi choisir ODYS' d='Shop.Theme.Odys'}</div><h2 style="font-family:var(--serif);font-size:clamp(24px,4vw,38px);font-weight:500">{l s='L\'inspiration du luxe,' d='Shop.Theme.Odys'}<br><em>{l s='le prix ODYS' d='Shop.Theme.Odys'}</em></h2></div>
  <div class="why-grid">
    <div class="why-card"><div class="why-icon">🌹</div><h3>{l s='Formules de Luxe' d='Shop.Theme.Odys'}</h3><p>{l s='Inspirés des plus grandes maisons mondiales.' d='Shop.Theme.Odys'}</p></div>
    <div class="why-card"><div class="why-icon">🇲🇦</div><h3>{l s='Élaboré au Maroc' d='Shop.Theme.Odys'}</h3><p>{l s='Production locale, ingrédients sélectionnés.' d='Shop.Theme.Odys'}</p></div>
    <div class="why-card"><div class="why-icon">💰</div><h3>{l s='Prix Accessible' d='Shop.Theme.Odys'}</h3><p>{l s='À partir de 39 DH. Le luxe pour tous.' d='Shop.Theme.Odys'}</p></div>
    <div class="why-card"><div class="why-icon">🚚</div><h3>{l s='Livraison 24–48h' d='Shop.Theme.Odys'}</h3><p>{l s='20 DH Casa · 30 DH Maroc · Gratuite dès 300 DH.' d='Shop.Theme.Odys'}</p></div>
    <div class="why-card"><div class="why-icon">💚</div><h3>{l s='Paiement COD' d='Shop.Theme.Odys'}</h3><p>{l s='Payez en cash à la réception. Aucun risque.' d='Shop.Theme.Odys'}</p></div>
    <div class="why-card"><div class="why-icon">⭐</div><h3>{l s='Programme Fidélité' d='Shop.Theme.Odys'}</h3><p>{l s='100 DH = 1 point. 15 pts = 5g Oud offert.' d='Shop.Theme.Odys'}</p></div>
  </div>
</div></section>
{hook h='displayReassurance'}
{/block}
