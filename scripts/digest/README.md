# Research digest

AI-written posts on papers close to my research, published at
https://sahmed73.github.io/digest/. A scheduled Claude Code routine runs every day at
7:00 AM Pacific and pushes to `master`. Monday to Saturday it posts up to three
pieces: two two-minute summaries of recent papers and one paper dissection read with
its referee reports. On Sundays it posts only a weekly summary. The posts are written
by AI and published without review; each page says so and links to its source.

| Slot | Label | What it covers |
|---|---|---|
| `paper` | Paper of the day | Machine learning for chemistry and materials, especially ML interatomic potentials, preferring work closest to my own (lubricant oxidation, antioxidants, radical chemistry, reactive MD, tribology); must have an ML component |
| `agents` | Agentic research | LLM agents, self-driving labs, automated simulation workflows, literature mining |
| `dissection` | Paper dissection | One published computational-chemistry paper (MLIP papers first) read with its published referee reports; five-minute read; feeds the referee playbook at `/digest/playbook/` |
| `weekly` | Weekly summary | Sundays only, from 2026-11-29: one page linking and summarizing the week's posts; no other slot posts on Sundays |
| `field` | AI for chemistry & materials | Retired on 2026-11-27 and merged into `paper`; kept so older posts keep their label |

## Files

- `_digest/YYYY-MM-DD-slug.md`: one file per post. Layout, author, and reading time
  come from `defaults` in `_config.yml`.
- `_data/digest.json`: slot labels and goals, keywords and weights, required and
  excluded terms, arXiv categories, and journals (with ISSNs). **Edit this file to
  steer what the digest covers.** `referee_journals` lists the journals that publish
  referee reports, with the publisher page each policy was checked on and the date.
- `_data/digest_playbook.json` and `digest-playbook.md`: the referee playbook. A
  lesson needs two dissections as evidence and is retired, never deleted.
- `digest.md`: the `/digest/` page, grouped by day, with a filter by slot. Feed at
  `/digest/feed.xml`.
- `_layouts/digest.html`: the post page, with the AI notice and the source box.
- `scripts/digest/fetch_candidates.py`: collects and ranks candidates from arXiv,
  ChemRxiv, and journals (through Crossref, with OpenAlex filling missing abstracts).
  With `--dissection` it ranks papers that have a published referee file instead.
  Standard library only.
- `scripts/digest/referee_text.py`: downloads a referee file PDF and extracts its text
  (needs `pdftotext` or `pypdf`).
- `scripts/digest/check_digest.py`: checks every post (front matter, slot, length,
  sections, duplicates, one post per slot per day, no new posts in a retired slot,
  dissection fields and quote length, Sunday rules, weekly links) and the playbook.
- `scripts/digest/test_check_digest.py`: tests for the checker
  (`python3 -m unittest discover scripts/digest`).
- `scripts/digest/ROUTINE.md`: the instructions the routine follows each morning.

## Run by hand

```sh
python3 scripts/digest/fetch_candidates.py --out /tmp/candidates.json   # about a minute
python3 scripts/digest/fetch_candidates.py --dissection --out /tmp/dissection.json   # about two minutes
python3 scripts/digest/check_digest.py
python3 -m unittest discover scripts/digest
```

To publish a day by hand, ask Claude Code to "follow scripts/digest/ROUTINE.md".

## Manage the schedule

The routine lives in Claude Code, not in this repository. Use `/schedule` in Claude
Code (or claude.ai/code) to list, pause, run now, or delete it. The routine's prompt
only points to `ROUTINE.md`, so changes to that file apply from the next run.

## Notes

- Size: a summary is about 3 KB of text and a dissection about 8 KB, so a full week
  adds well under 100 KB.
- Network: the routine's cloud environment ("Research Digest") must allow
  `export.arxiv.org`, `arxiv.org`, `api.crossref.org`, `api.openalex.org`, `doi.org`,
  `chemrxiv.org`, `www.nature.com` and `static-content.springer.com`.
- To keep posts out of search engines, add `noindex: true` to the digest defaults in
  `_config.yml`.
- Because the routine pushes to `master` every morning, run `git pull` before
  committing local work.
