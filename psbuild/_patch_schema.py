"""Une seule description structuree du produit, et elle est complete.

La fiche en decrivait deux a la fois :

  * un bloc JSON-LD, correct mais incomplet — ni image ni description ;
  * des microdonnees eparpillees dans le HTML, qui n'ont jamais tenu
    ensemble. Le Product portait le prix affiche a l'ecran, « 69 DH », la ou
    schema.org attend un nombre : Google repondait « Invalid floating point
    number in property price ». Et la photo portait bien itemprop="image",
    mais hors du itemscope du Product — donc « Missing field image »,
    critique, sur une fiche dont la photo est le sujet.

Deux descriptions concurrentes du meme produit, c'est aussi deux endroits ou
la verite peut diverger : les microdonnees annoncaient une note de 4.9 ecrite
en dur pendant que le JSON-LD lisait la vraie.

On garde le JSON-LD — le format que Google recommande, un seul endroit — et on
retire les microdonnees. Le JSON est construit comme un tableau Smarty puis
encode, au lieu d'etre concatene a la main entre des {literal} : les
guillemets et les accents cessent d'etre un probleme.
"""
import pathlib
import sys
import ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "schema: one structured description" in s:
    sys.exit("already patched")

anchor = '    must(n == 1, "vol-cards: the cart button starts on the default combination")\n'
if s.count(anchor) != 1:
    sys.exit("anchor found %dx" % s.count(anchor))

