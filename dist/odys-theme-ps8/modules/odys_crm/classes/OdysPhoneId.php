<?php
/**
 * Le numero de telephone comme identite de connexion.
 *
 * PrestaShop identifie un client par son e-mail : `ps_customer` n'a pas de
 * colonne telephone, et `Customer::getByEmail()` leve une exception si on lui
 * passe autre chose qu'un e-mail. Le numero vit sur l'adresse, ou il sert au
 * livreur, pas a la connexion.
 *
 * Cette table fait le pont : un numero normalise -> un client. Elle permet
 * deux choses et seulement deux :
 *
 *   * saisir son telephone a l'inscription, et le retrouver en back-office ;
 *   * taper son numero au lieu de son e-mail pour se connecter — le mot de
 *     passe reste exige, c'est une deuxieme facon de se nommer, pas une
 *     facon de se passer d'authentification.
 *
 * L'unicite est portee par l'index UNIQUE, pas par du code : deux inscriptions
 * simultanees avec le meme numero, c'est MySQL qui tranche. Consequence
 * assumee : un numero = un compte. Deux personnes qui partagent un telephone
 * ne peuvent pas toutes deux s'en servir pour se connecter ; la seconde garde
 * son e-mail. Sans unicite, « se connecter par telephone » n'a pas de sens.
 *
 * Les invites (`is_guest`) sont exclus : leur numero est deja sur l'adresse de
 * livraison, ils n'ont pas de mot de passe, et le meme numero qui recommande
 * une deuxieme fois creerait une collision sur l'index — donc une commande
 * bloquee.
 */
if (!defined('_PS_VERSION_')) {
    exit;
}

if (!class_exists('OdysCrmGuard')) {
    require_once __DIR__ . '/OdysCrmGuard.php';
}

class OdysPhoneId
{
    /** Ce que le client a tape, tel quel : c'est ce qu'on lui reaffiche. */
    const MAX_RAW = 32;

    public static function table()
    {
        return _DB_PREFIX_ . 'odys_phone';
    }

    public static function installDb()
    {
        // ponytail: une seule boutique. En multiboutique avec clients non
        // partages, l'index UNIQUE devrait porter sur (e164, id_shop).
        $sql = 'CREATE TABLE IF NOT EXISTS `' . self::table() . '` (
            `id_customer` INT(11) NOT NULL,
            `phone` VARCHAR(32) NOT NULL DEFAULT "",
            `e164` VARCHAR(20) NOT NULL,
            `date_upd` DATETIME NOT NULL,
            PRIMARY KEY (`id_customer`),
            UNIQUE KEY `e164` (`e164`)
        ) ENGINE=' . _MYSQL_ENGINE_ . ' DEFAULT CHARSET=utf8mb4;';

