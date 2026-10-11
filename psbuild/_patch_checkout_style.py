"""The checkout was unstyled — the one page that must not be.

PrestaShop renders the tunnel from classic's templates with Bootstrap 4 alpha
classes (`.checkout-step`, `.form-group.row`, `.col-md-3`, `.custom-radio`),
and the theme shipped no rules for any of it: raw inputs, no gutter, no
summary column. The same markup drives login, contact, addresses and order
history, so these rules are written once against those classes and scoped to
the inherited pages, never to the theme's own sections.
"""
import pathlib

CSS = """
/* ══════════════════════════════════════════════════════════════════
   6. PrestaShop's own pages: checkout, account, forms
   Classic's markup, dressed in the theme.
   ══════════════════════════════════════════════════════════════════ */
body.checkout main,body.authentication main,body.registration main,body.identity main,
body.addresses main,body.address main,body.history main,body.order-detail main,
body.order-confirmation main,body.contact main,body.my-account main,body.cms main{
  display:block;max-width:var(--maxw);margin:0 auto;
  padding:var(--spacing-xl,40px) var(--page-gutter) var(--spacing-2xl,64px)}

/* two columns: the tunnel, then the order summary */
body.checkout .row{display:grid;grid-template-columns:minmax(0,1.6fr) minmax(0,1fr);
  gap:var(--spacing-lg,28px);align-items:start;margin:0}
body.checkout .cart-grid-body,body.checkout .cart-grid-right{max-width:none;padding:0;flex:none}
@media (max-width:900px){body.checkout .row{grid-template-columns:minmax(0,1fr)}}

/* a step is a card; the open one is lit */
.checkout-step{border:1px solid var(--odys-hairline,rgba(233,211,174,.14));border-radius:3px;
  background:var(--odys-surface,#111316);margin-bottom:14px;overflow:hidden}
.checkout-step.-current{border-color:rgba(233,211,174,.38)}
.checkout-step .step-title{display:flex;align-items:center;gap:12px;margin:0;padding:18px 22px;
  font-family:var(--font-display,serif);font-size:17px;font-weight:500;
  color:var(--odys-text,#EDE3D3);cursor:pointer}
.checkout-step .step-number{display:inline-flex;align-items:center;justify-content:center;
  width:26px;height:26px;border-radius:50%;border:1px solid var(--odys-sand,#E9D3AE);
  font-family:var(--font-sans,sans-serif);font-size:11px;color:var(--odys-sand,#E9D3AE)}
.checkout-step .step-edit{margin-left:auto;font-size:10px;letter-spacing:2px;text-transform:uppercase;
  color:var(--odys-sand,#E9D3AE);cursor:pointer}
.checkout-step .content{padding:0 22px 22px}
.checkout-step.-unreachable .content,.checkout-step:not(.-current):not(.-reachable) .content{display:none}

/* forms: one column on phones, label + field on desktop */
.form-group{margin:0 0 16px}
.form-group.row{display:grid;grid-template-columns:minmax(0,180px) minmax(0,1fr);gap:8px 18px;
  align-items:center;margin:0 0 16px}
.form-group.row > [class^="col-"]{padding:0;max-width:none;flex:none;min-width:0}
@media (max-width:720px){.form-group.row{grid-template-columns:minmax(0,1fr)}}
.form-control-label,.form-group label:not(.radio-inline):not(.custom-checkbox){
  font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:1.8px;text-transform:uppercase;
  color:var(--odys-muted,rgba(237,227,211,.55));margin:0}
.form-control,
body.checkout input[type=text],body.checkout input[type=email],body.checkout input[type=tel],
body.checkout input[type=password],body.checkout select,body.checkout textarea,
body.authentication input[type=text],body.authentication input[type=email],
body.authentication input[type=password],body.registration input[type=text],
body.registration input[type=email],body.registration input[type=password],
body.contact input[type=text],body.contact input[type=email],body.contact textarea,
body.contact select,body.identity input,body.address input,body.address select{
  width:100%;padding:11px 14px;background:transparent;
  border:1px solid var(--odys-hairline,rgba(233,211,174,.22));border-radius:2px;
  color:var(--odys-text,#EDE3D3);font-family:var(--font-sans,sans-serif);font-size:13px}
.form-control:focus,body.checkout input:focus,body.authentication input:focus,
body.contact input:focus,body.contact textarea:focus{outline:none;
  border-color:var(--odys-sand,#E9D3AE)}
select.form-control,body.checkout select{appearance:none;
  background-image:linear-gradient(45deg,transparent 50%,var(--odys-sand,#E9D3AE) 50%),
    linear-gradient(135deg,var(--odys-sand,#E9D3AE) 50%,transparent 50%);
  background-position:calc(100% - 18px) 50%,calc(100% - 13px) 50%;
  background-size:5px 5px,5px 5px;background-repeat:no-repeat;padding-right:38px}
.form-control-comment,.help-block,.form-informations{font-size:11px;line-height:1.7;
  color:var(--odys-muted,rgba(237,227,211,.45))}
.form-control-valign{display:flex;align-items:center;gap:16px;flex-wrap:wrap}

/* radios and checkboxes: classic hides the input and paints a span */
.custom-radio,.custom-checkbox{display:inline-flex;align-items:center;gap:8px}
.custom-radio input,.custom-checkbox input{width:16px;height:16px;accent-color:var(--odys-sand,#E9D3AE)}
.custom-radio span,.custom-checkbox span:not(.color){font-size:12px;
  color:var(--odys-text,#EDE3D3)}
label.radio-inline{display:inline-flex;align-items:center;gap:6px;margin:0 14px 0 0;
  font-size:12px!important;letter-spacing:0!important;text-transform:none!important;
  color:var(--odys-text,#EDE3D3)!important}
.custom-checkbox label,.custom-checkbox em{font-size:12px;line-height:1.7;
  color:var(--odys-muted,rgba(237,227,211,.6))}

/* buttons */
body.checkout .btn-primary,body.authentication .btn-primary,body.registration .btn-primary,
body.contact .btn-primary,body.identity .btn-primary,body.address .btn-primary,
button.continue,.form-footer .btn{display:inline-flex;align-items:center;justify-content:center;
  gap:8px;padding:13px 28px;border:1px solid var(--odys-sand,#E9D3AE);border-radius:2px;
  background:var(--odys-sand,#E9D3AE);color:#0A0B0D;cursor:pointer;
  font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:2.5px;text-transform:uppercase}
body.checkout .btn-primary:hover,button.continue:hover{background:transparent;
  color:var(--odys-sand,#E9D3AE)}
.form-footer{margin-top:18px}
body.checkout a,body.authentication a,body.contact a{color:var(--odys-sand,#E9D3AE)}

/* order summary column */
.cart-summary,.cart-grid-right .card,#order-summary-content{
  border:1px solid var(--odys-hairline,rgba(233,211,174,.14));border-radius:3px;
  background:var(--odys-surface,#111316);padding:22px}
.cart-summary-line{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:13px}
.cart-summary-line .label{color:var(--odys-muted,rgba(237,227,211,.55))}
.cart-total{padding-top:14px;border-top:1px solid var(--odys-hairline,rgba(233,211,174,.18));
  font-family:var(--font-display,serif);font-size:18px}
.media-list .media,.cart-summary-products .media{display:flex;gap:12px;align-items:center;
  padding:10px 0;border-bottom:1px solid var(--odys-hairline,rgba(233,211,174,.08))}
.media-list img,.cart-summary-products img{width:52px;height:auto;border-radius:2px}

/* tables PrestaShop uses for orders, addresses and vouchers */
body.history table,body.order-detail table,body.addresses table,body.order-slip table{
  width:100%;border-collapse:collapse;font-size:12px}
body.history th,body.order-detail th,body.addresses th{text-align:left;padding:10px 12px;
  font-family:var(--font-sans,sans-serif);font-size:10px;letter-spacing:1.6px;text-transform:uppercase;
  color:var(--odys-muted,rgba(237,227,211,.5));
  border-bottom:1px solid var(--odys-hairline,rgba(233,211,174,.18))}
body.history td,body.order-detail td,body.addresses td{padding:12px;
  border-bottom:1px solid var(--odys-hairline,rgba(233,211,174,.08))}

/* PrestaShop's alerts */
.alert{padding:12px 16px;border-radius:2px;font-size:12px;line-height:1.7;margin-bottom:16px;
  border:1px solid var(--odys-hairline,rgba(233,211,174,.18));color:var(--odys-text,#EDE3D3)}
.alert-danger{border-color:rgba(200,80,70,.5);background:rgba(200,80,70,.08)}
.alert-success{border-color:rgba(60,150,100,.5);background:rgba(60,150,100,.08)}
.alert-warning{border-color:rgba(233,211,174,.45);background:rgba(233,211,174,.06)}
"""

p = pathlib.Path(__file__).resolve().parent / "theme-additions.css"
s = p.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in s else "\n"
if "PrestaShop's own pages: checkout" in s:
    print("  OK   theme-additions.css (already applied)")
else:
    # the listing rule already covers body.cms; keep one source of truth
    s = s.replace("body.sitemap main,body.pagenotfound main,body.stores main{",
                  "body.sitemap main,body.pagenotfound main,body.stores main{")
    p.write_text(s.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: checkout, forms, summary, tables, alerts")