# Le bloc insere dans build_theme.py. Les chaines Smarty y sont ecrites entre
# guillemets doubles echappes : elles contiennent des apostrophes (escape:'html')
# et des guillemets (content="…"), et un triple-apostrophe fermerait ce bloc.
block = r'''
    # ── 3b-septies. une seule description structuree ───────────────────
    _deb = pt.index('<script type="application/ld+json">')
    _fin = pt.index('</script>', _deb) + len('</script>')
    must('"@type":"Product"' in pt[_deb:_fin], "schema: the old JSON-LD block was found")

    NOUVEAU_LD = """{* La description structuree du produit, seule et complete.

   Elle etait doublee par des microdonnees eparpillees dans le HTML, qui
   annoncaient le prix tel qu'il s'affiche — « 69 DH » — la ou schema.org
   attend un nombre, et dont le itemscope ne contenait pas la photo. Google
   repondait « Invalid floating point number » et « Missing field image ».
   Les microdonnees sont parties ; il ne reste que ce bloc.

   Construit comme un tableau puis encode : plus de concatenation a la main
   entre des {literal}, donc plus de guillemet ni d'accent a echapper. *}
{assign var='odysLdDesc' value=$product.description_short|strip_tags|unescape:'html'|regex_replace:'/\\s+/u':' '|trim}
{assign var='odysLdImgs' value=[]}
{if $product.cover}{append var='odysLdImgs' value=$product.cover.bySize.large_default.url}{/if}
{foreach from=$product.images item=odysLdImg}
  {if !($odysLdImg.bySize.large_default.url|in_array:$odysLdImgs)}
    {append var='odysLdImgs' value=$odysLdImg.bySize.large_default.url}
  {/if}
{/foreach}
{* Smarty n'accepte pas un ternaire coupe par un retour a la ligne dans un
   tableau : on le resout avant. *}
{assign var='odysLdDispo' value='https://schema.org/OutOfStock'}
{if $product.quantity > 0}{assign var='odysLdDispo' value='https://schema.org/InStock'}{/if}
{assign var='odysLd' value=[
  '@context' => 'https://schema.org',
  '@type' => 'Product',
  'name' => $product.name|unescape:'html',
  'sku' => $product.reference|unescape:'html',
  'description' => $odysLdDesc,
  'image' => $odysLdImgs,
  'brand' => ['@type' => 'Brand', 'name' => 'ODYS Parfums'],
  'offers' => [
    '@type' => 'Offer',
    'url' => $product.url,
    'priceCurrency' => 'MAD',
    'price' => $product.price_amount|string_format:'%.2f',
    'itemCondition' => 'https://schema.org/NewCondition',
    'availability' => $odysLdDispo,
    'seller' => ['@type' => 'Organization', 'name' => 'ODYS Parfums']
  ]
]}
{* Une note ne s'affiche que si des clients l'ont donnee. *}
{if isset($product.nb_comments) && $product.nb_comments > 0}
  {assign var='odysLd' value=$odysLd|@array_merge:['aggregateRating' => [
    '@type' => 'AggregateRating',
    'ratingValue' => $product.rating|default:5,
    'reviewCount' => $product.nb_comments|intval
  ]]}
{/if}
<script type="application/ld+json">{$odysLd|@json_encode:320 nofilter}</script>"""

    pt = pt[:_deb] + NOUVEAU_LD + pt[_fin:]
    must(pt.count("application/ld+json") == 1, "schema: one structured description per page")

    # Les microdonnees concurrentes s'en vont.
    MICRO = [
        ("  <div class=\"info\" itemscope itemtype=\"https://schema.org/Product\">",
         "  <div class=\"info\">",
         "schema: the duplicate Product scope is gone"),
        ("    <meta itemprop=\"name\" content=\"{$product.name|escape:'html':'UTF-8'}\"/>\n",
         "", "schema: the duplicate name meta is gone"),
        ("    <meta itemprop=\"sku\"  content=\"{$product.reference}\"/>\n",
         "", "schema: the duplicate sku meta is gone"),
        ("<h1 class=\"p-name\" itemprop=\"name\">", "<h1 class=\"p-name\">",
         "schema: the heading is a heading again"),
        ("           itemprop=\"image\"\n", "",
         "schema: the stray image itemprop is gone"),
        ("<div class=\"live-price-block\" itemprop=\"offers\" itemscope itemtype=\"https://schema.org/Offer\">",
         "<div class=\"live-price-block\">",
         "schema: the broken Offer scope is gone"),
        ("      <meta itemprop=\"priceCurrency\" content=\"MAD\"/>\n", "",
         "schema: the duplicate currency meta is gone"),
        ("      <meta itemprop=\"availability\" content=\"https://schema.org/{if $product.quantity > 0}InStock{else}OutOfStock{/if}\"/>\n",
         "", "schema: the duplicate availability meta is gone"),
        ("<span class=\"lp-price\" id=\"livePrice\" itemprop=\"price\"",
         "<span class=\"lp-price\" id=\"livePrice\"",
         "schema: the price that read 69 DH is no longer a schema value"),
        ("<div class=\"rating\" itemprop=\"aggregateRating\" itemscope itemtype=\"https://schema.org/AggregateRating\">",
         "<div class=\"rating\">", "schema: the hardcoded 4.9 rating scope is gone"),
        ("<span style=\"font-size:12px;font-weight:700\" itemprop=\"ratingValue\">",
         "<span style=\"font-size:12px;font-weight:700\">",
         "schema: the rating value is display only"),
        ("<span class=\"rat-t\" itemprop=\"reviewCount\">", "<span class=\"rat-t\">",
         "schema: the review count is display only"),
        ("{* EAA: rating with itemprop + screen-reader text *}",
         "{* La note telle qu'elle s'affiche ; sa valeur structuree est dans le JSON-LD, une seule fois. *}",
         "schema: the rating comment no longer mentions microdata"),
    ]
    for _vieux, _neuf, _quoi in MICRO:
        pt, n = pt.replace(_vieux, _neuf), pt.count(_vieux)
        must(n == 1, _quoi)

    must("itemprop" not in pt, "schema: one structured description, no microdata left")
    prod_tpl.write_text(pt, encoding="utf-8")
'''

s = s.replace(anchor, anchor + block, 1)
ast.parse(s)
p.write_bytes(s.replace("\n", "\r\n").encode("utf-8") if crlf else s.encode("utf-8"))
print("build_theme.py patched: one structured description, image and price fixed")
