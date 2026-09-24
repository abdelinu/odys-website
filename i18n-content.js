/* ODYS — catalogue copy in FR and AR.
   Same mechanism as i18n.js: the English string is the key. Product NAMES are brand
   marks and stay as they are in all three languages. */

/* ── families, formats, notes ─────────────────────────────────────────────── */
I18N.add('fr', {
  t: {
    'Extrait de Parfum': 'Extrait de Parfum',
    'Eau de Parfum': 'Eau de Parfum', 'Bâtonnets': 'Bâtonnets', 'Oud Sticks': 'Bâtonnets d\'oud',
    'Woody Aromatic': 'Boisé aromatique', 'Amber Spicy': 'Ambré épicé', 'White Floral': 'Floral blanc',
    'Woody Smoky': 'Boisé fumé', 'Fresh Aromatic': 'Frais aromatique', 'Oriental Floral': 'Floral oriental',
    'Gourmand Amber': 'Gourmand ambré', 'Oud Woody': 'Oud boisé', 'Green Fruity': 'Vert fruité',
    'Musky Clean': 'Musc propre', 'Spicy Gourmand': 'Épicé gourmand', 'Aromatic Mineral': 'Aromatique minéral',
    'Woody Amber': 'Boisé ambré', 'Fresh Green': 'Vert frais', 'Oriental': 'Oriental',
    'Gourmand Woody': 'Gourmand boisé', 'Green Woody': 'Vert boisé',

    /* notes */
    'Calabrian Bergamot': 'Bergamote de Calabre', 'Pink Pepper': 'Poivre rose', 'Cardamom': 'Cardamome',
    'Orris': 'Iris', 'Violet Leaf': 'Feuille de violette', 'Cedar': 'Cèdre', 'Atlas Cedarwood': 'Cèdre de l\'Atlas',
    'Vetiver': 'Vétiver', 'White Musk': 'Musc blanc', 'Saffron': 'Safran', 'Nutmeg': 'Muscade',
    'Blood Orange': 'Orange sanguine', 'Rose de Taif': 'Rose de Taïf', 'Immortelle': 'Immortelle',
    'Cinnamon': 'Cannelle', 'Labdanum': 'Labdanum', 'Amber': 'Ambre', 'Benzoin': 'Benjoin',
    'Neroli': 'Néroli', 'Green Mandarin': 'Mandarine verte', 'Pear': 'Poire', 'Orange Blossom': 'Fleur d\'oranger',
    'Jasmine Sambac': 'Jasmin sambac', 'Tuberose': 'Tubéreuse', 'Sandalwood': 'Santal', 'Musk': 'Musc',
    'Black Pepper': 'Poivre noir', 'Elemi': 'Élémi', 'Grapefruit Peel': 'Zeste de pamplemousse',
    'Guaiac Wood': 'Bois de gaïac', 'Leather': 'Cuir', 'Birch Tar': 'Goudron de bouleau', 'Tonka': 'Fève tonka',
    'Moroccan Mint': 'Menthe marocaine', 'Lemon': 'Citron', 'Sea Salt': 'Sel marin', 'Green Fig': 'Figue verte',
    'Basil': 'Basilic', 'Geranium': 'Géranium', 'Ambrette': 'Ambrette', 'Driftwood': 'Bois flotté',
    'Raspberry': 'Framboise', 'Bergamot': 'Bergamote', 'Rose Absolute': 'Absolue de rose',
    'Oud Accord': 'Accord oud', 'Patchouli': 'Patchouli', 'Vanilla Bourbon': 'Vanille bourbon',
    'Bitter Almond': 'Amande amère', 'Orange Blossom Honey': 'Miel de fleur d\'oranger',
    'Heliotrope': 'Héliotrope', 'Vanilla': 'Vanille', 'Cypress': 'Cyprès', 'Rose': 'Rose',
    'Ambergris': 'Ambre gris', 'Fig Leaf': 'Feuille de figuier', 'Fig Milk': 'Lait de figue', 'Iris': 'Iris',
    'Coconut Wood': 'Bois de coco', 'Aldehydes': 'Aldéhydes', 'Pear Blossom': 'Fleur de poirier',
    'Cotton Accord': 'Accord coton', 'Cashmere Wood': 'Bois cachemire', 'Clove': 'Clou de girofle',
    'Rum Accord': 'Accord rhum', 'Tobacco Leaf': 'Feuille de tabac', 'Honey': 'Miel', 'Dry Woods': 'Bois secs',
    'Juniper': 'Genévrier', 'Cold Mint': 'Menthe froide', 'Grapefruit': 'Pamplemousse',
    'Lavender Absolute': 'Absolue de lavande', 'Stone Accord': 'Accord minéral', 'Mandarin': 'Mandarine',
    'Jasmine': 'Jasmin', 'Green Tea': 'Thé vert', 'Almond': 'Amande', 'Fig': 'Figue',

    /* joined spec values */
    'Autumn · Winter · Spring': 'Automne · Hiver · Printemps', 'Autumn · Winter': 'Automne · Hiver',
    'Spring · Summer': 'Printemps · Été', 'Spring · Autumn': 'Printemps · Automne',
    'Everyday · Work · Evening': 'Tous les jours · Bureau · Soir', 'Evening · Special Occasion': 'Soir · Grande occasion',
    'Everyday · Work': 'Tous les jours · Bureau', 'Evening · Work': 'Soir · Bureau',
    'Evening · Everyday': 'Soir · Tous les jours', 'Special Occasion · Evening': 'Grande occasion · Soir',
    'Everyday · Guests · Eid · Ramadan': 'Tous les jours · Invités · Aïd · Ramadan',
    'Evening · Guests · Gifting': 'Soir · Invités · Cadeau',
    'Evening · Jumu\'ah · Special Occasion': 'Soir · Vendredi · Grande occasion',
    'Evening · Wedding · Gifting': 'Soir · Mariage · Cadeau',
    'Morning · Everyday · Office': 'Matin · Tous les jours · Bureau',
    'Special Occasion · Eid · Gifting': 'Grande occasion · Aïd · Cadeau',
    'Salon · entrée': 'Salon · entrée', 'Chambre · salle de bain': 'Chambre · salle de bain',
    'Cuisine · bureau': 'Cuisine · bureau', 'Salon · majlis': 'Salon · majlis',
    'Chambre · salon': 'Chambre · salon', 'Entrée · couloir': 'Entrée · couloir',
    '6 à 8 semaines': '6 à 8 semaines',
    'Blended in Morocco': 'Assemblé au Maroc', 'Koh Kong profile': 'Profil Koh Kong',
    'Assam profile': 'Profil Assam', 'Single-batch blend': 'Assemblage d\'un seul lot',
    'Oud + amber': 'Oud + ambre', 'Cambodi': 'Cambodi', 'Hindi': 'Hindi',
    'Rose mukhallat': 'Mukhallat rose', 'White musk blend': 'Assemblage musc blanc',
    'Aged oud + resins': 'Oud vieilli + résines',
    'Malaki': 'Malaki', 'Royal': 'Royal', 'Super': 'Super', 'Premium': 'Premium',
    'Standard': 'Standard', 'Royal Noir': 'Royal Noir',
    'Hand-rolled, rested 40 days': 'Roulé à la main, reposé 40 jours',
    'Rested 60 days': 'Reposé 60 jours', 'Rested 90 days': 'Reposé 90 jours',
    'Rested 45 days': 'Reposé 45 jours', 'Rested 30 days': 'Reposé 30 jours',
    'Aged 6 months before rolling': 'Vieilli 6 mois avant roulage',

    /* oud character / usage / burning */
    'Sweet ambered smoke, rose behind it, very little bite': 'Fumée ambrée et sucrée, une rose en fond, très peu de mordant',
    'Sweet, fruity, vanillic wood with almost no barn': 'Bois sucré, fruité, vanillé, presque sans note animale',
    'Dense, animalic, unmistakable — the traditionalist\'s oud': 'Dense, animal, reconnaissable — l\'oud des puristes',
    'Taif rose laid over ambered oud smoke': 'Rose de Taïf posée sur une fumée d\'oud ambrée',
    'Soft powdered smoke, clean, almost no sweetness': 'Fumée poudrée et douce, nette, presque sans sucre',
    'Deep resin, black honey, long smoke': 'Résine profonde, miel noir, fumée longue',
    'One stick scents a room for about 30 minutes.': 'Un bâtonnet parfume une pièce environ 30 minutes.',
    'One stick. It fills a room faster than you expect.': 'Un bâtonnet. La pièce se remplit plus vite qu\'on ne croit.',
    'Half a stick is usually enough.': 'La moitié d\'un bâtonnet suffit généralement.',
    'One stick in the evening, before guests arrive.': 'Un bâtonnet le soir, avant l\'arrivée des invités.',
    'The one to burn in the morning or in a small flat.': 'Celui qu\'on brûle le matin ou dans un petit appartement.',
    'Reserve it. One stick for an evening that matters.': 'Gardez-le. Un bâtonnet pour un soir qui compte.',
    'Light the tip, let the flame catch, blow it out. Stand it in sand or a holder.':
      'Allumez la pointe, laissez la flamme prendre, puis soufflez. Plantez-le dans du sable ou un porte-encens.',
    'Light, blow out, place upright away from fabric.': 'Allumez, soufflez, placez droit loin des tissus.',
    'Light, blow out, keep a window slightly open the first time.': 'Allumez, soufflez, entrouvrez une fenêtre la première fois.',
    'Light, blow out, place in a mabkhara or sand holder.': 'Allumez, soufflez, posez dans un mabkhara ou du sable.',
    'Light, blow out, stand upright.': 'Allumez, soufflez, placez droit.',
    'Light, blow out, burn away from draughts.': 'Allumez, soufflez, brûlez à l\'abri des courants d\'air.',

    /* coffrets */
    'COFFRET DUO': 'COFFRET DUO', 'COFFRET TRIO': 'COFFRET TRIO', 'COFFRET DÉCOUVERTE': 'COFFRET DÉCOUVERTE',
    'COFFRET OUD': 'COFFRET OUD', 'COFFRET MAISON': 'COFFRET MAISON', 'COFFRET SIGNATURE': 'COFFRET SIGNATURE',
    '2 parfums 50 ML': '2 parfums 50 ML', '3 parfums 50 ML': '3 parfums 50 ML',
    '3 parfums + 1 diffuseur': '3 parfums + 1 diffuseur', '1 parfum + 15 g de bâtonnets': '1 parfum + 15 g de bâtonnets',
    '2 diffuseurs + 30 g de bâtonnets': '2 diffuseurs + 30 g de bâtonnets', 'composez-le vous-même': 'composez-le vous-même',
    'Two bottles, one box. The safest gift in the house.': 'Deux flacons, un écrin. Le cadeau le plus sûr de la maison.',
    'Day, work, night — three chapters chosen by you.': 'Jour, bureau, soir — trois chapitres que vous choisissez.',
    'For the skin and for the room. The complete introduction.': 'Pour la peau et pour la pièce. L\'introduction complète.',
    'A bottle and a weight of oud. The ritual, boxed.': 'Un flacon et un poids d\'oud. Le rituel, en écrin.',
    'Everything for the house. The housewarming answer.': 'Tout pour la maison. La réponse à une crémaillère.',
    'Up to eight pieces, any mix — perfumes, diffuseurs, oud by the gram.':
      'Jusqu\'à huit pièces, tout mélange — parfums, diffuseurs, oud au gramme.',

    /* collections */
    'THE ICONS': 'LES ICÔNES', 'THE ORIENTAL': 'L\'ORIENTAL', 'THE ESSENTIALS': 'LES ESSENTIELS',
    'THE NIGHT JOURNEY': 'LE VOYAGE NOCTURNE', 'LA MAISON': 'LA MAISON', 'THE GIFT EDIT': 'LA SÉLECTION CADEAUX',
    'Signature fragrances. The ones we are known for.': 'Les signatures. Celles pour lesquelles on nous connaît.',
    'Oud, amber, spice and depth.': 'Oud, ambre, épices et profondeur.',
    'Everyday fragrances that never announce themselves.': 'Des parfums de tous les jours qui ne s\'annoncent jamais.',
    'Powerful evening scents built for cold air.': 'Des parfums du soir, faits pour l\'air froid.',
    'Diffuseurs for every room — 50 ML and three sticks.': 'Des diffuseurs pour chaque pièce — 50 ML et trois bâtonnets.',
    'Coffrets, personalised and sent with your words.': 'Des coffrets personnalisés, envoyés avec vos mots.',

    /* journal */
    'How to choose your signature fragrance': 'Comment choisir votre parfum signature',
    'How much oud do you actually need?': 'De combien d\'oud avez-vous vraiment besoin ?',
    'How to make perfume last longer': 'Comment faire durer un parfum',
    'Oud in Moroccan homes': 'L\'oud dans les maisons marocaines',
    'Why our diffuseur ships with three sticks': 'Pourquoi notre diffuseur contient trois bâtonnets',
    'Rose de Taif, from field to flacon': 'La rose de Taïf, du champ au flacon',
    'GUIDES': 'GUIDES', 'OUD': 'OUD', 'FRAGRANCE TIPS': 'CONSEILS', 'MOROCCAN HERITAGE': 'PATRIMOINE MAROCAIN',
    'CRAFT': 'SAVOIR-FAIRE', 'INGREDIENTS': 'MATIÈRES', 'PERFUME': 'PARFUM', 'ODYS STORIES': 'HISTOIRES ODYS', 'ALL': 'TOUT',

    /* tiers */
    'Every perfume and every 5 g of oud earns a point': 'Chaque parfum et chaque 5 g d\'oud rapportent un point',
    'A free perfume unlocked · samples with every order': 'Un parfum offert débloqué · échantillons à chaque commande',
    'Three free perfumes · early access to new compositions': 'Trois parfums offerts · accès anticipé aux nouveautés',
    'Explorer': 'Explorateur', 'Voyager': 'Voyageur'
  }
});

