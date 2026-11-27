#!/usr/bin/env python3
"""Check research digest posts and the referee playbook before they are published.

    python3 scripts/digest/check_digest.py

Checks every file in _digest/: file name, front matter, slot, source fields,
length, required sections, no images, no duplicate sources, and at most one post
per slot per day. Slots with a 'retired' date in _data/digest.json take no posts
from that date on.

Paper dissection posts also need a topic tag, a referee file (or 'none' with a
reason), the number of review rounds, eight fixed sections, and short quotes only.

From the weekly slot's start date, Sundays carry only the weekly summary, and the
summary must link to every post from the Monday to Saturday before it.

_data/digest_playbook.json: every active lesson cites at least two different
dissection posts, and no lesson in the last commit may disappear (retire it with
a reason instead). Exits 1 on any problem.
"""
import datetime as dt
import json
import re
import subprocess
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE_FIELDS = ["title", "description", "date", "slot"]
SOURCE_FIELDS = ["source_id", "source_title", "source_authors", "source_venue", "source_date", "source_url"]
SECTIONS = {
    "default": ["## What's new", "## Why it matters", "## Caveats"],
    "dissection": ["## The claim", "## What is new", "## The evidence stack", "## Referee room",
                   "## What convinced the referees, and what nearly sank the paper",
                   "## Lessons for computational-chemistry and MLIP authors", "## Claude's reading", "## Caveats"],
    "weekly": ["## The week in brief", "## Highlights", "## Every post this week"],
}
WORDS = {"default": (150, 350), "dissection": (600, 1300), "weekly": (200, 700)}
TOPICS = {"mlip", "dft", "md", "other"}
QUOTE_MAX_WORDS, QUOTES_MAX = 25, 8
QUOTE = re.compile(r'"([^"\n]{2,600})"|“([^”\n]{2,600})”')


def front_matter(text):
    match = re.match(r"---\n(.*?)\n---\n(.*)", text, re.S)
    if not match:
        return None, text
    fields = {}
    for line in match.group(1).splitlines():
        key, sep, value = line.partition(":")
        if sep and re.fullmatch(r"[a-z_]+", key):
            value = value.strip()
            if len(value) >= 2 and value[0] == value[-1] == '"':
                value = value[1:-1].replace('\\"', '"')
            fields[key] = value
    return fields, match.group(2)


def words(body):
    body = re.sub(r"\]\([^)]*\)", "]", body)        # keep link text, drop URLs
    body = re.sub(r"^#+ .*$", "", body, flags=re.M)  # headings are not reading text
    return len(re.findall(r"[A-Za-z0-9][\w'’.-]*", body))


def post_url(day, slug):
    return f"/digest/{day.replace('-', '/')}/{slug}/"


def check_posts(digest_dir, config):
    slots = {s["id"]: s for s in config["slots"]}
    retired = {k: s["retired"] for k, s in slots.items() if s.get("retired")}
    weekly = next((s for s in config["slots"] if s.get("kind") == "weekly"), None)
    problems, per_slot, sources, posts = [], Counter(), Counter(), []
    files = sorted(Path(digest_dir).glob("*.md"))
    for path in files:
        name = path.name
        say = lambda msg, name=name: problems.append(f"{name}: {msg}")
        match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md", name)
        if not match:
            say("file name must be YYYY-MM-DD-short-slug.md (lowercase, hyphens)")
            continue
        day, slug = match.groups()
        fields, body = front_matter(path.read_text())
        if fields is None:
            say("missing front matter")
            continue
        slot_id = fields.get("slot")
        slot = slots.get(slot_id)
        kind = (slot or {}).get("kind", "default")
        posts.append({"day": day, "slug": slug, "slot": slot_id, "kind": kind, "fields": fields, "body": body,
                      "name": name})
        required = BASE_FIELDS + ([] if kind == "weekly" else SOURCE_FIELDS)
        for key in required:
            if not fields.get(key):
                say(f"missing front matter field: {key}")
        if not fields.get("date", "").startswith(day):
            say("front matter date must match the file name date")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{4}", fields.get("date", "")):
            say('date must look like "2026-11-19 07:00:00 -0800"')
        if slot is None:
            say(f"slot must be one of {sorted(slots)}")
        elif slot_id in retired and day >= retired[slot_id]:
            active = sorted(k for k in slots if k not in retired)
            say(f"slot '{slot_id}' was retired on {retired[slot_id]}; use one of {active}")
        if kind != "weekly":
            if not fields.get("source_url", "").startswith("https://"):
                say("source_url must be an https link to the paper")
            if not re.fullmatch(r"(doi:10\.\S+|arxiv:\S+)", fields.get("source_id", "")):
                say("source_id must look like doi:10.xxxx/... or arxiv:2511.01234")
            if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fields.get("source_date", "")):
                say("source_date must be YYYY-MM-DD")
            sources[fields.get("source_id", "").lower()] += 1
        if len(fields.get("description", "")) > 200:
            say("description should be one sentence under 200 characters")
        low, high = WORDS[kind]
        count = words(body)
        if not low <= count <= high:
            say(f"body has {count} words; keep it between {low} and {high}")
        for heading in SECTIONS[kind]:
            if not re.search(rf"^{re.escape(heading)}\s*$", body, re.M):
                say(f"missing section heading: {heading}")
        if re.search(r"^# ", body, re.M):
            say("do not use a level-1 heading in the body; the layout prints the title")
        if "![" in body or "<img" in body:
            say("no images in digest posts")
        if kind == "dissection":
            check_dissection(fields, body, say)
        per_slot[(day, slot_id)] += 1

    if weekly:
        problems += check_sundays(posts, weekly)
    problems += [f"{day}: {n} posts in slot '{slot}'; the limit is 1" for (day, slot), n in per_slot.items() if n > 1]
    problems += [f"source covered {n} times: {sid}" for sid, n in sources.items() if sid and n > 1]
    return problems, posts


