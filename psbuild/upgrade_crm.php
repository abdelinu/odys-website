<?php
/**
 * Bring an already-installed odys_crm up to the version that tracks campaigns,
 * without uninstalling it — an uninstall keeps the leads but drops the hooks.
 *
 *   docker compose exec -u www-data shop php upgrade_crm.php
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

$module = Module::getInstanceByName('odys_crm');
if (!$module) {
    exit("odys_crm is not installed.\n  php bin/console prestashop:module install odys_crm\n");
}

require_once rtrim($root, '/') . '/modules/odys_crm/classes/OdysCampaign.php';

// 1. the two campaign tables
OdysCampaign::installDb();
say('Tables: ps_odys_campaign and ps_odys_campaign_order present');

// 2. the screen
$before = (bool) Tab::getIdFromClassName('AdminOdysCampaigns');
$reflection = new ReflectionMethod($module, 'installTab');
$reflection->setAccessible(true);
$reflection->invoke($module);
say('Tab: Campagnes ODYS ' . ($before ? 'already there' : 'added under Clients'));

// 3. the hooks it needs (both were already used by the CRM itself)
foreach (['actionFrontControllerSetMedia', 'actionValidateOrder',
    'actionOrderStatusPostUpdate', 'actionObjectCustomerMessageAddAfter'] as $hook) {
    if ($module->isRegisteredInHook($hook)) {
        say("Hook: $hook already registered");
        continue;
    }
    $module->registerHook($hook);
    say("Hook: $hook registered");
}

say('Clear the cache if the new screen 404s: php bin/console cache:clear --no-warmup');
