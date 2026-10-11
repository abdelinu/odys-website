/*
 * Ce qui casse sur un telephone, et qu'on ne voit pas sur un ecran large.
 *
 * La boutique vend au Maroc, en paiement a la livraison, a une clientele
 * qui achete au telephone. Trois defauts y coutent des commandes et ne se
 * voient jamais en developpement :
 *
 *   1. le debordement horizontal — un seul element plus large que l'ecran
 *      et toute la page glisse de gauche a droite sous le pouce ; le texte
 *      sort du cadre a chaque defilement vertical un peu oblique ;
 *
 *   2. les cibles trop petites — en dessous de 44 px, un doigt rate. La
 *      regle est celle d'Apple et de WCAG 2.5.8 (24 px minimum, 44 px
 *      recommande). Un bouton « Ajouter au panier » rate, c'est une vente
 *      perdue sans trace dans les statistiques ;
 *
 *   3. les commandes sans nom — un bouton dont le libelle est une icone
 *      sans texte de remplacement n'existe pas pour un lecteur d'ecran, et
 *      n'a pas d'infobulle au doigt. C'est ainsi que les trois boutons de
 *      partage ont pu rester invisibles si longtemps.
 *
 * Il ne compte PAS comme debordement un element volontairement defilant —
 * un carrousel, une table a defilement — reconnu a son `overflow-x`.
 *
 * S'injecte dans la page, comme contraste_pages.js, apres avoir pose le
 * gabarit telephone :
 *
 *   await fetch('/odys-mobile.js').then(r => r.text()).then(t => eval(t))
 */
