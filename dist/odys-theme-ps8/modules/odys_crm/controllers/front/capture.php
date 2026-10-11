<?php
/**
 * Capture endpoint: POST JSON from views/js/crm.js.
 *
 * Deliberately narrow — it only ever writes to odys_crm_lead, never reads it
 * back to the visitor. Anonymous intents (WhatsApp, cart) carry no personal
 * data; e-mail is stored only when the visitor typed it into a form.
 *
 * Everything that arrives here is untrusted: the body size is capped, every
 * field goes through OdysCrmGuard, and the request is counted against three
 * rate-limit buckets before any work is done.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class Odys_crmCaptureModuleFrontController extends ModuleFrontController
{
    public $ajax = true;
    public $ssl = true;

    public function postProcess()
    {
        // This endpoint only ever accepts a POST body; a GET cannot be smuggled
        // in from an <img> tag or a link.
        $method = isset($_SERVER['REQUEST_METHOD']) ? strtoupper((string) $_SERVER['REQUEST_METHOD']) : 'POST';
        if ($method !== 'POST') {
            $this->reply(['ok' => false, 'error' => 'method_not_allowed'], 405);
        }

        $raw = (string) Tools::file_get_contents('php://input');
        if (Tools::strlen($raw) > OdysCrmGuard::MAX_BODY) {
            $this->reply(['ok' => false, 'error' => 'payload_too_large'], 413);
        }

        $input = json_decode($raw, true);
        if (!is_array($input)) {
            $this->reply(['ok' => false, 'error' => 'bad_request'], 400);
        }

        // Honeypot: real visitors never fill this in. Answer as if accepted.
        if (!empty($input['website'])) {
            $this->reply(['ok' => true]);
        }

        $ip = Tools::substr((string) Tools::getRemoteAddr(), 0, 46);
        $visitor = OdysCrmGuard::cleanVisitor($input['visitor'] ?? '');

        list($allowed, $why) = OdysCrmGuard::rateLimit($ip, $visitor);
        if (!$allowed) {
            $this->reply(['ok' => false, 'error' => $why], 429);
        }

        $source = OdysCrmGuard::oneOf($input['source'] ?? 'other', OdysCrmLead::sources(), 'other');
        $email = OdysCrmGuard::cleanEmail($input['email'] ?? '');
        $phone = OdysCrmGuard::cleanPhone($input['phone'] ?? '');
        $name = OdysCrmGuard::cleanText($input['name'] ?? '', 128);
        $subject = OdysCrmGuard::cleanText($input['subject'] ?? '', 255);
        $payload = OdysCrmGuard::cleanPayload($input['payload'] ?? '', 2000);
        $page = OdysCrmGuard::cleanPath($input['page'] ?? '');

        // A lead with nothing in it is noise, not a lead.
        if ($email === '' && $phone === '' && $visitor === '' && $name === '') {
            $this->reply(['ok' => false, 'error' => 'nothing_to_store'], 422);
        }
        // An address was offered and rejected: say so rather than store a blank.
        if ($email === '' && !empty($input['email'])) {
            $this->reply(['ok' => false, 'error' => 'invalid_email'], 422);
        }
        if ($phone === '' && !empty($input['phone'])) {
            $this->reply(['ok' => false, 'error' => 'invalid_phone'], 422);
        }

        $lead = $this->findOpenLead($email, $phone, $visitor);
        if (!$lead) {
            $lead = new OdysCrmLead();
            $lead->date_add = date('Y-m-d H:i:s');
            $lead->hits = 0;
            $lead->stage = 'new';
        }

        $lead->id_shop = (int) $this->context->shop->id;
        $lead->source = $source;
        $lead->name = $name ?: (string) $lead->name;
        $lead->email = $email ?: (string) $lead->email;
        $lead->phone = $phone ?: (string) $lead->phone;
        $lead->subject = $subject;
        $lead->payload = $payload;
        $lead->page = $page;
        $lead->visitor = $visitor;
        $lead->ip = $ip;
        $lead->id_customer = (int) $this->context->customer->id;
        $lead->value = (float) ($this->context->cart ? $this->context->cart->getOrderTotal() : 0);
        $lead->hits = (int) $lead->hits + 1;
        $lead->date_upd = date('Y-m-d H:i:s');

        // ObjectModel validates each field against $definition before writing,
        // and escapes every value on the way into the INSERT/UPDATE.
        if (!$lead->save()) {
            $this->reply(['ok' => false, 'error' => 'not_saved'], 422);
        }

        $this->reply(['ok' => true]);
    }

    /**
     * Same person, still open, seen in the last 30 days: keep one row.
     * Each value is escaped with pSQL(); none is concatenated raw.
     */
    private function findOpenLead($email, $phone, $visitor)
    {
        $clauses = [];
        if ($email !== '') {
            $clauses[] = 'email = "' . pSQL($email) . '"';
        }
        if ($phone !== '') {
            $clauses[] = 'phone = "' . pSQL($phone) . '"';
        }
        if ($visitor !== '') {
            $clauses[] = 'visitor = "' . pSQL($visitor) . '"';
        }
        if (!$clauses) {
            return null;
        }

        $id = (int) Db::getInstance()->getValue(
            'SELECT id_odys_crm_lead FROM `' . _DB_PREFIX_ . 'odys_crm_lead`
             WHERE stage IN ("new", "contacted")
               AND date_upd > DATE_SUB(NOW(), INTERVAL 30 DAY)
               AND (' . implode(' OR ', $clauses) . ')
             ORDER BY id_odys_crm_lead DESC'
            // no LIMIT here: Db::getValue() appends its own, and two of
            // them in one statement is a syntax error
        );

        return $id ? new OdysCrmLead($id) : null;
    }

    private function reply(array $payload, $status = 200)
    {
        if (!headers_sent()) {
            http_response_code((int) $status);
            header('Content-Type: application/json');
            header('Cache-Control: no-store');
            header('X-Content-Type-Options: nosniff');
        }
        $this->ajaxRender(json_encode($payload));
        exit;
    }
}
