#!/usr/bin/env python3
"""Collect recent papers for the research digest.

    python3 scripts/digest/fetch_candidates.py [--days 7] [--out candidates.json]

Reads the slots, keywords, and journals from _data/digest.json. Queries arXiv,
Crossref (the listed journals), and ChemRxiv (through Crossref), fills missing
journal abstracts from OpenAlex when it can, scores every paper against every
slot, removes papers already covered in _digest/, and writes the best
candidates for each slot as JSON. Uses the Python standard library only.
"""
import argparse
import datetime as dt
import html
import json
import re
import sys
import time
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "_data" / "digest.json"
DIGEST = ROOT / "_digest"
HEADERS = {"User-Agent": "research-digest/1.0"}
ATOM = "{http://www.w3.org/2005/Atom}"
SKIP_TITLES = re.compile(r"^(correction|corrigendum|erratum|retraction|retracted|expression of concern|editorial|"
                         r"preface|front matter|back matter|issue information|cover|table of contents|"
                         r"withdrawn|in memoriam|obituary|reviewer|announcement)\b", re.I)


def get(url, tries=3):
    for attempt in range(tries):
        try:
            request = urllib.request.Request(url, headers=HEADERS)
            with urllib.request.urlopen(request, timeout=60) as response:
                return response.read()
        except Exception as error:  # network errors should not stop the other sources
            if attempt == tries - 1:
                print(f"warning: request failed ({error}): {url[:120]}", file=sys.stderr)
                return None
            time.sleep(5 * (attempt + 1))


def clean(text):
    text = html.unescape(re.sub(r"<[^>]+>", " ", text or ""))
    return re.sub(r"\s+", " ", text).strip()


def title_key(title):
    return re.sub(r"[^a-z0-9]", "", title.lower())[:120]


def base_doi(doi):
    """ChemRxiv registers each version (…/v2); treat versions as one paper."""
    return re.sub(r"(/v\d+|-v\d+)$", "", doi.lower())


def term_pattern(term):
    return re.compile(r"(?<![a-z0-9])" + re.escape(term.lower()) + r"(?:s|es)?(?![a-z0-9])")


def arxiv_papers(config, since):
    papers = []
    for slot in config["slots"]:
        cats = " OR ".join(f"cat:{c}" for c in slot["arxiv"]["categories"])
        terms = " OR ".join(f'abs:"{t}"' if " " in t else f"abs:{t}" for t in slot["arxiv"]["terms"])
        query = urllib.parse.urlencode({
            "search_query": f"({cats}) AND ({terms})",
            "sortBy": "submittedDate", "sortOrder": "descending", "max_results": 300,
        })
        data = get("https://export.arxiv.org/api/query?" + query)
        time.sleep(3)  # arXiv asks for a pause between API calls
        if not data:
            continue
        for entry in ET.fromstring(data).iter(ATOM + "entry"):
            published = (entry.findtext(ATOM + "published") or "")[:10]
            if published < since:
                continue
            arxiv_id = re.sub(r"v\d+$", "", (entry.findtext(ATOM + "id") or "").rsplit("/abs/", 1)[-1])
            papers.append({
                "id": f"arxiv:{arxiv_id}",
                "title": clean(entry.findtext(ATOM + "title")),
                "abstract": clean(entry.findtext(ATOM + "summary")),
                "authors": [a.findtext(ATOM + "name") or "" for a in entry.iter(ATOM + "author")],
                "venue": "arXiv",
                "peer_reviewed": False,
                "date": published,
                "url": f"https://arxiv.org/abs/{arxiv_id}",
            })
    return papers


def crossref_items(filters):
    items, cursor = [], "*"
    while cursor and len(items) < 3000:
        query = urllib.parse.urlencode({
            "filter": filters, "rows": 500, "cursor": cursor,
            "select": "DOI,title,abstract,author,container-title,created,issued,type,URL",
        })
        data = get("https://api.crossref.org/works?" + query)
        if not data:
            break
        message = json.loads(data)["message"]
        items += message["items"]
        cursor = message.get("next-cursor") if len(message["items"]) == 500 else None
    return items


def crossref_paper(item, venue, peer_reviewed):
    title = clean(" ".join(item.get("title") or []))
    authors = [" ".join(filter(None, [a.get("given"), a.get("family")])) or a.get("name", "")
               for a in item.get("author") or []]
    date = (item.get("created") or {}).get("date-time", "")[:10]
    return {
        "id": f"doi:{base_doi(item['DOI'])}",
        "title": title,
        "abstract": clean(item.get("abstract")),
        "authors": authors,
        "venue": venue,
        "peer_reviewed": peer_reviewed,
        "date": date,
        "url": f"https://doi.org/{item['DOI']}",
    }


