// Ingredient photographs for the studio cards, generated with Gemini.
//
//   GEMINI_API_KEY=… npm run notes              the notes the cards show (first top / heart / base)
//   GEMINI_API_KEY=… npm run notes -- --all     every note of every parfum
//   GEMINI_API_KEY=… npm run notes -- saffron   just these (slugs or English names)
//   … -- --force                                redo images that already exist
//
// Writes assets/img/notes/<slug>.webp (640×640). The studio card picks a file up as
// soon as it exists, so run `npm run studio` afterwards to rebuild the cards.
// Existing files are skipped: a picture you like stays, delete it to get another.
//
// The model is gemini-2.5-flash-image unless GEMINI_IMAGE_MODEL says otherwise.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const outDir = path.join(root, 'assets/img/notes');
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const API = process.env.GEMINI_API_BASE || 'https://generativelanguage.googleapis.com';   // override only to test

/* same rule as studio/notes.js, which is a browser module */
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* What to photograph for each note. Most are the raw material; the abstract ones
   ("accords", aldehydes, musks) get the object perfumers use to describe them. */
const SUBJECT = {
  'Calabrian Bergamot': 'a whole green-yellow bergamot orange and one halved bergamot showing its pale flesh',
  'Pink Pepper': 'a small heap of dried pink peppercorns with a few loose ones',
  'Cardamom': 'a few green cardamom pods, one split open showing black seeds',
  'Orris': 'pale dried orris (iris) root pieces beside one purple iris flower',
  'Iris': 'one fresh purple-blue iris flower',
  'Violet Leaf': 'a few glossy heart-shaped green violet leaves',
  'Cedar': 'a small stack of split cedar wood with reddish grain',
  'Atlas Cedarwood': 'a cut log section of Atlas cedar with visible rings and a sprig of blue-green cedar needles',
  'Vetiver': 'a tied bundle of dry golden vetiver roots',
  'White Musk': 'a soft tuft of pure white cotton fibres with a few white musk crystals',
  'Musk': 'a soft tuft of white cotton fibres with a few pale crystals',
  'Saffron': 'a small heap of deep red saffron threads with a purple crocus flower',
  'Nutmeg': 'two whole nutmegs, one wrapped in red mace, and a little grated nutmeg',
  'Blood Orange': 'a whole blood orange and a halved one showing its deep red flesh',
  'Rose de Taif': 'two fresh pink Taif damask roses with a few petals',
  'Rose Absolute': 'a full deep pink rose and a small glass dish of rose absolute',
  'Rose': 'one fresh soft pink rose',
  'Immortelle': 'a small bunch of dried yellow immortelle (helichrysum) flowers',
  'Cinnamon': 'a few cinnamon sticks tied with twine and a little ground cinnamon',
  'Labdanum': 'dark amber labdanum resin pieces beside a sprig of cistus with a white flower',
  'Amber': 'warm golden amber resin pieces catching the light',
  'Benzoin': 'a few rough pieces of golden-brown benzoin resin',
  'Neroli': 'a sprig of white orange-tree flowers (neroli) with glossy leaves',
  'Orange Blossom': 'a sprig of white orange blossom with green leaves',
  'Green Mandarin': 'two small green mandarins with leaves, one halved',
  'Pear': 'one ripe pale green-yellow pear and a halved pear',
  'Pear Blossom': 'a small branch of white pear blossom',
  'Jasmine Sambac': 'a small cluster of white jasmine sambac flowers',
  'Jasmine': 'a sprig of white jasmine flowers with buds',
  'Tuberose': 'a stem of white tuberose flowers',
  'Sandalwood': 'pale sandalwood chips and a small sandalwood log',
  'Black Pepper': 'a small heap of black peppercorns',
  'Elemi': 'pale yellow elemi resin pieces',
  'Grapefruit Peel': 'curled strips of pink grapefruit peel beside a halved grapefruit',
  'Grapefruit': 'a halved pink grapefruit',
  'Guaiac Wood': 'dark guaiac wood chips and a small smoky-brown wood block',
  'Leather': 'a rolled piece of soft tan leather',
  'Birch Tar': 'a curl of white birch bark and a small dark glass dish of black tar',
  'Tonka': 'a few dark wrinkled tonka beans',
  'Moroccan Mint': 'a fresh bunch of Moroccan spearmint',
  'Cold Mint': 'fresh mint leaves with a few ice crystals',
  'Lemon': 'a whole lemon and a halved lemon',
  'Sea Salt': 'a small heap of coarse white sea-salt crystals',
  'Green Fig': 'two fresh green figs, one halved showing pink flesh',
  'Fig Leaf': 'one large lobed green fig leaf',
  'Fig Milk': 'a halved fig with a small glass of milk',
  'Basil': 'a fresh sprig of green basil',
  'Geranium': 'a sprig of pink geranium flowers with leaves',
  'Ambrette': 'a few small ambrette seeds and a pale hibiscus flower',
  'Driftwood': 'a piece of smooth sun-bleached driftwood',
  'Raspberry': 'a small cluster of fresh raspberries',
  'Bergamot': 'a whole bergamot and a halved one',
  'Oud Accord': 'a few dark resinous agarwood (oud) chips',
  'Patchouli': 'dried dark patchouli leaves',
  'Vanilla Bourbon': 'three dark glossy vanilla pods tied together and a white vanilla flower',
  'Vanilla': 'two dark vanilla pods and a pale yellow vanilla orchid',
  'Bitter Almond': 'a small heap of almonds, a few cracked from their shells',
  'Orange Blossom Honey': 'a small glass jar of golden honey with a wooden dipper and a sprig of orange blossom',
  'Honey': 'a small glass jar of golden honey with a wooden dipper',
  'Heliotrope': 'a cluster of small purple heliotrope flowers',
  'Cypress': 'a sprig of cypress with two small round cones',
  'Ambergris': 'a smooth pale grey stone of ambergris',
  'Coconut Wood': 'a halved coconut and a small piece of coconut-shell wood',
  'Aldehydes': 'a few sparkling clear glass droplets and tiny bubbles',
  'Cotton Accord': 'a sprig of white cotton bolls',
  'Cashmere Wood': 'a folded piece of soft beige cashmere on a pale wood block',
  'Clove': 'a small heap of dried cloves',
  'Rum Accord': 'a small glass of dark rum with a stick of sugar cane',
  'Tobacco Leaf': 'a few dried golden-brown tobacco leaves',
  'Dry Woods': 'a small bundle of dry pale twigs and wood shavings',
  'Juniper': 'a sprig of juniper with dark blue berries',
  'Lavender Absolute': 'a small bunch of purple lavender',
  'Stone Accord': 'a few smooth grey river stones'
};

