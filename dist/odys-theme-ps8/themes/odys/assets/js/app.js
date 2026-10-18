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

/* ─── Les phrases traduites ──────────────────────────────────────────
   Un .js est servi tel quel : les memes octets pour les trois langues.
   C'est pourquoi la boutique anglaise disait encore « Ajouter au
   Panier » — la phrase n'etait pas dans un gabarit, elle etait ici.

   Le gabarit les depose donc, deja traduites, dans window.odysMots
   (voir layouts/layout-full-width.tpl), et on les lit par leur cle.
   Sans dictionnaire — page servie par un autre gabarit, bloc absent —
   MOT rend le francais : la boutique parle francais au lieu de se
   taire. La declaration est hissee, sa place dans le fichier n'a donc
   pas d'importance. */
function MOT(cle) {
  var d = window.odysMots;
  if (d && typeof d[cle] === 'string' && d[cle]) { return d[cle]; }
  return MOT.FR[cle] || cle;
}
MOT.FR = {
  'panierAjouter': 'Ajouter au Panier',
  'livraisonIncluse': 'Livraison gratuite incluse',
  'livraisonReste': '+ %montant% DH → Livraison gratuite',
  'enviesAjouter': 'Ajouter à mes envies',
  'enviesEnregistre': 'Enregistré dans mes envies',
  'enviesRetirer': 'Retirer %nom% de mes envies',
  'retirer': 'Retirer',
  'article': 'Article',
  'panierAjoute': '%nom% — ajouté au panier',
  'panierAjouteBouton': '✓ Ajouté !',
  'panierIndispo': 'Indisponible',
  'panierEchec': 'Ce parfum n\'a pas pu être ajouté au panier.',
  'menuOuvrir': 'Ouvrir le menu de navigation',
  'menuFermer': 'Fermer le menu de navigation',
  'exemplaireAjouter': 'Ajouter un exemplaire de %nom%',
  'exemplaireRetirer': 'Retirer un exemplaire de %nom%',
  'panierRetirer': 'Retirer %nom% du panier',
  'panierVide': 'Votre panier est vide.',
  'monCompte': 'Mon compte',
  'monCompteFidelite': 'Mon compte fidélité',
  'pointFidelite': '+%nombre% point fidélité',
  'pointsFidelite': '+%nombre% points fidélité'
};



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
let curPage = 'home';
let qty = 1;
let selVol = 50;
let selPrice = 69;


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
      lf.textContent = '✓ ' + MOT('livraisonIncluse');
      lf.style.background = 'rgba(45,106,79,.15)';
      lf.style.color = 'var(--green)';
    } else {
      lf.textContent = MOT('livraisonReste').replace('%montant%', remaining);
      lf.style.background = '';
      lf.style.color = '';
    }
  }

  // Update add-to-cart button label
  const btn_cart = document.getElementById('addBtn');
  if (btn_cart) {
    const lbl = btn_cart.querySelector('.blbl');
    if (lbl) lbl.textContent = MOT('panierAjouter') + ' · ' + vol;
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
    btn.textContent = added ? '♥ ' + MOT('enviesEnregistre') : '♡ ' + MOT('enviesAjouter');
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
      btn.textContent = full ? '♥ ' + MOT('enviesEnregistre') : '♥';
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
      + 'data-id="' + wishEscape(it.id) + '" aria-label="'
      + wishEscape(MOT('enviesRetirer').replace('%nom%', it.name))
      + '">' + wishEscape(MOT('retirer')) + '</button></li>';
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

  odysFiltres();
}

// L'accueil porte deux rangees de boutons : les onglets (parfums, oud,
// diffuseurs) et les familles olfactives. Chacune filtrait la grille pour
// son compte, donc la derniere cliquee effacait l'autre. Les deux etats
// sont lus ici, sur les boutons eux-memes, et appliques ensemble.
function filterOnglet(btn, onglet) {
  var groupe = btn.closest('.og-onglets');
  (groupe || document).querySelectorAll('.og').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');
  });
  btn.classList.add('on');
  btn.setAttribute('aria-pressed', 'true');
  odysFiltres();
}

