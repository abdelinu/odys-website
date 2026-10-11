/* ODYS — trilingual layer (EN · FR · AR).
   The English page is the source of truth: no keys to sprinkle through the markup.
   Three passes, in this order:
     h  — whole innerHTML of a heading/paragraph (for copy that carries <br> or <em>)
     t  — exact text nodes (labels, buttons, chips, stories)
     r  — regex rules for strings that carry numbers ("14 to one free perfume")
   A MutationObserver re-runs the passes on anything the pages render later. */
window.I18N = (function () {
  const LANGS = ['en', 'fr', 'ar'];
  const KEY = 'odys.lang';
  const DICT = { fr: { h: {}, t: {}, r: [] }, ar: { h: {}, t: {}, r: [] } };

  // Morocco first: French is the default, the browser can ask for AR or EN, the
  // customer's own choice always wins.
  let lang = 'fr';
  try {
    const stored = localStorage.getItem(KEY);
    const nav = (navigator.language || '').slice(0, 2).toLowerCase();
    lang = stored || (nav === 'ar' ? 'ar' : 'fr');     // English is opt-in, not the default
  } catch (e) { }
  if (LANGS.indexOf(lang) === -1) lang = 'fr';

  const norm = s => String(s).replace(/[‘’]/g, "'").replace(/ /g, ' ').replace(/\s+/g, ' ').trim();

  function add(l, table) {
    if (!DICT[l]) return;
    ['h', 't'].forEach(k => { if (table[k]) Object.keys(table[k]).forEach(x => DICT[l][k][norm(x)] = table[k][x]); });
    if (table.r) DICT[l].r = DICT[l].r.concat(table.r);
  }

  function tr(s) {
    if (lang === 'en') return s;
    const d = DICT[lang], k = norm(s);
    if (!k) return s;
    if (d.t[k] != null) return d.t[k];
    for (let i = 0; i < d.r.length; i++) {
      const m = k.match(d.r[i][0]);
      if (m) return k.replace(d.r[i][0], d.r[i][1]);
    }
    return s;
  }

  const SKIP = { SCRIPT: 1, STYLE: 1, NOSCRIPT: 1, TEXTAREA: 1, CODE: 1 };
  const BLOCKS = 'h1,h2,h3,h4,h5,p,li,summary,blockquote,figcaption';

  function apply(root) {
    if (lang === 'en') return;
    root = root || document.body;
    if (root === document.body) {
      const t = tr(document.title);
      if (t !== document.title) document.title = t;
    }
    if (!root || root.nodeType !== 1) return;
    const d = DICT[lang];

    // pass 1 — composed headings, matched on their whole innerHTML
    const blocks = root.matches && root.matches(BLOCKS) ? [root] : [];
    Array.prototype.push.apply(blocks, root.querySelectorAll ? root.querySelectorAll(BLOCKS) : []);
    blocks.forEach(el => {
      if (el.dataset.i18nDone === lang) return;
      const html = norm(el.innerHTML);
      if (d.h[html] != null) { el.innerHTML = d.h[html]; el.dataset.i18nDone = lang; }
    });

    // pass 2 — text nodes
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode: n => (n.parentNode && SKIP[n.parentNode.nodeName]) || !norm(n.nodeValue)
        ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT
    });
    const nodes = [];
    for (let n = walk.nextNode(); n; n = walk.nextNode()) nodes.push(n);
    nodes.forEach(n => {
      const out = tr(n.nodeValue);
      if (out !== n.nodeValue) {
        const lead = n.nodeValue.match(/^\s*/)[0], tail = n.nodeValue.match(/\s*$/)[0];
        n.nodeValue = lead + out + tail;
      }
    });

    // pass 3 — attributes people can read
    const attrs = ['placeholder', 'aria-label', 'title', 'alt'];
    const els = root.querySelectorAll ? root.querySelectorAll('[placeholder],[aria-label],[title],[alt]') : [];
    Array.prototype.forEach.call(els, el => attrs.forEach(a => {
      const v = el.getAttribute(a);
      if (v) { const o = tr(v); if (o !== v) el.setAttribute(a, o); }
    }));
  }

  function dress() {
    const html = document.documentElement;
    html.lang = lang;
    html.dir = lang === 'ar' ? 'rtl' : 'ltr';
    html.classList.toggle('lang-ar', lang === 'ar');
    if (lang === 'ar' && !document.getElementById('ar-font')) {
      const l = document.createElement('link');
      l.id = 'ar-font'; l.rel = 'stylesheet';
      // Tajawal for the body, the whole Amiri for headings — the page only carries a letter subset otherwise
      l.href = 'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;300;400;500&family=Amiri:wght@400;700&display=swap';
      document.head.appendChild(l);
    }
  }

  function set(l) {
    if (LANGS.indexOf(l) === -1 || l === lang) return;
    try { localStorage.setItem(KEY, l); } catch (e) { }
    location.reload();   // one reload beats untranslating every string by hand
  }

  let queued = false;
  function schedule() {
    if (queued || lang === 'en') return;
    queued = true;
    // setTimeout, not rAF: rAF is paused in a hidden tab and the page would stay untranslated
    setTimeout(() => { queued = false; apply(document.body); }, 0);
  }

  function start() {
    dress();
    if (lang === 'en') return;
    apply(document.body);
    new MutationObserver(schedule).observe(document.body, { childList: true, subtree: true });
    window.addEventListener('load', schedule);
    setTimeout(schedule, 200);   // belt and braces for late renders
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  return {
    add, apply, set, tr, schedule,
    get lang() { return lang; },
    langs: LANGS,
    labels: { en: 'EN', fr: 'FR', ar: 'ع' }
  };
})();

