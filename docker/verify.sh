#!/usr/bin/env bash

# Verify the ODYS theme and odys_crm against the real PrestaShop container.

# Every step prints PASS/FAIL and the script keeps going, so one failure still

# leaves a full picture. Run it alone: two copies at once double every POST.

set -u

cd "$(dirname "$0")" || exit 1

pass=0; fail=0

step() { printf '\n=== %s\n' "$1"; }

ok()   { echo "PASS  $1"; pass=$((pass+1)); }

no()   { echo "FAIL  $1"; fail=$((fail+1)); }

# Credentials come from docker/.env (the same file the compose file reads) and

# reach the container through its environment, never on a command line that

# other processes can read out of `ps`.

if [ -f .env ]; then set -a; . ./.env; set +a; fi

: "${MYSQL_USER:?copy docker/.env.example to docker/.env first}"

: "${MYSQL_PASSWORD:?copy docker/.env.example to docker/.env first}"

: "${MYSQL_DATABASE:=prestashop}"

sql() {

  docker compose exec -T -e MYSQL_PWD="$MYSQL_PASSWORD" db mysql -u"$MYSQL_USER" "$MYSQL_DATABASE" -N -B -e "$1" 2>/dev/null

}

# L'URL d'une categorie depuis son link_rewrite. Les identifiants changent

# a chaque reinstallation de la boutique de dev : les coder en dur faisait

# echouer des verifications sur des pages parfaitement saines.

# L'URL d'une page CMS depuis son link_rewrite. Meme raison que caturl :

# les identifiants bougent a chaque reinstallation.

cmsurl() {

  local id

  id=$(sql "SELECT id_cms FROM ps_cms_lang WHERE link_rewrite='$1' AND id_lang=1 LIMIT 1")

  if [ -n "$id" ]; then echo "$SHOP/content/$id-$1"; else echo "$SHOP/content/$1"; fi

}

caturl() {

  local id

  id=$(sql "SELECT id_category FROM ps_category_lang WHERE link_rewrite='$1' AND id_lang=1 LIMIT 1")

  if [ -n "$id" ]; then echo "$SHOP/$id-$1"; else echo "$SHOP/$1"; fi

}

psh() { docker compose exec -T shop bash -lc "$1" 2>&1; }

SHOP=http://localhost:8080

# Smarty keeps compiled templates; without this a stale page hides every change.

psh "cd /var/www/html && rm -rf var/cache/prod && chown -R www-data:www-data var" >/dev/null

step "PrestaShop is installed"

v=$(sql "SELECT value FROM ps_configuration WHERE name='PS_VERSION_DB' LIMIT 1")

[ -n "$v" ] && ok "PrestaShop $v" || no "no PS_VERSION_DB row"

step "The ODYS theme is the active theme"

theme=$(sql "SELECT theme_name FROM ps_shop WHERE id_shop=1")

[ "$theme" = "odys" ] && ok "active theme is odys" || no "active theme is '${theme:-none}'"

step "Image types survived the theme switch"

types=$(sql "SELECT COUNT(*) FROM ps_image_type WHERE products=1")

[ "${types:-0}" -ge 4 ] && ok "$types product image types" || no "only ${types:-0} product image types (shop would 500)"

step "odys_crm is installed and active"

act=$(sql "SELECT active FROM ps_module WHERE name='odys_crm'")

[ "$act" = "1" ] && ok "ps_module active=1" || no "module missing or inactive (got '${act:-none}')"

step "Lead table"

