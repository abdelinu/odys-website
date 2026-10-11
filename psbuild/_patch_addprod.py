"""The product page's buy button posts to PrestaShop, not the local cart.

catalog/product.tpl (inherited from v3.1) uses data-action="add-prod" with a
real data-id-product. The prototype handler only filled the in-page drawer, so
on a live shop the PrestaShop cart never moved. Route it through the same
bridge that already handles data-action="add-to-cart".
"""
import pathlib, sys, ast

p = pathlib.Path(__file__).with_name("build_theme.py")
raw = p.read_bytes()
crlf = b"\r\n" in raw
s = raw.decode("utf-8").replace("\r\n", "\n")

if "add-prod: PrestaShop bridge" in s:
    sys.exit("already patched")

anchor = 'must(js.count("function psAddToCart(") == 1, "add-to-cart: exactly one psAddToCart")\n'
if s.count(anchor) != 1:
    sys.exit(f"anchor found {s.count(anchor)}x")

block = '''
# The product page's button is data-action="add-prod" with a real
# data-id-product: send it through the PrestaShop bridge instead of the
# prototype's in-page cart, or a live shop never receives the order.
js, n = re.subn(
    re.escape("""var btn = e.target.closest('[data-action="add-to-cart"][data-id-product]');"""),
    """var btn = e.target.closest('[data-action="add-to-cart"][data-id-product], [data-action="add-prod"][data-id-product]');""",
    js, count=1)
must(n == 1, "add-prod: PrestaShop bridge also handles the product page button")

js, n = re.subn(
    re.escape("    case 'add-prod':      ODYS.addProd(); break;"),
    "    case 'add-prod':      if (!p.idProduct) ODYS.addProd(); break;  // PS buttons: bridge below",
    js, count=1)
must(n == 1, "add-prod: prototype handler skips PrestaShop buttons")
'''

s = s.replace(anchor, anchor + block, 1)
ast.parse(s)
p.write_bytes((s.replace("\n", "\r\n") if crlf else s).encode("utf-8"))
print("patched: add-prod routed to PrestaShop")
