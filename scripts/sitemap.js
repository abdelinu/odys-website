// Regenerates sitemap.xml from the catalogue in assets/js/data.js.
// Run after adding or removing a product:  node scripts/sitemap.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = 'https://odysparfum.ma/';   // ⚠ same assumed domain as robots.txt
const root = path.join(__dirname, '..');

const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), sandbox);
const D = sandbox.window.ODYS;

const pages = ['', 'shop.html', 'diffuseurs.html', 'oud.html', 'coffrets.html', 'discover.html',
  'collections.html', 'rewards.html', 'journal.html', 'info.html'];
const urls = pages.map(p => BASE + p)
  .concat(D.products.map(p => BASE + 'product.html?id=' + p.id));

const today = new Date().toISOString().slice(0, 10);
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  + '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
  + urls.map(u => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc><lastmod>${today}</lastmod></url>`).join('\n')
  + '\n</urlset>\n';

fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
console.log(`sitemap.xml: ${urls.length} urls`);
