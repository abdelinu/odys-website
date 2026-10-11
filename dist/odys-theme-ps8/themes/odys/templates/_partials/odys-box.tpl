{*
 * ODYS Parfum — the crème coffret (European Maison)
 * Params: num ('01'), name ("L'Icône"). Decorative: the bottle carries the label.
 *}
<svg class="odys-box" viewBox="0 0 170 300" aria-hidden="true" focusable="false">
  <defs>
    <linearGradient id="obxFace{$num}" x1="0" x2="1">
      <stop offset="0" stop-color="#EDE3D2"/><stop offset=".85" stop-color="#E6DAC6"/><stop offset="1" stop-color="#D5C7AF"/>
    </linearGradient>
    <linearGradient id="obxLight{$num}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFFFF" stop-opacity=".22"/><stop offset=".5" stop-color="#FFFFFF" stop-opacity="0"/>
      <stop offset="1" stop-color="#111316" stop-opacity=".14"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="150" height="300" fill="url(#obxFace{$num})"/>
  <rect x="0" y="0" width="150" height="300" fill="url(#obxLight{$num})"/>
  <path d="M150 0h20v300h-20z" fill="#C4B397"/>
  <path d="M150 0h20v300h-20z" fill="url(#obxLight{$num})"/>
  <line x1="0" y1="10" x2="150" y2="10" stroke="#111316" stroke-opacity=".06"/>
  <g fill="#2A241D" text-anchor="middle">
    <text class="ob-w" x="77.5" y="92">ODYS</text>
    <text class="ob-p" x="76.6" y="106">PARFUM</text>
    <text class="ob-n" x="75.5" y="172">{$num|escape:'html':'UTF-8'}</text>
    <text class="ob-name" x="76" y="187">{$name|escape:'html':'UTF-8'}</text>
    <text class="ob-x" x="75.75" y="252">EXTRAIT DE PARFUM</text>
    <text class="ob-x" x="75.6" y="266">50 ML · 1.7 FL.OZ.</text>
  </g>
</svg>