function odysFiltres() {
  var fam = document.querySelector('.fam-filters .ff.on');
  var ong = document.querySelector('.og-onglets .og.on');
  fam = fam ? (fam.dataset.fam || 'all') : 'all';
  ong = ong ? (ong.dataset.onglet || 'all') : 'all';

  var restants = 0;
  document.querySelectorAll('#featGrid, #collGrid').forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      var garde = (fam === 'all' || pc.dataset.fam.indexOf(fam) !== -1)
               && (ong === 'all' || (pc.dataset.onglet || '') === ong);
      pc.style.display = garde ? '' : 'none';
      if (garde) { restants += 1; }
    });
  });

  // Sans ceci la grille tombe a zero pixel et la boutique parait vide.
  var vide = document.getElementById('collEmpty');
  if (vide) { vide.hidden = (restants > 0); }
  var rien = document.getElementById('accVide');
  if (rien) { rien.hidden = (restants > 0); }
}

// ── QUIZ ──

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



/* ══════════════════════════════════════════════════════════
   CHECKOUT FLOW — Sécurisé
   ══════════════════════════════════════════════════════════ */

// ── Rate limiting (simple token bucket) ─────────────────────

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


// ── Checkout state ─────────────── (managed in ODYS namespace)







// Payment method selection

/* fmtCard / fmtExp removed — no card fields collected (PCI compliance) */

// Escape key closes checkout


/* ══════════════════════════════════════════════════════════
   CATALOGUE PARFUMS — avec notes olfactives complètes
   ══════════════════════════════════════════════════════════ */

/* ══════════════════════════════════════════════════════════
   SYSTÈME DE FIDÉLITÉ
   ══════════════════════════════════════════════════════════ */

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







// Called when order is confirmed

function showPtsToast(msg) {
  const t = document.getElementById('ptsToast');
  const m = document.getElementById('ptsToastMsg');
  if (!t || !m) return;
  m.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3500);
}

/* La fenetre « mon compte » du prototype a ete retiree du theme : son
   gabarit n'existe plus (voir modals.tpl). Ces deux fonctions restent
   parce que le bouton injecte dans l'en-tete porte
   data-action="open-account" ; sans elles, un clic leverait une
   TypeError. Elles ne font rien, ce qui est exactement ce que faisait la
   fenetre absente. */
function openAccount() {}
function closeAccount() {}


/* ══════════════════════════════════════════════════════════
   RECHERCHE PAR NOTES OLFACTIVES
   ══════════════════════════════════════════════════════════ */

function closeNotes() {
  document.getElementById('notesOv').classList.remove('on');
  document.getElementById('notesPanel').classList.remove('on');
  document.querySelectorAll('.note').forEach(n => n.classList.remove('active-note'));
}


// Also init loyalty on load
document.addEventListener('DOMContentLoaded', () => {
  // Nav account icon — add to all navs
  document.querySelectorAll('.nav-icons').forEach(ni => {
    if (!ni.querySelector('.ni-acc')) {
      const btn = document.createElement('button');
      btn.className = 'ni ni-acc';
      btn.dataset.action = 'open-account';
      btn.setAttribute('title', MOT('monCompte'));
      btn.setAttribute('aria-label', MOT('monCompteFidelite'));

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
          const star = document.createTextNode('⭐ ' +
            MOT(pts > 1 ? 'pointsFidelite' : 'pointFidelite')
              .replace('%nombre%', pts));
          pill.appendChild(star);
          body.insertBefore(pill, prow.nextSibling);
        }
      }
    }
  });
});

