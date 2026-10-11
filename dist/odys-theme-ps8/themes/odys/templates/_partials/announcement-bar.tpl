{*
 * ODYS Parfums — Announcement ticker
 * app.js duplicates .ann-track once at runtime for the -50% marquee loop,
 * so the list below is written a single time.
 *}
<div class="ann" aria-label="Annonces ODYS">
  <div class="ann-track">
    {* one message per line in Back Office → Apparence → Thème ODYS;
       empty falls back to the eight the theme shipped with *}
    {assign var='odysAnnounce' value=Configuration::get('ODYS_ANNOUNCE')}
    {if $odysAnnounce}{foreach from="
"|explode:$odysAnnounce item=odysMsg}{if $odysMsg|trim}
      <span class="ai">{$odysMsg|trim|escape:'html':'UTF-8'}</span><span class="ai-dot" aria-hidden="true"></span>
    {/if}{/foreach}{else}
    <span class="ai">Livraison <strong>20 DH Casa · 30 DH Maroc</strong> · Gratuite dès 300 DH</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai"><strong>Paiement à la livraison</strong> disponible partout au Maroc</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">Extrait de parfum · <strong>Concentration exceptionnelle</strong></span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai"><strong>Élaboré au Maroc</strong> · Extrait de parfum 18–20 % concentré</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">Élaboré au <strong>Maroc</strong> · À partir de <strong>39 DH</strong></span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai"><strong>Oud naturel</strong> · Vendu au gramme · Longévité 8h+</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai"><strong>Coffrets</strong> prêts à offrir · Duo &amp; Trio</span><span class="ai-dot" aria-hidden="true"></span>
    <span class="ai">Livraison <strong>24–48h</strong> · Retours 14 jours</span><span class="ai-dot" aria-hidden="true"></span>{/if}
  </div>
</div>
