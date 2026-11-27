# Research digest

Daily two-minute summaries of new papers close to my research, published at
https://sahmed73.github.io/digest/. A scheduled Claude Code routine runs every day at
7:00 AM Pacific, picks up to two recent papers, writes one short post for each, and
pushes them to `master`. The posts are written by AI and published without review;
each page says so and links to its source paper.

| Slot | Label | What it covers |
|---|---|---|
| `paper` | Paper of the day | Machine learning for chemistry and materials, especially ML interatomic potentials, preferring work closest to my own (lubricant oxidation, antioxidants, radical chemistry, reactive MD, tribology); must have an ML component |
| `agents` | Agentic research | LLM agents, self-driving labs, automated simulation workflows, literature mining |
| `field` | AI for chemistry & materials | Retired on 2026-11-27 and merged into `paper`; kept so older posts keep their label |

## Files

- `_digest/YYYY-MM-DD-slug.md`: one file per post. Layout, author, and reading time
  come from `defaults` in `_config.yml`.
- `_data/digest.json`: slot labels and goals, keywords and weights, required and
  excluded terms, arXiv categories, and journals (with ISSNs). **Edit this file to
  steer what the digest covers.**
- `digest.md`: the `/digest/` page, grouped by day, with a filter by slot. Feed at
  `/digest/feed.xml`.
- `_layouts/digest.html`: the post page, with the AI notice and the source box.
- `scripts/digest/fetch_candidates.py`: collects and ranks candidates from arXiv,
  ChemRxiv, and journals (through Crossref, with OpenAlex filling missing abstracts).
  Standard library only.
- `scripts/digest/check_digest.py`: checks every post (front matter, slot, length,
  sections, duplicates, limit of one post per slot and three per day, no new posts in a retired slot).
- `scripts/digest/ROUTINE.md`: the instructions the routine follows each morning.

## Run by hand

```sh
python3 scripts/digest/fetch_candidates.py --out /tmp/candidates.json   # about a minute
python3 scripts/digest/check_digest.py
```

To publish a day by hand, ask Claude Code to "follow scripts/digest/ROUTINE.md".

## Manage the schedule

The routine lives in Claude Code, not in this repository. Use `/schedule` in Claude
Code (or claude.ai/code) to list, pause, run now, or delete it. The routine's prompt
only points to `ROUTINE.md`, so changes to that file apply from the next run.

## Notes

- Size: a post is about 3 KB of text, so two posts a day add about 2 MB a year.
- To keep posts out of search engines, add `noindex: true` to the digest defaults in
  `_config.yml`.
- Because the routine pushes to `master` every morning, run `git pull` before
  committing local work.
