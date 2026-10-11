<?php
/**
 * ODYS CRM — a small lead pipeline for the ODYS Parfums storefront.
 *
 * Captures the buying intent the shop otherwise loses (quiz answers, WhatsApp
 * taps, newsletter sign-ups, add-to-cart) into one table, and shows it as a
 * pipeline in the Back Office. No third-party service, no monthly fee.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

require_once __DIR__ . '/classes/OdysCrmLead.php';
require_once __DIR__ . '/classes/OdysCrmGuard.php';
require_once __DIR__ . '/classes/OdysCampaign.php';
require_once __DIR__ . '/classes/OdysPhoneId.php';
require_once __DIR__ . '/classes/OdysMotDePasse.php';
require_once __DIR__ . '/classes/OdysAccueil.php';

class Odys_crm extends Module
{
    public function __construct()
    {
        $this->name = 'odys_crm';
        $this->tab = 'administration';
        $this->version = '1.1.0';
        $this->author = 'ODYS Parfums';
        $this->need_instance = 0;
        $this->ps_versions_compliancy = ['min' => '8.0.0', 'max' => _PS_VERSION_];
        $this->bootstrap = true;

        parent::__construct();

        $this->displayName = 'ODYS CRM';
        $this->description = 'Capture les contacts et les intentions d\'achat, et les suit dans un pipeline.';
        $this->confirmUninstall = 'Désinstaller ODYS CRM ? Les contacts déjà enregistrés restent en base de données.';
    }

    public function install()
    {
        return parent::install()
            && $this->installDb()
            && OdysCampaign::installDb()
            && OdysPhoneId::installDb()
            && OdysMotDePasse::installDb()
            && $this->installTab()
            && $this->registerHook('actionFrontControllerSetMedia')
            && $this->registerHook('actionValidateOrder')
            && $this->registerHook('actionOrderStatusPostUpdate')
            && $this->registerHook('actionObjectCustomerMessageAddAfter')
            // le telephone comme identite : champ au formulaire, et le numero
            // accepte a la place de l'e-mail pour se connecter
            && $this->registerHook('additionalCustomerFormFields')
            && $this->registerHook('validateCustomerFormFields')
            && $this->registerHook('actionCustomerAccountAdd')
            && $this->registerHook('actionCustomerAccountUpdate')
            && $this->registerHook('actionDispatcherBefore')
            // un compte cree par un reseau social n'a pas de mot de passe connu
            && $this->registerHook('actionFrontControllerInitAfter');
    }

    public function uninstall()
    {
        // The table is kept on purpose: uninstalling a module should not wipe
        // the shop's contact history. Drop it by hand if that is what you want.
        return $this->uninstallTab() && parent::uninstall();
    }

    private function installDb()
    {
        $sql = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'odys_crm_lead` (
            `id_odys_crm_lead` INT(11) NOT NULL AUTO_INCREMENT,
            `id_shop` INT(11) NOT NULL DEFAULT 1,
            `source` VARCHAR(32) NOT NULL DEFAULT "other",
            `stage` VARCHAR(16) NOT NULL DEFAULT "new",
            `name` VARCHAR(128) NOT NULL DEFAULT "",
            `email` VARCHAR(190) NOT NULL DEFAULT "",
            `phone` VARCHAR(32) NOT NULL DEFAULT "",
            `subject` VARCHAR(255) NOT NULL DEFAULT "",
            `payload` TEXT NULL,
            `page` VARCHAR(255) NOT NULL DEFAULT "",
            `visitor` VARCHAR(48) NOT NULL DEFAULT "",
            `ip` VARCHAR(46) NOT NULL DEFAULT "",
            `id_customer` INT(11) NOT NULL DEFAULT 0,
            `id_order` INT(11) NOT NULL DEFAULT 0,
            `value` DECIMAL(20,6) NOT NULL DEFAULT 0,
            `hits` INT(11) NOT NULL DEFAULT 1,
            `notes` TEXT NULL,
            `date_add` DATETIME NOT NULL,
            `date_upd` DATETIME NOT NULL,
            PRIMARY KEY (`id_odys_crm_lead`),
            KEY `stage` (`stage`),
            KEY `source` (`source`),
            KEY `email` (`email`),
            KEY `visitor` (`visitor`),
            KEY `date_upd` (`date_upd`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        // Rate limiting counts *requests*, so it needs its own table: the
        // lead table deduplicates, and a bot hammering one visitor id used
        // to leave the row count - and so the old limit - untouched.
        $rate = 'CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'odys_crm_rate` (
            `bucket` VARCHAR(64) NOT NULL,
            `window_start` INT(11) NOT NULL,
            `hits` INT(11) NOT NULL DEFAULT 0,
            PRIMARY KEY (`bucket`, `window_start`),
            KEY `window_start` (`window_start`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        return (bool) Db::getInstance()->execute($sql)
            && (bool) Db::getInstance()->execute($rate);
    }

    /** The module's Back Office screens. */
    const TABS = [
        ['AdminOdysCrm', 'ODYS CRM', 'people'],
        ['AdminOdysCampaigns', 'Campagnes ODYS', 'campaign'],
    ];

    private function installTab()
    {
        // per tab, so a screen added in a later version still appears on a
        // shop where the first one already exists
        foreach (self::TABS as $spec) {
            list($class, $label, $icon) = $spec;
            if (Tab::getIdFromClassName($class)) {
                continue;
            }
            $tab = new Tab();
            $tab->class_name = $class;
            $tab->module = $this->name;
            $tab->id_parent = (int) Tab::getIdFromClassName('AdminParentCustomer');
            $tab->icon = $icon;
            $tab->active = true;
            foreach (Language::getLanguages(false) as $lang) {
                $tab->name[(int) $lang['id_lang']] = $label;
            }
            $tab->add();
        }

        return true;
    }

    private function uninstallTab()
    {
        $idTab = (int) Tab::getIdFromClassName('AdminOdysCrm');
        if (!$idTab) {
            return true;
        }
        $tab = new Tab($idTab);

        return (bool) $tab->delete();
    }

    /**
     * "Configure" in the module manager. This module has no settings of its
     * own — its screen is the CRM tab under Customers — but the manager calls
     * this method for any module that offers a Configure button, and threw
     * "Method of module cannot be found" (a 500) when it was missing.
     */
    public function getContent()
    {
        Tools::redirectAdmin($this->context->link->getAdminLink('AdminOdysCrm'));
    }

    /**
     * Front office: load the capture script and tell it where to post.
     */
    public function hookActionFrontControllerSetMedia()
    {
        // cheap, and keeps the counter table from growing without bound
        if (mt_rand(1, 200) === 1) {
            OdysCrmGuard::prune();
        }

        $this->trackCampaign();

        $this->context->controller->registerJavascript(
            'odys-crm',
            'modules/' . $this->name . '/views/js/crm.js',
            ['position' => 'bottom', 'priority' => 200]
        );
        Media::addJsDef([
            'odysCrm' => [
                'url' => $this->context->link->getModuleLink($this->name, 'capture', [], true),
            ],
        ]);
    }

    /**
     * A link handed out on Instagram or WhatsApp carries ?c=<slug>. Opening
     * it counts a click and leaves a cookie, so an order placed within the
     * window can be credited to the post that brought the visitor.
     *
     * The slug comes from a URL, so it is whatever anyone cares to type: it
     * is cleaned, and an unknown one is ignored in silence.
     */
    private function trackCampaign(): void
    {
        $slug = OdysCampaign::cleanSlug((string) Tools::getValue('c'));
        if ($slug === '' || headers_sent()) {
            return;
        }
        if (!OdysCampaign::click($slug)) {
            return;
        }
        setcookie(
            OdysCampaign::COOKIE,
            $slug,
            [
                'expires' => time() + OdysCampaign::WINDOW_DAYS * 86400,
                'path' => __PS_BASE_URI__,
                'samesite' => 'Lax',
                'httponly' => true,
                'secure' => Tools::usingSecureMode(),
            ]
        );
    }

    /** The campaign a visitor arrived through, if the cookie still says so. */
    private function campaignSlug(): string
    {
        return OdysCampaign::cleanSlug((string) ($_COOKIE[OdysCampaign::COOKIE] ?? ''));
    }

    /**
     * A validated order closes every open lead for that customer.
     */
    /**
     * A refused delivery, recorded against the customer who refused it.
     *
     * Payment on delivery is refused on 15-30% of Moroccan orders and each
     * refusal is carriage paid twice. Whoever picks up the phone next needs to
     * know they are talking to someone who has already sent a driver away —
     * that is the difference between confirming an order and shipping it
     * blind. The lead goes back to "contacted" rather than "lost": the person
     * is still a customer, this order simply did not happen.
     */
    public function hookActionOrderStatusPostUpdate(array $params)
    {
        $state = isset($params['newOrderStatus']) ? $params['newOrderStatus'] : null;
        $idOrder = (int) ($params['id_order'] ?? 0);
        if (!$state || !$idOrder) {
            return;
        }
        $refused = array_filter(array_map('intval', [
            Configuration::get('PS_OS_CANCELED'),
            Configuration::get('PS_OS_REFUND'),
            Configuration::get('PS_OS_ERROR'),
        ]));
        if (!in_array((int) $state->id, $refused, true)) {
            return;
        }
        $order = new Order($idOrder);
        if (!Validate::isLoadedObject($order)) {
            return;
        }
        Db::getInstance()->update('odys_crm_lead', [
            'stage' => 'contacted',
            'notes' => pSQL('Commande ' . $order->reference . ' non aboutie le '
                . date('d/m/Y') . ' (' . $state->name . ').'),
            'date_upd' => date('Y-m-d H:i:s'),
        ], 'id_order = ' . $idOrder);
    }

    /**
     * How many orders this customer has already sent back, ever.
     *
     * Read straight from the order history rather than kept in a counter of
     * our own, so it cannot drift from what the Back Office shows.
     */
    public static function refusals(int $idCustomer): int
    {
        if ($idCustomer <= 0) {
            return 0;
        }
        $refused = array_filter(array_map('intval', [
            Configuration::get('PS_OS_CANCELED'),
            Configuration::get('PS_OS_REFUND'),
            Configuration::get('PS_OS_ERROR'),
        ]));
        if (!$refused) {
            return 0;
        }

        return (int) Db::getInstance()->getValue(
            'SELECT COUNT(DISTINCT o.id_order)
             FROM ' . _DB_PREFIX_ . 'orders o
             JOIN ' . _DB_PREFIX_ . 'order_history oh ON oh.id_order = o.id_order
             WHERE o.id_customer = ' . $idCustomer . '
               AND oh.id_order_state IN (' . implode(',', $refused) . ')'
        );
    }

    /**
     * A message from the contact form becomes a lead.
     *
     * PrestaShop files it under Service client and e-mails the shop - but the
     * e-mail only leaves if a mail server is configured, and a shop that has
     * not got round to that never learns the message arrived. The CRM list is
     * where the calling and the WhatsApp replies already happen, so the
     * message shows up there too: one list to work, nothing to remember.
     *
     * Service client keeps the thread and the reply history. This is only the
     * pointer to it, carrying a number to call back on when we have one.
     *
     * It hangs off the message rather than the thread because the thread row
     * is written first, with no message attached yet - hooking the thread got
     * a lead with an empty subject line, which is a lead you have to open
     * Service client to understand, i.e. the problem all over again.
     */
    public function hookActionObjectCustomerMessageAddAfter(array $params)
    {
        $message = isset($params['object']) ? $params['object'] : null;
        if (!$message instanceof CustomerMessage || (int) $message->id_employee) {
            return;  // a reply typed in the Back Office is not a new lead
        }
        $thread = new CustomerThread((int) $message->id_customer_thread);
        if (!Validate::isLoadedObject($thread) || !Validate::isEmail((string) $thread->email)) {
            return;
        }
        // only the message that opens the thread; a follow-up belongs to the
        // lead that already exists
        $first = (int) Db::getInstance()->getValue(
            'SELECT MIN(id_customer_message) FROM `' . _DB_PREFIX_ . 'customer_message`
             WHERE id_customer_thread = ' . (int) $thread->id
        );
        if ($first !== (int) $message->id) {
            return;
        }

        $lead = new OdysCrmLead();
        $lead->id_shop = (int) $this->context->shop->id;
        $lead->source = 'contact';
        $lead->email = OdysCrmGuard::cleanEmail($thread->email);
        $lead->subject = OdysCrmGuard::cleanText($message->message, 255);
        $lead->page = 'contact';
        $lead->visitor = OdysCrmGuard::cleanVisitor(
            isset($_COOKIE['odys_vid']) ? $_COOKIE['odys_vid'] : ''
        );
        $lead->ip = OdysCrmGuard::cleanText((string) Tools::getRemoteAddr(), 46);
        $lead->id_customer = (int) $thread->id_customer;
        $lead->id_order = (int) $thread->id_order;

        // the form asks for no phone number, so take the one they already gave
        // us for a delivery - a lead you cannot call is half a lead
        if ($lead->id_customer) {
            $customer = new Customer($lead->id_customer);
            if (Validate::isLoadedObject($customer)) {
                $lead->name = OdysCrmGuard::cleanText(
                    $customer->firstname . ' ' . $customer->lastname, 128
                );
                $lead->phone = OdysCrmGuard::cleanPhone(Db::getInstance()->getValue(
                    'SELECT IFNULL(NULLIF(phone_mobile, ""), phone) FROM `' . _DB_PREFIX_ . 'address`
                     WHERE id_customer = ' . (int) $customer->id . ' AND deleted = 0
                     ORDER BY id_address DESC'
                ));
            }
        }

        $lead->add();
    }

    public function hookActionValidateOrder(array $params)
    {
        if (empty($params['order']) || empty($params['customer'])) {
            return;
        }
        /** @var Order $order */
        $order = $params['order'];
        /** @var Customer $customer */
        $customer = $params['customer'];

        // credit the campaign that brought this visitor, once per order
        $slug = $this->campaignSlug();
        $credited = false;
        if ($slug !== '') {
            $credited = OdysCampaign::attribute((int) $order->id, $slug, (float) $order->total_paid);
        }
        // no click cookie does not mean no campaign: the code travels by
        // screenshot and by word of mouth far more than by tracked link
        if (!$credited) {
            OdysCampaign::attributeByCode((int) $order->id, (float) $order->total_paid);
        }

        // The leads that actually exist are anonymous: someone filled a cart
        // without ever typing an e-mail. They are keyed by the odys_vid cookie,
        // which this same browser still carries at checkout - matching only on
        // customer or e-mail meant a cart lead could never be closed.
        $where = 'stage IN ("new", "contacted") AND (id_customer = ' . (int) $customer->id;
        if (Validate::isEmail($customer->email)) {
            $where .= ' OR email = "' . pSQL($customer->email) . '"';
        }
        $visitor = OdysCrmGuard::cleanVisitor((string) Tools::getValue('odys_vid',
            isset($_COOKIE['odys_vid']) ? $_COOKIE['odys_vid'] : ''));
        if ($visitor !== '') {
            $where .= ' OR visitor = "' . pSQL($visitor) . '"';
        }
        $where .= ')';

        // and the lead stops being anonymous: a won lead with no phone number
        // teaches nothing and cannot be called back. The address is the one the
        // customer just confirmed for the delivery.
        $address = new Address((int) $order->id_address_delivery);
        $phone = trim((string) ($address->phone_mobile ?: $address->phone));

        Db::getInstance()->update('odys_crm_lead', [
            'stage' => 'ordered',
            'id_order' => (int) $order->id,
            'id_customer' => (int) $customer->id,
            'name' => pSQL(trim($customer->firstname . ' ' . $customer->lastname)),
            'email' => pSQL((string) $customer->email),
            'phone' => pSQL($phone),
            'value' => (float) $order->total_paid,
            'date_upd' => date('Y-m-d H:i:s'),
        ], $where);
    }

    // ── Le telephone comme identite ─────────────────────────────────────────
    //
    // Voir classes/OdysPhoneId.php pour le pourquoi. En resume : le champ est
    // ajoute au formulaire client par le hook prevu pour ca, et a la connexion
    // un numero est traduit en e-mail avant que PrestaShop ne regarde. Le mot
    // de passe reste exige — c'est une deuxieme facon de se nommer, pas une
    // facon de se passer d'authentification.

    /** Sommes-nous dans le tunnel de commande ? */
    private function surLeTunnel()
    {
        return isset($this->context->controller->php_self)
            && $this->context->controller->php_self === 'order';
    }

    /**
     * Ajoute « Telephone » au formulaire d'inscription et a la page Identite,
     * juste apres l'e-mail.
     *
     * PrestaShop ajoute les champs des modules a la fin du format, ce qui
     * posait le telephone APRES les cases de consentement et la newsletter —
     * un numero de livraison perdu en bas d'un formulaire, personne ne le
     * remplit. `$params['fields']` est une reference sur le format : on insere
     * nous-memes, a la bonne place, et on ne renvoie rien a ajouter.
     *
     * Le champ garde la cle `odys_crm_phone` et son `moduleName`, sans quoi
     * `validateByModules()` ne l'enverrait pas a notre validation. Il s'affiche
     * sous le nom `phone` : c'est donc `$_POST['phone']` qui revient.
     */
    public function hookAdditionalCustomerFormFields($params)
    {
        $champ = new FormField();
        $champ->setName('phone')
            ->setType('tel')
            ->setLabel('Téléphone')
            ->setMaxLength(32)
            // Obligatoire a l'inscription, ou il sert d'identifiant. Facultatif
            // dans le tunnel : l'adresse de livraison le demande deja, et le
            // faire saisir deux fois sur un telephone coute des commandes.
            ->setRequired(!$this->surLeTunnel());

        $idClient = (int) $this->context->customer->id;
        if ($idClient && !$this->context->customer->is_guest) {
            $champ->setValue(OdysPhoneId::stored($idClient));
        }

        if (isset($params['fields']) && is_array($params['fields'])
            && array_key_exists('email', $params['fields'])) {
            $champ->moduleName = $this->name;
            $params['fields'] = $this->insereApres(
                $params['fields'], 'email', 'odys_crm_phone', $champ
            );

            // Compte ouvert par un reseau social : le champ « Mot de passe
            // actuel » a ete retire par hookActionFrontControllerInitAfter.
            // Sans lui, un envoi avec les deux champs vides ferait ecrire a
            // CustomerPersister le hachage de la chaine vide — un mot de passe
            // vide qui ouvrirait le compte a n'importe qui. Le nouveau devient
            // donc obligatoire : c'est le moment ou ce client s'en choisit un.
            if (isset($params['fields']['new_password'])
                && !isset($params['fields']['password'])
                && $this->sansMotDePasse()) {
                $params['fields']['new_password']
                    ->setRequired(true)
                    ->setLabel('Choisissez un mot de passe');
            }

            return [];
        }

        // Repli : si le format n'est pas celui qu'on attend, le champ part a la
        // fin par le chemin normal plutot que de disparaitre.
        return [$champ];
    }

    /** Reconstruit un tableau associatif avec une entree glissee apres une cle. */
    private function insereApres(array $tableau, $apres, $cle, $valeur)
    {
        $sortie = [];
        foreach ($tableau as $k => $v) {
            if ($k === $cle) {
                continue; // deja pose lors d'un passage precedent
            }
            $sortie[$k] = $v;
            if ($k === $apres) {
                $sortie[$cle] = $valeur;
            }
        }

        return $sortie;
    }

    /**
     * Valide le numero : lisible, et pas deja celui d'un autre compte.
     *
     * Le controle d'unicite est saute dans le tunnel. Un invite dont le numero
     * est aussi celui d'un client inscrit verrait sinon sa commande refusee —
     * son numero n'est de toute facon pas enregistre comme identite.
     */
    public function hookValidateCustomerFormFields($params)
    {
        $retour = [];
        foreach ($params['fields'] as $champ) {
            if ($champ->getName() !== 'phone') {
                continue;
            }

            $saisi = trim((string) $champ->getValue());
            if ($saisi !== '') {
                $e164 = OdysPhoneId::normalise($saisi);
                if ($e164 === '') {
                    $champ->addError('Numero de telephone non reconnu. Exemple : 0612345678.');
                } elseif (!$this->surLeTunnel()) {
                    $detenteur = OdysPhoneId::takenBy($e164);
                    if ($detenteur && $detenteur !== (int) $this->context->customer->id) {
                        $champ->addError('Ce numero est deja associe a un compte. Connectez-vous avec ce numero, ou utilisez-en un autre.');
                    }
                }
            }

            // la cle doit etre celle que CustomerFormatter a posee
            $retour['odys_crm_phone'] = $champ;
        }

        return $retour;
    }

    public function hookActionCustomerAccountAdd($params)
    {
        $customer = isset($params['newCustomer']) ? $params['newCustomer'] : null;
        $this->retiensLeNumero($customer);

        // Un compte cree sans qu'aucun mot de passe ne soit saisi : c'est un
        // reseau social qui l'a ouvert, avec un mot de passe aleatoire que
        // personne ne connait. On le note, sinon ce client restera bloque sur
        // « Mes informations », qui reclame le mot de passe actuel.
        //
        // Ce hook n'existe qu'en front office — le Back Office cree ses clients
        // par ObjectModel — donc « aucun mot de passe saisi » ne peut pas etre
        // un compte ouvert par vous depuis l'administration.
        if (Validate::isLoadedObject($customer)
            && !$customer->is_guest
            && trim((string) Tools::getValue('password')) === ''
            && trim((string) Tools::getValue('new_password')) === '') {
            OdysMotDePasse::marque((int) $customer->id, (string) $customer->passwd);
        }
    }

    /**
     * Page « Mes informations » : ne pas reclamer le mot de passe actuel a qui
     * n'en a jamais choisi.
     *
     * `IdentityController::$passwordRequired` est public et lu dans
     * `initContent()` ; ce hook tourne dans `init()`, donc avant. Mis a false,
     * PrestaShop n'affiche plus le champ « Mot de passe » et `CustomerPersister`
     * ne verifie plus l'ancien — il prend le nouveau.
     *
     * Le garde-fou est dans hookAdditionalCustomerFormFields : sans mot de passe
     * actuel exige, un formulaire envoye avec les deux champs vides ferait
     * ecrire a PrestaShop le hachage de la chaine vide. Le nouveau mot de passe
     * devient donc obligatoire pour ces comptes.
     */
    public function hookActionFrontControllerInitAfter($params)
    {
        if (!isset($params['controller']) || !is_object($params['controller'])) {
            return;
        }
        $controleur = $params['controller'];

        // Page d'accueil : remplir la grille de produits que le gabarit tient
        // prete mais que personne n'alimentait. Voir classes/OdysAccueil.php.
        if (isset($controleur->php_self) && $controleur->php_self === 'index') {
            $parfums = OdysAccueil::produits($this->context);
            if ($parfums) {
                $this->context->smarty->assign('featuredProducts', $parfums);
            }

            // Les coffrets. Le « pack decouverte » existait au catalogue mais
            // n'etait nulle part sur l'accueil : on ne tombe dessus qu'en
            // ouvrant le menu. Pas de repli sur l'Accueil ici — sans
            // categorie « coffrets », la bande ne s'affiche pas du tout
            // plutot que de montrer le catalogue sous un faux titre.
            $coffrets = OdysAccueil::produits($this->context, 'coffrets', 4, false);
            if ($coffrets) {
                $this->context->smarty->assign('odysCoffrets', $coffrets);
            }

            return;
        }

        if (!isset($controleur->php_self) || $controleur->php_self !== 'identity'
            || !property_exists($controleur, 'passwordRequired')) {
            return;
        }

        if ($this->sansMotDePasse()) {
            $controleur->passwordRequired = false;
        }
    }

    /** Le client connecte n'a-t-il jamais choisi de mot de passe ? */
    private function sansMotDePasse()
    {
        $client = $this->context->customer;
        if (!Validate::isLoadedObject($client) || !$client->isLogged() || $client->is_guest) {
            return false;
        }

        return OdysMotDePasse::jamaisChoisi((int) $client->id, (string) $client->passwd);
    }

    public function hookActionCustomerAccountUpdate($params)
    {
        $this->retiensLeNumero(isset($params['customer']) ? $params['customer'] : null);
    }

    /**
     * `getCustomer()` du formulaire ne recopie que les champs qui existent sur
     * l'objet Customer, et `ps_customer` n'a pas de colonne telephone : le
     * champ est donc enregistre ici, apres la sauvegarde du client.
     */
    private function retiensLeNumero($customer)
    {
        if (!Validate::isLoadedObject($customer) || $customer->is_guest) {
            return;
        }
        $saisi = (string) Tools::getValue('phone');
        if (trim($saisi) !== '') {
            OdysPhoneId::remember((int) $customer->id, $saisi);
        }
    }

    /**
     * Connexion : accepte un numero la ou PrestaShop attend un e-mail.
     *
     * `CustomerLoginForm` lit `$_POST['email']` avant tout hook exploitable, et
     * `Customer::getByEmail()` leve une exception si la valeur n'est pas un
     * e-mail. On traduit donc le numero en e-mail ici, avant que le controleur
     * ne tourne. Le mot de passe est verifie ensuite, inchange.
     */
    public function hookActionDispatcherBefore($params)
    {
        // Le back-office poste lui aussi `submitLogin`, dans un champ qui
        // s'appelle aussi `email`. Ne jamais y toucher.
        if (!isset($params['controller_type'])
            || (int) $params['controller_type'] !== Dispatcher::FC_FRONT) {
            return;
        }
        if (!Tools::isSubmit('submitLogin') || !isset($_POST['email'])) {
            return;
        }

        $saisi = trim((string) $_POST['email']);
        if ($saisi === '' || strpos($saisi, '@') !== false) {
            return; // c'est un e-mail, laissons PrestaShop faire
        }

        $email = OdysPhoneId::emailFor(OdysPhoneId::normalise($saisi));

        // Un numero inconnu doit echouer exactement comme un mot de passe
        // faux : meme message, et surtout pas une erreur 500 ni un « ce numero
        // n'existe pas » qui dirait a un inconnu qui est client.
        $_POST['email'] = $email !== '' ? $email : 'inconnu@odys.invalid';
    }
}