I18N.add('ar', {
  t: {
    'Extrait de Parfum': 'إكستريه دو بارفان',
    'Eau de Parfum': 'أو دو بارفان', 'Bâtonnets': 'أعواد', 'Oud Sticks': 'أعواد عود',
    'Woody Aromatic': 'خشبي عطري', 'Amber Spicy': 'عنبري حار', 'White Floral': 'زهري أبيض',
    'Woody Smoky': 'خشبي دخاني', 'Fresh Aromatic': 'منعش عطري', 'Oriental Floral': 'زهري شرقي',
    'Gourmand Amber': 'حلو عنبري', 'Oud Woody': 'عود خشبي', 'Green Fruity': 'أخضر فاكهي',
    'Musky Clean': 'مسكي نظيف', 'Spicy Gourmand': 'حار حلو', 'Aromatic Mineral': 'عطري معدني',
    'Woody Amber': 'خشبي عنبري', 'Fresh Green': 'أخضر منعش', 'Oriental': 'شرقي',
    'Gourmand Woody': 'حلو خشبي', 'Green Woody': 'أخضر خشبي',

    'Calabrian Bergamot': 'برغموت كالابريا', 'Pink Pepper': 'فلفل وردي', 'Cardamom': 'هيل',
    'Orris': 'السوسن', 'Violet Leaf': 'ورق البنفسج', 'Cedar': 'أرز', 'Atlas Cedarwood': 'أرز الأطلس',
    'Vetiver': 'الفيتيفر', 'White Musk': 'مسك أبيض', 'Saffron': 'زعفران', 'Nutmeg': 'جوزة الطيب',
    'Blood Orange': 'برتقال دموي', 'Rose de Taif': 'ورد الطائف', 'Immortelle': 'الخالدة',
    'Cinnamon': 'قرفة', 'Labdanum': 'اللبدان', 'Amber': 'عنبر', 'Benzoin': 'الجاوي',
    'Neroli': 'زهر النارنج', 'Green Mandarin': 'يوسفي أخضر', 'Pear': 'كمثرى', 'Orange Blossom': 'زهر البرتقال',
    'Jasmine Sambac': 'الفل', 'Tuberose': 'مسك الليل', 'Sandalwood': 'خشب الصندل', 'Musk': 'مسك',
    'Black Pepper': 'فلفل أسود', 'Elemi': 'الإيليمي', 'Grapefruit Peel': 'قشر الجريب فروت',
    'Guaiac Wood': 'خشب الغاياك', 'Leather': 'جلد', 'Birch Tar': 'قطران البتولا', 'Tonka': 'التونكا',
    'Moroccan Mint': 'نعناع مغربي', 'Lemon': 'ليمون', 'Sea Salt': 'ملح البحر', 'Green Fig': 'تين أخضر',
    'Basil': 'حبق', 'Geranium': 'العطرة', 'Ambrette': 'الأمبريت', 'Driftwood': 'خشب البحر',
    'Raspberry': 'توت العليق', 'Bergamot': 'برغموت', 'Rose Absolute': 'خلاصة الورد',
    'Oud Accord': 'نفحة عود', 'Patchouli': 'الباتشولي', 'Vanilla Bourbon': 'فانيليا بوربون',
    'Bitter Almond': 'لوز مر', 'Orange Blossom Honey': 'عسل زهر البرتقال',
    'Heliotrope': 'الهليوتروب', 'Vanilla': 'فانيليا', 'Cypress': 'سرو', 'Rose': 'ورد',
    'Ambergris': 'العنبر الرمادي', 'Fig Leaf': 'ورق التين', 'Fig Milk': 'حليب التين', 'Iris': 'سوسن',
    'Coconut Wood': 'خشب جوز الهند', 'Aldehydes': 'ألدهيدات', 'Pear Blossom': 'زهر الكمثرى',
    'Cotton Accord': 'نفحة قطن', 'Cashmere Wood': 'خشب الكشمير', 'Clove': 'قرنفل',
    'Rum Accord': 'نفحة روم', 'Tobacco Leaf': 'ورق التبغ', 'Honey': 'عسل', 'Dry Woods': 'أخشاب جافة',
    'Juniper': 'العرعر', 'Cold Mint': 'نعناع بارد', 'Grapefruit': 'جريب فروت',
    'Lavender Absolute': 'خلاصة الخزامى', 'Stone Accord': 'نفحة حجرية', 'Mandarin': 'يوسفي',
    'Jasmine': 'ياسمين', 'Green Tea': 'شاي أخضر', 'Almond': 'لوز', 'Fig': 'تين',

    'Autumn · Winter · Spring': 'الخريف · الشتاء · الربيع', 'Autumn · Winter': 'الخريف · الشتاء',
    'Spring · Summer': 'الربيع · الصيف', 'Spring · Autumn': 'الربيع · الخريف',
    'Everyday · Work · Evening': 'كل يوم · العمل · المساء', 'Evening · Special Occasion': 'المساء · مناسبة خاصة',
    'Everyday · Work': 'كل يوم · العمل', 'Evening · Work': 'المساء · العمل',
    'Evening · Everyday': 'المساء · كل يوم', 'Special Occasion · Evening': 'مناسبة خاصة · المساء',
    'Everyday · Guests · Eid · Ramadan': 'كل يوم · الضيوف · العيد · رمضان',
    'Evening · Guests · Gifting': 'المساء · الضيوف · الهدايا',
    'Evening · Jumu\'ah · Special Occasion': 'المساء · الجمعة · مناسبة خاصة',
    'Evening · Wedding · Gifting': 'المساء · العرس · الهدايا',
    'Morning · Everyday · Office': 'الصباح · كل يوم · المكتب',
    'Special Occasion · Eid · Gifting': 'مناسبة خاصة · العيد · الهدايا',
    'Salon · entrée': 'الصالون · المدخل', 'Chambre · salle de bain': 'غرفة النوم · الحمام',
    'Cuisine · bureau': 'المطبخ · المكتب', 'Salon · majlis': 'الصالون · المجلس',
    'Chambre · salon': 'غرفة النوم · الصالون', 'Entrée · couloir': 'المدخل · الممر',
    '6 à 8 semaines': '6 إلى 8 أسابيع',
    'Blended in Morocco': 'مُركّب في المغرب', 'Koh Kong profile': 'طابع كوه كونغ',
    'Assam profile': 'طابع آسام', 'Single-batch blend': 'خلطة دفعة واحدة',
    'Oud + amber': 'عود + عنبر', 'Cambodi': 'كمبودي', 'Hindi': 'هندي',
    'Rose mukhallat': 'مخلط ورد', 'White musk blend': 'خلطة مسك أبيض',
    'Aged oud + resins': 'عود معتّق + راتنجات',
    'Malaki': 'ملكي', 'Royal': 'ملكي', 'Super': 'سوبر', 'Premium': 'ممتاز',
    'Standard': 'عادي', 'Royal Noir': 'ملكي أسود',
    'Hand-rolled, rested 40 days': 'ملفوف يدويًا، مرتاح 40 يومًا',
    'Rested 60 days': 'مرتاح 60 يومًا', 'Rested 90 days': 'مرتاح 90 يومًا',
    'Rested 45 days': 'مرتاح 45 يومًا', 'Rested 30 days': 'مرتاح 30 يومًا',
    'Aged 6 months before rolling': 'معتّق 6 أشهر قبل اللف',

    'Sweet ambered smoke, rose behind it, very little bite': 'دخان عنبري حلو، وورد في الخلفية، بلا حدّة تقريبًا',
    'Sweet, fruity, vanillic wood with almost no barn': 'خشب حلو فاكهي بالفانيليا، بلا نفحة حيوانية تقريبًا',
    'Dense, animalic, unmistakable — the traditionalist\'s oud': 'كثيف، حيواني، لا يُخطئ — عود أهل التقليد',
    'Taif rose laid over ambered oud smoke': 'ورد الطائف فوق دخان عود عنبري',
    'Soft powdered smoke, clean, almost no sweetness': 'دخان ناعم بودري، نظيف، بلا حلاوة تقريبًا',
    'Deep resin, black honey, long smoke': 'راتنج عميق، عسل أسود، دخان طويل',
    'One stick scents a room for about 30 minutes.': 'عود واحد يعطّر الغرفة نحو 30 دقيقة.',
    'One stick. It fills a room faster than you expect.': 'عود واحد. يملأ الغرفة أسرع مما تتوقع.',
    'Half a stick is usually enough.': 'نصف عود يكفي غالبًا.',
    'One stick in the evening, before guests arrive.': 'عود واحد مساءً، قبل وصول الضيوف.',
    'The one to burn in the morning or in a small flat.': 'الأنسب للصباح أو للشقق الصغيرة.',
    'Reserve it. One stick for an evening that matters.': 'احتفظ به. عود واحد لأمسية تستحق.',
    'Light the tip, let the flame catch, blow it out. Stand it in sand or a holder.':
      'أشعل الطرف، دع اللهب يمسك، ثم أطفئه. ثبّته في الرمل أو في حامل.',
    'Light, blow out, place upright away from fabric.': 'أشعل، أطفئ، وضعه عموديًا بعيدًا عن الأقمشة.',
    'Light, blow out, keep a window slightly open the first time.': 'أشعل، أطفئ، وافتح نافذة قليلاً في أول مرة.',
    'Light, blow out, place in a mabkhara or sand holder.': 'أشعل، أطفئ، وضعه في مبخرة أو حامل رملي.',
    'Light, blow out, stand upright.': 'أشعل، أطفئ، وثبّته عموديًا.',
    'Light, blow out, burn away from draughts.': 'أشعل، أطفئ، واحرقه بعيدًا عن التيارات الهوائية.',

    'COFFRET DUO': 'علبة ثنائية', 'COFFRET TRIO': 'علبة ثلاثية', 'COFFRET DÉCOUVERTE': 'علبة الاكتشاف',
    'COFFRET OUD': 'علبة العود', 'COFFRET MAISON': 'علبة الدار', 'COFFRET SIGNATURE': 'علبة التوقيع',
    '2 parfums 50 ML': 'عطران 50 مل', '3 parfums 50 ML': 'ثلاثة عطور 50 مل',
    '3 parfums + 1 diffuseur': 'ثلاثة عطور + مبخّرة', '1 parfum + 15 g de bâtonnets': 'عطر + 15 غ من الأعواد',
    '2 diffuseurs + 30 g de bâtonnets': 'مبخّرتان + 30 غ من الأعواد', 'composez-le vous-même': 'اصنعها بنفسك',
    'Two bottles, one box. The safest gift in the house.': 'قارورتان في علبة واحدة. أضمن هدية في الدار.',
    'Day, work, night — three chapters chosen by you.': 'نهار، عمل، ليل — ثلاثة فصول تختارها بنفسك.',
    'For the skin and for the room. The complete introduction.': 'للجلد وللغرفة. المدخل الكامل.',
    'A bottle and a weight of oud. The ritual, boxed.': 'قارورة ووزن من العود. الطقس كاملاً في علبة.',
    'Everything for the house. The housewarming answer.': 'كل شيء للمنزل. هدية البيت الجديد.',
    'Up to eight pieces, any mix — perfumes, diffuseurs, oud by the gram.':
      'حتى ثماني قطع، أي مزيج — عطور، مبخّرات، وعود بالغرام.',

    'THE ICONS': 'الأيقونات', 'THE ORIENTAL': 'الشرقية', 'THE ESSENTIALS': 'الأساسيات',
    'THE NIGHT JOURNEY': 'رحلة الليل', 'LA MAISON': 'الدار', 'THE GIFT EDIT': 'مختارات الهدايا',
    'Signature fragrances. The ones we are known for.': 'عطور التوقيع. تلك التي نُعرف بها.',
    'Oud, amber, spice and depth.': 'عود وعنبر وتوابل وعمق.',
    'Everyday fragrances that never announce themselves.': 'عطور يومية لا تعلن عن نفسها.',
    'Powerful evening scents built for cold air.': 'عطور مسائية قوية، للأجواء الباردة.',
    'Diffuseurs for every room — 50 ML and three sticks.': 'مبخّرات لكل غرفة — 50 مل وثلاثة أعواد.',
    'Coffrets, personalised and sent with your words.': 'علب مخصّصة تُرسل مع كلماتك.',

    'How to choose your signature fragrance': 'كيف تختار عطرك المميّز',
    'How much oud do you actually need?': 'كم غرامًا من العود تحتاج فعلاً؟',
    'How to make perfume last longer': 'كيف تجعل العطر يدوم أطول',
    'Oud in Moroccan homes': 'العود في البيوت المغربية',
    'Why our diffuseur ships with three sticks': 'لماذا تأتي مبخّرتنا بثلاثة أعواد',
    'Rose de Taif, from field to flacon': 'ورد الطائف، من الحقل إلى القارورة',
    'GUIDES': 'أدلة', 'OUD': 'العود', 'FRAGRANCE TIPS': 'نصائح', 'MOROCCAN HERITAGE': 'التراث المغربي',
    'CRAFT': 'الصنعة', 'INGREDIENTS': 'المكوّنات', 'PERFUME': 'العطر', 'ODYS STORIES': 'حكايات أوديس', 'ALL': 'الكل',

    'Every perfume and every 5 g of oud earns a point': 'كل عطر وكل 5 غرامات من العود تمنح نقطة',
    'A free perfume unlocked · samples with every order': 'عطر مجاني مفتوح · عيّنات مع كل طلب',
    'Three free perfumes · early access to new compositions': 'ثلاثة عطور مجانية · وصول مبكر للإصدارات',
    'Explorer': 'مستكشف', 'Voyager': 'رحّالة'
  }
});

