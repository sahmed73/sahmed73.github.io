"""Check a Jekyll build: python3 scripts/check_site.py /path/to/_site."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import sys


class Page(HTMLParser):
    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.links, self.ids, self.references, self.h1s = [], set(), set(), 0
        self.feed(path.read_text())

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if "id" in attrs:
            assert attrs["id"] not in self.ids, "Duplicate ID: " + attrs["id"]
            self.ids.add(attrs["id"])
            if attrs["id"].startswith("ref-"):
                self.references.add(attrs["id"])
        if tag == "h1":
            self.h1s += 1
        if tag == "a" and "href" in attrs:
            self.links.append(attrs["href"])
        if tag == "img":
            assert "alt" in attrs, "Image is missing alt text"
            self.links.append(attrs["src"])
        if tag == "link" and attrs.get("rel") == "stylesheet":
            self.links.append(attrs["href"])


root = Path(sys.argv[1] if len(sys.argv) > 1 else "_site").resolve()
assert (root / "index.html").is_file(), "Build the site first"
pages = {p.resolve(): Page(p) for p in root.rglob("*.html")}
assert len(pages) >= 7, "Expected homepage, four pages, and two reviews"
for path, page in pages.items():
    assert page.h1s == 1, f"Expected one H1: {path}"
    assert "main-content" in page.ids, f"Missing skip-link target: {path}"
    for href in page.links:
        url = urlsplit(href)
        if url.scheme or url.netloc:
            continue
        target = (root / unquote(url.path).lstrip("/") if url.path.startswith("/")
                  else path.parent / unquote(url.path)) if url.path else path
        if target.is_dir():
            target /= "index.html"
        target = target.resolve()
        assert target.is_file(), f"Broken local link in {path}: {href}"
        if url.fragment and target in pages:
            assert unquote(url.fragment) in pages[target].ids, f"Broken anchor in {path}: {href}"
    if page.references:
        cited = {urlsplit(link).fragment for link in page.links if link.startswith("#ref-")}
        assert page.references == cited, f"Uncited or missing reference in {path}"
        assert "references" in page.ids, f"Missing References heading: {path}"

reviews = [p for p in pages if "perspectives" in p.parts]
assert len(reviews) == 2, "Expected two published reviews"
for route in [root / "index.html", root / "blog/index.html"]:
    for review in reviews:
        expected = "/" + str(review.parent.relative_to(root)) + "/"
        assert expected in pages[route.resolve()].links, f"Review missing from {route}"
print(f"Passed: {len(pages)} pages, local links, citation anchors, review listings, headings, and image alt text.")
