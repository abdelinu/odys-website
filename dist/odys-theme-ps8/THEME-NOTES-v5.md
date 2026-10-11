# ODYS Parfums — Theme v5.0 (2026 identity)

Champagne · Crème · Noir · Marine · Or.
Built from v3.1. PrestaShop integration is unchanged: same `theme.yml` asset
ids, same hooks, same Smarty variables, same `odys_loyalty` module.

---

## 1. Where the design lives

`assets/css/theme.css` is one file in four layers, in this order:

| # | Layer | What it owns |
|---|-------|--------------|
| 1 | **Design tokens** (`:root`) | The nine ODYS colours, type, spacing, motion. Single source of truth. |
| 2 | **Base + components** | Everything inherited from v3.1, now resolving through layer 1. |
| 3 | **ODYS identity layer** | The 2026 visual system: nav, hero, cards, product page, cart, footer, signatures, values, essence. |
| 4 | **PrestaShop bindings** | Maps the Smarty class names (`.odys-nav`, `.site-footer`, `.footer-grid`, `.cat-card`, `.why-card`, `.hero-h`…) onto the system. |
| 5 | **Oud & Boukhour** | `body.oud` only — see §2b. |
| 6 | **Nuit** | Whole-site dark, loaded last — see §2c. |

**To change a colour anywhere on the site, change it once in layer 1.**
Every legacy variable is an alias:

```css
--rose  → var(--odys-gold)      --ivory → var(--odys-cream)
--navy  → var(--odys-marine)    --ink   → var(--odys-black)
--mid   → var(--odys-muted)     --border→ var(--odys-border)
```

Nothing below layer 1 hardcodes a colour. 150+ literal hex values and the
legacy `rgba()` triples were rewritten during the build.

### Tokens

```css
--odys-champagne:#E8D6C0;  --odys-cream:#F5EBDD;
--odys-black:#111316;      --odys-marine:#0C1B26;
--odys-gold:#B4863D;       --odys-soft-gold:#C9A66B;
--odys-text:#202124;       --odys-muted:#756B61;
--odys-border:#CDB89E;

--font-display   /* Cormorant Garamond — large editorial display */
--font-editorial /* Playfair Display  — headings, product names   */
--font-body      /* Jost — nav, UI, prices, technical copy        */

--spacing-xs .. --spacing-2xl   (8 / 16 / 24 / 40 / 64 / 104 px)
--transition-luxury  520ms cubic-bezier(.22,.61,.36,1)
```

Gold is for logos, rules, icons, small highlights and hover states only.
Primary buttons are `--odys-black` on cream and turn gold on hover; they are
never gold at rest.

---

## 2. Templates

### Rewritten
```
templates/layouts/layout-full-width.tpl     theme-color, fonts, defer app.js
templates/_partials/header.tpl              cream bar, gold on hover, no emoji
templates/_partials/footer.tpl              black footer, gold headings
templates/_partials/announcement-bar.tpl    written once (JS doubles it)
templates/_partials/mobile-menu.tpl         refined drawer, no emoji
templates/pages/index.tpl                   assembles the home page
templates/catalog/listing.tpl               editorial listing header
templates/catalog/_partials/miniatures/product.tpl   campaign product card
```

### New partials
```
templates/_partials/home-hero.tpl           L'art du parfum
templates/_partials/home-categories.tpl     4 line-icon category tiles
templates/_partials/home-signatures.tpl     Noir & Or / Marine & Or / Crème & Or
templates/_partials/home-values.tpl         Monogramme · Extrait · Flacon · Maroc
templates/_partials/home-essence.tpl        L'essence d'ODYS
templates/_partials/oud-intro.tpl           Oud & Boukhour hero + header +
                                            guarantees + return note
```

### Rewritten (markup was talking to nothing)
```
templates/_partials/cart-drawer.tpl         see §3b
```

### Untouched
`modals.tpl`, `catalog/product.tpl`, `checkout/cart.tpl`,
`customer/*`, `cms/*`, `pages/404|contact|search.tpl`, and the whole
`modules/odys_loyalty` tree. They inherit the new look through the CSS.

## 2b. Oud & Boukhour — "Smoke & Amber"

The oud category is the one page that is about burning wood, so it runs a
warmer sub-palette: a smoke ground with resin amber in place of champagne
and gold. It is a **presentation layer only** — the gram economy is
untouched, and every id, `data-g`, `data-rate` and `data-card-id` the
pricing script reads is unchanged.

```css
--smoke:#14100C   --panel:#1E1812   --amber:#C89355
--amber-soft:#E0B584   --parch:#EDE0CE   --ember:rgba(200,147,85,.22)
```

Everything is scoped to `body.oud`, so it cannot leak. The layout adds that
class for one category:

```smarty
{assign var='isOud' value=(isset($category.link_rewrite) && $category.link_rewrite == 'oud-boukhour')}
<body class="… {if $isOud} oud{/if} …">
```

`catalog/listing.tpl` includes `_partials/oud-intro.tpl` under the same
condition and hides the standard listing header. To move the treatment to a
different category, change the `link_rewrite` test in those two files.

The page also drops from **two `<h1>` elements to one** — the second heading
block is now the centred `<h2>` collection header.

Ships with `assets/img/oud-hero.webp` — a mabkhara smoking on a rug
(Unsplash License). Swap in your own campaign shot when you have one.

### Driving the signatures block from the catalogue

`home-signatures.tpl` renders three house defaults when nothing is passed.
To drive it from PrestaShop, assign `$signatures` before the include:

```php
$this->context->smarty->assign('signatures', [
  ['code'=>'ODYS 14','tone'=>'noir','eyebrow'=>'Noir & Or','tier'=>'Prestige',
   'name'=>"L'Oriental",'volume'=>'Extrait de Parfum · 50 ml',
   'mood'=>'Intense & sophistiqué','desc'=>'…',
   'url'=>$link->getProductLink(14),'image'=>$coverUrl],
  // 'tone' must be one of: noir | marine | creme
]);
```

## 2c. Nuit — the whole site in dark

Golden-hour Morocco, a noir ground, gold line work. Two parts:

**Build step (`psbuild/nuit_prep.py`, self-tested).** v5.0 was light-first, so
some tokens did double duty: cream was the page ground *and* the text on black
buttons. Before the tokens flip, the build moves those uses apart —
`color:var(--odys-cream)` → `--odys-on-dark`, white panels → `--odys-surface`,
literal light hex grounds in inline styles → tokens, and light text tints under
45 % alpha → 64 % (they failed 4.5:1 already). It runs on `theme.css`, every
`.tpl` and the preview page.

**Layer (`psbuild/nuit.css`).** Redefines the tokens (ground `#0A0B0D`, text
`#EDE3D3`, muted `#A99B89`), puts noir text on every gold fill, and styles the
new home sections. The header floats over the hero on `body.index`.

### New home (`pages/index.tpl`)

| Partial | Section |
|---|---|
| `home-hero.tpl` | "Plus qu'un parfum, une émotion" over `nuit-hero.webp` |
| `home-categories.tpl` | Trouvez votre ODYS — the 4 catalogue families as photo circles |
| `home-signatures.tpl` | Collection signature — bottles on plinths over `nuit-arches.webp` (same `$signatures` contract) |
| `home-pyramid.tpl` | Pyramide de senteurs + "Composez votre ODYS" quiz panel |
| `home-values.tpl` | Reassurance bar — 300 DH delivery, COD, fidélité, WhatsApp |
| `quiz-dialog.tpl` | Native `<dialog>` quiz |

**Family links.** Circles link to `collection#fam-fresh|oriental|sweet|oud`;
`app.js` presses the matching `.ff` filter on load and on `hashchange`. The quiz
submits to the same URL with the chosen family. Without JS both are plain links.

### Identity — European Maison

- **Logo** (`header.tpl`): `ODYS` in Bodoni Moda over tracked `PARFUM`
  (`.odys-logo`). Font token `--font-logo`; Bodoni Moda is added to the Google
  Fonts request in `layout-full-width.tpl`.
- **Monogram + secondary lockup** (`footer.tpl`): `OD` (`.odys-mono`) and
  `ODYS PARFUM | EXTRAIT DE PARFUM` (`.odys-lockup`).
- **Flacon** (`_partials/odys-bottle.tpl`): square glass, amber extrait, black
  cap, gold collar, label set per product —
  `{include file='_partials/odys-bottle.tpl' num='01' name="L'Icône"}`.
  SVG, so the label stays sharp at any size.
- **Coffret** (`_partials/odys-box.tpl`): crème box, same params. The hero
  shows 01 L'Icône with its box; the signature trio draws 14 / 07 / 11 from
  `$signatures` (`num` + `name`).
- **Packshot photo** `img/odys-packshot.webp` (cropped from the identity
  board) is also `why-concentration.webp`. Replace both with a high-resolution
  studio shot when you have one — the board crop is 412×592.
- Catalogue product images still come from PrestaShop: upload the real
  packshots per product.

Images added (Unsplash License): `nuit-hero` (dunes at dusk), `nuit-strip`
(Chefchaouen), `nuit-arches` (Tinmel mosque), `nuit-riad` (Ben Youssef
courtyard), `note-frais|oriental|sucre|oud`, `pyr-tete|coeur|fond`. Added
for the diffuser ambiances: `ambiance-fleur-oranger` (a citrus blossom,
unsplash.com/photos/a-close-up-of-a-flower-on-a-tree-_DI00PJNc_4, Unsplash
License — free for commercial use, attribution not required).

