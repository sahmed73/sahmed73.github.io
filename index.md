---
layout: default
title: Molecular science for better materials
description: Shihab Ahmed is a PhD candidate at UC Merced studying antioxidant chemistry, reactive molecular dynamics, and AI for lubricant design.
image: /assets/profile-off-white.png
---

<section class="hero" aria-labelledby="hero-title">
  <div class="hero-copy">
    <p class="eyebrow"><span class="status-dot" aria-hidden="true"></span> Computational tribology · UC Merced</p>
    <h1 id="hero-title">Small molecules.<br><em>Lasting impact.</em></h1>
    <p class="hero-name">I’m Shihab Ahmed, a PhD candidate turning molecular insight into better material design.</p>
    <p class="hero-intro">I combine reactive molecular dynamics and machine learning to understand how lubricants degrade—and how antioxidant molecules can help them last longer.</p>
    <div class="hero-links"><a href="{{ '/research/' | relative_url }}" class="btn">Explore my research <span aria-hidden="true">↗</span></a><a href="mailto:sahmed73@ucmerced.edu" class="text-link">Let’s connect <span aria-hidden="true">→</span></a></div>
    <p class="hero-affiliation">Martini Research Group <span aria-hidden="true">/</span> University of California, Merced</p>
  </div>
  <figure class="portrait-panel">
    <div class="portrait-frame"><img src="{{ '/assets/profile-off-white.png' | relative_url }}" alt="Shihab Ahmed" width="1254" height="1254" fetchpriority="high"></div>
    <figcaption><div><strong>Shihab Ahmed</strong><span>PhD Candidate · Computational Researcher</span></div><span class="portrait-mark" aria-hidden="true">↗</span></figcaption>
    <span class="portrait-label" aria-hidden="true">CHEMISTRY × COMPUTATION</span>
  </figure>
</section>

<div class="expertise-strip" aria-label="Research areas"><span>Reactive molecular dynamics</span><span>Antioxidant chemistry</span><span>AI for molecular design</span><span>High-performance computing</span></div>

<section class="research-overview" aria-labelledby="research-heading">
  <div class="section-heading"><div><p class="eyebrow">01 / The research</p><h2 id="research-heading">Understanding chemistry.<br>Designing what comes next.</h2></div><p>Friction, wear, and lubricant lifetime begin with molecular interactions. My work connects those interactions to questions that matter in engineering.</p></div>
  <div class="research-grid">
    <article class="research-card"><span class="card-number">01 — UNDERSTAND</span><h3>Follow the<br> reaction.</h3><p>Use reactive molecular dynamics to track bonds, chemical products, and the pathways behind thermo-oxidation.</p><p class="card-tools">ReaxFF · Reaction tracking</p></article>
    <article class="research-card"><span class="card-number">02 — EXPLAIN</span><h3>Find what<br> protects.</h3><p>Study how molecular structure influences phenoxyl radical stability and the chemistry of antioxidant additives.</p><p class="card-tools">Antioxidants · Structure–property relationships</p></article>
    <article class="research-card"><span class="card-number">03 — DESIGN</span><h3>Explore better<br> molecules.</h3><p>Investigate generative models and machine-learned potentials to connect chemical insight with candidate discovery.</p><p class="card-tools">Generative AI · Scientific machine learning</p></article>
  </div>
  <a href="{{ '/research/' | relative_url }}" class="text-link section-link">Inside my research <span aria-hidden="true">→</span></a>
</section>

<section class="research-feature" aria-labelledby="feature-heading">
  <div class="feature-copy"><p class="eyebrow">The question connecting my work</p><h2 id="feature-heading">What makes a molecule<br><em>a better protector?</em></h2><p>To design useful additives, we need to understand both the molecule and what happens to it. I connect atomistic reaction mechanisms with the search for compounds that can resist oxidation.</p><a href="{{ '/about/' | relative_url }}" class="text-link">More about my approach <span aria-hidden="true">↗</span></a></div>
  <figure class="feature-figure"><img src="{{ '/assets/molecular-pathway.svg' | relative_url }}" alt="Conceptual pathway from an antioxidant molecule through reaction analysis to molecular design" width="460" height="330" loading="lazy"><figcaption>From chemical structure to design insight · conceptual illustration</figcaption></figure>
