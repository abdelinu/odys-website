<?php
/** Diagnostic: is odys_crm's media hook wired up in this shop? Run inside the container:
 *  php /var/www/html/modules/odys_crm/tests/probe.php
 */
require_once '/var/www/html/config/config.inc.php';

$module = Module::getInstanceByName('odys_crm');
echo 'module loaded: ', $module ? get_class($module) : 'NO', PHP_EOL;
echo 'active: ', var_export(Module::isEnabled('odys_crm'), true), PHP_EOL;
echo 'installed: ', var_export(Module::isInstalled('odys_crm'), true), PHP_EOL;

$rows = Db::getInstance()->executeS(
    'SELECT h.name, hm.id_shop, hm.position FROM ' . _DB_PREFIX_ . 'hook_module hm
     JOIN ' . _DB_PREFIX_ . 'hook h ON h.id_hook = hm.id_hook
     JOIN ' . _DB_PREFIX_ . 'module m ON m.id_module = hm.id_module
     WHERE m.name = "odys_crm"'
);
foreach ((array) $rows as $r) {
    echo "hook {$r['name']} shop={$r['id_shop']} pos={$r['position']}", PHP_EOL;
}

echo 'js file exists: ', var_export(file_exists(_PS_ROOT_DIR_ . '/modules/odys_crm/views/js/crm.js'), true), PHP_EOL;
echo 'PS_ROOT: ', _PS_ROOT_DIR_, PHP_EOL;

// what Media::registerJavascript would resolve
$rel = 'modules/odys_crm/views/js/crm.js';
$full = _PS_ROOT_DIR_ . '/' . $rel;
echo 'resolved: ', $full, ' readable=', var_export(is_readable($full), true), PHP_EOL;

// call the hook the way the front controller does, then inspect the collection
$controller = new IndexController();
$controller->php_self = 'index';
Context::getContext()->controller = $controller;
Hook::exec('actionFrontControllerSetMedia', [], null, false, true, false, null);
$js = $controller->getStylesheets() !== null ? 'ok' : 'ok';
$registered = Context::getContext()->controller->getJavascript();
$found = false;
foreach ((array) $registered as $position => $items) {
    foreach ((array) $items as $id => $item) {
        if (strpos((string) $id, 'odys') !== false || strpos(json_encode($item), 'odys_crm') !== false) {
            $found = true;
            echo "registered in [$position]: $id", PHP_EOL;
        }
    }
}
echo 'crm.js registered by the hook: ', var_export($found, true), PHP_EOL;

echo PHP_EOL, '--- full bottom collection (ids and uris) ---', PHP_EOL;
foreach ((array) $registered as $position => $groups) {
    foreach ((array) $groups as $group => $items) {
        foreach ((array) $items as $id => $item) {
            $uri = is_array($item) && isset($item['uri']) ? $item['uri'] : json_encode($item);
            echo "[$position][$group] $id => $uri", PHP_EOL;
        }
    }
}
