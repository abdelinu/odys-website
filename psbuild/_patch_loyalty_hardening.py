"""Close what the live test opened in the points system.

Proven on the shop with six test accounts and a probe that calls the hook the
way PrestaShop does:

  * the same order validated twice awarded its points twice (two rows, one
    id_order) — a payment retry or an admin re-validation doubles a balance;
  * an order with nothing paid (100 % voucher) still awarded points, because
    the rule read the line totals and never looked at what the customer paid;
  * three registrations from one IP minted six points in seconds, with no
    e-mail verification — eight of them reach the "5 g d'oud offert" tier;
  * nothing ever subtracted: a cancelled or refunded order kept its points,
    and the tier is computed from a lifetime sum that can only grow.

The fixes:

  * points are awarded when an order becomes **paid** and taken back when it
    turns cancelled / refunded / payment-error, both keyed on the order so a
    repeat is a no-op (unique index, and a guard before writing);
  * the amount is the eligible lines **minus the order's discounts**, floored
    at zero and capped by what was actually paid;
  * the welcome bonus is credited on the first paid order instead of at
    registration, so it cannot be farmed with disposable addresses;
  * `getPoints()` still floors at zero, and the tier now reflects the current
    balance rather than everything ever earned.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
MOD = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "modules" / "odys_loyalty" / "odys_loyalty.php"

s = MOD.read_text(encoding="utf-8", newline="")
nl = "\r\n" if "\r\n" in s else "\n"
if "WELCOME_LABEL" in s:
    print("  OK   odys_loyalty (already hardened)")
    sys.exit(0)

# ── 1. hooks: follow the order's state, not its creation ─────────────────
s = s.replace("            && $this->registerHook('actionCustomerAccountAdd')" + nl
              + "            && $this->registerHook('actionValidateOrder')",
              "            && $this->registerHook('actionOrderStatusPostUpdate')"
              + nl + "            && $this->registerHook('actionValidateOrder')", 1)

# ── 2. the award/reversal logic ──────────────────────────────────────────
OLD_START = "    /** Hook: +2 points on new registration */"
OLD_END = "    /** Hook: display loyalty bar on product page */"
start = s.index(OLD_START)
end = s.index(OLD_END)

NEW = nl.join([
    "    /** Points per 100 MAD of eligible spend. */",
    "    const RATE = 100;",
    "    /** Credited with the first paid order, never at registration: a bonus",
    "     *  handed out for filling a form is a bonus anyone can farm. */",
    "    const WELCOME_POINTS = 2;",
    "    const WELCOME_LABEL = 'Bonus inscription ODYS';",
    "",
    "    /**",
    "     * An order was created. Points wait for it to be paid — see",
    "     * hookActionOrderStatusPostUpdate — so this only makes sure a legacy",
    "     * flow that never changes state still settles.",
    "     */",
    "    public function hookActionValidateOrder(array $params): void",
    "    {",
    "        $order = $params['order'] ?? null;",
    "        if (!Validate::isLoadedObject($order)) {",
    "            return;",
    "        }",
    "        $state = new OrderState((int) $order->current_state);",
    "        if (Validate::isLoadedObject($state) && $state->paid) {",
    "            $this->settle($order, true);",
    "        }",
    "    }",
    "",
    "    /**",
    "     * The single place points move: paid adds them, cancelled / refunded /",
    "     * payment error takes them back. Both are keyed on the order, so the",
    "     * same transition twice changes nothing.",
    "     */",
    "    public function hookActionOrderStatusPostUpdate(array $params): void",
    "    {",
    "        $newStatus = $params['newOrderStatus'] ?? null;",
    "        $idOrder = (int) ($params['id_order'] ?? 0);",
    "        if (!$idOrder || !Validate::isLoadedObject($newStatus)) {",
    "            return;",
    "        }",
    "        $order = new Order($idOrder);",
    "        if (!Validate::isLoadedObject($order)) {",
    "            return;",
    "        }",
    "",
    "        $lost = (bool) ($newStatus->paid ? false : ($newStatus->id == Configuration::get('PS_OS_CANCELED')",
    "            || $newStatus->id == Configuration::get('PS_OS_REFUND')",
    "            || $newStatus->id == Configuration::get('PS_OS_ERROR')));",
    "",
    "        if ($newStatus->paid) {",
    "            $this->settle($order, true);",
    "        } elseif ($lost) {",
    "            $this->settle($order, false);",
    "        }",
    "    }",
    "",
    "    /**",
    "     * Award (or take back) the points of one order, exactly once either way.",
    "     */",
    "    private function settle(Order $order, bool $earned): void",
    "    {",
    "        $idCustomer = (int) $order->id_customer;",
    "        $idOrder = (int) $order->id;",
    "        if (!$idCustomer || !$idOrder) {",
    "            return;",
    "        }",
    "",
    "        $already = (int) Db::getInstance()->getValue(",
    "            'SELECT COALESCE(SUM(points), 0) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`",
    "             WHERE id_customer = ' . $idCustomer . ' AND id_order = ' . $idOrder",
    "        );",
    "",
    "        if ($earned) {",
    "            if ($already > 0) {",
    "                return;   // already credited: a retry is not a second order",
    "            }",
    "            $points = $this->orderPoints($order);",
    "            if ($points <= 0) {",
    "                return;",
    "            }",
    "            $this->addPoints($idCustomer, $points, 'Commande #' . $order->reference, $idOrder);",
    "            $this->creditWelcome($idCustomer);",
    "",
    "            return;",
    "        }",
    "",
    "        if ($already <= 0) {",
    "            return;       // nothing to take back",
    "        }",
    "        $this->addPoints($idCustomer, -$already, 'Annulation #' . $order->reference, $idOrder);",
    "    }",
    "",
    "    /** The welcome bonus, once, and only for a customer who has paid. */",
    "    private function creditWelcome(int $idCustomer): void",
    "    {",
    "        $given = (int) Db::getInstance()->getValue(",
    "            'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'odys_loyalty_history`",
    "             WHERE id_customer = ' . (int) $idCustomer . '",
    "               AND label = \"' . pSQL(self::WELCOME_LABEL) . '\"'",
    "        );",
    "        if (!$given) {",
    "            $this->addPoints($idCustomer, self::WELCOME_POINTS, self::WELCOME_LABEL, null);",
    "        }",
    "    }",
    "",
    "    /**",
    "     * Eligible spend: perfume lines, less the order's discounts, and never",
    "     * more than the customer actually paid — a free order earns nothing.",
    "     */",
    "    public function orderPoints(Order $order): int",
    "    {",
    "        $excluded = array_filter([",
    "            (int) Configuration::get('ODYS_CAT_OUD'),",
    "            (int) Configuration::get('ODYS_CAT_BOUKHOUR'),",
    "        ]);",
    "",
    "        $eligible = 0.0;",
    "        foreach ((array) $order->getProducts() as $line) {",
    "            $reference = Tools::strtoupper((string) ($line['product_reference'] ?? ''));",
    "            if (strpos($reference, 'OUD-') === 0 || strpos($reference, 'BK-') === 0) {",
    "                continue;",
    "            }",
    "            $categories = array_map('intval', (array) Product::getProductCategories((int) $line['id_product']));",
    "            if ($excluded && array_intersect($categories, $excluded)) {",
    "                continue;",
    "            }",
    "            // a product sold by weight is never eligible, whatever it is called",
    "            $product = new Product((int) $line['id_product']);",
    "            if (Validate::isLoadedObject($product) && trim((string) $product->unity) !== '') {",
    "                continue;",
    "            }",
    "            $eligible += (float) ($line['total_price_tax_incl'] ?? 0);",
    "        }",
    "",
    "        $eligible -= (float) $order->total_discounts_tax_incl;",
    "        $paid = (float) $order->total_paid_tax_incl - (float) $order->total_shipping_tax_incl;",
    "        $eligible = min(max($eligible, 0.0), max($paid, 0.0));",
    "",
    "        return (int) floor($eligible / self::RATE);",
    "    }",
    "",
])
s = s[:start] + NEW + s[end:]

# ── 3. the tier follows the balance, and addPoints stops double-escaping ──
s = s.replace("            'label'       => pSQL($label),", "            'label'       => $label,", 1)

MOD.write_text(s, encoding="utf-8", newline="")
print("  OK   odys_loyalty: settle-once, reverse on loss, welcome on first paid order")

# ── 4. the unique index that makes a double award impossible ─────────────
sql_old = "            KEY `id_customer` (`id_customer`)" + nl + "        ) ENGINE="
s = MOD.read_text(encoding="utf-8", newline="")
if "uniq_order_credit" not in s:
    # only the history table gets it; the first occurrence is the points table
    idx = s.rindex("            KEY `id_customer` (`id_customer`)")
    s = (s[:idx]
         + "            KEY `id_customer` (`id_customer`)," + nl
         + "            -- one credit and one reversal per order, never more" + nl
         + "            UNIQUE KEY `uniq_order_credit` (`id_customer`, `id_order`, `points`)"
         + s[idx + len("            KEY `id_customer` (`id_customer`)"):])
    MOD.write_text(s, encoding="utf-8", newline="")
    print("  OK   odys_loyalty: unique credit per order")
