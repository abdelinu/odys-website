# Mise en ligne d'ODYS Parfums sur odysparfum.com

Hébergement mutualisé Hostinger (Unlimited Web Hosting), hPanel, PHP 8.1,
MySQL. La boutique démarre **en maintenance** : elle n'est visible que par
vous tant que vous ne l'ouvrez pas, à la dernière étape.

Les trois fichiers à utiliser sont dans `dist/deploy/` :

| Fichier | Quoi |
|---|---|
| `odysparfum-files.tar.gz` | le site, 29 209 fichiers, 79 Mo |
| `odysparfum-db.sql.gz` | la base : catalogue, pages, réglages |
| `parameters.php` | la configuration, 4 valeurs à renseigner |

---

## 1. Le domaine

hPanel → **Domaines**. `odysparfum.com` a été acheté avec l'hébergement, il
devrait déjà pointer sur ce compte. Vérifiez que les serveurs de noms sont
ceux de Hostinger (`ns1.dns-parking.com`, `ns2.dns-parking.com`).

La propagation DNS prend de quelques minutes à quelques heures. Vous pouvez
faire les étapes 2 à 7 sans l'attendre.

## 2. La base de données

hPanel → **Bases de données** → **Gestion des bases MySQL**.

Créez une base et un utilisateur. Hostinger préfixe les deux avec votre
identifiant de compte, par exemple `u123456789_odys`. **Notez les quatre
valeurs** : nom de la base, utilisateur, mot de passe, et l'hôte (`localhost`
sur le mutualisé).

Générez le mot de passe plutôt que de l'inventer, et ne le réutilisez nulle
part ailleurs.

## 3. Les fichiers

hPanel → **Gestionnaire de fichiers**, ouvrez `public_html`. S'il contient
une page d'accueil par défaut de Hostinger, supprimez-la.

Envoyez `odysparfum-files.tar.gz` dans `public_html`, puis clic droit →
**Extraire**. 29 209 fichiers : comptez quelques minutes.

> Le gestionnaire de fichiers plafonne l'envoi. Si l'archive est refusée,
> passez par FTP (hPanel → Comptes FTP) avec FileZilla, ou par SSH si votre
> offre l'inclut : `tar -xzf odysparfum-files.tar.gz`.

Vérifiez à la fin que `public_html/index.php` existe, et **pas**
`public_html/odysparfum-files/index.php` — l'archive s'extrait à plat.
Supprimez l'archive une fois extraite.

## 4. La base, importée

hPanel → **Bases de données** → **phpMyAdmin** sur la base créée à l'étape 2.

Onglet **Importer** → envoyez `odysparfum-db.sql.gz` (phpMyAdmin décompresse
le `.gz` tout seul). 148 Ko, c'est immédiat.

À la fin, l'onglet **Structure** doit montrer 282 tables.

## 5. La configuration

Éditez `parameters.php` (celui de `dist/deploy/`) et remplacez les quatre
valeurs `REMPLACER_…` par celles de l'étape 2 :

```php
'database_name' => 'u123456789_odys',
'database_user' => 'u123456789_odys',
'database_password' => 'le mot de passe genere',
'database_host' => 'localhost',
```

Envoyez-le ensuite dans `public_html/app/config/parameters.php`.

Les autres valeurs sont déjà bonnes. Les secrets (`cookie_key`, `secret`…)
ont été générés pour cette mise en ligne : ce ne sont pas ceux du
développement, qui traînaient dans le projet livré.

## 6. HTTPS

hPanel → **Sécurité** → **SSL**. Installez le certificat gratuit sur
`odysparfum.com` et activez **Forcer HTTPS**.

La base est déjà réglée pour exiger HTTPS partout. Faites donc cette étape
**avant** d'ouvrir le site, sinon PrestaShop redirigera vers une adresse en
`https://` qui n'existe pas encore.

## 7. Votre mot de passe d'administration

Le compte est `contact@odysparfum.com`. Son mot de passe a été remplacé par
une valeur que personne ne connaît — celui du développement ne devait pas
voyager.

Créez d'abord cette boîte mail : hPanel → **E-mails** → **Comptes e-mail**.

Puis, pour définir le mot de passe, créez `public_html/motdepasse.php` avec :