### Parfums: Homme, Femme, Unisexe — and the olfactory family as a filter

A perfume is chosen for who it is for before anything else, so the three
genders are real sections under Parfums with addresses of their own
(`/parfums-homme`, `/parfums-femme`, `/parfums-unisexe`). A product carries
`"gender": "homme" | "femme" | "unisexe"` in `catalogue.json`; the importer
creates the sections, puts each perfume in its own **and** in Parfums, so the
full collection stays browsable, and publishes the ids as `ODYS_CAT_HOMME`,
`ODYS_CAT_FEMME`, `ODYS_CAT_UNISEXE`.

The **olfactory family stays a filter** inside each section rather than a
sub-category. With one Oriental per gender, a category per gender-and-family
would be a dozen pages holding a single bottle each. The family travels on the
card as `data-fam` (from `"family"` in the catalogue) and the buttons above the
grid narrow on it — a substring match, so `oud oriental` answers to both Oud
and Oriental. When a family grows enough to deserve its own page, it can be
promoted to a sub-category without touching a single product.

Two long-standing faults were fixed to make this work. The theme's listing
template lived at `catalog/listing.tpl`, a path PrestaShop never resolves, so
**every category page had been falling back to classic's markup** — no ODYS
header, no family filters. `catalog/listing/category.tpl` puts it back in the
route, and classic's sort control is included so nothing was lost in the
exchange. The pagination block read `$listing.pagination.total_pages`, a key
that does not exist; it is `should_be_displayed` / `pages_count`.

### Ambiances: a diffuser page coloured by its ingredient

A product may carry an **Ambiance** feature (`fleur-oranger`, `ambre`). The
layout copies it onto `<body data-ambiance>` and the stylesheet re-tints the
page around it — the wash behind the product, the price, the format card, the
pyramid. The header, the wordmark and the footer keep the house gold on
purpose: the shop has to stay one shop.

**From the Back Office** — Apparence → Thème ODYS → *Ambiances des diffuseurs*.
Six slots, each an identifier, a name, four colours and an optional
photograph. What is saved there wins over the palettes below, because the
theme prints it after its own stylesheet; the photograph is written to
`img/odys/`, which a rebuild does not touch. An ambiance is then attached to a
product in Catalogue → Produits → *Caractéristiques* → **Ambiance** — the same
tab as **Contenance**, which gives the format shown on the page and on the
add-to-cart button. A product with no ambiance keeps the house theme.

Adding a scent from the sources instead is two steps and no template change:

1. `"ambiance": "<slug>"` on the product in `catalogue.json`, then re-run
   `import_catalogue.php`.
2. A palette block in `theme-additions.css`:

   ```css
   body[data-ambiance="<slug>"]{
     --amb-deep:#080D09;   /* the page behind everything */
     --amb-wash:#16241A;   /* the glow under the product */
     --amb-accent:#EFE7D6; /* price, format card, title  */
     --amb-leaf:#7E9B6A;   /* notes and quiet labels     */
   }
   ```

Optionally drop `img/ambiance-<slug>.webp` in; the build writes the background
rule for every such file it finds, so a scent without a photograph keeps its
colour wash instead of requesting a file that does not exist.

Product photography follows the same idea: `img/<REFERENCE>.jpg` wins over
`img/cat-<famille>.jpg`, which wins over the packshot. Drop real photographs in
and re-run with `--refresh-images`.

The mockup's 500 MAD delivery / 600 MAD samples figures were **not** used —
the store's real 300 DH terms are kept everywhere. There is no FR | AR switch in
the header: hook PrestaShop's language selector on `displayNav2` for that.

## 2d. Legal pages and the CRM

### CMS pages (`legal/`)

Five pages written for ODYS, with the house's real terms — 20/30 DH delivery,
free from 300 DH, 24–48 h, cash on delivery, 14-day returns, oud excluded:

| File | Page | Friendly URL the footer expects |
|---|---|---|
| `legal/livraison.html` | Politique d'expédition et de livraison | `livraison` |
| `legal/retours.html` | Politique d'échange et de remboursement | `retours` |
| `legal/cgv.html` | Termes et conditions | `cgv` |
| `legal/confidentialite.html` | Politique de confidentialité | `confidentialite` |
| `legal/mentions-legales.html` | Mentions légales | `mentions-legales` |

Back Office → **Design → Pages → Add**, paste the file as page content, set the
friendly URL. `templates/cms/page.tpl` gives every CMS page its setting.

Blocks marked `[À COMPLÉTER]` (company registration, host, contact) render in a
gold-edged box on purpose, so they cannot ship unnoticed. **Have a lawyer read
these before publishing** — they are a sound starting point, not legal advice.

### `modules/odys_crm`

A self-hosted lead pipeline. Copy the folder into PrestaShop's `modules/`,
install it from the Module Manager, and it appears under **Clients → ODYS CRM**.

- Captures WhatsApp taps, add-to-cart, quiz answers and newsletter sign-ups
  into `PREFIX_odys_crm_lead`; repeat visits merge on a first-party
  `odys_vid` cookie and raise `hits`.
- Pipeline `Nouveau → Contacté → Commandé → Perdu`, notes per contact,
  CSV export. `actionValidateOrder` closes a customer's open leads.
- Anonymous events carry no personal data; an e-mail is stored only when
  someone submits it in a form. Uninstalling keeps the table.
- The capture endpoint is write-only, honeypotted, and capped at 40 writes per
  IP per hour.
### Verified on a real PrestaShop 8.2.8 + MySQL 8

`docker/docker-compose.yml` + `docker/verify.sh` stand up a throwaway shop and
check the theme and the module end to end: 26 automated assertions, all green
(theme active, image types intact, module installed, tab created, both hooks
registered, the ODYS home rendering, module assets loading, a live capture
written to MySQL, merge-on-second-event, honeypot, and contact / account / CMS
pages rendering).

**That run found six defects that no amount of front-end preview could show.**
All are fixed in this build:

| # | Defect | Effect before the fix |
|---|---|---|
| 1 | `theme.yml` had no `parent`, and the tree was missing 23 of the 32 files PrestaShop requires | `[ERROR] The selected theme "odys" is invalid` — the theme could never be enabled |
| 2 | `theme.yml` lacked `meta.available_layouts` and `theme_settings.default_layout` | same refusal |
| 3 | Image types had no `scope:` key | enabling wrote scope-less image types and the whole shop died with *There is no image type defined for "products"* |
| 4 | JSON-LD used raw `{ }`, which Smarty reads as its own delimiters | **every page** fatal: *Syntax error in template layout-full-width.tpl* |
| 5 | The home lived in `templates/pages/index.tpl` | PrestaShop renders the home from `templates/index.tpl`, so the shop showed classic's home, not ODYS |
| 6 | The layout hard-coded its own `<link>`/`<script>` and never rendered `$stylesheets` / `$javascript` / `$js_custom_vars` | no module could load CSS or JS, and `Media::addJsDef` never emitted — `window.odysCrm` was undefined, so the CRM captured nothing |
| 7 | `{hook h='displayHome'}` sat **inside** the `.pg` product grid | module sections (image slider, featured products) became ~1230px grid items and pushed the page 1500px sideways; they now render in their own `.home-modules` band |
| 8 | The home looped over `$featuredProducts`, which PrestaShop's home controller never assigns | PHP warnings printed into the grid (and a further ~1600px of overflow). The section is now guarded by `{if isset($featuredProducts) && $featuredProducts}`; featured products come from the `ps_featuredproducts` module in the band below, and assigning `$featuredProducts` from a module or controller override re-enables the ODYS section |

| 9 | The layout read `$category.link_rewrite` to detect the Oud page | on a product page PrestaShop passes a Category **object**, and reading it as an array is fatal: *Cannot use object of type Category as array*. **Every product page was a white screen.** The test is now behind `$page.page_name == 'category'` |
| 10 | The product page's buy button is `data-action="add-prod"`, which only fed the prototype's in-page cart | nothing ever reached PrestaShop; the shop could not take an order. It now goes through the same bridge as `add-to-cart` |
| 11 | `if (typeof prestashop !== 'undefined')` before `prestashop.on(...)` | once the layout renders `js_custom_vars`, a plain `prestashop` data object exists before core.js, so the guard passed and `.on` threw. Being top-level, that **aborted the rest of app.js** — quiz, family links and cart refresh all dead. Now `typeof prestashop.on === 'function'` |
| 12 | The header cart counter only changed on the next page load | classic's `theme.js` normally refreshes ps_shoppingcart, and this theme does not load classic's assets. The bridge now refreshes the widget itself (and tolerates a non-JSON cart reply, which used to swallow the event) |

### Catalogue

`catalogue.py` reads the 17 products out of the prototype — the only place the
line-up exists — into `catalogue.json` / `catalogue.csv`, and
`import_catalogue.php` loads them into PrestaShop:

```bash
php import_catalogue.php --root=/path/to/prestashop                 # create/update
php import_catalogue.php --root=/path/to/prestashop --remove-demo   # and drop the samples
```

6 perfumes (69–89 DH), 6 oud/boukhour priced per gram (15–65 DH/g), 3 oud
packs, 2 coffrets; categories Parfums / Oud & Boukhour / Coffrets / Flacons
Voyage; the scent family goes in as a "Famille olfactive" feature, which is
what the collection filters read. It matches on `reference`, so re-running
updates rather than duplicates — **edit `catalogue.csv` and re-run to correct
the prices, which are the prototype's, not a confirmed price list.** The same
script publishes the five legal pages as CMS pages.

