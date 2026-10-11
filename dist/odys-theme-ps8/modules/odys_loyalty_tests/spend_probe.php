<?php
/**
 * Exercise the reward ladder through the same methods the front office calls:
 *
 *   10 points = un parfum · 15 = deux parfums ou 5 g d'oud · 20 = un coffret
 *
 *   php spend_probe.php <id_customer>
 *
 * It cleans up after itself: every row and voucher it creates is removed at
 * the end, so it can be run against a real shop without leaving a balance.
 */
$root = '/var/www/html';
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '--root=') === 0) {
        $root = substr($arg, 7);
    }
}
require_once rtrim($root, '/') . '/config/config.inc.php';

$idCustomer = (int) ($argv[1] ?? 0);
if (!$idCustomer) {
    exit("usage: spend_probe.php <id_customer>\n");
}
$module = Module::getInstanceByName('odys_loyalty');
if (!$module) {
    exit("odys_loyalty not found\n");
}

$db = Db::getInstance();
$table = _DB_PREFIX_ . 'odys_loyalty_history';

function points($idCustomer)
{
    return (int) Db::getInstance()->getValue(
        'SELECT COALESCE(SUM(points),0) FROM ' . _DB_PREFIX_ . 'odys_loyalty_history
         WHERE id_customer = ' . (int) $idCustomer
    );
}

function vouchers($idCustomer)
{
    return (int) Db::getInstance()->getValue(
        'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'cart_rule WHERE id_customer = ' . (int) $idCustomer
    );
}

function step($label, $idCustomer, callable $run, $expected)
{
    $before = points($idCustomer);
    $rules = vouchers($idCustomer);
    $note = $run();
    printf("%-42s %+4d pts  %+2d bon  %-20s %s\n",
        $label, points($idCustomer) - $before, vouchers($idCustomer) - $rules,
        $note, $expected);
}

// a clean slate for this customer, remembered so it can be put back
$backup = $db->executeS('SELECT * FROM `' . $table . '` WHERE id_customer = ' . $idCustomer);
$db->execute('DELETE FROM `' . $table . '` WHERE id_customer = ' . $idCustomer);
$ruleIds = array_column((array) $db->executeS(
    'SELECT id_cart_rule FROM `' . _DB_PREFIX_ . 'cart_rule` WHERE id_customer = ' . $idCustomer), 'id_cart_rule');

$parfums = array_column($module->giftable('parfums'), 'id_product');
$coffrets = array_column($module->giftable('coffrets'), 'id_product');
printf("customer %d — %d parfum(s) et %d coffret(s) en stock\n\n",
    $idCustomer, count($parfums), count($coffrets));

$module->addPoints($idCustomer, 9, 'Probe — solde de depart', null);

step('A. 9 pts, echange a 10', $idCustomer, function () use ($module, $idCustomer, $parfums) {
    $r = $module->spend($idCustomer, 'parfum1', [$parfums[0] ?? 0]);

    return $r['ok'] ? 'ACCEPTE' : 'refus';
}, 'attendu 0, 0 bon (sous le seuil)');

step('B. 10 pts, un parfum offert', $idCustomer, function () use ($module, $idCustomer, $parfums) {
    $module->addPoints($idCustomer, 1, 'Probe — passage a 10', null);
    $r = $module->spend($idCustomer, 'parfum1', [$parfums[0] ?? 0]);

    return $r['ok'] ? 'code ' . $r['code'] : 'refus';
}, 'attendu -9 net (+1 -10), +1 bon');

step('C. 15 pts, deux parfums offerts', $idCustomer, function () use ($module, $idCustomer, $parfums) {
    $module->addPoints($idCustomer, 15, 'Probe — recharge 15', null);
    $r = $module->spend($idCustomer, 'parfum2', [$parfums[0] ?? 0, $parfums[1] ?? 0]);

    return $r['ok'] ? 'code ' . $r['code'] : 'refus';
}, 'attendu 0 net (+15 -15), +1 bon');

