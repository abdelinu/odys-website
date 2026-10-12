/* ODYS — UI labels in FR and AR, keyed on the English source string.
   Merged from six passes; add new strings to the last block. */

/* ── pass 1 ── */
/* ODYS — labels the pages build at runtime: tabs, chips, and composites that carry numbers. */
I18N.add('fr', {
  t: {
    'ALL': 'TOUT', 'PARFUMS': 'PARFUMS', 'BESTSELLERS': 'LES PLUS VENDUS', 'NEW ARRIVALS': 'NOUVEAUTÉS',
    'MOST LOVED': 'LES PLUS AIMÉS', 'OUD AU GRAMME': 'OUD AU GRAMME', 'DIFFUSEURS': 'DIFFUSEURS',
    'GIFTS': 'CADEAUX', 'LIMITED': 'ÉDITIONS LIMITÉES',
    'SWEET': 'SUCRÉ', 'SMOKY': 'FUMÉ', 'ANIMALIC': 'ANIMAL', 'SOFT': 'DOUX', 'GIFTING': 'À OFFRIR',
    'SALON': 'SALON', 'CHAMBRE': 'CHAMBRE', 'CUISINE · BUREAU': 'CUISINE · BUREAU', 'ENTRÉE': 'ENTRÉE',
    'MOST LOVED THIS MONTH': 'LES PLUS AIMÉS CE MOIS', 'TRENDING IN MOROCCO': 'TENDANCES AU MAROC',
    'MOST REVIEWED': 'LES PLUS COMMENTÉS', 'OUD COMMUNITY PICKS': 'CHOIX DE LA COMMUNAUTÉ OUD',
    'DISCOVER': 'DÉCOUVRIR', 'EXPERIENCE': 'VIVRE', 'REMEMBER': 'SE SOUVENIR', 'COLLECT': 'COLLECTIONNER',
    'EARN': 'GAGNER', 'REDEEM': 'ÉCHANGER', 'CONTINUE': 'CONTINUER',
    'Parfum 50 ML': 'Parfum 50 ML', 'Diffuseur 50 ML': 'Diffuseur 50 ML', 'Oud from': 'Oud dès', 'from': 'dès',
    'special order': 'commande spéciale', 'Special order': 'Commande spéciale',
    '50 ML · extrait de parfum': '50 ML · extrait de parfum',
    '50 ML · 3 rattan sticks': '50 ML · 3 bâtonnets rotin', 'sticks sold by the gram': 'bâtonnets vendus au gramme',
    '+1 point per bottle': '+1 point par flacon', '+1 point per 5 g': '+1 point / 5 g', 'no points': 'sans point',
    'per parfum': 'par parfum', 'per 5 g of oud': "par 5 g d'oud", 'free perfume': 'parfum offert',
    'pts to a free perfume': 'pts pour un parfum offert', 'Reward unlocked': 'Récompense débloquée',
    'Bâtonnets · au gramme': 'Bâtonnets · au gramme', 'Hors programme points': 'Hors programme points',
    'Enter the oud world': "Entrer dans l'univers de l'oud", 'Composez-le. Offrez-le.': 'Composez-le. Offrez-le.',
    'Sort · Featured': 'Trier · En vedette', 'Newest': 'Nouveautés', 'Price · low to high': 'Prix croissant',
    'Price · high to low': 'Prix décroissant', 'Most loved': 'Les plus aimés',
    'A signature is not the scent you like most in the shop. It is the one you stop noticing on yourself by the third wearing.':
      "Une signature n'est pas le parfum que vous préférez en boutique, mais celui que vous ne remarquez plus sur vous au troisième port.",
    'Five grams is a week of evenings. A hundred is a season. Here is how to buy by the gram without wasting any.':
      "Cinq grammes, c'est une semaine de soirées. Cent, c'est une saison. Voici comment acheter au gramme sans rien gaspiller.",
    'Skin chemistry matters less than most people think. Application, storage and fabric matter more.':
      "La chimie de la peau compte moins qu'on ne le croit. L'application, la conservation et le tissu comptent davantage.",
    'Bakhoor in Morocco is hospitality before it is fragrance — the first thing offered and the last thing remembered.':
      "Au Maroc, le bakhoor est d'abord une hospitalité — la première chose offerte et la dernière dont on se souvient.",
    'More rattan is not more scent. Three is the number that lasts eight weeks without flooding a room.':
      "Plus de rotin ne donne pas plus de parfum. Trois, c'est le nombre qui tient huit semaines sans saturer la pièce.",
    'Picked before sunrise, distilled the same morning. Four tonnes of petals for one kilo of absolute.':
      "Cueillie avant l'aube, distillée le matin même. Quatre tonnes de pétales pour un kilo d'absolue."
  },
  r: [
    [/^(\d+) min read$/, '$1 min de lecture'],
    [/^(\d+) fragrance$/, '$1 parfum'],
    [/^\+(\d+) pts? \/ (\d+) g$/, '+$1 pts / $2 g'],
    [/^([\d.]+) MAD \/ g — better rate at this weight$/, '$1 MAD / g — meilleur tarif à ce poids']
  ]
});

I18N.add('ar', {
  t: {
    'ALL': 'الكل', 'PARFUMS': 'العطور', 'BESTSELLERS': 'الأكثر مبيعًا', 'NEW ARRIVALS': 'وصل حديثًا',
    'MOST LOVED': 'الأكثر محبة', 'OUD AU GRAMME': 'العود بالغرام', 'DIFFUSEURS': 'المبخّرات',
    'GIFTS': 'الهدايا', 'LIMITED': 'إصدار محدود',
    'SWEET': 'حلو', 'SMOKY': 'دخاني', 'ANIMALIC': 'حيواني', 'SOFT': 'هادئ', 'GIFTING': 'للإهداء',
    'SALON': 'الصالون', 'CHAMBRE': 'غرفة النوم', 'CUISINE · BUREAU': 'المطبخ · المكتب', 'ENTRÉE': 'المدخل',
    'MOST LOVED THIS MONTH': 'الأكثر محبة هذا الشهر', 'TRENDING IN MOROCCO': 'الأكثر رواجًا في المغرب',
    'MOST REVIEWED': 'الأكثر تقييمًا', 'OUD COMMUNITY PICKS': 'اختيارات محبي العود',
    'DISCOVER': 'اكتشف', 'EXPERIENCE': 'جرّب', 'REMEMBER': 'تذكّر', 'COLLECT': 'اجمع',
    'EARN': 'اكسب', 'REDEEM': 'استبدل', 'CONTINUE': 'واصل',
    'Parfum 50 ML': 'عطر 50 مل', 'Diffuseur 50 ML': 'مبخّرة 50 مل', 'Oud from': 'العود ابتداءً من', 'from': 'من',
    'special order': 'طلب خاص', 'Special order': 'طلب خاص',
    '50 ML · extrait de parfum': '50 مل · إكستريه دو بارفان',
    '50 ML · 3 rattan sticks': '50 مل · 3 أعواد روطان', 'sticks sold by the gram': 'أعواد تُباع بالغرام',
    '+1 point per bottle': 'نقطة لكل قارورة', '+1 point per 5 g': 'نقطة لكل 5 غ', 'no points': 'بدون نقاط',
    'per parfum': 'لكل عطر', 'per 5 g of oud': 'لكل 5 غ من العود', 'free perfume': 'عطر مجاني',
    'pts to a free perfume': 'نقطة لعطر مجاني', 'Reward unlocked': 'مكافأة مفتوحة',
    'Bâtonnets · au gramme': 'أعواد · بالغرام', 'Hors programme points': 'خارج برنامج النقاط',
    'Enter the oud world': 'ادخل عالم العود', 'Composez-le. Offrez-le.': 'اصنعه. أهْدِه.',
    'Sort · Featured': 'ترتيب · مختارات', 'Newest': 'الأحدث', 'Price · low to high': 'السعر تصاعديًا',
    'Price · high to low': 'السعر تنازليًا', 'Most loved': 'الأكثر محبة',
    'Vendu au gramme': 'يُباع بالغرام', 'Prix dégressif': 'سعر تنازلي', 'Commande spéciale': 'طلب خاص',
    'A signature is not the scent you like most in the shop. It is the one you stop noticing on yourself by the third wearing.':
      'العطر المميّز ليس أجمل ما تشمّه في المتجر، بل ما لا تعود تنتبه إليه على نفسك في المرة الثالثة.',
    'Five grams is a week of evenings. A hundred is a season. Here is how to buy by the gram without wasting any.':
      'خمسة غرامات تكفي أسبوعًا من الأمسيات، ومئة تكفي موسمًا. إليك كيف تشتري بالغرام دون تبذير.',
    'Skin chemistry matters less than most people think. Application, storage and fabric matter more.':
      'كيمياء الجلد أقل أهمية مما يظن الناس. طريقة الوضع والتخزين ونوع القماش أهم.',
    'Bakhoor in Morocco is hospitality before it is fragrance — the first thing offered and the last thing remembered.':
      'البخور في المغرب كرمٌ قبل أن يكون عطرًا — أول ما يُقدَّم وآخر ما يُنسى.',
    'More rattan is not more scent. Three is the number that lasts eight weeks without flooding a room.':
      'زيادة الأعواد لا تعني رائحة أقوى. ثلاثة أعواد تكفي ثمانية أسابيع دون أن تُثقل الغرفة.',
    'Picked before sunrise, distilled the same morning. Four tonnes of petals for one kilo of absolute.':
      'يُقطف قبل الشروق ويُقطَّر في الصباح نفسه. أربعة أطنان من البتلات لكل كيلو من الخلاصة.'
  },
  r: [
    [/^(\d+) min read$/, '$1 دقائق قراءة'],
    [/^(\d+) fragrance$/, 'عطر واحد'],
    [/^\+(\d+) pts?$/, '+$1 نقطة'],
    [/^\+(\d+) pts? \/ (\d+) g$/, '+$1 نقطة / $2 غ'],
    [/^([\d.]+) MAD \/ g — better rate at this weight$/, '$1 درهم / غ — أفضل سعر لهذا الوزن']
  ]
});