**50 ml only.** The inherited product page offered 30 / 50 / 100 ml at
hard-coded prices when a product has no attribute combinations. It now shows a
single 50 ml option carrying the product's own price. To sell other sizes,
add real attribute combinations in PrestaShop — the loop above the fallback
renders whatever exists, so they come back automatically.

## The points system, tested with real accounts

Six accounts created through the registration form, and a probe
(`modules/odys_loyalty/tests/loyalty_probe.php`, run with `php … <id_customer>`)
that calls the award path the way PrestaShop does. What it found:

43. *The module was not installed at all.* It ships inside the theme, and the
    importer's `install()` call fatals from the CLI - PrestaShop's translation
    step needs the Symfony container - leaving a row in `ps_module` with no
    tables and no hooks. The points system looked present and did nothing. The
    importer now prints the console command instead of half-installing it:
    `php bin/console prestashop:module install odys_loyalty`.
44. *The same order credited twice.* Validating an order twice - a payment
    retry, a re-validation from the Back Office - wrote two rows for one
    order. Proven: +6 then +6 again. Now a credit is keyed on the order, with
    a `uniq_order_credit` index behind the guard, and `installDb()` adds that
    index (and removes existing duplicates) on a shop that already had the
    table.
45. *A free order earned points.* The rule read the line totals, so a 100 %
    voucher still paid 6 points on a 690 DH order. Eligible spend is now the
    lines, less the order's discounts, capped by what was actually paid,
    shipping excluded.
46. *Points before payment, and never taken back.* They were awarded at order
    *validation* - for a shop that is mostly cash on delivery, that is before
    any money exists - and nothing reversed them when an order was cancelled
    or refunded. They now move on `actionOrderStatusPostUpdate`: credited when
    the state is paid, taken back when it becomes cancelled, refunded or
    payment error, each exactly once.
47. *The welcome bonus was farmable.* +2 points for filling a form with no
    e-mail verification: three accounts from one IP minted six points in
    seconds, and eight reach the "5 g d'oud offert" tier. It is now credited
    with the customer's first paid order.
48. *Weight products relied on a reference prefix.* Oud escaped the exclusion
    if its reference were renamed and the category id unset. Anything with a
    `unity` (sold by the gram) is excluded now, whatever it is called.

That gap is closed: see **Spending the points** below.

`verify.sh` is now 112 checks, eight of them on the points rules.

## Product page: the mockup

The mockup listed eleven changes. Four of them — the header, the delivery
banner, the accordion and the footer — already looked like the drawing, so
they were left alone. Six were implemented, and four of those turned out to
be fixes rather than styling:

49. *The page invented an audience.* "12 personnes consultent" in the gallery
    and "10 personnes regardent ce parfum" in the info panel were both fed by
    `Math.random()` in `app.js`, re-rolled every 7–12 seconds. Invented social
    proof on a real shop; both are gone, and no template references the
    counters any more.

50. *The prototype's catalogue reached a real product page.* "Vous aimerez
    aussi" was filled by `initSuggestions()` from `SUGG_DB`: six Unsplash
    photos, prototype prices and `data-action="go"` links that went nowhere.
    Worse, it ran on `DOMContentLoaded` and overwrote whatever PrestaShop had
    rendered into `#suggTrack`. The page now shows the real accessories — four
    products with their own photos, prices and URLs — and both prototype
    renderers bail out when the node already has children.

51. *Nothing fed the recommendations.* `$accessories` was empty because no
    product had any, which is why the demo table filled the gap. The importer
    links every product to four siblings from its own family (perfume with
    perfume, oud with oud), 62 links across 17 products.

52. *The loyalty bar still promised points at registration* — that bonus moved
    to the first paid order when the points rules were hardened, so the copy
    was a promise the code no longer kept. It is one quiet card now, with the
    real rule and a link to the programme's own page.

The styling changes from the mockup: the two chips over the bottle and the
orange delivery bar (a copy of the announcement bar on every page) removed,
the format shown under the name, the four trust badges redrawn as line icons
in a 2×2 grid, and
PrestaShop's share buttons — which shipped as bare bullets reading "Partager
Tweet Pinterest" — masked into three glyphs. Sharing is the quietest thing on
the page: no circles, no rule above it, a 9 px label at half opacity and 13 px
marks that only take colour on hover. The tap target stays 28 px.

Not done, and deliberately: the mockup puts the price inside the add-to-cart
button. The prototype's `pickVol` and `pickGram` both rewrite that label, and
the quantity stepper would have to feed it too; the price already sits in
large type directly above the button.

Two of the mockup's ideas were tried and taken back out at the shop's
request: the pyramid in three columns, and the recommendations as a
four-column grid. Both are as they were — the pyramid stacked in rows with
its note chips, the recommendations a horizontal carousel of 160 px cards
with its arrows. Only what they contain changed: the carousel shows the real
accessories instead of the prototype's table.

`verify.sh` is now 113 checks, eleven of them on this page.

## Spending the points

The ledger only ever grew: earn on a paid order, reverse on a cancelled one,
and a welcome bonus. Nothing spent, nothing lapsed, and no Back Office screen
showed a balance — while the fidélité page promised "15 points : 5 g d'oud
offerts", "une seule récompense par commande" and "valables 12 mois". The code
now does what the page says, and nothing it does not.

**Spending.** `spend()` turns points into a real PrestaShop cart rule: the
customer's own, single use, not combinable with any other rule (which is the
page's one reward per order), valid three months. Two rewards, the two the
page names — 5 g of oud, priced as five grams of the least expensive oud, or a
coffret chosen from those actually in stock, given as a gift product. The
balance is read `FOR UPDATE` inside the transaction that spends it, so two
clicks cannot buy two rewards with one balance.

**Expiry.** A balance lapses twelve months after the last purchase — "un achat
remet le compteur à zéro pour l'ensemble de votre solde" — written off in one
row so the customer and the shop can both see it. PrestaShop has no scheduler,
so it runs on one front-office page in two hundred, and there is a button in
the Back Office for the impatient.

**Where people see it.** A "Mes points ODYS" card in the customer account
leads to a page with the balance, the expiry date, the two rewards and the
ledger. In the Back Office: Clients → Points ODYS lists every balance with its
tier and expiry, opens one customer's ledger, and lets an employee correct a
balance — bounded at 500 points, never below zero, and a reason is required,
because a correction with no reason cannot be told from a leak. The balance
also shows on the customer's own sheet.

### The ladder

The shop set the prices, so the flat 15-point reward became four:

| Points | Reward |
|-------:|--------|
| 10 | un parfum offert |
| 15 | deux parfums offerts — **ou** 5 g d'oud |
| 20 | un coffret offert |

Nothing is redeemable below 10, which is simply the cheapest rung
(`REWARD_MIN`), and the tiers stopped contradicting it: Argent is now 10 —
"you can redeem something" — Or 15, VIP 20. The cost moved out of a constant
and into the catalogue, so adding a rung is one line.

PrestaShop gives one gift product per cart rule, so "deux parfums offerts" is
the first perfume as a gift and the second as its own price off the cart: both
free, one voucher, and still not combinable with anything else. The customer
picks the products at redemption, from what is actually active and in stock —
and a pick is checked against the category the reward names, so asking for a
perfume and sending a coffret's id is refused.

The published rules were rewritten to match, because the page is the contract:
section 3 now lists the three rungs, says rewards open at 10 points, and adds
what was always true but never written — the voucher is nominative, single
use, three months, and not combinable with another promotion.

`spend_probe.php` covers the ladder in eleven steps: below the threshold,
each rung, two perfumes with only one choice sent, a perfume id that is really
a coffret, an unknown reward, expiry of a back-dated balance, expiry twice,
and spending after expiry. Vouchers with no matching deduction: zero.

`verify.sh` is 137 checks; nine of them read the ladder out of the module and
three more check the fidélité page states the same numbers.


Five defects were found by testing this, not by reading it:

56. *`Db::insert()` does not escape.* The hardening pass had removed the
    `pSQL()` from `addPoints()` on the assumption that it did. Every label with
    an apostrophe ended the SQL string early — "Échange — 5 g d'oud offerts"
    was a syntax error, and an employee's typed reason was an injection point.
    Escaped again, with a comment saying why.

57. *A failed redemption left a live voucher.* The cart rule was built before
    the transaction, so when the insert above blew up, the rule survived and
    the points did not move: two vouchers worth 75 DH each, nobody had paid for
    them. The voucher is created inside the transaction now, and a `catch`
    rolls back everything.

58. *`uniq_order_credit` rejected order-less rows.* `Db::insert()` writes 0 for
    a null, so a second welcome bonus, a second adjustment or a second
    redemption of the same size collided on `(id_customer, 0, points)`. Nulls
    stay null now, and the upgrade normalises the rows already written.

59. *`Product::getPriceStatic()` needs a cart or an employee in the context* and
    throws without either, so the oud reward could be priced from a browser but
    not from the CLI or a cron. The base price and the product's tax rate need
    neither.

60. *Vouchers were switched off shop-wide.* `PS_CART_RULE_FEATURE_ACTIVE` was 0,
    so a customer could have redeemed 15 points and received a code the cart
    would refuse. The importer sets it.

