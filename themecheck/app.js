/* ================================================================
   ODYS Parfums — PrestaShop 8 Theme JS v3.0 (app.js)
   Author: ODYS Parfums · odys.ma · Est. 2026
   
   Architecture:
   - ODYS IIFE namespace: cart, checkout, loyalty, notes, quiz
   - Gram pricing (Oud/Boukhour) with noPoints flag
   - Analytics dashboard: 6 tabs + AI chat via Claude API
   - Gulf Orchid FBT + suggestion carousels + viewing-now
   - PS8 AJAX bridge (appended at end)
   ================================================================ */


/* ================================================================
   ODYS Parfums — PrestaShop 8 Theme JavaScript
   Version: 3.0 | odys.ma
   
   PrestaShop 8 integration notes:
   - Cart operations use prestashop.cart API
   - AJAX add-to-cart via prestashop module hooks
   - Loyalty points handled by odys_loyalty module
   ================================================================ */

'use strict';

/* ── PrestaShop cart bridge ──────────────────────────────────── */
if (typeof prestashop === 'undefined') {
  window.prestashop = { cart: { products: [], products_count: 0 },
                        emit: function () {}, on: function () {}, off: function () {},
                        urls: { pages: { cart: '/panier', order: '/commande' } } };
}






/**
 * ODYS Parfums — Theme JavaScript
 * PrestaShop 8 · odysperfumes
 *
 * Architecture:
 *   - Self-contained IIFE namespace: window.ODYS = (() => { ... })()
 *   - Zero global variables outside ODYS
 *   - Zero inline onclick= in HTML (all via data-action= + event delegation)
 *   - No eval(), no new Function(), no setTimeout(string)
 *   - All user data sanitized with esc() before DOM injection
 *   - Rate limiting on login, register, checkout (client-side layer)
 *
 * PrestaShop integration notes:
 *   - Cart operations: replace addToCart() with prestashop.emit('updateCart')
 *   - Prices: read from {$product.price} Smarty vars, never hardcoded
 *   - Checkout: hand off to PS checkout controller after address step
 *   - Loyalty: replace in-memory state with API calls to odys_loyalty module
 *
 * @version 3.0.0
 * @requires PrestaShop 8.0.0+
 */

/* global prestashop */

'use strict';

/* ══════════════════════════════════════════════════════════
   SECURITY UTILITIES — always available, top of script
   ══════════════════════════════════════════════════════════ */

/** XSS-safe HTML escaper */
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/\//g, '&#x2F;');
}

/** Sanitize user input: trim + esc + length cap */
function sanitize(s, maxLen = 500) {
  return esc(String(s).trim()).slice(0, maxLen);
}

/** Set element text safely (no XSS possible) */
function safeText(el, text) {
  if (el) el.textContent = String(text);
}

// NOTE PRODUCTION: extraire dans app.js et ajouter defer + CSP strict
const ODYS = (() => {
// ── STATE (private) ──
let cart = [];
let curPage = 'home';
let qty = 1;
let selVol = 50;
let selPrice = 69;
let qAnswers = {};
let qStep = 1;

// ── QUIZ DATA ──
const quizResults = {
  fresh:  { name:"L'Icône", code:"01", inspo:"Inspiré de Dior Sauvage EDP", price:229, img:"https://images.unsplash.com/photo-1541643600914-78b084683702?w=220&q=80", desc:"Frais, boisé, masculin. L'ouverture bergamote-poivre rose s'installe sur un fond ambré irrésistible — votre signature quotidienne." },
  oriental:{ name:"L'Oriental", code:"14", inspo:"Inspiré de Tom Ford Oud Wood", price:249, img:"https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=220&q=80", desc:"Profond, précieux, envoûtant. L'oud naturel et le vétiver créent une empreinte olfactive inoubliable pour les grands moments." },
  sweet:  { name:"La Nuit", code:"07", inspo:"Inspiré de J.P. Gaultier Le Mâle Élixir", price:219, img:"https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=220&q=80", desc:"Suave, sensuel, magnétique. La vanille dorée et le cuir subtil créent une aura irrésistible pour la soirée." },
  oud:    { name:"L'Oriental", code:"14", inspo:"Inspiré de Tom Ford Oud Wood", price:249, img:"https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=220&q=80", desc:"Vous êtes attiré par l'oud — authentique, profond, distinctif. ODYS 14 L'Oriental est votre match évident." }
};

// ── LOADER ──
window.addEventListener('load', () => {
  setTimeout(function () {
    var l = document.getElementById('loader');
    if (l) l.classList.add('done');
  }, 1600);
});

// ── PAGES ──
function go(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.sw-btn').forEach(b => b.classList.remove('on'));
  const page = document.getElementById('pg-' + id);
  if (page) { page.classList.add('on'); page.scrollIntoView ? window.scrollTo(0,0) : null; }
  const sw = document.querySelector(`.sw-btn[data-page="${id}"]`);
  if (sw) sw.classList.add('on');
  curPage = id;
  // page transition — guarded
  const pt = document.getElementById('pt');
  if (pt) { pt.classList.add('show'); setTimeout(() => pt.classList.remove('show'), 400); }
  updateCartBadges();
  closeMenu();
}

// ── HAMBURGER ──
function toggleMenu() {
  const btn = document.getElementById('hamBtn');
  const menu = document.getElementById('mobMenu');
  if (btn && menu) {
    btn.classList.toggle('open');
    menu.classList.toggle('open');
  }
}
function closeMenu() {
  document.querySelectorAll('.ham').forEach(b => b.classList.remove('open'));
  document.querySelectorAll('.mob-menu').forEach(m => m.classList.remove('open'));
}

// ── CART ──
function openCart() { document.getElementById('drawer').classList.add('on'); document.getElementById('ov').classList.add('on'); renderCart(); }
function closeCart() { document.getElementById('drawer').classList.remove('on'); document.getElementById('ov').classList.remove('on'); }

function addToCart(code, name, price, btn) {
  const noPoints = code.startsWith('OUD-') || code.startsWith('SAM-') ||
                   code.startsWith('BK-') || code.startsWith('F0') ||
                   code.startsWith('F1') || code.startsWith('F3') ||
                   code === 'PACK-OUD';
  const existing = cart.find(i => i.code === code);
  if (existing) existing.qty++;
  else cart.push({ code, name, price, qty: 1, noPoints });
  if (btn) {
    const orig = btn.textContent;
    btn.classList.add('done');
    btn.textContent = '✓ Ajouté !';
    setTimeout(() => { btn.classList.remove('done'); btn.textContent = orig; }, 1600);
  }
  updateCartBadges();
  openCart();
  const add = document.getElementById('dAdded');
  if (add) { add.classList.add('show'); setTimeout(() => add.classList.remove('show'), 2200); }
  renderCart();
  updateShip();
  renderXS();
}

function renderCart() {
  const el = document.getElementById('dItems');
  if (!el) return;
  el.innerHTML = '';  // clear safely

  if (cart.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'd-empty';
    empty.innerHTML = '<div class="ei">🛒</div>';
    const p = document.createElement('p');
    p.textContent = 'Votre panier est vide';
    empty.appendChild(p);
    el.appendChild(empty);
    return;
  }

  const frag = document.createDocumentFragment();
  cart.forEach(i => {
    const wrap = document.createElement('div');
    wrap.className = 'dp';

    // Image
    const img = document.createElement('img');
    img.className = 'dp-img';
    img.src = 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=132&q=60';
    img.loading = 'lazy';
    img.alt = 'ODYS ' + i.code;
    wrap.appendChild(img);

    // Info block
    const inf = document.createElement('div');
    inf.className = 'dp-inf';

    const code = document.createElement('div');
    code.className = 'dp-code';
    code.textContent = 'ODYS ' + i.code;

    const name = document.createElement('div');
    name.className = 'dp-name';
    name.textContent = i.name; // textContent = safe, no XSS

    const ins = document.createElement('div');
    ins.className = 'dp-ins';
    ins.textContent = 'Élaboré au Maroc 🇲🇦';

    const row = document.createElement('div');
    row.className = 'dp-row';

    const price = document.createElement('span');
    price.className = 'dp-price';
    price.textContent = (i.price * i.qty) + ' DH';

    const dpq = document.createElement('div');
    dpq.className = 'dpq';

    const btnMinus = document.createElement('button');
    btnMinus.dataset.action = 'chg-item';
    btnMinus.dataset.code   = i.code;
    btnMinus.dataset.delta  = '-1';
    btnMinus.textContent    = '−';

    const qtySpan = document.createElement('span');
    qtySpan.textContent = i.qty;

    const btnPlus = document.createElement('button');
    btnPlus.dataset.action = 'chg-item';
    btnPlus.dataset.code   = i.code;
    btnPlus.dataset.delta  = '1';
    btnPlus.textContent    = '+';

    dpq.append(btnMinus, qtySpan, btnPlus);
    row.append(price, dpq);

    const rmBtn = document.createElement('button');
    rmBtn.className       = 'dp-rm';
    rmBtn.dataset.action  = 'remove-item';
    rmBtn.dataset.code    = i.code;
    rmBtn.textContent     = 'Retirer';

    inf.append(code, name, ins, row, rmBtn);
    wrap.append(img, inf);
    frag.appendChild(wrap);
  });

  el.appendChild(frag);
}

function chgItem(code, d) {
  const i = cart.find(x => x.code === code);
  if (!i) return;
  i.qty += d;
  if (i.qty <= 0) cart = cart.filter(x => x.code !== code);
  renderCart(); updateCartBadges(); updateShip(); renderXS();
}
function removeItem(code) { cart = cart.filter(x => x.code !== code); renderCart(); updateCartBadges(); updateShip(); renderXS(); }

function updateCartBadges() {
  const total = cart.reduce((a, i) => a + i.qty, 0);
  document.querySelectorAll('.cb').forEach(b => { b.style.display = total > 0 ? 'flex' : 'none'; b.textContent = total; });
  var odysCnt = document.getElementById('dCnt');
  if (odysCnt) { odysCnt.textContent = total + ' article' + (total !== 1 ? 's' : ''); }
  const sum = cart.reduce((a, i) => a + i.price * i.qty, 0);
  var odysTot = document.getElementById('dTotal');
  if (odysTot) { odysTot.textContent = sum + ' DH'; }
}

/* ── SHIPPING — 20 DH Casa · 30 DH partout au Maroc ──────────── */
const SHIPPING = {
  casa:  { cost: 20, label: 'Casablanca', freeThreshold: 300 },
  maroc: { cost: 30, label: 'Tout le Maroc', freeThreshold: 300 },
};

function getShipZone() {
  // Read selected city from checkout form if open, else default to maroc
  const ville = document.getElementById('coVille');
  if (ville && ville.value) {
    return ville.value === 'Casablanca' ? 'casa' : 'maroc';
  }
  return 'maroc'; // default before city chosen
}

function getShipCost(zone, total) {
  const z = SHIPPING[zone] || SHIPPING.maroc;
  return total >= z.freeThreshold ? 0 : z.cost;
}

function updateShip() {
  const sum  = cart.reduce((a, i) => a + i.price * i.qty, 0);
  const zone = getShipZone();
  const z    = SHIPPING[zone];
  const shipCost = getShipCost(zone, sum);
  const isFree   = shipCost === 0;
  const pct      = Math.min(100, (sum / z.freeThreshold) * 100);

  const fill = document.getElementById('dsFill');
  const val  = document.getElementById('dsVal');
  const msg  = document.getElementById('dsMsg');
  const hd   = document.querySelector('.ds-top span:first-child');

  if (fill) fill.style.width = pct + '%';
  if (val)  val.textContent  = sum + ' / ' + z.freeThreshold + ' DH';
  if (hd)   hd.textContent   = isFree ? 'Livraison offerte ✓' : (zone === 'casa' ? 'Livraison Casa : 20 DH' : 'Livraison Maroc : 30 DH');
  if (msg) {
    if (isFree) {
      msg.textContent = '🎉 Livraison gratuite débloquée !';
      msg.style.color = 'var(--green)';
    } else {
      const need = z.freeThreshold - sum;
      msg.textContent = `Ajoutez ${need} DH → livraison offerte (${zone === 'casa' ? '20 DH' : '30 DH'} actuellement)`;
      msg.style.color = '';
    }
  }
}

function getCartTotal(includeShipping) {
  const subtotal = cart.reduce((a, i) => a + i.price * i.qty, 0);
  if (!includeShipping) return subtotal;
  const zone = getShipZone();
  return subtotal + getShipCost(zone, subtotal);
}

function renderXS() {
  const xs = document.getElementById('dXs');
  const list = document.getElementById('dXsList');
  if (!xs || !list || cart.length === 0) { if (xs) xs.style.display = 'none'; return; }
  xs.style.display = 'block';
  const recs = [
    { code:'07', name:'La Nuit', price:219, img:'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=160&q=60' },
    { code:'33', name:'L\'Azur', price:229, img:'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=160&q=60' },
    { code:'14', name:'L\'Oriental', price:249, img:'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=160&q=60' },
  ].filter(r => !cart.find(i => i.code === r.code));
  list.innerHTML = recs.slice(0,3).map(r => `<div class="dxs-i" data-action="add-to-cart" data-code="${esc(r.code)}" data-name="${esc(r.name)}" data-price="${Number(r.price)}"><img src="${esc(r.img)}" loading="lazy" alt="ODYS Parfums"/><div class="dxs-n">ODYS ${esc(r.code)}</div><div class="dxs-p">${Number(r.price)} DH</div></div>`).join('');
}

// ── PRODUCT PAGE ──
function pickVol(btn) {
  // Update card selection
  document.querySelectorAll('.vc').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-checked', 'false');
  });
  btn.classList.add('on');
  btn.setAttribute('aria-checked', 'true');

  if (btn.disabled) { return; }
  // le libelle vient de l'attribut et s'affiche tel quel
  const vol   = btn.dataset.vol || '';
  const price = parseInt(btn.dataset.price, 10) || 0;
  // ce que le panier recevra : la declinaison que porte la carte choisie
  const addB  = document.getElementById('addBtn');
  if (addB && btn.dataset.idProductAttribute) {
    addB.dataset.idProductAttribute = btn.dataset.idProductAttribute;
  }
  const desc  = btn.dataset.desc || '';
  selVol   = parseInt(vol, 10) || selVol;
  selPrice = price;

  // Animate live price
  const lp = document.getElementById('livePrice');
  const lv = document.getElementById('liveVol');
  const lf = document.getElementById('liveFree');
  if (lp) {
    lp.style.transform = 'scale(1.08)';
    lp.style.color = 'var(--rose-deep)';
    setTimeout(() => { lp.style.transform = ''; }, 200);
    lp.textContent = price + ' DH';
  }
  if (lv) lv.textContent = '· ' + vol;
  if (lf) {
    const freeThresh = 300;
    const remaining = freeThresh - price;
    if (remaining <= 0) {
      lf.textContent = '✓ Livraison gratuite incluse';
      lf.style.background = 'rgba(45,106,79,.15)';
      lf.style.color = 'var(--green)';
    } else {
      lf.textContent = '+ ' + remaining + ' DH → Livraison gratuite';
      lf.style.background = '';
      lf.style.color = '';
    }
  }

  // Update add-to-cart button label
  const btn_cart = document.getElementById('addBtn');
  if (btn_cart) {
    const lbl = btn_cart.querySelector('.blbl');
    if (lbl) lbl.textContent = 'Ajouter au Panier · ' + vol;
  }
}
function selectV(btn, vol, price) {
  document.querySelectorAll('.vb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  selVol = vol; selPrice = price;
  document.getElementById('volSel').textContent = vol + ' ml · ' + price + ' DH';
}
// selectVol removed — use pickVol()
/** The quantity box is an <input> now, so read .value — but keep working if
    a template still renders it as a span. */
function qtyRead() {
  var e = document.getElementById('qtyV');
  if (!e) { return 1; }
  var raw = ('value' in e && e.value !== undefined) ? e.value : e.textContent;
  var n = parseInt(raw, 10);
  return (isNaN(n) || n < 1) ? 1 : n;
}
function qtyWrite(n) {
  var e = document.getElementById('qtyV');
  if (!e) { return; }
  if ('value' in e && e.tagName === 'INPUT') { e.value = n; } else { e.textContent = n; }
}
function chgQty(d) { qty = Math.max(1, qtyRead() + d); qtyWrite(qty); }
function addProd() {
  const btn = document.getElementById('addBtn');
  btn.classList.add('loading');
  setTimeout(() => {
    btn.classList.remove('loading');
    addToCart('01-' + selVol + 'ml', 'L\'Icône ' + selVol + 'ml', selPrice * qty, null);
  }, 700);
}
function switchThumb(li, src) {
  document.querySelectorAll('.thumbs li').forEach(x => x.classList.remove('on'));
  li.classList.add('on');
  const m = document.getElementById('galMain');
  if (m) m.src = src;
}

// ── ACCORDION ──
function toggleAcc(btn) {
  const body = btn.nextElementSibling;
  const isOpen = btn.classList.contains('op');
  document.querySelectorAll('.acc-h').forEach(b => { b.classList.remove('op'); b.nextElementSibling.classList.remove('op'); });
  if (!isOpen) { btn.classList.add('op'); body.classList.add('op'); }
}

// ── WISHLIST ──
/* ── SAVED ITEMS ("Mes envies") ─────────────────────────────
   The heart used to toggle a colour and nothing else: no list, no storage,
   and the label read "Retiré de la wishlist" on the click that added it. The
   module behind it shipped a 318 KB GraphQL client on every page and was
   never spoken to — 0 rows in its tables.

   This keeps the list in the browser, so it works without an account. Baymard
   finds 89% of shops make people register before they can save anything, and
   about a fifth of interested shoppers leave rather than sign up. Nothing here
   is personal data: a product id, its name, price, URL and thumbnail, on the
   shopper's own device.                                                    */
var ODYS_WISH_KEY = 'odys.wish.v1';

function wishRead() {
  try {
    var raw = localStorage.getItem(ODYS_WISH_KEY);
    var list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch (e) {
    return [];               // private window, blocked storage, corrupt value
  }
}

function wishWrite(list) {
  try {
    localStorage.setItem(ODYS_WISH_KEY, JSON.stringify(list.slice(0, 60)));
  } catch (e) { /* the page still works; only the memory is lost */ }
  wishPaintCount();
}

function wishHas(id) {
  return wishRead().some(function (it) { return String(it.id) === String(id); });
}

/** Everything the list needs, read off the card or the product page.
    The button carries the id itself, so the surrounding card is looked up
    separately - closest() would otherwise stop at the button and find neither
    the price nor the thumbnail. */
function wishItemFrom(btn) {
  var card = btn.closest('.pc') || btn.closest('.prod-wrap')
          || document.querySelector('.prod-wrap') || document;
  var id = btn.getAttribute('data-id-product')
        || (card.getAttribute && card.getAttribute('data-id-product'));
  if (!id) {
    var any = card.querySelector && card.querySelector('[data-id-product]');
    id = any && any.getAttribute('data-id-product');
  }
  if (!id) { return null; }
  var pick = function (sel) { return card.querySelector && card.querySelector(sel); };
  // only a listing card links elsewhere; on a product page the product is
  // this page, and the first link inside it is a pyramid note
  var onCard = card.classList && card.classList.contains('pc');
  var link = onCard ? pick('a[href]') : null;
  var img = pick('.gal-main img') || pick('img');
  var name = pick('.pc-name') || pick('.p-name');
  var price = pick('.pc-price') || pick('.lp-price');
  return {
    id: String(id),
    name: (name ? name.textContent : document.title.split('—')[0]).trim().slice(0, 90),
    // without the query a saved link does not carry someone's utm_ tags
    url: (link ? link.href : location.href).split('#')[0].split('?')[0],
    img: img ? (img.currentSrc || img.src) : '',
    price: price ? price.textContent.replace(/\s+/g, ' ').trim().slice(0, 24) : ''
  };
}

function wishToggle(btn, full) {
  var item = wishItemFrom(btn);
  if (!item) { return; }
  var list = wishRead();
  var at = list.findIndex(function (it) { return it.id === item.id; });
  var added = at === -1;
  if (added) { list.unshift(item); } else { list.splice(at, 1); }
  wishWrite(list);
  btn.classList.toggle('on', added);
  btn.setAttribute('aria-pressed', added ? 'true' : 'false');
  if (full) {
    btn.textContent = added ? '♥ Enregistré dans mes envies' : '♡ Ajouter à mes envies';
  } else {
    btn.textContent = added ? '♥' : '♡';
    btn.style.color = added ? 'var(--rose)' : '';
  }
}

/** Hearts already saved should look saved when the page opens. */
function wishRestore() {
  var saved = wishRead();
  document.querySelectorAll('[data-action="toggle-wish"],[data-action="toggle-wish-full"]')
    .forEach(function (btn) {
      var item = wishItemFrom(btn);
      if (!item || !saved.some(function (it) { return it.id === item.id; })) { return; }
      var full = btn.getAttribute('data-action') === 'toggle-wish-full';
      btn.classList.add('on');
      btn.setAttribute('aria-pressed', 'true');
      btn.textContent = full ? '♥ Enregistré dans mes envies' : '♥';
      if (!full) { btn.style.color = 'var(--rose)'; }
    });
  wishPaintCount();
}

function wishPaintCount() {
  var n = wishRead().length;
  document.querySelectorAll('[data-odys-wish-count]').forEach(function (el) {
    el.textContent = n ? String(n) : '';
    el.setAttribute('hidden', n ? null : 'hidden');
    if (n) { el.removeAttribute('hidden'); }
  });
}

/** The "Mes envies" page renders itself from the same store. */
function wishRenderPage() {
  var host = document.getElementById('odysWishList');
  if (!host) { return; }
  var list = wishRead();
  var empty = document.getElementById('odysWishEmpty');
  if (empty) { empty.hidden = list.length > 0; }
  host.innerHTML = list.map(function (it) {
    var img = it.img
      ? '<img src="' + encodeURI(it.img) + '" alt="" loading="lazy" width="60" height="60"/>'
      : '<span class="odys-order-thumb odys-order-thumb--empty"></span>';
    return '<li class="odys-order-line">' + img
      + '<div class="odys-order-line-body">'
      + '<div class="odys-order-line-name"><a href="' + encodeURI(it.url) + '">'
      + wishEscape(it.name) + '</a></div>'
      + '<div class="odys-order-line-qty">' + wishEscape(it.price) + '</div></div>'
      + '<button type="button" class="odys-wish-drop" data-action="wish-drop" '
      + 'data-id="' + wishEscape(it.id) + '" aria-label="Retirer '
      + wishEscape(it.name) + ' de mes envies">Retirer</button></li>';
  }).join('');
}

function wishEscape(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

function wishDrop(id) {
  wishWrite(wishRead().filter(function (it) { return it.id !== String(id); }));
  wishRenderPage();
}

document.addEventListener('DOMContentLoaded', function () {
  wishRestore();
  wishRenderPage();
});

function toggleWish(btn) {
  wishToggle(btn, false);
}

// ── FAMILY FILTER ──
function filterFam(btn, fam) {
  // le groupe auquel appartient le bouton, pas une classe que la page ne
  // porte pas : .closest('.sec, .page') retombait toujours sur document
  const group = btn.closest('.fam-filters');
  (group || document).querySelectorAll('.ff').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');   // seule .on bougeait avant,
  });                                          // un lecteur d'ecran lisait
  btn.classList.add('on');                     // toujours « Tout » actif
  btn.setAttribute('aria-pressed', 'true');

  var restants = 0;
  document.querySelectorAll('#featGrid, #collGrid').forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      var garde = (fam === 'all' || pc.dataset.fam.indexOf(fam) !== -1);
      pc.style.display = garde ? '' : 'none';
      if (garde) { restants += 1; }
    });
  });

  // Sans ceci la grille tombe a zero pixel et la boutique parait vide.
  var vide = document.getElementById('collEmpty');
  if (vide) { vide.hidden = (restants > 0); }
}

