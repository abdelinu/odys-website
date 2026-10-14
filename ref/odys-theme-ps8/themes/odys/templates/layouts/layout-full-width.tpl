{*
 * ODYS Parfums — Main Layout v3.1
 * Compatible: PrestaShop 8.0 → 9.1
 * ARIA: EAA-compliant (European Accessibility Act 2025)
 *}
<!DOCTYPE html>
<html lang="{$language.iso_code}"{if $language.is_rtl} dir="rtl"{/if}>
<head>
  <meta charset="utf-8"/>
  <meta http-equiv="Content-Security-Policy" content="frame-ancestors 'none'"/>
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"/>
  <meta name="theme-color" content="#1B2A4A"/>
  <title>{block name='head_title'}{$page.meta.title|escape:'html':'UTF-8'} | ODYS Parfums Maroc{/block}</title>
  <meta name="description" content="{block name='head_desc'}{$page.meta.description|escape:'html':'UTF-8'}{/block}"/>
  <link rel="canonical" href="{$urls.current_url}"/>
  <meta property="og:title"  content="{$page.meta.title|escape:'html':'UTF-8'} | ODYS Parfums"/>
  <meta property="og:type"   content="website"/>
  <meta property="og:locale" content="fr_MA"/>
  <meta property="og:locale:alternate" content="ar_MA"/>
  <meta name="twitter:card"  content="summary_large_image"/>
  <meta name="geo.region"    content="MA"/>
  <meta name="geo.placename" content="Casablanca, Maroc"/>
  {* PS9.1: meta_keywords removed — no meta keywords tag *}
  {block name='head_schema'}
  <script type="application/ld+json">{"@context":"https://schema.org","@type":"Organization","@id":"https://odys.ma/#org","name":"ODYS Parfums","url":"https://odys.ma","foundingDate":"2026","address":{"@type":"PostalAddress","addressLocality":"Casablanca","addressCountry":"MA"}}</script>
  {/block}
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300&family=Jost:wght@300;400;500;600;700;800&display=swap" rel="stylesheet"/>
  {block name='stylesheets'}
  <link rel="stylesheet" href="{$urls.theme_assets}css/theme.css"/>
  {/block}
  {hook h='displayHeader'}
</head>
{* EAA: body role="document", skip-to-content link *}
{* PrestaShop's own front-office scripts are gated on the body id that
   classic emits: checkout.js runs only when `$("#checkout").length === 1`
   and its terms-and-conditions modal only when `body#checkout` matches.
   Without the id the whole checkout behaviour layer is inert - the step
   navigation, the payment-option toggling, the enabling of the Commander
   button, and the modal that keeps the customer inside the tunnel when
   they open the terms. *}
<body id="{$page.page_name}" class="{$page.page_name}{if $customer.is_logged} logged-in{/if} lang-{$language.iso_code}" role="document">

  {* EAA: Skip to main content — keyboard navigation *}
  <a href="#main" class="skip-link" tabindex="1">{l s='Aller au contenu principal' d='Shop.Theme.Odys'}</a>

  {include file='_partials/announcement-bar.tpl'}
  {include file='_partials/header.tpl'}
  {include file='_partials/mobile-menu.tpl'}
  {include file='_partials/cart-drawer.tpl'}
  {include file='_partials/modals.tpl'}

  <main id="main" role="main" tabindex="-1">
    {block name='content'}{/block}
  </main>

  {include file='_partials/footer.tpl'}

  <a href="https://wa.me/{Configuration::get('ODYS_WA_NUMBER')|default:'212600000000'}?text=Bonjour%20ODYS%20Parfums"
     class="wa-btn" target="_blank" rel="noopener noreferrer"
     aria-label="{l s='Contacter ODYS Parfums sur WhatsApp' d='Shop.Theme.Odys'}">
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.523 5.847L.057 23.882l6.174-1.44A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.886 0-3.65-.518-5.16-1.42l-.37-.22-3.66.855.87-3.56-.24-.38A9.944 9.944 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  </a>

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
  <script src="{$urls.theme_assets}js/app.js"></script>
  {/block}
  {hook h='displayFooterBefore'}
</body>
</html>