`spend_probe.php` exercises the whole thing against a throwaway customer and
puts it back as it found it: redeem at 15, refuse at 0, refuse an unknown
reward, refuse a coffret that is not in stock, redeem a coffret, expire a
back-dated balance, run expiry twice, and refuse to spend what has lapsed.
Eight steps, and a count of vouchers with no matching deduction — zero.

`verify.sh` is now 137 checks, seventeen of them on spending and expiry.

Still open, and yours to decide: the page promises "nous vous prévenons avant
toute expiration, à l'adresse e-mail de votre compte". Nothing sends that
e-mail, because nothing in this container can send e-mail at all
(`PS_MAIL_METHOD` is PHP mail with no MTA). Configure SMTP, then the warning
is a small cron away.

## The home hero: "L'art de l'essence"

The brief was written for a React project with GSAP. This theme is Smarty
templates, one stylesheet and one script, so the architecture is the theme's:
a partial, a block in `theme-additions.css`, a block in `motion.js`. Nothing
was installed, and no existing component was replaced — the hero keeps its
section, its class names, its headline and both of its calls to action.

What changed is what stands beside the words. The drawn packshot
(`odys-bottle.tpl` / `odys-box.tpl`) gave way to the campaign film supplied by
the shop: a piece of oud releases one thick amber drop into the flacon, a gold
wave crosses the liquid, the smoke settles, and the bottle is left as the hero.
Eight seconds — the brief asked for seven to nine — played once, then held on
its final frame. It never loops.

**The footage is a 21:9 band** (1470×630, 8.08 s), composed the way a hero is
composed: caption left, flacon centre-right, oud above. It runs full-bleed,
and the section's height follows the band's own ratio rather than the screen's
— forcing 21:9 into a 100svh box scales it by a third and the flacon comes out
oversized, which is exactly how the first attempt looked wrong. The ratio is a
floor, not a ceiling: where the words need more room the section grows and the
film trims a little more of its own top and bottom. On a phone the band
becomes a 4:3 crop at the top and the words sit under it on the page's black.

**The caption already in the footage.** The film carries its own
"Plus qu'un parfum, une émotion" on the left of the frame. Told twice, that
reads as a mistake. Rather than guess at a scrim, the frame was measured: the
caption runs from 6.5% to 29.4% of the width, and the flacon's highlights
start at 42.9%. The scrim is solid to 31% and gone by 44% — it lands in that
gap, so the caption is covered and the flacon keeps all of its light. The page
then says each sentence once, in real text: selectable, translatable,
crawlable, and present before a single byte of video is fetched.

**What it costs.** `preload="none"`: nothing of the 3.1 MB film is requested
until the hero is actually in view. Until then the poster stands in — 46 KB,
and it is the film's own last frame, so the hero is complete whether the film
plays or not. Blocked autoplay, a missing codec, reduced motion and no
JavaScript at all land on that same finished image.

Three defects came out of building it:

61. *The copy was hidden by CSS that only JavaScript could undo.* The intro
    fades the words in on a class the script adds; with JavaScript off, the
    headline and the call to action would never have appeared. The hiding now
    depends on `.has-js`, which the script sets before it hides anything.

62. *A phone put the call to action below the fold.* At 390×844 the film was
    tall enough to push "Découvrir la collection" to 831 px. The panel gives
    way on small screens; the button now ends at 782 px, above the fold.

63. *The words waited on the film.* Timed to the drop at 5.5 s, they left the
    shop's only call to action off screen for most of the intro — the brief
    asks for a late reveal, but it also says the animation must never stand
    between a visitor and the collection. They arrive at 2.4 s now, once the
    darkness has lifted, and immediately if `play()` is refused.

Interaction is deliberately small: the panel drifts about 5 px with the
pointer and the words about 2 px against it, rAF-throttled, and not at all on
a touch screen. Leaving the hero scales it to .978 and fades it a little.
Anything larger reads as a gadget rather than a campaign.

Of the five films supplied, this is the one that ships. Two of the others
carry a mock site header and a headline reading "L'ÉSFENCE", one carries a
"Created using AdCraft AI" watermark, and the two portrait cuts cannot fill a
landscape hero without losing either the oud at the top or the flacon at the
bottom. It ships as `assets/img/hero/odys-essence.mp4`; replacing it means
replacing that one file, re-capturing a poster from its last frame, and — if
the new footage is composed differently — re-measuring the caption gap the
scrim is fitted to.

Two collisions with the existing theme are worth remembering, because both
looked like the new CSS simply not working: the prototype already ships an
`.oud-hero` class for a different section, and `.nv-hero` already has a
`min-height` and a `::before` of its own further down the stylesheet. The hero
is `.odys-film-hero` now, and its box and scrim are written as
`.nv-hero.odys-film-hero` so they win on specificity rather than on order.

`verify.sh` is 149 checks, twelve of them on this hero.

## Le balayage avant lancement

Asked for before launch: find everything of the kind that had just been found
by hand. `docker/crawl.py` walks the shop from the home page — 200 pages, 619
links and images on this catalogue — and reports, per page: a status that is
not 200, a PHP warning printed into the HTML, "Array to string conversion", a
Smarty tag left in the output, an empty or "Array" href, an internal link that
fails, an image whose file is missing, a page with no title or no h1. Every
link and image is fetched once and traced back to the pages that point at it.
It exits non-zero, so it can gate a release.

The first run found **158 problems in four groups**, and every one was real:

75. *Every product without a photo printed warnings into its `<img src>`.*
    Three templates read `$product.cover.bySize…` unguarded; a product with no
    image has `cover = false`, and reading an offset off it emits a warning —
    inside the attribute. The three diffusers added that week had no photos, so
    the whole line was affected, category page included. All three now fall
    back to PrestaShop's own placeholder.

76. *Eight broken links between the legal pages.* They linked to `/retours`,
    `/cgv`, `/livraison`, `/confidentialite`; PrestaShop serves a CMS page at
    `/content/<id>-<slug>`, so each one 404'd. The importer rewrites them once
    every page exists, using the ids that shop actually assigned — 7 links
    repaired on this install.

77. *PrestaShop's own French route for the best-sellers page contains a
    space* — `meilleures ventes` — so every link to it was broken. The importer
    normalises any `url_rewrite` containing a space.

78. *The contact page had no `<h1>`.* Its only heading was an `<h3>`. Classic's
    `contact.tpl` empties `page_header_container`, which is the block that
    holds the title, so overriding `page_title` does nothing; the header is
    restored instead. The form is untouched.

The second pass reported **Rien à signaler** across the same 200 pages.

Beyond the crawler, because it only sees what a visitor sees: the eight
signed-in customer pages (account, orders, addresses, identity, rewards, cart,
checkout) answer 200 with no warnings; fourteen Back Office screens including
all four ODYS ones answer 200 with no fatals; 199 browser requests across
eleven pages returned 200 with an empty console. The only error class still
being logged is mail — the known SMTP gap.

**One sequencing note that matters on launch day.** These warnings are visible
because `PS_MODE_DEV` is on. Turn it off for production and they disappear from
the page, leaving the broken attribute behind and nothing to see. So the order
is: crawl with dev mode on, fix what it finds, *then* switch dev mode off.

`verify.sh` is 225 checks and now runs a 40-page crawl itself; the full pass is
`python docker/crawl.py`.

## Des avertissements PHP imprimés dans la page

Reported from the account page: a file path and a line number printed in the
middle of the card grid, with the wishlist card split open around it.

73. *`$urls.pages.wishlist` does not always exist.* It is supplied by the
    wishlist module, so on a page where it is missing PHP prints
    `Undefined array key` **inside the `href`**, which ends the attribute and
    spills the rest of the tag onto the page as text. The header and the
    footer already guarded it; the account page did not. It does now, and the
    card simply does not appear when there is no wishlist to link to.

74. *`$product.category_url` is an array.* The breadcrumb printed it straight
    into an `href`, so every product page carried
    `Warning: Array to string conversion` and a category link pointing at the
    word "Array". This had been live the whole time and nothing caught it —
    in production PHP hides the warning, so the symptom would have been a
    breadcrumb that silently goes nowhere. The link is built from
    `id_category_default` now, and falls back to plain text if even that is
    missing.

The second one was found by the check written for the first. `verify.sh` now
loads eight public pages and fails if any of them contains a compiled-template
path or an undefined-key warning — the whole class, not the two instances.

A note on why this is easy to miss: `PS_MODE_DEV` is on in this container, so
warnings are visible. With it off they vanish from the page and leave only the
broken attribute behind, which looks like a styling problem rather than a bug.

`verify.sh` is 224 checks, two of them scanning for this.

## Les champs de formulaire

Reported from use: the boxes you type into were hard to make out. They were —
transparent, with a 1 px border at 22 % opacity on a near-black page, which is
a line you have to look for. Worse, three different field styles appeared on
the registration page alone, because the theme had a `.form-control` rule, a
`body.registration input[type=text]` rule and a couple of one-off rules for
particular widgets.

One style now owns every field in the shop: a lifted surface (`#121319`) so
the box exists before it is focused, a 1 px border at 30 %, 46 px tall so a
thumb can hit it, a gold border and a soft ring on focus, a drawn caret on
selects (the native one is dark on dark), gold tick boxes at 18 px, readable
labels at 11 px instead of 10 px at 55 % opacity, and an autofill override —
without it the browser paints its own white-on-white over the field.

