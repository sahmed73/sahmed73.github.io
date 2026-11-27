#!/usr/bin/env python3
"""Check research digest posts before they are published.

    python3 scripts/digest/check_digest.py

Checks every file in _digest/: file name, front matter, slot, source fields,
length (2-minute read), required sections, no images, no duplicate sources,
and at most one post per slot and three posts per day. Slots with a 'retired'
date in _data/digest.json take no posts from that date on. Exits 1 on any problem.
"""
import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG_SLOTS = json.loads((ROOT / "_data" / "digest.json").read_text())["slots"]
SLOTS = {s["id"] for s in CONFIG_SLOTS}
RETIRED = {s["id"]: s["retired"] for s in CONFIG_SLOTS if s.get("retired")}  # slot id -> retirement date
REQUIRED = ["title", "description", "date", "slot", "source_id", "source_title",
            "source_authors", "source_venue", "source_date", "source_url"]
SECTIONS = ["## What's new", "## Why it matters", "## Caveats"]
MIN_WORDS, MAX_WORDS = 150, 350


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


def main():
    problems, per_day, per_slot, sources = [], Counter(), Counter(), Counter()
    files = sorted((ROOT / "_digest").glob("*.md"))
    for path in files:
        name = path.name
        say = lambda msg: problems.append(f"{name}: {msg}")
        match = re.fullmatch(r"(\d{4}-\d{2}-\d{2})-([a-z0-9]+(?:-[a-z0-9]+)*)\.md", name)
        if not match:
            say("file name must be YYYY-MM-DD-short-slug.md (lowercase, hyphens)")
            continue
        day = match.group(1)
        fields, body = front_matter(path.read_text())
        if fields is None:
            say("missing front matter")
            continue
        for key in REQUIRED:
            if not fields.get(key):
                say(f"missing front matter field: {key}")
        if not fields.get("date", "").startswith(day):
            say("front matter date must match the file name date")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [+-]\d{4}", fields.get("date", "")):
            say('date must look like "2026-11-19 07:00:00 -0800"')
        if fields.get("slot") not in SLOTS:
            say(f"slot must be one of {sorted(SLOTS)}")
        elif fields["slot"] in RETIRED and day >= RETIRED[fields["slot"]]:
            say(f"slot '{fields['slot']}' was retired on {RETIRED[fields['slot']]}; use one of {sorted(SLOTS - set(RETIRED))}")
        if not fields.get("source_url", "").startswith("https://"):
            say("source_url must be an https link to the paper")
        if not re.fullmatch(r"(doi:10\.\S+|arxiv:\S+)", fields.get("source_id", "")):
            say("source_id must look like doi:10.xxxx/... or arxiv:2511.01234")
        if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", fields.get("source_date", "")):
            say("source_date must be YYYY-MM-DD")
        if len(fields.get("description", "")) > 200:
            say("description should be one sentence under 200 characters")
        count = words(body)
        if not MIN_WORDS <= count <= MAX_WORDS:
            say(f"body has {count} words; keep it between {MIN_WORDS} and {MAX_WORDS} (a 2-minute read)")
        for heading in SECTIONS:
            if heading not in body:
                say(f"missing section heading: {heading}")
        if re.search(r"^# ", body, re.M):
            say("do not use a level-1 heading in the body; the layout prints the title")
        if "![" in body or "<img" in body:
            say("no images in digest posts")
        per_day[day] += 1
        per_slot[(day, fields.get("slot"))] += 1
        sources[fields.get("source_id", "").lower()] += 1

    problems += [f"{day}: {n} posts; the limit is 3 per day" for day, n in per_day.items() if n > 3]
    problems += [f"{day}: {n} posts in slot '{slot}'; the limit is 1" for (day, slot), n in per_slot.items() if n > 1]
    problems += [f"source covered {n} times: {sid}" for sid, n in sources.items() if sid and n > 1]
    if problems:
        print("\n".join(problems))
        sys.exit(1)
    print(f"Passed: {len(files)} digest posts.")


if __name__ == "__main__":
    main()
