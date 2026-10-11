"""Make config/theme.yml pass PrestaShop's ThemeValidator.

v3.1 shipped a theme.yml without `parent`, without `meta.available_layouts`
and without `theme_settings.default_layout`, and a tree missing 23 of the 32
files the validator demands (checkout, address, identity, order-detail, 404,
contact...). PrestaShop therefore refused to enable it at all:

    [ERROR] The selected theme "odys" is invalid

Declaring `classic` as the parent is the fix PrestaShop intends: anything the
ODYS theme does not override is inherited from classic, including those
templates and assets/js/theme.js.
"""
import re

LAYOUTS = """  available_layouts:
    layout-full-width:
      name: Full Width
      description: No side columns.
    layout-both-columns:
      name: Three Columns
      description: One central column and 2 side columns.
    layout-left-column:
      name: Two Columns, small left column
      description: Two columns with a small left column.
    layout-right-column:
      name: Two Columns, small right column
      description: Two columns with a small right column.
"""

# Every image type needs a `scope`. v3.1's had none, so enabling the theme
# raised "Undefined array key scope", wrote image types with no scope, and the
# shop then died with: There is no image type defined for "products".
IMAGE_TYPES = """  image_types:
    cart_default:
      width: 125
      height: 125
      scope: [ products ]
    small_default:
      width: 98
      height: 98
      scope: [ products, categories, manufacturers, suppliers ]
    medium_default:
      width: 452
      height: 452
      scope: [ products, manufacturers, suppliers ]
    home_default:
      width: 400
      height: 400
      scope: [ products ]
    large_default:
      width: 800
      height: 800
      scope: [ products, manufacturers, suppliers ]
    category_default:
      width: 960
      height: 400
      scope: [ categories ]
    stores_default:
      width: 170
      height: 115
      scope: [ stores ]
"""

THEME_SETTINGS = """

theme_settings:
  default_layout: layout-full-width
  layouts:
    category: layout-full-width
    best-sales: layout-full-width
    new-products: layout-full-width
    prices-drop: layout-full-width
    contact: layout-full-width
"""


def fix_theme_yml(yml):
    """Return (yml, notes). Idempotent."""
    notes = []

    if not re.search(r"(?m)^parent:", yml):
        yml, n = re.subn(r'(?m)^(version: "5\.0\.0")$',
                         lambda m: m.group(1) + "\nparent: classic", yml, count=1)
        if n != 1:
            raise SystemExit("FAILED: theme.yml: could not declare parent: classic")
        notes.append("theme.yml: parent: classic (inherits the 23 templates v3.1 lacked)")

    if "available_layouts:" not in yml:
        yml, n = re.subn(r"(?m)^  modules:$", lambda m: LAYOUTS + "  modules:", yml, count=1)
        if n != 1:
            raise SystemExit("FAILED: theme.yml: could not add meta.available_layouts")
        notes.append("theme.yml: meta.available_layouts added")

    if "scope:" not in yml:
        yml, n = re.subn(r"(?ms)^  image_types:\n(?:    .*\n)+",
                         lambda m: IMAGE_TYPES, yml, count=1)
        if n != 1:
            raise SystemExit("FAILED: theme.yml: could not rewrite global_settings.image_types")
        notes.append("theme.yml: image types given a scope (v3.1 had none, which broke the shop)")

    if "theme_settings:" not in yml:
        yml = yml.rstrip() + THEME_SETTINGS
        notes.append("theme.yml: theme_settings.default_layout added")

    for required in ("name:", "display_name:", "version:", "parent:", "available_layouts:",
                     "theme_settings:", "default_layout:"):
        if required not in yml:
            raise SystemExit(f"FAILED: theme.yml still missing {required}")

    return yml, notes


if __name__ == "__main__":
    sample = ('name: odys\ndisplay_name: "X"\nversion: "5.0.0"\nmeta:\n  compatibility:\n'
              '    from: "8.0.0"\n  modules:\n    to_enable:\n      - ps_mainmenu\n'
              'global_settings:\n  image_types:\n'
              '    cart_default:     { width: 125, height: 125 }\n'
              '    home_default:     { width: 400, height: 400 }\n')
    out, notes = fix_theme_yml(sample)
    assert "parent: classic" in out and "layout-full-width" in out, out
    assert out.count("available_layouts:") == 1
    assert "scope: [ products ]" in out and "stores_default:" in out, out
    assert "{ width: 125" not in out, "old inline image types left behind"
    again, notes2 = fix_theme_yml(out)
    assert again == out and notes2 == [], "not idempotent"
    print("theme_yml ok:", notes)