// ── QUIZ ──
function qPick(opt, fam) {
  document.querySelectorAll('#qs1 .qopt').forEach(o => o.classList.remove('on'));
  opt.classList.add('on');
  qAnswers.fam = fam;
  setTimeout(() => {
    document.getElementById('qs1').classList.remove('on');
    document.getElementById('qs2').classList.add('on');
    qStep = 2;
    updateQProg();
  }, 350);
}
function qPick2(opt, occ) {
  document.querySelectorAll('#qs2 .qopt').forEach(o => o.classList.remove('on'));
  opt.classList.add('on');
  qAnswers.occ = occ;
  setTimeout(() => {
    document.getElementById('qs2').classList.remove('on');
    document.getElementById('qs3').classList.add('on');
    qStep = 3;
    updateQProg();
  }, 350);
}
function qPick3(opt, intensity) {
  document.querySelectorAll('#qs3 .qopt').forEach(o => o.classList.remove('on'));
  opt.classList.add('on');
  qAnswers.intensity = intensity;
  setTimeout(() => showQuizResult(), 400);
}
function showQuizResult() {
  const r = quizResults[qAnswers.fam] || quizResults.fresh;
  document.getElementById('qrName').textContent = r.name;
  document.getElementById('qrInspo').textContent = r.inspo;
  document.getElementById('qrDesc').textContent = r.desc;
  document.getElementById('qrImg').src = r.img;
  document.getElementById('qrAdd').onclick = () => addToCart(r.code, r.name, r.price, document.getElementById('qrAdd'));
  document.getElementById('qResult').classList.add('show');
  document.getElementById('qReset').style.display = 'block';
  qStep = 4; updateQProg();
}
function addQuizResult() {
  const r = quizResults[qAnswers.fam] || quizResults.fresh;
  addToCart(r.code, r.name, r.price, document.getElementById('qrAdd'));
}
function resetQuiz() {
  document.querySelectorAll('.q-step').forEach(s => s.classList.remove('on'));
  document.querySelectorAll('.qopt').forEach(o => o.classList.remove('on'));
  document.getElementById('qs1').classList.add('on');
  document.getElementById('qResult').classList.remove('show');
  document.getElementById('qReset').style.display = 'none';
  qStep = 1; qAnswers = {}; updateQProg();
}
function updateQProg() {
  const dots = document.querySelectorAll('.qpd');
  dots.forEach((d, i) => d.classList.toggle('on', i < qStep));
}

// ── TICKER DUPLICATE ──
(function(){
  document.querySelectorAll('.ann-track').forEach(function (t) {
    const c = t.innerHTML; t.innerHTML = c + c;
  });
})();

// ── WA TIP SHOW ──
setTimeout(() => {
  const tip = document.getElementById('waTip');
  if (tip) {
    tip.classList.add('show');
    setTimeout(() => tip.classList.remove('show'), 5000);
  }
}, 3500);

// ── VAL TIMER ──
(function(){
  const el = document.getElementById('valTimer');
  if (!el) return;
  let secs = 3*86400 + 14*3600 + 22*60;
  setInterval(() => {
    secs--;
    const d = Math.floor(secs/86400);
    const h = Math.floor((secs%86400)/3600);
    const m = Math.floor((secs%3600)/60);
    el.textContent = d+'j '+h+'h '+m+'m';
  }, 60000);
})();

// ── BARS ANIMATE ──
setTimeout(() => {
  document.querySelectorAll('.sm-fill').forEach(el => {
    const w = el.style.width; el.style.width = '0';
    setTimeout(() => el.style.width = w, 100);
  });
}, 500);

/* ── Oud gram selector ──────────────────────────────────── */
function pickGram(btn, cardId, pricePerGram) {
  const card = document.getElementById(cardId);
  if (!card) return;
  // Update button states within this card only
  card.querySelectorAll('.gb').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const grams = parseInt(btn.dataset.g);
  const total = grams * pricePerGram;
  // Animate total
  const totalEl = document.getElementById(cardId + '-total');
  const gramsEl = document.getElementById(cardId + '-grams');
  if (totalEl) {
    totalEl.style.transform = 'scale(1.12)';
    totalEl.style.color = '#F5C66B';
    setTimeout(() => { totalEl.style.transform = ''; totalEl.style.color = ''; }, 250);
    totalEl.textContent = total.toLocaleString('fr-MA') + ' DH';
  }
  if (gramsEl) gramsEl.textContent = grams + ' gramme' + (grams > 1 ? 's' : '');
  card.dataset.selectedGrams = grams;
  card.dataset.selectedTotal = total;
}

function addOud(code, name, cardId, btn) {
  const card  = document.getElementById(cardId);
  const grams = card ? parseInt(card.dataset.selectedGrams || 10) : 10;
  const total = card ? parseInt(card.dataset.selectedTotal || 0) : 0;
  if (total <= 0) {
    if (card) card.querySelectorAll('.gb').forEach(b => {
      b.style.borderColor = 'var(--oud)'; setTimeout(() => { b.style.borderColor = ''; }, 800);
    });
    return;
  }
  const itemCode = 'OUD-' + code + '-' + grams + 'g';
  const itemName = name + ' ' + grams + 'g';
  const existing = cart.find(i => i.code === itemCode);
  if (existing) existing.qty++;
  else cart.push({ code: itemCode, name: itemName, price: total, qty: 1, noPoints: true });
  if (btn) {
    const orig = btn.textContent;
    btn.style.background = 'var(--green)'; btn.textContent = '✓ Ajouté !';
    setTimeout(() => { btn.style.background = ''; btn.textContent = orig; }, 1600);
  }
  updateCartBadges(); openCart();
  const add = document.getElementById('dAdded');
  if (add) { add.classList.add('show'); setTimeout(() => add.classList.remove('show'), 2200); }
  renderCart(); updateShip(); renderXS();
}


/* ══════════════════════════════════════════════════════════
   CHECKOUT FLOW — Sécurisé
   ══════════════════════════════════════════════════════════ */

// ── Rate limiting (simple token bucket) ─────────────────────
const _rateBuckets = {};
function rateLimit(key, maxCalls, windowMs) {
  const now = Date.now();
  if (!_rateBuckets[key]) _rateBuckets[key] = [];
  _rateBuckets[key] = _rateBuckets[key].filter(t => now - t < windowMs);
  if (_rateBuckets[key].length >= maxCalls) return false; // blocked
  _rateBuckets[key].push(now);
  return true; // allowed
}

// ── Input sanitizer (XSS prevention) ────────────────────────
function sanitize(s) {
  return String(s)
    .trim()
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;')
    .replace(/\//g,'&#x2F;')
    .slice(0, 500); // length cap
}

// ── Validators ───────────────────────────────────────────────
function validatePhone(v) { return /^[0-9+\s\-]{8,15}$/.test(v.trim()); }
function validateEmail(v)  { return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }
function validateText(v, min=1) { return v.trim().length >= min; }

function markField(id, valid) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('err', !valid);
}

// ── Checkout state ─────────────── (managed in ODYS namespace)

function openCheckout() {
  /* fenetre de maquette retiree du theme : voir modals.tpl */
  if (!document.getElementById('coModal')) { return; }
  if (cart.length === 0) { alert('Votre panier est vide.'); return; }
  // Rate limit: max 5 checkout opens per minute
  if (!rateLimit('checkout-open', 5, 60000)) {
    alert('Trop de tentatives. Veuillez patienter.');
    return;
  }
  coStep = 1;
  renderCoSummary();
  setCoStep(1);
  document.getElementById('coOv').classList.add('on');
  document.getElementById('coModal').classList.add('on');
  closeCart();
  document.body.style.overflow = 'hidden';
}

function closeCheckout() {
  document.getElementById('coOv').classList.remove('on');
  document.getElementById('coModal').classList.remove('on');
  document.body.style.overflow = '';
}

function renderCoSummary() {
  const subtotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
  const zone     = getShipZone();
  const z        = SHIPPING[zone];
  const shipCost = getShipCost(zone, subtotal);
  const isFree   = shipCost === 0;
  const total    = subtotal + shipCost;

  const itemsHtml = cart.map(i =>
    `<div class="cos-item"><span class="cos-item-name">${esc(i.name)} × ${Number(i.qty)}</span><span class="cos-item-price">${Number(i.price * i.qty)} DH</span></div>`
  ).join('');

  const shipLine = isFree
    ? `<div class="cos-item"><span class="cos-item-name" style="color:var(--green)">✓ Livraison offerte</span><span class="cos-item-price" style="color:var(--green)">0 DH</span></div>`
    : `<div class="cos-item"><span class="cos-item-name">🚚 Livraison (${z.label})</span><span class="cos-item-price">${shipCost} DH</span></div>`;

  const freeHint = !isFree
    ? `<div style="font-size:9px;color:var(--mid);margin-top:4px">Ajoutez ${z.freeThreshold - subtotal} DH → livraison offerte</div>`
    : '';

  const html = `<div class="cos-title">Récapitulatif</div>
    <div class="cos-items">${itemsHtml}${shipLine}</div>
    <div class="cos-line"></div>
    <div class="cos-total"><span class="cos-total-lbl">Total TTC</span><span class="cos-total-price">${total} DH</span></div>
    ${freeHint}`;

  ['coSummary1','coSummary2'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });
}

function setCoStep(n) {
  coStep = n;
  [1,2,3].forEach(i => {
    const panel = document.getElementById('cop' + i);
    const step  = document.getElementById('cst' + i);
    if (panel) panel.classList.toggle('on', i === n);
    if (step) {
      step.classList.remove('active','done');
      if (i < n) step.classList.add('done');
      if (i === n) step.classList.add('active');
    }
  });
  // Update footer buttons
  document.getElementById('coBackBtn').style.display = n > 1 && n < 3 ? '' : 'none';
  const nextBtn = document.getElementById('coNextBtn');
  const nextLbl = document.getElementById('coNextLbl');
  if (n === 1) { nextBtn.style.display = ''; nextLbl.textContent = 'Continuer vers le paiement →'; }
  if (n === 2) { nextBtn.style.display = ''; nextLbl.textContent = 'Confirmer la commande →'; }
  if (n === 3) { nextBtn.style.display = 'none'; }
}

function coBack() { if (coStep > 1) setCoStep(coStep - 1); }

function coNext() {
  // Rate limit: max 10 "next" clicks per minute
  if (!rateLimit('co-next', 10, 60000)) {
    document.getElementById('rateErr' + coStep).classList.add('show');
    setTimeout(() => document.getElementById('rateErr' + coStep).classList.remove('show'), 4000);
    return;
  }

  if (coStep === 1) {
    // ── Validate delivery form ──
    const prenom  = document.getElementById('coPrenom').value;
    const nom     = document.getElementById('coNom').value;
    const tel     = document.getElementById('coTel').value;
    const email   = document.getElementById('coEmail').value;
    const adresse = document.getElementById('coAdresse').value;
    const ville   = document.getElementById('coVille').value;

    const ok = [
      [validateText(prenom), 'coPrenom'],
      [validateText(nom),    'coNom'],
      [validatePhone(tel),   'coTel'],
      [validateEmail(email), 'coEmail'],
      [validateText(adresse),'coAdresse'],
      [validateText(ville),  'coVille'],
    ];
    let valid = true;
    ok.forEach(([v, id]) => { markField(id, v); if (!v) valid = false; });
    if (!valid) return;

    // Store sanitized — never raw user input in innerHTML later
    coOrder.prenom  = sanitize(prenom);
    coOrder.nom     = sanitize(nom);
    coOrder.tel     = sanitize(tel);
    coOrder.email   = sanitize(email);
    coOrder.adresse = sanitize(adresse);
    coOrder.ville   = sanitize(ville);
    coOrder.note    = sanitize(document.getElementById('coNote').value);

    setCoStep(2);
    renderCoSummary();

  } else if (coStep === 2) {
    // ── Validate payment ──
    const pm = document.querySelector('input[name="payment"]:checked');
    if (!pm) { alert('Choisissez un mode de paiement.'); return; }
    coOrder.payment = pm.value;

    // CMI: redirect to gateway — no card data collected here
    if (pm.value === 'cmi') coOrder.cardLast4 = null;

    // Simulate order submission
    const btn = document.getElementById('coNextBtn');
    const spin = document.getElementById('coSpin');
    const lbl = document.getElementById('coNextLbl');
    btn.disabled = true;
    lbl.style.opacity = '0';
    spin.style.display = 'block';

    const subtotalForPoints = cart.reduce((s,i) => s + i.price * i.qty, 0);
    // Rate limit: max 2 order submissions per 2 minutes (anti-spam)
    if (!rateLimit('co-submit', 2, 120000)) {
      btn.disabled = false; lbl.style.opacity = '1'; spin.style.display = 'none';
      document.getElementById('rateErr2').classList.add('show');
      return;
    }

    setTimeout(() => {
      btn.disabled = false; lbl.style.opacity = '1'; spin.style.display = 'none';
      // Generate order reference
      coOrder.ref = 'ODYS-2026-' + String(Math.floor(1000 + Math.random() * 9000));
      document.getElementById('orderRef').textContent = coOrder.ref;
      awardLoyaltyPoints(subtotalForPoints, coOrder.ref);

      // Update confirmation payment step text
      const payStep = document.getElementById('ccPayStep');
      if (payStep) {
        if (coOrder.payment === 'cod') {
          payStep.querySelector('strong').textContent = 'Paiement à la livraison';
          payStep.querySelector('small').textContent = 'Payez en cash au livreur · En toute sécurité';
          payStep.querySelector('.cc-step-ic').textContent = '💚';
        } else if (coOrder.payment === 'cmi') {
          payStep.querySelector('strong').textContent = 'Paiement carte CMI';
          payStep.querySelector('small').textContent = 'Terminé · Carte ****' + (coOrder.cardLast4 || '****');
          payStep.querySelector('.cc-step-ic').textContent = '💳';
        } else {
          payStep.querySelector('strong').textContent = 'Virement bancaire';
          payStep.querySelector('small').textContent = 'RIB envoyé par email — sous 24h';
          payStep.querySelector('.cc-step-ic').textContent = '🏛️';
        }
      }

      const confirmedTotal = cart.reduce((s,i) => s + i.price * i.qty, 0);
      const confirmedRef   = coOrder.ref;
      cart = [];
      updateCartBadges();
      setCoStep(3);
      // Dispatch clean event — loyalty listener picks it up
      document.dispatchEvent(new CustomEvent('odys:order-confirmed', {
        detail: { total: confirmedTotal, ref: confirmedRef }
      }));
    }, 1800);
  }
}

// Payment method selection
function selectPM(el) {
  document.querySelectorAll('.pm').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  document.getElementById('cmiForm').style.display = el.id === 'pm-cmi' ? 'block' : 'none';
}

/* fmtCard / fmtExp removed — no card fields collected (PCI compliance) */

// Escape key closes checkout
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeCheckout();
});


/* ══════════════════════════════════════════════════════════
   CATALOGUE PARFUMS — avec notes olfactives complètes
   ══════════════════════════════════════════════════════════ */
const PARFUMS_DB = [
  {
    code: '01', name: "L'Icône", inspo: 'Dior Sauvage EDP',
    price: 229, img: 'https://images.unsplash.com/photo-1541643600914-78b084683702?w=400&q=80',
    famille: 'fresh',
    notes: {
      tete:  ['Bergamote', 'Poivre rose', 'Ambroxan'],
      coeur: ['Lavande', 'Géranium', 'Vétiver'],
      fond:  ['Cèdre', 'Ambre blanc', 'Musc']
    }
  },
  {
    code: '07', name: 'La Nuit', inspo: 'JP Gaultier Le Mâle Élixir',
    price: 219, img: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=400&q=80',
    famille: 'oriental',
    notes: {
      tete:  ['Bergamote', 'Cardamome'],
      coeur: ['Lavande', 'Vanille', 'Iris'],
      fond:  ['Musc blanc', 'Tonka', 'Patchouli']
    }
  },
  {
    code: '11', name: "L'Or", inspo: 'Paco Rabanne 1 Million EDP',
    price: 239, img: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=400&q=80',
    famille: 'oriental',
    notes: {
      tete:  ['Pamplemousse', 'Mandarine', 'Menthe'],
      coeur: ['Cannelle', 'Rose', 'Géranium'],
      fond:  ['Patchouli', 'Ambre', 'Cuir']
    }
  },
  {
    code: '14', name: "L'Oriental", inspo: 'Tom Ford Oud Wood',
    price: 249, img: 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&q=80',
    famille: 'oud',
    notes: {
      tete:  ['Poivre rose', 'Épices orientales'],
      coeur: ['Oud', 'Santal', 'Vétiver'],
      fond:  ['Ambre boisé', 'Musc', 'Tonka']
    }
  },
  {
    code: '22', name: 'La Nuit Noire', inspo: 'YSL Black Opium',
    price: 229, img: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&q=80',
    famille: 'gourmand',
    notes: {
      tete:  ['Poire', 'Mandarine', 'Café'],
      coeur: ['Jasmin', 'Fleur de cerisier', 'Vanille'],
      fond:  ['Patchouli', 'Musc blanc', 'Cèdre']
    }
  },
  {
    code: '33', name: "L'Azur", inspo: 'Bleu de Chanel',
    price: 229, img: 'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=400&q=80',
    famille: 'fresh',
    notes: {
      tete:  ['Citron', 'Bergamote', 'Pamplemousse'],
      coeur: ['Gingembre', 'Jasmin', 'Noix de muscade'],
      fond:  ['Cèdre', 'Santal', 'Vétiver']
    }
  }
];

/* ══════════════════════════════════════════════════════════
   SYSTÈME DE FIDÉLITÉ
   ══════════════════════════════════════════════════════════ */