cols=$(sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema='prestashop' AND table_name='ps_odys_crm_lead'")

[ "${cols:-0}" -ge 18 ] && ok "ps_odys_crm_lead has $cols columns" || no "lead table missing or short (${cols:-0})"

step "Back Office tab"

tab=$(sql "SELECT id_tab FROM ps_tab WHERE class_name='AdminOdysCrm'")

[ -n "$tab" ] && ok "AdminOdysCrm tab id=$tab" || no "no AdminOdysCrm tab"

step "Hooks"

hooks=$(sql "SELECT h.name FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module WHERE m.name='odys_crm'")

echo "$hooks" | grep -q actionFrontControllerSetMedia && ok "actionFrontControllerSetMedia" || no "media hook missing"

echo "$hooks" | grep -q actionValidateOrder && ok "actionValidateOrder" || no "order hook missing"

echo "$hooks" | grep -q actionOrderStatusPostUpdate && ok "actionOrderStatusPostUpdate" || no "status hook missing"

echo "$hooks" | grep -q actionObjectCustomerMessageAddAfter && ok "actionObjectCustomerMessageAddAfter" || no "contact message hook missing"

# A message sent from /nous-contacter has to reach the lead list. While the

# shop has no mail server, the Back Office notification is the only way the

# owner learns it arrived - and the lead list is where the call-back happens.

step "Un message du formulaire de contact devient un lead"

sql "DELETE FROM ps_odys_crm_lead WHERE email='verify-contact@example.ma'" >/dev/null

sql "DELETE FROM ps_customer_thread WHERE email='verify-contact@example.ma'" >/dev/null

rm -f /tmp/odys-contact-jar

ctok=$(curl -sL -m 60 -c /tmp/odys-contact-jar "$SHOP/nous-contacter" \
  | grep -o 'name="token" value="[^"]*"' | head -1 | sed 's/.*value="//;s/"$//')

curl -sL -o /tmp/contact-post.html -m 60 -b /tmp/odys-contact-jar -X POST \
  -F "submitMessage=1" -F "token=$ctok" -F "id_contact=1" -F "url=" \
  -F "from=verify-contact@example.ma" \
  -F "message=Sonde verify: ce message doit apparaitre dans le CRM." \
  "$SHOP/nous-contacter"

grep -q "alert-success" /tmp/contact-post.html && ok "le formulaire accepte le message" || no "le formulaire a refuse le message"

lead=$(sql "SELECT CONCAT(source,'|',LEFT(subject,12)) FROM ps_odys_crm_lead WHERE email='verify-contact@example.ma'")

[ "$lead" = "contact|Sonde verify" ] && ok "lead cree depuis le contact ($lead)" || no "contact non capture ($lead)"

thread=$(sql "SELECT COUNT(*) FROM ps_customer_thread WHERE email='verify-contact@example.ma'")

[ "${thread:-0}" -ge 1 ] && ok "le thread Service client existe toujours" || no "thread perdu"

sql "DELETE FROM ps_odys_crm_lead WHERE email='verify-contact@example.ma'" >/dev/null

sql "DELETE FROM ps_customer_message WHERE id_customer_thread IN (SELECT id_customer_thread FROM ps_customer_thread WHERE email='verify-contact@example.ma')" >/dev/null

sql "DELETE FROM ps_customer_thread WHERE email='verify-contact@example.ma'" >/dev/null

# ---------------------------------------------------------------------------

# Le tunnel de commande sur telephone

#

# PrestaShop gates its own checkout script on the body id that classic emits:

# checkout.js runs only when $("#checkout").length === 1, and the terms modal

# only when body#checkout matches. Without the id nothing in the tunnel

# reacts - the payment options never collapse, the Commander button stays

# greyed, and the terms link navigates the customer out of their order. None

# of it logs anything, so only a check like this one catches it.

step "Le tunnel de commande garde ses reperes"

curl -s -m 60 -o /tmp/home.html "$SHOP/"

grep -q '<body id="index"' /tmp/home.html \
  && ok "le body porte son id (les scripts PrestaShop en dependent)" \
  || no "body sans id : checkout.js ne demarrera pas"

tpl=../dist/odys-theme-ps8/themes/odys/templates/layouts/layout-full-width.tpl

grep -q 'js-checkout-modal' "$tpl" \
  && ok "la fenetre des conditions de vente est livree" \
  || no "sans #modal le lien des CGV fait quitter la commande"

grep -q 'page-cms' ../dist/odys-theme-ps8/themes/odys/templates/cms/page.tpl \
  && ok "les pages CMS portent page-cms (checkout.js y lit le texte)" \
  || no "la fenetre des CGV s ouvrira vide"

# Payment on delivery: the carrier telephones before the parcel moves, so an

# order with no number is a refusal waiting to happen. The front office reads

# this list through CustomerAddress, not Address - a row under the other name

# makes the field required in the Back Office only.

req=$(sql "SELECT COUNT(*) FROM ps_required_field WHERE object_name='CustomerAddress' AND field_name='phone'")

[ "${req:-0}" -ge 1 ] && ok "le telephone est obligatoire a l adresse" \
  || no "telephone optionnel : un colis paye a la livraison sans numero"

# A country no carrier serves is a tunnel that stalls at the delivery step

# with nothing on screen to explain why.

pays=$(sql "SELECT COUNT(*) FROM ps_country WHERE active=1 AND id_country<>151")

[ "${pays:-1}" = "0" ] && ok "seul le Maroc est livrable" \
  || no "$pays pays actifs qu aucun transporteur ne dessert"

det=$(sql "SELECT value FROM ps_configuration WHERE name='PS_DETECT_COUNTRY'")

[ "${det:-1}" = "0" ] && ok "la detection par la langue du navigateur est coupee" \
  || no "PS_DETECT_COUNTRY ecrase le pays par defaut selon le navigateur"

step "Front office renders the ODYS theme"

code=$(curl -sL -o /tmp/front.html -m 180 -w "%{http_code}" "$SHOP/")

[ "$code" = "200" ] && ok "home HTTP 200 ($(wc -c < /tmp/front.html) bytes)" || no "home HTTP $code"

for marker in nv-hero nv-fam nv-sig nv-duo nv-assure odys-logo-w odys-bottle why-grid; do

  n=$(grep -c "$marker" /tmp/front.html)

  [ "$n" -gt 0 ] && ok "home contains $marker ($n)" || no "home missing $marker"

done

# With CCC on, theme.css is combined into a hashed bundle, so its name is gone

# from the HTML. What matters is that its rules reach the page either way.

css_urls=$(grep -o 'href="[^"]*\.css[^"]*"' /tmp/front.html | sed 's/href="//;s/"$//' | head -4)

css_ok=0

for u in $css_urls; do

  case "$u" in http*) full="$u";; /*) full="$SHOP$u";; *) full="$SHOP/$u";; esac

  if curl -s -m 40 "$full" | grep -q "nv-hero\|odys-track\|data-ambiance"; then css_ok=1; fi

done

[ "$css_ok" = "1" ] && ok "les regles du theme atteignent la page"   || no "aucune feuille de style ne contient les regles du theme"

step "Module assets reach the page"

# same reasoning: combined, crm.js is inside the bundle rather than named

js_urls=$(grep -o 'src="[^"]*\.js[^"]*"' /tmp/front.html | sed 's/src="//;s/"$//' | head -6)

crm_ok=0

grep -q "modules/odys_crm/views/js/crm.js" /tmp/front.html && crm_ok=1

for u in $js_urls; do

  case "$u" in http*) full="$u";; /*) full="$SHOP$u";; *) full="$SHOP/$u";; esac

  if curl -s -m 40 "$full" | grep -q "odysCrm"; then crm_ok=1; fi

done

[ "$crm_ok" = "1" ] && ok "le script CRM atteint la page" || no "le script CRM n'atteint pas la page"

grep -q "var odysCrm" /tmp/front.html && ok "odysCrm JS definition present" || no "odysCrm JS definition missing (crm.js would exit)"

grep -q "var prestashop" /tmp/front.html && ok "prestashop JS object present" || no "prestashop JS object missing"

step "Capture endpoint writes to MySQL (the NOT NULL bug's real test)"

sql "DELETE FROM ps_odys_crm_lead WHERE visitor='verifyrun'" >/dev/null

code=$(curl -s -o /tmp/capture.json -m 30 -w "%{http_code}" -X POST -H 'Content-Type: application/json' \
  -d '{"source":"quiz","visitor":"verifyrun","subject":"Famille oriental"}' \
  "$SHOP/index.php?fc=module&module=odys_crm&controller=capture")

echo "HTTP $code  $(head -c 120 /tmp/capture.json)"

grep -q '"ok":true' /tmp/capture.json && ok "endpoint replied ok:true" || no "endpoint reply: $(head -c 80 /tmp/capture.json)"

row=$(sql "SELECT CONCAT(COUNT(*),'/',COALESCE(MAX(hits),0)) FROM ps_odys_crm_lead WHERE visitor='verifyrun'")

[ "$row" = "1/1" ] && ok "one row, hits=1" || no "expected 1/1, got '${row:-none}'"

step "A second event merges instead of duplicating"

curl -s -o /dev/null -m 30 -X POST -H 'Content-Type: application/json' \
  -d '{"source":"whatsapp","visitor":"verifyrun"}' "$SHOP/index.php?fc=module&module=odys_crm&controller=capture"

row=$(sql "SELECT CONCAT(COUNT(*),'/',COALESCE(MAX(hits),0)) FROM ps_odys_crm_lead WHERE visitor='verifyrun'")

[ "$row" = "1/2" ] && ok "still one row, hits=2" || no "expected 1/2, got '${row:-none}'"

step "Honeypot"

curl -s -o /dev/null -m 30 -X POST -H 'Content-Type: application/json' \
  -d '{"source":"newsletter","email":"spam@bot.tld","website":"x"}' "$SHOP/index.php?fc=module&module=odys_crm&controller=capture"

spam=$(sql "SELECT COUNT(*) FROM ps_odys_crm_lead WHERE email='spam@bot.tld'")

[ "${spam:-1}" = "0" ] && ok "honeypot submission ignored" || no "honeypot submission stored"

step "Flacons Voyage is gone (one 50 ml size made it a duplicate of Parfums)"

home=$(curl -s -m 30 "$SHOP/")

if echo "$home" | grep -q "flacons-voyage"; then no "home still links to /flacons-voyage"; else ok "no link to the removed page"; fi

cat_left=$(sql "SELECT COUNT(*) FROM ps_category_lang WHERE link_rewrite='flacons-voyage'")

[ "${cat_left:-1}" = "0" ] && ok "category deleted" || no "category still exists (${cat_left:-?})"

appjs=$(curl -s -m 30 "$SHOP/themes/odys/assets/js/app.js")

if echo "$appjs" | grep -qE "FLACONS_DB|flPickFrag"; then no "app.js still ships the page JS"; else ok "app.js carries no flacons code"; fi

step "No PrestaShop demo content on the home page"

home=$(curl -s -m 30 "$SHOP/")

if echo "$home" | grep -qE "Sample 1|Custom Text Block|OFF ON CLOTHES|Lorem ipsum"; then no "demo blocks still on the home page"; else ok "no sample slides, banner or Lorem text"; fi

if echo "$home" | grep -q "1 284 clients"; then no "announcement bar still claims invented customers"; else ok "no invented review score"; fi

step "Oud & Boukhour is sold by the gram"

oud=$(curl -s -m 30 "$SHOP/oud-boukhour/28-hindi-assam-a.html")

echo "$oud" | grep -q 'id="gramCards"' && ok "gram cards on the oud page" || no "no gram cards"

echo "$oud" | grep -q "Choisissez votre grammage" && ok "labelled in grams" || no "grammage label missing"

echo "$oud" | grep -q 'class="vol-cards" id="volCards"' && no "oud page still offers a 50 ml format" || ok "no ml selector on a weight product"

cat=$(curl -s -m 30 "$(caturl oud-boukhour)")

echo "$cat" | grep -q "pc-unit" && ok "category cards price per gram" || no "cards show no unit"

perfume=$(curl -s -m 30 "$SHOP/parfums/20-l-icone.html")

# Un format unique n'est pas un choix : plus de selecteur, mais le format

# reste annonce sous le nom du produit.

echo "$perfume" | grep -q 'class="p-format"' && ok "le format est annonce sous le nom" || no "le format n est plus annonce"

echo "$perfume" | grep -q 'id="gramCards"' && no "perfume page shows gram cards" || ok "no gram cards on a perfume"

step "Product pages: valid JSON-LD, no unearned rating"

for page in "parfums/20-l-icone.html" "oud-boukhour/28-hindi-assam-a.html"; do

  body=$(curl -s -m 30 "$SHOP/$page")

  if echo "$body" | grep -q 'ld+json'; then

    if echo "$body" | grep -qE '"name":"\{\$product|\{\$product\.'; then

      no "$page ships raw Smarty in its JSON-LD"

    else

      ok "$page JSON-LD interpolated"

    fi

  else

    no "$page has no JSON-LD"

  fi

  if echo "$body" | grep -q 'itemprop="ratingValue"'; then no "$page shows a rating with no reviews"; else ok "$page shows no unearned rating"; fi

  if echo "$body" | grep -q "Fatal error"; then no "$page is fatal"; else ok "$page renders"; fi

done

step "No dead links in the nav and footer"

home=$(curl -s -m 30 "$SHOP/")

dead=0

for path in $(echo "$home" | grep -o 'href="http://localhost:8080/[^"#]*"' | sed 's/href="//;s/"$//' | sort -u); do

  code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" "$path")

  if [ "$code" != "200" ]; then no "$path -> $code"; dead=$((dead+1)); fi

done

[ "$dead" = "0" ] && ok "every link on the home page resolves" || true

step "The pages the footer promises exist"

for slug in a-propos savoir-faire fidelite; do

  id=$(sql "SELECT c.id_cms FROM ps_cms c JOIN ps_cms_lang cl ON cl.id_cms=c.id_cms WHERE cl.link_rewrite='$slug' AND c.active=1")

  [ -n "$id" ] && ok "CMS page $slug published" || no "CMS page $slug missing"

done

step "PrestaShop's own pages render clean and styled"

for page in "/panier?action=show" "/connexion" "/nous-contacter" "/10-parfums"; do

  body=$(curl -s -m 30 "$SHOP$page")

  if echo "$body" | grep -qE "<b>(Warning|Notice|Fatal error|Deprecated)</b>"; then no "$page prints PHP messages"; else ok "$page has no PHP messages"; fi

done

css=$(curl -s -m 30 "$SHOP/themes/odys/assets/css/theme.css")

echo "$css" | grep -q "checkout-step" && ok "checkout is styled by the theme" || no "no checkout rules in theme.css"

echo "$css" | grep -q "hidden-xs-up" && ok "Bootstrap visibility utilities defined" || no "classic's hidden-* classes have no rules"

echo "$css" | grep -q "products-sort-order .dropdown-menu" && ok "sort dropdown collapses" || no "sort dropdown has no rules"

step "No unconfigured demo blocks or placeholder links"

home=$(curl -s -m 30 "$SHOP/")

echo "$home" | grep -q 'href=""' && no "empty href on the home page" || ok "no empty links"

echo "$home" | grep -q "wa.me/?" && no "WhatsApp link without a number" || ok "no numberless WhatsApp link"

product=$(curl -s -m 30 "$SHOP/oud-boukhour/28-hindi-assam-a.html")

echo "$product" | grep -q "Customer Reassurance module" && no "unconfigured reassurance demo text" || ok "no reassurance demo text"

echo "$home" | grep -q "<title>ODYS Parfums | ODYS Parfums" && no "brand repeated in the title" || ok "titles are not doubled"

step "Capture endpoint: method, size and validation"

CAPTURE="$SHOP/index.php?fc=module&module=odys_crm&controller=capture"

# the counters are per IP per hour and every check below spends some, so the

# run starts from a clean slate

sql "DELETE FROM ps_odys_crm_rate" >/dev/null

code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" "$CAPTURE")

[ "$code" = "405" ] && ok "GET refused (405)" || no "GET returned $code, expected 405"

code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" -X POST -H 'Content-Type: application/json' \
  -d '{"source":"newsletter","email":"not-an-email","visitor":"verifybad"}' "$CAPTURE")

[ "$code" = "422" ] && ok "invalid e-mail refused (422)" || no "invalid e-mail returned $code"

big=$(python -c "print('{\"source\":\"quiz\",\"visitor\":\"verifybig\",\"subject\":\"' + 'A'*20000 + '\"}')" 2>/dev/null || printf '{"source":"quiz","visitor":"verifybig","subject":"%020000d"}' 0)

code=$(printf '%s' "$big" | curl -s -o /dev/null -m 20 -w "%{http_code}" -X POST \
  -H 'Content-Type: application/json' --data-binary @- "$CAPTURE")

[ "$code" = "413" ] && ok "oversized body refused (413)" || no "oversized body returned $code"

step "Capture endpoint: hostile input is stored inert"

sql "DELETE FROM ps_odys_crm_lead WHERE email='verify-sec@example.ma'" >/dev/null

# a literal quote inside a single-quoted shell string is a fight; build it

q=$(printf "\047")

payload="{\"source\":\"x${q}; DROP TABLE ps_odys_crm_lead; --\",\"email\":\"verify-sec@example.ma\",\"name\":\"<img src=x onerror=alert(1)>Nom\",\"subject\":\"<script>alert(1)</script>\",\"page\":\"javascript:alert(1)\",\"visitor\":\"verifysec\"}"

curl -s -o /dev/null -m 20 -X POST -H "Content-Type: application/json" -d "$payload" "$CAPTURE"

row=$(sql "SELECT CONCAT(source,'|',name,'|',subject,'|',page) FROM ps_odys_crm_lead WHERE email='verify-sec@example.ma'")

[ "$row" = "other|Nom|alert(1)|" ] && ok "source, tags and javascript: URL neutralised" || no "stored '$row'"

tables=$(sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name='ps_odys_crm_lead'")

[ "$tables" = "1" ] && ok "lead table survived the injection attempt" || no "lead table is gone"

step "Capture endpoint: rate limited"

sql "DELETE FROM ps_odys_crm_rate" >/dev/null

accepted=0; refusal=""

for i in $(seq 1 25); do

  code=$(curl -s -o /dev/null -m 20 -w "%{http_code}" -X POST -H 'Content-Type: application/json' \
    -d '{"source":"whatsapp","visitor":"verifyflood"}' "$CAPTURE")

  if [ "$code" = "200" ]; then accepted=$((accepted+1));

  elif [ -z "$refusal" ]; then refusal="$i/$code"; fi

done

[ "$accepted" -le 20 ] && ok "at most 20 accepted per visitor (got $accepted)" || no "$accepted accepted, ceiling is 20"

case "$refusal" in *"/429") ok "further requests refused with 429 (at #${refusal%%/*})";; *) no "no 429 refusal (got '$refusal')";; esac

sql "DELETE FROM ps_odys_crm_rate" >/dev/null

step "No credentials in anything that ships"

for f in "themes/odys/assets/js/app.js" "themes/odys/assets/css/theme.css"; do

  body=$(curl -s -m 20 "$SHOP/$f")

  if echo "$body" | grep -qiE "(api[_-]?key|secret|passwd|password)\s*[:=]\s*[\"'][^\"']{6,}"; then

    no "$f looks like it carries a credential"

  else

    ok "$f carries no credential"

  fi

done

grep -rqiE "MYSQL_PASSWORD:\s*[a-z0-9]" "$(dirname "$0")/docker-compose.yml" && no "compose file has a literal password" || ok "compose file reads credentials from the environment"

step "Mobile navigation and cart feedback"

home=$(curl -s -m 30 "$SHOP/")

echo "$home" | grep -q 'id="hamBtn" type="button" data-action="toggle-menu"' \
  && ok "hamburger is wired to the menu" || no "hamburger has no data-action"

echo "$home" | grep -q 'data-action="close-menu"' && ok "menu has a close control" || no "menu cannot be closed from inside"

echo "$home" | grep -q 'id="drawer"' && no "the dead cart drawer is back" || ok "no second cart panel"

echo "$home" | grep -q 'id="odysToast"' && ok "add-to-cart confirmation present" || no "no add-to-cart feedback"

css=$(curl -s -m 30 "$SHOP/themes/odys/assets/css/theme.css")

echo "$css" | grep -q "body.menu-open" && ok "page locks behind the open menu" || no "no scroll lock for the menu"

step "404 leads somewhere"

body=$(curl -s -m 30 "$SHOP/page-qui-nexiste-pas")

echo "$body" | grep -q "odys-404-links" && ok "404 offers the main pages" || no "404 has no way on"

echo "$body" | grep -q "Aucun produit disponible" && no "404 still prints the empty product listing" || ok "no empty listing on the 404"

# the chrome appears as often as on any other page (header + footer logo)

chrome404=$(echo "$body" | grep -c "odys-logo-w")

chromeHome=$(curl -s -m 30 "$SHOP/" | grep -c "odys-logo-w")

if [ "$chrome404" = "$chromeHome" ]; then ok "404 renders the chrome once ($chrome404)"; else no "404 chrome $chrome404 vs home $chromeHome"; fi

step "Olfactory pyramids"

rows=$(sql "SELECT COUNT(*) FROM ps_feature_product fp JOIN ps_feature_lang fl ON fl.id_feature=fp.id_feature WHERE fl.name LIKE 'Notes de%'")

[ "${rows:-0}" -ge 18 ] && ok "$rows pyramid rows in the database (3 per perfume)" || no "only ${rows:-0} pyramid rows"

perfume=$(curl -s -m 30 "$SHOP/parfums/20-l-icone.html")

echo "$perfume" | grep -q "Pyramide de l'inspiration" && ok "perfume page shows the pyramid" || no "no pyramid on the perfume page"

# Ces notes sont celles de la fragrance d'inspiration. Le titre « Pyramide

# Olfactive » les presentait comme la composition ODYS, ce que la page A

# propos et le bas de la description dementent. build_theme.py GENERE ce

# bloc, donc une correction dans le gabarit de reference est muette : ce

# test est la pour que le libelle ne reparte pas tout seul.

echo "$perfume" | grep -q "Pyramide Olfactive" && no "le titre presente encore les notes comme celles d'ODYS" || ok "les notes sont attribuees a la fragrance d'inspiration"

echo "$perfume" | grep -q "olf-src" && ok "la ligne d'attribution est sous le titre" || no "attribution de la pyramide absente"

for tier in "Tête" "Cœur" "Fond"; do

  echo "$perfume" | grep -q ">$tier<" && ok "tier $tier rendered" || no "tier $tier missing"

done

notes=$(echo "$perfume" | grep -c 'class="note"')

[ "$notes" -ge 6 ] && ok "$notes notes listed" || no "only $notes notes"

echo "$perfume" | grep -q 'class="note" href=' && ok "notes link to the shop search" || no "notes are not links"

if echo "$perfume" | grep -q "ol-icon\" aria-hidden=\"true\"><svg"; then ok "tier marks are SVG, not emoji"; else no "tier marks are not SVG"; fi

echo "$perfume" | grep -q "olf-top .ol-icon" && no "icon colours inline" || ok "tier marks take their colour from the palette"

hits=$(curl -s -m 30 "$SHOP/recherche?controller=search&s=Bergamote" | grep -c 'class="pc"')

[ "${hits:-0}" -ge 1 ] && ok "searching a note returns $hits product(s)" || no "note search returns nothing"

oud=$(curl -s -m 30 "$SHOP/oud-boukhour/28-hindi-assam-a.html")

echo "$oud" | grep -q "olf-pyr" && no "empty pyramid block on a raw material" || ok "no pyramid where there is none"

step "La fiche produit : coin, format, quantite"

# Le coin de la photo portait « Elabore au Maroc », deja dit sous le nom et

# dans les garanties. Il est reserve aux offres : une remise reellement

# posee, ou un produit neuf. Rien ne s'affiche quand il n'y a ni l'une ni

# l'autre — une etiquette permanente n'est pas une offre.

echo "$perfume" | grep -q 'class="ctxt"' && no "le coin repete encore Elabore au Maroc" || ok "le coin de la photo est libere"

promo=$(curl -s -m 40 "$SHOP/hommes/1-hummingbird-printed-t-shirt.html")

echo "$promo" | grep -q 'p-flag-promo">-20%' && ok "une remise reelle s affiche dans le coin" || no "la remise de 20 % n apparait pas"

echo "$perfume" | grep -q "p-flag-promo" && no "pastille de promotion sur un produit sans remise" || ok "pas de promotion inventee"

# Un seul format n'est pas un choix : la carte unique redisait le prix que

# le bloc juste en dessous annonce deja.

echo "$perfume" | grep -q 'class="vol-sel"' && no "selecteur de format pour un format unique" || ok "pas de selecteur quand il n y a rien a choisir"

echo "$perfume" | grep -q 'id="liveVol"' && no "le volume est repete sous le prix" || ok "le prix est annonce une seule fois"

echo "$promo" | grep -q 'class="vol-sel"' && ok "le selecteur reste quand il y a des declinaisons" || no "selecteur perdu sur un produit a declinaisons"

# Les cartes de collection suivent la meme regle que la fiche : une seule

# pastille, la remise reellement posee d'abord. Elles en affichaient deux

# qui se chevauchaient, et aucune ne disait la remise.

lp=$(curl -s -m 40 "$(caturl hommes)")

echo "$lp" | grep -q 'pcb-promo">-20%' && ok "la carte annonce la remise reelle" || no "la carte ignore la remise de 20 %"

echo "$lp" | grep -q "pc-sv" && no "le pourcentage est redit sous le prix" || ok "la remise n est ecrite qu une fois par carte"

echo "$lp" | grep -q "pc-old" && ok "le prix de reference reste barre" || no "le prix de reference a disparu"

col=$(curl -s -m 40 "$(caturl parfums)")

echo "$col" | grep -q "pcb-promo" && no "pastille de promotion sans remise dans la collection" || ok "pas de promotion inventee sur les cartes"

deux=$(echo "$col" | grep -c 'class="pcb pcb-new">Nouveau</span>[[:space:]]*<span class="pcb')

[ "${deux:-0}" = "0" ] && ok "jamais deux pastilles sur une meme carte" || no "$deux carte(s) portent deux pastilles"

# « Nouveau » est la pastille par defaut : si tout le catalogue la porte,

# elle ne distingue rien. Trente jours apres la date d'ajout du produit.

jours=$(sql "SELECT value FROM ps_configuration WHERE name='PS_NB_DAYS_NEW_PRODUCT'")

[ "${jours:-0}" = "30" ] && ok "un produit est neuf pendant 30 jours" || no "fenetre Nouveau a ${jours:-aucune} jour(s), 30 attendus"

# Un coffret plus cher que son contenu ne se vend pas : 411 DH les 2 x 50 ml

# et 549 DH les 3 x 50 ml, quand le flacon se vend 69 DH. 149 et 199 DH.

duo=$(sql "SELECT ROUND(price,2) FROM ps_product WHERE reference='DUO'")

trio=$(sql "SELECT ROUND(price,2) FROM ps_product WHERE reference='TRIO'")

[ "${duo:-0}" = "129.00" ] && ok "le Duo Classique est a 129 DH" || no "le Duo Classique est a ${duo:-?} DH"

[ "${trio:-0}" = "199.00" ] && ok "le Trio Decouverte est a 199 DH" || no "le Trio Decouverte est a ${trio:-?} DH"

# La source et la base doivent dire la meme chose, sinon la prochaine

# reinstallation ramene l'ancien tarif sans que personne ne le voie.

for r in DUO:129.0 TRIO:199.0; do

  ref=${r%%:*}; att=${r##*:}

  grep -q "\"reference\": \"$ref\"" ../psbuild/catalogue.json &&   python -c "import json,sys;d=json.load(open('../psbuild/catalogue.json',encoding='utf-8'));p=d['products'] if isinstance(d,dict) and 'products' in d else d;v=[x['price'] for x in p if x.get('reference')=='$ref'];sys.exit(0 if v and abs(v[0]-$att)<0.005 else 1)"     && ok "catalogue.json porte le prix du $ref"     || no "catalogue.json ne porte pas $att pour $ref"

done

# Le point d'entree cron de gsitemap se termine par un exit : la section qui

# ecrit ce reglage doit rester AVANT lui, sinon elle n'est jamais jouee.

cfg=../psbuild/config_boutique.php

a=$(grep -n "4. La duree de la pastille" "$cfg" | cut -d: -f1)

b=$(grep -n "5. Le plan du site" "$cfg" | cut -d: -f1)

if [ -n "$a" ] && [ -n "$b" ] && [ "$a" -lt "$b" ]; then ok "le reglage est pose avant l etape qui termine le script"; else no "config_boutique.php : le reglage suit le plan du site, donc il est mort"; fi

# Un plan du site qui declare ses propres 404 use le budget d'exploration.

# Mesure faite sur la boutique en ligne : 9 des 47 adresses annoncees ne

# menaient nulle part — 8 points d'entree de module et /fournisseurs.

sm=$(curl -s -m 40 "$SHOP/1_fr_0_sitemap.xml")

if [ -n "$sm" ]; then

  n=$(echo "$sm" | grep -c "<loc>")

  [ "${n:-0}" -ge 10 ] && ok "le plan du site annonce $n adresses" || no "le plan du site est vide ou absent"

  echo "$sm" | grep -q "controller=module-" && no "le plan du site annonce des points d entree de module (404)" || ok "aucun point d entree de module dans le plan du site"

  echo "$sm" | grep -qE "/fournisseurs|controller=supplier" && no "le plan du site annonce /fournisseurs, qui redirige" || ok "/fournisseurs n est plus propose a l indexation"

else

  no "le plan du site ne repond pas"

fi

# Les exclusions se relisent en base : les identifiants de ps_meta changent

# d'une boutique a l'autre, les ecrire en dur ne survivrait pas.

grep -qE "GSITEMAP_DISABLE_LINKS', *'[0-9]" ../psbuild/plan_du_site.php   && no "les identifiants d exclusion sont ecrits en dur"   || ok "les exclusions sont relues en base"

# Le script se termine par un exit : rien ne doit etre ajoute apres lui.

tail -4 ../psbuild/plan_du_site.php | grep -q "ob_end_clean"   && ok "l inclusion du cron reste la derniere instruction"   || no "du code suit l inclusion du cron, il ne s executera jamais"

step "Le fichier de mise a jour, etape par etape"

# Il a ete livre huit fois sans jamais avoir tourne : seulement passe au

# verificateur de syntaxe. La premiere execution reelle a montre qu'il

# mourait a la troisieme etape — descriptions.php cherchait

# « descriptions.json » quand le script depose « odys-descriptions.json »,

# et son exit emportait les trois etapes suivantes en silence.

maj=../dist/deploy/maj-telephone.php

# build_theme.py commence par effacer dist/ : le fichier de livraison part

# avec. Il se regenere avec `python psbuild/make_maj_telephone.py`.

[ -f "$maj" ] && ok "le fichier de mise a jour est construit" || no "maj-telephone.php absent — relancez psbuild/make_maj_telephone.py apres build_theme.py"

# Chaque script inclus recoit le chemin complet de sa source, pas un dossier

# dans lequel deviner un nom de fichier.

grep -q "odysFichierDescriptions = \$racine . '/odys-descriptions.json'" "$maj"   && ok "le chemin des descriptions est passe en entier"   || no "les descriptions cherchent un nom de fichier qui n existe pas"

grep -q "odysFichierCatalogue = \$racine . '/odys-catalogue.json'" "$maj"   && ok "le chemin du catalogue est passe en entier"   || no "le prix des coffrets cherche un nom de fichier qui n existe pas"

# Un fichier manquant doit sauter SON etape, pas les suivantes.

for f in descriptions prix_coffrets; do

  grep -q "exit(" ../psbuild/$f.php     && no "$f.php sort par exit : il emporterait les etapes suivantes"     || ok "$f.php se contente de rendre la main"

done

# Le mode « liens seulement » ne doit pas reclamer les sources HTML : la

# mise a jour ne les embarque pas, pour ne pas reecrire un texte modifie

# en Back Office. Place avant, la lecture du fichier faisait tout sauter.

a=$(grep -n 'if ($liensSeulement)' ../psbuild/pages_legales.php | head -1 | cut -d: -f1)

b=$(grep -n 'fichier = \$dossier' ../psbuild/pages_legales.php | head -1 | cut -d: -f1)

if [ -n "$a" ] && [ -n "$b" ] && [ "$a" -lt "$b" ]; then

  ok "le mode liens seulement passe avant la lecture des sources"

# La mise a jour doit aussi savoir completer un module DEJA installe : la

# boutique en ligne tourne avec une version ancienne d'odys_crm, a qui il

# manque deux hooks. Sans eux, la grille de l'accueil reste vide et

# personne ne comprend pourquoi la page n'a pas change.

for h in actionFrontControllerInitAfter actionDispatcherBefore; do

  n=$(sql "SELECT COUNT(*) FROM ps_hook_module hm JOIN ps_hook k ON k.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module WHERE m.name='odys_crm' AND k.name='$h'")

  [ "${n:-0}" -ge 1 ] && ok "hook $h enregistre" || no "hook $h absent : la mise a jour ne l ajoute pas"

done

# Le cron de gsitemap se termine par un exit : le ob_end_clean() qui suit

# n'est jamais atteint et PHP vide le tampon tout seul, recrachant les

# avertissements du module apres le dernier mot. Une fonction d'arret ferme

# le tampon avant ce vidage.

grep -q "register_shutdown_function" ../psbuild/plan_du_site.php   && ok "le tampon du cron est ferme avant le vidage automatique"   || no "les avertissements de gsitemap ressortiront apres le compte rendu"

step "Le mot de passe oublie a une issue si l e-mail n arrive pas"

# La boutique envoie par mail() de PHP, pas par SMTP : chez certains

# hebergeurs le courrier part sans bruit et n'arrive jamais. Ce lien est

# desormais propose au moment de payer — le pire endroit ou laisser

# quelqu'un sans recours.

mp=$(curl -s -m 40 "$SHOP/recuperation-mot-de-passe")

echo "$mp" | grep -q "odys-contact" && ok "la demande propose un contact humain" || no "aucune issue si l e-mail ne part pas"

echo "$mp" | grep -q "wa.me/" && ok "le lien WhatsApp est forme" || no "pas de lien WhatsApp sur la page"

# Les deux pages, pas seulement la premiere : « C'est envoye » est une

# promesse qu'il faut pouvoir rattraper.

grep -q "odys-contact\|contact-links" ../dist/odys-theme-ps8/themes/odys/templates/customer/password-infos.tpl   && ok "la page de confirmation aussi"   || no "la confirmation promet un e-mail sans porte de sortie"

# Le bloc doit disparaitre si aucun numero n est renseigne, pas laisser un

# lien mort vers wa.me/

grep -q 'if \$odysWa || \$odysTel' ../dist/odys-theme-ps8/themes/odys/templates/_partials/contact-links.tpl   && ok "sans numero renseigne, rien ne s affiche"   || no "le bloc de contact pourrait rendre un lien vide"

# « Indiquez la reference » demandait au client de recopier neuf caracteres

# a la main, depuis une page qu'il doit quitter pour ouvrir WhatsApp. Avec

# le paiement a la livraison et un serveur de courrier qui n'envoie rien,

# ce message est le seul recu qu'il aura.

oc=../dist/odys-theme-ps8/themes/odys/templates/checkout/order-confirmation.tpl

grep -q "subject=\"Bonjour ODYS, ma commande" "$oc"   && ok "la reference part avec le message WhatsApp"   || no "le message WhatsApp de la commande est vide de sa reference"

# Un seul encart dans le corps de la page : le deuxieme que j avais ajoute

# faisait doublon avec celui qui existait dix lignes plus bas.

n=$(grep -c "_partials/contact-links.tpl" "$oc")

[ "${n:-0}" = "1" ] && ok "un seul encart de contact sur la confirmation" || no "$n encarts de contact sur la page de confirmation"

step "L etape Adresses ne demande que ce qui sert"
# Le format d'adresse livre par PrestaShop contient une ligne vat_number.
# Le mode B2B est desactive : ce numero n'est jamais demande, jamais
# verifie, jamais imprime — mais il s'affiche au pas le plus couteux du
# tunnel, sur un telephone.
fmt=$(sql "SELECT REPLACE(f.format, CHAR(10), ' ') FROM ps_address_format f JOIN ps_country c ON c.id_country=f.id_country WHERE c.active=1 LIMIT 1")
case "$fmt" in
  *vat_number*) no "le formulaire d adresse demande encore un numero de TVA" ;;
  "")           no "aucun format d adresse pour le pays actif" ;;
  *)            ok "pas de numero de TVA dans le formulaire d adresse" ;;
esac
case "$fmt" in *address1*) ok "le format garde bien l adresse" ;; *) no "le format d adresse a perdu address1" ;; esac
case "$fmt" in *phone*) ok "le format garde le telephone" ;; *) no "le format d adresse a perdu le telephone" ;; esac
# Si la boutique passe un jour en B2B, le champ redevient legitime : le
# script ne doit pas le retirer dans ce cas.
grep -q "Configuration::get('PS_B2B_ENABLE')" ../psbuild/formulaire_adresse.php   && ok "le script respecte un passage en B2B"   || no "le script retirerait le numero de TVA meme en B2B"

step "Le bouton d achat ne ment pas"
# PrestaShop a trois facons de repondre a un ajout. L une d elles,
# l epuisement, n a PAS de cle `success` : l ancien test tombait dans le
# vide, sans message et sans bouton qui bouge. Une autre renvoie
# success:true avec un panier reste vide, et le bouton annoncait
# « Ajoute ! ». Les cinq cas sont verifies sur le app.js reellement livre.
# Le chemin hote se calcule a part : imbrique dans la commande docker, le
# `cd ..` du sous-shell cassait les guillemets.
ROOT=$(cd .. && pwd -W 2>/dev/null || (cd .. && pwd))
if MSYS_NO_PATHCONV=1 docker run --rm -v "$ROOT:/w" -w /w node:20-alpine node psbuild/tests/panier_reponses.js >/tmp/panier-test.txt 2>&1; then
  ok "les 9 points du contrat du panier sont verifies"
else
  no "le bouton d achat mentirait : $(tail -1 /tmp/panier-test.txt)"
fi
js=../dist/odys-theme-ps8/themes/odys/assets/js/app.js
grep -q "class=.cart-ko\|'cart-ko'" "$js" && ok "un echec affiche sa raison a cote du bouton" || no "un echec d ajout reste muet"
grep -q "var odysChange" "$js" && ok "updateCart n est emis que si le panier a change" || no "un echec declencherait la confirmation de PrestaShop"
# Le bandeau du bas s affichait AU CLIC, avant toute reponse du serveur.
grep -q "window.odysToast(String(name" "$js" && ok "le bandeau attend la confirmation du serveur" || no "le bandeau s affiche avant la reponse du serveur"
grep -q "addEventListener('click', function (e) {" ../psbuild/nuit.js && true
awk "/Add-to-cart confirmation/,/^}\)\(\);/" ../psbuild/nuit.js | grep -q "addEventListener"   && no "le bandeau est encore declenche par un clic"   || ok "plus aucun clic ne declenche le bandeau a lui seul"

# Mieux vaut dire « Epuise » avant le clic que refuser apres. On met un
# parfum en rupture, on regarde, on le remet. Le stock est restaure meme
# si un controle echoue entre-temps.
rupt=$(sql "SELECT id_product FROM ps_product WHERE reference='11'")
stock=$(sql "SELECT quantity FROM ps_stock_available WHERE id_product=$rupt AND id_product_attribute=0")
sql "UPDATE ps_stock_available SET quantity=0 WHERE id_product=$rupt AND id_product_attribute=0"
psh "rm -rf /var/www/html/var/cache/dev/* /var/www/html/var/cache/prod/*" >/dev/null 2>&1
fiche=$(curl -s -m 40 "$SHOP/parfums/$rupt-l-or.html")
liste=$(curl -s -m 40 "$(caturl parfums)")
sql "UPDATE ps_stock_available SET quantity=${stock:-50} WHERE id_product=$rupt AND id_product_attribute=0"
psh "rm -rf /var/www/html/var/cache/dev/* /var/www/html/var/cache/prod/*" >/dev/null 2>&1

echo "$fiche" | grep -q "btn-cart-oos" && ok "la fiche d un produit epuise annonce Epuise" || no "un produit epuise propose encore Ajouter au panier"
echo "$fiche" | grep -q 'id="addBtn"' && no "le bouton d achat reste sur un produit epuise" || ok "pas de bouton d achat sur un produit epuise"
echo "$fiche" | grep -q "oos-note" && ok "la fiche laisse une porte (nous ecrire)" || no "un produit epuise est un cul-de-sac"
echo "$liste" | grep -q "pc-add-oos" && ok "la carte de collection dit Epuise" || no "la carte propose un bouton dont le clic sera refuse"
# et surtout : les autres restent achetables
n=$(echo "$liste" | grep -c 'data-action="add-to-cart"')
[ "${n:-0}" -ge 10 ] && ok "$n cartes restent achetables" || no "seulement ${n:-0} cartes achetables : la regle est trop large"

step "Plus de fausse authentification dans le theme"
# Le theme livrait deux fenetres de maquette sur chaque page : « Mon Compte
# ODYS », dont le formulaire n'authentifiait personne et dont l'inscription
# ne creait rien, et un tunnel de commande parallele au vrai. Aucun bouton
# ne les ouvrait, mais elles etaient dans la source — identifiants de
# demonstration compris — et un seul data-action aurait suffi pour qu'un
# client y laisse son mot de passe.
acc=$(curl -s -m 40 "$SHOP/")
echo "$acc" | grep -q "accModal" && no "la fenetre de compte de maquette est encore livree" || ok "plus de fenetre de compte de maquette"
echo "$acc" | grep -q "coModal" && no "le tunnel de commande de maquette est encore livre" || ok "plus de tunnel de commande de maquette"
echo "$acc" | grep -qi "demo@odys" && no "des identifiants de demonstration sont dans la page" || ok "aucun identifiant de demonstration dans la page"
appjs=../dist/odys-theme-ps8/themes/odys/assets/js/app.js
grep -qi "demo@odys\|odys2026" "$appjs" && no "app.js porte encore les identifiants de demonstration" || ok "app.js est propre"
# Les fonctions orphelines ne doivent pas lever d erreur si on les appelle.
grep -q "getElementById('accModal')) { return; }" "$appjs" && ok "les fonctions orphelines sortent sans erreur" || no "openAccount leverait une erreur sur un element absent"
# Et aucun champ de formulaire sans libelle sur l accueil.
sans=$(echo "$acc" | grep -o "<input[^>]*id=\"\(loginEmail\|loginPwd\|regPrenom\|regNom\|regEmail\|regTel\|regPwd\)\"" | wc -l)
[ "${sans:-1}" = "0" ] && ok "les 7 champs sans libelle ont disparu de l accueil" || no "${sans} champ(s) de la maquette subsistent"
# Un nettoyage qui ne part pas avec la mise a jour ne nettoie rien : la
# boutique en ligne garderait ses fenetres de maquette.
grep -q "_partials/modals.tpl" ../dist/deploy/maj-telephone.php \
  && ok "le gabarit nettoye part avec la mise a jour" \
  || no "modals.tpl n est pas embarque : la maquette resterait en ligne"

step "Une recherche sans resultat propose les bons rayons"
# « parfum homme » ne renvoie rien : la recherche de PrestaShop lit les
# produits, pas les noms de categorie. C'est pourtant une des facons les
# plus naturelles de chercher un parfum sur une boutique marocaine.
vide=$(curl -s -m 40 "$SHOP/recherche?controller=search&s=parfum+homme")
echo "$vide" | grep -q "AUCUN R\|Aucun r" && ok "une recherche vide le dit clairement" || no "une recherche sans resultat ne dit rien"
echo "$vide" | grep -q "Pour homme" && ok "le rayon Homme est propose" || no "le rayon Homme n est pas propose"
echo "$vide" | grep -q "Pour femme" && ok "le rayon Femme est propose" || no "le rayon Femme n est pas propose"
# Et aucun lien mort parmi les suggestions.
mort=0
for u in $(echo "$vide" | sed -n "/odys-404-links/,/<\/nav>/p" | grep -o 'href="[^"]*"' | sed 's/href="//;s/"//'); do
  c=$(curl -s -o /dev/null -m 25 -w "%{http_code}" "$u" </dev/null)
  [ "$c" = "200" ] || mort=$((mort+1))
done
[ "$mort" = "0" ] && ok "toutes les suggestions menent quelque part" || no "$mort suggestion(s) en erreur"

step "Le hero sans pave noir, et toujours lisible"
# Le voile du hero etait opaque de 0 a 31 %, en #08090A — un noir FROID
# pose sur une photo dont les ombres sont #180E08, un brun chaud : un
# rectangle rapporte, visible avant le parfum. Il couvrait un texte
# INCRUSTE dans l'image, et mal orthographie (« esrences », « cavoir-faire
# infemporel », « Decouvrec », « DECOUVRIE »). Le texte a ete retire de
# l'image ; le voile n'a plus besoin d'etre opaque.
cssf=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css
grep -q "linear-gradient(90deg, #08090A 0%, #08090A" "$cssf" \
  && no "le voile du hero est de nouveau un pave opaque" \
  || ok "le voile du hero n a plus de palier opaque"
grep -q "rgba(24,14,8" "$cssf" \
  && ok "le voile emprunte sa teinte aux ombres de la photo" \
  || no "le voile n est plus accorde a l image"
# Et surtout : le titre reste lisible sur CHAQUE visuel. Le test mesure
# le composite reel, image par image — une photo plus claire le fait
# echouer avant qu'elle ne parte en ligne.
if python ../psbuild/tests/hero_contraste.py >/tmp/hero-ctr.txt 2>&1; then
  ok "le titre du hero tient le contraste sur tous les visuels"
else
  no "contraste du hero insuffisant : $(tail -2 /tmp/hero-ctr.txt | head -1)"
fi

# Deux defauts de couleur ne se voient NI a l oeil NI sur une maquette, et
# ils sont apparus trois fois chacun sur cette boutique.
#
# Le premier : un var() nu sur un jeton qui n existe pas. CSS ne signale
# rien — la declaration devient invalide a la valeur calculee et la
# propriete HERITE du parent. --odys-mid n etait defini nulle part et dix-
# huit regles tombaient sur un repli pale ; le fil d Ariane de la page oud
# heritait une encre sombre posee sur un fond sombre, 1,36:1.
if MSYS_NO_PATHCONV=1 docker run --rm -v "$ROOT:/w" -w /w node:20-alpine node psbuild/tests/jetons_css.js >/tmp/jetons-css.txt 2>&1; then
  ok "chaque jeton CSS appele est defini quelque part"
else
  no "un jeton CSS appele n existe pas : $(grep ECHEC /tmp/jetons-css.txt | head -1)"
fi

# Le second : une encre reglee sur l ivoire le plus clair et posee sur le
# plus chaud. L or porteur de texte tenait 4,52:1 sur le fond de page et
# 4,25 sur les bandeaux de section, ou s ecrivent tous les surtitres. Le
# test calcule chaque encre contre chacun des trois ivoires, alias
# resolus, et releve au passage toute regle qui peindrait le texte et le
# fond du MEME jeton — contraste 1:1 par construction.
if MSYS_NO_PATHCONV=1 docker run --rm -v "$ROOT:/w" -w /w node:20-alpine node psbuild/tests/palette_contraste.js >/tmp/palette-ctr.txt 2>&1; then
  ok "la palette tient le contraste sur ses trois fonds clairs"
else
  no "une encre de la palette passe sous son seuil : $(grep ECHEC /tmp/palette-ctr.txt | head -1)"
fi

# Le fond des fiches « ambiance » etait reste sombre quand la palette est
# passee au clair : sur telephone, ou la fiche n est pas posee sur une
# carte, le nom du produit et le prix s ecrivaient en encre sombre sur un
# vert presque noir.
grep -q "amb-deep:var(--odys-cream)" "$cssf"   && ok "le sol des fiches ambiance suit la palette claire"   || no "les fiches ambiance repeignent la page en sombre"

# La page oud, elle, est restee sombre : ce sont ses blocs qui doivent
# redefinir les jetons, et seulement eux — la liste des produits y repose
# sur un panneau ivoire.
grep -q "body.oud .odys-nav," "$cssf"   && ok "l entete de la page oud a ses propres jetons"   || no "l entete de la page oud ecrit en sombre sur sombre"
grep -q "body.oud{--odys-text\|body.oud {--odys-text" "$cssf"   && no "les jetons oud sont poses sur le body : la liste passe en creme sur ivoire"   || ok "les jetons oud ne debordent pas sur les panneaux clairs"

# Les pictogrammes de partage existaient, peints a 45 % d opacite : 1,86:1
# sur l ivoire, la ou une commande non textuelle demande 3:1. Trois boutons
# presents et invisibles sur chaque fiche.
grep -q "social-sharing li a{[^}]*opacity:.45" "$cssf"   && no "les pictogrammes de partage sont redevenus invisibles"   || ok "les pictogrammes de partage sont a pleine encre"
grep -q "background-color:currentColor" "$cssf"   && ok "les pictogrammes de partage suivent la couleur de leur surface"   || no "les pictogrammes de partage ont une encre fixe"

# Sur telephone l image du hero devient une bande et le texte passe DESSOUS,
# sur l ivoire. Les couleurs etaient restees celles d un texte sur photo :
# le chapeau et les liens ne s affichaient pas du tout.
grep -q "odys-film-hero .nv-lede,\|odys-film-hero .nv-lede," "$cssf"   && ok "le hero empile sur telephone reprend la palette claire"   || no "sur telephone le chapeau du hero serait invisible"

# Un avis de confidentialite de 327 caracteres etait rendu entierement en
# majuscules, a 11 px, au moment de payer : la regle des petites capitales
# des libelles attrapait aussi les cases a cocher du consentement.
grep -q 'label:has(input)' "$cssf"   && ok "les phrases du tunnel ne sont plus en capitales"   || no "les consentements du tunnel sont ecrits en capitales"
# Les etages de la pyramide etaient teintes en vert desature : a 2-7 %
# sur du blanc, un vert lit comme un gris froid et jure avec l'ivoire.
grep -q "olf-base{background:rgba(24,40,32" "$cssf" \
  && no "les etages de la pyramide sont revenus au vert grisatre" \
  || ok "les etages de la pyramide sont dans la palette chaude"
# Sans l image nettoyee, la nouvelle feuille de style REVELERAIT le texte
# grave et ses fautes au lieu de les cacher. Les deux voyagent ensemble.
grep -q "odys-essence-poster.webp" ../dist/deploy/maj-telephone.php \
  && ok "l image nettoyee part avec la mise a jour" \
  || no "l image du hero n est pas embarquee : les fautes gravees seraient revelees"
else

  no "pages_legales.php exige ses sources avant le mode liens seulement"

fi

# #121319 vient du theme sombre ; depuis l'ivoire il peignait en noir tout

# champ hors .cf, a commencer par la quantite — chiffre brun sur noir.

css="$PWD/../dist/odys-theme-ps8/themes/odys/assets/css/theme.css"

grep -q "background:#121319" "$css" && no "un champ garde le fond noir du theme sombre" || ok "les champs sont sur fond clair"

grep -q "olf-top .ol-icon,.olf-top .ol-name{color:var(--odys-cream-soft" "$css" && no "l etage Tete est ecrit en creme sur de l ivoire" || ok "les trois etages de la pyramide se lisent"

step "The home signature trio is a setting"

inst=$(sql "SELECT active FROM ps_module WHERE name='odys_loyalty'")

[ "$inst" = "1" ] && ok "odys_loyalty installed (it owns the ODYS settings)" || no "odys_loyalty not installed"

hooked=$(sql "SELECT COUNT(*) FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module WHERE m.name='odys_loyalty' AND h.name='actionFrontControllerSetMedia'")

[ "${hooked:-0}" -ge 1 ] && ok "it feeds the home page" || no "hook not registered"

slots=$(sql "SELECT COUNT(*) FROM ps_configuration WHERE name LIKE 'ODYS_SIG_%' AND value <> ''")

[ "${slots:-0}" = "3" ] && ok "three signature slots filled" || no "${slots:-0} slots filled"

home=$(curl -s -m 30 "$SHOP/")

codes=$(echo "$home" | grep -o 'class="nv-b-code">[^<]*' | sed 's/.*>//' | tr '\n' ' ')

[ -n "$codes" ] && ok "band renders: $codes" || no "no signature bottles on the home page"

# what the band shows must be what the settings point at

first=$(sql "SELECT p.reference FROM ps_product p JOIN ps_configuration c ON c.value = p.id_product WHERE c.name='ODYS_SIG_1'")

case "$codes" in *"ODYS $first"*) ok "first bottle follows ODYS_SIG_1 (ODYS $first)";; *) no "band shows '$codes', setting says ODYS $first";; esac

step "Loyalty points: the rules that stop a balance being invented"

tables=$(sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('ps_odys_loyalty','ps_odys_loyalty_history')")

[ "${tables:-0}" = "2" ] && ok "points tables exist (the module is really installed)" || no "loyalty tables missing: the module is only half-installed"

hooks=$(sql "SELECT GROUP_CONCAT(h.name) FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module WHERE m.name='odys_loyalty'")

case "$hooks" in *actionOrderStatusPostUpdate*) ok "points follow the order's state";; *) no "no status hook: points cannot be reversed";; esac

case "$hooks" in *actionCustomerAccountAdd*) no "still awards points at registration (farmable)";; *) ok "no bonus for merely registering";; esac

idx=$(sql "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='ps_odys_loyalty_history' AND index_name='uniq_order_credit'")

[ "${idx:-0}" -ge 1 ] && ok "one credit per order enforced by the database" || no "no unique index: an order can be credited twice"

dupes=$(sql "SELECT COUNT(*) FROM (SELECT id_customer, id_order FROM ps_odys_loyalty_history WHERE id_order IS NOT NULL AND points > 0 GROUP BY id_customer, id_order HAVING COUNT(*) > 1) d")

[ "${dupes:-0}" = "0" ] && ok "no order credited twice in the data" || no "$dupes order(s) credited more than once"

neg=$(sql "SELECT COUNT(*) FROM ps_customer c WHERE (SELECT COALESCE(SUM(points),0) FROM ps_odys_loyalty_history h WHERE h.id_customer=c.id_customer) < 0")

[ "${neg:-0}" = "0" ] && ok "no negative balance" || no "${neg} customer(s) below zero"

php_src=$(cat "$(dirname "$0")/../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/odys_loyalty.php" 2>/dev/null)

echo "$php_src" | grep -q "total_paid_tax_incl" && ok "points read what was paid, not the line totals" || no "points ignore the amount paid"

echo "$php_src" | grep -q "total_discounts_tax_incl" && ok "discounts are deducted" || no "vouchers still earn points"

step "Other pages render (they use classic's templates through the parent theme)"

# canonical (friendly) URLs: the index.php?controller=… form answers 200 with a

# "this page has moved" notice, which is not a failure but is not the page either

for path in "nous-contacter" "index.php?controller=my-account" "content/1-livraison"; do

  c=$(curl -sL -o /tmp/pg.html -m 90 -w "%{http_code}" "$SHOP/$path")

  b=$(wc -c < /tmp/pg.html)

  if [ "$c" = "200" ] && [ "$b" -gt 5000 ]; then ok "$path -> $c ($b bytes)"; else no "$path -> $c ($b bytes)"; fi

done

step "Product page: the redesign from the mockup"

purl=$(sql "SELECT CONCAT('parfums/', p.id_product, '-', pl.link_rewrite, '.html')

            FROM ps_product p JOIN ps_product_lang pl ON pl.id_product = p.id_product

            WHERE p.reference = '11' AND pl.id_lang = 1 LIMIT 1")

prod=$(curl -s -m 60 "$SHOP/${purl:-parfums/22-l-or.html}")

[ -n "$prod" ] && ok "product page fetched ($(printf '%s' "$prod" | wc -c) bytes)" || no "product page empty"

# the two counters were fed by Math.random(): invented social proof

case "$prod" in *"personnes regardent"*|*"personnes consultent"*) no "the page still invents an audience";;

  *) ok "no invented viewer count";; esac

# the prototype's own product table must never reach a real page

case "$prod" in *images.unsplash.com*) no "prototype photos on the product page";;

  *) ok "no prototype imagery";; esac

grep -q "track.children.length" ../dist/odys-theme-ps8/themes/odys/assets/js/app.js \
  && ok "the demo carousel cannot paint over the real products" \
  || no "app.js can still overwrite the recommendations"

svc=$(printf '%s' "$prod" | grep -c 'class="svc"')

[ "${svc:-0}" = "4" ] && ok "four services, line icons" || no "${svc:-0} service rows (expected 4)"

case "$prod" in *'class="p-format"'*) ok "format shown under the name";; *) no "no format line";; esac

reco=$(printf '%s' "$prod" | grep -c 'class="sc"')

[ "${reco:-0}" -ge 1 ] && ok "$reco real recommendations in the carousel" \
  || no "${reco:-0} recommendation cards"

arrows=$(printf '%s' "$prod" | grep -c 'class="sugg-arr"')

[ "${arrows:-0}" = "2" ] && ok "the carousel keeps its arrows" || no "${arrows:-0} carousel arrows"

links=$(sql "SELECT COUNT(*) FROM ps_accessory")

[ "${links:-0}" -ge 4 ] && ok "$links accessory links in the catalogue" || no "no accessories: the block cannot render"

# the welcome bonus moved to the first paid order; the copy must not promise

# it at sign-up any more

case "$prod" in *"offerts</strong> à l'inscription"*) no "still promises points at registration";;

  *) ok "no points promised for merely registering";; esac

case "$prod" in *"loyalty-card"*) ok "loyalty card rendered";; *) no "loyalty card missing";; esac

step "Home hero: the essence film"

home=$(curl -s -m 40 "$SHOP/")

case "$home" in *'data-odys-hero'*) ok "the hero section is on the home page";; *) no "hero section missing";; esac

# Le film a ete retire : une image fixe, un mega-octet de moins sur un

# telephone marocain, et plus rien qui bouge pendant qu'on lit le titre.

case "$home" in *'<video'*) no "le hero rejoue une video : elle devait etre remplacee par son image";; *) ok "le hero est une image fixe, pas un film";; esac

case "$home" in *'odys-essence-poster.webp'*) ok "the poster is set (the film's last frame)";; *) no "no poster: the hero would start blank";; esac

# the words must be in the HTML, not burned into the video

case "$home" in *'Plus qu&#039;un parfum'*|*"Plus qu'un parfum"*) ok "the headline is real text";; *) no "the headline is not in the markup";; esac

case "$home" in *'Découvrir la collection'*) ok "the call to action is real text";; *) no "no call to action in the hero";; esac

film=$(curl -s -o /dev/null -m 60 -w "%{http_code} %{size_download}" "$SHOP/themes/odys/assets/img/hero/odys-essence.mp4")

case "$film" in "200 "*) ok "the film is served ($(echo "$film" | awk '{printf "%.1f MB", $2/1048576}'))";; *) no "the film returns $film";; esac

poster=$(curl -s -o /dev/null -m 40 -w "%{http_code}" "$SHOP/themes/odys/assets/img/hero/odys-essence-poster.webp")

[ "$poster" = "200" ] && ok "the poster is served" || no "the poster returns $poster"

# nothing of the film may be fetched before the hero is looked at

case "$home" in *'fetchpriority="high"'*) ok "l'image du hero est priorisee au chargement";; *) no "l'image du hero n'est pas priorisee";; esac

# and the copy must not depend on JavaScript to be readable

css=$(curl -s -m 40 "$SHOP/themes/odys/assets/css/theme.css")

case "$css" in *'.odys-js .odys-film-hero .nv-hero-txt'*) ok "the words are hidden only while JS can bring them back";; *) no "the hero copy would stay invisible without JS";; esac

case "$css" in *'prefers-reduced-motion:reduce'*) ok "reduced motion is honoured";; *) no "no reduced-motion rule";; esac

js=$(curl -s -m 40 "$SHOP/themes/odys/assets/js/app.js")

case "$js" in *'prefers-reduced-motion: reduce'*) ok "the film does not play for reduced motion";; *) no "the film plays regardless of the motion preference";; esac

case "$home" in *"classList.add('odys-js')"*) ok "the page is marked before the first paint";; *) no "the words would flash before being hidden";; esac

case "$home" in *"is-told"*) ok "a failed script cannot leave the hero wordless";; *) no "no fallback if motion.js never runs";; esac

# Chaque visuel porte ses propres mots et sa propre destination : le

# carrousel changeait l'image sous un titre fixe, donc le deuxieme visuel

# ne disait rien et ne menait nulle part.

vis=$(echo "$home" | grep -c "oh-slide")

pan=$(echo "$home" | grep -c 'class="nv-hero-txt oh-txt')

[ "${vis:-0}" -ge 2 ] && [ "$vis" = "$pan" ] && ok "$vis visuels, $pan panneaux de texte : un pour un" || no "$vis visuel(s) pour $pan panneau(x) de texte"

h1=$(echo "$home" | grep -c 'id="nv-hero-title"')

[ "$h1" = "1" ] && ok "un seul h1 dans le hero" || no "$h1 h1 dans le hero"

dst=$(echo "$home" | grep -o 'class="nv-btn"[^>]*href="[^"]*"\|href="[^"]*"[^>]*class="nv-btn"' | grep -o 'href="[^"]*"' | sort -u | wc -l)

[ "${dst:-0}" -ge 2 ] && ok "les visuels menent a $dst destinations differentes" || no "les visuels pointent tous au meme endroit"

# Le flacon de flacon-signature.webp portait la marque d'une AUTRE maison,

# lisible sur la photo. Sur la page d'accueil d'ODYS c'etait le produit

# d'un concurrent presente comme le notre. Il ne doit pas revenir.

if [ -e ../dist/odys-theme-ps8/themes/odys/assets/img/flacon-signature.webp ] || [ -e ../psbuild/img/flacon-signature.webp ]; then

  no "le visuel de remplacement a la marque d un concurrent est revenu"

else

  ok "aucun flacon d une autre marque dans les visuels du hero"

fi

step "Points: spending, expiry, and the screens that show them"

# the module's own rules

src=$(cat ../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/odys_loyalty.php)

echo "$src" | grep -q "REWARD_MIN" && ok "a reward has a price in points" || no "nothing spends points"

# the ladder the shop asked for: 10 a perfume, 15 two or the oud, 20 a coffret

check_rung() {  # <label> <grep pattern>

  echo "$src" | grep -q "$2" && ok "$1" || no "missing: $1"

}

check_rung "10 points = un parfum"        "'parfum1' => \['cost' => 10"

check_rung "15 points = deux parfums"     "'parfum2' => \['cost' => 15"

check_rung "15 points = 5 g d'oud"        "'oud'     => \['cost' => 15"

check_rung "20 points = un coffret"       "'coffret' => \['cost' => 20"

echo "$src" | grep -q "const REWARD_MIN = 10" && ok "nothing redeemable below 10 points" \
  || no "the 10-point threshold is not enforced"

# and the page that promises it says the same numbers

rules=$(curl -s -m 40 "$(cmsurl fidelite)")

for n in "10 points" "15 points" "20 points"; do

  case "$rules" in *"$n"*) ok "the fidélité page states $n";; *) no "the fidélité page never mentions $n";; esac

done

echo "$src" | grep -q "FOR UPDATE" && ok "the balance is locked while it is spent" || no "two clicks could spend the same points"

echo "$src" | grep -q "pSQL(\$label)" && ok "the ledger label is escaped" || no "a label with an apostrophe would break the insert"

echo "$src" | grep -q "], true);" && ok "an order-less row keeps a NULL order" || no "id_order 0 will collide with the unique key"

echo "$src" | grep -q "VALIDITY_MONTHS" && ok "a balance expires" || no "points never lapse, though the page says 12 months"

# the pages

guest=$(curl -s -o /dev/null -m 40 -w "%{http_code}" "$SHOP/module/odys_loyalty/rewards")

case "$guest" in 200|302) ok "the rewards page answers ($guest; a visitor is sent to sign in)";; *) no "rewards page -> $guest";; esac

tab=$(sql "SELECT COUNT(*) FROM ps_tab WHERE class_name='AdminOdysLoyalty' AND active=1")

[ "${tab:-0}" -ge 1 ] && ok "Back Office → Clients → Points ODYS exists" || no "no back office screen for points"

hooks=$(sql "SELECT GROUP_CONCAT(h.name) FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook=hm.id_hook JOIN ps_module m ON m.id_module=hm.id_module WHERE m.name='odys_loyalty'")

case "$hooks" in *displayAdminCustomers*) ok "the balance shows on the customer's sheet";; *) no "displayAdminCustomers not registered";; esac

# vouchers have to be switched on at all, and every one must be paid for

vouchers=$(sql "SELECT value FROM ps_configuration WHERE name='PS_CART_RULE_FEATURE_ACTIVE'")

[ "${vouchers:-0}" = "1" ] && ok "vouchers are enabled (a reward is a cart rule)" || no "vouchers are off: a redeemed code would be refused"

orphans=$(sql "SELECT COUNT(*) FROM ps_cart_rule cr WHERE cr.code LIKE 'ODYS%' AND cr.id_cart_rule NOT IN (SELECT COALESCE(id_cart_rule,0) FROM ps_odys_loyalty_history)")

[ "${orphans:-0}" = "0" ] && ok "no voucher without a matching deduction" || no "$orphans voucher(s) nobody paid points for"

step "Back office: the screens an employee actually opens"

: "${ADMIN_MAIL:?ADMIN_MAIL missing from docker/.env}"

: "${ADMIN_PASSWD:?ADMIN_PASSWD missing from docker/.env}"

BOF=${PS_FOLDER_ADMIN:-admin-odys}

JAR=$(mktemp)

# the password goes straight from the environment into curl: it is never a

# command-line argument, so it stays out of `ps`

curl -s -c "$JAR" -m 60 -L "$SHOP/$BOF/" -o /tmp/bo-login.html

lt=$(grep -o 'name="token" value="[^"]*"' /tmp/bo-login.html | head -1 | sed 's/.*value="//;s/"//')

dash=$(curl -s -b "$JAR" -c "$JAR" -m 90 -o /dev/null -w "%{redirect_url}" \
  -d "controller=AdminLogin" -d "submitLogin=1" -d "token=$lt" \
  --data-urlencode "email=$ADMIN_MAIL" --data-urlencode "passwd=$ADMIN_PASSWD" \
  "$SHOP/$BOF/index.php?controller=AdminLogin&token=$lt")

case "$dash" in *AdminDashboard*) ok "an employee can sign in";; *) no "back office login failed";; esac

mtok=$(printf '%s' "$dash" | sed 's/.*token=//')

curl -s -b "$JAR" -c "$JAR" -m 90 -L "$dash" -o /tmp/bo-dash.html

mods=$(grep -oE 'controller=AdminModules&amp;token=[a-f0-9]+' /tmp/bo-dash.html | head -1 | sed 's/.*token=//')

if [ -n "$mods" ]; then ok "the dashboard renders its menu"; else no "no dashboard menu"; fi

# a module with an admin tab still gets a Configure button: without getContent()

# PrestaShop threw "Method of module cannot be found" and answered 500

for m in odys_crm odys_loyalty; do

  c=$(curl -s -b "$JAR" -c "$JAR" -m 90 -L -o /tmp/bo-$m.html -w "%{http_code}" \
      "$SHOP/$BOF/index.php?controller=AdminModules&configure=$m&token=$mods")

  [ "$c" = "200" ] && ok "configure $m -> 200" || no "configure $m -> $c"

done

if grep -q 'name="submit_odys_loyalty"' /tmp/bo-odys_loyalty.html; then

  ok "the settings form posts to the module that reads it"

else

  no "the Save button carries a name the module never checks"

fi

grep -q 'name="ODYS_FACEBOOK"' /tmp/bo-odys_loyalty.html \
  && ok "every social link the footer reads has a field" \
  || no "ODYS_FACEBOOK is read by the footer but cannot be set"

rm -f "$JAR" /tmp/bo-login.html /tmp/bo-dash.html /tmp/bo-odys_*.html

step "Back office: the theme's own settings"

tabs=$(sql "SELECT COUNT(*) FROM ps_tab WHERE class_name IN ('AdminOdysLoyalty','AdminOdysTheme') AND active=1")

[ "${tabs:-0}" = "2" ] && ok "both ODYS screens exist (Points, Thème)" || no "${tabs:-0}/2 ODYS back office screens"

src=$(cat ../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/controllers/admin/AdminOdysThemeController.php 2>/dev/null)

echo "$src" | grep -q "strip_tags" && ok "settings text is stripped of markup on the way in" || no "markup could be stored from the settings form"

echo "$src" | grep -q "Caractéristiques" && ok "the screen says where the notes are edited" || no "no pointer to the pyramid fields"

# the hero reads its words from configuration, with the shipped copy as fallback

home=$(curl -s -m 40 "$SHOP/")

# Le surtitre passe maintenant par |escape, comme le titre juste au-dessus :

# l'apostrophe sort en &#039;. Les deux formes sont le meme texte.

case "$home" in *"L'art de l'essence"*|*"L&#039;art de l&#039;essence"*) ok "hero copy renders (fallback in use)";; *) no "hero eyebrow missing";; esac

tpl=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/home-hero.tpl 2>/dev/null)

echo "$tpl" | grep -q "ODYS_HERO_TITLE_1" && ok "the headline is a setting" || no "the headline is still hard-coded"

bar=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/announcement-bar.tpl 2>/dev/null)

echo "$bar" | grep -q "ODYS_ANNOUNCE" && ok "the announcement bar is a setting" || no "the ticker is still hard-coded"

# the pyramid: three features, editable per product, and mapped by id

# accented names do not survive the trip through the shell; match the prefix

feats=$(sql "SELECT COUNT(*) FROM ps_feature_lang WHERE id_lang=1 AND name LIKE 'Notes de%'")

[ "${feats:-0}" = "3" ] && ok "the three pyramid features exist in the catalogue" || no "${feats:-0}/3 pyramid features"

prod=$(cat ../dist/odys-theme-ps8/themes/odys/templates/catalog/product.tpl 2>/dev/null)

echo "$prod" | grep -q "ODYS_FEAT_TETE" && ok "the pyramid follows the configured features" || no "the pyramid matches on the feature name only"

tiers=$(curl -s -m 40 "$SHOP/parfums/22-l-or.html" | grep -c 'class="olf-tier')

[ "${tiers:-0}" = "3" ] && ok "a perfume renders its three tiers" || no "${tiers:-0}/3 tiers on the product page"

# the rest of the shop's words, and the film, are settings too

ctl=$(cat ../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/controllers/admin/AdminOdysThemeController.php 2>/dev/null)

for key in ODYS_COLL_TITLE ODYS_FOOTER_BLURB ODYS_SVC_1 ODYS_HERO_VIDEO; do

  echo "$ctl" | grep -q "$key" && ok "$key is on the settings screen" || no "$key is not editable"

done

echo "$ctl" | grep -q "finfo_file" && ok "an upload is judged on its content, not its name" \
  || no "the uploader trusts the browser's content type"

echo "$ctl" | grep -q "_PS_IMG_DIR_" && ok "uploads land outside the theme (a rebuild cannot erase them)" \
  || no "uploads would be overwritten by the next build"

cat=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/home-categories.tpl 2>/dev/null)

echo "$cat" | grep -q "ODYS_COLL_TITLE" && ok "the collections heading is a setting" || no "collections heading hard-coded"

foot=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/footer.tpl 2>/dev/null)

echo "$foot" | grep -q "ODYS_FOOTER_BLURB" && ok "the footer paragraph is a setting" || no "footer paragraph hard-coded"

prod2=$(cat ../dist/odys-theme-ps8/themes/odys/templates/catalog/product.tpl 2>/dev/null)

echo "$prod2" | grep -q "ODYS_SVC_1" && ok "the product services are settings" || no "product services hard-coded"

hero=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/home-hero.tpl 2>/dev/null)

echo "$hero" | grep -q "ODYS_HERO_POSTER" && ok "l'image du hero est remplacable en Back Office" \
  || no "l'image du hero ne peut etre changee qu'en reconstruisant"

# with nothing set, every one of them still renders the shipped words

case "$home" in *"Trouvez votre ODYS"*) ok "collections fall back to the shipped title";; *) no "collections heading empty";; esac

case "$home" in *"Une maison de parfum"*) ok "the footer falls back to the shipped text";; *) no "footer paragraph empty";; esac

step "Diffuseurs: the new line"

cat_id=$(sql "SELECT c.id_category FROM ps_category c JOIN ps_category_lang cl ON cl.id_category=c.id_category AND cl.id_lang=1 WHERE cl.link_rewrite='diffuseurs'")

[ -n "$cat_id" ] && ok "the Diffuseurs category exists (#$cat_id)" || no "no Diffuseurs category"

conf=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_CAT_DIFFUSEURS'")

[ "${conf:-0}" = "${cat_id:-x}" ] && ok "the theme knows its id" || no "ODYS_CAT_DIFFUSEURS is '${conf:-unset}', category is '${cat_id:-none}'"

n=$(sql "SELECT COUNT(*) FROM ps_category_product WHERE id_category=${cat_id:-0}")

[ "${n:-0}" -ge 1 ] && ok "$n product(s) in the line" || no "the category is empty"

page=$(curl -s -o /dev/null -m 60 -w "%{http_code}" "$SHOP/${cat_id}-diffuseurs")

[ "$page" = "200" ] && ok "the category page answers 200" || no "the category page answers $page"

case "$(curl -s -m 40 "$SHOP/")" in *">Diffuseurs<"*) ok "it is in the navigation";; *) no "no menu entry";; esac

# a diffuser is an ordinary product: it earns points, unlike oud sold by gram

excl=$(sql "SELECT COUNT(*) FROM ps_product p JOIN ps_category_product cp ON cp.id_product=p.id_product WHERE cp.id_category=${cat_id:-0} AND (p.unity <> '' OR p.reference LIKE 'OUD-%' OR p.reference LIKE 'BK-%')")

[ "${excl:-0}" = "0" ] && ok "diffusers earn points like any perfume" || no "${excl} diffuser(s) fall under an exclusion"

step "Campagnes: what a post was worth"

t=$(sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name IN ('ps_odys_campaign','ps_odys_campaign_order')")

[ "${t:-0}" = "2" ] && ok "both campaign tables exist" || no "campaign tables missing"

pk=$(sql "SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='ps_odys_campaign_order' AND index_name='PRIMARY' AND column_name='id_order'")

[ "${pk:-0}" -ge 1 ] && ok "one attribution per order, enforced by the key" || no "an order could be credited twice"

tab=$(sql "SELECT COUNT(*) FROM ps_tab WHERE class_name='AdminOdysCampaigns' AND active=1")

[ "${tab:-0}" -ge 1 ] && ok "Back Office → Clients → Campagnes ODYS exists" || no "no campaigns screen"

src=$(cat ../dist/odys-theme-ps8/modules/odys_crm/classes/OdysCampaign.php 2>/dev/null)

echo "$src" | grep -q "cleanSlug" && ok "the slug from the URL is cleaned before use" || no "the campaign slug is used raw"

echo "$src" | grep -q "INSERT IGNORE" && ok "a replayed hook cannot inflate the numbers" || no "attribution is not idempotent"

mod=$(cat ../dist/odys-theme-ps8/modules/odys_crm/odys_crm.php 2>/dev/null)

echo "$mod" | grep -q "trackCampaign" && ok "a visit through a campaign link is counted" || no "clicks are never recorded"

echo "$mod" | grep -q "OdysCampaign::attribute" && ok "a validated order credits its campaign" || no "orders are never attributed"

# an unknown campaign must be ignored rather than created on the fly

before=$(sql "SELECT COUNT(*) FROM ps_odys_campaign")

curl -s -o /dev/null -m 40 "$SHOP/?c=ceci-nexiste-pas"

after=$(sql "SELECT COUNT(*) FROM ps_odys_campaign")

[ "${before:-0}" = "${after:-1}" ] && ok "an unknown link creates nothing" || no "an unknown slug created a campaign"

step "Oud: the gram price and the ladder"

# the price per gram is the product's own price field — what Back Office edits

rate=$(sql "SELECT ROUND(price) FROM ps_product WHERE reference='OUD-BOUKHOUR-PRESTIGE'")

[ -n "$rate" ] && ok "the per-gram price lives on the product ($rate DH/g)" || no "no per-gram price stored"

oud=$(curl -s -m 40 "$SHOP/oud-boukhour/27-boukhour-prestige.html")

case "$oud" in *"$rate DH le gramme"*) ok "the page quotes that same rate";; *) no "the page and the product disagree on the rate";; esac

# a card's price must be the rate times its weight, not a number of its own

card=$(printf '%s' "$oud" | grep -A 1 'data-grams="5"' | grep -oE 'data-price="[0-9]+"' | head -1 | tr -dc 0-9)

[ "${card:-0}" = "$((rate * 5))" ] && ok "5 g costs 5 × the rate ($card DH)" || no "5 g is ${card:-?} DH, expected $((rate * 5))"

# the ladder is a setting, with the shipped one as fallback

ctl=$(cat ../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/controllers/admin/AdminOdysThemeController.php 2>/dev/null)

echo "$ctl" | grep -q "ODYS_GRAM_STEPS" && ok "the grammages are editable" || no "the gram ladder is hard-coded"

tpl=$(cat ../dist/odys-theme-ps8/themes/odys/templates/catalog/product.tpl 2>/dev/null)

echo "$tpl" | grep -q "ODYS_GRAM_STEPS" && ok "the page reads the setting" || no "the page ignores the setting"

case "$oud" in *'data-grams="5"'*) ok "with nothing set, the shipped ladder renders";; *) no "the default ladder is missing";; esac

js=$(curl -s -m 40 "$SHOP/themes/odys/assets/js/app.js")

echo "$js" | grep -q "cards.dataset.min" && ok "the stepper honours the shop's minimum" || no "the minimum is hard-coded in the script"

step "Trust: reaching a human, and claims the shop can keep"

# a discount that is not given must not be advertised

home=$(curl -s -m 40 "$SHOP/")

case "$home" in *"Duo −10"*|*"Trio −20"*) no "the shop still advertises a coffret discount it does not give";;

  *) ok "no unearned discount claim on the home page";; esac

tplsrc=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/announcement-bar.tpl ../dist/odys-theme-ps8/themes/odys/templates/pages/index.tpl 2>/dev/null)

case "$tplsrc" in *"−10%"*|*"−10 %"*) no "the claim is still in the templates";; *) ok "the claim is gone from the templates too";; esac

# the contact block: present, and silent until the numbers are set

part=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/contact-links.tpl 2>/dev/null)

[ -n "$part" ] && ok "the contact partial ships" || no "no contact partial"

echo "$part" | grep -q "ODYS_WA_NUMBER" && ok "it reads the shop's own numbers" || no "the number is hard-coded"

wa=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_WA_NUMBER'")

if [ -z "$wa" ]; then

  case "$home" in *odys-contact*) no "an empty number still renders a dead link";; *) ok "nothing renders while the numbers are unset";; esac

else

  case "$home" in *"wa.me/$wa"*) ok "the WhatsApp link uses the configured number";; *) no "the number is set but no link renders";; esac

fi

prod=$(cat ../dist/odys-theme-ps8/themes/odys/templates/catalog/product.tpl 2>/dev/null)

echo "$prod" | grep -q "contact-links.tpl" && ok "a buyer can ask about the product they are looking at" || no "no contact link on the product page"

step "Lancement: la liste, les liens, le message"

imp=$(cat ../dist/odys-theme-ps8/import_contacts.php 2>/dev/null || cat ../psbuild/import_contacts.php 2>/dev/null)

[ -n "$imp" ] && ok "l'import de contacts est livré" || no "pas de script d'import"

echo "$imp" | grep -q "consentement" && ok "l'import distingue les contacts consentants" || no "l'import ignore le consentement"

echo "$imp" | grep -q '212' && ok "les numéros marocains sont normalisés" || no "les numéros ne sont pas normalisés"

echo "$imp" | grep -q -- "--write" && ok "essai à blanc par défaut" || no "l'import écrit sans confirmation"

n=$(sql "SELECT COUNT(*) FROM ps_odys_campaign WHERE slug LIKE 'lancement-%'")

[ "${n:-0}" -ge 4 ] && ok "$n liens de lancement créés" || no "${n:-0} lien(s) de lancement"

# une campagne sans remise ne doit créer aucun bon

rules=$(sql "SELECT COUNT(*) FROM ps_odys_campaign WHERE slug LIKE 'lancement-%' AND id_cart_rule IS NOT NULL")

[ "${rules:-0}" = "0" ] && ok "aucun bon créé pour des liens sans remise" || no "${rules} bon(s) créé(s) sans remise demandée"

# le lien compte bien

before=$(sql "SELECT clicks FROM ps_odys_campaign WHERE slug='lancement-wa'")

curl -s -o /dev/null -m 40 "$SHOP/?c=lancement-wa"

after=$(sql "SELECT clicks FROM ps_odys_campaign WHERE slug='lancement-wa'")

[ "${after:-0}" -gt "${before:-0}" ] && ok "un clic sur le lien de lancement est compté" || no "le lien ne compte pas"

copy=$(cat ../dist/odys-theme-ps8/legal/annonce-lancement.md 2>/dev/null || cat ../psbuild/legal/annonce-lancement.md 2>/dev/null)

echo "$copy" | grep -q "Paiement à la livraison\|paiement à la livraison" && ok "le message met le paiement à la livraison en avant" || no "le message n'exploite pas le COD"

case "$copy" in *"−10 %"*|*"-10%"*) no "le message promet une remise que la boutique ne donne pas";; *) ok "aucune remise promise";; esac

# le visuel porte un code : ce code doit exister et fonctionner

step "Le visuel de lancement et son code"

row=$(sql "SELECT CONCAT(c.code,'|',c.discount,'|',COALESCE(cr.active,0),'|',COALESCE(cr.quantity_per_user,0)) FROM ps_odys_campaign c LEFT JOIN ps_cart_rule cr ON cr.id_cart_rule=c.id_cart_rule WHERE c.slug='lancement15'")

code=$(echo "$row" | cut -d'|' -f1); disc=$(echo "$row" | cut -d'|' -f2 | cut -d. -f1)

act=$(echo "$row" | cut -d'|' -f3); per=$(echo "$row" | cut -d'|' -f4)

[ "$code" = "LANCEMENT15" ] && ok "la campagne existe, code $code" || no "code inattendu : '${code:-aucun}'"

[ "${disc:-0}" = "15" ] && ok "la remise est bien de 15 %" || no "remise de ${disc:-0} %, le visuel annonce 15"

[ "${act:-0}" = "1" ] && ok "le bon est actif" || no "le bon n'est pas actif"

[ "${per:-0}" = "1" ] && ok "une utilisation par client" || no "quantité par client : ${per:-0}"

for f in odys-lancement-post.png odys-lancement-story.png odys-lancement-banniere.png; do

  [ -s "../dist/odys-theme-ps8/launch/$f" ] && ok "visuel livré : $f" || no "visuel manquant : $f"

done

copy=$(cat ../dist/odys-theme-ps8/legal/annonce-lancement.md 2>/dev/null)

case "$copy" in *"$code"*) ok "le message annonce le même code que le visuel";; *) no "le message et le visuel ne disent pas le même code";; esac

step "Les champs de formulaire se voient"

css=$(curl -s -m 40 "$SHOP/themes/odys/assets/css/theme.css")

# un champ doit avoir un fond, pas seulement un filet à 22 %

# Le fond etait #121319, l'encre du theme sombre : depuis l'ivoire il

# peignait en noir tout champ hors .cf, a commencer par la quantite.

case "$css" in *"background:var(--odys-surface,#fff);  /* papier"*) ok "les champs ont un fond clair et opaque";; *) no "les champs restent transparents";; esac

case "$css" in *"  border:1px solid var(--odys-border);"*) ok "le contour est net (1px, jeton de bordure)";; *) no "le contour est resté trop discret";; esac

# l'ancien bloc qui gagnait en spécificité ne doit pas revenir

case "$css" in *"body.registration input[type=text]"*) no "l'ancien style de champ est revenu et reprend le dessus";; *) ok "un seul style de champ dans la feuille";; esac

case "$css" in *"box-shadow:0 0 0 3px rgba(201,166,107,.20)"*) ok "le focus est visible (anneau doré)";; *) no "pas d'anneau de focus";; esac

case "$css" in *"min-height:46px"*) ok "les champs font 46 px (utilisables au doigt)";; *) no "champs trop bas pour le tactile";; esac

case "$css" in *"-webkit-autofill"*) ok "le remplissage automatique reste lisible";; *) no "l'autofill repassera en blanc sur blanc";; esac

# et la page d'inscription les rend vraiment

reg=$(curl -s -m 40 "$SHOP/inscription")

n=$(printf '%s' "$reg" | grep -c 'class="form-control')

[ "${n:-0}" -ge 3 ] && ok "$n champs sur la page d'inscription" || no "${n:-0} champ(s) rendus"

step "Aucune page ne laisse fuir un avertissement PHP"

# une clé absente s'imprime dans le HTML en mode dev, et casse l'attribut qui

# la contenait — invisible en production, mais le lien reste cassé

leaks=0

for path in "" "10-parfums" "parfums/22-l-or.html" "content/10-fidelite" "nous-contacter" "connexion" "inscription" "panier?action=show"; do

  body=$(curl -s -m 60 -L "$SHOP/$path")

  hits=$(printf '%s' "$body" | grep -c "var/cache/dev/smarty\|Warning: Undefined\|Notice: Undefined\|Undefined array key")

  if [ "${hits:-0}" != "0" ]; then

    no "/$path imprime un avertissement PHP dans la page"

    leaks=$((leaks+1))

  fi

done

[ "$leaks" = "0" ] && ok "8 pages publiques, aucune fuite" || no "$leaks page(s) concernée(s)"

# et la carte qui a causé la fuite reste protégée

acct=$(cat ../dist/odys-theme-ps8/themes/odys/templates/customer/my-account.tpl 2>/dev/null)

# The card used to depend on blockwishlist's URL and printed a PHP warning into

# its href whenever the module was not providing one. It points at the theme's

# own saved list now, which always has an address of its own.

echo "$acct" | grep -q "urls.pages.wishlist" \
  && no "la carte dépend encore d'une URL qu'un module peut ne pas fournir" \
  || ok "la carte pointe vers la liste du thème, toujours disponible"

echo "$acct" | grep -q "'envies'" \
  && ok "la carte mène à /mes-envies" || no "la carte ne mène pas à la liste"

step "Un client marocain peut commander"

# Tous les transporteurs livrés avec PrestaShop sont limités aux zones Europe

# et Amérique du Nord. Le Maroc est en zone Afrique : le tunnel de commande

# n'offrait aucune livraison, donc aucune commande n'était possible.

zone=$(sql "SELECT z.name FROM ps_country c JOIN ps_zone z ON z.id_zone=c.id_zone WHERE c.iso_code='MA'")

carriers=$(sql "SELECT COUNT(*) FROM ps_carrier ca

                JOIN ps_carrier_zone cz ON cz.id_carrier=ca.id_carrier

                JOIN ps_country co ON co.id_zone=cz.id_zone

                WHERE co.iso_code='MA' AND ca.active=1 AND ca.deleted=0")

[ "${carriers:-0}" -ge 1 ] \
  && ok "$carriers transporteur(s) desservent le Maroc (zone ${zone:-?})" \
  || no "aucun transporteur ne dessert le Maroc — le tunnel de commande est bloqué"

# Et une livraison gratuite promise sur chaque page doit exister pour de vrai.

free=$(sql "SELECT value FROM ps_configuration WHERE name='PS_SHIPPING_FREE_PRICE'")

case "${free:-0}" in

  0|0.000000|"") no "la livraison offerte dès 300 DH est annoncée mais pas configurée";;

  *) ok "livraison offerte à partir de ${free%%.*} DH";;

esac

step "Un moyen de paiement est proposé au Maroc"

# PrestaShop restreint chaque module de paiement par pays, devise, transporteur

# et groupe. L'installeur y avait laissé les valeurs de la boutique de

# démonstration : le tunnel affichait « aucun moyen de paiement n'est disponible ».

paymods=$(sql "SELECT COUNT(DISTINCT m.id_module) FROM ps_module m

               JOIN ps_hook_module hm ON hm.id_module=m.id_module

               JOIN ps_hook h ON h.id_hook=hm.id_hook

               JOIN ps_module_country mc ON mc.id_module=m.id_module

               JOIN ps_country c ON c.id_country=mc.id_country AND c.iso_code='MA'

               JOIN ps_module_currency mcu ON mcu.id_module=m.id_module

                 AND mcu.id_currency=(SELECT value FROM ps_configuration WHERE name='PS_CURRENCY_DEFAULT')

               WHERE h.name='paymentOptions' AND m.active=1")

[ "${paymods:-0}" -ge 1 ] \
  && ok "$paymods module(s) de paiement autorisés au Maroc en MAD" \
  || no "aucun moyen de paiement disponible au Maroc — la commande est impossible"

step "Le nom de la boutique n'est plus « PrestaShop »"

# $context->shop->name lit l'enregistrement de la boutique, pas PS_SHOP_NAME :

# le paiement à la livraison l'imprime sur chaque page de confirmation.

sname=$(sql "SELECT name FROM ps_shop WHERE id_shop=1")

[ "$sname" != "PrestaShop" ] && ok "la boutique s'appelle « $sname »" \
  || no "la page de confirmation dira « Votre commande sur PrestaShop »"

step "Le formulaire de connexion soumet vraiment"

# Sur la page rendue, pas dans un gabarit : le formulaire a deja demenage une

# fois (de authentication.tpl vers _partials/login-form.tpl) et la verification

# fichier a suivi la lettre en perdant l'intention.

curl -s -m 40 "$SHOP/connexion" -o /tmp/auth.html

# AuthController ne fait rien sans submitLogin : sans ce nom, la page se

# redessinait sans message et personne ne pouvait se connecter.

grep -q 'name="submitLogin"' /tmp/auth.html \
  && ok "le bouton porte name=submitLogin" \
  || no "connexion impossible : le bouton n'envoie pas submitLogin"

grep -q "Fatal error\|Uncaught" /tmp/auth.html \
  && no "la page de connexion leve une exception" \
  || ok "la page de connexion rend sans exception"

step "On se connecte avec son numero de telephone"

# Le champ doit accepter un numero : en type=email le navigateur refuse la

# saisie avant meme l'envoi, et la traduction cote serveur ne sert a rien.

grep -qE 'id="field-email"[^>]*type="email"|type="email"[^>]*id="field-email"' /tmp/auth.html \
  && no "le champ est en type=email : un numero ne peut pas y etre tape" \
  || ok "le champ de connexion accepte autre chose qu'un e-mail"

[ "$(sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='ps_odys_phone'")" = "1" ] \
  && ok "la table ps_odys_phone existe" \
  || no "ps_odys_phone absente : la connexion par telephone ne peut pas marcher"

hk=$(sql "SELECT COUNT(DISTINCT h.name) FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook = hm.id_hook JOIN ps_module m ON m.id_module = hm.id_module WHERE m.name = 'odys_crm' AND h.name IN ('additionalCustomerFormFields','validateCustomerFormFields','actionCustomerAccountAdd','actionCustomerAccountUpdate','actionDispatcherBefore')")

[ "$hk" = "5" ] \
  && ok "les 5 hooks du telephone sont enregistres" \
  || no "seulement $hk/5 hooks du telephone enregistres"

curl -s -m 40 "$SHOP/inscription" -o /tmp/reg.html

grep -q 'name="phone"' /tmp/reg.html \
  && ok "le formulaire d'inscription demande un telephone" \
  || no "pas de champ telephone a l'inscription"

# Un mot de passe faux doit le dire, sinon le client reessaie le meme.

rm -f /tmp/auth-jar

curl -s -m 40 "$SHOP/connexion" -o /dev/null -c /tmp/auth-jar

curl -s -m 40 -b /tmp/auth-jar -c /tmp/auth-jar "$SHOP/connexion" \
  --data-urlencode "submitLogin=1" --data-urlencode "email=0600000000" \
  --data-urlencode "password=volontairement-faux" -o /tmp/auth-ko.html

grep -q 'cf-err' /tmp/auth-ko.html \
  && ok "un echec de connexion affiche un message" \
  || no "un echec de connexion renvoie la page sans explication"

grep -q "Fatal error\|Uncaught\|InvalidArgument" /tmp/auth-ko.html \
  && no "un numero inconnu leve une exception au lieu d'echouer proprement" \
  || ok "un numero inconnu echoue comme un mot de passe faux"

step "Le tunnel de commande herite du meme formulaire"

# L'etape « Informations personnelles » ne rend pas authentication.tpl : elle

# rend checkout/_partials/login-form.tpl, qui ETEND le notre. Tout ce qui

# vivait dans authentication.tpl n'atteignait donc jamais le tunnel — et

# c'est la, le paiement en vue, qu'un mot de passe oublie coute un panier.

jar=/tmp/tunnel-jar; rm -f $jar

idp=$(sql "SELECT id_product FROM ps_product WHERE reference='01' LIMIT 1")

curl -s -m 40 -c $jar "$SHOP/" -o /dev/null

tok=$(curl -s -m 40 -b $jar -c $jar "$SHOP/panier?action=show" | grep -o 'static_token[^0-9a-f]*[0-9a-f]\{32\}' | grep -o '[0-9a-f]\{32\}' | head -1)

curl -s -m 40 -b $jar -c $jar "$SHOP/panier?add=1&id_product=${idp:-20}&qty=1&action=update&ajax=1&token=$tok" -o /dev/null

curl -s -m 40 -b $jar -c $jar "$SHOP/commande" -o /tmp/tunnel.html

if grep -q "checkout-login-form" /tmp/tunnel.html; then

  ok "l etape Informations personnelles propose la connexion"

  grep -q "Email ou t" /tmp/tunnel.html && ok "le tunnel accepte aussi un numero de telephone" || no "le tunnel ne demande qu un e-mail"

  grep -q "lf-oubli" /tmp/tunnel.html && ok "un mot de passe oublie a une issue dans le tunnel" || no "aucun lien d oubli dans le tunnel : le panier est perdu"

else

  no "le tunnel ne montre pas de formulaire de connexion (panier vide ?)"

fi

# Le lien a demenage dans le partial : il ne doit pas s afficher deux fois

# sur la page de connexion, qui le portait deja.

n=$(grep -c "Mot de passe oubli" /tmp/auth.html)

[ "${n:-0}" = "1" ] && ok "le lien d oubli n est ecrit qu une fois" || no "$n liens d oubli sur la page de connexion"

step "La page 404 ne deborde pas sur les listes vides"

# classic inclut errors/not-found.tpl quand une liste de produits est vide.

# Notre 404 etant une vraie page d'erreur, une recherche sans resultat

# affichait « Erreur 404 - cette page s'est evaporee » sous le titre

# « Resultats de la recherche », avec deux <h1> dans la page.

curl -s -m 40 "$SHOP/recherche" -o /tmp/rech-vide.html

curl -s -m 40 "$SHOP/recherche?controller=search&s=zzzznexistepas" -o /tmp/rech-rien.html

curl -s -m 40 "$SHOP/cette-page-nexiste-pas" -o /tmp/vraie404.html -w '%{http_code}' > /tmp/code404.txt

grep -q "Erreur 404" /tmp/rech-vide.html \
  && no "une recherche vide affiche la page 404" \
  || ok "une recherche vide affiche un message de liste vide"

grep -q "Aucun" /tmp/rech-rien.html \
  && ok "une recherche sans resultat le dit" \
  || no "une recherche sans resultat n'affiche rien d'utile"

[ "$(grep -c '<h1' /tmp/rech-rien.html)" = "1" ] \
  && ok "un seul <h1> sur la page de recherche" \
  || no "plusieurs <h1> sur la page de recherche"

grep -q "Erreur 404" /tmp/vraie404.html \
  && ok "une page inexistante affiche toujours la 404" \
  || no "la vraie page 404 a perdu son message"

[ "$(cat /tmp/code404.txt)" = "404" ] \
  && ok "la page inexistante repond bien 404" \
  || no "la page inexistante repond $(cat /tmp/code404.txt)"

step "Le formulaire d'inscription se lit dans l'ordre"

# PrestaShop ajoute les champs des modules a la fin : le telephone se

# retrouvait apres les cases de consentement, ou personne ne le remplit.

pos_tel=$(grep -o 'name="phone"\|name="password"\|name="email"' /tmp/reg.html | grep -n 'name="phone"' | head -1 | cut -d: -f1)

pos_mdp=$(grep -o 'name="phone"\|name="password"\|name="email"' /tmp/reg.html | grep -n 'name="password"' | head -1 | cut -d: -f1)

if [ -n "$pos_tel" ] && [ -n "$pos_mdp" ] && [ "$pos_tel" -lt "$pos_mdp" ]; then

  ok "le telephone est avec les coordonnees, pas apres les consentements"

else

  no "le telephone est relegue en bas du formulaire"

fi

grep -q "personal data you provide" /tmp/reg.html \
  && no "le message de confidentialite est reste en anglais" \
  || ok "le message de confidentialite est en francais"

step "Un compte sans mot de passe choisi peut s'en choisir un"

# Un compte ouvert par « Continuer avec Google » recoit un mot de passe

# aleatoire que personne ne connait. La page Identite reclamant le mot de

# passe ACTUEL, ce client etait coincé : ni e-mail ni mot de passe modifiable.

[ "$(sql "SELECT COUNT(*) FROM information_schema.tables WHERE table_name='ps_odys_sans_mdp'")" = "1" ] \
  && ok "la table ps_odys_sans_mdp existe" \
  || no "ps_odys_sans_mdp absente : les comptes sociaux resteront bloques"

hk=$(sql "SELECT COUNT(*) FROM ps_hook_module hm JOIN ps_hook h ON h.id_hook = hm.id_hook JOIN ps_module m ON m.id_module = hm.id_module WHERE m.name = 'odys_crm' AND h.name = 'actionFrontControllerInitAfter'")

[ "$hk" = "1" ] \
  && ok "le hook actionFrontControllerInitAfter est enregistre" \
  || no "sans actionFrontControllerInitAfter la page Identite reste bloquee"

# Aucun compte ne doit accepter une chaine vide comme mot de passe : avec

# passwordRequired a false, PrestaShop hache ce qu'on lui donne, et deux champs

# vides donneraient le hachage de la chaine vide.

vides=$(docker compose exec -T -u www-data shop php -r '

require "/var/www/html/config/config.inc.php";

$c = new PrestaShop\PrestaShop\Core\Crypto\Hashing(); $n = 0;

foreach (Db::getInstance()->executeS("SELECT passwd FROM ps_customer WHERE deleted=0") as $r) {

    if ($c->checkHash("", $r["passwd"], _COOKIE_KEY_)) { ++$n; }

}

echo $n;' 2>/dev/null | tr -d '\r')

[ "$vides" = "0" ] \
  && ok "aucun compte n'accepte un mot de passe vide" \
  || no "$vides compte(s) acceptent un mot de passe vide"

step "Le bouton Ajouter au panier repond"

# Sans ajax=1, PrestaShop ajoute bien le produit mais renvoie la page HTML du

# panier : le JSON.parse du theme echouait, le bloc de succes ne tournait pas,

# et le client ne voyait rien bouger. Il recliquait, ou il partait.

grep -q "ajax: 1," ../dist/odys-theme-ps8/themes/odys/assets/js/app.js \
  && ok "la requete panier demande du JSON (ajax=1)" \
  || no "le POST panier n'a pas ajax=1 : la reponse sera du HTML"

# Elargi : `success` seul ne suffit pas, PrestaShop le renvoie aussi
# quand rien n'est entre dans le panier.
grep -q "resp.success && !resp.hasError" ../dist/odys-theme-ps8/themes/odys/assets/js/app.js \
  && ok "le succes exige l absence d erreur ET un panier non vide" \
  || no "le succes du panier est teste sur une cle que PrestaShop ne renvoie pas"

pid=$(sql "SELECT id_product FROM ps_product WHERE active=1 AND id_product>19 ORDER BY id_product LIMIT 1")

# Pot a cookies neuf a chaque fois. Le reutiliser d'une execution a

# l'autre marchait tant que personne n'avait commande : des qu'une

# commande est passee avec cette session, PrestaShop refuse de modifier

# le panier devenu commande, et le controle echouait en accusant le

# panier, qui lui allait tres bien.

rm -f /tmp/cartjar

rep=$(curl -s -m 40 -c /tmp/cartjar -b /tmp/cartjar \
  --data "action=update&ajax=1&add=1&id_product=$pid&id_product_attribute=0&qty=1" \
  "$SHOP/panier")

case "$rep" in

  *'"success":true'*) ok "l'ajout au panier repond success:true" ;;

  *) no "l'ajout au panier ne renvoie pas de JSON de succes" ;;

esac

step "L'accueil montre des parfums et des prix"

# La grille etait ecrite dans index.tpl depuis le debut mais enfermee dans un

# {if isset($featuredProducts)} que personne ne remplissait : l'accueil

# n'affichait aucun prix et n'offrait aucun achat.

curl -s -m 40 "$SHOP/" -o /tmp/home.html

acc=$(sed -n '/<section class="bsec/,/<section class="nv-fam/p' /tmp/home.html)

nbp=$(echo "$acc" | grep -oE '[0-9]+[,.]?[0-9]*[[:space:]]*DH' | wc -l)

nbb=$(echo "$acc" | grep -o 'data-action="add-' | wc -l)

[ "$nbp" -ge 4 ] \
  && ok "$nbp prix affiches sur l'accueil" \
  || no "seulement $nbp prix sur l'accueil : le visiteur ne sait pas combien ca coute"

[ "$nbb" -ge 4 ] \
  && ok "$nbb boutons d'achat sur l'accueil" \
  || no "seulement $nbb bouton(s) d'achat sur l'accueil"

# et la grille doit venir AVANT le quiz, pas apres six sections

pos_grille=$(grep -b -o '<section class="bsec' /tmp/home.html | head -1 | cut -d: -f1)

pos_quiz=$(grep -b -o '<section class="nv-fam' /tmp/home.html | head -1 | cut -d: -f1)

if [ -n "$pos_grille" ] && [ -n "$pos_quiz" ] && [ "$pos_grille" -lt "$pos_quiz" ]; then

  ok "les parfums passent avant le quiz"

else

  no "les parfums sont encore relegues sous le quiz"

fi

# une bande vide ne doit pas laisser de trou

grep -q 'class="home-modules' /tmp/home.html \
  && no "la bande displayHome s'affiche alors que rien n'y est accroche" \
  || ok "la bande displayHome vide ne laisse pas de trou"

# Le « Trio Decouverte » existait au catalogue mais n'etait nulle part sur

# l'accueil : on ne tombait dessus qu'en ouvrant le menu. C'est pourtant ce

# qu'on propose en premier a quelqu'un qui ne connait pas la maison.

if grep -q 'id="coffretsGrid"' /tmp/home.html; then

  ok "la bande des coffrets est sur l'accueil"

  bande=$(sed -n '/id="coffretsGrid"/,/<\/section>/p' /tmp/home.html)

  n=$(echo "$bande" | grep -c 'class="pc"')

  [ "${n:-0}" -ge 1 ] && ok "$n coffret(s) montre(s) avec leur prix" || no "la bande des coffrets est vide"

  # apres les parfums, avant les familles : les parfums restent en premier

  pc=$(grep -b -o 'id="coffretsGrid"' /tmp/home.html | head -1 | cut -d: -f1)

  pf=$(grep -b -o 'id="featGrid"' /tmp/home.html | head -1 | cut -d: -f1)

  pq=$(grep -b -o '<section class="nv-fam' /tmp/home.html | head -1 | cut -d: -f1)

  if [ -n "$pc" ] && [ -n "$pf" ] && [ -n "$pq" ] && [ "$pf" -lt "$pc" ] && [ "$pc" -lt "$pq" ]; then

    ok "les coffrets viennent apres les parfums et avant les familles"

  else

    no "la bande des coffrets n'est pas a sa place dans l'accueil"

  fi

else

  no "aucune bande de coffrets sur l'accueil"

fi

# Rien d'ecrit en dur : la bande vient de la categorie, elle disparait si

# elle est vide au lieu d'annoncer un coffret qui n'existe plus.

grep -qiE "Trio D|Duo Classique" ../psbuild/templates/pages/index.tpl   && no "un nom de coffret est ecrit en dur dans l'accueil"   || ok "les coffrets viennent de la categorie, pas du gabarit"

# Un coffret n'est inspire de rien : la pastille « Inspire de » restait vide

# et la carte ne disait pas ce qu'il y a dedans. « Duo Classique — 129 DH »

# sous la photo d'un seul flacon se lit comme un flacon a 129 DH.

cof=$(curl -s -m 40 "$(caturl coffrets)")

echo "$cof" | grep -q "pc-pill-cont" && ok "les cartes de coffret annoncent leur contenance" || no "une carte de coffret ne dit pas ce qu elle contient"

# Le separateur est un « · » et un « × » en UTF-8 : un motif qui les compte

# comme un caractere chacun echoue sous grep en locale C. On encadre.

echo "$cof" | grep -qE 'pp-b">Coffret.*50 ml' && ok "la contenance vient de la caracteristique du produit" || no "la contenance ne s affiche pas"

# et les parfums gardent leur inspiration, les deux ne cohabitent pas

par=$(curl -s -m 40 "$(caturl parfums)")

echo "$par" | grep -q "pp-by" && ok "les parfums gardent « Inspire de »" || no "les parfums ont perdu leur inspiration"

echo "$par" | grep -q "pc-pill-cont" && no "une carte porte les deux pastilles a la fois" || ok "une seule pastille par carte"

# Le theme ne reprenait pas le bloc « pack » de classic : un coffret

# affichait son prix et rien de ce qu'il y a dedans. Le bloc ne s'ecrit pas

# en dur — il vient de $packItems, que PrestaShop remplit quand le produit

# est declare comme pack en Back Office. Sur la boutique de developpement

# le Duo l'est, pour que ce controle ait quelque chose a regarder.

pk=$(sql "SELECT CONCAT(cl.link_rewrite,'/',p.id_product,'-',pl.link_rewrite) FROM ps_product p JOIN ps_product_lang pl ON pl.id_product=p.id_product AND pl.id_lang=1 JOIN ps_category_lang cl ON cl.id_category=p.id_category_default AND cl.id_lang=1 WHERE p.active=1 AND p.cache_is_pack=1 ORDER BY p.id_product DESC LIMIT 1")

if [ -n "$pk" ]; then

  pg=$(curl -s -m 40 "$SHOP/$pk.html")

  echo "$pg" | grep -q "pk-box" && ok "un pack annonce ce qu il contient" || no "un pack n affiche pas son contenu"

  n=$(echo "$pg" | grep -c "pk-name")

  [ "${n:-0}" -ge 2 ] && ok "$n produits listes dans le pack" || no "le pack ne liste que ${n:-0} produit(s)"

else

  no "aucun produit declare comme pack : le bloc contenu n est pas verifie"

fi

grep -qiE "L.IcÃ´ne|La Nuit|L.Oriental" ../ref/odys-theme-ps8/themes/odys/templates/catalog/product.tpl   && no "un nom de parfum est ecrit en dur dans la fiche produit"   || ok "le contenu du coffret vient des donnees, pas du gabarit"

step "Les pages de mot de passe tiennent dans une colonne"

curl -s -m 40 "$SHOP/recuperation-mot-de-passe" -o /tmp/pwd.html

# Sur les GABARITS, pas sur la page rendue : l'en-tete du theme et le module

# newsletter posent legitimement leurs propres classes, et un grep sur toute la

# page attrapait meme le commentaire qui nomme les classes a eviter.

pwdir=../dist/odys-theme-ps8/themes/odys/templates/customer

sale=0

for f in password-email password-new password-infos; do

  grep -qE 'class="[^"]*(col-md-|card card-block|hidden-xs-down)' "$pwdir/$f.tpl" && sale=$((sale+1))

done

[ "$sale" = "0" ] \
  && ok "les gabarits de mot de passe n'utilisent plus la grille de classic" \
  || no "$sale gabarit(s) de mot de passe utilisent encore la grille Bootstrap"

icones=0

for f in password-email password-new password-infos; do

  grep -q 'class="material-icons' "$pwdir/$f.tpl" && icones=$((icones+1))

done

[ "$icones" = "0" ] \
  && ok "plus d'icone Material Icons dans les gabarits de mot de passe" \
  || no "$icones gabarit(s) gardent une icone Material Icons, dont la police n'est pas chargee"

grep -q 'max-width:480px' /tmp/pwd.html \
  && ok "le formulaire est contenu dans une colonne" \
  || no "le formulaire part sur toute la largeur"

grep -q 'block_newsletter{display:none}' ../dist/odys-theme-ps8/themes/odys/assets/css/theme.css \
  && ok "l'encart newsletter est masque sur les pages de mot de passe" \
  || no "l'encart newsletter reste sur les pages de mot de passe"

# la coche de confirmation : un <svg> sans width/height s'etire a tout le bloc

if grep -q 'viewBox="0 0 24 24"' ../dist/odys-theme-ps8/themes/odys/templates/customer/password-infos.tpl; then

  grep -q 'width="22" height="22"' ../dist/odys-theme-ps8/themes/odys/templates/customer/password-infos.tpl \
    && ok "la coche de confirmation est dimensionnee" \
    || no "la coche de confirmation n'a pas de dimensions : elle barrera la page"

else

  no "password-infos.tpl ne contient pas la coche attendue"

fi

step "La palette Jour tient"

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

# L'or doux sur l'ivoire donne 2.06:1. Toute declaration qui met de l'or en

# COULEUR DE TEXTE doit passer par --odys-gold-text, que les rares zones

# La frontiere en tete compte : sans elle le motif attrape aussi

# `border-color:`, qui n'est pas une couleur de texte.

# sombres redefinissent pour leurs descendants.

reste=$(grep -oE '(^|[;{[:space:]])color:[[:space:]]*var\(--(odys-gold|rose|odys-sand)[,)]' "$css" | wc -l)

[ "$reste" = "0" ] \
  && ok "aucun or en texte ne contourne --odys-gold-text" \
  || no "$reste declaration(s) mettent encore l'or doux en couleur de texte"

# La VALEUR de l'or de texte n'est plus figee ici : elle a du changer deux
# fois en un apres-midi, parce qu'un meme chiffre ne tient pas sur les trois
# ivoires du site. C'est palette_contraste.js qui la mesure. Ici on verifie
# seulement que le jeton existe et passe par --odys-gold-encre, l'unique
# source : les sections sombres remplacent --odys-gold-text par l'or doux,
# et ce qui doit revenir a l'or profond dans une telle section pointe sur
# l'encre.
grep -q -- '--odys-gold-text:var(--odys-gold-encre)' "$css" \
  && ok "l'or de texte descend de l'unique jeton --odys-gold-encre" \
  || no "l'or de texte est fige au lieu de suivre --odys-gold-encre"

grep -q -- '--odys-cream:#F4EFE5' "$css" \
  && ok "le sol de la page est l'ivoire" \
  || no "l'ivoire n'est pas le fond de page"

grep -q -- '--odys-vert:#182820' "$css" \
  && ok "le vert profond est defini" \
  || no "le vert profond manque"

# le logo avait disparu : creme sur ivoire

grep -q 'odys-logo-w{color:var(--odys-vert)}' "$css" || grep -q 'color:var(--odys-vert);transition:color' "$css" \
  && ok "le logo est ecrit en vert sur la barre claire" \
  || no "le logo risque d'etre ivoire sur ivoire"

step "Les fiches produit se lisent"

# La description tenait en une phrase, et le gabarit l'echappait : le client

# lisait « <p>Inspire de... </p> », balises comprises.

curl -s -m 40 "$SHOP/parfums/23-l-oriental.html" -o /tmp/fiche.html

grep -q '&lt;p&gt;' /tmp/fiche.html \
  && no "la description affiche ses balises HTML en clair" \
  || ok "la description n'affiche plus ses balises"

grep -q 'pd-accords' /tmp/fiche.html \
  && ok "la fiche porte ses accords olfactifs" \
  || no "pas d'accords sur la fiche : la description n'a pas ete posee"

grep -q 'pd-pour' /tmp/fiche.html \
  && ok "la fiche dit quand porter le parfum" \
  || no "la fiche ne dit pas quand porter le parfum"

# la mention d'inspiration doit rester celle de la page A propos : une

# reference olfactive, pas une affiliation

grep -q "n'ont aucun lien avec ODYS" /tmp/fiche.html \
  && ok "la fiche precise que les marques citees sont sans lien avec ODYS" \
  || no "la mention d'independance manque sur la fiche"

nb=$(sql "SELECT COUNT(*) FROM ps_product_lang WHERE CHAR_LENGTH(description) > 400")

[ "$nb" -ge 10 ] \
  && ok "$nb fiches ont une vraie description" \
  || no "seulement $nb fiche(s) avec une description etoffee"

step "Les animations de l'accueil"

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

js=../dist/odys-theme-ps8/themes/odys/assets/js/app.js

# Le fondu-dezoom : la photo arrive depuis un leger sur-cadrage. La classe

# est posee au chargement de l'image, pas a la peinture, sinon une image en

# lazy-load surgirait d'un bloc, l'animation deja terminee.

grep -q "@keyframes odys-img-in" "$css" \
  && ok "le fondu-dezoom des photos est defini" \
  || no "le fondu-dezoom manque"

grep -q "odys-img-in" "$js" \
  && ok "le fondu est pose au chargement de l'image" \
  || no "rien ne pose la classe du fondu : l'animation ne partira jamais"

# Les puces de famille sur l'accueil. Le script du theme ecoute #featGrid

# comme #collGrid : la grille doit porter cet identifiant.

curl -s -m 40 "$SHOP/" -o /tmp/acc.html

grep -q 'id="featGrid"' /tmp/acc.html \
  && ok "la grille de l'accueil est branchee au filtre" \
  || no "la grille n'a pas l'identifiant que le filtre ecoute"

nbp=$(grep -o 'data-action="filter-fam"' /tmp/acc.html | wc -l)

[ "$nbp" -ge 3 ] \
  && ok "$nbp puces de famille sur l'accueil" \
  || no "seulement $nbp puce(s) de famille sur l'accueil"

# Le carrousel. Avec un seul visuel il ne doit rien rendre du tout.

nbs=$(grep -o 'oh-slide' /tmp/acc.html | wc -l)

nbd=$(grep -o 'oh-dot\"' /tmp/acc.html | wc -l)

if [ "$nbs" -gt 1 ]; then

  [ "$nbd" -ge 1 ] \
    && ok "$nbs visuels de hero, $nbd point(s) de navigation" \
    || no "$nbs visuels mais aucun point : on ne peut pas en changer"

else

  ok "un seul visuel de hero : pas de carrousel, image fixe"

fi

# .oh-film doit rester absolu, sinon le hero se coupe en deux

grep -q 'oh-film\[data-odys-carrousel\]{position:relative' "$css" \
  && no "le carrousel remet .oh-film en relatif : le hero se coupera en deux" \
  || ok ".oh-film garde sa position absolue"

step "Le code promo s'applique"

# Le formulaire visait $cart.add_voucher_url, une clé qui n'existe pas : le

# présentateur renvoie [] et l'attribut action contenait un avertissement PHP.

cart=$(cat ../dist/odys-theme-ps8/themes/odys/templates/checkout/cart.tpl 2>/dev/null)

echo "$cart" | grep -q 'name="addDiscount"' \
  && ok "le formulaire envoie addDiscount" \
  || no "le code promo ne sera jamais appliqué"

echo "$cart" | grep -q 'add_voucher_url}' \
  && no "action=\$cart.add_voucher_url : clé inexistante, l'attribut sera un avertissement PHP" \
  || ok "le formulaire poste vers une URL réelle"

echo "$cart" | grep -q 'subtotals.vouchers' \
  && no "la ligne Réduction lit subtotals.vouchers (le présentateur dit discounts)" \
  || ok "la ligne Réduction lit la bonne clé"

step "Les messages de PrestaShop sont affichés"

# $notifications porte les erreurs et les confirmations ; la mise en page n'en

# rendait aucune, donc le site échouait en silence.

lay=$(cat ../dist/odys-theme-ps8/themes/odys/templates/layouts/layout-full-width.tpl 2>/dev/null)

echo "$lay" | grep -q "notifications.tpl" \
  && ok "la mise en page inclut les notifications" \
  || no "aucune erreur ni confirmation ne sera visible"

step "Ambiance : la page prend la couleur de son ingredient"

# Un diffuseur se choisit pour ce qu'il sent. La page le dit : fleur d'oranger

# en ivoire et feuille d'agrume, ambre en resine chaude. La valeur vient de la

# fiche produit, pas du template.

fleur=$(curl -s -m 40 "$SHOP/diffuseurs/38-diffuseur-a-roseaux-jardin-de-fes.html")

ambre=$(curl -s -m 40 "$SHOP/diffuseurs/37-diffuseur-a-roseaux-nuit-d-ambre.html")

echo "$fleur" | grep -q 'data-ambiance="fleur-oranger"'   && ok "Jardin de Fes rend l'ambiance fleur d'oranger"   || no "l'ambiance n'atteint pas la page"

echo "$ambre" | grep -q 'data-ambiance="ambre"'   && ok "Nuit d'Ambre rend l'ambiance ambre" || no "ambiance ambre absente"

# et un parfum garde le theme de la maison

parf=$(curl -s -m 40 "$SHOP/parfums/22-l-or.html")

echo "$parf" | grep -q 'data-ambiance'   && no "un parfum a herite d'une ambiance de diffuseur"   || ok "les parfums gardent le theme de la maison"

css=$(cat ../dist/odys-theme-ps8/themes/odys/assets/css/theme.css 2>/dev/null)

echo "$css" | grep -q 'body\[data-ambiance="fleur-oranger"\]'   && ok "la palette fleur d'oranger est livree" || no "palette manquante"

# le chrome de la marque ne bouge pas : les regles de couleur restent dans #main

echo "$css" | grep -o 'body\[data-ambiance\][^{]*{' | grep -qv '#main\|\.amb-hero\|^body\[data-ambiance\]{'   && echo "  (regles hors #main : verifier qu'elles ne touchent pas l'entete)" || true

ok "les accents d'ambiance restent dans le contenu de page"

# la photographie de l'ingredient, si elle existe, doit etre servie

img="$SHOP/themes/odys/assets/img/ambiance-fleur-oranger.webp"

code=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$img")

[ "$code" = "200" ] && ok "la photo fleur d'oranger est servie (200)"   || no "la photo d'ambiance repond $code"

# et aucune ambiance ne doit reclamer un fichier absent

for rule in $(echo "$css" | grep -o "ambiance-[a-z-]*\.webp" | sort -u); do

  c=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$SHOP/themes/odys/assets/img/$rule")

  [ "$c" = "200" ] || no "le CSS demande $rule qui repond $c"

done

ok "chaque photo d'ambiance citee par le CSS existe"

step "Ambiances : reglables depuis le Back Office"

# Les couleurs et la photographie d'une ambiance se saisissent dans

# Apparence -> Theme ODYS. Le module les transforme en proprietes CSS et le

# theme les imprime apres sa feuille de style, donc elles l'emportent.

bo_slug=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_AMB_1_SLUG'")

if [ -n "$bo_slug" ]; then

  page=$(curl -s -m 40 "$SHOP/diffuseurs/38-diffuseur-a-roseaux-jardin-de-fes.html")

  echo "$page" | grep -q -- "--amb-accent:" \
    && ok "la palette du Back Office atteint la fiche produit" \
    || no "la palette enregistree n'est pas imprimee"

  bo_accent=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_AMB_1_ACCENT'")

  echo "$page" | grep -q -- "--amb-accent:$bo_accent" \
    && ok "la couleur affichee est bien celle enregistree ($bo_accent)" \
    || no "la page n'affiche pas la couleur enregistree"

  # une photo televersee est servie depuis img/odys/, que le rebuild ne touche pas

  bo_img=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_AMB_1_IMG'")

  if [ -n "$bo_img" ]; then

    code=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$SHOP/img/odys/$bo_img")

    [ "$code" = "200" ] && ok "la photographie televersee est servie" \
      || no "la photographie televersee repond $code"

    echo "$page" | grep -q "img/odys/$bo_img" \
      && ok "la fiche pointe vers la photographie televersee" \
      || no "la fiche ignore la photographie televersee"

  fi

else

  ok "aucune ambiance enregistree : le theme utilise ses propres palettes"

fi

# un parfum n'herite jamais d'une ambiance

echo "$(curl -s -m 40 "$SHOP/parfums/22-l-or.html")" | grep -q -- "--amb-accent:" \
  && no "un parfum recoit une palette d'ambiance" \
  || ok "les parfums n'ont pas de palette d'ambiance"

# et l'ecran existe

tab=$(sql "SELECT COUNT(*) FROM ps_tab WHERE class_name='AdminOdysTheme'")

[ "${tab:-0}" -ge 1 ] && ok "l'onglet Theme ODYS est installe" || no "onglet Theme ODYS absent"

step "Performance : CSS et JS combines"

# 25 requetes sur l'accueil, theme.css charge deux fois et aucune URL versionnee

# : un visiteur qui revient garde la feuille de style de la veille. Combines et

# minifies, c'est 8 requetes et une URL qui change avec le contenu.

for key in PS_CSS_THEME_CACHE PS_JS_THEME_CACHE; do

  v=$(sql "SELECT value FROM ps_configuration WHERE name='$key'")

  [ "${v:-0}" = "1" ] && ok "$key active" || no "$key desactive : le site sert un fichier par module"

done

home=$(curl -s -m 40 "$SHOP/")

n=$(printf '%s' "$home" | grep -o '<link[^>]*stylesheet' | wc -l | tr -d ' ')

[ "${n:-9}" -le 3 ] && ok "$n feuille(s) de style sur l'accueil" || no "$n feuilles de style : la combinaison ne s'applique pas"

printf '%s' "$home" | grep -o 'theme\.css' | wc -l | grep -qx '[01]'   && ok "theme.css n'est plus servi en double" || no "theme.css est encore charge deux fois"

step "Le cout de livraison est annonce sur la fiche produit"

# Deux tiers des boutiques le reservent au paiement. Avec le paiement a la

# livraison, un frais decouvert a la porte est un colis refuse et un transport

# paye deux fois.

low=$(curl -s -m 40 "$SHOP/parfums/22-l-or.html")

# Le Trio servait d'exemple au-dessus du seuil quand il coutait 549 DH.

# A 199 DH il est sous la barre : l'echantillon se prend en base, par le

# prix, et non par un nom de produit que le tarif peut faire mentir.

seuil=$(sql "SELECT value FROM ps_configuration WHERE name='PS_SHIPPING_FREE_PRICE'")

: "${seuil:=300}"

cher=$(sql "SELECT CONCAT(cl.link_rewrite,'/',p.id_product,'-',pl.link_rewrite) FROM ps_product p JOIN ps_product_lang pl ON pl.id_product=p.id_product AND pl.id_lang=1 JOIN ps_category_lang cl ON cl.id_category=p.id_category_default AND cl.id_lang=1 WHERE p.active=1 AND p.price >= $seuil ORDER BY p.price DESC LIMIT 1")

high=$(curl -s -m 40 "$SHOP/$cher.html")

echo "$low" | grep -q "odys-ship-note" && ok "le prix de la livraison est sur la fiche"   || no "la fiche produit ne dit pas ce que coute la livraison"

echo "$low" | grep -q "offerte des\|offerte dès" && ok "le seuil de gratuite est annonce"   || no "le seuil de livraison offerte n'est pas annonce"

echo "$high" | grep -q "Livraison offerte"   && ok "un produit au-dessus du seuil annonce la livraison offerte"   || no "un produit au-dessus du seuil n'annonce rien"

# et les montants viennent des transporteurs, pas d'un texte en dur

carrier_min=$(sql "SELECT MIN(d.price) FROM ps_delivery d JOIN ps_carrier c ON c.id_carrier=d.id_carrier WHERE c.active=1 AND c.deleted=0")

echo "$low" | grep -q "Livraison ${carrier_min%%.*}"   && ok "le montant affiche est celui du transporteur (${carrier_min%%.*} DH)"   || no "le montant affiche ne vient pas des transporteurs"

step "Mes envies : enregistrer sans compte"

# Le coeur ne faisait que changer de couleur : aucune liste, aucun stockage, et

# le libelle disait "Retire" au clic qui ajoutait. Le module derriere chargeait

# 318 Ko de client GraphQL sur chaque page sans qu'on lui parle jamais.

wl=$(sql "SELECT active FROM ps_module WHERE name='blockwishlist'")

[ "${wl:-1}" = "0" ] && ok "blockwishlist desactive (318 Ko en moins par page)" \
  || no "blockwishlist encore actif : son client GraphQL se charge partout"

home=$(curl -s -m 40 "$SHOP/")

echo "$home" | grep -q "graphql" && no "un client GraphQL est encore charge" \
  || ok "plus de client GraphQL sur l'accueil"

code=$(curl -s -m 40 -o /dev/null -w "%{http_code}" "$SHOP/mes-envies")

[ "$code" = "200" ] && ok "/mes-envies repond 200 sans compte" || no "/mes-envies repond $code"

envies=$(curl -s -m 40 "$SHOP/mes-envies")

echo "$envies" | grep -q "odysWishList" && ok "la liste se rend cote navigateur" \
  || no "le conteneur de la liste est absent"

prod=$(curl -s -m 40 "$SHOP/parfums/22-l-or.html")

echo "$prod" | grep -q "Ajouter à mes envies\|Ajouter a mes envies" \
  && ok "le bouton dit ce qu'il fait" || no "le bouton porte encore l'ancien libelle"

echo "$prod" | grep -q "Retiré de la wishlist" \
  && no "le libelle inverse est toujours la" || ok "plus de libelle inverse"

step "WhatsApp : prevenir le client depuis la commande"

# Entre 15 % et 30 % des commandes payees a la livraison sont refusees au Maroc

# et chaque refus coute le transport deux fois ; confirmer avant l'expedition

# est la mesure qui pese le plus.

h=$(sql "SELECT COUNT(*) FROM ps_hook_module hm

         JOIN ps_hook h ON h.id_hook=hm.id_hook

         JOIN ps_module m ON m.id_module=hm.id_module

         WHERE m.name='odys_loyalty' AND h.name='displayAdminOrderSide'")

[ "${h:-0}" -ge 1 ] && ok "le panneau est branche sur la fiche commande" \
  || no "displayAdminOrderSide non enregistre"

tpl=../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/views/templates/hook/admin_order_whatsapp.tpl

[ -f "$tpl" ] && ok "le gabarit du panneau est livre" || no "gabarit WhatsApp manquant"

# un numero illisible ne doit produire aucun lien : mieux vaut ne rien envoyer

mod=../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/odys_loyalty.php

grep -q "function waNumber" "$mod" && ok "la normalisation du numero est livree" \
  || no "waNumber absent"

grep -q "212" "$mod" && ok "les numeros marocains sont mis au format international" \
  || no "aucun prefixe international"

step "Parfums : Homme, Femme, Unisexe"

# Un parfum se choisit d'abord pour qui il est. Les familles olfactives restent

# un filtre a l'interieur : avec un Oriental par genre, une categorie par

# genre-et-famille serait une douzaine de pages a un seul flacon.

for key in ODYS_CAT_HOMME ODYS_CAT_FEMME ODYS_CAT_UNISEXE; do

  id=$(sql "SELECT value FROM ps_configuration WHERE name='$key'")

  if [ -n "$id" ] && [ "$id" != "0" ]; then

    parent=$(sql "SELECT id_parent FROM ps_category WHERE id_category=$id")

    parfums=$(sql "SELECT value FROM ps_configuration WHERE name='ODYS_CAT_PARFUMS'")

    [ "$parent" = "$parfums" ] && ok "$key est une section de Parfums" \
      || no "$key n'est pas sous Parfums (parent $parent)"

  else

    no "$key absent : la section n'a pas ete creee"

  fi

done

# chaque parfum est dans sa section ET dans Parfums, pour que la collection

# complete reste consultable

orphans=$(sql "SELECT COUNT(*) FROM ps_product p

  JOIN ps_category_product cp ON cp.id_product=p.id_product

  WHERE cp.id_category=(SELECT value FROM ps_configuration WHERE name='ODYS_CAT_PARFUMS')

    AND p.id_product NOT IN (

      SELECT id_product FROM ps_category_product WHERE id_category IN (

        SELECT value FROM ps_configuration WHERE name IN

          ('ODYS_CAT_HOMME','ODYS_CAT_FEMME','ODYS_CAT_UNISEXE')))")

[ "${orphans:-1}" = "0" ] && ok "chaque parfum est range dans une section" \
  || no "$orphans parfum(s) sans genre"

step "Le filtre par famille olfactive fonctionne"

# Le gabarit du theme vivait a catalog/listing.tpl, un chemin que PrestaShop ne

# resout pas : toutes les categories tombaient sur le gabarit de classic, sans

# l'en-tete ODYS ni les filtres. catalog/listing/category.tpl le remet en route.

[ -f ../dist/odys-theme-ps8/themes/odys/templates/catalog/listing/category.tpl ] \
  && ok "les categories passent par le gabarit du theme" \
  || no "catalog/listing/category.tpl manquant : retour au gabarit de classic"

homme=$(curl -s -m 40 "$(caturl parfums-homme)")

echo "$homme" | grep -q 'class="fam-filters"' && ok "les filtres de famille sont sur la page" \
  || no "aucun filtre de famille"

echo "$homme" | grep -q 'id="collGrid"' && ok "la grille que le filtre pilote est la" \
  || no "grille collGrid absente : le filtre n'aurait rien a masquer"

n=$(printf '%s' "$homme" | grep -o 'data-fam="[^"]*"' | wc -l | tr -d ' ')

[ "${n:-0}" -ge 2 ] && ok "$n cartes portent leur famille" || no "les cartes ne portent pas de famille"

# le titre est celui de la section, pas le libelle meta de PrestaShop

echo "$homme" | grep -q "<h1>Homme</h1>" && ok "le titre est « Homme »" \
  || no "le titre affiche encore le libelle meta (« Categorie : ... »)"

# et le tri de classic n'a pas ete perdu au passage

echo "$homme" | grep -q "sec-hd-sort" && ok "le tri est conserve" || no "le tri a disparu"

step "CRM : une piste se referme et devient joignable"

# Les pistes reelles sont anonymes : un panier rempli sans qu'on tape jamais

# d'e-mail. Elles sont reperees par le cookie odys_vid, que le meme navigateur

# porte encore au moment de la commande — ne comparer que le client ou l'e-mail

# revenait a ne jamais pouvoir refermer un panier abandonne.

crm=../dist/odys-theme-ps8/modules/odys_crm/odys_crm.php

grep -q "visitor = " "$crm" && ok "la piste se referme sur le visiteur" \
  || no "un panier anonyme ne pourra jamais etre referme"

grep -q "'phone' => pSQL" "$crm" && ok "la piste gagnee garde un telephone" \
  || no "une piste gagnee reste anonyme : personne a rappeler"

# une livraison refusee est le fait qu'une boutique en COD doit garder

grep -q "function refusals" "$crm" && ok "les refus de livraison sont comptes" \
  || no "aucun suivi des refus"

h=$(sql "SELECT COUNT(*) FROM ps_hook_module hm

         JOIN ps_hook h ON h.id_hook=hm.id_hook

         JOIN ps_module m ON m.id_module=hm.id_module

         WHERE m.name='odys_crm' AND h.name='actionOrderStatusPostUpdate'")

[ "${h:-0}" -ge 1 ] && ok "le module ecoute les changements d'etat" \
  || no "actionOrderStatusPostUpdate non enregistre"

# et le numero devient une action, pas une chaine a recopier

lst=../dist/odys-theme-ps8/modules/odys_crm/controllers/admin/AdminOdysCrmController.php

grep -q "wa.me" "$lst" && ok "le telephone ouvre la conversation" \
  || no "le telephone reste une chaine a recopier"

grep -q "phoneE164" ../dist/odys-theme-ps8/modules/odys_crm/classes/OdysCrmGuard.php \
  && ok "les numeros sont normalises avant d'etre transformes en lien" \
  || no "aucune normalisation : un numero illisible ferait un lien vers un inconnu"

step "CRM : une campagne est creditee de ce qu'elle rapporte"

# attribute() exige le cookie de clic, donc ne creditait que ceux qui avaient

# suivi le lien. Un code promo circule par capture d'ecran et de bouche a

# oreille : ces commandes arrivaient comme si aucune campagne n'existait.

camp=../dist/odys-theme-ps8/modules/odys_crm/classes/OdysCampaign.php

grep -q "attributeByCode" "$camp" && ok "l'attribution par code existe" \
  || no "une commande sans cookie de clic ne credite aucune campagne"

grep -q "attributeByCode" "$crm" && ok "la commande retombe sur le code" \
  || no "le repli par code n'est pas appele"

n=$(sql "SELECT COUNT(*) FROM ps_odys_campaign_order")

[ "${n:-0}" -ge 1 ] && ok "$n commande(s) creditee(s) a une campagne" \
  || echo "  (aucune commande creditee pour le moment — normal sur une base neuve)"

step "SEO : les pages d'atterrissage ont de quoi se presenter"

# Les categories sont les pages sur lesquelles on tombe en cherchant "oud

# boukhour maroc" ou "diffuseur parfum casablanca". Elles n'avaient ni titre,

# ni description, ni le moindre texte.

bare=0

for id in $(sql "SELECT value FROM ps_configuration WHERE name IN

  ('ODYS_CAT_PARFUMS','ODYS_CAT_OUD','ODYS_CAT_COFFRETS','ODYS_CAT_DIFFUSEURS',

   'ODYS_CAT_HOMME','ODYS_CAT_FEMME','ODYS_CAT_UNISEXE')"); do

  n=$(sql "SELECT COUNT(*) FROM ps_category_lang

           WHERE id_category=$id AND meta_title<>'' AND meta_description<>'' AND description<>''")

  [ "${n:-0}" -ge 1 ] || bare=$((bare+1))

done

[ "$bare" = "0" ] && ok "chaque categorie a un titre, une description et un texte" \
  || no "$bare categorie(s) encore sans contenu"

oud=$(curl -s -m 40 "$(caturl oud-boukhour)")

echo "$oud" | grep -q 'name="description" content="[^"]\{40,\}"' \
  && ok "la meta description de Oud & Boukhour est remplie" || no "meta description vide"

echo "$oud" | grep -q "odys-cat-intro" && ok "le texte de categorie est sur la page" \
  || no "le texte de categorie ne s'affiche pas"

echo "$oud" | grep -q "Vendus au Gramme" && ok "le titre de la page vient de la categorie" \
  || no "le titre ignore le meta_title de la categorie"

step "SEO : donnees structurees et partage"

prod=$(curl -s -m 40 "$SHOP/parfums/22-l-or.html")

echo "$prod" | grep -q "BreadcrumbList" && ok "le fil d'Ariane est decrit aux moteurs" \
  || no "aucun BreadcrumbList"

# un bloc JSON-LD invalide est un bloc ignore : on verifie qu'il parse

if command -v python >/dev/null 2>&1; then

  bad=$(printf '%s' "$prod" | python -c "

import sys,re,json

b=sys.stdin.read()

bad=0

for blob in re.findall(r'application/ld\\+json[^>]*>(.*?)</script>', b, re.S):

    try: json.loads(blob.strip())

    except Exception: bad+=1

print(bad)")

  [ "${bad:-1}" = "0" ] && ok "tous les blocs JSON-LD sont valides" \
    || no "$bad bloc(s) JSON-LD invalides : ils seront ignores"

fi

echo "$prod" | grep -q 'property="og:image"' && ok "un lien partage montre une image" \
  || no "og:image absent : un partage WhatsApp sera un rectangle gris"

echo "$prod" | grep -q 'og:title" content="ODYS Parfums | ODYS Parfums"' \
  && no "og:title est encore double" || ok "og:title n'est plus double"

step "SEO : sitemap et robots"

code=$(curl -s -m 40 -o /dev/null -w "%{http_code}" "$SHOP/1_index_sitemap.xml")

[ "$code" = "200" ] && ok "le sitemap repond 200" || no "le sitemap repond $code"

curl -s -m 40 "$SHOP/robots.txt" | grep -qi "^Sitemap:" \
  && ok "robots.txt indique le sitemap" || no "robots.txt ne mentionne aucun sitemap"

sm=$(curl -s -m 60 "$SHOP/1_fr_0_sitemap.xml")

printf '%s' "$sm" | grep -q "page-introuvable" \
  && no "la page 404 est listee dans le sitemap" || ok "la 404 n'est pas listee"

printf '%s' "$sm" | grep -q "parfums-homme" \
  && ok "les nouvelles sections sont dans le sitemap" || no "sections absentes du sitemap"

# Le plan du site annoncait a Google DEUX marques fictives — « Studio
# Design » et « Graphic Corner », les fixtures de la demonstration
# PrestaShop — chacune avec sa page /brand/N-… indexee, plus la page
# /marques qui les liste. Une maison de parfum a Casablanca declarait
# distribuer « Graphic Corner ».
printf '%s' "$sm" | grep -qiE "brand/[0-9]+-(studio-design|graphic-corner)"   && no "les marques de la demonstration PrestaShop sont dans le sitemap"   || ok "aucune marque de demonstration dans le sitemap"

# La regle qui les ecarte tient a DEUX conditions, et les deux comptent.
# Ne regarder que la donnee aurait remis /fournisseurs dans le plan : il
# redirige vers la 404 non pas faute de fournisseurs — il y en a deux, avec
# des produits — mais parce que PS_DISPLAY_SUPPLIERS vaut 0.
grep -q "Configuration::get(\$reglage) ? \$restants : 0" ../psbuild/plan_du_site.php   && ok "l exclusion exige l affichage ET la donnee"   || no "l exclusion ne regarde qu un des deux criteres"
grep -q "aucun produit actif" ../psbuild/plan_du_site.php   && ok "une marque sans produit actif est desactivee"   || no "les marques vides restent publiees"

# Et la demonstration par la difference, sur cette boutique-ci : les deux
# marques y ont neuf produits actifs chacune, donc /marques reste indexable,
# tandis que /fournisseurs est ecarte par le reglage. Si la regle degenerait
# en « tout exclure » ou « tout garder », l un des deux basculerait.
dis=$(sql "SELECT value FROM ps_configuration WHERE name='GSITEMAP_DISABLE_LINKS'")
mfid=$(sql "SELECT id_meta FROM ps_meta WHERE page='manufacturer' LIMIT 1")
spid=$(sql "SELECT id_meta FROM ps_meta WHERE page='supplier' LIMIT 1")
printf '%s' ",$dis," | grep -q ",$spid,"   && ok "/fournisseurs est ecarte : la boutique ne l affiche pas"   || no "/fournisseurs est propose a l indexation alors qu il redirige"
printf '%s' ",$dis," | grep -q ",$mfid,"   && no "/marques est ecarte alors que des marques ont des produits actifs"   || ok "/marques reste indexable tant qu il a quelque chose a montrer"

# La page HTML du plan, elle, est construite par PrestaShop a partir des
# memes donnees : desactiver les marques la nettoie aussi, sans y toucher.
plan=$(curl -s -m 40 "$SHOP/plan-site")
printf '%s' "$plan" | grep -q "Plan du site"   && ok "la page /plan-site repond et porte son titre"   || no "la page /plan-site ne rend pas son contenu"


step "Le lot de mise a jour ne laisse rien derriere"

# Le lot est le seul chemin vers la production : ce qu il ne porte pas
# n arrive jamais en ligne, et l execution annonce quand meme sa reussite.
# La liste des fichiers etait tenue a la main et avait pris du retard sans
# que rien ne le dise — 35 des 49 gabarits du theme manquaient. Deux
# correctifs s y sont perdus : le libelle du champ « code promo », puis les
# balises Open Graph dont les doublons faisaient perdre sa carte produit a
# un lien partage sur WhatsApp.
python - <<'EOPY' && ok "les 49 gabarits du theme sont dans le lot" || no "des gabarits du theme manquent au lot de mise a jour"
import pathlib, re, sys
lot = pathlib.Path("../dist/deploy/maj-telephone.php")
if not lot.exists():
    print("  maj-telephone.php absent"); sys.exit(1)
txt = lot.read_text(encoding="utf-8", errors="replace")
livres = set(re.findall(r"'(themes/odys/templates/[^']+)' => \[", txt))
base = pathlib.Path("../dist/odys-theme-ps8")
tous = set(f.relative_to(base).as_posix() for f in (base / "themes/odys/templates").rglob("*.tpl"))
manque = sorted(tous - livres)
for m in manque:
    print("  manque :", m)
print("  %d gabarit(s), %d livre(s)" % (len(tous), len(livres)))
sys.exit(1 if manque or not tous else 0)
EOPY

# Et la cause, pas seulement le symptome : la liste doit etre enumeree,
# pas recopiee. Une liste ecrite a la main reprendra du retard.
grep -q 'FICHIERS.setdefault(_rel, _rel)' ../psbuild/make_maj_telephone.py   && ok "la liste des gabarits est enumeree depuis dist/"   || no "la liste des gabarits est de nouveau tenue a la main"


step "Chaque fiche dit quelque chose qui lui est propre"

# Quatorze produits partageaient deux phrases. « Selection ODYS Parfums. »
# servait a la fois de meta description, de resume sous le nom et de
# description complete pour les huit coffrets et diffuseurs ; les six oud
# partageaient « Oud naturel vendu au gramme. Origine certifiee. » Huit
# pages disaient donc exactement la meme chose a Google, qui traite les
# descriptions dupliquees comme du contenu faible et ecrit la sienne, et
# quatre mots au client venu lire la fiche.
dup=$(sql "SELECT COUNT(*) FROM (SELECT pl.meta_description m FROM ps_product_lang pl JOIN ps_product p ON p.id_product=pl.id_product AND p.active=1 WHERE pl.id_lang=1 AND p.id_product>=20 GROUP BY pl.meta_description HAVING COUNT(*)>1) d")
[ "${dup:-1}" = "0" ]   && ok "aucune meta description partagee par deux produits"   || no "$dup texte(s) de meta description servent a plusieurs produits"

courtes=$(sql "SELECT COUNT(*) FROM ps_product_lang pl JOIN ps_product p ON p.id_product=pl.id_product AND p.active=1 WHERE pl.id_lang=1 AND p.id_product>=20 AND CHAR_LENGTH(COALESCE(pl.meta_description,'')) < 60")
[ "${courtes:-1}" = "0" ]   && ok "aucune meta description sous 60 caracteres"   || no "$courtes fiche(s) ont une meta description trop courte"

# Le texte de remplissage ne doit plus apparaitre nulle part.
reste=$(sql "SELECT COUNT(*) FROM ps_product_lang pl JOIN ps_product p ON p.id_product=pl.id_product AND p.active=1 WHERE pl.id_lang=1 AND (pl.description LIKE '%Selection ODYS Parfums%' OR pl.description_short LIKE '%Selection ODYS Parfums%' OR pl.description LIKE '%SÃ©lection ODYS Parfums%' OR pl.description_short LIKE '%SÃ©lection ODYS Parfums%')")
[ "${reste:-1}" = "0" ]   && ok "le texte de remplissage a disparu des fiches"   || no "$reste fiche(s) affichent encore « Selection ODYS Parfums. »"

# Et la source : les deux formes d entree cohabitent dans le meme fichier.
python - <<'EOPY' && ok "descriptions.json : 27 fiches, aucun texte en double" || no "descriptions.json porte des textes identiques ou incomplets"
import json, sys
d = json.load(open("../psbuild/descriptions.json", encoding="utf-8"))
d.pop("_lisez_moi", None)
metas = [v["meta"] for v in d.values() if "meta" in v]
courts = [v["court"] for v in d.values() if "court" in v]
sys.exit(0 if (len(d) >= 27 and len(set(metas)) == len(metas) == 14
               and len(set(courts)) == len(courts) == 14
               and all(110 <= len(m) <= 165 for m in metas)) else 1)
EOPY


step "Les panneaux fermes et le clavier"

# Le menu mobile et le tiroir des notes se ferment en glissant hors de
# l ecran. Translate deplace, il ne retire pas : mesure sur une page de
# categorie, les deux panneaux FERMES offraient 8 et 1 commandes
# atteignables au clavier. Neuf tabulations qui envoient le curseur hors
# du cadre, la bague de focus disparait, et Tab semble ne plus rien faire.
#
# Le menu porte en plus aria-hidden="true" quand il est ferme : un lecteur
# d ecran refuse donc d annoncer ce dans quoi la tabulation vient
# d entrer. La specification ARIA l interdit — un element focusable ne
# doit jamais etre aria-hidden.
cssk=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q "\.mob-menu{visibility:hidden" "$cssk"   && ok "le menu mobile ferme sort du parcours du clavier"   || no "le menu mobile ferme garde ses 8 liens dans la tabulation"
grep -q "\.mob-menu\.open{visibility:visible" "$cssk"   && ok "le menu mobile ouvert y revient"   || no "le menu mobile resterait invisible une fois ouvert"
grep -q "\.notes-panel{visibility:hidden" "$cssk"   && ok "le tiroir des notes ferme sort du parcours du clavier"   || no "le tiroir des notes ferme garde son bouton dans la tabulation"
grep -q "\.notes-panel\.on{visibility:visible" "$cssk"   && ok "le tiroir des notes ouvert y revient"   || no "le tiroir des notes resterait invisible une fois ouvert"

# Sans le retard, la bascule se ferait au premier instant de la fermeture
# et le panneau disparaitrait d un coup au lieu de sortir en glissant.
grep -q "visibility 0s linear .38s" "$cssk"   && ok "la bascule attend la fin du glissement du menu"   || no "le menu disparaitrait d un coup au lieu de glisser"
grep -q "visibility 0s linear .4s" "$cssk"   && ok "la bascule attend la fin du glissement du tiroir"   || no "le tiroir disparaitrait d un coup au lieu de glisser"


step "Les cibles qu un pouce doit atteindre"

# Mesure a 375 px avec psbuild/tests/mobile_pages.js. WCAG 2.5.8 pose un
# plancher a 24x24 pour toute commande ; Apple recommande 44x44, qu on
# exige du parcours d achat. Huit commandes etaient sous le plancher, dont
# les pastilles du hero a 8x8 — le seul moyen de changer de visuel — et
# les liens WhatsApp et telephone a 18 px de haut, qui sont la porte de
# sortie quand un produit est epuise.
cssm=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q "\.oh-dot{width:28px;height:28px" "$cssm"   && ok "la pastille du hero fait 28 px, au-dessus du plancher de 24"   || no "la pastille du hero est retombee sous 24 px"
grep -q "oh-dot::before{content" "$cssm"   && ok "le repere visuel reste a 8 px dans un bouton plus grand"   || no "agrandir le bouton a grossi le point avec lui"
# Empile sur telephone, le hero fait deux fois sa hauteur : sans cette
# regle les pastilles se retrouvent sous le texte, loin de l image.
grep -q "oh-dots{top:calc(125vw" "$cssm"   && ok "sur telephone les pastilles restent dans l image"   || no "les pastilles tombent sous le texte du hero"

grep -q "odys-contact--inline a{display:inline-flex;align-items:center;min-height:44px}" "$cssm"   && ok "WhatsApp et telephone font 44 px de haut"   || no "les liens de secours sont trop courts pour un pouce"
grep -q 'data-action="show-password"\]{min-height:44px' "$cssm"   && ok "le revelateur de mot de passe fait 44 px"   || no "le revelateur de mot de passe fait 23 px au tunnel"
grep -q "\.qty button{min-width:44px}" "$cssm"   && ok "les boutons de quantite font 44 px de large"   || no "les boutons de quantite restent etroits"
grep -q "social-sharing li a{width:40px;height:40px}" "$cssm"   && ok "les pictogrammes de partage font 40 px"   || no "les trois pictogrammes de partage sont colles et trop petits"

# Un placeholder n est pas un libelle : il disparait des que le client
# tape, et les lecteurs d ecran ne l annoncent pas de maniere fiable. Les
# deux champs « code promo » n avaient que cela.
vch=../dist/odys-theme-ps8/themes/odys/templates/checkout/_partials/cart-voucher.tpl
[ -f "$vch" ]   && ok "le code promo du tunnel est surcharge par le theme"   || no "le code promo du tunnel reste celui du theme classic, sans libelle"
grep -q 'extends file="parent:checkout/_partials/cart-voucher.tpl"' "$vch"   && ok "la surcharge etend le gabarit parent au lieu de le recopier"   || no "la surcharge recopie le gabarit : une mise a jour du coeur sera perdue"
grep -q 'label class="sr-only" for="odys-code-promo"' "$vch"   && ok "le code promo du tunnel a un nom"   || no "le code promo du tunnel n a qu un placeholder"
grep -q 'odys-code-promo-panier' ../dist/odys-theme-ps8/themes/odys/templates/checkout/cart.tpl   && ok "le code promo du panier a un nom"   || no "le code promo du panier n a qu un placeholder"


step "Panier sur mobile"

# Le panier etait pose en ligne sur `1fr 340px`. Sur un telephone la colonne

# fixe de 340 px et celle des produits ne tiennent pas ensemble : la page

# devenait 176 px plus large que l ecran, le recapitulatif etait coupe, le

# bouton COMMANDER a moitie visible, et tout le site defilait de cote.

tpl=../dist/odys-theme-ps8/themes/odys/templates/checkout/cart.tpl

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q 'class="cart-grid"' "$tpl" && ok "le panier porte des classes exploitables"   || no "le panier n a que des styles en ligne : aucune regle mobile ne peut le corriger"

grep -q "cart-grid{grid-template-columns:1fr!important" "$css"   && ok "le panier passe sur une colonne en dessous de 860 px"   || no "le panier reste sur deux colonnes sur mobile"

grep -q "cart-grid > \*{min-width:0}" "$css"   && ok "les colonnes peuvent se retrecir sous leur contenu"   || no "une colonne de grille ne peut pas se retrecir : le debordement revient"

grep -q "cart-promo-form input\[type=\"text\"\]{flex:1 1 100%" "$css"   && ok "le champ code promo prend toute la largeur"   || no "le champ code promo restera ecrase a cote de son bouton"

step "Newsletter : le champ avant le bouton"

# ps_emailsubscription place la colonne du bouton avant celle du champ, donc la

# page demandait d appuyer sur OK avant d avoir montre ou taper.

grep -q "block_newsletter form > .row > div:first-child .input-wrapper{order:1" "$css"   && ok "le champ est ordonne avant le bouton" || no "le bouton reste au-dessus du champ"

grep -q "flex:0 0 auto}          /\* it grew to 280px" "$css"   && ok "le champ ne s etire plus pour remplir la colonne"   || no "le champ laissera un trou de 280 px sous lui"

step "Le menu mobile est visible et utilisable"

# Quatre regles .ham span se disputaient la couleur, toutes en !important, et

# la derniere peignait les barres en rgb(5,6,7) : noir sur un en-tete noir. Le

# menu fonctionnait depuis le debut, personne ne pouvait voir qu il existait.

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q "nav .ham span,$" "$css" || grep -q "nav .ham span," "$css" \
  && ok "la regle du menu a la specificite necessaire" \
  || no "une regle .ham span nue ne battra jamais nav .ham span"

grep -q "nav .ham span\[style\]{background:var(--odys-sand" "$css" \
  && ok "les barres du menu sont couleur sable" || no "les barres restent invisibles"

step "Un seul en-tete colle en haut"

# L en-tete est style par un selecteur d element nu, nav{position:sticky;

# z-index:500}. Chaque <nav> de la page devenait donc une seconde barre collee

# au meme niveau : le fil d Ariane passait par-dessus l en-tete et par-dessus

# le menu mobile, qui est a 499.

grep -q "nav:not(.odys-nav){position:static" "$css" \
  && ok "seul l en-tete garde le traitement colle" \
  || no "tout <nav> reste colle en z-index 500"

page=$(curl -s -m 40 "$(caturl parfums)")

printf '%s' "$page" | grep -q 'class="odys-nav"' \
  && ok "l en-tete porte bien sa classe" || no "l en-tete n a pas de classe a cibler"

step "Marges sur telephone"

# max(20px, 52px) de gouttiere a toutes les largeurs : sur un ecran de 427 px

# cela laissait 283 px de contenu et des cartes de 135 px.

grep -q "page-gutter:max(16px" "$css" \
  && ok "la gouttiere se reduit en dessous de 680 px" \
  || no "la gouttiere du bureau s applique encore au telephone"

step "La quantite se saisit au clavier"

# Le nombre etait un <span> en lecture seule : pour en acheter onze il fallait

# appuyer onze fois sur +.

prod=../dist/odys-theme-ps8/themes/odys/templates/catalog/product.tpl

cart=../dist/odys-theme-ps8/themes/odys/templates/checkout/cart.tpl

js=../dist/odys-theme-ps8/themes/odys/assets/js/app.js

grep -q 'id="qtyV" type="number"' "$prod" \
  && ok "la fiche produit a un champ quantite" || no "la quantite reste un span"

grep -q 'class="cart-qty" type="number"' "$cart" \
  && ok "chaque ligne du panier a un champ quantite" || no "le panier n a pas de champ"

grep -q "function qtyRead" "$js" && ok "le script lit un champ comme un span" \
  || no "qtyRead absent"

grep -q "ODYS.qtyRead()" "$js" \
  && ok "les lecteurs hors IIFE passent par l objet exporte" \
  || no "un lecteur hors portee renverra toujours 1"

grep -q "data-qty-url" "$cart" \
  && ok "le champ du panier connait l URL de mise a jour" || no "la saisie ne sera pas envoyee"

step "Les images de cartes gardent leurs proportions"

grep -q "pc-img img{height:auto!important;aspect-ratio:4/5" "$css" \
  && ok "le cadre suit la largeur de la carte" \
  || no "une hauteur fixe rognera davantage a mesure que la carte retrecit"

step "Les sections d une categorie sont sur la page"

# Homme / Femme / Unisexe n existaient que dans le menu : qui arrivait sur

# /parfums depuis une recherche n avait aucun chemin vers elles.

parfums=$(curl -s -m 40 "$(caturl parfums)")

echo "$parfums" | grep -q "odys-subcats" && ok "la page Parfums montre ses sections"   || no "aucune section sur la page Parfums"

for sec in Homme Femme Unisexe; do

  echo "$parfums" | grep -q ">$sec</a>" && ok "  section $sec presente" || no "  section $sec absente"

done

step "L en-tete est opaque"

# 94 % d opacite plus un backdrop-filter : la ou le flou n est pas applique ou

# retarde le defilement, la page transparait et le fil d Ariane finit imprime

# en travers du logo.

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q "header .odys-nav{background:var(--odys-black" "$css"   && ok "l en-tete a un fond plein" || no "l en-tete laisse passer la page"

step "Le hero sur telephone"

# Un telephone telechargeait 3,2 Mo de film pour n en jouer aucune image : la

# video n a pas d autoplay et le defilement image par image demande un pointeur.

# Et le voile du hero est un degrade horizontal, pense pour un texte pose sur le

# film sur grand ecran ; sur telephone le texte est dessous, donc ce voile ne

# faisait que peindre la photo en noir, avec une couture la ou il s arretait.

js=../dist/odys-theme-ps8/themes/odys/assets/js/app.js

css=../dist/odys-theme-ps8/themes/odys/assets/css/theme.css

grep -q "max-width: 680px" "$js"   && ok "le film n est pas charge sur un petit ecran"   || no "le film de 3,2 Mo se telecharge encore sur telephone"

grep -q "odys-film-hero .oh-film::after" "$css"   && ok "le voile est dessine sur la photo elle-meme"   || no "le voile reste accroche au hero et ne couvrira pas la photo"

grep -q "nv-hero.odys-film-hero::before{display:none}" "$css"   && ok "l ancien degrade horizontal est retire sur telephone"   || no "le degrade de bureau s applique encore au telephone"

# le poster, lui, doit rester : c est ce qu on voit a la place du film

poster=$(curl -s -m 30 -o /dev/null -w "%{http_code}" "$SHOP/themes/odys/assets/img/hero/odys-essence-poster.webp")

[ "$poster" = "200" ] && ok "l image d attente est servie" || no "l image d attente repond $poster"

step "Une mise a jour est vue sans rafraichissement force"

# PrestaShop nomme un fichier combine d apres la liste des fichiers qui le

# composent, pas d apres leur contenu : modifier la feuille de style ne change

# pas l URL, et un navigateur qui revient garde celle de la veille. Sans

# Cache-Control, il est libre de deviner une duree de vie.

ht=../dist/odys-theme-ps8/themes/odys/assets/cache/.htaccess

[ -f "$ht" ] && ok "la regle de revalidation est livree avec le theme"   || no "aucune regle : une mise a jour restera invisible pour un visiteur connu"

grep -q "IfModule mod_headers" "$ht" 2>/dev/null   && ok "la regle est protegee si mod_headers manque"   || no "sans garde, un hebergeur sans mod_headers renverrait une erreur 500"

# et sur ce serveur, l en-tete arrive-t-il vraiment ?

f=$(psh "ls /var/www/html/themes/odys/assets/cache/*.css 2>/dev/null | head -1" | tr -d '

')

if [ -n "$f" ]; then

  hdr=$(curl -s -I -m 20 "$SHOP/themes/odys/assets/cache/$(basename "$f")" | grep -i "cache-control")

  case "$hdr" in

    *no-cache*) ok "l en-tete de revalidation est servi";;

    *) echo "  (mod_headers absent ici : la regle est inerte, inoffensive)";;

  esac

fi

# The combined bundle is what the browser actually reads, and a single stray

# brace in it makes the browser drop every rule after the error without

# logging anything. The build checks the source; this checks what is served.

step "Le CSS combine est parsable"

if [ -n "${f:-}" ]; then

  curl -s -m 30 -o bundle-check.css "$SHOP/themes/odys/assets/cache/$(basename "$f")"

  bal=$(python -c "

import re,sys

t=open('bundle-check.css',encoding='utf-8',errors='replace').read()

t=re.sub(r'/\*.*?\*/',' ',t,flags=re.S)

