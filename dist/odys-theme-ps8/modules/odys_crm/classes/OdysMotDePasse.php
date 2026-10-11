<?php
/**
 * Les comptes qui n'ont jamais choisi de mot de passe.
 *
 * Un compte cree par « Continuer avec Google » recoit un mot de passe
 * aleatoire que personne ne connait — c'est voulu, sinon le compte serait
 * ouvert. Mais la page « Mes informations » exige le mot de passe ACTUEL pour
 * valider la moindre modification : ce client est alors coince, il ne peut ni
 * changer son e-mail ni s'en choisir un.
 *
 * Cette table dit « ce compte n'a jamais choisi son mot de passe ». Sur la page
 * Identite, ces comptes-la ne se voient demander qu'un NOUVEAU mot de passe.
 *
 * Elle ne desactive le controle pour personne d'autre : exiger le mot de passe
 * actuel est ce qui empeche quelqu'un passant devant un navigateur reste ouvert
 * de changer l'adresse e-mail et de prendre le compte.
 *
 * L'empreinte rend la marque auto-nettoyante : on garde le debut du hachage
 * pose a la creation, et des que le hachage change — mot de passe choisi,
 * reinitialise par e-mail, modifie en Back Office — la marque ne correspond
 * plus et disparait. Pas besoin de surveiller tous les chemins qui changent un
 * mot de passe.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

class OdysMotDePasse
{
    /** Assez pour voir un changement, trop peu pour aider une attaque. */
    const EMPREINTE = 16;

    public static function table()
    {
        return _DB_PREFIX_ . 'odys_sans_mdp';
    }

    public static function installDb()
    {
        $sql = 'CREATE TABLE IF NOT EXISTS `' . self::table() . '` (
            `id_customer` INT(11) NOT NULL,
            `empreinte` VARCHAR(32) NOT NULL,
            `date_add` DATETIME NOT NULL,
            PRIMARY KEY (`id_customer`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        return (bool) Db::getInstance()->execute($sql);
    }

    private static function empreinte($hash)
    {
        return Tools::substr((string) $hash, 0, self::EMPREINTE);
    }

    /** Ce compte vient d'etre cree sans que personne ne choisisse son mot de passe. */
    public static function marque($idCustomer, $hash)
    {
        $idCustomer = (int) $idCustomer;
        if (!$idCustomer || (string) $hash === '') {
            return false;
        }

        try {
            Db::getInstance()->delete('odys_sans_mdp', 'id_customer = ' . $idCustomer);

            return (bool) Db::getInstance()->insert('odys_sans_mdp', [
                'id_customer' => $idCustomer,
                'empreinte' => pSQL(self::empreinte($hash)),
                'date_add' => date('Y-m-d H:i:s'),
            ]);
        } catch (PrestaShopDatabaseException $e) {
            return false;
        }
    }

    /**
     * Ce client n'a-t-il toujours pas choisi de mot de passe ?
     *
     * Repond false des que le hachage a bouge, et oublie la marque au passage :
     * un compte qui a choisi son mot de passe redevient un compte ordinaire.
     */
    public static function jamaisChoisi($idCustomer, $hash)
    {
        $idCustomer = (int) $idCustomer;
        if (!$idCustomer) {
            return false;
        }

        $empreinte = Db::getInstance()->getValue(
            'SELECT `empreinte` FROM `' . self::table() . '`
             WHERE `id_customer` = ' . $idCustomer
        );
        if ($empreinte === false || $empreinte === null || $empreinte === '') {
            return false;
        }

        if (hash_equals((string) $empreinte, self::empreinte($hash))) {
            return true;
        }

        self::oublie($idCustomer);

        return false;
    }

    public static function oublie($idCustomer)
    {
        return (bool) Db::getInstance()->delete(
            'odys_sans_mdp', 'id_customer = ' . (int) $idCustomer
        );
    }
}