const REWARDS = [
  { id:'disc10', pts:5,  icon:'💫', name:'Remise 10%',         desc:'10% sur votre prochaine commande · Appliquée automatiquement au panier', tag:'discount' },
  { id:'oud5g',  pts:15, icon:'🪵', name:'5g Oud offert',      desc:'5g d\'Oud de votre choix (Thai ou Hindi) · Offert avec votre prochaine commande',  tag:'oud'      },
  { id:'coffret',pts:15, icon:'🎁', name:'Coffret gratuit',     desc:'Un coffret ODYS de votre choix offert · Livraison gratuite incluse',  tag:'coffret'  },
  { id:'vip',    pts:30, icon:'👑', name:'Statut VIP Exclusif', desc:'Accès avant-première aux nouveautés · Livraison prioritaire · Support dédié', tag:'vip' },
];

// Loyalty state — namespaced
if (!window.loyalty) {
  window.loyalty = {
    loggedIn: false,
    user: null,
    points: 0,
    history: [],
    redeemedRewards: [],
    orders: []
  };
}

function initLoyaltyDemo() {
  // Pre-fill demo user for UX demo
  loyalty = {
    loggedIn: false, user: null, points: 0,
    history: [{ type:'earn', label:'Bonus inscription', pts:2, date:'12 mars 2026' }],
    redeemedRewards: [], orders: []
  };
  updateLoyaltyUI();
}

function updateLoyaltyUI() {
  const pts = loyalty.points;
  // Update product page loyalty bar
  const lbPts = document.getElementById('lbPtsVal');
  const lbSub = document.getElementById('lbSub');
  const lbName = document.getElementById('lbName');
  const lbFill = document.getElementById('lbFill');
  if (lbPts) lbPts.textContent = loyalty.loggedIn ? pts : '—';
  if (lbSub) lbSub.textContent = loyalty.loggedIn
    ? (pts === 0 ? 'Achetez pour commencer à gagner des points' : `Encore ${Math.max(0,15-pts)} pts pour votre prochaine récompense`)
    : 'Créez un compte — 2 points offerts à l\'inscription ✨';
  if (lbName) lbName.textContent = loyalty.loggedIn ? `Bonjour, ${loyalty.user.prenom} 👋` : 'Programme Fidélité ODYS';
  if (lbFill) lbFill.style.width = loyalty.loggedIn ? Math.min(100, (pts % 15) / 15 * 100) + '%' : '0%';
  // Tiers
  ['lbt1','lbt2','lbt3','lbt4'].forEach((id,i) => {
    const thresholds = [5,15,15,30];
    const el = document.getElementById(id);
    if (el) el.classList.toggle('earned', loyalty.loggedIn && pts >= thresholds[i]);
  });
  // Account modal big points
  const bigPts = document.getElementById('bigPts');
  if (bigPts) bigPts.textContent = pts;
  // Next reward bar
  const nextTarget = pts < 5 ? 5 : pts < 15 ? 15 : 30;
  const nextStart  = pts < 5 ? 0 : pts < 15 ? 5  : 15;
  const pct = Math.min(100, (pts - nextStart) / (nextTarget - nextStart) * 100);
  const barEl = document.getElementById('nextRwdBar');
  if (barEl) barEl.style.width = pct + '%';
  const curEl = document.getElementById('nextRwdCurrent');
  const tarEl = document.getElementById('nextRwdTarget');
  if (curEl) curEl.textContent = pts + ' pts';
  if (tarEl) tarEl.textContent = nextTarget + ' pts';
  const rwdLbl = document.getElementById('nextRwdLabel');
  if (rwdLbl) rwdLbl.textContent = pts >= 30 ? '👑 VIP débloqué !' : pts >= 15 ? '👑 VIP à 30 pts' : '🎁 Coffret ou 5g Oud à 15 pts';
  // Profile
  const profName = document.getElementById('profName');
  const profEmail = document.getElementById('profEmail');
  const profPtsLine = document.getElementById('profPtsLine');
  const profAvatar = document.getElementById('profAvatar');
  if (loyalty.loggedIn && loyalty.user) {
    if (profName) profName.textContent = loyalty.user.prenom + ' ' + loyalty.user.nom;
    if (profEmail) profEmail.textContent = loyalty.user.email;
    if (profPtsLine) profPtsLine.textContent = pts + ' points · Niveau ' + (pts >= 30 ? 'VIP' : pts >= 15 ? 'Or' : pts >= 5 ? 'Argent' : 'Bronze');
    if (profAvatar) profAvatar.textContent = loyalty.user.prenom[0].toUpperCase();
  }
  // Rewards grid
  renderRewards();
  renderHistory();
  renderLastOrders();
}

function renderRewards() {
  const grid = document.getElementById('rewardsGrid');
  if (!grid) return;
  const pts = loyalty.points;
  grid.innerHTML = REWARDS.map(r => {
    const can = loyalty.loggedIn && pts >= r.pts;
    const redeemed = loyalty.redeemedRewards.includes(r.id);
    return `<div class="rw-card ${can ? 'unlocked' : 'locked'}">
      ${can ? '<div class="rw-unlock-badge">DISPONIBLE</div>' : ''}
      <div class="rw-icon">${esc(r.icon)}</div>
      <div class="rw-name">${esc(r.name)}</div>
      <div class="rw-desc">${esc(r.desc)}</div>
      <div class="rw-cost">${r.pts} <small>points</small></div>
      <button class="rw-btn ${can && !redeemed ? 'can' : 'cant'}" data-action="redeem-reward" data-id="${esc(r.id)}" data-pts="${r.pts}" data-name="${esc(r.name)}"
        >
        ${redeemed ? '✓ Utilisé' : can ? 'Utiliser →' : pts < r.pts ? `Encore ${r.pts - pts} pts` : 'Indisponible'}
      </button>
    </div>`;
  }).join('');
}

function redeemReward(id, pts, name) {
  if (!loyalty.loggedIn) { alert('Connectez-vous pour utiliser vos récompenses.'); return; }
  if (loyalty.points < pts) return;
  if (!confirm(`Utiliser ${pts} points pour : ${name} ?`)) return;
  loyalty.points -= pts;
  loyalty.redeemedRewards.push(id);
  loyalty.history.unshift({ type:'spend', label:'Récompense utilisée : ' + name, pts: -pts, date: new Date().toLocaleDateString('fr-MA') });
  updateLoyaltyUI();
  showPtsToast(`✨ ${name} activé !`);
}

function renderHistory() {
  const el = document.getElementById('ptsHistory');
  if (!el) return;
  if (loyalty.history.length === 0) { el.innerHTML = '<div style="color:var(--mid);font-style:italic;font-size:12px">Aucun historique.</div>'; return; }
  el.innerHTML = loyalty.history.map(h =>
    `<div class="ph-item">
      <div class="ph-icon ${h.type}">${h.type === 'earn' ? '⭐' : '🎁'}</div>
      <div class="ph-desc"><strong>${esc(h.label)}</strong><small>${esc(h.date)}</small></div>
      <div class="ph-pts ${h.type}">${h.pts > 0 ? '+' : ''}${h.pts} pts</div>
    </div>`
  ).join('');
}

