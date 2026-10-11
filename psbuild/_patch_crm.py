"""One-off: ship modules/odys_crm and the legal copy from build_theme.py (CRLF-safe)."""
import pathlib, sys

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "odys_crm" in s:
    sys.exit("already patched")

anchor = "# ═══════════════════════════════════════════════════════════════════════\n# 4. theme.yml"
if s.count(anchor) != 1:
    sys.exit(f"anchor found {s.count(anchor)}x")

new = '''# ── 3c. The CRM module and the legal copy ──────────────────────────────
#   The module is a separate PrestaShop install (copy it into modules/), and
#   legal/ holds the text to paste into the CMS pages in Back Office.
mod_src = HERE / "module"
if mod_src.exists():
    mod_dst = DIST / "modules"
    if mod_dst.exists():
        shutil.rmtree(mod_dst, ignore_errors=True)
    shutil.copytree(mod_src, mod_dst)
    php = sorted(f.name for f in mod_dst.rglob("*.php"))
    must(len(php) >= 4, f"modules/odys_crm shipped ({len(php)} PHP files, {', '.join(php)})")

legal_src = HERE / "legal"
if legal_src.exists():
    legal_dst = DIST / "legal"
    legal_dst.mkdir(exist_ok=True)
    pages = 0
    for f in sorted(legal_src.glob("*.html")):
        shutil.copy(f, legal_dst / f.name)
        pages += 1
    must(pages == 3, f"legal/ copy for the CMS pages ({pages} pages)")

'''

s = s.replace(anchor, new + anchor)
out = s.replace("\n", "\r\n") if crlf else s
p.write_bytes(out.encode("utf-8"))
print("patched", "(CRLF kept)" if crlf else "")
