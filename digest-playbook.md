---
layout: page
title: Referee playbook
permalink: /digest/playbook/
description: What referees ask of computational-chemistry and machine-learning potential papers, drawn from the research digest's paper dissections. Written by AI.
---

A living checklist of what referees ask of computational-chemistry and machine-learning interatomic potential papers. It is drawn from the [Paper dissection]({{ '/digest/' | relative_url }}) posts in the research digest, which read published papers together with their referee reports.

A lesson appears here only when at least two different dissections support it, and each one is linked. Lessons are added or strengthened by the same AI agent that writes the digest, without human review. Lessons are never removed silently: a lesson that no longer holds stays listed as retired, with the reason. Accepted papers only show what got through review, so treat this as a list of things referees have asked for, not a recipe for acceptance.

{% assign lessons = site.data.digest_playbook.lessons | where: "status", "active" -%}
{%- if lessons.size == 0 %}
No lessons yet. The first ones will appear once two dissections point to the same thing.
{%- else %}
<ol class="playbook">
{%- for lesson in lessons %}
  <li>{{ lesson.text | escape }}
    <span class="desc">Seen in:
    {%- for stem in lesson.evidence %}
    {%- assign doc = site.digest | where_exp: "d", "d.path contains stem" | first %}
    {%- if doc %} <a href="{{ doc.url | relative_url }}">{{ doc.title | escape }}</a>{% unless forloop.last %};{% endunless %}{% endif %}
    {%- endfor %}. Updated {{ lesson.updated | date: '%B %-d, %Y' }}.</span>
  </li>
{%- endfor %}
</ol>
{%- endif %}

{% assign retired = site.data.digest_playbook.lessons | where: "status", "retired" -%}
{%- if retired.size > 0 %}
## Retired lessons
{% for lesson in retired %}
- {{ lesson.text | escape }} *Retired: {{ lesson.retired_reason | escape }}*
{%- endfor %}
{%- endif %}

{% if site.data.digest_playbook.changes.size > 0 -%}
## Changes
{% assign changes = site.data.digest_playbook.changes | reverse -%}
{%- for change in changes %}
- {{ change.date | date: '%B %-d, %Y' }}: {{ change.change | escape }}
{%- endfor %}
{%- endif %}