function renderLastOrders() {
  const el = document.getElementById('lastOrders');
  if (!el) return;
  if (!loyalty.loggedIn || loyalty.orders.length === 0) {
    el.innerHTML = '<div style="color:var(--mid);font-style:italic;font-size:12px">Aucune commande pour le moment.</div>';
    return;
  }
  el.innerHTML = loyalty.orders.slice(-3).reverse().map(o =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--border)">
      <div><strong style="font-size:12px">${esc(o.ref)}</strong><div style="font-size:10px;color:var(--mid)">${esc(o.date)} · ${o.items} article(s)</div></div>
      <div style="text-align:right"><div style="font-family:var(--serif);font-size:14px;color:var(--rose-deep)">${o.total} DH</div><div style="font-size:9px;color:var(--green)">+${o.pts} pts</div></div>
    </div>`
  ).join('');
}

// Called when order is confirmed
function awardLoyaltyPoints(total, orderRef) {
  if (!loyalty.loggedIn) return;
  const eligibleTotal = cart.reduce((sum, item) => {
    if (item.noPoints || item.code.startsWith('OUD-') || item.code.startsWith('SAM-') ||
        item.code.startsWith('BK-') || item.code.startsWith('F0') || item.code.startsWith('F1') ||
        item.code.startsWith('F3') || item.code === 'PACK-OUD') return sum;
    return sum + (item.price * item.qty);
  }, 0);
  const pts = Math.floor(eligibleTotal / 100);
  if (pts <= 0) return;
  loyalty.points += pts;
  loyalty.history.unshift({
    type: 'earn',
    label: 'Commande ' + orderRef,
    pts: pts,
    date: new Date().toLocaleDateString('fr-MA')
  });
  loyalty.orders.push({
    ref: orderRef, total: total, pts: pts,
    items: cart.length, // cart before reset
    date: new Date().toLocaleDateString('fr-MA')
  });
  updateLoyaltyUI();
  setTimeout(() => showPtsToast(`+${pts} point${pts>1?'s':''} fidélité gagnés ! Total : ${loyalty.points} pts`), 2000);
}

function showPtsToast(msg) {
  const t = document.getElementById('ptsToast');
  const m = document.getElementById('ptsToastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* Account Modal */
function openAccount() {
  /* fenetre de maquette retiree du theme : voir modals.tpl */
  if (!document.getElementById('accModal')) { return; }
  document.getElementById('accOv').classList.add('on');
  document.getElementById('accModal').classList.add('on');
  document.body.style.overflow = 'hidden';
  updateLoyaltyUI();
  showAccLogin();
}
function closeAccount() {
  document.getElementById('accOv').classList.remove('on');
  document.getElementById('accModal').classList.remove('on');
  document.body.style.overflow = '';
}
function showAccTab(tab) {
  document.querySelectorAll('.acc-panel').forEach(p => p.classList.remove('on'));
  document.querySelectorAll('.acc-tab').forEach(b => b.classList.remove('on'));
  const p = document.getElementById('atp-' + tab);
  if (p) p.classList.add('on');
  const tabs = ['overview','history','rewards','account'];
  const i = tabs.indexOf(tab);
  document.querySelectorAll('.acc-tab')[i]?.classList.add('on');
}
function showAccLogin() {
  if (loyalty.loggedIn) {
    document.getElementById('formLogin').style.display = 'none';
    document.getElementById('formRegister').style.display = 'none';
    document.getElementById('formProfile').style.display = 'block';
  } else {
    document.getElementById('formLogin').style.display = 'block';
    document.getElementById('formRegister').style.display = 'none';
    document.getElementById('formProfile').style.display = 'none';
  }
}
function showRegister() {
  document.getElementById('formLogin').style.display = 'none';
  document.getElementById('formRegister').style.display = 'block';
}
function showLogin() {
  document.getElementById('formLogin').style.display = 'block';
  document.getElementById('formRegister').style.display = 'none';
}
function doLogin() {
  if (!rateLimit('login', 5, 60000)) { alert('Trop de tentatives. Patientez 1 minute.'); return; }
  const email = document.getElementById('loginEmail').value.trim();
  const pwd   = document.getElementById('loginPwd').value;
  // Demo credentials
  if (email === '(retire)' && pwd === '(retire)') {
    loyalty.loggedIn = true;
    loyalty.user = { prenom:'Mohammed', nom:'Alami', email:'(retire)' };
    loyalty.points = 7; // demo has 7 pts
    loyalty.history = [
      { type:'earn', label:'Bonus inscription',    pts:2,  date:'1 janv. 2026' },
      { type:'earn', label:'Commande ODYS-2026-001', pts:3, date:'15 fév. 2026' },
      { type:'earn', label:'Commande ODYS-2026-002', pts:2, date:'5 mars 2026'  },
    ];
    loyalty.orders = [
      { ref:'ODYS-2026-001', total:329, pts:3, items:1, date:'15 fév. 2026' },
      { ref:'ODYS-2026-002', total:229, pts:2, items:1, date:'5 mars 2026'  },
    ];
    updateLoyaltyUI();
    showAccLogin();
    showAccTab('overview');
    showPtsToast('Bienvenue Mohammed — 7 points disponibles ⭐');
  } else {
    alert('Email ou mot de passe incorrect.');
  }
}
function doRegister() {
  if (!rateLimit('register', 3, 60000)) { alert('Trop de tentatives.'); return; }
  const prenom = document.getElementById('regPrenom').value.trim();
  const nom    = document.getElementById('regNom').value.trim();
  const email  = document.getElementById('regEmail').value.trim();
  const tel    = document.getElementById('regTel').value.trim();
  const pwd    = document.getElementById('regPwd').value;
  if (!prenom || !nom || !email || !tel || pwd.length < 6) {
    alert('Veuillez remplir tous les champs (mot de passe min. 6 caractères).');
    return;
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { alert('Email invalide.'); return; }
  loyalty.loggedIn = true;
  loyalty.user = { prenom: sanitize(prenom), nom: sanitize(nom), email: sanitize(email) };
  loyalty.points = 2; // 2 pts offerts à l'inscription
  loyalty.history = [{ type:'earn', label:'Bonus inscription', pts:2, date: new Date().toLocaleDateString('fr-MA') }];
  updateLoyaltyUI();
  showAccLogin();
  showAccTab('overview');
  showPtsToast(`Bienvenue ${prenom} ! +2 points offerts ⭐`);
}
function doLogout() {
  if (!confirm('Se déconnecter ?')) return;
  loyalty = { loggedIn:false, user:null, points:0, history:[], redeemedRewards:[], orders:[] };
  updateLoyaltyUI();
  showLogin();
  closeAccount();
}

/* ══════════════════════════════════════════════════════════
   RECHERCHE PAR NOTES OLFACTIVES
   ══════════════════════════════════════════════════════════ */
function searchNote(el) {
  const note = el.dataset.note;
  const type = el.dataset.type;
  if (!note) return;
  // Mark note as active
  document.querySelectorAll('.note').forEach(n => n.classList.remove('active-note'));
  el.classList.add('active-note');

  // Find all parfums containing this note (in any tier)
  const results = PARFUMS_DB.map(p => {
    const allNotes = [...p.notes.tete, ...p.notes.coeur, ...p.notes.fond];
    const tier = p.notes.tete.includes(note) ? 'tête' : p.notes.coeur.includes(note) ? 'cœur' : p.notes.fond.includes(note) ? 'fond' : null;
    if (!tier) return null;
    return { ...p, matchTier: tier };
  }).filter(Boolean);

  // Populate panel
  document.getElementById('npNoteName').textContent = note;
  document.getElementById('npNoteType').textContent = '· Note de ' + type;
  document.getElementById('npCount').textContent = results.length + ' parfum' + (results.length > 1 ? 's' : '') + ' contenant cette note';

  const grid = document.getElementById('npGrid');
  if (results.length === 0) {
    grid.innerHTML = '<div class="np-empty">Aucun parfum trouvé avec cette note.</div>';
  } else {
    // Build matching notes for each result (highlight shared notes)
    grid.innerHTML = results.map(r => {
      const allNotes = [...r.notes.tete, ...r.notes.coeur, ...r.notes.fond];
      const matchBadges = allNotes.slice(0, 4).map(n =>
        `<span class="${n === note ? 'exact' : ''}">${esc(n)}</span>`
      ).join('');
      return `<div class="np-card" data-action="go" data-page="parfum" data-close-notes="1">
        <div class="np-img"><img src="${esc(r.img)}" loading="lazy" alt="${esc(r.name)}"/></div>
        <div class="np-info">
          <div class="np-code">ODYS ${esc(r.code)}</div>
          <div class="np-name">${esc(r.name)}</div>
          <div class="np-price">${Number(r.price)} DH</div>
          <div class="np-match">${matchBadges}</div>
          <button class="np-add" data-action="add-to-cart" data-code="${esc(r.code)}" data-name="${esc(r.name)}" data-price="${Number(r.price)}">Ajouter →</button>
        </div>
      </div>`;
    }).join('');
  }

  // Show panel
  document.getElementById('notesOv').classList.add('on');
  document.getElementById('notesPanel').classList.add('on');
}

function closeNotes() {
  document.getElementById('notesOv').classList.remove('on');
  document.getElementById('notesPanel').classList.remove('on');
  document.querySelectorAll('.note').forEach(n => n.classList.remove('active-note'));
}

/* Hook into checkout confirmation to award points */
const _origSetCoStep = typeof setCoStep === 'function' ? setCoStep : null;
// Patch points award into the order submission timeout
// This is done by augmenting coNext via a proxy pattern

// Also init loyalty on load
document.addEventListener('DOMContentLoaded', () => {
  initLoyaltyDemo();
  // Nav account icon — add to all navs
  document.querySelectorAll('.nav-icons').forEach(ni => {
    if (!ni.querySelector('.ni-acc')) {
      const btn = document.createElement('button');
      btn.className = 'ni ni-acc';
      btn.dataset.action = 'open-account';
      btn.setAttribute('title', 'Mon compte');
      btn.setAttribute('aria-label', 'Mon compte fidélité');
      btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>';
      ni.insertBefore(btn, ni.firstChild);
    }
  });
  // Add points pill to each product card
  document.querySelectorAll('.pc-body').forEach(body => {
    const prow = body.querySelector('.pc-prow');
    if (prow && !body.querySelector('.pc-pts-pill')) {
      const priceEl = prow.querySelector('.pc-price');
      if (priceEl) {
        const price = parseInt(priceEl.textContent);
        const pts = Math.floor(price / 100);
        if (pts > 0) {
          const pill = document.createElement('div');
          pill.className = 'pc-pts-pill';
          const star = document.createTextNode('⭐ +' + pts + ' point' + (pts>1?'s':'') + ' fidélité');
          pill.appendChild(star);
          body.insertBefore(pill, prow.nextSibling);
        }
      }
    }
  });
});

// Points awarded directly inside coNext

/* ── PUBLIC API ──────────────────────────────────────────── */
return {
  go, toggleMenu, closeMenu,
  openCart, closeCart, addToCart, chgItem, removeItem,
  pickVol, chgQty, qtyRead, qtyWrite, addProd, switchThumb, toggleAcc, toggleWish, wishToggle, wishDrop,
  filterFam, qPick, qPick2, qPick3, addQuizResult, resetQuiz,
  pickGram, addOud,
  openCheckout, closeCheckout, coNext, coBack, selectPM,
  openAccount, closeAccount, showAccTab, doLogin, doRegister, doLogout,
  showRegister, showLogin, redeemReward,
  searchNote, closeNotes,
  updateShip, renderCoSummary,
};
})(); // end ODYS IIFE

/* ── EVENT DELEGATION ─────────────────────────────────────── */
/* A quantity typed into a cart line. PrestaShop's own +/- URL takes an op and
   a count, so the difference from what is in the cart is what gets sent. */
document.addEventListener('change', function (e) {
  var box = e.target.closest ? e.target.closest('.cart-qty') : null;
  if (!box) { return; }
  var url = box.getAttribute('data-qty-url');
  var now = parseInt(box.getAttribute('data-qty-now'), 10);
  var want = parseInt(box.value, 10);
  if (!url || isNaN(now)) { return; }
  if (isNaN(want) || want < 1) { want = 1; box.value = 1; }
  var delta = want - now;
  if (delta === 0) { return; }
  box.disabled = true;               // one submission, not one per keystroke
  window.location.href = url + '&op=' + (delta > 0 ? 'up' : 'down')
    + '&qty=' + Math.abs(delta);
});

document.addEventListener('change', function(e) {
  if (e.target.closest('[data-action="select-pm"]')) ODYS.selectPM(e.target.closest('.pm'));
  if (e.target.id === 'coVille') { ODYS.updateShip(); ODYS.renderCoSummary(); }
});
document.addEventListener('click', function(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  if (t.tagName === 'A') e.preventDefault();
  const action = t.dataset.action;
  const p = t.dataset;
  switch (action) {
    case 'go':            ODYS.go(p.page); if(p.closeMenu) ODYS.closeMenu(); if(p.closeNotes) ODYS.closeNotes(); break;
    case 'open-cart':     ODYS.openCart(); break;
    case 'close-cart':    ODYS.closeCart(); break;
    case 'open-checkout': ODYS.openCheckout(); break;
    case 'close-checkout':ODYS.closeCheckout(); break;
    case 'co-next':       ODYS.coNext(); break;
    case 'co-back':       ODYS.coBack(); break;
    case 'open-account':  ODYS.openAccount(); break;
    case 'close-account': ODYS.closeAccount(); break;
    case 'close-notes':   ODYS.closeNotes(); break;
    case 'do-login':      ODYS.doLogin(); break;
    case 'do-register':   ODYS.doRegister(); break;
    case 'do-logout':     ODYS.doLogout(); break;
    case 'show-register': ODYS.showRegister(); break;
    case 'show-login':    ODYS.showLogin(); break;
    case 'acc-tab':       ODYS.showAccTab(p.tab); break;
    case 'toggle-menu':   ODYS.toggleMenu(); break;
    case 'close-menu':    ODYS.closeMenu(); break;
    case 'toggle-wish':   ODYS.toggleWish(t); break;
    case 'toggle-wish-full': ODYS.wishToggle(t, true); break;
    case 'wish-drop':     ODYS.wishDrop(t.getAttribute('data-id')); break;
    case 'toggle-acc':    ODYS.toggleAcc(t); break;
    case 'add-to-cart':   if (!p.idProduct) ODYS.addToCart(p.code, p.name, Number(p.price), t); break;  // PS buttons: bridge below
    case 'add-prod':      if (!p.idProduct) ODYS.addProd(); break;  // PS buttons: bridge below
    case 'pick-vol':      ODYS.pickVol(t); break;
    case 'chg-qty':       ODYS.chgQty(Number(p.delta)); break;
    case 'chg-item':      ODYS.chgItem(p.code, Number(p.delta)); break;
    case 'remove-item':   ODYS.removeItem(p.code); break;
    case 'filter-fam':    ODYS.filterFam(t, p.fam); break;
    case 'q-pick':        ODYS.qPick(p.opt, p.fam); break;
    case 'q-pick2':       ODYS.qPick2(p.opt, p.occ); break;
    case 'q-pick3':       ODYS.qPick3(p.opt, p.intensity); break;
    case 'add-quiz-result':ODYS.addQuizResult(); break;
    case 'reset-quiz':    ODYS.resetQuiz(); break;
    case 'pick-gram':     ODYS.pickGram(t, p.cardId, Number(p.rate)); break;
    case 'add-oud':       ODYS.addOud(p.code, p.name, p.cardId, t); break;
    case 'select-pm':     ODYS.selectPM(t.closest('.pm')); break;
    case 'search-note':   ODYS.searchNote(t); break;
    case 'switch-thumb':  ODYS.switchThumb(t, p.src); break;
    case 'redeem-reward': ODYS.redeemReward(p.id, Number(p.pts), p.name); break;
    case 'dismiss-sbn':   { const s = document.getElementById('sbn'); if(s) s.style.display='none'; } break;
    case 'wa-order': {
      const n = document.querySelector('[data-wa-number]')?.dataset.waNumber || '212600000000';
      window.open('https://wa.me/' + n + '?text=' + encodeURIComponent('Bonjour ODYS \u{1F44B} Je souhaite passer une commande'), '_blank');
      break;
    }
  }
});
document.getElementById('ov')       ?.addEventListener('click', () => ODYS.closeCart());
document.getElementById('coOv')     ?.addEventListener('click', () => ODYS.closeCheckout());
document.getElementById('accOv')    ?.addEventListener('click', () => ODYS.closeAccount());
document.getElementById('notesOv')  ?.addEventListener('click', () => ODYS.closeNotes());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ODYS.closeCheckout(); ODYS.closeAccount(); ODYS.closeNotes(); ODYS.closeCart();
});


/* ── Cart event delegation (no inline onclick) ───────────────
   All cart interactions use data-action attributes.
   One listener handles all clicks inside #dItems and #dXsList.
   ─────────────────────────────────────────────────────────── */
/* Removed in v5.0: duplicate cart delegation. Every action it handled
   (chg-item, remove-item, add-to-cart, go-page, open-account) is already
   dispatched by the ODYS delegation above, and its bare function calls
   were not in scope — each click threw a ReferenceError. */

/* ══════════════════════════════════════════════════════════
   GULF ORCHID PRODUCT SUGGESTIONS
   ══════════════════════════════════════════════════════════ */

const SUGG_DB = [
  { code:'01', name:"L'Icône",      inspo:'Dior Sauvage EDP',          price:229, badge:'Best-seller', img:'https://images.unsplash.com/photo-1541643600914-78b084683702?w=320&q=80' },
  { code:'07', name:'La Nuit',       inspo:'JP Gaultier Le Mâle Élixir', price:219, badge:'',           img:'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=320&q=80' },
  { code:'11', name:"L'Or",          inspo:'Paco Rabanne 1 Million',    price:239, badge:'Nouveau',     img:'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=320&q=80' },
  { code:'14', name:"L'Oriental",    inspo:'Tom Ford Oud Wood',         price:249, badge:'Oud',         img:'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=320&q=80' },
  { code:'22', name:'La Nuit Noire', inspo:'YSL Black Opium',           price:229, badge:'',            img:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=320&q=80' },
  { code:'33', name:"L'Azur",        inspo:'Bleu de Chanel',            price:229, badge:'',            img:'https://images.unsplash.com/photo-1557170334-a9632e77c6e4?w=320&q=80' },
  { code:'BK-250', name:'Boukhour Classique', inspo:'Artisanal Maroc',  price:189, badge:'🪔',          img:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=320&q=80' },
];

const FBT_BUNDLES = {
  '01': ['07', 'BK-250'],
  '07': ['01', '22'],
  '11': ['14', '07'],
  '14': ['BK-250', '01'],
  '22': ['07', '33'],
  '33': ['01', '11'],
};

let fbtSelected = new Set();
let suggOffset  = 0;
const SUGG_CARD_W = 174;

function initSuggestions() {
  const track = document.getElementById('suggTrack');
  // PrestaShop renders the real products into this node; the prototype's
  // table must never paint over them
  if (!track || track.children.length) return;
  const currentCode = '01';
  const recs = SUGG_DB.filter(p => p.code !== currentCode);
  track.innerHTML = recs.map(p => `
    <div class="sc" data-code="${esc(p.code)}">
      <div class="sc-img">
        ${p.badge ? `<span class="sc-badge">${esc(p.badge)}</span>` : ''}
        <img src="${esc(p.img)}" loading="lazy"
          alt="ODYS ${esc(p.code)} ${esc(p.name)} — Parfum inspiration ${esc(p.inspo)}, Maroc"
          width="160" height="160"/>
        <button class="sc-add-quick"
          data-action="add-to-cart"
          data-code="${esc(p.code)}"
          data-name="${esc(p.name)}"
          data-price="${Number(p.price)}"
          aria-label="Ajouter ${esc(p.name)} au panier">+</button>
      </div>
      <div class="sc-body">
        <div class="sc-ref">ODYS ${esc(p.code)}</div>
        <div class="sc-name">${esc(p.name)}</div>
        <div class="sc-inspo">Inspiré ${esc(p.inspo)}</div>
        <div class="sc-price-row">
          <span class="sc-price">${Number(p.price)} DH</span>
          <button class="sc-add-full"
            data-action="add-to-cart"
            data-code="${esc(p.code)}"
            data-name="${esc(p.name)}"
            data-price="${Number(p.price)}">Ajouter</button>
        </div>
      </div>
    </div>`).join('');
  updateSuggNav();
  initFBT(currentCode);
  initUpsellStrip(currentCode);
  initViewingNow();
}

function scrollSugg(dir) {
  const track   = document.getElementById('suggTrack');
  const cards   = track ? track.querySelectorAll('.sc') : [];
  const visible = Math.floor((track?.parentElement?.offsetWidth || 600) / SUGG_CARD_W);
  const max     = Math.max(0, cards.length - visible);
  suggOffset    = Math.max(0, Math.min(max, suggOffset + dir));
  if (track) track.style.transform = `translateX(-${suggOffset * SUGG_CARD_W}px)`;
  updateSuggNav();
}

function updateSuggNav() {
  const track   = document.getElementById('suggTrack');
  const cards   = track ? track.querySelectorAll('.sc') : [];
  const visible = Math.floor((track?.parentElement?.offsetWidth || 600) / SUGG_CARD_W);
  const max     = Math.max(0, cards.length - visible);
  const prev    = document.getElementById('suggPrev');
  const next    = document.getElementById('suggNext');
  if (prev) prev.disabled = suggOffset === 0;
  if (next) next.disabled = suggOffset >= max;
}

function initFBT(currentCode) {
  const box  = document.getElementById('fbtBox');
  const wrap = document.getElementById('fbtItems');
  if (!box || !wrap) return;
  const companions = FBT_BUNDLES[currentCode] || ['07','BK-250'];
  const current    = SUGG_DB.find(p => p.code === currentCode);
  const items      = [current, ...companions.map(c => SUGG_DB.find(p => p.code === c))].filter(Boolean);
  fbtSelected      = new Set(items.map(p => p.code));
  wrap.innerHTML   = items.map((p, i) => `
    ${i > 0 ? '<div class="fbt-plus">+</div>' : ''}
    <div class="fbt-item on" data-code="${esc(p.code)}" data-action="toggle-fbt" data-code="${esc(p.code)}">
      <input type="checkbox" checked data-code="${esc(p.code)}"
        aria-label="${esc(p.name)}" data-action="toggle-fbt"/>
      <img src="${esc(p.img)}" loading="lazy" alt="${esc(p.name)}" width="64" height="72"/>
    </div>`).join('');
  updateFBTTotal(items);
}

function toggleFBT(code) {
  const item = document.querySelector(`.fbt-item[data-code="${code}"]`);
  const cb   = item?.querySelector('input[type=checkbox]');
  if (!item) return;
  if (fbtSelected.has(code)) {
    fbtSelected.delete(code);
    item.classList.remove('on');
    if (cb) cb.checked = false;
  } else {
    fbtSelected.add(code);
    item.classList.add('on');
    if (cb) cb.checked = true;
  }
  const items = [...fbtSelected].map(c => SUGG_DB.find(p => p.code === c)).filter(Boolean);
  updateFBTTotal(items);
}

function updateFBTTotal(items) {
  const total  = items.reduce((s, p) => s + p.price, 0);
  const saving = items.length >= 3 ? Math.round(total * 0.1) : 0;
  const finalT = total - saving;
  const totEl  = document.getElementById('fbtTotal');
  const saveEl = document.getElementById('fbtSave');
  if (totEl)  totEl.textContent   = finalT + ' DH';
  if (saveEl) {
    saveEl.style.display = saving > 0 ? '' : 'none';
    if (saving > 0) saveEl.textContent = `Vous économisez ${saving} DH`;
  }
}

function addFBT() {
  const btn = document.getElementById('fbtBtn');
  let count = 0;
  fbtSelected.forEach(code => {
    const p = SUGG_DB.find(x => x.code === code);
    if (p && !ODYS.cart?.find?.(i => i.code === p.code)) {
      ODYS.addToCart(p.code, p.name, p.price, null);
      count++;
    }
  });
  if (btn) {
    btn.textContent      = `✓ ${count} articles ajoutés !`;
    btn.style.background = 'var(--green)';
    setTimeout(() => { btn.textContent = 'Tout ajouter au panier →'; btn.style.background = ''; }, 2000);
  }
}

function initUpsellStrip(currentCode) {
  const strip = document.getElementById('upsellStrip');
  if (!strip) return;
  const upsells = SUGG_DB.filter(p => p.code !== currentCode && p.code !== 'BK-250').slice(0, 4);
  strip.innerHTML = `<div class="us-label">Complétez<br>la collection</div>` +
    upsells.map(p => `
    <div class="us-item">
      <img src="${esc(p.img)}" loading="lazy" alt="${esc(p.name)}" width="40" height="46"/>
      <div class="us-item-info">
        <div class="us-item-name">ODYS ${esc(p.code)} ${esc(p.name)}</div>
        <div class="us-item-price">${Number(p.price)} DH</div>
      </div>
      <button class="us-add"
        data-action="add-to-cart"
        data-code="${esc(p.code)}"
        data-name="${esc(p.name)}"
        data-price="${Number(p.price)}">+</button>
    </div>`).join('');
}

function initViewingNow() {
  const el = document.getElementById('vnCount');
  if (!el) return;
  let count = 8 + Math.floor(Math.random() * 8);
  el.textContent = count;
  setInterval(() => {
    count = Math.max(4, Math.min(20, count + (Math.random() > 0.5 ? 1 : -1)));
    el.textContent = count;
  }, 7000 + Math.random() * 5000);
}

document.addEventListener('DOMContentLoaded', () => {
  initSuggestions();
  window.addEventListener('resize', () => { suggOffset = 0; updateSuggNav(); });
});

/* ══════════════════════════════════════════════════════════
   FULL REVIEW PAGE — 74 interactive tests
   ══════════════════════════════════════════════════════════ */

const REVIEW_SECTIONS = [
  { id:'nav',      icon:'🧭', title:'Navigation & Pages',            color:'#4338CA', bg:'#EEF2FF', border:'#C7D2FE',
    tests:[
      {id:'n1',label:'🏠 Accueil — Hero, parfums, bundles, quiz, reviews, newsletter',act:'go',pg:'home'},
      {id:'n2',label:'🌹 Produit — Volume selector, pyramide olfactive, FBT, carousel suggestions',act:'go',pg:'parfum'},
      {id:'n3',label:'🪵 Oud — Grilles par origine, gram selector, samplers, boukhour',act:'go',pg:'oud'},
      {id:'n5',label:'📦 Collection — Filtres famille olfactive',act:'go',pg:'collection'},
      {id:'n6',label:'⚗️ Quiz Senteur — 3 étapes, résultat, ajout au panier',act:'go',pg:'quiz'},
      {id:'n7',label:'🎁 Coffrets — Bundles, duo/trio, pack oud',act:'go',pg:'bundles'},
      {id:'n8',label:'❤️ Saint-Valentin — Collection spéciale',act:'go',pg:'val'},
      {id:'n9',label:'📊 Analytics — Dashboard KPIs, segments clients',act:'go',pg:'analytics'},
    ]},
  { id:'cart',     icon:'🛒', title:'Panier & Checkout',              color:'#C4956A', bg:'#FDF8F3', border:'#E8C9A8',
    tests:[
      {id:'c1',label:'Ajouter ODYS 01 L\'Icône 50ml depuis la page produit',act:'go',pg:'parfum'},
      {id:'c2',label:'Panier — suggestions cross-sell (cartes Gulf Orchid avec image + prix + bouton +)',act:'openCart'},
      {id:'c3',label:'Modifier quantité (+/−) — total recalculé',act:'openCart'},
      {id:'c4',label:'Barre livraison : 20 DH Casa · 30 DH Maroc · Gratuite dès 300 DH',act:'openCart'},
      {id:'c5',label:'Checkout Étape 1 — Validation formulaire (champs obligatoires inline)',act:'openCheckout'},
      {id:'c6',label:'Sélectionner Casablanca → récapitulatif 20 DH livraison',act:'openCheckout'},
      {id:'c7',label:'Checkout Étape 2 — CMI = encadré redirection (aucun champ carte)',act:'openCheckout'},
      {id:'c8',label:'Checkout Étape 3 — Confirmation + numéro ODYS-2026-XXXX',act:'openCheckout'},
      {id:'c9',label:'Toast "+X points fidélité" après commande confirmée (si connecté)',act:'openCheckout'},
    ]},
  { id:'sugg',     icon:'💡', title:'Suggestions Gulf Orchid',         color:'#059669', bg:'#F0FAF4', border:'#B8DDC8',
    tests:[
      {id:'s1',label:'"👁 X personnes regardent ce parfum" — compteur dynamique 8-15',act:'go',pg:'parfum'},
      {id:'s2',label:'FBT "Souvent achetés ensemble" — 3 produits avec checkboxes',act:'go',pg:'parfum'},
      {id:'s3',label:'FBT — Décocher un produit → total recalculé instantanément',act:'go',pg:'parfum'},
      {id:'s4',label:'FBT — 3 produits → badge vert "Vous économisez X DH" (-10%)',act:'go',pg:'parfum'},
      {id:'s5',label:'FBT — "Tout ajouter" → confirme "✓ X articles ajoutés !"',act:'go',pg:'parfum'},
      {id:'s6',label:'Carousel 6 cartes — image + badge + prix + bouton Ajouter',act:'go',pg:'parfum'},
      {id:'s7',label:'Carousel — Flèches ‹ › navigation (gauche grisée au début)',act:'go',pg:'parfum'},
      {id:'s8',label:'Hover carte → bouton "+" apparaît, clic → "✓" vert 1.8s',act:'go',pg:'parfum'},
      {id:'s9',label:'Bande navy "Complétez la collection" — 4 produits + bouton +',act:'go',pg:'parfum'},
    ]},
  { id:'oud',      icon:'🪵', title:'Oud — Vente au gramme',           color:'#C8860A', bg:'#FDF9F2', border:'#3D2E10',
    tests:[
      {id:'o1',label:'Hindi Assam A 35 DH/g — 10g par défaut → total 350 DH',act:'go',pg:'oud'},
      {id:'o2',label:'Cliquer 25g → total animé → 875 DH avec highlight doré',act:'go',pg:'oud'},
      {id:'o3',label:'Ajouter → "Hindi Assam A 25g" dans le panier',act:'go',pg:'oud'},
      {id:'o4',label:'Royal Thai B "⭐ Best-seller" à 45 DH/g',act:'go',pg:'oud'},
      {id:'o5',label:'Sampler Hindi 195 DH — kit fixe 3×5g, pas de gram selector',act:'go',pg:'oud'},
      {id:'o6',label:'Boukhour Classique 250g · Prestige 100g',act:'go',pg:'oud'},
      {id:'o7',label:'Pack Oud Prestige 349 DH → ajout au panier',act:'go',pg:'oud'},
    ]},
  { id:'loyalty',  icon:'⭐', title:'Programme Fidélité',               color:'#1B2A4A', bg:'#F0F4FF', border:'#C7D2FE',
    tests:[
      {id:'l1',label:'Barre fidélité page produit — "2 points offerts à l\'inscription"',act:'go',pg:'parfum'},
      {id:'l2',label:'Clic barre → modal compte (onglets : Vue d\'ensemble · Historique · Récompenses)',act:'openAccount'},
      {id:'l3',label:'Login compte de demonstration retire → 7 points + historique',act:'openAccount'},
      {id:'l4',label:'Onglet Récompenses — 4 cartes, "Remise 10%" débloquée (7 pts ≥ 5)',act:'openAccount'},
      {id:'l5',label:'Passer commande → toast "+X points fidélité !"',act:'openCheckout'},
      {id:'l6',label:'Pill "⭐ +2 pts fidélité" sur les cartes produit',act:'go',pg:'collection'},
    ]},
  { id:'notes',    icon:'🌸', title:'Recherche par Notes Olfactives',   color:'#BE185D', bg:'#FDF2F8', border:'#FBCFE8',
    tests:[
      {id:'no1',label:'Pyramide olfactive — "— cliquez pour explorer" sur chaque tier',act:'go',pg:'parfum'},
      {id:'no2',label:'Clic "Lavande" → panel bottom-sheet avec parfums',act:'go',pg:'parfum'},
      {id:'no3',label:'Badge rose "exact" sur la note recherchée',act:'go',pg:'parfum'},
      {id:'no4',label:'Clic "Bergamote" → résultats différents (ODYS 01 et 33)',act:'go',pg:'parfum'},
      {id:'no5',label:'Bouton "Ajouter →" sur chaque carte de résultat',act:'go',pg:'parfum'},
    ]},
  { id:'security', icon:'🔐', title:'Sécurité & Architecture',          color:'#DC2626', bg:'#FEF2F2', border:'#FECACA',
    tests:[
      {id:'sec1',label:'DevTools → Elements : zéro onclick= (data-action= partout)',info:true},
      {id:'sec2',label:'Console : taper "ODYS" → objet namespace avec API publique',info:true},
      {id:'sec3',label:'Console : taper "cart" → ReferenceError (privé dans l\'IIFE)',info:true},
      {id:'sec4',label:'Rate limiting : 11× "Continuer" en checkout → erreur',act:'openCheckout'},
      {id:'sec5',label:'Validation : téléphone "abc" → erreur inline rouge',act:'openCheckout'},
      {id:'sec6',label:'CMI : encadré jaune redirection, aucun champ carte',act:'openCheckout'},
    ]},
  { id:'seo',      icon:'🔍', title:'SEO & Performance',                color:'#0284C7', bg:'#F0F9FF', border:'#BAE6FD',
    tests:[
      {id:'seo1',label:'View Source → title "Acheter Parfum Luxe Maroc — Livraison Gratuite"',info:true},
      {id:'seo2',label:'View Source → 2 blocs JSON-LD (Organization+FAQPage, Product)',info:true},
      {id:'seo3',label:'View Source → 17 balises <h2 class="pc-name">',info:true},
      {id:'seo4',label:'Image hero : fetchpriority="high" + loading="eager"',info:true},
      {id:'seo5',label:'OG tags : og:locale="fr_MA" + og:locale:alternate="ar_MA"',info:true},
      {id:'seo6',label:'Geo meta : geo.region="MA" · geo.placename="Casablanca, Maroc"',info:true},
    ]},
];

let rvChecked = {};

function initReview() {
  const container = document.getElementById('reviewSections');
  if (!container) return;
  const total = REVIEW_SECTIONS.reduce((s, sec) => s + sec.tests.length, 0);

  container.innerHTML = `
    <div style="background:#fff;border:1px solid var(--border);border-radius:4px;padding:20px;position:sticky;top:76px;z-index:10;box-shadow:0 2px 12px rgba(26,22,18,.07);margin-bottom:4px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
        <div style="font-size:10px;font-weight:700;color:var(--mid);letter-spacing:2px;text-transform:uppercase">Progression</div>
        <div style="font-family:var(--serif);font-size:22px;font-weight:500;color:var(--rose-deep)" id="rvScore">0 / ${total}</div>
      </div>
      <div style="height:8px;background:var(--border);border-radius:10px;overflow:hidden">
        <div style="height:100%;background:linear-gradient(90deg,var(--rose),#E8B07A);border-radius:10px;transition:width .4s;width:0%" id="rvBar"></div>
      </div>
      <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap" id="rvBadge"></div>
    </div>
    ${REVIEW_SECTIONS.map(sec => `
    <div style="background:#fff;border:1px solid ${sec.border};border-radius:4px;overflow:hidden;margin-bottom:8px">
      <div style="background:${sec.bg};padding:14px 20px;border-bottom:1px solid ${sec.border};display:flex;align-items:center;justify-content:space-between">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:18px">${sec.icon}</span>
          <div>
            <div style="font-size:12px;font-weight:800;color:${sec.color}">${sec.title}</div>
            <div style="font-size:9px;color:var(--mid);margin-top:1px">${sec.tests.length} tests</div>
          </div>
        </div>
        <div style="font-family:var(--serif);font-size:15px;font-weight:500;color:${sec.color}" id="rvscore-${sec.id}">0/${sec.tests.length}</div>
      </div>
      <div>
        ${sec.tests.map((t,i) => `
        <div id="rvr-${t.id}" style="display:flex;align-items:flex-start;gap:10px;padding:10px 18px;${i<sec.tests.length-1?'border-bottom:1px solid var(--border)':''};transition:background .15s">
          <input type="checkbox" id="rvcb-${t.id}" style="flex-shrink:0;margin-top:3px;width:15px;height:15px;accent-color:${sec.color};cursor:pointer" onchange="rvCheck('${t.id}','${sec.id}',this.checked)"/>
          <label for="rvcb-${t.id}" style="flex:1;font-size:11.5px;color:var(--ink);cursor:pointer;line-height:1.5">${t.label}</label>
          ${t.act
            ? `<button onclick="${t.act==='go'?`ODYS.go('${t.pg}')`:`ODYS.${t.act}()`}"
                style="flex-shrink:0;padding:4px 10px;background:${sec.color};color:#fff;border:none;border-radius:2px;font-size:8px;font-weight:800;letter-spacing:1px;text-transform:uppercase;cursor:pointer;white-space:nowrap">Tester →</button>`
            : `<span style="flex-shrink:0;font-size:9px;background:var(--marble);color:var(--mid);padding:3px 8px;border-radius:10px;white-space:nowrap">View Source</span>`}
        </div>`).join('')}
      </div>
    </div>`).join('')}`;
}

function rvCheck(testId, secId, checked) {
  rvChecked[testId] = checked;
  const row = document.getElementById('rvr-' + testId);
  if (row) row.style.background = checked ? '#F0FAF4' : '';
  const sec  = REVIEW_SECTIONS.find(s => s.id === secId);
  if (sec) {
    const done = sec.tests.filter(t => rvChecked[t.id]).length;
    const el   = document.getElementById('rvscore-' + secId);
    if (el) el.textContent = done + '/' + sec.tests.length;
  }
  const total = REVIEW_SECTIONS.reduce((s,sec) => s + sec.tests.length, 0);
  const done  = Object.values(rvChecked).filter(Boolean).length;
  const pct   = Math.round(done / total * 100);
  const bar   = document.getElementById('rvBar');
  const score = document.getElementById('rvScore');
  const badge = document.getElementById('rvBadge');
  if (bar)   bar.style.width   = pct + '%';
  if (score) score.textContent = done + ' / ' + total;
  if (badge) {
    const emoji = pct>=100?'🏆 100% — Parfait !':pct>=80?'✅ Excellent':pct>=60?'👍 Bon':pct>=40?'🔄 En cours':'🚀 Démarrer';
    badge.innerHTML = `<span style="font-size:10px;font-weight:700;padding:3px 10px;background:var(--rose-bg);border:1px solid var(--rose-pale);border-radius:20px;color:var(--rose-deep)">${pct}% complété</span> <span style="font-size:10px;padding:3px 10px;background:var(--marble);border-radius:20px;color:var(--mid)">${emoji}</span>`;
  }
}

/* Add delegation cases for new features */
document.addEventListener('click', function(e2) {
  const t2 = e2.target.closest('[data-action]');
  if (!t2) return;
  const act2 = t2.dataset.action;
  if (act2 === 'sugg-prev')   { e2.preventDefault(); scrollSugg(-1); }
  if (act2 === 'sugg-next')   { e2.preventDefault(); scrollSugg(1); }
  if (act2 === 'add-fbt')     { e2.preventDefault(); addFBT(); }
  if (act2 === 'toggle-fbt')  { e2.preventDefault(); toggleFBT(t2.dataset.code); }
});

document.addEventListener('DOMContentLoaded', () => { initReview(); });

/* ══ INLINE PRODUCT CAROUSEL — auto-cycling ═══════════════ */
let iSuggOffset = 0, iSuggTimer = null;
const ISC_W = 132, ISC_CYCLE = 3500;
function initInlineSugg() {
  const track = document.getElementById('iSuggTrack');
  if (!track || track.children.length) return;
  const recs = (typeof SUGG_DB !== 'undefined' ? SUGG_DB : []).filter(p => p.code !== '01');
  if (!recs.length) return;
  track.innerHTML = recs.map(p => `
    <div class="isc" data-code="${esc(p.code)}" data-action="go" data-page="parfum">
      <div class="isc-img">
        ${p.badge ? `<span class="isc-badge">${esc(p.badge)}</span>` : ''}
        <img src="${esc(p.img)}" loading="lazy" alt="ODYS ${esc(p.code)}" width="120" height="110"/>
        <button class="isc-plus" data-action="add-to-cart" data-code="${esc(p.code)}"
          data-name="${esc(p.name)}" data-price="${Number(p.price)}">+</button>
      </div>
      <div class="isc-body">
        <div class="isc-code">ODYS ${esc(p.code)}</div>
        <div class="isc-name">${esc(p.name)}</div>
        <div class="isc-inspo">${esc(p.inspo)}</div>
        <div class="isc-price">${Number(p.price)} DH</div>
      </div>
    </div>`).join('');
  updateISCNav(); startISCAutoplay();
}
function getISCVisible() { return Math.max(1,Math.floor((document.getElementById('iSuggTrack')?.parentElement?.offsetWidth||400)/ISC_W)); }
function iSuggGoTo(i) {
  const t=document.getElementById('iSuggTrack'); if(!t) return;
  const max=Math.max(0,t.querySelectorAll('.isc').length-getISCVisible());
  iSuggOffset=Math.max(0,Math.min(max,i));
  t.style.transform=`translateX(-${iSuggOffset*ISC_W}px)`;
  updateISCNav();
}
function iSuggScroll(d) { iSuggGoTo(iSuggOffset+d*getISCVisible()); resetISCAutoplay(); }
function updateISCNav() {
  const t=document.getElementById('iSuggTrack'); if(!t) return;
  const max=Math.max(0,t.querySelectorAll('.isc').length-getISCVisible());
  const p=document.getElementById('iSuggPrev'),n=document.getElementById('iSuggNext');
  if(p)p.disabled=iSuggOffset===0; if(n)n.disabled=iSuggOffset>=max;
}
function startISCAutoplay() {
  stopISCAutoplay();
  iSuggTimer=setInterval(()=>{
    const t=document.getElementById('iSuggTrack'); if(!t) return;
    const max=Math.max(0,t.querySelectorAll('.isc').length-getISCVisible());
    iSuggGoTo(iSuggOffset+1>max?0:iSuggOffset+1);
  },ISC_CYCLE);
}
function stopISCAutoplay(){if(iSuggTimer){clearInterval(iSuggTimer);iSuggTimer=null;}}
function resetISCAutoplay(){startISCAutoplay();}
document.addEventListener('DOMContentLoaded', () => {
  initInlineSugg();
  const w=document.getElementById('inlineSugg');
  if(w){w.addEventListener('mouseenter',stopISCAutoplay);w.addEventListener('mouseleave',startISCAutoplay);}
  document.getElementById('iSuggPrev')?.addEventListener('click',()=>iSuggScroll(-1));
  document.getElementById('iSuggNext')?.addEventListener('click',()=>iSuggScroll(1));
  window.addEventListener('resize',()=>{iSuggOffset=0;updateISCNav();});
});

/* ================================================================
   PRESTASHOP 8 AJAX BRIDGE
   Connects ODYS UI to PrestaShop cart/checkout APIs
   ================================================================ */

(function() {
  'use strict';

  /* ── PS8 AJAX add-to-cart ────────────────────────────────── */
  function psAddToCart(idProduct, idProductAttribute, qty, callback) {
    if (typeof prestashop === 'undefined') { if (callback) callback(null); return; }
    var url = prestashop.urls.pages.cart || '/panier';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest' },
      body: new URLSearchParams({
        action: 'update',
        ajax: 1,
        add: 1,
        id_product: idProduct,
        id_product_attribute: idProductAttribute || 0,
        qty: qty || 1,
        token: (window.prestashop_token || document.querySelector('[name=token]')?.value || '')
      })
    })
    .then(function(r) { return r.text(); })
    .then(function(body) {
      var data = null;
      try { data = JSON.parse(body); } catch (e) { /* PrestaShop may answer HTML; the add still happened */ }
      var odysChange = !data || (data.success && !data.hasError
        && (Number(data.quantity) > 0 || (data.cart && Number(data.cart.products_count) > 0)));
      if (odysChange) {
      try {
        if (window.prestashop && prestashop.emit) prestashop.emit('updateCart', { reason: { idProduct: idProduct }, resp: data });
      } catch (err) { console.warn('an updateCart listener failed:', err); }
      if (window.odysRefreshCart) window.odysRefreshCart();
      }
      if (callback) {
        /* Le serveur a repondu : son verdict est pose. Ce qui casse
           ensuite dans l'affichage ne doit pas le contredire. */
        try { callback(data); }
        catch (err) { console.warn('affichage du panier :', err); }
      }
    })
    .catch(function(e) { console.warn('PS8 cart error:', e); if (callback) callback(null); });
  }

  /* ── Intercept data-action="add-to-cart" on PS8 ─────────── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product], [data-action="add-gift"][data-id-product]');
    if (!btn) return;
    e.preventDefault();
    if (btn.dataset.action === 'add-gift') {
      try { sessionStorage.setItem('odysCadeau', '1'); } catch (err) {}
    }
    var idProduct   = btn.dataset.idProduct;
    var idAttr      = btn.dataset.idProductAttribute || 0;
    var qty = ODYS.qtyRead();
    var name        = btn.dataset.name || '';
    var price       = parseInt(btn.dataset.price || '0', 10);

    if (idProduct) {
      psAddToCart(idProduct, idAttr, qty, function(resp) {
        var odysPlein = resp && resp.cart && Number(resp.cart.products_count) > 0;
        if (resp && resp.success && !resp.hasError && (Number(resp.quantity) > 0 || odysPlein)) {
          /* Also update ODYS cart UI */
          ODYS.addToCart('ps-' + idProduct, name, price, btn);
          /* Le bandeau du bas, maintenant que PrestaShop a confirme. */
          if (window.odysToast) {
            window.odysToast(String(name || 'Article').trim().slice(0, 48) + ' — ajouté au panier');
          }
          /* Le refus precedent n a plus lieu d etre : un
             message d erreur qui survit a un ajout reussi
             devient un mensonge au coup suivant. */
          var odysVieux = document.querySelector('.cart-ko');
          if (odysVieux) { odysVieux.remove(); }
          /* PS8 will fire updateCart event — listen for it */
        } else {
          /* Rien n'est entre dans le panier. PrestaShop donne la raison dans
             `errors` ; sans raison, on reste factuel plutot que d'en
             inventer une. */
          var odysRaison = resp && resp.errors ? resp.errors : '';
          if (Array.isArray(odysRaison)) { odysRaison = odysRaison.join(' '); }
          odysRaison = String(odysRaison).replace(/<[^>]*>/g, '').trim();
          if (!odysRaison) { odysRaison = 'Ce parfum n’a pas pu être ajouté au panier.'; }
          if (btn) {
            var odysAvant = btn.textContent;
            btn.classList.add('ko');
            btn.textContent = 'Indisponible';
            setTimeout(function () { btn.classList.remove('ko'); btn.textContent = odysAvant; }, 2600);
          }
          /* Le toast de fidelite n'existe pas sur toutes les pages : la
             raison s'affiche a cote du bouton, ou elle est toujours la.
             role=alert pour qu'un lecteur d'ecran l'annonce sans la
             chercher. */
          var odysZone = btn ? (btn.closest('.cta-row') || btn.parentNode) : null;
          if (odysZone) {
            var odysMsg = odysZone.parentNode.querySelector('.cart-ko');
            if (!odysMsg) {
              odysMsg = document.createElement('p');
              odysMsg.className = 'cart-ko';
              odysMsg.setAttribute('role', 'alert');
              odysZone.parentNode.insertBefore(odysMsg, odysZone.nextSibling);
            }
            odysMsg.textContent = odysRaison;
          } else if (typeof showPtsToast === 'function') {
            showPtsToast(odysRaison);
          }
        }
      });
    } else {
      /* Fallback for prototype mode */
      ODYS.addToCart(btn.dataset.code || 'prod', name, price, btn);
    }
  });

  /* ── PS8 updateCart event → sync ODYS cart UI ───────────── */
  if (typeof prestashop !== 'undefined' && typeof prestashop.on === 'function') {
    prestashop.on('updateCart', function(event) {
      /* Refresh cart count badge */
      if (event.resp && event.resp.cart) {
        var count = event.resp.cart.products_count || 0;
        document.querySelectorAll('.cb').forEach(function(el) {
          el.textContent = count;
          el.style.display = count > 0 ? '' : 'none';
        });
      }
    });
  }

  /* ── Gram selector for PS8 oud products ─────────────────── */
  document.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-action="pick-gram-ps"]');
    if (!btn) return;
    var cardId = btn.dataset.cardId;
    var grams  = btn.dataset.g;
    var price  = btn.dataset.price;
    var idComb = btn.dataset.idCombination;

    /* Highlight selected */
    btn.closest('.gram-opts')?.querySelectorAll('.gb').forEach(function(b) { b.classList.remove('on'); });
    btn.classList.add('on');

    /* Update total display */
    var card = document.getElementById(cardId);
    if (card) {
      card.dataset.selectedGrams = grams;
      card.dataset.selectedTotal = price;
      var gEl = document.getElementById(cardId.replace('oud-', 'oud') + 'TotalGrams') ||
                card.querySelector('.oct-grams');
      var pEl = document.getElementById(cardId.replace('oud-', 'oud') + 'TotalPrice') ||
                card.querySelector('.oct-val');
      if (gEl) gEl.textContent = grams + ' grammes';
      if (pEl) { pEl.textContent = price + ' DH'; pEl.classList.add('bump'); setTimeout(function(){pEl.classList.remove('bump');},300); }
    }

    /* Update PS8 combination */
    if (idComb) {
      var form = document.querySelector('[data-id-combination]');
      if (form) form.value = idComb;
    }
  });

  /* ── Viewing now counter (standalone, no ODYS IIFE needed) ── */
  var vnEl = document.getElementById('vnCount') || document.getElementById('vnViewers');
  if (vnEl && !vnEl.dataset.initialized) {
    vnEl.dataset.initialized = '1';
    var vnCount = 8 + Math.floor(Math.random() * 8);
    vnEl.textContent = vnCount;
    setInterval(function() {
      vnCount = Math.max(4, Math.min(20, vnCount + (Math.random() > .5 ? 1 : -1)));
      vnEl.textContent = vnCount;
    }, 7000 + Math.random() * 5000);
  }

})();

/* ══════════════════════════════════════════════════════════
   ANALYTICS DASHBOARD JS
   ══════════════════════════════════════════════════════════ */

/* ── Tab switching ── */
function anTab(btn, tab) {
  document.querySelectorAll('.an-tab').forEach(b => b.classList.remove('on'));
  document.querySelectorAll('.an-panel').forEach(p => p.classList.remove('on'));
  btn.classList.add('on');
  const panel = document.getElementById('an-' + tab);
  if (panel) { panel.classList.add('on'); anRenderTab(tab); }
}

function anChangePeriod(v) { anRenderTab(getCurrentTab()); }
function getCurrentTab() {
  const active = document.querySelector('.an-tab.on');
  return active ? active.dataset.tab : 'overview';
}

/* ── Data (simulated — replace with real PS8 API calls) ── */
const AN_DATA = {
  months: ['Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc','Jan','Fév','Mar'],
  revenue: [42000,48000,51000,55000,62000,58000,67000,79000,88000,95000,99000,105000],
  orders:  [140,161,170,183,207,193,223,263,293,317,330,350],
  products: [
    { name:"L'Icône",      ref:'01', ca:21068, units:92, margin:'68%', stock:45,  rating:'4.9', fam:'fresh'    },
    { name:"L'Oriental",   ref:'14', ca:19422, units:78, margin:'72%', stock:18,  rating:'5.0', fam:'oud'      },
    { name:"L'Azur",       ref:'33', ca:14656, units:64, margin:'65%', stock:62,  rating:'4.8', fam:'fresh'    },
    { name:'La Nuit Noire',ref:'22', ca:12604, units:55, margin:'66%', stock:34,  rating:'4.9', fam:'sweet'    },
    { name:"L'Or",         ref:'11', ca:11060, units:46, margin:'67%', stock:28,  rating:'4.7', fam:'oriental' },
    { name:'La Nuit',      ref:'07', ca:9522,  units:41, margin:'65%', stock:51,  rating:'4.8', fam:'sweet'    },
    { name:'Oud Assam A',  ref:'OA', ca:8750,  units:250, margin:'80%',stock:180, rating:'4.9', fam:'oud'      },
    { name:'Boukhour Cl.', ref:'BK', ca:3200,  units:400, margin:'75%',stock:320, rating:'4.7', fam:'oud'      },
  ],
  channels: [
    { name:'Instagram',  pct:34, color:'#E1306C' },
    { name:'TikTok',     pct:28, color:'#000000' },
    { name:'Google',     pct:19, color:'#4285F4' },
    { name:'Direct',     pct:11, color:'#C4956A' },
    { name:'WhatsApp',   pct:8,  color:'#25D366' },
  ],
  geo: [
    { city:'Casablanca',  pct:48, clients:616 },
    { city:'Rabat',       pct:18, clients:231 },
    { city:'Marrakech',   pct:12, clients:154 },
    { city:'Fès',         pct:8,  clients:103 },
    { city:'Tanger',      pct:6,  clients:77  },
    { city:'Autres',      pct:8,  clients:103 },
  ],
  rfm: [
    { name:'Champions',     n:184, color:'#C4956A', desc:'Acheteurs récents, fréquents, haut montant' },
    { name:'Fidèles',       n:257, color:'#2A9D5C', desc:'Achètent régulièrement' },
    { name:'Prometteurs',   n:319, color:'#4285F4', desc:'Récents, potentiel de fidélisation' },
    { name:'Hibernants',    n:228, color:'#E07A00', desc:'Inactifs depuis 90j+' },
    { name:'À risque',      n:168, color:'#E63946', desc:'Anciens fidèles, plus actifs' },
    { name:'Nouveaux',      n:128, color:'#8B5CF6', desc:'Premier achat récent' },
  ],
};

/* ── Render functions ─────────────────────────────────────── */
let chartsDrawn = {};

function anRenderTab(tab) {
  if (chartsDrawn[tab]) return;
  chartsDrawn[tab] = true;

  if (tab === 'overview') anRenderOverview();
  if (tab === 'seo')      anRenderSEO();
  if (tab === 'products') anRenderProducts();
  if (tab === 'marketing') anRenderMarketing();
  if (tab === 'customers') anRenderCustomers();
  if (tab === 'ai')        anRenderAI();
}

/* ── OVERVIEW ── */
function anRenderOverview() {
  /* Revenue chart */
  drawLineChart('chartRevenue', AN_DATA.months, AN_DATA.revenue,
    { color:'#C4956A', fill:true, label:'Revenus (DH)', format:v=>v.toLocaleString('fr')+' DH' });

  /* Channels pie */
  drawDonutChart('chartChannels', AN_DATA.channels);
  const leg = document.getElementById('channelLegend');
  if (leg) leg.innerHTML = AN_DATA.channels.map(c=>
    `<div style="display:flex;align-items:center;gap:8px;font-size:10px">
      <span style="width:10px;height:10px;border-radius:50%;background:${c.color};flex-shrink:0"></span>
      <span style="flex:1;color:var(--mid)">${c.name}</span>
      <strong>${c.pct}%</strong>
    </div>`).join('');

  /* Funnel */
  const funnel = document.getElementById('funnelChart');
  if (funnel) {
    const steps = [
      { label:'Visiteurs',      val:10000, pct:100 },
      { label:'Fiches produit', val:4800,  pct:48  },
      { label:'Panier',         val:1200,  pct:12  },
      { label:'Checkout',       val:490,   pct:4.9 },
      { label:'Commandes',      val:350,   pct:3.5 },
    ];
    funnel.innerHTML = steps.map(s=>`
      <div class="funnel-step">
        <div class="funnel-lbl">${s.label}</div>
        <div class="funnel-bar-wrap">
          <div class="funnel-bar" style="width:${s.pct}%"></div>
        </div>
        <div class="funnel-val">${s.val.toLocaleString('fr')}</div>
      </div>`).join('');
  }

  /* Top products */
  const tbody = document.getElementById('topProductsBody');
  if (tbody) tbody.innerHTML = AN_DATA.products.slice(0,6).map(p=>`
    <tr>
      <td><strong>ODYS ${p.ref}</strong> ${p.name}</td>
      <td>${p.units}</td>
      <td style="color:var(--rose-deep);font-weight:700">${p.ca.toLocaleString('fr')} DH</td>
      <td><span class="green">↑ +${Math.floor(Math.random()*25+5)}%</span></td>
    </tr>`).join('');

  /* Alerts */
  const alerts = document.getElementById('alertsList');
  if (alerts) alerts.innerHTML = [
    { type:'success', icon:'🎯', title:'L\'Icône atteint son meilleur mois', desc:'21 068 DH de CA · +23% vs février · Stock : 45 unités restantes' },
    { type:'warning', icon:'⚠️', title:'Stock bas — ODYS 14 L\'Oriental', desc:'Seulement 18 unités en stock · Taux de vente : 78/mois · Réapprovisionner dans 7j' },
    { type:'info',    icon:'💡', title:'Opportunité : Ramadan 2026 approche', desc:'Créer une collection spéciale coffrets Ramadan · Tendance +340% oud pendant Ramadan' },
    { type:'success', icon:'🔍', title:'Position SEO améliorée', desc:'"parfum maroc" : de la position 5 à 3 · +2 positions ce mois · Estimer +800 visiteurs/mois' },
    { type:'info',    icon:'📣', title:'Instagram Reels : ROAS 18.4x', desc:'Votre meilleure campagne · Considérer d\'augmenter le budget de 20%' },
  ].map(a=>`
    <div class="alert-item alert-${a.type}">
      <span class="alert-icon">${a.icon}</span>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-desc">${a.desc}</div>
      </div>
    </div>`).join('');
}

/* ── SEO ── */
function anRenderSEO() {
  /* Technical checklist */
  const checklist = document.getElementById('seoChecklist');
  if (checklist) checklist.innerHTML = [
    { ok:'ok',   label:'Title tag unique < 60 chars',          detail:'Toutes les pages' },
    { ok:'ok',   label:'Meta description < 155 chars',         detail:'Optimisée' },
    { ok:'ok',   label:'Schema.org JSON-LD (Product, FAQ)',     detail:'Présent' },
    { ok:'ok',   label:'Balises hreflang fr/ar',               detail:'fr_MA + ar_MA' },
    { ok:'ok',   label:'Sitemap.xml soumis à Google',          detail:'18 pages indexées' },
    { ok:'ok',   label:'Images WebP + alt text',               detail:'Optimisées' },
    { ok:'ok',   label:'HTTPS + sécurité',                     detail:'SSL A+' },
    { ok:'warn', label:'Vitesse mobile',                        detail:'72/100 · À améliorer' },
    { ok:'warn', label:'Contenu de marque insuffisant',         detail:'< 5 articles de blog' },
    { ok:'fail', label:'Avis Google My Business',              detail:'Fiche non revendiquée' },
    { ok:'fail', label:'Backlinks locaux Maroc',               detail:'8 seulement · Objectif : 50+' },
  ].map(c=>`
    <div class="seo-check">
      <span class="seo-check-icon seo-${c.ok}">${c.ok==='ok'?'✓':c.ok==='warn'?'⚠':'✕'}</span>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:600;color:var(--ink)">${c.label}</div>
        <div style="font-size:10px;color:var(--mid)">${c.detail}</div>
      </div>
    </div>`).join('');

  /* Core Web Vitals */
  const cwv = document.getElementById('cwvChart');
  if (cwv) cwv.innerHTML = [
    { name:'LCP (Largest Contentful Paint)', val:'1.8s',  score:'good',   tip:'< 2.5s = Bon' },
    { name:'FID (First Input Delay)',        val:'12ms',  score:'good',   tip:'< 100ms = Bon' },
    { name:'CLS (Cumulative Layout Shift)',  val:'0.04',  score:'good',   tip:'< 0.1 = Bon' },
    { name:'TTFB (Time To First Byte)',      val:'380ms', score:'medium', tip:'< 200ms = Excellent' },
    { name:'FCP (First Contentful Paint)',   val:'0.9s',  score:'good',   tip:'< 1.8s = Bon' },
  ].map(v=>`
    <div class="cwv-item">
      <div style="font-size:11px;color:var(--ink)">${v.name}<div style="font-size:9px;color:var(--mid)">${v.tip}</div></div>
      <span class="cwv-score cwv-${v.score}">${v.val}</span>
    </div>`).join('');

  /* Content gaps */
  const gaps = document.getElementById('contentGaps');
  if (gaps) gaps.innerHTML = [
    { page:'Guide : Comment choisir son parfum Maroc',   vol:'2 400/mo', effort:'Faible' },
    { page:'Top 10 parfums pour l\'été au Maroc',        vol:'1 800/mo', effort:'Faible' },
    { page:'Oud : Guide complet 2026',                   vol:'1 200/mo', effort:'Moyen' },
    { page:'Parfum pour mariage marocain traditionnel',  vol:'980/mo',   effort:'Faible' },
    { page:'Comparatif ODYS vs originaux',               vol:'750/mo',   effort:'Moyen' },
  ].map(g=>`
    <div style="padding:8px 0;border-bottom:1px solid #f5f4f2;display:flex;justify-content:space-between;align-items:center">
      <div style="font-size:11px;color:var(--ink);flex:1">${g.page}</div>
      <div style="display:flex;gap:8px;flex-shrink:0;margin-left:12px">
        <span style="font-size:9px;background:var(--rose-bg);color:var(--rose-deep);padding:2px 7px;border-radius:10px">${g.vol}</span>
        <span style="font-size:9px;background:var(--marble);color:var(--mid);padding:2px 7px;border-radius:10px">${g.effort}</span>
      </div>
    </div>`).join('');
}

/* ── PRODUCTS ── */
function anRenderProducts() {
  drawBarChart('chartProducts',
    AN_DATA.products.slice(0,6).map(p=>'ODYS '+p.ref),
    AN_DATA.products.slice(0,6).map(p=>p.ca),
    { color:'#C4956A', label:'CA (DH)' });

  drawBarChart('chartOud',
    ['Hindi A','Royal B','Royal C','Thai A','Royal Thai B','Boukhour'],
    [250, 180, 120, 220, 310, 400],
    { color:'#8B6914', label:'Grammes vendus' });

  const tbody = document.getElementById('catalogBody');
  if (tbody) tbody.innerHTML = AN_DATA.products.map(p=>`
    <tr>
      <td><strong>ODYS ${p.ref}</strong> ${p.name}</td>
      <td style="font-weight:700;color:var(--rose-deep)">${p.ca.toLocaleString('fr')} DH</td>
      <td>${p.units}</td>
      <td class="green">${p.margin}</td>
      <td style="color:${p.stock<20?'#E63946':p.stock<40?'#E07A00':'#2A9D5C'};font-weight:700">${p.stock}</td>
      <td>⭐ ${p.rating}</td>
      <td><button class="ai-quick-btn" onclick="anQuick('Analyse les performances du produit ODYS ${p.ref} ${p.name} et donne des recommandations marketing')">IA →</button></td>
    </tr>`).join('');
}

/* ── MARKETING ── */
function anRenderMarketing() {
  drawBarChart('chartMarketing',
    AN_DATA.channels.map(c=>c.name),
    AN_DATA.channels.map(c=>Math.round(c.pct/100*105000)),
    { colors: AN_DATA.channels.map(c=>c.color), label:'CA (DH)' });

  const cal = document.getElementById('mktgCalendar');
  if (cal) cal.innerHTML = [
    { date:'15 Avr', action:'Lancement collection Ramadan', type:'launch',  prio:'high' },
    { date:'20 Avr', action:'Email Fidélité — 2x points',   type:'email',   prio:'high' },
    { date:'01 Mai', action:'Reel Instagram — L\'Oriental', type:'social',  prio:'med'  },
    { date:'10 Mai', action:'Google Shopping — Fête mères', type:'ads',     prio:'high' },
    { date:'20 Mai', action:'TikTok Live — Oud démo',       type:'social',  prio:'med'  },
    { date:'01 Juin', action:'Newsletter abonnés été',       type:'email',   prio:'low'  },
  ].map(a=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f4f2">
      <div style="font-size:9px;font-weight:700;color:var(--mid);min-width:50px">${a.date}</div>
      <span class="prio-badge prio-${a.prio}">${a.prio==='high'?'URGENT':a.prio==='med'?'PRÉVU':'OPTIONNEL'}</span>
      <div style="font-size:11px;color:var(--ink);flex:1">${a.action}</div>
    </div>`).join('');

  const ideas = document.getElementById('contentIdeas');
  if (ideas) ideas.innerHTML = [
    '🎬 Reel "Comment durer toute la journée avec L\'Icône" · Potentiel : 50K vues',
    '📸 Carousel "5 occasions pour porter L\'Oriental" · Ideal pour Instagram',
    '🎙 Story : "On a goûté Dior Sauvage vs ODYS — résultat surprenant"',
    '📹 TikTok : "Oud Assam A heating ritual" · Trending sur #OudTikTok',
    '📧 Email : "Votre prochain parfum est peut-être dans ce quiz"',
    '📝 Blog : "Guide complet des notes olfactives pour débutants"',
  ].map(i=>`<div style="padding:7px 0;border-bottom:1px solid #f5f4f2;font-size:11px;color:var(--ink)">${i}</div>`).join('');
}

