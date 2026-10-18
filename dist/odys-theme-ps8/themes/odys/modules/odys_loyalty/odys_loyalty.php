<?php
/**
 * ODYS Loyalty Points Module for PrestaShop 8
 *
 * The rules are the ones published on the fidélité page, and nothing else:
 *   +1 pt per 100 MAD of perfume actually paid for (oud, boukhour and
 *      shipping earn nothing), credited when the order is paid
 *   +2 pts welcome, with the first paid order — never at registration,
 *      which anyone could farm with a disposable address
 *   -N  when that order is cancelled, refunded or fails
 *   10 pts a perfume, 15 pts two perfumes or 5 g d'oud,
 *      20 pts a coffret — nothing redeemable below 10
 *   a balance lapses twelve months after the last purchase
 * Tiers (Bronze / Argent / Or / VIP) are a name for the balance, not a
 * second currency.
 */
if (!defined('_PS_VERSION_')) exit;

// PS9.1 compatibility: getDefaultTheme() no longer returns 'classic'
// This module does not depend on the classic theme — fully compatible.

class Odys_Loyalty extends Module
{
    public function __construct()
    {
        $this->name                   = 'odys_loyalty';
        $this->tab                    = 'front_office_features';
        $this->version                = '1.0.0';
        $this->author                 = 'ODYS Parfums';
        $this->need_instance          = 0;
        $this->ps_versions_compliancy = ['min' => '8.0.0', 'max' => '9.9.99'];
        $this->bootstrap              = true;
        parent::__construct();
        $this->displayName = $this->l('ODYS Loyalty Points');
        $this->description = $this->l('Programme fidélité — points sur parfums uniquement. Oud/Boukhour exclus.');
    }

    public function install(): bool
    {
        return parent::install()
            && $this->registerHook('actionOrderStatusPostUpdate')
            && $this->registerHook('actionValidateOrder')
            && $this->registerHook('displayLoyaltyPoints')
            && $this->registerHook('displayProductAdditionalInfo')
            && $this->registerHook('actionFrontControllerSetMedia')
            && $this->registerHook('moduleRoutes')
            && $this->registerHook('displayAdminOrderSide')
            && $this->registerHook('displayCustomerAccount')
            && $this->registerHook('displayAdminCustomers')
            && $this->installDb()
            && $this->installTab();
    }

    /** Public so an upgrade can run it without reinstalling the module. */
    public function installDb(): bool
    {
        $sql1 = "CREATE TABLE IF NOT EXISTS `"._DB_PREFIX_."odys_loyalty` (
            `id_loyalty`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `id_customer` INT UNSIGNED NOT NULL,
            `points`      INT NOT NULL DEFAULT 0,
            `date_add`    DATETIME NOT NULL,
            PRIMARY KEY (`id_loyalty`),
            KEY `id_customer` (`id_customer`)
        ) ENGINE="._MYSQL_ENGINE_." DEFAULT CHARSET=utf8mb4;";

