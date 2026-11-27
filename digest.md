---
layout: page
title: Research digest
nav_title: Digest
permalink: /digest/
description: Daily two-minute summaries of new papers close to my research, written by AI. One recent paper on machine learning for chemistry and materials, and one on agentic research automation.
---

Short summaries of new papers close to my research, each a two-minute read. Every morning an AI agent scans recent journal articles and preprints, picks up to two, and writes one summary for each:

{% for slot in site.data.digest.slots -%}
{%- unless slot.retired %}
- **{{ slot.label }}.** {{ slot.goal | split: ":" | first }}.
{%- endunless -%}
{% endfor %}

The summaries are published without human review. Each one links to its source paper, which is the version to rely on and cite. [RSS feed]({{ '/digest/feed.xml' | relative_url }}).

<div class="digest-filter" role="group" aria-label="Show posts from" hidden>
  <button type="button" data-slot="all" aria-pressed="true">All</button>
  {%- for slot in site.data.digest.slots %}
  <button type="button" data-slot="{{ slot.id }}" aria-pressed="false">{{ slot.label }}</button>
  {%- endfor %}
</div>

{% assign docs = site.digest | sort: "date" | reverse -%}
{%- assign days = docs | group_by_exp: "doc", "doc.date | date: '%Y-%m-%d'" -%}
{%- if days.size == 0 %}
<p>The first summaries will appear here soon.</p>
{%- endif %}
<div class="digest-days">
{%- for day in days %}
<section class="digest-day">
  <h2><time datetime="{{ day.name }}">{{ day.items.first.date | date: '%A, %B %-d, %Y' }}</time></h2>
  <ul class="digest-list">
  {%- for slot in site.data.digest.slots %}
  {%- for doc in day.items %}
  {%- if doc.slot == slot.id %}
    <li data-slot="{{ slot.id }}"><span class="digest-slot">{{ slot.label }}</span><a href="{{ doc.url | relative_url }}">{{ doc.title }}</a><span class="desc">{{ doc.description }}</span></li>
  {%- endif %}
  {%- endfor %}
  {%- endfor %}
  </ul>
</section>
{%- endfor %}
</div>

<script>
  (function () {
    const filter = document.querySelector(".digest-filter");
    if (!filter) return;
    filter.hidden = false;
    filter.addEventListener("click", (event) => {
      const button = event.target.closest("button");
      if (!button) return;
      const slot = button.dataset.slot;
      filter.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
      document.querySelectorAll(".digest-list li").forEach((li) => { li.hidden = slot !== "all" && li.dataset.slot !== slot; });
      document.querySelectorAll(".digest-day").forEach((day) => { day.hidden = !day.querySelector("li:not([hidden])"); });
    });
  })();
</script>
