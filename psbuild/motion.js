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
