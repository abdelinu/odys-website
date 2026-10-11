<?php
/**
 * Back Office → Clients → ODYS CRM: the pipeline.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class AdminOdysCrmController extends ModuleAdminController
{
    public function __construct()
    {
        $this->bootstrap = true;
        $this->table = 'odys_crm_lead';
        $this->identifier = 'id_odys_crm_lead';
        $this->className = 'OdysCrmLead';
        $this->lang = false;
        $this->allow_export = true;
        $this->deleted = false;
        $this->_defaultOrderBy = 'date_upd';
        $this->_defaultOrderWay = 'DESC';

        parent::__construct();

        $this->fields_list = [
            'id_odys_crm_lead' => ['title' => 'ID', 'align' => 'text-center', 'class' => 'fixed-width-xs'],
            'date_upd' => ['title' => 'Vu le', 'type' => 'datetime', 'align' => 'text-center'],
            'source' => [
                'title' => 'Source',
                'type' => 'select',
                'list' => OdysCrmLead::sources(),
                'filter_key' => 'a!source',
                'callback' => 'labelSource',
            ],
            'stage' => [
                'title' => 'Étape',
                'type' => 'select',
                'list' => OdysCrmLead::stages(),
                'filter_key' => 'a!stage',
                'callback' => 'labelStage',
            ],
            'name' => ['title' => 'Nom', 'callback' => 'safe'],
            'email' => ['title' => 'E-mail', 'callback' => 'safe'],
            'phone' => [
                'title' => 'Téléphone',
                'callback' => 'callWhatsapp',
                'search' => true,
            ],
            'subject' => ['title' => 'Sujet', 'callback' => 'safe'],
            'hits' => ['title' => 'Visites', 'align' => 'text-center', 'class' => 'fixed-width-xs'],
            'value' => ['title' => 'Panier', 'type' => 'price', 'align' => 'text-right'],
            'id_order' => ['title' => 'Commande', 'align' => 'text-center', 'class' => 'fixed-width-xs'],
            'id_customer' => [
                'title' => 'Refus',
                'align' => 'text-center',
                'class' => 'fixed-width-xs',
                'callback' => 'refusalBadge',
                'search' => false,
                'orderby' => false,
            ],
        ];

        $this->bulk_actions = [
            'delete' => ['text' => 'Supprimer la sélection', 'confirm' => 'Supprimer les contacts sélectionnés ?', 'icon' => 'icon-trash'],
        ];
    }

    /**
     * A phone number you can act on rather than read.
     *
     * Confirming before dispatch is the one measure that moves the refusal
     * rate, so the number in this column opens the conversation instead of
     * asking an employee to retype it. A number that is not a recognisable
     * Moroccan mobile is shown plainly with no link: better to send nothing
     * than to write to a stranger.
     */
    public function callWhatsapp($value, $row)
    {
        $plain = htmlspecialchars((string) $value, ENT_QUOTES, 'UTF-8');
        if ($plain === '') {
            return '—';
        }
        $number = OdysCrmGuard::phoneE164((string) $value);
        if ($number === '') {
            return $plain;
        }
        $name = trim((string) ($row['name'] ?? ''));
        $hello = $name !== '' ? 'Bonjour ' . $name . ', ' : 'Bonjour, ';
        $text = $hello . 'c\'est '
            . (string) Configuration::get('PS_SHOP_NAME') . '. Nous revenons vers vous '
            . 'au sujet de votre intérêt pour nos parfums.';

        return '<a href="https://wa.me/' . $number . '?text=' . rawurlencode($text) . '"'
            . ' target="_blank" rel="noopener" title="Écrire sur WhatsApp">'
            . $plain . ' <i class="icon-comment"></i></a>';
    }

    /** How many deliveries this person has already sent back. */
    public function refusalBadge($value, $row)
    {
        $n = Odys_Crm::refusals((int) $value);
        if ($n <= 0) {
            return '—';
        }

        return '<span class="badge badge-danger" title="Livraisons non abouties">'
            . (int) $n . '</span>';
    }

    /**
     * Everything below is visitor-supplied and reaches the Back Office as
     * HTML. The capture endpoint already sanitises it; escaping here means a
     * row written by anything else (an import, a future endpoint) cannot
     * script the employee's browser either.
     */
    public static function safe($value)
    {
        return htmlspecialchars((string) $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
    }

    public static function labelStage($value)
    {
        $stages = OdysCrmLead::stages();

        return isset($stages[$value]) ? $stages[$value] : self::safe($value);
    }

    public static function labelSource($value)
    {
        $sources = OdysCrmLead::sources();

        return isset($sources[$value]) ? $sources[$value] : self::safe($value);
    }

    public function renderList()
    {
        $this->addRowAction('edit');
        $this->addRowAction('delete');

        return parent::renderList();
    }

    /** One KPI per pipeline stage. */
    public function renderKpis()
    {
        $counts = OdysCrmLead::countByStage();
        $kpis = [];
        foreach (OdysCrmLead::stages() as $key => $label) {
            $kpi = new HelperKpi();
            $kpi->id = 'box-odys-crm-' . $key;
            $kpi->icon = 'icon-user';
            $kpi->title = $label;
            $kpi->value = (int) $counts[$key];
            $kpis[] = $kpi->generate();
        }
        $helper = new HelperKpiRow();
        $helper->kpis = $kpis;

        return $helper->generate();
    }

    public function renderForm()
    {
        $this->fields_form = [
            'legend' => ['title' => 'Contact', 'icon' => 'icon-user'],
            'input' => [
                [
                    'type' => 'select',
                    'label' => 'Étape',
                    'name' => 'stage',
                    'options' => [
                        'query' => $this->optionList(OdysCrmLead::stages()),
                        'id' => 'id',
                        'name' => 'name',
                    ],
                ],
                ['type' => 'text', 'label' => 'Nom', 'name' => 'name'],
                ['type' => 'text', 'label' => 'E-mail', 'name' => 'email'],
                ['type' => 'text', 'label' => 'Téléphone', 'name' => 'phone'],
                ['type' => 'text', 'label' => 'Sujet', 'name' => 'subject'],
                ['type' => 'textarea', 'label' => 'Notes', 'name' => 'notes', 'rows' => 6],
            ],
            'submit' => ['title' => 'Enregistrer'],
        ];

        return parent::renderForm();
    }

    private function optionList(array $pairs)
    {
        $out = [];
        foreach ($pairs as $id => $name) {
            $out[] = ['id' => $id, 'name' => $name];
        }

        return $out;
    }

    public function processUpdate()
    {
        $lead = parent::processUpdate();
        if (Validate::isLoadedObject($this->object)) {
            $this->object->date_upd = date('Y-m-d H:i:s');
            $this->object->update();
        }

        return $lead;
    }
}