```php
<?php
require_once __DIR__ . '/config/config.inc.php';
$crypto = new PrestaShop\PrestaShop\Core\Crypto\Hashing();
Db::getInstance()->update('employee',
    ['passwd' => pSQL($crypto->hash('METTEZ-ICI-VOTRE-MOT-DE-PASSE'))],
    'email = "contact@odysparfum.com"');
echo 'ok';
```

> C'est bien `Hashing` et non `Tools::hash()`. Les deux permettent de se
> connecter — PrestaShop accepte encore l'ancien format par compatibilité —
> mais `Tools::hash()` enregistre un md5 de 32 caractères là où `Hashing`
> produit un bcrypt de 60. Pour le compte qui administre la boutique, la
> différence compte.

Ouvrez `https://odysparfum.com/motdepasse.php`, lisez `ok`, **puis supprimez
le fichier immédiatement**. Tant qu'il existe, n'importe qui peut s'en servir.

Connectez-vous ensuite sur `https://odysparfum.com/admin-odys/`.

## 8. L'envoi des e-mails

C'est la seule chose que la boutique n'a jamais su faire : aucun message n'est
jamais parti, ni confirmation de commande, ni réinitialisation de mot de passe.

Back Office → **Paramètres avancés** → **E-mail** → **Définir mes propres
paramètres SMTP** :

| Champ | Valeur |
|---|---|
| Domaine | `odysparfum.com` |
| Serveur SMTP | `smtp.hostinger.com` |
| Utilisateur | `contact@odysparfum.com` |
| Mot de passe | celui de la boîte mail |
| Chiffrement | SSL |
| Port | 465 |

Utilisez le **test d'envoi** en bas de la page avant de continuer. Tant qu'il
échoue, personne ne reçoit rien.

Une fois que le test passe, la page de confirmation de commande se remet à
annoncer l'e-mail toute seule : elle lit `PS_MAIL_METHOD` et ne promet un
message que si la boutique sait vraiment en envoyer.

## 8 bis. Regénérer .htaccess, robots.txt et le plan du site

### .htaccess — le plus important des trois

PrestaShop inscrit le domaine de la boutique **dans les règles de réécriture
des images** :

    RewriteCond %{HTTP_HOST} ^localhost:8080$
    RewriteRule ^(([\d])(?:\-[\w-]*)?)/.+(\.(?:jpe?g|webp|png|avif))$ … img/p/$2/$1$3

Sur un autre domaine, la condition ne correspond jamais : **aucune photo de
produit n'est servie**. Les fichiers sont bien là, c'est la réécriture qui ne
se déclenche pas. Dix occurrences du domaine, sept règles d'images.

La page s'affiche, le texte est correct, les prix sont corrects, et chaque
photo manque. Rien dans les journaux.

**Back Office → Paramètres de la boutique → Trafic & SEO → Enregistrer.**
PrestaShop réécrit `.htaccess` avec le domaine courant.

Vérifiez ensuite qu'une photo de produit répond :
`https://odysparfum.com/64-home_default/l-icone.jpg` doit renvoyer une image,
pas une page.



Ces deux-là sont des **fichiers statiques**, écrits une fois par la boutique de
développement et transportés tels quels dans l'archive. Ils annoncent donc
encore `http://localhost:8080` :

    # Directories for localhost:8080
    Sitemap: http://localhost:8080/1_index_sitemap.xml

Rien ne les met à jour tout seul, et aucun test de page ne les regarde : la
boutique fonctionne parfaitement avec un plan du site qui renvoie ailleurs.
Soumis à Google, il ne vaut pas mieux que rien.

**robots.txt** — Back Office → Paramètres de la boutique → **Trafic & SEO** →
tout en bas, **Générer le fichier robots.txt**.

**Plan du site** — Back Office → Modules → rechercher **Google sitemap**
(`gsitemap`) → Configurer → cocher les pages → **Mettre à jour le plan du
site**.

Vérifiez ensuite que `https://odysparfum.com/robots.txt` et
`https://odysparfum.com/1_index_sitemap.xml` ne contiennent plus le mot
`localhost`.

## 8 ter. Les coordonnées et les pages légales

`dist/deploy/coordonnees.php` et `coordonnees-pages.php` vont ensemble dans
`public_html/`. Ouvrez `https://odysparfum.com/coordonnees.php`, lisez la
sortie, **puis supprimez les deux fichiers**.