(function () {
  'use strict';

  var LARGEUR = document.documentElement.clientWidth;
  /* Deux reperes. 24 px est le plancher de WCAG 2.5.8 niveau AA : en
     dessous, c'est un defaut d'accessibilite. 44 px est la recommandation
     d'Apple et le niveau AAA : on l'exige des commandes du parcours
     d'achat, ou un doigt qui rate coute une vente. */
  var PLANCHER = 24;
  var CIBLE = 44;

  function sel(el) {
    return el.tagName.toLowerCase()
      + (el.id ? '#' + el.id : '')
      + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : '');
  }
  function visible(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var c = getComputedStyle(e);
      if (c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0) { return false; }
    }
    var r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0;
  }
  /* Un ancetre qui defile horizontalement a le droit d'etre plus large que
     l'ecran : c'est un carrousel, pas un debordement. */
  function dansUnDefilant(el) {
    for (var e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) {
      var o = getComputedStyle(e).overflowX;
      if (o === 'auto' || o === 'scroll' || o === 'hidden') { return true; }
    }
    return false;
  }

  /* ── 1. debordement ────────────────────────────────────────────────── */
  var deborde = [];
  var vus = new Set();
  document.querySelectorAll('body *').forEach(function (el) {
    if (!visible(el) || dansUnDefilant(el)) { return; }
    var r = el.getBoundingClientRect();
    /* La marge de 1 px absorbe les arrondis de sous-pixel. */
    if (r.right <= LARGEUR + 1 && r.left >= -1) { return; }
    var k = sel(el);
    if (vus.has(k)) { return; }
    vus.add(k);
    deborde.push({
      selecteur: k,
      gauche: Math.round(r.left),
      droite: Math.round(r.right),
      largeur: Math.round(r.width),
      texte: (el.textContent || '').trim().slice(0, 40)
    });
  });

  /* ── 2. cibles trop petites ────────────────────────────────────────── */
  var petites = [];
  var vues = new Set();
  document.querySelectorAll('a[href],button,input,select,textarea,[role="button"],[onclick]')
    .forEach(function (el) {
      if (!visible(el)) { return; }
      var t = (el.getAttribute('type') || '').toLowerCase();
      if (t === 'hidden') { return; }
      var r = el.getBoundingClientRect();
      /* Un lien dans un paragraphe se mesure a la ligne, pas au doigt :
         WCAG exempte explicitement le lien en cours de texte. */
      if (el.tagName === 'A' && el.parentElement
          && /^(P|LI|SPAN|SMALL|LABEL|TD)$/.test(el.parentElement.tagName)
          && el.parentElement.textContent.trim() !== el.textContent.trim()) { return; }
      if (r.width >= CIBLE && r.height >= CIBLE) { return; }
      /* La zone qu'on touche n'est pas toujours l'element : un bouton
         radio de 22 px enveloppe dans son <label> se declenche sur tout le
         libelle. PrestaShop ecrit exactement cela au tunnel — mesurer
         l'input seul y signalait quatre faux defauts par etape. */
      var zone = r;
      var lbl = el.closest('label');
      if (!lbl && el.id) {
        lbl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      }
      if (lbl) { zone = lbl.getBoundingClientRect(); }
      var par = el.parentElement;
      if (par && par.children.length === 1) {
        var pr = par.getBoundingClientRect();
        if (pr.width * pr.height > zone.width * zone.height) { zone = pr; }
      }
      if (zone.width >= CIBLE && zone.height >= CIBLE) { return; }
      var k = sel(el);
      if (vues.has(k)) { return; }
      vues.add(k);
      petites.push({
        selecteur: k,
        taille: Math.round(zone.width) + 'x' + Math.round(zone.height),
        sousLePlancher: zone.width < PLANCHER || zone.height < PLANCHER,
        texte: (el.textContent || el.value || el.getAttribute('aria-label') || '').trim().slice(0, 30)
      });
    });

  /* ── 3. commandes sans nom ─────────────────────────────────────────── */
  function nomAccessible(el) {
    var n = (el.getAttribute('aria-label') || '').trim();
    if (n) { return n; }
    var par = el.getAttribute('aria-labelledby');
    if (par) {
      var c = document.getElementById(par.split(/\s+/)[0]);
      if (c && c.textContent.trim()) { return c.textContent.trim(); }
    }
    if ((el.textContent || '').trim()) { return el.textContent.trim(); }
    if ((el.getAttribute('title') || '').trim()) { return el.getAttribute('title').trim(); }
    if (el.tagName === 'INPUT' && (el.value || '').trim()) { return el.value.trim(); }
    var img = el.querySelector('img[alt]');
    if (img && img.getAttribute('alt').trim()) { return img.getAttribute('alt').trim(); }
    var svg = el.querySelector('svg title, svg[aria-label]');
    if (svg) { return 'svg'; }
    if (el.id) {
      var lbl = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
      if (lbl && lbl.textContent.trim()) { return lbl.textContent.trim(); }
    }
    if (el.closest('label') && el.closest('label').textContent.trim()) { return 'label'; }
    return '';
  }
  var muets = [];
  var vum = new Set();
  document.querySelectorAll('a[href],button,input,select,textarea,[role="button"]')
    .forEach(function (el) {
      if (!visible(el)) { return; }
      if ((el.getAttribute('type') || '').toLowerCase() === 'hidden') { return; }
      if (nomAccessible(el)) { return; }
      var k = sel(el);
      if (vum.has(k)) { return; }
      vum.add(k);
      muets.push({ selecteur: k, html: el.outerHTML.slice(0, 90) });
    });

  /* ── 4. images sans texte de remplacement ──────────────────────────── */
  var sansAlt = [];
  document.querySelectorAll('img').forEach(function (im) {
    if (!visible(im)) { return; }
    if (im.getAttribute('alt') !== null) { return; }
    sansAlt.push({ selecteur: sel(im), src: (im.getAttribute('src') || '').split('/').pop().slice(0, 40) });
  });

  return {
    page: location.pathname,
    largeur: LARGEUR,
    /* scrollWidth seul ment : `body{overflow-x:hidden}` laisse la valeur
       enflee par le bandeau defilant alors que rien ne bouge sous le
       doigt. On exige que le defilement soit reellement possible. */
    defile: document.documentElement.scrollWidth > LARGEUR + 1
            && getComputedStyle(document.body).overflowX !== 'hidden'
            && getComputedStyle(document.documentElement).overflowX !== 'hidden',
    scrollWidth: document.documentElement.scrollWidth,
    deborde: deborde,
    petites: petites,
    muets: muets,
    sansAlt: sansAlt
  };
})();