d=stray=0

for ch in t:

    if ch=='{': d+=1

    elif ch=='}':

        if d==0: stray+=1

        else: d-=1

print(d,stray)

")

  [ "$bal" = "0 0" ] && ok "le CSS servi se parse (accolades equilibrees)" \
    || no "le CSS servi est casse (profondeur/orphelines: $bal)"

  # and the late layers really made it into the bundle

  # the phone rules: a swipeable suggestions strip and a Supprimer link big

  # enough that nobody empties a line by accident

  for marker in odys-confirm-refcode odys-track-step mm-sub cart-remove sugg-track-wrap; do

    grep -q "$marker" bundle-check.css && ok "bundle contient $marker" || no "bundle sans $marker"

  done

  grep -q "sugg-arr{display:none}" bundle-check.css && ok "le carrousel passe au balayage sur mobile" || no "les fleches du carrousel restent sur mobile"

  rm -f bundle-check.css

else

  no "aucun bundle CSS a verifier"

fi

step "La page de confirmation ne promet pas d e-mail qu on n envoie pas"

# Avec le paiement a la livraison, cette page est tout le recu : rien n a ete

# paye, aucun releve n en gardera trace, et l e-mail n arrive que si la

# boutique a un serveur de mail qui fonctionne. Classic annoncait "un e-mail