Il inscrit le téléphone (06 84 51 94 44), le numéro WhatsApp, l'adresse
(Sidi Maarouf, Casablanca) et `contact@odysparfum.com`, route le sujet
« Service client » du formulaire vers `sav@odysparfum.com`, et remplace le
texte des trois pages légales par la version qui porte ces coordonnées.

Sans ces clés, le bouton WhatsApp et le bouton « appeler » ne s'affichent
pas du tout — le thème les masque quand le numéro est vide, sans rien
signaler.

Il reste ensuite sept marqueurs `[À COMPLÉTER]`, tous des données
d'immatriculation : RC, ICE, IF, capital social, forme juridique, nom du
représentant légal, et le numéro CNDP. Ils se modifient dans le Back Office,
**Conception → Pages**.

## 8 quater. Les formats vendables (50 / 100 / 150 ml…)

Jusqu'ici le volume était une **caractéristique** : une ligne de texte dans
l'onglet Caractéristiques, affichée sur la fiche et rien de plus. Le
« Jardin de Fès » disait 100 ml parce que quelqu'un l'avait écrit, pas parce
que c'était le seul format en vente.

PrestaShop appelle **déclinaison** une variante achetable d'un produit. Un
diffuseur en 50, 100 et 150 ml, c'est un produit et trois déclinaisons,
chacune avec son prix, sa référence et son stock.

### Ce qu'il faut mettre en ligne

**Un seul fichier : `maj-formats.php`** (dans `Downloads/odys-deploy/`, 185 Ko).
Déposez-le dans `public_html/`, ouvrez
`https://odysparfum.com/maj-formats.php`, lisez le compte rendu, puis
supprimez-le.

> **Pourquoi pas une archive.** Le gestionnaire de fichiers de Hostinger
> refuse d'écrire sur un chemin qui existe déjà : il répond **409 Conflict**
> et n'écrit rien. Or `themes/odys/` est en place depuis la mise en ligne, et
> cette mise à jour ne fait que remplacer quatre fichiers dedans. Extraire une
> archive par-dessus ne peut donc pas marcher. Les quatre fichiers voyagent
> dans le PHP lui-même, compressés et encodés, et PHP les écrit — il écrase
> sans discuter.
>
> Le script garde une copie de chaque fichier remplacé, à côté, suffixée
> `.avant-formats` : si quelque chose déplaît, il suffit de renommer. Il
> n'écrit que sous `themes/odys/`. Relancé deux fois, il refait exactement la
> même chose et conserve la sauvegarde du premier passage.

Les quatre fichiers :

| | |
|---|---|
| `themes/odys/templates/catalog/product.tpl` | le sélecteur lit les vraies déclinaisons |
| `themes/odys/templates/checkout/cart.tpl` | la ligne de panier dit « 150 ml » et non « Array » |
| `themes/odys/assets/js/app.js` | le format choisi est celui mis au panier |
| `themes/odys/assets/css/theme.css` | les cartes acceptent un libellé long, un format épuisé se voit |

Le vocabulaire des formats — le groupe d'attributs **Contenance** et ses six
valeurs de départ (30, 50, 75, 100, 150, 200 ml) — est posé séparément par
`volumes.php`, livré avec `import_catalogue.php`. Sur une boutique déjà en
ligne, il se dépose dans `public_html/`, s'ouvre une fois, puis **se
supprime**. Il retire aussi Taille / Couleur / Dimension / Type de papier, les
groupes de démonstration de PrestaShop — seulement s'ils ne servent à rien,
ce qu'il vérifie.

Ni l'un ni l'autre ne crée de déclinaison, et aucun n'invente de prix.

Ensuite, **Paramètres avancés → Performances → Vider le cache**, et Ctrl+F5
dans le navigateur : les fichiers combinés portent un nom calculé sur la
*liste* des fichiers, pas sur leur contenu, donc l'ancienne feuille de style
resterait en place.

### Déclarer les formats d'un produit

1. **Catalogue → Produits**, ouvrez le produit.
2. Onglet **Déclinaisons** → *Générer des déclinaisons*.
3. Choisissez **Contenance**, cochez les volumes que vous vendez réellement
   pour ce produit — 50 et 150 ml seulement, si c'est le cas — puis générez.
