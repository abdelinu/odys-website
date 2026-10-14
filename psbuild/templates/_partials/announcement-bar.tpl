{*
 * ODYS Parfums — Announcement ticker
 * app.js duplicates .ann-track once at runtime for the -50% marquee loop,
 * so the list below is written a single time.
 *
 * Chaque annonce est UNE phrase, donc une seule cle de traduction. Elles
 * etaient coupees en trois par des <strong> au milieu — « Livraison »,
 * « 20 DH Casa · 30 DH Maroc », « · Gratuite des 300 DH » — et trois
 * morceaux ne se traduisent pas : l'arabe ne met pas ses mots dans le meme
 * ordre que le francais. Le gras porte donc sur l'annonce entiere.
 *}
<div class="ann" aria-label="{l s='Annonces ODYS' d='Shop.Theme.Odys'}">
  <div class="ann-track">
    {* one message per line in Back Office → Apparence → Thème ODYS;
       empty falls back to the eight the theme shipped with *}
    {assign var='odysAnnounce' value=Configuration::get('ODYS_ANNOUNCE')}
    {if $odysAnnounce}{foreach from="
"|explode:$odysAnnounce item=odysMsg}{if $odysMsg|trim}
      {assign var='odysMsgT' value={l s=$odysMsg|trim d='Shop.Theme.Odys'}}
      <span class="ai">{$odysMsgT|escape:'html':'UTF-8'}</span><span class="ai-dot" aria-hidden="true"></span>
    {/if}{/foreach}{else}
    <span class="ai">{l s='Livraison 20 DH Casa · 30 DH Maroc · Gratuite dès 300 DH' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Paiement à la livraison disponible partout au Maroc' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Extrait de parfum · Concentration exceptionnelle' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Élaboré au Maroc · Extrait de parfum 18–20 % concentré' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Élaboré au Maroc · À partir de 39 DH' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Oud naturel · Vendu au gramme · Longévité 8h+' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Coffrets prêts à offrir · Duo &amp; Trio' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">{l s='Livraison 24–48h · Retours 14 jours' d='Shop.Theme.Odys'}</span><span class="ai-dot" aria-hidden="true"></span>{/if}
  </div>
  <button class="ann-x" type="button" data-action="close-ann"
          aria-label="{l s='Fermer le bandeau d\'annonces' d='Shop.Theme.Odys'}">&times;</button>
</div>
