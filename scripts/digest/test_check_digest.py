"""Tests for check_digest.py and the dissection helpers in fetch_candidates.py.

    python3 -m unittest discover scripts/digest
"""
import json
import sys
import tempfile
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import check_digest as cd  # noqa: E402
import fetch_candidates as fc  # noqa: E402

CONFIG = json.loads((cd.ROOT / "_data" / "digest.json").read_text())
FILLER = " ".join(["word"] * 60)


def summary(slot="paper", date="2026-11-25 07:00:00 -0800", source="doi:10.1/a"):
    return f"""---
title: "T"
description: "D"
date: {date}
slot: {slot}
source_id: "{source}"
source_title: "S"
source_authors: "A"
source_venue: "V"
source_date: 2026-11-20
source_url: "https://doi.org/10.1/a"
---
## What's new
{FILLER}
## Why it matters
{FILLER}
## Caveats
{FILLER}
"""


def dissection(date="2026-11-25 07:00:00 -0800", source="doi:10.1/d", referee="https://x.org/p.pdf",
               rounds="2", quote="short phrase", extra=""):
    sections = "\n".join(f"{h}\n{' '.join(['word'] * 90)}" for h in cd.SECTIONS["dissection"])
    return f"""---
title: "T"
description: "D"
date: {date}
slot: dissection
source_id: "{source}"
source_title: "S"
source_authors: "A"
source_venue: "Nature Communications"
source_date: 2026-11-09
source_url: "https://doi.org/10.1/d"
topic: mlip
referee_file: "{referee}"
review_rounds: {rounds}
{extra}---
{sections}
Referee 1 called it "{quote}".
"""


def weekly(date="2026-11-29 07:00:00 -0800", links=()):
    body = "\n".join(f"- [post]({link})" for link in links)
    return f"""---
title: "W"
description: "D"
date: {date}
slot: weekly
week_start: 2026-11-23
week_end: 2026-11-28
---
## The week in brief
{FILLER} {FILLER}
## Highlights
{FILLER} {FILLER}
## Every post this week
{body}
"""


class CheckTests(unittest.TestCase):
    def run_check(self, files):
        with tempfile.TemporaryDirectory() as tmp:
            for name, text in files.items():
                Path(tmp, name).write_text(text)
            return cd.check_posts(tmp, CONFIG)

    def test_valid_day_passes(self):
        problems, _ = self.run_check({
            "2026-11-25-a.md": summary(),
            "2026-11-25-b.md": summary(slot="agents", source="doi:10.1/b"),
            "2026-11-25-c.md": dissection(),
        })
        self.assertEqual(problems, [])

    def test_retired_slot_rejected(self):
        problems, _ = self.run_check({"2026-11-28-a.md": summary(slot="field", date="2026-11-28 07:00:00 -0800")})
        self.assertTrue(any("retired" in p for p in problems))

    def test_two_posts_in_one_slot_rejected(self):
        problems, _ = self.run_check({"2026-11-25-a.md": summary(), "2026-11-25-b.md": summary(source="doi:10.1/b")})
        self.assertTrue(any("the limit is 1" in p for p in problems))

    def test_repeated_doi_rejected(self):
        problems, _ = self.run_check({
            "2026-11-24-a.md": dissection(date="2026-11-24 07:00:00 -0800"),
            "2026-11-25-a.md": dissection(),
        })
        self.assertTrue(any("covered 2 times" in p for p in problems))

    def test_dissection_needs_sections_and_fields(self):
        text = dissection().replace("## Claude's reading", "## My view").replace("topic: mlip", "topic: chemistry")
        problems, _ = self.run_check({"2026-11-25-a.md": text})
        self.assertTrue(any("Claude's reading" in p for p in problems))
        self.assertTrue(any("topic must be" in p for p in problems))

    def test_dissection_without_referee_file_needs_reason(self):
        problems, _ = self.run_check({"2026-11-25-a.md": dissection(referee="none", rounds="unknown")})
        self.assertTrue(any("referee_note" in p for p in problems))
        problems, _ = self.run_check({"2026-11-25-a.md": dissection(
            referee="none", rounds="unknown", extra='referee_note: "JACS does not publish referee reports."\n')})
        self.assertEqual(problems, [])

    def test_long_quote_rejected(self):
        problems, _ = self.run_check({"2026-11-25-a.md": dissection(quote=" ".join(["w"] * 30))})
        self.assertTrue(any("quote over" in p for p in problems))

    def test_sunday_takes_only_weekly(self):
        problems, _ = self.run_check({"2026-11-29-a.md": summary(date="2026-11-29 07:00:00 -0800")})
        self.assertTrue(any("only the weekly summary" in p for p in problems))

    def test_old_sundays_unaffected(self):
        problems, _ = self.run_check({"2026-11-22-a.md": summary(date="2026-11-22 07:00:00 -0800")})
        self.assertEqual(problems, [])

    def test_weekly_must_link_every_post(self):
        files = {"2026-11-25-a.md": summary(), "2026-11-26-b.md": summary(
            slot="agents", date="2026-11-26 07:00:00 -0800", source="doi:10.1/b")}
        problems, _ = self.run_check({**files, "2026-11-29-week-in-review.md": weekly(links=["/digest/2026/11/25/a/"])})
        self.assertTrue(any("/digest/2026/11/26/b/" in p for p in problems))
        problems, _ = self.run_check({**files, "2026-11-29-week-in-review.md": weekly(
            links=["/digest/2026/11/25/a/", "/digest/2026/11/26/b/"])})
        self.assertEqual(problems, [])

    def test_weekly_not_on_weekday(self):
        problems, _ = self.run_check({"2026-11-30-week-in-review.md": weekly(date="2026-11-30 07:00:00 -0800")})
        self.assertTrue(any("Sundays" in p for p in problems))


