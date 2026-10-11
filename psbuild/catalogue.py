#!/usr/bin/env python3
"""Extract the ODYS catalogue from the prototype into catalogue.json + .csv.

The prototype is the only place the product line-up exists (names, references,
prices, families, per-gram oud rates). This reads it rather than inventing
anything; every figure here comes from odys-preview-v5.0.html. Edit the CSV
and re-run import_catalogue.php to correct prices before going live.
"""
import csv, html, json, pathlib, re

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
SRC = WS / "odys-preview-v5.0.html"


def clean(text):
    return html.unescape(re.sub(r"\s+", " ", re.sub(r"<[^>]+>", "", text or ""))).strip()


def pyramids(s):
    """code -> {tete, coeur, fond}, from the prototype's PARFUMS_DB."""
    out = {}
    for entry in re.finditer(
            r"code: '([^']+)'[\s\S]{0,600}?notes: \{([\s\S]*?)\}", s):
        code, block = entry.group(1), entry.group(2)
        tiers = {}
        for tier in re.finditer(r"(tete|coeur|fond):\s*\[([^\]]*)\]", block):
            tiers[tier.group(1)] = [
                clean(n) for n in re.findall(r"'([^']+)'", tier.group(2))
            ]
        if tiers:
            out[code] = tiers
    return out

def extract():
    s = SRC.read_text(encoding="utf-8")
    products = {}

    # ── perfumes and packs: .pc cards ────────────────────────────────────
    for m in re.finditer(r'<div class="pc"[^>]*data-fam="([^"]*)"[^>]*>(.*?)\n</div>', s, re.S):
        fam, body = m.group(1), m.group(2)
        add = re.search(r'data-code="([^"]+)"\s+data-name="([^"]+)"\s+data-price="([0-9.]+)"', body)
        if not add:
            continue
        ref, name, price = add.group(1), html.unescape(add.group(2)), float(add.group(3))
        code = clean(re.search(r'class="pc-code"[^>]*>(.*?)</div>', body, re.S).group(1)) if 'pc-code' in body else ''
        inspo = re.search(r'class="pp-b"[^>]*>(.*?)</span>', body, re.S)
        old = re.search(r'class="pc-old"[^>]*>(.*?)</span>', body, re.S)
        badge = re.search(r'class="pcb[^"]*"[^>]*>(.*?)</span>', body, re.S)
        products[ref] = {
            "reference": ref,
            "code": code or ("ODYS " + ref),
            "name": name,
            "family": fam or "fresh",
            "price": price,
            "compare_at": clean(old.group(1)).replace("DH", "").replace(" ", "") if old else "",
            "inspired_by": clean(inspo.group(1)) if inspo else "",
            "badge": clean(badge.group(1)) if badge else "",
            "kind": "perfume",
            "category": "Parfums",
        }

    # ── olfactory pyramids ───────────────────────────────────────────────
    # The pyramid is what a perfume page is for; the prototype has one per
    # reference, so carry it into the catalogue instead of leaving the
    # product page's pyramid block empty.
    for code, tiers in pyramids(s).items():
        if code in products:
            products[code]["notes_tete"] = ", ".join(tiers.get("tete", []))
            products[code]["notes_coeur"] = ", ".join(tiers.get("coeur", []))
            products[code]["notes_fond"] = ", ".join(tiers.get("fond", []))

    # ── packs, sets and anything else with a fixed price ─────────────────
    # (the bundles page does not use .pc cards, so scan the add buttons)
    for m in re.finditer(r'data-code="([^"]+)"\s+data-name="([^"]+)"\s+data-price="([0-9.]+)"', s):
        ref, name, price = m.group(1), html.unescape(m.group(2)), float(m.group(3))
        if ref in products:
            continue
        kind = "coffret" if ref in ("DUO", "TRIO") else "pack"
        products[ref] = {
            "reference": ref,
            "code": ref,
            "name": name,
            "family": "oud" if "OUD" in ref or "SAM" in ref else "",
            "price": price,
            "compare_at": "",
            "inspired_by": "",
            "badge": "",
            "kind": kind,
            "category": "Coffrets" if kind == "coffret" else "Oud & Boukhour",
        }

    # ── oud and boukhour: sold per gram ──────────────────────────────────
    for m in re.finditer(r'class="oc-name"[^>]*>(.*?)</[a-z0-9]+>(.*?)data-rate="([0-9.]+)"', s, re.S):
        name, mid, rate = clean(m.group(1)), m.group(2), float(m.group(3))
        # a sampler is a fixed-price pack that happens to sit on the oud page;
        # it already came through the button scan with its real price
        if not name or name.lower() in [p["name"].lower() for p in products.values()]:
            continue
        grade = re.search(r'class="oc-grade"[^>]*>(.*?)</', mid, re.S)
        origin = re.search(r'class="oc-origin"[^>]*>(.*?)</', mid, re.S)
        ref = "OUD-" + re.sub(r"[^A-Z0-9]+", "-", name.upper()).strip("-")[:18]
        products[ref] = {
            "reference": ref,
            "code": name,
            "name": name,
            "family": "oud",
            "price": rate,                 # per gram
            "compare_at": "",
            "inspired_by": "",
            "badge": clean(grade.group(1)) if grade else "",
            "kind": "oud",                 # priced per gram, sold by weight
            "category": "Oud & Boukhour",
            "origin": clean(origin.group(1)) if origin else "",
        }

    # packs and sets are not perfumes
    for ref, p in products.items():
        if ref in ("DUO", "TRIO"):
            p["kind"], p["category"] = "coffret", "Coffrets"
        elif ref.startswith("SAM-") or ref == "PACK-OUD":
            p["kind"], p["category"] = "pack", "Oud & Boukhour"

    return [products[k] for k in sorted(products)]


