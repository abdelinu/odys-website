<?php
/**
 * Back Office → Clients → Points ODYS.
 *
 * Until this screen existed an employee could not answer "how many points do
 * I have?" without opening the database, and could not fix a miscount at all.
 * It shows every balance, the ledger behind one of them, and lets an employee
 * correct a balance with a reason attached — a correction with no reason is
 * indistinguishable from a leak, so the reason is required.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminOdysLoyaltyController extends ModuleAdminController
{
    /** Nobody hands out a fortune by slipping on the keyboard. */
    const MAX_ADJUST = 500;

    public function __construct()
    {
        $this->bootstrap = true;
        $this->display = 'view';
        $this->lang = false;
        parent::__construct();
    }

    public function initContent()
    {
        parent::initContent();

        /** @var Odys_Loyalty $module */
        $module = $this->module;
        $notices = [];

        if (Tools::isSubmit('odys_expire_now')) {
            $n = $module->expire();
            $notices[] = $n
                ? $n . ' solde(s) expiré(s).'
                : 'Aucun solde à expirer : personne ne dépasse ' . Odys_Loyalty::VALIDITY_MONTHS . ' mois sans achat.';
        }

        if (Tools::isSubmit('odys_adjust')) {
            $notices[] = $this->adjust($module);
        }

        $idCustomer = (int) Tools::getValue('id_customer');
        $this->content .= $this->renderNotices($notices)
            . ($idCustomer ? $this->renderCustomer($module, $idCustomer) : '')
            . $this->renderBalances($module);

        $this->context->smarty->assign('content', $this->content);
    }

    /** A manual correction: bounded, reasoned, and written to the same ledger. */
    private function adjust(Odys_Loyalty $module): string
    {
        $idCustomer = (int) Tools::getValue('id_customer');
        $points = (int) Tools::getValue('points');
        // a client that posts anything but UTF-8 would otherwise have its
        // reason silently cut at the first bad byte, and a half-sentence is
        // no reason at all
        $reason = trim(mb_convert_encoding((string) Tools::getValue('reason'), 'UTF-8', 'UTF-8'));

        if (!$idCustomer || !Validate::isLoadedObject(new Customer($idCustomer))) {
            return 'Client inconnu.';
        }
        if (!$points) {
            return 'Indiquez un nombre de points, positif ou négatif.';
        }
        if (abs($points) > self::MAX_ADJUST) {
            return 'Au-delà de ' . self::MAX_ADJUST . ' points, passez par la base.';
        }
        if ($reason === '') {
            return 'Un ajustement sans motif ne se relit pas : indiquez-en un.';
        }
        // never leave a customer owing points: the ledger sums to a balance and
        // getPoints() floors at zero, so a negative total would be invisible
        $balance = $module->getPoints($idCustomer);
        if ($points < 0 && $balance + $points < 0) {
            return 'Ce client n\'a que ' . $balance . ' point(s).';
        }

        $module->addPoints($idCustomer, $points,
            'Ajustement — ' . Tools::substr($reason, 0, 180), null);

        return 'Ajustement enregistré : ' . ($points > 0 ? '+' : '') . $points . ' point(s).';
    }

    private function renderNotices(array $notices): string
    {
        $out = '';
        foreach ($notices as $notice) {
            $out .= '<div class="alert alert-info">' . $this->safe($notice) . '</div>';
        }

        return $out;
    }

    /** Every balance that is not zero, biggest first. */
    private function renderBalances(Odys_Loyalty $module): string
    {
        $rows = (array) Db::getInstance()->executeS(
            'SELECT c.id_customer, c.firstname, c.lastname, c.email,
                    COALESCE(SUM(h.points), 0) AS balance,
                    MAX(h.date_add) AS last_move
             FROM `' . _DB_PREFIX_ . 'customer` c
             JOIN `' . _DB_PREFIX_ . 'odys_loyalty_history` h ON h.id_customer = c.id_customer
             WHERE c.deleted = 0
             GROUP BY c.id_customer
             HAVING balance <> 0
             ORDER BY balance DESC, last_move DESC'
        );

        $body = '';
        foreach ($rows as $row) {
            $balance = (int) $row['balance'];
            $body .= '<tr>'
                . '<td>' . (int) $row['id_customer'] . '</td>'
                . '<td>' . $this->safe($row['firstname'] . ' ' . $row['lastname']) . '</td>'
                . '<td>' . $this->safe($row['email']) . '</td>'
                . '<td class="text-right"><strong>' . $balance . '</strong></td>'
                . '<td>' . $this->safe($module->getTier($balance)) . '</td>'
                . '<td>' . $this->safe((string) $module->expiresOn((int) $row['id_customer'])) . '</td>'
                . '<td><a class="btn btn-default btn-xs" href="' . $this->safe($this->linkTo((int) $row['id_customer']))
                . '">Détail</a></td>'
                . '</tr>';
        }

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-star"></i> Soldes de points'
            . '<span class="badge">' . count($rows) . '</span></div>'
            . ($body
                ? '<table class="table"><thead><tr><th>ID</th><th>Client</th><th>E-mail</th>'
                  . '<th class="text-right">Solde</th><th>Palier</th><th>Expire le</th><th></th>'
                  . '</tr></thead><tbody>' . $body . '</tbody></table>'
                : '<div class="panel-body">Aucun point en circulation.</div>')
            . '<div class="panel-footer">' . $this->expireForm() . '</div>'
            . '</div>';
    }

    /** One customer: the ledger, and the box that corrects it. */
    private function renderCustomer(Odys_Loyalty $module, int $idCustomer): string
    {
        $customer = new Customer($idCustomer);
        if (!Validate::isLoadedObject($customer)) {
            return '<div class="alert alert-warning">Client inconnu.</div>';
        }
        $balance = $module->getPoints($idCustomer);

        $body = '';
        foreach ($module->ledger($idCustomer, 100) as $row) {
            $body .= '<tr>'
                . '<td>' . $this->safe($row['date_add']) . '</td>'
                . '<td>' . $this->safe($row['label']) . '</td>'
                . '<td class="text-right">' . ((int) $row['points'] > 0 ? '+' : '') . (int) $row['points'] . '</td>'
                . '<td>' . ($row['id_order'] ? '#' . (int) $row['id_order'] : '') . '</td>'
                . '<td>' . (empty($row['id_cart_rule']) ? '' : 'bon #' . (int) $row['id_cart_rule']) . '</td>'
                . '</tr>';
        }

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-user"></i> '
            . $this->safe($customer->firstname . ' ' . $customer->lastname . ' — ' . $customer->email)
            . ' · <strong>' . $balance . ' pt' . ($balance === 1 ? '' : 's') . '</strong>'
            . ' · ' . $this->safe($module->getTier($balance)) . '</div>'
            . ($body
                ? '<table class="table"><thead><tr><th>Date</th><th>Motif</th>'
                  . '<th class="text-right">Points</th><th>Commande</th><th>Bon</th>'
                  . '</tr></thead><tbody>' . $body . '</tbody></table>'
                : '<div class="panel-body">Aucun mouvement.</div>')
            . '<div class="panel-footer">' . $this->adjustForm($idCustomer) . '</div>'
            . '</div>';
    }

    private function adjustForm(int $idCustomer): string
    {
        return '<form method="post" action="' . $this->safe($this->linkTo($idCustomer)) . '" class="form-inline">'
            . '<input type="hidden" name="id_customer" value="' . (int) $idCustomer . '">'
            . '<input type="number" class="form-control" name="points" placeholder="± points" '
            . 'min="-' . self::MAX_ADJUST . '" max="' . self::MAX_ADJUST . '" required> '
            . '<input type="text" class="form-control" name="reason" placeholder="Motif (obligatoire)" '
            . 'maxlength="180" size="46" required> '
            . '<button type="submit" name="odys_adjust" value="1" class="btn btn-primary">Ajuster</button>'
            . '</form>';
    }

    private function expireForm(): string
    {
        return '<form method="post" action="' . $this->safe($this->linkTo(0)) . '" class="form-inline">'
            . '<button type="submit" name="odys_expire_now" value="1" class="btn btn-default">'
            . 'Passer les soldes en expiration</button> '
            . '<span class="help-inline">Un solde expire ' . Odys_Loyalty::VALIDITY_MONTHS
            . ' mois après le dernier achat. Cela tourne aussi tout seul en boutique.</span>'
            . '</form>';
    }

    private function linkTo(int $idCustomer): string
    {
        return self::$currentIndex . '&token=' . $this->token
            . ($idCustomer ? '&id_customer=' . (int) $idCustomer : '');
    }

    /** Names and e-mails are customer-supplied; they reach an employee's browser. */
    private function safe($value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