72. *The new style lost to the old one on specificity.* `body.registration
    input[type=text]` (0,0,2,1) beats `input[type=text]` (0,0,1,1) no matter
    which comes last in the file, so the fields stayed transparent after the
    first fix and only the height changed. The old block is gone rather than
    out-weighted; `verify.sh` fails if that selector ever returns, because its
    return would be silent.

A measurement note for later: reading `:focus` styles from the browser pane
says nothing — the pane does not give the element real focus, so the rule has
to be read out of the stylesheet instead of off the element.

`verify.sh` is 222 checks, seven of them on the fields.

## Le lancement : la liste, les liens, le message

Three pieces, none of which sends anything — the sending stays with the shop.

**`import_contacts.php`** loads an existing contact list into the CRM. It reads
French or English headers in any order, normalises Moroccan numbers
(`0612345678`, `+212 6 12 34 56 78`, `00212…` all become `212612345678`),
validates e-mails, drops duplicates inside the file and against the CRM, and
runs as a **dry run by default** — `--write` is deliberate. On a deliberately
messy test file of six rows it reported four to import, one in-file duplicate,
one unusable row with neither a valid number nor an e-mail, and named the line.

It also splits the list in two. A row counts as contactable only when a
consent column says so; the rest are imported — they are the shop's contacts
either way — but marked `consentement : non renseigné` and counted separately,
with a warning. Morocco's Law 09-08 and the CNDP make unsolicited commercial
messaging the shop's responsibility; the script only makes the distinction
impossible to miss.

**Four campaign links**, one per channel — `?c=lancement-wa`, `-sms`, `-mail`,
`-ig` — so the Back Office says which channel sold, rather than which felt
busy. No voucher attached: attribution first.

**`legal/annonce-lancement.md`** holds the message itself, per channel:
WhatsApp, SMS (158 characters, unaccented on purpose — an accent flips an SMS
to Unicode and cuts the limit to 70), e-mail with subject lines, and an
Instagram caption. Every version leads with the same sentence, because it is
the one that sells against COD: *vous ne payez rien à l'avance*. None promises
a discount, a deadline or a review the shop cannot back.

71. *A campaign without a discount could not be created.* `Db::insert` with
    `null_values` turned the empty code into NULL against a NOT NULL column.
    The Back Office test had used 10 %, so the path never ran until four
    discount-free launch links hit it at once. The two genuinely optional
    columns now say NULL for themselves.

`verify.sh` is 207 checks, nine of them on the launch.

### Le visuel, et le code qu'il porte

Three images in `launch/`, drawn on the shop's own material: the film's last
frame as the ground, Cormorant Garamond and Jost as the type — the same
typefaces the site loads, so the post and the page are recognisably one brand.
1080×1080 for the feed, 1080×1920 for stories and the WhatsApp status,
1200×628 for the e-mail header and link previews.

They were rendered to canvas at exact pixel sizes rather than screenshotted,
so no pane scaling touches them, and the layout is measured from the bottom
edge up — the first attempt anchored from the top and the headline landed on
top of the wordmark.

**The footage's own caption had to be cropped out again.** The 21:9 frame
carries "Plus qu'un parfum" at 6.5–29.4 % of its width; a square crop taken
from the centre leaves a fragment of it at the left edge. Each size now zooms
and anchors its crop past that band — the same measurement the hero scrim uses,
applied to a different shape.

**The code on the image is a real code.** `LANCEMENT15` — 15 %, one use per
customer, until 28/12/2026 — was created as a campaign before the artwork, so
the voucher exists in Catalogue → Réductions and the `lancement15` campaign
counts what the post brings back. `verify.sh` reads the code out of the
database, checks the discount is 15, that the rule is active and limited to one
use, that all three images ship, and that the written announcement quotes the
same code. A visual promising a code that does not work is the one failure
mode worth a test.

`verify.sh` is 215 checks, eight of them on the visual and its code.

## Ce que la boutique promet, et qui répond

Two changes that came out of reviewing the shop as a customer rather than as
a developer.

**A discount that was never given.** The announcement bar ran "Coffrets Duo
−10 % · Trio −20 %" on every page and the home page repeated it on the
category card. The arithmetic says otherwise: the Duo is 411 DH where the two
perfumes inside it cost 138–178 DH bought separately, the Trio 549 DH against
207–267 DH. That is not a discount, it is a 2.3–3× premium — advertised as a
saving. The claim is gone; the coffrets are described as what they are
("prêts à offrir"). **The prices themselves are a decision for the shop**: either
they come down to match the promise, or the coffret contains something the
page does not currently show. Until then no number on the site claims to be a
reduction it is not.

70. *The shop advertised a reduction it did not give.* Found by doing the
    arithmetic across two files that never referenced each other — the ticker
    and the price list. Nothing in the code could have caught it; the
    templates were internally consistent and the catalogue was internally
    consistent. `verify.sh` now fails if either string comes back.

**Reaching a human.** Cash on delivery means a stranger arrives at the door
asking for money, so "who am I buying from?" is asked *before* the order. The
theme now carries a WhatsApp and a phone link — as icons in the header, and as
a labelled row on the product page and in the cart, where the last doubt
happens. The product-page link opens WhatsApp with the product already named
("je souhaite des informations sur L'Or."), so the shop knows what the message
is about before reading it.

Both numbers live in Apparence → Thème ODYS (WhatsApp, Téléphone). Neither
set, nothing renders — no dead link, no empty icon, which is how the footer's
social icons already behave. The WhatsApp number is stored as digits only and
the displayed phone keeps its spacing while `tel:` strips them.

`verify.sh` is 198 checks, six of them on these two.

## Le prix au gramme

**It was already in the Back Office, and always has been.** Oud and boukhour
are sold by weight, so the product's own price *is* the price per gram:
Catalogue → Produits → a oud → Prix. Boukhour Prestige is 15 DH there, the
page says "15 DH le gramme", and the 5 g card costs 75 DH — one number, one
place, no second copy to keep in step. `unity` is set to `g`, which is what
makes PrestaShop label it per gram.

What was *not* editable is the ladder: 5, 10, 25, 50 g and the 5 g minimum
were written into the template and the script. Both are settings now, on the
Thème ODYS screen, and both fall back to the shipped values when empty.

The ladder is validated rather than merely stripped, because it ends up as
prices: `25, 3 , 12, abc, 25, 9999, 100` was stored as `3,12,25,100` — the
word dropped, the duplicate removed, 9999 refused as beyond 1000 g, and the
rest sorted. The page then priced them off the product's rate: 3 g at 45 DH,
12 g at 180 DH.

69. *The minimum was emitted twice and agreed by luck.* The markup wrote
    `data-min="0"` when the setting was empty and the script only recovered
    because `parseInt(0) || 5` falls through to 5. It is resolved once in the
    template now and both the label and the stepper read that.

`verify.sh` is 192 checks, seven of them on the gram rate and the ladder.

## Campagnes réseaux sociaux

**Clients → Campagnes ODYS.** Create a campaign, get a link and — if you asked
for a discount — a code. Post them on Instagram, TikTok, WhatsApp. The table
then shows what came back: clicks, orders, revenue and the conversion rate,
per post and per channel.

How it works, in three moves. The link carries `?c=<slug>`; opening it counts
a click and leaves a cookie for thirty days. A validated order reads that
cookie and is credited to the campaign, once — the order id is the primary key
of the attribution table, so a replayed hook changes nothing. Asking for a
discount creates an ordinary PrestaShop cart rule, which means it appears
under Catalogue → Réductions like every other voucher and can be revoked
there; "Arrêter" switches off the campaign and its voucher together.

The slug comes out of a URL, so it is whatever anyone cares to type: it is
reduced to letters, digits and dashes before it touches the database, and a
slug that matches nothing is ignored in silence rather than created. A probe
covered the five cases — attributed once, replayed hook ignored, second order
counted, unknown campaign ignored, and `story-oud' OR 1=1 --` harmless.

**There is deliberately no Instagram or TikTok API here.** Publishing to those
platforms needs a business account, an app review and tokens that expire; what
a shop this size needs is to know which post sold what, and that is a link and
a cookie. If you later want posts scheduled from the Back Office, that is a
separate piece of work with real API credentials behind it.

68. *`renderList()` cannot be private either.* The same visibility clash as
    #64, in a new controller — `AdminController` declares it public, so the
    screen was a 500 before it ever rendered. Worth remembering: any method
    named like one of `AdminController`'s must match its visibility.

`verify.sh` is 185 checks, eight of them on campaigns.

## Diffuseurs

A fourth line, beside Parfums, Oud & Boukhour and Coffrets: a category, a
place in the header, the mobile menu and the footer, and three products.

The catalogue is generated from the prototype, which never drew diffusers, so
this line is written in `catalogue.py` rather than scraped — the references
and the wording are the house's own. **The three prices are provisional**
(249 / 179 / 159 DH), exactly like the rest of that file, and are meant to be
confirmed in Back Office before the line goes on sale. Editing them there is
enough; re-running the importer will not overwrite a price that has been set,
it updates the products it already created.

Nothing special was needed for the points programme: a diffuser has no
`unity`, is not oud or boukhour, and is not in an excluded category, so it
earns a point per 100 DH like a perfume. The recommendations carousel treats
it as its own family — a diffuser suggests diffusers — which the importer
now covers by looping over four categories instead of three.

