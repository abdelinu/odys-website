<?php
/**
 * Back Office → Clients → Campagnes ODYS.
 *
 * Create a campaign, get a link and (if you asked for one) a discount code.
 * Post them. The table then shows what came back: clicks, orders, revenue —
 * per post, per platform, instead of "the story did well I think".
 *
 * There is no Instagram or TikTok API here on purpose. Publishing to those
 * platforms needs a business account, an app review and tokens that expire;
 * what a shop this size actually needs is to know which post sold what, and
 * that is a link and a cookie.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminOdysCampaignsController extends ModuleAdminController
{
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

        $notice = '';
        if (Tools::isSubmit('odys_campaign_new')) {
            $result = OdysCampaign::create(
                (string) Tools::getValue('name'),
                (string) Tools::getValue('source'),
                (string) Tools::getValue('slug'),
                (float) Tools::getValue('discount'),
                (string) Tools::getValue('date_end')
            );
            $notice = $result['ok']
                ? '<div class="alert alert-success">Campagne créée. Le lien est dans le tableau ci-dessous.</div>'
                : '<div class="alert alert-danger">' . $this->safe($result['error']) . '</div>';
        }
        if (Tools::isSubmit('odys_campaign_stop')) {
            OdysCampaign::stop((int) Tools::getValue('id_campaign'));
            $notice = '<div class="alert alert-info">Campagne arrêtée : le lien ne compte plus '
                . 'et son code ne fonctionne plus.</div>';
        }

        $this->content .= $notice . $this->renderList() . $this->renderNew();
        $this->context->smarty->assign('content', $this->content);
    }

    /** AdminController declares renderList() public; PHP will not narrow it. */
    public function renderList(): string
    {
        $rows = OdysCampaign::all();
        $base = $this->context->shop->getBaseURL(true);

        $body = '';
        foreach ($rows as $row) {
            $link = $base . '?c=' . $row['slug'];
            $clicks = (int) $row['clicks'];
            $orders = (int) $row['orders'];
            $rate = $clicks ? round($orders / $clicks * 100, 1) . ' %' : '—';
            $body .= '<tr' . ((int) $row['active'] ? '' : ' class="text-muted"') . '>'
                . '<td>' . $this->safe($row['name']) . '</td>'
                . '<td>' . $this->safe(OdysCampaign::SOURCES[$row['source']] ?? $row['source']) . '</td>'
                . '<td><code>' . $this->safe($link) . '</code></td>'
                . '<td>' . ($row['code'] ? '<code>' . $this->safe($row['code']) . '</code> −'
                    . (int) $row['discount'] . ' %' : '—') . '</td>'
                . '<td class="text-right">' . $clicks . '</td>'
                . '<td class="text-right">' . $orders . '</td>'
                . '<td class="text-right">' . Tools::displayPrice((float) $row['revenue']) . '</td>'
                . '<td class="text-right">' . $rate . '</td>'
                . '<td>' . ((int) $row['active']
                    ? '<form method="post" style="display:inline">'
                      . '<input type="hidden" name="id_campaign" value="' . (int) $row['id_campaign'] . '">'
                      . '<button class="btn btn-default btn-xs" name="odys_campaign_stop" value="1">Arrêter</button>'
                      . '</form>'
                    : 'arrêtée') . '</td>'
                . '</tr>';
        }

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-bullhorn"></i> Campagnes'
            . '<span class="badge">' . count($rows) . '</span></div>'
            . ($body
                ? '<table class="table"><thead><tr><th>Campagne</th><th>Canal</th><th>Lien à publier</th>'
                  . '<th>Code</th><th class="text-right">Clics</th><th class="text-right">Commandes</th>'
                  . '<th class="text-right">CA</th><th class="text-right">Conversion</th><th></th>'
                  . '</tr></thead><tbody>' . $body . '</tbody></table>'
                : '<div class="panel-body">Aucune campagne pour l\'instant.</div>')
            . '<div class="panel-footer"><small>Une commande est attribuée à la dernière campagne '
            . 'ouverte par le visiteur, pendant ' . OdysCampaign::WINDOW_DAYS . ' jours, une seule fois.'
            . '</small></div>'
            . '</div>';
    }

    private function renderNew(): string
    {
        $options = '';
        foreach (OdysCampaign::SOURCES as $key => $label) {
            $options .= '<option value="' . $this->safe($key) . '">' . $this->safe($label) . '</option>';
        }

        return '<div class="panel">'
            . '<div class="panel-heading"><i class="icon-plus"></i> Nouvelle campagne</div>'
            . '<form method="post" class="form-horizontal panel-body">'
            . $this->field('Nom', '<input type="text" class="form-control" name="name" required maxlength="128" '
                . 'placeholder="Story oud — vendredi">')
            . $this->field('Canal', '<select class="form-control" name="source">' . $options . '</select>')
            . $this->field('Lien (facultatif)', '<input type="text" class="form-control" name="slug" '
                . 'maxlength="32" placeholder="story-oud"><span class="help-block">Ce qui apparaît après '
                . '<code>?c=</code>. Vide : dérivé du nom.</span>')
            . $this->field('Remise', '<input type="number" class="form-control" name="discount" min="0" max="90" '
                . 'step="1" value="0"><span class="help-block">0 : pas de code. Au-dessus, un bon est créé '
                . 'automatiquement et apparaît dans Catalogue → Réductions.</span>')
            . $this->field('Fin (facultatif)', '<input type="date" class="form-control" name="date_end">')
            . '<div class="form-group"><div class="col-lg-9 col-lg-offset-3">'
            . '<button type="submit" name="odys_campaign_new" value="1" class="btn btn-primary">Créer</button>'
            . '</div></div>'
            . '</form></div>';
    }

    private function field(string $label, string $control): string
    {
        return '<div class="form-group"><label class="control-label col-lg-3">' . $label . '</label>'
            . '<div class="col-lg-6">' . $control . '</div></div>';
    }

    /** Campaign names are typed by an employee and printed back to one. */
    private function safe($value): string
    {
        return htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
    }
}