/* ── pass 2 ── */
/* ODYS — second pass: sentences and fragments the pages assemble with numbers. */
I18N.add('fr', {
  t: {
    'Per parfum 50 ML': 'Par parfum 50 ML', 'Every bottle you buy, whatever the scent.': 'Chaque flacon acheté, quel que soit le parfum.',
    'Per': 'Par', 'g of oud': "g d'oud", 'Grams of oud': "Grammes d'oud", 'Parfums 50 ML': 'Parfums 50 ML',
    '10 g is 2 points. 100 g is 20 — a free perfume in a single order.': '10 g font 2 points. 100 g en font 20 — un parfum offert en une seule commande.',
    'Outside the programme by design:': 'Hors programme, volontairement :', 'is already the floor price.': 'est déjà le prix plancher.',
    'Create your account': 'Créez votre compte', 'Your points start counting from the first order.': 'Vos points comptent dès la première commande.',
    'Take the fragrance quiz': 'Faites le test olfactif', 'Three questions, and the shop reorders itself around you.': 'Trois questions, et la boutique se réorganise autour de vous.',
    'Buy your first parfum': 'Achetez votre premier parfum', 'Add oud by the gram': "Ajoutez de l'oud au gramme",
    'Every': 'Chaque', 'g is another point.': 'g, un point de plus.', 'Reach': 'Atteignez', 'points': 'points',
    'Or hold for': 'Ou attendez', 'A free 50 ML perfume, any scent in the house.': 'Un parfum 50 ML offert, au choix dans la maison.',
    'A custom coffret, wrapped and sent to whoever you choose.': 'Un coffret personnalisé, emballé et envoyé à qui vous voulez.',
    'Begin another journey': 'Repartez pour un tour', 'The points reset. The collection does not.': 'Les points repartent de zéro. La collection, non.',
    'points short of': 'points avant', 'Everything on the ladder is unlocked.': "Tout l'échelon est débloqué.",
    'That basket already contains a free perfume.': 'Ce panier contient déjà un parfum offert.',
    'Perfumes alone:': 'Parfums seuls :', 'oud adds': "l'oud ajoute",
    'Sold by the gram': 'Vendu au gramme', 'Sliding scale': 'Prix dégressif', 'Special order': 'Commande spéciale',
    'From': 'À partir de', 'The price per gram falls at every tier': 'Le prix au gramme baisse à chaque palier',
    'Above': 'Au-delà de', 'special rate on request': 'tarif spécial sur devis', 'points = a free perfume': 'points = un parfum offert',
    'ODYS points': 'points ODYS', 'special rate, confirmed before shipping': 'tarif spécial, confirmé avant expédition',
    '5 g = 1 point': '5 g = 1 point', 'Every 5 g = 1 ODYS point, whatever the batch': 'Chaque 5 g = 1 point ODYS, quel que soit le lot',
    'Limited': 'Limitée', 'New': 'Nouveau',
    'Let the flame catch for three or four seconds, no longer.': 'Laissez la flamme prendre trois ou quatre secondes, pas plus.',
    'You want an ember, not a fire. The smoke should be thin and steady.': 'On veut une braise, pas un feu. La fumée doit être fine et régulière.',
    'In sand, a holder or a mabkhara — away from curtains and draughts.': "Dans du sable, un porte-encens ou un mabkhara — loin des rideaux et des courants d'air.",
    'Hold a jacket or scarf over the smoke. Wool keeps oud for days.': "Tenez une veste ou une écharpe au-dessus de la fumée. La laine garde l'oud des jours.",
    'On a stable surface, away from direct sun and radiators.': 'Sur une surface stable, loin du soleil direct et des radiateurs.',
    'Let them soak for an hour before the first turn.': 'Laissez-les imbiber une heure avant le premier retournement.',
    'Wet side up. That is the entire maintenance.': "Côté humide vers le haut. C'est tout l'entretien.",
    'In a bathroom, use two. In an open salon, three.': 'Dans une salle de bain, deux suffisent. Dans un grand salon, trois.',
    'Pour qui': 'Pour qui', 'Le coffret': 'Le coffret', 'Le contenu': 'Le contenu',
    'Personnalisation': 'Personnalisation', 'Livraison': 'Livraison',
    'Birthday': 'Anniversaire', 'Wedding': 'Mariage', 'Anniversary': 'Anniversaire de mariage', 'Eid': 'Aïd',
    'Ramadan': 'Ramadan', 'Housewarming': 'Crémaillère', 'Corporate': 'Entreprises', 'Just Because': 'Sans raison',
    '100 ODYS points = a custom coffret like this one, free, to keep or to gift.': '100 points ODYS = un coffret comme celui-ci, offert, à garder ou à offrir.',
    'Tier I · 10K views': 'Palier I · 10K vues', 'Tier II · 50K views': 'Palier II · 50K vues',
    'Tier III · 250K views': 'Palier III · 250K vues', 'Tier IV · 1M views': 'Palier IV · 1M vues'
  }
});

I18N.add('ar', {
  t: {
    'Per parfum 50 ML': 'لكل عطر 50 مل', 'Every bottle you buy, whatever the scent.': 'كل قارورة تشتريها، مهما كان العطر.',
    'Per': 'لكل', 'g of oud': 'غ من العود', 'Grams of oud': 'غرامات العود', 'Parfums 50 ML': 'عطور 50 مل',
    '10 g is 2 points. 100 g is 20 — a free perfume in a single order.': '10 غ تساوي نقطتين، و100 غ تساوي 20 نقطة — عطر مجاني في طلب واحد.',
    'Outside the programme by design:': 'خارج البرنامج عن قصد:', 'is already the floor price.': 'هو السعر الأدنى أصلاً.',
    'Create your account': 'أنشئ حسابك', 'Your points start counting from the first order.': 'تبدأ نقاطك من أول طلب.',
    'Take the fragrance quiz': 'اخضع لاختبار العطر', 'Three questions, and the shop reorders itself around you.': 'ثلاثة أسئلة، ويعيد المتجر ترتيب نفسه حولك.',
    'Buy your first parfum': 'اشترِ عطرك الأول', 'Add oud by the gram': 'أضف العود بالغرام',
    'Every': 'كل', 'g is another point.': 'غ تعني نقطة إضافية.', 'Reach': 'اجمع', 'points': 'نقطة',
    'Or hold for': 'أو انتظر حتى', 'A free 50 ML perfume, any scent in the house.': 'عطر 50 مل مجاني، أي عطر في الدار.',
    'A custom coffret, wrapped and sent to whoever you choose.': 'علبة مخصّصة، مغلّفة وتُرسل لمن تختار.',
    'Begin another journey': 'ابدأ رحلة جديدة', 'The points reset. The collection does not.': 'النقاط تعود للصفر، أما المجموعة فلا.',
    'points short of': 'نقطة تفصلك عن', 'Everything on the ladder is unlocked.': 'كل درجات السلّم مفتوحة.',
    'That basket already contains a free perfume.': 'هذه السلة تحتوي أصلاً على عطر مجاني.',
    'Perfumes alone:': 'العطور وحدها:', 'oud adds': 'والعود يضيف',
    'Sold by the gram': 'يُباع بالغرام', 'Sliding scale': 'سعر تنازلي', 'Special order': 'طلب خاص',
    'From': 'ابتداءً من', 'The price per gram falls at every tier': 'سعر الغرام ينخفض مع كل مستوى',
    'Above': 'فوق', 'special rate on request': 'تسعيرة خاصة حسب الطلب', 'points = a free perfume': 'نقطة = عطر مجاني',
    'ODYS points': 'نقطة أوديس', 'special rate, confirmed before shipping': 'تسعيرة خاصة تُؤكَّد قبل الشحن',
    '5 g = 1 point': '5 غ = نقطة', 'Every 5 g = 1 ODYS point, whatever the batch': 'كل 5 غ = نقطة أوديس، مهما كان النوع',
    'Limited': 'محدود', 'New': 'جديد',
    'Let the flame catch for three or four seconds, no longer.': 'اترك اللهب يمسك ثلاث أو أربع ثوانٍ، لا أكثر.',
    'You want an ember, not a fire. The smoke should be thin and steady.': 'تريد جمرة لا نارًا. يجب أن يكون الدخان رفيعًا ومنتظمًا.',
    'In sand, a holder or a mabkhara — away from curtains and draughts.': 'في الرمل أو حامل أو مبخرة — بعيدًا عن الستائر والتيارات.',
    'Hold a jacket or scarf over the smoke. Wool keeps oud for days.': 'أمسك سترة أو شالاً فوق الدخان. الصوف يحتفظ بالعود أيامًا.',
    'On a stable surface, away from direct sun and radiators.': 'على سطح ثابت، بعيدًا عن الشمس المباشرة والمدفأة.',
    'Let them soak for an hour before the first turn.': 'اتركها تتشبّع ساعة قبل أول قلب.',
    'Wet side up. That is the entire maintenance.': 'الجهة المبللة إلى الأعلى. هذه كل العناية.',
    'In a bathroom, use two. In an open salon, three.': 'في الحمام يكفي عودان، وفي صالون واسع ثلاثة.',
    'Pour qui': 'لمن هي', 'Le coffret': 'العلبة', 'Le contenu': 'المحتوى',
    'Personnalisation': 'التخصيص', 'Livraison': 'التوصيل',
    'Birthday': 'عيد ميلاد', 'Wedding': 'زفاف', 'Anniversary': 'ذكرى سنوية', 'Eid': 'العيد',
    'Ramadan': 'رمضان', 'Housewarming': 'منزل جديد', 'Corporate': 'الشركات', 'Just Because': 'بدون سبب',
    '100 ODYS points = a custom coffret like this one, free, to keep or to gift.': '100 نقطة أوديس = علبة مثل هذه، مجانًا، تحتفظ بها أو تهديها.',
    'Tier I · 10K views': 'المستوى الأول · 10 آلاف مشاهدة', 'Tier II · 50K views': 'المستوى الثاني · 50 ألف مشاهدة',
    'Tier III · 250K views': 'المستوى الثالث · 250 ألف مشاهدة', 'Tier IV · 1M views': 'المستوى الرابع · مليون مشاهدة'
  }
});