4. Pour chaque ligne : **Impact sur le prix** (l'écart au prix de base, en
   plus ou en moins) ou un prix fixe, la **quantité**, et une **référence**.
5. Cochez **Par défaut** sur le format proposé à l'ouverture de la page.

La fiche produit affiche alors une carte par format, au bon prix, et c'est
celle que le client clique qui part au panier.

Pour ajouter un volume qui n'est pas dans la liste — 15 ml, 250 ml, ou un
libellé comme « Coffret 3 × 50 ml » — **Catalogue → Attributs et
caractéristiques → Contenance → Ajouter une valeur**. Le libellé s'affiche
tel quel sur la carte.

Un format en rupture reste visible, grisé, marqué « Épuisé » : le retirer
ferait croire qu'il n'existe pas.

## 8 quinquies. Une note par valeur

Les trois étages de la pyramide étaient stockés comme une phrase :
« Néroli, Citron » dans **une seule** valeur de caractéristique. La fiche
l'affichait découpée en pastilles, ce qui donnait le change, mais en Back
Office la ligne était indivisible — changer Citron demandait de retaper toute
la liste — et la liste déroulante proposait « Néroli, Citron » comme un bloc,
jamais « Néroli » seul.

Depuis PrestaShop 1.7, `ps_feature_product` a pour clé
`(id_feature, id_product, id_feature_value)` : une caractéristique **peut**
porter plusieurs valeurs sur un produit. Chaque note devient donc une valeur à
part.

`maj-notes.php` (dans `Downloads/odys-deploy/`) fait les deux choses, qui ne
se séparent pas :

1. il pose les fichiers de thème modifiés — `product.tpl`, la carte de liste,
   le menu mobile et la feuille de style — dont celui qui rassemble les notes
   d'un étage avant de les afficher — sans lui, le bloc « Tête » se répéterait autant de fois
   qu'il y a de notes ;
2. il découpe les valeurs composées existantes, et retire de la liste
   déroulante celles que plus aucun produit ne porte.

À déposer dans `public_html/`, à ouvrir une fois, **puis à supprimer**. Puis
vider le cache (Paramètres avancés → Performances).

Ensuite, fiche produit → **Détails** → *Caractéristiques* : une ligne par
note, la corbeille retire celle-là seule, et la liste déroulante propose
toutes les notes déjà employées ailleurs dans le catalogue.

Le découpage sur la virgule reste actif à l'affichage : si vous retapez un
jour « Néroli, Citron » dans un seul champ, la fiche affiche toujours deux
pastilles.

## 8 sexies. Le catalogue des parfums

Les six pyramides venaient du prototype et ne correspondaient pas aux
fragrances dont la boutique s'inspire — **L'Icône** était décrite comme un
Sauvage pour homme alors que c'est un féminin inspiré de L'Impératrice, et les
cinq autres portaient des notes approchantes plutôt que les vraies.

`maj-catalogue.php` (dans `Downloads/odys-deploy/`, 520 Ko) :

- corrige les six pyramides et le « Inspiré de » de chacune ;
- crée **sept parfums** : L'Écarlate, Le Serment, Le Serment Absolu, Le Nuage,
  La Vanille, L'Oasis, La Brise ;
- redécoupe les notes, une valeur par note, et retire de la liste déroulante
  les valeurs composées devenues orphelines ;
- vérifie le groupe d'attributs Contenance.

À déposer dans `public_html/`, à ouvrir une fois, **puis à supprimer**. Il se
déplie dans un dossier temporaire, travaille, et efface le dossier : rien à
nettoyer en plus.

> **Ce qu'il remet aussi à jour**, parce que l'import fait l'ensemble du
> catalogue : pages légales, coordonnées, catégories, réglages pays. Ce sont
> les mêmes valeurs qu'aujourd'hui, donc rien ne change. Il repasse en
> revanche `active = true` sur les 27 articles : un produit que vous auriez
> désactivé en Back Office redeviendrait visible.
>
> Il ne touche **pas** au stock d'un produit qui a des déclinaisons — vérifié :
> les quantités saisies par format survivent au passage.

**Les photos.** Les sept nouveaux reçoivent le visuel générique, comme les six
autres : le catalogue ne compte que 15 images distinctes pour 65 fichiers, et
la même photo sert 30 fois. À remplacer produit par produit, onglet
**Images** de la fiche.

