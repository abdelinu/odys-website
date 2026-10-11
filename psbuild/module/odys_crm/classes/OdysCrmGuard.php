<?php
/**
 * Input sanitising and rate limiting for every odys_crm endpoint.
 *
 * Kept out of the controller so a second endpoint cannot forget to call it:
 * `OdysCrmGuard::rateLimit()` and `OdysCrmGuard::clean*()` are the only way
 * visitor data enters this module.
 *
 * SQL note: PrestaShop's DB layer has no prepared statements, so "parameterised"
 * here means every value reaches a query as an (int)/(float) cast or through
 * pSQL(), and never by string concatenation of raw input.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class OdysCrmGuard
{
    /** Requests per IP per window, counted whether or not they create a row. */
    const MAX_PER_IP = 40;
    /** A single browser (cookie id) is noisier than that only if scripted. */
    const MAX_PER_VISITOR = 20;
    /** Whole endpoint, all callers: a floor under a distributed flood. */
    const MAX_GLOBAL = 600;
    /** Window length in seconds. */
    const WINDOW = 3600;
    /** Bytes. A capture payload is a few hundred; 16 KB is already generous. */
    const MAX_BODY = 16384;

    /**
     * @return array{0:bool,1:string} [allowed, reason]
     */
    public static function rateLimit($ip, $visitor)
    {
        $now = time();
        $window = $now - ($now % self::WINDOW);

        $checks = [
            ['ip:' . $ip, self::MAX_PER_IP, 'rate_limited'],
            ['global', self::MAX_GLOBAL, 'busy'],
        ];
        if ($visitor !== '') {
            $checks[] = ['vid:' . $visitor, self::MAX_PER_VISITOR, 'rate_limited'];
        }

        foreach ($checks as $check) {
            list($bucket, $ceiling, $reason) = $check;
            if (self::hit($bucket, $window) > $ceiling) {
                return [false, $reason];
            }
        }

        return [true, ''];
    }

    /**
     * One atomic UPSERT per request: the counter is the source of truth, not
     * the number of rows in the lead table (deduplicated leads used to let a
     * bot update the same row for ever without ever tripping the limit).
     */
    private static function hit($bucket, $window)
    {
        $db = Db::getInstance();
        $table = _DB_PREFIX_ . 'odys_crm_rate';
        $bucket = Tools::substr((string) $bucket, 0, 64);

        $db->execute(
            'INSERT INTO `' . $table . '` (`bucket`, `window_start`, `hits`)
             VALUES ("' . pSQL($bucket) . '", ' . (int) $window . ', 1)
             ON DUPLICATE KEY UPDATE `hits` = `hits` + 1'
        );

        return (int) $db->getValue(
            'SELECT `hits` FROM `' . $table . '`
             WHERE `bucket` = "' . pSQL($bucket) . '" AND `window_start` = ' . (int) $window
        );
    }

    /** Old windows are of no interest; keep the table from growing for ever. */
    public static function prune()
    {
        Db::getInstance()->execute(
            'DELETE FROM `' . _DB_PREFIX_ . 'odys_crm_rate`
             WHERE `window_start` < ' . (int) (time() - (24 * self::WINDOW))
        );
    }

    // ── sanitising ───────────────────────────────────────────────────────
    // Every value is cut to the column's width *after* cleaning, so a
    // multi-byte character can never be sliced in half into invalid UTF-8.

    /** Printable text: no tags, no control characters, collapsed whitespace. */
    public static function cleanText($value, $maxLength)
    {
        if (is_array($value) || is_object($value)) {
            return '';
        }
        $value = strip_tags((string) $value);
        $value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $value);
        $value = preg_replace('/\s+/u', ' ', $value);
        $value = trim($value);
        if (!Validate::isCleanHtml($value)) {
            return '';
        }

        return Tools::substr($value, 0, (int) $maxLength);
    }

    /** '' unless PrestaShop itself calls it a valid address. */
    public static function cleanEmail($value)
    {
        $value = trim((string) (is_scalar($value) ? $value : ''));

        return Validate::isEmail($value) ? Tools::substr($value, 0, 190) : '';
    }

    /**
     * A phone number, or nothing. The whole string has to look like one:
     * filtering out the characters we dislike would turn
     * `0612345678' OR '1'='1` into the plausible-looking `0612345678 11`.
     */
    public static function cleanPhone($value)
    {
        $value = trim(preg_replace('/\s+/', ' ', (string) (is_scalar($value) ? $value : '')));
        if (!preg_match('/^\+?[0-9][0-9 .-]{4,24}$/', $value)) {
            return '';
        }
        $digits = preg_replace('/\D/', '', $value);
        if (Tools::strlen($digits) < 6 || Tools::strlen($digits) > 18) {
            return '';
        }

        return Tools::substr($value, 0, 32);
    }

    /** The cookie id the script generates: base36, nothing else. */
    public static function cleanVisitor($value)
    {
        $value = preg_replace('/[^a-z0-9]/i', '', (string) (is_scalar($value) ? $value : ''));

        return Tools::substr($value, 0, 48);
    }

    /**
     * A path on this shop. Anything absolute, scheme-bearing or traversing is
     * dropped: this string is written to the lead and read back by a human in
     * the Back Office, so `javascript:` must never survive.
     */
    public static function cleanPath($value)
    {
        $value = (string) (is_scalar($value) ? $value : '');
        $value = preg_replace('/[\x00-\x1F\x7F]/', '', $value);
        if ($value === '' || Tools::strlen($value) > 255) {
            return '';
        }
        if (strpos($value, '..') !== false || preg_match('#^[a-z][a-z0-9+.-]*:#i', $value)) {
            return '';
        }
        if ($value[0] !== '/' || (isset($value[1]) && $value[1] === '/')) {
            return '';
        }

        return Tools::substr($value, 0, 255);
    }

    /** One of a fixed list, or the fallback. Never the visitor's own string. */
    public static function oneOf($value, array $allowed, $fallback)
    {
        $value = (string) (is_scalar($value) ? $value : '');

        return isset($allowed[$value]) || in_array($value, $allowed, true) ? $value : $fallback;
    }

    /**
     * Structured payloads are re-encoded from a decoded array, so whatever the
     * caller sent is replaced by our own JSON of scalar values only.
     */
    public static function cleanPayload($value, $maxLength = 2000)
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);
            $value = is_array($decoded) ? $decoded : self::cleanText($value, $maxLength);
        }
        if (!is_array($value)) {
            return (string) $value;
        }
        $clean = [];
        foreach (array_slice($value, 0, 20, true) as $key => $item) {
            if (!is_scalar($item)) {
                continue;
            }
            $clean[self::cleanText($key, 32)] = self::cleanText($item, 255);
        }

        return Tools::substr((string) json_encode($clean), 0, $maxLength);
    }

    /**
     * A Moroccan mobile in the international form, or '' when it cannot be
     * read with confidence.
     *
     * People type their number every way there is: 06 12 34 56 78,
     * +212 6-12..., 00212612345678. Guessing at an unreadable one means
     * messaging a stranger, so anything that does not match returns empty and
     * the Back Office shows the number without a link.
     */
    public static function phoneE164(string $raw): string
    {
        $digits = preg_replace('/\D+/', '', $raw);
        if ($digits === '') {
            return '';
        }
        if (strpos($digits, '00212') === 0) {
            $digits = substr($digits, 2);
        }
        if (strpos($digits, '212') === 0) {
            $rest = ltrim(substr($digits, 3), '0');

            return preg_match('/^[5-7]\d{8}$/', $rest) ? '212' . $rest : '';
        }
        if (strpos($digits, '0') === 0) {
            $rest = substr($digits, 1);

            return preg_match('/^[5-7]\d{8}$/', $rest) ? '212' . $rest : '';
        }

        return preg_match('/^[5-7]\d{8}$/', $digits) ? '212' . $digits : '';
    }
}
