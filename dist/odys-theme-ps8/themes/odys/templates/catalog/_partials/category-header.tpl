{**
 * Classic wraps this whole header - the <h1> included - in
 * {if $listing.pagination.items_shown_from == 1}, so the second page of a
 * category has no heading at all: not for a screen reader, not for a search
 * engine. Every page gets its heading here; only the description and the
 * category image, which would be duplicated, stay on the first page.
 *}
<div class="block-category card card-block">
  <h1 class="h1">{$category.name}
    {if $listing.pagination.current_page > 1}
      <span class="odys-cat-page">page {$listing.pagination.current_page}</span>
    {/if}
  </h1>

  {if $listing.pagination.items_shown_from == 1}
    {if $category.description}
      <div id="category-description" class="text-muted">{$category.description nofilter}</div>
    {/if}
    {if !empty($category.image.large.url)}
      <div class="category-cover">
        <img src="{$category.image.large.url}" loading="lazy"
             alt="{if !empty($category.image.legend)}{$category.image.legend|escape:'html':'UTF-8'}{else}{$category.name|escape:'html':'UTF-8'}{/if}"
             width="141" height="180">
      </div>
    {/if}
  {/if}
</div>
