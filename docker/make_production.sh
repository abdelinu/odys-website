#!/usr/bin/env bash
# Build a deployable copy of the shop for odysparfum.com.
#
# Everything happens against a throwaway database called odys_prod, so the
# development shop this is taken from keeps working and keeps passing its
# suite. Output lands in dist/deploy/:
#
#   odysparfum-db.sql.gz    the catalogue, pages and settings, demo data gone
#   odysparfum-files.tar.gz the site, without caches or anything git-ignored
#   parameters.php          config with fresh secrets, DB credentials blank
#
# Run it from docker/:  bash make_production.sh
set -euo pipefail
cd "$(dirname "$0")"

if [ -f .env ]; then set -a; . ./.env; set +a; fi
: "${MYSQL_USER:?copy docker/.env.example to docker/.env first}"
: "${MYSQL_PASSWORD:?copy docker/.env.example to docker/.env first}"
: "${MYSQL_DATABASE:=prestashop}"
# Creating and dropping a second database needs rights the shop user does not
# have, and should not have.
: "${MYSQL_ROOT_PASSWORD:?set it in docker/.env}"

DOMAIN=${DOMAIN:-odysparfum.com}
OUT=../dist/deploy
WORK=odys_prod

say()  { printf '  %s\n' "$1"; }
step() { printf '\n== %s\n' "$1"; }

root_sql() {   # a statement against the server
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db mysql -uroot -N -B -e "$1"
}
mysql_in() {   # a statement against the working copy
  docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db mysql -uroot "$WORK" -N -B -e "$1"
}

mkdir -p "$OUT"

