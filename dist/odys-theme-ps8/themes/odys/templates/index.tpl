{extends file='layouts/layout-full-width.tpl'}

{block name='head_title'}ODYS Parfums | Extrait de Parfum — Maison de Senteur, Casablanca{/block}
{block name='head_desc'}ODYS Parfums — compositions raffinées élaborées au Maroc. Extrait de parfum, oud naturel au gramme. Livraison 24–48h · Paiement à la livraison · Dès 39 DH.{/block}

{block name='head_schema'}
<script type="application/ld+json">{literal}{"@context":"https://schema.org","@graph":[{"@type":"Organization","@id":"https://odys.ma/#org","name":"ODYS Parfums","url":"https://odys.ma","foundingDate":"2026","address":{"@type":"PostalAddress","addressLocality":"Casablanca","addressCountry":"MA"}},{"@type":"FAQPage","mainEntity":[{"@type":"Question","name":"ODYS livre-t-il dans tout le Maroc ?","acceptedAnswer":{"@type":"Answer","text":"Oui. 20 DH à Casablanca, 30 DH partout au Maroc. Gratuite dès 300 DH."}},{"@type":"Question","name":"Le paiement à la livraison est-il disponible ?","acceptedAnswer":{"@type":"Answer","text":"Oui, paiement à la livraison partout au Maroc."}},{"@type":"Question","name":"Comment fonctionne le programme fidélité ?","acceptedAnswer":{"@type":"Answer","text":"100 DH = 1 point. À 15 points : 5g Oud ou coffret offert. Oud exclu."}}]}]}{/literal}</script>
{/block}

