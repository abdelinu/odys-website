"""Walk the whole shop and report anything that would embarrass it on launch day.

    python crawl.py                     # the shop on localhost:8080
    python crawl.py --base http://…     # somewhere else
    python crawl.py --max 400           # crawl further

What it looks for, on every page it can reach from the home page:

  * an HTTP status that is not 200
  * a PHP warning or notice printed into the HTML — in production these are
    hidden, so the symptom is a silently broken attribute rather than a
    visible error, which is the worst kind
  * "Array to string conversion", which means a template printed a structure
    where a string belongs
  * an untranslated Smarty tag or an unrendered variable left in the output
  * a link that goes nowhere: empty href, href="Array", or an internal URL
    that answers 4xx/5xx
  * an image whose file is missing
  * a page with no <title> or no <h1>

Every internal link and image is fetched once, cached, and reported with the
pages that pointed at it, so a broken link is traced to where it lives.
Exits non-zero when anything was found, so it can gate a release.
"""
import argparse
import collections
import io
import html
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

WARN = re.compile(
    r"(var/cache/\w+/smarty|Warning</b>|Notice</b>|Fatal error|Undefined array key"
    r"|Undefined variable|Array to string conversion|Trying to access array offset)",
    re.I)
# a Smarty tag that survived into the output, e.g. {$product.name} or {l s=…}
LEFTOVER = re.compile(r"\{\$[a-z_][\w.\[\]']*\}|\{l\s+s=", re.I)
HREF = re.compile(r"""<a\b[^>]*?href\s*=\s*["']([^"']*)["']""", re.I)
IMG = re.compile(r"""<img\b[^>]*?src\s*=\s*["']([^"']*)["']""", re.I)
TITLE = re.compile(r"<title[^>]*>(.*?)</title>", re.I | re.S)
H1 = re.compile(r"<h1\b", re.I)

SKIP = re.compile(r"^(mailto:|tel:|javascript:|#|data:|https://wa\.me)", re.I)
# these change state or are endless; visiting them proves nothing
NO_CRAWL = re.compile(
    r"(logout|mylogout|\?add=|deleteProduct|delete=|token=|\.pdf$|/panier\?|action=show"
    # PrestaShop's sign-in link carries back=<current url>. Follow it from a
    # page that already has one and the parameter nests inside itself, growing
    # by a round of percent-encoding each hop until the server answers 414.
    # The link is still checked once; it is only not walked through.
    r"|order-detail|[?&]back=|index\.php\?controller=pdf)", re.I)


# PrestaShop decides which shop a request belongs to from the Host header. Ask
# 127.0.0.1 without one and it does not recognise the shop: the pages still
# answer 200, but a category renders none of its own products. The crawl was
# reading that degraded rendering and calling it clean. We connect to an
# address Python can reach and say which shop we came for.
SHOP_DOMAIN = ""

# Seconds to wait between requests. Zero against a container on this machine,
# where hammering costs nothing. Against a real host it must not be: a shared
# host defends itself, and the first run against production came back with
# 1415 "unreachable" pages that every answered 200 when asked one at a time.
# A crawler that trips the host's rate limiter reports the limiter, not the
# shop, and the two are indistinguishable in the output.
DELAY = 0.0


def get(url, timeout=40, retries=2):
    headers = {
        "User-Agent": "odys-prelaunch-crawler",
        "Accept": "text/html,*/*",
    }
    if SHOP_DOMAIN:
        headers["Host"] = SHOP_DOMAIN
    req = urllib.request.Request(url, headers=headers)
    for attempt in range(retries + 1):
        if DELAY:
            time.sleep(DELAY)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as r:
                body = r.read()
                return r.status, r.headers.get("Content-Type", ""), body
        except urllib.error.HTTPError as e:
            return e.code, e.headers.get("Content-Type", "") if e.headers else "", b""
        except Exception as e:                               # noqa: BLE001
            # A dropped connection is usually the host throttling, not a broken
            # page. Back off and ask again before believing it.
            if attempt == retries:
                return 0, str(e), b""
            time.sleep(max(DELAY, 0.5) * (attempt + 2))
    return 0, "unreachable", b""


