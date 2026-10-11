/*
 * Auditeur de contraste — a coller dans la console, ou injecte par le
 * navigateur pilote.
 *
 * Il parcourt chaque noeud de texte VISIBLE de la page, calcule la couleur
 * reellement composee derriere lui (en remontant les parents jusqu'a trouver
 * un fond opaque, et en tenant compte des fonds semi-transparents empiles),
 * puis compare au seuil WCAG : 3:1 pour un grand texte, 4,5:1 sinon.
 *
 * Pourquoi un auditeur et pas un oeil : la boutique a un mode « ambiance »
 * qui pose un fond sombre sur certaines fiches produit. La palette, elle, est
 * passee au clair. Les deux ne se sont jamais rencontres, et le resultat
 * n'est visible que sur les pages concernees — des diffuseurs, pas les
 * parfums qu'on regarde tout le temps.
 *
 * Il mesure aussi les pictogrammes peints au masque CSS — un bouton icone
 * dont l'encre tombe sous 3:1 se clique mais ne se voit pas — et releve les
 * libelles masques : un texte a font-size 0, technique
 * Bootstrap `.text-hide`, dont l'icone de remplacement n'existe pas. Le
 * contraste y est sans objet — le controle est simplement vide.
 *
 * Ce que l'auditeur NE voit pas : un texte pose sur une image. La luminance
 * d'une photo varie d'un pixel a l'autre ; c'est le role de
 * hero_contraste.py, qui recompose l'image pour de vrai.
 */
