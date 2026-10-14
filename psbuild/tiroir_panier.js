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
      p.textContent = 'Votre panier est vide.';
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
        'Retirer un exemplaire de ' + prod.name],
       ['ot-nb', String(prod.quantity), null, null],
       ['ot-plus', '+', prod.up_quantity_url,
        'Ajouter un exemplaire de ' + prod.name],
       ['ot-oter', 'Retirer', prod.remove_from_cart_url,
        'Retirer ' + prod.name + ' du panier']
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