def main():
    # a Windows console is cp1252 by default and cannot print a box character
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    ap = argparse.ArgumentParser()
    # 127.0.0.1, not localhost: Python resolves localhost to ::1 first and the
    # container publishes on IPv4 only
    ap.add_argument("--base", default="http://127.0.0.1:8080")
    ap.add_argument("--max", type=int, default=250)
    ap.add_argument("--domain", default="localhost:8080",
                    help="the shop's own domain, sent as the Host header")
    ap.add_argument("--delay", type=float, default=0.0,
                    help="seconds between requests; use ~1 against a real host")
    args = ap.parse_args()
    global SHOP_DOMAIN, DELAY
    DELAY = args.delay
    base = args.base.rstrip("/")
    host = urllib.parse.urlparse(base).netloc
    SHOP_DOMAIN = args.domain if args.domain != host else ""
    port = urllib.parse.urlparse(base).port

    # PrestaShop writes its own domain into every link (localhost:8080), while
    # this script has to connect over 127.0.0.1 because Python resolves
    # localhost to ::1 and nothing listens there. Comparing netloc alone made
    # every link look external, so the crawl stopped after the home page and
    # cheerfully reported nothing to declare. Same machine, same port, same
    # shop: rewrite it to the address we can actually reach.
    LOCAL = {"localhost", "127.0.0.1", "[::1]", "::1"}

    def same_shop(target):
        """The crawlable URL for target, or None when it is really external."""
        bits = urllib.parse.urlparse(target)
        if bits.netloc == host:
            return target
        if bits.hostname in LOCAL and bits.port == port:
            return urllib.parse.urlunparse(bits._replace(netloc=host))
        return None

    queue = collections.deque([base + "/"])
    seen = {base + "/"}
    pages = 0
    problems = collections.defaultdict(list)     # kind -> [(where, detail)]
    checked = {}                                  # url -> status, for links and images

    def check_target(url, kind, where):
        if url in checked:
            status = checked[url]
        else:
            status, _, _ = get(url, timeout=25)
            checked[url] = status
        if status == 0 or status >= 400:
            problems[kind].append((where, f"{url} -> {status or 'unreachable'}"))

    while queue and pages < args.max:
        url = queue.popleft()
        status, ctype, raw = get(url)
        pages += 1
        where = url.replace(base, "") or "/"

        if status != 200:
            problems["pages that do not answer 200"].append((where, f"{status} ({ctype[:60]})"))
            continue
        if "html" not in ctype:
            problems["pages that are not HTML"].append((where, ctype[:60]))
            continue
        body = raw.decode("utf-8", "replace")

        for m in set(WARN.findall(body)):
            problems["PHP warnings printed into the page"].append((where, m.strip()))
        for m in set(LEFTOVER.findall(body)):
            problems["template tags left in the output"].append((where, m))
        if not TITLE.search(body):
            problems["pages with no <title>"].append((where, ""))
        elif not html.unescape(TITLE.search(body).group(1)).strip():
            problems["pages with an empty <title>"].append((where, ""))
        if not H1.search(body):
            problems["pages with no <h1>"].append((where, ""))

        for href in HREF.findall(body):
            href = html.unescape(href.strip())
            if not href:
                problems["links with an empty href"].append((where, "<a href=\"\">"))
                continue
            if href.strip().lower() in ("array", "#array"):
                problems["links pointing at \"Array\""].append((where, href))
                continue
            if SKIP.match(href):
                continue
            target = same_shop(urllib.parse.urljoin(url, href))
            if not target:
                continue
            target = target.split("#")[0]
            check_target(target, "internal links that fail", where)
            if target not in seen and not NO_CRAWL.search(target):
                seen.add(target)
                queue.append(target)

        for src in IMG.findall(body):
            src = html.unescape(src.strip())
            if not src or src.startswith("data:"):
                if not src:
                    problems["images with an empty src"].append((where, "<img src=\"\">"))
                continue
            target = same_shop(urllib.parse.urljoin(url, src))
            if target:
                check_target(target, "images that 404", where)

    print(f"{pages} page(s) visited, {len(checked)} link(s) and image(s) checked\n")
    if not problems:
        print("Rien a signaler.")
        return 0

    total = 0
    for kind in sorted(problems):
        rows = problems[kind]
        total += len(rows)
        print(f"-- {kind} ({len(rows)})")
        shown = collections.Counter()
        for where, detail in rows:
            if shown[detail] >= 3:               # the same broken asset on every page
                continue
            shown[detail] += 1
            print(f"     {where:<46} {detail}")
        extra = len(rows) - sum(min(v, 3) for v in shown.values())
        if extra > 0:
            print(f"     … and {extra} more of the same")
        print()
    print(f"{total} probleme(s).")
    return 1


if __name__ == "__main__":
    sys.exit(main())
