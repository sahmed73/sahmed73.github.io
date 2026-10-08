---
layout: default
title: Shihab Ahmed
description: Shihab Ahmed is a PhD candidate in mechanical engineering at UC Merced who uses reactive molecular dynamics and machine learning to study lubricant oxidation and antioxidant additives.
image: /assets/profile.jpg
redirect_from: /about/
---

<div class="intro">
  <img class="photo" src="{{ '/assets/profile.jpg' | relative_url }}" alt="Shihab Ahmed" width="480" height="480">
  <div>
    <h1>Shihab Ahmed</h1>
    <p>PhD Candidate, Mechanical Engineering<br>University of California, Merced</p>
    <p class="links">
      <a href="mailto:{{ site.email }}">Email</a>
      {%- if site.cv != "" %} · <a href="{{ site.cv | relative_url }}">CV</a>{% endif %}
      {%- if site.google_scholar != "" %} · <a href="{{ site.google_scholar }}">Google Scholar</a>{% endif %}
      · <a href="https://orcid.org/{{ site.orcid }}">ORCID</a>
      · <a href="https://github.com/{{ site.github_username }}">GitHub</a>
      · <a href="https://www.linkedin.com/in/{{ site.linkedin_username }}/">LinkedIn</a>
    </p>
  </div>
</div>

I'm a PhD candidate in the [Martini Research Group](https://engineering.ucmerced.edu/content/ashlie-martini) at UC Merced, working with Prof. Ashlie Martini. I study how lubricants oxidize and how antioxidant additives slow that down, using reactive molecular dynamics and machine learning. I also collaborate with the Austrian Competence Center for Tribology (AC2T).

My most recent paper used reactive simulations to screen 718 phenoxyl radicals and found that, among the most stable ones, hydrogen bonding around the phenoxyl oxygen is the main factor. Right now I'm working on generative models (GANs and graph diffusion) that propose new antioxidant candidates, and on a pipeline that uses large language models to pull known lubricant antioxidants out of the literature.

Before UC Merced, I studied mechanical engineering at BUET, worked as an assistant manager in power plant commissioning at Bangladesh-India Friendship Power Company, and taught part-time at Daffodil International University.

I'm open to research internships and collaborations in molecular simulation or machine learning for chemistry. Email is the best way to reach me.

## News

<ul class="news">
{%- for item in site.data.news %}
  <li><span class="date">{{ item.date }}</span><span>{{ item.text | markdownify | remove: '<p>' | remove: '</p>' | strip }}</span></li>
{%- endfor %}
</ul>

## Selected publications

<ol class="pubs">
{%- for pub in site.data.publications %}{% if pub.selected %}
  {% include publication.html pub=pub %}
{%- endif %}{% endfor %}
</ol>

<p><a href="{{ '/publications/' | relative_url }}">All publications, abstracts, and talks</a></p>

## Blog

<ul class="posts">
{%- for post in site.posts limit:3 %}
  <li><span class="date">{{ post.date | date: "%b %Y" }}</span><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{%- endfor %}
</ul>
