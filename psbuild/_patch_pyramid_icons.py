"""The pyramid's tier marks were emoji — a grey puff, a pink blossom, a green
fir — rendered by the system font in its own colours, next to label cells that
still carried the cream gradient of the light theme.

They become inline SVG drawn in currentColor, so each tier takes its colour
from the palette: pale champagne at the top, sand in the heart, deep amber at
the base — the same descent as the panel's gradient.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
TPL = HERE.parent / "ref" / "odys-theme-ps8" / "themes" / "odys" / "templates" / "catalog" / "product.tpl"

# 24×24, stroked, no fill: they inherit the tier's colour
MARKS = {
    "\U0001F4A8": (  # tête — the volatile top notes, drawn as a rising trail
        "Tête",
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" '
        'stroke-linecap="round" aria-hidden="true" focusable="false">'
        '<path d="M3 8h9a3 3 0 1 0-3-3"/><path d="M3 13h13a3.2 3.2 0 1 1-3.2 3.2"/>'
        '<path d="M3 18h6"/></svg>'),
    "\U0001F338": (  # cœur — the floral heart
        "Cœur",
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
        '<circle cx="12" cy="12" r="2.4"/>'
        '<path d="M12 9.6c0-2.4 1-4.1 2.6-4.1S17 7 15.6 8.7"/>'
        '<path d="M14.4 12c2.4 0 4.1 1 4.1 2.6S16.9 17 15.2 15.6"/>'
        '<path d="M12 14.4c0 2.4-1 4.1-2.6 4.1S7 16.9 8.4 15.2"/>'
        '<path d="M9.6 12c-2.4 0-4.1-1-4.1-2.6S7.1 7 8.8 8.4"/></svg>'),
    "\U0001F332": (  # fond — resins and woods
        "Fond",
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.3" '
        'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
        '<path d="M12 3 7.2 10h9.6L12 3Z"/><path d="M12 8.4 6 16.2h12L12 8.4Z"/>'
        '<path d="M12 16.2V21"/><path d="M9.6 21h4.8"/></svg>'),
}

text = TPL.read_text(encoding="utf-8", newline="")
done = 0
for emoji, (tier, svg) in MARKS.items():
    old = '<div class="ol-icon" aria-hidden="true">%s</div>' % emoji
    new = '<div class="ol-icon" aria-hidden="true">%s</div>' % svg
    if new in text:
        print("  OK   %s mark (already applied)" % tier)
        continue
    if old not in text:
        print("  FAIL %s mark not found" % tier)
        sys.exit(1)
    text = text.replace(old, new, 1)
    done += 1
    print("  OK   %s mark is an SVG now" % tier)
TPL.write_text(text, encoding="utf-8", newline="")

CSS = """
/* ── Pyramid tier marks ──────────────────────────────────────────────
   The label cells kept the cream gradient of the light theme, and the
   marks were emoji in whatever colours the system font felt like. Each
   tier now takes a colour from the palette and the mark inherits it. */
.olf-top .olf-lbl,.olf-heart .olf-lbl,.olf-base .olf-lbl{background:transparent}
.ol-icon{display:flex;align-items:center;justify-content:center;width:26px;height:26px;
  margin:0;font-size:0;border-radius:50%;
  border:1px solid currentColor;flex-shrink:0;opacity:.9}
.ol-icon svg{width:15px;height:15px;display:block}
.olf-top .ol-icon,.olf-top .ol-name{color:var(--odys-cream-soft,#F2E7D5)}
.olf-heart .ol-icon,.olf-heart .ol-name{color:var(--odys-sand,#E9D3AE)}
.olf-base .ol-icon,.olf-base .ol-name{color:var(--odys-gold,#C9A66B)}
.olf-lbl{width:auto}
@media (max-width:560px){.olf-lbl{flex-direction:row}}
"""

css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "Pyramid tier marks" in css:
    print("  OK   theme-additions.css (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: tier colours, no cream cells")

print("\npyramid marks: %d replaced" % done)
