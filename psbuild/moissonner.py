"""Mettre au catalogue toute cle deja ecrite a la main dans un gabarit.

sortir_chaines.py n'ajoute que ce qu'il sort lui-meme. Les phrases entourees
a la main — le bandeau d'annonces, les mots du second visuel — portaient donc
un {l} sans ligne au catalogue : traduites nulle part, elles restaient en
francais sur /ar/ sans que rien ne le signale.
"""
import json
import pathlib
import re
import sys

RACINE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
CAT = RACINE / "psbuild" / "traductions.json"
TPL = RACINE / "dist" / "odys-theme-ps8" / "themes" / "odys" / "templates"

# [^}]*?d= : un {l} peut porter un sprintf=[...] entre sa phrase et son
# domaine, et un filtre apres. Sans cela, les phrases a parametre
# n etaient pas moissonnees : traduites nulle part, elles restaient en
# francais sur /en/ et /ar/ sans que rien ne le signale.
# [^}]* : un {l} peut porter un filtre — escape:'javascript' pour le
# dictionnaire que le gabarit pose a l'intention d'app.js. Sans cela
# ces cles n'etaient pas moissonnees, et ne partaient donc nulle part.
MOTIF = re.compile(r"""\{l s='((?:[^'\\]|\\.)*)'[^}]*?d='Shop\.Theme\.Odys'[^}]*\}""")

cat = json.loads(CAT.read_text(encoding="utf-8"))
mots = cat["mots"]
neuves = []
for p in sorted(TPL.rglob("*.tpl")):
    for m in MOTIF.finditer(p.read_text(encoding="utf-8", errors="replace")):
        cle = m.group(1).replace("\\'", "'")
        if cle not in mots:
            mots[cle] = {"en": "", "ar": ""}
            neuves.append(cle)

CAT.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("  cles moissonnees :", len(neuves))
for i, k in enumerate(neuves):
    print("  %2d| %s" % (i, " ".join(k.split())[:88]))
