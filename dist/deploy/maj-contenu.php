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
dire("Pages");
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["en"], $odysFr, "meta_title", "Our story") : "langue absente";
dire("  page 4 meta_title (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["en"], $odysFr, "meta_description", "ODYS is a perfume house born in Casablanca, between contemporary elegance and the soul of Morocco. We compose highly concentrated extraits de parfum and sell oud and boukhour by the gram.") : "langue absente";
dire("  page 4 meta_description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["en"], $odysFr, "content", "<p class=\"legal-lede\">ODYS is a perfume house born in Casablanca, between contemporary elegance and the soul of Morocco. We compose highly concentrated extraits de parfum and sell oud and boukhour by the gram, as has always been done here.</p>\n\n<h2>Why ODYS</h2>\n<p>A great fragrance should not cost the price of a jewel. Most of what one pays in a shop funds a heavy bottle, a cardboard case and a billboard campaign — not what is inside. We took the problem the other way round: concentrate the spending on the juice, keep the bottle sober, sell direct.</p>\n<p>The result fits in one sentence: an extrait at <b>18–20 % concentration</b>, a measured hold of 7 to 9 hours, at a price that leaves room for a collection rather than one purchase a year.</p>\n\n<h2>Our compositions</h2>\n<p>Every ODYS reference is an original composition of inspiration. The brands named as olfactory references belong to their respective owners and have no connection with ODYS Parfums: we name an inspiration to help you place a scent, never to suggest a counterfeit.</p>\n\n<h2>Oud, the heart of the house</h2>\n<p>Oud and boukhour are sold <b>by the gram</b>, from 5 g, with the origin stated for every lot — Hindi, Thai, Royal. It is the honest way to sell a material whose quality varies from one harvest to the next: you buy the quantity you want, at the gram price shown.</p>\n\n<h2>Where to find us</h2>\n<ul>\n  <li><b>Workshop and dispatch:</b> Casablanca, Morocco — Sidi Maarouf</li>\n  <li><b>WhatsApp:</b> 06 84 51 94 44, Monday to Saturday, 9:00–18:00</li>\n  <li><b>E-mail:</b> contact@odysparfum.com</li>\n</ul>\n\n<h2>Our commitments</h2>\n<ul>\n  <li>Delivery anywhere in Morocco within 24–48 working hours, free from 300 DH.</li>\n  <li>Cash on delivery accepted anywhere in Morocco.</li>\n  <li>Exchange or refund within 14 days on unopened items — see our exchange and refund policy.</li>\n  <li>Someone who answers: we prefer a WhatsApp conversation to a form.</li>\n</ul>") : "langue absente";
dire("  page 4 content (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["ar"], $odysFr, "meta_title", "قصّتنا") : "langue absente";
dire("  page 4 meta_title (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["ar"], $odysFr, "meta_description", "أوديس دار عطور وُلدت بالدار البيضاء، بين الأناقة المعاصرة وروح المغرب. نركّب خلاصات عطرية عالية التركيز ونبيع العود والبخور بالغرام.") : "langue absente";
dire("  page 4 meta_description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 4, $odysLangues["ar"], $odysFr, "content", "<p class=\"legal-lede\">أوديس دار عطور وُلدت بالدار البيضاء، بين الأناقة المعاصرة وروح المغرب. نركّب خلاصات عطرية عالية التركيز، ونبيع العود والبخور بالغرام، كما يُفعل هنا منذ زمن.</p>\n\n<h2>لماذا أوديس</h2>\n<p>العطر الجيّد لا ينبغي أن يكلّف ثمن جوهرة. أغلب ما يُؤدّى في المتاجر يموّل قارورة ثقيلة وعلبة كرتونية وحملة إشهارية — لا ما بداخل القارورة. أخذنا المسألة من الجهة الأخرى: نركّز الإنفاق على العطر نفسه، ونُبقي القارورة بسيطة، ونبيع مباشرة.</p>\n<p>والنتيجة تُختصر في جملة: خلاصة بتركيز <b>18–20٪</b>، وثبات مُقاس من 7 إلى 9 ساعات، بثمن يترك مجالًا لمجموعة لا لشراء واحد في السنة.</p>\n\n<h2>تركيباتنا</h2>\n<p>كل مرجع في أوديس تركيبة أصلية مستوحاة. العلامات المذكورة كمرجع عطري تعود لأصحابها ولا علاقة لها بأوديس بارفان: نذكر مصدر الإلهام لنساعدك على تحديد الرائحة، لا لإيهامك بتقليد.</p>\n\n<h2>العود، جوهر الدار</h2>\n<p>العود والبخور يُباعان <b>بالغرام</b>، ابتداءً من 5 غرامات، مع ذكر المنشأ لكل دفعة — هندي، تايلاندي، رويال. هذه هي الطريقة الصادقة لبيع مادة تختلف جودتها من موسم لآخر: تشتري الكمية التي تريد، بثمن الغرام المعروض.</p>\n\n<h2>أين تجدنا</h2>\n<ul>\n  <li><b>الورشة والشحن:</b> الدار البيضاء، المغرب — سيدي معروف</li>\n  <li><b>واتساب:</b> 06 84 51 94 44، من الاثنين إلى السبت، 9:00–18:00</li>\n  <li><b>البريد الإلكتروني:</b> contact@odysparfum.com</li>\n</ul>\n\n<h2>التزاماتنا</h2>\n<ul>\n  <li>التوصيل في كل أنحاء المغرب خلال 24–48 ساعة عمل، ومجانًا ابتداءً من 300 درهم.</li>\n  <li>الدفع عند الاستلام مقبول في كل أنحاء المغرب.</li>\n  <li>الاستبدال أو الاسترجاع خلال 14 يومًا للمنتجات غير المفتوحة — انظر سياسة الاستبدال والاسترجاع.</li>\n  <li>شخص يجيبك فعلًا: نفضّل محادثة على واتساب على استمارة.</li>\n</ul>") : "langue absente";
dire("  page 4 content (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["en"], $odysFr, "meta_title", "Craftsmanship") : "langue absente";
dire("  page 6 meta_title (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["en"], $odysFr, "meta_description", "How an ODYS fragrance is composed, weighed and packed — and how to read an oud label without being told stories.") : "langue absente";
dire("  page 6 meta_description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["en"], $odysFr, "content", "<p class=\"legal-lede\">How an ODYS fragrance is composed, weighed and packed — and how to read an oud label without being told stories.</p>\n\n<h2>1. Concentration, first</h2>\n<p>Fragrances differ above all in the share of aromatic concentrate they contain:</p>\n<ul>\n  <li><b>Eau de toilette:</b> 5 to 10 % — fresh, short.</li>\n  <li><b>Eau de parfum:</b> 12 to 18 % — the standard of the great houses.</li>\n  <li><b>Extrait de parfum:</b> 18 to 30 % — the ODYS category.</li>\n</ul>\n<p>In practice, a 50 ml ODYS bottle holds 9 to 10 millilitres of concentrate. That is what explains the 7 to 9 hour hold and the trail, and that is where our budget goes.</p>\n\n<h2>2. The composition</h2>\n<p>Our compositions are built as a pyramid: top notes (the first minutes), heart notes (the hours that follow) and base notes (what remains on the skin at the end of the day). Every product page details the three tiers; you can click a note to find the other fragrances that share it.</p>\n<p>After blending, the juice macerates before bottling — [TO BE COMPLETED: maceration time] — then it is cold filtered. Maceration is not a marketing detail: it is what binds the materials together and avoids the alcoholic opening.</p>\n\n<h2>3. The bottle</h2>\n<p>One size only: <b>50 ml</b>. Thick glass, a weighty cap, sober screen printing. No superfluous case — the cream sleeve protects the bottle in transit, nothing more. We would rather put the spending in the juice.</p>\n\n<h2>4. Oud and boukhour</h2>\n<p>Oud is a natural material: its quality depends on the tree, the region and how long the wood has been infected. For every lot we state the origin (Hindi, Thai, Royal) and the price <b>per gram</b>, from 5 g.</p>\n<ul>\n  <li><b>Hindi:</b> deep, animalic, smoky — for those who already know.</li>\n  <li><b>Thai:</b> softer, woody-honeyed, easier at a first encounter.</li>\n  <li><b>Royal:</b> high selection, denser chips, longer burn.</li>\n</ul>\n<p>Boukhour is a blend to be burnt: chips, resins and oils. It burns on charcoal or on an electric burner; a few minutes are enough for a room.</p>\n\n<h2>5. Keeping it</h2>\n<ul>\n  <li>Keep the bottle away from direct light and from temperature swings.</li>\n  <li>Do not keep a fragrance in a bathroom: steam damages the juice.</li>\n  <li>Oud keeps in its closed box, in the dry; it does not expire, it improves.</li>\n</ul>\n\n<h2>6. Safe use</h2>\n<p>Our fragrances are for external use. Spray on the warm points, avoid contact with the eyes and mucous membranes, keep out of reach of children and away from a flame. In case of a skin reaction, stop using it. The list of regulated allergens is on the sleeve of every bottle.</p>") : "langue absente";
dire("  page 6 content (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["ar"], $odysFr, "meta_title", "حرفتنا") : "langue absente";
dire("  page 6 meta_title (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["ar"], $odysFr, "meta_description", "كيف يُركَّب عطر أوديس ويُوزن ويُعبّأ — وكيف تقرأ بطاقة عود دون أن تُروى لك الحكايات.") : "langue absente";
dire("  page 6 meta_description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 6, $odysLangues["ar"], $odysFr, "content", "<p class=\"legal-lede\">كيف يُركَّب عطر أوديس ويُوزن ويُعبّأ — وكيف تقرأ بطاقة عود دون أن تُروى لك الحكايات.</p>\n\n<h2>1. التركيز أولًا</h2>\n<p>تختلف العطور أساسًا بنسبة الخلاصة العطرية التي تحتويها:</p>\n<ul>\n  <li><b>ماء التواليت:</b> من 5 إلى 10٪ — منعش وقصير.</li>\n  <li><b>ماء العطر:</b> من 12 إلى 18٪ — معيار الدور الكبرى.</li>\n  <li><b>خلاصة العطر:</b> من 18 إلى 30٪ — فئة أوديس.</li>\n</ul>\n<p>عمليًا، قارورة أوديس من 50 مل تحتوي على 9 إلى 10 مليلترات من الخلاصة. هذا ما يفسّر الثبات من 7 إلى 9 ساعات والأثر، وهنا تذهب ميزانيتنا.</p>\n\n<h2>2. التركيبة</h2>\n<p>تُبنى تركيباتنا على شكل هرم: نفحات المقدّمة (الدقائق الأولى)، ونفحات القلب (الساعات التي تليها)، ونفحات القاعدة (ما يبقى على البشرة في آخر النهار). كل صفحة منتج تفصّل الطبقات الثلاث؛ ويمكنك النقر على نفحة لتجد العطور الأخرى التي تشاركها.</p>\n<p>بعد المزج، يُترك العطر ليختمر قبل التعبئة — [يُستكمل: مدة الاختمار] — ثم يُصفّى على البارد. الاختمار ليس تفصيلًا تسويقيًا: هو ما يربط المواد ببعضها ويمنع الانطلاقة الكحولية.</p>\n\n<h2>3. القارورة</h2>\n<p>حجم واحد: <b>50 مل</b>. زجاج سميك، وغطاء ثقيل، وطباعة بسيطة. بلا علبة زائدة — الغلاف الكريمي يحمي القارورة أثناء النقل، لا أكثر. نفضّل أن يذهب الإنفاق إلى العطر نفسه.</p>\n\n<h2>4. العود والبخور</h2>\n<p>العود مادة طبيعية: جودته تتوقف على الشجرة والمنطقة ومدة إصابة الخشب. نذكر لكل دفعة المنشأ (هندي، تايلاندي، رويال) والثمن <b>بالغرام</b>، ابتداءً من 5 غرامات.</p>\n<ul>\n  <li><b>هندي:</b> عميق، حيواني، مدخّن — لمن يعرفه مسبقًا.</li>\n  <li><b>تايلاندي:</b> ألطف، خشبي بالعسل، أسهل في أول لقاء.</li>\n  <li><b>رويال:</b> انتقاء عالٍ، رقائق أكثف، واحتراق أطول.</li>\n</ul>\n<p>البخور خليط يُحرق: رقائق وراتنجات وزيوت. يُحرق على الفحم أو على مبخرة كهربائية، وتكفي دقائق لغرفة كاملة.</p>\n\n<h2>5. الحفظ</h2>\n<ul>\n  <li>احفظ القارورة بعيدًا عن الضوء المباشر وتقلّبات الحرارة.</li>\n  <li>لا تحفظ عطرًا في الحمّام: البخار يُفسد العطر.</li>\n  <li>العود يُحفظ في علبته مغلقة وفي مكان جاف؛ لا تنتهي صلاحيته، بل يتحسّن.</li>\n</ul>\n\n<h2>6. الاستعمال الآمن</h2>\n<p>عطورنا للاستعمال الخارجي. رشّها على نقاط الحرارة، وتجنّب ملامسة العينين والأغشية المخاطية، واحفظها بعيدًا عن متناول الأطفال وعن اللهب. عند حدوث أي تفاعل جلدي، أوقف الاستعمال. وقائمة مسبّبات الحساسية المنظَّمة مذكورة على غلاف كل قارورة.</p>") : "langue absente";
dire("  page 6 content (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["en"], $odysFr, "meta_title", "Loyalty programme") : "langue absente";
dire("  page 8 meta_title (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["en"], $odysFr, "meta_description", "The ODYS loyalty programme rewards your fragrance purchases. It is free, with no card and no subscription: create an account, order, collect.") : "langue absente";
dire("  page 8 meta_description (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["en"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["en"], $odysFr, "content", "<p class=\"legal-lede\">The ODYS loyalty programme rewards your fragrance purchases. It is free, with no card and no subscription: create an account, order, collect.</p>\n\n<h2>1. How points are earned</h2>\n<ul>\n  <li><b>1 point for every 100 DH</b> spent on fragrances, rounded down.</li>\n  <li>Points are credited <b>when your order is validated</b>, not when it is placed.</li>\n  <li>A customer account is required: orders placed as a guest collect no points.</li>\n</ul>\n\n<h2>2. What does not collect</h2>\n<p><b>Oud and boukhour</b> sold by the gram give no right to points, and neither do delivery charges. These are materials whose margin does not allow it — we would rather write it here than have you discover it at the till.</p>\n\n<h2>3. How points are spent</h2>\n<p>Rewards open from <b>10 points</b>. You choose among the items in stock at the time of the exchange:</p>\n<ul>\n  <li><b>10 points:</b> one fragrance offered.</li>\n  <li><b>15 points:</b> two fragrances offered, or 5 g of oud.</li>\n  <li><b>20 points:</b> one gift set offered.</li>\n  <li>The reward is requested from your account, before placing an order.</li>\n  <li>One reward per order: the voucher cannot be combined with another promotion.</li>\n  <li>The voucher is personal, single use, and valid for 3 months.</li>\n</ul>\n\n<h2>4. Validity</h2>\n<p>Points are valid for <b>12 months</b> from the day they are granted. A purchase resets the counter for your whole balance. We warn you before any expiry, at the e-mail address on your account.</p>\n\n<h2>5. Returns and cancellations</h2>\n<p>Points tied to a refunded or cancelled order are removed from your balance. If the reward has already been used, its value is deducted from the refund.</p>\n\n<h2>6. Points are personal</h2>\n<p>Points are attached to your account: they cannot be exchanged, sold or transferred from one account to another, and they have no monetary value. They cannot be converted into cash nor deducted from the amount of an order.</p>\n\n<h2>7. Changes to the programme</h2>\n<p>We may change these rules or end the programme; in that case we announce it on this page and by e-mail, and you keep <b>30 days</b> to use the points already earned.</p>\n\n<h2>8. A question</h2>\n<p>Write to us on WhatsApp or by e-mail: we adjust by hand what an automatic programme would have counted badly.</p>") : "langue absente";
dire("  page 8 content (en) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["ar"], $odysFr, "meta_title", "برنامج الولاء") : "langue absente";
dire("  page 8 meta_title (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["ar"], $odysFr, "meta_description", "برنامج الولاء ديال أوديس يكافئ مشترياتك من العطور. مجاني، بلا بطاقة وبلا اشتراك: أنشئ حسابًا، اطلب، واجمع النقاط.") : "langue absente";
dire("  page 8 meta_description (ar) : " . $odysEtat);
$odysEtat = isset($odysLangues["ar"]) ? odysPoser("cms_lang", "id_cms", 8, $odysLangues["ar"], $odysFr, "content", "<p class=\"legal-lede\">برنامج الولاء ديال أوديس يكافئ مشترياتك من العطور. مجاني، بلا بطاقة وبلا اشتراك: أنشئ حسابًا، اطلب، واجمع النقاط.</p>\n\n<h2>1. كيف تُجمع النقاط</h2>\n<ul>\n  <li><b>نقطة واحدة عن كل 100 درهم</b> تُنفق على العطور، مع التقريب إلى الأسفل.</li>\n  <li>تُضاف النقاط <b>عند تأكيد طلبك</b>، لا عند تسجيله.</li>\n  <li>يلزم حساب زبون: الطلبات بصفة زائر لا تجمع نقاطًا.</li>\n</ul>\n\n<h2>2. ما لا يجمع نقاطًا</h2>\n<p><b>العود والبخور</b> المباعان بالغرام لا يمنحان نقاطًا، وكذلك مصاريف التوصيل. هذه مواد لا يسمح هامشها بذلك — ونفضّل كتابة هذا هنا على أن تكتشفه عند الأداء.</p>\n\n<h2>3. كيف تُصرف النقاط</h2>\n<p>تُفتح المكافآت ابتداءً من <b>10 نقاط</b>. وتختار من بين المنتجات المتوفرة وقت الاستبدال:</p>\n<ul>\n  <li><b>10 نقاط:</b> عطر هدية.</li>\n  <li><b>15 نقطة:</b> عطران هدية، أو 5 غرامات من العود.</li>\n  <li><b>20 نقطة:</b> علبة هدية.</li>\n  <li>تُطلب المكافأة من حسابك، قبل تسجيل الطلب.</li>\n  <li>مكافأة واحدة لكل طلب: القسيمة لا تُجمع مع عرض آخر.</li>\n  <li>القسيمة شخصية، تُستعمل مرة واحدة، وصالحة 3 أشهر.</li>\n</ul>\n\n<h2>4. مدة الصلاحية</h2>\n<p>النقاط صالحة <b>12 شهرًا</b> ابتداءً من يوم منحها. وأي شراء يعيد العدّاد إلى الصفر بالنسبة لرصيدك كله. ونُنبّهك قبل أي انتهاء، على البريد الإلكتروني المسجّل في حسابك.</p>\n\n<h2>5. الإرجاع والإلغاء</h2>\n<p>النقاط المرتبطة بطلب تم استرجاعه أو إلغاؤه تُسحب من رصيدك. وإذا كانت المكافأة قد استُعملت، تُخصم قيمتها من المبلغ المسترجع.</p>\n\n<h2>6. النقاط شخصية</h2>\n<p>النقاط مرتبطة بحسابك: لا تُبادل ولا تُباع ولا تُنقل من حساب إلى آخر، وليست لها أي قيمة نقدية. ولا يمكن تحويلها إلى نقود ولا خصمها من مبلغ طلب.</p>\n\n<h2>7. تطوّر البرنامج</h2>\n<p>يمكننا تعديل هذه القواعد أو إنهاء البرنامج؛ وفي هذه الحالة نعلن ذلك في هذه الصفحة وبالبريد الإلكتروني، ويبقى لك <b>30 يومًا</b> لاستعمال النقاط المجمّعة.</p>\n\n<h2>8. عندك سؤال</h2>\n<p>راسلنا على واتساب أو بالبريد الإلكتروني: نصحّح يدويًا ما قد يحسبه برنامج آلي خطأً.</p>") : "langue absente";
dire("  page 8 content (ar) : " . $odysEtat);

dire("");
dire("SUPPRIMEZ CE FICHIER de public_html/ maintenant.");
