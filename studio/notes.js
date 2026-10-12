/* Note medallions for the studio cards: a tinted disc with a line drawing of what
   kind of ingredient it is. They stand in until a real photograph of the note
   exists — drop one at assets/img/notes/<slug>.webp and the card uses it instead. */

export const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/* Order matters: the first rule that matches wins, so "Orange Blossom Honey" is a
   resin before it is a flower, and "Fig Leaf" a leaf before it is a fruit. */
const KINDS = [
  ['resin', /honey|vanilla|tonka|benzoin|labdanum|amber|elemi|almond|rum/i],
  ['leaf', /leaf|mint|basil/i],
  ['flower', /rose|jasmine|tuberose|orris|iris|violet|blossom|neroli|geranium|heliotrope|lavender|immortelle/i],
  ['citrus', /bergamot|orange|mandarin|lemon|grapefruit/i],
  ['spice', /pepper|cardamom|saffron|nutmeg|cinnamon|clove|juniper/i],
  ['fruit', /pear|raspberry|fig/i],
  ['smoke', /leather|birch|tobacco|smok/i],
  ['wood', /wood|cedar|vetiver|sandal|guaiac|cypress|oud|patchouli/i],
  ['musk', /musk|ambrette|aldehyde|cotton|salt|stone|ambergris/i]
];
export const kindOf = note => (KINDS.find(k => k[1].test(note)) || ['musk'])[0];

/* a colour per note where the ingredient has an obvious one, else per kind */
const TINT = {
  'Rose de Taif': '#C9707E', 'Rose Absolute': '#B85A6A', 'Rose': '#D18A96', 'Orris': '#9A8AB0', 'Iris': '#9A8AB0',
  'Violet Leaf': '#6F8A5A', 'Lavender Absolute': '#8D7BB0', 'Saffron': '#C0532A', 'Pink Pepper': '#C46A72',
  'Black Pepper': '#4A3A32', 'Raspberry': '#B23A55', 'Blood Orange': '#C0442C', 'Cold Mint': '#7FB0A0',
  'Moroccan Mint': '#5E9A72', 'Sea Salt': '#8FA8B4', 'Stone Accord': '#9A9690', 'Juniper': '#4E5F80',
  'Oud Accord': '#4A2A1A', 'Leather': '#5A3A28', 'Tobacco Leaf': '#8A5A2A', 'Honey': '#C99030',
  'Orange Blossom Honey': '#C99030', 'Vanilla': '#D9BE8A', 'Vanilla Bourbon': '#B8904E', 'White Musk': '#C9C0B0',
  'Cotton Accord': '#C9C4BA', 'Aldehydes': '#B8B4C0'
};
const KIND_TINT = {
  citrus: '#D9A33A', flower: '#D8B7A0', spice: '#A5582E', wood: '#8A6440', resin: '#B9803A',
  leaf: '#6E8E58', fruit: '#9E7A50', musk: '#BDB2A2', smoke: '#6A5040'
};

/* 64×64 line drawings, stroked in the darker shade of the tint */
const GLYPH = {
  citrus: `<circle cx="32" cy="32" r="17"/><circle cx="32" cy="32" r="13"/>
    ${[0, 45, 90, 135].map(a => `<path d="M32 32 l${(13 * Math.cos(a * Math.PI / 180)).toFixed(2)} ${(13 * Math.sin(a * Math.PI / 180)).toFixed(2)} M32 32 l${(-13 * Math.cos(a * Math.PI / 180)).toFixed(2)} ${(-13 * Math.sin(a * Math.PI / 180)).toFixed(2)}"/>`).join('')}`,
  flower: `${[0, 72, 144, 216, 288].map(a => `<ellipse cx="32" cy="20" rx="6.5" ry="11" transform="rotate(${a} 32 32)"/>`).join('')}<circle cx="32" cy="32" r="4"/>`,
  spice: `<circle cx="26" cy="28" r="5"/><circle cx="37" cy="25" r="5"/><circle cx="31" cy="37" r="5"/><circle cx="42" cy="36" r="4"/><circle cx="22" cy="40" r="3.5"/>`,
  wood: `<ellipse cx="32" cy="32" rx="17" ry="15"/><ellipse cx="32" cy="32" rx="11" ry="9.5"/><ellipse cx="32" cy="32" rx="5" ry="4"/><path d="M32 17v5M45 26l-4 2"/>`,
  resin: `<path d="M32 14c6 9 13 16 13 24a13 13 0 0 1-26 0c0-8 7-15 13-24z"/><path d="M26 39a6 6 0 0 0 6 6"/>`,
  leaf: `<path d="M18 46C18 28 30 17 47 17c0 17-11 29-29 29z"/><path d="M18 46 40 24M27 37h7M33 31v-6"/>`,
  fruit: `<circle cx="32" cy="36" r="13"/><path d="M32 23c0-4 1-7 3-9M34 18c4-3 9-2 11 0-3 3-7 3-11 0z"/>`,
  smoke: `<path d="M24 48c-6-6 6-10 0-17s4-11 2-17"/><path d="M33 48c-6-6 6-10 0-17s4-11 2-17"/><path d="M42 48c-6-6 6-10 0-17s4-11 2-17"/>`,
  musk: `<path d="M32 15v34M15 32h34M20 20l24 24M44 20 20 44"/><circle cx="32" cy="32" r="5"/>`
};

function mix(hex, to, t) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(to.slice(1), 16);
  const ch = (x, s) => (x >> s) & 255;
  const m = s => Math.round(ch(a, s) + (ch(b, s) - ch(a, s)) * t);
  return '#' + [16, 8, 0].map(s => m(s).toString(16).padStart(2, '0')).join('');
}

export function noteArt(note) {
  const kind = kindOf(note), c = TINT[note] || KIND_TINT[kind];
  const id = 'n' + slug(note);
  return `<svg viewBox="0 0 120 120" width="118" height="118" role="img" aria-label="${note}">
    <defs><radialGradient id="${id}" cx=".38" cy=".34" r=".8">
      <stop offset="0" stop-color="${mix(c, '#FFF8EC', 0.82)}"/><stop offset=".7" stop-color="${mix(c, '#FFF8EC', 0.55)}"/>
      <stop offset="1" stop-color="${mix(c, '#FFF8EC', 0.35)}"/></radialGradient></defs>
    <circle cx="60" cy="60" r="56" fill="url(#${id})"/>
    <circle cx="60" cy="60" r="56" fill="none" stroke="#B08D4F" stroke-opacity=".55" stroke-width="1"/>
    <circle cx="60" cy="60" r="51" fill="none" stroke="#B08D4F" stroke-opacity=".25" stroke-width=".8"/>
    <g transform="translate(18 18) scale(1.31)" fill="none" stroke="${mix(c, '#1A0F10', 0.35)}" stroke-width="1.4"
       stroke-linecap="round" stroke-linejoin="round">${GLYPH[kind]}</g>
  </svg>`;
}
