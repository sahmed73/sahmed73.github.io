---
title: "Given a huge DFT database and models, a general AI agent plans testable experiments"
description: "A general-purpose language-model agent with the Alexandria database, trained models, and a reaction graph went from plain questions to synthesis plans."
date: 2026-11-18 11:55:04 -0800
slot: agents
source_id: "arxiv:2611.15451"
source_title: "Materials research with a general-purpose agent"
source_authors: "Paulo R. Pires, Théo Cavignac, Tiago F. T. Cerqueira et al."
source_venue: "arXiv preprint"
source_date: 2026-11-11
source_url: "https://arxiv.org/abs/2611.15451"
---

## What's new

Over the past decade, the authors built Alexandria, an open database of about 15 million density-functional calculations of crystals, plus more than 400 million structures relaxed with machine-learned potentials. On these data they trained a generative model for crystal structures, a universal interatomic potential, and graph neural networks for more than ten properties, from band gaps to superconducting critical temperatures. They also computed a reaction graph of 17.4 billion reactions among 193,416 stable compounds.

In this preprint they give all of it to a general-purpose language-model agent. Working unattended, the agent screened the database for a solar absorber, dropped a candidate whose synthesis releases too little energy, and wrote a synthesis plan with precursors, crucible, and atmosphere. In the well-studied Ba-Zr-S system, it found an unreported sulfide and designed the experiment that would confirm or rule it out. Asked for an air-stable alternative, it designed one and tested it against new structures from the generative model.

## Why it matters

The agent is not specialized for materials science; its abilities come from the data and models it can call. With web search alone, the same agent only proposed what the literature already discusses. That is a useful lesson for anyone planning research agents: curated data, trained models, and well-defined tools are what let a general agent go from a question in plain words to an experiment a laboratory can run.

## Caveats

This is a preprint and has not been peer reviewed. The abstract describes case studies rather than a measured success rate, and it does not report any of the proposed compounds being made or tested. The approach also rests on a very large database and model collection that took years to build, which few fields have yet.
