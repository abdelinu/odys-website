"""Poser un lot de traductions dans psbuild/traductions.json.

Les cles sont les phrases francaises, accents compris. Les retaper ici
ferait tot ou tard une cle qui ne correspond a rien : on les designe donc
par leur rang dans la liste des cles encore sans traduction, et le
programme va chercher la vraie cle dans le catalogue.

    python psbuild/_poser_traductions.py lot.json

lot.json : { "0": ["My cart", "سلّتي"], "1": [...] }
"""

import json
import pathlib
import sys

CATALOGUE = pathlib.Path(__file__).parent / "traductions.json"


def main():
    if len(sys.argv) < 2:
        return "usage: _poser_traductions.py lot.json"
    lot = json.loads(pathlib.Path(sys.argv[1]).read_text(encoding="utf-8"))
    cat = json.loads(CATALOGUE.read_text(encoding="utf-8"))
    vides = [k for k, v in cat["mots"].items() if not v.get("ar")]

    poses = 0
    for rang, (en, ar) in sorted(lot.items(), key=lambda kv: int(kv[0])):
        i = int(rang)
        if i >= len(vides):
            print("  rang %d hors liste (%d cles sans traduction)" % (i, len(vides)))
            continue
        cle = vides[i]
        if en:
            cat["mots"][cle]["en"] = en
        if ar:
            cat["mots"][cle]["ar"] = ar
        poses += 1

    CATALOGUE.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                         encoding="utf-8")
    reste = sum(1 for v in cat["mots"].values() if not v.get("ar"))
    print("  %d traductions posees, %d cles restantes" % (poses, reste))
    return 0


if __name__ == "__main__":
    sys.exit(main())
