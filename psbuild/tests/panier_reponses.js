/*
 * Le bouton « Ajouter au panier » dit-il la verite ?
 *
 * PrestaShop a trois facons de repondre a un ajout, relevees sur la boutique
 * de developpement :
 *
 *   1. l'ajout a eu lieu      {"success":true,  "quantity":1, cart:{...1 article}}
 *   2. le produit est epuise  {"hasError":true, "errors":[...], "quantity":0}
 *   3. le panier n'existe plus{"success":true,  "quantity":0, cart:{products:[]}}
 *
 * Le cas 2 n'a PAS de cle `success` : l'ancien test `if (resp && resp.success)`
 * tombait donc dans le vide, sans message, sans bouton qui bouge. Le cas 3 a
 * `success:true` alors que rien n'est entre : il affichait « Ajoute ! » sur un
 * panier reste vide.
 *
 * Ce test lit la condition dans le app.js REELLEMENT construit, pas une copie :
 * si quelqu'un la reecrit, le test suit ou casse.
 *
 *   node psbuild/tests/panier_reponses.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const APP = path.join(__dirname, '..', '..', 'dist', 'odys-theme-ps8',
                      'themes', 'odys', 'assets', 'js', 'app.js');

const src = fs.readFileSync(APP, 'utf8');

// On extrait les deux lignes qui decident, telles qu'elles sont livrees.
const mPlein = src.match(/var odysPlein = [^\n]+/);
const mCond = src.match(/if \(resp && resp\.success && !resp\.hasError[^\n]+/);
if (!mPlein || !mCond) {
  console.error('ECHEC : la condition du panier est introuvable dans app.js.');
  console.error('        Elle a ete renommee ou retiree — verifiez build_theme.py.');
  process.exit(1);
}

// `if (...) {` -> une expression evaluable
const expr = mCond[0].replace(/^if \(/, '').replace(/\) \{\s*$/, '');
const decide = new Function('resp', mPlein[0] + '; return (' + expr + ');');

const cas = [
  {
    nom: 'ajout reussi',
    resp: { success: true, quantity: 1, cart: { products: [{}], products_count: 1 } },
    attendu: true,
  },
  {
    nom: 'produit epuise (pas de cle success)',
    resp: { hasError: true, errors: ['Vous ne pouvez acheter que 0 "L\'Or".'], quantity: 0 },
    attendu: false,
  },
  {
    nom: 'panier disparu (success mais rien dedans)',
    resp: { success: true, quantity: 0, cart: { products: [], products_count: 0 } },
    attendu: false,
  },
  {
    nom: 'quantite mise a jour, panier non vide',
    resp: { success: true, quantity: 0, cart: { products: [{}], products_count: 2 } },
    attendu: true,
  },
  {
    nom: 'reponse vide',
    resp: null,
    attendu: false,
  },
];

let rates = 0;
for (const c of cas) {
  const obtenu = !!decide(c.resp);
  const ok = obtenu === c.attendu;
  if (!ok) { rates++; }
  console.log('  %s %s (attendu %s, obtenu %s)',
              ok ? 'ok  ' : 'ECHEC', c.nom, c.attendu, obtenu);
}

// Le contrat ne tient pas qu'a la condition : il faut aussi que la branche
// de succes efface le refus precedent, et que celle d'echec en pose un. Un
// message d'erreur qui survit a un ajout reussi ment au coup suivant.
const iCond = src.indexOf(mCond[0]);
const iElse = src.indexOf('} else {', iCond);
const succes = src.slice(iCond, iElse);
const echec = src.slice(iElse, iElse + 1400);

const structure = [
  ['la branche de succes efface le refus precedent', /\.cart-ko'\);[\s\S]{0,120}remove\(\)/.test(succes)],
  ['la branche de succes annonce le bandeau', /odysToast/.test(succes)],
  ['la branche d echec pose un message', /cart-ko/.test(echec)],
  ['la branche d echec lit la raison de PrestaShop', /resp\.errors/.test(echec)],
];
for (const [nom, ok] of structure) {
  if (!ok) { rates++; }
  console.log('  %s %s', ok ? 'ok  ' : 'ECHEC', nom);
}

console.log('');
if (rates) {
  console.error(rates + ' point(s) en echec : le bouton mentirait au client.');
  process.exit(1);
}
console.log((cas.length + structure.length) + ' points verifies, le bouton dit la verite.');