/* ── pass 3 ── */
/* ODYS — third pass: long-form UI sentences (FAQ, referrals, PDP boilerplate, reviews). */
I18N.add('fr', {
  t: {
    'Bâtonnets d’oud · vendus au gramme': "Bâtonnets d'oud · vendus au gramme",
    'in steps of': 'par paliers de',
    'the special rate applies and our team confirms the final price before shipping.': "le tarif spécial s'applique et notre équipe confirme le prix final avant expédition.",
    'special rate, confirmed by our team': 'tarif spécial, confirmé par notre équipe',
    'Free shipping over': 'Livraison offerte dès', 'Ships from Casablanca in 24h': 'Expédié de Casablanca sous 24h',
    'Scored by our perfumer and cross-checked against': 'Noté par notre parfumeur et recoupé avec',
    'customer reviews.': 'avis clients.',
    'A 50 ML parfum is': 'Un parfum 50 ML coûte',
    'and one point. Twenty points is the next one free.': 'et vaut un point. Vingt points, et le suivant est offert.',
    'Six hours on skin and my scarf still smells of it the next morning. At this price I bought three.':
      "Six heures sur la peau, et mon écharpe le sent encore le lendemain. À ce prix, j'en ai pris trois.",
    'Third order. The points add up faster than you think — my last bottle was free.':
      'Troisième commande. Les points montent plus vite qu’on ne croit — mon dernier flacon était offert.',
    'Beautiful, but stronger than I expected — one spray is plenty in summer.':
      'Magnifique, mais plus puissant que prévu — une pulvérisation suffit en été.',
    'No. They are priced at 49 MAD and sit outside the programme — the discount is already in the price.':
      'Non. Ils sont à 49 MAD et restent hors programme — la remise est déjà dans le prix.',
    'Every 5 g is one point, including special orders. 15 g = 3 points, 100 g = 20.':
      'Chaque 5 g vaut un point, commandes spéciales comprises. 15 g = 3 points, 100 g = 20.',
    'They rest after 18 months without an order. One purchase restarts the clock.':
      'Ils sont mis en veille après 18 mois sans commande. Un achat relance le compteur.',
    'No — points buy whole products at 20, 50 and 100. It is worth more that way, and it is simpler to explain.':
      'Non — les points achètent des produits entiers à 20, 50 et 100. Cela vaut plus, et c’est plus simple à expliquer.',
    'The points come back out of the balance. Nothing dramatic.':
      'Les points sont retirés du solde. Rien de dramatique.',
    'Yes. The 100-point coffret is built to be sent to someone else — you compose it, we wrap it, they open it.':
      'Oui. Le coffret à 100 points est fait pour être envoyé — vous le composez, nous l’emballons, il l’ouvre.',
    'Credited the moment your friend creates an account with your link.':
      'Crédités dès que votre ami crée un compte avec votre lien.',
    'Five points is a quarter of a free perfume, for doing nothing.':
      'Cinq points, c’est un quart de parfum offert, sans rien faire.',
    'Your friend gets 10% off their first order. Nobody arrives empty-handed.':
      'Votre ami obtient 10% sur sa première commande. Personne n’arrive les mains vides.',
    'Other': 'Autre', 'Blog / Newsletter': 'Blog / Newsletter',
    '1 point': '1 point', '0 point': '0 point'
  },
  r: [[/^(\d+) reviews$/, '$1 avis'], [/^([\d,]+) MAD · 1 point\.$/, '$1 MAD · 1 point.'],
      [/^\+(\d+) points?$/, '+$1 points'], [/^(\d+) pts$/, '$1 pts']]
});

I18N.add('ar', {
  t: {
    'Bâtonnets d’oud · vendus au gramme': 'أعواد عود · تُباع بالغرام',
    'in steps of': 'بخطوات من',
    'the special rate applies and our team confirms the final price before shipping.': 'تُطبَّق التسعيرة الخاصة ويؤكّد فريقنا السعر النهائي قبل الشحن.',
    'special rate, confirmed by our team': 'تسعيرة خاصة، يؤكّدها فريقنا',
    'Free shipping over': 'شحن مجاني فوق', 'Ships from Casablanca in 24h': 'يُشحن من الدار البيضاء خلال 24 ساعة',
    'Scored by our perfumer and cross-checked against': 'قيّمها صانع العطور لدينا وقورنت بـ',
    'customer reviews.': 'تقييمًا من الزبائن.',
    'A 50 ML parfum is': 'عطر 50 مل بـ',
    'and one point. Twenty points is the next one free.': 'ويمنح نقطة. عشرون نقطة، والعطر التالي مجاني.',
    'Six hours on skin and my scarf still smells of it the next morning. At this price I bought three.':
      'ست ساعات على الجلد، وما زال شالي يحمل رائحته في الصباح. بهذا السعر اشتريت ثلاثة.',
    'Third order. The points add up faster than you think — my last bottle was free.':
      'الطلب الثالث. النقاط تتراكم أسرع مما تظن — قارورتي الأخيرة كانت مجانية.',
    'Beautiful, but stronger than I expected — one spray is plenty in summer.':
      'جميل، لكنه أقوى مما توقعت — بخة واحدة تكفي في الصيف.',
    'No. They are priced at 49 MAD and sit outside the programme — the discount is already in the price.':
      'لا. سعرها 49 درهمًا وهي خارج البرنامج — التخفيض موجود في السعر أصلاً.',
    'Every 5 g is one point, including special orders. 15 g = 3 points, 100 g = 20.':
      'كل 5 غرامات تساوي نقطة، بما في ذلك الطلبات الخاصة. 15 غ = 3 نقاط، و100 غ = 20.',
    'They rest after 18 months without an order. One purchase restarts the clock.':
      'تُجمَّد بعد 18 شهرًا بلا طلب. شراء واحد يعيد تشغيل العدّاد.',
    'No — points buy whole products at 20, 50 and 100. It is worth more that way, and it is simpler to explain.':
      'لا — النقاط تشتري منتجات كاملة عند 20 و50 و100. القيمة أكبر والشرح أبسط.',
    'The points come back out of the balance. Nothing dramatic.':
      'تُخصم النقاط من الرصيد. لا شيء معقّد.',
    'Yes. The 100-point coffret is built to be sent to someone else — you compose it, we wrap it, they open it.':
      'نعم. علبة الـ100 نقطة مصمّمة لتُرسل لشخص آخر — تصنعها أنت، ونغلّفها نحن، ويفتحها هو.',
    'Credited the moment your friend creates an account with your link.':
      'تُضاف فور إنشاء صديقك حسابًا عبر رابطك.',
    'Five points is a quarter of a free perfume, for doing nothing.':
      'خمس نقاط تعادل ربع عطر مجاني، دون أي مجهود.',
    'Your friend gets 10% off their first order. Nobody arrives empty-handed.':
      'يحصل صديقك على 10% من أول طلب. لا أحد يأتي فارغ اليدين.',
    'Coffret découverte offert · code perso à 10%': 'علبة اكتشاف مجانية · كود خاص بخصم 10%',
    "3 parfums + 30 g d'oud · 12% de commission": '3 عطور + 30 غ عود · عمولة 12%',
    'Batch Royal Noir · accès anticipé · événements': 'دفعة ملكي أسود · وصول مبكر · فعاليات',
    'Éditions limitées · cachets campagne · déplacements': 'إصدارات محدودة · أتعاب الحملات · أسفار',
    'Other': 'أخرى', 'Blog / Newsletter': 'مدونة / نشرة',
    '1 point': 'نقطة واحدة', '0 point': 'صفر نقطة'
  },
  r: [[/^(\d+) reviews$/, '$1 تقييمًا'], [/^([\d,]+) MAD · 1 point\.$/, '$1 درهم · نقطة واحدة.'],
      [/^\+(\d+) points?$/, '+$1 نقطة'], [/^(\d+) pts$/, '$1 نقطة'], [/^(\d+) points$/, '$1 نقطة']]
});

