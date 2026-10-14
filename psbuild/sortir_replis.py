"""Sortir les phrases cachees dans un {else}...{/if}.

L'extracteur ne regarde que les noeuds de texte, entre > et <. Une phrase
ecrite comme repli — {if $x}{$x}{else}Nos collections{/if} — se trouve entre
une accolade fermante et une accolante ouvrante : il ne la voyait pas, et
elle restait en francais sur /ar/.

Les valeurs qui ne sont pas du texte (false, status, website, loading=…) ne
sont pas touchees : la liste est explicite.
"""
import json
import pathlib
import sys

RACINE = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else ".")
DOMAINE = "Shop.Theme.Odys"

PHRASES = [
    "Livraison offerte",
    "Nos collections",
    "Trouvez votre ODYS",
    "Quelle fragrance vous correspond ?",
    "Offre",
    "Format",
    "Quantité",
    "Élaboré au Maroc",
    "Paiement à la livraison",
    "Livraison 24–48h",
    "Retours sous 14 jours",
    "unité",
    "Cette sélection est vide pour le moment.",
    "Rechercher",
]


def smarty(phrase):
    return "{l s='" + phrase.replace("'", "\\'") + "' d='" + DOMAINE + "'}"


def main():
    sources = [RACINE / "psbuild" / "templates",
               RACINE / "ref" / "odys-theme-ps8" / "themes" / "odys" / "templates"]
    poses = 0
    for racine in sources:
        if not racine.exists():
            continue
        for p in sorted(racine.rglob("*.tpl")):
            s = p.read_text(encoding="utf-8")
            avant = s
            for phrase in PHRASES:
                vieux = "{else}" + phrase + "{/if}"
                if vieux in s:
                    s = s.replace(vieux, "{else}" + smarty(phrase) + "{/if}")
                    poses += 1
            if s != avant:
                p.write_text(s, encoding="utf-8")
                print("  %s" % p.relative_to(RACINE))

    cat_path = RACINE / "psbuild" / "traductions.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8"))
    neuves = [ph for ph in PHRASES if ph not in cat["mots"]]
    for ph in neuves:
        cat["mots"][ph] = {"en": "", "ar": ""}
    cat_path.write_text(json.dumps(cat, ensure_ascii=False, indent=2) + "\n",
                        encoding="utf-8")
    print("  %d replis sortis, %d nouvelles cles" % (poses, len(neuves)))
    for ph in neuves:
        print("   -", ph)
    return 0


if __name__ == "__main__":
    sys.exit(main())
