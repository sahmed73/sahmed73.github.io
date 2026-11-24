---
title: "An AI agent workflow automates multireference calculations along reaction pathways"
description: "A preprint presents CASPER, an agentic workflow that picks and maintains active spaces for multireference calculations on five transition-metal reactions."
date: 2026-11-24 07:11:12 -0800
slot: agents
source_id: "arxiv:2611.29902"
source_title: "Autonomous Multireference Quantum Chemistry with Artificial Intelligence Agents"
source_authors: "Younghwan Kim, Ming-Hsiu Hsieh, Ankit Mathanker et al."
source_venue: "arXiv preprint"
source_date: 2026-11-23
source_url: "https://arxiv.org/abs/2611.29902"
---

## What's new

Reactions with strongly correlated electrons, such as many involving transition metals, need multireference electronic structure methods. These methods require expert choices, especially which orbitals to include (the active space), and those choices must stay consistent as bonds form and break. That has made them hard to automate.

The authors introduce CASPER, an autonomously agentic workflow that runs multireference calculations along a reaction pathway. It combines chemical knowledge, electronic structure calculations and iterative assessment to find chemically meaningful active spaces and keep them consistent along the path.

They demonstrate it on five transition-metal reactions, where CASPER produced consistent multireference potential energy profiles with minimal human intervention. In two of the reactions, CASPER identified critical problems: an electronic-state crossing and the exclusion of an orbital involved in bond breaking. An independent Claude session without the structured workflow failed to recognize these.

## Why it matters

The result supports a design lesson for research agents: a language model works better when it is paired with domain knowledge and an independent check of the computed results. The authors also suggest that such agents could generate high-quality quantum chemical data at scale, which could feed training sets for ML models of reactive chemistry.

## Caveats

This is a preprint and has not been peer reviewed. Only five reactions are shown, all involving transition metals, and the abstract does not report comparisons with expert-run calculations or other automated tools. The claim that agents help researchers understand the underlying chemistry is stated as a potential, not a demonstrated outcome.
