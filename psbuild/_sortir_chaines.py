"""Sortir les chaines de la navigation des gabarits, une fois.

Les 49 gabarits du theme ont ete ecrits en francais, en dur. Pour qu'une
phrase existe en trois langues il faut d'abord qu'elle ait une cle : c'est
ce que fait {l s='...' d='Shop.Theme.Odys'}.

La cle EST la phrase francaise. Consequence voulue : tant qu'aucune
traduction n'est posee, PrestaShop rend la cle — le site francais ne bouge
donc pas d'un octet, et il ne peut pas bouger. Les traductions anglaises et
arabes arrivent ensuite, en base, par maj-langues.php.

Script a usage unique, garde pour montrer ce qui a ete fait. Il refuse de
tourner deux fois : chaque remplacement est verifie avant d'etre pose.

    python psbuild/_sortir_chaines.py
"""

import pathlib
import sys

DOMAINE = "Shop.Theme.Odys"
RACINE = pathlib.Path(__file__).parent.parent


def l(phrase):
    """Le {l} de Smarty, avec l'apostrophe echappee comme Smarty l'attend."""
    return "{l s='" + phrase.replace("'", "\\'") + "' d='" + DOMAINE + "'}"


# (fichier, [(ce qu'on cherche, ce qu'on pose), ...])
TRAVAIL = [
    ("psbuild/templates/_partials/header.tpl", [
        ('aria-label="Navigation principale"',
         'aria-label="' + l("Navigation principale") + '"'),
        ('aria-label="ODYS Parfum — Retour à l\'accueil"',
         'aria-label="' + l("ODYS Parfum — Retour à l'accueil") + '"'),
        ('<a href="{$odysUrlParfums}">Collection</a>',
         '<a href="{$odysUrlParfums}">' + l("Collection") + '</a>'),
        ('<li><a href="{$odysUrlHomme}">Homme</a></li>',
         '<li><a href="{$odysUrlHomme}">' + l("Homme") + '</a></li>'),
        ('<li><a href="{$odysUrlFemme}">Femme</a></li>',
         '<li><a href="{$odysUrlFemme}">' + l("Femme") + '</a></li>'),
        ('<li><a href="{$odysUrlUnisexe}">Unisexe</a></li>',
         '<li><a href="{$odysUrlUnisexe}">' + l("Unisexe") + '</a></li>'),
        ('<li><a href="{$odysUrlParfums}">Tous les parfums</a></li>',
         '<li><a href="{$odysUrlParfums}">' + l("Tous les parfums") + '</a></li>'),
        ('>Oud &amp; Boukhour</a>', '>' + l("Oud &amp; Boukhour") + '</a>'),
        ('>Coffrets</a>', '>' + l("Coffrets") + '</a>'),
        ('<li><a href="{$odysUrlDiffuseurs}">Diffuseurs</a></li>',
         '<li><a href="{$odysUrlDiffuseurs}">' + l("Diffuseurs") + '</a></li>'),
        ('<li><a href="{$odysUrlApropos}">À propos</a></li>',
         '<li><a href="{$odysUrlApropos}">' + l("À propos") + '</a></li>'),
        ('aria-label="Actions"', 'aria-label="' + l("Actions") + '"'),
        ('aria-label="Rechercher des parfums"',
         'aria-label="' + l("Rechercher des parfums") + '"'),
        ('aria-label="Ma liste de souhaits"',
         'aria-label="' + l("Ma liste de souhaits") + '"'),
        ('aria-label="Ouvrir le menu de navigation"',
         'aria-label="' + l("Ouvrir le menu de navigation") + '"'),
    ]),
    ("psbuild/templates/_partials/mobile-menu.tpl", [
        ('aria-label="Menu de navigation"',
         'aria-label="' + l("Menu de navigation") + '"'),
        ('aria-label="Fermer le menu"', 'aria-label="' + l("Fermer le menu") + '"'),
        ('<li><a href="{$urls.base_url}">Accueil</a></li>',
         '<li><a href="{$urls.base_url}">' + l("Accueil") + '</a></li>'),
        ('<summary class="mm-sum">Collection</summary>',
         '<summary class="mm-sum">' + l("Collection") + '</summary>'),
        ('class="mm-sub">Toute la collection</a>',
         'class="mm-sub">' + l("Toute la collection") + '</a>'),
        ('class="mm-sub">Homme</a>', 'class="mm-sub">' + l("Homme") + '</a>'),
        ('class="mm-sub">Femme</a>', 'class="mm-sub">' + l("Femme") + '</a>'),
        ('class="mm-sub">Unisexe</a>', 'class="mm-sub">' + l("Unisexe") + '</a>'),
        ('>Oud &amp; Boukhour</a>', '>' + l("Oud &amp; Boukhour") + '</a>'),
        ('>Coffrets</a>', '>' + l("Coffrets") + '</a>'),
        ('<li><a href="{$odysUrlDiffuseurs}">Diffuseurs</a></li>',
         '<li><a href="{$odysUrlDiffuseurs}">' + l("Diffuseurs") + '</a></li>'),
        ('<li><a href="{$odysUrlApropos}">À propos</a></li>',
         '<li><a href="{$odysUrlApropos}">' + l("À propos") + '</a></li>'),
        ('<li><a href="{$urls.pages.contact}">Contact</a></li>',
         '<li><a href="{$urls.pages.contact}">' + l("Contact") + '</a></li>'),
        (" · Fidélité</a>", " · " + l("Fidélité") + "</a>"),
        ('<li><a href="{$urls.pages.authentication}">Connexion</a></li>',
         '<li><a href="{$urls.pages.authentication}">' + l("Connexion") + '</a></li>'),
        ('<span class="mob-b cod">Paiement à la livraison</span>',
         '<span class="mob-b cod">' + l("Paiement à la livraison") + '</span>'),
    ]),
]


def main():
    total = 0
    for chemin, paires in TRAVAIL:
        p = RACINE / chemin
        s = p.read_text(encoding="utf-8")
        pose = 0
        for vieux, neuf in paires:
            n = s.count(vieux)
            if n == 0 and neuf in s:
                continue          # deja sortie lors d'un passage precedent
            if n == 0:
                sys.exit("introuvable dans %s : %s" % (chemin, vieux))
            s = s.replace(vieux, neuf)
            pose += n
        p.write_text(s, encoding="utf-8")
        print("  %-48s %2d chaine(s)" % (chemin, pose))
        total += pose
    print("  %d chaines sorties des gabarits" % total)
    return 0


if __name__ == "__main__":
    sys.exit(main())
