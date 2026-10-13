#!/usr/bin/env python3
"""Render the ODYS Smarty templates to static HTML for visual verification.

Not a Smarty engine — just enough resolution (includes, blocks, the handful
of variables and loops these templates use) to confirm that the .tpl markup
and the built theme.css actually pair up in a browser.
"""
import re, shutil, sys, pathlib

HERE = pathlib.Path(__file__).parent
WS = HERE.parent
THEME = WS / "dist" / "odys-theme-ps8" / "themes" / "odys"
TPL = THEME / "templates"
OUT = WS / "themecheck"

VARS = {
    "$urls.base_url": "#",
    "$urls.current_url": "#",
    "$urls.theme_assets": "assets/",
    "$urls.pages.category": "#collection",
    "$urls.pages.contact": "#contact",
    "$urls.pages.my_account": "#compte",
    "$urls.pages.authentication": "#connexion",
    "$urls.pages.register": "#inscription",
    "$urls.pages.history": "#commandes",
    "$urls.pages.wishlist": "#wishlist",
    "$urls.pages.sitemap": "#plan",
    "$cart.products_count": "2",
    "$customer.firstname": "Yasmine",
    "$language.iso_code": "fr",
    "$page.page_name": "index",
    "$page.meta.title": "ODYS Parfums",
    "$page.meta.description": "Extrait de parfum, élaboré au Maroc.",
    "$listing.label": "Extraits de Parfum",
    "$smarty.now": "2026",
}

PRODUCTS = [
    ("14", "L'Oriental", "Tom Ford Oud Wood", 249, 0, "oriental"),
    ("07", "La Nuit", "JP Gaultier Le Mâle Élixir", 219, 1800, "fresh"),
    ("11", "L'Or", "Paco Rabanne 1 Million", 239, 1600, "sweet"),
    ("01", "L'Icône", "Dior Sauvage EDP", 229, 0, "fresh"),
]
SIGS = [
    ("ODYS 14", "noir", "Noir &amp; Or", "Prestige", "L'Oriental",
     "Intense &amp; sophistiqué", "Un noir profond, symbole d'élégance et de caractère."),
    ("ODYS 07", "marine", "Marine &amp; Or", "Élégant", "La Nuit",
     "Frais &amp; raffiné", "Un bleu marine intemporel, évoquant la profondeur et la liberté."),
    ("ODYS 11", "creme", "Crème &amp; Or", "Classique", "L'Or",
     "Doux &amp; intemporel", "Un crème délicat, symbole de pureté et d'élégance naturelle."),
]
IMG = "assets/img/odys-packshot.webp"


def strip_comments(t):
    return re.sub(r"\{\*.*?\*\}", "", t, flags=re.S)


def resolve_includes(t, depth=0):
    if depth > 8:
        return t
    def sub(m):
        f = m.group(1)
        p = TPL / f
        if not p.exists():
            return f"<!-- missing {f} -->"
        body = strip_comments(p.read_text(encoding="utf-8"))
        # include params: num='01' -> literal; num=$sig.num -> {$sig.num}, left for the loop expanders
        for key, val in re.findall(r"(\w+)=(\$[\w.]+|'[^']*'|\"[^\"]*\")", m.group(2)):
            if val.startswith("$"):
                body = re.sub(r"\{\$" + key + r"(?=[|}])", lambda _m, v=val: "{" + v, body)
            else:
                body = re.sub(r"\{\$" + key + r"(?:\|[^}]*)?\}", lambda _m, v=val[1:-1]: v, body)
        return resolve_includes(body, depth + 1)
    return re.sub(r"\{include file='([^']+)'([^}]*)\}", sub, t)


def expand_signatures(t):
    m = re.search(r"\{foreach from=\$signatures item=sig\}(.*?)\{/foreach\}", t, re.S)
    if not m:
        return t
    body = m.group(1)
    out = []
    for code, tone, eyebrow, tier, name, mood, desc in SIGS:
        b = body
        b = b.replace("{$sig.tone}", tone)
        for key, val in (("num", code.split()[-1]), ("code", code), ("eyebrow", eyebrow), ("tier", tier),
                         ("name", name), ("mood", mood), ("desc", desc),
                         ("volume", "Extrait de Parfum · 50 ml")):
            b = re.sub(r"\{\$sig\." + key + r"(\|[^}]*)?\}", val, b)
        b = re.sub(r"\{\$sig\.url\}", "#produit", b)
        b = re.sub(r"\{\$sig\.image\}", "assets/img/hero.webp", b)
        out.append(b)
    return t[:m.start()] + "\n".join(out) + t[m.end():]


