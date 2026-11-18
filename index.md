---
layout: default
title: Shihab Ahmed
description: Shihab Ahmed works on machine learning for chemistry and materials science and computational tribology, combining molecular design, chemical data, and reactive simulations.
image: /assets/profile.jpg
redirect_from: /about/
---

<div class="intro">
  <img class="photo" src="{{ '/assets/profile.jpg' | relative_url }}" alt="Shihab Ahmed" width="480" height="480">
  <div>
    <h1>Shihab Ahmed</h1>
    <p class="research-focus">Machine learning for chemistry &amp; materials science<br>Computational tribology</p>
    <p>PhD Candidate, Mechanical Engineering<br>University of California, Merced</p>
    <p class="links">
      <a href="mailto:{{ site.email }}">Email</a>
      {%- if site.cv != "" %} · <a href="{{ site.cv | relative_url }}">CV (PDF)</a>{% endif %}
      · <a href="https://github.com/{{ site.github_username }}">GitHub</a>
      · <a href="https://www.linkedin.com/in/{{ site.linkedin_username }}/">LinkedIn</a>
      {%- if site.x_username %} · <a href="https://x.com/{{ site.x_username }}">X</a>{% endif %}
    </p>
    <p class="research-profiles">
      <a href="https://orcid.org/{{ site.orcid }}">ORCID</a>
      · <a href="https://www.webofscience.com/wos/author/record/{{ site.web_of_science_id }}">Web of Science</a>
      {%- if site.google_scholar != "" %} · <a href="{{ site.google_scholar }}">Google Scholar</a>{% endif %}
    </p>
  </div>
</div>

I use generative AI, molecular simulation, and interpretable machine learning to design better lubricant molecules. My main project couples a graph diffusion model with reactive molecular dynamics and neural networks to discover new phenolic antioxidants and explain what makes them work. I also fine-tune machine-learned interatomic potentials to study how lubricant additives interact, use DFT to probe the energetics of antioxidant reactions, and build LLM pipelines that mine the chemical literature.