class PlaybookTests(unittest.TestCase):
    posts = [{"name": "2026-11-25-a.md", "kind": "dissection"}, {"name": "2026-11-26-b.md", "kind": "dissection"},
             {"name": "2026-11-26-c.md", "kind": "default"}]

    def lesson(self, evidence, **extra):
        return {"id": "l1", "text": "T", "added": "2026-11-26", "updated": "2026-11-26", "status": "active",
                "evidence": evidence, **extra}

    def test_lesson_needs_two_dissections(self):
        book = {"lessons": [self.lesson(["2026-11-25-a"])], "changes": [{"date": "2026-11-26", "lesson": "l1"}]}
        self.assertTrue(any("at least two" in p for p in cd.check_playbook(book, self.posts)))
        book["lessons"] = [self.lesson(["2026-11-25-a", "2026-11-26-b"])]
        self.assertEqual(cd.check_playbook(book, self.posts), [])

    def test_lesson_cannot_cite_summary_post(self):
        book = {"lessons": [self.lesson(["2026-11-25-a", "2026-11-26-c"])], "changes": [{"lesson": "l1"}]}
        self.assertTrue(any("not a dissection post" in p for p in cd.check_playbook(book, self.posts)))

    def test_lesson_cannot_be_deleted(self):
        previous = {"lessons": [self.lesson(["2026-11-25-a", "2026-11-26-b"])]}
        self.assertTrue(any("was deleted" in p for p in cd.check_playbook({"lessons": [], "changes": []},
                                                                           self.posts, previous)))


class FetchTests(unittest.TestCase):
    def test_referee_link_pattern(self):
        page = ('<a href="https://static-content.springer.com/esm/art%3A10.1038%2Fs1/MediaObjects/1_MOESM3_ESM.pdf"'
                ' data-track="x"><span>Transparent Peer Review file</span> (download PDF)</a>')
        self.assertTrue(fc.REFEREE_LINK.search(page).group(1).endswith("MOESM3_ESM.pdf"))
        other = '<a href="https://static-content.springer.com/esm/x/MOESM1_ESM.pdf">Supplementary Information</a>'
        self.assertIsNone(fc.REFEREE_LINK.search(other))

    def test_keyword_slots_skip_dissection_weekly_and_retired(self):
        self.assertEqual([s["id"] for s in fc.active_slots(CONFIG)], ["paper", "agents"])


if __name__ == "__main__":
    unittest.main()