67. *Every product image called itself an extrait de parfum.* The miniature's
    alt text ended "— extrait de parfum, Maroc" for whatever it was showing,
    which a diffuser made obvious. It reads "— ODYS Parfums, Maroc" now.

`verify.sh` is 177 checks, six of them on this line.

## Editing the shop without a rebuild

Two screens now, both from `odys_loyalty`:

* **Clients → Points ODYS** — balances, one customer's ledger, manual
  corrections, the expiry button.
* **Apparence → Thème ODYS** — the words on the home page. The hero's
  accroche, both lines of the headline, the text under it and the label on
  the button; the announcement ticker, one message per line. Every field
  falls back to what the template shipped with, so an empty setting is never
  an empty page — emptying all six restores the original copy exactly.

Settings are typed by an employee and printed into a page, so they are
stripped of markup on the way in (`<script>alert(1)</script>une émotion rare`
stores as `alert(1)une émotion rare`), cut to length, and escaped again on the
way out. `Configuration::updateValue()` parameterises its own query, so no
`pSQL()` — it would only mangle the apostrophes French copy is full of.

**The olfactory pyramid was already editable** and stays where PrestaShop puts
it: Catalogue → Produits → a perfume → Caractéristiques → Notes de tête, Notes
de cœur, Notes de fond, comma separated. The three features exist with six
values each; an employee can pick one or type their own. The theme screen
explains exactly that, because it is the question the screen will be asked.

What the screen adds is the mapping: which three features the pyramid reads,
by id. The templates matched on the feature *name*, so renaming one in the
catalogue would have emptied the block with nothing to explain it. Set the
three ids and a rename is harmless; leave them at "par nom" and the original
behaviour is unchanged. Both paths were checked live — three tiers render
either way.

Three things broke while building it, all caught by opening the screen:

64. *`renderForm()` cannot be private.* `AdminController` declares it public
    and PHP will not narrow a parent's visibility: a fatal, 500, on the tab.

65. *`displayConfirmation()` belongs to `Module`, not to `AdminController`.*
    The settings saved and then the page died on the success banner — the
    worst kind of 500, because the work was done and the screen said nothing.

66. *A new tab never appeared on an existing shop.* The upgrade script asked
    "does the loyalty tab exist?" and skipped the whole step, so the second
    tab was never created. `installTab()` skips per tab now and the script
    simply calls it.

The screen grew to cover the rest of the words a shop actually changes: the
home page's collections block (accroche, titre, sous-titre), the footer's
paragraph, and the four services on the product sheet. All behave the same
way — empty means the shipped wording, never an empty line.

**The hero film is replaceable from the Back Office.** The film and its poster
upload to `img/odys/`, PrestaShop's own writable image folder, and not into
the theme, whose assets the next build overwrites. The file is judged on its
content (`finfo`), not on the name or the content type the browser claims: a
text file renamed `.mp4` and sent as `video/mp4` is refused as `text/plain`.
The stored name is ours and carries a timestamp, so no cache keeps serving
yesterday's film, and replacing one deletes the file it replaces — only if the
name matches the pattern this screen writes, so nothing else in that folder is
ever touched. 12 MB for the film, 3 MB for the poster.

Proved end to end: uploading `video (7).mp4` put the home page on
`/img/odys/hero-1790510325.mp4` (3.2 MB, 200), and clearing the setting put it
straight back on the theme's own copy.

`verify.sh` is 171 checks, twenty-one of them on these screens.

## Back office

Every Back Office screen was opened as a signed-in employee: catalogue,
categories, orders, customers, modules, themes, CMS pages, positions. All
200, no exception. Three things were broken, all three on the shop's own
modules:

53. *Configure on odys_crm answered 500.* The module registers an admin tab,
    so the module manager offers a Configure button, and PrestaShop's legacy
    handler calls `getContent()` — which the module did not have:
    "Method of module cannot be found". It has one now, and it redirects to
    the CRM screen, which is where the module's own page lives.

54. *The odys_loyalty settings form never saved.* `HelperForm` was given no
    `submit_action`, so its button was named `submitAddconfiguration`, while
    `getContent()` waited for `submit_odys_loyalty`. Pressing **Enregistrer**
    reported nothing and changed nothing. The helper now carries its module,
    token, currentIndex and submit action, and a save was proved end to end.

55. *A setting the shop reads could not be set.* The footer prints
    `ODYS_FACEBOOK`; no field existed for it, so the Facebook icon could never
    appear. Added.

Two more came out of testing the form rather than reading it. Values were run
through `pSQL()` — which escapes for SQL that `Configuration::updateValue()`
already parameterises, and validates nothing: a URL printed straight into an
`href` was accepted as `javascript:...`. Each key is checked for what it is
now: ids are ints, the WhatsApp number is digits, the address is an address,
and a link is an absolute http(s) URL or nothing. And the save loop wrote
*every* key on every post, so a request that carried one field blanked the
rest — it skips keys the request does not carry.

Two things the container cannot show and production must have: mail is
unconfigured (`PS_MAIL_METHOD` is PHP mail with no MTA, and the log holds
eight "Swift Error: Expected response code 220" entries — no order
confirmation can leave the shop), and `PS_SSL_ENABLED` is 0.

`verify.sh` is now 119 checks, six of them signing in to the Back Office.

## Choosing the home signatures

The "Collection signature" band showed three hard-coded flacons, so changing
them meant editing `home-signatures.tpl`. Three settings hold product ids now
— `ODYS_SIG_1..3`, picked from a product list in **Modules → ODYS Loyalty →
Configurer** — and that module assigns `$signatures`, which the template
already preferred over its defaults. Empty a slot and the band shows fewer
bottles; empty all three and the house trio returns.

Position still decides the look: slot 1 is noir & or / Prestige, slot 2 marine
/ Élégant, slot 3 crème / Classique, whichever products are chosen. The line
under each flacon comes from the product's *Famille olfactive* feature, mapped
to the phrases the band used (`fresh` → « Frais & lumineux », `oud oriental` →
« Intense & sophistiqué »…), falling back to the short description.

42. *odys_loyalty was never installed.* It ships inside the theme, which is
    not the same as being a module PrestaShop knows — so the settings page
    that holds the WhatsApp number, the socials and now the signature slots
    did not exist. The importer copies it into `modules/` and installs it,
    then registers the hook that feeds the home page.

`verify.sh` is now 94 checks.

## Olfactory pyramids

The product page always had a pyramid block; nothing ever filled it, because
the importer only wrote the *Famille olfactive* feature. The prototype's
`PARFUMS_DB` carries a full tête / cœur / fond for each of the six perfumes,
so `catalogue.py` now reads it into three new catalogue columns
(`notes_tete`, `notes_coeur`, `notes_fond`) and the importer writes them as
three PrestaShop features — 18 rows, three per perfume. Edit the columns in
`catalogue.csv` and re-run the importer to change a pyramid; the notes of a
tier are comma-separated.

Two fixes came with it:

39. *The note chips lied.* Their label said "Rechercher les parfums avec la
    note X" and a click only toggled a class — the prototype filtered an
    in-page list that does not exist on a real shop. They are links to the
    shop's search now (`/recherche?s=Bergamote` returns 3 products; features
    are indexed, `PS_SEARCH_WEIGHT_FEATURE` is 2), which also makes them
    keyboard- and middle-click-friendly with no JavaScript.
40. *An empty pyramid on oud and coffrets.* The block was shown whenever the
    product had any feature at all, and oud has a family: the heading
    rendered with nothing under it. It now requires a tier.

The panel itself was three unstyled rows; it now has a fixed label column so
the notes line up, chips with room to breathe, and a gradient that fades as
the notes get deeper. One column on a phone.

41. *The tier marks were emoji* - a grey puff, a pink blossom, a green fir,
    drawn by the system font in its own colours, and the label cells still
    carried the cream gradient of the light theme. They are inline SVG in
    `currentColor` now, so each tier takes a colour from the palette:
    champagne at the tête, sand at the cœur, deep gold at the fond - the
    same descent as the panel's gradient - inside a hairline circle.

`verify.sh` is now 89 checks.

## Mobile and polish pass

34. *The hamburger did nothing* - on a phone that is the entire navigation.
    `toggleMenu()` existed and pointed at the right ids, but the button
    carried no `data-action`, so the theme's click delegation never called
    it. It has one now, and the panel got what a thing with `aria-modal`
    owes its user: `aria-expanded`/`aria-hidden` kept in step, a page that
    cannot scroll behind it, focus moved into it, a close button, and exits
    on Escape, on a tap outside and on following a link. The sync is a
    MutationObserver rather than a second click handler - the first attempt
    handled the same click as app.js and the two toggles cancelled out.
35. *The cart drawer could only ever be wrong* - it is the prototype's
    client-side cart, and PrestaShop owns the real one: it sat in every page
    saying "Votre panier est vide" while the header counter said 11, and
    nothing opened it since the theme's cart icon was replaced by
    PrestaShop's widget. Removed. Adding to the cart now confirms itself
    where the thumb is - a toast naming the product (and the grammage for
    oud) with a link to the real cart.
36. *Gallery badges overflowed a phone* - absolutely positioned over the
    image with a whole sentence in the inspiration badge, they ran 28px past
    the viewport and were clipped. Below the image, wrapped, on small
    screens.
