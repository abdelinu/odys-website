"""Nuit — prepare the light-first ODYS stylesheet for the whole-site dark layer.

v5.0 was written light-first, so two tokens do double duty: cream is the page
ground *and* the text colour on black panels; ink/text is body copy *and* the
fill of a few dark panels. Flipping the tokens alone would put dark text on
dark buttons, so split those uses first — nuit.css then redefines the tokens.
The palette pass also left light colours as literal hex in inline styles,
which a token flip can't reach, and a few faint text tints that were already
below 4.5:1. Used on theme.css, on every .tpl and on the preview page.
"""
import re

ON_DARK = re.compile(r"(?<![-\w])(color|fill|stroke|-webkit-text-fill-color)(\s*:\s*)var\(--(?:odys-cream|ivory)\)")
WHITE_BG = re.compile(r"(?<![-\w])(background(?:-color)?)(\s*:\s*)(?:#fff(?:fff)?|white)(?![\w-])", re.I)
INK_BG = re.compile(r"(?<![-\w])(background(?:-color)?)(\s*:\s*)var\(--(?:ink|odys-text)\)")
GLASS = re.compile(r"(?<![-\w])(background(?:-color)?\s*:\s*)rgba\(\s*(?:245\s*,\s*235\s*,\s*221|255\s*,\s*255\s*,\s*255)\s*,\s*(0?\.[89]\d*)\s*\)")
# literal light grounds the v5.0 palette pass wrote into inline styles
LIGHT_BG = {"F5EBDD": "var(--odys-cream)", "EFE3D2": "var(--odys-cream-warm)",
            "E8D6C0": "var(--odys-champagne)", "F0F6F1": "var(--odys-success-bg)",
            "DCE9E0": "var(--odys-success-bg)"}
LIGHT_BG_RE = re.compile(r"(?<![-\w])(background(?:-color)?\s*:\s*)#(" + "|".join(LIGHT_BG) + r")(?![0-9A-Fa-f])", re.I)
MUTED_RE = re.compile(r"(?<![-\w])(color\s*:\s*)#(?:756B61|A08F78)(?![0-9A-Fa-f])", re.I)
# light text tints under ~45% alpha fail 4.5:1 on any dark ground
FAINT = re.compile(r"(?<![-\w])(color\s*:\s*)rgba\(\s*(255\s*,\s*255\s*,\s*255|245\s*,\s*235\s*,\s*221|237\s*,\s*224\s*,\s*206)\s*,\s*0?\.(?:[1-3]\d*|4[0-9]?)\s*\)")
GOLD_FAINT = re.compile(r"(?<![-\w])(color\s*:\s*)rgba\(\s*201\s*,\s*166\s*,\s*107\s*,\s*0?\.[1-6]\d*\s*\)")
# dark-on-light text literals that read as mud on the dark ground
TEXT_HEX = {"7A5C29": "var(--odys-gold-deep)", "8F6A2F": "var(--odys-gold-deep)", "8A2B20": "var(--odys-alert)"}
TEXT_HEX_RE = re.compile(r"(?<![-\w])(color\s*:\s*)#(" + "|".join(TEXT_HEX) + r")(?![0-9A-Fa-f])", re.I)
# the Oud layer's quietest parchment tint is a variable, not a declaration
PARCH_LOW = re.compile(r"(--parch-low\s*:\s*)rgba\(\s*237\s*,\s*224\s*,\s*206\s*,\s*0?\.4\s*\)")


def nuit_prep(text):
    counts = {}
    text, counts["on_dark"] = ON_DARK.subn(r"\1\2var(--odys-on-dark)", text)
    text, counts["surface"] = WHITE_BG.subn(r"\1\2var(--odys-surface)", text)
    text, counts["ink_bg"] = INK_BG.subn(r"\1\2var(--odys-black)", text)
    text, counts["glass"] = GLASS.subn(r"\1rgba(11,12,14,\2)", text)
    text, counts["light_bg"] = LIGHT_BG_RE.subn(lambda m: m.group(1) + LIGHT_BG[m.group(2).upper()], text)
    text, counts["muted"] = MUTED_RE.subn(r"\1var(--odys-muted)", text)
    text, counts["faint"] = FAINT.subn(lambda m: m.group(1) + "rgba(" + re.sub(r"\s", "", m.group(2)) + ",.64)", text)
    text, counts["gold_faint"] = GOLD_FAINT.subn(r"\1rgba(201,166,107,.9)", text)
    text, counts["text_hex"] = TEXT_HEX_RE.subn(lambda m: m.group(1) + TEXT_HEX[m.group(2).upper()], text)
    text, counts["parch_low"] = PARCH_LOW.subn(r"\1rgba(237,224,206,.64)", text)
    # the prototype's review page builds its panels from JS data (bg:'#…')
    text, counts["js_bg"] = re.subn(r"(\bbg:\s*')#(?:F5EBDD|F0F6F1)'",
                                    lambda m: m.group(1) + "#131417'", text, flags=re.I)
    return text, counts


if __name__ == "__main__":
    t, c = nuit_prep(".a{color:var(--odys-cream);background:#fff}"
                     ".b{background-color:var(--ink);border-color:#fff}"
                     ".c{background:rgba(245,235,221,.97)}.d{color:rgba(245,235,221,.55)}"
                     ".e{background:#ffffff08}.f{-webkit-text-fill-color:var(--ivory)}"
                     ".g{background:var(--odys-cream)}"
                     '<div style="background:#F5EBDD;color:#756B61">'
                     ".h{color:rgba(255,255,255,.4)}.i{color:rgba(245, 235, 221, 0.28)}"
                     ".j{border:1px solid rgba(255,255,255,.1)}.k{background:#F5EBDD80}"
                     ".l{color:rgba(201,166,107,.55)}.m{color:#8A2B20}.n{color:#7a5c29}"
                     ":root{--parch-low:rgba(237,224,206,.4);--parch-mid:rgba(237,224,206,.62)}")
    assert ".l{color:rgba(201,166,107,.9)}" in t and ".m{color:var(--odys-alert)}" in t, t
    assert ".n{color:var(--odys-gold-deep)}" in t, t
    assert "--parch-low:rgba(237,224,206,.64)" in t and "--parch-mid:rgba(237,224,206,.62)" in t, t
    t2, _ = nuit_prep("{color:'#0C1B26', bg:'#F5EBDD', border:'#CDB89E'}")
    assert "bg:'#131417'" in t2 and "border:'#CDB89E'" in t2, t2
    assert "color:var(--odys-on-dark)" in t and "background:var(--odys-surface)" in t, t
    assert "background-color:var(--odys-black)" in t and "border-color:#fff" in t, t
    assert "rgba(11,12,14,.97)" in t and "color:rgba(245,235,221,.55)" in t, t
    assert "#ffffff08" in t, t                      # 8-digit hex is not white
    assert "-webkit-text-fill-color:var(--odys-on-dark)" in t, t
    assert ".g{background:var(--odys-cream)}" in t, t   # grounds flip via tokens
    assert 'style="background:var(--odys-cream);color:var(--odys-muted)"' in t, t
    assert ".h{color:rgba(255,255,255,.64)}" in t and ".i{color:rgba(245,235,221,.64)}" in t, t
    assert "rgba(255,255,255,.1)" in t, t           # borders keep their tint
    assert "#F5EBDD80" in t, t                       # alpha hex is left alone
    print("nuit_prep ok", c)
