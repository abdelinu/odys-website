<?php
/**
 * Back Office → Apparence → Thème ODYS.
 *
 * The words on the home page used to live in the templates, which meant a
 * rebuild — and a developer — to change a headline or a delivery message.
 * They live here now. Every field falls back to what the template shipped
 * with, so an empty setting is not an empty page.
 *
 * The olfactory pyramid is not here: PrestaShop already edits it per product
 * under Catalogue → Produits → Caractéristiques. What this screen owns is
 * which three features the pyramid reads, so renaming one in the catalogue
 * cannot quietly empty the block.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminOdysThemeController extends ModuleAdminController
{
    /** setting => [label, type, hint]. The order is the order on screen. */
    const FIELDS = [
        'ODYS_HERO_EYEBROW' => ['Accroche (au-dessus du titre)', 'text', "Vide : « L'art de l'essence »"],
        'ODYS_HERO_TITLE_1' => ['Titre — première ligne', 'text', 'Vide : « Plus qu\'un parfum, »'],
        'ODYS_HERO_TITLE_2' => ['Titre — seconde ligne', 'text', 'Vide : « une émotion »'],
        'ODYS_HERO_LEDE'    => ['Texte sous le titre', 'textarea', 'Deux lignes au maximum se lisent bien.'],
        'ODYS_HERO_CTA'     => ['Bouton principal', 'text', 'Vide : « Découvrir la collection »'],
        'ODYS_ANNOUNCE'     => ['Bandeau d\'annonces', 'textarea',
            'Un message par ligne. Vide : les huit messages d\'origine. '
            . 'Le bandeau défile, donc les messages courts passent mieux.'],
        'ODYS_COLL_EYEBROW' => ['Accueil — accroche collections', 'text', 'Vide : « Nos collections »'],
        'ODYS_COLL_TITLE'   => ['Accueil — titre collections', 'text', 'Vide : « Trouvez votre ODYS »'],
        'ODYS_COLL_SUB'     => ['Accueil — sous-titre collections', 'text', 'Vide : « Quelle fragrance vous correspond ? »'],
        'ODYS_FOOTER_BLURB' => ['Pied de page — présentation', 'textarea',
            'Le paragraphe sous le logo. Vide : le texte d\'origine.'],
        'ODYS_SVC_1'        => ['Fiche produit — service 1', 'text', 'Vide : « Élaboré au Maroc »'],
        'ODYS_SVC_2'        => ['Fiche produit — service 2', 'text', 'Vide : « Paiement à la livraison »'],
        'ODYS_SVC_3'        => ['Fiche produit — service 3', 'text', 'Vide : « Livraison 24–48h »'],
        'ODYS_SVC_4'        => ['Fiche produit — service 4', 'text', 'Vide : « Retours sous 14 jours »'],
        'ODYS_COD_NOTE'     => ['Fiche produit — paiement à la livraison', 'text',
            'Vide : rien ne s\'affiche. Par exemple « Nous vous appelons pour confirmer '
            . 'avant l\'expédition. » — annoncer l\'appel réduit les refus à la porte.'],
        'ODYS_GRAM_STEPS'   => ['Oud — grammages proposés', 'text',
            'Séparés par des virgules. Vide : 5, 10, 25, 50. Le prix au gramme, lui, '
            . 'se règle sur chaque produit (Catalogue → Produits → Prix).'],
        'ODYS_GRAM_MIN'     => ['Oud — commande minimum (g)', 'text', 'Vide : 5 g.'],
    ];

    /** Where an uploaded hero film and poster are kept, and what may be sent. */
    const UPLOAD_DIR = 'odys/';
    const UPLOADS = [
        'ODYS_HERO_VIDEO'  => ['Film de la bannière (MP4)', ['video/mp4'], 12, 'mp4'],
        'ODYS_HERO_POSTER' => ['Image d\'attente (WebP, JPEG ou PNG)',
            ['image/webp', 'image/jpeg', 'image/png'], 3, 'webp'],
    ];

    /**
     * The ambiances, editable here rather than in the stylesheet.
     *
     * A diffuser is bought for what it smells of, so its page takes the colour
     * of its ingredient. A slot is a slug — the value typed on the product in
     * Catalogue → Produits → Caractéristiques → Ambiance — and the four
     * colours the page is built from, plus an optional photograph.
     *
     * The theme ships two of these in its stylesheet; anything saved here wins
     * over them, and a slot left blank simply does nothing.
     */
    const AMBIANCE_SLOTS = 6;

    /** slot => [slug, name, deep, wash, accent, leaf] — what the theme ships. */
    const AMBIANCE_DEFAULTS = [
        1 => ['fleur-oranger', "Fleur d'oranger", '#080D09', '#16241A', '#EFE7D6', '#7E9B6A'],
        2 => ['ambre', 'Ambre', '#0B0806', '#2A1A0C', '#E0A75C', '#B08D4F'],
    ];

    /** The four colours of an ambiance, in the order they appear on screen. */
    const AMBIANCE_COLOURS = [
        'DEEP'   => ['Fond de page', 'La couleur derrière toute la page.'],
        'WASH'   => ['Halo', 'La lueur sous le produit, en haut de la page.'],
        'ACCENT' => ['Accent', 'Le prix, le format, le bouton d\'ajout au panier.'],
        'LEAF'   => ['Secondaire', 'Les notes de la pyramide et les libellés discrets.'],
    ];

    /** The three features the pyramid reads, by id. */
    const PYRAMID = [
        'ODYS_FEAT_TETE'  => 'Notes de tête',
        'ODYS_FEAT_COEUR' => 'Notes de cœur',
        'ODYS_FEAT_FOND'  => 'Notes de fond',
    ];

    public function __construct()
    {
        $this->bootstrap = true;
        $this->lang = false;
        parent::__construct();
    }

    public function initContent()
    {
        parent::initContent();

        $notice = '';
        if (Tools::isSubmit('submit_odys_theme')) {
            $notice = $this->save();
        }

        $this->content .= $notice . $this->renderForm()
            . $this->renderAmbianceNote() . $this->renderPyramidNote();
        $this->context->smarty->assign('content', $this->content);
    }

    /**
     * Everything here is typed by an employee and printed into a page, so it
     * is stripped of markup on the way in and escaped again on the way out.
     * Configuration::updateValue() parameterises its own query; pSQL() would
     * only mangle apostrophes, of which French copy has plenty.
     */
    private function save(): string
    {
        foreach (array_keys(self::FIELDS) as $key) {
            if (!Tools::getIsset($key)) {
                continue;
            }
            $raw = (string) Tools::getValue($key);
            // a client that posts anything but UTF-8 would have its text cut
            // at the first bad byte
            $raw = mb_convert_encoding($raw, 'UTF-8', 'UTF-8');
            $clean = trim(strip_tags($raw));
            if ($key === 'ODYS_GRAM_STEPS') {
                // a list of grammes, ascending, at most six of them
                $steps = array_filter(array_map('intval', explode(',', $clean)),
                    function ($g) { return $g > 0 && $g <= 1000; });
                $steps = array_slice(array_unique($steps), 0, 6);
                sort($steps);
                $clean = implode(',', $steps);
            } elseif ($key === 'ODYS_GRAM_MIN') {
                $clean = (string) max(0, min(1000, (int) $clean));
                $clean = $clean === '0' ? '' : $clean;
            }
            $limit = $key === 'ODYS_ANNOUNCE' ? 2000 : 300;
            Configuration::updateValue($key, Tools::substr($clean, 0, $limit));
        }

        foreach (array_keys(self::PYRAMID) as $key) {
            if (Tools::getIsset($key)) {
                Configuration::updateValue($key, (int) Tools::getValue($key));
            }
        }

        $this->saveAmbiances();

        // displayConfirmation() belongs to Module, not to AdminController
        $problems = array_merge($this->saveUploads(), $this->saveAmbianceUploads());

        return ($problems ? '<div class="alert alert-warning">' . implode('<br>', $problems) . '</div>' : '')
            . '<div class="alert alert-success">Réglages enregistrés. '
            . 'Videz le cache si la page semble inchangée.</div>';
    }

    /**
     * The hero film and its poster, replaceable without a rebuild.
     *
     * They are written to img/odys/ — PrestaShop's own writable image folder —
     * and not into the theme, whose assets a rebuild overwrites. The type is
     * read from the file itself rather than from the name the browser sent,
     * and only this short list is accepted.
     *
     * @return string[] what could not be taken, for the employee to read
     */
    private function saveUploads(): array
    {
        $problems = [];
        $dir = _PS_IMG_DIR_ . self::UPLOAD_DIR;
        foreach (self::UPLOADS as $key => $spec) {
            list($label, $types, $maxMb, $ext) = $spec;
            $file = isset($_FILES[$key]) ? $_FILES[$key] : null;
            if (!$file || !isset($file['tmp_name']) || (int) $file['error'] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            if ((int) $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
                $problems[] = $label . ' : envoi interrompu.';
                continue;
            }
            if ((int) $file['size'] > $maxMb * 1024 * 1024) {
                $problems[] = $label . ' : ' . $maxMb . ' Mo maximum.';
                continue;
            }
            $mime = '';
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = (string) finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
            }
            if (!in_array($mime, $types, true)) {
                $problems[] = $label . ' : format refusé (' . htmlspecialchars($mime, ENT_QUOTES, 'UTF-8') . ').';
                continue;
            }
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
                $problems[] = $label . ' : dossier img/odys/ impossible à créer.';
                continue;
            }
            // the name is ours, never the browser's, and it changes with every
            // upload so no cache keeps serving yesterday's film
            $prefix = $key === 'ODYS_HERO_VIDEO' ? 'hero-' : 'hero-poster-';
            $name = $prefix . time() . '.' . $ext;
            if (!@move_uploaded_file($file['tmp_name'], $dir . $name)) {
                $problems[] = $label . ' : écriture impossible dans img/odys/.';
                continue;
            }
            $previous = (string) Configuration::get($key);
            Configuration::updateValue($key, $name);
            // tidy up the file it replaces, and nothing else in that folder
            if ($previous !== '' && $previous !== $name
                && preg_match('/^hero-[a-z-]*[0-9]+\.[a-z0-9]+$/', $previous)
                && is_file($dir . $previous)) {
                @unlink($dir . $previous);
            }
        }

        return $problems;
    }

    /** AdminController declares renderForm() public; PHP will not narrow it. */
    public function renderForm(): string
    {
        $helper = new HelperForm();
        $helper->module = $this->module;
        $helper->name_controller = 'odys_theme';
        $helper->token = $this->token;
        $helper->currentIndex = self::$currentIndex;
        $helper->submit_action = 'submit_odys_theme';
        $helper->fields_value = [];

        $inputs = [];
        foreach (self::FIELDS as $key => $field) {
            $helper->fields_value[$key] = Configuration::get($key);
            $inputs[] = [
                'type' => $field[1],
                'label' => $field[0],
                'name' => $key,
                'desc' => $field[2],
                'cols' => 60,
                'rows' => $key === 'ODYS_ANNOUNCE' ? 9 : 3,
            ];
        }

        foreach (self::UPLOADS as $key => $spec) {
            $current = (string) Configuration::get($key);
            $inputs[] = [
                'type' => 'file',
                'label' => $spec[0],
                'name' => $key,
                'desc' => ($current !== ''
                    ? 'Actuellement : ' . $current . '. '
                    : 'Actuellement : le fichier livré avec le thème. ')
                    . $spec[2] . ' Mo maximum. Laissez vide pour ne rien changer.',
            ];
        }

        // the features the catalogue actually has, so the pyramid is mapped
        // by id and a rename in Catalogue → Caractéristiques cannot break it
        $features = array_merge(
            [['id_feature' => 0, 'name' => '— par nom (comportement d\'origine) —']],
            (array) Feature::getFeatures((int) $this->context->language->id)
        );
        foreach (self::PYRAMID as $key => $label) {
            $helper->fields_value[$key] = (int) Configuration::get($key);
            $inputs[] = [
                'type' => 'select',
                'label' => $label,
                'name' => $key,
                'options' => ['query' => $features, 'id' => 'id_feature', 'name' => 'name'],
                'desc' => 'La caractéristique produit dont cette ligne de la pyramide est tirée.',
            ];
        }

        return $helper->generateForm([
            [
            'form' => [
                'legend' => ['title' => 'Page d\'accueil et bandeau', 'icon' => 'icon-pencil'],
                'input' => $inputs,
                'submit' => ['title' => 'Enregistrer'],
            ],
            ],
            [
                'form' => [
                    'legend' => ['title' => 'Ambiances des diffuseurs', 'icon' => 'icon-tint'],
                    'input' => $this->ambianceInputs($helper),
                    'submit' => ['title' => 'Enregistrer'],
                ],
            ],
        ]);
    }

    /**
     * An ambiance as the shop has it: the saved slot, or what the theme ships.
     *
     * @return array{slug:string,name:string,deep:string,wash:string,accent:string,leaf:string,img:string}
     */
    private function ambiance(int $slot): array
    {
        $fallback = isset(self::AMBIANCE_DEFAULTS[$slot])
            ? self::AMBIANCE_DEFAULTS[$slot]
            : ['', '', '', '', '', ''];
        $get = function ($suffix, $default) use ($slot) {
            $value = (string) Configuration::get('ODYS_AMB_' . $slot . '_' . $suffix);

            return $value !== '' ? $value : $default;
        };

        return [
            'slug'   => $get('SLUG', $fallback[0]),
            'name'   => $get('NAME', $fallback[1]),
            'deep'   => $get('DEEP', $fallback[2]),
            'wash'   => $get('WASH', $fallback[3]),
            'accent' => $get('ACCENT', $fallback[4]),
            'leaf'   => $get('LEAF', $fallback[5]),
            'img'    => (string) Configuration::get('ODYS_AMB_' . $slot . '_IMG'),
        ];
    }

    /**
     * Save the ambiances.
     *
     * A slug reaches a CSS attribute selector and a colour reaches a CSS
     * declaration, so both are reduced to a shape that cannot carry anything
     * else: [a-z0-9-] for the slug, #rrggbb for the colour. A slot whose slug
     * is cleared is forgotten entirely, image included.
     */
    private function saveAmbiances(): void
    {
        for ($slot = 1; $slot <= self::AMBIANCE_SLOTS; ++$slot) {
            $key = 'ODYS_AMB_' . $slot . '_';
            if (!Tools::getIsset($key . 'SLUG')) {
                continue;
            }
            $slug = Tools::strtolower(trim((string) Tools::getValue($key . 'SLUG')));
            $slug = preg_replace('/[^a-z0-9-]/', '', Tools::replaceAccentedChars($slug));
            $slug = trim((string) $slug, '-');
            Configuration::updateValue($key . 'SLUG', Tools::substr((string) $slug, 0, 40));

            if ($slug === '') {
                // the slot is free again; its photograph goes with it
                $this->forgetAmbianceImage($slot);
                foreach (array_keys(self::AMBIANCE_COLOURS) as $suffix) {
                    Configuration::updateValue($key . $suffix, '');
                }
                Configuration::updateValue($key . 'NAME', '');
                continue;
            }

            $name = trim(strip_tags((string) Tools::getValue($key . 'NAME')));
            Configuration::updateValue($key . 'NAME', Tools::substr($name, 0, 60));

            foreach (array_keys(self::AMBIANCE_COLOURS) as $suffix) {
                $colour = trim((string) Tools::getValue($key . $suffix));
                if (!preg_match('/^#[0-9A-Fa-f]{6}$/', $colour)) {
                    $colour = '';   // not a colour; the theme's own value stands
                }
                Configuration::updateValue($key . $suffix, Tools::strtoupper($colour));
            }
        }
    }

    /** Remove a slot's photograph from img/odys/ and from the settings. */
    private function forgetAmbianceImage(int $slot): void
    {
        $file = (string) Configuration::get('ODYS_AMB_' . $slot . '_IMG');
        $path = _PS_IMG_DIR_ . self::UPLOAD_DIR . $file;
        if ($file !== '' && preg_match('/^ambiance-[a-z0-9-]+\.[a-z0-9]+$/', $file) && is_file($path)) {
            @unlink($path);
        }
        Configuration::updateValue('ODYS_AMB_' . $slot . '_IMG', '');
    }

    /**
     * The photograph behind an ambiance, uploaded rather than rebuilt in.
     *
     * Same rules as the hero film: the type is read from the file itself, the
     * name is ours, and it lands in img/odys/ where a rebuild cannot wipe it.
     *
     * @return string[] what could not be taken
     */
    private function saveAmbianceUploads(): array
    {
        $problems = [];
        $dir = _PS_IMG_DIR_ . self::UPLOAD_DIR;
        $types = ['image/webp', 'image/jpeg', 'image/png'];

        for ($slot = 1; $slot <= self::AMBIANCE_SLOTS; ++$slot) {
            $key = 'ODYS_AMB_' . $slot . '_IMG';
            $file = isset($_FILES[$key]) ? $_FILES[$key] : null;
            if (!$file || !isset($file['tmp_name']) || (int) $file['error'] === UPLOAD_ERR_NO_FILE) {
                continue;
            }
            $amb = $this->ambiance($slot);
            $label = 'Ambiance ' . ($amb['name'] !== '' ? $amb['name'] : (string) $slot);
            if ($amb['slug'] === '') {
                $problems[] = $label . ' : donnez-lui d\'abord un identifiant.';
                continue;
            }
            if ((int) $file['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($file['tmp_name'])) {
                $problems[] = $label . ' : envoi interrompu.';
                continue;
            }
            if ((int) $file['size'] > 3 * 1024 * 1024) {
                $problems[] = $label . ' : 3 Mo maximum.';
                continue;
            }
            $mime = '';
            if (function_exists('finfo_open')) {
                $finfo = finfo_open(FILEINFO_MIME_TYPE);
                $mime = (string) finfo_file($finfo, $file['tmp_name']);
                finfo_close($finfo);
            }
            if (!in_array($mime, $types, true)) {
                $problems[] = $label . ' : format refusé (' . htmlspecialchars($mime, ENT_QUOTES, 'UTF-8') . ').';
                continue;
            }
            if (!is_dir($dir) && !@mkdir($dir, 0755, true) && !is_dir($dir)) {
                $problems[] = $label . ' : dossier img/odys/ impossible à créer.';
                continue;
            }
            $ext = $mime === 'image/png' ? 'png' : ($mime === 'image/jpeg' ? 'jpg' : 'webp');
            $name = 'ambiance-' . $amb['slug'] . '-' . time() . '.' . $ext;
            if (!@move_uploaded_file($file['tmp_name'], $dir . $name)) {
                $problems[] = $label . ' : écriture impossible dans img/odys/.';
                continue;
            }
            $previous = (string) Configuration::get($key);
            Configuration::updateValue($key, $name);
            if ($previous !== '' && $previous !== $name
                && preg_match('/^ambiance-[a-z0-9-]+\.[a-z0-9]+$/', $previous)
                && is_file($dir . $previous)) {
                @unlink($dir . $previous);
            }
        }

        return $problems;
    }

    /** The ambiance panel: one block of fields per slot. */
    private function ambianceInputs(HelperForm $helper): array
    {
        $inputs = [];
        for ($slot = 1; $slot <= self::AMBIANCE_SLOTS; ++$slot) {
            $amb = $this->ambiance($slot);
            $key = 'ODYS_AMB_' . $slot . '_';

            $helper->fields_value[$key . 'SLUG'] = $amb['slug'];
            $inputs[] = [
                'type' => 'text',
                'label' => 'Ambiance ' . $slot . ' — identifiant',
                'name' => $key . 'SLUG',
                'desc' => 'Le mot saisi sur le produit, sans accent ni espace — par exemple '
                    . '« fleur-oranger ». Videz-le pour libérer l\'emplacement.',
            ];
            $helper->fields_value[$key . 'NAME'] = $amb['name'];
            $inputs[] = [
                'type' => 'text',
                'label' => 'Ambiance ' . $slot . ' — nom',
                'name' => $key . 'NAME',
                'desc' => 'Pour vous repérer sur cet écran. Il n\'apparaît pas sur la boutique.',
            ];
            foreach (self::AMBIANCE_COLOURS as $suffix => $spec) {
                $helper->fields_value[$key . $suffix] = $amb[Tools::strtolower($suffix)];
                $inputs[] = [
                    'type' => 'color',
                    'label' => 'Ambiance ' . $slot . ' — ' . $spec[0],
                    'name' => $key . $suffix,
                    'desc' => $spec[1],
                ];
            }
            $inputs[] = [
                'type' => 'file',
                'label' => 'Ambiance ' . $slot . ' — photographie',
                'name' => $key . 'IMG',
                'desc' => ($amb['img'] !== ''
                        ? 'Actuellement : ' . htmlspecialchars($amb['img'], ENT_QUOTES, 'UTF-8') . '. '
                        : 'Aucune : la page garde ses couleurs seules. ')
                    . 'Elle passe très en retrait derrière le produit. 3 Mo maximum.',
            ];
        }

        return $inputs;
    }

    /** Where an ambiance is attached to a product — the question this panel gets asked. */
    private function renderAmbianceNote(): string
    {
        $link = $this->context->link->getAdminLink('AdminProducts');
        $rows = '';
        for ($slot = 1; $slot <= self::AMBIANCE_SLOTS; ++$slot) {
            $amb = $this->ambiance($slot);
            if ($amb['slug'] === '') {
                continue;
            }
            $rows .= '<tr><td><code>' . htmlspecialchars($amb['slug'], ENT_QUOTES, 'UTF-8') . '</code></td>'
                . '<td>' . htmlspecialchars($amb['name'], ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td>' . ($amb['img'] !== '' ? 'photographie' : 'couleurs seules') . '</td></tr>';
        }

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-info-circle"></i> Donner une ambiance à un produit</div>'
            . '<div class="panel-body">'
            . '<p>Une ambiance se pose produit par produit : '
            . '<a href="' . htmlspecialchars($link, ENT_QUOTES, 'UTF-8') . '">Catalogue → Produits</a>'
            . ' → ouvrez un diffuseur → onglet <strong>Caractéristiques</strong> → '
            . '<strong>Ambiance</strong>, et saisissez l\'identifiant d\'une des lignes ci-dessous.</p>'
            . ($rows !== ''
                ? '<table class="table"><thead><tr><th>Identifiant</th><th>Nom</th><th>Fond</th></tr></thead>'
                    . '<tbody>' . $rows . '</tbody></table>'
                : '<p><em>Aucune ambiance n\'est définie pour le moment.</em></p>')
            . '<p>Un produit sans ambiance garde le thème de la maison — c\'est le cas de tous '
            . 'les parfums. La <strong>contenance</strong> se saisit au même endroit : elle donne '
            . 'le format affiché sur la fiche et sur le bouton d\'ajout au panier.</p>'
            . '</div></div>';
    }

    /** Where the notes themselves are edited — the question this screen gets asked. */
    private function renderPyramidNote(): string
    {
        $link = $this->context->link->getAdminLink('AdminProducts');

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-info-circle"></i> La pyramide olfactive</div>'
            . '<div class="panel-body">'
            . '<p>Les notes se saisissent produit par produit : '
            . '<a href="' . htmlspecialchars($link, ENT_QUOTES, 'UTF-8') . '">Catalogue → Produits</a>'
            . ' → ouvrez un parfum → onglet <strong>Caractéristiques</strong> → '
            . '<strong>Notes de tête</strong>, <strong>Notes de cœur</strong>, <strong>Notes de fond</strong>.</p>'
            . '<p>Séparez les notes par des virgules — <em>Bergamote, Poivre rose, Ambroxan</em>. '
            . 'Chaque note devient un lien vers la recherche. Une ligne laissée vide disparaît de '
            . 'la pyramide, et un produit sans aucune des trois n\'affiche pas le bloc.</p>'
            . '<p>Pour ajouter une note à la liste proposée : Catalogue → Attributs et '
            . 'caractéristiques → Caractéristiques → <strong>Valeurs</strong>. Vous pouvez aussi '
            . 'taper une valeur personnalisée directement sur le produit.</p>'
            . '</div></div>';
    }
}
