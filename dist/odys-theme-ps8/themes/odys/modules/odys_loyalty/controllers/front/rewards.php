<?php
/**
 * "La récompense se demande depuis votre compte, avant de passer commande."
 *
 * The page shows the balance, when it lapses, the four rewards with what each
 * one costs, and the ledger behind it. Redeeming is a POST, guarded by the
 * session token; the module does the spending — this controller only reads
 * the form.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class Odys_LoyaltyRewardsModuleFrontController extends ModuleFrontController
{
    public $auth = true;                       // points belong to an account
    public $authRedirection = 'index.php?controller=my-account';
    public $ssl = true;

    public function initContent()
    {
        parent::initContent();

        /** @var Odys_Loyalty $module */
        $module = $this->module;
        $idCustomer = (int) $this->context->customer->id;
        $module->expire($idCustomer);          // never show points that lapsed

        $notice = null;
        $error = null;
        if (Tools::isSubmit('odys_redeem')) {
            if (!Tools::getValue('token') || Tools::getValue('token') !== Tools::getToken(false)) {
                $error = 'Session expirée, merci de réessayer.';
            } else {
                $key = (string) Tools::getValue('reward');
                $result = $module->spend($idCustomer, $key, $this->picksFor($key));
                if ($result['ok']) {
                    $notice = $result;
                } else {
                    $error = $result['error'];
                }
            }
        }

        $points = $module->getPoints($idCustomer);

        // every reward, with what it costs and whether this balance reaches it
        $rewards = [];
        foreach (Odys_Loyalty::REWARDS as $key => $reward) {
            $rewards[] = [
                'key' => $key,
                'cost' => (int) $reward['cost'],
                'label' => $reward['label'],
                'count' => (int) $reward['count'],
                'choices' => $reward['pick'] ? $module->giftable($reward['pick']) : [],
                'value' => $key === 'oud' ? $module->oudRewardValue() : 0.0,
                'affordable' => $points >= (int) $reward['cost'],
            ];
        }

        $this->context->smarty->assign([
            'odys_points' => $points,
            'odys_tier' => $module->getTier($points),
            'odys_min' => Odys_Loyalty::REWARD_MIN,
            'odys_rewards' => $rewards,
            'odys_can_redeem' => $points >= Odys_Loyalty::REWARD_MIN,
            'odys_expires_on' => $module->expiresOn($idCustomer),
            'odys_ledger' => $module->ledger($idCustomer, 20),
            'odys_voucher_months' => Odys_Loyalty::VOUCHER_MONTHS,
            'odys_notice' => $notice,
            'odys_error' => $error,
            'odys_token' => Tools::getToken(false),
        ]);

        $this->setTemplate('module:odys_loyalty/views/templates/front/rewards.tpl');
    }

    /**
     * The products chosen for this reward. Each reward posts its own fields,
     * so picking a coffret cannot be replayed as a pair of perfumes.
     */
    private function picksFor(string $key): array
    {
        $picks = [];
        foreach ([1, 2] as $slot) {
            $id = (int) Tools::getValue('pick_' . $key . '_' . $slot);
            if ($id) {
                $picks[] = $id;
            }
        }

        return $picks;
    }

    public function getBreadcrumbLinks()
    {
        $breadcrumb = parent::getBreadcrumbLinks();
        $breadcrumb['links'][] = [
            'title' => 'Mes points ODYS',
            'url' => $this->context->link->getModuleLink('odys_loyalty', 'rewards'),
        ];

        return $breadcrumb;
    }
}