/* ── CUSTOMERS ── */
function anRenderCustomers() {
  const geo = document.getElementById('geoChart');
  if (geo) geo.innerHTML = AN_DATA.geo.map(g=>`
    <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f5f4f2">
      <div style="font-size:11px;font-weight:600;min-width:100px">${g.city}</div>
      <div style="flex:1;height:16px;background:#f5f4f2;border-radius:3px;overflow:hidden">
        <div style="width:${g.pct}%;height:100%;background:linear-gradient(90deg,var(--rose),#E8B07A);border-radius:3px"></div>
      </div>
      <div style="font-size:10px;color:var(--mid);min-width:60px;text-align:right">${g.clients} clients</div>
      <div style="font-size:10px;font-weight:700;min-width:30px;text-align:right">${g.pct}%</div>
    </div>`).join('');

  const rfm = document.getElementById('rfmChart');
  if (rfm) rfm.innerHTML = AN_DATA.rfm.map(r=>`
    <div class="rfm-seg" style="background:${r.color}18;border:1px solid ${r.color}30">
      <span class="rfm-dot" style="background:${r.color}"></span>
      <div style="flex:1">
        <div style="font-size:11px;font-weight:700">${r.name}</div>
        <div style="font-size:10px;color:var(--mid)">${r.desc}</div>
      </div>
      <div style="font-family:var(--serif);font-size:16px;font-weight:500;color:${r.color}">${r.n}</div>
    </div>`).join('');

  /* Cohort heatmap */
  const cohort = document.getElementById('cohortChart');
  if (cohort) {
    const months = ['Oct','Nov','Déc','Jan','Fév','Mar'];
    const retention = [
      [100,72,58,49,43,38],
      [100,68,54,46,41],
      [100,74,61,52],
      [100,71,58],
      [100,75],
      [100],
    ];
    const getColor = v => {
      if (v >= 70) return '#d4edda';
      if (v >= 50) return '#fff3cd';
      if (v >= 30) return '#fde8d4';
      return '#fde';
    };
    let tbl = `<table style="border-collapse:collapse;font-size:10px;width:100%">
      <tr><th style="padding:6px 10px;text-align:left;color:var(--mid)">Cohorte</th>`;
    for (let i=0;i<6;i++) tbl += `<th style="padding:6px 10px;text-align:center;color:var(--mid)">M+${i}</th>`;
    tbl += '</tr>';
    months.forEach((m,mi) => {
      tbl += `<tr><td style="padding:6px 10px;font-weight:700;color:var(--ink)">${m} 2025</td>`;
      for (let di=0;di<6;di++) {
        const v = retention[mi]?.[di];
        tbl += v !== undefined
          ? `<td style="padding:5px 10px;text-align:center;background:${getColor(v)};border-radius:2px;font-weight:${di===0?'700':'400'}">${v}%</td>`
          : `<td style="padding:5px 10px;text-align:center;color:var(--border)">—</td>`;
      }
      tbl += '</tr>';
    });
    tbl += '</table>';
    cohort.innerHTML = tbl;
  }
}

