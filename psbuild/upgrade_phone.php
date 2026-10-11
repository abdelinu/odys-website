<?php
/**
 * Met un odys_crm deja installe a la version qui connait le telephone, sans
 * le desinstaller — une desinstallation garde les contacts mais perd les hooks.
 *
 *   docker compose exec -u www-data shop php upgrade_phone.php
 *
 * Rejouable : chaque etape verifie avant d'ecrire.
 */
// Amorcage : saute si ce fichier est inclus par un autre qui a deja charge
// PrestaShop (maj-telephone.php le fait).
if (!defined('_PS_VERSION_')) {
    $root = '/var/www/html';
    foreach (array_slice($argv, 1) as $arg) {
        if (strpos($arg, '--root=') === 0) {
            $root = substr($arg, 7);
        }
    }
    require_once rtrim($root, '/') . '/config/config.inc.php';
}
$root = rtrim(isset($root) ? $root : _PS_ROOT_DIR_, '/');

function say(string $line): void
{
    echo $line, PHP_EOL;
}

$module = Module::getInstanceByName('odys_crm');
if (!$module) {
    exit("odys_crm n'est pas installe.\n  php bin/console prestashop:module install odys_crm\n");
}

require_once rtrim($root, '/') . '/modules/odys_crm/classes/OdysPhoneId.php';
require_once rtrim($root, '/') . '/modules/odys_crm/classes/OdysMotDePasse.php';

// 1. la table qui relie un numero a un client
OdysPhoneId::installDb();
OdysMotDePasse::installDb();
$colonnes = Db::getInstance()->executeS('DESCRIBE `' . OdysPhoneId::table() . '`');
say('Table: ' . OdysPhoneId::table() . ' presente (' . count($colonnes) . ' colonnes)');

// 2. les hooks. registerHook() rend true si le hook est deja la.
$hooks = [
    'additionalCustomerFormFields',
    'validateCustomerFormFields',
    'actionCustomerAccountAdd',
    'actionCustomerAccountUpdate',
    'actionDispatcherBefore',
    'actionFrontControllerInitAfter',
];
foreach ($hooks as $hook) {
    $deja = (bool) Db::getInstance()->getValue(
        'SELECT 1 FROM `' . _DB_PREFIX_ . 'hook_module` hm
         INNER JOIN `' . _DB_PREFIX_ . 'hook` h ON h.id_hook = hm.id_hook
         WHERE hm.id_module = ' . (int) $module->id . '
           AND h.name = "' . pSQL($hook) . '"'
    );
    $ok = $deja ? true : $module->registerHook($hook);
    say('Hook: ' . str_pad($hook, 32) . ($deja ? 'deja enregistre' : ($ok ? 'ajoute' : 'ECHEC')));
}

// 3. les numeros deja connus des adresses, pour que les clients inscrits
//    avant ce module se connectent par telephone sans rien faire
$bilan = OdysPhoneId::backfill();
say('Reprise: ' . $bilan['repris'] . ' numero(s) repris depuis les adresses, '
    . $bilan['ambigus'] . ' laisse(s) de cote (partage entre plusieurs comptes)');

// 3 bis. Le message de confidentialite du module ps_dataprivacy etait reste
//        en anglais sous la case a cocher du formulaire d'inscription.
//        On ne remplace que la valeur par defaut : si vous avez ecrit la votre,
//        elle est gardee.
$anglais = 'The personal data you provide is used to answer queries, process orders'
    . ' or allow access to specific information. You have the right to modify and'
    . ' delete all the personal information found in the "My Account" page.';
$francais = 'Les données personnelles que vous nous confiez servent à répondre à vos'
    . ' questions, à traiter vos commandes et à vous donner accès à votre espace client.'
    . ' Vous pouvez les consulter, les modifier ou les supprimer à tout moment depuis'
    . ' la page « Mon compte ».';

$touche = 0;
foreach (Language::getLanguages(false) as $langue) {
    $actuel = trim((string) Configuration::get('CUSTPRIV_MSG_AUTH', (int) $langue['id_lang']));
    if ($actuel === '' || $actuel === trim($anglais)) {
        Configuration::updateValue('CUSTPRIV_MSG_AUTH', [(int) $langue['id_lang'] => $francais], true);
        ++$touche;
    }
}
say('Confidentialite: ' . ($touche
    ? 'message traduit en francais (' . $touche . ' langue(s))'
    : 'message deja personnalise, laisse tel quel'));

// 4. le cache garde la table hook -> module : sans ca les hooks ne partent pas
foreach ([
    $root . '/var/cache/prod',
    $root . '/var/cache/dev',
] as $dir) {
    if (!is_dir($dir)) {
        continue;
    }
    $it = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($it as $f) {
        $f->isDir() ? @rmdir($f->getPathname()) : @unlink($f->getPathname());
    }
    say('Cache: ' . basename($dir) . ' vide');
}

say('');
say('Fait. Le champ Telephone est au formulaire d\'inscription, et un numero');
say('est accepte a la place de l\'e-mail sur la page de connexion.');