const prompt = (note) => `Studio product photograph of ${SUBJECT[note] || note.toLowerCase()}, the perfume ingredient "${note}".
A single small, tidy arrangement in the centre of a square frame, filling about 60% of it.
Plain seamless warm ivory background, colour #F3EBDD, the same tone edge to edge — no surface line, no table, no gradient.
Soft natural daylight from the upper left, a faint soft shadow, crisp focus, photorealistic, high-end fragrance advertising.
No text, no labels, no bottle, no packaging, no hands, no other objects.`;

/* ── which notes ─────────────────────────────────────────── */
const argv = process.argv.slice(2);
const flag = f => { const i = argv.indexOf(f); return i !== -1 && argv.splice(i, 1); };
const all = flag('--all'), force = flag('--force');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/data.js'), 'utf8'), sandbox);
const parfums = sandbox.window.ODYS.products.filter(p => p.type === 'parfum');
const every = [...new Set(parfums.flatMap(p => [...p.notes.top, ...p.notes.heart, ...p.notes.base]))];
const onCards = [...new Set(parfums.flatMap(p => [p.notes.top[0], p.notes.heart[0], p.notes.base[0]]))];
let notes = all ? every : onCards;
if (argv.length) {
  notes = argv.map(a => every.find(n => n === a || slug(n) === a));
  const bad = argv.filter((a, i) => !notes[i]);
  if (bad.length) { console.error('Not a note in data.js: ' + bad.join(', ')); process.exit(1); }
}
const todo = notes.filter(n => force || !fs.existsSync(path.join(outDir, slug(n) + '.webp')));
console.log(`${notes.length} notes, ${notes.length - todo.length} already have a picture, ${todo.length} to generate with ${MODEL}`);
if (!todo.length) process.exit(0);

if (!KEY) {
  console.error('Set GEMINI_API_KEY (an API key from Google AI Studio) to generate the pictures.');
  process.exit(1);
}
let chromium;
try { ({ chromium } = require('playwright')); } catch (e) {
  console.error('Needs Playwright to convert to WebP: run `npm install`.');
  process.exit(1);
}

/* ── Gemini ─────────────────────────────────────────────── */
async function generate(note) {
  const body = {
    contents: [{ parts: [{ text: prompt(note) }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '1:1' } }
  };
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`${API}/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify(body)
    });
    /* rate limits and overload pass; anything else is a real answer */
    if ((res.status === 429 || res.status >= 500) && attempt < 5) {
      await new Promise(r => setTimeout(r, 2000 * 2 ** attempt));
      continue;
    }
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`${res.status} ${json.error ? json.error.message : res.statusText}`);
    const parts = (json.candidates && json.candidates[0] && json.candidates[0].content && json.candidates[0].content.parts) || [];
    const img = parts.find(p => p.inlineData || p.inline_data);
    if (!img) {
      const why = (json.candidates && json.candidates[0] && json.candidates[0].finishReason) || (json.promptFeedback && json.promptFeedback.blockReason);
      throw new Error('no image in the answer' + (why ? ` (${why})` : ''));
    }
    const d = img.inlineData || img.inline_data;
    return { mime: d.mimeType || d.mime_type || 'image/png', data: d.data };
  }
}

(async () => {
  fs.mkdirSync(outDir, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage();
  let failed = 0;
  for (const note of todo) {
    const file = slug(note) + '.webp';
    try {
      const img = await generate(note);
      /* WebP at 640 px through the browser's encoder: the card shows it at 118 px,
         640 leaves room for a bigger layout without carrying a 2 MB original */
      const webp = await page.evaluate(async ({ mime, data }) => {
        const im = new Image(); im.src = `data:${mime};base64,${data}`; await im.decode();
        const s = 640, c = document.createElement('canvas'); c.width = c.height = s;
        const k = Math.max(s / im.width, s / im.height), w = im.width * k, h = im.height * k;
        c.getContext('2d').drawImage(im, (s - w) / 2, (s - h) / 2, w, h);
        return c.toDataURL('image/webp', 0.88).split(',')[1];
      }, img);
      fs.writeFileSync(path.join(outDir, file), Buffer.from(webp, 'base64'));
      console.log(`✓ ${file}`);
    } catch (e) {
      failed++;
      console.error(`✗ ${file}: ${e.message}`);
    }
  }
  await browser.close();
  console.log(`${todo.length - failed}/${todo.length} generated in assets/img/notes/ — now run \`npm run studio\` to rebuild the cards`);
  process.exit(failed ? 1 : 0);
})();
