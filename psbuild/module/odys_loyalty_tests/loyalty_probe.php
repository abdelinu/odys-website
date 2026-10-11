<?php
/**
 * Probe the ODYS points rules through the same method the hooks call.
 * Usage: php loyalty_probe.php <id_customer>
 */
require '/var/www/html/config/config.inc.php';

$idCustomer = (int) ($argv[1] ?? 0);
if (!$idCustomer) {
    exit("usage: loyalty_probe.php <id_customer>\n");
}
$module = Module::getInstanceByName('odys_loyalty');
if (!$module) {
    exit("odys_loyalty not found\n");
}

class ProbeOrder
{
    public $id;
    public $id_customer;
    public $reference;
    public $current_state = 0;
    public $total_paid_tax_incl = 0.0;
    public $total_discounts_tax_incl = 0.0;
    public $total_shipping_tax_incl = 0.0;
    private $products = [];

    public function __construct($id, $idCustomer, $reference, array $products, $paid, $discounts = 0.0, $shipping = 0.0)
    {
        $this->id = $id;
        $this->id_customer = $idCustomer;
        $this->reference = $reference;
        $this->products = $products;
        $this->total_paid_tax_incl = $paid;
        $this->total_discounts_tax_incl = $discounts;
        $this->total_shipping_tax_incl = $shipping;
    }

    public function getProducts()
    {
        return $this->products;
    }
}

function points($idCustomer)
{
    return (int) Db::getInstance()->getValue(
        'SELECT COALESCE(SUM(points),0) FROM ' . _DB_PREFIX_ . 'odys_loyalty_history
         WHERE id_customer = ' . (int) $idCustomer
    );
}

function line($reference, $total)
{
    $id = (int) Db::getInstance()->getValue(
        'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "' . pSQL($reference) . '"'
    );

    return ['id_product' => $id, 'product_reference' => $reference, 'total_price_tax_incl' => $total];
}

function step($label, $idCustomer, callable $run, $expected)
{
    $before = points($idCustomer);
    $run();
    printf("%-52s %+4d   %s\n", $label, points($idCustomer) - $before, $expected);
}

printf("customer %d starts at %d point(s)\n\n", $idCustomer, points($idCustomer));

$perfume = new ProbeOrder(910001, $idCustomer, 'PROBE-A', [line('01', 690.0)], 690.0);
step('A. 690 DH of perfume, paid', $idCustomer, function () use ($module, $perfume) {
    $module->settleProbe($perfume, true);
}, 'expect +6');

step('B. the SAME order settled again', $idCustomer, function () use ($module, $perfume) {
    $module->settleProbe($perfume, true);
}, 'expect +0');

$oud = new ProbeOrder(910002, $idCustomer, 'PROBE-B', [line('OUD-HINDI-ASSAM-A', 875.0)], 875.0);
step('C. 875 DH of oud (sold by the gram)', $idCustomer, function () use ($module, $oud) {
    $module->settleProbe($oud, true);
}, 'expect +0');

$renamed = new ProbeOrder(910003, $idCustomer, 'PROBE-C', [[
    'id_product' => (int) Db::getInstance()->getValue(
        'SELECT id_product FROM ' . _DB_PREFIX_ . 'product WHERE reference = "OUD-ROYAL-THAI-C"'),
    'product_reference' => 'THAI-C',
    'total_price_tax_incl' => 550.0,
]], 550.0);
step('D. oud with a renamed reference', $idCustomer, function () use ($module, $renamed) {
    $module->settleProbe($renamed, true);
}, 'expect +0');

$free = new ProbeOrder(910004, $idCustomer, 'PROBE-D', [line('01', 690.0)], 0.0, 690.0);
step('E. 100% voucher: nothing paid', $idCustomer, function () use ($module, $free) {
    $module->settleProbe($free, true);
}, 'expect +0');

$half = new ProbeOrder(910005, $idCustomer, 'PROBE-E', [line('01', 690.0)], 345.0, 345.0);
step('F. half off: 345 DH paid', $idCustomer, function () use ($module, $half) {
    $module->settleProbe($half, true);
}, 'expect +3');

step('G. order A cancelled', $idCustomer, function () use ($module, $perfume) {
    $module->settleProbe($perfume, false);
}, 'expect -6');

step('H. cancelled twice', $idCustomer, function () use ($module, $perfume) {
    $module->settleProbe($perfume, false);
}, 'expect +0');

$shipping = new ProbeOrder(910006, $idCustomer, 'PROBE-F', [line('01', 690.0)], 720.0, 0.0, 30.0);
step('I. 690 DH + 30 DH shipping', $idCustomer, function () use ($module, $shipping) {
    $module->settleProbe($shipping, true);
}, 'expect +6 (shipping earns nothing)');

echo str_repeat('-', 78) . "\n";
printf("balance: %d point(s) — tier %s\n", points($idCustomer), $module->getTier(points($idCustomer)));
foreach ((array) Db::getInstance()->executeS(
    'SELECT id_order, points, label FROM ' . _DB_PREFIX_ . 'odys_loyalty_history
     WHERE id_customer = ' . (int) $idCustomer . ' ORDER BY id_history'
) as $row) {
    printf("  order %-8s %+4d  %s\n", $row['id_order'] ?: '-', $row['points'], $row['label']);
}