I am a PhD candidate in the [Martini Research Group](https://faculty.ucmerced.edu/amartini/) at UC Merced, working with the Austrian Competence Center for Tribology (AC2T) and Chevron Oronite.

<p class="availability"><strong>Seeking Summer 2027 internships</strong> in ML for chemistry, materials, and molecular discovery. <a href="mailto:{{ site.email }}">Get in touch</a>.</p>

## Selected projects

<div class="featured-projects">
  <article class="featured-project with-figure">
    <div class="project-text">
      <p class="project-status">Generative AI · Manuscript in internal review</p>
      <h3><a href="{{ '/research/#generative-ai-for-antioxidant-discovery' | relative_url }}">Generative AI for antioxidant discovery</a></h3>
      <p>A graph diffusion model proposes new phenolic antioxidants, screening keeps the synthesizable, oil-compatible, low-toxicity ones, and reactive simulations rank them in a lubricant environment. Interpretable ML then shows why the best candidates work: they limit access to their reactive oxygen.</p>
      <p class="project-path">Generate → Screen → Simulate → Explain</p>
      <p class="project-links"><a href="{{ '/research/#generative-ai-for-antioxidant-discovery' | relative_url }}">Project overview</a></p>
    </div>
    <img class="project-figure" src="{{ '/assets/projects/hindered-phenol.svg' | relative_url }}" alt="A hindered phenol antioxidant: its reactive O–H oxygen (red) is shielded by two bulky tert-butyl groups (blue)." loading="lazy">
  </article>
  <article class="featured-project with-figure">
    <div class="project-text">
      <p class="project-status">Machine-learned potentials · Ongoing, with Chevron Oronite</p>
      <h3><a href="{{ '/research/#how-lubricant-additives-interact' | relative_url }}">How lubricant additives interact</a></h3>
      <p>I fine-tune pretrained machine-learned interatomic potentials, such as MACE and UMA, to model interactions between lubricant additives. The goal is to understand why some additive combinations reinforce each other while others interfere.</p>
      <p class="project-links"><a href="{{ '/research/#how-lubricant-additives-interact' | relative_url }}">Project overview</a></p>
    </div>
    <img class="project-figure" src="{{ '/assets/projects/additive-pair.svg' | relative_url }}" alt="Two kinds of lubricant additive: a long-chain friction modifier (glycerol monooleate) and a hindered-phenol antioxidant." loading="lazy">
  </article>
  <article class="featured-project with-figure">
    <div class="project-text">
      <p class="project-status">Chemical data &amp; LLMs · Open-source software</p>
      <h3><a href="{{ '/research/#chemical-literature-mining' | relative_url }}">Mining the chemical literature with a local LLM</a></h3>
      <p>I built a pipeline that runs a local LLM on university GPU nodes to screen the scientific literature and extract reported lubricant antioxidants. It connects extracted names to PubChem and uses RDKit to filter molecular structures.</p>
      <p class="project-links"><a href="https://github.com/sahmed73/llm-literature-mining">Code</a> · <a href="{{ '/perspectives/reading-a-million-papers-with-a-local-llm/' | relative_url }}">Methods, results, and limitations</a></p>
    </div>
    <img class="project-figure" src="{{ '/assets/projects/literature-antioxidants.svg' | relative_url }}" alt="Four antioxidants widely reported in the literature: propyl gallate, TBHQ, phenothiazine, and 4-methoxyphenol." loading="lazy">
  </article>
</div>

I also build research software, including an interactive [molecule viewer]({{ '/molecule-viewer/' | relative_url }}) for molecular structures and LAMMPS data, with image and rotation-video exports.

Outside my research, I take on machine-learning challenges, from identifying molecules in mass spectra to image classification, in my [ML playground]({{ '/ml-playground/' | relative_url }}).

## Skills in practice

<dl class="capabilities">
  <div>
    <dt>Molecular machine learning</dt>
    <dd>PyTorch, graph diffusion, GANs, graph neural networks, and SHAP interpretation. <a href="{{ '/research/#generative-ai-for-antioxidant-discovery' | relative_url }}">Molecular design work</a></dd>
  </div>
  <div>
    <dt>Chemical data</dt>
    <dd>Local LLMs, structured extraction, PubChem, and RDKit. <a href="{{ '/research/#chemical-literature-mining' | relative_url }}">Literature-mining pipeline</a></dd>
  </div>
  <div>
    <dt>Physical simulation</dt>
    <dd>LAMMPS, ReaxFF, REACTER, MACE and UMA potentials, and DFT in Gaussian and ORCA. <a href="{{ '/research/#antioxidant-radical-stability' | relative_url }}">Reactive screening study</a></dd>
  </div>
  <div>
    <dt>Research computing</dt>
    <dd>Python, Bash, SLURM, GPU workflows, and simulation automation. <a href="{{ '/perspectives/reading-a-million-papers-with-a-local-llm/' | relative_url }}">A workflow on university GPUs</a></dd>
  </div>
</dl>

## Research and engineering background

I work with Prof. Ashlie Martini at UC Merced, where I received my M.S. in Mechanical Engineering in 2026 and advanced to PhD candidacy in 2025. My research connects molecular modeling and machine learning with practical problems in lubricant oxidation and additive design. I have presented this work at TMS, the ACS Spring Meeting, and the Gordon Research Conference on Tribology, review manuscripts for the ASME Journal of Tribology and Tribology Letters, and mentor an undergraduate researcher in applied machine learning.

Before UC Merced, I studied mechanical engineering at BUET, worked as an assistant manager in power plant commissioning at Bangladesh-India Friendship Power Company, and taught part-time at Daffodil International University.

## Selected publications

<ol class="pubs">
{%- for pub in site.data.publications %}{% if pub.selected %}
  {% include publication.html pub=pub %}
{%- endif %}{% endfor %}
</ol>

<p><a href="{{ '/publications/' | relative_url }}">All publications, abstracts, and talks</a></p>

## News

<ul class="news">
{%- for item in site.data.news %}
  <li><span class="date">{{ item.date }}</span><span>{{ item.text | markdownify | remove: '<p>' | remove: '</p>' | strip }}</span></li>
{%- endfor %}
</ul>

## Blog

<ul class="posts">
{%- for post in site.posts limit:3 %}
  <li><span class="date">{{ post.date | date: "%b %Y" }}</span><a href="{{ post.url | relative_url }}">{{ post.title }}</a></li>
{%- endfor %}
</ul>