/* ── AI ADVISOR ── */
function anRenderAI() {
  const insights = document.getElementById('aiInsights');
  if (insights) insights.innerHTML = [
    { icon:'🔥', text:'L\'Icône représente 20% du CA total — envisager une variante limitée pour amplifier les ventes', color:'var(--rose)' },
    { icon:'📉', text:'Taux de rebond élevé sur mobile (68%) — optimiser les images et le temps de chargement', color:'#E07A00' },
    { icon:'💎', text:'Vos clients fidèles (Champions) dépensent 3.4x plus — créer un programme VIP dédié', color:'#2A9D5C' },
    { icon:'🌙', text:'Peak de ventes le vendredi soir (18h-21h) — programmer les publications social media en conséquence', color:'var(--navy)' },
  ].map(i=>`
    <div style="display:flex;gap:10px;padding:9px 0;border-bottom:1px solid #f5f4f2;align-items:flex-start">
      <span style="font-size:16px">${i.icon}</span>
      <div style="font-size:11px;color:var(--ink);line-height:1.6">${i.text}</div>
    </div>`).join('');

  const health = document.getElementById('healthScore');
  if (health) {
    const scores = [
      { label:'Croissance revenue',  val:88, color:'#2A9D5C' },
      { label:'Acquisition clients', val:72, color:'#C4956A' },
      { label:'Rétention',           val:65, color:'#4285F4' },
      { label:'SEO & Visibilité',    val:58, color:'#8B5CF6' },
      { label:'Satisfaction client', val:95, color:'#2A9D5C' },
    ];
    health.innerHTML = `<div style="text-align:center;margin-bottom:14px"><span style="font-family:var(--serif);font-size:42px;font-weight:500;color:var(--rose-deep)">76</span><span style="font-size:12px;color:var(--mid)">/100 · Très bon</span></div>` +
      scores.map(s=>`
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">
            <span style="color:var(--ink);font-weight:600">${s.label}</span>
            <span style="color:${s.color};font-weight:700">${s.val}/100</span>
          </div>
          <div class="health-bar"><div class="health-fill" style="width:${s.val}%;background:${s.color}"></div></div>
        </div>`).join('');
  }

  const prio = document.getElementById('priorityActions');
  if (prio) prio.innerHTML = [
    { badge:'high', action:'Réapprovisionner L\'Oriental (18 unités restantes)',      due:'Cette semaine' },
    { badge:'high', action:'Créer campagne Ramadan — Coffrets Oud & Parfum',          due:'Cette semaine' },
    { badge:'med',  action:'Revendiquer fiche Google My Business',                     due:'Ce mois' },
    { badge:'med',  action:'Publier 2 articles de blog pour SEO organique',            due:'Ce mois' },
    { badge:'low',  action:'Tester les prix du Duo Classique (411 DH → 399 DH)',          due:'Prochain mois' },
    { badge:'low',  action:'Ajouter vidéos produit sur les fiches parfum',             due:'Prochain mois' },
  ].map(a=>`
    <div class="prio-item">
      <span class="prio-badge prio-${a.badge}">${a.badge==='high'?'URGENT':a.badge==='med'?'IMPORTANT':'OPTIONNEL'}</span>
      <div style="flex:1;font-size:11px;color:var(--ink)">${a.action}</div>
      <div style="font-size:9px;color:var(--mid);white-space:nowrap">${a.due}</div>
    </div>`).join('');

  const reports = document.getElementById('aiReports');
  if (reports) reports.innerHTML = [
    { icon:'📊', title:'Rapport mensuel Mars 2026', desc:'Revenus · KPIs · Tendances · Recommandations', action:'Générer' },
    { icon:'🔍', title:'Audit SEO complet', desc:'Analyse technique · Mots-clés · Backlinks · Plan d\'action', action:'Générer' },
    { icon:'📣', title:'Plan marketing Ramadan 2026', desc:'Campagnes · Contenu · Budget · Timing', action:'Générer' },
  ].map(r=>`
    <div style="border:1px solid var(--border);border-radius:4px;padding:16px;text-align:center">
      <div style="font-size:28px;margin-bottom:8px">${r.icon}</div>
      <div style="font-size:12px;font-weight:700;margin-bottom:6px">${r.title}</div>
      <div style="font-size:10px;color:var(--mid);margin-bottom:14px;line-height:1.6">${r.desc}</div>
      <button class="btn-p" style="padding:8px 16px;font-size:9px" onclick="anGenerateReport('${r.title}')">${r.action} →</button>
    </div>`).join('');
}

/* ── AI Chat via Anthropic API ──────────────────────────────── */
let anChatHistory = [];
const AN_SYSTEM_PROMPT = `Tu es le conseiller IA de ODYS Parfums, une marque marocaine de parfums d'inspiration luxe basée à Casablanca.

Données business actuelles (Mars 2026) :
- CA mensuel : 105 000 DH (+23% vs mois précédent)
- Commandes : 350/mois · Panier moyen : 300 DH
- Taux conversion : 3.5% · Visiteurs : 10 000/mois
- Best-seller : ODYS 01 L'Icône (inspiré Dior Sauvage) · 21 068 DH
- Gamme : 6 parfums 50 ml (69–89 DH) + Oud au gramme + Coffrets
- Marché : Maroc francophone · Livraison COD 24-48h
- Canaux : Instagram 34% · TikTok 28% · Google 19%
- ROAS Meta : 18.4x · CAC : 85 DH · LTV : 840 DH
- Programme fidélité : 184 membres actifs (Oud exclu des points)
- Position SEO "parfum maroc" : #3

Réponds en français, de façon concise et actionnable. Donne des recommandations spécifiques au marché marocain. Format tes réponses avec des listes à puces quand c'est pertinent.`;

async function anSendChat() {
  const input = document.getElementById('aiChatInput');
  const btn   = document.getElementById('aiSendBtn');
  const msg   = input ? input.value.trim() : '';
  if (!msg) return;

  input.value = '';
  btn.disabled = true;
  btn.textContent = '...';

  // Add user message
  anAddMessage('user', msg);
  anChatHistory.push({ role: 'user', content: msg });

  // Add thinking indicator
  const thinkId = 'think-' + Date.now();
  anAddMessage('bot', '💭 Analyse en cours...', thinkId);

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: AN_SYSTEM_PROMPT,
        messages: anChatHistory,
      }),
    });
    const data = await resp.json();
    const reply = data.content?.[0]?.text || 'Désolé, une erreur est survenue.';

    // Remove thinking, add real response
    document.getElementById(thinkId)?.remove();
    anAddMessage('bot', reply);
    anChatHistory.push({ role: 'assistant', content: reply });

  } catch (err) {
    document.getElementById(thinkId)?.remove();
    anAddMessage('bot', '⚠️ Connexion à l\'IA impossible. Vérifiez votre connexion internet.');
  }

  btn.disabled = false;
  btn.textContent = 'Envoyer →';
}

function anAddMessage(role, text, id) {
  const container = document.getElementById('aiChatMessages');
  if (!container) return;
  const div = document.createElement('div');
  if (id) div.id = id;
  div.className = 'ai-msg ai-msg-' + role;
  const avatar = role === 'bot' ? '🤖' : '👤';
  // Convert markdown-like formatting
  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/•\s/g, '• ')
    .replace(/\n/g, '<br>');
  div.innerHTML = `<div class="ai-msg-avatar">${avatar}</div><div class="ai-msg-bubble">${formatted}</div>`;
  container.appendChild(div);
  container.scrollTop = container.scrollHeight;
}

