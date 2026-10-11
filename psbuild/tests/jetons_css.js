/*
 * Tout jeton CSS appele est-il defini quelque part ?
 *
 * `color:var(--odys-text)` sur un jeton qui n'existe pas ne provoque aucune
 * erreur : la declaration devient invalide a la valeur calculee, et la
 * propriete HERITE du parent. Le texte s'affiche donc — dans la couleur du
 * bloc qui l'entoure, qui est parfois celle de son propre fond.
 *
 * C'est ainsi que trois defauts ont ete trouves a la main sur cette
 * boutique :
 *
 *   --odys-mid    jamais defini : 18 regles tombaient sur un repli pale
 *                 (#8A8577) a 3,21:1 sur l'ivoire ;
 *   --odys-text   jamais defini : le fil d'Ariane de la page oud heritait
 *                 une encre sombre posee sur un fond sombre, 1,36:1 ;
 *   --amb-accent  defini pour une page sombre devenue claire : creme sur
 *                 creme, 1,07:1.
 *
 * Aucun validateur CSS ne les signale. Ce test, si.
 *
 * Un appel avec repli — var(--x,#333) — est legitime : le repli est la
 * valeur. Seul un appel nu sur un jeton inconnu est un defaut.
 *
 *   node psbuild/tests/jetons_css.js
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
const css = fs.readFileSync(CSS, 'utf8');

// Les definitions : `--nom:` en position de propriete.
const definis = new Set();
for (const m of css.matchAll(/(^|[{;\s])(--[\w-]+)\s*:/g)) {
  definis.add(m[2]);
}

// Les appels. On ne garde que les appels NUS : `var(--nom)` sans virgule
// avant la parenthese fermante. Un repli rend l'appel sain.
//                                    nom         pas de virgule  fin
const nus = new Map();
const lignes = css.split('\n');
lignes.forEach((ligne, i) => {
  for (const m of ligne.matchAll(/var\(\s*(--[\w-]+)\s*\)/g)) {
    const nom = m[1];
    if (definis.has(nom)) { continue; }
    if (!nus.has(nom)) { nus.set(nom, { n: 0, ligne: i + 1, exemple: '' }); }
    const e = nus.get(nom);
    e.n++;
    if (!e.exemple) {
      e.exemple = ligne.trim().slice(0, 100);
    }
  }
});

console.log('  %d jeton(s) defini(s), %d appel(s) nu(s) sur un jeton inconnu',
            definis.size, nus.size);
console.log('');

if (!nus.size) {
  console.log('  Aucun jeton fantome : chaque var() nu pointe sur une definition.');
  process.exit(0);
}

for (const [nom, e] of [...nus].sort((a, b) => b[1].n - a[1].n)) {
  console.log('  ECHEC ' + nom.padEnd(22) + ' ' + String(e.n).padStart(3)
              + ' appel(s), 1re ligne ' + e.ligne);
  console.log('        ' + e.exemple);
}
console.log('');
console.log('  Un var() nu sur un jeton inconnu fait HERITER la propriete du');
console.log('  parent : la couleur devient celle du bloc, parfois celle de son');
console.log('  propre fond. Definissez le jeton, ou donnez-lui un repli.');
process.exit(1);
