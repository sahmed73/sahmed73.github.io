---
title: "A team of AI agents proposes, builds, and filters new MOFs, and four were synthesized"
description: "MOFGen links a language model, a diffusion model, quantum agents, and synthesizability agents to generate MOFs, with four AI-generated frameworks made in the lab."
date: 2026-11-21 18:12:24 -0800
slot: agents
source_id: "doi:10.1038/s43588-026-01058-x"
source_title: "System of agentic AI for the discovery of metal–organic frameworks"
source_authors: "Théo Jaffrelot Inizan, Sherry Yang, Aaron Kaplan et al."
source_venue: "Nature Computational Science"
source_date: 2026-11-20
source_url: "https://doi.org/10.1038/s43588-026-01058-x"
---

## What's new

The authors built MOFGen, a system of connected AI agents for discovering metal–organic frameworks (MOFs), porous crystals studied for CO2 capture and water harvesting. Each agent has a distinct job: a large language model proposes MOF compositions, a diffusion model generates crystal structures, quantum mechanical agents optimize and filter candidates, and synthetic-feasibility agents, guided by expert rules and machine learning, judge whether a candidate can be made.

The system was trained on experimentally reported MOFs and computational databases. It generated hundreds of thousands of MOF structures along with synthesizable organic linkers. The authors say it can produce large MOF structures with atomic precision, beyond the tens-of-atoms scale of conventional generative models. Validation used high-throughput experiments and the successful synthesis of four "AI-dreamt" MOFs.

## Why it matters

The work shows a concrete pattern for automated materials research: generation, quantum-level screening, and synthesizability checks chained as separate agents, ending in lab-made materials rather than only predicted ones. Researchers building automated simulation workflows can borrow the idea of separating proposal, structure generation, physics-based filtering, and feasibility checks.

## Caveats

Four synthesized MOFs is a small sample against hundreds of thousands of generated structures. The abstract does not state how many candidates were tested or how many met performance targets for CO2 capture or water harvesting. Only the abstract was read for this summary, so details of agent coordination, compute cost, and the experimental results are not covered.
