/* ODYS — one runtime for every page.
   State lives in localStorage under odys.v2; every read goes through S().
   Swap the three functions in the PERSISTENCE block for API calls when a backend exists.

   POINT RULES (config.points): points follow the dirham — 1 point per madPerPoint (69 MAD)
   of paid product, diffuseurs excluded. Ladder: 3 / 8 / 20 / 50 / 100.
   ORDERS: WhatsApp + cash on delivery (see waLink). */
(function () {
  'use strict';
  const D = window.ODYS;
  // admin.html writes overrides here; in production this merge is the API's config payload
  try {
    const cfg = JSON.parse(localStorage.getItem('odys.config') || '{}');
    (cfg.rewards || []).forEach(r => { const t = D.config.rewards.find(x => x.id === r.id); if (t) t.pts = r.pts; });
    (cfg.oudPrices || []).forEach(o => { const p = D.ouds.find(x => x.id === o.id); if (p) p.pricePerGram = o.pricePerGram; });
    delete cfg.rewards; delete cfg.oudPrices;
    Object.assign(D.config, cfg, {
      points: Object.assign({}, D.config.points, cfg.points),
      prices: Object.assign({}, D.config.prices, cfg.prices),
      oud: Object.assign({}, D.config.oud, cfg.oud),
      coffret: Object.assign({}, D.config.coffret, cfg.coffret),
      referral: Object.assign({}, D.config.referral, cfg.referral)
    });
    // product prices follow the config, not the other way round
    D.parfums.forEach(p => p.price = D.config.prices.perfume50);
    D.diffuseurs.forEach(p => p.price = D.config.prices.diffuseur50);
  } catch (e) { }
  const C = D.config;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));

  /* ── PERSISTENCE ─────────────────────────────────────────── */
  const KEY = 'odys.v2';
  const seed = () => ({
    cart: [], wishlist: [], points: 0, ledger: [], orders: [], vouchers: [],
    user: null, quiz: null, gift: null, referrals: { code: null, invited: 0, joined: 0, purchased: 0 }
  });
  let cache = null;
  function S() {
    if (cache) return cache;
    try { cache = Object.assign(seed(), JSON.parse(localStorage.getItem(KEY) || '{}')); }
    catch (e) { cache = seed(); }
    return cache;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(cache)); } catch (e) { /* private mode: session only */ }
    paint();
  }

  /* ── HELPERS ─────────────────────────────────────────────── */
  // en-US grouping on purpose: "5,240" is how the brand writes numbers, not "5.240"
  const money = n => new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(n)) + ' MAD';
  const num = n => new Intl.NumberFormat('en-US').format(Math.round(n));
  const find = id => D.products.find(p => p.id === id) || D.coffrets.find(b => b.id === id) || null;
  const stars = r => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // translate an atom before it is joined into a composite ("Cedar · Musk" never matches a dictionary)
  const T = s => window.I18N ? I18N.tr(s) : s;
  const qs = k => new URLSearchParams(location.search).get(k);

  /* ── OUD BY THE GRAM ─────────────────────────────────────── */
  function gramRate(g) {
    if (C.oud.tierDiscount[g] != null) return C.oud.tierDiscount[g];
    if (g >= C.oud.specialFrom) return C.oud.specialRate;          // special order
    const below = C.oud.steps.filter(s => s <= g);
    return below.length ? C.oud.tierDiscount[below[below.length - 1]] : 1;
  }
  const gramPrice = (p, g) => Math.round(p.pricePerGram * g * gramRate(g));
  const isSpecial = g => C.oud.steps.indexOf(g) === -1;
  // "5 g" means nothing to a first-time buyer; "≈ 5 sticks" does
  const sticksFor = g => Math.max(1, Math.round(g * (C.oud.sticksPerGram || 1)));
  const sticksLabel = g => '≈ ' + sticksFor(g) + ' ' + T(sticksFor(g) === 1 ? 'stick' : 'sticks');

  /* POINTS FOLLOW THE DIRHAM.
     Per-gram accrual meant a 10 MAD/g batch bought the same reward as a 22 MAD/g one
     for a third of the spend. Everything now converts at C.points.madPerPoint. */
  const pointsFor = mad => mad / C.points.madPerPoint;
  const ptsRound = n => Math.round(n * 10) / 10;              // display: one decimal
  const ptsLabel = n => String(ptsRound(n));
  const ptsWord = n => T(ptsRound(n) === 1 ? 'pt' : 'pts');
  const priceOf = (p, grams) => p.type === 'oud' ? gramPrice(p, grams || C.oud.minGrams) : p.price;

  /* points a single unit of something earns — fractional, rounded once at checkout */
  function unitPoints(p, grams) {
    if (!p) return 0;
    if (p.type === 'diffuseur' && !C.points.diffuseurEarns) return 0;
    return pointsFor(priceOf(p, grams));
  }
  const oudPoints = (p, g) => unitPoints(p, g);               // kept for the oud pages

  const tierOf = pts => C.tiers.reduce((t, x) => pts >= x.from ? x : t, C.tiers[0]);
  const nextReward = pts => C.rewards.find(r => r.pts > pts) || null;
  const unlocked = pts => C.rewards.filter(r => r.pts <= pts);

  /* generated flacon art — no photography needed, and it scales to any tint.
     A product with a real photograph uses it instead, everywhere art is drawn:
     cards, the product page, search results, the cart. */
  let artSeq = 0;
  function bottle(p, opts) {
    if (p && p.photo) {
      const eager = opts && opts.eager;
      return `<img class="art-photo" src="${p.photo}" alt="${esc(p.name || p.code || 'ODYS')}"
        width="${p.photoW || 407}" height="${p.photoH || 611}"
        ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
    }
    const c = (p && p.c) || ['#3D1216', '#0B0B0B'];
    // unique per drawing: the same product often appears twice on a page, and when the first copy
    // sits in a hidden tab Chrome paints the second with its gradient missing
    const id = 'g' + (p && p.id ? p.id.replace(/\W/g, '') : 'x') + (opts && opts.k || '') + '-' + (++artSeq);
    const label = (p && p.code) || 'ODYS';

    if (p && p.type === 'oud') {   // bundle of sticks
      return `<svg viewBox="0 0 120 180" role="img" aria-label="${esc(label)}">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c[0]}"/><stop offset="1" stop-color="${c[1]}"/></linearGradient></defs>
        ${[0, 1, 2, 3, 4].map(i => `<g transform="translate(${34 + i * 13} 18) rotate(${(i - 2) * 3} 4 70)">
          <rect x="2" y="0" width="4" height="120" rx="2" fill="url(#${id})" stroke="rgba(216,198,165,.30)"/>
          <circle cx="4" cy="2" r="3.4" fill="#2A1A12"/></g>`).join('')}
        <rect x="26" y="112" width="68" height="34" rx="2" fill="rgba(11,11,11,.55)" stroke="rgba(216,198,165,.35)"/>
        <text x="60" y="133" text-anchor="middle" font-family="Jost,Arial" font-size="8" letter-spacing="3" fill="rgba(243,235,221,.9)">${esc(label)}</text>
        <path d="M20 168h80" stroke="rgba(216,198,165,.25)"/>
      </svg>`;
    }

    if (p && p.type === 'diffuseur') {   // squat bottle + three rattan sticks
      return `<svg viewBox="0 0 120 180" role="img" aria-label="${esc(label)}">
        <defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/></linearGradient></defs>
        <g stroke="#C6A97A" stroke-width="2.6" stroke-linecap="round">
          <path d="M60 96 44 20"/><path d="M60 96 60 14"/><path d="M60 96 76 22"/>
        </g>
        <rect x="52" y="86" width="16" height="14" fill="#8F7038"/>
        <path d="M38 100h44l6 42c2 16-10 26-28 26s-30-10-28-26z" fill="url(#${id})" stroke="rgba(216,198,165,.42)"/>
        <ellipse cx="50" cy="134" rx="5" ry="20" fill="rgba(255,255,255,.14)"/>
        <text x="60" y="152" text-anchor="middle" font-family="Jost,Arial" font-size="7" letter-spacing="2.2" fill="rgba(243,235,221,.85)">${esc(label)}</text>
      </svg>`;
    }

    return `<svg viewBox="0 0 120 180" role="img" aria-label="${esc(label)}">
      <defs>
        <linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="${c[0]}"/><stop offset=".6" stop-color="${c[1]}"/><stop offset="1" stop-color="${c[0]}"/>
        </linearGradient>
        <linearGradient id="${id}c" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#6B5324"/><stop offset=".4" stop-color="#D4B676"/><stop offset="1" stop-color="#7A5F2C"/>
        </linearGradient>
      </defs>
      <rect x="44" y="8" width="32" height="26" rx="2" fill="#17100C"/>
      <rect x="44" y="8" width="32" height="6" rx="2" fill="#241812"/>
      <rect x="50" y="34" width="20" height="9" fill="url(#${id}c)"/>
      <rect x="22" y="43" width="76" height="126" rx="6" fill="url(#${id})" stroke="rgba(216,198,165,.38)"/>
      <rect x="30" y="74" width="60" height="88" rx="4" fill="rgba(0,0,0,.22)"/>
      <rect x="31" y="52" width="10" height="110" rx="5" fill="rgba(255,255,255,.12)"/>
      <rect x="36" y="104" width="48" height="26" fill="rgba(243,235,221,.07)" stroke="rgba(216,198,165,.35)"/>
      <text x="60" y="121" text-anchor="middle" font-family="Jost,Arial" font-size="8" letter-spacing="3" fill="rgba(243,235,221,.9)">${esc(label)}</text>
    </svg>`;
  }

  /* ── ICONS ───────────────────────────────────────────────── */
  const I = {
    search: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    heart: '<svg viewBox="0 0 24 24"><path d="M12 20s-7-4.4-7-9.3A4 4 0 0 1 12 8a4 4 0 0 1 7 2.7C19 15.6 12 20 12 20z"/></svg>',
    user: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.6"/><path d="M5 20c1-3.6 3.7-5.4 7-5.4S18 16.4 19 20"/></svg>',
    bag: '<svg viewBox="0 0 24 24"><path d="M6 8h12l1 12H5z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7"/><path d="M6 10.5V20h12v-9.5"/></svg>',
    grid: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M4 8h16v12H4z"/><path d="M4 8 6 4h12l2 4M12 8v12M4 13h16"/></svg>',
    gem: '<svg viewBox="0 0 24 24"><path d="M7 4h10l4 5-9 11L3 9z"/><path d="M3 9h18M9.5 4 7 9l5 11 5-11-2.5-5"/></svg>',
    close: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    gift: '<svg viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="11"/><path d="M3 9h18M12 9v11M12 9c-1.5-3-5-4-5-1.5S10 9 12 9zm0 0c1.5-3 5-4 5-1.5S14 9 12 9z"/></svg>',
    wa: '<svg viewBox="0 0 24 24"><path d="M20 12a8 8 0 0 1-11.9 7L4 20l1.1-4A8 8 0 1 1 20 12z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.7-.9.8a5 5 0 0 1-2.3-2.3l.8-.9L11 9.5c-.5 0-1 .4-1 1"/></svg>'
  };

  /* ── CHROME: header, footer, mobile nav ──────────────────── */
  const NAV = [
    ['Parfums', 'shop.html'], ['Diffuseurs', 'diffuseurs.html'], ['Oud au gramme', 'oud.html'],
    ['Coffrets', 'coffrets.html'], ['Discovery', 'discover.html']
  ];
  const LANGS = window.I18N ? I18N.langs : ['en'];
  const langBar = (cls) => window.I18N ? `<div class="langs ${cls || ''}" role="group" aria-label="Language">
      ${LANGS.map(l => `<button data-lang="${l}"${I18N.lang === l ? ' aria-current="true"' : ''} lang="${l}">${I18N.labels[l]}</button>`).join('')}
    </div>` : '';
  const ANN = [
    'Your journey starts here',
    'Parfum 50 ML · ' + money(C.prices.perfume50) + ' — diffuseur 50 ML · ' + money(C.prices.diffuseur50),
    'Order on WhatsApp · cash on delivery across Morocco',
    'Free shipping from ' + money(C.freeShipFrom)
  ];

  function chrome() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const mount = $('#odys-chrome');
    if (!mount) return;
    mount.innerHTML = `
      <a class="skip" href="#main">Skip to content</a>
      <div class="announce" id="ann" aria-live="polite"><span>${ANN[0]}</span></div>
      <header class="hdr">
        <div class="hdr-in">
          <a class="brand" href="index.html" aria-label="ODYS Parfum — home">
            <b>ODYS</b><small class="ar">عطور وعود</small>
          </a>
          <nav class="nav" aria-label="Main">
            ${NAV.map(n => `<a href="${n[1]}"${here === n[1] ? ' aria-current="page"' : ''}>${n[0]}</a>`).join('')}
          </nav>
          <div class="hdr-act">
            ${langBar()}
            <a class="pts-chip" href="rewards.html"><b data-pts>0</b><span>PTS</span><span>Rewards</span></a>
            <a class="icon-btn wa" href="${waHref(T('Hello ODYS, I have a question'))}" target="_blank" rel="noopener" aria-label="Order on WhatsApp" title="Order on WhatsApp">${I.wa}</a>
            <button class="icon-btn" data-open="search" aria-label="Search">${I.search}</button>
            <a class="icon-btn" href="account.html#wishlist" aria-label="Wishlist">${I.heart}<span class="badge hide" data-wishcount>0</span></a>
            <a class="icon-btn" href="account.html" aria-label="Account">${I.user}</a>
            <button class="icon-btn" data-open="cart" aria-label="Cart">${I.bag}<span class="badge hide" data-cartcount>0</span></button>
          </div>
        </div>
      </header>`;

    let i = 0;
    setInterval(() => { i = (i + 1) % ANN.length; const a = $('#ann'); if (a) a.innerHTML = `<span>${ANN[i]}</span>`; }, 4800);

    const foot = $('#odys-footer');
    if (foot) foot.innerHTML = `
      <footer class="ftr">
        <div class="wrap-wide">
          <div class="ftr-grid">
            <div>
              <div class="brand" style="margin-bottom:16px"><b>ODYS</b><small class="ar">عطور وعود</small></div>
              <p class="muted" style="font-size:13px;max-width:34ch;color:rgba(243,235,221,.6)">More than a fragrance. It's a journey. Parfums 50 ML, diffuseurs and oud by the gram — composed in Morocco.</p>
              <a class="link-u" href="${waHref(T('Hello ODYS, I have a question'))}" target="_blank" rel="noopener" style="display:inline-block;margin-top:14px;color:#D4B676;border-color:#B08D4F">WhatsApp +${C.whatsapp}</a>
              <p class="mono" style="margin-top:12px;color:rgba(243,235,221,.45)">Casablanca · cash on delivery</p>
            </div>
            <div><h5>Shop</h5>${[['Parfums', 'shop.html'], ['Diffuseurs', 'diffuseurs.html'], ['Oud au gramme', 'oud.html'], ['Coffrets', 'coffrets.html'], ['Discovery', 'discover.html']].map(l => `<a href="${l[1]}">${l[0]}</a><br>`).join('')}</div>
            <div><h5>Journey</h5>${[['ODYS Rewards', 'rewards.html'], ['Free perfume at 20 pts', 'rewards.html#ladder'], ['Creator Journey', 'rewards.html#creator'], ['Referrals', 'account.html#referrals'], ['Community', 'journal.html#community']].map(l => `<a href="${l[1]}">${l[0]}</a><br>`).join('')}</div>
            <div><h5>Maison</h5>${[['Journal', 'journal.html'], ['Collections', 'collections.html'], ['Gifting', 'coffrets.html'], ['Contact', 'info.html#contact']].map(l => `<a href="${l[1]}">${l[0]}</a><br>`).join('')}</div>
            <div><h5>Care</h5>${[['Shipping', 'info.html#delivery'], ['Returns', 'info.html#returns'], ['Payment', 'info.html#payment'], ['FAQ', 'info.html#faq'], ['Privacy', 'info.html#privacy'], ['Terms', 'info.html#terms']].map(l => `<a href="${l[1]}">${l[0]}</a><br>`).join('')}</div>
          </div>
          <div class="ftr-bot">
            <span>© ${new Date().getFullYear()} ODYS Parfum · Casablanca</span>
            ${langBar('langs-ftr')}
            <span class="ar" style="font-size:14px;color:#B08D4F">أوديس · عطور وعود</span>
            <span>Prices in MAD · VAT included</span>
          </div>
        </div>
      </footer>`;

    const m = document.createElement('nav');
    m.className = 'mnav'; m.setAttribute('aria-label', 'Mobile');
    const M = [['Home', 'index.html', I.home], ['Shop', 'shop.html', I.grid], ['Coffrets', 'coffrets.html', I.box], ['Rewards', 'rewards.html', I.gem], ['Account', 'account.html', I.user]];
    m.innerHTML = M.map(x => `<a href="${x[1]}"${here === x[1] ? ' aria-current="page"' : ''}>${x[2]}<span>${x[0]}</span></a>`).join('');
    document.body.appendChild(m);

    document.body.insertAdjacentHTML('beforeend', `
      <div class="toast-wrap" id="toasts" aria-live="polite"></div>
      <div class="scrim" data-close></div>
      <div class="searchbar" id="searchbar" role="dialog" aria-label="Search" inert>
        <div class="wrap-wide">
          <div style="display:flex;align-items:center;gap:16px">
            <input id="sinput" placeholder="Try: something sweet for winter" aria-label="Search fragrances" autocomplete="off">
            <button class="icon-btn" data-close aria-label="Close search">${I.close}</button>
          </div>
          <p class="mono muted" style="margin:14px 0 0">Ask in plain language — mood, season, intensity or note</p>
          <div class="sresults" id="sresults"></div>
        </div>
      </div>
      <aside class="drawer" id="cartdrawer" role="dialog" aria-label="Your journey" inert>
        <div class="drawer-hd">
          <div><div class="eyebrow" style="margin:0">Your journey</div><h3 style="font-size:24px">The Bag</h3></div>
          <button class="icon-btn" data-close aria-label="Close cart">${I.close}</button>
        </div>
        <div class="drawer-bd" id="cartbody"></div>
        <div class="drawer-ft" id="cartfoot"></div>
      </aside>`);
  }

  /* ── OVERLAYS ────────────────────────────────────────────── */
  /* the panels slide in from off-screen, so a closed one is invisible but still in the tab order:
     `inert` takes it out, and takes the page behind out while a panel is open. */
  let lastFocus = null;
  const inertBg = keep => [].forEach.call(document.body.children, el => {
    if (el === keep || el.id === 'toasts' || el.classList.contains('scrim')) return;
    if (keep) el.setAttribute('inert', ''); else el.removeAttribute('inert');
  });
  function openOverlay(what) {
    lastFocus = document.activeElement;
    const el = what === 'cart' ? $('#cartdrawer') : $('#searchbar');
    if (what === 'cart') renderCart();
    $('.scrim').classList.add('on');
    el.classList.add('on'); el.removeAttribute('inert'); el.setAttribute('aria-modal', 'true');
    inertBg(el);
    document.body.style.overflow = 'hidden';
    setTimeout(() => { const f = what === 'search' ? $('#sinput') : el.querySelector('[data-close]'); if (f) f.focus(); }, 120);
  }
  function closeOverlay() {
    if (!$('.scrim').classList.contains('on')) return;
    $('.scrim').classList.remove('on');
    inertBg(null);                                   // wakes the page up — then the panels go back to sleep
    ['#cartdrawer', '#searchbar'].forEach(sel => {
      const el = $(sel);
      el.classList.remove('on'); el.setAttribute('inert', ''); el.removeAttribute('aria-modal');
    });
    document.body.style.overflow = '';
    if (lastFocus && lastFocus.focus && lastFocus !== document.body) lastFocus.focus();
    else if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    lastFocus = null;
  }
  function toast(msg, kind) {
    const w = $('#toasts'); if (!w) return;
    const t = document.createElement('div');
    t.className = 'toast' + (kind ? ' ' + kind : '');
    t.innerHTML = msg;
    w.appendChild(t);
    setTimeout(() => { t.style.transition = 'opacity .4s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 420); }, 2600);
  }

  /* ── POINTS ──────────────────────────────────────────────── */
  function award(pts, label) {
    if (!pts) return;
    const s = S();
    s.points += pts;
    s.ledger.unshift({ pts, label, at: Date.now() });
    save();
    toast('+' + num(pts) + ' ODYS POINT' + (pts > 1 ? 'S' : ''), 'pts');
    const hit = C.rewards.filter(r => r.pts <= s.points && r.pts > s.points - pts);
    if (hit.length) toast(T('Journey complete') + ' — ' + T(hit[hit.length - 1].name));
  }
  function awardOnce(key, pts, label) {
    const s = S();
    if (s.ledger.some(l => l.key === key)) return false;
    s.points += pts; s.ledger.unshift({ pts, label, key, at: Date.now() }); save();
    toast('+' + num(pts) + ' ODYS POINTS', 'pts');
    return true;
  }

  /* ── CART ────────────────────────────────────────────────── */
  /* A line is a snapshot: it carries its own price and points so grams and
     coffret compositions survive a price change or a catalogue edit. */
  function lineOf(p, opts) {
    opts = opts || {};
    const grams = p.type === 'oud' ? (opts.grams || C.oud.minGrams) : null;
    return {
      key: p.id + (grams ? ':' + grams + 'g' : ''),
      id: p.id, kind: p.type, title: p.name, code: p.code,
      sub: p.type === 'oud' ? grams + ' g de bâtonnets' : (p.volume + ' ' + (p.unit || 'ML') + (p.type === 'diffuseur' ? ' · 3 sticks' : '')),
      grams, unit: priceOf(p, grams), points: unitPoints(p, grams),
      qty: opts.qty || 1, c: p.c
    };
  }
  function addLine(line) {
    const s = S(), ex = s.cart.find(l => l.key === line.key);
    if (ex) ex.qty += line.qty; else s.cart.push(line);
    save();
    toast('Added to journey — ' + esc(line.title));
    openOverlay('cart');
  }
  function add(id, opts) {
    const p = find(id); if (!p) return;
    addLine(lineOf(p, opts));
  }
  function setQty(key, q) {
    const s = S(), line = s.cart.find(l => l.key === key); if (!line) return;
    line.qty = q; if (line.qty < 1) s.cart = s.cart.filter(l => l.key !== key);
    save(); renderCart();
  }
  const subtotal = () => S().cart.reduce((n, l) => n + l.unit * l.qty, 0);
  const cartCount = () => S().cart.reduce((n, l) => n + l.qty, 0);
  const cartPoints = () => S().cart.reduce((n, l) => n + (l.points || 0) * l.qty, 0);
  const cartPointsAwarded = () => Math.round(cartPoints());

  /* vouchers earned by redeeming points, applied against the bag */
  function rewardDiscount(cart, vouchers) {
    let discount = 0; const used = [];
    let perfumeUnits = cart.filter(l => l.kind === 'parfum').reduce((n, l) => n + l.qty, 0);
    let diffUnits = cart.filter(l => l.kind === 'diffuseur').reduce((n, l) => n + l.qty, 0);
    (vouchers || []).forEach(v => {
      if (v.type === 'perfume') {
        const n = Math.min(v.qty, perfumeUnits);
        if (n > 0) { discount += n * C.prices.perfume50; perfumeUnits -= n; used.push({ v, label: n + ' × free perfume' }); }
      }
      if (v.type === 'diffuseur') {
        const n = Math.min(v.qty, diffUnits);
        if (n > 0) { discount += n * C.prices.diffuseur50; diffUnits -= n; used.push({ v, label: n + ' × free diffuseur' }); }
      }
      if (v.type === 'coffret') {
        const line = cart.find(l => l.kind === 'coffret' && (l.items || 0) <= (v.maxItems || 99) && !used.some(u => u.line === l));
        if (line) { discount += line.unit; used.push({ v, line, label: 'Free coffret — ' + line.title }); }
      }
      // a sample costs nothing to apply — it rides along with the order
      if (v.type === 'sample' && cart.length) used.push({ v, label: 'Discovery vial added to this order' });
    });
    return { discount, used };
  }

  /* ── WHATSAPP ORDERING ───────────────────────────────────
     The launch channel: no backend, no payment gateway. The cart is serialised
     into a wa.me message; the shop replies, confirms and ships cash on delivery. */
  const waHref = text => 'https://wa.me/' + C.whatsapp + (text ? '?text=' + encodeURIComponent(text) : '');
  function waLink(info) {
    const s = S(), sub = subtotal();
    const r = rewardDiscount(s.cart, s.vouchers || []);
    const ship = (sub - r.discount) >= C.freeShipFrom || r.discount ? 0 : 35;
    const lines = s.cart.map(l => '• ' + l.qty + ' × ' + l.title + (l.sub ? ' (' + l.sub + ')' : '') + ' — ' + money(l.unit * l.qty));
    const msg = [
      T('Hello ODYS, I would like to order:'), '',
      lines.join('\n'), '',
      T('Subtotal') + ': ' + money(sub),
      r.discount ? T('Rewards applied') + ': − ' + money(r.discount) : null,
      T('Shipping') + ': ' + (ship ? money(ship) : T('Free')),
      T('Total') + ': ' + money(Math.max(0, sub - r.discount) + ship), '',
      T('Name') + ': ' + ((info && info.name) || ''),
      T('Address') + ': ' + ((info && info.addr) || ''),
      T('City') + ': ' + ((info && info.city) || '')
    ].filter(x => x !== null).join('\n');
    return waHref(msg);
  }

  function wish(id) {
    const s = S(), i = s.wishlist.indexOf(id);
    if (i > -1) s.wishlist.splice(i, 1); else { s.wishlist.push(id); toast('Saved to wishlist'); }
    save();
  }

  function renderCart() {
    const body = $('#cartbody'), foot = $('#cartfoot'); if (!body) return;
    const s = S(), items = s.cart;
    if (!items.length) {
      body.innerHTML = `<div class="center" style="padding:60px 0">
        <p class="eyebrow">Nothing yet</p>
        <h3 style="font-size:26px;margin-bottom:12px">Your journey hasn't started</h3>
        <p class="muted" style="font-size:14px">A 50 ML parfum is ${money(C.prices.perfume50)} — and one point closer to a free one.</p>
        <a class="btn" href="shop.html" style="margin-top:18px">Discover parfums</a></div>`;
      foot.innerHTML = '';
      return;
    }
    body.innerHTML = items.map(l => `<div class="li">
        <div class="thumb" style="--c1:${l.c[0]};--c2:${l.c[1]}">${bottle(find(l.id) || { c: l.c, code: l.code, type: l.kind }, { k: 'd' })}</div>
        <div>
          <div class="card-code">${esc(l.code || 'COFFRET')}</div>
          <div style="font-family:var(--display);font-size:19px">${esc(l.title)}</div>
          <div class="card-meta">${esc(l.sub)}</div>
          ${l.points ? `<div class="mono" style="color:var(--accent);margin-top:4px">+${ptsLabel(l.points * l.qty)} ${ptsWord(l.points * l.qty)}</div>` : ''}
          <div class="qty" style="margin-top:8px">
            <button data-qty="${l.key}" data-d="-1" aria-label="Decrease">−</button>
            <span>${l.qty}</span>
            <button data-qty="${l.key}" data-d="1" aria-label="Increase">+</button>
          </div>
        </div>
        <div class="price">${money(l.unit * l.qty)}</div>
      </div>`).join('');

    const sub = subtotal(), pts = cartPointsAwarded(), after = s.points + pts;
    const nxt = nextReward(after), ship = sub >= C.freeShipFrom ? 0 : 35;
    foot.innerHTML = `
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:8px"><span class="muted">Subtotal</span><b>${money(sub)}</b></div>
      <div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:14px"><span class="muted">Shipping</span><b>${ship ? money(ship) : 'Free'}</b></div>
      <div class="box" style="padding:14px;margin-bottom:14px;background:transparent">
        <div class="mono" style="color:var(--accent)">${pts ? "You'll earn " + pts + ' point' + (pts > 1 ? 's' : '') : 'No points on diffuseurs'}</div>
        <div class="bar" style="margin:10px 0 8px"><i style="width:${Math.min(100, after / (nxt ? nxt.pts : after || 1) * 100)}%"></i></div>
        <div class="bar-labels"><span>${after} pts</span><span>${nxt ? (nxt.pts - after) + ' → ' + T(nxt.name) : T('All rewards unlocked')}</span></div>
      </div>
      <a class="btn btn-block" href="cart.html">Checkout · ${money(sub + ship)}</a>
      <a class="link-u" href="coffrets.html" style="display:block;text-align:center;margin-top:14px;border:0">Make it a coffret instead</a>`;
  }

  /* ── PAINT ───────────────────────────────────────────────── */
  function paint() {
    const s = S(), c = cartCount();
    $$('[data-cartcount]').forEach(e => { e.textContent = c; e.classList.toggle('hide', !c); });
    $$('[data-wishcount]').forEach(e => { e.textContent = s.wishlist.length; e.classList.toggle('hide', !s.wishlist.length); });
    $$('[data-pts]').forEach(e => { e.textContent = num(s.points); });
    $$('.card-wish').forEach(b => b.classList.toggle('on', s.wishlist.includes(b.dataset.wish)));
    // pages mark the active tab / pill with .on; mirror that for screen readers
    $$('button.tab').forEach(t => t.setAttribute('aria-selected', t.classList.contains('on')));
    $$('button.pill:not([data-mood]):not([data-exp])').forEach(t => {     // shop filters manage their own
      if (t.parentElement.querySelector('.pill.on')) t.setAttribute('aria-pressed', t.classList.contains('on'));
    });
    document.dispatchEvent(new CustomEvent('odys:state'));
  }

  /* ── PRODUCT CARD ────────────────────────────────────────── */
  function card(p, opt) {
    opt = opt || {};
    const isCoffret = !!p.slots || p.custom;
    if (isCoffret) {
      return `<a class="card" href="coffrets.html#${p.id}">
        <span class="card-media" style="--c1:${p.c[0]};--c2:${p.c[1]}">${bottle({ c: p.c, code: 'COFFRET', type: 'parfum', id: p.id })}</span>
        <span class="card-body">
          <span class="card-code">COFFRET</span>
          <span class="card-name" style="display:block">${esc(p.name)}</span>
          <span class="card-meta">${esc(p.sub)}</span>
          <span class="card-foot"><span class="price">Composez-le</span></span>
        </span></a>`;
    }
    const notes = p.notes ? [p.notes.top[0], (p.notes.heart || [])[0], (p.notes.base || [])[0]].filter(Boolean).map(T).join(' · ')
      : (p.oud ? T(p.oud.oudType) + ' · ' + T(p.oud.grade) : '');
    const tag = (p.tags || []).includes('limited') ? 'Limited' : ((p.tags || []).includes('new') ? 'New' : '');
    const href = 'product.html?id=' + p.id;
    const price = p.type === 'oud'
      ? `${money(gramPrice(p, C.oud.minGrams))} <small class="muted" style="font-size:11px">/ ${C.oud.minGrams} g</small>`
      : money(p.price);
    const pts = unitPoints(p);
    return `<article class="card">
      <a href="${href}" class="card-media" style="--c1:${p.c[0]};--c2:${p.c[1]}" aria-label="${esc(p.name)}">
        ${opt.rank ? `<span class="card-rank">${String(opt.rank).padStart(2, '0')}</span>` : ''}
        ${tag ? `<span class="card-tag">${tag}</span>` : ''}
        ${bottle(p)}
        <span class="card-fam">${esc(T(p.family || ''))}<small class="card-notes">${esc(notes)}</small></span>
      </a>
      <button class="card-wish" data-wish="${p.id}" aria-label="Add ${esc(p.name)} to wishlist">${I.heart}</button>
      <div class="card-body">
        <div class="card-code">${esc(p.code || '')}</div>
        <h3 class="card-name"><a href="${href}">${esc(p.name)}</a></h3>
        <div class="card-meta">${p.type === 'oud' ? T('Bâtonnets · au gramme') : esc(T(p.concentration || p.family)) + ' · ' + p.volume + ' ' + (p.unit || 'ML')}</div>
        <div class="card-foot">
          <span class="price">${price}</span>
          ${C.showRatings && p.rating ? `<span class="stars">${stars(p.rating)}<small>${p.reviews}</small></span>` : ''}
        </div>
        <div class="card-pts ${pts ? '' : 'off'}">${pts ? '+' + ptsLabel(pts) + ' ' + ptsWord(pts) + (p.type === 'oud' ? ' / ' + C.oud.minGrams + ' g' : '') : T('Hors programme points')}</div>
        <div class="card-acts">
          <button class="card-add" data-add="${p.id}">${p.type === 'oud' ? 'Choose a weight' : 'Add to journey'}</button>
          <a class="card-gift" href="coffrets.html?offrir=${p.id}" aria-label="Give to someone" title="Give to someone">${I.gift}</a>
        </div>
      </div>
    </article>`;
  }

  /* ── SEMANTIC-ISH SEARCH ─────────────────────────────────── */
  const SYN = {
    sweet: p => p.profile ? p.profile.sweetness >= 4 : (p.sensory && p.sensory.sweet >= 4),
    fresh: p => p.profile ? p.profile.freshness >= 4 : false,
    strong: p => p.profile ? p.profile.intensity >= 5 : true,
    powerful: p => p.profile ? p.profile.intensity >= 5 : true,
    soft: p => p.profile ? p.profile.intensity <= 3 : false,
    light: p => p.profile ? p.profile.intensity <= 3 : false,
    winter: p => (p.season || []).includes('Winter'),
    summer: p => (p.season || []).includes('Summer'),
    spring: p => (p.season || []).includes('Spring'),
    autumn: p => (p.season || []).includes('Autumn'),
    masculine: p => p.gender === 'Masculine' || p.gender === 'Unisex',
    feminine: p => p.gender === 'Feminine' || p.gender === 'Unisex',
    men: p => p.gender === 'Masculine' || p.gender === 'Unisex',
    women: p => p.gender === 'Feminine' || p.gender === 'Unisex',
    night: p => (p.experience || []).includes('night') || (p.occasion || []).includes('Evening'),
    office: p => (p.occasion || []).includes('Work'),
    work: p => (p.occasion || []).includes('Work'),
    home: p => p.type === 'diffuseur',
    maison: p => p.type === 'diffuseur',
    room: p => p.type === 'diffuseur',
    diffuser: p => p.type === 'diffuseur',
    diffuseur: p => p.type === 'diffuseur',
    stick: p => p.type === 'oud',
    sticks: p => p.type === 'oud',
    gift: p => (p.tags || []).includes('gifts'),
    everyday: p => (p.occasion || []).includes('Everyday'),
    oud: p => p.type === 'oud' || (p.mood || []).includes('oud'),
    clean: p => (p.mood || []).includes('musky') || (p.family || '').includes('Clean')
  };
  /* FR / AR query words → the English vocabulary the catalogue is written in.
     French is the default language, so a French query has to work as well as an English one. */
  const QMAP = {
    // français
    sucre: 'sweet', sucré: 'sweet', sucrée: 'sweet', gourmand: 'sweet', frais: 'fresh', fraîche: 'fresh', fraiche: 'fresh',
    fraicheur: 'fresh', fraîcheur: 'fresh', fort: 'strong', puissant: 'powerful', intense: 'powerful', léger: 'light',
    leger: 'light', légère: 'light', discret: 'soft', doux: 'soft', hiver: 'winter', été: 'summer', ete: 'summer',
    printemps: 'spring', automne: 'autumn', homme: 'masculine', masculin: 'masculine', femme: 'feminine',
    féminin: 'feminine', soir: 'night', soirée: 'night', nuit: 'night', bureau: 'office', travail: 'work',
    cadeau: 'gift', offrir: 'gift', maison: 'home', salon: 'home', chambre: 'home', diffuseurs: 'diffuseur',
    bâtonnet: 'sticks', bâtonnets: 'sticks', batonnets: 'sticks', encens: 'sticks', bakhour: 'sticks', bakhoor: 'sticks',
    bois: 'wood', boisé: 'woody', fleur: 'floral', fleurs: 'floral', fleuri: 'floral', ambré: 'amber', ambre: 'amber',
    épicé: 'spicy', epice: 'spicy', vanille: 'vanilla', musc: 'musk', musqué: 'musk', agrumes: 'lemon', citron: 'lemon',
    menthe: 'mint', figue: 'fig', cèdre: 'cedar', cedre: 'cedar', jasmin: 'jasmine', tabac: 'tobacco', miel: 'honey',
    safran: 'saffron', propre: 'clean', quotidien: 'everyday',
    // العربية (after the article ال is stripped)
    حلو: 'sweet', حلوة: 'sweet', منعش: 'fresh', انتعاش: 'fresh', قوي: 'powerful', خفيف: 'light', هادئ: 'soft',
    شتاء: 'winter', صيف: 'summer', ربيع: 'spring', خريف: 'autumn', رجالي: 'masculine', رجل: 'masculine',
    نسائي: 'feminine', امرأة: 'feminine', ليل: 'night', مساء: 'night', عمل: 'work', مكتب: 'office', هدية: 'gift',
    منزل: 'home', بيت: 'home', صالون: 'home', مبخرة: 'diffuseur', مبخّرة: 'diffuseur', عود: 'oud', أعواد: 'sticks',
    بخور: 'sticks', ورد: 'rose', عنبر: 'amber', مسك: 'musk', خشب: 'wood', خشبي: 'woody', زهري: 'floral',
    زهور: 'floral', فانيليا: 'vanilla', زعفران: 'saffron', نعناع: 'mint', تين: 'fig', شرقي: 'oriental', نظيف: 'clean'
  };
  // Arabic glues prepositions and the article onto the word; peel them only when what's left is a known word
  const AR_PREFIX = ['وال', 'بال', 'لل', 'ال', 'و', 'ب', 'ل'];
  function arStem(w) {
    if (!/^\p{Script=Arabic}/u.test(w) || QMAP[w]) return w;
    for (const pre of AR_PREFIX) {
      const rest = w.slice(pre.length);
      if (w.startsWith(pre) && rest.length >= 3 && QMAP[rest]) return rest;
    }
    return w;
  }
  function queryWords(q) {
    return q.toLowerCase().split(/[^\p{L}\p{N}]+/u)
      .map(arStem)                                                       // للشتاء → شتاء, وعود → عود
      .map(w => w.replace(/^(l|d|qu)['’]/, ''))                          // French elision: l'hiver → hiver
      .filter(w => w.length > 2 || /^\p{Script=Arabic}{3}$/u.test(w))
      .map(w => QMAP[w] || w);
  }

  function search(q) {
    const words = queryWords(q);
    if (!words.length) return [];
    return D.products.map(p => {
      const hay = [p.name, p.code, p.family, p.subtype, p.gender, p.story, p.room,
      (p.tags || []).join(' '), (p.mood || []).join(' '), (p.experience || []).join(' '),
      p.notes ? [].concat(p.notes.top, p.notes.heart || [], p.notes.base || []).join(' ') : '',
      p.oud ? [p.oud.origin, p.oud.oudType, p.oud.grade, p.oud.character].join(' ') : ''
      ].join(' ').toLowerCase();
      let score = 0;
      words.forEach(w => {
        // intent (sweet / winter / maison) outranks an incidental word match in the copy
        if (hay.includes(w)) score += 2;
        if (SYN[w] && SYN[w](p)) score += 3;
      });
      return { p, score };
    }).filter(x => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 8).map(x => x.p);
  }

  /* ── REVEAL ──────────────────────────────────────────────── */
  function observe() {
    const io = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('in');
      $$('.meter i, .bar i', e.target).forEach(b => { if (b.dataset.w) b.style.width = b.dataset.w + '%'; });
      io.unobserve(e.target);
    }), { threshold: .18, rootMargin: '0px 0px -40px' });
    $$('.rv, .jstep, .note-tier, .pts-hero, .profile-row').forEach(el => io.observe(el));
  }

  /* ── QUIZ ────────────────────────────────────────────────── */
  const QUESTIONS = [
    {
      k: 'mood', q: 'What do you want to smell like?', hint: 'Pick the world you want to live in.',
      opts: [['fresh', '🌿', 'Fresh'], ['floral', '🌹', 'Floral'], ['woody', '🪵', 'Woody'], ['amber', '🔥', 'Amber'],
      ['oud', '🖤', 'Oud'], ['gourmand', '🍯', 'Gourmand'], ['spicy', '🌶', 'Spicy'], ['oriental', '🌙', 'Oriental']]
    },
    {
      k: 'intensity', q: 'How intense?', hint: 'How much room should it take?',
      opts: [['2', '', 'Soft', 'Close to skin'], ['3', '', 'Balanced', 'Arm’s length'], ['4', '', 'Powerful', 'Enters before you'], ['5', '', 'Beast Mode', 'Stays on the coat']]
    },
    {
      k: 'when', q: 'When will you wear it?', hint: 'Be honest — most of us buy for one life and live another.',
      opts: [['Everyday', '', 'Everyday'], ['Work', '', 'Work'], ['Evening', '', 'Evening'], ['Special Occasion', '', 'Special Occasion']]
    }
  ];
  function recommend(a) {
    return D.parfums.map(p => {
      let s = 0;
      if ((p.mood || []).includes(a.mood)) s += 6;
      if (p.profile) s += 4 - Math.abs(p.profile.intensity - Number(a.intensity));
      if ((p.occasion || []).includes(a.when)) s += 3;
      s += p.rating - 4.5;
      return { p, s };
    }).sort((x, y) => y.s - x.s).slice(0, 3).map(x => x.p);
  }
  function mountQuiz(el) {
    let step = 0; const answers = {};
    function draw() {
      if (step >= QUESTIONS.length) {
        const recs = recommend(answers), hero = recs[0];
        const s = S(); s.quiz = answers; save();
        el.innerHTML = `<div class="quiz-step center">
          <p class="eyebrow">Based on your choices, your ODYS is</p>
          <h3 class="d2" style="margin-bottom:6px">${esc(hero.code)} — ${esc(hero.name)}</h3>
          <p class="lede" style="margin:0 auto 26px">${esc(hero.story)}</p>
          <div class="grid grid-3 grid-1-sm" style="text-align:left;margin-bottom:30px">${recs.map((p, i) => card(p, { rank: i + 1 })).join('')}</div>
          <a class="btn" href="product.html?id=${hero.id}">Discover your fragrance</a>
          <button class="btn btn-ghost" data-requiz style="margin-left:10px">Start over</button>
        </div>`;
        paint();
        return;
      }
      const Q = QUESTIONS[step];
      el.innerHTML = `<div class="quiz-step">
        <p class="eyebrow">Step ${step + 1} of ${QUESTIONS.length}</p>
        <h3 class="d3">${Q.q}</h3>
        <p class="muted" style="font-size:14px;margin-top:8px">${Q.hint}</p>
        <div class="quiz-opts">
          ${Q.opts.map(o => `<button class="opt" data-v="${o[0]}">
            ${o[1] ? `<span class="em">${o[1]}</span>` : ''}
            <span class="lb">${o[2]}</span>${o[3] ? `<span class="sub">${o[3]}</span>` : ''}
          </button>`).join('')}
        </div>
        <div class="quiz-prog">${QUESTIONS.map((_, i) => `<i class="${i <= step ? 'on' : ''}"></i>`).join('')}</div>
      </div>`;
      $$('.opt', el).forEach(b => b.addEventListener('click', () => { answers[Q.k] = b.dataset.v; step++; draw(); }));
    }
    el.addEventListener('click', e => { if (e.target.closest('[data-requiz]')) { step = 0; draw(); } });
    draw();
  }

  /* ── DELEGATED EVENTS ────────────────────────────────────── */
  document.addEventListener('click', e => {
    const lg = e.target.closest('[data-lang]');
    if (lg && window.I18N) { I18N.set(lg.dataset.lang); return; }
    const open = e.target.closest('[data-open]');
    if (open) { openOverlay(open.dataset.open); return; }
    if (e.target.closest('[data-close]') || e.target.classList.contains('scrim')) { closeOverlay(); return; }
    const a = e.target.closest('[data-add]');
    if (a) {
      const p = find(a.dataset.add);
      // oud is sold by weight — send the customer to the weight picker instead of guessing
      if (p && p.type === 'oud' && !a.dataset.grams) { location.href = 'product.html?id=' + p.id; return; }
      add(a.dataset.add, { grams: Number(a.dataset.grams) || 0, qty: Number(a.dataset.qty) || 1 });
      return;
    }
    const w = e.target.closest('[data-wish]');
    if (w) { wish(w.dataset.wish); return; }
    const q = e.target.closest('[data-qty]');
    if (q) {
      const line = S().cart.find(l => l.key === q.dataset.qty);
      setQty(q.dataset.qty, (line ? line.qty : 0) + Number(q.dataset.d));
    }
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeOverlay(); });
  document.addEventListener('input', e => {
    if (e.target.id !== 'sinput') return;
    const res = search(e.target.value);
    $('#sresults').innerHTML = res.length ? res.map(p => card(p)).join('')
      : (e.target.value.length > 2 ? '<p class="muted">No match yet — try “oud”, “fresh summer”, “diffuseur for the salon”.</p>' : '');
    paint();
  });

  /* structured data for search engines — facts only, no ratings while those are demo data */
  function jsonLd(obj) {
    const s = document.createElement('script');
    s.type = 'application/ld+json';
    s.textContent = JSON.stringify(Object.assign({ '@context': 'https://schema.org' }, obj));
    document.head.appendChild(s);
  }

  /* last resort: whatever broke, the customer still gets a way to order */
  function bail(err) {
    console.error('ODYS: page script failed —', err);
    document.documentElement.classList.add('no-rv');   // reveal-on-scroll never ran, so nothing would be visible
    const m = $('#main') || document.body;
    if (m.textContent.trim().length > 400) return;
    m.insertAdjacentHTML('afterbegin',
      `<section class="section-sm"><div class="wrap center" style="max-width:560px">
        <p class="eyebrow">Something went wrong</p>
        <h1 class="d3">This page did not load properly.</h1>
        <p class="lede" style="margin:14px auto 24px">Reload it, or order straight from us — we answer on WhatsApp.</p>
        <a class="btn btn-wa" href="${waHref(T('Hello ODYS, the website would not load and I would like to order'))}" target="_blank" rel="noopener">Order on WhatsApp</a>
        <p style="margin-top:20px"><a class="link-u" href="index.html">Back to the home page</a></p>
      </div></section>`);
  }

  /* ── BOOT ────────────────────────────────────────────────── */
  function boot() {
    chrome();
    jsonLd({
      '@type': 'Organization', name: 'ODYS Parfum', alternateName: 'أوديس', url: location.origin + '/',
      address: { '@type': 'PostalAddress', addressLocality: 'Casablanca', addressCountry: 'MA' },
      contactPoint: { '@type': 'ContactPoint', telephone: '+' + C.whatsapp, contactType: 'customer service', areaServed: 'MA', availableLanguage: ['fr', 'ar', 'en'] }
    });
    paint();
    observe();
    $$('[data-quiz]').forEach(mountQuiz);
    // a throw in page code used to leave a blank page (and no way to order) — show the shop's number instead
    if (window.PAGE) try { window.PAGE(api); } catch (err) { bail(err); }
    $$('[data-smoke]').forEach(el => {
      el.innerHTML = Array.from({ length: 5 }, (_, i) =>
        `<i style="--x:${10 + i * 19}%;--s:${140 + i * 40}px;--d:${15 + i * 4}s;--dl:${i * 3}s"></i>`).join('');
    });
    $$('[data-particles]').forEach(el => {
      el.innerHTML = Array.from({ length: 14 }, () =>
        `<i style="--x:${Math.random() * 100}%;--y:${Math.random() * 100}%;--d:${8 + Math.random() * 10}s;--dl:${Math.random() * 6}s"></i>`).join('');
    });
    $$('[data-embers]').forEach(el => {
      el.innerHTML = Array.from({ length: 22 }, () =>
        `<i class="ember" style="left:${Math.random() * 100}%;bottom:${Math.random() * 30}%;--d:${9 + Math.random() * 12}s;--dx:${(Math.random() * 60 - 30)}px;animation-delay:${Math.random() * 10}s"></i>`).join('');
    });
  }

  const api = {
    D, C, $, $$, S, save, money, num, find, stars, esc, qs, T, card, bottle, add, addLine, lineOf, wish, toast,
    award, awardOnce, tierOf, nextReward, unlocked, subtotal, cartCount, cartPoints, cartPointsAwarded,
    pointsFor, ptsLabel, ptsWord, rewardDiscount, waLink, waHref, sticksFor, sticksLabel, jsonLd,
    gramPrice, gramRate, isSpecial, oudPoints, unitPoints, priceOf,
    search, paint, observe, recommend, mountQuiz, icons: I, setQty, closeOverlay, openOverlay, renderCart
  };
  window.OD = api;

  const start = () => { try { boot(); } catch (e) { bail(e); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
