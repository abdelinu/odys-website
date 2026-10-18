{*
 * ODYS Parfums — Main layout v5.0
 * Compatible: PrestaShop 8.0 → 9.1
 * ARIA: EAA-compliant (European Accessibility Act 2025)
 *}
<!DOCTYPE html>
<html lang="{$language.iso_code}"{if $language.is_rtl} dir="rtl"{/if}>
<head>
  <meta charset="utf-8"/>
  {* Clickjacking protection must come from an HTTP response header —
     browsers ignore frame-ancestors delivered in a <meta> tag, so the v3.1
     meta gave none. Set it on the server instead, e.g. in .htaccess:
       Header always set Content-Security-Policy "frame-ancestors 'none'"
       Header always set X-Frame-Options "DENY"                            *}
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <meta name="theme-color" content="#08090B"/>
  <meta name="color-scheme" content="dark"/>

  <title>{block name='head_title'}{$page.meta.title|escape:'html':'UTF-8'}{if $page.meta.title != $shop.name} | ODYS Parfums Maroc{/if}{/block}</title>
  {* La description est ecrite une fois et servie deux fois. Le bloc
     head_desc est surcharge par l'accueil et par les pages CMS, qui y
     posent un texte redige ; og:description, lui, lisait directement
     $page.meta.description. Sur l'accueil cette variable est vide : la
     balise `description` portait 166 caracteres et og:description rien du
     tout, donc un lien vers la page d'accueil colle dans WhatsApp
     s'affichait sans un mot. La capture resout le bloc une fois, surcharge
     comprise, et les deux balises ne peuvent plus diverger. *}
  {capture assign='odysDescription'}{block name='head_desc'}{$page.meta.description|escape:'html':'UTF-8'}{/block}{/capture}
  <meta name="description" content="{$odysDescription|trim nofilter}"/>
  {* current_url keeps the query string, so /parfums?utm_source=insta and
     /connexion?back=… each declared themselves canonical. Strip it: one
     page, one canonical URL. *}
  {* A link shared on WhatsApp is how most of this shop's traffic will arrive.
     PrestaShop's own og:title read "ODYS Parfums | ODYS Parfums" and there was
     no image at all, so every share was a grey rectangle. *}
  {assign var='odysOgTitle' value=$page.meta.title}
  {if isset($product.name) && $product.name}{assign var='odysOgTitle' value=$product.name}
  {elseif isset($category.name) && $category.name}{assign var='odysOgTitle' value=$category.name}{/if}
  {assign var='odysUrlCanonique' value=$urls.current_url|regex_replace:'/\?.*$/':''}
  {assign var='odysOgImage' value="`$urls.base_url`themes/odys/assets/img/odys-packshot.webp"}
  {if isset($product.cover.bySize.large_default.url) && $product.cover.bySize.large_default.url}
    {assign var='odysOgImage' value=$product.cover.bySize.large_default.url}
  {/if}
  {* ── Open Graph ────────────────────────────────────────────────────
     Un second jeu de balises suivait celui-ci et redeclarait og:title,
     og:type, og:locale et twitter:card. Quand une propriete Open Graph
     apparait deux fois, le comportement n'est pas defini : Facebook lit la
     premiere, d'autres moissonneurs la derniere. Sur une fiche produit,
     la seconde disait og:type="website" — soit, une fois sur deux, un
     lien partage qui perd sa carte produit.

     C'est le canal par lequel cette boutique se diffuse : un lien colle
     dans WhatsApp. Les doublons sont retires, et il manquait og:url, les
     dimensions de l'image et le prix, que les clients de messagerie
     utilisent pour composer la carte. *}
  <meta property="og:site_name" content="{$shop.name|escape:'html':'UTF-8'}"/>
  <meta property="og:type" content="{if isset($product.name)}product{else}website{/if}"/>
  <meta property="og:title" content="{$odysOgTitle|escape:'html':'UTF-8'}"/>
  <meta property="og:description" content="{$odysDescription|trim nofilter}"/>
  <meta property="og:image" content="{$odysOgImage|escape:'html':'UTF-8'}"/>
  {if isset($product.cover.bySize.large_default.width) && $product.cover.bySize.large_default.width}
    {* Sans dimensions, certains clients — WhatsApp le premier — renoncent a
       telecharger l'image et n'affichent qu'un lien nu. *}
    <meta property="og:image:width" content="{$product.cover.bySize.large_default.width|intval}"/>
    <meta property="og:image:height" content="{$product.cover.bySize.large_default.height|intval}"/>
  {/if}
  {* L'adresse a laquelle les partages doivent etre rattaches : sans elle,
     un lien avec ?utm_source=... compte comme une page differente. *}
  <meta property="og:url" content="{$odysUrlCanonique|escape:'html':'UTF-8'}"/>
  {if isset($product.price_amount) && $product.price_amount}
    <meta property="product:price:amount" content="{$product.price_amount|intval}"/>
    <meta property="product:price:currency" content="MAD"/>
  {/if}
  <meta property="og:locale" content="fr_MA"/>
  <meta property="og:locale:alternate" content="ar_MA"/>
  <meta name="twitter:card" content="summary_large_image"/>
  <link rel="canonical" href="{$odysUrlCanonique|escape:'html':'UTF-8'}"/>

  <meta name="geo.region" content="MA"/>
  <meta name="geo.placename" content="Casablanca, Maroc"/>

  {* The breadcrumb is on the page but was never described to a search
     engine, so results showed a bare URL instead of the path through the
     shop. Built from PrestaShop's own breadcrumb, so it cannot disagree with
     what the visitor sees. *}
  {if isset($breadcrumb.links) && $breadcrumb.links|@count > 1}
    <script type="application/ld+json">{literal}{{/literal}
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
      {foreach from=$breadcrumb.links item=crumb name=bc}
        {literal}{{/literal}
          "@type": "ListItem",
          "position": {$smarty.foreach.bc.iteration},
          {* escape:'javascript' turns L'Or into L'Or — valid JavaScript,
             invalid JSON, and the whole block is then ignored. json_encode
             emits the quotes itself and handles every character. *}
          "name": {$crumb.title|@json_encode nofilter},
          "item": {$crumb.url|@json_encode nofilter}
        {literal}}{/literal}{if !$smarty.foreach.bc.last},{/if}
      {/foreach}
      ]
    {literal}}{/literal}</script>
  {/if}

  {block name='head_schema'}
  <script type="application/ld+json">{literal}{"@context":"https://schema.org","@type":"Organization","@id":"https://odys.ma/#org","name":"ODYS Parfums","url":"https://odys.ma","foundingDate":"2026","address":{"@type":"PostalAddress","addressLocality":"Casablanca","addressCountry":"MA"}}{/literal}</script>
  {/block}

  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300&family=Jost:wght@300;400;500;600&family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Amiri:ital,wght@0,400;0,700;1,400&family=Tajawal:wght@300;400;500;700&display=swap" rel="stylesheet"/>

  {block name='stylesheets'}
  {include file="_partials/stylesheets.tpl" stylesheets=$stylesheets}
  {/block}

  {* The ambiance the Back Office holds for this product, printed after the
     stylesheet so it wins over the palettes the theme ships with. The module
     builds this string: every colour in it has already been reduced to
     #rrggbb and the image to a media URL, so nothing an employee typed
     reaches a CSS declaration unchecked. It is assembled in PHP rather than
     here because a stylesheet full of braces and a Smarty template do not
     share a page quietly. *}
  {if isset($odysAmbianceCss) && $odysAmbianceCss}
    <style>{$odysAmbianceCss nofilter}</style>
  {/if}

  {include file="_partials/javascript.tpl" javascript=$javascript.head vars=$js_custom_vars}
  {hook h='displayHeader'}
  {* Le bandeau d'annonces refuse ne doit pas reapparaitre d'une page a
     l'autre, ni clignoter. Le drapeau est donc lu ICI, dans la tete :
     app.js est charge en bas et en defer, il aurait rendu le bandeau
     visible le temps d'une image avant de le retirer, et toute la page
     aurait saute d'un cran. sessionStorage peut lever (navigation
     privee, cookies refuses) : le bandeau reste alors affiche. *}
  <script>{literal}try{if(sessionStorage.getItem('odysAnnFermee')==='1'){document.documentElement.classList.add('ann-fermee');}}catch(e){}{/literal}</script>
