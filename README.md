# Shihab Ahmed — research website

Personal research portfolio built with Jekyll and hosted by GitHub Pages.

## Local preview

With Ruby and Bundler installed:

```sh
bundle install
bundle exec jekyll serve
```

Open `http://localhost:4000`. The theme supplies the page layout, HTML head,
SEO tags, and feed; local layouts and CSS provide the portfolio and review design.

## Check before publishing

```sh
bundle exec jekyll build
python3 scripts/check_site.py _site
```

The check verifies local destinations, in-page anchors, review listings,
reference coverage, page headings, and image alt attributes. Review the homepage
and an article at desktop and mobile widths as well. Push the reviewed changes
to the repository's publishing branch to update GitHub Pages.

## Update content

Most updates are edits to data files; the pages render from them.

- `_data/news.yml`: dated news items, newest first (Markdown allowed).
- `_data/publications.yml`: journal articles with abstract, PDF, DOI, and BibTeX.
  `selected: true` also lists a paper on the homepage.
- `_data/talks.yml`: talks and posters.
- `_config.yml`: set `google_scholar` (profile URL) or `cv` (e.g.
  `/assets/Shihab_Ahmed_CV.pdf`) to show those links; leave empty to hide them.

## Publish a review

Create `_posts/YYYY-MM-DD-title.md` using an existing review as a template:

```yaml
---
layout: post
title: "A clear research question"
description: "A short description for the article and preview card."
permalink: /perspectives/clear-research-question/
date: YYYY-MM-DD 08:00:00 -0700
category: Short reviews
topic: Molecular science
reading_time: 6
---
```

Add linked inline
citations and a References section with matching `ref-1`, `ref-2`, etc. IDs.
Separate published findings from proposed applications. Reading time is an
editorial estimate; update it when revising the article.

## Visit summary

`python3 scripts/visit_summary.py --days 30` prints visits, page views, top
pages, referrers, countries, and devices from Cloudflare Web Analytics (up to
180 days). It reads `CF_ACCOUNT_ID` and a read-only `CF_API_TOKEN`
("Account Analytics: Read") from `~/.config/cloudflare/analytics.env`, which
stays outside the repository.

## Private stats dashboard

`workers/site-stats/` is a Cloudflare Worker that serves a password-protected,
live version of the visit summary at https://site-stats.site-stats.workers.dev.
Its secrets (`CF_ACCOUNT_ID`, `CF_API_TOKEN`, `DASH_PASSWORD`) live in
Cloudflare, not in this repository. To change it, edit `src/index.js` and run
`npx wrangler deploy` from that folder; to change the password, run
`npx wrangler secret put DASH_PASSWORD`.
