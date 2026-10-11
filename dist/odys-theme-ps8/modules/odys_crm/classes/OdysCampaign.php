<?php
/**
 * A campaign is one link handed to one audience.
 *
 * You post a story, a reel, a WhatsApp status; the link carries ?c=<slug>.
 * Someone opening it is a click; if they order within the window, the order
 * is attributed to that campaign. The Back Office then shows what a post was
 * actually worth — clicks, orders, revenue — instead of a feeling.
 *
 * A campaign may carry a voucher of its own, created here as an ordinary
 * PrestaShop cart rule so it behaves like every other discount in the shop
 * and can be revoked from the usual screen.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class OdysCampaign
{
    /** Where a campaign can come from. The label is what the Back Office shows. */
    const SOURCES = [
        'instagram' => 'Instagram',
        'tiktok' => 'TikTok',
        'facebook' => 'Facebook',
        'whatsapp' => 'WhatsApp',
        'influenceur' => 'Influenceur',
        'email' => 'E-mail',
        'autre' => 'Autre',
    ];

    /** How long a click keeps the credit for an order. */
    const WINDOW_DAYS = 30;
    const COOKIE = 'odys_c';

    public static function installDb(): bool
    {
        $db = Db::getInstance();
        $ok = $db->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'odys_campaign` (
            `id_campaign` INT UNSIGNED NOT NULL AUTO_INCREMENT,
            `name` VARCHAR(128) NOT NULL,
            `slug` VARCHAR(32) NOT NULL,
            `source` VARCHAR(16) NOT NULL DEFAULT "autre",
            `id_cart_rule` INT UNSIGNED NULL,
            `code` VARCHAR(32) NOT NULL DEFAULT "",
            `discount` DECIMAL(5,2) NOT NULL DEFAULT 0,
            `date_end` DATETIME NULL,
            `active` TINYINT(1) NOT NULL DEFAULT 1,
            `clicks` INT UNSIGNED NOT NULL DEFAULT 0,
            `date_add` DATETIME NOT NULL,
            PRIMARY KEY (`id_campaign`),
            UNIQUE KEY `slug` (`slug`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;');

        // one row per order, so an order can never be counted twice
        $ok = $ok && $db->execute('CREATE TABLE IF NOT EXISTS `' . _DB_PREFIX_ . 'odys_campaign_order` (
            `id_order` INT UNSIGNED NOT NULL,
            `id_campaign` INT UNSIGNED NOT NULL,
            `total_paid` DECIMAL(20,6) NOT NULL DEFAULT 0,
            `date_add` DATETIME NOT NULL,
            PRIMARY KEY (`id_order`),
            KEY `id_campaign` (`id_campaign`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;');

        return (bool) $ok;
    }

    /** A slug is what ends up in a URL, so it is letters, digits and dashes. */
    public static function cleanSlug(string $raw): string
    {
        $slug = Tools::strtolower(trim($raw));
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        $slug = trim((string) $slug, '-');

        return Tools::substr((string) $slug, 0, 32);
    }

    /**
     * Record a visit. Unknown or expired slugs are ignored in silence — the
     * value comes from a URL, so it is whatever anyone cares to type.
     */
    public static function click(string $slug): ?array
    {
        $slug = self::cleanSlug($slug);
        if ($slug === '') {
            return null;
        }
        $row = Db::getInstance()->getRow(
            'SELECT * FROM `' . _DB_PREFIX_ . 'odys_campaign`
             WHERE slug = "' . pSQL($slug) . '" AND active = 1
               AND (date_end IS NULL OR date_end >= NOW())'
        );
        if (!$row) {
            return null;
        }
        Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . 'odys_campaign` SET clicks = clicks + 1
             WHERE id_campaign = ' . (int) $row['id_campaign']
        );

        return $row;
    }

    /**
     * Give an order to the campaign the visitor arrived through. Keyed on the
     * order, so a replayed hook cannot inflate the numbers.
     */
    public static function attribute(int $idOrder, string $slug, float $total): bool
    {
        $slug = self::cleanSlug($slug);
        if (!$idOrder || $slug === '') {
            return false;
        }
        $idCampaign = (int) Db::getInstance()->getValue(
            'SELECT id_campaign FROM `' . _DB_PREFIX_ . 'odys_campaign` WHERE slug = "' . pSQL($slug) . '"'
        );
        if (!$idCampaign) {
            return false;
        }

        return (bool) Db::getInstance()->execute(
            'INSERT IGNORE INTO `' . _DB_PREFIX_ . 'odys_campaign_order`
             (id_order, id_campaign, total_paid, date_add)
             VALUES (' . $idOrder . ', ' . $idCampaign . ', ' . (float) $total . ', NOW())'
        );
    }

    /**
     * Credit the campaign whose voucher code this order actually used.
     *
     * attribute() needs the click cookie, so it only ever credits someone who
     * followed the tracked link. A discount code lives its own life: it is read
     * off a photo caption, forwarded to a sister, repeated in a comment. Those
     * orders were landing as if no campaign existed, which made every campaign
     * look weaker than it was. The code on the order is proof enough.
     */
    public static function attributeByCode(int $idOrder, float $total): bool
    {
        if (!$idOrder) {
            return false;
        }
        $idCampaign = (int) Db::getInstance()->getValue(
            'SELECT c.id_campaign
             FROM `' . _DB_PREFIX_ . 'order_cart_rule` ocr
             JOIN `' . _DB_PREFIX_ . 'cart_rule` cr ON cr.id_cart_rule = ocr.id_cart_rule
             JOIN `' . _DB_PREFIX_ . 'odys_campaign` c
               ON (c.id_cart_rule = cr.id_cart_rule
                   OR (c.code <> "" AND c.code = cr.code))
             WHERE ocr.id_order = ' . $idOrder
            // getValue() adds its own LIMIT 1; a second one is a syntax error
        );
        if (!$idCampaign) {
            return false;
        }

        return (bool) Db::getInstance()->execute(
            'INSERT IGNORE INTO `' . _DB_PREFIX_ . 'odys_campaign_order`
             (id_order, id_campaign, total_paid, date_add)
             VALUES (' . $idOrder . ', ' . $idCampaign . ', ' . (float) $total . ', NOW())'
        );
    }

    /** Every campaign with what it brought in. */
    public static function all(): array
    {
        return (array) Db::getInstance()->executeS(
            'SELECT c.*,
                    COUNT(o.id_order) AS orders,
                    COALESCE(SUM(o.total_paid), 0) AS revenue
             FROM `' . _DB_PREFIX_ . 'odys_campaign` c
             LEFT JOIN `' . _DB_PREFIX_ . 'odys_campaign_order` o ON o.id_campaign = c.id_campaign
             GROUP BY c.id_campaign
             ORDER BY c.date_add DESC'
        );
    }

    /**
     * Create a campaign, and the voucher that goes with it when a discount is
     * asked for. The code is the campaign's own, uppercase, so it can be read
     * out in a story.
     *
     * @return array{ok: bool, error?: string, id?: int}
     */
    public static function create(string $name, string $source, string $slug,
                                  float $discount, string $endsOn): array
    {
        $name = trim(strip_tags($name));
        $slug = self::cleanSlug($slug !== '' ? $slug : $name);
        if ($name === '' || $slug === '') {
            return ['ok' => false, 'error' => 'Il faut un nom.'];
        }
        if (!isset(self::SOURCES[$source])) {
            $source = 'autre';
        }
        if ($discount < 0 || $discount > 90) {
            return ['ok' => false, 'error' => 'La remise doit rester entre 0 et 90 %.'];
        }
        if (Db::getInstance()->getValue(
            'SELECT id_campaign FROM `' . _DB_PREFIX_ . 'odys_campaign` WHERE slug = "' . pSQL($slug) . '"')) {
            return ['ok' => false, 'error' => 'Une campagne porte déjà ce lien (' . $slug . ').'];
        }
        $end = $endsOn !== '' && Validate::isDate($endsOn) ? $endsOn . ' 23:59:59' : null;

        $code = '';
        $idRule = null;
        if ($discount > 0) {
            $code = Tools::strtoupper(preg_replace('/[^A-Za-z0-9]/', '', $slug));
            $code = Tools::substr($code, 0, 20) ?: 'ODYS';
            $rule = new CartRule();
            $rule->date_from = date('Y-m-d H:i:s');
            $rule->date_to = $end ?: date('Y-m-d H:i:s', strtotime('+3 months'));
            $rule->quantity = 100000;
            $rule->quantity_per_user = 1;
            $rule->code = $code;
            $rule->reduction_percent = $discount;
            $rule->active = 1;
            $rule->highlight = 0;
            foreach (Language::getLanguages(false) as $lang) {
                $rule->name[(int) $lang['id_lang']] = 'Campagne ODYS — ' . $name;
            }
            if (!$rule->add()) {
                return ['ok' => false, 'error' => "Le bon de réduction n'a pas pu être créé."];
            }
            $idRule = (int) $rule->id;
        }

        // null_values would turn the empty code of a discount-free campaign
        // into NULL against a NOT NULL column, so the two genuinely optional
        // columns say NULL for themselves and the rest stay as written
        $null = ['type' => 'sql', 'value' => 'NULL'];
        $done = Db::getInstance()->insert('odys_campaign', [
            'name' => pSQL($name),
            'slug' => pSQL($slug),
            'source' => pSQL($source),
            'id_cart_rule' => $idRule ? (int) $idRule : $null,
            'code' => pSQL($code),
            'discount' => (float) $discount,
            'date_end' => $end ? pSQL($end) : $null,
            'active' => 1,
            'clicks' => 0,
            'date_add' => date('Y-m-d H:i:s'),
        ]);

        if (!$done) {
            if ($idRule) {
                (new CartRule($idRule))->delete();
            }

            return ['ok' => false, 'error' => "La campagne n'a pas pu être enregistrée."];
        }

        return ['ok' => true, 'id' => (int) Db::getInstance()->Insert_ID()];
    }

    /** Stop a campaign: the link stops counting and its voucher stops working. */
    public static function stop(int $idCampaign): void
    {
        $row = Db::getInstance()->getRow(
            'SELECT id_cart_rule FROM `' . _DB_PREFIX_ . 'odys_campaign` WHERE id_campaign = ' . (int) $idCampaign
        );
        Db::getInstance()->execute(
            'UPDATE `' . _DB_PREFIX_ . 'odys_campaign` SET active = 0 WHERE id_campaign = ' . (int) $idCampaign
        );
        if ($row && $row['id_cart_rule']) {
            $rule = new CartRule((int) $row['id_cart_rule']);
            if (Validate::isLoadedObject($rule)) {
                $rule->active = 0;
                $rule->update();
            }
        }
    }
}
