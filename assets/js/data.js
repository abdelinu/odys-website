/* ODYS — catalogue + business config.
   Shaped like the future API payload: swap this file for fetch('/api/catalogue')
   and nothing downstream changes.

   ⚠ PLACEHOLDER PRICES are marked `// ⚠` — oud price per gram, gram-tier discounts,
   the special-order rate, coffret fees and the shipping threshold. Everything else
   (69 DH perfume, 49 DH diffuseur, the point rules) is the real business model. */
window.ODYS = (function () {

  const config = {
    currency: 'MAD',
    freeShipFrom: 199,                 // ⚠ set to the trio price so the hero basket always ships free
    prices: { perfume50: 69, diffuseur50: 49 },

    /* RATINGS & REVIEWS — the rating/reviews numbers and the PDP quotes in this file are
       demo content. Showing invented reviews to real customers is misleading (and a legal
       risk under Moroccan consumer law), so they stay hidden until real ones exist. */
    showRatings: false,

    /* ORDERING — WhatsApp + cash on delivery is the launch channel */
    whatsapp: '212684519444',          // the shop's WhatsApp (06 84 51 94 44): country code, no +, no spaces

    /* POINTS — follow the dirham, not the unit.
       Keyed per gram, a cheap oud batch paid the same reward as an expensive one;
       money-based accrual closes that hole. */
    points: {
      madPerPoint: 69,                 // 69 MAD spent = 1 point (a perfume is exactly 1)
      diffuseurEarns: false            // diffuseurs stay outside the programme
    },

    /* REDEMPTION LADDER — the first rung has to land inside the first order or two */
    rewards: [
      { id: 'r-3', pts: 3, name: 'A discovery vial', sub: '2 ML of any fragrance, added to your next order', type: 'sample', qty: 1 },
      { id: 'r-8', pts: 8, name: 'A free diffuseur', sub: 'Any 50 ML diffuseur + 3 sticks', type: 'diffuseur', qty: 1 },
      { id: 'r-20', pts: 20, name: 'One free perfume', sub: 'Any 50 ML in the house', type: 'perfume', qty: 1 },
      { id: 'r-50', pts: 50, name: 'Three free perfumes', sub: 'Choose any three 50 ML', type: 'perfume', qty: 3 },
      { id: 'r-100', pts: 100, name: 'A custom coffret to gift', sub: 'Compose it yourself · up to 5 pieces · gift-wrapped and sent', type: 'coffret', qty: 1, maxItems: 5 }
    ],

    /* the only points that do not come from a product */
    referral: { join: 3, firstOrder: 5, friendDiscountPct: 10 },

    /* OUD sold by the gram */
    oud: {
      steps: [5, 10, 15, 30, 100],     // fixed weights
      minGrams: 5,
      specialFrom: 100,                // above this, a special order is quoted
      tierDiscount: { 5: 1, 10: 0.96, 15: 0.93, 30: 0.88, 100: 0.80 },  // ⚠ placeholder
      specialRate: 0.75,               // ⚠ placeholder — per-gram rate on special orders
      sticksPerGram: 1,                // ⚠ placeholder — weigh a real stick; drives the "≈ N sticks" hint
      minutesPerStick: 30              // matches the usage copy on the batches
    },

    coffret: { fee: 29, discountPct: 8, maxCustom: 8 },   // ⚠ placeholder

    tiers: [
      { name: 'Explorer', from: 0, perk: 'Every 69 MAD spent earns a point · first reward at 3' },
      { name: 'Voyager', from: 20, perk: 'A free perfume unlocked · a vial with every order' },
      { name: 'ODYSSÉE', from: 50, perk: 'Three free perfumes · early access to new compositions' }
    ]
  };

  /* palettes: [glass, shadow] — used to tint the generated bottle art */
  const P = {
    icon: ['#6B2B2F', '#150506'], fresh: ['#2E4A46', '#0A1413'], floral: ['#6A3243', '#160709'],
    woody: ['#4A3220', '#120A05'], amber: ['#7A4A18', '#1A0C03'], oud: ['#33151A', '#060202'],
    gourmand: ['#5A3418', '#150A03'], spicy: ['#6E2C16', '#150502'], oriental: ['#3A2352', '#0B0612'],
    musk: ['#4C4236', '#100D09'], night: ['#1E2340', '#05060D']
  };

  const PERFUME = config.prices.perfume50;

  /* juice: the liquid colour the product-photo robot (studio/) paints into the 3D flacon.
     ⚠ Only ODYS 01's is read off a photograph; the rest are guesses from the family. */
  const parfums = [
    {
      id: 'odys-01', code: 'ODYS 01', name: "L'ICÔNE", type: 'parfum',
      family: 'Woody Aromatic', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.9, reviews: 214,
      tags: ['bestseller', 'icons'], mood: ['woody', 'spicy'], experience: ['signature', 'office', 'day'],
      season: ['Autumn', 'Winter', 'Spring'], occasion: ['Everyday', 'Work', 'Evening'],
      notes: { top: ['Calabrian Bergamot', 'Pink Pepper', 'Cardamom'], heart: ['Orris', 'Violet Leaf', 'Cedar'], base: ['Atlas Cedarwood', 'Vetiver', 'White Musk'] },
      profile: { intensity: 4, longevity: 5, projection: 4, sweetness: 2, freshness: 3 },
      story: "The first chapter. Bergamot opens like morning over the Atlas, then the scent turns inward — dry cedar, cold iris, a thread of pepper that never quite settles. Worn by people who do not explain themselves.",
      sku: 'ODY-01-50', stock: 142, c: P.icon, juice: '#8A5A1C',
      // made by scripts/studio.js from the photograph in assets/img/bottles/; the others
      // use the 3D render until their photograph is dropped in next to it
      photo: 'assets/img/products/odys-01.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-02', code: 'ODYS 02', name: 'NUIT SAFRAN', type: 'parfum',
      family: 'Amber Spicy', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.8, reviews: 168,
      tags: ['bestseller', 'night', 'oriental'], mood: ['amber', 'spicy', 'oriental'], experience: ['night', 'date', 'statement'],
      season: ['Autumn', 'Winter'], occasion: ['Evening', 'Special Occasion'],
      notes: { top: ['Saffron', 'Nutmeg', 'Blood Orange'], heart: ['Rose de Taif', 'Immortelle', 'Cinnamon'], base: ['Labdanum', 'Amber', 'Benzoin'] },
      profile: { intensity: 5, longevity: 5, projection: 5, sweetness: 4, freshness: 1 },
      story: "Saffron burns slow. This is the hour after dinner when the lights go down and nobody is in a hurry — resin, rose, and a warmth that stays on wool for days.",
      sku: 'ODY-02-50', stock: 127, c: P.amber, juice: '#7A3412',
      photo: 'assets/img/products/odys-02.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-03', code: 'ODYS 03', name: 'JARDIN BLANC', type: 'parfum',
      family: 'White Floral', gender: 'Feminine', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.7, reviews: 142,
      tags: ['new', 'essentials'], mood: ['floral', 'fresh'], experience: ['day', 'office', 'summer'],
      season: ['Spring', 'Summer'], occasion: ['Everyday', 'Work'],
      notes: { top: ['Neroli', 'Green Mandarin', 'Pear'], heart: ['Orange Blossom', 'Jasmine Sambac', 'Tuberose'], base: ['Sandalwood', 'Musk', 'Cedar'] },
      profile: { intensity: 3, longevity: 3, projection: 3, sweetness: 3, freshness: 4 },
      story: "A courtyard in Fès at the end of April. Orange blossom over cool stone, water somewhere out of sight.",
      sku: 'ODY-03-50', stock: 163, c: P.floral, juice: '#E6D6A6',
      photo: 'assets/img/products/odys-03.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-04', code: 'ODYS 04', name: 'CÈDRE NOIR', type: 'parfum',
      family: 'Woody Smoky', gender: 'Masculine', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.9, reviews: 197,
      tags: ['bestseller', 'icons'], mood: ['woody', 'oud'], experience: ['night', 'winter', 'statement'],
      season: ['Autumn', 'Winter'], occasion: ['Evening', 'Work'],
      notes: { top: ['Black Pepper', 'Elemi', 'Grapefruit Peel'], heart: ['Cedar', 'Guaiac Wood', 'Leather'], base: ['Vetiver', 'Birch Tar', 'Tonka'] },
      profile: { intensity: 5, longevity: 5, projection: 4, sweetness: 2, freshness: 2 },
      story: "Cedar cut in winter, left near a fire. Dry, resinous, faintly smoked — the most quietly masculine thing we make.",
      sku: 'ODY-04-50', stock: 131, c: P.woody, juice: '#4A2C18',
      photo: 'assets/img/products/odys-04.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-05', code: 'ODYS 05', name: 'MENTHE & SEL', type: 'parfum',
      family: 'Fresh Aromatic', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.6, reviews: 118,
      tags: ['new', 'essentials'], mood: ['fresh'], experience: ['day', 'summer', 'office'],
      season: ['Spring', 'Summer'], occasion: ['Everyday', 'Work'],
      notes: { top: ['Moroccan Mint', 'Lemon', 'Sea Salt'], heart: ['Green Fig', 'Basil', 'Geranium'], base: ['Ambrette', 'Driftwood', 'Musk'] },
      profile: { intensity: 2, longevity: 3, projection: 3, sweetness: 1, freshness: 5 },
      story: "Mint tea poured too high, salt still on the skin. The scent of a long afternoon with nothing scheduled.",
      sku: 'ODY-05-50', stock: 188, c: P.fresh, juice: '#CBD8B2',
      photo: 'assets/img/products/odys-05.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-06', code: 'ODYS 06', name: 'ROSE DE NUIT', type: 'parfum',
      family: 'Oriental Floral', gender: 'Feminine', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.9, reviews: 176,
      tags: ['most-loved', 'oriental', 'night'], mood: ['floral', 'oriental', 'amber'], experience: ['night', 'date', 'statement'],
      season: ['Autumn', 'Winter'], occasion: ['Evening', 'Special Occasion'],
      notes: { top: ['Raspberry', 'Pink Pepper', 'Bergamot'], heart: ['Rose Absolute', 'Oud Accord', 'Patchouli'], base: ['Amber', 'Vanilla Bourbon', 'Musk'] },
      profile: { intensity: 5, longevity: 5, projection: 5, sweetness: 4, freshness: 1 },
      story: "Rose, but after dark — deepened with oud and patchouli until it stops being polite.",
      sku: 'ODY-06-50', stock: 124, c: P.floral, juice: '#C7848A',
      photo: 'assets/img/products/odys-06.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-07', code: 'ODYS 07', name: 'AMBRE DOUX', type: 'parfum',
      family: 'Gourmand Amber', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.8, reviews: 154,
      tags: ['most-loved', 'gifts'], mood: ['gourmand', 'amber'], experience: ['winter', 'date', 'night'],
      season: ['Autumn', 'Winter'], occasion: ['Evening', 'Everyday'],
      notes: { top: ['Bitter Almond', 'Bergamot', 'Cinnamon'], heart: ['Orange Blossom Honey', 'Tonka', 'Heliotrope'], base: ['Amber', 'Vanilla', 'Sandalwood'] },
      profile: { intensity: 4, longevity: 5, projection: 4, sweetness: 5, freshness: 1 },
      story: "Honey left on a warm spoon. Almond, tonka, a soft amber that reads as skin by hour three.",
      sku: 'ODY-07-50', stock: 155, c: P.gourmand, juice: '#B06C26',
      photo: 'assets/img/products/odys-07.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-08', code: 'ODYS 08', name: 'OUD IMPÉRIAL', type: 'parfum',
      family: 'Oud Woody', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 5.0, reviews: 132,
      tags: ['bestseller', 'oud', 'icons'], mood: ['oud', 'woody'], experience: ['night', 'statement', 'winter'],
      season: ['Autumn', 'Winter'], occasion: ['Special Occasion', 'Evening'],
      notes: { top: ['Saffron', 'Cypress', 'Cardamom'], heart: ['Oud Accord', 'Rose', 'Leather'], base: ['Sandalwood', 'Ambergris', 'Musk'] },
      profile: { intensity: 5, longevity: 5, projection: 5, sweetness: 2, freshness: 1 },
      story: "Our densest composition — oud at the centre, held up by saffron and rose. The bottle people come back for, and the one they hand to their brother.",
      sku: 'ODY-08-50', stock: 112, c: P.oud, juice: '#3E1E12',
      photo: 'assets/img/products/odys-08.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-09', code: 'ODYS 09', name: 'FIGUE SAUVAGE', type: 'parfum',
      family: 'Green Fruity', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.6, reviews: 96,
      tags: ['new', 'essentials'], mood: ['fresh', 'woody'], experience: ['summer', 'day', 'signature'],
      season: ['Spring', 'Summer'], occasion: ['Everyday', 'Work'],
      notes: { top: ['Fig Leaf', 'Green Mandarin', 'Violet Leaf'], heart: ['Fig Milk', 'Iris', 'Coconut Wood'], base: ['Cedar', 'Musk', 'Benzoin'] },
      profile: { intensity: 3, longevity: 3, projection: 3, sweetness: 3, freshness: 4 },
      story: "Fig picked warm off the tree — green at first, then creamy, then wood.",
      sku: 'ODY-09-50', stock: 171, c: P.fresh, juice: '#BDBB7C',
      photo: 'assets/img/products/odys-09.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-10', code: 'ODYS 10', name: 'MUSC BLANC', type: 'parfum',
      family: 'Musky Clean', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.7, reviews: 203,
      tags: ['most-loved', 'essentials'], mood: ['musky', 'fresh'], experience: ['day', 'office', 'signature'],
      season: ['All year'], occasion: ['Everyday', 'Work'],
      notes: { top: ['Aldehydes', 'Bergamot', 'Pear Blossom'], heart: ['Iris', 'Cotton Accord', 'Jasmine'], base: ['White Musk', 'Cashmere Wood', 'Ambrette'] },
      profile: { intensity: 2, longevity: 4, projection: 2, sweetness: 2, freshness: 4 },
      story: "The quiet one. Clean laundry, warm skin, nothing to declare — our most repurchased bottle.",
      sku: 'ODY-10-50', stock: 204, c: P.musk, juice: '#EEE6D3',
      photo: 'assets/img/products/odys-10.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-11', code: 'ODYS 11', name: 'TABAC & MIEL', type: 'parfum',
      family: 'Spicy Gourmand', gender: 'Masculine', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.8, reviews: 88,
      tags: ['night', 'oriental'], mood: ['gourmand', 'spicy', 'amber'], experience: ['night', 'winter', 'date'],
      season: ['Autumn', 'Winter'], occasion: ['Evening', 'Special Occasion'],
      notes: { top: ['Clove', 'Bergamot', 'Rum Accord'], heart: ['Tobacco Leaf', 'Honey', 'Cinnamon'], base: ['Tonka', 'Dry Woods', 'Vanilla'] },
      profile: { intensity: 5, longevity: 5, projection: 4, sweetness: 4, freshness: 1 },
      story: "Tobacco and honey, the way an old leather chair smells in a room that has seen conversation.",
      sku: 'ODY-11-50', stock: 138, c: P.spicy, juice: '#94561C',
      photo: 'assets/img/products/odys-11.webp', photoW: 800, photoH: 1200
    },
    {
      id: 'odys-12', code: 'ODYS 12', name: 'NUIT D’ATLAS', type: 'parfum',
      family: 'Aromatic Mineral', gender: 'Unisex', concentration: 'Extrait de Parfum',
      volume: 50, unit: 'ML', price: PERFUME, rating: 4.7, reviews: 74,
      tags: ['new', 'night'], mood: ['fresh', 'woody'], experience: ['night', 'signature', 'statement'],
      season: ['Spring', 'Autumn'], occasion: ['Evening', 'Everyday'],
      notes: { top: ['Juniper', 'Cold Mint', 'Grapefruit'], heart: ['Lavender Absolute', 'Cypress', 'Stone Accord'], base: ['Vetiver', 'Ambergris', 'Cedar'] },
      profile: { intensity: 4, longevity: 4, projection: 3, sweetness: 1, freshness: 4 },
      story: "Altitude after sunset. Juniper, cold air, wet rock — a fresh scent with a shadow in it.",
      sku: 'ODY-12-50', stock: 146, c: P.night, juice: '#93A6AA',
      photo: 'assets/img/products/odys-12.webp', photoW: 800, photoH: 1200
    }
  ];

  const DIFF = config.prices.diffuseur50;

  /* Diffuseurs — 50 ML + 3 rattan sticks. Outside the point system, by design. */
  const diffuseurs = [
    {
      id: 'diff-01', code: 'DIFFUSEUR 01', name: 'BOIS & AMBRE', type: 'diffuseur',
      family: 'Woody Amber', volume: 50, unit: 'ML', price: DIFF, rating: 4.8, reviews: 96,
      sticks: 3, duration: '6 à 8 semaines', room: 'Salon · entrée',
      tags: ['bestseller', 'maison'], mood: ['woody', 'amber'], experience: ['everyday'],
      notes: { top: ['Bergamot', 'Pink Pepper'], heart: ['Cedar', 'Amber'], base: ['Sandalwood', 'Vanilla'] },
      story: "Warm wood and amber that settles into a room instead of announcing itself. Three rattan sticks in the box — turn them once a week.",
      sku: 'DIF-01-50', stock: 210, c: P.woody
    },
    {
      id: 'diff-02', code: 'DIFFUSEUR 02', name: 'FLEUR D’ORANGER', type: 'diffuseur',
      family: 'White Floral', volume: 50, unit: 'ML', price: DIFF, rating: 4.7, reviews: 74,
      sticks: 3, duration: '6 à 8 semaines', room: 'Chambre · salle de bain',
      tags: ['new', 'maison'], mood: ['floral', 'fresh'], experience: ['everyday'],
      notes: { top: ['Neroli', 'Mandarin'], heart: ['Orange Blossom', 'Jasmine'], base: ['White Musk'] },
      story: "The courtyard smell — neroli and orange blossom, clean enough for a bedroom.",
      sku: 'DIF-02-50', stock: 186, c: P.floral
    },
    {
      id: 'diff-03', code: 'DIFFUSEUR 03', name: 'THÉ & MENTHE', type: 'diffuseur',
      family: 'Fresh Green', volume: 50, unit: 'ML', price: DIFF, rating: 4.6, reviews: 61,
      sticks: 3, duration: '6 à 8 semaines', room: 'Cuisine · bureau',
      tags: ['maison'], mood: ['fresh'], experience: ['day'],
      notes: { top: ['Moroccan Mint', 'Lemon'], heart: ['Green Tea', 'Basil'], base: ['Musk', 'Driftwood'] },
      story: "Mint tea in the afternoon. The one to put where people work or eat.",
      sku: 'DIF-03-50', stock: 174, c: P.fresh
    },
    {
      id: 'diff-04', code: 'DIFFUSEUR 04', name: 'OUD & ROSE', type: 'diffuseur',
      family: 'Oriental', volume: 50, unit: 'ML', price: DIFF, rating: 4.9, reviews: 88,
      sticks: 3, duration: '6 à 8 semaines', room: 'Salon · majlis',
      tags: ['bestseller', 'maison', 'gifts'], mood: ['oud', 'floral', 'oriental'], experience: ['night'],
      notes: { top: ['Saffron'], heart: ['Rose', 'Oud Accord'], base: ['Amber', 'Patchouli'] },
      story: "For the room where guests sit. Rose over oud, the way a house smells before people arrive.",
      sku: 'DIF-04-50', stock: 158, c: P.oud
    },
    {
      id: 'diff-05', code: 'DIFFUSEUR 05', name: 'VANILLE & BOIS', type: 'diffuseur',
      family: 'Gourmand Woody', volume: 50, unit: 'ML', price: DIFF, rating: 4.7, reviews: 52,
      sticks: 3, duration: '6 à 8 semaines', room: 'Chambre · salon',
      tags: ['maison', 'gifts'], mood: ['gourmand', 'woody'], experience: ['winter'],
      notes: { top: ['Almond'], heart: ['Vanilla', 'Tonka'], base: ['Cedar', 'Benzoin'] },
      story: "Sweet without being a dessert. The winter diffuseur.",
      sku: 'DIF-05-50', stock: 192, c: P.gourmand
    },
    {
      id: 'diff-06', code: 'DIFFUSEUR 06', name: 'FIGUE & CÈDRE', type: 'diffuseur',
      family: 'Green Woody', volume: 50, unit: 'ML', price: DIFF, rating: 4.6, reviews: 44,
      sticks: 3, duration: '6 à 8 semaines', room: 'Entrée · couloir',
      tags: ['new', 'maison'], mood: ['fresh', 'woody'], experience: ['day'],
      notes: { top: ['Fig Leaf'], heart: ['Fig', 'Iris'], base: ['Cedar', 'Musk'] },
      story: "Green fig and dry cedar — the first thing anyone smells when the door opens.",
      sku: 'DIF-06-50', stock: 166, c: P.fresh
    }
  ];

  /* OUD — bâtonnets sold by the gram. price is per gram; the grid builds the weights. */
  const ouds = [
    {
      id: 'oud-01', code: 'OUD 01', name: 'MALAKI', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 12, rating: 4.9, reviews: 148,     // ⚠ placeholder
      tags: ['bestseller', 'oud'], mood: ['oud', 'amber'], experience: ['everyday', 'night'],
      oud: {
        origin: 'Blended in Morocco', grade: 'Malaki', oudType: 'Oud + amber',
        character: 'Sweet ambered smoke, rose behind it, very little bite',
        aging: 'Hand-rolled, rested 40 days',
        usage: 'One stick scents a room for about 30 minutes.',
        burning: 'Light the tip, let the flame catch, blow it out. Stand it in sand or a holder.',
        occasions: ['Everyday', 'Guests', 'Eid', 'Ramadan']
      },
      sensory: { sweet: 5, woody: 3, smoky: 4, animalic: 1, resinous: 4, earthy: 2 },
      story: "The house standard. Sweet, ambered, generous — what most Moroccan homes mean when they say oud.",
      sku: 'OUD-01', stock: 4200, c: P.amber
    },
    {
      id: 'oud-02', code: 'OUD 02', name: 'CAMBODI', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 16, rating: 5.0, reviews: 96,      // ⚠ placeholder
      tags: ['bestseller', 'oud'], mood: ['oud'], experience: ['night', 'statement'],
      oud: {
        origin: 'Koh Kong profile', grade: 'Royal', oudType: 'Cambodi',
        character: 'Sweet, fruity, vanillic wood with almost no barn',
        aging: 'Rested 60 days',
        usage: 'One stick. It fills a room faster than you expect.',
        burning: 'Light, blow out, place upright away from fabric.',
        occasions: ['Evening', 'Guests', 'Gifting']
      },
      sensory: { sweet: 5, woody: 5, smoky: 2, animalic: 1, resinous: 3, earthy: 2 },
      story: "The gateway oud. Round and sweet from the first minute — the one we hand to people who think they dislike oud.",
      sku: 'OUD-02', stock: 3100, c: P.oud
    },
    {
      id: 'oud-03', code: 'OUD 03', name: 'HINDI', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 18, rating: 4.8, reviews: 72,      // ⚠ placeholder
      tags: ['oud'], mood: ['oud'], experience: ['night', 'statement'],
      oud: {
        origin: 'Assam profile', grade: 'Super', oudType: 'Hindi',
        character: 'Dense, animalic, unmistakable — the traditionalist’s oud',
        aging: 'Rested 90 days',
        usage: 'Half a stick is usually enough.',
        burning: 'Light, blow out, keep a window slightly open the first time.',
        occasions: ['Evening', 'Jumu’ah', 'Special Occasion']
      },
      sensory: { sweet: 3, woody: 5, smoky: 4, animalic: 5, resinous: 4, earthy: 4 },
      story: "Not a beginner's oud. Wild at the top, extraordinary once it turns — burn it for people who already know.",
      sku: 'OUD-03', stock: 1800, c: P.oud
    },
    {
      id: 'oud-04', code: 'OUD 04', name: 'ROSE & OUD', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 14, rating: 4.9, reviews: 113,     // ⚠ placeholder
      tags: ['oud', 'gifts', 'most-loved'], mood: ['oud', 'floral'], experience: ['night', 'date'],
      oud: {
        origin: 'Blended in Morocco', grade: 'Premium', oudType: 'Rose mukhallat',
        character: 'Taif rose laid over ambered oud smoke',
        aging: 'Rested 45 days',
        usage: 'One stick in the evening, before guests arrive.',
        burning: 'Light, blow out, place in a mabkhara or sand holder.',
        occasions: ['Evening', 'Wedding', 'Gifting']
      },
      sensory: { sweet: 5, woody: 4, smoky: 3, animalic: 1, resinous: 4, earthy: 1 },
      story: "Rose and oud in one stick. The most-gifted weight in the shop, and the one people buy in 100 g.",
      sku: 'OUD-04', stock: 2600, c: P.floral
    },
    {
      id: 'oud-05', code: 'OUD 05', name: 'MUSK BLANC', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 10, rating: 4.7, reviews: 87,      // ⚠ placeholder
      tags: ['oud', 'essentials'], mood: ['musky', 'fresh'], experience: ['everyday', 'day'],
      oud: {
        origin: 'Blended in Morocco', grade: 'Standard', oudType: 'White musk blend',
        character: 'Soft powdered smoke, clean, almost no sweetness',
        aging: 'Rested 30 days',
        usage: 'The one to burn in the morning or in a small flat.',
        burning: 'Light, blow out, stand upright.',
        occasions: ['Morning', 'Everyday', 'Office']
      },
      sensory: { sweet: 2, woody: 2, smoky: 3, animalic: 0, resinous: 2, earthy: 1 },
      story: "Quiet smoke. For people who want the room to smell cared for, not perfumed.",
      sku: 'OUD-05', stock: 5200, c: P.musk
    },
    {
      id: 'oud-06', code: 'OUD 06', name: 'ROYAL NOIR', type: 'oud', subtype: 'Bâtonnets',
      family: 'Oud Sticks', pricePerGram: 22, rating: 5.0, reviews: 41,      // ⚠ placeholder
      tags: ['oud', 'limited'], mood: ['oud', 'amber'], experience: ['statement', 'night'],
      oud: {
        origin: 'Single-batch blend', grade: 'Royal Noir', oudType: 'Aged oud + resins',
        character: 'Deep resin, black honey, long smoke',
        aging: 'Aged 6 months before rolling',
        usage: 'Reserve it. One stick for an evening that matters.',
        burning: 'Light, blow out, burn away from draughts.',
        occasions: ['Special Occasion', 'Eid', 'Gifting']
      },
      sensory: { sweet: 4, woody: 5, smoky: 5, animalic: 3, resinous: 5, earthy: 3 },
      story: "Our densest batch, made twice a year. When it is gone it is gone until the next rolling.",
      sku: 'OUD-06', stock: 900, c: P.night
    }
  ];

  /* COFFRETS — presets for the builder. Contents are chosen by the customer. */
  const coffrets = [
    { id: 'cof-duo', name: 'COFFRET DUO', sub: '2 parfums 50 ML', slots: { parfum: 2 }, blurb: 'Two bottles, one box. The safest gift in the house.', tags: ['gifts', 'bestseller'], c: P.icon },
    { id: 'cof-trio', name: 'LE TRIO', sub: '3 parfums 50 ML · 199 MAD', slots: { parfum: 3 }, flatPrice: 199, hero: true, blurb: 'Three scents you choose, one flat price, delivery included. The way most people start.', tags: ['gifts', 'bestseller'], c: P.floral },
    { id: 'cof-decouverte', name: 'COFFRET DÉCOUVERTE', sub: '3 parfums + 1 diffuseur', slots: { parfum: 3, diffuseur: 1 }, blurb: 'For the skin and for the room. The complete introduction.', tags: ['gifts', 'bestseller'], c: P.woody },
    { id: 'cof-oud', name: 'COFFRET OUD', sub: '1 parfum + 15 g de bâtonnets', slots: { parfum: 1, oud: 15 }, blurb: 'A bottle and a weight of oud. The ritual, boxed.', tags: ['gifts', 'oud'], c: P.oud },
    { id: 'cof-maison', name: 'COFFRET MAISON', sub: '2 diffuseurs + 30 g de bâtonnets', slots: { diffuseur: 2, oud: 30 }, blurb: 'Everything for the house. The housewarming answer.', tags: ['gifts'], c: P.amber },
    { id: 'cof-signature', name: 'COFFRET SIGNATURE', sub: 'composez-le vous-même', slots: {}, custom: true, blurb: 'Up to eight pieces, any mix — perfumes, diffuseurs, oud by the gram.', tags: ['gifts'], c: P.night }
  ];

  const collections = [
    { id: 'icons', name: 'THE ICONS', ar: 'الأيقونات', blurb: 'Signature fragrances. The ones we are known for.', tag: 'icons', c: P.icon },
    { id: 'oriental', name: 'THE ORIENTAL', ar: 'الشرقية', blurb: 'Oud, amber, spice and depth.', tag: 'oriental', c: P.amber },
    { id: 'essentials', name: 'THE ESSENTIALS', ar: 'الأساسيات', blurb: 'Everyday fragrances that never announce themselves.', tag: 'essentials', c: P.fresh },
    { id: 'night', name: 'THE NIGHT JOURNEY', ar: 'رحلة الليل', blurb: 'Powerful evening scents built for cold air.', tag: 'night', c: P.night },
    { id: 'maison', name: 'LA MAISON', ar: 'المنزل', blurb: 'Diffuseurs for every room — 50 ML and three sticks.', tag: 'maison', c: P.woody },
    { id: 'gifts', name: 'THE GIFT EDIT', ar: 'الهدايا', blurb: 'Coffrets, personalised and sent with your words.', tag: 'gifts', c: P.floral }
  ];

  const journal = [
    { id: 'j1', cat: 'GUIDES', title: 'How to choose your signature fragrance', excerpt: 'A signature is not the scent you like most in the shop. It is the one you stop noticing on yourself by the third wearing.', read: 6, c: P.icon },
    { id: 'j2', cat: 'OUD', title: 'How much oud do you actually need?', excerpt: 'Five grams is a week of evenings. A hundred is a season. Here is how to buy by the gram without wasting any.', read: 5, c: P.oud },
    { id: 'j3', cat: 'FRAGRANCE TIPS', title: 'How to make perfume last longer', excerpt: 'Skin chemistry matters less than most people think. Application, storage and fabric matter more.', read: 4, c: P.woody },
    { id: 'j4', cat: 'MOROCCAN HERITAGE', title: 'Oud in Moroccan homes', excerpt: 'Bakhoor in Morocco is hospitality before it is fragrance — the first thing offered and the last thing remembered.', read: 7, c: P.amber },
    { id: 'j5', cat: 'CRAFT', title: 'Why our diffuseur ships with three sticks', excerpt: 'More rattan is not more scent. Three is the number that lasts eight weeks without flooding a room.', read: 4, c: P.musk },
    { id: 'j6', cat: 'INGREDIENTS', title: 'Rose de Taif, from field to flacon', excerpt: 'Picked before sunrise, distilled the same morning. Four tonnes of petals for one kilo of absolute.', read: 9, c: P.floral }
  ];

  const moods = ['Fresh', 'Floral', 'Woody', 'Amber', 'Oud', 'Spicy', 'Gourmand', 'Oriental', 'Musky'];
  const experiences = ['Day', 'Night', 'Date Night', 'Office', 'Summer', 'Winter', 'Statement', 'Signature'];

  const gifting = [
    { id: 'birthday', name: 'Birthday', ar: 'عيد ميلاد' }, { id: 'wedding', name: 'Wedding', ar: 'زفاف' },
    { id: 'anniversary', name: 'Anniversary', ar: 'ذكرى' }, { id: 'eid', name: 'Eid', ar: 'عيد' },
    { id: 'ramadan', name: 'Ramadan', ar: 'رمضان' }, { id: 'housewarming', name: 'Housewarming', ar: 'منزل جديد' },
    { id: 'corporate', name: 'Corporate', ar: 'شركات' }, { id: 'justbecause', name: 'Just Because', ar: 'بدون سبب' }
  ];

  const products = parfums.concat(diffuseurs, ouds);

  return { config, products, parfums, diffuseurs, ouds, coffrets, collections, journal, moods, experiences, gifting };
})();