{block name='content'}

  {include file='_partials/home-hero.tpl'}

  {* Les produits d'abord. Un visiteur venu d'Instagram traversait six sections
     avant de voir un prix : la grille etait ecrite depuis le debut, mais
     $featuredProducts n'etait rempli par personne. odys_crm l'alimente
     maintenant (classes/OdysAccueil.php). *}
  {* PrestaShop's home controller does not assign $featuredProducts — the
     ps_featuredproducts module renders them through displayHome (the band
     below). Without this guard the loop printed PHP warnings into the grid
     and stretched the page ~1600px sideways. Assign $featuredProducts from a
     module or controller override to use this section instead. *}
  {if isset($featuredProducts) && $featuredProducts}
  <section class="bsec reveal" aria-labelledby="home-featured-title">
    <div>
      <div class="sec-hd">
        <div class="sec-hd-left">
          <p>Commencez ici</p>
          <h2 id="home-featured-title">La boutique</h2>
        </div>
        <a href="{$odysUrlParfums}" class="sec-see-all">Voir tout</a>
      </div>

      {* Les familles presentes dans la selection, rien de plus : une puce
         qui ne filtre rien n'a pas de raison d'etre affichee. Le script du
         theme ecoute deja #featGrid comme il ecoute #collGrid (app.js,
         filtre-fam) — il n'y avait que ce balisage a poser. *}
      {* Les onglets : un par rayon rempli. Ils ne rechargent pas la page —
         les cartes des trois rayons sont deja dans la grille, chacune
         marquee de son rayon, et le filtre du theme n'en montre qu'un.
         Sans script, aucun bouton ne repond et la grille reste entiere :
         on voit toute la boutique, ce qui est le bon repli. *}
      {if isset($odysOnglets) && $odysOnglets|@count > 1}
        <div class="og-onglets" role="group" aria-label="Rayons de la boutique">
          <button class="og on" type="button" data-action="filter-onglet"
                  data-onglet="all" aria-pressed="true">Tout</button>
          {foreach from=$odysOnglets key=odysOngCle item=odysOngNom}
            <button class="og" type="button" data-action="filter-onglet"
                    data-onglet="{$odysOngCle|escape:'html':'UTF-8'}"
                    aria-pressed="false">{$odysOngNom|escape:'html':'UTF-8'}</button>
          {/foreach}
        </div>
      {/if}

      {assign var='odysFamsAcc' value=[]}
      {foreach from=$featuredProducts item=odysPA}
        {assign var='odysFA' value=''}
        {if isset($odysPA.features)}
          {foreach from=$odysPA.features item=odysFtA}
            {if $odysFtA.name == 'Famille olfactive'}{assign var='odysFA' value=$odysFtA.value|lower}{/if}
          {/foreach}
        {/if}
        {* Meme decoupage que la page collection : « oud oriental » compte
           pour les deux puces, exactement comme le filtre du theme qui
           cherche la famille en sous-chaine. Une normalisation maison
           retombait sur « fresh » pour tout ce qu'elle ne reconnaissait
           pas, et la puce « Sucre » ne sortait jamais. *}
        {foreach from=' '|explode:$odysFA item=odysWA}
          {assign var='odysWA' value=$odysWA|trim}
          {if $odysWA && !($odysWA|in_array:$odysFamsAcc)}{append var='odysFamsAcc' value=$odysWA}{/if}
        {/foreach}
      {/foreach}

      {if $odysFamsAcc|@count > 1}
        {assign var='odysFamNomsAcc' value=['fresh'=>'Frais','oriental'=>'Oriental','sweet'=>'Sucré','oud'=>'Oud']}
        <div class="fam-filters" role="group" aria-labelledby="fam-lbl-acc">
          <span class="fam-lbl" id="fam-lbl-acc">Famille</span>
          <button class="ff on" type="button" data-action="filter-fam" data-fam="all" aria-pressed="true">Tout</button>
          {foreach from=$odysFamNomsAcc key=odysFamCleA item=odysFamNomA}
            {if $odysFamCleA|in_array:$odysFamsAcc}
              <button class="ff" type="button" data-action="filter-fam"
                      data-fam="{$odysFamCleA}" aria-pressed="false">{$odysFamNomA}</button>
            {/if}
          {/foreach}
        </div>
      {/if}

      <div class="pg" id="featGrid">
        {foreach from=$featuredProducts item=product}
          {include file='catalog/_partials/miniatures/product.tpl' product=$product
                   odysOnglet=$product.odys_onglet|default:''}
        {/foreach}
      </div>
      {* Deux filtres qui se croisent peuvent ne rien laisser : « Diffuseurs »
         et « Sucré », par exemple. Sans ce mot la grille tombait a zero
         pixel et la boutique paraissait vide. *}
      <p class="pg-vide" id="accVide" hidden>Rien dans ce rayon pour cette
        famille. Changez l'un ou l'autre.</p>
    </div>
  </section>
  {/if}

  {* Les coffrets, juste apres les parfums. Le coffret de decouverte existait
     au catalogue mais n'etait nulle part sur l'accueil : on ne tombait
     dessus qu'en ouvrant le menu. C'est pourtant la premiere chose qu'on propose a
     quelqu'un qui ne connait pas la maison — il repart avec deux ou trois
     fragrances au lieu d'hesiter devant treize.

     Rien n'est ecrit en dur : la bande vient de la categorie « coffrets » et
     disparait entierement si elle est vide. Les cartes disent les prix
     elles-memes ; aucune promesse d'economie n'est affichee ici, elle
     cesserait d'etre vraie le jour ou un prix bouge. *}
  {if isset($odysCoffrets) && $odysCoffrets}
  <section class="bsec reveal" aria-labelledby="home-coffrets-title">
    <div>
      <div class="sec-hd">
        <div class="sec-hd-left">
          <p>Pour découvrir</p>
          <h2 id="home-coffrets-title">Nos coffrets</h2>
        </div>
        <a href="{$odysUrlCoffrets}" class="sec-see-all">Voir tout</a>
      </div>

      <div class="pg" id="coffretsGrid">
        {foreach from=$odysCoffrets item=product}
          {include file='catalog/_partials/miniatures/product.tpl' product=$product}
        {/foreach}
      </div>
    </div>
  </section>
  {/if}


  {include file='_partials/home-categories.tpl'}

  {include file='_partials/home-signatures.tpl'}

  {include file='_partials/home-pyramid.tpl'}


  {* displayHome renders whole module sections (image slider, featured
     products, banners). Inside .pg they became grid items ~1230px wide and
     pushed the page 1500px sideways on a real shop — they belong in their own
     full-width band. *}
  {capture name='odysHomeModules'}{hook h='displayHome'}{/capture}
  {if trim($smarty.capture.odysHomeModules) !== ''}
  <section class="home-modules reveal" aria-label="Sélections de la boutique">
    <div>
      {$smarty.capture.odysHomeModules nofilter}
    </div>
  </section>
  {/if}

  {include file='_partials/home-essence.tpl'}

  <section class="why-sec reveal" aria-labelledby="home-why-title">
    <div>
      <div class="sec-hd">
        <div class="sec-hd-left">
          <p>Pourquoi ODYS</p>
          <h2 id="home-why-title">L'inspiration du luxe, le prix juste</h2>
        </div>
      </div>

      {* Photo-led, numbered. Images live in assets/img/why-*.webp (Unsplash
         License, checked for branding); overwrite the files to swap in ODYS
         photography — same names, no template change. *}
      <ol class="why-grid">
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-concentration.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Flacon ODYS Parfum 01 L'Icône et son coffret crème, sur marbre"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">01</span>
            <h3>Concentration exceptionnelle</h3>
            <p>18–20 % de concentré, l'équivalent d'un Eau de Parfum. Tenue mesurée 7 à 9 heures.</p>
          </div>
        </li>
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-maroc.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Cour marocaine aux colonnes de zellige et de stuc sculpté"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">02</span>
            <h3>Élaboré au Maroc</h3>
            <p>Production à Casablanca, matières sélectionnées, contrôle à chaque lot.</p>
          </div>
        </li>
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-oud.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Mabkhara fumante posée sur un tapis oriental"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">03</span>
            <h3>Oud vendu au gramme</h3>
            <p>Notre coût d'achat plus une marge fixe. Le prix suit les récoltes, sans opacité.</p>
          </div>
        </li>
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-livraison.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Colis en carton kraft fermé, dans une lumière chaude"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">04</span>
            <h3>Livraison 24–48 h</h3>
            <p>20 DH à Casablanca, 30 DH partout au Maroc, offerte dès 300 DH.</p>
          </div>
        </li>
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-paiement.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Coffret blanc ouvert posé sur une table claire"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">05</span>
            <h3>Paiement à la livraison</h3>
            <p>Réglez en espèces à la réception. CMI, Visa et virement également acceptés.</p>
          </div>
        </li>
        <li class="why-card">
          <figure class="why-media">
            <img src="{$urls.theme_assets}img/why-fidelite.webp" width="960" height="720"
                 loading="lazy" decoding="async"
                 alt="Flacon d'huile d'oud ambrée au bouchon doré"/>
          </figure>
          <div class="why-body">
            <span class="why-num" aria-hidden="true">06</span>
            <h3>Programme fidélité</h3>
            <p>100 DH dépensés = 1 point. À 15 points, 5 g d'oud ou un coffret offert.</p>
          </div>
        </li>
      </ol>
    </div>
  </section>

  {include file='_partials/home-avis.tpl'}

  {include file='_partials/home-values.tpl'}

  {include file='_partials/quiz-dialog.tpl'}

  {hook h='displayReassurance'}

{/block}