/* ── pass 4 ── */
/* ODYS — fourth pass: the last page-level sentences. */
I18N.add('fr', {
  t: {
    'Twelve compositions at 69 MAD, six diffuseurs at 49 MAD, six batches of oud sold by the gram. Filter until one of them sounds like you — or let the house choose.':
      'Douze compositions à 69 MAD, six diffuseurs à 49 MAD, six lots d\'oud vendus au gramme. Filtrez jusqu\'à ce que l\'un d\'eux vous ressemble — ou laissez la maison choisir.',
    'Nothing matches that combination yet.': 'Aucun résultat pour cette combinaison.',
    'Try the fragrance quiz': 'Faites le test olfactif',
    'The quiz reads intensity and occasion, not just family — which is why people keep what it picks.':
      'Le test lit l\'intensité et l\'occasion, pas seulement la famille — c\'est pourquoi on garde ce qu\'il choisit.',
    'Every diffuseur is': 'Chaque diffuseur est à',
    '— 50 ML of concentrate and three rattan sticks in the box. Turn them once a week and one bottle carries a room for two months.':
      '— 50 ML de concentré et trois bâtonnets de rotin dans la boîte. Retournez-les une fois par semaine : un flacon tient une pièce deux mois.',
    'The housewarming answer — personalised, wrapped, and sent straight to them if you want.':
      'La réponse à une crémaillère — personnalisé, emballé, et envoyé directement si vous le souhaitez.',
    'Create your account and every parfum and every 5 g of oud starts counting toward a free perfume.':
      'Créez votre compte : chaque parfum et chaque 5 g d\'oud comptent vers un parfum offert.',
    'Nine categories, no filler. Written by the people who compose and buy the raw materials.':
      'Neuf catégories, sans remplissage. Écrit par celles et ceux qui composent et achètent les matières.',
    'Review a fragrance you own, upload a photo of your shelf, vote for next month\'s edit.':
      'Notez un parfum que vous possédez, publiez une photo de votre étagère, votez pour la sélection du mois.',
    'Tag @odysparfum and the best three each month receive a discovery set.':
      'Identifiez @odysparfum : les trois meilleures publications du mois reçoivent un coffret découverte.',
    'Not a personality test. Three practical questions — world, intensity, occasion — scored against every composition in the house.':
      'Pas un test de personnalité. Trois questions concrètes — univers, intensité, occasion — évaluées sur toute la maison.',
    'At 69 MAD a bottle, a coffret duo costs less than most single bottles elsewhere — and it is two points instead of one.':
      'À 69 MAD le flacon, un coffret duo coûte moins qu\'un seul flacon ailleurs — et vaut deux points au lieu d\'un.',
    'Each collection is a different reason to wear something. Start where your life actually is.':
      'Chaque collection est une raison différente de se parfumer. Commencez là où vous en êtes.',
    'Composez-le': 'Composez-le', '1 point / 5 g': '1 point / 5 g'
  }
});

I18N.add('ar', {
  t: {
    'Twelve compositions at 69 MAD, six diffuseurs at 49 MAD, six batches of oud sold by the gram. Filter until one of them sounds like you — or let the house choose.':
      'اثنتا عشرة تركيبة بـ69 درهمًا، وست مبخّرات بـ49 درهمًا، وستة أنواع عود تُباع بالغرام. صفِّ حتى تجد ما يشبهك — أو دع الدار تختار.',
    'Nothing matches that combination yet.': 'لا نتائج لهذا المزيج بعد.',
    'Try the fragrance quiz': 'جرّب اختبار العطر',
    'The quiz reads intensity and occasion, not just family — which is why people keep what it picks.':
      'الاختبار يقرأ القوة والمناسبة، لا العائلة وحدها — لذلك يحتفظ الناس بما يختاره.',
    'Every diffuseur is': 'كل مبخّرة بـ',
    '— 50 ML of concentrate and three rattan sticks in the box. Turn them once a week and one bottle carries a room for two months.':
      '— 50 مل من المركّز وثلاثة أعواد روطان في العلبة. اقلبها مرة كل أسبوع، وقارورة واحدة تكفي غرفة لشهرين.',
    'The housewarming answer — personalised, wrapped, and sent straight to them if you want.':
      'هدية البيت الجديد — مخصّصة، مغلّفة، وتُرسل مباشرة إن أردت.',
    'Create your account and every parfum and every 5 g of oud starts counting toward a free perfume.':
      'أنشئ حسابك: كل عطر وكل 5 غرامات من العود تُحتسب نحو عطر مجاني.',
    'Nine categories, no filler. Written by the people who compose and buy the raw materials.':
      'تسع فئات بلا حشو. يكتبها من يركّبون العطور ويشترون الموادّ الخام.',
    'Review a fragrance you own, upload a photo of your shelf, vote for next month\'s edit.':
      'قيّم عطرًا تملكه، وانشر صورة لرفّك، وصوّت لمختارات الشهر المقبل.',
    'Tag @odysparfum and the best three each month receive a discovery set.':
      'ضع وسم @odysparfum، وأفضل ثلاث مشاركات كل شهر تحصل على علبة اكتشاف.',
    'Not a personality test. Three practical questions — world, intensity, occasion — scored against every composition in the house.':
      'ليس اختبار شخصية. ثلاثة أسئلة عملية — العالم، القوة، المناسبة — تُقاس على كل تركيبات الدار.',
    'At 69 MAD a bottle, a coffret duo costs less than most single bottles elsewhere — and it is two points instead of one.':
      'بـ69 درهمًا للقارورة، تكلّف العلبة الثنائية أقل من قارورة واحدة في أماكن أخرى — وتمنح نقطتين بدل واحدة.',
    'Each collection is a different reason to wear something. Start where your life actually is.':
      'كل مجموعة سبب مختلف للتعطّر. ابدأ من حيث أنت فعلاً.',
    'Composez-le': 'اصنعها بنفسك', '1 point / 5 g': 'نقطة / 5 غ'
  }
});

/* ── pass 5 ── */
/* ODYS — fifth pass: the trio hero, WhatsApp ordering and the money-based point rule. */
I18N.add('fr', {
  t: {
    /* trio band */
    'Start here': 'Commencez ici',
    'Three 50 ML parfums you choose, one flat price, delivery included.':
      'Trois parfums 50 ML que vous choisissez, un prix unique, livraison comprise.',
    'you save': 'vous économisez', 'Compose the trio': 'Composer le trio',
    'LE TRIO': 'LE TRIO', '3 parfums 50 ML · 199 MAD': '3 parfums 50 ML · 199 MAD',
    'Three scents you choose, one flat price, delivery included. The way most people start.':
      'Trois parfums à choisir, un prix unique, livraison comprise. La façon dont la plupart commencent.',
    'Prix forfaitaire': 'Prix forfaitaire', 'Remise coffret': 'Remise coffret',

    /* whatsapp + trust */
    'Order on WhatsApp': 'Commander sur WhatsApp',
    'Or leave your address here': 'Ou laissez votre adresse ici',
    'Send order on WhatsApp': 'Envoyer la commande sur WhatsApp',
    'Cash on delivery · 24–72h across Morocco · we confirm every order by message before shipping':
      'Paiement à la livraison · 24–72h partout au Maroc · nous confirmons chaque commande par message avant l\'envoi',
    'Opens WhatsApp with your basket and address already written. Nothing is charged online.':
      'Ouvre WhatsApp avec votre panier et votre adresse déjà rédigés. Aucun paiement en ligne.',
    'Order on WhatsApp · cash on delivery across Morocco': 'Commandez sur WhatsApp · paiement à la livraison',
    'Casablanca · cash on delivery': 'Casablanca · paiement à la livraison',
    'Hello ODYS, I have a question': 'Bonjour ODYS, j\'ai une question',
    'Hello ODYS, I would like to order:': 'Bonjour ODYS, je souhaite commander :',

    /* points */
    'first reward': 'première récompense',
    'Six batches of bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musk, Royal Noir. Take 5 g or 100 g; the rate falls as the weight rises, and every 69 MAD of oud is one ODYS point.':
      "Six lots de bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musc, Royal Noir. De 5 g à 100 g : le tarif baisse avec le poids, et chaque 69 MAD d'oud vaut un point ODYS.",
    'Every 69 MAD you spend is one point — a parfum is exactly one. Three points and we add a discovery vial to your next order; twenty and you choose any perfume in the house, free. Diffuseurs stay out of it, because 49 MAD is already the floor.':
      'Chaque 69 MAD dépensé vaut un point — un parfum en vaut exactement un. À trois points, nous glissons une fiole découverte dans votre prochaine commande ; à vingt, vous choisissez le parfum que vous voulez, offert. Les diffuseurs restent hors programme : 49 MAD est déjà le prix plancher.',
    'pts': 'pts', 'pt': 'pt', 'Earn': 'Gagnez',
    "You'll earn": 'Vous gagnerez', 'Applied:': 'Appliqué :',
    'MAD is another point.': 'MAD, un point de plus.',
    'On everything you pay for except diffuseurs — a parfum is exactly one point.':
      'Sur tout ce que vous payez, sauf les diffuseurs — un parfum vaut exactement un point.',
    'Your first reward': 'Votre première récompense',
    'A discovery vial, close enough to reach on a first order.':
      'Une fiole découverte, atteignable dès la première commande.',
    'points = your first reward': 'points = votre première récompense',
    'Basket:': 'Panier :',
    'A discovery vial': 'Une fiole découverte',
    '2 ML of any fragrance, added to your next order': '2 ML du parfum de votre choix, ajouté à votre prochaine commande',
    'A free diffuseur': 'Un diffuseur offert',
    'Any 50 ML diffuseur + 3 sticks': 'Un diffuseur 50 ML + 3 bâtonnets',
    'Every 69 MAD spent earns a point · first reward at 3': 'Chaque 69 MAD dépensé rapporte un point · première récompense à 3',
    'A free perfume unlocked · a vial with every order': 'Un parfum offert débloqué · une fiole à chaque commande'
  },
  r: [
    [/^Earn 1 point per (\d+) MAD$/, '1 point par $1 MAD'],
    [/^\+1 point per (\d+) MAD$/, '+1 point par $1 MAD'],
    [/^per (\d+) MAD$/, 'par $1 MAD'],
    [/^Discovery vial added to this order$/, 'Fiole découverte ajoutée à cette commande'],
    [/^(\d+) × free diffuseur$/, '$1 × diffuseur offert'],
    [/^(\d+) × free perfume$/, '$1 × parfum offert']
  ]
});