step "Copie de travail"
root_sql "DROP DATABASE IF EXISTS \`$WORK\`;
          CREATE DATABASE \`$WORK\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;"
docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db sh -c \
  "mysqldump -uroot --single-transaction --no-tablespaces '$MYSQL_DATABASE' | mysql -uroot '$WORK'"
say "$(mysql_in "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='$WORK'") table(s) copiee(s)"

step "Donnees de demonstration et de test"
# PrestaShop's sample customer and its five sample orders, plus everything the
# test runs left behind. A production shop should open with an empty order list.
mysql_in "
  CREATE TEMPORARY TABLE _dc AS
    SELECT id_customer FROM ps_customer
     WHERE email LIKE '%@prestashop.com' OR email LIKE '%@odys.test'
        OR email LIKE 'sonde%' OR email LIKE '%@example.ma';
  CREATE TEMPORARY TABLE _do AS
    SELECT id_order FROM ps_orders WHERE id_customer IN (SELECT id_customer FROM _dc);

  DELETE FROM ps_order_detail    WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_order_history   WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_order_carrier   WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_order_cart_rule WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_order_invoice   WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_orders          WHERE id_order IN (SELECT id_order FROM _do);
  DELETE FROM ps_cart_product    WHERE id_cart IN
    (SELECT id_cart FROM ps_cart WHERE id_customer IN (SELECT id_customer FROM _dc));
  DELETE FROM ps_cart            WHERE id_customer IN (SELECT id_customer FROM _dc);
  DELETE FROM ps_address         WHERE id_customer IN (SELECT id_customer FROM _dc);
  DELETE FROM ps_customer        WHERE id_customer IN (SELECT id_customer FROM _dc);
"
# anything keyed only by e-mail, and the traces left by probing
mysql_in "
  TRUNCATE ps_customer_message;
  TRUNCATE ps_customer_thread;
  TRUNCATE ps_odys_crm_lead;
  TRUNCATE ps_connections_page;
  TRUNCATE ps_connections_source;
  TRUNCATE ps_connections;
  TRUNCATE ps_guest;
  TRUNCATE ps_page_viewed;
  TRUNCATE ps_statssearch;
  TRUNCATE ps_log;
"
say "commandes restantes : $(mysql_in 'SELECT COUNT(*) FROM ps_orders')"
say "clients restants    : $(mysql_in 'SELECT COUNT(*) FROM ps_customer')"
say "produits conserves  : $(mysql_in 'SELECT COUNT(*) FROM ps_product')"
say "pages CMS publiees  : $(mysql_in 'SELECT COUNT(*) FROM ps_cms WHERE active=1')"

step "Domaine et HTTPS"
mysql_in "
  UPDATE ps_shop_url SET domain='$DOMAIN', domain_ssl='$DOMAIN', physical_uri='/';
  UPDATE ps_configuration SET value='$DOMAIN' WHERE name IN ('PS_SHOP_DOMAIN','PS_SHOP_DOMAIN_SSL');
  UPDATE ps_configuration SET value='1'
   WHERE name IN ('PS_SSL_ENABLED','PS_SSL_ENABLED_EVERYWHERE');
  UPDATE ps_configuration SET value='0' WHERE name='PS_SHOP_ENABLE';
"
say "domaine     : $(mysql_in 'SELECT CONCAT(domain, physical_uri) FROM ps_shop_url LIMIT 1')"
say "HTTPS force : $(mysql_in "SELECT value FROM ps_configuration WHERE name='PS_SSL_ENABLED_EVERYWHERE'")"
say "la boutique demarre en maintenance (PS_SHOP_ENABLE=0), a ouvrir quand tout est verifie"

step "Adresses et liens de developpement"
# PS_SHOP_EMAIL is the From: of every message the shop sends. Left pointing at
# odys.test, a domain that does not exist, the confirmations would be rejected
# or filed as spam the moment SMTP started working - a failure that looks like
# "the e-mails do not arrive" and is hunted for in the wrong place.
ADMIN_EMAIL=${ADMIN_EMAIL:-contact@$DOMAIN}
mysql_in "UPDATE ps_configuration
             SET value = '$ADMIN_EMAIL'
           WHERE value LIKE '%@odys.test';"
say "adresses d envoi : $(mysql_in "SELECT GROUP_CONCAT(DISTINCT name) FROM ps_configuration WHERE value='$ADMIN_EMAIL'")"

# ps_contact holds where the contact form delivers - the other half of the
# same problem, and the half that loses customer messages rather than
# confirmations.
mysql_in "UPDATE ps_contact SET email = '$ADMIN_EMAIL' WHERE email LIKE '%@odys.test';"
say "destinataires du formulaire : $(mysql_in 'SELECT GROUP_CONCAT(DISTINCT email) FROM ps_contact')"

# The legal pages cross-link each other with absolute URLs, written when the
# shop answered on localhost. On the new domain they would simply be dead.
for TABLE_COL in "cms_lang:content" "category_lang:description" "product_lang:description" "product_lang:description_short"; do
  T=${TABLE_COL%%:*}; C=${TABLE_COL##*:}
  mysql_in "UPDATE ps_$T SET \`$C\` = REPLACE(\`$C\`, 'http://localhost:8080/', 'https://$DOMAIN/')
             WHERE \`$C\` LIKE '%localhost:8080%';"
done
say "liens restants vers localhost : $(mysql_in "SELECT COUNT(*) FROM ps_cms_lang WHERE content LIKE '%localhost%'")"

step "Compte d administration"
# The development password does not travel, and neither does admin@odys.test:
# that domain does not exist, so "mot de passe oublie" would send the reset to
# nowhere and the Back Office would be unreachable. The address becomes one
# that will exist on the new domain, and the stored hash becomes a value
# nobody knows - the password is set on the server, by its owner, in step 7
# of DEPLOIEMENT.md. No production password is generated here or written down.
ADMIN_EMAIL=${ADMIN_EMAIL:-contact@$DOMAIN}
mysql_in "UPDATE ps_employee
            SET email = '$ADMIN_EMAIL',
                passwd = CONCAT('\$2y\$10\$', SHA2(RAND(), 256))
          WHERE email LIKE '%@odys.test';"
say "mot de passe de developpement retire"
say "comptes : $(mysql_in 'SELECT GROUP_CONCAT(email) FROM ps_employee')"
say "le mot de passe se definit sur le serveur (etape 7)"

step "Export de la base"
docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" db \
  mysqldump -uroot --single-transaction --no-tablespaces \
  --default-character-set=utf8mb4 "$WORK" | gzip -9 > "$OUT/odysparfum-db.sql.gz"
say "$(du -h "$OUT/odysparfum-db.sql.gz" | cut -f1) ecrit"

step "Export des fichiers"
# Hostinger's uploader refuses an archive containing .py, .tsm or .aspx and
# stops at the first one. PrestaShop's vendor/ carries a handful of build and
# test scripts from its dependencies - two Python data-scripts in zxcvbn, some
# shell scripts, and a Windows .exe Symfony uses for hidden console input and
# which a Linux host never runs. None of them serve a page; dropping them
# costs nothing and gets the archive past the filter.
docker compose exec -T shop sh -c 'cd /var/www/html && tar -czf /tmp/site.tar.gz \
  --exclude=./var/cache --exclude=./var/logs --exclude=./var/sessions \
  --exclude=./themes/odys/assets/cache --exclude=./themes/classic/assets/cache \
  --exclude=./.git --exclude=./admin-dev --exclude=./tests \
  --exclude=./app/config/parameters.php --exclude=./app/config/parameters.yml \
  --exclude="*.py" --exclude="*.tsm" --exclude="*.aspx" --exclude="*.asp" \
  --exclude="*.jsp" --exclude="*.cgi" --exclude="*.pl" --exclude="*.exe" \
  --exclude="*.sh" --exclude="*.bat" \
  --exclude=./import_catalogue.php --exclude=./odys_contacts.php \
  --exclude=./upgrade_crm.php --exclude=./upgrade_loyalty.php \
  --exclude=./catalogue.csv --exclude=./catalogue.json \
  --exclude=./legal --exclude=./odys-preview --exclude=./docs \
  --exclude=./Makefile --exclude=./INSTALL.txt --exclude=./composer.lock \
  --exclude=./.php-cs-fixer.dist.php --exclude=./phpstan.neon.dist \
  --exclude="*/tests/*" --exclude="*/Tests/*" --exclude="*/test/*" \
  --exclude="*/doc/*" --exclude="*/docs/*" --exclude="*/examples/*" \
  --exclude="*/.github/*" --exclude="*.md" \
  .'
# Two reasons for that list.
#
# Security: import_catalogue.php and odys_contacts.php were copied into the
# container during development and have no CLI guard, so on a public server
# anyone could call them and reconfigure the shop. legal/ and catalogue.csv
# are their source data; the pages and products live in the database now.
#
# Weight: vendor/ shipped 12 530 files, a large share of them the test suites
# and documentation of composer packages. None of them serve a page, and the
# file manager died three quarters of the way through extracting them.
docker compose cp shop:/tmp/site.tar.gz "$OUT/odysparfum-files.tar.gz"
docker compose exec -T shop rm -f /tmp/site.tar.gz
say "$(du -h "$OUT/odysparfum-files.tar.gz" | cut -f1) ecrit (caches et parameters.php exclus)"

step "Fichier de configuration"
# Fresh secrets: the development keys have been sitting in a shipped project.
# PrestaShop 8 hashes passwords with bcrypt, so nothing depends on these.
hex() { docker compose exec -T shop php -r "echo bin2hex(random_bytes($1));" | tr -d '\r'; }
SECRET=$(hex 32); CKEY=$(hex 32); CIV=$(hex 16)

# new_cookie_key is NOT an arbitrary random string. PrestaShop hands it
# straight to defuse/php-encryption, which expects a key in that library's own
# format - 136 characters beginning with def00000. A plain hex string of the
# right length is accepted by the config and then kills the shop on the first
# request with "Encoded data is shorter than expected", before PrestaShop can
# print anything: a blank 500 on every page, with the real cause four levels
# down in vendor/.
NKEY=$(docker compose exec -T shop php -r \
  'require "/var/www/html/vendor/autoload.php";
   echo \Defuse\Crypto\Key::createNewRandomKey()->saveToAsciiSafeString();' | tr -d '\r')
case "$NKEY" in
  def00000*) [ ${#NKEY} -eq 136 ] || { echo "cle Defuse de longueur inattendue: ${#NKEY}" >&2; exit 1; } ;;
  *) echo "cle Defuse invalide, abandon" >&2; exit 1 ;;
esac
ADMIN_DIR=$(docker compose exec -T shop sh -c 'cd /var/www/html && ls -d admin* 2>/dev/null | head -1' | tr -d '\r')

cat > "$OUT/parameters.php" <<PHPEOF
<?php
// app/config/parameters.php — odysparfum.com
//
// Renseignez les quatre valeurs REMPLACER depuis hPanel > Bases de donnees MySQL.
// Le reste est deja regle. Les secrets ci-dessous ont ete generes pour ce
// deploiement : ce ne sont pas ceux du developpement.
return [
    'parameters' => [
        'database_host' => 'localhost',
        'database_port' => '',
        'database_name' => 'REMPLACER_nom_de_la_base',
        'database_user' => 'REMPLACER_utilisateur',
        'database_password' => 'REMPLACER_mot_de_passe',
        'database_prefix' => 'ps_',
        'database_engine' => 'InnoDB',
        'mailer_transport' => 'smtp',
        'mailer_host' => '127.0.0.1',
        'mailer_user' => '',
        'mailer_password' => '',
        'secret' => '$SECRET',
        'ps_caching' => 'CacheFs',
        'ps_cache_enable' => false,
        'ps_creation_date' => '$(date +%Y-%m-%d)',
        'locale' => 'fr-FR',
        'use_debug_toolbar' => false,
        'cookie_key' => '$CKEY',
        'cookie_iv' => '$CIV',
        'new_cookie_key' => '$NKEY',
        'api_public_key' => '',
        'api_private_key' => '',
    ],
];
PHPEOF
say "parameters.php ecrit, secrets neufs, 4 valeurs a renseigner"
say "dossier d administration : ${ADMIN_DIR:-admin-odys}"

step "Nettoyage"
root_sql "DROP DATABASE \`$WORK\`;"
say "copie de travail supprimee ; la boutique de developpement est intacte"

printf '\nPret : %s\n' "$OUT"
ls -lh "$OUT" | tail -n +2 | awk '{print "  " $9 "  " $5}'