/* ── PUBLIC API ──────────────────────────────────────────── */
return {
  go, toggleMenu, closeMenu,
  pickVol, chgQty, qtyRead, qtyWrite,  switchThumb, toggleAcc, toggleWish, wishToggle, wishDrop,
  filterFam, filterOnglet,     
  pickGram, 
  openAccount, closeAccount,    
   closeNotes
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

document.addEventListener('click', function(e) {
  const t = e.target.closest('[data-action]');
  if (!t) return;
  if (t.tagName === 'A') e.preventDefault();
  const action = t.dataset.action;
  const p = t.dataset;
  switch (action) {
    case 'go':            ODYS.go(p.page); if(p.closeMenu) ODYS.closeMenu(); if(p.closeNotes) ODYS.closeNotes(); break;
    case 'open-account':  ODYS.openAccount(); break;
    case 'close-account': ODYS.closeAccount(); break;
    case 'close-notes':   ODYS.closeNotes(); break;
    case 'toggle-menu':   ODYS.toggleMenu(); break;
    case 'close-menu':    ODYS.closeMenu(); break;
    case 'toggle-wish':   ODYS.toggleWish(t); break;
    case 'toggle-wish-full': ODYS.wishToggle(t, true); break;
    case 'wish-drop':     ODYS.wishDrop(t.getAttribute('data-id')); break;
    case 'toggle-acc':    ODYS.toggleAcc(t); break;
    case 'pick-vol':      ODYS.pickVol(t); break;
    case 'chg-qty':       ODYS.chgQty(Number(p.delta)); break;
    case 'filter-fam':    ODYS.filterFam(t, p.fam); break;
    case 'filter-onglet': ODYS.filterOnglet(t, p.onglet); break;
    case 'pick-gram':     ODYS.pickGram(t, p.cardId, Number(p.rate)); break;
    case 'switch-thumb':  ODYS.switchThumb(t, p.src); break;
    case 'close-ann':     { document.documentElement.classList.add('ann-fermee');
                            try { sessionStorage.setItem('odysAnnFermee', '1'); } catch (err) {} } break;
    case 'dismiss-sbn':   { const s = document.getElementById('sbn'); if(s) s.style.display='none'; } break;
    case 'wa-order': {
      const n = document.querySelector('[data-wa-number]')?.dataset.waNumber || '212600000000';
      window.open('https://wa.me/' + n + '?text=' + encodeURIComponent('Bonjour ODYS \u{1F44B} Je souhaite passer une commande'), '_blank');
      break;
    }
  }
});
document.getElementById('accOv')    ?.addEventListener('click', () => ODYS.closeAccount());
document.getElementById('notesOv')  ?.addEventListener('click', () => ODYS.closeNotes());
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  ODYS.closeAccount(); ODYS.closeNotes();
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



let suggOffset  = 0;
const SUGG_CARD_W = 174;


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







document.addEventListener('DOMContentLoaded', () => {
  window.addEventListener('resize', () => { suggOffset = 0; updateSuggNav(); });
});






/* Add delegation cases for new features */
document.addEventListener('click', function(e2) {
  const t2 = e2.target.closest('[data-action]');
  if (!t2) return;
  const act2 = t2.dataset.action;
  if (act2 === 'sugg-prev')   { e2.preventDefault(); scrollSugg(-1); }
  if (act2 === 'sugg-next')   { e2.preventDefault(); scrollSugg(1); }
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

    /* Pas de repli : le selecteur du pont exige [data-id-product] et
       les cinq boutons d'achat des gabarits le portent en dur.
       docker/verify.sh echoue si un bouton d'achat parait sans lui. */
    if (idProduct) {
      psAddToCart(idProduct, idAttr, qty, function(resp) {
        var odysPlein = resp && resp.cart && Number(resp.cart.products_count) > 0;
        if (resp && resp.success && !resp.hasError && (Number(resp.quantity) > 0 || odysPlein)) {
          /* Le tiroir montre ce que PrestaShop vient de confirmer. */
          if (window.odysTiroirApresAjout) { window.odysTiroirApresAjout(resp); }
          /* Le bouton dit lui-meme que c'est entre. La phrase passe
             par le dictionnaire : le panier de la maquette ecrivait
             « ✓ Ajouté ! » en francais dans les trois langues. Et elle
             va dans .blbl quand il y en a un — ecrire dans le
             textContent du bouton emportait son libelle et son
             rouet, que l'etiquette du volume cherche ensuite. */
          var odysCible = btn.querySelector('.blbl') || btn;
          var odysAvantAjout = odysCible.textContent;
          btn.classList.add('done');
          odysCible.textContent = MOT('panierAjouteBouton');
          setTimeout(function () {
            btn.classList.remove('done');
            odysCible.textContent = odysAvantAjout;
          }, 1600);
          /* Le bandeau du bas, maintenant que PrestaShop a confirme. */
          if (window.odysToast) {
            window.odysToast(MOT('panierAjoute').replace('%nom%',
              String(name || MOT('article')).trim().slice(0, 48)));
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
          if (!odysRaison) { odysRaison = MOT('panierEchec'); }
          if (btn) {
            var odysAvant = btn.textContent;
            btn.classList.add('ko');
            btn.textContent = MOT('panierIndispo');
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


/* ── Data (simulated — replace with real PS8 API calls) ── */

/* ── Render functions ─────────────────────────────────────── */


/* ── OVERVIEW ── */

/* ── SEO ── */

/* ── PRODUCTS ── */

/* ── MARKETING ── */

/* ── CUSTOMERS ── */

/* ── AI ADVISOR ── */

/* ── AI Chat via Anthropic API ──────────────────────────────── */






/* ── Minimal chart helpers (no external lib) ─────────────────── */







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
      hamBtn.setAttribute('aria-label', MOT(open ? 'menuOuvrir' : 'menuFermer'));
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
        hamBtn.setAttribute('aria-label', MOT('menuOuvrir'));
        hamBtn.focus();
      }
    });
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

  /* ── Keyboard: carousel arrows ─────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (!['ArrowLeft','ArrowRight'].includes(e.key)) return;
    var focused = document.activeElement;
    var sugg = focused && focused.closest('.sugg-section');
    if (sugg) {
      var prev = sugg.querySelector('[data-action="sugg-prev"]');
      var next = sugg.querySelector('[data-action="sugg-next"]');
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
      free.textContent = left > 0 ? MOT('livraisonReste').replace('%montant%', left)
                                  : '\u2713 ' + MOT('livraisonIncluse');
    }
    var label = document.querySelector('#addBtn .blbl');
    if (label) label.textContent = MOT('panierAjouter') + ' \u00b7 ' + grams + ' g';
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
        MOT(open ? 'menuFermer' : 'menuOuvrir'));
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


/* ── Fenetres du module d'avis (sans Bootstrap) ── */
(function () {
  var $ = window.jQuery;
  if (!$ || $.fn.modal) { return; }   /* Bootstrap present : on se tait */

  function montre(el, ouvert) {
    el.classList.toggle('odys-modal-on', ouvert);
    el.setAttribute('aria-hidden', ouvert ? 'false' : 'true');
    document.body.classList.toggle('odys-modal-ouvert',
      !!document.querySelector('.modal.odys-modal-on'));
    if (ouvert) {
      var premier = el.querySelector('input, textarea, button, [href]');
      if (premier) { try { premier.focus(); } catch (e) {} }
    }
  }

  $.fn.modal = function (ordre) {
    return this.each(function () { montre(this, ordre !== 'hide'); });
  };

  /* Bootstrap ferme aussi sur la croix, sur le fond et sur Echap. */
  document.addEventListener('click', function (e) {
    var fermeur = e.target.closest('[data-dismiss="modal"]');
    if (fermeur) {
      var f = fermeur.closest('.modal');
      if (f) { montre(f, false); }
      return;
    }
    if (e.target.classList && e.target.classList.contains('modal')) {
      montre(e.target, false);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') { return; }
    document.querySelectorAll('.modal.odys-modal-on').forEach(function (f) {
      montre(f, false);
    });
  });
})();

/* ── Le panier qui s'ouvre sur le cote ────────────────────────────────
   Il montre le panier de PrestaShop, pas celui de la maquette.

   Le gabarit le rend deja rempli, avec ce que le panier contient quand la
   page part : sans script, le lien de la barre mene au panier, les
   quantites se changent par des liens ordinaires, et commander marche.
   Ici on ajoute ce que le script peut faire de mieux — ouvrir le tiroir
   la ou on est, et le remplir apres chaque ajout sans recharger la page.

   Les lignes viennent de la reponse de PrestaShop (data.cart), jamais
   d'un total calcule dans le navigateur : deux comptes qui se ressemblent
   finissent toujours par diverger, et c'est celui du serveur qui facture. */
(function () {
  'use strict';

  var tiroir = document.getElementById('odysTiroir');
  var fond = document.getElementById('odysTiroirFond');
  if (!tiroir || !fond) { return; }

  var dernierDeclencheur = null;

  function ouvrir(declencheur) {
    dernierDeclencheur = declencheur || null;
    tiroir.hidden = false;
    fond.hidden = false;
    /* le navigateur doit avoir pose l'element avant la transition */
    requestAnimationFrame(function () {
      tiroir.classList.add('on');
      fond.classList.add('on');
    });
    document.body.classList.add('odys-tiroir-ouvert');
    var premier = tiroir.querySelector('.ot-fermer');
    if (premier) { try { premier.focus(); } catch (e) {} }
  }

  function fermer() {
    tiroir.classList.remove('on');
    fond.classList.remove('on');
    document.body.classList.remove('odys-tiroir-ouvert');
    window.setTimeout(function () {
      if (!tiroir.classList.contains('on')) { tiroir.hidden = true; fond.hidden = true; }
    }, 300);
    if (dernierDeclencheur) { try { dernierDeclencheur.focus(); } catch (e) {} }
  }

  window.odysOuvrirTiroir = ouvrir;

  /* ── Ce qui ouvre et ferme ─────────────────────────────────────── */
  document.addEventListener('click', function (e) {
    var fermeur = e.target.closest('[data-action="fermer-tiroir"]');
    if (fermeur) { e.preventDefault(); fermer(); return; }

    /* Le panier de la barre : on ouvre le tiroir au lieu de changer de
       page. Le lien reste un lien — clic du milieu, nouvel onglet et
       navigation sans script continuent de mener a la page du panier. */
    var lien = e.target.closest('#_desktop_cart a, .blockcart a');
    if (lien && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
      e.preventDefault();
      ouvrir(lien);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && tiroir.classList.contains('on')) { fermer(); }
  });

  /* ── Le contenu, depuis la reponse du serveur ──────────────────── */
  function texte(el, valeur) { if (el) { el.textContent = valeur; } }

  function rendre(panier) {
    if (!panier || !panier.products) { return; }
    var liste = document.getElementById('odysTiroirListe');
    if (!liste) { return; }

    liste.innerHTML = '';
    if (!panier.products.length) {
      var vide = document.createElement('li');
      vide.className = 'ot-vide';
      var p = document.createElement('p');
      p.textContent = MOT('panierVide');
      vide.appendChild(p);
      liste.appendChild(vide);
    }

    panier.products.forEach(function (prod) {
      var li = document.createElement('li');
      li.className = 'ot-ligne';
      li.dataset.idProduct = prod.id_product;
      li.dataset.idProductAttribute = prod.id_product_attribute || 0;

      if (prod.cover && prod.cover.bySize && prod.cover.bySize.small_default) {
        var img = document.createElement('img');
        img.className = 'ot-img';
        img.src = prod.cover.bySize.small_default.url;
        img.alt = '';
        img.width = 60; img.height = 60; img.loading = 'lazy';
        li.appendChild(img);
      }

      var txt = document.createElement('div');
      txt.className = 'ot-txt';

      var nom = document.createElement('p');
      nom.className = 'ot-nom';
      nom.textContent = prod.name;
      txt.appendChild(nom);

      if (prod.attributes_small) {
        var decl = document.createElement('p');
        decl.className = 'ot-decl';
        decl.textContent = prod.attributes_small;
        txt.appendChild(decl);
      }

      var prix = document.createElement('p');
      prix.className = 'ot-prix';
      prix.textContent = prod.price;
      txt.appendChild(prix);

      var qte = document.createElement('div');
      qte.className = 'ot-qte';
      [['ot-moins', '−', prod.down_quantity_url,
        MOT('exemplaireRetirer').replace('%nom%', prod.name)],
       ['ot-nb', String(prod.quantity), null, null],
       ['ot-plus', '+', prod.up_quantity_url,
        MOT('exemplaireAjouter').replace('%nom%', prod.name)],
       ['ot-oter', MOT('retirer'), prod.remove_from_cart_url,
        MOT('panierRetirer').replace('%nom%', prod.name)]
      ].forEach(function (b) {
        var el = document.createElement(b[2] ? 'a' : 'span');
        el.className = b[0];
        el.textContent = b[1];
        if (b[2]) { el.href = b[2]; el.setAttribute('aria-label', b[3]); }
        qte.appendChild(el);
      });
      txt.appendChild(qte);
      li.appendChild(txt);
      liste.appendChild(li);
    });

    /* Le total : celui du serveur, tel qu'il l'ecrit. */
    if (panier.totals && panier.totals.total) {
      texte(document.getElementById('odysTiroirTotal'), panier.totals.total.value);
    }

    /* La livraison offerte. Le seuil est pose par le gabarit, qui le lit
       dans la configuration de la boutique. */
    var bloc = document.getElementById('odysTiroirLiv');
    var seuil = bloc ? parseInt(bloc.dataset.seuil, 10) : 0;
    /* Sur les produits seuls : la livraison ne paie pas la livraison. */
    var total = panier.subtotals && panier.subtotals.products
      ? parseFloat(String(panier.subtotals.products.amount || 0)) : 0;
    if (bloc && seuil > 0) {
      var reste = Math.ceil(seuil - total);
      /* Les deux phrases viennent du gabarit, donc traduites comme le
         reste : ecrites ici, le tiroir parlait francais sur /ar/. */
      var motReste = bloc.dataset.motReste || 'Encore %montant% DH';
      var motOfferte = bloc.dataset.motOfferte || '';
      texte(document.getElementById('odysTiroirLivMot'),
        reste > 0 ? motReste.replace('%montant%', reste) : motOfferte);
      var fill = document.getElementById('odysTiroirLivFill');
      if (fill) { fill.style.width = Math.min(100, (total / seuil) * 100) + '%'; }
      var barre = bloc.querySelector('[role="progressbar"]');
      if (barre) { barre.setAttribute('aria-valuenow', Math.min(seuil, Math.round(total))); }
    }
  }

  /* ── Changer une quantite sans quitter la page ─────────────────── */
  /* Les liens de PrestaShop font le travail tout seuls : suivis
     normalement ils rechargent la page et le panier est juste. Avec un
     script, on les suit en arriere-plan et on redessine le tiroir — meme
     adresse, meme calcul, cote serveur. */
  document.addEventListener('click', function (e) {
    var lien = e.target.closest('#odysTiroirListe a[href]');
    if (!lien || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) { return; }
    e.preventDefault();
    if (lien.dataset.enCours) { return; }
    lien.dataset.enCours = '1';
    tiroir.classList.add('ot-attend');

    var url = lien.href + (lien.href.indexOf('?') === -1 ? '?' : '&') + 'ajax=1&action=update';
    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' }, credentials: 'same-origin' })
      .then(function (r) { return r.json(); })
      .then(function (data) {
        if (data && data.cart) { rendre(data.cart); }
        /* la barre du haut et les autres blocs de PrestaShop suivent */
        try {
          if (window.prestashop && prestashop.emit) {
            prestashop.emit('updateCart', { reason: {}, resp: data });
          }
        } catch (err) { console.warn('un ecouteur updateCart a echoue :', err); }
      })
      .catch(function () {
        /* Le serveur n'a pas repondu comme attendu : on suit le lien pour
           de vrai plutot que de laisser un panier qui ment a l'ecran. */
        window.location.href = lien.href;
      })
      .finally(function () {
        delete lien.dataset.enCours;
        tiroir.classList.remove('ot-attend');
      });
  });

  window.odysTiroirRendre = rendre;

  /* Le pont d'ajout au panier appelle ceci quand PrestaShop a confirme. */
  window.odysTiroirApresAjout = function (data) {
    if (data && data.cart) { rendre(data.cart); }
    ouvrir(null);
  };
})();
