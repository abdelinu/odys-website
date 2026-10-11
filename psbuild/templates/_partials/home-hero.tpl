{*
 * ODYS Parfums — Hero "L'art de l'essence"
 *
 * Une image fixe, plus un film. La video jouait huit secondes puis se figeait
 * sur sa derniere image : c'est cette image-la qui reste, servie directement.
 * Un mega-octet de moins a telecharger sur un telephone marocain, et plus
 * rien qui bouge pendant qu'on lit le titre.
 *
 * L'image reste remplacable en Back Office -> Apparence -> Theme ODYS
 * (ODYS_HERO_POSTER) ; sans reglage, celle du theme est utilisee.
 *
 * The footage is a 21:9 band, composed with its subject centre-right and its
 * own caption on the left. It runs full-bleed behind the words; the scrim in
 * theme-additions.css both darkens the left for legibility and puts that
 * baked caption back into the smoke, so the page says each sentence once.
 *
 * The words are real text — headline, lede and both calls to action stay
 * selectable, translatable and crawlable.
 *}
{* Runs while the parser is here, before the hero has been painted once.
   motion.js used to set this, but it loads at the end of the page: the words
   were painted, then hidden, then faded back in — a flicker on every visit to
   the home page, and most visible coming back to it from the logo.

   If scripting is off this never runs, nothing is hidden, and the hero reads
   as a finished page. If it runs but motion.js never does (a failed asset, a
   script error), the timer below still brings the words up, so the copy can
   never be left invisible. *}
<script>
  document.documentElement.classList.add('odys-js');
  setTimeout(function () {
    var hero = document.querySelector('[data-odys-hero]');
    if (hero && !hero.classList.contains('is-told')) { hero.classList.add('is-told'); }
  }, 3000);
