---
layout: page
title: Notes from the lab
permalink: /blog/
---

Short notes on molecular simulation, scientific machine learning, research workflows, and the questions behind my PhD work.

<div class="post-list">
  {% if site.posts.size > 0 %}
    {% for post in site.posts %}
      <article class="post-card">
        <p class="post-date">{{ post.date | date: "%B %-d, %Y" }}</p>
        <h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2>
        <p>{{ post.excerpt | strip_html | truncate: 180 }}</p>
        <a href="{{ post.url | relative_url }}" class="text-link">Read note →</a>
      </article>
    {% endfor %}
  {% else %}
    <div class="empty-note">
      <p>Research notes will appear here soon.</p>
      <p class="small-muted">This space is ready for posts about methods, papers, code, and lessons from the lab.</p>
    </div>
  {% endif %}
</div>
