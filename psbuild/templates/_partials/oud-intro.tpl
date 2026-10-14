{*
 * ODYS Parfums — Oud & Boukhour intro
 * Hero, collection header, guarantees and the return note for the
 * oud-boukhour category. Included by catalog/listing.tpl; the layout adds
 * `oud` to <body> for this category, which is what scopes the smoke-and-
 * amber layer in theme.css.
 *}
<section class="oud-hero" aria-labelledby="oud-hero-title">
  <div class="oud-hero-media" aria-hidden="true">
    <img src="{$urls.theme_assets}img/oud-hero.webp" alt=""
         loading="eager" fetchpriority="high" decoding="async"
         width="1600" height="900"/>
  </div>

  <div class="oud-hero-in">
    <div class="oud-hero-txt">
      <p class="oud-eyebrow">{l s='Notre Cœur de Marque · Identité ODYS' d='Shop.Theme.Odys'}</p>
      <h1 id="oud-hero-title">{l s='L\'Oud.' d='Shop.Theme.Odys'}<em>{l s='Notre héritage.' d='Shop.Theme.Odys'}</em></h1>
      <p class="lede">{l s='Oud naturel au gramme. Origines certifiées — Hindi Assam,
        Royal Hindi, Thai Select. Prix transparent : vous payez notre coût
        d\'achat + 18% marge fixe. Rien de caché.' d='Shop.Theme.Odys'}</p>

      <a href="#oud-collection" class="oud-btn">
        {l s='Découvrir la collection' d='Shop.Theme.Odys'} <span class="arw" aria-hidden="true">&rarr;</span>
      </a>

      <div class="oud-chips">
        <div class="oud-chip"><b>{l s='Prix transparent' d='Shop.Theme.Odys'}</b><span>{l s='Coût réel + 18% marge' d='Shop.Theme.Odys'}</span></div>
        <div class="oud-chip"><b>{l s='Origine certifiée' d='Shop.Theme.Odys'}</b><span>{l s='Inde · Thaïlande' d='Shop.Theme.Odys'}</span></div>
        <div class="oud-chip"><b>{l s='Au gramme' d='Shop.Theme.Odys'}</b><span>{l s='Commande sur mesure' d='Shop.Theme.Odys'}</span></div>
      </div>
    </div>
  </div>
</section>

<div class="oud-sec-hd" id="oud-collection">
  <p class="oud-kicker">{l s='Héritage Marocain · Collection Oud' d='Shop.Theme.Odys'}</p>
  <h2>{l s='Oud &amp; Boukhour Artisanal' d='Shop.Theme.Odys'}</h2>
  <p>{l s='L\'or liquide de l\'Orient — sélectionné à la source, vendu au gramme.
    Choisissez exactement la quantité qu\'il vous faut.' d='Shop.Theme.Odys'}</p>

  <div class="oud-chips" style="justify-content:center">
    <div class="oud-chip"><b>{l s='Vendu au gramme' d='Shop.Theme.Odys'}</b></div>
    <div class="oud-chip"><b>{l s='Origine certifiée' d='Shop.Theme.Odys'}</b></div>
    <div class="oud-chip"><b>{l s='COD disponible' d='Shop.Theme.Odys'}</b></div>
    <div class="oud-chip"><b>{l s='Non inclus dans les points fidélité' d='Shop.Theme.Odys'}</b></div>
  </div>
</div>

<section class="oud-values" aria-label="{l s='Garanties Oud &amp; Boukhour' d='Shop.Theme.Odys'}">
  <div class="oud-values-in">

    <div class="oud-value">
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 6v20M9 26h14M6 12h20M16 8.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
        <path d="M6 12l-3.5 7a3.6 3.6 0 0 0 7 0z"/>
        <path d="M26 12l-3.5 7a3.6 3.6 0 0 0 7 0z"/>
      </svg>
      <div><b>{l s='Vendu au gramme' d='Shop.Theme.Odys'}</b><span>{l s='Quantité exacte' d='Shop.Theme.Odys'}</span></div>
    </div>

    <div class="oud-value">
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="13" r="8"/>
        <path d="M16 9.5l1.4 3.1 3.1 1.4-3.1 1.4L16 18.5l-1.4-3.1-3.1-1.4 3.1-1.4z"/>
        <path d="M11.5 20.5L9 29l7-3.4L23 29l-2.5-8.5"/>
      </svg>
      <div><b>{l s='Origines certifiées' d='Shop.Theme.Odys'}</b><span>{l s='Inde · Thaïlande' d='Shop.Theme.Odys'}</span></div>
    </div>

    <div class="oud-value">
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <rect x="2.5" y="9" width="17" height="12" rx="1.5"/>
        <path d="M19.5 12.5h4.6l4.4 4.4V21h-9z"/>
        <circle cx="9" cy="23.5" r="2.4"/><circle cx="23" cy="23.5" r="2.4"/>
      </svg>
      <div><b>{l s='Livraison 24–48h' d='Shop.Theme.Odys'}</b><span>{l s='Emballage hermétique' d='Shop.Theme.Odys'}</span></div>
    </div>

    <div class="oud-value">
      <svg viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <path d="M16 4l10 4v8c0 6.4-4.2 10.4-10 12-5.8-1.6-10-5.6-10-12V8z"/>
        <path d="M16 11v6M16 20.5v.5"/>
      </svg>
      <div><b>{l s='Hors fidélité' d='Shop.Theme.Odys'}</b><span>{l s='Pas de points' d='Shop.Theme.Odys'}</span></div>
    </div>

  </div>
</section>

<div class="oud-note" role="note">
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M12 3l9.5 16.5H2.5z"/><path d="M12 10v4M12 17v.5"/>
  </svg>
  <div>
    <b>{l s='Politique de retour — Oud &amp; Boukhour' d='Shop.Theme.Odys'}</b>
    <p>{l s='Les produits Oud et Boukhour' d='Shop.Theme.Odys'} <strong>{l s='ne sont pas éligibles au retour' d='Shop.Theme.Odys'}</strong>
      {l s='en raison de leur nature périssable et des exigences d\'hygiène. Une fois
      expédié, l\'article ne peut pas être retourné. En cas de produit défectueux,
      contactez-nous immédiatement via WhatsApp avec photo à l\'appui.' d='Shop.Theme.Odys'}</p>
  </div>
</div>
