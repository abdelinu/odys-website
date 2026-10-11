// The product-photo robot. Renders studio/ for every parfum and saves the images.
//
//   npm install                       once — brings Playwright (the site itself needs nothing)
//   npm run studio                    every parfum: shop shot + French card
//   npm run studio -- odys-02 odys-07 just these
//   npm run studio -- --lang fr,ar    cards in several languages
//   npm run studio -- --only card     cards only (or --only bottle)
//
// Writes to assets/img/products/:
//   odys-02.webp          800×1200  the flacon alone, for the shop grid and the product page
//   odys-02-card-fr.webp  1080×1080 the square card with name, notes and words (Instagram, WhatsApp)
//
// Everything on the images comes from assets/js/data.js — change a name, a note or a
// juice colour there and run this again.
const fs = require('fs');
const http = require('http');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets/img/products');

let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('The studio needs Playwright: run `npm install` (and `npx playwright install chromium` if no browser is found).');
  process.exit(1);
}

/* ── arguments ─────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const opt = (name, def) => { const i = argv.indexOf('--' + name); return i === -1 ? def : argv.splice(i, 2)[1]; };
const langs = opt('lang', 'fr').split(',');
const only = opt('only', null);
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), sandbox);
const parfums = sandbox.window.ODYS.products.filter(p => p.type === 'parfum');
const ids = argv.length ? argv : parfums.map(p => p.id);
const unknown = ids.filter(id => !parfums.some(p => p.id === id));
if (unknown.length) { console.error('Not a parfum in data.js: ' + unknown.join(', ')); process.exit(1); }

/* ── a static server for the repo, so the robot needs nothing else running ── */
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp',
  '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  let file = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end(); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
    res.end(buf);
  });
});

(async () => {
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}/studio/`;
  fs.mkdirSync(outDir, { recursive: true });

  /* software WebGL: works headless, on a server, and with no GPU */
  const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const jobs = [];
  for (const id of ids) {
    if (only !== 'card') jobs.push({ id, shot: 'bottle', lang: 'fr', file: `${id}.webp`, vp: { width: 800, height: 1200 } });
    if (only !== 'bottle') langs.forEach(lang =>
      jobs.push({ id, shot: 'card', lang, file: `${id}-card-${lang}.webp`, vp: { width: 1080, height: 1080 } }));
  }

  let failed = 0;
  for (const j of jobs) {
    const page = await browser.newPage({ viewport: j.vp });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      await page.goto(`${base}?id=${j.id}&lang=${j.lang}&shot=${j.shot}`);
      await page.waitForSelector('body[data-ready], body[data-error]', { timeout: 90000 });
      const err = await page.getAttribute('body', 'data-error');
      if (err) throw new Error(err);
      const png = await page.locator('#frame').screenshot({ type: 'png' });
      /* WebP through the browser's own encoder — no image library to install */
      const webp = await page.evaluate(async b64 => {
        const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
        const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        return c.toDataURL('image/webp', 0.9).split(',')[1];
      }, png.toString('base64'));
      fs.writeFileSync(path.join(outDir, j.file), Buffer.from(webp, 'base64'));
      console.log(`✓ ${j.file}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${j.file}: ${e.message}${errors.length ? ' — ' + errors.join('; ') : ''}`);
    }
    await page.close();
  }

  await browser.close();
  server.close();
  console.log(`${jobs.length - failed}/${jobs.length} images in ${path.relative(root, outDir)}/`);
  process.exit(failed ? 1 : 0);
})();
