<?php
if (!defined('_PS_VERSION_')) {
    exit;
}

class OdysCrmLead extends ObjectModel
{
    public $id_shop;
    public $source;
    public $stage;
    public $name;
    public $email;
    public $phone;
    public $subject;
    public $payload;
    public $page;
    public $visitor;
    public $ip;
    public $id_customer;
    public $id_order;
    public $value;
    public $hits;
    public $notes;
    public $date_add;
    public $date_upd;

    public static $definition = [
        'table' => 'odys_crm_lead',
        'primary' => 'id_odys_crm_lead',
        'fields' => [
            'id_shop' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedId'],
            'source' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 32],
            'stage' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 16],
            'name' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 128],
            'email' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 190],
            'phone' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 32],
            'subject' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 255],
            'payload' => ['type' => self::TYPE_HTML, 'validate' => 'isCleanHtml'],
            'page' => ['type' => self::TYPE_STRING, 'validate' => 'isCleanHtml', 'size' => 255],
            'visitor' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 48],
            'ip' => ['type' => self::TYPE_STRING, 'validate' => 'isGenericName', 'size' => 46],
            'id_customer' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedId'],
            'id_order' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedId'],
            'value' => ['type' => self::TYPE_FLOAT, 'validate' => 'isPrice'],
            'hits' => ['type' => self::TYPE_INT, 'validate' => 'isUnsignedInt'],
            'notes' => ['type' => self::TYPE_HTML, 'validate' => 'isCleanHtml'],
            'date_add' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
            'date_upd' => ['type' => self::TYPE_DATE, 'validate' => 'isDate'],
        ],
    ];

    /**
     * Every column is NOT NULL with a default, but a fresh ObjectModel starts
     * with null properties and INSERTs them as NULL — which a MySQL server in
     * strict mode rejects, so nothing would ever be saved. Seed the defaults.
     */
    public function __construct($id = null, $idLang = null, $idShop = null)
    {
        parent::__construct($id, $idLang, $idShop);

        if ($this->id) {
            return;
        }
        $strings = ['source' => 'other', 'stage' => 'new', 'name' => '', 'email' => '',
            'phone' => '', 'subject' => '', 'payload' => '', 'page' => '', 'visitor' => '',
            'ip' => '', 'notes' => ''];
        foreach ($strings as $field => $default) {
            if ($this->{$field} === null) {
                $this->{$field} = $default;
            }
        }
        $ints = ['id_shop' => 1, 'id_customer' => 0, 'id_order' => 0, 'hits' => 0];
        foreach ($ints as $field => $default) {
            if ($this->{$field} === null) {
                $this->{$field} = $default;
            }
        }
        if ($this->value === null) {
            $this->value = 0.0;
        }
    }

    /** The pipeline, in order. */
    public static function stages()
    {
        return [
            'new' => 'Nouveau',
            'contacted' => 'Contacté',
            'ordered' => 'Commandé',
            'lost' => 'Perdu',
        ];
    }

    public static function sources()
    {
        return [
            'quiz' => 'Quiz',
            'whatsapp' => 'WhatsApp',
            'newsletter' => 'Newsletter',
            'cart' => 'Panier',
            'contact' => 'Contact',
            'other' => 'Autre',
        ];
    }

    /** Counts per stage, for the Back Office KPI row. */
    public static function countByStage()
    {
        $rows = Db::getInstance()->executeS(
            'SELECT stage, COUNT(*) AS n FROM `' . _DB_PREFIX_ . 'odys_crm_lead` GROUP BY stage'
        );
        $out = array_fill_keys(array_keys(self::stages()), 0);
        foreach ((array) $rows as $row) {
            $out[$row['stage']] = (int) $row['n'];
        }

        return $out;
    }
}
