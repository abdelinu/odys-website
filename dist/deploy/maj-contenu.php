<?php
/**
 * Le contenu de la boutique en anglais et en arabe.
 *
 * A deposer dans public_html/, a ouvrir une fois, PUIS A SUPPRIMER.
 * Il peut etre relance : chaque ligne est regardee avant d'etre ecrite.
 *
 * Quand une langue est ajoutee, PrestaShop recopie le francais dans ses
 * lignes : c'est ce qui s'affiche sur /ar/ tant que personne n'a traduit.
 * Ce script remplace CES COPIES, et elles seules. Une phrase retouchee en
 * Back Office ne vaut plus la copie du francais : elle est laissee telle
 * quelle, et comptee a part dans le compte rendu.
 *
 * Les noms des parfums ne sont pas traduits : « L'Icone » est un nom propre
 * au meme titre qu'ODYS, et les marques citees en reference olfactive sont
 * des marques deposees.
 */
$racine = __DIR__;
if (!file_exists($racine . "/config/config.inc.php")) {
    exit("A deposer a la racine de la boutique (public_html/), a cote de config/.");
}
require_once $racine . "/config/config.inc.php";

header("Content-Type: text/plain; charset=utf-8");

function dire($ligne)
{
    echo $ligne, "\n";
    @ob_flush();
    @flush();
}

dire("ODYS - le contenu en trois langues");
dire("==================================");
dire("");

$odysLangues = array();
foreach (array("en", "ar") as $odysIso) {
    $odysId = (int) Language::getIdByIso($odysIso);
    if ($odysId) {
        $odysLangues[$odysIso] = $odysId;
    }
}
$odysFr = (int) Language::getIdByIso("fr");
if (!$odysFr || !$odysLangues) {
    exit("Les langues ne sont pas installees : ouvrez maj-langues.php d'abord.\n");
}

/**
 * Ecrit une colonne SI la langue d'arrivee porte encore la copie du francais.
 *
 * @return string "pose", "deja traduit" ou "retouche en Back Office"
 */
function odysPoser($table, $cle, $id, $idLang, $idFr, $colonne, $valeur)
{
    $pre = _DB_PREFIX_;
    $actuel = Db::getInstance()->getValue(
        "SELECT `" . bqSQL($colonne) . "` FROM `" . bqSQL($pre . $table) . "`"
        . " WHERE `" . bqSQL($cle) . "` = " . (int) $id
        . " AND id_lang = " . (int) $idLang);
    if ($actuel === false) {
        return "absent";
    }
    if (trim((string) $actuel) === trim((string) $valeur)) {
        return "deja traduit";
    }
    $francais = Db::getInstance()->getValue(
        "SELECT `" . bqSQL($colonne) . "` FROM `" . bqSQL($pre . $table) . "`"
        . " WHERE `" . bqSQL($cle) . "` = " . (int) $id
        . " AND id_lang = " . (int) $idFr);
    if (trim((string) $actuel) !== trim((string) $francais)) {
        return "retouche en Back Office";
    }
    Db::getInstance()->update($table, array($colonne => pSQL($valeur, true)),
        "`" . bqSQL($cle) . "` = " . (int) $id . " AND id_lang = " . (int) $idLang);
    return "pose";
}

