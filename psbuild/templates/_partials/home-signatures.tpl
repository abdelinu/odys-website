{*
 * ODYS Parfums — Collection signature (Nuit)
 * Three ODYS flacons on stone plinths over the Tinmel arches
 * (img/nuit-arches.webp). The bottles are drawn by odys-bottle.tpl, so each
 * label reads its own number and name.
 *
 * Data: assign $signatures from a controller or module to drive this from
 * the catalogue. Each entry: num ('14'), code ('ODYS 14'), tone
 * (noir|marine|creme — sets the glow), eyebrow, tier, name, volume, mood,
 * desc, url. Without it the block falls back to the three house signatures
 * below, so the page never renders empty.
 *}
{if !isset($signatures) || !$signatures}
  {assign var='sigUrlNoir'   value="`$odysUrlParfums`#fam-oriental"}
  {assign var='sigUrlMarine' value="`$odysUrlParfums`#fam-fresh"}
  {assign var='sigUrlCreme'  value=$odysUrlParfums}
  {assign var='signatures' value=[
    ['num'=>'14','code'=>'ODYS 14','tone'=>'noir','eyebrow'=>'Noir & Or','tier'=>'Prestige',
     'name'=>"L'Oriental",'volume'=>'Extrait de Parfum · 50 ml',
     'mood'=>'Intense & sophistiqué',
     'desc'=>"Un noir profond, symbole d'élégance et de caractère.",
     'url'=>$sigUrlNoir],
    ['num'=>'07','code'=>'ODYS 07','tone'=>'marine','eyebrow'=>'Marine & Or','tier'=>'Élégant',
     'name'=>'La Nuit','volume'=>'Extrait de Parfum · 50 ml',
     'mood'=>'Frais & raffiné',
     'desc'=>'Un bleu marine intemporel, évoquant la profondeur et la liberté.',
     'url'=>$sigUrlMarine],
    ['num'=>'11','code'=>'ODYS 11','tone'=>'creme','eyebrow'=>'Crème & Or','tier'=>'Classique',
     'name'=>"L'Or",'volume'=>'Extrait de Parfum · 50 ml',
     'mood'=>'Doux & intemporel',
     'desc'=>"Un crème délicat, symbole de pureté et d'élégance naturelle.",
     'url'=>$sigUrlCreme]
  ]}
{/if}

<section class="nv-sig reveal" aria-labelledby="nv-sig-title">
  <figure class="nv-bg" aria-hidden="true">
    <img src="{$urls.theme_assets}img/nuit-arches.webp" alt="" width="1600" height="900"
         loading="lazy" decoding="async"/>
  </figure>

  <div class="nv-sig-in">
    <div class="nv-sig-txt">
      <p class="nv-eyebrow">{l s='Collection signature' d='Shop.Theme.Odys'}</p>
      <h2 class="nv-h2" id="nv-sig-title">{l s='Des fragrances d\'exception' d='Shop.Theme.Odys'}</h2>
      <p class="nv-lede">{l s='Une sélection raffinée de nos créations les plus
        emblématiques, inspirées par la richesse du Maroc.' d='Shop.Theme.Odys'}</p>
      <a href="{$odysUrlParfums}" class="nv-btn nv-btn-pill">{l s='Voir toute la collection' d='Shop.Theme.Odys'}
        <span class="arw" aria-hidden="true">&rarr;</span></a>
    </div>

    <ul class="nv-bottles" role="list">
      {foreach from=$signatures item=sig}
        <li class="nv-bottle nv-tone-{$sig.tone}">
          <a href="{$sig.url}">
            <figure class="nv-bottle-fig">
              {include file='_partials/odys-bottle.tpl' num=$sig.num name=$sig.name}
            </figure>
            <span class="nv-b-code">{$sig.code|escape:'html':'UTF-8'}</span>
            <span class="nv-b-name">{$sig.name|escape:'html':'UTF-8'}</span>
            <span class="nv-b-mood">{$sig.mood|escape:'html':'UTF-8'}</span>
          </a>
        </li>
      {/foreach}
    </ul>
  </div>
</section>