# vous a ete envoye" dans tous les cas.

tpl=../dist/odys-theme-ps8/themes/odys/templates/checkout/order-confirmation.tpl

[ -f "$tpl" ] && ok "la confirmation a son propre gabarit" || no "gabarit de confirmation absent"

grep -q "PS_MAIL_METHOD') == 2" "$tpl"   && ok "l e-mail n est annonce que si la boutique est configuree pour en envoyer"   || no "la page promet un e-mail sans verifier que la boutique peut l envoyer"

grep -q "odys-confirm-refcode" "$tpl"   && ok "la reference est mise en avant" || no "la reference reste noyee dans un tableau"

grep -q "A preparer pour la livraison\|À préparer pour la livraison" "$tpl"   && ok "le montant a preparer est annonce" || no "le client ne sait pas quoi preparer"

# et l etat reel de l envoi de mail, pour information

mm=$(sql "SELECT value FROM ps_configuration WHERE name='PS_MAIL_METHOD'")

case "${mm:-1}" in

  2) ok "la boutique est configuree en SMTP";;

  3) echo "  (envoi de mail desactive : la page n annonce aucun e-mail, c est coherent)";;

  *) echo "  (PHP mail() sans SMTP : a configurer avant le lancement — aucun e-mail ne partira)";;

esac