def expand_products(t):
    pat = re.compile(r"\{foreach from=\$(?:featuredProducts|listing\.products) item=product\}(.*?)"
                     r"(?:\{foreachelse\}.*?)?\{/foreach\}", re.S)
    card = strip_comments((TPL / "catalog/_partials/miniatures/product.tpl").read_text(encoding="utf-8"))

    def one(ref, name, inspo, price, old, fam):
        b = card
        b = b.replace("{$product.extra_attributes.famille_olfactive|default:'fresh'}", fam)
        b = re.sub(r"\{if \$product\.new\}(.*?)\{/if\}", r"\1" if ref == "11" else "", b, flags=re.S)
        b = re.sub(r"\{if \$product\.on_sale\}(.*?)\{/if\}", "", b, flags=re.S)
        b = re.sub(r"\{if \$product\.description_short\}(.*?)\{/if\}", r"\1", b, flags=re.S)
        if old:
            b = re.sub(r"\{if \$product\.regular_price_amount > \$product\.price_amount\}(.*?)\{/if\}",
                       r"\1", b, flags=re.S)
        else:
            b = re.sub(r"\{if \$product\.regular_price_amount > \$product\.price_amount\}.*?\{/if\}",
                       "", b, flags=re.S)
        b = re.sub(r"\{\$product\.cover\.bySize\.[a-z_]+\.url\}", IMG, b)
        b = re.sub(r"\{\$product\.name(\|[^}]*)?\}", name, b)
        b = re.sub(r"\{\$product\.reference(\|[^}]*)?\}", ref, b)
        b = re.sub(r"\{\$product\.description_short\|[^}]*\}", inspo, b)
        b = re.sub(r"\{\$product\.price\|intval\}", str(price), b)
        b = re.sub(r"\{\$product\.regular_price\|intval\}", str(old), b)
        b = re.sub(r"\{\(\(\$product\.regular_price_amount.*?\)\|intval\}",
                   str(int((old - price) / old * 100)) if old else "0", b, flags=re.S)
        b = re.sub(r"\{\$product\.url\}", "#produit", b)
        b = re.sub(r"\{\$product\.[a-z_.|:0-9']+\}", "0", b)
        return b

    return pat.sub(lambda m: "\n".join(one(*p) for p in PRODUCTS), t)


def resolve_smarty(t):
    t = expand_signatures(t)
    t = expand_products(t)
    # {if !isset($signatures) ...} … {/if}  — the fallback block: drop it, we injected data
    t = re.sub(r"\{if !isset\(\$signatures\).*?\{/if\}", "", t, flags=re.S)
    # if/else — always take the first branch
    for _ in range(12):
        new = re.sub(r"\{if [^}]*\}(.*?)\{else\}.*?\{/if\}", r"\1", t, flags=re.S)
        new = re.sub(r"\{if [^}]*\}(.*?)\{/if\}", r"\1", new, flags=re.S)
        if new == t:
            break
        t = new
    t = re.sub(r"\{hook [^}]*\}", "", t)
    t = re.sub(r"\{assign[^}]*\}", "", t)
    t = re.sub(r"\{foreach[^}]*\}|\{/foreach\}|\{foreachelse\}", "", t)
    t = re.sub(r"\{Configuration::get\('[^']+'\)\|default:'([^']*)'\}", r"\1", t)
    for k, v in VARS.items():
        t = re.sub(r"\{" + re.escape(k) + r"(\|[^}]*)?\}", v, t)
    t = re.sub(r"\{\$smarty\.now\|[^}]*\}", "2026", t)
    t = re.sub(r"\{\$[A-Za-z0-9_.\[\]'|:\- ]+\}", "", t)   # anything left
    # a stray {if}/{else}/{/if} would otherwise print as text in these pages
    t = re.sub(r"\{/?if[^}]*\}|\{else\}|\{elseif[^}]*\}", "", t)
    # the build wraps JSON-LD in {literal} for Smarty; strip it for the static render
    t = t.replace("{literal}", "").replace("{/literal}", "")
    return t


