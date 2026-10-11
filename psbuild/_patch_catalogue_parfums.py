"""Corrige les six pyramides et ajoute sept parfums.

Les pyramides venaient du prototype et ne correspondaient pas aux fragrances
dont la boutique s'inspire : L'Icone etait donnee pour un Sauvage masculin
alors que c'est un feminin inspire de L'Imperatrice, et les cinq autres
portaient des notes approchantes plutot que les vraies.

Les notes relevees le 5 octobre 2026 aupres de revendeurs et de bases
olfactives publiques. Ce sont des donnees de fait - ce que sent un parfum -
et non la prose d'un site : rien n'est recopie.

Les noms des sept nouveaux suivent la ligne existante : article defini +
substantif court, evocateur, sans reference a la marque d'origine.
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent
SRC = HERE / "catalogue.json"

# reference -> ce qui change
CORRECTIONS = {
    "01": {
        # L'Icone etait decrite comme un Sauvage pour homme ; c'est un feminin
        "inspired_by": "Dolce & Gabbana L'Impératrice",
        "gender": "femme",
        "family": "fresh",
        "notes_tete": "Kiwi, Rhubarbe, Poivre rose",
        "notes_coeur": "Pastèque, Cyclamen, Jasmin",
        "notes_fond": "Cédrat, Musc, Santal",
    },
    "07": {
        "inspired_by": "Jean Paul Gaultier Le Mâle Élixir",
        "notes_tete": "Lavande, Menthe",
        "notes_coeur": "Vanille, Benjoin",
        "notes_fond": "Miel, Fève tonka, Tabac",
    },
    "11": {
        "inspired_by": "Rabanne 1 Million",
        "notes_tete": "Mandarine sanguine, Pamplemousse, Menthe",
        "notes_coeur": "Cannelle, Épices, Rose",
        "notes_fond": "Ambre, Cuir, Patchouli",
    },
    "14": {
        "inspired_by": "Tom Ford Oud Wood",
        "notes_tete": "Bois de rose, Cardamome, Poivre de Sichuan",
        "notes_coeur": "Oud, Santal, Vétiver",
        "notes_fond": "Fève tonka, Ambre, Vanille",
    },
    "22": {
        "inspired_by": "Yves Saint Laurent Black Opium",
        "notes_tete": "Poire, Mandarine",
        "notes_coeur": "Vanille, Fleur d'oranger, Fleurs blanches",
        "notes_fond": "Café noir, Cèdre, Musc blanc, Patchouli",
    },
    "33": {
        "inspired_by": "Chanel Bleu de Chanel Eau de Parfum",
        "notes_tete": "Pamplemousse, Citron, Menthe, Bergamote, Poivre rose",
        "notes_coeur": "Gingembre, Noix de muscade, Jasmin, Melon",
        "notes_fond": "Encens, Ambre, Cèdre, Santal, Patchouli",
    },
}

# Le prix : 69 DH, celui de la ligne standard. C'est une decision commerciale,
# pas technique - a revoir en Back Office si la matiere premiere differe.
NOUVEAUX = [
    {
        "reference": "44", "name": "L'Écarlate",
        "inspired_by": "Givenchy L'Interdit Eau de Parfum Rouge",
        "family": "oriental", "gender": "femme",
        "notes_tete": "Orange sanguine, Accord épicé rouge",
        "notes_coeur": "Fleur d'oranger, Jasmin sambac",
        "notes_fond": "Patchouli, Santal",
    },
    {
        "reference": "51", "name": "Le Serment",
        "inspired_by": "Emporio Armani Stronger With You",
        "family": "sweet", "gender": "homme",
        "notes_tete": "Cardamome, Poivre rose, Feuille de violette",
        "notes_coeur": "Sauge",
        "notes_fond": "Vanille, Marron glacé",
    },
    {
        "reference": "52", "name": "Le Serment Absolu",
        "inspired_by": "Emporio Armani Stronger With You Absolutely",
        "family": "sweet oriental", "gender": "homme",
        "notes_tete": "Rhum, Élémi, Bergamote",
        "notes_coeur": "Lavande, Davana",
        "notes_fond": "Vanille de Madagascar, Châtaigne, Cèdre, Patchouli",
    },
    {
        "reference": "60", "name": "Le Nuage",
        "inspired_by": "Kayali Yum Boujee Marshmallow 81",
        "family": "sweet", "gender": "femme",
        "notes_tete": "Freesia, Citron, Fleur de nectarine, Pomme",
        "notes_coeur": "Guimauve, Fraise, Noix de coco, Fleur d'oranger",
        "notes_fond": "Crème fouettée, Sucre, Vanille, Musc, Ambroxan",
    },
    {
        "reference": "61", "name": "La Vanille",
        "inspired_by": "Kayali Vanilla Candy Rock Sugar 42",
        "family": "sweet", "gender": "femme",
        "notes_tete": "Poire confite, Feuille de violette, Rhum, Ylang-ylang",
        "notes_coeur": "Jasmin, Labdanum, Caramel blanc, Guimauve",
        "notes_fond": "Fève tonka, Vétiver, Santal, Patchouli, Sucre candi",
    },
    {
        "reference": "70", "name": "L'Oasis",
        "inspired_by": "Jean Paul Gaultier Le Beau Paradise Garden",
        "family": "fresh", "gender": "homme",
        "notes_tete": "Notes aquatiques, Menthe, Gingembre, Herbe verte",
        "notes_coeur": "Eau de coco, Sel, Figue verte",
        "notes_fond": "Santal, Fève tonka",
    },
    {
        "reference": "77", "name": "La Brise",
        "inspired_by": "Dolce & Gabbana Light Blue",
        "family": "fresh", "gender": "femme",
        "notes_tete": "Citron de Sicile, Pomme verte, Cédrat, Campanule",
        "notes_coeur": "Jasmin, Rose blanche, Bambou",
        "notes_fond": "Cèdre, Ambre, Musc",
    },
]

catalogue = json.loads(SRC.read_text(encoding="utf-8"))
par_ref = {x["reference"]: x for x in catalogue}

for ref, champs in CORRECTIONS.items():
    if ref not in par_ref:
        raise SystemExit("reference absente du catalogue : " + ref)
    avant = par_ref[ref].get("inspired_by")
    par_ref[ref].update(champs)
    print("  %-4s %-18s %s" % (ref, par_ref[ref]["name"],
                               "inchange" if avant == champs.get("inspired_by", avant)
                               else "%s -> %s" % (avant, champs["inspired_by"])))

# le gabarit d'un parfum, repris de ceux qui existent
for n in NOUVEAUX:
    if n["reference"] in par_ref:
        print("  %-4s deja present, ignore" % n["reference"])
        continue
    catalogue.append({
        "reference": n["reference"],
        "code": "ODYS " + n["reference"],
        "name": n["name"],
        "family": n["family"],
        "price": 69.0,
        "compare_at": "",
        "inspired_by": n["inspired_by"],
        "badge": "Nouveau",
        "kind": "perfume",
        "category": "Parfums",
        "notes_tete": n["notes_tete"],
        "notes_coeur": n["notes_coeur"],
        "notes_fond": n["notes_fond"],
        "gender": n["gender"],
    })
    print("  %-4s %-18s cree (%s)" % (n["reference"], n["name"], n["inspired_by"]))

SRC.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("\n%d articles au catalogue, dont %d parfums."
      % (len(catalogue), sum(1 for x in catalogue if x.get("kind") == "perfume")))