I18N.add('ar', {
  t: {
    'Start here': 'ابدأ من هنا',
    'Three 50 ML parfums you choose, one flat price, delivery included.':
      'ثلاثة عطور 50 مل تختارها بنفسك، بسعر واحد، والتوصيل مجاني.',
    'you save': 'توفّر', 'Compose the trio': 'كوّن الثلاثية',
    'LE TRIO': 'الثلاثية', '3 parfums 50 ML · 199 MAD': '3 عطور 50 مل · 199 درهم',
    'Three scents you choose, one flat price, delivery included. The way most people start.':
      'ثلاثة عطور تختارها، سعر واحد، وتوصيل مجاني. هكذا يبدأ معظم الناس.',
    'Prix forfaitaire': 'سعر موحّد', 'Remise coffret': 'خصم العلبة',

    'Order on WhatsApp': 'اطلب عبر واتساب',
    'Or leave your address here': 'أو اترك عنوانك هنا',
    'Send order on WhatsApp': 'أرسل الطلب عبر واتساب',
    'Cash on delivery · 24–72h across Morocco · we confirm every order by message before shipping':
      'الدفع عند التسليم · 24 إلى 72 ساعة في كل المغرب · نؤكّد كل طلب برسالة قبل الشحن',
    'Opens WhatsApp with your basket and address already written. Nothing is charged online.':
      'يفتح واتساب وسلتك وعنوانك مكتوبان مسبقًا. لا دفع عبر الإنترنت.',
    'Order on WhatsApp · cash on delivery across Morocco': 'اطلب عبر واتساب · الدفع عند التسليم',
    'Casablanca · cash on delivery': 'الدار البيضاء · الدفع عند التسليم',
    'Hello ODYS, I have a question': 'مرحبًا أوديس، لدي سؤال',
    'Hello ODYS, I would like to order:': 'مرحبًا أوديس، أود أن أطلب:',

    'first reward': 'أول مكافأة',
    'Six batches of bâtonnets — Malaki, Cambodi, Hindi, Rose & Oud, Musk, Royal Noir. Take 5 g or 100 g; the rate falls as the weight rises, and every 69 MAD of oud is one ODYS point.':
      'ستة أنواع من أعواد العود — ملكي، كمبودي، هندي، ورد وعود، مسك، ملكي أسود. من 5 غرامات إلى 100: يقل السعر كلما زاد الوزن، وكل 69 درهمًا من العود تساوي نقطة.',
    'Every 69 MAD you spend is one point — a parfum is exactly one. Three points and we add a discovery vial to your next order; twenty and you choose any perfume in the house, free. Diffuseurs stay out of it, because 49 MAD is already the floor.':
      'كل 69 درهمًا تنفقه يساوي نقطة — والعطر يساوي نقطة واحدة بالضبط. عند ثلاث نقاط نضيف قارورة اكتشاف إلى طلبك القادم، وعند عشرين تختار أي عطر في الدار مجانًا. المبخّرات خارج البرنامج لأن 49 درهمًا هو السعر الأدنى أصلاً.',
    'pts': 'نقاط', 'pt': 'نقطة', 'Earn': 'اكسب',
    "You'll earn": 'ستجمع', 'Applied:': 'مطبَّق:',
    'MAD is another point.': 'درهمًا تعني نقطة إضافية.',
    'On everything you pay for except diffuseurs — a parfum is exactly one point.':
      'على كل ما تدفعه ما عدا المبخّرات — العطر يساوي نقطة واحدة بالضبط.',
    'Your first reward': 'مكافأتك الأولى',
    'A discovery vial, close enough to reach on a first order.':
      'قارورة اكتشاف صغيرة، قريبة بما يكفي من أول طلب.',
    'points = your first reward': 'نقاط = مكافأتك الأولى',
    'Basket:': 'السلة:',
    'A discovery vial': 'قارورة اكتشاف',
    '2 ML of any fragrance, added to your next order': '2 مل من أي عطر، تُضاف إلى طلبك القادم',
    'A free diffuseur': 'مبخّرة مجانية',
    'Any 50 ML diffuseur + 3 sticks': 'أي مبخّرة 50 مل + 3 أعواد',
    'Every 69 MAD spent earns a point · first reward at 3': 'كل 69 درهمًا تمنحك نقطة · أول مكافأة عند 3',
    'A free perfume unlocked · a vial with every order': 'عطر مجاني مفتوح · قارورة اكتشاف مع كل طلب'
  },
  r: [
    [/^Earn 1 point per (\d+) MAD$/, 'نقطة واحدة لكل $1 درهم'],
    [/^\+1 point per (\d+) MAD$/, 'نقطة لكل $1 درهم'],
    [/^per (\d+) MAD$/, 'لكل $1 درهم'],
    [/^Discovery vial added to this order$/, 'أُضيفت قارورة اكتشاف إلى هذا الطلب'],
    [/^(\d+) × free diffuseur$/, '$1 × مبخّرة مجانية'],
    [/^(\d+) × free perfume$/, '$1 × عطر مجاني']
  ]
});

/* ── pass 6 ── */
/* ODYS — sixth pass: copy introduced by the money-based point rule and WhatsApp ordering. */
I18N.add('fr', {
  t: {
    'Try the trio': 'Essayer le trio', 'You have': 'Vous avez', 'Journey complete': 'Voyage accompli',
    '69 MAD = 1 point': '69 MAD = 1 point',
    'Every 69 MAD of oud = 1 ODYS point, whatever the batch': 'Chaque 69 MAD d\'oud = 1 point ODYS, quel que soit le lot',
    'Earn 1 point — 3 points is a discovery vial': 'Gagnez 1 point — 3 points, c\'est une fiole découverte',
    'No percentages, no tiers to decode. Every 69 MAD you pay is one point — a parfum is exactly one. Three points is a discovery vial, twenty is a perfume you don\'t pay for.':
      'Pas de pourcentages, pas de paliers à décoder. Chaque 69 MAD payé vaut un point — un parfum en vaut exactement un. Trois points, c\'est une fiole découverte ; vingt, un parfum que vous ne payez pas.',
    'The first rung lands on a first order. Nothing expires while you are still buying.':
      'Le premier palier s\'atteint dès la première commande. Rien n\'expire tant que vous commandez.',
    'Like everything else — by what you pay. Every 69 MAD of oud is one point, whichever batch or weight you choose.':
      'Comme tout le reste — selon ce que vous payez. Chaque 69 MAD d\'oud vaut un point, quel que soit le lot ou le poids.',
    'No — points buy whole products at 3, 8, 20, 50 and 100. It is worth more that way, and it is simpler to explain.':
      'Non — les points achètent des produits entiers à 3, 8, 20, 50 et 100. Cela vaut plus, et c\'est plus simple à expliquer.',
    /* heart-note fallbacks on oud pages (first clause of each character line) */
    'Sweet ambered smoke': 'Fumée ambrée et sucrée', 'Sweet': 'Sucré', 'Dense': 'Dense',
    'Soft powdered smoke': 'Fumée poudrée et douce', 'Deep resin': 'Résine profonde'
  },
  r: [
    [/^1 point \/ (\d+) MAD$/, '1 point / $1 MAD'],
    [/^(\d+) rewards? ready to use$/, '$1 récompense(s) prête(s)'],
    [/^(\d+) rewards? waiting in your bag$/, '$1 récompense(s) dans votre panier'],
    [/^(\d+) held$/, '$1 en attente'],
    [/^Send order on WhatsApp · (.+)$/, 'Envoyer la commande sur WhatsApp · $1'],
    [/^Add to cart · (.+)$/, 'Ajouter au panier · $1'],
    [/^Extrait de Parfum · (\d+) ML$/, 'Extrait de Parfum · $1 ML'],
    [/^Eau de Parfum · (\d+) ML$/, 'Eau de Parfum · $1 ML']
  ]
});