def build(page_tpl, out_name, extra=None):
    page = strip_comments((TPL / page_tpl).read_text(encoding="utf-8"))
    if extra:
        for key, val in extra.items():
            page = page.replace(key, val)
    layout = strip_comments((TPL / "layouts/layout-full-width.tpl").read_text(encoding="utf-8"))

    blocks = dict(re.findall(r"\{block name='([a-z_]+)'\}(.*?)\{/block\}", page, re.S))
    doc = layout
    for name, body in blocks.items():
        doc = re.sub(r"\{block name='" + name + r"'\}.*?\{/block\}", lambda m: body, doc, flags=re.S)
    doc = re.sub(r"\{block name='[a-z_]+'\}(.*?)\{/block\}", r"\1", doc, flags=re.S)

    doc = resolve_includes(doc)
    # PrestaShop builds these collections at runtime and the partials live in
    # the parent (classic) theme, so the static render substitutes plain tags.
    doc = re.sub(r'\{include file="_partials/stylesheets\.tpl"[^}]*\}',
                 '<link rel="stylesheet" href="assets/css/theme.css"/>', doc)
    doc = re.sub(r'\{include file="_partials/javascript\.tpl"[^}]*javascript=\$javascript\.bottom[^}]*\}',
                 '<script src="assets/js/app.js" defer></script>', doc)
    doc = re.sub(r'\{include file="_partials/javascript\.tpl"[^}]*\}', '', doc)
    doc = resolve_smarty(doc)
    doc = doc.replace(' dir="rtl"', '')
    if 'oud' not in out_name:
        doc = doc.replace(' oud lang-', ' lang-')   # {if $isOud} is false off the oud category   # {if $language.is_rtl} — false for fr
    doc = doc.replace('href="assets/css/theme.css"', 'href="theme.css"')
    doc = doc.replace('src="assets/js/app.js"', 'src="app.js"')
    (OUT / out_name).write_text(doc, encoding="utf-8")
    return out_name, len(doc)


OUT.mkdir(exist_ok=True)
shutil.copy(THEME / "assets/css/theme.css", OUT / "theme.css")
shutil.copy(THEME / "assets/js/app.js", OUT / "app.js")
# copytree et non un glob a plat : les visuels du hero vivent dans img/hero/.
# Le film de 2 Mo ne sert pas a un rendu statique : il n'est pas recopie.
shutil.copytree(THEME / "assets" / "img", OUT / "assets" / "img", dirs_exist_ok=True,
                ignore=shutil.ignore_patterns("*.mp4"))

results = [build("pages/index.tpl", "home.html"),
           build("catalog/listing.tpl", "listing.html")]

# the CMS pages, with the legal copy from psbuild/legal/ poured in
LEGAL = [("livraison", "Politique d'expédition et de livraison"),
         ("retours", "Politique d'échange et de remboursement"),
         ("cgv", "Termes et conditions"),
         ("confidentialite", "Politique de confidentialité"),
         ("mentions-legales", "Mentions légales")]
for slug, title in LEGAL:
    body = (HERE / "legal" / f"{slug}.html").read_text(encoding="utf-8")
    results.append(build("cms/page.tpl", f"legal-{slug}.html", extra={
        "{$cms.content nofilter}": body,
        "{$cms.meta_title|escape:'html':'UTF-8'}": title,
        "{$cms.meta_description|escape:'html':'UTF-8'}": title + " — ODYS Parfums, Casablanca.",
    }))

for name, size in results:
    print(f"  rendered {name}  ({size:,} bytes)")
leftover = 0
for name, _ in results:
    t = (OUT / name).read_text(encoding="utf-8")
    n = len(re.findall(r"\{[/$#a-zA-Z]", t))
    leftover += n
    print(f"  unresolved smarty tokens in {name}: {n}")
print(f"  output: {OUT}")