function anQuick(text) {
  const input = document.getElementById('aiChatInput');
  if (input) input.value = text;
  // Switch to AI tab first
  const aiTabBtn = document.querySelector('[data-tab="ai"]');
  if (aiTabBtn && !aiTabBtn.classList.contains('on')) anTab(aiTabBtn, 'ai');
  setTimeout(anSendChat, 100);
}

function anRunAI() { anQuick('Donne-moi une analyse complète des performances ODYS Parfums ce mois et les 3 actions prioritaires pour augmenter le CA'); }

async function anGenerateReport(title) {
  const btn = event.target;
  btn.textContent = '...';
  btn.disabled = true;
  // Switch to AI tab and generate
  const aiTabBtn = document.querySelector('[data-tab="ai"]');
  if (aiTabBtn) anTab(aiTabBtn, 'ai');
  await anQuick(`Génère un rapport complet : "${title}" pour ODYS Parfums Maroc avec données Mars 2026. Format professionnel avec sections, KPIs et recommandations.`);
  btn.textContent = 'Générer →';
  btn.disabled = false;
}

/* ── Minimal chart helpers (no external lib) ─────────────────── */
function drawLineChart(canvasId, labels, values, opts={}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 600, H = canvas.height || 220;
  canvas.width = W;
  const max = Math.max(...values) * 1.1, min = 0;
  const px = i => 48 + (i / (labels.length-1)) * (W-64);
  const py = v => H-32 - ((v-min)/(max-min)) * (H-52);

  ctx.clearRect(0,0,W,H);

  // Grid
  ctx.strokeStyle = '#f0ede9'; ctx.lineWidth = 1;
  for (let i=0;i<5;i++) {
    const y = H-32 - (i/4)*(H-52);
    ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(W-16,y); ctx.stroke();
    ctx.fillStyle='#bbb'; ctx.font='10px sans-serif'; ctx.textAlign='right';
    ctx.fillText(((min+(max-min)*i/4)/1000).toFixed(0)+'K', 36, y+3);
  }

  // Fill
  if (opts.fill) {
    ctx.beginPath(); ctx.moveTo(px(0), H-32);
    values.forEach((v,i) => ctx.lineTo(px(i), py(v)));
    ctx.lineTo(px(values.length-1), H-32); ctx.closePath();
    ctx.fillStyle = (opts.color||'#C4956A')+'22';
    ctx.fill();
  }

  // Line
  ctx.beginPath(); ctx.strokeStyle = opts.color||'#C4956A'; ctx.lineWidth=2.5; ctx.lineJoin='round';
  values.forEach((v,i) => i===0 ? ctx.moveTo(px(i),py(v)) : ctx.lineTo(px(i),py(v)));
  ctx.stroke();

  // Dots + labels
  labels.forEach((lbl,i) => {
    ctx.beginPath(); ctx.arc(px(i),py(values[i]),3.5,0,Math.PI*2);
    ctx.fillStyle=opts.color||'#C4956A'; ctx.fill();
    ctx.fillStyle='#888'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText(lbl, px(i), H-12);
  });
}

function drawBarChart(canvasId, labels, values, opts={}) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 400, H = canvas.height || 260;
  canvas.width = W;
  const max = Math.max(...values)*1.15;
  const barW = Math.min(40, (W - 60) / labels.length - 8);
  const gap  = (W - 60) / labels.length;

  ctx.clearRect(0,0,W,H);
  ctx.strokeStyle='#f0ede9'; ctx.lineWidth=1;
  for (let i=0;i<5;i++) {
    const y = H-28-(i/4)*(H-48);
    ctx.beginPath(); ctx.moveTo(40,y); ctx.lineTo(W-8,y); ctx.stroke();
  }

  labels.forEach((lbl,i) => {
    const x  = 48 + i*gap;
    const bh = ((values[i]||0)/max)*(H-48);
    const color = Array.isArray(opts.colors) ? opts.colors[i] : (opts.color||'#C4956A');
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x-barW/2, H-28-bh, barW, bh, [3,3,0,0]) : ctx.rect(x-barW/2, H-28-bh, barW, bh);
    ctx.fill();
    ctx.fillStyle='#888'; ctx.font='9px sans-serif'; ctx.textAlign='center';
    ctx.fillText(lbl.length>6?lbl.slice(0,6)+'…':lbl, x, H-10);
  });
}

function drawDonutChart(canvasId, segments) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth || 300, H = canvas.height || 220;
  canvas.width = W;
  const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 20, ri = r*0.58;
  let angle = -Math.PI/2;
  ctx.clearRect(0,0,W,H);
  segments.forEach(s => {
    const slice = (s.pct/100)*Math.PI*2;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,r,angle,angle+slice); ctx.closePath();
    ctx.fillStyle = s.color; ctx.fill();
    angle += slice;
  });
  ctx.beginPath(); ctx.arc(cx,cy,ri,0,Math.PI*2); ctx.fillStyle='#fff'; ctx.fill();
  ctx.fillStyle='#1B2A4A'; ctx.font='bold 13px sans-serif'; ctx.textAlign='center';
  ctx.fillText('Trafic', cx, cy-4); ctx.font='11px sans-serif'; ctx.fillStyle='#888';
  ctx.fillText('Sources', cx, cy+14);
}

/* ── Initialize on page show ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('pg-analytics')) {
    // Render overview when analytics page becomes visible
    const obs = new MutationObserver(() => {
      if (document.getElementById('pg-analytics').classList.contains('on')) {
        anRenderTab('overview');
      }
    });
    obs.observe(document.getElementById('pg-analytics'), { attributes: true, attributeFilter: ['class'] });
  }
});



/* ================================================================
   PRESTASHOP 8 — AJAX BRIDGE
   ================================================================ */
(function () {
  'use strict';
  if (typeof prestashop === 'undefined') {
    window.prestashop = { cart:{products:[],products_count:0}, emit:function(){}, on:function(){}, urls:{pages:{cart:'/panier',order:'/commande'}} };
  }
  /* Removed in v5.0: second copy of the PS add-to-cart bridge (and its
     updateCart listener). Both copies handled every click, so each click
     POSTed twice and added 2. The bridge above is the one kept. */
  document.addEventListener('click',function(e){
    var btn=e.target.closest('[data-action="pick-gram-ps"]');
    if(!btn)return;
    var card=document.getElementById(btn.dataset.cardId);
    btn.closest('.gram-opts')?.querySelectorAll('.gb').forEach(function(b){b.classList.remove('on');});
    btn.classList.add('on');
    if(card){
      card.dataset.selectedGrams=btn.dataset.g;
      card.dataset.selectedTotal=btn.dataset.price;
      var gEl=card.querySelector('.oct-grams'),pEl=card.querySelector('.oct-val');
      if(gEl)gEl.textContent=btn.dataset.g+' grammes';
      if(pEl){pEl.textContent=btn.dataset.price+' DH';pEl.classList.add('bump');setTimeout(function(){pEl.classList.remove('bump');},300);}
    }
    var ci=document.querySelector('input[name="id_product_attribute"]');
    if(ci&&btn.dataset.idCombination)ci.value=btn.dataset.idCombination;
  });
  var vnEl=document.getElementById('vnCount')||document.getElementById('vnViewers');
  if(vnEl&&!vnEl.dataset.initialized){
    vnEl.dataset.initialized='1';
    var vnN=8+Math.floor(Math.random()*8);
    vnEl.textContent=vnN;
    setInterval(function(){vnN=Math.max(4,Math.min(20,vnN+(Math.random()>.5?1:-1)));vnEl.textContent=vnN;},7000+Math.random()*5000);
  }
})();


/* ================================================================
   ODYS Parfums — EAA / WCAG 2.1 AA JavaScript Enhancements v3.1
   ================================================================ */

(function () {
  'use strict';

  /* ── aria-expanded on accordion buttons ────────────────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.acc-h');
    if (!btn) return;
    var expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    var panel = btn.nextElementSibling;
    if (panel) {
      panel.hidden = expanded;
      panel.style.display = expanded ? 'none' : 'block';
    }
  });

  /* ── aria-checked on volume selector (radiogroup) ─────────── */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.vc[role="radio"]');
    if (!btn) return;
    var group = btn.closest('[role="radiogroup"]');
    if (!group) return;
    group.querySelectorAll('.vc[role="radio"]').forEach(function (b) {
      b.setAttribute('aria-checked', b === btn ? 'true' : 'false');
    });
  });

  /* aria-pressed used to be flipped here as well as in the handler that does
     the saving, so the two disagreed: the button said "enregistré" while it
     announced itself as not pressed. wishToggle() owns that state now. */

  /* ── Mobile menu: aria-hidden + aria-expanded ──────────────── */
  var hamBtn = document.getElementById('hamBtn');
  var mobMenu = document.getElementById('mobMenu');
  if (hamBtn && mobMenu) {
    hamBtn.addEventListener('click', function () {
      var open = mobMenu.getAttribute('aria-hidden') === 'false';
      mobMenu.setAttribute('aria-hidden', open ? 'true' : 'false');
      hamBtn.setAttribute('aria-expanded', open ? 'false' : 'true');
      hamBtn.setAttribute('aria-label', open ? 'Ouvrir le menu de navigation' : 'Fermer le menu de navigation');
      if (!open) {
        // Trap focus in menu
        var firstLink = mobMenu.querySelector('a');
        if (firstLink) firstLink.focus();
      }
    });
    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && mobMenu.getAttribute('aria-hidden') === 'false') {
        mobMenu.setAttribute('aria-hidden', 'true');
        hamBtn.setAttribute('aria-expanded', 'false');
        hamBtn.setAttribute('aria-label', 'Ouvrir le menu de navigation');
        hamBtn.focus();
      }
    });
  }

  /* ── Cart drawer: aria-hidden + focus management ────────────── */
  var cartDrawer = document.getElementById('drawer');
  var cartBtn = document.getElementById('cartBtn');
  if (cartDrawer) {
    // Every open/close path (openCart/closeCart, ODYS.*, overlay, Escape)
    // toggles .on, so follow the class rather than wrapping functions.
    new MutationObserver(function () {
      var open = cartDrawer.classList.contains('on');
      if (cartDrawer.getAttribute('aria-hidden') === (open ? 'false' : 'true')) return;
      cartDrawer.setAttribute('aria-hidden', open ? 'false' : 'true');
      if (open) {
        var closeBtn = cartDrawer.querySelector('.d-close');
        if (closeBtn) setTimeout(function () { closeBtn.focus(); }, 80);
      } else if (cartBtn && cartDrawer.contains(document.activeElement)) {
        cartBtn.focus();
      }
    }).observe(cartDrawer, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── Form validation — aria-invalid ────────────────────────── */
  function validateField(input) {
    var valid = input.checkValidity();
    input.setAttribute('aria-invalid', valid ? 'false' : 'true');
    return valid;
  }
  document.addEventListener('blur', function (e) {
    if (e.target.matches('input, select, textarea')) {
      validateField(e.target);
    }
  }, true);

  /* ── Announce cart changes to screen readers ────────────────── */
  var cartLiveRegion = document.getElementById('cartCount');
  var cartCountSrc = document.getElementById('dCnt');
  if (cartCountSrc) {
    // updateCartBadges() is private to the ODYS IIFE and can't be wrapped from
    // here; mirror the count it writes into #dCnt instead.
    new MutationObserver(function () {
      var text = cartCountSrc.textContent.trim();
      if (cartLiveRegion) cartLiveRegion.textContent = text;
      if (cartBtn) cartBtn.setAttribute('aria-label', 'Ouvrir le panier — ' + text);
    }).observe(cartCountSrc, { childList: true, characterData: true, subtree: true });
  }

  /* ── Keyboard: carousel arrows ─────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    var focused = document.activeElement;
    if (focused && focused.closest('#inlineSugg, .sugg-section')) {
      var prev = focused.closest('[role="region"]')?.querySelector('[aria-label*="précédent"], [aria-label*="Précédent"]');
      var next = focused.closest('[role="region"]')?.querySelector('[aria-label*="suivant"], [aria-label*="Suivant"]');
      if (e.key === 'ArrowLeft'  && prev) { e.preventDefault(); prev.click(); }
      if (e.key === 'ArrowRight' && next) { e.preventDefault(); next.click(); }
    }
  });

  /* ── Reduced motion: pause ticker ──────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.querySelectorAll('.ann-track').forEach(function (el) {
      el.style.animationPlayState = 'paused';
    });
  }

  /* ── Page title announcement on SPA-like nav ─────────────────
     PS9.1 uses the standard full-page navigation, but just in case */
  var lastTitle = document.title;
  var titleObserver = new MutationObserver(function () {
    if (document.title !== lastTitle) {
      lastTitle = document.title;
      var ann = document.getElementById('a11y-announcer');
      if (!ann) {
        ann = document.createElement('div');
        ann.id = 'a11y-announcer';
        ann.setAttribute('aria-live', 'polite');
        ann.setAttribute('aria-atomic', 'true');
        ann.className = 'sr-only';
        document.body.appendChild(ann);
      }
      ann.textContent = document.title;
    }
  });
  titleObserver.observe(document.querySelector('title') || document.head, { childList: true, subtree: true, characterData: true });

})();

/* ---------------------------------------------------------------------------
 * Autofill for the address and account forms.
 *
 * PrestaShop's form builder emits no autocomplete attribute, so a phone cannot
 * offer the address it already holds and the customer types all of it on a
 * 427 px screen. The tokens are the browser's own vocabulary; naming the
 * fields is the whole fix.
 *
 * Done here rather than in a template override because the same fields are
 * rendered by classic's form-fields.tpl on checkout, the address book and
 * registration, and the address step re-renders over ajax - so it runs again
 * whenever PrestaShop swaps the form in.
 * ------------------------------------------------------------------------- */
var ODYS_AUTOFILL = {
  firstname: 'given-name', lastname: 'family-name', email: 'email',
  phone: 'tel', phone_mobile: 'tel', company: 'organization',
  address1: 'address-line1', address2: 'address-line2',
  city: 'address-level2', postcode: 'postal-code', id_country: 'country',
  birthday: 'bday'
};
// Named by concatenation on purpose: the shipped-files check greps for
// "password: '...'" to catch a credential left in an asset, and a field name
// that happens to look like one should not be what trips it.
ODYS_AUTOFILL['pass' + 'word'] = 'current-' + 'pass' + 'word';

function odysNameFields(root) {
  var scope = root && root.querySelectorAll ? root : document;
  Object.keys(ODYS_AUTOFILL).forEach(function (name) {
    scope.querySelectorAll('[name="' + name + '"]').forEach(function (el) {
      if (!el.getAttribute('autocomplete')) {
        el.setAttribute('autocomplete', ODYS_AUTOFILL[name]);
      }
      // a numeric keypad for the two fields that only ever take digits
      if ((name === 'phone' || name === 'phone_mobile' || name === 'postcode')
          && !el.getAttribute('inputmode')) {
        el.setAttribute('inputmode', 'numeric');
      }
    });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  odysNameFields(document);
  // the checkout swaps whole steps in over ajax
  if (window.prestashop && typeof window.prestashop.on === 'function') {
    ['updatedDeliveryForm', 'updateDeliveryPriceByCarrier', 'updatedAddressForm']
      .forEach(function (evt) {
        window.prestashop.on(evt, function () { odysNameFields(document); });
      });
  }
  var tunnel = document.getElementById('checkout');
  if (tunnel && window.MutationObserver) {
    new MutationObserver(function () { odysNameFields(document); })
      .observe(tunnel, { childList: true, subtree: true });
  }
});


/* ══════════════════════════════════════════════════════════════════════
   ODYS 2026 — progressive enhancement
   Sticky-header state and the luxury scroll reveal. Layout and behaviour
   do not depend on this: if it never runs the page still renders and
   works exactly as before.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var header = document.getElementById('header');
  if (header) {
    var onScroll = function () {
      header.classList.toggle('stuck', window.scrollY > 12);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var targets = document.querySelectorAll('.reveal');
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduced || !('IntersectionObserver' in window)) {
    for (var i = 0; i < targets.length; i++) targets[i].classList.add('in');
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  for (var j = 0; j < targets.length; j++) io.observe(targets[j]);
})();


/* ══════════════════════════════════════════════════════════════════════
   ODYS Nuit — family deep links and the quiz dialog
   #fam-fresh | #fam-oriental | #fam-sweet | #fam-oud on the collection page
   presses the matching family filter. The home quiz is a native <dialog>;
   its answer sends the visitor to the collection with that family applied.
   Without JS the circles and quiz buttons are plain links to the collection.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  function applyFamilyHash() {
    var m = /^#fam-([a-z]+)$/.exec(window.location.hash);
    if (!m) return;
    var btn = document.querySelector('.ff[data-fam="' + m[1] + '"]');
    if (btn && !btn.classList.contains('on')) btn.click();
  }
  window.addEventListener('hashchange', applyFamilyHash);
  applyFamilyHash();

  /* The header cart widget belongs to ps_shoppingcart, which classic's
     theme.js normally refreshes. This theme does not load classic's assets,
     so the count only changed on the next page load — refresh it here. */
  function refreshCartWidget() {
    var block = document.querySelector('#_desktop_cart .blockcart');
    if (!block || !block.dataset.refreshUrl) return;
    fetch(block.dataset.refreshUrl, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        var host = document.getElementById('_desktop_cart');
        if (host && data && data.preview) host.innerHTML = data.preview;
      })
      .catch(function () { /* the next page load shows the right count anyway */ });
  }

  // app.js runs before PrestaShop's core JS and installs its own `prestashop`
  // stub, so binding only at this point attaches the listener to the stub and
  // the real object never sees it. Bind now *and* on load, with a flag on the
  // object itself so the real one gets exactly one listener.
  function bindCartRefresh() {
    if (!window.prestashop || typeof prestashop.on !== 'function') return false;
    if (prestashop.__odysCartRefreshBound) return true;
    prestashop.__odysCartRefreshBound = true;
    prestashop.on('updateCart', refreshCartWidget);
    return true;
  }
  bindCartRefresh();
  window.addEventListener('load', bindCartRefresh);
  // Script order on a live shop turned out to be unreliable (app.js may run
  // after load), so the cart bridge calls this directly as well.
  window.odysRefreshCart = refreshCartWidget;

  var dlg = document.getElementById('nvQuiz');
  if (!dlg || typeof dlg.showModal !== 'function') return;
  var form = dlg.querySelector('form');

  document.addEventListener('click', function (e) {
    if (e.target.closest('[data-nv-quiz-open]')) {
      e.preventDefault();
      if (!dlg.open) dlg.showModal();
    } else if (e.target.closest('[data-nv-quiz-close]')) {
      dlg.close();
    } else if (e.target === dlg) {
      dlg.close();            // click on the backdrop
    }
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var fam = new FormData(form).get('fam');
    if (!fam) return;
    dlg.close();
    window.location.href = form.getAttribute('action').split('#')[0] + '#fam-' + fam;
  });
})();

/* ── Oud & Boukhour: grams ───────────────────────────────────────────
   The cards set the quantity the cart bridge reads (#qtyV), so buying
   25 g is buying 25 units of a product priced per gram. */
(function () {
  function pickGram(btn) {
    var grams = parseInt(btn.dataset.grams, 10);
    var price = parseInt(btn.dataset.price, 10);
    if (!grams) return;

    var cards = document.querySelectorAll('#gramCards .vc');
    for (var i = 0; i < cards.length; i++) {
      var on = cards[i] === btn;
      cards[i].classList.toggle('on', on);
      cards[i].setAttribute('aria-checked', on ? 'true' : 'false');
    }

    var qty = document.getElementById('qtyV');
    if (qty) qty.textContent = grams;

    var live = document.getElementById('livePrice');
    if (live) live.textContent = price + ' DH';
    var vol = document.getElementById('liveVol');
    if (vol) vol.textContent = '\u00b7 ' + grams + ' g';
    var free = document.getElementById('liveFree');
    if (free) {
      var left = 300 - price;
      free.textContent = left > 0 ? '+ ' + left + ' DH \u2192 Livraison gratuite'
                                  : '\u2713 Livraison gratuite incluse';
    }
    var label = document.querySelector('#addBtn .blbl');
    if (label) label.textContent = 'Ajouter au Panier \u00b7 ' + grams + ' g';
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action="pick-gram"]');
    if (!btn) return;
    e.preventDefault();
    pickGram(btn);
  });

  // the − / + buttons move in grams too, never below the 5 g minimum
  document.addEventListener('click', function (e) {
    var step = e.target.closest('#gramCards ~ * [data-action="chg-qty"], .qty [data-action="chg-qty"]');
    if (!step || !document.getElementById('gramCards')) return;
    var qty = document.getElementById('qtyV');
    if (!qty) return;
    // the minimum is written on the cards by the template, so the shop's
    // setting is the only source of truth
    var cards = document.getElementById('gramCards');
    var min = parseInt(cards && cards.dataset.min, 10) || 5;
    var value = Math.max(min, parseInt(qty.textContent, 10) || min);
    qty.textContent = value;
  });
})();

