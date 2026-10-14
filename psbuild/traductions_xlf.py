"""Les mots du theme, livres avec le theme.

PrestaShop ne va chercher en base que les domaines qu'il connait deja par un
fichier. Un domaine invente — ShopThemeOdys — n'existe pour lui que si le
theme livre son catalogue : des lignes posees en base sans ce fichier ne sont
jamais relues, et les trois langues servent le francais.

Les traductions voyagent donc avec le theme, en XLIFF, versionnees a cote du
code, et le Back Office peut toujours les reecrire par dessus : c'est le
rapport normal entre un theme et la boutique qui le porte.

La cle est la phrase francaise. Sans traduction, PrestaShop rend la cle : le
site francais ne depend d'aucun de ces fichiers et ne peut pas bouger.
"""

import json
import pathlib
from xml.sax.saxutils import escape, quoteattr

LOCALES = {"en": "en-US", "ar": "ar-SA"}


def ecrire(json_path, theme_dir):
    """Ecrit un .xlf par langue sous <theme>/translations/<locale>/.

    @return [(iso, nombre de mots), ...]
    """
    catalogue = json.loads(pathlib.Path(json_path).read_text(encoding="utf-8"))
    faits = []
    # Le domaine du theme, puis ceux de PrestaShop qu'on complete : « Cart »
    # et « Sign in » viennent de Shop.Theme.Actions, et le paquet arabe de
    # PrestaShop ne les traduit pas — il retombe sur l'anglais, en plein
    # milieu d'une page arabe. Un theme a le droit de les reecrire.
    paquets = [(catalogue["domaine"], catalogue["mots"])]
    for autre, mots_autre in catalogue.get("autres_domaines", {}).items():
        paquets.append((autre, mots_autre))

    for domaine, mots in paquets:
      for iso, locale in LOCALES.items():
          dossier = pathlib.Path(theme_dir) / "translations" / locale
          dossier.mkdir(parents=True, exist_ok=True)

          unites = []
          for i, (cle, versions) in enumerate(mots.items(), start=1):
              cible = versions.get(iso, "")
              if not cible:
                  continue
              unites.append(
                  "      <trans-unit id=%s resname=%s>"
                  % (quoteattr(str(i)), quoteattr(cle))
              )
              unites.append("        <source>%s</source>" % escape(cle))
              unites.append("        <target>%s</target>" % escape(cible))
              unites.append("      </trans-unit>")

          lignes = [
              '<?xml version="1.0" encoding="utf-8"?>',
              '<xliff xmlns="urn:oasis:names:tc:xliff:document:1.2" version="1.2">',
              '  <file source-language="fr-FR" target-language="%s"' % locale,
              '        datatype="plaintext" original="themes/odys">',
              "    <body>",
          ]
          lignes.extend(unites)
          lignes.extend(["    </body>", "  </file>", "</xliff>", ""])

          fichier = dossier / ("%s.%s.xlf" % (domaine, locale))
          fichier.write_text("\n".join(lignes), encoding="utf-8")
          faits.append((iso, len(unites) // 4))

    return faits


if __name__ == "__main__":
    ici = pathlib.Path(__file__).parent
    for iso, n in ecrire(ici / "traductions.json",
                         ici.parent / "dist" / "odys-theme-ps8" / "themes" / "odys"):
        print("  %s : %d mots" % (iso, n))
