{*
 * ODYS Parfum — the flacon (European Maison)
 * Square glass, amber extrait, black cap on a gold collar, label in the
 * house type. Drawn inline so the label stays sharp and is set per product.
 * Params: num ('01'), name ("L'Icône"). Gradient ids are suffixed with num.
 *}
<svg class="odys-bottle" viewBox="0 0 220 304" role="img"
     aria-label="Flacon ODYS Parfum {$num|escape:'html':'UTF-8'} {$name|escape:'html':'UTF-8'}, extrait de parfum">
  <defs>
    <linearGradient id="obCap{$num}" x1="0" x2="1">
      <stop offset="0" stop-color="#1A1A1C"/><stop offset=".22" stop-color="#3B3B3E"/>
      <stop offset=".55" stop-color="#0B0B0C"/><stop offset="1" stop-color="#202022"/>
    </linearGradient>
    <linearGradient id="obGold{$num}" x1="0" x2="1">
      <stop offset="0" stop-color="#6E5222"/><stop offset=".35" stop-color="#E4CFA4"/>
      <stop offset=".62" stop-color="#B4863D"/><stop offset="1" stop-color="#5E451C"/>
    </linearGradient>
    <linearGradient id="obGlass{$num}" x1="0" x2="1">
      <stop offset="0" stop-color="#F3E3C6" stop-opacity=".55"/><stop offset=".07" stop-color="#8A5E24" stop-opacity=".5"/>
      <stop offset=".5" stop-color="#6B4516" stop-opacity=".35"/><stop offset=".93" stop-color="#8A5E24" stop-opacity=".5"/>
      <stop offset="1" stop-color="#F3E3C6" stop-opacity=".45"/>
    </linearGradient>
    <linearGradient id="obJuice{$num}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#8A5A1C"/><stop offset=".5" stop-color="#A06C28"/><stop offset="1" stop-color="#5A3810"/>
    </linearGradient>
    <radialGradient id="obGlow{$num}" cx=".35" cy=".3" r=".7">
      <stop offset="0" stop-color="#E7B868" stop-opacity=".45"/><stop offset="1" stop-color="#E7B868" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <ellipse cx="110" cy="298" rx="96" ry="5" fill="#000" opacity=".45"/>
  <rect x="78" y="84" width="64" height="18" fill="url(#obGlass{$num})"/>
  <rect x="20" y="98" width="180" height="196" rx="9" fill="url(#obGlass{$num})"/>
  <rect x="31" y="110" width="158" height="162" rx="4" fill="url(#obJuice{$num})"/>
  <rect x="31" y="110" width="158" height="162" rx="4" fill="url(#obGlow{$num})"/>
  <rect x="20" y="274" width="180" height="20" rx="7" fill="#F3E3C6" opacity=".16"/>
  <rect x="25" y="104" width="4" height="184" rx="2" fill="#FFF7E6" opacity=".38"/>
  <rect x="192" y="106" width="2.5" height="180" rx="1.2" fill="#FFF7E6" opacity=".22"/>
  <rect x="71" y="76" width="78" height="10" rx="1.5" fill="url(#obGold{$num})"/>
  <rect x="69" y="12" width="82" height="66" rx="5" fill="url(#obCap{$num})"/>
  <rect x="72" y="13" width="76" height="2.5" rx="1.2" fill="#FFFFFF" opacity=".14"/>
  <g fill="#F4E8D4" text-anchor="middle">
    <text class="ob-w" x="112.5" y="162">ODYS</text>
    <text class="ob-p" x="111.6" y="176">PARFUM</text>
    <text class="ob-n" x="110.5" y="210">{$num|escape:'html':'UTF-8'}</text>
    <text class="ob-name" x="111" y="225">{$name|escape:'html':'UTF-8'}</text>
    <text class="ob-x" x="110.75" y="262">EXTRAIT DE PARFUM</text>
  </g>
</svg>
