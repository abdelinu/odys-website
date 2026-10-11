<?php
/**
 * Remove the two orders placed while testing checkout from a phone, and the
 * guest customers behind them.
 *
 * Through the PrestaShop API rather than DELETE statements, so the rows that
 * hang off an order go with it: the lines, the status history, the carrier
 * record, the invoice, the stock movements. A raw delete leaves those behind
 * and the Back Office then lists orders that cannot be opened.
 *
 *   docker compose exec -u www-data shop php /tmp/_clear_test_orders.php
 */
require_once '/var/www/html/config/config.inc.php';

$references = ['FZWCNBFKA', 'HACHVBIHI'];
$emails = ['sonde-mobile@odys.test', 'sonde-mobile2@odys.test'];

foreach ($references as $reference) {
    $id = (int) Db::getInstance()->getValue(
        'SELECT id_order FROM ' . _DB_PREFIX_ . 'orders WHERE reference = "' . pSQL($reference) . '"'
    );
    if (!$id) {
        echo "Commande $reference : deja absente\n";
        continue;
    }
    // the CRM lead that was closed on this order would otherwise point at nothing
    $leads = (int) Db::getInstance()->getValue(
        'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'odys_crm_lead WHERE id_order = ' . $id
    );
    if ($leads) {
        Db::getInstance()->delete('odys_crm_lead', 'id_order = ' . $id);
        echo "Lead CRM : $leads ligne(s) liee(s) a $reference supprimee(s)\n";
    }
    $order = new Order($id);
    $gone = $order->delete();
    echo 'Commande ' . $reference . ' : ' . ($gone ? 'supprimee' : 'ECHEC') . "\n";

    // Order::delete() does not take the lines, the status history or the
    // carrier record with it - they stay behind pointing at an id that no
    // longer exists, and the Back Office statistics then count orders nobody
    // can open. Measured after deleting two orders: two orphans in each table.
    $swept = 0;
    foreach (['order_detail', 'order_history', 'order_carrier'] as $table) {
        Db::getInstance()->delete($table, 'id_order = ' . $id);
        $swept += (int) Db::getInstance()->Affected_Rows();
    }
    Db::getInstance()->delete('order_payment', 'order_reference = "' . pSQL($reference) . '"');
    $swept += (int) Db::getInstance()->Affected_Rows();
    if ($swept) {
        echo "  dont $swept ligne(s) que PrestaShop laisse derriere elle\n";
    }
}

foreach ($emails as $email) {
    $id = (int) Db::getInstance()->getValue(
        'SELECT id_customer FROM ' . _DB_PREFIX_ . 'customer WHERE email = "' . pSQL($email) . '"'
    );
    if (!$id) {
        echo "Client $email : deja absent\n";
        continue;
    }
    $remaining = (int) Db::getInstance()->getValue(
        'SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'orders WHERE id_customer = ' . $id
    );
    if ($remaining) {
        echo "Client $email : garde $remaining commande(s), on ne touche pas\n";
        continue;
    }
    Db::getInstance()->delete('odys_crm_lead', 'id_customer = ' . $id);
    $customer = new Customer($id);
    echo 'Client ' . $email . ' : '
        . ($customer->delete() ? 'supprime (adresses et paniers compris)' : 'ECHEC') . "\n";
}

echo "\nRestant : "
    . (int) Db::getInstance()->getValue('SELECT COUNT(*) FROM ' . _DB_PREFIX_ . 'orders')
    . " commande(s)\n";
