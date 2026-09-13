---
layout: home
---

<div class="hero">
  <div class="hero-copy">
    <p class="eyebrow">Computational tribology · UC Merced</p>
    <h1>Designing antioxidant additives for lubricants that last.</h1>
    <p class="hero-intro">I study how molecules react, degrade, and protect materials. My research combines reactive molecular dynamics, machine learning, and high-performance computing to understand thermo-oxidation and design better antioxidant additives.</p>
    <div class="hero-links"><a href="{{ '/research/' | relative_url }}" class="btn">Explore my research</a> <a href="{{ '/publications/' | relative_url }}" class="text-link">View publications <span aria-hidden="true">→</span></a></div>
  </div>
  <div class="portrait-frame"><img src="{{ '/assets/profile.png?v=2' | relative_url }}" alt="Portrait of Shihab Ahmed"></div>
</div>

<div class="research-note"><span class="note-mark">✦</span><span>Computational tribology · Antioxidant chemistry · Scientific machine learning</span></div>

<div class="section-heading">
  <div>
    <p class="eyebrow">Research</p>
    <h2>From molecular mechanisms to material design.</h2>
  </div>
  <a href="{{ '/research/' | relative_url }}" class="text-link">See the full research program <span aria-hidden="true">→</span></a>
</div>

My work sits at the intersection of computational chemistry, tribology, and scientific machine learning.

<div class="research-grid">
  <div class="research-card">
    <span class="card-number">01</span>
    <h3>Reactive molecular dynamics</h3>
    <p>Using ReaxFF and machine-learned potentials to follow chemical reactions at atomistic resolution.</p>
  </div>
  <div class="research-card">
    <span class="card-number">02</span>
    <h3>Thermo-oxidation</h3>
    <p>Mapping reaction products and pathways that control the lifetime of lubricants and functional materials.</p>
  </div>
  <div class="research-card">
    <span class="card-number">03</span>
    <h3>AI for molecular design</h3>
    <p>Exploring generative models to discover high-performance antioxidant additives and molecular candidates.</p>
  </div>
  <div class="research-card">
    <span class="card-number">04</span>
    <h3>Scientific computing</h3>
    <p>Building reproducible, high-performance workflows for large-scale molecular simulation and analysis.</p>
  </div>
</div>

<div class="section-heading">
  <div>
    <p class="eyebrow">Selected work</p>
    <h2>Publications</h2>
  </div>
  <a href="{{ '/publications/' | relative_url }}" class="text-link">All publications <span aria-hidden="true">→</span></a>
</div>

<div class="publication-list">
  <article class="publication-item">
    <p class="publication-year">2026 · ACS Omega</p>
    <h3>Reactive MD screening of antioxidants for substituent-dependent phenoxyl radical stability</h3>
    <a href="https://doi.org/10.1021/acsomega.6c00592" class="text-link">Read the paper <span aria-hidden="true">↗</span></a>
  </article>
  <article class="publication-item">
    <p class="publication-year">2024 · The Journal of Physical Chemistry A</p>
    <h3>Tracking thermo-oxidation reaction products and pathways of modified lignin structures from reactive molecular dynamics simulations</h3>
    <a href="https://doi.org/10.1021/acs.jpca.4c00964" class="text-link">Read the paper <span aria-hidden="true">↗</span></a>
  </article>
</div>

<div class="section-heading">
  <div>
    <p class="eyebrow">Writing</p>
    <h2>Notes, ideas, and useful things.</h2>
  </div>
  <a href="{{ '/blog/' | relative_url }}" class="text-link">Browse all writing <span aria-hidden="true">→</span></a>
</div>

<div class="post-list post-list-home">
  {% if site.posts.size > 0 %}
    {% for post in site.posts limit:3 %}
      <article class="post-card">
        <p class="post-date">{{ post.date | date: "%B %-d, %Y" }}{% if post.category %} · {{ post.category }}{% endif %}</p>
        <h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3>
        <p>{{ post.excerpt | strip_html | truncate: 150 }}</p>
      </article>
    {% endfor %}
  {% else %}
    <div class="empty-note">
      <p>The first essay is on its way.</p>
      <p class="small-muted">This will be a home for research notes, practical guides, observations, and interests beyond the lab.</p>
    </div>
  {% endif %}
</div>

<div class="closing-note">
  <p class="eyebrow">Currently thinking about</p>
  <p>How can we connect atomistic reaction mechanisms to practical material design—and make molecular simulation more predictive, scalable, and useful for engineering decisions?</p>
</div>
