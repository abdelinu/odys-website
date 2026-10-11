<?php
/**
 * Minimal PrestaShop stand-ins, just enough to execute odys_crm's own logic:
 * an in-memory ObjectModel store and a Db that records every query and
 * answers getValue() from a queue the test sets up.
 */
define('_PS_VERSION_', '8.1.7');
define('_DB_PREFIX_', 'ps_');
define('_MYSQL_ENGINE_', 'InnoDB');

class TestBus
{
    public static $input = '';
    public static $getValueQueue = [];
    public static $queries = [];
    public static $updates = [];
    public static $store = [];      // id => array of fields
    public static $nextId = 100;
    public static $output = null;
    public static $rateHits = [];   // bucket|window => hits
    public static $status = 200;
}

class Db
{
    private static $inst;

    public static function getInstance()
    {
        return self::$inst ?: self::$inst = new self();
    }

    public function execute($sql)
    {
        TestBus::$queries[] = $sql;
        // the rate limiter's UPSERT: counted in memory, like the real table
        if (preg_match('/INSERT INTO `ps_odys_crm_rate`[\s\S]*VALUES \("([^"]*)", (\d+)/', $sql, $m)) {
            $key = $m[1] . '|' . $m[2];
            TestBus::$rateHits[$key] = (TestBus::$rateHits[$key] ?? 0) + 1;
        }

        return true;
    }

    public function getValue($sql)
    {
        TestBus::$queries[] = $sql;
        // the real getValue() appends its own LIMIT 1, so a query that
        // already carries one ends up with two and fails to parse
        if (stripos($sql, 'LIMIT') !== false) {
            throw new RuntimeException('getValue() adds LIMIT 1: remove it from the query');
        }
        if (preg_match('/FROM `ps_odys_crm_rate`[\s\S]*bucket` = "([^"]*)" AND `window_start` = (\d+)/', $sql, $m)) {
            return TestBus::$rateHits[$m[1] . '|' . $m[2]] ?? 0;
        }

        return array_shift(TestBus::$getValueQueue);
    }

    public function executeS($sql)
    {
        TestBus::$queries[] = $sql;

        return [];
    }

    public function update($table, array $data, $where = '')
    {
        TestBus::$updates[] = ['table' => $table, 'data' => $data, 'where' => $where];

        return true;
    }
}

function pSQL($s, $html = false)
{
    return addslashes((string) $s);
}

class ObjectModel
{
    public $id;

    public function __construct($id = null)
    {
        if ($id && isset(TestBus::$store[$id])) {
            foreach (TestBus::$store[$id] as $k => $v) {
                $this->$k = $v;
            }
            $this->id = $id;
        }
    }

    public function save()
    {
        return $this->id ? $this->update() : $this->add();
    }

    public function add()
    {
        $this->id = TestBus::$nextId++;

        return $this->persist();
    }

    public function update()
    {
        return $this->persist();
    }

    private function persist()
    {
        $row = [];
        foreach (get_object_vars($this) as $k => $v) {
            $row[$k] = $v;
        }
        TestBus::$store[$this->id] = $row;

        return true;
    }

    const TYPE_INT = 1;
    const TYPE_BOOL = 2;
    const TYPE_STRING = 3;
    const TYPE_FLOAT = 4;
    const TYPE_DATE = 5;
    const TYPE_HTML = 6;
}

class Tools
{
    public static function file_get_contents($path)
    {
        return TestBus::$input;
    }

    public static function getRemoteAddr()
    {
        return '41.248.10.7';
    }

    public static function substr($str, $start, $length = null)
    {
        return $length === null ? mb_substr((string) $str, $start) : mb_substr((string) $str, $start, $length);
    }

    public static function strlen($str)
    {
        return mb_strlen((string) $str);
    }
}

class Validate
{
    public static function isEmail($v)
    {
        return (bool) filter_var((string) $v, FILTER_VALIDATE_EMAIL);
    }

    public static function isCleanHtml($v)
    {
        // PrestaShop's own rule: no script/style tags, no on* handlers
        return !preg_match('/<\s*(script|style|iframe|object|embed)/i', (string) $v)
            && !preg_match('/on[a-z]+\s*=/i', (string) $v)
            && stripos((string) $v, 'javascript:') === false;
    }

    public static function isLoadedObject($o)
    {
        return is_object($o) && !empty($o->id);
    }
}

class Shop
{
    public $id = 1;
}

class Customer
{
    public $id = 0;
    public $email = '';
}

class Cart
{
    public $total = 240.0;

    public function getOrderTotal()
    {
        return $this->total;
    }
}

class Link
{
    public function getModuleLink($m, $c, $p = [], $ssl = null)
    {
        return 'https://odys.ma/module/' . $m . '/' . $c;
    }
}

class Context
{
    public $shop;
    public $customer;
    public $cart;
    public $link;
    public $controller;
    private static $inst;

    public function __construct()
    {
        $this->shop = new Shop();
        $this->customer = new Customer();
        $this->cart = new Cart();
        $this->link = new Link();
        $this->controller = new class {
            public function registerJavascript($id, $path, $opts = []) {}
        };
    }

    public static function getContext()
    {
        return self::$inst ?: self::$inst = new self();
    }
}

class ModuleFrontController
{
    public $context;

    public function __construct()
    {
        $this->context = Context::getContext();
    }

    public function ajaxRender($value = null)
    {
        TestBus::$output = $value;
        TestBus::$status = function_exists('http_response_code') ? (http_response_code() ?: 200) : 200;
        echo $value;
    }
}

class Module
{
    // real PrestaShop declares all of these; the stub must too, or PHP 8.2+
    // reports every assignment as a deprecated dynamic property
    public $name;
    public $context;
    public $tab;
    public $version;
    public $author;
    public $need_instance;
    public $ps_versions_compliancy;
    public $bootstrap;
    public $displayName;
    public $description;
    public $confirmUninstall;

    public function __construct()
    {
        $this->context = Context::getContext();
    }

    public function install()
    {
        return true;
    }

    public function uninstall()
    {
        return true;
    }

    public function registerHook($h)
    {
        return true;
    }
}

class ModuleAdminController
{
    public $table;
    public $identifier;
    public $className;
    public $lang;
    public $bootstrap;
    public $allow_export;
    public $deleted;
    public $fields_list;
    public $fields_form;
    public $bulk_actions;
    public $object;
    public $_defaultOrderBy;
    public $_defaultOrderWay;
    public $actions = [];

    public function __construct() {}

    public function addRowAction($a)
    {
        $this->actions[] = $a;
    }

    public function renderList()
    {
        return 'LIST';
    }

    public function renderForm()
    {
        return 'FORM';
    }

    public function processUpdate()
    {
        return true;
    }
}

class HelperKpi
{
    public $id;
    public $icon;
    public $title;
    public $value;

    public function generate()
    {
        return '[kpi ' . $this->title . '=' . $this->value . ']';
    }
}

class HelperKpiRow
{
    public $kpis = [];

    public function generate()
    {
        return implode('', $this->kpis);
    }
}

class Media
{
    public static $defs = [];

    public static function addJsDef($d)
    {
        self::$defs = array_merge(self::$defs, $d);
    }
}

class Order
{
    public $id = 55;
    public $total_paid = 349.0;
}