dire("Categories");
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 10, $odysLangues["en"], $odysFr, "name", "Fragrances") : "langue absente";
dire("  categorie 10 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 10, $odysLangues["en"], $odysFr, "description", "<p>Our extraits de parfum are composed and blended in Morocco. The concentration, between 18 and 20 %, is that of an extrait and not of an eau de toilette: the hold is counted in hours, not minutes, and little is needed.</p><p>Every bottle holds 50 ml. You pay on delivery, anywhere in Morocco, within 24 to 48 hours — and delivery is free above 300 DH.</p>") : "langue absente";
dire("  categorie 10 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 10, $odysLangues["ar"], $odysFr, "name", "العطور") : "langue absente";
dire("  categorie 10 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 10, $odysLangues["ar"], $odysFr, "description", "<p>خلاصاتنا العطرية تُركَّب وتُمزَج في المغرب. التركيز، بين 18 و20٪، هو تركيز الخلاصة لا ماء التواليت: الثبات يُحسب بالساعات لا بالدقائق، وتكفي منه كمية قليلة.</p><p>كل قارورة 50 مل. تؤدي عند الاستلام، في كل أنحاء المغرب، خلال 24 إلى 48 ساعة — والتوصيل مجاني ابتداءً من 300 درهم.</p>") : "langue absente";
dire("  categorie 10 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 11, $odysLangues["en"], $odysFr, "name", "Oud & Boukhour") : "langue absente";
dire("  categorie 11 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 11, $odysLangues["en"], $odysFr, "description", "<p>Oud is chosen by the gram, because one does not buy a precious wood the way one buys a bottle. Our chips are ordered from 5 g: enough to try an origin before growing attached to it.</p><p>You will find Hindi and Thai here in several grades, as well as our Boukhour Prestige for the mabkhara. The price shown is the price per gram; the total follows the quantity you choose.</p>") : "langue absente";
dire("  categorie 11 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 11, $odysLangues["ar"], $odysFr, "name", "العود والبخور") : "langue absente";
dire("  categorie 11 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 11, $odysLangues["ar"], $odysFr, "description", "<p>العود يُختار بالغرام، لأن الخشب الثمين لا يُشترى كما تُشترى قارورة. رقائقنا تُطلب ابتداءً من 5 غرامات: ما يكفي لتجربة منشأ قبل التعلّق به.</p><p>تجد هنا الهندي والتايلاندي بعدة درجات، إضافة إلى بخور بريستيج للمبخرة. الثمن المعروض هو ثمن الغرام؛ والمجموع يتبع الكمية التي تختارها.</p>") : "langue absente";
dire("  categorie 11 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 12, $odysLangues["en"], $odysFr, "name", "Gift sets") : "langue absente";
dire("  categorie 12 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 12, $odysLangues["en"], $odysFr, "description", "<p>A gift set avoids the question that blocks every perfume gift: which one? The duo and the trio bring several signatures together, enough to let the person find their own.</p><p>All our gift sets pass the free-delivery threshold.</p>") : "langue absente";
dire("  categorie 12 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 12, $odysLangues["ar"], $odysFr, "name", "علب الهدايا") : "langue absente";
dire("  categorie 12 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 12, $odysLangues["ar"], $odysFr, "description", "<p>علبة الهدية تُجنّبك السؤال الذي يعطّل كل هدية عطر: أيّ واحد؟ الثنائية والثلاثية تجمعان عدة بصمات، بما يكفي ليجد الشخص بصمته.</p><p>كل علبنا تتجاوز عتبة التوصيل المجاني.</p>") : "langue absente";
dire("  categorie 12 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 13, $odysLangues["en"], $odysFr, "name", "Diffusers") : "langue absente";
dire("  categorie 13 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 13, $odysLangues["en"], $odysFr, "description", "<p>A reed diffuser scents a room continuously, with no flame, no electricity and nothing to think about. The reeds carry the fragrance up little by little; you turn them over when you want to revive the diffusion.</p><p>Our diffusers come in 100 and 200 ml, and the refills let you keep the bottle.</p>") : "langue absente";
dire("  categorie 13 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 13, $odysLangues["ar"], $odysFr, "name", "موزّعات العطر") : "langue absente";
dire("  categorie 13 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 13, $odysLangues["ar"], $odysFr, "description", "<p>موزّع العيدان يعطّر الغرفة باستمرار، بلا لهب ولا كهرباء ودون أن تنشغل به. العيدان ترفع العطر شيئًا فشيئًا؛ تقلبها حين تريد تجديد الانتشار.</p><p>موزّعاتنا متوفرة بحجم 100 و200 مل، والعبوات البديلة تتيح لك الاحتفاظ بالقارورة.</p>") : "langue absente";
dire("  categorie 13 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 14, $odysLangues["en"], $odysFr, "name", "Men") : "langue absente";
dire("  categorie 14 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 14, $odysLangues["en"], $odysFr, "description", "<p>The house's masculine signatures, from fresh woods to spiced oriental. Filter by olfactory family to go straight to what you already like to wear.</p>") : "langue absente";
dire("  categorie 14 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 14, $odysLangues["ar"], $odysFr, "name", "للرجال") : "langue absente";
dire("  categorie 14 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 14, $odysLangues["ar"], $odysFr, "description", "<p>بصمات الدار الرجالية، من الخشبي المنعش إلى الشرقي الحار. صفِّ حسب العائلة العطرية لتصل مباشرة إلى ما تحب أن تضعه.</p>") : "langue absente";
dire("  categorie 14 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 15, $odysLangues["en"], $odysFr, "name", "Women") : "langue absente";
dire("  categorie 15 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 15, $odysLangues["en"], $odysFr, "description", "<p>The house's feminine signatures. The collection is growing: come back to it, or write to us to know what is coming.</p>") : "langue absente";
dire("  categorie 15 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 15, $odysLangues["ar"], $odysFr, "name", "للنساء") : "langue absente";
dire("  categorie 15 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 15, $odysLangues["ar"], $odysFr, "description", "<p>بصمات الدار النسائية. المجموعة في اتساع: عد إليها، أو راسلنا لتعرف ما هو قادم.</p>") : "langue absente";
dire("  categorie 15 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 16, $odysLangues["en"], $odysFr, "name", "Unisex") : "langue absente";
dire("  categorie 16 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("category_lang", "id_category", 16, $odysLangues["en"], $odysFr, "description", "<p>Compositions that take no side — oud and amber woods sit badly with one. To be worn by whoever loves them.</p>") : "langue absente";
dire("  categorie 16 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 16, $odysLangues["ar"], $odysFr, "name", "للجنسين") : "langue absente";
dire("  categorie 16 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("category_lang", "id_category", 16, $odysLangues["ar"], $odysFr, "description", "<p>تركيبات لا تنحاز لجهة — العود والأخشاب العنبرية لا تستقيم مع الانحياز. يضعها من يحبها.</p>") : "langue absente";
dire("  categorie 16 description (ar) : " . $odysEtat);
dire("");
dire("Fiches produits");
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 20, $odysLangues["en"], $odysFr, "description_short", "Inspired by Dolce &amp; Gabbana L'Impératrice. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 20 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 20, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Fruity · Floral · Musky</strong> · light intensity</p>\n<p>It opens on a green, tart fruit — kiwi, rhubarb — which a touch of pink pepper keeps from behaving. The heart softens: watermelon and white flowers, an almost sweet freshness. By the end of the day what remains is citron, musk and a discreet sandalwood.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Working days, the warm months, and those who would rather be noticed from near than from far.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Dolce &amp; Gabbana L'Impératrice. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 20 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 20, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Dolce &amp; Gabbana L'Impératrice. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 20 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 20, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>فاكهي · زهري · مسكي</strong> · قوة خفيفة</p>\n<p>يفتتح بفاكهة خضراء حامضة — كيوي وراوند — يمنعها رشّ من الفلفل الوردي من أن تكون وديعة. ثم يلين القلب: بطيخ وأزهار بيضاء، انتعاش يكاد يكون حلوًا. وفي آخر النهار يبقى الأترج والمسك وخشب صندل خفيف.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> أيام العمل، والشهور الدافئة، ولمن تفضّل أن يُلاحَظ عطرها عن قرب لا عن بعد.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Dolce &amp; Gabbana L'Impératrice. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 20 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 21, $odysLangues["en"], $odysFr, "description_short", "Inspired by Jean Paul Gaultier Le Mâle Élixir. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 21 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 21, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Aromatic · Vanilla · Amber</strong> · sustained intensity</p>\n<p>A minted lavender opens the fragrance, clean, almost cold. Vanilla and benzoin then warm it, and the base takes its time: honey, tonka bean, and a note of blond tobacco that gives it its nocturnal character.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Evenings, autumn and winter, and those who want a trail people recognise.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Jean Paul Gaultier Le Mâle Élixir. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 21 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 21, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Jean Paul Gaultier Le Mâle Élixir. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 21 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 21, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>عطري · فانيليا · عنبري</strong> · قوة عالية</p>\n<p>تفتتحه خزامى بنكهة النعناع، صافية وشبه باردة. ثم تدفئها الفانيليا واللبان الجاوي، ويأخذ القاع وقته: عسل وحبّة التونكا ولمسة تبغ أشقر تمنحه طابعه الليلي.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> السهرات، والخريف والشتاء، ولمن يريد أثرًا يُعرف صاحبه به.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Jean Paul Gaultier Le Mâle Élixir. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 21 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 22, $odysLangues["en"], $odysFr, "description_short", "Inspired by Rabanne 1 Million. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 22 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 22, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Spicy · Amber · Leather</strong> · strong intensity</p>\n<p>A bright citrus start — blood mandarin, grapefruit — freshened by mint. Cinnamon and spices quickly take over, softened by a discreet rose. The base is frank: amber, leather and patchouli.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Evenings out, and the occasions where one wants to be seen.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Rabanne 1 Million. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 22 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 22, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Rabanne 1 Million. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 22 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 22, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حار · عنبري · جلدي</strong> · قوة كبيرة</p>\n<p>بداية من حمضيات حيّة — مندرين دموي وليمون هندي — ينعشها النعناع. ثم يعلو القرفة والتوابل، وتلطّفها وردة خفيفة. والقاع صريح: عنبر وجلد وباتشولي.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> سهرات المساء، والمناسبات التي يُراد فيها الحضور.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Rabanne 1 Million. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 22 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 23, $odysLangues["en"], $odysFr, "description_short", "Inspired by Tom Ford Oud Wood. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 23 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 23, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Woody · Spicy · Warm</strong> · strong intensity</p>\n<p>The opening is spicy and dry: cardamom and Sichuan pepper set on rosewood. Then comes the oud, softened by sandalwood and held by vetiver. The base rounds the whole off — tonka bean, amber, a barely sweetened vanilla.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Evenings, ceremonies, and those who love oriental woods.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Tom Ford Oud Wood. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 23 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 23, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Tom Ford Oud Wood. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 23 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 23, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>خشبي · حار · دافئ</strong> · قوة كبيرة</p>\n<p>الافتتاح حار وجاف: هيل وفلفل سيشوان على خشب الورد. ثم يأتي العود، يلطّفه الصندل ويمسكه نبات الفيتيفر. والقاع يدوّر الصورة — حبّة التونكا والعنبر وفانيليا بالكاد محلّاة.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> السهرات والمناسبات، ولمن يحب الخشبيات الشرقية.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Tom Ford Oud Wood. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 23 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 24, $odysLangues["en"], $odysFr, "description_short", "Inspired by Yves Saint Laurent Black Opium. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 24 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 24, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Gourmand · Floral · Coffee</strong> · sustained intensity</p>\n<p>Pear and mandarin to begin, short and luminous. The heart is floral and vanilla-led, orange blossom first. It is the base that signs it: a bitter black coffee, cedar and patchouli, which keep the gourmand side from turning sugary.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Evenings and the cold seasons.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Yves Saint Laurent Black Opium. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 24 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 24, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Yves Saint Laurent Black Opium. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 24 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 24, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حلواني · زهري · قهوة</strong> · قوة عالية</p>\n<p>إجاص ومندرين في البداية، قصيران ومضيئان. القلب زهري بالفانيليا، وزهر البرتقال في المقدمة. لكن القاع هو الذي يوقّعه: قهوة سوداء مرّة وأرز وباتشولي، تمنع الجانب الحلو من أن يصير سكّريًا.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> السهرات والفصول الباردة.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Yves Saint Laurent Black Opium. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 24 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 25, $odysLangues["en"], $odysFr, "description_short", "Inspired by Chanel Bleu de Chanel Eau de Parfum. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 25 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 25, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Citrus · Woody · Incense</strong> · medium intensity</p>\n<p>A clean citrus opening — grapefruit, lemon, bergamot — lifted with mint and pink pepper. The heart turns spicy, ginger and nutmeg over a light floral. Then the incense arrives and the fragrance becomes woody: cedar, sandalwood, patchouli.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> The office as much as the evening, and all year round.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Chanel Bleu de Chanel Eau de Parfum. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 25 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 25, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Chanel Bleu de Chanel Eau de Parfum. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 25 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 25, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حمضي · خشبي · بخور</strong> · قوة متوسطة</p>\n<p>افتتاح حمضي صافٍ — ليمون هندي وحامض وبرغموت — يرفعه النعناع والفلفل الوردي. ثم يصير القلب حارًا، زنجبيل وجوزة الطيب على زهري خفيف. ويأتي البخور فيتحوّل العطر إلى خشبي: أرز وصندل وباتشولي.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> في المكتب كما في المساء، وعلى مدار السنة.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Chanel Bleu de Chanel Eau de Parfum. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 25 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["en"], $odysFr, "name", "Classic Duo") : "langue absente";
dire("  fiche 26 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["en"], $odysFr, "description_short", "<p>Two 50 ml extraits de parfum brought together in one gift box.</p>") : "langue absente";
dire("  fiche 26 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["en"], $odysFr, "description", "<p>Two 50 ml bottles in a single box: enough to give without hesitating between two fragrances, or to keep one and give the other.</p>\n<p>The same concentration as the bottles sold alone — extrait de parfum at 18–20 %, made in Morocco.</p>") : "langue absente";
dire("  fiche 26 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["ar"], $odysFr, "name", "الثنائية الكلاسيكية") : "langue absente";
dire("  fiche 26 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["ar"], $odysFr, "description_short", "<p>خلاصتان عطريتان من 50 مل في علبة واحدة.</p>") : "langue absente";
dire("  fiche 26 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 26, $odysLangues["ar"], $odysFr, "description", "<p>قارورتان من 50 مل في علبة واحدة: ما يكفي لتهدي دون تردّد بين عطرين، أو تحتفظ بواحد وتهدي الآخر.</p>\n<p>نفس التركيز الموجود في القوارير المباعة منفردة — خلاصة عطرية بتركيز 18–20٪، مصنوعة بالمغرب.</p>") : "langue absente";
dire("  fiche 26 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["en"], $odysFr, "name", "Boukhour Prestige") : "langue absente";
dire("  fiche 27 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["en"], $odysFr, "description_short", "<p>Boukhour sold by the gram, 15 DH per gram.</p>") : "langue absente";
dire("  fiche 27 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["en"], $odysFr, "description", "<p>Boukhour sold by the gram: you take the quantity you want, and the price follows the weight.</p>\n<p>Fifteen dirhams a gram, shown in advance. The total updates while you choose the quantity.</p>") : "langue absente";
dire("  fiche 27 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["ar"], $odysFr, "name", "بخور بريستيج") : "langue absente";
dire("  fiche 27 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["ar"], $odysFr, "description_short", "<p>بخور يُباع بالغرام، 15 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 27 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 27, $odysLangues["ar"], $odysFr, "description", "<p>بخور يُباع بالغرام: تأخذ الكمية التي تريد، والثمن يتبع الوزن.</p>\n<p>خمسة عشر درهمًا للغرام، معروضة مسبقًا. والمجموع يتحدّث وأنت تختار الكمية.</p>") : "langue absente";
dire("  fiche 27 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["en"], $odysFr, "name", "Hindi Assam A") : "langue absente";
dire("  fiche 28 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["en"], $odysFr, "description_short", "<p>Oud of Indian origin — Assam. Sold by the gram, 35 DH per gram.</p>") : "langue absente";
dire("  fiche 28 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["en"], $odysFr, "description", "<p>An oud of Indian origin, from the Assam region, sold by the gram.</p>\n<p>Thirty-five dirhams a gram, shown in advance: you choose the weight, the total is worked out in front of you. No imposed lot.</p>") : "langue absente";
dire("  fiche 28 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["ar"], $odysFr, "name", "هندي آسام A") : "langue absente";
dire("  fiche 28 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["ar"], $odysFr, "description_short", "<p>عود هندي المنشأ — آسام. يُباع بالغرام، 35 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 28 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 28, $odysLangues["ar"], $odysFr, "description", "<p>عود هندي المنشأ، من منطقة آسام، يُباع بالغرام.</p>\n<p>خمسة وثلاثون درهمًا للغرام، معروضة مسبقًا: تختار الوزن، والمجموع يُحسب أمامك. بدون كمية مفروضة.</p>") : "langue absente";
dire("  fiche 28 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["en"], $odysFr, "name", "Royal Hindi B") : "langue absente";
dire("  fiche 29 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["en"], $odysFr, "description_short", "<p>Oud of Indian origin. Sold by the gram, 45 DH per gram.</p>") : "langue absente";
dire("  fiche 29 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["en"], $odysFr, "description", "<p>An oud of Indian origin, sold by the gram.</p>\n<p>Forty-five dirhams a gram, shown in advance: you choose the weight, the total is worked out in front of you. No imposed lot.</p>") : "langue absente";
dire("  fiche 29 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["ar"], $odysFr, "name", "رويال هندي B") : "langue absente";
dire("  fiche 29 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["ar"], $odysFr, "description_short", "<p>عود هندي المنشأ. يُباع بالغرام، 45 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 29 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 29, $odysLangues["ar"], $odysFr, "description", "<p>عود هندي المنشأ، يُباع بالغرام.</p>\n<p>خمسة وأربعون درهمًا للغرام، معروضة مسبقًا: تختار الوزن، والمجموع يُحسب أمامك. بدون كمية مفروضة.</p>") : "langue absente";
dire("  fiche 29 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["en"], $odysFr, "name", "Royal Hindi C") : "langue absente";
dire("  fiche 30 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["en"], $odysFr, "description_short", "<p>Oud of Indian origin. Sold by the gram, 65 DH per gram.</p>") : "langue absente";
dire("  fiche 30 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["en"], $odysFr, "description", "<p>An oud of Indian origin, sold by the gram.</p>\n<p>Sixty-five dirhams a gram, shown in advance: you choose the weight, the total is worked out in front of you. No imposed lot.</p>") : "langue absente";
dire("  fiche 30 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["ar"], $odysFr, "name", "رويال هندي C") : "langue absente";
dire("  fiche 30 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["ar"], $odysFr, "description_short", "<p>عود هندي المنشأ. يُباع بالغرام، 65 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 30 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 30, $odysLangues["ar"], $odysFr, "description", "<p>عود هندي المنشأ، يُباع بالغرام.</p>\n<p>خمسة وستون درهمًا للغرام، معروضة مسبقًا: تختار الوزن، والمجموع يُحسب أمامك. بدون كمية مفروضة.</p>") : "langue absente";
dire("  fiche 30 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["en"], $odysFr, "name", "Royal Thai B") : "langue absente";
dire("  fiche 31 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["en"], $odysFr, "description_short", "<p>Oud of Thai origin. Sold by the gram, 45 DH per gram.</p>") : "langue absente";
dire("  fiche 31 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["en"], $odysFr, "description", "<p>An oud of Thai origin, sold by the gram.</p>\n<p>Forty-five dirhams a gram, shown in advance: you choose the weight, the total is worked out in front of you. No imposed lot.</p>") : "langue absente";
dire("  fiche 31 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["ar"], $odysFr, "name", "رويال تاي B") : "langue absente";
dire("  fiche 31 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["ar"], $odysFr, "description_short", "<p>عود تايلاندي المنشأ. يُباع بالغرام، 45 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 31 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 31, $odysLangues["ar"], $odysFr, "description", "<p>عود تايلاندي المنشأ، يُباع بالغرام.</p>\n<p>خمسة وأربعون درهمًا للغرام، معروضة مسبقًا: تختار الوزن، والمجموع يُحسب أمامك. بدون كمية مفروضة.</p>") : "langue absente";
dire("  fiche 31 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["en"], $odysFr, "name", "Royal Thai C") : "langue absente";
dire("  fiche 32 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["en"], $odysFr, "description_short", "<p>Oud of Thai origin. Sold by the gram, 55 DH per gram.</p>") : "langue absente";
dire("  fiche 32 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["en"], $odysFr, "description", "<p>An oud of Thai origin, sold by the gram.</p>\n<p>Fifty-five dirhams a gram, shown in advance: you choose the weight, the total is worked out in front of you. No imposed lot.</p>") : "langue absente";
dire("  fiche 32 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["ar"], $odysFr, "name", "رويال تاي C") : "langue absente";
dire("  fiche 32 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["ar"], $odysFr, "description_short", "<p>عود تايلاندي المنشأ. يُباع بالغرام، 55 درهمًا للغرام.</p>") : "langue absente";
dire("  fiche 32 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 32, $odysLangues["ar"], $odysFr, "description", "<p>عود تايلاندي المنشأ، يُباع بالغرام.</p>\n<p>خمسة وخمسون درهمًا للغرام، معروضة مسبقًا: تختار الوزن، والمجموع يُحسب أمامك. بدون كمية مفروضة.</p>") : "langue absente";
dire("  fiche 32 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["en"], $odysFr, "name", "Oud Prestige Pack") : "langue absente";
dire("  fiche 33 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["en"], $odysFr, "description_short", "<p>A box of three 5 g ouds, fifteen grams in all.</p>") : "langue absente";
dire("  fiche 33 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["en"], $odysFr, "description", "<p>Three 5 g ouds brought together in one box, fifteen grams in all. Enough to compare woods against each other rather than judge a single one.</p>\n<p>Oud is sold by the gram at ODYS: the price of the box is the price of its contents, shown in advance.</p>") : "langue absente";
dire("  fiche 33 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["ar"], $odysFr, "name", "طقم العود بريستيج") : "langue absente";
dire("  fiche 33 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["ar"], $odysFr, "description_short", "<p>علبة من ثلاثة أعواد بـ5 غرامات، أي خمسة عشر غرامًا.</p>") : "langue absente";
dire("  fiche 33 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 33, $odysLangues["ar"], $odysFr, "description", "<p>ثلاثة أعواد بـ5 غرامات في علبة واحدة، خمسة عشر غرامًا في المجموع. ما يكفي لمقارنة الأخشاب ببعضها بدل الحكم على واحد وحده.</p>\n<p>العود يُباع بالغرام عند أوديس: ثمن العلبة هو ثمن محتواها، معروض مسبقًا.</p>") : "langue absente";
dire("  fiche 33 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["en"], $odysFr, "name", "Hindi Sampler 3×5 g") : "langue absente";
dire("  fiche 34 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["en"], $odysFr, "description_short", "<p>Three 5 g Indian ouds, to compare before choosing.</p>") : "langue absente";
dire("  fiche 34 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["en"], $odysFr, "description", "<p>Three ouds of Indian origin, 5 g each. That is what a sampler is for: smelling side by side, at the same hour and in the same room, what a single bottle never lets you judge.</p>\n<p>Sold by the gram like the rest of the department: fifteen grams, and the price follows the weight.</p>") : "langue absente";
dire("  fiche 34 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["ar"], $odysFr, "name", "عيّنات هندي 3×5 غ") : "langue absente";
dire("  fiche 34 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["ar"], $odysFr, "description_short", "<p>ثلاثة أعواد هندية بـ5 غرامات، للمقارنة قبل الاختيار.</p>") : "langue absente";
dire("  fiche 34 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 34, $odysLangues["ar"], $odysFr, "description", "<p>ثلاثة أعواد هندية المنشأ، 5 غرامات لكل واحد. هذا دور العيّنة: أن تشمّها جنبًا إلى جنب، في نفس الساعة ونفس الغرفة، وهو ما لا تتيحه قارورة واحدة.</p>\n<p>تُباع بالغرام كباقي القسم: خمسة عشر غرامًا، والثمن يتبع الوزن.</p>") : "langue absente";
dire("  fiche 34 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["en"], $odysFr, "name", "Thai Sampler 3×5 g") : "langue absente";
dire("  fiche 35 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["en"], $odysFr, "description_short", "<p>Three 5 g Thai ouds, to compare before choosing.</p>") : "langue absente";
dire("  fiche 35 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["en"], $odysFr, "description", "<p>Three ouds of Thai origin, 5 g each. That is what a sampler is for: smelling side by side, at the same hour and in the same room, what a single bottle never lets you judge.</p>\n<p>Sold by the gram like the rest of the department: fifteen grams, and the price follows the weight.</p>") : "langue absente";
dire("  fiche 35 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["ar"], $odysFr, "name", "عيّنات تاي 3×5 غ") : "langue absente";
dire("  fiche 35 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["ar"], $odysFr, "description_short", "<p>ثلاثة أعواد تايلاندية بـ5 غرامات، للمقارنة قبل الاختيار.</p>") : "langue absente";
dire("  fiche 35 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 35, $odysLangues["ar"], $odysFr, "description", "<p>ثلاثة أعواد تايلاندية المنشأ، 5 غرامات لكل واحد. هذا دور العيّنة: أن تشمّها جنبًا إلى جنب، في نفس الساعة ونفس الغرفة، وهو ما لا تتيحه قارورة واحدة.</p>\n<p>تُباع بالغرام كباقي القسم: خمسة عشر غرامًا، والثمن يتبع الوزن.</p>") : "langue absente";
dire("  fiche 35 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["en"], $odysFr, "name", "Discovery Trio") : "langue absente";
dire("  fiche 36 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["en"], $odysFr, "description_short", "<p>Three 50 ml extraits de parfum brought together in one gift box.</p>") : "langue absente";
dire("  fiche 36 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["en"], $odysFr, "description", "<p>Three 50 ml bottles to walk through the collection without choosing: the simplest way to discover a house whose accords you do not know yet.</p>\n<p>The same concentration as the bottles sold alone — extrait de parfum at 18–20 %, made in Morocco.</p>") : "langue absente";
dire("  fiche 36 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["ar"], $odysFr, "name", "الثلاثية الاستكشافية") : "langue absente";
dire("  fiche 36 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["ar"], $odysFr, "description_short", "<p>ثلاث خلاصات عطرية من 50 مل في علبة واحدة.</p>") : "langue absente";
dire("  fiche 36 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 36, $odysLangues["ar"], $odysFr, "description", "<p>ثلاث قوارير من 50 مل لتتنقّل في المجموعة دون أن تختار: أبسط طريقة لاكتشاف دار لا تعرف تناغماتها بعد.</p>\n<p>نفس التركيز الموجود في القوارير المباعة منفردة — خلاصة عطرية بتركيز 18–20٪، مصنوعة بالمغرب.</p>") : "langue absente";
dire("  fiche 36 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["en"], $odysFr, "name", "Reed diffuser — Nuit d'Ambre") : "langue absente";
dire("  fiche 37 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["en"], $odysFr, "description_short", "<p>200 ml reed diffuser — cardamom, rose, incense, amber and oud wood.</p>") : "langue absente";
dire("  fiche 37 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["en"], $odysFr, "description", "<p>A 200 ml reed diffuser: cardamom and bergamot first, rose and incense next, then musk, amber and oud wood that hold the room.</p>\n<p>No flame and no electricity: the reeds do the work on their own. You turn them over now and then to revive the diffusion.</p>") : "langue absente";
dire("  fiche 37 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["ar"], $odysFr, "name", "موزّع عيدان — Nuit d'Ambre") : "langue absente";
dire("  fiche 37 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["ar"], $odysFr, "description_short", "<p>موزّع عيدان 200 مل — هيل، ورد، بخور، عنبر وخشب العود.</p>") : "langue absente";
dire("  fiche 37 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 37, $odysLangues["ar"], $odysFr, "description", "<p>موزّع عيدان من 200 مل: الهيل والبرغموت أولًا، ثم الورد والبخور، ثم المسك والعنبر وخشب العود الذي يمسك الغرفة.</p>\n<p>بلا لهب ولا كهرباء: العيدان تقوم بالعمل وحدها. تقلبها من حين لآخر لتجديد الانتشار.</p>") : "langue absente";
dire("  fiche 37 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["en"], $odysFr, "name", "Reed diffuser — Jardin de Fès") : "langue absente";
dire("  fiche 38 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["en"], $odysFr, "description_short", "<p>100 ml reed diffuser — lemon, neroli, jasmine, orange blossom and cedar.</p>") : "langue absente";
dire("  fiche 38 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["en"], $odysFr, "description", "<p>A 100 ml reed diffuser: lemon and neroli first, jasmine and orange blossom at the heart, cedar and white musk to finish.</p>\n<p>No flame and no electricity: the reeds do the work on their own. You turn them over now and then to revive the diffusion.</p>") : "langue absente";
dire("  fiche 38 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["ar"], $odysFr, "name", "موزّع عيدان — Jardin de Fès") : "langue absente";
dire("  fiche 38 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["ar"], $odysFr, "description_short", "<p>موزّع عيدان 100 مل — حامض، نيرولي، ياسمين، زهر البرتقال وأرز.</p>") : "langue absente";
dire("  fiche 38 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 38, $odysLangues["ar"], $odysFr, "description", "<p>موزّع عيدان من 100 مل: الحامض والنيرولي أولًا، والياسمين وزهر البرتقال في القلب، والأرز والمسك الأبيض في النهاية.</p>\n<p>بلا لهب ولا كهرباء: العيدان تقوم بالعمل وحدها. تقلبها من حين لآخر لتجديد الانتشار.</p>") : "langue absente";
dire("  fiche 38 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["en"], $odysFr, "name", "Diffuser refill — Nuit d'Ambre") : "langue absente";
dire("  fiche 39 name (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["en"], $odysFr, "description_short", "<p>200 ml refill for the Nuit d'Ambre diffuser, bottle only.</p>") : "langue absente";
dire("  fiche 39 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["en"], $odysFr, "description", "<p>The refill for the Nuit d'Ambre diffuser: 200 ml of the same composition, bottle only.</p>\n<p>The reeds of the first diffuser can be kept if the fragrance is the same; replace them to change it, otherwise the old one lingers in the new.</p>") : "langue absente";
dire("  fiche 39 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["ar"], $odysFr, "name", "عبوة بديلة للموزّع — Nuit d'Ambre") : "langue absente";
dire("  fiche 39 name (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["ar"], $odysFr, "description_short", "<p>عبوة بديلة 200 مل لموزّع Nuit d'Ambre، القارورة وحدها.</p>") : "langue absente";
dire("  fiche 39 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 39, $odysLangues["ar"], $odysFr, "description", "<p>العبوة البديلة لموزّع Nuit d'Ambre: 200 مل من نفس التركيبة، القارورة وحدها.</p>\n<p>يمكن الاحتفاظ بعيدان الموزّع الأول إذا كان العطر نفسه؛ وتُستبدل عند تغييره، وإلا بقي القديم في الجديد.</p>") : "langue absente";
dire("  fiche 39 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 40, $odysLangues["en"], $odysFr, "description_short", "Inspired by Givenchy L'Interdit Eau de Parfum Rouge. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 40 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 40, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Spicy · Floral · Woody</strong> · sustained intensity</p>\n<p>A blood orange, and at once a red spice accord that gives it bite. The heart is very floral — orange blossom, sambac jasmine — and the base brings the whole back towards wood: patchouli and sandalwood.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Evenings and celebrations.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Givenchy L'Interdit Eau de Parfum Rouge. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 40 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 40, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Givenchy L'Interdit Eau de Parfum Rouge. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 40 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 40, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حار · زهري · خشبي</strong> · قوة عالية</p>\n<p>برتقال دموي، ثم مباشرة تناغم حار أحمر يمنحه حدّته. القلب زهري بامتياز — زهر البرتقال وياسمين السامباك — والقاع يعيد كل شيء نحو الخشب: باتشولي وصندل.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> السهرات والأعراس والحفلات.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Givenchy L'Interdit Eau de Parfum Rouge. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 40 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 41, $odysLangues["en"], $odysFr, "description_short", "Inspired by Emporio Armani Stronger With You. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 41 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 41, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Spicy · Green · Vanilla</strong> · medium intensity</p>\n<p>Cardamom and pink pepper over a violet leaf: a spicy, green start. Sage holds the heart, herbal and restrained. The base is gourmand without excess — vanilla and candied chestnut.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Every day, and for those who prefer a discreet gourmand.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Emporio Armani Stronger With You. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 41 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 41, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Emporio Armani Stronger With You. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 41 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 41, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حار · أخضر · فانيليا</strong> · قوة متوسطة</p>\n<p>هيل وفلفل وردي على ورقة البنفسج: بداية حارة وخضراء. المريمية تمسك القلب، عشبية ورزينة. والقاع حلواني بلا إفراط — فانيليا وكستناء مسكّرة.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> كل يوم، ولمن يفضّل الحلو الهادئ.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Emporio Armani Stronger With You. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 41 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 42, $odysLangues["en"], $odysFr, "description_short", "Inspired by Emporio Armani Stronger With You Absolutely. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 42 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 42, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Vanilla · Woody · Liqueur</strong> · strong intensity</p>\n<p>Darker than Le Serment. An amber rum, resinous elemi, a bergamot for balance. Lavender and davana give the heart its almost fruity roundness. The base is thick: Madagascar vanilla, chestnut, cedar and patchouli.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Winter evenings, and those who find vanillas too well behaved.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Emporio Armani Stronger With You Absolutely. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 42 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 42, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Emporio Armani Stronger With You Absolutely. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 42 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 42, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>فانيليا · خشبي · كحولي</strong> · قوة كبيرة</p>\n<p>أغمق من لو سيرمان. رُم عنبري، وإيليمي راتنجي، وبرغموت للتوازن. الخزامى والدافانا تمنحان القلب استدارته شبه الفاكهية. والقاع كثيف: فانيليا مدغشقر وكستناء وأرز وباتشولي.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> ليالي الشتاء، ولمن يجد الفانيليا وديعة أكثر من اللازم.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Emporio Armani Stronger With You Absolutely. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 42 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 43, $odysLangues["en"], $odysFr, "description_short", "Inspired by Kayali Yum Boujee Marshmallow 81. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 43 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 43, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Gourmand · Fruity · Milky</strong> · sustained intensity</p>\n<p>A fruity bouquet to begin — nectarine, apple, and a lemon that keeps the whole from growing heavy. Marshmallow, strawberry and coconut then set the dessert. The base is creamy: whipped cream, sugar, vanilla, and an ambroxan that makes it last.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Outings with friends, birthdays, and those who own a gourmand fragrance without apology.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Kayali Yum Boujee Marshmallow 81. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 43 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 43, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Kayali Yum Boujee Marshmallow 81. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 43 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 43, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حلواني · فاكهي · حليبي</strong> · قوة عالية</p>\n<p>باقة فاكهية في البداية — نكتارين وتفاح وحامض يمنع الثقل. ثم يأتي المارشملو والفراولة وجوز الهند ليضعا الحلوى. والقاع كريمي: قشدة مخفوقة وسكر وفانيليا، وأمبروكسان يجعله يدوم.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> الخرجات مع الصديقات، وأعياد الميلاد، ولمن تحب العطر الحلو دون تردد.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Kayali Yum Boujee Marshmallow 81. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 43 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 44, $odysLangues["en"], $odysFr, "description_short", "Inspired by Kayali Vanilla Candy Rock Sugar 42. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 44 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 44, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Vanilla · Caramel · Woody</strong> · sustained intensity</p>\n<p>A candied pear and a drop of rum open the fragrance; ylang-ylang gives it body. The heart is a white caramel softened with marshmallow, held by jasmine and labdanum. The base, though, is woody: tonka bean, sandalwood, vetiver and patchouli beneath the rock sugar.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Autumn and winter, and those looking for a vanilla that is not only a dessert.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Kayali Vanilla Candy Rock Sugar 42. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 44 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 44, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Kayali Vanilla Candy Rock Sugar 42. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 44 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 44, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>فانيليا · كراميل · خشبي</strong> · قوة عالية</p>\n<p>إجاص مسكّر وقطرة رُم يفتتحان العطر، ويمنحه الإيلنغ إيلنغ جسده. القلب كراميل أبيض يلطّفه المارشملو، ويمسكه الياسمين واللادن. أما القاع فخشبي: حبّة التونكا والصندل والفيتيفر والباتشولي تحت السكّر النبات.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> الخريف والشتاء، ولمن تبحث عن فانيليا ليست مجرد حلوى.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Kayali Vanilla Candy Rock Sugar 42. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 44 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 45, $odysLangues["en"], $odysFr, "description_short", "Inspired by Jean Paul Gaultier Le Beau Paradise Garden. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 45 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 45, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Aquatic · Green · Salty</strong> · light intensity</p>\n<p>Water first: aquatic notes, mint, a cut green grass. The heart is saline — coconut water, salt, green fig, like skin coming out of the sea. Sandalwood and tonka bean warm the end.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Summer, days in the sun, and those who flee heavy fragrances.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Jean Paul Gaultier Le Beau Paradise Garden. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 45 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 45, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Jean Paul Gaultier Le Beau Paradise Garden. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 45 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 45, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>مائي · أخضر · مالح</strong> · قوة خفيفة</p>\n<p>الماء أولًا: نفحات مائية ونعناع وعشب أخضر مقطوف. القلب مالح — ماء جوز الهند والملح والتين الأخضر، كبشرة خارجة من البحر. ويدفّئ الصندل وحبّة التونكا النهاية.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> الصيف، وأيام الشمس، ولمن يهرب من العطور الثقيلة.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Jean Paul Gaultier Le Beau Paradise Garden. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 45 description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 46, $odysLangues["en"], $odysFr, "description_short", "Inspired by Dolce &amp; Gabbana Light Blue. Extrait de parfum made in Morocco.") : "langue absente";
dire("  fiche 46 description_short (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("product_lang", "id_product", 46, $odysLangues["en"], $odysFr, "description", "<p class=\"pd-accords\"><strong>Citrus · Floral · Woody</strong> · light intensity</p>\n<p>Sicilian lemon and green apple: a frank opening, almost crisp. The heart is floral and green — jasmine, white rose, bamboo. The base stays light, cedar and musk over a hint of amber.</p>\n<p class=\"pd-pour\"><strong>To wear:</strong> Fine days, everyday life, and those who want a freshness that lasts.</p>\n<p class=\"pd-insp\">An original ODYS composition, inspired by Dolce &amp; Gabbana Light Blue. The brands named belong to their respective owners and have no connection with ODYS Parfums.</p>\n<p class=\"pd-maison\">Extrait de parfum made in Morocco, 18–20 % concentration.</p>") : "langue absente";
dire("  fiche 46 description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 46, $odysLangues["ar"], $odysFr, "description_short", "مستوحى من Dolce &amp; Gabbana Light Blue. خلاصة عطرية مصنوعة بالمغرب.") : "langue absente";
dire("  fiche 46 description_short (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("product_lang", "id_product", 46, $odysLangues["ar"], $odysFr, "description", "<p class=\"pd-accords\"><strong>حمضي · زهري · خشبي</strong> · قوة خفيفة</p>\n<p>ليمون صقلي وتفاح أخضر: افتتاح صريح يكاد يكون مقرمشًا. القلب زهري وأخضر — ياسمين ووردة بيضاء وخيزران. والقاع يبقى خفيفًا، أرز ومسك على لمسة عنبر.</p>\n<p class=\"pd-pour\"><strong>متى يُوضع:</strong> الأيام الجميلة واليومي، ولمن تريد انتعاشًا يدوم.</p>\n<p class=\"pd-insp\">تركيبة أوديس أصلية، مستوحاة من Dolce &amp; Gabbana Light Blue. العلامات المذكورة تعود لأصحابها ولا علاقة لها بأوديس بارفان.</p>\n<p class=\"pd-maison\">خلاصة عطرية مصنوعة بالمغرب، بتركيز 18–20٪.</p>") : "langue absente";
dire("  fiche 46 description (ar) : " . $odysEtat);

dire("");
dire("SUPPRIMEZ CE FICHIER de public_html/ maintenant.");
