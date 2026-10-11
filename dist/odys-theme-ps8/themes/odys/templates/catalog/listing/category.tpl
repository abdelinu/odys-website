{**
 * PrestaShop renders a category through catalog/listing/category.tpl. The
 * theme's own listing lived at catalog/listing.tpl, a path nothing resolves,
 * so every category page fell back to classic's markup: no ODYS header, and
 * none of the olfactory family filters the design is built around.
 *
 * This is the one line that puts the theme's listing back in the route.
 *}
{extends file='catalog/listing.tpl'}