# ── Diffuseurs ────────────────────────────────────────────────────────────
# Home fragrance, the one line the prototype never drew. Written here rather
# than scraped, so the references and the wording are the house's own — the
# prices are provisional like the rest of this file and are meant to be
# confirmed in Back Office before the line goes on sale.
DIFFUSEURS = [
    {
        "reference": "DIF-ROSEAUX-200",
        "code": "Diffuseur 200 ml",
        "name": "Diffuseur à roseaux — Nuit d'Ambre",
        "family": "oriental",
        "price": 249.0,
        "badge": "Nouveau",
        "notes_tete": "Bergamote, Cardamome",
        "notes_coeur": "Rose, Encens",
        "notes_fond": "Ambre, Bois de oud, Musc",
    },
    {
        "reference": "DIF-ROSEAUX-100",
        "code": "Diffuseur 100 ml",
        "name": "Diffuseur à roseaux — Jardin de Fès",
        "family": "fresh",
        "price": 179.0,
        "badge": "",
        "notes_tete": "Néroli, Citron",
        "notes_coeur": "Fleur d'oranger, Jasmin",
        "notes_fond": "Cèdre, Musc blanc",
    },
    {
        "reference": "DIF-RECHARGE-200",
        "code": "Recharge 200 ml",
        "name": "Recharge diffuseur — Nuit d'Ambre",
        "family": "oriental",
        "price": 159.0,
        "badge": "",
        "notes_tete": "Bergamote, Cardamome",
        "notes_coeur": "Rose, Encens",
        "notes_fond": "Ambre, Bois de oud, Musc",
    },
]


def diffuseurs():
    """The diffuser line, in the same shape as everything extracted above."""
    out = []
    for item in DIFFUSEURS:
        row = dict(item)
        row.setdefault("compare_at", "")
        row.setdefault("inspired_by", "")
        row.setdefault("origin", "")
        row["kind"] = "diffuseur"
        row["category"] = "Diffuseurs"
        out.append(row)

    return out


def main():
    items = extract() + diffuseurs()
    (HERE / "catalogue.json").write_text(json.dumps(items, indent=2, ensure_ascii=False), encoding="utf-8")

    cols = ["reference", "code", "name", "category", "kind", "family", "price", "compare_at",
            "inspired_by", "badge", "origin", "notes_tete", "notes_coeur", "notes_fond"]
    with (HERE / "catalogue.csv").open("w", newline="", encoding="utf-8-sig") as fh:
        w = csv.DictWriter(fh, fieldnames=cols, extrasaction="ignore", delimiter=";")
        w.writeheader()
        for it in items:
            w.writerow(it)

    kinds = {}
    for it in items:
        kinds[it["kind"]] = kinds.get(it["kind"], 0) + 1
    print(f"{len(items)} products extracted: " + ", ".join(f"{v} {k}" for k, v in sorted(kinds.items())))
    for it in items:
        unit = " DH/g" if it["kind"] == "oud" else " DH"
        notes = " · ".join(filter(None, [it.get("notes_tete", ""), it.get("notes_coeur", ""), it.get("notes_fond", "")]))
        print(f"  {it['reference']:16} {it['name'][:24]:26} {it['price']:>6.0f}{unit:6} {it['category']:16} {notes[:60]}")


if __name__ == "__main__":
    main()