I18N.add('ar', {
  t: {
    'Try the trio': 'جرّب الثلاثية', 'You have': 'لديك', 'Journey complete': 'اكتملت الرحلة',
    '69 MAD = 1 point': '69 درهمًا = نقطة',
    'Every 69 MAD of oud = 1 ODYS point, whatever the batch': 'كل 69 درهمًا من العود = نقطة أوديس، مهما كان النوع',
    'Earn 1 point — 3 points is a discovery vial': 'اكسب نقطة — 3 نقاط تساوي قارورة اكتشاف',
    'No percentages, no tiers to decode. Every 69 MAD you pay is one point — a parfum is exactly one. Three points is a discovery vial, twenty is a perfume you don\'t pay for.':
      'لا نسب مئوية ولا مستويات معقّدة. كل 69 درهمًا تدفعها تساوي نقطة — والعطر يساوي نقطة بالضبط. ثلاث نقاط = قارورة اكتشاف، وعشرون = عطر لا تدفع ثمنه.',
    'The first rung lands on a first order. Nothing expires while you are still buying.':
      'الدرجة الأولى في متناولك من أول طلب. ولا شيء ينتهي ما دمت تشتري.',
    'Like everything else — by what you pay. Every 69 MAD of oud is one point, whichever batch or weight you choose.':
      'مثل كل شيء آخر — حسب ما تدفعه. كل 69 درهمًا من العود تساوي نقطة، مهما كان النوع أو الوزن.',
    'No — points buy whole products at 3, 8, 20, 50 and 100. It is worth more that way, and it is simpler to explain.':
      'لا — النقاط تشتري منتجات كاملة عند 3 و8 و20 و50 و100. القيمة أكبر والشرح أبسط.',
    'Sweet ambered smoke': 'دخان عنبري حلو', 'Sweet': 'حلو', 'Dense': 'كثيف',
    'Soft powdered smoke': 'دخان بودري ناعم', 'Deep resin': 'راتنج عميق'
  },
  r: [
    [/^1 point \/ (\d+) MAD$/, 'نقطة / $1 درهم'],
    [/^(\d+) rewards? ready to use$/, '$1 مكافأة جاهزة'],
    [/^(\d+) rewards? waiting in your bag$/, '$1 مكافأة بانتظارك'],
    [/^(\d+) held$/, '$1 محفوظة'],
    [/^Send order on WhatsApp · (.+)$/, 'أرسل الطلب عبر واتساب · $1'],
    [/^Add to cart · (.+)$/, 'أضف إلى السلة · $1'],
    [/^Extrait de Parfum · (\d+) ML$/, 'إكستريه دو بارفان · $1 مل'],
    [/^Eau de Parfum · (\d+) ML$/, 'أو دو بارفان · $1 مل']
  ]
});

/* ── pass 7: reviews notice, help & policies page ── */
I18N.add('fr', {
  h: {
    'Everything before you order.': 'Tout, avant de commander.'
  },
  t: {
    'No reviews yet.': 'Pas encore d\'avis.',
    'Reviews open to customers once their order is delivered. Ask us anything in the meantime.':
      'Les avis s\'ouvrent aux clients une fois leur commande livrée. D\'ici là, posez-nous vos questions.',
    'Ask on WhatsApp': 'Demander sur WhatsApp', 'Scored by our perfumer.': 'Noté par notre parfumeur.',
    'Help & policies': 'Aide & conditions', 'Payment': 'Paiement', 'Delivery': 'Livraison',
    'Returns': 'Retours', 'Privacy': 'Confidentialité', 'Terms': 'Conditions', 'Sections': 'Rubriques',
    'Delivery, returns, payment and the small print — in plain words. If something isn\'t here, ask us on WhatsApp.':
      'Livraison, retours, paiement et petites lignes — en clair. S\'il manque quelque chose, demandez-nous sur WhatsApp.',
    'Across Morocco in 24–72h. Casablanca is usually next day.': 'Partout au Maroc en 24 à 72h. Casablanca, généralement le lendemain.',
    'Free delivery from': 'Livraison offerte dès', 'Below that, a flat': 'En dessous, forfait de',
    'We confirm every order by WhatsApp message before it leaves Casablanca. If we cannot reach you, we do not ship.':
      'Nous confirmons chaque commande par message WhatsApp avant qu\'elle quitte Casablanca. Sans réponse de votre part, nous n\'expédions pas.',
    'Gift coffrets can go straight to the recipient, with prices hidden.':
      'Les coffrets cadeaux peuvent partir directement chez le destinataire, prix masqués.',
    'You have 7 days from delivery to return an unopened product.':
      'Vous disposez de 7 jours après la livraison pour retourner un produit non ouvert.',
    'Opened fragrances and burned oud cannot be returned — unless they arrived damaged or not as described.':
      'Les parfums ouverts et l\'oud brûlé ne sont pas repris — sauf s\'ils sont arrivés abîmés ou non conformes.',
    'Something broken in transit? Send us a photo on WhatsApp within 48 hours and we replace it free.':
      'Un article cassé pendant le transport ? Envoyez-nous une photo sur WhatsApp sous 48 heures, nous le remplaçons gratuitement.',
    'Refunds are made within 14 days of us receiving the item.':
      'Le remboursement intervient sous 14 jours après réception de l\'article.',
    'Cash on delivery, everywhere we ship. Bank transfer on request.':
      'Paiement à la livraison partout où nous livrons. Virement bancaire sur demande.',
    'Nothing is charged online.': 'Aucun paiement en ligne.',
    'Prices are in MAD, taxes included.': 'Les prix sont en MAD, toutes taxes comprises.',
    'How long does a 50 ML bottle last?': 'Combien de temps dure un flacon de 50 ML ?',
    'About 500 sprays — three to four months of daily wear.': 'Environ 500 pulvérisations — trois à quatre mois d\'usage quotidien.',
    'How long does a stick of oud burn?': 'Combien de temps brûle un bâtonnet d\'oud ?',
    'Around thirty minutes once the flame is blown out. The oud page shows the full ritual.':
      'Une trentaine de minutes une fois la flamme soufflée. La page oud détaille tout le rituel.',
    'Can I change or cancel my order?': 'Puis-je modifier ou annuler ma commande ?',
    'Yes, until we confirm it by message — just reply to that message.':
      'Oui, tant que nous ne l\'avons pas confirmée par message — il suffit de répondre à ce message.',
    'Can I send a coffret as a gift?': 'Puis-je offrir un coffret ?',
    'Yes. Choose "It\'s a gift" first in the builder, and we deliver to the recipient with prices hidden.':
      'Oui. Choisissez « C\'est un cadeau » en premier dans le configurateur : nous livrons le destinataire, prix masqués.',
    'No. They are already priced at the floor.': 'Non. Leur prix est déjà au plus bas.',
    'Where are you based?': 'Où êtes-vous basés ?', 'Casablanca. We deliver across Morocco.': 'À Casablanca. Nous livrons partout au Maroc.',
    'Monday to Saturday, 10:00–19:00.': 'Du lundi au samedi, 10h–19h.',
    'We only ask for what a delivery needs: your name, phone number and address.':
      'Nous ne demandons que ce qu\'il faut pour livrer : votre nom, votre téléphone et votre adresse.',
    'We use it to confirm and deliver your order and to keep your points. We never sell it.':
      'Ces informations servent à confirmer et livrer votre commande et à conserver vos points. Nous ne les vendons jamais.',
    'Ask us on WhatsApp and we delete it.': 'Demandez-le sur WhatsApp et nous les supprimons.',
    'Prices can change. The price confirmed in our WhatsApp message is the price you pay.':
      'Les prix peuvent évoluer. Le prix confirmé dans notre message WhatsApp est celui que vous payez.',
    'An order is final once we confirm it by message and you accept.':
      'Une commande est ferme dès que nous la confirmons par message et que vous l\'acceptez.',
    'Points and rewards have no cash value and are withdrawn if the order that earned them is returned.':
      'Les points et récompenses n\'ont pas de valeur monétaire et sont retirés si la commande qui les a générés est retournée.',
    /* tab titles */
    'Your ODYS journey — Account': 'Votre voyage ODYS — Mon compte',
    'Your journey — Cart & checkout': 'Votre voyage — Panier & commande',
    'The ODYS Collections': 'Les collections ODYS',
    'Diffuseurs 50 ML — La Maison ODYS': 'Diffuseurs 50 ML — La Maison ODYS',
    'Find your ODYS — Fragrance discovery': 'Trouvez votre ODYS — Découverte olfactive',
    "ODYS PARFUM — More Than a Fragrance. It's a Journey.": "ODYS PARFUM — Plus qu'un parfum, un voyage.",
    'Help & policies — Delivery, returns, payment · ODYS PARFUM': 'Aide & conditions — Livraison, retours, paiement · ODYS PARFUM',
    'The ODYS Journal — Perfume, oud, ingredients & Moroccan heritage': 'Le journal ODYS — Parfum, oud, matières & patrimoine marocain',
    'Oud au gramme — Where smoke becomes memory · ODYS PARFUM': 'Oud au gramme — Là où la fumée devient souvenir · ODYS PARFUM',
    'ODYS Rewards — 1 point per 69 MAD': 'Fidélité ODYS — 1 point par 69 MAD',
    'Parfums — ODYS PARFUM': 'Parfums — ODYS PARFUM',
    'Page not found · ODYS PARFUM': 'Page introuvable · ODYS PARFUM',
    'This page has evaporated.': 'Cette page s\'est évaporée.',
    'The link may be old, or the scent is no longer in the house.': 'Le lien est peut-être ancien, ou ce parfum n\'est plus à la maison.',
    'Back to the house': 'Retour à la maison',
    'rattan sticks': 'bâtonnets en rotin',
    'Create your account and every 69 MAD you spend starts counting — the first reward is three points away.':
      'Créez votre compte : chaque 69 MAD dépensé compte — la première récompense est à trois points.',
    'stick': 'bâtonnet', 'sticks': 'bâtonnets', 'Precautions': 'Précautions',
    'Burn on a heat-proof holder, never unattended, away from children, pets and fabrics. Air the room afterwards.':
      'Brûler sur un support résistant à la chaleur, jamais sans surveillance, loin des enfants, des animaux et des tissus. Aérer la pièce ensuite.',
    'Keep out of reach of children and pets. Avoid contact with skin, varnished wood and plastic. Do not ingest.':
      'Tenir hors de portée des enfants et des animaux. Éviter le contact avec la peau, le bois verni et le plastique. Ne pas avaler.',
    'Flammable — keep away from heat and flames. Avoid contact with eyes. Keep out of reach of children. Test on a small patch of skin first.':
      'Inflammable — tenir à l\'écart de la chaleur et des flammes. Éviter le contact avec les yeux. Tenir hors de portée des enfants. Tester d\'abord sur une petite zone de peau.',
    'Oud orders above': 'Les commandes d\'oud au-delà de',
    'The flacon': 'Le flacon',
    'One bottle, three finishes.': 'Un flacon, trois finitions.',
    'See it in 3D': 'Voir le flacon en 3D',
    'Noir & Or, Marine & Or, Crème & Or — one thick-walled flacon, three labels.':
      'Noir & Or, Marine & Or, Crème & Or — un seul flacon en verre épais, trois étiquettes.',
    'Something went wrong': 'Un problème est survenu',
    'This page did not load properly.': "Cette page ne s'est pas chargée correctement.",
    'Reload it, or order straight from us — we answer on WhatsApp.':
      'Rechargez-la, ou commandez directement auprès de nous — nous répondons sur WhatsApp.',
    'Back to the home page': "Retour à l'accueil",
    'are quoted individually and confirmed before shipping.': 'font l\'objet d\'un devis et sont confirmées avant expédition.',
    'Give to someone': 'Offrir à quelqu\'un',
    'Ready to gift — add a message, then their address': 'Prêt à offrir — ajoutez un mot, puis son adresse',
    'Popular searches': 'Recherches fréquentes', 'Bestsellers': 'Les plus vendus',
    'Fresh for summer': 'Frais pour l\'été', 'Sweet for winter': 'Sucré pour l\'hiver',
    'Diffuseur for the living room': 'Diffuseur pour le salon', 'Gift': 'Cadeau',
    'See all results': 'Voir tous les résultats', 'No match yet — try one of these:': 'Aucun résultat — essayez plutôt :',
    'Results for': 'Résultats pour',
    'Signature collection': 'Collection Signature', 'An essence of freedom and femininity': 'Une essence de liberté et de féminité',
    'The inspiration of a classic, the soul of Morocco.': 'L’inspiration d’un classique, l’âme du Maroc.',
    'Discover it': 'Découvrir', 'All the parfums': 'Tous les parfums',
    'Extrait de parfum · high concentration': 'Extrait de parfum · haute concentration',
    'Made in Morocco, with passion': 'Fabriqué au Maroc avec passion',
    'Box': 'Boîte', 'Ribbon': 'Ruban', 'Engraving': 'Gravure', 'Card message': 'Mot sur la carte', 'Card signed': 'Carte signée',
    'Gift for': 'Cadeau pour', 'Deliver to': 'Livrer à', 'No prices on the delivery slip': 'Sans prix sur le bon de livraison',
    'Send directly to the recipient': 'Envoyer directement au destinataire'
  }
});

