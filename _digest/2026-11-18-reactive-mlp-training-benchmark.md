---
title: "Pretrained Δ-learning tops a benchmark of reactive ML potential training"
description: "Across four architectures, pretraining on cheap xTB data and learning the DFT correction gave the lowest errors, but did not reliably improve reaction searches."
date: 2026-11-18 11:55:04 -0800
slot: paper
source_id: "doi:10.1021/acs.jctc.6c01789"
source_title: "A Systematic Benchmark of Multifidelity Training Strategies for Reactive Machine Learning Potentials"
source_authors: "Bowen Li, Shuwen Zhang, Sixuan Mi et al."
source_venue: "Journal of Chemical Theory and Computation"
source_date: 2026-11-11
source_url: "https://doi.org/10.1021/acs.jctc.6c01789"
---

## What's new

Reactive machine-learning potentials (MLPs) need quantum-chemistry labels for strained, far-from-equilibrium structures along reaction paths, and those labels are expensive. A common shortcut is to lean on cheaper data: pretrain on a low-level method, learn only the correction to it (Δ-learning), or both. Li and colleagues tested these options side by side. They compared direct and Δ training, each with and without pretraining, across four architectures (DPA-2, DPA-3, MACE, and DPA4-Neo), using 17.6 million configurations labeled with the semiempirical GFN2-xTB method and 198,622 configurations labeled with DFT at the ωB97X-D/def2-TZVP level.

With the full DFT training set, pretrained Δ-learning gave the lowest energy or force error, averaged over three training seeds, in 31 of 32 combinations of architecture, data set, and property. It also improved reaction energies and forward barriers for all four architectures on the GDB-10-rxn benchmark.

## Why it matters

Anyone building a reactive potential, for example to check or replace a ReaxFF model of oxidation chemistry, has to decide how to spend a limited DFT budget. This study gives a like-for-like comparison across architectures instead of single-model anecdotes. It also exposes a practical trade-off: for DPA4-Neo, direct fine-tuning matched a model trained from scratch on all the DFT data while using no more DFT configurations than pretrained Δ-learning, and it needs no GFN2-xTB calls during simulations.

## Caveats

Lower average errors did not translate into better reaction discovery. The gains did not consistently raise the success rate of reaction-search workflows started from given reactant and product geometries, and local force errors could remain only partly corrected. The authors conclude that the best protocol depends on the data budget, the target property, and the downstream workflow. This summary is based on the abstract.