**Les prix.** Les sept sont à 69 DH, le prix de la ligne standard. C'est une
décision commerciale, pas technique : à revoir en Back Office.

**L'ordre des notes** dans un étage suit l'ordre de création des valeurs dans
la base, pas celui du catalogue — `ps_feature_product` n'a pas de colonne de
position. Un étage est un ensemble de notes, pas une séquence ; c'est l'étage
lui-même (tête, cœur, fond) qui porte le sens.

## 8 septies. Le menu mobile

« Collection » étalait Homme, Femme et Unisexe dès l'ouverture du menu, et
poussait Oud, Coffrets et Diffuseurs sous la ligne de flottaison. Elle se
déplie maintenant au toucher.

C'est un `<details>` : pas une ligne de script, fermé par défaut, ouvert au
clavier comme à la main, annoncé aux lecteurs d'écran. Le lien vers la
collection entière, que le titre portait, est devenu la première entrée du
dépliant — « Toute la collection ».

Au passage, les trois liens étaient des `<a>` posés directement dans le
`<ul>`, ce que la spécification HTML interdit. Ils sont dans un `<li>`.

Livré par `maj-notes.php`, avec les autres fichiers de thème.

## 9. Avant d'ouvrir

- Back Office → **Paramètres de la boutique** → **Coordonnées** : vérifiez
  l'adresse et le téléphone affichés aux clients.
- **Paramètres avancés** → **Performances** : laissez le cache activé, et
  videz-le une fois (`Vider le cache`).
- Passez **une vraie commande** de bout en bout, paiement à la livraison, et
  vérifiez qu'elle arrive dans **Commandes** et dans **Clients → ODYS CRM**.
- Vérifiez que l'e-mail de confirmation est bien arrivé.

## 10. Ouvrir la boutique

Back Office → **Paramètres de la boutique** → **Maintenance** → mettez
**Activer la boutique** sur Oui.

---

## Ce qui reste à faire après la mise en ligne

**Les mentions légales sont incomplètes.** Onze marqueurs `[À COMPLÉTER]`
attendent des informations que vous seul détenez — et un numéro ICE ne
s'invente pas :

| Page | À renseigner |
|---|---|
| Mentions légales | forme juridique (SARL / SARL AU…), adresse complète du siège, ICE, IF / taxe professionnelle, RC, capital social, nom et qualité du représentant légal, e-mail, numéro WhatsApp |
| À propos | adresse de l'atelier, numéro, e-mail |
| Confidentialité | raison sociale exacte, adresse du siège, e-mail dédié aux demandes de données, n° de déclaration CNDP le cas échéant |
| Savoir-faire | durée de macération |

Les CGV, elles, sont complètes : quinze articles, droit marocain, et le
tunnel de commande pointe désormais dessus.

**Autres points connus :**

- Les photos produits sont des visuels de travail. Le flacon de « L'Or »
  porte encore l'étiquette « 01 L'ICÔNE ».
- Le paiement par chèque est proposé au client. Si vous n'en voulez pas :
  Modules → `ps_checkpayment` → Désactiver.
- Pensez à créer la fiche **Google Business Profile** et à déclarer le site
  dans **Google Search Console** (le sitemap est à
  `https://odysparfum.com/1_fr_0_sitemap.xml`).

## Si quelque chose ne va pas

**Page blanche.** Les droits : les dossiers en 755, les fichiers en 644.
`var/` et `img/` doivent être inscriptibles.

**« Impossible de se connecter à la base ».** Les quatre valeurs de
`parameters.php` (étape 5), en particulier le préfixe `u123456789_`.

**Le site boucle en redirections.** HTTPS pas encore actif alors que la base
l'exige. Terminez l'étape 6 ; en dépannage, passez `PS_SSL_ENABLED` et
`PS_SSL_ENABLED_EVERYWHERE` à `0` dans `ps_configuration` via phpMyAdmin.

**Le Back Office s'ouvre mais le site reste en travaux.** C'est voulu
jusqu'à l'étape 10.

**Le thème s'affiche sans style.** Videz le cache : Paramètres avancés →
Performances → Vider le cache. Les fichiers combinés portent un nom calculé
sur la *liste* des fichiers et non leur contenu, donc un navigateur qui est
déjà passé garde l'ancienne feuille : rechargez avec Ctrl+F5.