step('D. deux parfums, un seul choix', $idCustomer, function () use ($module, $idCustomer, $parfums) {
    $module->addPoints($idCustomer, 20, 'Probe — recharge 20', null);
    $r = $module->spend($idCustomer, 'parfum2', [$parfums[0] ?? 0]);

    return $r['ok'] ? 'ACCEPTE' : 'refus';
}, 'attendu +20 (recharge), 0 bon');

step('E. coffret a 20 pts', $idCustomer, function () use ($module, $idCustomer, $coffrets) {
    $r = $module->spend($idCustomer, 'coffret', [$coffrets[0] ?? 0]);

    return $r['ok'] ? 'code ' . $r['code'] : 'refus';
}, 'attendu -20, +1 bon');

step('F. recompense inconnue', $idCustomer, function () use ($module, $idCustomer) {
    $r = $module->spend($idCustomer, 'ferrari');

    return $r['ok'] ? 'ACCEPTE' : 'refus';
}, 'attendu 0, 0 bon');

step('G. parfum pris dans les coffrets', $idCustomer, function () use ($module, $idCustomer, $coffrets) {
    $module->addPoints($idCustomer, 10, 'Probe — recharge 10', null);
    $r = $module->spend($idCustomer, 'parfum1', [$coffrets[0] ?? 0]);

    return $r['ok'] ? 'ACCEPTE' : 'refus';
}, 'attendu +10 (recharge), 0 bon');

step("H. 5 g d'oud a 15 pts", $idCustomer, function () use ($module, $idCustomer) {
    $module->addPoints($idCustomer, 5, 'Probe — passage a 15', null);
    $r = $module->spend($idCustomer, 'oud');

    return $r['ok'] ? 'code ' . $r['code'] : 'refus';
}, 'attendu -10 net (+5 -15), +1 bon');

step('I. solde date de 13 mois', $idCustomer, function () use ($module, $idCustomer, $db, $table) {
    $module->addPoints($idCustomer, 12, 'Probe — vieux solde', null);
    $db->execute('UPDATE `' . $table . '` SET date_add = DATE_SUB(NOW(), INTERVAL 13 MONTH)
                  WHERE id_customer = ' . (int) $idCustomer . ' AND points > 0');

    return $module->expire($idCustomer) . ' solde(s)';
}, 'attendu 0 net (+12 -12), 1 solde');

step('J. expiration relancee', $idCustomer, function () use ($module, $idCustomer) {
    return $module->expire($idCustomer) . ' solde(s)';
}, 'attendu 0, 0 bon');

step('K. echange apres expiration', $idCustomer, function () use ($module, $idCustomer, $parfums) {
    $r = $module->spend($idCustomer, 'parfum1', [$parfums[0] ?? 0]);

    return $r['ok'] ? 'ACCEPTE' : 'refus';
}, 'attendu 0, 0 bon');

echo str_repeat('-', 100) . "\n";
printf("solde final : %d point(s) — palier %s\n", points($idCustomer), $module->getTier(points($idCustomer)));

$orphans = (int) $db->getValue(
    'SELECT COUNT(*) FROM `' . _DB_PREFIX_ . 'cart_rule` cr
     WHERE cr.id_customer = ' . $idCustomer . '
       AND cr.id_cart_rule NOT IN (
           SELECT COALESCE(id_cart_rule, 0) FROM `' . $table . '` WHERE id_customer = ' . $idCustomer . ')'
);
printf("bons sans ecriture au grand livre : %d %s\n", $orphans, $orphans ? '<- FUITE' : '(aucun)');

// put the customer back exactly as found
$made = array_diff(array_column((array) $db->executeS(
    'SELECT id_cart_rule FROM `' . _DB_PREFIX_ . 'cart_rule` WHERE id_customer = ' . $idCustomer), 'id_cart_rule'), $ruleIds);
foreach ($made as $id) {
    (new CartRule((int) $id))->delete();
}
$db->execute('DELETE FROM `' . $table . '` WHERE id_customer = ' . $idCustomer);
foreach ((array) $backup as $row) {
    unset($row['id_history']);
    $row['label'] = pSQL($row['label']);
    $db->insert('odys_loyalty_history', $row, true);
}
printf("nettoyage : %d bon(s) supprime(s), %d ecriture(s) restauree(s)\n", count($made), count((array) $backup));