        return (bool) Db::getInstance()->execute($sql);
    }

    /**
     * « 06 84 51 94 44 », « +212684519444 », « 00212 6 84 51 94 44 » sont le
     * meme numero. Renvoie « 212684519444 », ou '' si ce n'est pas un numero
     * marocain lisible.
     */
    public static function normalise($raw)
    {
        return OdysCrmGuard::phoneE164((string) $raw);
    }

    /** Le numero tel que le client l'a saisi, pour le reafficher. */
    public static function stored($idCustomer)
    {
        if (!(int) $idCustomer) {
            return '';
        }

        return (string) Db::getInstance()->getValue(
            'SELECT `phone` FROM `' . self::table() . '`
             WHERE `id_customer` = ' . (int) $idCustomer
        );
    }

    /** Quel client detient deja ce numero. 0 si personne. */
    public static function takenBy($e164)
    {
        if ($e164 === '') {
            return 0;
        }

        return (int) Db::getInstance()->getValue(
            'SELECT p.`id_customer`
             FROM `' . self::table() . '` p
             INNER JOIN `' . _DB_PREFIX_ . 'customer` c
                     ON c.`id_customer` = p.`id_customer`
             WHERE p.`e164` = "' . pSQL($e164) . '"
               AND c.`deleted` = 0'
        );
    }

    /**
     * L'e-mail du compte joignable a ce numero — le seul endroit ou ce
     * module transforme un telephone en identite.
     *
     * Volontairement restrictif : un invite n'a pas de mot de passe, un compte
     * supprime ou desactive ne doit pas se connecter. Si rien ne correspond,
     * '' — l'appelant doit alors echouer comme sur un mot de passe faux, pas
     * reveler que le numero est inconnu.
     */
    public static function emailFor($e164)
    {
        if ($e164 === '') {
            return '';
        }

        return (string) Db::getInstance()->getValue(
            'SELECT c.`email`
             FROM `' . self::table() . '` p
             INNER JOIN `' . _DB_PREFIX_ . 'customer` c
                     ON c.`id_customer` = p.`id_customer`
             WHERE p.`e164` = "' . pSQL($e164) . '"
               AND c.`is_guest` = 0
               AND c.`deleted` = 0
               AND c.`active` = 1'
        );
    }

    /**
     * Associe le numero au client. false si le numero est illisible ou deja
     * pris par quelqu'un d'autre — y compris quand c'est l'index UNIQUE qui
     * le decouvre, deux inscriptions s'etant croisees.
     */
    public static function remember($idCustomer, $raw)
    {
        $idCustomer = (int) $idCustomer;
        $e164 = self::normalise($raw);
        if (!$idCustomer || $e164 === '') {
            return false;
        }

        $owner = self::takenBy($e164);
        if ($owner && $owner !== $idCustomer) {
            return false;
        }

        $row = [
            'id_customer' => $idCustomer,
            'phone' => pSQL(Tools::substr(trim((string) $raw), 0, self::MAX_RAW)),
            'e164' => pSQL($e164),
            'date_upd' => date('Y-m-d H:i:s'),
        ];

        // Deux temps, et surtout pas un REPLACE : REPLACE supprime la ligne qui
        // gene sur *n'importe quelle* cle unique, donc il volerait le numero au
        // client qui le detient si le controle ci-dessus et l'ecriture se
        // croisaient. On efface l'ancien numero de CE client, puis on insere ;
        // si l'index UNIQUE refuse, quelqu'un a pris le numero entre-temps et
        // c'est lui qui le garde.
        try {
            Db::getInstance()->delete('odys_phone', 'id_customer = ' . $idCustomer);

            return (bool) Db::getInstance()->insert('odys_phone', $row);
        } catch (PrestaShopDatabaseException $e) {
            return false;
        }
    }

    /**
     * Reprend les numeros deja connus des adresses existantes, pour que les
     * clients inscrits avant ce module puissent se connecter par telephone
     * sans rien faire. Les numeros ambigus (deux comptes, meme numero) sont
     * laisses de cote : mieux vaut un client qui garde son e-mail qu'un
     * numero qui ouvre le mauvais compte.
     *
     * @return array{repris:int, ambigus:int}
     */
    public static function backfill()
    {
        $rows = Db::getInstance()->executeS(
            'SELECT a.`id_customer`,
                    IFNULL(NULLIF(a.`phone_mobile`, ""), a.`phone`) AS phone
             FROM `' . _DB_PREFIX_ . 'address` a
             INNER JOIN `' . _DB_PREFIX_ . 'customer` c
                     ON c.`id_customer` = a.`id_customer`
             WHERE a.`deleted` = 0
               AND c.`deleted` = 0
               AND c.`is_guest` = 0
             ORDER BY a.`id_address` DESC'
        );

        $parNumero = [];
        $parClient = [];
        foreach ($rows ?: [] as $row) {
            $e164 = self::normalise($row['phone']);
            if ($e164 === '') {
                continue;
            }
            $id = (int) $row['id_customer'];
            // la premiere adresse vue gagne : ORDER BY DESC, donc la plus recente
            if (!isset($parClient[$id])) {
                $parClient[$id] = ['e164' => $e164, 'phone' => $row['phone']];
            }
            $parNumero[$e164][$id] = true;
        }

        $repris = 0;
        $ambigus = 0;
        foreach ($parClient as $id => $info) {
            if (count($parNumero[$info['e164']]) > 1) {
                ++$ambigus;
                continue;
            }
            if (self::remember($id, $info['phone'])) {
                ++$repris;
            }
        }

        return ['repris' => $repris, 'ambigus' => $ambigus];
    }
}
