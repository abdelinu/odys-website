{extends file='layouts/layout-full-width.tpl'}
{block name='head_title'}Contact | ODYS Parfums{/block}
{block name='content'}
<div style="max-width:780px;margin:0 auto;padding:64px max(20px,32px) 80px">
  <div style="margin-bottom:40px">
    <div style="font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:var(--rose-deep);margin-bottom:10px">Support Client</div>
    <h1 style="font-family:var(--serif);font-size:32px;font-weight:500;margin-bottom:10px">Contactez-nous</h1>
    <p style="color:var(--mid);font-size:14px;line-height:1.8">Réponse sous 2h en semaine · WhatsApp 7j/7 de 9h à 21h</p>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:36px">
    <a href="https://wa.me/{Configuration::get('ODYS_WA_NUMBER')|default:'212600000000'}" target="_blank" rel="noopener"
       style="display:flex;align-items:center;gap:14px;padding:20px;background:rgba(37,211,102,.06);border:1px solid rgba(37,211,102,.2);border-radius:3px;text-decoration:none;color:var(--ink)">
      <span style="font-size:28px">💬</span>
      <div><div style="font-size:12px;font-weight:700">WhatsApp</div><div style="font-size:11px;color:var(--mid)">Réponse immédiate · 7j/7</div><div style="font-size:10px;color:#2D6A4F;margin-top:2px">9h–21h</div></div>
    </a>
    <a href="mailto:{Configuration::get('ODYS_EMAIL')|default:'contact@odys.ma'}"
       style="display:flex;align-items:center;gap:14px;padding:20px;background:var(--rose-bg);border:1px solid var(--rose-pale);border-radius:3px;text-decoration:none;color:var(--ink)">
      <span style="font-size:28px">📧</span>
      <div><div style="font-size:12px;font-weight:700">Email</div><div style="font-size:11px;color:var(--mid)">{Configuration::get('ODYS_EMAIL')|default:'contact@odys.ma'}</div><div style="font-size:10px;color:var(--rose-deep);margin-top:2px">Réponse sous 2h</div></div>
    </a>
  </div>
  {hook h='displayContactForm'}
  <div style="margin-top:24px;padding:20px;background:var(--marble);border-radius:3px">
    <div style="font-size:11px;font-weight:700;margin-bottom:6px">📍 ODYS Parfums — Casablanca, Maroc</div>
    <div style="font-size:11px;color:var(--mid);line-height:1.9">Lun–Sam · 9h–18h · WhatsApp 7j/7 · 9h–21h</div>
  </div>
</div>
{/block}
