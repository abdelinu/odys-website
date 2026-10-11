// ODYS v5 — in-page QA sweep. Returns a report object.
const PAL = new Set(['17,19,22','12,27,38','180,134,61','201,166,107','232,214,192',
 '245,235,221','32,33,36','117,107,97','205,184,158','239,227,210','220,199,172',
 '143,106,47','228,207,164','22,48,63','45,106,79','138,43,32','26,29,33',
 '160,143,120','37,211,102','191,214,198','240,246,241','220,233,224','122,92,41',
 '168,122,51','255,255,255','0,0,0','7,15,22','42,33,24','143,191,165']);

function offPalette(root) {
  const off = {};
  root.querySelectorAll('*').forEach(el => {
    const cs = getComputedStyle(el);
    ['color','backgroundColor','borderTopColor','borderBottomColor','borderLeftColor','outlineColor']
      .forEach(p => {
        const v = cs[p];
        const m = v && v.match(/rgba?\((\d+), (\d+), (\d+)(?:, ([\d.]+))?/);
        if (!m) return;
        if (m[4] !== undefined && parseFloat(m[4]) === 0) return;
        const key = m[1] + ',' + m[2] + ',' + m[3];
        if (!PAL.has(key)) off[key] = (off[key] || 0) + 1;
      });
  });
  return Object.entries(off).sort((a,b) => b[1]-a[1]).slice(0, 8);
}

const pages = [...document.querySelectorAll('.page')].map(p => p.id);
const report = { pages: {}, global: {} };

// Force every page visible in turn and audit it
const originallyOn = document.querySelector('.page.on').id;
for (const id of pages) {
  const el = document.getElementById(id);
  document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
  el.classList.add('on');
  el.querySelectorAll('.reveal').forEach(r => r.classList.add('in'));
  report.pages[id] = {
    hasFooter: !!el.querySelector('footer'),
    hasNav: !!el.querySelector('nav'),
    h: Math.round(el.getBoundingClientRect().height),
    overflowX: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    offPalette: offPalette(el)
  };
}
document.querySelectorAll('.page').forEach(p => p.classList.remove('on'));
document.getElementById(originallyOn).classList.add('on');

// Global checks
report.global.brokenImages = [...document.images]
  .filter(i => i.complete && i.naturalWidth === 0).length;
report.global.imagesWithoutAlt = [...document.images].filter(i => !i.hasAttribute('alt')).length;
report.global.lazyImages = document.querySelectorAll('img[loading="lazy"]').length;
report.global.totalImages = document.images.length;
report.global.buttonsWithoutLabel = [...document.querySelectorAll('button')]
  .filter(b => !b.textContent.trim() && !b.getAttribute('aria-label')).length;
report.global.emptyHrefAnchors = document.querySelectorAll('a[href="#"]').length;
report.global.h1Count = document.querySelectorAll('h1').length;
report.global.tokens = (() => {
  const cs = getComputedStyle(document.documentElement);
  return ['--odys-champagne','--odys-cream','--odys-black','--odys-marine','--odys-gold',
          '--odys-soft-gold','--odys-text','--odys-muted','--odys-border',
          '--font-display','--font-body','--transition-luxury','--spacing-xl']
    .reduce((a,k) => (a[k] = cs.getPropertyValue(k).trim(), a), {});
})();
report.global.duplicateIds = (() => {
  const seen = {}, dup = [];
  document.querySelectorAll('[id]').forEach(e => {
    if (seen[e.id]) { if (!dup.includes(e.id)) dup.push(e.id); } else seen[e.id] = 1;
  });
  return dup.slice(0, 12);
})();
report;
