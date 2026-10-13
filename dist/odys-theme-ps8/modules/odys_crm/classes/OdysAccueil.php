<?php
/**
 * Les parfums de la page d'accueil.
 *
 * Le gabarit `index.tpl` contient depuis le debut une grille batie sur la vraie
 * vignette produit — prix, prix barre, famille olfactive, bouton d'achat — mais
 * elle est enfermee dans un `{if isset($featuredProducts)}` que personne ne
 * remplissait : le controleur d'accueil de PrestaShop n'assigne pas cette
 * variable, et aucun module ne rendait quoi que ce soit dans `displayHome`.
 * Resultat, l'accueil ne montrait aucun prix et n'offrait aucun achat. Un
 * visiteur venu d'Instagram devait traverser six sections avant de voir un
 * tarif.
 *
 * Cette classe remplit la variable. Elle suit la recette du module officiel
 * ps_featuredproducts — meme fournisseur de recherche, meme assembleur, meme
 * presentateur — pour que les produits arrivent exactement dans la forme que la
 * vignette recoit deja sur les pages de collection. Rien de maison : toute
 * autre methode finirait par diverger de ce que PrestaShop presente ailleurs.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

use PrestaShop\PrestaShop\Adapter\Category\CategoryProductSearchProvider;
use PrestaShop\PrestaShop\Adapter\Image\ImageRetriever;
use PrestaShop\PrestaShop\Adapter\Product\PriceFormatter;
use PrestaShop\PrestaShop\Adapter\Product\ProductColorsRetriever;
use PrestaShop\PrestaShop\Core\Product\Search\ProductSearchContext;
use PrestaShop\PrestaShop\Core\Product\Search\ProductSearchQuery;
use PrestaShop\PrestaShop\Core\Product\Search\SortOrder;

class OdysAccueil
{
    /** Huit tient sur deux rangees de quatre en grand ecran, sans faire defiler. */
    const COMBIEN = 8;

    /**
     * La categorie a montrer : « Parfums » si elle existe, sinon l'Accueil.
     *
     * On la cherche par son url (`link_rewrite`) plutot que par un identifiant
     * en dur, qui ne survivrait pas a une reinstallation.
     */
    public static function categorie(Context $context, $slug = 'parfums', $repli = true)
    {
        $idLang = (int) $context->language->id;
        $idShop = (int) $context->shop->id;

        $id = (int) Db::getInstance()->getValue(
            'SELECT c.`id_category`
             FROM `' . _DB_PREFIX_ . 'category` c
             INNER JOIN `' . _DB_PREFIX_ . 'category_lang` cl
                     ON cl.`id_category` = c.`id_category`
                    AND cl.`id_lang` = ' . $idLang . '
                    AND cl.`id_shop` = ' . $idShop . '
             WHERE c.`active` = 1 AND cl.`link_rewrite` = "' . pSQL($slug) . '"'
        );

        // L'Accueil est un repli raisonnable pour la grille principale : mieux
        // vaut des produits que rien. Pour une bande thematique, non — elle
        // afficherait le catalogue entier sous un titre qui ment. Elle demande
        // donc $repli = false et disparait si sa categorie n'existe pas.
        if (!$id && $repli) {
            $id = (int) Configuration::get('PS_HOME_CATEGORY');
        }
        if (!$id) {
            return null;
        }

        return new Category($id, $idLang);
    }

    /**
     * @return array les produits presentes, ou [] si rien a montrer
     */
    public static function produits(Context $context, $slug = 'parfums', $combien = self::COMBIEN, $repli = true)
    {
        $categorie = self::categorie($context, $slug, $repli);
        if (!$categorie || !Validate::isLoadedObject($categorie)) {
            return [];
        }

        try {
            $recherche = new CategoryProductSearchProvider($context->getTranslator(), $categorie);
            $contexte = new ProductSearchContext($context);
            $requete = new ProductSearchQuery();
            $requete
                ->setResultsPerPage((int) $combien)
                ->setPage(1)
                ->setSortOrder(new SortOrder('product', 'position', 'asc'));

            $resultat = $recherche->runQuery($contexte, $requete);
            $bruts = $resultat->getProducts();
        } catch (Exception $e) {
            // Une grille absente vaut mieux qu'une page d'accueil en erreur.
            return [];
        }

        if (!$bruts) {
            return [];
        }

        $assembleur = new ProductAssembler($context);
        $fabrique = new ProductPresenterFactory($context);
        $reglages = $fabrique->getPresentationSettings();
        // Le presentateur de LISTE, pas celui de la fiche : c'est lui qui pose
        // price_amount, regular_price et la couverture que la vignette attend.
        $presentateur = new \PrestaShop\PrestaShop\Adapter\Presenter\Product\ProductListingPresenter(
            new ImageRetriever($context->link),
            $context->link,
            new PriceFormatter(),
            new ProductColorsRetriever(),
            $context->getTranslator()
        );

        $enLot = method_exists($assembleur, 'assembleProducts');
        if ($enLot) {
            $bruts = $assembleur->assembleProducts($bruts);
        }

        $sortie = [];
        foreach ($bruts as $brut) {
            $sortie[] = $presentateur->present(
                $reglages,
                $enLot ? $brut : $assembleur->assembleProduct($brut),
                $context->language
            );
        }

        return $sortie;
    }

    /**
     * Les avis publies, pour la bande de l'accueil.
     *
     * Rien n'est ecrit en dur et rien n'est invente : la requete ne prend que
     * les commentaires que la moderation a valides (`validate = 1`), avec le
     * parfum qu'ils visent. Aucun avis, aucune bande — l'accueil d'une
     * boutique qui ouvre ne doit pas afficher une section vide, et encore
     * moins un temoignage qui n'existe pas.
     *
     * Le module officiel productcomments tient la table ; s'il n'est pas
     * installe, elle n'existe pas et on repond simplement rien.
     *
     * @return array
     */
    public static function avis(Context $context, $combien = 6)
    {
        $idLang = (int) $context->language->id;
        $idShop = (int) $context->shop->id;
        $combien = max(1, min(12, (int) $combien));

        $tables = Db::getInstance()->executeS(
            'SHOW TABLES LIKE "' . _DB_PREFIX_ . 'product_comment"'
        );
        if (!$tables) {
            return [];
        }

        try {
            $lignes = Db::getInstance()->executeS(
                'SELECT pc.`id_product`, pc.`customer_name`, pc.`title`,
                        pc.`content`, pc.`grade`, pc.`date_add`, pl.`name`
                 FROM `' . _DB_PREFIX_ . 'product_comment` pc
                 INNER JOIN `' . _DB_PREFIX_ . 'product_lang` pl
                         ON pl.`id_product` = pc.`id_product`
                        AND pl.`id_lang` = ' . $idLang . '
                        AND pl.`id_shop` = ' . $idShop . '
                 INNER JOIN `' . _DB_PREFIX_ . 'product` p
                         ON p.`id_product` = pc.`id_product` AND p.`active` = 1
                 WHERE pc.`validate` = 1 AND pc.`deleted` = 0
                 ORDER BY pc.`date_add` DESC'
            );
        } catch (Exception $e) {
            return [];
        }
        if (!$lignes) {
            return [];
        }

        $sortie = [];
        foreach (array_slice($lignes, 0, $combien) as $ligne) {
            $sortie[] = [
                'auteur' => $ligne['customer_name'],
                'titre' => $ligne['title'],
                'texte' => $ligne['content'],
                'note' => (int) $ligne['grade'],
                'date' => $ligne['date_add'],
                'produit' => $ligne['name'],
                'url' => $context->link->getProductLink((int) $ligne['id_product']),
            ];
        }

        return $sortie;
    }
}
