---
title: "Fine-tuned MLIPs back ReaxFF's picture of water passivating silicon"
description: "A ChemRxiv preprint compares ReaxFF and fine-tuned machine-learning potentials for Si(100) in water at 300, 350 and 383 K, finding the same key surface features."
date: 2026-11-27 07:12:51 -0800
slot: paper
source_id: "doi:10.26434/chemrxiv.15012877"
source_title: "Simulating Silicon Surface Passivation in Water using ReaxFF Force Field and Fine-Tuned Machine Learning Models"
source_authors: "Vishwas Tiwari, Chenying Gu, Hossam Elgabarty et al."
source_venue: "ChemRxiv preprint"
source_date: 2026-11-27
source_url: "https://doi.org/10.26434/chemrxiv.15012877"
---

## What's new

The authors study how water passivates a Si(100) surface, a step that matters in semiconductor fabrication and photovoltaics. They run molecular dynamics with two model types: the ReaxFF reactive force field, and machine-learning interatomic potentials (MLIPs) fine-tuned on DFT-based ab initio MD of the full solid-liquid interface. Simulations cover three temperatures: 300 K, 350 K and 383 K.

Both approaches point to the same picture. The surface is terminated mostly by dissociative adsorption of water, which leaves silanol-terminated silica networks on the surface. At higher temperatures, atoms have enough kinetic energy to rearrange into more stable structures, while hydroxylation at room temperature is more disordered. The fine-tuned MLIP confirms the key structural features seen with ReaxFF.

## Why it matters

ReaxFF is cheap enough for large, long simulations of reactive interfaces, but its accuracy is often hard to judge. Here a fine-tuned MLIP, trained on interface-level ab initio data, serves as a check on ReaxFF's essential behavior. The same cross-check pattern applies to other reactive-surface problems, including tribochemical films and oxidation chemistry, where force-field results need independent validation.

The authors also present the protocol as an efficient way to prepare realistic, passivated surfaces as a starting point for later theoretical studies, and suggest it could extend to solid-electrolyte interphase systems.

## Caveats

This is a preprint and has not been peer reviewed. This summary rests on the abstract alone, so details such as training-set size, error metrics and the exact level of agreement are not covered. The abstract says the MLIP confirms the "key structural features" of ReaxFF, not that the two match in every respect or against experiment. The work is simulation-only, covers one surface and three temperatures, and the claim that the protocol transfers to other systems is a suggestion rather than a demonstrated result.
