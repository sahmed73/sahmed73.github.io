---
layout: page
title: Molecular Perspectives
nav_title: Perspectives
permalink: /blog/
description: Accessible short reviews on molecular AI, simulation, and the science of friction, wear, and lubrication.
---

<p class="page-intro">Where molecular science meets machine learning. Short, referenced reviews of the ideas shaping how we understand and design materials.</p>

<div class="journal-intro"><p class="eyebrow">From the literature to the interface</p><p>These reviews introduce the core ideas, connect them to tribology, and examine what still needs to be tested. Written for curious researchers, engineers, and readers coming from a different field.</p></div>

<div class="post-list">
  {% for post in site.posts %}
    <article class="post-card">
      <a class="post-art {{ post.visual }}" href="{{ post.url | relative_url }}" tabindex="-1" aria-hidden="true"><span class="art-kicker">MOLECULAR PERSPECTIVES / {{ post.series_number }}</span><span class="art-title">{{ post.cover_title }}</span><span class="art-bottom">{{ post.topic }} <span>↗</span></span></a>
      <div class="post-card-copy"><p class="post-date">{{ post.date | date: "%B %-d, %Y" }} · {{ post.reading_time }} min read</p><h2><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h2><p>{{ post.description }}</p><a href="{{ post.url | relative_url }}" class="text-link">Read the review <span aria-hidden="true">→</span></a></div>
    </article>
  {% endfor %}
</div>
