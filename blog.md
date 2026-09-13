---
layout: page
title: Writing
permalink: /blog/
---

<p class="page-intro">Research notes, practical guides, unfinished ideas, and occasional writing about life beyond the lab.</p>

<div class="post-list">
  {% if site.posts.size > 0 %}
    {% for post in site.posts %}
      <article class="post-card">
        <p class="post-date">{{ post.date | date: "%B %-d, %Y" }}{% if post.category %} · {{ post.category }}{% endif %}</p>
        <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        <p>{{ post.excerpt | strip_html | truncate: 180 }}</p>
        <a href="{{ post.url | relative_url }}" class="text-link">Read note →</a>
      </article>
    {% endfor %}
  {% else %}
    <div class="empty-note">
      <p>The first essay is on its way.</p>
      <p class="small-muted">This space is ready for research, code, ideas, books, travel, or anything else worth sharing.</p>
    </div>
  {% endif %}
</div>
