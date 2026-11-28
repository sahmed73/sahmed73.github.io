---
title: "Foundation MLIPs beat a classical potential on Cu-Zr-Al metallic glass"
description: "MACE foundation models trained on data with disordered states reproduce glass structure and properties better than a composition-specific EAM potential, without fine-tuning."
date: 2026-11-28 07:12:00 -0800
slot: paper
source_id: "arxiv:2611.34156"
source_title: "Foundation interatomic potentials capture structural disorder in metallic glasses"
source_authors: "Dario Massa, Luca Leoni, Antoni Wadowski et al."
source_venue: "arXiv preprint"
source_date: 2026-11-25
source_url: "https://arxiv.org/abs/2611.34156"
---

## What's new

Metallic glasses are hard to simulate. Classical embedded atom method (EAM) potentials are fitted to one composition, and ab initio molecular dynamics is too costly for the system sizes and timescales needed. The authors ask whether general-purpose "foundation" machine-learning interatomic potentials can fill the gap.

Using the Cu-Zr-Al glass as a test case, they benchmark MACE foundation models against an EAM potential along molecular dynamics quenches. They check the results against density functional theory and experiment, first at Cu46Zr46Al8 and then across the good glass-forming region of the ternary system.

They report that models pre-trained on databases that include non-equilibrium liquid and amorphous configurations, such as OMAT, reproduce the structure, the quenching dynamics, and the elastic, mechanical and thermal properties at near first-principles accuracy. These models transfer across composition out of the box and clearly outperform the composition-specific EAM potential.

The authors also tested two ways to specialize the models. Fine-tuning on glass structures generated with Lennard-Jones surrogate models gave only modest gains. Fine-tuning on small periodic cells generated automatically (ASSYST) made the description of disorder worse.

## Why it matters

The finding shifts where the effort goes. Readiness for disordered metals appears to depend mainly on how diverse the pre-training data are, not on building a custom dataset for each system. For anyone using foundation potentials on amorphous or liquid-like systems, including the disordered films and melts that appear in reactive simulations, the message is to pick a model whose training data include such states and to validate the dynamics directly.

## Caveats

This is a preprint and has not been peer reviewed. The study covers one alloy family, Cu-Zr-Al, so the conclusions may not carry over to other glasses or to non-metallic amorphous materials. The abstract also reports that fine-tuning gave only modest gains in this setup; other fine-tuning data or strategies were not part of the comparison. The summary rests on the abstract, so details of the error metrics and the size of the improvements are not given here.