        $sql2 = "CREATE TABLE IF NOT EXISTS `"._DB_PREFIX_."odys_loyalty_history` (
            `id_history`  INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `id_customer` INT UNSIGNED NOT NULL,
            `id_order`    INT UNSIGNED NULL,
            `points`      INT NOT NULL,
            `label`       VARCHAR(255) NOT NULL,
            `date_add`    DATETIME NOT NULL,
            PRIMARY KEY (`id_history`),
            KEY `id_customer` (`id_customer`),
            -- one credit and one reversal per order, never more
            UNIQUE KEY `uniq_order_credit` (`id_customer`, `id_order`, `points`)
        ) ENGINE="._MYSQL_ENGINE_." DEFAULT CHARSET=utf8mb4;";

        $ok = Db::getInstance()->execute($sql1) && Db::getInstance()->execute($sql2);

        // CREATE TABLE IF NOT EXISTS skips a table that is already there, so a
        // shop upgrading from the first version would keep a history table
        // that lets the same order be credited twice. Add the key to it.
        $hasIndex = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM information_schema.statistics
             WHERE table_schema = DATABASE()
               AND table_name = "' . _DB_PREFIX_ . 'odys_loyalty_history"
               AND index_name = "uniq_order_credit"'
        );
        if (!$hasIndex) {
            // drop anything already duplicated, keeping the first credit
            Db::getInstance()->execute(
                'DELETE h FROM `' . _DB_PREFIX_ . 'odys_loyalty_history` h
                 JOIN `' . _DB_PREFIX_ . 'odys_loyalty_history` keep
                   ON keep.id_customer = h.id_customer AND keep.id_order = h.id_order
                  AND keep.points = h.points AND keep.id_history < h.id_history
                 WHERE h.id_order IS NOT NULL'
            );
            Db::getInstance()->execute(
                'ALTER TABLE `' . _DB_PREFIX_ . 'odys_loyalty_history`
                 ADD UNIQUE KEY `uniq_order_credit` (`id_customer`, `id_order`, `points`)'
            );
        }

        // rows written before null_values was passed carry id_order = 0, which
        // the unique key reads as a real order: normalise them or the next
        // order-less row for the same customer is refused
        Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . 'odys_loyalty_history`
             SET id_order = NULL WHERE id_order = 0'
        );

        // a redemption points at the voucher it created, so a reward can be
        // traced, and voided with the order it was used on
        $hasColumn = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM information_schema.columns
             WHERE table_schema = DATABASE()
               AND table_name = "' . _DB_PREFIX_ . 'odys_loyalty_history"
               AND column_name = "id_cart_rule"'
        );
        if (!$hasColumn) {
            Db::getInstance()->execute(
                'ALTER TABLE `' . _DB_PREFIX_ . 'odys_loyalty_history`
                 ADD COLUMN `id_cart_rule` INT UNSIGNED NULL AFTER `id_order`'
            );
        }

        return $ok;
    }

    /** The module's two Back Office screens. */
    const TABS = [
        ['AdminOdysLoyalty', 'Points ODYS', 'AdminParentCustomer', 'loyalty'],
        ['AdminOdysTheme', 'Thème ODYS', 'AdminParentThemes', 'palette'],
    ];

    /** Back Office → Clients → Points ODYS, and Apparence → Thème ODYS. */
    public function installTab(): bool
    {
        foreach (self::TABS as $spec) {
            list($class, $label, $parent, $icon) = $spec;
            if (Tab::getIdFromClassName($class)) {
                continue;
            }
            $tab = new Tab();
            $tab->class_name = $class;
            $tab->module = $this->name;
            $tab->id_parent = (int) Tab::getIdFromClassName($parent);
            $tab->icon = $icon;
            $tab->active = true;
            foreach (Language::getLanguages(false) as $lang) {
                $tab->name[(int) $lang['id_lang']] = $label;
            }
            $tab->add();
        }

        return true;
    }

    public function uninstall(): bool
    {
        foreach (self::TABS as $spec) {
            $idTab = (int) Tab::getIdFromClassName($spec[0]);
            if ($idTab) {
                (new Tab($idTab))->delete();
            }
        }

        return parent::uninstall();
    }

    /** Points per 100 MAD of eligible spend. */
    const RATE = 100;
    /** Credited with the first paid order, never at registration: a bonus
     *  handed out for filling a form is a bonus anyone can farm. */
    const WELCOME_POINTS = 2;
    const WELCOME_LABEL = 'Bonus inscription ODYS';

    /**
     * An order was created. Points wait for it to be paid — see
     * hookActionOrderStatusPostUpdate — so this only makes sure a legacy
     * flow that never changes state still settles.
     */
    public function hookActionValidateOrder(array $params): void
    {
        $order = $params['order'] ?? null;
        if (!Validate::isLoadedObject($order)) {
            return;
        }
        $state = new OrderState((int) $order->current_state);
        if (Validate::isLoadedObject($state) && $state->paid) {
            $this->settle($order, true);
        }
    }

    /**
     * The single place points move: paid adds them, cancelled / refunded /
     * payment error takes them back. Both are keyed on the order, so the
     * same transition twice changes nothing.
     */
    public function hookActionOrderStatusPostUpdate(array $params): void
    {
        $newStatus = $params['newOrderStatus'] ?? null;
        $idOrder = (int) ($params['id_order'] ?? 0);
        if (!$idOrder || !Validate::isLoadedObject($newStatus)) {
            return;
        }
        $order = new Order($idOrder);
        if (!Validate::isLoadedObject($order)) {
            return;
        }

        $lost = (bool) ($newStatus->paid ? false : ($newStatus->id == Configuration::get('PS_OS_CANCELED')
            || $newStatus->id == Configuration::get('PS_OS_REFUND')
            || $newStatus->id == Configuration::get('PS_OS_ERROR')));

        if ($newStatus->paid) {
            $this->settle($order, true);
        } elseif ($lost) {
            $this->settle($order, false);
        }
    }

    /**
     * Award (or take back) the points of one order, exactly once either way.
     */
    /** Same path the hooks take, for the test harness. */
    public function settleProbe($order, bool $earned = true): void
    {
        $this->settle($order, $earned);
    }

    private function settle($order, bool $earned): void
    {
        $idCustomer = (int) $order->id_customer;
        $idOrder = (int) $order->id;
        if (!$idCustomer || !$idOrder) {
            return;
        }

        $already = (int) Db::getInstance()->getValue(
            'SELECT COALESCE(SUM(points), 0) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             WHERE id_customer = ' . $idCustomer . ' AND id_order = ' . $idOrder
        );

        if ($earned) {
            if ($already > 0) {
                return;   // already credited: a retry is not a second order
            }
            $points = $this->orderPoints($order);
            if ($points <= 0) {
                return;
            }
            $this->addPoints($idCustomer, $points, 'Commande #' . $order->reference, $idOrder);
            $this->creditWelcome($idCustomer);

            return;
        }

        if ($already <= 0) {
            return;       // nothing to take back
        }
        $this->addPoints($idCustomer, -$already, 'Annulation #' . $order->reference, $idOrder);
    }

    /** The welcome bonus, once, and only for a customer who has paid. */
    private function creditWelcome(int $idCustomer): void
    {
        $given = (int) Db::getInstance()->getValue(
            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             WHERE id_customer = ' . (int) $idCustomer . '
               AND label = "' . pSQL(self::WELCOME_LABEL) . '"'
        );
        if (!$given) {
            $this->addPoints($idCustomer, self::WELCOME_POINTS, self::WELCOME_LABEL, null);
        }
    }

    /**
     * Eligible spend: perfume lines, less the order's discounts, and never
     * more than the customer actually paid — a free order earns nothing.
     */
    public function orderPoints($order): int
    {
        $excluded = array_filter([
            (int) Configuration::get('ODYS_CAT_OUD'),
            (int) Configuration::get('ODYS_CAT_BOUKHOUR'),
        ]);

        $eligible = 0.0;
        foreach ((array) $order->getProducts() as $line) {
            $reference = Tools::strtoupper((string) ($line['product_reference'] ?? ''));
            if (strpos($reference, 'OUD-') === 0 || strpos($reference, 'BK-') === 0) {
                continue;
            }
            $categories = array_map('intval', (array) Product::getProductCategories((int) $line['id_product']));
            if ($excluded && array_intersect($categories, $excluded)) {
                continue;
            }
            // a product sold by weight is never eligible, whatever it is called
            $product = new Product((int) $line['id_product']);
            if (Validate::isLoadedObject($product) && trim((string) $product->unity) !== '') {
                continue;
            }
            $eligible += (float) ($line['total_price_tax_incl'] ?? 0);
        }

        $eligible -= (float) $order->total_discounts_tax_incl;
        $paid = (float) $order->total_paid_tax_incl - (float) $order->total_shipping_tax_incl;
        $eligible = min(max($eligible, 0.0), max($paid, 0.0));

        return (int) floor($eligible / self::RATE);
    }
    /**
     * The ladder. Nothing is redeemable below REWARD_MIN, which is simply the
     * cheapest reward — the fidélité page says "à partir de 10 points" and
     * this is where that number comes from.
     *
     * pick: which category the customer chooses from, and how many.
     */
    const REWARD_MIN = 10;
    /** How long a balance survives without a purchase. */
    const VALIDITY_MONTHS = 12;
    /** How long the customer has to use the voucher once asked for. */
    const VOUCHER_MONTHS = 3;
    const REWARDS = [
        'parfum1' => ['cost' => 10, 'label' => 'Un parfum offert',      'pick' => 'parfums', 'count' => 1],
        'parfum2' => ['cost' => 15, 'label' => 'Deux parfums offerts',  'pick' => 'parfums', 'count' => 2],
        'oud'     => ['cost' => 15, 'label' => "5 g d'oud offerts",     'pick' => '',        'count' => 0],
        'coffret' => ['cost' => 20, 'label' => 'Un coffret offert',     'pick' => 'coffrets', 'count' => 1],
    ];

    /** What one reward costs, or 0 if there is no such reward. */
    public function rewardCost(string $key): int
    {
        return (int) (self::REWARDS[$key]['cost'] ?? 0);
    }

    /**
     * Turn points into a voucher.
     *
     * The balance is read FOR UPDATE inside the transaction that spends it,
     * so two clicks (or two tabs) cannot buy two rewards with one balance,
     * and the voucher is created inside that same transaction: built before
     * it, a failure afterwards left a live voucher nobody had paid for.
     *
     * @param int[] $picks the products chosen, when the reward needs any
     *
     * @return array{ok: bool, error?: string, code?: string, label?: string}
     */
    public function spend(int $idCustomer, string $key, array $picks = []): array
    {
        if (!isset(self::REWARDS[$key])) {
            return ['ok' => false, 'error' => 'Récompense inconnue.'];
        }
        $reward = self::REWARDS[$key];
        $cost = (int) $reward['cost'];

        $this->expire($idCustomer);   // points that lapsed cannot be spent
        if ($this->getPoints($idCustomer) < $cost) {
            return ['ok' => false, 'error' => 'Il vous faut ' . $cost . ' points pour cette récompense.'];
        }

        $label = $reward['label'];
        $db = Db::getInstance();
        $db->execute('START TRANSACTION');
        try {
            // getValue() appends its own LIMIT 1, which would land after FOR
            // UPDATE and make the statement a syntax error
            $locked = $db->executeS(
                'SELECT COALESCE(SUM(points), 0) AS balance FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
                 WHERE id_customer = ' . (int) $idCustomer . ' FOR UPDATE'
            );
            $balance = (int) ($locked[0]['balance'] ?? 0);
            if ($balance < $cost) {
                $db->execute('ROLLBACK');

                return ['ok' => false, 'error' => 'Solde insuffisant.'];
            }

            $rule = $this->buildVoucher($idCustomer, $key, $picks, $label);
            if (!$rule) {
                $db->execute('ROLLBACK');

                return ['ok' => false, 'error' => "Cette récompense n'est pas disponible pour le moment."];
            }

            $written = $db->insert('odys_loyalty_history', [
                'id_customer'  => (int) $idCustomer,
                'id_order'     => null,
                'id_cart_rule' => (int) $rule->id,
                'points'       => -$cost,
                'label'        => pSQL('Échange — ' . $label),
                'date_add'     => date('Y-m-d H:i:s'),
            ], true);
            if (!$written) {
                $db->execute('ROLLBACK');

                return ['ok' => false, 'error' => "L'échange n'a pas pu être enregistré."];
            }
            $db->execute('COMMIT');
        } catch (Throwable $e) {
            $db->execute('ROLLBACK');
            PrestaShopLogger::addLog('odys_loyalty: échange impossible — ' . $e->getMessage(), 3);

            return ['ok' => false, 'error' => "L'échange n'a pas pu être enregistré."];
        }

        return ['ok' => true, 'code' => $rule->code, 'label' => $label];
    }

    /**
     * The voucher: the customer's own, single use, not combinable with any
     * other rule — the page's "une seule récompense par commande".
     *
     * PrestaShop gives one gift product per rule, so "deux parfums offerts"
     * is the first as a gift and the second as its own price off. The
     * customer gets both for nothing either way.
     */
    private function buildVoucher(int $idCustomer, string $key, array $picks, string $label): ?CartRule
    {
        $reward = self::REWARDS[$key];
        $category = $reward['pick']
            ? (int) Configuration::get('ODYS_CAT_' . Tools::strtoupper($reward['pick']))
            : 0;

        $gift = 0;
        $amount = 0.0;
        if ($key === 'oud') {
            $amount = $this->oudRewardValue();
            if ($amount <= 0) {
                return null;
            }
        } else {
            $picks = array_values(array_unique(array_map('intval', $picks)));
            if (count($picks) < (int) $reward['count']) {
                return null;   // the form did not send enough choices
            }
            foreach ($picks as $idProduct) {
                if (!$this->isGiftable($idProduct, $category)) {
                    return null;
                }
            }
            $gift = (int) $picks[0];
            for ($i = 1; $i < (int) $reward['count']; ++$i) {
                $amount += $this->productPrice((int) $picks[$i]);
            }
        }

        $rule = new CartRule();
        $rule->id_customer = (int) $idCustomer;
        $rule->date_from = date('Y-m-d H:i:s');
        $rule->date_to = date('Y-m-d H:i:s', strtotime('+' . self::VOUCHER_MONTHS . ' months'));
        $rule->quantity = 1;
        $rule->quantity_per_user = 1;
        $rule->highlight = 1;
        $rule->partial_use = 0;
        $rule->cart_rule_restriction = 1;
        $rule->active = 1;
        $rule->code = 'ODYS' . Tools::strtoupper(Tools::passwdGen(8, 'ALPHANUMERIC'));
        if ($gift) {
            $rule->gift_product = $gift;
        }
        if ($amount > 0) {
            $rule->reduction_amount = $amount;
            $rule->reduction_tax = 1;
            $rule->reduction_currency = (int) $this->context->currency->id;
        }
        foreach (Language::getLanguages(false) as $lang) {
            $rule->name[(int) $lang['id_lang']] = 'Fidélité ODYS — ' . $label;
        }

        return $rule->add() ? $rule : null;
    }

    /** A product the customer may ask for: in the category, active, in stock. */
    public function isGiftable(int $idProduct, int $idCategory): bool
    {
        if (!$idProduct || !$idCategory) {
            return false;
        }

        return (bool) Db::getInstance()->getValue(
            'SELECT p.id_product FROM `' . _DB_PREFIX_ . 'product` p
             JOIN `' . _DB_PREFIX_ . 'category_product` cp ON cp.id_product = p.id_product
             JOIN `' . _DB_PREFIX_ . 'stock_available` sa ON sa.id_product = p.id_product
             WHERE p.id_product = ' . (int) $idProduct . ' AND p.active = 1
               AND cp.id_category = ' . (int) $idCategory . ' AND sa.quantity > 0'
        );
    }

    /** What the redemption form may offer, for one of the ODYS_CAT_* keys. */
    public function giftable(string $pick): array
    {
        $idCategory = (int) Configuration::get('ODYS_CAT_' . Tools::strtoupper($pick));
        if (!$idCategory) {
            return [];
        }

        return (array) Db::getInstance()->executeS(
            'SELECT p.id_product, pl.name FROM `' . _DB_PREFIX_ . 'product` p
             JOIN `' . _DB_PREFIX_ . 'product_lang` pl ON pl.id_product = p.id_product
              AND pl.id_lang = ' . (int) $this->context->language->id . '
             JOIN `' . _DB_PREFIX_ . 'category_product` cp ON cp.id_product = p.id_product
             JOIN `' . _DB_PREFIX_ . 'stock_available` sa ON sa.id_product = p.id_product
             WHERE p.active = 1 AND cp.id_category = ' . $idCategory . ' AND sa.quantity > 0
             ORDER BY pl.name'
        );
    }

    /**
     * One product's price, tax included, without a cart in the context —
     * Product::getPriceStatic() throws without a cart or an employee, which
     * makes it useless from the CLI and from a cron.
     */
    public function productPrice(int $idProduct): float
    {
        $product = new Product($idProduct);
        if (!Validate::isLoadedObject($product)) {
            return 0.0;
        }

        return round((float) $product->price * (1 + (float) Tax::getProductTaxRate($idProduct) / 100), 2);
    }

    /** "5 g d'oud offerts" in money: five grams of the least expensive oud. */
    public function oudRewardValue(): float
    {
        $idCat = (int) Configuration::get('ODYS_CAT_OUD');
        $idProduct = (int) Db::getInstance()->getValue(
            'SELECT p.id_product FROM `' . _DB_PREFIX_ . 'product` p
             JOIN `' . _DB_PREFIX_ . 'category_product` cp ON cp.id_product = p.id_product
             WHERE p.active = 1 AND cp.id_category = ' . $idCat . '
             ORDER BY p.price ASC'
        );

        return $idProduct ? round(5 * $this->productPrice($idProduct), 2) : 0.0;
    }

    /**
     * When the balance lapses: twelve months after the last purchase, because
     * the page says a purchase resets the clock for the whole balance.
     * Null when there is nothing to lose.
     */
    public function expiresOn(int $idCustomer): ?string
    {
        if ($this->getPoints($idCustomer) <= 0) {
            return null;
        }
        $last = Db::getInstance()->getValue(
            'SELECT MAX(date_add) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             WHERE id_customer = ' . (int) $idCustomer . ' AND points > 0'
        );

        return $last ? date('Y-m-d', strtotime($last . ' +' . self::VALIDITY_MONTHS . ' months')) : null;
    }

    /**
     * Write off every balance whose clock ran out. One row, so the customer
     * and the shop can both see what happened and when.
     *
     * @param int $idCustomer one customer, or 0 for all of them
     *
     * @return int balances expired
     */
    public function expire(int $idCustomer = 0): int
    {
        $rows = Db::getInstance()->executeS(
            'SELECT id_customer,
                    COALESCE(SUM(points), 0) AS balance,
                    MAX(CASE WHEN points > 0 THEN date_add END) AS last_earned
             FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             ' . ($idCustomer ? 'WHERE id_customer = ' . (int) $idCustomer : '') . '
             GROUP BY id_customer
             HAVING balance > 0'
        );

        $deadline = date('Y-m-d H:i:s', strtotime('-' . self::VALIDITY_MONTHS . ' months'));
        $expired = 0;
        foreach ((array) $rows as $row) {
            if (!$row['last_earned'] || $row['last_earned'] > $deadline) {
                continue;
            }
            $this->addPoints((int) $row['id_customer'], -(int) $row['balance'],
                'Expiration — ' . self::VALIDITY_MONTHS . ' mois sans achat', null);
            ++$expired;
        }

        return $expired;
    }

    /** The rows behind a balance, newest first. */
    public function ledger(int $idCustomer, int $limit = 50): array
    {
        return (array) Db::getInstance()->executeS(
            'SELECT * FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             WHERE id_customer = ' . (int) $idCustomer . '
             ORDER BY id_history DESC LIMIT ' . (int) $limit
        );
    }

    /** Front office: the tile in "Mon compte". */
    public function hookDisplayCustomerAccount(): string
    {
        if (!$this->context->customer->isLogged()) {
            return '';
        }
        $points = $this->getPoints((int) $this->context->customer->id);
        $this->context->smarty->assign([
            'odys_points' => $points,
            'odys_tier' => $this->getTier($points),
            'odys_rewards_url' => $this->context->link->getModuleLink($this->name, 'rewards'),
        ]);

        return $this->display(__FILE__, 'views/templates/hook/account_tile.tpl');
    }

    /** Back office: the balance on the customer's own sheet. */
    public function hookDisplayAdminCustomers(array $params): string
    {
        $idCustomer = (int) ($params['id_customer'] ?? 0);
        if (!$idCustomer) {
            return '';
        }
        $points = $this->getPoints($idCustomer);
        $rows = '';
        foreach ($this->ledger($idCustomer, 10) as $row) {
            $rows .= '<tr><td>' . htmlspecialchars($row['date_add'], ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td>' . htmlspecialchars($row['label'], ENT_QUOTES, 'UTF-8') . '</td>'
                . '<td class="text-right">' . (int) $row['points'] . '</td></tr>';
        }
        $expires = $this->expiresOn($idCustomer);

        return '<div class="panel"><div class="panel-heading">'
            . '<i class="icon-star"></i> Points ODYS — ' . (int) $points . ' pt'
            . ((int) $points === 1 ? '' : 's') . ' · ' . htmlspecialchars($this->getTier($points), ENT_QUOTES, 'UTF-8')
            . ($expires ? ' · expire le ' . htmlspecialchars($expires, ENT_QUOTES, 'UTF-8') : '')
            . '</div>'
            . ($rows ? '<table class="table"><thead><tr><th>Date</th><th>Motif</th>'
                . '<th class="text-right">Points</th></tr></thead><tbody>' . $rows . '</tbody></table>'
                : '<div class="panel-body">Aucun mouvement.</div>')
            . '</div>';
    }

    /** Hook: display loyalty bar on product page */
    public function hookDisplayProductAdditionalInfo(): string
    {
        // the card links to the programme's own page, wherever the import put it
        $idCms = (int) Configuration::get('ODYS_CMS_FIDELITE');
        $this->context->smarty->assign('loyalty_url', $idCms
            ? $this->context->link->getCMSLink($idCms)
            : $this->context->link->getPageLink('index') . 'fidelite');

        if (!$this->context->customer->isLogged()) {
            return $this->display(__FILE__, 'views/templates/hook/loyalty_bar_guest.tpl');
        }
        $pts = $this->getPoints((int)$this->context->customer->id);
        $this->context->smarty->assign([
            'loyalty_points' => $pts,
            'loyalty_tier'   => $this->getTier($pts),
            'next_reward'    => $this->getNextReward($pts),
        ]);
        return $this->display(__FILE__, 'views/templates/hook/loyalty_bar.tpl');
    }

    /** Hook: return points count string (used in my-account.tpl) */
    public function hookDisplayLoyaltyPoints(): string
    {
        if (!$this->context->customer->isLogged()) return '0';
        return (string)$this->getPoints((int)$this->context->customer->id);
    }

    public function getPoints(int $id_customer): int
    {
        $result = Db::getInstance()->getValue(
            'SELECT COALESCE(SUM(points), 0) FROM `'._DB_PREFIX_.'odys_loyalty_history`
             WHERE id_customer = '.(int)$id_customer
        );
        return max(0, (int)$result);
    }

    /**
     * Db::insert() quotes its values but does not escape them, so the label —
     * which carries an order reference, a reward name or an employee's typed
     * reason — is escaped here. Without it "5 g d'oud offerts" ends the
     * string early, and a crafted reason would end the statement.
     */
    public function addPoints(int $id_customer, int $points, string $label, ?int $id_order): bool
    {
        return (bool)Db::getInstance()->insert('odys_loyalty_history', [
            'id_customer' => $id_customer,
            'id_order'    => $id_order,
            'points'      => $points,
            'label'       => pSQL($label),
            'date_add'    => date('Y-m-d H:i:s'),
            // null_values: without it Db::insert writes 0 for a missing order,
            // and uniq_order_credit then rejects the second welcome bonus, the
            // second adjustment, the second redemption of the same size...
        ], true);
    }

    public function getTier(int $pts): string
    {
        if ($pts >= 20) return 'VIP';
        if ($pts >= 15) return 'Or';
        if ($pts >= 10) return 'Argent';
        return 'Bronze';
    }

    private function getNextReward(int $pts): array
    {
        foreach ([[10, 'un parfum offert'], [15, 'deux parfums ou 5 g d\'oud'], [20, 'un coffret offert']] as $step) {
            if ($pts < $step[0]) {
                return ['label' => $step[1], 'target' => $step[0], 'remaining' => $step[0] - $pts];
            }
        }

        return ['label' => 'toutes les récompenses sont accessibles', 'target' => 20, 'remaining' => 0];
    }


    /**
     * The home page's "Collection signature" band.
     *
     * The template keeps three house defaults so the page never renders
     * empty; whatever is assigned here wins. The slots hold product ids,
     * picked in this module's settings, so choosing which flacons appear
     * never means editing a template.
     */
    /**
     * The CSS for one product's ambiance, or '' when it has none.
     *
     * The slug comes from the product's own "Ambiance" feature, so an employee
     * changes a diffuser's mood in Catalogue -> Produits like any other
     * characteristic. The palette comes from the theme settings, and every
     * value is checked here because the result is written into a <style>.
     */
    /**
     * Le sol que la boutique peint derriere une ambiance.
     *
     * C'est --odys-cream de la feuille de style. La construction verifie que
     * les deux ne se separent pas : une valeur recopiee qui derive en
     * silence est exactement ce qui a rendu les prix illisibles.
     */
    const AMB_SOL = '#F4EFE5';

    /** Le contraste minimum d'un texte, WCAG 2.1 AA. */
    const AMB_CONTRASTE = 4.5;

    /** '#rrggbb' verifie, ou '' — rien d'autre n'entre dans une declaration. */
    private static function ambColour(string $raw): string
    {
        return preg_match('/^#[0-9A-Fa-f]{6}$/', $raw) ? Tools::strtoupper($raw) : '';
    }

    /** Les trois composantes de '#rrggbb'. */
    private static function ambRgb(string $hex): array
    {
        return [
            (int) hexdec(Tools::substr($hex, 1, 2)),
            (int) hexdec(Tools::substr($hex, 3, 2)),
            (int) hexdec(Tools::substr($hex, 5, 2)),
        ];
    }

    private static function ambHex(array $rgb): string
    {
        return sprintf('#%02X%02X%02X',
            max(0, min(255, (int) round($rgb[0]))),
            max(0, min(255, (int) round($rgb[1]))),
            max(0, min(255, (int) round($rgb[2]))));
    }

    /** La luminance relative, WCAG 2.1. */
    private static function ambLum(array $rgb): float
    {
        $c = [];
        foreach ($rgb as $v) {
            $v /= 255;
            $c[] = $v <= 0.03928 ? $v / 12.92 : pow(($v + 0.055) / 1.055, 2.4);
        }

        return 0.2126 * $c[0] + 0.7152 * $c[1] + 0.0722 * $c[2];
    }

    private static function ambRatio(array $a, array $b): float
    {
        $la = self::ambLum($a) + 0.05;
        $lb = self::ambLum($b) + 0.05;

        return $la > $lb ? $la / $lb : $lb / $la;
    }

    /**
     * La meme couleur, assombrie juste assez pour se lire sur le sol.
     *
     * On descend par pas de 2 % : la couleur garde sa teinte, elle perd de
     * la lumiere. Le noir donne 15:1 sur l'ivoire, donc la boucle aboutit
     * toujours ; une couleur deja lisible ressort telle quelle.
     */
    private static function ambLisible(string $hex): string
    {
        $sol = self::ambRgb(self::AMB_SOL);
        $rgb = self::ambRgb($hex);
        for ($k = 1.0; $k > 0; $k -= 0.02) {
            $essai = [$rgb[0] * $k, $rgb[1] * $k, $rgb[2] * $k];
            if (self::ambRatio($essai, $sol) >= self::AMB_CONTRASTE) {
                return self::ambHex($essai);
            }
        }

        return '#000000';
    }

    /**
     * La couleur posee sur le sol comme une haleine : le halo du haut de
     * page. 14 % suffisent a donner la teinte de la matiere sans jamais
     * assombrir ce qui s'ecrit par-dessus.
     */
    private static function ambTint(string $hex): string
    {
        $sol = self::ambRgb(self::AMB_SOL);
        $rgb = self::ambRgb($hex);
        $part = 0.14;

        return self::ambHex([
            $sol[0] * (1 - $part) + $rgb[0] * $part,
            $sol[1] * (1 - $part) + $rgb[1] * $part,
            $sol[2] * (1 - $part) + $rgb[2] * $part,
        ]);
    }

    private function ambianceCss(int $idProduct): string
    {
        if ($idProduct <= 0) {
            return '';
        }
        $idLang = (int) $this->context->language->id;
        $slug = (string) Db::getInstance()->getValue(
            'SELECT fvl.value
             FROM ' . _DB_PREFIX_ . 'feature_product fp
             JOIN ' . _DB_PREFIX_ . 'feature_value_lang fvl
               ON fvl.id_feature_value = fp.id_feature_value AND fvl.id_lang = ' . $idLang . '
             JOIN ' . _DB_PREFIX_ . 'feature_lang fl
               ON fl.id_feature = fp.id_feature AND fl.id_lang = ' . $idLang . '
             WHERE fp.id_product = ' . $idProduct . ' AND fl.name = "Ambiance"'
        );
        $slug = Tools::strtolower(trim($slug));
        if ($slug === '' || !preg_match('/^[a-z0-9-]+$/', $slug)) {
            return '';
        }

        for ($slot = 1; $slot <= 6; ++$slot) {
            $key = 'ODYS_AMB_' . $slot . '_';
            if ((string) Configuration::get($key . 'SLUG') !== $slug) {
                continue;
            }
            // Le sol de la page n'est plus celui de l'ambiance : il est
            // celui du site, le meme sur toutes les fiches. Les deux
            // couleurs qui s'ECRIVENT sont ramenees au contraste exige
            // avant d'etre posees, et le halo se deduit de la secondaire.
            // Sans cela une ambiance reglee du temps de la boutique noire
            // ecrit creme sur creme, et la feuille de style ne peut rien y
            // faire puisque ce <style>-ci est imprime apres elle.
            $accent = self::ambColour((string) Configuration::get($key . 'ACCENT'));
            $leaf = self::ambColour((string) Configuration::get($key . 'LEAF'));
            $vars = '';
            if ($leaf !== '') {
                $vars .= '--amb-wash:' . self::ambTint($leaf) . ';';
                $vars .= '--amb-leaf:' . self::ambLisible($leaf) . ';';
            }
            if ($accent !== '') {
                $vars .= '--amb-accent:' . self::ambLisible($accent) . ';';
            }
            $css = $vars !== '' ? 'body[data-ambiance="' . $slug . '"]{' . $vars . '}' : '';

            $image = (string) Configuration::get($key . 'IMG');
            if (preg_match('/^ambiance-[a-z0-9-]+\\.[a-z0-9]+$/', $image)
                && is_file(_PS_IMG_DIR_ . 'odys/' . $image)) {
                $css .= 'body[data-ambiance="' . $slug . '"] .amb-hero{background-image:url('
                    . _PS_IMG_ . 'odys/' . rawurlencode($image) . ')}';
            }

            return $css;
        }

        return '';
    }

    /**
     * /mes-envies rather than /module/odys_loyalty/envies.
     *
     * A saved list gets shown to a friend and typed back in later; it deserves
     * an address someone can read out loud.
     */
    /**
     * A Moroccan number in the form wa.me wants: 2126XXXXXXXX.
     *
     * Customers type their number every way there is — 06 12 34 56 78,
     * +212 6-12..., 00212612345678. Anything that cannot be read with
     * confidence returns empty rather than a guess, because a wrong number is
     * a message sent to a stranger.
     */
    public static function waNumber(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === '') {
            return '';
        }
        if (strpos($digits, '00212') === 0) {
            $digits = substr($digits, 2);
        }
        if (strpos($digits, '212') === 0) {
            $rest = substr($digits, 3);
            $rest = ltrim($rest, '0');

            return preg_match('/^[5-7]\d{8}$/', $rest) ? '212' . $rest : '';
        }
        if (strpos($digits, '0') === 0) {
            $rest = substr($digits, 1);

            return preg_match('/^[5-7]\d{8}$/', $rest) ? '212' . $rest : '';
        }

        return preg_match('/^[5-7]\d{8}$/', $digits) ? '212' . $digits : '';
    }

    /**
     * WhatsApp, on the order the employee already has open.
     *
     * Payment on delivery is refused on 15-30% of Moroccan orders, and the
     * single measure that moves that number is speaking to the customer before
     * the parcel leaves — and telling them when it does. There is no API here
     * and nothing to subscribe to: wa.me opens the conversation with the
     * message already written, on whichever device the employee is using.
     */
    public function hookDisplayAdminOrderSide(array $params)
    {
        $order = new Order((int) ($params['id_order'] ?? 0));
        if (!Validate::isLoadedObject($order)) {
            return '';
        }
        $address = new Address((int) $order->id_address_delivery);
        $customer = new Customer((int) $order->id_customer);
        $raw = trim((string) ($address->phone_mobile ?: $address->phone));
        $number = self::waNumber($raw);

        $currency = new Currency((int) $order->id_currency);
        // formatted here rather than through Tools::displayPrice(), which
        // reaches for the Symfony container and is not worth a dependency
        // for one line of a message
        $total = number_format((float) $order->total_paid, 2, ',', ' ')
            . ' ' . ($currency->symbol ?: $currency->iso_code);
        $carrier = new Carrier((int) $order->id_carrier, (int) $this->context->language->id);
        $shop = (string) Configuration::get('PS_SHOP_NAME');
        $first = trim((string) $customer->firstname);
        $tracking = $this->context->link->getPageLink('guest-tracking', true);

        $messages = [
            'confirm' => [
                'Confirmer la commande',
                sprintf(
                    "Bonjour %s, c'est %s. Nous confirmons votre commande %s : %s à régler à la livraison, à %s. Est-ce bien exact ?",
                    $first, $shop, $order->reference, $total, (string) $address->city
                ),
            ],
            'shipped' => [
                'Prévenir de l\'expédition',
                sprintf(
                    "Bonjour %s, votre commande %s part aujourd'hui avec %s. Prévoyez %s à la livraison. Vous pouvez la suivre ici : %s",
                    $first, $order->reference, $carrier->name ?: 'notre livreur', $total, $tracking
                ),
            ],
            'retry' => [
                'Reprogrammer la livraison',
                sprintf(
                    "Bonjour %s, nous n'avons pas pu vous livrer la commande %s. Quel jour vous conviendrait ?",
                    $first, $order->reference
                ),
            ],
        ];

        $links = [];
        foreach ($messages as $key => $message) {
            $links[$key] = [
                'label' => $message[0],
                'text' => $message[1],
                'href' => $number
                    ? 'https://wa.me/' . $number . '?text=' . rawurlencode($message[1])
                    : '',
            ];
        }

        $this->context->smarty->assign([
            'odysWaNumber' => $number,
            'odysWaRaw' => $raw,
            'odysWaLinks' => $links,
            'odysWaState' => (int) $order->current_state,
            'odysWaShipped' => (int) Configuration::get('PS_OS_SHIPPING'),
        ]);

        return $this->display(__FILE__, 'views/templates/hook/admin_order_whatsapp.tpl');
    }

    public function hookModuleRoutes()
    {
        return [
            'module-odys_loyalty-envies' => [
                'controller' => 'envies',
                'rule' => 'mes-envies',
                'keywords' => [],
                'params' => ['fc' => 'module', 'module' => 'odys_loyalty'],
            ],
        ];
    }

    public function hookActionFrontControllerSetMedia()
    {
        // PrestaShop has no scheduler, and a programme whose expiry only runs
        // when an employee remembers is a programme with no expiry. Cheap
        // enough at one page in two hundred; the Back Office has a button for
        // the impatient.
        if (mt_rand(1, 200) === 1) {
            $this->expire();
        }

        $controller = $this->context->controller;
        $self = isset($controller->php_self) ? $controller->php_self : '';

        // The tracking timeline needs to know which step an order state belongs
        // to. Those states are configurable, so the ids come from Configuration
        // rather than being written into a template: a shop that renames or
        // re-creates a state keeps a truthful timeline.
        if (in_array($self, ['order-detail', 'history', 'guest-tracking', 'order-confirmation'], true)) {
            $steps = [];
            $groups = [
                1 => ['PS_OS_CHEQUE', 'PS_OS_BANKWIRE', 'PS_OS_COD_VALIDATION',
                      'PS_OS_PAYMENT', 'PS_OS_WS_PAYMENT', 'PS_OS_OUTOFSTOCK_UNPAID'],
                2 => ['PS_OS_PREPARATION', 'PS_OS_OUTOFSTOCK_PAID'],
                3 => ['PS_OS_SHIPPING'],
                4 => ['PS_OS_DELIVERED'],
            ];
            foreach ($groups as $step => $keys) {
                foreach ($keys as $key) {
                    if ($id = (int) Configuration::get($key)) {
                        $steps[$id] = $step;
                    }
                }
            }
            // a map rather than a list: the template tests it with isset(),
            // which needs no PHP function call inside Smarty
            $failed = [];
            foreach (['PS_OS_CANCELED', 'PS_OS_REFUND', 'PS_OS_ERROR', 'PS_OS_PAYMENT_ERROR'] as $key) {
                if ($id = (int) Configuration::get($key)) {
                    $failed[$id] = true;
                }
            }
            $this->context->smarty->assign([
                'odysOrderSteps' => $steps,
                'odysOrderFailed' => $failed,
            ]);
        }

        // "Plus que X DH pour la livraison gratuite" read $cart.free_shipping_remaining,
        // which the cart presenter does not have - so the nudge never appeared.
        // The threshold lives in Configuration and the subtotal in the cart.
        if (in_array($self, ['cart', 'order'], true)) {
            $from = (float) Configuration::get('PS_SHIPPING_FREE_PRICE');
            $remaining = 0.0;
            if ($from > 0 && Validate::isLoadedObject($this->context->cart)) {
                $remaining = $from - (float) $this->context->cart->getOrderTotal(true, Cart::ONLY_PRODUCTS);
            }
            $this->context->smarty->assign([
                'odysFreeShipFrom' => $from,
                'odysFreeShipLeft' => $remaining > 0 ? $remaining : 0,
            ]);
        }

        // The ambiance this product is meant to feel like, turned into the
        // handful of CSS custom properties the theme reads. The Back Office
        // holds the palette (Apparence -> Theme ODYS); the theme ships two of
        // its own and this wins over them. Built here rather than in the
        // template: a stylesheet is mostly braces, and so is Smarty.
        if ($self === 'product') {
            $this->context->smarty->assign('odysAmbianceCss',
                $this->ambianceCss((int) Tools::getValue('id_product')));
        }

        // What delivery will actually cost, on the page where the customer
        // decides. Two thirds of shops leave this to the checkout, and with
        // cash on delivery an unexpected fee at the door is a parcel refused
        // and paid for twice. The figures are the carriers' own.
        if ($self === 'product') {
            $prices = array_map('floatval', array_column((array) Db::getInstance()->executeS(
                'SELECT MIN(d.price) AS price
                 FROM ' . _DB_PREFIX_ . 'delivery d
                 JOIN ' . _DB_PREFIX_ . 'carrier c ON c.id_carrier = d.id_carrier
                 WHERE c.active = 1 AND c.deleted = 0
                 GROUP BY d.id_carrier
                 ORDER BY price'
            ), 'price'));
            $this->context->smarty->assign([
                'odysShipMin' => $prices ? min($prices) : 0,
                'odysShipMax' => $prices ? max($prices) : 0,
                'odysShipFrom' => (float) Configuration::get('PS_SHIPPING_FREE_PRICE'),
                // Une phrase par langue depuis que l'ecran du theme en propose
                // une par langue ; tant qu'aucune n'est saisie, PrestaShop rend
                // encore la valeur unique d'avant, donc rien ne disparait.
                'odysCodNote' => (string) Configuration::get('ODYS_COD_NOTE',
                    (int) $this->context->language->id),
            ]);
        }

        if ($self !== 'index') {
            return;
        }

        // position decides the glow, so the trio keeps its noir / marine /
        // crème rhythm whichever products are chosen
        $tones = ['noir', 'marine', 'creme'];
        $eyebrows = ['Noir & Or', 'Marine & Or', 'Crème & Or'];
        $tiers = ['Prestige', 'Élégant', 'Classique'];

        $idLang = (int) $this->context->language->id;
        $signatures = [];
        foreach ([1, 2, 3] as $slot) {
            $idProduct = (int) Configuration::get('ODYS_SIG_' . $slot);
            if (!$idProduct) {
                continue;
            }
            $product = new Product($idProduct, false, $idLang);
            if (!Validate::isLoadedObject($product) || !$product->active) {
                continue;
            }
            $slotIndex = count($signatures);
            $reference = trim((string) $product->reference);
            // La vraie photo du flacon. Sans image au catalogue, la cle reste
            // vide et le gabarit redessine son flacon : une bande trouee
            // serait pire qu'un dessin.
            $image = '';
            $cover = Product::getCover((int) $product->id);
            if ($cover && !empty($cover['id_image'])) {
                $image = $this->context->link->getImageLink(
                    $product->link_rewrite, (int) $cover['id_image'], 'large_default');
            }
            $signatures[] = [
                'image' => $image,
                'num' => $reference !== '' ? $reference : (string) $product->id,
                'code' => $reference !== '' ? 'ODYS ' . $reference : (string) $product->name,
                'tone' => $tones[$slotIndex % 3],
                'eyebrow' => $eyebrows[$slotIndex % 3],
                'tier' => $tiers[$slotIndex % 3],
                'name' => (string) $product->name,
                'volume' => 'Extrait de Parfum · 50 ml',
                'mood' => $this->signatureMood($product, $idLang),
                'desc' => trim(strip_tags((string) $product->description_short)),
                'url' => $this->context->link->getProductLink($product),
            ];
        }

        if ($signatures) {
            $this->context->smarty->assign('signatures', $signatures);
        }
    }

    /** One line under the flacon: the family said as the band says it. */
    const MOODS = [
        'fresh' => 'Frais & lumineux',
        'oriental' => 'Chaud & épicé',
        'sweet' => 'Gourmand & enveloppant',
        'oud' => 'Boisé & profond',
        'oud oriental' => 'Intense & sophistiqué',
        'sweet oriental' => 'Sucré & ambré',
        'gourmand' => 'Gourmand & enveloppant',
    ];

    private function signatureMood(Product $product, int $idLang): string
    {
        foreach ((array) $product->getFrontFeatures($idLang) as $feature) {
            if (isset($feature['name']) && $feature['name'] === 'Famille olfactive') {
                $family = Tools::strtolower(trim((string) $feature['value']));

                return self::MOODS[$family] ?? Tools::ucfirst($family);
            }
        }

        return Tools::substr(trim(strip_tags((string) $product->description_short)), 0, 48);
    }
    /**
     * Settings are typed by an employee, which makes them input like any
     * other: ids are ids, the number is digits, and a link that ends up in
     * an href must be an absolute http(s) URL — not 'javascript:'.
     */
    private function cleanSetting(string $key, string $raw): string
    {
        $raw = trim($raw);
        if (strpos($key, 'ODYS_CAT_') === 0 || strpos($key, 'ODYS_SIG_') === 0) {
            return (string) (int) $raw;
        }
        if ($key === 'ODYS_WA_NUMBER') {
            return preg_replace('/[^0-9]/', '', $raw);
        }
        if ($key === 'ODYS_PHONE') {
            return trim(preg_replace('/[^0-9 +]/', '', $raw));
        }
        if ($key === 'ODYS_EMAIL') {
            return Validate::isEmail($raw) ? $raw : '';
        }

        return ($raw === '' || Validate::isAbsoluteUrl($raw)) ? $raw : '';
    }

    public function getContent(): string
    {
        $output = '';
        if (Tools::isSubmit('submit_odys_loyalty')) {
            foreach (['ODYS_SIG_1','ODYS_SIG_2','ODYS_SIG_3','ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_WA_NUMBER','ODYS_PHONE','ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_FACEBOOK','ODYS_TIKTOK'] as $key) {
                // a key the request did not carry is a key nobody edited:
                // writing it anyway blanked settings on any partial post
                if (!Tools::getIsset($key)) {
                    continue;
                }
                Configuration::updateValue($key, $this->cleanSetting($key, (string) Tools::getValue($key)));
            }
            $output .= $this->displayConfirmation($this->l('Paramètres enregistrés.'));
        }
        return $output.$this->renderForm();
    }

    private function renderForm(): string
    {
        $helper = new HelperForm();
        // Without this the button is HelperForm's default submitAddconfiguration,
        // getContent() waits for submit_odys_loyalty, and pressing Enregistrer
        // silently changed nothing.
        $helper->module = $this;
        $helper->name_controller = $this->name;
        $helper->identifier = $this->identifier;
        $helper->token = Tools::getAdminTokenLite('AdminModules');
        $helper->currentIndex = AdminController::$currentIndex . '&configure=' . $this->name;
        $helper->submit_action = 'submit_odys_loyalty';
        $helper->fields_value = [];
        foreach (['ODYS_SIG_1','ODYS_SIG_2','ODYS_SIG_3','ODYS_CAT_OUD','ODYS_CAT_BOUKHOUR','ODYS_WA_NUMBER','ODYS_PHONE','ODYS_EMAIL','ODYS_INSTAGRAM','ODYS_FACEBOOK','ODYS_TIKTOK'] as $k) {
            $helper->fields_value[$k] = Configuration::get($k);
        }
        // the products to choose from, plus an empty slot
        $choices = array_merge(
            [['id_product' => 0, 'name' => '— aucun —']],
            (array) Product::getSimpleProducts((int) $this->context->language->id)
        );
        $signatureField = function ($slot) use ($choices) {
            return [
                'type' => 'select',
                'label' => 'Signature ' . $slot . ' (accueil)',
                'name' => 'ODYS_SIG_' . $slot,
                'desc' => $slot === 1
                    ? 'Les trois flacons de la bande « Collection signature ». Vide : les trois par défaut.'
                    : '',
                'options' => ['query' => $choices, 'id' => 'id_product', 'name' => 'name'],
            ];
        };

        return $helper->generateForm([[
            'form' => [
                'legend' => ['title' => 'Configuration ODYS Loyalty'],
                'input'  => [
                    $signatureField(1),
                    $signatureField(2),
                    $signatureField(3),
                    ['type'=>'text','label'=>'ID Catégorie Oud',       'name'=>'ODYS_CAT_OUD'],
                    ['type'=>'text','label'=>'ID Catégorie Boukhour',   'name'=>'ODYS_CAT_BOUKHOUR'],
                    ['type'=>'text','label'=>'Numéro WhatsApp',         'name'=>'ODYS_WA_NUMBER','desc'=>'Ex: 212600000000'],
                    ['type'=>'text','label'=>'Téléphone (affiché)',   'name'=>'ODYS_PHONE','desc'=>'Ex: 0612345678'],
                    ['type'=>'text','label'=>'Email contact',           'name'=>'ODYS_EMAIL'],
                    ['type'=>'text','label'=>'URL Instagram',           'name'=>'ODYS_INSTAGRAM'],
                    ['type'=>'text','label'=>'URL Facebook',            'name'=>'ODYS_FACEBOOK'],
                    ['type'=>'text','label'=>'URL TikTok',              'name'=>'ODYS_TIKTOK'],
                ],
                'submit' => ['title' => $this->l('Enregistrer')],
            ],
        ]]);
    }
}