I18N.add('ar', {
  h: {
    'Everything before you order.': 'كل ما تحتاجه قبل الطلب.'
  },
  t: {
    'No reviews yet.': 'لا تقييمات بعد.',
    'Reviews open to customers once their order is delivered. Ask us anything in the meantime.':
      'يمكن للزبائن التقييم بعد تسلّم طلباتهم. في الأثناء، اسألنا عن أي شيء.',
    'Ask on WhatsApp': 'اسأل عبر واتساب', 'Scored by our perfumer.': 'قيّمها صانع العطور لدينا.',
    'Help & policies': 'المساعدة والشروط', 'Payment': 'الدفع', 'Delivery': 'التوصيل',
    'Returns': 'الإرجاع', 'Privacy': 'الخصوصية', 'Terms': 'الشروط', 'Sections': 'الأقسام',
    'Delivery, returns, payment and the small print — in plain words. If something isn\'t here, ask us on WhatsApp.':
      'التوصيل والإرجاع والدفع والتفاصيل — بكلمات واضحة. إن لم تجد ما تبحث عنه، اسألنا عبر واتساب.',
    'Across Morocco in 24–72h. Casablanca is usually next day.': 'في كل المغرب خلال 24 إلى 72 ساعة. الدار البيضاء غالبًا في اليوم التالي.',
    'Free delivery from': 'توصيل مجاني ابتداءً من', 'Below that, a flat': 'وأقل من ذلك، رسوم ثابتة',
    'We confirm every order by WhatsApp message before it leaves Casablanca. If we cannot reach you, we do not ship.':
      'نؤكّد كل طلب برسالة واتساب قبل خروجه من الدار البيضاء. إن تعذّر التواصل معك، لا نشحن.',
    'Gift coffrets can go straight to the recipient, with prices hidden.':
      'يمكن إرسال علب الهدايا مباشرة إلى المستلم مع إخفاء الأسعار.',
    'You have 7 days from delivery to return an unopened product.':
      'لديك 7 أيام من تاريخ التسليم لإرجاع منتج غير مفتوح.',
    'Opened fragrances and burned oud cannot be returned — unless they arrived damaged or not as described.':
      'لا تُرجَع العطور المفتوحة ولا العود المحروق — إلا إذا وصلت تالفة أو غير مطابقة.',
    'Something broken in transit? Send us a photo on WhatsApp within 48 hours and we replace it free.':
      'انكسر شيء أثناء الشحن؟ أرسل لنا صورة عبر واتساب خلال 48 ساعة ونستبدله مجانًا.',
    'Refunds are made within 14 days of us receiving the item.':
      'يتم الاسترداد خلال 14 يومًا من استلامنا للمنتج.',
    'Cash on delivery, everywhere we ship. Bank transfer on request.':
      'الدفع عند التسليم في كل مكان نوصل إليه. التحويل البنكي عند الطلب.',
    'Nothing is charged online.': 'لا دفع عبر الإنترنت.',
    'Prices are in MAD, taxes included.': 'الأسعار بالدرهم وشاملة للضرائب.',
    'How long does a 50 ML bottle last?': 'كم تدوم قارورة 50 مل؟',
    'About 500 sprays — three to four months of daily wear.': 'نحو 500 بخة — من ثلاثة إلى أربعة أشهر من الاستعمال اليومي.',
    'How long does a stick of oud burn?': 'كم يحترق عود واحد؟',
    'Around thirty minutes once the flame is blown out. The oud page shows the full ritual.':
      'نحو ثلاثين دقيقة بعد إطفاء اللهب. صفحة العود تشرح الطقس كاملًا.',
    'Can I change or cancel my order?': 'هل يمكنني تعديل طلبي أو إلغاؤه؟',
    'Yes, until we confirm it by message — just reply to that message.':
      'نعم، إلى أن نؤكّده برسالة — يكفي الرد على تلك الرسالة.',
    'Can I send a coffret as a gift?': 'هل يمكنني إهداء علبة؟',
    'Yes. Choose "It\'s a gift" first in the builder, and we deliver to the recipient with prices hidden.':
      'نعم. اختر «إنها هدية» أولًا في أداة التكوين، ونوصلها إلى المستلم مع إخفاء الأسعار.',
    'No. They are already priced at the floor.': 'لا. سعرها في أدنى حدوده أصلًا.',
    'Where are you based?': 'أين مقرّكم؟', 'Casablanca. We deliver across Morocco.': 'في الدار البيضاء. نوصل إلى كل المغرب.',
    'Monday to Saturday, 10:00–19:00.': 'من الإثنين إلى السبت، 10:00–19:00.',
    'We only ask for what a delivery needs: your name, phone number and address.':
      'لا نطلب إلا ما يحتاجه التوصيل: اسمك ورقم هاتفك وعنوانك.',
    'We use it to confirm and deliver your order and to keep your points. We never sell it.':
      'نستعملها لتأكيد طلبك وتوصيله وحفظ نقاطك. ولا نبيعها أبدًا.',
    'Ask us on WhatsApp and we delete it.': 'اطلب ذلك عبر واتساب ونحذفها.',
    'Prices can change. The price confirmed in our WhatsApp message is the price you pay.':
      'قد تتغير الأسعار. السعر المؤكَّد في رسالة واتساب هو ما تدفعه.',
    'An order is final once we confirm it by message and you accept.':
      'يصبح الطلب نهائيًا بمجرد تأكيدنا له برسالة وموافقتك.',
    'Points and rewards have no cash value and are withdrawn if the order that earned them is returned.':
      'النقاط والمكافآت لا قيمة نقدية لها، وتُسحب إذا أُرجع الطلب الذي منحها.',
    'Your ODYS journey — Account': 'رحلتك مع أوديس — حسابي',
    'Your journey — Cart & checkout': 'رحلتك — السلة والطلب',
    'The ODYS Collections': 'مجموعات أوديس',
    'Diffuseurs 50 ML — La Maison ODYS': 'مبخّرات 50 مل — دار أوديس',
    'Find your ODYS — Fragrance discovery': 'اعثر على أوديس الخاص بك — اكتشاف العطور',
    "ODYS PARFUM — More Than a Fragrance. It's a Journey.": 'أوديس للعطور — أكثر من عطر، إنها رحلة.',
    'Help & policies — Delivery, returns, payment · ODYS PARFUM': 'المساعدة والشروط — التوصيل والإرجاع والدفع · أوديس',
    'The ODYS Journal — Perfume, oud, ingredients & Moroccan heritage': 'مجلة أوديس — العطر والعود والمكوّنات والتراث المغربي',
    'Oud au gramme — Where smoke becomes memory · ODYS PARFUM': 'العود بالغرام — حيث يصير الدخان ذكرى · أوديس',
    'ODYS Rewards — 1 point per 69 MAD': 'مكافآت أوديس — نقطة لكل 69 درهمًا',
    'Parfums — ODYS PARFUM': 'العطور — أوديس',
    'Coffrets personnalisés — pour vous ou en cadeau · ODYS PARFUM': 'علب مخصّصة — لك أو هدية · أوديس',
    'Page not found · ODYS PARFUM': 'الصفحة غير موجودة · أوديس',
    'This page has evaporated.': 'تبخّرت هذه الصفحة.',
    'The link may be old, or the scent is no longer in the house.': 'ربما الرابط قديم، أو أن هذا العطر لم يعد في الدار.',
    'Back to the house': 'العودة إلى الدار',
    'rattan sticks': 'أعواد روطان',
    'Create your account and every 69 MAD you spend starts counting — the first reward is three points away.':
      'أنشئ حسابك: كل 69 درهمًا تنفقها تُحتسب — وأول مكافأة على بُعد ثلاث نقاط.',
    'stick': 'عود', 'sticks': 'أعواد', 'Precautions': 'احتياطات',
    'Burn on a heat-proof holder, never unattended, away from children, pets and fabrics. Air the room afterwards.':
      'يُحرق على حامل مقاوم للحرارة، ولا يُترك دون مراقبة، بعيدًا عن الأطفال والحيوانات والأقمشة. هوِّ الغرفة بعد ذلك.',
    'Keep out of reach of children and pets. Avoid contact with skin, varnished wood and plastic. Do not ingest.':
      'يُحفظ بعيدًا عن متناول الأطفال والحيوانات. تجنّب ملامسة الجلد والخشب المطلي والبلاستيك. لا يُبلع.',
    'Flammable — keep away from heat and flames. Avoid contact with eyes. Keep out of reach of children. Test on a small patch of skin first.':
      'قابل للاشتعال — يُحفظ بعيدًا عن الحرارة واللهب. تجنّب ملامسة العينين. يُحفظ بعيدًا عن متناول الأطفال. جرّبه أولًا على مساحة صغيرة من الجلد.',
    'Oud orders above': 'طلبات العود التي تتجاوز',
    'The flacon': 'القارورة',
    'One bottle, three finishes.': 'قارورة واحدة، ثلاث لمسات.',
    'See it in 3D': 'شاهدها بثلاثة أبعاد',
    'Noir & Or, Marine & Or, Crème & Or — one thick-walled flacon, three labels.':
      'أسود وذهبي، أزرق وذهبي، كريمي وذهبي — قارورة واحدة من الزجاج السميك، وثلاث ملصقات.',
    'Something went wrong': 'حدث خطأ ما',
    'This page did not load properly.': 'لم تُحمَّل هذه الصفحة كما ينبغي.',
    'Reload it, or order straight from us — we answer on WhatsApp.':
      'أعد تحميلها، أو اطلب منّا مباشرة — نردّ على واتساب.',
    'Back to the home page': 'العودة إلى الصفحة الرئيسية',
    'are quoted individually and confirmed before shipping.': 'تُسعَّر كلٌّ على حدة وتُؤكَّد قبل الشحن.',
    'Give to someone': 'أهدِه لشخص عزيز',
    'Ready to gift — add a message, then their address': 'جاهز للإهداء — أضف رسالة، ثم عنوانه',
    'Popular searches': 'عمليات بحث شائعة', 'Bestsellers': 'الأكثر مبيعًا',
    'Fresh for summer': 'منعش للصيف', 'Sweet for winter': 'حلو للشتاء',
    'Diffuseur for the living room': 'مبخرة للصالون', 'Gift': 'هدية', 'Musk': 'مسك', 'Rose': 'ورد', 'Oud': 'عود',
    'See all results': 'عرض كل النتائج', 'No match yet — try one of these:': 'لا نتائج — جرّب أحد هذه:',
    'Results for': 'نتائج البحث عن',
    'Signature collection': 'المجموعة المميّزة', 'An essence of freedom and femininity': 'جوهر الحرية والأنوثة',
    'The inspiration of a classic, the soul of Morocco.': 'إلهام عطر كلاسيكي، وروح المغرب.',
    'Discover it': 'اكتشفه', 'All the parfums': 'كل العطور',
    'Extrait de parfum · high concentration': 'خلاصة عطر · تركيز عالٍ',
    'Made in Morocco, with passion': 'صُنع في المغرب بشغف',
    'Box': 'العلبة', 'Ribbon': 'الشريط', 'Engraving': 'النقش', 'Card message': 'رسالة البطاقة', 'Card signed': 'توقيع البطاقة',
    'Gift for': 'هدية إلى', 'Deliver to': 'التوصيل إلى', 'No prices on the delivery slip': 'بدون أسعار على وصل التسليم',
    'Send directly to the recipient': 'إرسال مباشرة إلى المُهدى إليه',
    /* the gift card on the coffret page, written in French first */
    'Votre mot': 'كلمتك', 'Message': 'الرسالة', 'Signé': 'التوقيع', 'Pour': 'إلى',
    'Imprimé sur une carte ivoire, glissée dans le colis. Choisissez un début ou écrivez le vôtre.':
      'تُطبع على بطاقة عاجية وتوضع داخل الطرد. اختر بداية جاهزة أو اكتب رسالتك.',
    'Votre message apparaîtra ici.': 'ستظهر رسالتك هنا.',
    'Message (pour vous, ou laissez vide)': 'رسالة (لك، أو اتركها فارغة)',
    'Pour le prochain chapitre…': 'للفصل القادم…', 'Avec amour, Yasmine': 'مع حبي، ياسمين', 'Aperçu de la carte': 'معاينة البطاقة',
    'Anniversaire': 'عيد ميلاد', 'Merci': 'شكرًا', 'Félicitations': 'تهانينا', 'Aïd Moubarak': 'عيد مبارك',
    'Mariage': 'زفاف', 'Je pense à toi': 'أفكر فيك',
    'Joyeux anniversaire ! Que cette nouvelle année te ressemble : belle, libre et parfumée.':
      'عيد ميلاد سعيد! لتكن سنتك الجديدة مثلك: جميلة، حرّة، وعطِرة.',
    'Merci pour tout. Ce parfum, c’est un peu de ma gratitude à porter chaque jour.':
      'شكرًا على كل شيء. هذا العطر قليل من امتناني، تحمله معك كل يوم.',
    'Félicitations ! Un nouveau chapitre commence — voici de quoi le parfumer.':
      'تهانينا! فصل جديد يبدأ — وهذا ما يعطّره.',
    'Aïd Moubarak ! Que cette fête t’apporte paix, joie et douceur.':
      'عيد مبارك! أتمنى أن يحمل لك هذا العيد السلام والفرح والسكينة.',
    'Tous nos vœux de bonheur pour cette belle histoire qui commence.':
      'أطيب التمنيات بالسعادة لهذه القصة الجميلة التي تبدأ.',
    'Je pense à toi. Un parfum pour que tu penses aussi un peu à moi.':
      'أفكر فيك. عطر لتفكر فيّ أنت أيضًا قليلًا.'
  }
});
