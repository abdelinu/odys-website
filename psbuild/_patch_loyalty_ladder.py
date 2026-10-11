"""The reward ladder the shop actually wants.

    100 DH            = 1 point
    nothing redeemable below 10 points
    10 points         = one perfume, free
    15 points         = two perfumes, free — or 5 g of oud
    20 points         = a coffret, free

One flat price (15) became four rewards with three prices, so the cost moves
out of a constant and into the catalogue, and the tiers stop contradicting it:
Argent at 10 is "you can redeem something", Or at 15, VIP at 20.

Idempotent.
"""
import pathlib
import re
import sys

HERE = pathlib.Path(__file__).resolve().parent
MOD = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "modules" / "odys_loyalty" / "odys_loyalty.php"

s = MOD.read_text(encoding="utf-8")
if "REWARD_MIN" in s:
    print("  OK   odys_loyalty (ladder already applied)")
    sys.exit(0)

start = s.index("    /** What a reward costs")
end = s.index("    /**\n     * When the balance lapses")

NEW = '''    /**
     * The ladder. Nothing is redeemable below REWARD_MIN, which is simply the
     * cheapest reward — the fidélité page says "à partir de 10 points" and
     * this is where that number comes from.
     *
     * pick: which category the customer chooses from, and how many.
     */
    const REWARD_MIN = 10;
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

'''
s = s[:start] + NEW + s[end:]

# ── tiers and the "next reward" line follow the same ladder ──────────────
old_tier = """        if ($pts >= 30) return 'VIP';
        if ($pts >= 15) return 'Or';
        if ($pts >= 5)  return 'Argent';
        return 'Bronze';"""
new_tier = """        if ($pts >= 20) return 'VIP';
        if ($pts >= 15) return 'Or';
        if ($pts >= 10) return 'Argent';
        return 'Bronze';"""
if old_tier not in s:
    raise SystemExit("getTier() not found")
s = s.replace(old_tier, new_tier, 1)

old_next = re.search(r"    private function getNextReward\(int \$pts\): array\n    \{.*?\n    \}\n", s, re.S)
if not old_next:
    raise SystemExit("getNextReward() not found")
new_next = """    private function getNextReward(int $pts): array
    {
        foreach ([[10, 'un parfum offert'], [15, 'deux parfums ou 5 g d\\'oud'], [20, 'un coffret offert']] as $step) {
            if ($pts < $step[0]) {
                return ['label' => $step[1], 'target' => $step[0], 'remaining' => $step[0] - $pts];
            }
        }

        return ['label' => 'toutes les récompenses sont accessibles', 'target' => 20, 'remaining' => 0];
    }
"""
s = s[:old_next.start()] + new_next + s[old_next.end():]

# ── the docblock states the rules; it has to state these ─────────────────
s = s.replace(" *   15 pts buy one reward: 5 g d'oud, or a coffret in stock",
              " *   10 pts a perfume, 15 pts two perfumes or 5 g d'oud,\n"
              " *      20 pts a coffret — nothing redeemable below 10", 1)

MOD.write_text(s, encoding="utf-8")
print("  OK   odys_loyalty: 10 / 15 / 20 ladder, four rewards")
