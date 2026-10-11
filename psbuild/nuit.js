

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