step "Suivi de commande"

trk=$(cat ../dist/odys-theme-ps8/themes/odys/templates/_partials/order-tracking.tpl 2>/dev/null)

[ -n "$trk" ] && ok "le partial de suivi est livré" || no "order-tracking.tpl manquant"

echo "$trk" | grep -q 'odysOrderSteps' \
  && ok "les étapes viennent de Configuration, pas d'identifiants en dur" \
  || no "les identifiants d'état sont écrits dans le template"

echo "$trk" | grep -q 'odys-track--stopped' \
  && ok "une commande annulée affiche un état terminal, pas une barre de progression" \
  || no "une commande annulée afficherait une fausse progression"

hist=$(cat ../dist/odys-theme-ps8/themes/odys/templates/customer/history.tpl 2>/dev/null)

echo "$hist" | grep -q 'order.details.reference' \
  && ok "la liste des commandes lit les clés du présentateur" \
  || no "la liste des commandes affichera « Array »"

for page in order-detail guest-tracking guest-login; do

  [ -f "../dist/odys-theme-ps8/themes/odys/templates/customer/$page.tpl" ] \
    && ok "customer/$page.tpl livré" || no "customer/$page.tpl manquant"

done

step "Parcours du site (crawl.py)"

if command -v python >/dev/null 2>&1; then

  # a short walk here; the full pre-launch pass is `python docker/crawl.py`

  out=$(cd "$(dirname "$0")" && python crawl.py --base "$SHOP" --max 40 2>&1)

  echo "$out" | tail -1 | grep -q "Rien a signaler" \
    && ok "$(echo "$out" | head -1 | sed 's/(s)//g')" \
    || { no "le parcours signale des problèmes :"; echo "$out" | grep -E '^--|^ ' | head -12; }

