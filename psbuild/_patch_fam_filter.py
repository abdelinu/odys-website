"""filterFam compte ce qui reste, le dit, et tient aria-pressed a jour.

Trois manques dans la version precedente :

  * aucun etat vide. Le filtre masque des cartes deja rendues ; quand il n'en
    restait aucune, la grille tombait a zero pixel sans un mot. Mesure sur le
    dev : douze combinaisons page/filtre faisaient cela, dont trois sur cinq
    sur Oud & Boukhour et trois sur cinq sur Coffrets.

  * aria-pressed n'etait jamais mis a jour. Seule la classe .on bougeait,
    donc un lecteur d'ecran annoncait toujours « Tout » comme le choix actif,
    quel que soit le bouton presse.

  * la recherche du conteneur passait par .closest('.sec, .page'), des
    classes que le gabarit de liste ne porte pas : le filtre retombait sur
    document a chaque fois. Sans consequence tant qu'il n'y a qu'une grille,
    mais c'est du code qui ment sur ce qu'il fait.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "filter: the empty result is announced" in s:
    sys.exit("already patched")

anchor = 'js_path.write_text(js, encoding="utf-8")\n'
if s.count(anchor) != 1:
    sys.exit("anchor found %dx" % s.count(anchor))

block = r'''
OLD_FILTERFAM = """function filterFam(btn, fam) {
  const container = btn.closest('.sec, .page') || document;
  container.querySelectorAll('.ff').forEach(b => b.classList.remove('on'));
  btn.classList.add('on');
  const grids = container.querySelectorAll('#featGrid, #collGrid');
  grids.forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      if (fam === 'all' || pc.dataset.fam.includes(fam)) pc.style.display = '';
      else { pc.style.display = 'none'; }
    });
  });
}"""
NEW_FILTERFAM = """function filterFam(btn, fam) {
  // le groupe auquel appartient le bouton, pas une classe que la page ne
  // porte pas : .closest('.sec, .page') retombait toujours sur document
  const group = btn.closest('.fam-filters');
  (group || document).querySelectorAll('.ff').forEach(b => {
    b.classList.remove('on');
    b.setAttribute('aria-pressed', 'false');   // seule .on bougeait avant,
  });                                          // un lecteur d'ecran lisait
  btn.classList.add('on');                     // toujours « Tout » actif
  btn.setAttribute('aria-pressed', 'true');

  var restants = 0;
  document.querySelectorAll('#featGrid, #collGrid').forEach(grid => {
    grid.querySelectorAll('.pc[data-fam]').forEach(pc => {
      var garde = (fam === 'all' || pc.dataset.fam.indexOf(fam) !== -1);
      pc.style.display = garde ? '' : 'none';
      if (garde) { restants += 1; }
    });
  });

  // Sans ceci la grille tombe a zero pixel et la boutique parait vide.
  var vide = document.getElementById('collEmpty');
  if (vide) { vide.hidden = (restants > 0); }
}"""
js, n = js.replace(OLD_FILTERFAM, NEW_FILTERFAM), js.count(OLD_FILTERFAM)
must(n == 1, "filter: the empty result is announced, aria-pressed follows")
'''

s = s.replace(anchor, block + "\n" + anchor, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: filterFam counts, announces, and updates aria-pressed")
