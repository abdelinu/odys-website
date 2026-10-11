"""The category page showed PrestaShop's plumbing as plain text.

Classic's templates are written against Bootstrap 4 alpha, which this theme
never shipped, so every `hide` / `hidden-*-up` element was visible and the
sort dropdown printed all of its options as a list ("Vente, ordre décroissant
Pertinence Nom, A à Z ..."), followed by a stray "Filtres actifs".

Two fixes, both CSS: the visibility utilities classic relies on, and the
listing chrome styled like the rest of the theme. The dropdown opens on
`.open` / `.show` (what PrestaShop's JS sets) *and* on `:focus-within`, so it
works even if that JS never runs.
"""
import pathlib

CSS = """
/* ── Bootstrap 4 alpha visibility utilities ──────────────────────────────
   Classic's markup hides things with these; without them PrestaShop's own
   blocks leak onto the page (a stray "Filtres actifs", two newsletter submit
   buttons, the sort label on mobile). */
.hide,.hidden-xs-up{display:none!important}
@media (max-width:575px){.hidden-xs-down{display:none!important}}
@media (min-width:576px){.hidden-sm-up{display:none!important}}
@media (max-width:767px){.hidden-sm-down{display:none!important}}
@media (min-width:768px){.hidden-md-up{display:none!important}}
@media (max-width:991px){.hidden-md-down{display:none!important}}
@media (min-width:992px){.hidden-lg-up{display:none!important}}
@media (max-width:1199px){.hidden-lg-down{display:none!important}}

/* ── Product listing chrome: count, sort, pagination ─────────────────── */
.products-selection{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;
  gap:12px;margin:0 0 var(--spacing-lg,28px);padding:0 0 14px;
  border-bottom:1px solid var(--odys-hairline,rgba(233,211,174,.14))}
.products-selection > [class^="col-"],.products-selection .row{padding:0;margin:0;max-width:none;
  flex:0 1 auto;display:flex;align-items:center;gap:12px}
.total-products p{margin:0;font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:2px;
  text-transform:uppercase;color:var(--odys-muted,rgba(237,227,211,.5))}
.sort-by{font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:2px;
  text-transform:uppercase;color:var(--odys-muted,rgba(237,227,211,.5))}
.products-sort-order{position:relative}
.products-sort-order .select-title{display:inline-flex;align-items:center;gap:8px;padding:9px 16px;
  background:transparent;border:1px solid var(--odys-hairline,rgba(233,211,174,.22));border-radius:2px;
  color:var(--odys-text,#EDE3D3);font-family:var(--font-sans,sans-serif);font-size:11px;
  letter-spacing:1.4px;cursor:pointer}
.products-sort-order .select-title::after{content:'▾';font-size:10px;
  color:var(--odys-sand,#E9D3AE)}
.products-sort-order .dropdown-menu{display:none;position:absolute;right:0;top:calc(100% + 6px);
  z-index:60;min-width:230px;padding:6px 0;margin:0;list-style:none;
  background:var(--odys-surface,#111316);border:1px solid var(--odys-hairline,rgba(233,211,174,.18));
  border-radius:2px;box-shadow:0 18px 40px rgba(0,0,0,.45)}
.products-sort-order.open .dropdown-menu,
.products-sort-order.show .dropdown-menu,
.products-sort-order:focus-within .dropdown-menu{display:block}
.products-sort-order .dropdown-menu a{display:block;padding:9px 16px;text-decoration:none;
  font-family:var(--font-sans,sans-serif);font-size:11px;letter-spacing:.6px;
  color:var(--odys-text,#EDE3D3)}
.products-sort-order .dropdown-menu a:hover,
.products-sort-order .dropdown-menu a.current{background:rgba(233,211,174,.08);
  color:var(--odys-sand,#E9D3AE)}

.pagination{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:14px;
  margin:var(--spacing-xl,40px) 0 0;padding:18px 0 0;
  border-top:1px solid var(--odys-hairline,rgba(233,211,174,.14))}
.pagination .col-md-4,.pagination .col-md-6,.pagination > div{padding:0;flex:0 1 auto}
.pagination ul{display:flex;gap:6px;list-style:none;margin:0;padding:0}
.pagination li a,.pagination li span{display:inline-flex;align-items:center;justify-content:center;
  min-width:34px;height:34px;padding:0 10px;border:1px solid var(--odys-hairline,rgba(233,211,174,.18));
  border-radius:2px;text-decoration:none;font-family:var(--font-sans,sans-serif);font-size:11px;
  color:var(--odys-text,#EDE3D3)}
.pagination li.current a,.pagination li.current span{background:var(--odys-sand,#E9D3AE);
  border-color:var(--odys-sand,#E9D3AE);color:#0A0B0D}
.pagination li.disabled a,.pagination li.disabled span{opacity:.35}
"""

css_path = pathlib.Path(__file__).resolve().parent / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in css else "\n"
if "Bootstrap 4 alpha visibility utilities" in css:
    print("  OK   theme-additions.css (already applied)")
else:
    # the newsletter no longer needs its own special case
    css = css.replace(
        ".block_newsletter .hidden-sm-up{display:none}           /* the mobile \"ok\" duplicate */" + nl, "")
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: visibility utilities + listing chrome")
