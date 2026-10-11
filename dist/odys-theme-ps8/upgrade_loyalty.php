<?php
/**
 * Bring an already-installed odys_loyalty up to the version that can spend
 * points, without uninstalling it — an uninstall would leave the balances in
 * place but drop the hooks, and every re-install is a chance to lose them.
 *
 *   docker compose exec -u www-data shop php upgrade_loyalty.php
 *
 * Safe to run twice: every step checks before it writes.
 */
$root = '/var/www/html';
foreach (array_slice($argv, 1) as $arg) {
    if (strpos($arg, '--root=') === 0) {
        $root = substr($arg, 7);
    }
}
require_once rtrim($root, '/') . '/config/config.inc.php';

function say(string $line): void
{
    echo $line, PHP_EOL;
}

$module = Module::getInstanceByName('odys_loyalty');
if (!$module) {
    exit("odys_loyalty is not installed. Install it first:\n"
        . "  php bin/console prestashop:module install odys_loyalty\n");
}

// 1. the column that ties a redemption to the voucher it created
$module->installDb();
say('Tables: up to date (id_cart_rule present)');

// 2. the two screens the new version adds
foreach (['displayCustomerAccount', 'displayAdminCustomers'] as $hook) {
    if ($module->isRegisteredInHook($hook)) {
        say("Hook: $hook already registered");
        continue;
    }
    $module->registerHook($hook);
    say("Hook: $hook registered");
}

// 3. the module's Back Office screens. installTab() skips the ones already
// there, so it can simply be called: guarding on the first tab meant a tab
// added in a later version was never created on an existing shop.
$before = [];
foreach (Odys_Loyalty::TABS as $spec) {
    $before[$spec[0]] = (bool) Tab::getIdFromClassName($spec[0]);
}
$module->installTab();
foreach (Odys_Loyalty::TABS as $spec) {
    say(sprintf('Tab: %-16s %s', $spec[1], $before[$spec[0]] ? 'already there' : 'added'));
}

// 4. run the expiry once so the first Back Office view is honest
$expired = $module->expire();
say(sprintf('Expiry: %d balance(s) written off (%d months without a purchase)',
    $expired, Odys_Loyalty::VALIDITY_MONTHS));

say('Clear the cache if the new page 404s: php bin/console cache:clear --no-warmup');