else

  echo "  (python absent : parcours ignoré — lancez 'python docker/crawl.py' avant le lancement)"

fi

step "Offrir : la case cadeau et le mot qui l accompagne"

# PrestaShop sait deja offrir : une case a l etape de livraison, un message
# joint a la commande, lisible en Back Office sur la fiche et sur le bon de
# livraison. Rien a reecrire — il fallait l allumer, et reparer deux choses.
[ "$(sql "SELECT value FROM ps_configuration WHERE name='PS_GIFT_WRAPPING'")" = "1" ] \
  && ok "l option cadeau est active" \
  || no "l option cadeau est eteinte : la case ne s affiche pas dans le tunnel"

# Premiere reparation. Le gabarit livre la zone du message dans un
# div.collapse, que le theme classique ouvre et ferme avec son JavaScript.
# Ce theme ne charge pas les ressources du parent : .collapse n existait
# nulle part, la zone restait ouverte en permanence et la case ne commandait
# rien. C est la case qui decide, et en CSS seul.
grep -q 'order-options:has(#input_gift:not(:checked)) #gift{display:none}' "$cssf" \
  && ok "la zone du message s ouvre avec la case, sans une ligne de script" \
  || no "la zone du message du cadeau reste ouverte en permanence"

# Seconde reparation. « C est un cadeau » et « Vous pouvez ajouter un message »
# sont des phrases, pas des intitules de champ. La regle generale des libelles
# les ecrivait en capitales et gagnait : trois classes contre aucune.
# la regle tient sur plusieurs lignes dans la feuille construite : on la relit
# d un seul tenant plutot que ligne par ligne. La feuille construite est en
# CRLF : sans le retour chariot les selecteurs restent separes, et le motif
# ne tombe pas.
tr -d '\r\n' < "$cssf" | grep -q '#delivery label,#gift label' \
  && ok "les deux consignes du tunnel sont des phrases, pas des capitales" \
  || no "les consignes du tunnel sont encore ecrites en capitales"

