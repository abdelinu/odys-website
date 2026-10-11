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