37. *The 404 was a dead end* - PrestaShop's page printed "Aucun produit
    disponible pour le moment" under the error, because classic renders an
    empty product listing there. The theme has its own `errors/not-found.tpl`
    with a search field and the main pages. It is a *fragment*: extending the
    layout rendered the header and the announcement bar a second time.
38. *Footer and nav links were 26px tall on a phone* - padded to 36px, menu
    rows to 48px.

Checked and already right: no horizontal overflow at 375px on any page, the
hero image is eager with `fetchpriority=high` and dimensions while the rest
are lazy with dimensions (no layout shift), the quiz dialog fits the phone,
and the marquee already stops under `prefers-reduced-motion`.

`verify.sh` is now 78 checks.

## Security pass

**Input sanitising.** Everything a visitor can send now goes through one
place, `OdysCrmGuard` (module classes), and nothing else writes visitor data:
`source` and `stage` are matched against fixed lists, `name`/`subject` lose
their tags and control characters, `email` must pass `Validate::isEmail()`,
a `phone` must look like a number as a whole (filtering characters out turned
`0612345678' OR '1'='1` into a plausible `0612345678 11`), `visitor` is
`[a-z0-9]`, `page` must be a path on this shop - `javascript:`, `//host` and
`..` are dropped - and `payload` is re-encoded from decoded scalars, so what
is stored is our JSON, not the caller's. The search field is escaped on
output and now carries `required minlength=2 maxlength=64`; the search icon,
which was a button with no panel and no handler, links to the search page.

**Rate limiting.** `ps_odys_crm_rate` counts requests per hour in three
buckets - 40 per IP, 20 per visitor, 600 overall - with one atomic UPSERT per
request, and answers `429`. It replaces a counter that counted *rows in the
lead table*: leads deduplicate, so a bot reusing one visitor id updated a
single row for ever and never tripped the limit. The endpoint also refuses a
non-POST (`405`), a body over 16 KB (`413`), malformed JSON (`400`) and input
that validates to nothing (`422`).

**No credentials in code.** `docker-compose.yml` reads every value from the
environment (`${MYSQL_PASSWORD:?...}` - a missing variable fails the run
rather than falling back to a shipped default), `docker/.env.example` is the
template, `.env` is git-ignored and excluded from the zip, and `verify.sh`
passes the password to the container through `MYSQL_PWD` instead of a command
line other processes can read. `pack.py` greps every shipped file for
credential-looking literals and refuses to build the zip if it finds one.

**SQL.** PrestaShop's DB layer has no prepared statements, so the rule is:
every value reaches a query as an `(int)`/`(float)` cast or through `pSQL()`,
and `ObjectModel` escapes each field on the way into the INSERT/UPDATE. A live
check posts `x'; DROP TABLE ps_odys_crm_lead; --` in every field and asserts
the table is still there and the row stored the string inert.

**Validation on both sides.** `crm.js` applies the same rules before sending -
immediate feedback through `setCustomValidity`, no wasted requests - and the
server re-validates everything, because the endpoint is open to anything that
can make an HTTP request. One bug this pass introduced and the tests caught:
`Db::getValue()` appends its own `LIMIT 1`, so the one I added made
`LIMIT 1 LIMIT 1` and 500'd every capture; the stub now fails any query that
carries a LIMIT.

`verify.sh` is now 70 checks, 10 of them security.

**Defects found on the running shop (round three).** A crawl of every page
type, checking links, PHP messages and layout.

23. *Five dead links in the nav and footer* - `/a-propos` (in the main nav),
    `/savoir-faire`, `/fidelite`, `/parfums-frais`, `/parfums-orientaux`. The
    first three are now CMS pages the importer publishes (`legal/a-propos.html`,
    `savoir-faire.html`, `fidelite.html`); the last two were never categories,
    so they carry the theme's own `#fam-` filter on the Parfums listing.
24. *`$urls.pages.category` 404s* - it is PrestaShop's id-less category
    controller, and 17 links used it (the Collection nav, every hero CTA, the
    cart drawer, the quiz form). They all use `$odysUrlParfums` now, whose
    fallback is the home page rather than a dead link.
25. *`{hook h='displayProductAdditionalInfo'}` was called without the product*,
    so ps_emailalerts warned three times on every product page.
26. *Empty `href=""` on three social buttons and the WhatsApp button* -
    `Configuration::get()` returns **false** for a key that was never set and
    Smarty's `|default` only catches null/''. Each renders only once the shop
    sets it (`ODYS_INSTAGRAM`, `ODYS_FACEBOOK`, `ODYS_TIKTOK`, `ODYS_WA_NUMBER`
    in the odys_loyalty settings); the CMS pages fall back to the contact page.
27. *Undefined Smarty keys on the account pages* - PrestaShop 8 calls the
    recovery page `password`, not `password_recovery`; `$back` exists only on a
    redirect; there is no wishlist module, so those links pointed at "".
28. *Two PHP warnings printed inside the cart summary* - `vouchers` is absent
    until a voucher exists and `shipping` is null until an address is picked.
    The long file paths in the warnings also pushed the page 455px wide.
29. *Classic's Bootstrap 4 alpha utilities had no rules* - so every `hide` /
    `hidden-*-up` element showed: a stray "Filtres actifs", both newsletter
    submit buttons, and the sort dropdown printed all of its options as a list.
    The utilities and the listing chrome (count, sort, pagination) are styled;
    the dropdown opens on `.open`/`.show` *and* `:focus-within`, so it works
    without PrestaShop's JS.
30. *The inherited pages ran edge to edge* - the theme's sections carry their
    own gutter, classic's markup expects `.container`. Category, search,
    brands, sitemap, 404, checkout and account pages get it now.
31. *The checkout was unstyled* - the one page that must not be. Steps, form
    fields, radios, tabs, buttons, the summary column, order tables and alerts
    are all dressed in the theme, written against classic's classes so login,
    contact, addresses and order history get them too.
32. *blockreassurance showed demo text at checkout* - "Security policy (edit
    with the Customer Reassurance module)" in black on black, with icons whose
    src starts `//modules/...` (no host) so all three 404'd. Unhooked; the
    theme has its own reassurance band and the hook call stays for a shop that
    configures the module.
33. *Every page was titled "PrestaShop"* - the shop name was never set. The
    importer sets it to ODYS Parfums (it also signs the e-mails), and the
    layout stops appending the brand when the title already is the shop name.

`verify.sh` is now 60 checks.

**Defects found on the running shop (round two).**

16. *PrestaShop's demo content sat on the home page* - Lorem slides labelled
    "Sample 1", a "20% OFF ON CLOTHES" banner, a custom text block and
    product rails. The importer unhooks the eight modules that ship them
    from `displayHome` (unhooked, not uninstalled).
17. *The newsletter rendered raw below `</footer>`* - `displayFooterBefore`
    was called after the footer include, and classic's markup relies on
    Bootstrap 4 alpha classes this theme never had, so both submit buttons
    showed. Moved above the footer and styled.
18. *Material Icons glyphs showed as empty boxes* - classic uses that webfont,
    the theme ships none. `.material-icons{display:none}`; the theme marks
    its own icons in SVG.
19. *`{if $product.nb_comments > 0}` was true on every product* - PrestaShop's
    LazyArray hands back a truthy object for a key it does not hold, and an
    object compares greater than 0. Every such test now starts with `isset()`.