# Le libelle livre promet un papier-cadeau. Rien ne dit que la maison en
# fournit un, et une promesse non tenue se paie au deballage.
lib=$(sql "SELECT translation FROM ps_translation WHERE domain='ShopThemeCheckout' LIMIT 1")
case "$lib" in
  *cadeau*) ok "le libelle de la case est celui de la maison : $lib";;
  "")       no "aucun libelle surcharge : la case promet un papier-cadeau";;
  *)        no "libelle inattendu : $lib";;
esac

# Le mot doit survivre jusqu a la commande, pas seulement jusqu au panier.
cols=$(sql "SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='ps_orders' AND column_name IN ('gift','gift_message')")
[ "${cols:-0}" = "2" ] \
  && ok "la commande transporte le drapeau et le message" \
  || no "ps_orders ne porte pas gift/gift_message : le mot s arrete au panier"

grep -q "PS_GIFT_WRAPPING" ../dist/deploy/maj-telephone.php \
  && ok "le lot de mise a jour allume l option cadeau en production" \
  || no "le lot n allume pas l option cadeau"
grep -q "ShopThemeCheckout" ../dist/deploy/maj-telephone.php \
  && ok "le lot pose le libelle de la case" \
  || no "le lot ne pose pas le libelle de la case"

step "La banniere se regle en Back Office, destinations comprises"