/* ── product stories ──────────────────────────────────────────────────────── */
I18N.add('fr', {
  t: {
    "The first chapter. Bergamot opens like morning over the Atlas, then the scent turns inward — dry cedar, cold iris, a thread of pepper that never quite settles. Worn by people who do not explain themselves.":
      "Le premier chapitre. La bergamote s'ouvre comme un matin sur l'Atlas, puis le parfum rentre en lui-même — cèdre sec, iris froid, un fil de poivre qui ne retombe jamais tout à fait. Pour celles et ceux qui ne s'expliquent pas.",
    "Saffron burns slow. This is the hour after dinner when the lights go down and nobody is in a hurry — resin, rose, and a warmth that stays on wool for days.":
      "Le safran brûle lentement. C'est l'heure après le dîner, quand les lumières baissent et que personne n'est pressé — résine, rose, et une chaleur qui reste des jours sur la laine.",
    "A courtyard in Fès at the end of April. Orange blossom over cool stone, water somewhere out of sight.":
      "Un patio à Fès, fin avril. Fleur d'oranger sur pierre fraîche, et de l'eau quelque part hors de vue.",
    "Cedar cut in winter, left near a fire. Dry, resinous, faintly smoked — the most quietly masculine thing we make.":
      "Du cèdre coupé en hiver, laissé près du feu. Sec, résineux, légèrement fumé — le plus discrètement masculin de nos parfums.",
    "Mint tea poured too high, salt still on the skin. The scent of a long afternoon with nothing scheduled.":
      "Du thé à la menthe versé de trop haut, du sel encore sur la peau. L'odeur d'un long après-midi sans rien de prévu.",
    "Rose, but after dark — deepened with oud and patchouli until it stops being polite.":
      "La rose, mais après la tombée du jour — creusée d'oud et de patchouli jusqu'à cesser d'être polie.",
    "Honey left on a warm spoon. Almond, tonka, a soft amber that reads as skin by hour three.":
      "Du miel sur une cuillère tiède. Amande, tonka, un ambre doux qui se confond avec la peau à la troisième heure.",
    "Our densest composition — oud at the centre, held up by saffron and rose. The bottle people come back for, and the one they hand to their brother.":
      "Notre composition la plus dense — l'oud au centre, porté par le safran et la rose. Le flacon pour lequel on revient, et celui qu'on offre à son frère.",
    "Fig picked warm off the tree — green at first, then creamy, then wood.":
      "Une figue cueillie tiède sur l'arbre — verte d'abord, puis crémeuse, puis boisée.",
    "The quiet one. Clean laundry, warm skin, nothing to declare — our most repurchased bottle.":
      "Le discret. Linge propre, peau tiède, rien à déclarer — notre flacon le plus racheté.",
    "Tobacco and honey, the way an old leather chair smells in a room that has seen conversation.":
      "Tabac et miel, comme sent un vieux fauteuil de cuir dans une pièce qui a connu des conversations.",
    "Altitude after sunset. Juniper, cold air, wet rock — a fresh scent with a shadow in it.":
      "L'altitude après le coucher du soleil. Genévrier, air froid, roche mouillée — un parfum frais avec une ombre dedans.",
    "Warm wood and amber that settles into a room instead of announcing itself. Three rattan sticks in the box — turn them once a week.":
      "Bois chaud et ambre qui s'installent dans la pièce au lieu de s'annoncer. Trois bâtonnets de rotin dans la boîte — retournez-les une fois par semaine.",
    "The courtyard smell — neroli and orange blossom, clean enough for a bedroom.":
      "L'odeur du patio — néroli et fleur d'oranger, assez nette pour une chambre.",
    "Mint tea in the afternoon. The one to put where people work or eat.":
      "Du thé à la menthe l'après-midi. Celui qu'on pose là où l'on travaille ou l'on mange.",
    "For the room where guests sit. Rose over oud, the way a house smells before people arrive.":
      "Pour la pièce où l'on reçoit. Rose sur oud, comme sent une maison avant l'arrivée des invités.",
    "Sweet without being a dessert. The winter diffuseur.":
      "Sucré sans être un dessert. Le diffuseur de l'hiver.",
    "Green fig and dry cedar — the first thing anyone smells when the door opens.":
      "Figue verte et cèdre sec — la première chose que l'on sent quand la porte s'ouvre.",
    "The house standard. Sweet, ambered, generous — what most Moroccan homes mean when they say oud.":
      "La référence de la maison. Sucré, ambré, généreux — ce que la plupart des foyers marocains appellent l'oud.",
    "The gateway oud. Round and sweet from the first minute — the one we hand to people who think they dislike oud.":
      "L'oud d'initiation. Rond et sucré dès la première minute — celui qu'on tend à ceux qui croient ne pas aimer l'oud.",
    "Not a beginner's oud. Wild at the top, extraordinary once it turns — burn it for people who already know.":
      "Pas un oud de débutant. Sauvage au départ, extraordinaire une fois tourné — à brûler pour ceux qui savent déjà.",
    "Rose and oud in one stick. The most-gifted weight in the shop, and the one people buy in 100 g.":
      "Rose et oud dans un seul bâtonnet. Le plus offert de la boutique, et celui qu'on achète en 100 g.",
    "Quiet smoke. For people who want the room to smell cared for, not perfumed.":
      "Une fumée discrète. Pour qui veut une pièce soignée, pas parfumée.",
    "Our densest batch, made twice a year. When it is gone it is gone until the next rolling.":
      "Notre lot le plus dense, produit deux fois par an. Une fois épuisé, il faut attendre le roulage suivant."
  }
});

