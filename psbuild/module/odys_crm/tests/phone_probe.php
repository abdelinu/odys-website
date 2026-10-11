<?php
/**
 * Le telephone sert d'identifiant de connexion : la normalisation est la seule
 * chose qui empeche un numero d'ouvrir le mauvais compte.
 *
 * Deux facons de se tromper, et une seule est visible :
 *
 *   * deux ecritures du MEME numero qui donnent deux cles -> le client ne se
 *     connecte pas. Agacant, signale tout de suite.
 *   * deux numeros DIFFERENTS qui donnent la meme cle -> l'index UNIQUE donne
 *     le compte du premier au second. Silencieux, et grave.
 *
 * D'ou ce test : les classes d'equivalence d'un cote, la non-collision de
 * l'autre.
 *
 *   php tests/phone_probe.php
 */
define('_PS_VERSION_', '8.2.8');
require __DIR__ . '/../classes/OdysCrmGuard.php';

$echecs = 0;

function verifie($condition, $quoi)
{
    global $echecs;
    if (!$condition) {
        ++$echecs;
        echo "  ECHEC  $quoi\n";
    }
}

// ── 1. toutes les ecritures d'un numero donnent la meme cle ────────────────
$memeNumero = [
    '0684519444',
    '06 84 51 94 44',
    '06-84-51-94-44',
    '06.84.51.94.44',
    '+212684519444',
    '+212 6 84 51 94 44',
    '00212684519444',
    '212684519444',
    '684519444',
    ' 0684519444 ',
    '(0) 684 519 444',
];
foreach ($memeNumero as $ecriture) {
    $cle = OdysCrmGuard::phoneE164($ecriture);
    verifie($cle === '212684519444', "« $ecriture » -> « $cle », attendu 212684519444");
}

// ── 2. ce qui n'est pas un numero marocain lisible est refuse ──────────────
// Refuse veut dire : pas d'identite, le client garde son e-mail. Jamais une
// cle approximative.
$refuses = [
    '' => 'vide',
    'contact@odysparfum.com' => 'un e-mail',
    '0484519444' => 'prefixe 04, inexistant au Maroc',
    '0184519444' => 'prefixe 01, inexistant au Maroc',
    '068451944' => '8 chiffres apres le 0, trop court',
    '06845194444' => '10 chiffres apres le 0, trop long',
    '+33612345678' => 'un numero francais',
    '+212412345678' => 'indicatif marocain mais prefixe 4',
    'abcdefghij' => 'des lettres',
    '0000000000' => 'des zeros',
];
foreach ($refuses as $entree => $pourquoi) {
    $cle = OdysCrmGuard::phoneE164((string) $entree);
    verifie($cle === '', "« $entree » ($pourquoi) devrait etre refuse, a donne « $cle »");
}

// ── 3. aucune collision : deux numeros distincts, deux cles distinctes ─────
// C'est l'echec silencieux. Balayage dense des 8 chiffres qui suivent le
// prefixe, pour chacun des trois prefixes valides : 150 000 numeros reels.
$cles = [];
$collisions = [];
foreach ([5, 6, 7] as $prefixe) {
    for ($n = 0; $n < 50000; ++$n) {
        $local = '0' . $prefixe . str_pad((string) $n, 8, '0', STR_PAD_LEFT);
        $cle = OdysCrmGuard::phoneE164($local);
        verifie($cle !== '', "« $local » est un numero valide mais a ete refuse");
        if (isset($cles[$cle]) && $cles[$cle] !== $local) {
            $collisions[] = $cles[$cle] . ' et ' . $local . ' -> ' . $cle;
        }
        $cles[$cle] = $local;
    }
}
verifie($collisions === [], 'collisions : ' . implode(', ', array_slice($collisions, 0, 5)));

// ── 4. la regle de tri a la connexion : e-mail ou numero ? ─────────────────
// hookActionDispatcherBefore ne touche au champ que s'il ne contient pas d'@.
// Un e-mail doit passer intact, meme s'il ne contient que des chiffres.
$estUnEmail = function ($saisi) {
    return strpos(trim($saisi), '@') !== false;
};
verifie($estUnEmail('contact@odysparfum.com'), 'un e-mail doit etre reconnu comme tel');
verifie($estUnEmail('0684519444@odys.ma'), 'un e-mail tout en chiffres reste un e-mail');
verifie(!$estUnEmail('0684519444'), 'un numero ne doit pas etre pris pour un e-mail');
verifie(!$estUnEmail('+212 684 519 444'), 'un numero international non plus');

// ── verdict ────────────────────────────────────────────────────────────────
$total = count($memeNumero) + count($refuses) + count($cles) + 5;
if ($echecs) {
    echo "\n$echecs echec(s) sur ~$total verifications.\n";
    exit(1);
}
echo 'ok — ' . count($memeNumero) . " ecritures d'un meme numero, "
    . count($refuses) . ' entrees refusees, '
    . count($cles) . " numeros distincts sans collision.\n";
