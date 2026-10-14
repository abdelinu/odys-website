{*
 * ODYS Parfums — le choix de la langue
 *
 * Le gabarit du theme classic sert un menu deroulant Bootstrap et une icone
 * Material. Ce theme ne charge ni l'un ni l'autre : le menu ne s'ouvrait pas
 * et l'icone s'affichait en carre vide.
 *
 * Un seul bouton, qui porte la langue en cours, et qui s'ouvre sur les
 * trois. <details> fait cela sans une ligne de script : ouvert au clavier
 * comme a la main, annonce aux lecteurs d'ecran, et ferme par defaut.
 *
 * Chaque langue est ecrite dans sa propre langue — on ne demande pas a
 * quelqu'un de reconnaitre « Arabe » pour trouver l'arabe — et chaque lien
 * mene a la meme page dans l'autre langue : c'est getLanguageLink qui le
 * sait, pas nous.
 *
 * La langue d'arrivee, elle, n'a pas besoin de ce menu : PrestaShop lit
 * celle du navigateur (PS_DETECT_LANG) et sert la boutique dans cette
 * langue des la premiere page. Ce menu sert a en changer.
 *}
{if $languages|@count > 1}
  <details class="odys-lang">
    <summary class="odys-lang-cur">
      <span aria-hidden="true">{$current_language.iso_code|upper|escape:'html':'UTF-8'}</span>
      <span class="sr-only">Langue : {$current_language.name_simple|escape:'html':'UTF-8'}. Changer de langue</span>
      <i class="odys-lang-chev" aria-hidden="true"></i>
    </summary>
    <ul class="odys-lang-list" role="list">
      {foreach from=$languages item=language}
        <li>
          <a href="{$link->getLanguageLink($language.id_lang)}"
             hreflang="{$language.iso_code|escape:'html':'UTF-8'}"
             lang="{$language.iso_code|escape:'html':'UTF-8'}"
             {if $language.id_lang == $current_language.id_lang}aria-current="true" class="on"{/if}>
            {$language.name_simple|escape:'html':'UTF-8'}
          </a>
        </li>
      {/foreach}
    </ul>
  </details>
{/if}
