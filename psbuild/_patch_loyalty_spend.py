"""Give the points somewhere to go.

Until now the ledger only grew: points were earned, reversed on a cancelled
order, and that was the whole story. The fidélité page has always promised
more than the code did —

    "15 points : 5 g d'oud offerts, ou un coffret au choix parmi ceux en
     stock. La récompense se demande depuis votre compte, avant de passer
     commande. Une seule récompense par commande."
    "Les points sont valables 12 mois à compter de leur attribution. Un achat
     remet le compteur à zéro pour l'ensemble de votre solde."

so this implements exactly that, and nothing it does not say:

  * spend(): 15 points become a real PrestaShop voucher tied to that customer
    — a gift coffret, or the price of 5 g of oud — deducted inside a
    transaction that reads the balance FOR UPDATE, so two clicks cannot spend
    the same points twice;
  * expire(): a balance whose owner has not bought anything for twelve months
    is written off in one row, which is what "un achat remet le compteur à
    zéro" means;
  * the voucher is not combinable with any other rule, which is the page's
    "une seule récompense par commande";
  * an employee can finally see and correct all of it (AdminOdysLoyalty).

Idempotent: re-running after a rebuild is a no-op.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
MOD = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "modules" / "odys_loyalty" / "odys_loyalty.php"

s = MOD.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in s else "\n"
if "REWARD_COST" in s:
    print("  OK   odys_loyalty (spending already implemented)")
    sys.exit(0)

# ── 1. the docblock still described the first draft ──────────────────────
OLD_HEAD = """/**
 * ODYS Loyalty Points Module for PrestaShop 8
 *
 * Business rules:
 *   +2 pts on registration
 *   +1 pt per 100 MAD (parfums only — Oud/Boukhour/Flacons excluded)
 *   5  pts → Argent tier → 10% discount voucher
 *   15 pts → Or tier    → 5g Oud OR free gift box
 *   30 pts → VIP tier   → Priority access + free shipping
 */"""
NEW_HEAD = """/**
 * ODYS Loyalty Points Module for PrestaShop 8
 *
 * The rules are the ones published on the fidélité page, and nothing else:
 *   +1 pt per 100 MAD of perfume actually paid for (oud, boukhour and
 *      shipping earn nothing), credited when the order is paid
 *   +2 pts welcome, with the first paid order — never at registration,
 *      which anyone could farm with a disposable address
 *   -N  when that order is cancelled, refunded or fails
 *   15 pts buy one reward: 5 g d'oud, or a coffret in stock
 *   a balance lapses twelve months after the last purchase
 * Tiers (Bronze / Argent / Or / VIP) are a name for the balance, not a
 * second currency.
 */"""
# one line of the original docblock carries a trailing space, which no editor
# keeps; match the block rather than its whitespace
import re
head_re = re.compile(r"/\*\*(?:\r?\n \*[^\r\n]*)+\r?\n \*/")
if not head_re.match(s, s.index("/**")):
    raise SystemExit("module docblock not found")
s = head_re.sub(lambda m: NEW_HEAD.replace("\n", nl), s, count=1)

# ── 2. hooks: the account link, the customer sheet, and the admin tab ────
OLD_INSTALL = """            && $this->registerHook('actionFrontControllerSetMedia')
            && $this->installDb();"""
NEW_INSTALL = """            && $this->registerHook('actionFrontControllerSetMedia')
            && $this->registerHook('displayCustomerAccount')
            && $this->registerHook('displayAdminCustomers')
            && $this->installDb()
            && $this->installTab();"""
if OLD_INSTALL.replace("\n", nl) not in s:
    raise SystemExit("install() not found")
s = s.replace(OLD_INSTALL.replace("\n", nl), NEW_INSTALL.replace("\n", nl), 1)

s = s.replace("""    public function uninstall(): bool
    {
        return parent::uninstall();
    }""".replace("\n", nl),
"""    /** Back Office → Clients → Points ODYS. */
    public function installTab(): bool
    {
        if (Tab::getIdFromClassName('AdminOdysLoyalty')) {
            return true;
        }
        $tab = new Tab();
        $tab->class_name = 'AdminOdysLoyalty';
        $tab->module = $this->name;
        $tab->id_parent = (int) Tab::getIdFromClassName('AdminParentCustomer');
        $tab->icon = 'loyalty';
        $tab->active = true;
        foreach (Language::getLanguages(false) as $lang) {
            $tab->name[(int) $lang['id_lang']] = 'Points ODYS';
        }

        return (bool) $tab->add();
    }

    public function uninstall(): bool
    {
        $idTab = (int) Tab::getIdFromClassName('AdminOdysLoyalty');
        if ($idTab) {
            (new Tab($idTab))->delete();
        }

        return parent::uninstall();
    }""".replace("\n", nl), 1)

# ── 3. the ledger gains the voucher it paid for ──────────────────────────
OLD_RETURN = """        return $ok;
    }"""
NEW_RETURN = """        // a redemption points at the voucher it created, so a reward can be
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
    }"""
if OLD_RETURN.replace("\n", nl) not in s:
    raise SystemExit("installDb() tail not found")
s = s.replace(OLD_RETURN.replace("\n", nl), NEW_RETURN.replace("\n", nl), 1)

# ── 4. spending, expiry and the screens that show them ───────────────────
BLOCK = '''    /** What a reward costs, and the two the fidélité page names. */
    const REWARD_COST = 15;
    const REWARDS = [
        'oud'     => "5 g d'oud offerts",
        'coffret' => 'Un coffret au choix',
    ];
    /** How long a balance survives without a purchase. */
    const VALIDITY_MONTHS = 12;
    /** How long the customer has to use the voucher once asked for. */
    const VOUCHER_MONTHS = 3;

    /**
     * Turn REWARD_COST points into a voucher.
     *
     * The balance is read FOR UPDATE inside the transaction that spends it,
     * so two clicks (or two tabs) cannot buy two rewards with one balance.
     * The voucher is made first: if the deduction loses the race, it is
     * deleted again, which is cheaper than owing the customer points.
     *
     * @return array{ok: bool, error?: string, code?: string, label?: string}
     */
    public function spend(int $idCustomer, string $key, int $idProduct = 0): array
    {
        if (!isset(self::REWARDS[$key])) {
            return ['ok' => false, 'error' => 'Récompense inconnue.'];
        }
        $this->expire($idCustomer);   // points that lapsed cannot be spent
        if ($this->getPoints($idCustomer) < self::REWARD_COST) {
            return ['ok' => false, 'error' => 'Il vous faut ' . self::REWARD_COST . ' points.'];
        }

        $label = self::REWARDS[$key];
        $rule = $this->buildVoucher($idCustomer, $key, $idProduct, $label);
        if (!$rule) {
            return ['ok' => false, 'error' => "Cette récompense n'est pas disponible pour le moment."];
        }

        $db = Db::getInstance();
        $db->execute('START TRANSACTION');
        $balance = (int) $db->getValue(
            'SELECT COALESCE(SUM(points), 0) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`
             WHERE id_customer = ' . (int) $idCustomer . ' FOR UPDATE'
        );
        if ($balance < self::REWARD_COST) {
            $db->execute('ROLLBACK');
            $rule->delete();

            return ['ok' => false, 'error' => 'Solde insuffisant.'];
        }
        $written = $db->insert('odys_loyalty_history', [
            'id_customer'  => (int) $idCustomer,
            'id_order'     => null,
            'id_cart_rule' => (int) $rule->id,
            'points'       => -self::REWARD_COST,
            'label'        => 'Échange — ' . $label,
            'date_add'     => date('Y-m-d H:i:s'),
        ]);
        if (!$written) {
            $db->execute('ROLLBACK');
            $rule->delete();

            return ['ok' => false, 'error' => "L'échange n'a pas pu être enregistré."];
        }
        $db->execute('COMMIT');

        return ['ok' => true, 'code' => $rule->code, 'label' => $label];
    }

    /**
     * The voucher itself: the customer's own, single use, not combinable
     * with any other rule — the page's "une seule récompense par commande".
     */
    private function buildVoucher(int $idCustomer, string $key, int $idProduct, string $label): ?CartRule
    {
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

        if ($key === 'coffret') {
            if (!$this->isGiftable($idProduct)) {
                return null;
            }
            $rule->gift_product = (int) $idProduct;
        } else {
            $amount = $this->oudRewardValue();
            if ($amount <= 0) {
                return null;
            }
            $rule->reduction_amount = $amount;
            $rule->reduction_tax = 1;
            $rule->reduction_currency = (int) $this->context->currency->id;
        }

        foreach (Language::getLanguages(false) as $lang) {
            $rule->name[(int) $lang['id_lang']] = 'Fidélité ODYS — ' . $label;
        }

        return $rule->add() ? $rule : null;
    }

    /** A coffret the customer may ask for: in the category, active, in stock. */
    public function isGiftable(int $idProduct): bool
    {
        if (!$idProduct) {
            return false;
        }
        $idCat = (int) Configuration::get('ODYS_CAT_COFFRETS');

        return (bool) Db::getInstance()->getValue(
            'SELECT p.id_product FROM `' . _DB_PREFIX_ . 'product` p
             JOIN `' . _DB_PREFIX_ . 'category_product` cp ON cp.id_product = p.id_product
             JOIN `' . _DB_PREFIX_ . 'stock_available` sa ON sa.id_product = p.id_product
             WHERE p.id_product = ' . (int) $idProduct . ' AND p.active = 1
               AND cp.id_category = ' . $idCat . ' AND sa.quantity > 0'
        );
    }

    /** The coffrets the redemption form may offer. */
    public function giftableCoffrets(): array
    {
        $idCat = (int) Configuration::get('ODYS_CAT_COFFRETS');
        $rows = Db::getInstance()->executeS(
            'SELECT p.id_product, pl.name FROM `' . _DB_PREFIX_ . 'product` p
             JOIN `' . _DB_PREFIX_ . 'product_lang` pl ON pl.id_product = p.id_product
              AND pl.id_lang = ' . (int) $this->context->language->id . '
             JOIN `' . _DB_PREFIX_ . 'category_product` cp ON cp.id_product = p.id_product
             JOIN `' . _DB_PREFIX_ . 'stock_available` sa ON sa.id_product = p.id_product
             WHERE p.active = 1 AND cp.id_category = ' . $idCat . ' AND sa.quantity > 0
             ORDER BY pl.name'
        );

        return (array) $rows;
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
        if (!$idProduct) {
            return 0.0;
        }

        return round(5 * (float) Product::getPriceStatic($idProduct, true), 2);
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

'''
anchor = "    /** Hook: display loyalty bar on product page */"
if anchor not in s:
    anchor = "    public function hookDisplayProductAdditionalInfo(): string"
i = s.index(anchor)
s = s[:i] + BLOCK.replace("\n", nl) + s[i:]

MOD.write_text(s, encoding="utf-8", newline="")
print("  OK   odys_loyalty: spend(), expire(), ledger, account tile, customer sheet")
