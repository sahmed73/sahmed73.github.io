---
title: "Symmetry-constrained diffusion model generates grain boundaries at a target energy"
description: "A MatterGen-based diffusion model enforces equivalence of the two boundaries in a periodic cell, so generated structures can be conditioned on a single grain-boundary energy."
date: 2026-11-23 07:12:26 -0800
slot: field
source_id: "arxiv:2611.27188"
source_title: "Generating grain boundary structures at a specified energy with a symmetry-constrained diffusion model"
source_authors: "Kazuya Miyamoto, Ibuki Okuda, Izumi Takahara et al."
source_venue: "arXiv preprint"
source_date: 2026-11-20
source_url: "https://arxiv.org/abs/2611.27188"
---

## What's new

Grain boundaries (GBs) strongly influence the properties of polycrystalline materials, so generating them on demand would let researchers treat the boundary structure as a design variable. A problem is that crystal generative models such as MatterGen work on periodic cells, and a periodic cell contains two GBs. The cell energy describes one boundary only if the two are equivalent, and existing models do not enforce that.

The authors build on MatterGen with a symmetry-constrained diffusion model. Atoms near one GB are generated, and the atoms near the other are reconstructed by a symmetry projection applied at every denoising step. They apply it to the Σ5(210)[001] symmetric tilt GB in aluminium, conditioning on a GB energy computed with a machine-learning interatomic potential.

All 350 generated structures kept a geometrically equivalent GB pair after relaxation. For the three in-range target energies with many nearby training structures, 44% to 70% of outputs landed within ±0.1 J/m² of the target. Of 91 near-target structures, 90 matched no training structure under the authors' geometric criterion.

## Why it matters

Property-conditioned generation is only meaningful if the property belongs to the object being generated. Building the pair equivalence into the sampler makes GB energy a well-defined target. The authors suggest the model could help identify unknown metastable GB structures seen in experiments. The same idea, constraining generation to match how the property is computed, may transfer to other interface problems, including surfaces and tribological contacts.

## Caveats

This is a preprint and covers one boundary type in one element. Tracking of the target energy weakened at higher energies and failed outside the training range. The energy labels come from an interatomic potential rather than direct quantum calculations, and "distinct from training" is judged by a specific geometric criterion. Whether the generated structures are physically observed metastable boundaries has not been tested experimentally.
