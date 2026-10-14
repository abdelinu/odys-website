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
  {assign var='odysSub' value=Configuration::get('ODYS_HERO_SUB')}
  {assign var='odysLede' value=Configuration::get('ODYS_HERO_LEDE')}
  {assign var='odysCta' value=Configuration::get('ODYS_HERO_CTA')}
  {* Les destinations aussi se reglent en Back Office : le bouton menait
     toujours a la collection de parfums, ce qui empechait d'ouvrir la
     banniere sur une nouveaute ou sur un coffret. Le controleur refuse
     tout ce qui ne commence pas par https:// ou par / . *}
  {assign var='odysCtaUrl' value=Configuration::get('ODYS_HERO_CTA_URL')}
  {assign var='odysLink' value=Configuration::get('ODYS_HERO_LINK')}
  {assign var='odysLinkUrl' value=Configuration::get('ODYS_HERO_LINK_URL')}
  {if !$odysEyebrow}{assign var='odysEyebrow' value="L'art de l'essence"}{/if}
  {if !$odysTitle1}{assign var='odysTitle1' value="Plus qu'un parfum,"}{/if}
  {* Un titre d'un seul mot existe : « L'Icône ». Vider la seconde ligne
     en Back Office doit donc la supprimer, pas rappeler celle d'origine.
     Jamais enregistree (false) = on sert celle du theme ; enregistree
     vide ('') = la maison n'en veut pas. Les autres champs gardent leur
     repli : un bouton sans libelle ou une banniere sans titre seraient
     une page cassee, pas un choix. *}
  {if $odysTitle2 === false}{assign var='odysTitle2' value='une émotion'}{/if}
  {if !$odysSub}{assign var='odysSub' value='Une essence de liberté et de féminité'}{/if}
  {if !$odysLede}{assign var='odysLede' value="Des essences rares, un savoir-faire intemporel. Découvrez l'univers ODYS."}{/if}
  {if !$odysCta}{assign var='odysCta' value='Découvrir la collection'}{/if}
  {* Une destination ecrite a la main en Back Office est un chemin nu :
     « /parfums/20-l-icone.html ». Depuis que la boutique a trois langues,
     PrestaShop prefixe ses adresses — ce chemin-la menait donc hors langue,
     le serveur repondait par une redirection, et le visiteur arabe
     atterrissait en francais. On lui remet sa langue devant. *}
  {if $odysCtaUrl && $odysCtaUrl|substr:0:1 === '/' && $odysCtaUrl|substr:0:3 !== '/'|cat:$language.iso_code|cat:'/'}
    {assign var='odysCtaUrl' value="/`$language.iso_code`$odysCtaUrl"}
  {/if}
  {if $odysLinkUrl && $odysLinkUrl|substr:0:1 === '/' && $odysLinkUrl|substr:0:3 !== '/'|cat:$language.iso_code|cat:'/'}
    {assign var='odysLinkUrl' value="/`$language.iso_code`$odysLinkUrl"}
  {/if}
  {if !$odysCtaUrl}{assign var='odysCtaUrl' value=$odysUrlParfums}{/if}
  {if !$odysLink}{assign var='odysLink' value='Oud & Boukhour'}{/if}
  {if !$odysLinkUrl}{assign var='odysLinkUrl' value=$odysUrlOud}{/if}

  {assign var='odysSlides' value=[
    [
      'img' => $odysImg1,
      'eyebrow' => $odysEyebrow,
      't1' => $odysTitle1,
      't2' => $odysTitle2,
      'sub' => $odysSub,
      'lede' => $odysLede,
      'cta' => $odysCta,
      'url' => $odysCtaUrl,
      'lbl2' => $odysLink,
      'url2' => $odysLinkUrl
    ]
  ]}
  {* Le second visuel se coupe en Back Office. Jamais enregistre vaut oui :
     une boutique qui n'a pas ouvert l'ecran garde la banniere d'avant. *}
  {if Configuration::get('ODYS_HERO_SLIDE2') !== '0'}
    {append var='odysSlides' value=[
      'img' => "`$urls.theme_assets`img/nuit-riad.webp",
      'eyebrow' => 'Oud & Boukhour',
      't1' => 'Le bois',
      't2' => 'avant le parfum',
      'sub' => 'Vendus au gramme, pesés devant vous',
      'lede' => 'Oud, boukhour et encens, vendus au gramme.',
      'cta' => "Découvrir l'oud",
      'url' => $odysUrlOud,
      'lbl2' => 'Tous les parfums',
      'url2' => $odysUrlParfums
    ]}
  {/if}

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
    <div class="oh-dots" role="tablist" aria-label="{l s='Visuels de la page d\'accueil' d='Shop.Theme.Odys'}">
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
        {* Le titre tient sur deux lignes, et la seconde peut etre vide : un
           titre d'un seul mot ne doit pas trainer un <br> derriere lui. *}
        {if $smarty.foreach.tx.first}
          <h1 id="nv-hero-title">{$odysSlide.t1|escape:'html':'UTF-8'}{if $odysSlide.t2}<br>{$odysSlide.t2|escape:'html':'UTF-8'}{/if}</h1>
        {else}
          <h2 class="nv-h1">{$odysSlide.t1|escape:'html':'UTF-8'}{if $odysSlide.t2}<br>{$odysSlide.t2|escape:'html':'UTF-8'}{/if}</h2>
        {/if}
        {* Le sous-titre : la phrase qui qualifie le parfum, entre le titre et
           le texte. Vide, il ne laisse pas de place vide. *}
        {if $odysSlide.sub}
          <p class="nv-sub">{$odysSlide.sub|escape:'html':'UTF-8'}</p>
        {/if}
        <p class="nv-lede">{$odysSlide.lede|escape:'html':'UTF-8'}</p>
        <div class="nv-hero-cta">
          {* ces deux adresses peuvent venir du Back Office : on les echappe *}
          <a href="{$odysSlide.url|escape:'html':'UTF-8'}" class="nv-btn"{if !$smarty.foreach.tx.first} tabindex="-1"{/if}>{$odysSlide.cta|escape:'html':'UTF-8'}
            <span class="arw" aria-hidden="true">&rarr;</span></a>
          <a href="{$odysSlide.url2|escape:'html':'UTF-8'}" class="nv-link"{if !$smarty.foreach.tx.first} tabindex="-1"{/if}>{$odysSlide.lbl2|escape:'html':'UTF-8'}</a>
        </div>
      </div>
    {/foreach}
  </div>

  <p class="sr-only">{l s='De l\'oud à l\'essence : une goutte précieuse rejoint le
    parfum ODYS.' d='Shop.Theme.Odys'}</p>
  <span class="nv-scroll" aria-hidden="true">{l s='Scroll' d='Shop.Theme.Odys'}<i></i></span>
</section>
