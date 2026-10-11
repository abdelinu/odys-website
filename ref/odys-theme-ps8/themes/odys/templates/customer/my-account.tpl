{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Mon Compte | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:900px;margin:0 auto;padding:48px max(20px,32px) 80px">
  <div style="margin-bottom:36px">
    <div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:8px">Espace Personnel</div>
    <h1 style="font-family:var(--serif);font-size:32px;font-weight:500">Bonjour, {$customer.firstname|escape:'html':'UTF-8'} ✦</h1>
  </div>
  <div style="background:linear-gradient(135deg,var(--navy),#2A3F6A);border-radius:4px;padding:28px;margin-bottom:28px">
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:16px">
      <div>
        <div style="font-size:9px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,.4);margin-bottom:6px">VOS POINTS FIDÉLITÉ ODYS</div>
        <div style="font-family:var(--serif);font-size:52px;font-weight:500;color:var(--rose);line-height:1">{hook h='displayLoyaltyPoints'}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4);margin-top:4px">points accumulés · 1 pt = 100 DH dépensés</div>
      </div>
      <div><div style="font-size:10px;color:rgba(255,255,255,.5);margin-bottom:6px">Prochaine récompense</div><div style="font-size:13px;font-weight:700;color:var(--rose-pale)">🎁 Coffret ou 5g Oud à 15 pts</div><div style="font-size:9px;color:rgba(255,255,255,.3);margin-top:4px">⚠ Oud · Boukhour · Flacons exclus</div></div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px">
    <a href="{$urls.pages.history}"    class="acc-link-card"><div class="alc-icon">📦</div><div class="alc-lbl">Mes Commandes</div><div class="alc-sub">Suivre, retourner</div></a>
    <a href="{$urls.pages.address}"    class="acc-link-card"><div class="alc-icon">📍</div><div class="alc-lbl">Mes Adresses</div><div class="alc-sub">Gérer la livraison</div></a>
    <a href="{$urls.pages.identity}"   class="acc-link-card"><div class="alc-icon">👤</div><div class="alc-lbl">Mes Informations</div><div class="alc-sub">Profil, mot de passe</div></a>
    {* no wishlist module on a stock PrestaShop: the link would be empty *}
    {if isset($urls.pages.wishlist)}
    <a href="{$urls.pages.wishlist}"   class="acc-link-card"><div class="alc-icon">♡</div><div class="alc-lbl">Ma Wishlist</div><div class="alc-sub">Parfums sauvegardés</div></a>
    {/if}
    <a href="{$urls.pages.authentication}?logout=1" class="acc-link-card" style="opacity:.6"><div class="alc-icon">🚪</div><div class="alc-lbl">Se Déconnecter</div><div class="alc-sub">Fermer la session</div></a>
  </div>
</div>
{/block}