def journal_papers(config, since):
    papers = []
    for journal in config["journals"]:
        for item in crossref_items(f"issn:{journal['issn']},from-created-date:{since},type:journal-article"):
            papers.append(crossref_paper(item, journal["name"], True))
    if config.get("chemrxiv"):
        for item in crossref_items(f"prefix:10.26434,from-created-date:{since},type:posted-content"):
            papers.append(crossref_paper(item, "ChemRxiv", False))
    return papers


def fill_abstracts(papers):
    """Many publishers send Crossref no abstract; OpenAlex often has one."""
    missing = [p for p in papers if not p["abstract"] and p["id"].startswith("doi:")]
    for start in range(0, len(missing), 50):
        batch = missing[start:start + 50]
        dois = "|".join(p["id"][4:] for p in batch)
        query = urllib.parse.urlencode({"filter": f"doi:{dois}", "per-page": 50,
                                        "select": "doi,abstract_inverted_index"})
        data = get("https://api.openalex.org/works?" + query, tries=1)
        if not data:
            return
        found = {}
        for work in json.loads(data).get("results", []):
            index = work.get("abstract_inverted_index") or {}
            words = sorted((pos, word) for word, positions in index.items() for pos in positions)
            if words and work.get("doi"):
                found[work["doi"].lower().replace("https://doi.org/", "")] = " ".join(w for _, w in words)
        for paper in batch:
            paper["abstract"] = found.get(paper["id"][4:], "")


def seen_papers():
    ids, titles = set(), set()
    for path in DIGEST.glob("*.md"):
        text = path.read_text()
        for key, store, transform in (("source_id", ids, str.lower), ("source_title", titles, title_key)):
            match = re.search(rf'^{key}:\s*"?(.*?)"?\s*$', text, re.M)
            if match:
                store.add(transform(match.group(1).replace('\\"', '"')))
    return ids, titles


def score(paper, slot, patterns):
    title, text = paper["title"].lower(), f"{paper['title']} {paper['abstract']}".lower()
    if any(p.search(text) for p in patterns["exclude"]):
        return 0, []
    if any(not any(p.search(text) for p in group) for group in patterns["require"]):
        return 0, []
    hits = [(term, weight) for term, weight, p in patterns["keywords"] if p.search(text)]
    total = sum(weight for _, weight in hits)
    total += sum(1 for term, _, p in patterns["keywords"] if p.search(title))  # title bonus
    if not paper["abstract"]:
        total = round(total * 0.7)  # judged on the title alone
    return total, [term for term, _ in sorted(hits, key=lambda h: -h[1])]


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, help="look back this many days (default from _data/digest.json)")
    parser.add_argument("--per-slot", type=int, help="candidates kept per slot")
    parser.add_argument("--out", default="candidates.json", help="output JSON path")
    args = parser.parse_args()

    config = json.loads(CONFIG.read_text())
    days = args.days or config["window_days"]
    per_slot = args.per_slot or config["per_slot"]
    since = (dt.date.today() - dt.timedelta(days=days)).isoformat()

    papers = arxiv_papers(config, since) + journal_papers(config, since)
    seen_ids, seen_titles = seen_papers()
    unique, keys = [], set()
    for paper in papers:
        key = title_key(paper["title"])
        if (not paper["title"] or SKIP_TITLES.match(paper["title"]) or paper["id"].lower() in seen_ids
                or key in seen_titles or key in keys or paper["id"] in keys):
            continue
        keys.update({key, paper["id"]})
        unique.append(paper)
    fill_abstracts(unique)

    slots = {}
    for slot in config["slots"]:
        patterns = {
            "keywords": [(t, w, term_pattern(t)) for t, w in slot["keywords"].items()],
            "require": [[term_pattern(t) for t in group] for group in slot["require"]],
            "exclude": [term_pattern(t) for t in slot["exclude"]],
        }
        ranked = []
        for paper in unique:
            points, matched = score(paper, slot, patterns)
            if points >= 4:
                ranked.append({**paper, "score": points, "matched": matched[:8],
                               "authors": paper["authors"][:6] + (["et al."] if len(paper["authors"]) > 6 else []),
                               "abstract": paper["abstract"][:2500]})
        ranked.sort(key=lambda p: (p["score"], p["date"]), reverse=True)
        slots[slot["id"]] = ranked[:per_slot]

    result = {
        "generated": dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds"),
        "since": since,
        "papers_checked": len(unique),
        "slots": slots,
    }
    Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    counts = ", ".join(f"{k}: {len(v)}" for k, v in slots.items())
    print(f"Checked {len(unique)} new papers since {since}. Candidates per slot: {counts}. Wrote {args.out}.")


if __name__ == "__main__":
    main()
