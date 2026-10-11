{*
 * ODYS Parfums — Contact
 *
 * The inherited page had no <h1>: classic's contact.tpl empties
 * `page_header_container`, which is the block that holds the title, so
 * overriding `page_title` alone changes nothing. The header is restored
 * here instead — bad for a screen reader working out where it is, and bad
 * for the one page a worried customer goes looking for.
 *
 * Nothing else is touched: the form, its fields and its validation stay
 * exactly as the parent theme provides them.
 *}
{extends file='parent:contact.tpl'}

{block name='page_header_container'}
  <header class="page-header">
    <h1>Contactez-nous</h1>
  </header>
{/block}
