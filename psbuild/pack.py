"""Build the shipping zip: theme + docker harness + build sources + prototype.

Asserts the only bottle size anywhere is 50 ml and that the importer creates
MAD, so a stray 30/100 ml can never ship again.
"""
import pathlib, re, sys, zipfile

WS   = pathlib.Path(__file__).resolve().parent.parent
ROOT = WS / "dist" / "odys-theme-ps8"
OUT  = pathlib.Path.home() / "Downloads" / "odys-theme-ps8-v5.0.zip"
TEXT = (".tpl", ".html", ".js", ".css", ".php", ".md", ".csv", ".json", ".py", ".yml", ".sh")

# PrestaShop's combine-and-minify writes its bundles into the theme's own
# assets/cache/. On this machine that folder is the bind-mounted dist/, so the
# shop's runtime artefacts land in the build output. They belong to whichever
# shop generated them and must never ship.
RUNTIME = ("assets/cache/",)
# ...except the .htaccess that tells browsers to revalidate them, which is
# ours and has to travel with the theme.
members = [(p, str(p.relative_to(ROOT))) for p in sorted(ROOT.rglob("*"))
           if p.is_file()
           and (p.name == ".htaccess"
                or not any(r in p.relative_to(ROOT).as_posix() for r in RUNTIME))]
# .env holds real credentials; only the example belongs in the zip
SKIP = {".env"}
for folder in ("docker", "psbuild"):
    members += [(p, str(pathlib.Path(folder) / p.relative_to(WS / folder)))
                for p in sorted((WS / folder).rglob("*"))
                if p.is_file() and "__pycache__" not in p.parts and p.name not in SKIP]
proto = WS / "odys-preview-v5.0.html"
members.append((proto, "prototype/odys-preview-v5.0.html"))

with zipfile.ZipFile(OUT, "w", zipfile.ZIP_DEFLATED) as z:
    for src, arc in members:
        z.write(src, arc)

# ── post-conditions ──────────────────────────────────────────────────────
bad = {}
with zipfile.ZipFile(OUT) as z:
    names = z.namelist()
    for n in names:
        # These name the old sizes on purpose: THEME-NOTES is the changelog,
        # the build and the patch scripts *are* the search-and-replace.
        if not n.endswith(TEXT) or n.endswith(("THEME-NOTES-v5.md", "build_theme.py", "pack.py"))            or "_patch_vol" in n:
            continue
        t = z.read(n).decode("utf-8", "replace")
        # The rule is about the flacon: one size, 50 ml. Home fragrance is
        # sold in its own volumes (a 200 ml diffuser, a 100 ml refill), so a
        # line that is plainly about a diffuser is not a stray bottle size.
        lines = [ln for ln in t.splitlines()
                 if not re.search(r"DIF-|Diffuseur|Recharge", ln, re.I)]
        sizes = set(re.findall(r"(?<![\d,\u2013-])(?!50\s*ml)(\d{1,3}\s*ml)",
                               "\n".join(lines), re.I))
        if sizes:
            bad[n] = sorted(sizes)
    imp = z.read("import_catalogue.php").decode("utf-8")

if bad:
    for n, s in bad.items():
        print("  FAIL %s: %s" % (n, ", ".join(s)))
    sys.exit(1)
assert "MAD" in imp and "symbol" in imp, "importer must create MAD with the DH symbol"

# A credential in a shipped file is a release blocker. The pattern is loose on
# purpose: .env.example's "change-me" placeholders and $VAR references pass,
# anything that looks like a real value does not.
SECRET_RE = re.compile(
    r"""(api[_-]?key|secret|token|passwd|password)\s*[:=]\s*["']?(?!change-me|\$|\{|\(|["']\s|$)[^\s"'<>{}$]{6,}""",
    re.I)
ALLOW = ("change-me", "${", "$MYSQL", "MYSQL_PWD", "password_recovery", "PS_SMARTY",
         "window.prestashop_token", "document.querySelector", "grep -", "getenv(",
         "Configuration::get", "$_ENV", "$_SERVER",
         # a token *derived* at runtime is not a token shipped in a file
         "Tools::getAdminToken", "Tools::getToken", "->getToken(",
         # and a pattern that *matches* URLs containing a token is not one
         "token=|", "token=[",
         "mysql_native_password", "type=\"password\"", "current-password", "field-password",
         "PASSWD: ${", "PASSWORD: ${")
leaks = []
with zipfile.ZipFile(OUT) as z:
    for n in z.namelist():
        if not n.endswith(TEXT) and not n.endswith((".yml", ".example", ".sh")):
            continue
        for line in z.read(n).decode("utf-8", "replace").splitlines():
            if SECRET_RE.search(line) and not any(a in line for a in ALLOW):
                leaks.append("%s: %s" % (n, line.strip()[:90]))
if leaks:
    print("  credential-looking literals in the zip:")
    for leak in leaks[:10]:
        print("   ", leak)
    sys.exit(1)
assert ".env" not in [n.rsplit("/", 1)[-1] for n in names], "a .env must never ship"
print("no credentials in the %d shipped files" % len(names))

# the Flacons Voyage page is removed: only the importer (which deletes the
# category), the changelog and the patch scripts may still name it
with zipfile.ZipFile(OUT) as z:
    page = [n for n in z.namelist()
            if n.endswith(TEXT)
            # the importer deletes the category, verify.sh checks it is gone, and
            # the build scripts are the removal itself
            and not n.endswith(("THEME-NOTES-v5.md", "import_catalogue.php", "verify.sh",
                                "build_theme.py", "pack.py"))
            and "flacons" not in n and "_patch_" not in n
            and any(t in z.read(n).decode("utf-8", "replace")
                    for t in ("pg-flacons", "flacons-voyage", "FLACONS_DB", "cc-flacons"))]
assert not page, "Flacons Voyage page still in: " + ", ".join(page)
print("%d files OK - 50 ml only, MAD currency" % len(names))
print("%s  %d bytes" % (OUT, OUT.stat().st_size))