20. *The product page shipped raw Smarty to Google* - the whole JSON-LD block
    sat inside `{literal}`, so `"name":"{$product.name}"` went out verbatim.
    Each interpolation now breaks out of the literal and back in, values are
    decoded with `unescape:'html' ... nofilter` (PrestaShop re-escapes
    otherwise) and only `"` and `\` are neutralised, which is all JSON needs.
21. *A 4.9 rating with zero reviews* - in `itemprop` markup and JSON-LD, on a
    shop with no customers. It renders only when real comments exist, and the
    announcement bar no longer claims "1 284 clients".
22. *One throwing listener stopped the cart widget refreshing* - the bridge
    emitted `updateCart` before refreshing, and PrestaShop's own
    productcomments JS throws on every product page here (the theme renders
    none of its templates, so its variables are undefined). The emit is in a
    try/catch and the importer disables that module.

**Oud & Boukhour by the gram.** The importer already set `unity = 'g'` and a
5 g minimum; the pages now say so. A weight product shows gram cards
(5 / 10 / 25 / 50 g) that set the quantity - 25 g is 25 units of a product
priced per gram - a "35 DH le gramme - minimum 5 g" line, a cart button that
names the grammage, and cards that price "35 DH / g" and link to the page
instead of adding one gram. Perfumes keep their 50 ml selector. Nothing
hard-codes which products are which: it all hangs off `$product.unity`.

`verify.sh` is now 45 checks.

**No Flacons Voyage.** With a single size the travel line was the Parfums
page again, so the page is gone: `_patch_no_flacons.py` drops the nav, footer
and mobile-menu entries, the layout's `$odysUrlFlacons` lookup and the
category the importer used to create - the importer now *deletes* a
`flacons-voyage` category an earlier run left behind, unless products still
sit in it, and clears `ODYS_CAT_FLACONS`. `strip_flacons.py` cuts the page's
JS (9.3 KB: `FLACONS_DB`, `flPickFrag`, the `fl-*` handlers) and CSS out of
`app.js` and `theme.css` at build time, cleans the loyalty module's
"Flacons excluded from points" rule and its admin field, and removes the
README rows. `_patch_no_flacons_proto.py` does the prototype. Each script
asserts nothing references the page afterwards, and `strip_flacons.py` has a
self-check (`python psbuild/strip_flacons.py`).

Two follow-ons: the home category strip was `2fr 1fr 1fr` for three cards and
is now `2fr 1fr`, and `verify.sh` gained three checks (no link on the home
page, category gone from the database, no flacons code in app.js) - 31 in all.
Deleting the category from the CLI prints a PrestaShop warning
(`controller_type on null` in Category.php); it is PrestaShop reaching for a
front controller that does not exist outside a request, and the delete goes
through anyway.

The standalone prototype (`odys-preview-v5.0.html`) got the same treatment
in `_patch_vol_proto.py`: the product and Flacons Voyage pickers keep only
the 50 ml card, the *Formats Découverte* ladder (5 / 20 / 50 / 100 ml) is
gone — it existed only to advertise the other sizes — and the copy that
named a size now says 50 ml. The script asserts no other `\d+ ml` survives
anywhere in the file, so re-running it is the check.

**Currency.** The importer creates **MAD** with the symbol `DH`, makes it the
shop default, deactivates any other currency (otherwise PrestaShop shows a
switcher and sessions keep their old currency) and sets Morocco as the default
country. Without this a shop installed for another country prices everything
in euros.

Two more defects surfaced here:

| # | Defect | Effect |
|---|---|---|
| 13 | The theme hard-coded `/oud-boukhour`, `/coffrets`, `/cgv`… | PrestaShop requires the id in category and CMS URLs, so every one of those links was a 404. The importer records the ids (`ODYS_CAT_*`, `ODYS_CMS_*`) and the layout resolves real URLs through `$link`, falling back to the plain path for the standalone preview |
| 15 | Category pages come from classic's listing templates, which drop the ODYS cards into a Bootstrap `.products.row` | with no grid the cards stacked full width, one per row. `.products` now gets the same grid as `.pg` (4 / 3 / 2 / 1 columns), and classic's sort and pagination chrome is set in the house type |
| 14 | *(in the importer)* `new Product($id, false, $idLang)` | with an id_lang the language fields are strings, so `$product->name[$idLang] = …` wrote a **string offset**: "L'Icône" was stored as "LLIcône". Dropping the argument fixed the names and the URL slugs |

### Header: PrestaShop owns account and cart

The theme's own account and cart icons were removed from `header.tpl`:
`ps_customersignin` and `ps_shoppingcart` render into `displayNav2` and carry
the real session, cart and totals. They are restyled in the house type, and
their Material Icons glyphs (that font is not loaded here, so they printed the
word "shopping_cart") are replaced with gold line marks.

Defects 1–3 came from the v3.1 theme this build inherits; 4–12 were introduced
by the rewritten templates. 7 and 8 were invisible in every static preview
because neither renders PrestaShop modules or controller variables. Note for future edits: PrestaShop caches compiled
Smarty templates, so clear `var/cache/prod` (or set `PS_SMARTY_FORCE_COMPILE`)
before judging a template change — a stale page hid several of these.

- **Also tested** with PHP 8.3 and 8.5 against a stubbed PrestaShop core
  (`modules/odys_crm/tests/`, see its README): honeypot, rate limit, malformed
  JSON, dedupe, sanitising, the order hook, the JS definition and the Back
  Office controller. That run caught a real defect — a new lead wrote NULL into
  NOT NULL columns, which a strict-mode MySQL rejects, so nothing would have
  saved; `OdysCrmLead::__construct()` now seeds the defaults.
- Still **never run against a real PrestaShop + MySQL**: install, tab creation,
  the list/filter/export screens and the live SQL remain unverified. Install on
  a staging copy first.

---

## 3. Storefront bugs fixed in `app.js`

These were live in v3.1 and are corrected in this build:

| Bug | Effect before |
|---|---|
| `getElementById('dTot')` — the element is `#dTotal` | Cart total permanently "0 DH", and the write threw |
| `getElementById('dsF' / 'dsV' / 'dsM')` — elements are `#dsFill` / `#dsVal` / `#dsMsg` | Free-shipping progress bar never moved off 0% |
| Fallback `prestashop` stub had no `on()` | `prestashop.on('updateCart', …)` threw and aborted the rest of the storefront IIFE |
| A second click-delegation calling bare `addToCart` / `chgItem` / `removeItem` / `go` | ReferenceError on every add, quantity change and remove |
| `getElementById('loader')` unguarded | TypeError on any page without a loader element |
| One `id="annTrack"` shared by several tickers | Only the first marquee was doubled; the others jumped mid-loop |

The ticker now keys off `.ann-track`, so `announcement-bar.tpl` lists its
items once and the script duplicates them for the `-50%` loop.

## 3b. Markup that referenced nothing

Several v3.1 templates emitted class names that existed in neither
`theme.css` nor `app.js`, so they rendered unstyled or inert:

| Template | Symptom |
|---|---|
| `cart-drawer.tpl` | Used `.cart-drawer` / `.cd-*` / `#cartItems` / `#cartTotal` / `#cartShipFill`. CSS implements `.drawer` / `.d-*` / `.ds-*` and `app.js` writes to `#dItems` / `#dTotal` / `#dsFill`. The panel had **no styles at all** — it sat in the page flow above the content — and the script's totals went nowhere. Rewritten onto the vocabulary both already implement, keeping v3.1's richer ARIA and its cross-sell / trust sections. |
| `header.tpl` | `.odys-nav` had no rule. Now bound in layer 4. |
| `footer.tpl` | `.site-footer`, `.footer-grid`, `.footer-col`, `.social-btn` had no rules. Now bound. |
| `index.tpl` | `.cat-card`, `.cat-ic`, `.cat-lbl`, `.why-card`, `.why-icon`, `.hero-h`, `.hero-eyebrow`, `.hero-btns`, `.hero-proof` had no rules. Now bound. |
| `listing.tpl` | `.fam-filters`, `.ff`, `.pg-btn`, `.sec-see-all` had no rules. Now bound. |

### Also corrected

- **`layout-full-width.tpl`** carried `<meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'">`. Browsers **ignore** `frame-ancestors` delivered in a meta tag — it gave zero clickjacking protection while looking like it did. Removed, with the correct server-header form documented inline. Set it in `.htaccess`:
  ```apache
  Header always set Content-Security-Policy "frame-ancestors 'none'"
  Header always set X-Frame-Options "DENY"
  ```
- **Nav breakpoint.** The bar carries a wordmark, five links and five icons; it overflowed a 768 px tablet by ~280 px. It now collapses to the burger at 960 px.

### Added
A small progressive-enhancement module: `#header.stuck` on scroll, and an
IntersectionObserver that adds `.in` to `.reveal` sections. It respects
`prefers-reduced-motion` and the page is fully functional without it.

---

## 4. Images

Product photography is the one thing this build cannot supply. The catalogue
still needs ODYS's own bottle shots:

- The v3.1/v4 stock imagery showed **competitor bottles** (Chanel Coco,
  Coco Noir, Gabrielle, Miu Miu, Versace Eros) plus off-subject shots. Do not
  ship those as ODYS product images.
- `assets/img/hero.webp`, `flacon-signature.webp` and `oud-hero.webp` are WebP stock
  photos under the Unsplash License (free commercial use, no attribution
  required), checked for competitor branding. Replace them with ODYS
  photography by overwriting the files — same names, no template edits.
- Recommended crops: hero `4:5`, signature `3:4`, product grid `1:1`
  (`home_default` 400×400), product page `1:1` (`large_default` 800×800).
- Shoot on champagne or cream, or on deep black/marine for the Noir and
  Marine signatures. Never a pure-white ecommerce box — the CSS already
  rewrites bordered `background:#fff` panels to cream for this reason.

---

## 5. Install

```bash
# copy the theme into your PrestaShop root
cp -r themes/odys /path/to/prestashop/themes/

# then in Back Office
#   Design → Theme & Logo → select "ODYS Parfums Theme" 5.0.0
#   Advanced Parameters → Performance → clear cache
```

Configuration keys read by the templates (Back Office → Shop Parameters):
`ODYS_WA_NUMBER`, `ODYS_INSTAGRAM`, `ODYS_FACEBOOK`, `ODYS_TIKTOK`.

---

## 6. Verified

Checked on the matching standalone prototype (`preview/index.html`) at
375 / 768 / 1440 px:

- no console errors
- no horizontal overflow on any page (checked on `body.scrollWidth`)
- every image has `alt`, every icon-only button has an accessible name
- visible focus rings, 44 px touch targets, `prefers-reduced-motion` honoured
- one palette across every page; no stray blue, purple, pink or neon

---

## 7. Rebuilding

The theme is generated, not hand-edited, so the transformation is repeatable
against a newer v3.x tree:

```
psbuild/build_theme.py        v3.1 tree -> v5.0 theme (CSS, JS, templates)
psbuild/render_check.py       renders the .tpl files to static HTML so the
                              markup/CSS pairing can be checked in a browser
psbuild/theme-additions.css   layer 4 (the PrestaShop bindings)
psbuild/templates/**          the rewritten .tpl sources
tokens.css / identity.css     layers 1 and 3, shared with the prototype
```

`render_check.py` is a verification tool, not a Smarty engine — it resolves
includes, blocks, the handful of variables these templates use, and the two
loops. It is what caught the cart drawer sitting in the page flow.