def check_dissection(fields, body, say):
    if fields.get("topic") not in TOPICS:
        say(f"topic must be one of {sorted(TOPICS)}")
    referee = fields.get("referee_file", "")
    if referee == "none":
        if not fields.get("referee_note"):
            say("referee_file is 'none', so referee_note must say why (for example, the journal does not publish referee reports)")
        if not re.fullmatch(r"\d+|unknown", fields.get("review_rounds", "")):
            say("review_rounds must be a number or 'unknown'")
    elif referee.startswith("https://"):
        if not re.fullmatch(r"[1-9]\d*", fields.get("review_rounds", "")):
            say("review_rounds must be the number of review rounds in the referee file")
    else:
        say("referee_file must be the https link to the referee file PDF, or 'none'")
    quotes = [q[0] or q[1] for q in QUOTE.findall(body)]
    long_quotes = [q for q in quotes if len(q.split()) > QUOTE_MAX_WORDS]
    for quote in long_quotes:
        say(f"quote over {QUOTE_MAX_WORDS} words; paraphrase instead: \"{quote[:60]}...\"")
    if len(quotes) > QUOTES_MAX:
        say(f"{len(quotes)} quotes; use at most {QUOTES_MAX} and paraphrase the rest")


def check_sundays(posts, weekly):
    problems = []
    start = weekly.get("starts", "0000-00-00")
    for post in posts:
        day = dt.date.fromisoformat(post["day"])
        sunday = day.weekday() == 6
        if post["kind"] == "weekly":
            if not sunday or post["day"] < start:
                problems.append(f"{post['name']}: weekly summaries are published on Sundays from {start} only")
                continue
            monday, saturday = day - dt.timedelta(days=6), day - dt.timedelta(days=1)
            fields = post["fields"]
            if fields.get("week_start") != monday.isoformat() or fields.get("week_end") != saturday.isoformat():
                problems.append(f"{post['name']}: week_start and week_end must be {monday} and {saturday}")
            week = [p for p in posts if p["kind"] != "weekly" and monday.isoformat() <= p["day"] <= saturday.isoformat()]
            for p in week:
                if post_url(p["day"], p["slug"]) not in post["body"]:
                    problems.append(f"{post['name']}: link the week's post {post_url(p['day'], p['slug'])}")
        elif sunday and post["day"] >= start:
            problems.append(f"{post['name']}: from {start}, Sundays carry only the weekly summary")
    return problems


def check_playbook(playbook, posts, previous=None):
    problems = []
    dissections = {p["name"][:-3] for p in posts if p["kind"] == "dissection"}
    ids = Counter(lesson.get("id") for lesson in playbook.get("lessons", []))
    problems += [f"playbook: lesson id '{i}' is used {n} times" for i, n in ids.items() if n > 1]
    changed = {c.get("lesson") for c in playbook.get("changes", [])}
    for lesson in playbook.get("lessons", []):
        lid = lesson.get("id", "?")
        for key in ("id", "text", "added", "updated", "status", "evidence"):
            if not lesson.get(key):
                problems.append(f"playbook: lesson '{lid}' is missing '{key}'")
        if lesson.get("status") not in ("active", "retired"):
            problems.append(f"playbook: lesson '{lid}' status must be 'active' or 'retired'")
        if lesson.get("status") == "retired" and not lesson.get("retired_reason"):
            problems.append(f"playbook: retired lesson '{lid}' needs a retired_reason")
        evidence = lesson.get("evidence") or []
        for stem in evidence:
            if stem not in dissections:
                problems.append(f"playbook: lesson '{lid}' cites '{stem}', which is not a dissection post in _digest/")
        if lesson.get("status") == "active" and len(set(evidence)) < 2:
            problems.append(f"playbook: lesson '{lid}' needs at least two different dissection posts as evidence")
        if lid not in changed:
            problems.append(f"playbook: lesson '{lid}' has no entry in 'changes'")
    if previous:
        now = {lesson.get("id") for lesson in playbook.get("lessons", [])}
        for lesson in previous.get("lessons", []):
            if lesson.get("id") not in now:
                problems.append(f"playbook: lesson '{lesson.get('id')}' was deleted; set status 'retired' with a reason instead")
    return problems


def committed_playbook():
    try:
        out = subprocess.run(["git", "show", "HEAD:_data/digest_playbook.json"], cwd=ROOT,
                             capture_output=True, text=True, check=True).stdout
        return json.loads(out)
    except (subprocess.CalledProcessError, FileNotFoundError, json.JSONDecodeError):
        return None


def main():
    config = json.loads((ROOT / "_data" / "digest.json").read_text())
    problems, posts = check_posts(ROOT / "_digest", config)
    playbook_path = ROOT / "_data" / "digest_playbook.json"
    if playbook_path.exists():
        problems += check_playbook(json.loads(playbook_path.read_text()), posts, committed_playbook())
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print(f"Passed: {len(posts)} digest posts.")


if __name__ == "__main__":
    main()