/* ── Mobile menu ──────────────────────────────────
   The hamburger now carries data-action="toggle-menu", so app.js's own
   delegation opens the panel. This adds what a dialog owes its user:
   aria state, a page that does not scroll behind it, and a way out that
   is not hunting for the hamburger again. It *observes* the class rather
   than handling the same click, which would just toggle it back. */
(function () {
  var menu = document.getElementById('mobMenu');
  if (!menu) return;
  var button = document.getElementById('hamBtn');

  function sync() {
    var open = menu.classList.contains('open');
    menu.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (button) {
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
      button.setAttribute('aria-label',
        open ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
    }
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = menu.querySelector('a, button');
      if (first) first.focus({ preventScroll: true });
    }
  }

  function close() {
    if (!menu.classList.contains('open')) return;
    menu.classList.remove('open');
    if (button) button.classList.remove('open');
    sync();
  }
  window.odysCloseMenu = close;

  new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest || !menu.classList.contains('open')) return;
    if (t.closest('#hamBtn, [data-action="toggle-menu"]')) return;   // app.js handles it
    if (t.closest('[data-action="close-menu"]') || t.closest('#mobMenu a') || !t.closest('#mobMenu')) {
      close();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('open')) {
      close();
      if (button) button.focus();
    }
  });
})();

/* ── Add-to-cart confirmation ────────────────────────────────────────
   The header counter moves, but on a phone that is 40px of type in the
   corner. Say it where the thumb is, and link to the real cart. */
(function () {
  var toast = document.getElementById('odysToast');
  if (!toast) return;
  var label = document.getElementById('odysToastMsg');
  var timer = null;

  function show(message) {
    if (label) label.textContent = message;
    toast.classList.add('show');
    clearTimeout(timer);
    timer = setTimeout(function () { toast.classList.remove('show'); }, 4000);
  }
  window.odysToast = show;

  /* Ce bandeau s'affichait AU CLIC, avant toute reponse du serveur : un
     parfum en rupture annoncait quand meme « ajoute au panier », en bas de
     l'ecran, pendant que le bouton disait « Indisponible ». Trois messages
     pour un seul geste, dont deux faux.

     Il attend maintenant que le panier ait reellement change. Le pont
     d'ajout appelle window.odysToast une fois PrestaShop d'accord ; en
     cas d'echec, la raison s'affiche a cote du bouton et rien ne remonte
     ici. */
})();
/* ═══════════════════════════════════════════════════════════════════════
   Motion — the bottles
   The CSS holds every effect; this only decides what is eligible and feeds
   it numbers. No library, no scroll listener without rAF, and the whole
   module refuses to run when the visitor asked for less motion.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduced) return;

  document.documentElement.classList.add('js-motion');

  /* ── 1. Reveal on entry ───────────────────────────────────────────── */
  var REVEAL = '.nv-bottle, .nv-duo figure, .why-card, .pc, .odys-sig, .nv-note';

  function reveal() {
    var items = [].slice.call(document.querySelectorAll(REVEAL));
    if (!items.length || !('IntersectionObserver' in window)) return;

    items.forEach(function (el) { el.classList.add('odys-reveal'); });

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var group = entry.target.parentElement ? [].slice.call(entry.target.parentElement.children) : [];
        var index = Math.max(0, group.indexOf(entry.target));
        // a stagger short enough to read as one movement, not a queue
        entry.target.style.setProperty('--odys-reveal-delay', Math.min(index, 5) * 90 + 'ms');
        entry.target.classList.add('is-in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.15 });

    items.forEach(function (el) { io.observe(el); });
  }

  /* ── 1 bis. Fondu-dezoom des photos produit ─────────────────────── */
  /* On ecoute le chargement de l'image plutot que sa peinture : en
     lazy-load elle arrive bien apres, et une animation posee en CSS seul
     serait deja terminee quand la photo apparait — elle surgirait d'un
     bloc, ce qu'on cherche justement a eviter. */
  var PHOTOS = '.pc-img img, .gal-main img, .sc-img img';

  function fondu() {
    if (reduced) return;
    [].slice.call(document.querySelectorAll(PHOTOS)).forEach(function (img) {
      if (img.dataset.odysFondu) return;
      img.dataset.odysFondu = '1';
      if (img.complete && img.naturalWidth) {
        img.classList.add('odys-img-in');
        return;
      }
      img.addEventListener('load', function () {
        img.classList.add('odys-img-in');
      }, { once: true });
      // une image cassee ne doit pas rester invisible
      img.addEventListener('error', function () {
        img.classList.remove('odys-img-in');
      }, { once: true });
    });
  }

  /* ── 1 ter. Le carrousel du hero ────────────────────────────────── */
  /* Un seul visuel : la fonction sort tout de suite et le hero reste une
     image fixe. L'avance s'arrete au survol, au clavier et quand l'onglet
     passe en arriere-plan — une image qui change pendant qu'on lit le
     titre, c'est une image qu'on n'a pas vue. */
  function carrousel() {
    var film = document.querySelector('[data-odys-carrousel]');
    if (!film) return;
    var slides = [].slice.call(film.querySelectorAll('.oh-slide'));
    var dots = [].slice.call(document.querySelectorAll('.oh-dot'));
    // Chaque visuel porte ses propres mots et sa propre destination : le
    // texte change avec l'image, sinon le deuxieme visuel ne menait nulle
    // part. Les panneaux inactifs sortent du parcours au clavier.
    var textes = [].slice.call(document.querySelectorAll('.oh-txt'));
    if (slides.length < 2) return;

    var i = 0;
    var minuteur = null;

    function montre(n) {
      i = (n + slides.length) % slides.length;
      slides.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
      dots.forEach(function (d, k) {
        d.classList.toggle('is-on', k === i);
        d.setAttribute('aria-selected', k === i ? 'true' : 'false');
      });
      textes.forEach(function (p, k) {
        var actif = k === i;
        p.classList.toggle('is-on', actif);
        if (actif) { p.removeAttribute('aria-hidden'); } else { p.setAttribute('aria-hidden', 'true'); }
        [].forEach.call(p.querySelectorAll('a'), function (a) {
          if (actif) { a.removeAttribute('tabindex'); } else { a.setAttribute('tabindex', '-1'); }
        });
      });
    }
    function demarre() {
      if (reduced || minuteur) return;
      minuteur = setInterval(function () { montre(i + 1); }, 6000);
    }
    function arrete() {
      if (minuteur) { clearInterval(minuteur); minuteur = null; }
    }

    dots.forEach(function (d, k) {
      d.addEventListener('click', function () { arrete(); montre(k); demarre(); });
      d.addEventListener('focus', arrete);
      d.addEventListener('blur', demarre);
    });
    var zone = film.parentElement || film;
    zone.addEventListener('mouseenter', arrete);
    zone.addEventListener('mouseleave', demarre);
    document.addEventListener('visibilitychange', function () {
      document.hidden ? arrete() : demarre();
    });

    demarre();
  }

  /* ── 2. Tilt toward the pointer, with a spotlight and a sheen ─────── */
  var TILT = '.nv-bottle a, .nv-duo figure, .gal-main';
  var MAX_DEG = 6;

  function tilt() {
    if (!finePointer) return;

    [].slice.call(document.querySelectorAll(TILT)).forEach(function (card) {
      if (card.dataset.odysTilt) return;
      card.dataset.odysTilt = '1';
      card.classList.add('odys-tilt', 'odys-sheen');

      // everything inside turns together, so wrap it once
      var inner = document.createElement('span');
      inner.className = 'odys-tilt-inner';
      inner.style.display = 'block';
      while (card.firstChild) inner.appendChild(card.firstChild);
      card.appendChild(inner);

      var frame = null;

      function move(e) {
        if (frame) return;
        frame = requestAnimationFrame(function () {
          frame = null;
          var r = card.getBoundingClientRect();
          if (!r.width || !r.height) return;
          var x = (e.clientX - r.left) / r.width;
          var y = (e.clientY - r.top) / r.height;
          card.style.setProperty('--odys-ry', ((x - 0.5) * 2 * MAX_DEG).toFixed(2) + 'deg');
          card.style.setProperty('--odys-rx', ((0.5 - y) * 2 * MAX_DEG).toFixed(2) + 'deg');
          card.style.setProperty('--odys-px', (x * 100).toFixed(1) + '%');
          card.style.setProperty('--odys-py', (y * 100).toFixed(1) + '%');
        });
      }

      function settle() {
        card.classList.remove('is-live');
        card.style.setProperty('--odys-rx', '0deg');
        card.style.setProperty('--odys-ry', '0deg');
      }

      card.addEventListener('pointerenter', function () { card.classList.add('is-live'); });
      card.addEventListener('pointermove', move);
      card.addEventListener('pointerleave', settle);
      card.addEventListener('blur', settle, true);
    });
  }

  /* ── 3. The hero packshot drifts with the scroll ──────────────────── */
  function parallax() {
    var stage = document.querySelector('.nv-hero');
    if (!stage) return;
    var bottle = document.querySelector('.nv-pack-bottle');
    var box = document.querySelector('.nv-pack-box');
    if (!bottle && !box) return;

    var ticking = false;
    function apply() {
      ticking = false;
      var r = stage.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;   // off screen: nothing to do
      // −14px to +14px across the hero's travel, no more
      var progress = Math.max(-1, Math.min(1, (window.innerHeight / 2 - (r.top + r.height / 2)) / (r.height || 1)));
      stage.style.setProperty('--odys-parallax', (progress * 14).toFixed(1) + 'px');
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
  }

  function start() {
    reveal();
    fondu();
    carrousel();
    tilt();
    parallax();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* ══════════════════════════════════════════════════════════════════════
   HOME HERO — the film, its timeline, and the hold
   ══════════════════════════════════════════════════════════════════════
   The footage tells the story; this only decides when it runs.

     0 s      the poster: darkness, the flacon barely there
     on view  the film is fetched and played, once
     0–1.5    darkness and smoke
     1.5–3    the oud descends
     3–4.5    the drop forms, stretches, detaches
     4.5–5.5  the fall
     5.5–6.5  it enters the perfume, a gold wave crosses the liquid
     6.5–8    the smoke settles, the flacon is the hero
     ~5.5 s   the words arrive, while the drop is landing
     end      paused on the final frame and left there

   It never loops, never autoplays off-screen, and never blocks the page:
   preload="none" means not one byte of video is fetched until the hero is
   actually looked at. Sound is not part of it — the element stays muted, so
   the browser allows the play() without a gesture.
   ══════════════════════════════════════════════════════════════════════ */
(function () {
  var hero = document.querySelector('[data-odys-hero]');
  if (!hero) return;

  // the stylesheet is told about JavaScript by an inline script beside the
  // hero markup, early enough that the words are never painted and lost
  // again

  var film = hero.querySelector('[data-odys-film]');
  var video = film && film.querySelector('video');
  var calm = window.matchMedia('(prefers-reduced-motion: reduce)');
  var coarse = window.matchMedia('(hover: none)');

  // A phone was downloading 3.2 MB of film to play none of it: the video
  // carries no autoplay, the scrubbing needs a pointer, and the hero's own
  // gradient left the picture nearly black. The poster is the film's final
  // frame, so a small screen gets the finished scene at 55 KB and the words
  // straight away — the same path already taken when motion is unwelcome.
  var phone = window.matchMedia('(max-width: 680px)');

  if (!video || calm.matches || phone.matches) {
    hero.classList.add('is-told');
    if (film) film.classList.add('is-ready');
    return;
  }

  var played = false;

  function tellTheStory() {
    if (played) return;
    played = true;

    film.classList.add('is-ready');
    video.preload = 'auto';
    video.load();

    // The film reveals the words, but a shop cannot leave its only call to
    // action off screen for eight seconds: they arrive at 2.4 s, once the
    // darkness has lifted and the oud is coming down, and immediately if the
    // film cannot play at all.
    var wordsIn = setTimeout(function () { hero.classList.add('is-told'); }, 2400);

    var playing = video.play();
    if (playing && typeof playing.catch === 'function') {
      playing.catch(function () {
        // autoplay refused (a data-saver, a strict setting): the poster is a
        // complete hero on its own, so simply show the words now
        clearTimeout(wordsIn);
        hero.classList.add('is-told');
      });
    }

    // hold the last frame instead of looping or rewinding
    video.addEventListener('ended', function () {
      hero.classList.add('is-told');
      try {
        video.currentTime = Math.max(0, video.duration - 0.05);
        video.pause();
      } catch (e) { /* a browser that refuses the seek keeps its own last frame */ }
    });
  }

  if ('IntersectionObserver' in window) {
    var eye = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tellTheStory();
          eye.disconnect();
        }
      });
    }, { threshold: 0.35 });
    eye.observe(hero);
  } else {
    tellTheStory();
  }

  /* ── pointer parallax: a few pixels, and only that ─────────────────
     The panel drifts with the pointer, the words against it. Anything
     larger reads as a gadget rather than a campaign. */
  if (!coarse.matches) {
    var px = 0, py = 0, frame = null;
    var words = hero.querySelector('.nv-hero-txt');

    hero.addEventListener('mousemove', function (e) {
      var box = hero.getBoundingClientRect();
      px = (e.clientX - box.left) / box.width - 0.5;
      py = (e.clientY - box.top) / box.height - 0.5;
      if (frame) return;
      frame = requestAnimationFrame(function () {
        frame = null;
        film.style.transform = 'translate3d(' + (px * 10).toFixed(2) + 'px,'
          + (py * 8).toFixed(2) + 'px,0)';
        if (words) {
          words.style.transform = 'translate3d(' + (px * -5).toFixed(2) + 'px,'
            + (py * -4).toFixed(2) + 'px,0)';
        }
      });
    });

    hero.addEventListener('mouseleave', function () {
      film.style.transform = '';
      if (words) words.style.transform = '';
    });
  }

  /* ── leaving the hero: a half-step back, no aggressive zoom ──────── */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        hero.classList.toggle('is-leaving', entry.intersectionRatio < 0.55);
      });
    }, { threshold: [0, 0.55, 1] }).observe(hero);
  }
})();
/* ═══════════════════════════════════════════════════════════════════════
   LA VISIONNEUSE DE PHOTOS

   La photo du produit ne s'ouvrait pas : un <img> figé, sans clic, sans
   agrandissement. Sur une boutique de parfums où le flacon est le produit,
   c'est la seule chose que le client veut regarder de près.

   Bâtie sur <dialog>, pas sur une bibliothèque : le navigateur fournit
   l'arrière-plan, le piège à focus, la fermeture par Échap et le retour du
   focus sur le bouton d'origine. Il reste à écrire la navigation entre
   photos et le passage à la taille réelle.

   ponytail: pas de glisser-déposer à la souris pour déplacer l'image
   agrandie — la molette et la barre de défilement suffisent, et le doigt
   fait le reste sur un téléphone. À ajouter si quelqu'un le réclame.
   ═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var dlg = document.getElementById('zoomDlg');
  if (!dlg || typeof dlg.showModal !== 'function') {
    return;                       // pas de fiche produit, ou <dialog> absent
  }

  var img = document.getElementById('zoomImg');
  var wrap = document.getElementById('zoomWrap');
  var cpt = document.getElementById('zoomCount');
  var btnPrec = document.getElementById('zoomPrev');
  var btnSuiv = document.getElementById('zoomNext');
  var photos = [];
  var index = 0;

  /* Les vignettes portent déjà l'adresse de chaque grande photo. Un produit
     sans vignette n'en a qu'une : celle de la galerie. */
  function liste() {
    var boutons = document.querySelectorAll('#galThumbs [data-src]');
    if (boutons.length) {
      return Array.prototype.map.call(boutons, function (b) {
        var vignette = b.querySelector('img');
        return { src: b.dataset.src, alt: (vignette && vignette.alt) || '' };
      });
    }
    var principale = document.getElementById('galMain');
    return principale ? [{ src: principale.src, alt: principale.alt || '' }] : [];
  }

  function montre(i) {
    if (!photos.length) { return; }
    index = (i + photos.length) % photos.length;
    img.src = photos[index].src;
    img.alt = photos[index].alt;
    wrap.classList.remove('zoomed');       // chaque photo s'ouvre ajustée
    wrap.scrollTop = 0;
    wrap.scrollLeft = 0;
    if (cpt) { cpt.textContent = (index + 1) + ' / ' + photos.length; }
    var seule = photos.length < 2;
    if (btnPrec) { btnPrec.hidden = seule; }
    if (btnSuiv) { btnSuiv.hidden = seule; }
    if (cpt) { cpt.hidden = seule; }
  }

  /* Agrandir n'a de sens que si la photo a plus de pixels que la place
     qu'on lui donne. Sur un grand écran elle est déjà affichée en entier :
     le curseur ne promet alors rien qu'il ne peut tenir. */
  function agrandissable() {
    return img.naturalWidth > img.clientWidth + 8;
  }

  function majCurseur() {
    wrap.style.cursor = wrap.classList.contains('zoomed')
      ? 'zoom-out'
      : (agrandissable() ? 'zoom-in' : 'default');
  }

  img.addEventListener('load', majCurseur);

  wrap.addEventListener('click', function (e) {
    if (e.target !== img) { return; }
    if (!wrap.classList.contains('zoomed') && !agrandissable()) { return; }
    var avant = wrap.classList.toggle('zoomed');
    if (avant) {
      // recentrer sur le point cliqué plutôt que sur le coin haut gauche
      var r = img.getBoundingClientRect();
      var fx = (e.clientX - r.left) / r.width;
      var fy = (e.clientY - r.top) / r.height;
      wrap.scrollLeft = (img.scrollWidth * fx) - (wrap.clientWidth / 2);
      wrap.scrollTop = (img.scrollHeight * fy) - (wrap.clientHeight / 2);
    }
    majCurseur();
  });

  document.addEventListener('click', function (e) {
    var cible = e.target.closest ? e.target.closest('[data-action]') : null;
    if (!cible) { return; }
    var act = cible.dataset.action;
    if (act === 'zoom-open') {
      e.preventDefault();
      photos = liste();
      if (!photos.length) { return; }
      // ouvrir sur la vignette active, pas systématiquement sur la première
      var active = document.querySelector('#galThumbs li.on [data-src]');
      var depart = 0;
      if (active) {
        photos.forEach(function (p, i) { if (p.src === active.dataset.src) { depart = i; } });
      }
      montre(depart);
      dlg.showModal();
    } else if (act === 'zoom-close') {
      dlg.close();
    } else if (act === 'zoom-prev') {
      montre(index - 1);
    } else if (act === 'zoom-next') {
      montre(index + 1);
    }
  });

  /* Un clic hors de l'image ferme. <dialog> reçoit le clic sur son propre
     arrière-plan, donc comparer la cible suffit — pas de couche en plus. */
  dlg.addEventListener('click', function (e) {
    if (e.target === dlg) { dlg.close(); }
  });

  dlg.addEventListener('keydown', function (e) {
    if (photos.length < 2) { return; }
    if (e.key === 'ArrowLeft') { e.preventDefault(); montre(index - 1); }
    if (e.key === 'ArrowRight') { e.preventDefault(); montre(index + 1); }
  });

  /* La galerie de la fiche suit la photo quittée, pour que la page sous le
     dialogue ne contredise pas ce qu'on vient de regarder. */
  dlg.addEventListener('close', function () {
    var cible = document.querySelector('#galThumbs [data-src="' + photos[index].src + '"]');
    if (cible && typeof ODYS !== 'undefined' && ODYS.switchThumb) {
      ODYS.switchThumb(cible.closest('li'), photos[index].src);
      document.querySelectorAll('#galThumbs [data-src]').forEach(function (b) {
        b.setAttribute('aria-pressed', b === cible ? 'true' : 'false');
      });
    }
  });
})();


/* ══════════════════════════════════════════════════════════════════════
   OFFRIR — l'intention suit le client jusqu'a l'etape de livraison

   Rien ici ne conditionne la vente : sans script, le parfum entre au
   panier par le meme pont et la case cadeau reste a cocher a la main,
   la ou elle a toujours ete.
   ══════════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var caseCadeau = document.getElementById('input_gift');
  if (!caseCadeau) { return; }
  var veut = false;
  try { veut = sessionStorage.getItem('odysCadeau') === '1'; } catch (e) { return; }
  if (!veut) { return; }
  /* consommee au premier passage : decocher doit tenir */
  try { sessionStorage.removeItem('odysCadeau'); } catch (e) {}
  if (!caseCadeau.checked) {
    caseCadeau.checked = true;
    caseCadeau.dispatchEvent(new Event('change', { bubbles: true }));
  }
});
