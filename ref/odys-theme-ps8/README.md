# ODYS Parfums — PrestaShop 8 Theme

**L'Odyssée du Senteur** · Élaboré au Maroc · Est. 2026 · [odys.ma](https://odys.ma)

[![GitHub Pages](https://img.shields.io/badge/Demo-GitHub%20Pages-blue)](https://your-username.github.io/odys-theme-ps8)
[![PS8/9](https://img.shields.io/badge/PrestaShop-8.x_%7C_9.1-purple)](https://prestashop.com)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Live Demo

> **[https://your-username.github.io/odys-theme-ps8](https://your-username.github.io/odys-theme-ps8)**

The `/preview/index.html` file is the fully-functional prototype — no server required.  
GitHub Pages deploys it automatically on every push to `main`.

---

## Repository Structure

```
odys-theme-ps8/
├── README.md
├── LICENSE
├── .gitignore
├── preview/
│   └── index.html              ← Prototype (GitHub Pages demo)
├── .github/
│   └── workflows/
│       └── deploy-preview.yml  ← Auto-deploy to GitHub Pages
└── themes/
    └── odys/                   ← PS8 theme (drop into /themes/)
        ├── config/
        │   └── theme.yml       ← Theme registration (assets, modules, image types)
        ├── assets/
        │   ├── css/
        │   │   └── theme.css   ← 100KB — full design system
        │   ├── js/
        │   │   └── app.js      ← 125KB — ODYS IIFE + PS8 AJAX bridge
        │   └── img/
        │       └── hero.jpg    ← Replace with your hero image
        ├── modules/
        │   └── odys_loyalty/   ← Loyalty points module
        │       ├── odys_loyalty.php
        │       └── views/templates/hook/
        │           ├── loyalty_bar.tpl
        │           └── loyalty_bar_guest.tpl
        └── templates/
            ├── layouts/
            │   └── layout-full-width.tpl
            ├── _partials/
            │   ├── announcement-bar.tpl
            │   ├── header.tpl
            │   ├── mobile-menu.tpl
            │   ├── cart-drawer.tpl
            │   ├── modals.tpl          ← Checkout + Account + Notes + Toast
            │   └── footer.tpl
            ├── catalog/
            │   ├── product.tpl         ← Full product page
            │   ├── category.tpl
            │   ├── listing.tpl
            │   └── _partials/
            │       └── miniatures/
            │           └── product.tpl ← Product card (grids, carousels)
            ├── checkout/
            │   └── cart.tpl
            ├── customer/
            │   ├── authentication.tpl
            │   ├── my-account.tpl
            │   └── history.tpl
            ├── cms/
            │   └── category.tpl
            └── pages/
                ├── index.tpl           ← Homepage
                ├── 404.tpl
                ├── contact.tpl
                └── search.tpl
```

---


---

## PrestaShop 9.1 Compatibility

This theme is fully compatible with **PrestaShop 9.1** (tested: 8.0 → 9.1.x).

### What changed in v3.1.0

| Area | Change |
|---|---|
| `config/theme.yml` | `to: "9.1.99"` compatibility declared |
| `layout-full-width.tpl` | Skip-to-content link, `role="document"` |
| `header.tpl` | `aria-expanded`, `aria-haspopup`, `aria-live` on cart badge |
| `cart-drawer.tpl` | `role="dialog"`, `aria-modal`, `aria-hidden`, `role="progressbar"` |
| `mobile-menu.tpl` | `aria-modal="true"`, `aria-hidden="true"` by default |
| `catalog/product.tpl` | `radiogroup` vol-sel, `aria-checked`, accordion `aria-expanded`, note `<button>` |
| `assets/css/theme.css` | Skip-link, `.sr-only`, focus rings, reduced-motion, high-contrast, min touch targets 44px |
| `assets/js/app.js` | Focus trapping, `aria-invalid` forms, keyboard carousel nav, screen reader announcements |
| `odys_loyalty.php` | PHP typed returns, `max: 9.9.99` |

### PS9.1 specific notes

- **Hummingbird 2.0** is the new default theme in fresh PS9.1 installs — activate ODYS manually after upload
- **`Theme::getDefaultTheme()`** no longer hardcodes `"classic"` — our theme has no Classic dependency
- **PHP 8.5** is now recommended by PS9.1 — our module uses `str_starts_with()` (PHP 8.0+), fully compatible
- **Bootstrap 5** is used by Hummingbird only — ODYS has its own CSS, no conflicts


## Installation

### 1. Upload the theme

```bash
# FTP: upload themes/odys/ → your-shop/themes/
# OR: zip themes/odys/ → Admin > Design > Theme & Logo > Add new theme
```

### 2. Activate

**Admin** → Design → Theme & Logo → Select **odys** → Use this theme

### 3. Install loyalty module

```bash
# FTP: upload themes/odys/modules/odys_loyalty/ → your-shop/modules/
```

**Admin** → Modules → Search **ODYS Loyalty** → Install → Configure:

| Setting | Value |
|---|---|
| ID Catégorie Oud | ID of your Oud category |
| ID Catégorie Boukhour | ID of Boukhour category |
| ID Catégorie Flacons | ID of Flacons category |
| Numéro WhatsApp | `212600000000` (replace) |
| Email contact | `contact@odys.ma` (replace) |

### 4. Configure categories

| URL slug | Name | Notes |
|---|---|---|
| `parfums` | Parfums | Main fragrance category |
| `oud-boukhour` | Oud & Boukhour | Gram-based pricing |
| `flacons-voyage` | Flacons Voyage | Travel sizes 20–100ml |
| `coffrets` | Coffrets & Offres | Bundles |

### 5. Product attributes

**Parfums** → Create attribute `Volume` with values: `30ml`, `50ml`, `100ml`

**Oud** → Create attribute `Poids` with values: `5g`, `10g`, `25g`, `50g`, `100g`

### 6. Product features (characteristics)

| Feature name | Example value |
|---|---|
| `Notes de tête` | `Bergamote, Poivre rose, Ambroxan` |
| `Notes de cœur` | `Lavande, Géranium, Vétiver` |
| `Notes de fond` | `Cèdre, Ambre blanc, Musc` |
| `Famille olfactive` | `fresh` / `oriental` / `sweet` / `oud` |
| `Inspiration` | `Dior Sauvage EDP` |

### 7. Shipping zones

| Zone | Price |
|---|---|
| Casablanca | 20 DH |
| Maroc (other) | 30 DH |
| Free from | 300 DH |

### 8. Payment modules

| Method | PS8 Module |
|---|---|
| Cash on delivery (COD) | `ps_cashondelivery` |
| CMI card | CMI official module (cmi.co.ma) |
| Bank transfer | `ps_wirepayment` |

### 9. Replace placeholder content

```bash
# Hero image
themes/odys/assets/img/hero.jpg  (replace with 1200×640px WebP/JPG)

# WhatsApp number (3 places)
grep -r "212600000000" themes/odys/
# → themes/odys/templates/_partials/footer.tpl
# → themes/odys/templates/layouts/layout-full-width.tpl
# → configure in odys_loyalty module settings

# Analytics AI chat (optional — for the dashboard)
# The AI advisor uses the Anthropic API key set in the JS
# Replace in themes/odys/assets/js/app.js → anSendChat()
```

### 10. Add tracking pixels (optional)

Insert before `</head>` in `templates/layouts/layout-full-width.tpl`:

```html
<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','G-XXXXXXXXXX');</script>

<!-- Meta Pixel -->
<script>!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','YOUR_PIXEL_ID');fbq('track','PageView');</script>

<!-- TikTok Pixel -->
<script>!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.load('YOUR_TIKTOK_PIXEL');ttq.page();}(window,document,'ttq');</script>
```

---

## Features

| Feature | Details |
|---|---|
| 🎨 Design | Navy #1B2A4A · Rose Gold #C4956A · Ivory #FAF8F4 |
| 📝 Fonts | Playfair Display · Cormorant Garamond · Jost |
| 📣 Ticker | 65s marketing loop · text only (no logo) |
| 🛍 Product page | Gallery · Vol selector · Live price · Olfactory pyramid · Intensity meters · Viewing-now · FBT · Suggestions |
| 🪵 Oud page | Gram selector → PS8 combination · Total animé · noPoints flag |
| 🧪 Flacons | Fragrance selector · 4 volumes · Auto-carousel |
| 📦 Collection | Family filters (fresh/oriental/sweet/oud) · Responsive grid |
| 🛒 Cart | Drawer · Free shipping bar · Cross-sell · COD checkout |
| 💳 Checkout | 3-step modal · COD / CMI redirect / Virement |
| ⭐ Loyalty | odys_loyalty module · Oud/Flacons excluded · Tiers: Bronze→Argent→Or→VIP |
| 🌸 Notes | Bottom-sheet search panel · Click any olfactory note |
| 📊 Analytics | 6-tab dashboard · KPIs · SEO · Products · Marketing · Customers · AI chat |
| 🤖 AI Chat | Claude API · Business context preloaded · Quick actions |
| 🔒 Security | 0 `onclick=` in HTML · IIFE namespace · `esc()` · CSP meta · rate limiting |
| 📱 Mobile | Responsive · iOS safe areas · Hamburger menu |
| 🔍 SEO | JSON-LD · OG/Twitter · Canonical · geo.region:MA |

---

## Prototype → Production Mapping

| Prototype element | PS8 file |
|---|---|
| `#pg-home` | `templates/pages/index.tpl` |
| `#pg-parfum` | `templates/catalog/product.tpl` |
| `#pg-oud` | `templates/catalog/product.tpl` (Oud category) |
| `#pg-flacons` | `templates/catalog/product.tpl` (Flacons category) |
| `#pg-collection` | `templates/catalog/listing.tpl` |
| Product card `.pc` | `templates/catalog/_partials/miniatures/product.tpl` |
| Cart drawer | `templates/_partials/cart-drawer.tpl` |
| Checkout modal | `templates/_partials/modals.tpl` |
| Account/loyalty modal | `templates/_partials/modals.tpl` |
| ODYS IIFE + all JS | `assets/js/app.js` |
| All CSS | `assets/css/theme.css` |

---

## Development (optional Webpack/Vite setup)

```bash
npm init -y
npm install --save-dev vite sass

# vite.config.js
export default {
  build: {
    rollupOptions: {
      input: { app: 'src/js/app.js', theme: 'src/css/theme.scss' },
      output: { dir: 'themes/odys/assets' }
    }
  }
}

npm run build
```

---

*ODYS Parfums © 2026 · Casablanca, Maroc · [odys.ma](https://odys.ma) · [contact@odys.ma](mailto:contact@odys.ma)*
