{*
 * ODYS Parfums — Trouvez votre ODYS
 * The four olfactory families the catalogue filters on (data-fam on each
 * product: fresh | oriental | sweet | oud). Each circle opens the collection
 * with that filter pressed (#fam-…, handled in app.js); the quiz button opens
 * _partials/quiz-dialog.tpl. Without JS both are plain collection links.
 *}
<section class="nv-fam" aria-labelledby="nv-fam-title">
  <figure class="nv-bg" aria-hidden="true">
    <img src="{$urls.theme_assets}img/nuit-strip.webp" alt="" width="1400" height="800"
         loading="lazy" decoding="async"/>
  </figure>

  <div class="nv-fam-in">
    {* editable in Back Office → Apparence → Thème ODYS; empty keeps these *}
    {assign var='odysCollEyebrow' value=Configuration::get('ODYS_COLL_EYEBROW')}
    {assign var='odysCollTitle' value=Configuration::get('ODYS_COLL_TITLE')}
    {assign var='odysCollSub' value=Configuration::get('ODYS_COLL_SUB')}
    <p class="nv-eyebrow">{if $odysCollEyebrow}{$odysCollEyebrow|escape:'html':'UTF-8'}{else}{l s='Nos collections' d='Shop.Theme.Odys'}{/if}</p>
    <h2 class="nv-h2" id="nv-fam-title">{if $odysCollTitle}{$odysCollTitle|escape:'html':'UTF-8'}{else}{l s='Trouvez votre ODYS' d='Shop.Theme.Odys'}{/if}</h2>
    <p class="nv-sub">{if $odysCollSub}{$odysCollSub|escape:'html':'UTF-8'}{else}{l s='Quelle fragrance vous correspond ?' d='Shop.Theme.Odys'}{/if}</p>

    <div class="nv-fam-row">
      <ul class="nv-notes" role="list">
        <li class="nv-note">
          <a href="{$odysUrlParfums}#fam-fresh">
            <span class="nv-note-img"><img src="{$urls.theme_assets}img/note-frais.webp" alt=""
              width="320" height="320" loading="lazy" decoding="async"/></span>
            <span class="nv-note-lbl">{l s='Frais' d='Shop.Theme.Odys'}</span>
          </a>
        </li>
        <li class="nv-note">
          <a href="{$odysUrlParfums}#fam-oriental">
            <span class="nv-note-img"><img src="{$urls.theme_assets}img/note-oriental.webp" alt=""
              width="320" height="320" loading="lazy" decoding="async"/></span>
            <span class="nv-note-lbl">{l s='Oriental' d='Shop.Theme.Odys'}</span>
          </a>
        </li>
        <li class="nv-note">
          <a href="{$odysUrlParfums}#fam-sweet">
            <span class="nv-note-img"><img src="{$urls.theme_assets}img/note-sucre.webp" alt=""
              width="320" height="320" loading="lazy" decoding="async"/></span>
            <span class="nv-note-lbl">{l s='Sucré' d='Shop.Theme.Odys'}</span>
          </a>
        </li>
        <li class="nv-note">
          <a href="{$odysUrlParfums}#fam-oud">
            <span class="nv-note-img"><img src="{$urls.theme_assets}img/note-oud.webp" alt=""
              width="320" height="320" loading="lazy" decoding="async"/></span>
            <span class="nv-note-lbl">{l s='Oud' d='Shop.Theme.Odys'}</span>
          </a>
        </li>
      </ul>

      <a href="{$odysUrlParfums}" class="nv-btn nv-btn-pill" data-nv-quiz-open>
        {l s='Commencer le quiz' d='Shop.Theme.Odys'} <span class="arw" aria-hidden="true">&rarr;</span></a>
    </div>
  </div>
</section>
