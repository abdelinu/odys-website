#!/usr/bin/env python3
"""Swap the v4 stock photography for unbranded Unsplash-License images.

The old set showed competitor bottles (Chanel, Miu Miu, JPG, Lancôme) and
off-subject shots (a hair mask, a suit, a pendant), and the same photo ids
were shared by perfume AND oud cards. Oud slots are matched by product name
first; every other slot is swapped by photo id. Idempotent.
usage: python photos.py odys-preview-v5.0.html
"""
import re, sys, pathlib

WOOD, ATTAR, ROLLON = "1583182363039-59eac8609ab2", "1738414808975-201966230c59", "1646149757906-e6e9e9a7c77f"
MABKHARA = "1684039568465-24c31d0cc80f"
OUD_BY_NAME = {
    "Hindi Assam A": WOOD, "Royal Hindi C": WOOD, "Thai Stick A": WOOD,
    "Royal Thai C": WOOD, "Oud": WOOD,
    "Royal Hindi B": ATTAR, "Royal Thai B": ATTAR,
    "Sampler Hindi": ROLLON, "Sampler Thai": ROLLON,
    "Boukhour Prestige": "1673551389008-98e0fcb7f263",   # brass censer, smoke
    "Boukhour Classique": "1617954095840-0427f79be4cf",  # cone, smoke, dark plate
    "Pack Oud Prestige": MABKHARA,
}
BY_ID = {
    "1615634260167-c8cdede054de": "1638295916768-459f6cf440bc",  # ODYS 01, home hero, trio
    "1608248597279-f99d160bfcbc": "1598634222670-87c5f558119c",  # ODYS 14 — noir
    "1585386959984-a4155224a1ad": "1774682061055-3bfe402e5a12",  # ODYS 07 — marine
    "1594938298603-c8148c4dae35": "1640869116016-93c00ba94b28",  # ODYS 22
    "1592945403244-b3fbafd7f539": "1720423514789-15a33e59fc81",  # Flacons tile
    "1599643477877-530eb83abc8e": MABKHARA,                      # Oud tile
    "1557170334-a9632e77c6e4": "1705899844877-81bb0a0665c1",    # ODYS 11 / 33, Flacons — was Miu Miu
}

path = pathlib.Path(sys.argv[1])
html = path.read_text(encoding="utf-8")

# Oud hero: the only 1600px image on the page.
html = html.replace("photo-1615634260167-c8cdede054de?w=1600", f"photo-{MABKHARA}?w=1600")

def repoint(m):
    after = html[m.end():m.end() + 400]
    tag = after[:after.find(">")] if ">" in after else after
    alt = re.search(r'alt="([^"]*)"', tag)
    names = re.findall(r"name:\s*[\"']([^\"']+)", html[max(0, m.start() - 400):m.start()])
    label = (alt.group(1) if alt else (names[-1] if names else "")).strip()
    return "photo-" + (OUD_BY_NAME.get(label) or BY_ID.get(m.group(1), m.group(1)))

html, n = re.subn(r"photo-(\d{10,13}-[0-9a-f]{12})", repoint, html)

# Brand moments need a moody ground, not a white product box: the home hero
# gets the flacon on black; the trio gets the dark flacon on a beige wall,
# which grades cleanly into Noir / Marine / Crème.
html = html.replace("photo-1638295916768-459f6cf440bc?w=560&q=85", "photo-1598634222670-87c5f558119c?w=1000&q=85")
html = html.replace("photo-1638295916768-459f6cf440bc?w=560&amp;q=82", "photo-1640869116016-93c00ba94b28?w=560&amp;q=82")  # trio src is entity-encoded
left = [k for k in BY_ID if k in html]
assert not left, f"rejected photo ids still present: {left}"

s, e = html.index('id="pg-oud"'), html.index('id="pg-flacons"')
oud = html[s:e]
assert "1583182363039" in oud and MABKHARA in oud, "oud slots did not pick up oud photography"
assert not any(k in oud for k in ("1598634222670", "1640869116016", "1638295916768")), \
    "a perfume bottle landed on an oud card"

path.write_text(html, encoding="utf-8")
print(f"{n} image references checked; rejected ids remaining: 0")