</script>
<section class="nv-hero odys-film-hero" aria-labelledby="nv-hero-title" data-odys-hero>
  {* Les visuels du hero. Le premier reste remplacable en Back Office
     (ODYS_HERO_POSTER) ; les suivants viennent du theme. Avec un seul
     visuel, aucun point ne s'affiche et aucun script ne tourne : le hero
     redevient exactement l'image fixe d'avant. *}
  {assign var='odysPoster' value=Configuration::get('ODYS_HERO_POSTER')}
  {* Smarty refuse un ternaire dans un litteral de tableau : on calcule
     la premiere image avant, puis on compose la liste. *}
  {if $odysPoster}
    {assign var='odysImg1' value="`$urls.img_ps_url`odys/`$odysPoster`"}
  {else}
    {assign var='odysImg1' value="`$urls.theme_assets`img/hero/odys-essence-poster.webp"}
  {/if}
  {* Un visuel par destination, et chacun porte ses propres mots. Le
     carrousel changeait l'image sous un titre fixe : le deuxieme visuel ne
     menait nulle part et ne disait rien.

     flacon-signature.webp est parti : le flacon qu'on y voyait porte la
     marque d'une autre maison, lisible en toutes lettres. Sur la page
     d'accueil d'ODYS, c'etait le produit d'un concurrent presente comme le
     notre. Avec deux visuels le carrousel fonctionne a l'identique ; avec
     un seul il redevient l'image fixe. *}
  {assign var='odysEyebrow' value=Configuration::get('ODYS_HERO_EYEBROW')}
  {assign var='odysTitle1' value=Configuration::get('ODYS_HERO_TITLE_1')}
  {assign var='odysTitle2' value=Configuration::get('ODYS_HERO_TITLE_2')}
  {assign var='odysLede' value=Configuration::get('ODYS_HERO_LEDE')}
  {assign var='odysCta' value=Configuration::get('ODYS_HERO_CTA')}
  {if !$odysEyebrow}{assign var='odysEyebrow' value="L'art de l'essence"}{/if}
  {if !$odysTitle1}{assign var='odysTitle1' value="Plus qu'un parfum,"}{/if}
  {if !$odysTitle2}{assign var='odysTitle2' value='une émotion'}{/if}
  {if !$odysLede}{assign var='odysLede' value="Des essences rares, un savoir-faire intemporel. Découvrez l'univers ODYS."}{/if}
  {if !$odysCta}{assign var='odysCta' value='Découvrir la collection'}{/if}

  {assign var='odysSlides' value=[
    [
      'img' => $odysImg1,
      'eyebrow' => $odysEyebrow,
      't1' => $odysTitle1,
      't2' => $odysTitle2,
      'lede' => $odysLede,
      'cta' => $odysCta,
      'url' => $odysUrlParfums,
      'lbl2' => 'Oud & Boukhour',
      'url2' => $odysUrlOud
    ],
    [
      'img' => "`$urls.theme_assets`img/nuit-riad.webp",
      'eyebrow' => 'Oud & Boukhour',
      't1' => 'Le bois',
      't2' => 'avant le parfum',
      'lede' => 'Oud, boukhour et encens, vendus au gramme.',
      'cta' => "Découvrir l'oud",
      'url' => $odysUrlOud,
      'lbl2' => 'Tous les parfums',
      'url2' => $odysUrlParfums
    ]
  ]}

  <div class="oh-film" data-odys-film data-odys-carrousel aria-hidden="true">
    {foreach from=$odysSlides item=odysSlide name=sl}
      <img class="oh-video oh-slide{if $smarty.foreach.sl.first} is-on{/if}"
           src="{$odysSlide.img|escape:'html':'UTF-8'}"
           alt="" width="1470" height="630"
           {if $smarty.foreach.sl.first}fetchpriority="high"{else}loading="lazy"{/if}
           decoding="async"/>
    {/foreach}
  </div>

  {if $odysSlides|@count > 1}
    <div class="oh-dots" role="tablist" aria-label="Visuels de la page d'accueil">
      {foreach from=$odysSlides item=odysSlide name=dt}
        <button type="button" class="oh-dot{if $smarty.foreach.dt.first} is-on{/if}"
                role="tab" data-odys-dot="{$smarty.foreach.dt.index}"
                aria-selected="{if $smarty.foreach.dt.first}true{else}false{/if}"
                aria-label="{$odysSlide.eyebrow|escape:'html':'UTF-8'}"></button>
      {/foreach}
    </div>
  {/if}

  <div class="nv-hero-in">
    {* Les panneaux se superposent dans la meme case de grille : la hauteur
       est celle du plus grand, donc rien ne saute au changement de visuel.
       Tous sont dans le document — lisibles par un moteur de recherche et
       par un lecteur d'ecran, meme sans script. *}
    {foreach from=$odysSlides item=odysSlide name=tx}
      <div class="nv-hero-txt oh-txt{if $smarty.foreach.tx.first} is-on{/if}"
           data-odys-txt="{$smarty.foreach.tx.index}"
           {if !$smarty.foreach.tx.first}aria-hidden="true"{/if}>
        <p class="nv-eyebrow">{$odysSlide.eyebrow|escape:'html':'UTF-8'}</p>
        {* un seul <h1> par page : les visuels suivants prennent un <h2>,
           qui porte le meme style *}
        {if $smarty.foreach.tx.first}
          <h1 id="nv-hero-title">{$odysSlide.t1|escape:'html':'UTF-8'}<br>{$odysSlide.t2|escape:'html':'UTF-8'}</h1>
        {else}
          <h2 class="nv-h1">{$odysSlide.t1|escape:'html':'UTF-8'}<br>{$odysSlide.t2|escape:'html':'UTF-8'}</h2>
        {/if}
        <p class="nv-lede">{$odysSlide.lede|escape:'html':'UTF-8'}</p>
        <div class="nv-hero-cta">
          <a href="{$odysSlide.url}" class="nv-btn"{if !$smarty.foreach.tx.first} tabindex="-1"{/if}>{$odysSlide.cta|escape:'html':'UTF-8'}
            <span class="arw" aria-hidden="true">&rarr;</span></a>
          <a href="{$odysSlide.url2}" class="nv-link"{if !$smarty.foreach.tx.first} tabindex="-1"{/if}>{$odysSlide.lbl2|escape:'html':'UTF-8'}</a>
        </div>
      </div>
    {/foreach}
  </div>

  <p class="sr-only">De l'oud à l'essence : une goutte précieuse rejoint le
    parfum ODYS.</p>
  <span class="nv-scroll" aria-hidden="true">Scroll<i></i></span>
</section>