</section>

<section aria-labelledby="publications-heading">
  <div class="section-heading"><div><p class="eyebrow">02 / Selected publications</p><h2 id="publications-heading">Research, in print.</h2></div><a href="{{ '/publications/' | relative_url }}" class="text-link">All publications <span aria-hidden="true">→</span></a></div>
  <div class="publication-list">
    <article class="publication-item"><div><p class="publication-year">2026</p><p class="publication-venue">ACS Omega</p></div><div><h3><a href="https://doi.org/10.1021/acsomega.6c00592">Reactive MD screening of antioxidants for substituent-dependent phenoxyl radical stability</a></h3><p>Connecting antioxidant structure with radical stability through reactive molecular simulation.</p><p class="publication-authors"><strong>S. Ahmed</strong>, S. J. Eder, M. M. Iqbal, N. Dörr &amp; A. Martini</p></div><a href="https://doi.org/10.1021/acsomega.6c00592" class="paper-link" aria-label="Read the antioxidant screening paper">↗</a></article>
    <article class="publication-item"><div><p class="publication-year">2024</p><p class="publication-venue">The Journal of<br>Physical Chemistry A</p></div><div><h3><a href="https://doi.org/10.1021/acs.jpca.4c00964">Tracking thermo-oxidation reaction products and pathways of modified lignin structures from reactive molecular dynamics simulations</a></h3><p>A tracking approach that turns complex reactive trajectories into identifiable products and reaction pathways.</p><p class="publication-authors"><strong>S. Ahmed</strong>, S. J. Eder, N. Dörr &amp; A. Martini</p></div><a href="https://doi.org/10.1021/acs.jpca.4c00964" class="paper-link" aria-label="Read the thermo-oxidation pathways paper">↗</a></article>
  </div>
</section>

<section aria-labelledby="perspectives-heading">
  <div class="section-heading"><div><p class="eyebrow">03 / Molecular Perspectives</p><h2 id="perspectives-heading">A closer look at the science.</h2></div><a href="{{ '/blog/' | relative_url }}" class="text-link">Read the reviews <span aria-hidden="true">→</span></a></div>
  <div class="post-list post-list-home">
    {% for post in site.posts limit:2 %}
      <article class="post-card">
        <a class="post-art {{ post.visual }}" href="{{ post.url | relative_url }}" tabindex="-1" aria-hidden="true"><span class="art-kicker">MOLECULAR PERSPECTIVES / {{ post.series_number }}</span><span class="art-title">{{ post.cover_title }}</span><span class="art-bottom">{{ post.topic }} <span>↗</span></span></a>
        <div class="post-card-copy"><p class="post-date">Short review · {{ post.reading_time }} min read</p><h3><a href="{{ post.url | relative_url }}">{{ post.title }}</a></h3><p>{{ post.description }}</p><a class="text-link" href="{{ post.url | relative_url }}">Read the review <span aria-hidden="true">→</span></a></div>
      </article>
    {% endfor %}
  </div>
</section>

<section class="contact-panel" aria-labelledby="contact-heading"><div><p class="eyebrow">Research &amp; internship opportunities</p><h2 id="contact-heading">Let’s put molecular<br>insight to work.</h2><p>Interested in molecular simulation, lubricant chemistry, or AI for materials? I’d welcome a conversation about research roles, internships, and collaborations.</p></div><div class="contact-actions"><a class="btn" href="mailto:sahmed73@ucmerced.edu">Get in touch <span aria-hidden="true">↗</span></a><a href="https://www.linkedin.com/in/shihab73/" class="text-link">Connect on LinkedIn <span aria-hidden="true">↗</span></a></div></section>
