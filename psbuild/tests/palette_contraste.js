/*
 * La palette tient-elle le contraste sur ses propres fonds ?
 *
 * La boutique a trois ivoires, du plus clair au plus chaud :
 *
 *     --odys-cream          #F4EFE5   le sol de la page
 *     --odys-champagne      #E9E0CE   les bandeaux de section
 *     --odys-champagne-deep #DED2BA   les cartouches
 *
 * Une encre reglee sur le premier peut echouer sur le troisieme. C'est
 * arrive trois fois :
 *
 *     --odys-gold-text  #86683A   4,52:1 sur cream   mais 4,25 sur champagne
 *     --odys-gold-deep  #86683A   un second jeton pour le meme travail,
 *                                 oublie quand le premier a ete corrige
 *     --odys-muted      #6E645C   5,03:1 sur cream   mais 4,40 sur champagne
 *
 * Aucun de ces ecarts ne se voit a l'oeil sur une maquette : il faut les
 * calculer. Ce test le fait sur la feuille LIVREE, en resolvant les alias
 * entre jetons, pour que `--odys-mid:var(--odys-muted)` soit verifie comme
 * sa cible.
 *
 * Il releve en plus un defaut qui s'est produit une fois et qui ne se
 * rattrape pas a la lecture : une meme regle qui peint `color` et
 * `background` avec le MEME jeton. Contraste exactement 1:1 — « Livraison
 * offerte des 300 DH » etait rendue, et invisible.
 *
 *   node psbuild/tests/palette_contraste.js
 */
'use strict';

const fs = require('fs');
const path = require('path');

const CSS = path.join(__dirname, '..', '..', 'dist', 'odys-theme-ps8',
                      'themes', 'odys', 'assets', 'css', 'theme.css');

if (!fs.existsSync(CSS)) {
  console.error('  theme.css introuvable : lancez psbuild/build_theme.py d abord');
  process.exit(1);
}
// Les commentaires portent des `;` et des `:` : les laisser ferait lire
// une phrase francaise comme la valeur d'un jeton.
const css = fs.readFileSync(CSS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');

/* ── les jetons de :root, alias resolus ─────────────────────────────── */
// On ne lit QUE le bloc :root : les redefinitions scopees (sections
// sombres, page oud, ambiance) ont leur propre fond et sont hors sujet ici.
const racine = {};
for (const bloc of css.matchAll(/:root\s*\{([^}]*)\}/g)) {
  for (const m of bloc[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+)/g)) {
    racine[m[1]] = m[2].trim();
  }
}
function resous(v, profondeur) {
  if (profondeur > 8) { return null; }
  v = (v || '').trim();
  const alias = v.match(/^var\(\s*(--[\w-]+)\s*(?:,\s*([^)]+))?\)$/);
  if (alias) {
    const cible = racine[alias[1]];
    return resous(cible !== undefined ? cible : alias[2], profondeur + 1);
  }
  return /^#[0-9a-fA-F]{3,8}$/.test(v) ? v : null;
}
function rgb(hex) {
  let h = hex.slice(1);
  if (h.length === 3) { h = h.split('').map((c) => c + c).join(''); }
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function lin(v) {
  v /= 255;
  return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}
function lum(c) { return 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]); }
function ratio(a, b) {
  const x = lum(a) + 0.05, y = lum(b) + 0.05;
  return x > y ? x / y : y / x;
}

// Les encres qui ecrivent du texte courant, et les fonds clairs sur
// lesquels elles peuvent tomber.
const ENCRES = ['--odys-text', '--odys-muted', '--odys-mid',
                '--odys-gold-text', '--odys-gold-deep', '--odys-gold-encre'];
// Le seuil depend de ce que le fond porte reellement. Les deux premiers
// ivoires sont des aplats de page et de bandeau : du texte courant s'y
// ecrit, donc 4,5:1. Le troisieme n'apparait qu'une fois dans toute la
// feuille, comme borne finale d'un degrade decoratif a 158 degres ; ce qui
// l'atteint est un titre ou un grand chiffre, donc 3:1. Exiger 4,5 la
// obligerait a assombrir tout le texte secondaire du site pour un coin de
// degrade — l'auditeur DOM, qui lit les bornes des degrades, n'y a trouve
// aucun defaut.
const FONDS = [['--odys-cream', 4.5], ['--odys-champagne', 4.5],
               ['--odys-champagne-deep', 3]];

let rates = 0;
const fonds = [];
for (const [f, seuil] of FONDS) {
  const h = resous(racine[f], 0);
  if (!h) {
    console.log('  ECHEC ' + f.padEnd(24) + ' introuvable ou non resolu dans :root');
    rates++;
    continue;
  }
  fonds.push([f, rgb(h), seuil]);
}

for (const e of ENCRES) {
  if (racine[e] === undefined) { continue; }
  const h = resous(racine[e], 0);
  if (!h) {
    console.log('  ECHEC ' + e.padEnd(24) + ' non resolu : ' + racine[e]);
    rates++;
    continue;
  }
  const c = rgb(h);
  // La pire MARGE, pas le pire ratio : les seuils different d'un fond a
  // l'autre, et 4,1:1 contre 3 vaut mieux que 4,4:1 contre 4,5.
  let marge = Infinity, ou = '', vu = 0, seuilVu = 0;
  for (const [nom, bg, seuil] of fonds) {
    const r = ratio(c, bg);
    if (r - seuil < marge) { marge = r - seuil; ou = nom; vu = r; seuilVu = seuil; }
  }
  const bon = marge >= 0;
  if (!bon) { rates++; }
  console.log('  ' + (bon ? 'ok  ' : 'ECHEC') + ' ' + e.padEnd(24) + ' ' + h
              + '  ' + vu.toFixed(2) + ':1 au plus juste sur ' + ou
              + ' (seuil ' + seuilVu + ')');
}

/* ── une regle qui peint le texte et le fond du meme jeton ──────────── */
// Le `color` et le `background` d'une meme declaration : si les deux
// nomment le meme jeton, le texte est invisible, quelle que soit la valeur
// du jeton. Pas besoin de calculer : c'est 1:1 par construction.
let memeJeton = 0;
for (const m of css.matchAll(/\{([^{}]*)\}/g)) {
  const corps = m[1];
  const col = corps.match(/(?:^|;)\s*color\s*:\s*var\(\s*(--[\w-]+)/);
  const bg = corps.match(/(?:^|;)\s*background(?:-color)?\s*:\s*var\(\s*(--[\w-]+)/);
  if (col && bg && col[1] === bg[1]) {
    memeJeton++;
    console.log('  ECHEC texte et fond peints du meme jeton ' + col[1]);
    console.log('        ' + corps.replace(/\s+/g, ' ').trim().slice(0, 110));
  }
}
if (!memeJeton) {
  console.log('  ok   aucune regle ne peint le texte et le fond du meme jeton');
} else {
  rates += memeJeton;
}

console.log('');
if (rates) {
  console.error('  ' + rates + ' point(s) en echec : du texte serait dur a lire, ou invisible.');
  process.exit(1);
}
console.log('  La palette tient le contraste sur ses trois fonds clairs.');
