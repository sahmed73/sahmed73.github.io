---
layout: page
title: Publications
permalink: /publications/
---

{% if site.google_scholar != "" %}Also on [Google Scholar]({{ site.google_scholar }}) and [ORCID](https://orcid.org/{{ site.orcid }}).{% else %}Also on [ORCID](https://orcid.org/{{ site.orcid }}).{% endif %}

## Journal articles

<ol class="pubs">
{%- for pub in site.data.publications %}
  {% include publication.html pub=pub full=true %}
{%- endfor %}
</ol>

## Conference papers

<ol class="pubs">
  <li class="pub">
    <p class="pub-title">Fabrication of a cost-effective prosthetic arm using electroencephalography signal</p>
    <p class="pub-authors"><strong>S. Ahmed</strong>, S. Saha, M. A. Ali, and A. Bhattacharjee</p>
    <p class="pub-venue"><em>International Conference on Industrial &amp; Mechanical Engineering and Operations Management</em>, Dhaka, Bangladesh (2020)</p>
  </li>
  <li class="pub">
    <p class="pub-title">Fabrication of a cost-effective prosthetic arm using electromyography signal</p>
    <p class="pub-authors">A. Mitra, <strong>S. Ahmed</strong>, S. Saha, and M. A. Ali</p>
    <p class="pub-venue"><em>5th International Conference on Engineering, Research, Innovation and Education (ICERIE)</em>, Sylhet, Bangladesh (2019)</p>
  </li>
</ol>

## Talks and posters

<ul class="talks">
{%- for talk in site.data.talks %}
  <li><span class="date">{{ talk.date }}</span><span>{{ talk.title }}. {{ talk.event }}, {{ talk.place }}. <span class="kind">{{ talk.kind }}</span></span></li>
{%- endfor %}
</ul>
