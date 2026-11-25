---
title: "Tabulating radial weights speeds equivariant MLIP dynamics up to 5.9x"
description: "JET-MLIPs replaces a radial network with a lookup table and fuses GPU kernels, cutting step time and memory for pretrained NequIP-family potentials without retraining."
date: 2026-11-25 07:10:47 -0800
slot: field
source_id: "arxiv:2611.31865"
source_title: "Accelerating Equivariant Interatomic Potentials for Molecular Dynamics through Radial tabulation and Kernel Fusion"
source_authors: "Jaekyun Yoo, Suyeon Ju"
source_venue: "arXiv preprint"
source_date: 2026-11-24
source_url: "https://arxiv.org/abs/2611.31865"
---

## What's new

Equivariant machine-learned interatomic potentials (MLIPs) reach near-quantum-chemical accuracy, but their cost and GPU memory limit molecular dynamics at large length and time scales. The authors point out that, even after the tensor product is accelerated, the remaining bottleneck is evaluating and storing a radial weight for every edge in the NequIP-style convolution.

Their backend, JET-MLIPs, swaps the radial multilayer perceptron for a piecewise cubic Hermite lookup table. It also fuses table lookup, spherical harmonics, the tensor product, and neighbor aggregation into one GPU kernel, so per-edge radial weights and intermediate values are never stored. It works with pretrained NequIP-family models without retraining.

They tested 15 released potentials from SevenNet, MACE, NequIP-OAM, Nequix, and EquFlash on a 5632-atom liquid electrolyte in LAMMPS on a single H200 GPU. Step time improved 1.5-5.9x and peak memory fell 2.4-24x relative to each family's existing accelerated backend, while single-precision accuracy and dynamical stability were preserved. This allows multi-nanosecond transport simulations of roughly 10^4 atoms on one GPU.

## Why it matters

Long, large simulations of liquids, such as viscosity or diffusion in lubricant-like fluids, are often limited by MLIP cost rather than accuracy. A drop-in speedup for existing pretrained models makes such studies more reachable on common hardware.

## Caveats

This is a preprint. Benchmarks use one test system, a liquid electrolyte, and one GPU type, so gains for other systems or hardware may differ. Results are reported against each family's own accelerated backend. The abstract does not describe accuracy loss from the table approximation beyond stating that fp32 accuracy is preserved.