(function () {
  'use strict';

  function lin(v) {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  }
  function lum(c) {
    return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  }
  function parse(s) {
    var m = (s || '').match(/[\d.]+/g);
    if (!m) { return null; }
    return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]];
  }
  /* Le fond reel. Il rend une LISTE de couleurs, pas une seule : un
     degrade n'a pas de fond unique, et le texte doit tenir sur chacune de
     ses bornes. Sans cela, le bloc fidelite de la page Connexion — blanc
     sur un degrade vert fonce — etait compte comme blanc sur ivoire,
     1,15:1, alors qu'il se lit tres bien.

     Les fonds semi-transparents rencontres en remontant sont empiles
     jusqu'au premier fond opaque : un panneau a 6 % d'opacite passerait
     sinon pour transparent et le calcul serait faux. */
  function stopsDegrade(img) {
    if (!img || img === 'none' || !/gradient\(/.test(img)) { return null; }
    var out = [];
    var re = /rgba?\(([^)]+)\)/g, m;
    while ((m = re.exec(img))) {
      var v = m[1].split(/[,\s/]+/).filter(function (x) { return x !== ''; }).map(Number);
      if (v.length >= 3 && !isNaN(v[0])) {
        out.push([v[0], v[1], v[2], v.length > 3 ? v[3] : 1]);
      }
    }
    return out.length ? out : null;
  }
  function fond(el) {
    var pile = [];
    var bornes = null;
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var cs = getComputedStyle(e);
      var g = stopsDegrade(cs.backgroundImage);
      if (g) {
        /* Un degrade entierement transparent ne peint rien. */
        var vus = g.filter(function (c) { return c[3] > 0.02; });
        if (vus.length) { bornes = vus; break; }
      }
      var c = parse(cs.backgroundColor);
      if (!c || c[3] === 0) { continue; }
      pile.push(c);
      if (c[3] >= 0.999) { break; }
    }
    function aplatis(base) {
      var out = [base[0], base[1], base[2]];
      for (var i = pile.length - 1; i >= 0; i--) {
        var q = pile[i];
        out = [0, 1, 2].map(function (k) { return q[3] * q[k] + (1 - q[3]) * out[k]; });
      }
      return out;
    }
    if (bornes) {
      return bornes.map(function (b) {
        /* Une borne semi-transparente laisse voir le blanc de la page. */
        var sol = [0, 1, 2].map(function (k) { return b[3] * b[k] + (1 - b[3]) * 255; });
        return aplatis(sol);
      });
    }
    if (!pile.length) { return [[255, 255, 255]]; }
    var base = pile.pop();
    return [aplatis(base)];
  }
  function contraste(a, b) {
    var x = lum(a) + 0.05, y = lum(b) + 0.05;
    return x > y ? x / y : y / x;
  }

  function sel(el) {
    return el.tagName.toLowerCase()
      + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : '');
  }
  /* Une icone peut venir d'une image de fond, d'un pseudo-element, ou d'un
     <svg>/<img> enfant. Si aucune des trois n'est la, rien ne s'affiche. */
  function porteUneIcone(el) {
    var cibles = [getComputedStyle(el), getComputedStyle(el, '::before'),
                  getComputedStyle(el, '::after')];
    for (var i = 0; i < cibles.length; i++) {
      if (cibles[i].backgroundImage && cibles[i].backgroundImage !== 'none') { return true; }
      /* Le theme peint ses pictogrammes au masque, pas au fond : sans ce
         test, chaque bouton icone passerait pour une case vide. */
      var m = cibles[i].maskImage || cibles[i].webkitMaskImage;
      if (m && m !== 'none') { return true; }
      if (i > 0 && cibles[i].content && cibles[i].content !== 'none'
          && cibles[i].content !== 'normal' && cibles[i].content !== '""') { return true; }
    }
    if (el.querySelector('svg,img,canvas')) { return true; }
    var p = el.parentElement;
    if (p && getComputedStyle(p).backgroundImage !== 'none') { return true; }
    return false;
  }

  /* Un pictogramme peint au masque prend sa couleur de background-color, et
     `opacity` la dilue. WCAG 1.4.11 demande 3:1 pour une commande non
     textuelle. C'est par la qu'un bouton peut exister, se cliquer, et ne pas
     se voir. */
  function verifieIcone(el, cs, txt) {
    var m = cs.maskImage || cs.webkitMaskImage;
    if (!m || m === 'none') { return; }
    var encre = parse(cs.backgroundColor);
    if (!encre || encre[3] === 0) { return; }
    /* fond() rend une liste depuis qu'il sait lire un degrade ; pour une
       icone on garde la pire borne. */
    var fonds = fond(el.parentElement || el);
    var o = parseFloat(cs.opacity);
    var a = encre[3] * (isNaN(o) ? 1 : o);
    var c = Infinity, bg = null;
    fonds.forEach(function (cand) {
      var peint = [0, 1, 2].map(function (k) { return a * encre[k] + (1 - a) * cand[k]; });
      var v = contraste(peint, cand);
      if (v < c) { c = v; bg = cand; }
    });
    if (c < 3) {
      icones.push({
        texte: txt.slice(0, 44),
        selecteur: sel(el),
        contraste: +c.toFixed(2),
        seuil: 3,
        encre: cs.backgroundColor + ' a ' + cs.opacity,
        fond: 'rgb(' + bg.map(Math.round).join(',') + ')'
      });
    }
  }

  /* getComputedStyle ne regarde qu'un element : une modale fermee par
     `opacity:0` sur son conteneur laisse ses enfants a opacity 1. Il faut
     remonter. */
  function cache(el) {
    for (var e = el.parentElement; e && e.nodeType === 1; e = e.parentElement) {
      var c = getComputedStyle(e);
      if (c.visibility === 'hidden' || c.display === 'none' || +c.opacity === 0) { return true; }
      if (c.contentVisibility === 'hidden') { return true; }
      var r = e.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) { return true; }
      /* Le motif « hors-canvas » : un conteneur a overflow cache dont le
         contenu est translate ailleurs. */
      if ((c.overflow !== 'visible' || c.overflowY !== 'visible')
          && (r.bottom <= 0 || r.right <= 0)) { return true; }
    }
    return false;
  }

  /* Vrai si le texte repose sur une photographie plutot que sur un aplat.
     Un hero ne met pas l'image en background de la section : il pose une
     couche absolue par-dessus un fond de secours, et le texte vient
     au-dessus. L'image n'est donc pas un ancetre — c'est un frere. On
     cherche, a chaque etage, une couche positionnee qui couvre la boite et
     porte une image. */
  function couvertureImage(e) {
    var er = e.getBoundingClientRect();
    if (er.width < 2 || er.height < 2) { return false; }
    for (var i = 0; i < e.children.length; i++) {
      var k = e.children[i];
      var kc = getComputedStyle(k);
      if (kc.position !== 'absolute' && kc.position !== 'fixed') { continue; }
      var kr = k.getBoundingClientRect();
      if (kr.width < er.width * 0.8 || kr.height < er.height * 0.8) { continue; }
      if (/url\(/.test(kc.backgroundImage)) { return true; }
      if (k.querySelector('img,video,picture,canvas')) { return true; }
      if (k.tagName === 'IMG' || k.tagName === 'VIDEO' || k.tagName === 'CANVAS') { return true; }
    }
    return false;
  }
  /* Un entete colle et transparent n'a pas de fond a lui : il flotte
     au-dessus de ce qui defile dessous, donc au-dessus du hero en haut de
     page et d'un aplat plus bas. Mesure prise contre la couleur de la page,
     il rendait trois faux defauts sur l'accueil. L'etat colle, lui, pose un
     fond opaque et retombe dans le cas general. */
  function surChromeFlottant(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var c = getComputedStyle(e);
      var f = parse(c.backgroundColor);
      if (f && f[3] >= 0.999) { return false; }
      if (c.position === 'fixed' || c.position === 'sticky') { return true; }
    }
    return false;
  }
  function surImage(el) {
    for (var e = el; e && e.nodeType === 1; e = e.parentElement) {
      var c = getComputedStyle(e);
      if (/url\(/.test(c.backgroundImage)) { return true; }
      if (couvertureImage(e)) { return true; }
      var f = parse(c.backgroundColor);
      if (f && f[3] >= 0.999) { return false; }
    }
    return false;
  }

  var vus = new Set();
  var defauts = [];
  var surPhoto = 0;
  var masques = [];
  var icones = [];
  var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  var n;
  while ((n = walker.nextNode())) {
    var txt = (n.nodeValue || '').trim();
    if (txt.length < 2) { continue; }
    var el = n.parentElement;
    if (!el || vus.has(el)) { continue; }
    /* Un <text> SVG se peint par `fill`, pas par `color`, et son fond est un
       <rect> frere, pas un background. Les deux lectures seraient fausses :
       on laisse le SVG dehors plutot que d'inventer un chiffre. */
    if (el.ownerSVGElement || el.tagName === 'svg') { continue; }
    vus.add(el);

    var cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity === 0) { continue; }
    var r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) { continue; }
    /* Un panneau hors-ecran — menu mobile replie, tiroir ferme, modale a
       opacite nulle — contient du texte que personne ne voit. Mesurer son
       contraste produit un faux defaut par composant cache, et la liste
       devient illisible. On ne garde que ce qui est reellement a l'ecran :
       un parent transparent ou masque disqualifie l'enfant, et un element
       pousse au-dessus ou a gauche du document est hors du cadre. */
    if (cache(el) || r.bottom <= 0 || r.right <= 0) { continue; }
    /* Un titre pose sur une photographie n'a pas UN fond : il en a un par
       pixel. Le compter contre la couleur de la page donnait six faux
       defauts sur l'accueil, tous dans le hero. C'est hero_contraste.py qui
       mesure ce cas, en recomposant l'image pour de vrai. */
    if (surImage(el) || surChromeFlottant(el)) { surPhoto++; continue; }

    /* La technique Bootstrap `.text-hide` met font-size a 0 et compte sur une
       icone de fond pour porter le sens. Ce n'est pas un defaut de contraste
       — mais si l'icone manque, le bouton est une case vide. On le verifie
       au lieu de le signaler comme un contraste rate. */
    if (parseFloat(cs.fontSize) < 6) {
      if (!porteUneIcone(el)) {
        masques.push({
          texte: txt.slice(0, 44),
          selecteur: sel(el),
          parent: el.parentElement ? sel(el.parentElement) : ''
        });
      } else {
        verifieIcone(el, cs, txt);
      }
      continue;
    }

    var brut = parse(cs.color);
    if (!brut) { continue; }
    var taille = parseFloat(cs.fontSize);
    var gras = (parseInt(cs.fontWeight, 10) || 400) >= 700;
    var grand = taille >= 24 || (taille >= 18.66 && gras);
    var seuil = grand ? 3 : 4.5;

    /* Sur un degrade, le texte doit tenir sur chaque borne : on garde la
       pire. */
    var c = Infinity, bg = null;
    fond(el).forEach(function (cand) {
      var fg = brut;
      /* Un texte partiellement transparent se melange a son fond. */
      if (fg[3] < 1) {
        fg = [0, 1, 2].map(function (k) { return fg[3] * fg[k] + (1 - fg[3]) * cand[k]; });
      }
      var v = contraste(fg, cand);
      if (v < c) { c = v; bg = cand; }
    });
    if (c < seuil) {
      defauts.push({
        texte: txt.slice(0, 44),
        selecteur: el.tagName.toLowerCase() + (el.className ? '.' + String(el.className).trim().split(/\s+/).slice(0, 2).join('.') : ''),
        contraste: +c.toFixed(2),
        seuil: seuil,
        couleur: cs.color,
        fond: 'rgb(' + bg.map(Math.round).join(',') + ')'
      });
    }
  }
  defauts.sort(function (a, b) { return a.contraste - b.contraste; });
  return { page: location.pathname, controles: vus.size, defauts: defauts,
           masques: masques, icones: icones, surPhoto: surPhoto };
})();
