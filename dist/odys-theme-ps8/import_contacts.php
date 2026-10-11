<?php
/**
 * Load a contact list into the ODYS CRM, ready for the launch announcement.
 *
 *   php import_contacts.php contacts.csv               # dry run, changes nothing
 *   php import_contacts.php contacts.csv --write       # actually import
 *   php import_contacts.php contacts.csv --write --source=import
 *
 * The CSV needs a header row. Recognised columns, in French or English, in
 * any order: nom/name, telephone/phone/gsm, email/mail, adresse/address,
 * ville/city, consentement/consent, note/notes.
 *
 * **Consent.** A row is imported as contactable only when the consent column
 * says so (oui, yes, 1, true, ok). Rows without it are still imported — they
 * are your contacts either way — but they are marked `consentement: non
 * renseigné` in the notes and counted separately, so the list you message and
 * the list you merely hold are not the same list by accident. Morocco's Law
 * 09-08 and the CNDP treat unsolicited commercial messaging as the shop's
 * responsibility, not the tool's; this script only makes the distinction
 * visible.
 *
 * Nothing is sent. This fills the CRM; messaging happens from the channel of
 * your choice afterwards.
 */
$root = '/var/www/html';
$file = '';
$write = false;
$source = 'import';
foreach (array_slice($argv, 1) as $arg) {
    if ($arg === '--write') {
        $write = true;
    } elseif (strpos($arg, '--root=') === 0) {
        $root = substr($arg, 7);
    } elseif (strpos($arg, '--source=') === 0) {
        $source = preg_replace('/[^a-z_]/', '', Tools_strtolower_fallback(substr($arg, 9)));
    } elseif ($file === '') {
        $file = $arg;
    }
}

function Tools_strtolower_fallback(string $s): string
{
    return function_exists('mb_strtolower') ? mb_strtolower($s, 'UTF-8') : strtolower($s);
}

if ($file === '' || !is_readable($file)) {
    exit("usage: php import_contacts.php <contacts.csv> [--write] [--source=import]\n");
}
require_once rtrim($root, '/') . '/config/config.inc.php';

/** Morocco: 0612345678, 212612345678, +212 6 12 34 56 78 all mean one number. */
function normalisePhone(string $raw): string
{
    $digits = preg_replace('/[^0-9]/', '', $raw);
    if ($digits === '') {
        return '';
    }
    if (strpos($digits, '212') === 0) {
        $digits = substr($digits, 3);
    } elseif (strpos($digits, '00212') === 0) {
        $digits = substr($digits, 5);
    }
    $digits = ltrim($digits, '0');
    // a Moroccan mobile is 9 digits and starts with 6 or 7
    if (!preg_match('/^[67][0-9]{8}$/', $digits)) {
        return '';
    }

    return '212' . $digits;
}

function pick(array $row, array $names): string
{
    foreach ($names as $name) {
        if (isset($row[$name]) && trim((string) $row[$name]) !== '') {
            return trim((string) $row[$name]);
        }
    }

    return '';
}

$handle = fopen($file, 'r');
$header = fgetcsv($handle, 0, ',');
if ($header === false) {
    exit("empty file\n");
}
// a semicolon export is at least as common here as a comma one
if (count($header) === 1 && strpos($header[0], ';') !== false) {
    rewind($handle);
    $header = fgetcsv($handle, 0, ';');
    $sep = ';';
} else {
    $sep = ',';
}
$header = array_map(function ($h) {
    return Tools_strtolower_fallback(trim(str_replace("\xEF\xBB\xBF", '', (string) $h)));
}, $header);

$seen = [];
$stats = ['rows' => 0, 'imported' => 0, 'consent' => 0, 'no_consent' => 0,
          'duplicate_in_file' => 0, 'already_known' => 0, 'unusable' => 0];
$examples = [];

