#!/usr/bin/env python3
"""Collect recent papers for the research digest.

    python3 scripts/digest/fetch_candidates.py [--days 7] [--out candidates.json]
    python3 scripts/digest/fetch_candidates.py --dissection [--out dissection.json]

Default mode: reads the slots, keywords, and journals from _data/digest.json.
Queries arXiv, Crossref (the listed journals), and ChemRxiv (through Crossref),
fills missing journal abstracts from OpenAlex when it can, scores every paper
against every keyword slot, removes papers already covered in _digest/, and
writes the best candidates for each slot as JSON.

--dissection: finds candidates for the Paper dissection slot. Searches the
journals in 'referee_journals' through Crossref (recent papers first, then the
backlog), classifies each paper as mlip / dft / md, opens the best article pages
to find the published referee file, and writes a ranked list with priority
tiers 1-4 (see ROUTINE.md). Uses the Python standard library only.
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


def active_slots(config):
    """Keyword-scored slots in use. Retired slots stay in the config only so older posts
    keep their label; slots with a 'kind' (dissection, weekly) are not keyword-scored."""
    return [slot for slot in config["slots"] if not slot.get("retired") and not slot.get("kind")]


def arxiv_papers(config, since):
    papers = []
    for slot in active_slots(config):
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


REFEREE_LINK = re.compile(
    r'href="(https://static-content\.springer\.com/esm/[^"]+?\.pdf)"[^>]*>\s*(?:<[^>]+>\s*)*'
    r'((?:Transparent )?Peer Review File)', re.I)


def referee_file(doi):
    """Open a Nature Portfolio article page and return the URL of its peer review file, or ''."""
    data = get(f"https://www.nature.com/articles/{doi.split('/', 1)[1]}", tries=2)
    if not data:
        return None  # page unreachable: unknown, not "no file"
    match = REFEREE_LINK.search(data.decode("utf-8", "ignore"))
    return match.group(1) if match else ""


def topic_hits(text, patterns):
    return {topic: [t for t, p in pats if p.search(text)] for topic, pats in patterns.items()}


def dissection_candidates(config, today, check_pages=25):
    slot = next(s for s in config["slots"] if s["id"] == "dissection")
    referee = config["referee_journals"]
    patterns = {topic: [(t, term_pattern(t)) for t in terms] for topic, terms in slot["topics"].items()}
    context = [term_pattern(t) for t in slot["context"]]
    exclude = [term_pattern(t) for t in slot["exclude"]]
    recent_since = (today - dt.timedelta(days=slot["recent_days"])).isoformat()
    seen_ids, seen_titles = seen_papers()

    def search(issn, since, query, rows):
        params = urllib.parse.urlencode({
            "filter": f"issn:{issn},from-pub-date:{since},type:journal-article",
            "query.bibliographic": query, "rows": rows,
            "select": "DOI,title,abstract,author,container-title,published,type,URL",
        })
        data = get("https://api.crossref.org/works?" + params)
        return json.loads(data)["message"]["items"] if data else []

    found = {}
    sources = [(j, True) for j in referee["journals"] if j.get("fetch")]
    sources += [(j, False) for j in referee["no_referee_file"]]
    for journal, has_files in sources:
        windows = [(recent_since, True)]
        if has_files and journal.get("policy") == "all":
            windows.append((max(journal.get("since", slot["backlog_since"]), slot["backlog_since"]), False))
        for since, recent in windows:
            for query in slot["queries"].values():
                for item in search(journal["issn"], since, query, 100 if recent else 200):
                    paper = crossref_paper(item, journal["name"], True)
                    paper["date"] = "-".join(f"{n:02d}" for n in (item.get("published") or {}).get("date-parts", [[0]])[0])
                    if (paper["id"] in found or paper["id"].lower() in seen_ids or not paper["title"]
                            or title_key(paper["title"]) in seen_titles or SKIP_TITLES.match(paper["title"])):
                        continue
                    paper.update(journal=journal, has_files=has_files, recent=paper["date"] >= recent_since)
                    found[paper["id"]] = paper
    papers = list(found.values())
    fill_abstracts(papers)

    ranked = []
    for paper in papers:
        text = f"{paper['title']} {paper['abstract']}".lower()
        if any(p.search(text) for p in exclude) or not any(p.search(text) for p in context):
            continue
        hits = topic_hits(text, patterns)
        topic = next((t for t in ("mlip", "dft", "md") if hits[t]), None)
        if not topic:
            continue
        journal = paper.pop("journal")
        if not paper.pop("has_files"):
            if topic != "mlip" or not paper["recent"]:
                continue
            tier = 4
        elif topic == "mlip":
            tier = journal["tier"]  # 1 for Nature Communications and Nature, 2 for the others
        else:
            tier = 3
        ranked.append({**paper, "tier": tier, "topic": topic, "topic_terms": hits[topic][:6],
                       "referee_policy": journal.get("policy", "none"),
                       "referee_note": journal.get("note", ""),
                       "authors": paper["authors"][:6] + (["et al."] if len(paper["authors"]) > 6 else []),
                       "abstract": paper["abstract"][:2500]})
    # Priority tier first; within a tier, recent papers first, then the newest backlog paper.
    ranked.sort(key=lambda p: p["date"], reverse=True)
    ranked.sort(key=lambda p: (p["tier"], not p["recent"]))

    checked = 0
    for paper in ranked:
        if paper["tier"] == 4:
            paper["referee_file"] = "none"
            continue
        if checked >= check_pages:
            paper["referee_file"] = "not checked"
            continue
        checked += 1
        url = referee_file(paper["id"][4:])
        paper["referee_file"] = url if url else ("unreachable" if url is None else "none")
        time.sleep(1)
    keep = [p for p in ranked if p["referee_file"].startswith("https://")]
    keep += [p for p in ranked if p["tier"] == 4][:5]
    return {"recent_since": recent_since, "papers_checked": len(papers), "pages_opened": checked,
            "unreachable": sum(p["referee_file"] == "unreachable" for p in ranked),
            "candidates": keep[:20]}


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--days", type=int, help="look back this many days (default from _data/digest.json)")
    parser.add_argument("--per-slot", type=int, help="candidates kept per slot")
    parser.add_argument("--out", default="candidates.json", help="output JSON path")
    parser.add_argument("--dissection", action="store_true", help="find Paper dissection candidates instead")
    args = parser.parse_args()

    config = json.loads(CONFIG.read_text())
    if args.dissection:
        result = dissection_candidates(config, dt.date.today())
        result["generated"] = dt.datetime.now(dt.timezone.utc).isoformat(timespec="seconds")
        Path(args.out).write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
        tiers = ", ".join(f"tier {t}: {sum(p['tier'] == t for p in result['candidates'])}" for t in (1, 2, 3, 4))
        print(f"Checked {result['papers_checked']} papers, opened {result['pages_opened']} article pages "
              f"({result['unreachable']} unreachable). Candidates with a referee file: {tiers}. Wrote {args.out}.")
        if result["unreachable"] and not any(p["referee_file"].startswith("https://") for p in result["candidates"]):
            print("warning: www.nature.com could not be reached; check the environment's network allowlist.",
                  file=sys.stderr)
        return
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
    for slot in active_slots(config):
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
