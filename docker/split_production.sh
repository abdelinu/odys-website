#!/usr/bin/env bash
# Cut the site into archives a browser file manager can actually extract.
#
# One 29 000-file archive killed Hostinger's extractor three quarters of the
# way through (500, 22 336 inodes landed). Nothing was wrong with the archive:
# the operation simply runs longer than the request is allowed to live. Five
# smaller ones each finish well inside that budget.
#
# They all extract into public_html, in any order, and together they rebuild
# exactly the same tree.
#
#   bash split_production.sh
set -euo pipefail
cd "$(dirname "$0")"

OUT=../dist/deploy/split
mkdir -p "$OUT"
rm -f "$OUT"/*.tar.gz

# One line on purpose: this string is handed to `sh -c`, and a newline inside
# it is a command separator, not whitespace - every exclusion after the first
# line was being run as a command of its own.
EXCL='--exclude=./var/cache --exclude=./var/logs --exclude=./var/sessions --exclude=./themes/odys/assets/cache --exclude=./themes/classic/assets/cache --exclude=./.git --exclude=./admin-dev --exclude=./tests --exclude=./app/config/parameters.php --exclude=./app/config/parameters.yml --exclude=*.py --exclude=*.tsm --exclude=*.aspx --exclude=*.asp --exclude=*.jsp --exclude=*.cgi --exclude=*.pl --exclude=*.exe --exclude=*.sh --exclude=*.bat --exclude=./import_catalogue.php --exclude=./odys_contacts.php --exclude=./upgrade_crm.php --exclude=./upgrade_loyalty.php --exclude=./catalogue.csv --exclude=./catalogue.json --exclude=./legal --exclude=./odys-preview --exclude=./docs --exclude=./Makefile --exclude=./INSTALL.txt --exclude=./composer.lock --exclude=./.php-cs-fixer.dist.php --exclude=./phpstan.neon.dist'

# Each part names what it takes. Part 1 is "everything else": it is built by
# excluding the four heavy directories the other parts carry, so no file can
# fall between the cracks and none is packed twice.
pack() {
  local name=$1; shift
  # the caller names exactly what to pack: a lone directory for parts 2 to 5,
  # or "." minus those directories for part 1. An earlier version always
  # appended "." itself, so every part quietly packed the whole site.
  docker compose exec -T shop sh -c "cd /var/www/html && tar -czf /tmp/p.tar.gz $EXCL $*" >/dev/null
  docker compose cp shop:/tmp/p.tar.gz "$OUT/$name.tar.gz" >/dev/null
  docker compose exec -T shop rm -f /tmp/p.tar.gz
  local n s
  n=$(tar -tzf "$OUT/$name.tar.gz" | wc -l)
  s=$(du -h "$OUT/$name.tar.gz" | cut -f1)
  printf '  %-26s %7s  %6s fichiers\n' "$name.tar.gz" "$s" "$n"
}

echo "Decoupage du site :"
pack "odys-1-socle"   "--exclude=./vendor --exclude=./src --exclude=./admin-odys --exclude=./img ."
pack "odys-2-vendor"  "./vendor"
pack "odys-3-src"     "./src"
pack "odys-4-admin"   "./admin-odys"
pack "odys-5-images"  "./img"

echo
total=0
for f in "$OUT"/*.tar.gz; do total=$((total + $(tar -tzf "$f" | wc -l))); done
echo "  total reassemble : $total fichiers"
echo "  destination      : $OUT"