while (($line = fgetcsv($handle, 0, $sep)) !== false) {
    if (count(array_filter($line, 'strlen')) === 0) {
        continue;
    }
    ++$stats['rows'];
    $row = @array_combine($header, array_pad(array_slice($line, 0, count($header)), count($header), ''));
    if (!$row) {
        ++$stats['unusable'];
        continue;
    }

    $name = pick($row, ['nom', 'name', 'prenom', 'client']);
    $phone = normalisePhone(pick($row, ['telephone', 'téléphone', 'phone', 'gsm', 'mobile', 'tel']));
    $mailRaw = pick($row, ['email', 'e-mail', 'mail', 'courriel']);
    $email = Validate::isEmail($mailRaw) ? $mailRaw : '';
    $address = trim(pick($row, ['adresse', 'address', 'rue']) . ' ' . pick($row, ['ville', 'city']));
    $consentRaw = Tools_strtolower_fallback(pick($row, ['consentement', 'consent', 'optin', 'opt-in', 'accord']));
    $consent = in_array($consentRaw, ['oui', 'yes', '1', 'true', 'ok', 'y', 'o'], true);

    if ($phone === '' && $email === '') {
        ++$stats['unusable'];
        if (count($examples) < 5) {
            $examples[] = 'ligne ' . $stats['rows'] . ' : ni téléphone valide ni e-mail';
        }
        continue;
    }

    $key = $phone !== '' ? 'p:' . $phone : 'e:' . Tools_strtolower_fallback($email);
    if (isset($seen[$key])) {
        ++$stats['duplicate_in_file'];
        continue;
    }
    $seen[$key] = true;

    $where = [];
    if ($phone !== '') {
        $where[] = 'phone = "' . pSQL($phone) . '"';
    }
    if ($email !== '') {
        $where[] = 'email = "' . pSQL($email) . '"';
    }
    $exists = (int) Db::getInstance()->getValue(
        'SELECT id_odys_crm_lead FROM `' . _DB_PREFIX_ . 'odys_crm_lead` WHERE ' . implode(' OR ', $where)
    );
    if ($exists) {
        ++$stats['already_known'];
        continue;
    }

    $consent ? ++$stats['consent'] : ++$stats['no_consent'];
    $notes = ($consent ? 'consentement : oui' : 'consentement : non renseigné')
        . ($address !== '' ? ' · ' . $address : '')
        . ' · importé le ' . date('Y-m-d');

    if ($write) {
        Db::getInstance()->insert('odys_crm_lead', [
            'id_shop' => (int) Context::getContext()->shop->id,
            'source' => pSQL($source),
            'stage' => 'new',
            'name' => pSQL(Tools::substr($name, 0, 128)),
            'email' => pSQL(Tools::substr($email, 0, 190)),
            'phone' => pSQL($phone),
            'subject' => pSQL('Liste de lancement'),
            'notes' => pSQL(Tools::substr($notes, 0, 500)),
            'hits' => 1,
            'date_add' => date('Y-m-d H:i:s'),
            'date_upd' => date('Y-m-d H:i:s'),
        ], true);
    }
    ++$stats['imported'];
}
fclose($handle);

printf("%s : %d ligne(s) lue(s)\n\n", basename($file), $stats['rows']);
printf("  %-34s %d\n", 'à importer', $stats['imported']);
printf("  %-34s %d\n", '  dont consentement explicite', $stats['consent']);
printf("  %-34s %d\n", '  dont consentement non renseigné', $stats['no_consent']);
printf("  %-34s %d\n", 'déjà dans le CRM', $stats['already_known']);
printf("  %-34s %d\n", 'doublons dans le fichier', $stats['duplicate_in_file']);
printf("  %-34s %d\n", 'inutilisables', $stats['unusable']);
foreach ($examples as $e) {
    echo '    ' . $e . "\n";
}

if (!$write) {
    echo "\nEssai à blanc : rien n'a été écrit. Relancez avec --write pour importer.\n";
} else {
    echo "\nImporté. Back Office → Clients → ODYS CRM, filtre source = " . $source . ".\n";
}
if ($stats['no_consent'] > 0) {
    printf("\n⚠  %d contact(s) sans consentement enregistré. Ils sont dans le CRM, mais\n"
        . "   ce n'est pas la même liste que celle à qui vous pouvez écrire.\n", $stats['no_consent']);
}
