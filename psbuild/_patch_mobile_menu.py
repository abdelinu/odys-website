"""The hamburger did nothing — on phones, that is the whole navigation.

`toggleMenu()` existed and targeted the right ids, but the button carried no
`data-action`, so the theme's click delegation never called it. The button gets
one, and the function now keeps `aria-expanded` / `aria-hidden` in step, locks
the page behind the panel, closes on Escape, on a tap outside and on following
a link, and gives the panel a close control of its own.
"""
import pathlib
import sys

HERE = pathlib.Path(__file__).resolve().parent
fails = []


def edit(path, pairs, label=None):
    label = label or path.name
    text = path.read_text(encoding="utf-8", newline="")
    nl = "\r\n" if "\r\n" in text else "\n"
    for old, new, what in pairs:
        old, new = old.replace("\n", nl), new.replace("\n", nl)
        if old not in text and (new == "" or new in text):
            print("  OK   %s: %s (already applied)" % (label, what))
            continue
        n = text.count(old)
        print(("  OK   " if n == 1 else "  FAIL ") + "%s: %s" % (label, what))
        if n != 1:
            fails.append("%s: %s (%d)" % (label, what, n))
            continue
        text = text.replace(old, new, 1)
    path.write_text(text, encoding="utf-8", newline="")


# ── 1. the button the delegation never saw ───────────────────────────────
edit(HERE / "templates" / "_partials" / "header.tpl", [
    ('      <button class="ham" id="hamBtn" type="button"\n'
     '              aria-label="Ouvrir le menu de navigation"\n'
     '              aria-expanded="false" aria-controls="mobMenu">',
     '      <button class="ham" id="hamBtn" type="button" data-action="toggle-menu"\n'
     '              aria-label="Ouvrir le menu de navigation"\n'
     '              aria-expanded="false" aria-controls="mobMenu">',
     "hamburger carries data-action"),
])

# ── 2. a close control inside the panel ──────────────────────────────────
edit(HERE / "templates" / "_partials" / "mobile-menu.tpl", [
    ('     aria-label="Menu de navigation" aria-hidden="true">\n'
     '  <ul role="list">',
     '     aria-label="Menu de navigation" aria-hidden="true">\n'
     '  <button class="mob-x" type="button" data-action="close-menu"\n'
     '          aria-label="Fermer le menu">&times;</button>\n'
     '  <ul role="list">',
     "close button"),
])

CSS = """
/* the mobile menu's own close control, and a page that cannot scroll behind it */
.mob-x{position:absolute;top:10px;right:max(20px,calc(16px + var(--safe-l)));width:44px;height:44px;
  display:flex;align-items:center;justify-content:center;background:none;border:0;cursor:pointer;
  font-size:26px;line-height:1;color:var(--odys-sand,#E9D3AE)}
body.menu-open{overflow:hidden}

/* comfortable targets on a phone: 26px links are hard to hit */
@media (max-width:767px){
  .site-footer a,.nv-link,.ft a{display:inline-block;padding:7px 0;min-height:36px}
  .mob-menu li a{min-height:48px}
}
"""

css_path = HERE / "theme-additions.css"
css = css_path.read_text(encoding="utf-8", newline="")
if "mobile menu's own close control" in css:
    print("  OK   theme-additions.css (already applied)")
else:
    nl = "\r\n" if "\r\n" in css else "\n"
    css_path.write_text(css.rstrip() + nl + CSS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   theme-additions.css: close control, scroll lock, tap targets")

# ── 3. the function itself: ARIA, scroll lock, Escape, outside tap ───────
JS = """
/* ── Mobile menu ─────────────────────────────────────────────────────
   toggleMenu() only moved two classes; a panel that says aria-modal has
   to say whether it is open, stop the page scrolling behind it, and be
   dismissable without hunting for the hamburger again. */
(function () {
  function menu() { return document.getElementById('mobMenu'); }
  function button() { return document.getElementById('hamBtn'); }

  function setState(open) {
    var m = menu(), b = button();
    if (!m) return;
    m.classList.toggle('open', open);
    m.setAttribute('aria-hidden', open ? 'false' : 'true');
    if (b) {
      b.classList.toggle('open', open);
      b.setAttribute('aria-expanded', open ? 'true' : 'false');
      b.setAttribute('aria-label', open ? 'Fermer le menu de navigation' : 'Ouvrir le menu de navigation');
    }
    document.body.classList.toggle('menu-open', open);
    if (open) {
      var first = m.querySelector('a, button');
      if (first) first.focus({ preventScroll: true });
    }
  }

  window.odysSetMenu = setState;

  document.addEventListener('click', function (e) {
    var t = e.target;
    if (!t || !t.closest) return;
    var m = menu();
    if (!m) return;

    if (t.closest('#hamBtn, [data-action="toggle-menu"]')) {
      e.preventDefault();
      setState(!m.classList.contains('open'));
      return;
    }
    if (t.closest('[data-action="close-menu"]') || (m.classList.contains('open') && t.closest('#mobMenu a'))) {
      setState(false);
      return;
    }
    // a tap anywhere else closes it
    if (m.classList.contains('open') && !t.closest('#mobMenu')) {
      setState(false);
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu() && menu().classList.contains('open')) {
      setState(false);
      var b = button();
      if (b) b.focus();
    }
  });
})();
"""

js_path = HERE / "nuit.js"
js = js_path.read_text(encoding="utf-8", newline="")
if "odysSetMenu" in js:
    print("  OK   nuit.js (already applied)")
else:
    nl = "\r\n" if "\r\n" in js else "\n"
    js_path.write_text(js.rstrip() + nl + JS.replace("\n", nl), encoding="utf-8", newline="")
    print("  OK   nuit.js: menu state, Escape, outside tap, focus")

if fails:
    print("\n%d FAILED:" % len(fails))
    for f in fails:
        print("  " + f)
    sys.exit(1)
print("\nmobile navigation works")