I18N.add('ar', {
  t: {
    "The first chapter. Bergamot opens like morning over the Atlas, then the scent turns inward — dry cedar, cold iris, a thread of pepper that never quite settles. Worn by people who do not explain themselves.":
      "الفصل الأول. يفتح البرغموت كصباح فوق الأطلس، ثم ينكفئ العطر إلى الداخل — أرز جاف، سوسن بارد، وخيط فلفل لا يهدأ تمامًا. لمن لا يشرحون أنفسهم.",
    "Saffron burns slow. This is the hour after dinner when the lights go down and nobody is in a hurry — resin, rose, and a warmth that stays on wool for days.":
      "الزعفران يحترق ببطء. إنها الساعة التي تلي العشاء حين تخفت الأضواء ولا أحد في عجلة — راتنج وورد ودفء يبقى على الصوف أيامًا.",
    "A courtyard in Fès at the end of April. Orange blossom over cool stone, water somewhere out of sight.":
      "فناء في فاس في أواخر أبريل. زهر البرتقال فوق حجر بارد، وماء في مكان لا تراه.",
    "Cedar cut in winter, left near a fire. Dry, resinous, faintly smoked — the most quietly masculine thing we make.":
      "أرز قُطع في الشتاء وتُرك قرب النار. جاف، راتنجي، بدخان خفيف — أكثر عطورنا رجولةً وهدوءًا.",
    "Mint tea poured too high, salt still on the skin. The scent of a long afternoon with nothing scheduled.":
      "شاي بالنعناع يُسكب من علو، وملح ما زال على الجلد. رائحة عصر طويل بلا مواعيد.",
    "Rose, but after dark — deepened with oud and patchouli until it stops being polite.":
      "ورد، لكن بعد حلول الظلام — يعمّقه العود والباتشولي حتى يفقد تهذيبه.",
    "Honey left on a warm spoon. Almond, tonka, a soft amber that reads as skin by hour three.":
      "عسل على ملعقة دافئة. لوز وتونكا وعنبر ناعم يصير كالجلد بعد ثلاث ساعات.",
    "Our densest composition — oud at the centre, held up by saffron and rose. The bottle people come back for, and the one they hand to their brother.":
      "أكثف تركيباتنا — العود في القلب، يسنده الزعفران والورد. القارورة التي يعود إليها الناس، ويهدونها لإخوتهم.",
    "Fig picked warm off the tree — green at first, then creamy, then wood.":
      "تينة قُطفت دافئة من الشجرة — خضراء أولاً، ثم كريمية، ثم خشبية.",
    "The quiet one. Clean laundry, warm skin, nothing to declare — our most repurchased bottle.":
      "العطر الهادئ. غسيل نظيف وجلد دافئ ولا شيء يُعلن — أكثر قواريرنا إعادةً للشراء.",
    "Tobacco and honey, the way an old leather chair smells in a room that has seen conversation.":
      "تبغ وعسل، كرائحة كرسي جلدي قديم في غرفة عرفت الحديث.",
    "Altitude after sunset. Juniper, cold air, wet rock — a fresh scent with a shadow in it.":
      "المرتفعات بعد الغروب. عرعر وهواء بارد وصخر مبلّل — انتعاش فيه ظل.",
    "Warm wood and amber that settles into a room instead of announcing itself. Three rattan sticks in the box — turn them once a week.":
      "خشب دافئ وعنبر يستقران في الغرفة دون ضجيج. ثلاثة أعواد روطان في العلبة — اقلبها مرة كل أسبوع.",
    "The courtyard smell — neroli and orange blossom, clean enough for a bedroom.":
      "رائحة الفناء — زهر النارنج وزهر البرتقال، نقية بما يكفي لغرفة النوم.",
    "Mint tea in the afternoon. The one to put where people work or eat.":
      "شاي بالنعناع بعد الظهر. ضعه حيث يعمل الناس أو يأكلون.",
    "For the room where guests sit. Rose over oud, the way a house smells before people arrive.":
      "لغرفة الضيوف. ورد فوق عود، كما يفوح البيت قبل وصول الناس.",
    "Sweet without being a dessert. The winter diffuseur.":
      "حلو دون أن يكون حلوى. مبخّرة الشتاء.",
    "Green fig and dry cedar — the first thing anyone smells when the door opens.":
      "تين أخضر وأرز جاف — أول ما يُشمّ حين يُفتح الباب.",
    "The house standard. Sweet, ambered, generous — what most Moroccan homes mean when they say oud.":
      "معيار الدار. حلو، عنبري، كريم — هذا ما تقصده أغلب البيوت المغربية حين تقول «عود».",
    "The gateway oud. Round and sweet from the first minute — the one we hand to people who think they dislike oud.":
      "عود البداية. ممتلئ وحلو من الدقيقة الأولى — نقدّمه لمن يظن أنه لا يحب العود.",
    "Not a beginner's oud. Wild at the top, extraordinary once it turns — burn it for people who already know.":
      "ليس عودًا للمبتدئين. جامح في أوله، استثنائي بعد أن ينقلب — احرقه لمن يعرف.",
    "Rose and oud in one stick. The most-gifted weight in the shop, and the one people buy in 100 g.":
      "ورد وعود في عود واحد. الأكثر إهداءً في المتجر، والذي يُشترى بمئة غرام.",
    "Quiet smoke. For people who want the room to smell cared for, not perfumed.":
      "دخان هادئ. لمن يريد غرفة تبدو معتنى بها، لا معطّرة.",
    "Our densest batch, made twice a year. When it is gone it is gone until the next rolling.":
      "أكثف دفعاتنا، تُصنع مرتين في السنة. إذا نفدت، تنتظر الدفعة التالية."
  }
});