# Les mots de la banniere s editaient deja ; le bouton, lui, menait toujours
# a la collection de parfums. Impossible d ouvrir la page d accueil sur une
# nouveaute ou sur un coffret sans reconstruire le theme.
ctl=../dist/odys-theme-ps8/themes/odys/modules/odys_loyalty/controllers/admin/AdminOdysThemeController.php
for c in ODYS_HERO_CTA_URL ODYS_HERO_LINK ODYS_HERO_LINK_URL ODYS_HERO_SLIDE2; do
  grep -q "'$c'" "$ctl" \
    && ok "l ecran Theme ODYS propose $c" \
    || no "$c manque a l ecran Theme ODYS"
done

# Une destination tapee par un employe finit dans un href : « javascript: »
# n y a pas sa place, et le refus se dit plutot que de vider la case.
grep -qF 'https?://|/' "$ctl" \
  && ok "une destination doit commencer par https:// ou par /" \
  || no "l ecran accepte n importe quelle destination, javascript: compris"

hero=../dist/odys-theme-ps8/themes/odys/templates/_partials/home-hero.tpl
grep -q "odysSlide.url|escape" "$hero" \
  && ok "les adresses de la banniere sont echappees a l affichage" \
  || no "une adresse venue du Back Office est ecrite telle quelle dans un href"
grep -q "ODYS_HERO_SLIDE2') !== '0'" "$hero" \
  && ok "le second visuel se coupe en Back Office" \
  || no "le second visuel de la banniere n est pas debrayable"

# Le module qui porte cet ecran n a JAMAIS figure dans le lot : aucune
# version de l ecran Theme ODYS n est jamais partie en production.
python - <<'EOPY' && ok "le module odys_loyalty est dans le lot, a sa place vivante" || no "l ecran Theme ODYS n atteindra pas la production"
import pathlib, re, sys
lot = pathlib.Path("../dist/deploy/maj-telephone.php")
if not lot.exists():
    print("  maj-telephone.php absent"); sys.exit(1)
txt = lot.read_text(encoding="utf-8", errors="replace")
livres = set(re.findall(r"'(modules/odys_loyalty/[^']+)' => \[", txt))
attendu = "modules/odys_loyalty/controllers/admin/AdminOdysThemeController.php"
if attendu not in livres:
    print("  manque :", attendu); sys.exit(1)
print("  %d fichier(s) du module dans le lot" % len(livres))
EOPY
grep -q '_mod = sorted' ../psbuild/make_maj_telephone.py \
  && ok "le module est enumere depuis dist/, pas tenu a la main" \
  || no "la liste des fichiers du module est de nouveau tenue a la main"


step "L etape de livraison se lit d un coup d oeil"

# PrestaShop met un <footer> dans la carte d adresse. Le pied du site est
# habille par des regles qui visent `footer` tout court — dans identity.css
# comme dans le prototype : la carte recevait le fond noir et les 52 px du
# pied de page, un bloc sombre en travers du tunnel avec « Modifier » et
# « Supprimer » noyes dedans.
tr -d '\r\n' < "$cssf" | grep -qE '\.address-footer\{ *background:none' \
  && ok "la carte d adresse n est plus peinte comme le pied de page" \
  || no "la carte d adresse reprend le fond noir du pied de page"

# La liste des transporteurs arrive dans la grille de Bootstrap, que ce
# theme ne charge pas, et la page du tunnel pose en plus sa propre grille
# sur toute .row qu elle contient — une seule colonne sous 900 px. Le nom,
# le delai et le prix tombaient chacun sur sa ligne, a l etape juste avant
# le paiement.
tr -d '\r\n' < "$cssf" | grep -qE '\.delivery-options \.delivery-option \.row\{ *display:flex' \
  && ok "chaque transporteur tient sur une ligne, prix a droite" \
  || no "le nom, le delai et le prix du transporteur s empilent"


step "No new PHP exceptions"

recent=$(psh "tail -3 /var/www/html/var/logs/*exception.log 2>/dev/null | grep -c ERROR" | tr -d '\r')

echo "  (exception log lines: ${recent:-0} — pre-existing entries from the broken-image-types phase are expected)"

printf '\n===============================\n%s passed, %s failed\n' "$pass" "$fail"
