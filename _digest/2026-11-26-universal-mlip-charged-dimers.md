---
title: "A universal MLIP matches DFT on neutral dimer binding but fails for charged ones"
description: "An audit of the UMA OMol model on 5,567 dimers finds 1.37 kcal/mol error for neutral systems and 8.5 to 22.9 kcal/mol for charged ones."
date: 2026-11-26 07:10:57 -0800
slot: field
source_id: "arxiv:2611.33830"
source_title: "Geometry Sets the Neutral MLIP-DFT Gap in Non-Covalent Binding, and Charged Systems Fail"
source_authors: "Rui Ding, Zixin Ding, Rodrigo Pires Ferreira et al."
source_venue: "arXiv preprint"
source_date: 2026-11-25
source_url: "https://arxiv.org/abs/2611.33830"
---

## What's new

The authors audited the FAIRChem UMA OMol model, without task-specific fine-tuning, on 5,567 probe-target dimers from 18 benchmarks. They used a training-free inference-time scaffold called RAPIDS.

For neutral chemistry, the mean absolute error was 1.37 kcal/mol. That matches or beats every explicit DFT single-point fidelity tested (1.42 to 1.50 kcal/mol). The authors conclude that the remaining gap to DFT comes from geometry rather than from the learned energy surface.

Charged systems behave differently. Error rises to 8.5 to 22.9 kcal/mol across three charged benchmarks. DFT single-point rescoring does not restore accuracy. Geometry reoptimization does so for ionic hydrogen bonds and ion-molecule dimers, and the failure appears across all three MLIP backbones tested.

The residual failures have structure: signed biases cluster by chemistry family. A closed-form selection rule, RAPIDS-Select, uses about 37% less compute than a strong static DFT baseline at matched accuracy. On a newly computed charged benchmark it cuts the catastrophe rate from 68% to 5.7%.

## Why it matters

Universal MLIPs are often expected to replace quantum chemistry for screening molecular interactions. This audit gives a clear boundary: usable for neutral non-covalent binding, unreliable for charged species unless checked. It also offers a cost-aware way to decide when a DFT follow-up is needed.

## Caveats

This is an arXiv preprint. The audit covers non-covalent binding only, not reactions or bond breaking. On a wet-lab-grounded host-guest benchmark, the method recovers 82.9% pair-level agreement, but only on the seven studies above its roughly 1 kcal/mol precision floor.
