<?php
/**
 * "Mes envies" — the list a visitor builds without an account.
 *
 * There is nothing to fetch: the list lives in the visitor's own browser, and
 * the page renders itself from it. This controller exists so the list has a
 * real address of its own, one that can be linked, bookmarked and shared with
 * the person holding the phone.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class Odys_LoyaltyEnviesModuleFrontController extends ModuleFrontController
{
    /** No auth on purpose: needing an account to save something is the bug. */
    public $auth = false;
    public $ssl = true;

    public function initContent()
    {
        parent::initContent();
        $this->setTemplate('module:odys_loyalty/views/templates/front/envies.tpl');
    }

    public function getBreadcrumbLinks()
    {
        $breadcrumb = parent::getBreadcrumbLinks();
        $breadcrumb['links'][] = [
            'title' => 'Mes envies',
            'url' => $this->context->link->getModuleLink('odys_loyalty', 'envies'),
        ];

        return $breadcrumb;
    }
}