/* ── UI copy ─────────────────────────────────────────────────────────────── */
I18N.add('fr', {
  h: {
    'Your journey<br>starts <em>here</em>.': 'Votre voyage<br>commence <em>ici</em>.',
    'Find the fragrance<br>that feels like you.': 'Trouvez le parfum<br>qui vous ressemble.',
    'Composez-le.<br>Offrez-le.': 'Composez-le.<br>Offrez-le.',
    'Oud.<br>Sold by<br>the gram.': 'L\'oud.<br>Vendu<br>au gramme.',
    'Every bottle<br>takes you further.': 'Chaque flacon<br>vous rapproche.',
    'Every bottle<br>takes you <em style="font-style:italic;color:var(--accent)">further</em>.': 'Chaque flacon<br>vous <em style="font-style:italic;color:var(--accent)">rapproche</em>.',
    'Diffuseurs.<br>50 ML, trois bâtonnets.': 'Diffuseurs.<br>50 ML, trois bâtonnets.',
    'Six chapters,<br>one journey.': 'Six chapitres,<br>un seul voyage.',
    'Read before<br>you wear.': 'À lire<br>avant de porter.',
    'The more you take,<br>the less each gram costs.': 'Plus vous en prenez,<br>moins le gramme coûte.',
    'Seven steps,<br>then it begins again.': 'Sept étapes,<br>puis tout recommence.',
    'For the people<br>who explain scent<br>to everyone else.': 'Pour celles et ceux<br>qui expliquent le parfum<br>aux autres.',
    'Count it yourself.': 'Faites le calcul.',
    'Two diffuseurs, 30 g d\'oud.': 'Deux diffuseurs, 30 g d\'oud.',
    'A bottle and a weight,<br>in one box.': 'Un flacon et un poids,<br>dans un seul écrin.',
    'Tell us how you want it to smell.': 'Dites-nous ce que vous voulez sentir.',
    'How to burn a stick properly.': 'Comment brûler un bâtonnet.',
    'Three sticks is the number.': 'Trois bâtonnets, pas plus.'
  },
  t: {
    /* chrome */
    'Parfums': 'Parfums', 'Diffuseurs': 'Diffuseurs', 'Oud au gramme': 'Oud au gramme',
    'Coffrets': 'Coffrets', 'Discovery': 'Découverte', 'Rewards': 'Fidélité', 'Journal': 'Journal',
    'Journey': 'Parcours', 'Search': 'Rechercher', 'Wishlist': 'Favoris', 'Account': 'Mon compte', 'Cart': 'Panier',
    'Home': 'Accueil', 'Shop': 'Boutique', 'PTS': 'PTS', 'Skip to content': 'Aller au contenu',
    'Your journey starts here': 'Votre voyage commence ici',
    'Close search': 'Fermer la recherche', 'Close cart': 'Fermer le panier',
    'Your journey': 'Votre voyage', 'The Bag': 'Le panier',
    'Try: something sweet for winter': 'Essayez : quelque chose de sucré pour l\'hiver',
    'Ask in plain language — mood, season, intensity or note': 'Demandez simplement — humeur, saison, intensité ou note',
    'Shop': 'Boutique', 'Maison': 'La maison', 'Care': 'Service',
    'Oud au gramme': 'Oud au gramme', 'Gifting': 'Cadeaux', 'Collections': 'Collections',
    'ODYS Rewards': 'Fidélité ODYS', 'Creator Journey': 'Programme créateurs', 'Referrals': 'Parrainage',
    'Community': 'Communauté', 'Contact': 'Contact', 'Shipping': 'Livraison', 'Returns': 'Retours',
    'FAQ': 'FAQ', 'Privacy': 'Confidentialité', 'Terms': 'CGV',
    'Free perfume at 20 pts': 'Parfum offert à 20 pts',
    'More than a fragrance. It\'s a journey. Parfums 50 ML, diffuseurs and oud by the gram — composed in Morocco.':
      'Plus qu\'un parfum, un voyage. Parfums 50 ML, diffuseurs et oud au gramme — composés au Maroc.',
    'Join the journey': 'Rejoindre le voyage',
    'Prices in MAD · VAT included': 'Prix en MAD · TVA incluse',
    'Nothing yet': 'Rien pour l\'instant',
    'Your journey hasn\'t started': 'Votre voyage n\'a pas commencé',
    'Subtotal': 'Sous-total', 'Shipping': 'Livraison', 'Free': 'Offerte', 'Total': 'Total',
    'Make it a coffret instead': 'Plutôt un coffret ?',
    'No points on diffuseurs': 'Aucun point sur les diffuseurs',
    'All rewards unlocked': 'Toutes les récompenses débloquées',
    'Decrease': 'Diminuer', 'Increase': 'Augmenter', 'Sort': 'Trier',
    'More than a fragrance': 'Plus qu\'un parfum',

    /* home */
    'Discover fragrances created for the stories you haven\'t lived yet — 50 ML parfums, diffuseurs for the house, and oud sold by the gram. Every bottle brings the next one closer.':
      'Des parfums créés pour les histoires que vous n\'avez pas encore vécues — flacons 50 ML, diffuseurs pour la maison et oud vendu au gramme. Chaque flacon rapproche le suivant.',
    'Discover parfums': 'Découvrir les parfums', 'Enter the world of oud': 'Entrer dans l\'univers de l\'oud',
    'Explore by mood': 'Explorer par humeur', 'Explore by experience': 'Explorer par moment',
    'All fragrances': 'Tous les parfums', 'Find your ODYS': 'Trouvez votre ODYS',
    'Discover ODYS': 'Découvrir ODYS', 'The house, in twelve chapters.': 'La maison, en douze chapitres.',
    'Shop all': 'Tout voir',
    'Six batches of bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musk, Royal Noir. Take 5 g or 100 g; the rate falls as the weight rises, and every 5 g is one ODYS point.':
      'Six lots de bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musc, Royal Noir. De 5 g à 100 g : le tarif baisse avec le poids, et chaque 5 g vaut un point ODYS.',
    'commande spéciale': 'commande spéciale',
    'Coffrets personnalisés': 'Coffrets personnalisés', 'Build a coffret': 'Composer un coffret',
    'Personnalisable · pour vous ou en cadeau': 'Personnalisable · pour vous ou en cadeau',
    'The ODYS journey': 'Le voyage ODYS',
    'One 50 ML parfum is one point. Every 5 g of oud is one point. At 20 points you choose any perfume in the house — free. Diffuseurs stay out of it, because 49 MAD is already the floor.':
      'Un parfum 50 ML vaut un point. Chaque 5 g d\'oud vaut un point. À 20 points, vous choisissez le parfum que vous voulez — offert. Les diffuseurs restent hors programme : 49 MAD est déjà le prix plancher.',
    'See the rewards': 'Voir les récompenses', 'La maison': 'La maison', 'All diffuseurs': 'Tous les diffuseurs',
    'The ODYS collections': 'Les collections ODYS', 'Six ways in.': 'Six portes d\'entrée.',
    'All collections': 'Toutes les collections', 'The ODYS community': 'La communauté ODYS',
    'Most loved this month.': 'Les plus aimés ce mois-ci.', 'Trending in Morocco': 'Tendances au Maroc',
    'The journal': 'Le journal', 'All stories': 'Tous les articles', 'Stay on the journey': 'Restez du voyage',
    'New chapters, first.': 'Les nouveaux chapitres, en premier.',
    'Private launches, new oud batches and the occasional letter about how any of this is made. No noise.':
      'Lancements privés, nouveaux lots d\'oud et, de temps en temps, une lettre sur la fabrication. Rien de plus.',
    'Join': 'Rejoindre', 'Email': 'E-mail', 'You are on the list': 'Vous êtes inscrit',
    'par parfum': 'par parfum', 'parfum offert': 'parfum offert',
    'Your next perfume is closer than you think': 'Votre prochain parfum est plus proche que vous ne croyez',
    'ODYS points': 'points ODYS', 'Earn more points': 'Gagner des points',
    'Redeem your reward': 'Utiliser ma récompense', 'Everything unlocked': 'Tout est débloqué',
    'Earn': 'Gagner', 'Redeem': 'Utiliser',
    '50 ML · eau de parfum': '50 ML · eau de parfum',
    '50 ML · 3 bâtonnets rotin': '50 ML · 3 bâtonnets rotin',
    'bâtonnets vendus au gramme': 'bâtonnets vendus au gramme',
    'hors programme points': 'hors programme points',
    'Oud': 'Oud', 'Parfums': 'Parfums',

    /* quiz */
    'What do you want to smell like?': 'Que voulez-vous sentir ?',
    'Pick the world you want to live in.': 'Choisissez l\'univers où vous voulez vivre.',
    'How intense?': 'Quelle intensité ?', 'How much room should it take?': 'Quelle place doit-il prendre ?',
    'When will you wear it?': 'Quand le porterez-vous ?',
    'Be honest — most of us buy for one life and live another.': 'Soyez honnête — on achète souvent pour une vie qu\'on ne mène pas.',
    'Fresh': 'Frais', 'Floral': 'Floral', 'Woody': 'Boisé', 'Amber': 'Ambré', 'Gourmand': 'Gourmand',
    'Spicy': 'Épicé', 'Oriental': 'Oriental', 'Musky': 'Musqué',
    'Soft': 'Doux', 'Balanced': 'Équilibré', 'Powerful': 'Puissant', 'Beast Mode': 'Beast Mode',
    'Close to skin': 'Près de la peau', 'Arm\'s length': 'À bout de bras',
    'Enters before you': 'Entre avant vous', 'Stays on the coat': 'Reste sur le manteau',
    'Everyday': 'Tous les jours', 'Work': 'Au bureau', 'Evening': 'Le soir', 'Special Occasion': 'Grande occasion',
    'Based on your choices, your ODYS is': 'D\'après vos réponses, votre ODYS est',
    'Discover your fragrance': 'Découvrir ce parfum', 'Start over': 'Recommencer',
    'Day': 'Jour', 'Night': 'Nuit', 'Date Night': 'Rendez-vous', 'Office': 'Bureau',
    'Summer': 'Été', 'Winter': 'Hiver', 'Statement': 'Signature forte', 'Signature': 'Signature',

    /* cards & product */
    'Add to journey': 'Ajouter au voyage', 'Choose a weight': 'Choisir un poids',
    'Add to cart': 'Ajouter au panier', 'Add to wishlist': 'Ajouter aux favoris',
    'Saved to wishlist': 'Ajouté aux favoris', 'Saved to wishlist': 'Ajouté aux favoris',
    'The story': 'L\'histoire', 'How it moves.': 'Comment il évolue.',
    'The olfactory journey': 'Le voyage olfactif', 'What fills the room': 'Ce qui remplit la pièce',
    'Scroll slowly. A fragrance is not a smell — it is three of them, arriving in order.':
      'Faites défiler lentement. Un parfum n\'est pas une odeur, mais trois, qui arrivent dans l\'ordre.',
    'Turn the three sticks once a week — that is the whole maintenance.':
      'Retournez les trois bâtonnets une fois par semaine — c\'est tout l\'entretien.',
    'Top': 'Tête', 'Heart': 'Cœur', 'Base': 'Fond',
    'First 15 minutes': 'Les 15 premières minutes', 'Hours one to three': 'De la première à la troisième heure',
    'What stays': 'Ce qui reste',
    'Fragrance profile': 'Profil olfactif', 'Burn profile': 'Profil de combustion',
    'Measured, not promised.': 'Mesuré, pas promis.',
    'Intensity': 'Intensité', 'Longevity': 'Tenue', 'Projection': 'Sillage',
    'Sweetness': 'Sucré', 'Freshness': 'Fraîcheur',
    'Family': 'Famille', 'Gender': 'Genre', 'Season': 'Saison', 'Occasion': 'Occasion',
    'Origin': 'Origine', 'Grade': 'Qualité', 'Type': 'Type', 'Aging': 'Affinage',
    'Format': 'Format', 'Durée': 'Durée', 'Pièce': 'Pièce', 'Famille': 'Famille',
    'Character': 'Caractère', 'Usage': 'Utilisation', 'How to burn': 'Comment le brûler',
    'Occasions': 'Occasions', 'Discover the oud': 'Découvrir l\'oud',
    'Character, not stars.': 'Du caractère, pas des étoiles.',
    'Oud is not better or worse — it is sweeter or smokier, cleaner or wilder. This is where this batch sits.':
      'L\'oud n\'est ni meilleur ni moins bon — il est plus sucré ou plus fumé, plus net ou plus sauvage. Voici où se situe ce lot.',
    'Community': 'Communauté', 'What people say.': 'Ce qu\'en disent les clients.',
    'Write a review': 'Écrire un avis', 'Reviews open once the order is delivered': 'Les avis s\'ouvrent à la livraison',
    'Continue the journey': 'Continuer le voyage', 'Wears well after this.': 'Se porte bien après celui-ci.',
    'In stock': 'En stock', 'Low stock': 'Stock limité',
    'Choose your weight': 'Choisissez votre poids',
    'Special order — any weight': 'Commande spéciale — tout poids',
    'Grams': 'Grammes', 'Request this weight': 'Demander ce poids',
    'Put it in a coffret instead': 'Le mettre dans un coffret',
    'unisex': 'unisexe', 'Unisex': 'Unisexe', 'Feminine': 'Féminin', 'Masculine': 'Masculin',
    'All year': 'Toute l\'année', 'Spring': 'Printemps', 'Autumn': 'Automne',
    'reviews': 'avis',

    /* oud page */
    'Where smoke becomes memory.': 'Là où la fumée devient souvenir.',
    'Bâtonnets vendus au gramme · à partir de 5 g': 'Bâtonnets vendus au gramme · à partir de 5 g',
    'Enter the collection': 'Entrer dans la collection',
    'The oud rooms': 'Les salons de l\'oud',
    'Six batches, one price ladder.': 'Six lots, une seule grille de prix.',
    'The price ladder': 'La grille de prix',
    'Five grams is a week of evenings. A hundred is a season, at the best rate we do. Beyond that it becomes a special order — you tell us the weight, we quote a special price and confirm before shipping.':
      'Cinq grammes, c\'est une semaine de soirées. Cent grammes, c\'est une saison, au meilleur tarif. Au-delà, c\'est une commande spéciale : vous indiquez le poids, nous établissons un tarif spécial et confirmons avant l\'envoi.',
    'Choose a batch': 'Choisir un lot', 'Batch': 'Lot',
    'Or a special weight (grams)': 'Ou un poids spécial (grammes)',
    'Your quote': 'Votre devis', 'Add this weight': 'Ajouter ce poids',
    'Oud is not one scent. Move the sliders and we will find the batch that matches — sweet Cambodi, animalic Hindi, quiet musk.':
      'L\'oud n\'est pas une seule odeur. Déplacez les curseurs et nous trouverons le lot qui vous correspond — Cambodi sucré, Hindi animal, musc discret.',
    'Your oud is': 'Votre oud est', 'The ritual': 'Le rituel',
    'A bâtonnet is not a candle. Most of the scent is lost in the first thirty seconds if you leave the flame on it.':
      'Un bâtonnet n\'est pas une bougie. L\'essentiel du parfum se perd dans les trente premières secondes si vous laissez la flamme.',
    'Light the tip': 'Allumez la pointe', 'Blow it out': 'Soufflez la flamme',
    'Stand it upright': 'Placez-le droit', 'Dress the fabric': 'Parfumez le tissu',
    'Coffret oud': 'Coffret oud',
    'Put a 50 ML parfum and 15 g of bâtonnets in a personalised coffret — for yourself or sent as a gift with your words on the card.':
      'Réunissez un parfum 50 ML et 15 g de bâtonnets dans un coffret personnalisé — pour vous, ou envoyé en cadeau avec vos mots sur la carte.',
    'Build the coffret oud': 'Composer le coffret oud',
    'sweet': 'sucré', 'woody': 'boisé', 'smoky': 'fumé', 'animalic': 'animal', 'resinous': 'résineux', 'earthy': 'terreux',
    'Vendu au gramme': 'Vendu au gramme', 'Prix dégressif': 'Prix dégressif',
    'Commande spéciale': 'Commande spéciale',

    /* diffuseurs */
    'How to use it': 'Comment l\'utiliser',
    'More rattan is not more scent — it is a room you stop noticing and a bottle that empties in three weeks. Three sticks is what we ship because it is what lasts.':
      'Plus de rotin ne veut pas dire plus de parfum : la pièce s\'habitue et le flacon se vide en trois semaines. Nous livrons trois bâtonnets parce que c\'est ce qui dure.',
    'Open and place': 'Ouvrez et posez', 'Insert the three sticks': 'Insérez les trois bâtonnets',
    'Turn them weekly': 'Retournez-les chaque semaine', 'Small room, fewer sticks': 'Petite pièce, moins de bâtonnets',
    'Coffret maison': 'Coffret maison',
    'Build the coffret maison': 'Composer le coffret maison',
    'How points work': 'Comment fonctionnent les points',
    'Diffuseurs sit outside the ODYS point programme — the price is already at its floor.':
      'Les diffuseurs sont hors programme de fidélité — le prix est déjà au plus bas.',
    'Diffuseurs sit outside the point programme — the price is already at its floor.':
      'Les diffuseurs sont hors programme de fidélité — le prix est déjà au plus bas.',

    /* coffrets */
    'Coffrets ODYS': 'Coffrets ODYS',
    'Choose who it is for first — then the box, the contents, the colour and the words on the card. We wrap it and send it wherever it needs to go.':
      'Choisissez d\'abord pour qui — puis l\'écrin, le contenu, la couleur et les mots sur la carte. Nous emballons et expédions où il faut.',
    'Ready-made starting points': 'Des points de départ tout prêts',
    'Or start from one of these.': 'Ou partez de l\'un de ceux-ci.',
    'Gift by occasion': 'Offrir selon l\'occasion',
    'Eight reasons to send one.': 'Huit raisons d\'en envoyer un.',
    '1 · Pour qui ?': '1 · Pour qui ?', '2 · Le coffret': '2 · Le coffret', '3 · Le contenu': '3 · Le contenu',
    '4 · Personnalisation': '4 · Personnalisation', '5 · Livraison du cadeau': '5 · Livraison du cadeau',
    'Pour moi': 'Pour moi', 'C\'est un cadeau': 'C\'est un cadeau',
    'Delivered to my address': 'Livré chez moi', 'Wrapped, no prices, sent to them': 'Emballé, sans prix, envoyé à la personne',
    'Couleur du coffret': 'Couleur du coffret', 'Ruban': 'Ruban',
    'Oud Burgundy': 'Bordeaux oud', 'Warm Ivory': 'Ivoire chaud', 'Deep Black': 'Noir profond',
    'Brass': 'Laiton', 'Smoked Sand': 'Sable fumé', 'No ribbon': 'Sans ruban',
    'Gravure sur la carte (max 20 caractères)': 'Gravure sur la carte (max 20 caractères)',
    'Nom du destinataire': 'Nom du destinataire', 'Téléphone': 'Téléphone',
    'Adresse de livraison': 'Adresse de livraison', 'Date de livraison souhaitée': 'Date de livraison souhaitée',
    'Masquer les prix sur le bon de livraison': 'Masquer les prix sur le bon de livraison',
    'Envoyer directement au destinataire': 'Envoyer directement au destinataire',
    'Votre coffret': 'Votre coffret', 'À composer': 'À composer', 'Cadeau': 'Cadeau',
    'Choisissez d\'abord pour qui': 'Choisissez d\'abord pour qui', 'Rien encore.': 'Rien encore.',
    'Contenu': 'Contenu', 'Écrin + emballage': 'Écrin + emballage',
    'Ajouter au panier': 'Ajouter au panier', 'Complétez le coffret': 'Complétez le coffret',
    'Expédié sous 48h · emballage cadeau inclus': 'Expédié sous 48h · emballage cadeau inclus',
    'Retirer': 'Retirer', 'Reward unlocked': 'Récompense débloquée',

    /* rewards */
    'Every bottle takes you further.': 'Chaque flacon vous rapproche.',
    'No percentages, no tiers to decode. One perfume is one point. Five grams of oud is one point. Twenty points is a perfume you don\'t pay for.':
      'Pas de pourcentages, pas de paliers à décoder. Un parfum vaut un point. Cinq grammes d\'oud valent un point. Vingt points valent un parfum que vous ne payez pas.',
    'How you earn': 'Comment gagner des points', 'Three rules, that\'s all.': 'Trois règles, c\'est tout.',
    'Par parfum 50 ML': 'Par parfum 50 ML', 'Diffuseurs': 'Diffuseurs',
    'The redemption ladder': 'L\'échelle des récompenses',
    'Nothing is redeemable below 20 points, and nothing expires while you are still buying.':
      'Rien n\'est utilisable en dessous de 20 points, et rien n\'expire tant que vous commandez.',
    'How fast is it, really?': 'À quelle vitesse, vraiment ?',
    'Move the numbers. This is the same maths the till uses — diffuseurs are deliberately absent, because they earn nothing.':
      'Déplacez les curseurs. C\'est le calcul exact de la caisse — les diffuseurs sont volontairement absents, ils ne rapportent rien.',
    'points on this basket': 'points pour ce panier',
    'The reward journey': 'Le parcours de fidélité',
    'Nobody finishes — they start another journey with a perfume they did not pay for, or a coffret they send to someone else.':
      'Personne ne termine : on repart pour un tour avec un parfum offert, ou un coffret envoyé à quelqu\'un d\'autre.',
    'Begin': 'Commencer', 'Discover': 'Découvrir', 'Experience': 'Expérimenter', 'Collect': 'Collectionner',
    'Continue': 'Continuer', 'Your balance': 'Votre solde',
    'Redeem now': 'Utiliser maintenant', 'See the ladder': 'Voir l\'échelle', 'Earn a point': 'Gagner un point',
    'Your points history': 'Votre historique',
    'ODYS Creator Journey': 'Programme créateurs ODYS',
    'Reviewers, micro-influencers, oud obsessives. Every piece of content moves you up a tier — and the tiers are worth having.':
      'Testeurs, micro-influenceurs, passionnés d\'oud. Chaque contenu vous fait monter d\'un palier — et les paliers en valent la peine.',
    'Become an ODYS creator': 'Devenir créateur ODYS', 'Name': 'Nom', 'Main platform': 'Plateforme principale',
    'Profile link': 'Lien du profil', 'Audience size': 'Taille de l\'audience', 'Why ODYS?': 'Pourquoi ODYS ?',
    'Apply': 'Postuler', 'Tell us what you would make.': 'Dites-nous ce que vous feriez.',
    'We answer every application within five working days.': 'Nous répondons à chaque candidature sous cinq jours ouvrés.',
    'Application received': 'Candidature reçue', 'Welcome to the waiting room.': 'Bienvenue dans la salle d\'attente.',
    'Share the journey': 'Partagez le voyage', 'Bring someone with you.': 'Emmenez quelqu\'un avec vous.',
    'Points when they join': 'Points à son inscription', 'Points on their first order': 'Points à sa première commande',
    'For them': 'Pour elle ou lui', 'Your referral link': 'Votre lien de parrainage',
    'The fine print, in plain words': 'Les petites lignes, en clair',
    'Do diffuseurs earn points?': 'Les diffuseurs rapportent-ils des points ?',
    'How is oud counted?': 'Comment l\'oud est-il compté ?',
    'Do points expire?': 'Les points expirent-ils ?',
    'Can I use points as a discount instead?': 'Puis-je utiliser mes points comme remise ?',
    'What if I return something?': 'Et si je retourne un article ?',
    'Can I gift my reward?': 'Puis-je offrir ma récompense ?',
    'One free perfume': 'Un parfum offert', 'Three free perfumes': 'Trois parfums offerts',
    'A custom coffret to gift': 'Un coffret personnalisé à offrir',
    'Any 50 ML in the house': 'N\'importe quel 50 ML de la maison',
    'Choose any three 50 ML': 'Trois parfums 50 ML au choix',
    'Compose it yourself · up to 5 pieces · gift-wrapped and sent': 'Composez-le · jusqu\'à 5 pièces · emballé et envoyé',

    /* cart & checkout */
    'The bag is empty.': 'Le panier est vide.',
    'Complete your journey': 'Complétez votre voyage', 'Summary': 'Récapitulatif',
    'Rewards applied': 'Récompenses appliquées', 'Use my rewards': 'Utiliser mes récompenses',
    'Add an eligible item to use it': 'Ajoutez un article éligible pour l\'utiliser',
    'Checkout': 'Commander', 'Where does it go?': 'Où l\'envoyons-nous ?',
    'First name': 'Prénom', 'Last name': 'Nom', 'Phone': 'Téléphone', 'Address': 'Adresse', 'City': 'Ville',
    'Payment': 'Paiement', 'Cash on delivery': 'Paiement à la livraison', 'Card': 'Carte',
    'Bank transfer': 'Virement bancaire',
    'Cash on delivery, card or bank transfer · 24–72h across Morocco':
      'Paiement à la livraison, carte ou virement · 24–72h partout au Maroc',
    'Chapter added': 'Chapitre ajouté', 'Thank you.': 'Merci.', 'Track this order': 'Suivre la commande',
    'Keep going': 'Continuer', 'no points': 'sans point',

    /* account */
    'Welcome back': 'Bon retour', 'Start your journey.': 'Commencez votre voyage.',
    'Create account': 'Créer mon compte', 'Overview': 'Aperçu', 'My Orders': 'Mes commandes',
    'My Rewards': 'Mes récompenses', 'My Fragrances': 'Mes parfums', 'Points History': 'Historique des points',
    'Fragrance Profile': 'Profil olfactif', 'Redeem rewards': 'Utiliser mes récompenses',
    'Parfums acquis': 'Parfums acquis', 'Oud cumulé': 'Oud cumulé', 'Rewards redeemed': 'Récompenses utilisées',
    'Next steps': 'Prochaines étapes', 'Complete your fragrance profile': 'Complétez votre profil olfactif',
    'better recommendations': 'meilleures recommandations', 'Add 5 g of oud': 'Ajouter 5 g d\'oud',
    'for you or as a gift': 'pour vous ou en cadeau', 'Invite a friend': 'Inviter un ami',
    'No orders yet': 'Aucune commande', 'Ready to use': 'Prêt à utiliser', 'Build it': 'Le composer',
    'Choose it': 'Le choisir', 'Nothing saved yet': 'Rien d\'enregistré',
    'Your collection is empty': 'Votre collection est vide', 'Start collecting': 'Commencer la collection',
    'Browse parfums': 'Voir les parfums', 'No movement yet': 'Aucun mouvement',
    'Earn your first point': 'Gagnez votre premier point', 'Copy': 'Copier',
    'Referral link copied': 'Lien de parrainage copié', 'Simulate an invite (demo)': 'Simuler une invitation (démo)',
    'Not built yet.': 'Pas encore créé.', 'Build my profile': 'Créer mon profil', 'Retake the quiz': 'Refaire le test',
    'Demo build — your account lives in this browser only, nothing is sent anywhere.':
      'Version démo — votre compte reste dans ce navigateur, rien n\'est envoyé.',

    /* shop / discover / collections / journal */
    'The parfums.': 'Les parfums.', 'Clear filters': 'Effacer les filtres',
    'Not sure where to start?': 'Vous ne savez pas par où commencer ?',
    'Three questions. One fragrance.': 'Trois questions. Un parfum.',
    'Ask in plain language': 'Demandez simplement',
    'Search the way you actually think.': 'Cherchez comme vous pensez.',
    'Nine worlds.': 'Neuf univers.', 'Still undecided?': 'Toujours indécis ?',
    'Take two, not one.': 'Prenez-en deux, pas un.',
    'Build a coffret duo': 'Composer un coffret duo',
    'Six chapters, one journey.': 'Six chapitres, un seul voyage.',
    'Read before you wear.': 'À lire avant de porter.',
    'What Morocco is wearing.': 'Ce que le Maroc porte.',
    'Add your voice': 'Ajoutez votre voix',
    'Review your collection': 'Noter ma collection',
    'min read': 'min de lecture',
    'ODYS stories': 'Histoires ODYS',
    'Where does your fragrance live?': 'Où vit votre parfum ?'
  },
  r: [
    [/^(\d+) chapters? in the bag\.$/, '$1 chapitres dans le panier.'],
    [/^You'll earn (\d+) points?$/, 'Vous gagnerez $1 points'],
    [/^(\d+) to one free perfume$/, '$1 pour un parfum offert'],
    [/^(\d+) to three free perfumes$/, '$1 pour trois parfums offerts'],
    [/^(\d+) to a custom coffret to gift$/, '$1 pour un coffret à offrir'],
    [/^(\d+) points? to go$/, 'encore $1 points'],
    [/^(\d+) points? away$/, 'encore $1 points'],
    [/^(\d+) to go$/, 'encore $1'],
    [/^Earn (\d+) points? with (\d+) g$/, 'Gagnez $1 points avec $2 g'],
    [/^Earn 1 point per (\d+) g$/, '1 point tous les $1 g'],
    [/^Earn (\d+) point — (\d+) points is a free perfume$/, 'Gagnez $1 point — $2 points, un parfum offert'],
    [/^\+(\d+) pts?$/, '+$1 pts'],
    [/^(\d+) fragrances?$/, '$1 parfums'],
    [/^Added to journey — (.+)$/, 'Ajouté au voyage — $1'],
    [/^Step (\d+) of (\d+)$/, 'Étape $1 sur $2'],
    [/^Free shipping from (.+)$/, 'Livraison offerte dès $1'],
    [/^Your journey starts here$/, 'Votre voyage commence ici']
  ]
});

I18N.add('ar', {
  h: {
    'Your journey<br>starts <em>here</em>.': 'رحلتك<br>تبدأ <em>هنا</em>.',
    'Find the fragrance<br>that feels like you.': 'اعثر على العطر<br>الذي يشبهك.',
    'Composez-le.<br>Offrez-le.': 'اصنعه.<br>أهْدِه.',
    'Oud.<br>Sold by<br>the gram.': 'العود.<br>يُباع<br>بالغرام.',
    'Every bottle<br>takes you further.': 'كل قارورة<br>تقرّبك أكثر.',
    'Every bottle<br>takes you <em style="font-style:italic;color:var(--accent)">further</em>.': 'كل قارورة<br><em style="font-style:italic;color:var(--accent)">تقرّبك</em> أكثر.',
    'Diffuseurs.<br>50 ML, trois bâtonnets.': 'مبخّرات المنزل.<br>50 مل وثلاثة أعواد.',
    'Six chapters,<br>one journey.': 'ستة فصول،<br>رحلة واحدة.',
    'Read before<br>you wear.': 'اقرأ قبل<br>أن تتعطّر.',
    'The more you take,<br>the less each gram costs.': 'كلما زاد الوزن،<br>انخفض سعر الغرام.',
    'Seven steps,<br>then it begins again.': 'سبع خطوات،<br>ثم تبدأ من جديد.',
    'For the people<br>who explain scent<br>to everyone else.': 'لمن يشرحون<br>العطر<br>للآخرين.',
    'Count it yourself.': 'احسبها بنفسك.',
    'Two diffuseurs, 30 g d\'oud.': 'مبخّرتان و30 غرامًا من العود.',
    'A bottle and a weight,<br>in one box.': 'قارورة ووزن من العود<br>في علبة واحدة.',
    'Tell us how you want it to smell.': 'قل لنا كيف تريد رائحته.',
    'How to burn a stick properly.': 'كيف تُحرق العود كما ينبغي.',
    'Three sticks is the number.': 'ثلاثة أعواد، لا أكثر.'
  },
  t: {
    /* chrome */
    'Parfums': 'العطور', 'Diffuseurs': 'مبخّرات المنزل', 'Oud au gramme': 'العود بالغرام',
    'Coffrets': 'العلب الفاخرة', 'Discovery': 'الاكتشاف', 'Rewards': 'المكافآت', 'Journal': 'المجلة',
    'Journey': 'الرحلة', 'Search': 'بحث', 'Wishlist': 'المفضّلة', 'Account': 'حسابي', 'Cart': 'السلة',
    'Home': 'الرئيسية', 'Shop': 'المتجر', 'PTS': 'نقطة', 'Skip to content': 'انتقل إلى المحتوى',
    'Your journey starts here': 'رحلتك تبدأ هنا',
    'Close search': 'إغلاق البحث', 'Close cart': 'إغلاق السلة',
    'Your journey': 'رحلتك', 'The Bag': 'السلة',
    'Try: something sweet for winter': 'جرّب: شيء حلو للشتاء',
    'Ask in plain language — mood, season, intensity or note': 'اسأل بلغتك — المزاج، الموسم، القوة أو المكوّن',
    'Maison': 'الدار', 'Care': 'الخدمة', 'Gifting': 'الهدايا', 'Collections': 'المجموعات',
    'ODYS Rewards': 'مكافآت أوديس', 'Creator Journey': 'برنامج صنّاع المحتوى', 'Referrals': 'الإحالة',
    'Community': 'المجتمع', 'Contact': 'اتصل بنا', 'Shipping': 'الشحن', 'Returns': 'الإرجاع',
    'FAQ': 'أسئلة شائعة', 'Privacy': 'الخصوصية', 'Terms': 'الشروط',
    'Free perfume at 20 pts': 'عطر مجاني عند 20 نقطة',
    'More than a fragrance. It\'s a journey. Parfums 50 ML, diffuseurs and oud by the gram — composed in Morocco.':
      'أكثر من عطر، إنها رحلة. عطور 50 مل، مبخّرات للمنزل وعود يُباع بالغرام — من المغرب.',
    'Join the journey': 'انضم إلى الرحلة',
    'Prices in MAD · VAT included': 'الأسعار بالدرهم · شاملة الضريبة',
    'Nothing yet': 'لا شيء بعد',
    'Your journey hasn\'t started': 'رحلتك لم تبدأ بعد',
    'Subtotal': 'المجموع الفرعي', 'Shipping': 'الشحن', 'Free': 'مجاني', 'Total': 'الإجمالي',
    'Make it a coffret instead': 'اجعلها علبة هدية',
    'No points on diffuseurs': 'لا نقاط على المبخّرات',
    'All rewards unlocked': 'كل المكافآت مفتوحة',
    'Decrease': 'إنقاص', 'Increase': 'زيادة', 'Sort': 'ترتيب',
    'More than a fragrance': 'أكثر من عطر',

    /* home */
    'Discover fragrances created for the stories you haven\'t lived yet — 50 ML parfums, diffuseurs for the house, and oud sold by the gram. Every bottle brings the next one closer.':
      'عطور صُنعت للحكايات التي لم تعشها بعد — قوارير 50 مل، مبخّرات للمنزل، وعود يُباع بالغرام. كل قارورة تقرّبك من التالية.',
    'Discover parfums': 'اكتشف العطور', 'Enter the world of oud': 'ادخل عالم العود',
    'Explore by mood': 'تصفّح حسب المزاج', 'Explore by experience': 'تصفّح حسب المناسبة',
    'All fragrances': 'كل العطور', 'Find your ODYS': 'اعثر على أوديس الخاص بك',
    'Discover ODYS': 'اكتشف أوديس', 'The house, in twelve chapters.': 'الدار، في اثني عشر فصلاً.',
    'Shop all': 'عرض الكل',
    'Six batches of bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musk, Royal Noir. Take 5 g or 100 g; the rate falls as the weight rises, and every 5 g is one ODYS point.':
      'ستة أنواع من أعواد العود — ملكي، كمبودي، هندي، ورد وعود، مسك، ملكي أسود. من 5 غرامات إلى 100: يقل السعر كلما زاد الوزن، وكل 5 غرامات تساوي نقطة.',
    'commande spéciale': 'طلب خاص',
    'Coffrets personnalisés': 'علب مخصّصة', 'Build a coffret': 'اصنع علبتك',
    'Personnalisable · pour vous ou en cadeau': 'قابلة للتخصيص · لك أو هدية',
    'The ODYS journey': 'رحلة أوديس',
    'One 50 ML parfum is one point. Every 5 g of oud is one point. At 20 points you choose any perfume in the house — free. Diffuseurs stay out of it, because 49 MAD is already the floor.':
      'كل عطر 50 مل يساوي نقطة. كل 5 غرامات من العود تساوي نقطة. عند 20 نقطة تختار أي عطر مجانًا. المبخّرات خارج البرنامج لأن 49 درهمًا هو السعر الأدنى أصلاً.',
    'See the rewards': 'اطّلع على المكافآت', 'La maison': 'الدار', 'All diffuseurs': 'كل المبخّرات',
    'The ODYS collections': 'مجموعات أوديس', 'Six ways in.': 'ستة أبواب للدخول.',
    'All collections': 'كل المجموعات', 'The ODYS community': 'مجتمع أوديس',
    'Most loved this month.': 'الأكثر محبة هذا الشهر.', 'Trending in Morocco': 'الأكثر رواجًا في المغرب',
    'The journal': 'المجلة', 'All stories': 'كل المقالات', 'Stay on the journey': 'ابقَ في الرحلة',
    'New chapters, first.': 'الفصول الجديدة أولاً.',
    'Private launches, new oud batches and the occasional letter about how any of this is made. No noise.':
      'إطلاقات خاصة، دفعات عود جديدة، ورسالة من حين لآخر عن طريقة الصناعة. بلا ضجيج.',
    'Join': 'اشترك', 'Email': 'البريد الإلكتروني', 'You are on the list': 'تم تسجيلك',
    'par parfum': 'لكل عطر', 'parfum offert': 'عطر مجاني',
    'Your next perfume is closer than you think': 'عطرك القادم أقرب مما تظن',
    'ODYS points': 'نقاط أوديس', 'Earn more points': 'اجمع نقاطًا أكثر',
    'Redeem your reward': 'استبدل مكافأتك', 'Everything unlocked': 'كل شيء مفتوح',
    'Earn': 'اجمع', 'Redeem': 'استبدل',
    '50 ML · eau de parfum': '50 مل · عطر',
    '50 ML · 3 bâtonnets rotin': '50 مل · 3 أعواد روطان',
    'bâtonnets vendus au gramme': 'أعواد تُباع بالغرام',
    'hors programme points': 'خارج برنامج النقاط',
    'Oud': 'العود',

    /* quiz */
    'What do you want to smell like?': 'كيف تريد أن تكون رائحتك؟',
    'Pick the world you want to live in.': 'اختر العالم الذي تريد أن تعيش فيه.',
    'How intense?': 'ما مدى القوة؟', 'How much room should it take?': 'كم من المساحة يأخذ؟',
    'When will you wear it?': 'متى ستضعه؟',
    'Be honest — most of us buy for one life and live another.': 'كن صادقًا — كثيرون يشترون لحياة لا يعيشونها.',
    'Fresh': 'منعش', 'Floral': 'زهري', 'Woody': 'خشبي', 'Amber': 'عنبري', 'Gourmand': 'حلو',
    'Spicy': 'حار', 'Oriental': 'شرقي', 'Musky': 'مسكي',
    'Soft': 'هادئ', 'Balanced': 'متوازن', 'Powerful': 'قوي', 'Beast Mode': 'قوة قصوى',
    'Close to skin': 'قريب من الجلد', 'Arm\'s length': 'على بُعد ذراع',
    'Enters before you': 'يسبقك إلى الغرفة', 'Stays on the coat': 'يبقى على المعطف',
    'Everyday': 'كل يوم', 'Work': 'العمل', 'Evening': 'المساء', 'Special Occasion': 'مناسبة خاصة',
    'Based on your choices, your ODYS is': 'بناءً على اختياراتك، أوديس الخاص بك هو',
    'Discover your fragrance': 'اكتشف عطرك', 'Start over': 'ابدأ من جديد',
    'Day': 'نهار', 'Night': 'ليل', 'Date Night': 'موعد', 'Office': 'المكتب',
    'Summer': 'الصيف', 'Winter': 'الشتاء', 'Statement': 'حضور قوي', 'Signature': 'توقيع',

    /* cards & product */
    'Add to journey': 'أضف إلى الرحلة', 'Choose a weight': 'اختر الوزن',
    'Add to cart': 'أضف إلى السلة', 'Add to wishlist': 'أضف إلى المفضّلة',
    'Saved to wishlist': 'أُضيف إلى المفضّلة',
    'The story': 'الحكاية', 'How it moves.': 'كيف يتحوّل.',
    'The olfactory journey': 'الرحلة العطرية', 'What fills the room': 'ما يملأ الغرفة',
    'Scroll slowly. A fragrance is not a smell — it is three of them, arriving in order.':
      'تمهّل. العطر ليس رائحة واحدة بل ثلاث، تصل واحدة تلو الأخرى.',
    'Turn the three sticks once a week — that is the whole maintenance.':
      'اقلب الأعواد الثلاثة مرة في الأسبوع — هذه كل العناية المطلوبة.',
    'Top': 'المقدمة', 'Heart': 'القلب', 'Base': 'القاعدة',
    'First 15 minutes': 'أول 15 دقيقة', 'Hours one to three': 'من الساعة الأولى إلى الثالثة',
    'What stays': 'ما يبقى',
    'Fragrance profile': 'بصمة العطر', 'Burn profile': 'بصمة الحرق',
    'Measured, not promised.': 'مقاسة، لا موعودة.',
    'Intensity': 'القوة', 'Longevity': 'الثبات', 'Projection': 'الفوحان',
    'Sweetness': 'الحلاوة', 'Freshness': 'الانتعاش',
    'Family': 'العائلة', 'Gender': 'الفئة', 'Season': 'الموسم', 'Occasion': 'المناسبة',
    'Origin': 'المصدر', 'Grade': 'الجودة', 'Type': 'النوع', 'Aging': 'التعتيق',
    'Format': 'الحجم', 'Durée': 'المدة', 'Pièce': 'الغرفة', 'Famille': 'العائلة',
    'Character': 'الطابع', 'Usage': 'الاستعمال', 'How to burn': 'طريقة الحرق',
    'Occasions': 'المناسبات', 'Discover the oud': 'اكتشف العود',
    'Character, not stars.': 'طابع، لا نجوم.',
    'Oud is not better or worse — it is sweeter or smokier, cleaner or wilder. This is where this batch sits.':
      'العود ليس أفضل أو أسوأ — بل أحلى أو أكثر دخانًا، أنظف أو أكثر برّية. هنا يقع هذا اللوت.',
    'Community': 'المجتمع', 'What people say.': 'ماذا يقول الناس.',
    'Write a review': 'اكتب رأيك', 'Reviews open once the order is delivered': 'يمكن كتابة الرأي بعد التوصيل',
    'Continue the journey': 'واصل الرحلة', 'Wears well after this.': 'يليق بعد هذا العطر.',
    'In stock': 'متوفر', 'Low stock': 'الكمية محدودة',
    'Choose your weight': 'اختر وزنك',
    'Special order — any weight': 'طلب خاص — أي وزن',
    'Grams': 'غرامات', 'Request this weight': 'اطلب هذا الوزن',
    'Put it in a coffret instead': 'ضعه في علبة هدية',
    'Unisex': 'للجنسين', 'Feminine': 'نسائي', 'Masculine': 'رجالي',
    'All year': 'طوال السنة', 'Spring': 'الربيع', 'Autumn': 'الخريف',
    'reviews': 'تقييم',

    /* oud page */
    'Where smoke becomes memory.': 'حيث يصير الدخان ذكرى.',
    'Bâtonnets vendus au gramme · à partir de 5 g': 'أعواد تُباع بالغرام · ابتداءً من 5 غ',
    'Enter the collection': 'ادخل المجموعة',
    'The oud rooms': 'غرف العود',
    'Six batches, one price ladder.': 'ستة أنواع، جدول أسعار واحد.',
    'The price ladder': 'جدول الأسعار',
    'Five grams is a week of evenings. A hundred is a season, at the best rate we do. Beyond that it becomes a special order — you tell us the weight, we quote a special price and confirm before shipping.':
      'خمسة غرامات تكفي أسبوعًا من الأمسيات، ومئة غرام تكفي موسمًا بأفضل سعر. وما فوق ذلك طلب خاص: تخبرنا بالوزن، ونحدد سعرًا خاصًا ونؤكده قبل الشحن.',
    'Choose a batch': 'اختر النوع', 'Batch': 'النوع',
    'Or a special weight (grams)': 'أو وزن خاص (بالغرام)',
    'Your quote': 'عرض السعر', 'Add this weight': 'أضف هذا الوزن',
    'Oud is not one scent. Move the sliders and we will find the batch that matches — sweet Cambodi, animalic Hindi, quiet musk.':
      'العود ليس رائحة واحدة. حرّك المؤشرات ونجد لك النوع المناسب — كمبودي حلو، هندي قوي، أو مسك هادئ.',
    'Your oud is': 'عودك هو', 'The ritual': 'الطقس',
    'A bâtonnet is not a candle. Most of the scent is lost in the first thirty seconds if you leave the flame on it.':
      'العود ليس شمعة. معظم الرائحة تضيع في أول ثلاثين ثانية إن تركت اللهب مشتعلاً.',
    'Light the tip': 'أشعل الطرف', 'Blow it out': 'أطفئ اللهب',
    'Stand it upright': 'ثبّته عموديًا', 'Dress the fabric': 'بخّر الثياب',
    'Coffret oud': 'علبة العود',
    'Put a 50 ML parfum and 15 g of bâtonnets in a personalised coffret — for yourself or sent as a gift with your words on the card.':
      'اجمع عطر 50 مل و15 غرامًا من الأعواد في علبة مخصّصة — لك أو هدية مع كلماتك على البطاقة.',
    'Build the coffret oud': 'اصنع علبة العود',
    'sweet': 'حلو', 'woody': 'خشبي', 'smoky': 'دخاني', 'animalic': 'حيواني', 'resinous': 'راتنجي', 'earthy': 'ترابي',
    'Vendu au gramme': 'يُباع بالغرام', 'Prix dégressif': 'سعر تنازلي',
    'Commande spéciale': 'طلب خاص',

    /* diffuseurs */
    'How to use it': 'طريقة الاستعمال',
    'More rattan is not more scent — it is a room you stop noticing and a bottle that empties in three weeks. Three sticks is what we ship because it is what lasts.':
      'زيادة الأعواد لا تعني رائحة أقوى، بل غرفة تعتاد الرائحة وقارورة تفرغ في ثلاثة أسابيع. نرسل ثلاثة أعواد لأنها الأطول عمرًا.',
    'Open and place': 'افتح وضع القارورة', 'Insert the three sticks': 'أدخل الأعواد الثلاثة',
    'Turn them weekly': 'اقلبها أسبوعيًا', 'Small room, fewer sticks': 'غرفة صغيرة، أعواد أقل',
    'Coffret maison': 'علبة الدار',
    'Build the coffret maison': 'اصنع علبة الدار',
    'How points work': 'كيف تعمل النقاط',
    'Diffuseurs sit outside the ODYS point programme — the price is already at its floor.':
      'المبخّرات خارج برنامج النقاط — السعر في أدنى حدوده أصلاً.',
    'Diffuseurs sit outside the point programme — the price is already at its floor.':
      'المبخّرات خارج برنامج النقاط — السعر في أدنى حدوده أصلاً.',

    /* coffrets */
    'Coffrets ODYS': 'علب أوديس',
    'Choose who it is for first — then the box, the contents, the colour and the words on the card. We wrap it and send it wherever it needs to go.':
      'اختر أولاً لمن هي — ثم العلبة والمحتوى واللون والكلمات على البطاقة. نغلّفها ونرسلها حيث تريد.',
    'Ready-made starting points': 'نقاط انطلاق جاهزة',
    'Or start from one of these.': 'أو ابدأ من إحدى هذه.',
    'Gift by occasion': 'أهدِ حسب المناسبة',
    'Eight reasons to send one.': 'ثمانية أسباب لإرسال واحدة.',
    '1 · Pour qui ?': '1 · لمن هي؟', '2 · Le coffret': '2 · العلبة', '3 · Le contenu': '3 · المحتوى',
    '4 · Personnalisation': '4 · التخصيص', '5 · Livraison du cadeau': '5 · توصيل الهدية',
    'Pour moi': 'لي أنا', 'C\'est un cadeau': 'إنها هدية',
    'Delivered to my address': 'تُسلَّم إلى عنواني', 'Wrapped, no prices, sent to them': 'مغلّفة، بلا أسعار، تُرسل إليه',
    'Couleur du coffret': 'لون العلبة', 'Ruban': 'الشريط',
    'Oud Burgundy': 'عنابي', 'Warm Ivory': 'عاجي دافئ', 'Deep Black': 'أسود عميق',
    'Brass': 'نحاسي', 'Smoked Sand': 'رملي مدخّن', 'No ribbon': 'بدون شريط',
    'Gravure sur la carte (max 20 caractères)': 'نقش على البطاقة (20 حرفًا كحد أقصى)',
    'Nom du destinataire': 'اسم المستلم', 'Téléphone': 'الهاتف',
    'Adresse de livraison': 'عنوان التوصيل', 'Date de livraison souhaitée': 'تاريخ التوصيل المطلوب',
    'Masquer les prix sur le bon de livraison': 'إخفاء الأسعار في وصل التسليم',
    'Envoyer directement au destinataire': 'الإرسال مباشرة إلى المستلم',
    'Votre coffret': 'علبتك', 'À composer': 'بانتظار التكوين', 'Cadeau': 'هدية',
    'Choisissez d\'abord pour qui': 'اختر أولاً لمن هي', 'Rien encore.': 'لا شيء بعد.',
    'Contenu': 'المحتوى', 'Écrin + emballage': 'العلبة والتغليف',
    'Ajouter au panier': 'أضف إلى السلة', 'Complétez le coffret': 'أكمل العلبة',
    'Expédié sous 48h · emballage cadeau inclus': 'يُشحن خلال 48 ساعة · التغليف مجاني',
    'Retirer': 'إزالة', 'Reward unlocked': 'مكافأة مفتوحة',

    /* rewards */
    'Every bottle takes you further.': 'كل قارورة تقرّبك أكثر.',
    'No percentages, no tiers to decode. One perfume is one point. Five grams of oud is one point. Twenty points is a perfume you don\'t pay for.':
      'لا نسب مئوية ولا مستويات معقّدة. عطر واحد = نقطة. خمسة غرامات عود = نقطة. عشرون نقطة = عطر لا تدفع ثمنه.',
    'How you earn': 'كيف تجمع النقاط', 'Three rules, that\'s all.': 'ثلاث قواعد فقط.',
    'Par parfum 50 ML': 'لكل عطر 50 مل',
    'The redemption ladder': 'سلّم المكافآت',
    'Nothing is redeemable below 20 points, and nothing expires while you are still buying.':
      'لا استبدال تحت 20 نقطة، ولا شيء ينتهي ما دمت تشتري.',
    'How fast is it, really?': 'كم يستغرق الأمر فعلاً؟',
    'Move the numbers. This is the same maths the till uses — diffuseurs are deliberately absent, because they earn nothing.':
      'حرّك الأرقام. هذه هي نفس حسابات الصندوق — المبخّرات غائبة عمدًا لأنها لا تمنح نقاطًا.',
    'points on this basket': 'نقطة لهذه السلة',
    'The reward journey': 'رحلة المكافآت',
    'Nobody finishes — they start another journey with a perfume they did not pay for, or a coffret they send to someone else.':
      'لا أحد ينتهي — الجميع يبدأ رحلة جديدة بعطر مجاني أو علبة يرسلها إلى شخص آخر.',
    'Begin': 'البداية', 'Discover': 'الاكتشاف', 'Experience': 'التجربة', 'Collect': 'الجمع',
    'Continue': 'المواصلة', 'Your balance': 'رصيدك',
    'Redeem now': 'استبدل الآن', 'See the ladder': 'اطّلع على السلّم', 'Earn a point': 'اجمع نقطة',
    'Your points history': 'سجل نقاطك',
    'ODYS Creator Journey': 'برنامج صنّاع محتوى أوديس',
    'Reviewers, micro-influencers, oud obsessives. Every piece of content moves you up a tier — and the tiers are worth having.':
      'مراجعون، صنّاع محتوى، وعشّاق عود. كل محتوى يرفعك مستوى — والمستويات تستحق.',
    'Become an ODYS creator': 'كن من صنّاع أوديس', 'Name': 'الاسم', 'Main platform': 'المنصة الأساسية',
    'Profile link': 'رابط الحساب', 'Audience size': 'حجم المتابعين', 'Why ODYS?': 'لماذا أوديس؟',
    'Apply': 'قدّم طلبك', 'Tell us what you would make.': 'أخبرنا بما ستصنعه.',
    'We answer every application within five working days.': 'نجيب كل طلب خلال خمسة أيام عمل.',
    'Application received': 'تم استلام الطلب', 'Welcome to the waiting room.': 'أهلاً بك في قائمة الانتظار.',
    'Share the journey': 'شارك الرحلة', 'Bring someone with you.': 'خذ أحدهم معك.',
    'Points when they join': 'نقاط عند تسجيله', 'Points on their first order': 'نقاط عند أول طلب له',
    'For them': 'له', 'Your referral link': 'رابط الإحالة الخاص بك',
    'The fine print, in plain words': 'التفاصيل، بوضوح',
    'Do diffuseurs earn points?': 'هل تمنح المبخّرات نقاطًا؟',
    'How is oud counted?': 'كيف تُحتسب نقاط العود؟',
    'Do points expire?': 'هل تنتهي صلاحية النقاط؟',
    'Can I use points as a discount instead?': 'هل يمكن استعمال النقاط كتخفيض؟',
    'What if I return something?': 'وإن أرجعت منتجًا؟',
    'Can I gift my reward?': 'هل يمكنني إهداء مكافأتي؟',
    'One free perfume': 'عطر مجاني', 'Three free perfumes': 'ثلاثة عطور مجانية',
    'A custom coffret to gift': 'علبة مخصّصة للإهداء',
    'Any 50 ML in the house': 'أي عطر 50 مل من الدار',
    'Choose any three 50 ML': 'ثلاثة عطور 50 مل من اختيارك',
    'Compose it yourself · up to 5 pieces · gift-wrapped and sent': 'تصنعها بنفسك · حتى 5 قطع · مغلّفة ومُرسلة',

    /* cart & checkout */
    'The bag is empty.': 'السلة فارغة.',
    'Complete your journey': 'أكمل رحلتك', 'Summary': 'الملخّص',
    'Rewards applied': 'المكافآت المطبّقة', 'Use my rewards': 'استعمل مكافآتي',
    'Add an eligible item to use it': 'أضف منتجًا مؤهلاً لاستعمالها',
    'Checkout': 'إتمام الطلب', 'Where does it go?': 'إلى أين نرسلها؟',
    'First name': 'الاسم', 'Last name': 'النسب', 'Phone': 'الهاتف', 'Address': 'العنوان', 'City': 'المدينة',
    'Payment': 'الدفع', 'Cash on delivery': 'الدفع عند التسليم', 'Card': 'بطاقة',
    'Bank transfer': 'تحويل بنكي',
    'Cash on delivery, card or bank transfer · 24–72h across Morocco':
      'الدفع عند التسليم أو بالبطاقة أو تحويل · 24 إلى 72 ساعة في كل المغرب',
    'Chapter added': 'أُضيف فصل جديد', 'Thank you.': 'شكرًا لك.', 'Track this order': 'تتبّع الطلب',
    'Keep going': 'واصل', 'no points': 'بدون نقاط',

    /* account */
    'Welcome back': 'أهلاً بعودتك', 'Start your journey.': 'ابدأ رحلتك.',
    'Create account': 'إنشاء حساب', 'Overview': 'نظرة عامة', 'My Orders': 'طلباتي',
    'My Rewards': 'مكافآتي', 'My Fragrances': 'عطوري', 'Points History': 'سجل النقاط',
    'Fragrance Profile': 'بصمتي العطرية', 'Redeem rewards': 'استبدل المكافآت',
    'Parfums acquis': 'العطور المقتناة', 'Oud cumulé': 'مجموع العود', 'Rewards redeemed': 'المكافآت المستبدلة',
    'Next steps': 'الخطوات التالية', 'Complete your fragrance profile': 'أكمل بصمتك العطرية',
    'better recommendations': 'توصيات أدق', 'Add 5 g of oud': 'أضف 5 غرامات من العود',
    'for you or as a gift': 'لك أو هدية', 'Invite a friend': 'ادعُ صديقًا',
    'No orders yet': 'لا طلبات بعد', 'Ready to use': 'جاهزة للاستعمال', 'Build it': 'اصنعها',
    'Choose it': 'اخترها', 'Nothing saved yet': 'لا شيء محفوظ',
    'Your collection is empty': 'مجموعتك فارغة', 'Start collecting': 'ابدأ المجموعة',
    'Browse parfums': 'تصفّح العطور', 'No movement yet': 'لا حركة بعد',
    'Earn your first point': 'اجمع نقطتك الأولى', 'Copy': 'نسخ',
    'Referral link copied': 'تم نسخ رابط الإحالة', 'Simulate an invite (demo)': 'محاكاة دعوة (تجريبي)',
    'Not built yet.': 'لم تُنشأ بعد.', 'Build my profile': 'أنشئ بصمتي', 'Retake the quiz': 'أعد الاختبار',
    'Demo build — your account lives in this browser only, nothing is sent anywhere.':
      'نسخة تجريبية — حسابك محفوظ في هذا المتصفح فقط، ولا يُرسل شيء.',

    /* shop / discover / collections / journal */
    'The parfums.': 'العطور.', 'Clear filters': 'مسح الفلاتر',
    'Not sure where to start?': 'لا تعرف من أين تبدأ؟',
    'Three questions. One fragrance.': 'ثلاثة أسئلة. عطر واحد.',
    'Ask in plain language': 'اسأل بلغتك',
    'Search the way you actually think.': 'ابحث كما تفكّر.',
    'Nine worlds.': 'تسعة عوالم.', 'Still undecided?': 'ما زلت مترددًا؟',
    'Take two, not one.': 'خذ اثنين لا واحدًا.',
    'Build a coffret duo': 'اصنع علبة ثنائية',
    'Six chapters, one journey.': 'ستة فصول، رحلة واحدة.',
    'Read before you wear.': 'اقرأ قبل أن تتعطّر.',
    'What Morocco is wearing.': 'ما يضعه المغرب.',
    'Add your voice': 'أضف صوتك',
    'Review your collection': 'قيّم مجموعتك',
    'min read': 'دقائق قراءة',
    'ODYS stories': 'حكايات أوديس',
    'Where does your fragrance live?': 'أين يعيش عطرك؟'
  },
  r: [
    [/^(\d+) chapters? in the bag\.$/, '$1 فصول في السلة.'],
    [/^You'll earn (\d+) points?$/, 'ستجمع $1 نقطة'],
    [/^(\d+) to one free perfume$/, '$1 نقطة لعطر مجاني'],
    [/^(\d+) to three free perfumes$/, '$1 نقطة لثلاثة عطور'],
    [/^(\d+) to a custom coffret to gift$/, '$1 نقطة لعلبة مخصّصة'],
    [/^(\d+) points? to go$/, 'بقيت $1 نقطة'],
    [/^(\d+) points? away$/, 'بقيت $1 نقطة'],
    [/^(\d+) to go$/, 'بقي $1'],
    [/^Earn (\d+) points? with (\d+) g$/, 'اجمع $1 نقطة مع $2 غ'],
    [/^Earn 1 point per (\d+) g$/, 'نقطة واحدة لكل $1 غ'],
    [/^Earn (\d+) point — (\d+) points is a free perfume$/, 'اجمع $1 نقطة — $2 نقطة تساوي عطرًا مجانيًا'],
    [/^(\d+) fragrances?$/, '$1 عطرًا'],
    [/^Added to journey — (.+)$/, 'أُضيف إلى الرحلة — $1'],
    [/^Step (\d+) of (\d+)$/, 'الخطوة $1 من $2'],
    [/^Free shipping from (.+)$/, 'شحن مجاني ابتداءً من $1']
  ]
});
