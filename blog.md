---
layout: page
title: Writing
permalink: /blog/
description: Short, referenced reviews by Shihab Ahmed on molecular simulation and machine learning in tribology.
---

Short reviews on topics close to my research, with references. Written for researchers and engineers coming from neighboring fields.

<ul class="posts">
{%- for post in site.posts %}
  <li><span class="date">{{ post.date | date: "%b %Y" }}</span><span><a href="{{ post.url | relative_url }}">{{ post.title }}</a><br><span class="desc">{{ post.description }}</span></span></li>
{%- endfor %}
</ul>