</head>

{* `oud` switches theme.css to the Oud & Boukhour smoke-and-amber layer *}
{* Real URLs for the categories and legal pages.
   PrestaShop requires {id} in a category URL, so /oud-boukhour would 404;
   import_catalogue.php records the ids as ODYS_CAT_* / ODYS_CMS_* and this
   asks $link for the canonical address. Falls back to the plain path, which
   is what the standalone preview uses. *}
{* $urls.pages.category is the id-less category controller and 404s;
   fall back to the home page rather than a dead link. *}
{assign var='odysUrlParfums' value=$urls.base_url}
{if Configuration::get('ODYS_CAT_PARFUMS')}{assign var='odysUrlParfums' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_PARFUMS'))}{/if}
{* the three perfume sections; each falls back to the whole collection so a
   shop that has not run the importer still has working links *}
{assign var='odysUrlHomme' value=$odysUrlParfums}
{if Configuration::get('ODYS_CAT_HOMME')}{assign var='odysUrlHomme' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_HOMME'))}{/if}
{assign var='odysUrlFemme' value=$odysUrlParfums}
{if Configuration::get('ODYS_CAT_FEMME')}{assign var='odysUrlFemme' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_FEMME'))}{/if}
{assign var='odysUrlUnisexe' value=$odysUrlParfums}
{if Configuration::get('ODYS_CAT_UNISEXE')}{assign var='odysUrlUnisexe' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_UNISEXE'))}{/if}
{assign var='odysUrlOud' value="`$urls.base_url`oud-boukhour"}
{if Configuration::get('ODYS_CAT_OUD')}{assign var='odysUrlOud' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_OUD'))}{/if}
{assign var='odysUrlCoffrets' value="`$urls.base_url`coffrets"}
{if Configuration::get('ODYS_CAT_COFFRETS')}{assign var='odysUrlCoffrets' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_COFFRETS'))}{/if}
{assign var='odysUrlLivraison' value="`$urls.base_url`livraison"}
{if Configuration::get('ODYS_CMS_LIVRAISON')}{assign var='odysUrlLivraison' value=$link->getCMSLink(Configuration::get('ODYS_CMS_LIVRAISON'))}{/if}
{assign var='odysUrlRetours' value="`$urls.base_url`retours"}
{if Configuration::get('ODYS_CMS_RETOURS')}{assign var='odysUrlRetours' value=$link->getCMSLink(Configuration::get('ODYS_CMS_RETOURS'))}{/if}
{assign var='odysUrlCgv' value="`$urls.base_url`cgv"}
{if Configuration::get('ODYS_CMS_CGV')}{assign var='odysUrlCgv' value=$link->getCMSLink(Configuration::get('ODYS_CMS_CGV'))}{/if}
{assign var='odysUrlConfidentialite' value="`$urls.base_url`confidentialite"}
{if Configuration::get('ODYS_CMS_CONFIDENTIALITE')}{assign var='odysUrlConfidentialite' value=$link->getCMSLink(Configuration::get('ODYS_CMS_CONFIDENTIALITE'))}{/if}
{assign var='odysUrlMentions' value="`$urls.base_url`mentions-legales"}
{if Configuration::get('ODYS_CMS_MENTIONS')}{assign var='odysUrlMentions' value=$link->getCMSLink(Configuration::get('ODYS_CMS_MENTIONS'))}{/if}
{assign var='odysUrlApropos' value="`$urls.base_url`a-propos"}
{if Configuration::get('ODYS_CMS_APROPOS')}{assign var='odysUrlApropos' value=$link->getCMSLink(Configuration::get('ODYS_CMS_APROPOS'))}{/if}
{assign var='odysUrlSavoirFaire' value="`$urls.base_url`savoir-faire"}
{if Configuration::get('ODYS_CMS_SAVOIRFAIRE')}{assign var='odysUrlSavoirFaire' value=$link->getCMSLink(Configuration::get('ODYS_CMS_SAVOIRFAIRE'))}{/if}
{assign var='odysUrlDiffuseurs' value="`$urls.base_url`diffuseurs"}
{if Configuration::get('ODYS_CAT_DIFFUSEURS')}{assign var='odysUrlDiffuseurs' value=$link->getCategoryLink(Configuration::get('ODYS_CAT_DIFFUSEURS'))}{/if}
{assign var='odysUrlFidelite' value="`$urls.base_url`fidelite"}
{if Configuration::get('ODYS_CMS_FIDELITE')}{assign var='odysUrlFidelite' value=$link->getCMSLink(Configuration::get('ODYS_CMS_FIDELITE'))}{/if}

{* On a category page $category is an array; on a product page PrestaShop
   passes a Category *object*, and reading it as an array is a fatal error
   ("Cannot use object of type Category as array") that took down every
   product page. Check the controller first — && short-circuits, so the array
   access is only ever evaluated on the category page. *}
{assign var='isOud' value=(isset($page.page_name) && $page.page_name == 'category' && isset($category.link_rewrite) && $category.link_rewrite == 'oud-boukhour')}
{* A product that names its ingredient re-tints its own page: a diffuser of
   fleur d'oranger reads as ivory and citrus leaf, one of ambre as warm resin.
   The brand chrome stays put - only the page around it changes. *}
{assign var='odysAmbiance' value=''}
{if isset($product.features)}
  {foreach from=$product.features item=odysAmbFeat}
    {if $odysAmbFeat.name == 'Ambiance'}{assign var='odysAmbiance' value=$odysAmbFeat.value}{/if}
  {/foreach}
{/if}
{* PrestaShop's own front-office scripts are gated on the body id that
   classic emits: checkout.js runs only when `$("#checkout").length === 1`
   and its terms-and-conditions modal only when `body#checkout` matches.
   Without the id the whole checkout behaviour layer is inert - the step
   navigation, the payment-option toggling, the enabling of the Commander
   button, and the modal that keeps the customer inside the tunnel when
   they open the terms. *}
<body id="{$page.page_name}" class="{$page.page_name}{if $customer.is_logged} logged-in{/if}{if $isOud} oud{/if} lang-{$language.iso_code}"{if $odysAmbiance} data-ambiance="{$odysAmbiance|escape:'html':'UTF-8'}"{/if} role="document">

  <a href="#main" class="skip-link">{l s='Aller au contenu principal' d='Shop.Theme.Odys'}</a>

  {include file='_partials/announcement-bar.tpl'}
  {include file='_partials/header.tpl'}
  {include file='_partials/mobile-menu.tpl'}
  {* Le panier qui s'ouvre sur le cote. Il existait depuis la maquette,
     avec ses styles et son script, mais n'etait inclus nulle part : son
     contenu venait d'un tableau JavaScript, pas de PrestaShop. Celui-ci
     montre le vrai panier, rendu par le serveur. *}
  {include file='_partials/cart-drawer.tpl'}
  {* No cart drawer: PrestaShop owns the cart, and a second panel with its
     own idea of the contents could only ever disagree with it. Adding to
     the cart confirms itself with a toast (see nuit.js). *}
  <div class="odys-toast" id="odysToast" role="status" aria-live="polite">
    <span id="odysToastMsg"></span>
    <a href="{$urls.pages.cart}?action=show">{l s='Voir le panier' d='Shop.Theme.Odys'}</a>
  </div>
  {include file='_partials/modals.tpl'}

  {* PrestaShop reports everything through $notifications - a failed login, a
     rejected voucher, a saved address. Nothing rendered them, so the whole
     site failed silently. *}
  {include file='_partials/notifications.tpl'}

  <main id="main" role="main" tabindex="-1">
    {block name='content'}{/block}
  </main>

  {* Modules hooked here (the newsletter, for one) render above the footer;
     below it they landed after </footer> with no styling. *}
  {hook h='displayFooterBefore'}

  {include file='_partials/footer.tpl'}

  {* Configuration::get() returns false when the key was never set, and
     |default only catches null/'' - the button linked to wa.me with no
     number. Set ODYS_WA_NUMBER in the odys_loyalty settings. *}
  {assign var='odysWa' value=Configuration::get('ODYS_WA_NUMBER')}
  {if $odysWa}
  <a href="https://wa.me/{$odysWa|escape:'url'}?text=Bonjour%20ODYS%20Parfums"
     class="wa-btn" target="_blank" rel="noopener noreferrer"
     aria-label="{l s='Contacter ODYS Parfums sur WhatsApp' d='Shop.Theme.Odys'}">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882l6.174-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.518-5.16-1.42l-.37-.22-3.66.855.87-3.56-.24-.38A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  </a>
  {/if}

  {* PrestaShop ships this modal in classic's checkout footer, which this
     layout does not render. checkout.js stops the click on the terms link and
     loads the CMS page into it, so the customer reads the conditions without
     leaving the tunnel; with no #modal in the page the link simply navigated
     away from the order, three fields and four steps in. *}
  {if $page.page_name == 'checkout'}
  <div class="modal fade js-checkout-modal" id="modal" tabindex="-1" role="dialog" aria-hidden="true">
    <div class="modal-dialog" role="document">
      <div class="modal-content">
        <button type="button" class="close" data-dismiss="modal"
                aria-label="{l s='Close' d='Shop.Theme.Global'}">
          <span aria-hidden="true">&times;</span>
        </button>
        <div class="js-modal-content"></div>
      </div>
    </div>
  </div>
  {/if}

  {block name='javascript'}
  {* Les phrases qu'app.js ecrit lui-meme dans la page.

     Un gabarit sait dire {l s='...'} ; un fichier .js, non — il est servi
     tel quel, les memes octets pour les trois langues. C'est pour cela que
     la boutique anglaise disait encore « Ajouter au Panier » : la phrase
     n'etait pas dans un gabarit, elle etait dans le JavaScript.

     Le gabarit les pose donc ici, traduites, et app.js les lit par leur
     cle. Chaque lecture garde le francais en repli : si ce bloc manque, la
     boutique parle francais plutot que de se taire. *}
  <script>
    window.odysMots = {
      "panierAjouter": "{l s='Ajouter au Panier' d='Shop.Theme.Odys'|escape:'javascript'}",
      "livraisonIncluse": "{l s='Livraison gratuite incluse' d='Shop.Theme.Odys'|escape:'javascript'}",
      "livraisonReste": "{l s='+ %montant% DH → Livraison gratuite' d='Shop.Theme.Odys'|escape:'javascript'}",
      "enviesAjouter": "{l s='Ajouter à mes envies' d='Shop.Theme.Odys'|escape:'javascript'}",
      "enviesEnregistre": "{l s='Enregistré dans mes envies' d='Shop.Theme.Odys'|escape:'javascript'}",
      "enviesRetirer": "{l s='Retirer %nom% de mes envies' d='Shop.Theme.Odys'|escape:'javascript'}",
      "retirer": "{l s='Retirer' d='Shop.Theme.Odys'|escape:'javascript'}",
      "article": "{l s='Article' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierAjoute": "{l s='%nom% — ajouté au panier' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierAjouteBouton": "{l s='✓ Ajouté !' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierIndispo": "{l s='Indisponible' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierEchec": "{l s='Ce parfum n\'a pas pu être ajouté au panier.' d='Shop.Theme.Odys'|escape:'javascript'}",
      "menuOuvrir": "{l s='Ouvrir le menu de navigation' d='Shop.Theme.Odys'|escape:'javascript'}",
      "menuFermer": "{l s='Fermer le menu de navigation' d='Shop.Theme.Odys'|escape:'javascript'}",
      "exemplaireAjouter": "{l s='Ajouter un exemplaire de %nom%' d='Shop.Theme.Odys'|escape:'javascript'}",
      "exemplaireRetirer": "{l s='Retirer un exemplaire de %nom%' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierRetirer": "{l s='Retirer %nom% du panier' d='Shop.Theme.Odys'|escape:'javascript'}",
      "panierVide": "{l s='Votre panier est vide.' d='Shop.Theme.Odys'|escape:'javascript'}",
      "monCompte": "{l s='Mon compte' d='Shop.Theme.Odys'|escape:'javascript'}",
      "monCompteFidelite": "{l s='Mon compte fidélité' d='Shop.Theme.Odys'|escape:'javascript'}",
      "pointFidelite": "{l s='+%nombre% point fidélité' d='Shop.Theme.Odys'|escape:'javascript'}",
      "pointsFidelite": "{l s='+%nombre% points fidélité' d='Shop.Theme.Odys'|escape:'javascript'}"
    };
  </script>
  {include file="_partials/javascript.tpl" javascript=$javascript.bottom}
  {/block}

</body>
</html>
