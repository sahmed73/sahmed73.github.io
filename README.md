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

## Publish a Molecular Perspective

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
series_number: "03"
cover_title: "A brief cover title."
visual: generative
---
```

Use `generative` or `potential` for the cover treatment. Add linked inline
citations and a References section with matching `ref-1`, `ref-2`, etc. IDs.
Separate published findings from proposed applications. Reading time is an
editorial estimate; update it when revising the article.
