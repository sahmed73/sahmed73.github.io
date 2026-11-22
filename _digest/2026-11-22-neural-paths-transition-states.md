---
title: "Neural-network reaction paths find more transition states than NEB on learned potentials"
description: "Popcornn optimizes a continuous neural-network path on a machine-learned potential and recovers more correct transition states than nudged elastic band and growing string."
date: 2026-11-22 07:09:40 -0800
slot: field
source_id: "arxiv:2611.22272"
source_title: "Neural Network Path Optimization for Finding Transition States on a Machine Learned Potential"
source_authors: "Kareem Hegazy, Eric C-Y Yuan, Anup Kumar et al."
source_venue: "arXiv preprint"
source_date: 2026-11-17
source_url: "https://arxiv.org/abs/2611.22272"
---

## What's new

A transition state is the highest-energy point along the easiest route from reactants to products, and it sets the reaction rate. Common double-ended search methods, such as nudged elastic band (NEB) and growing string, represent the route as a chain of discrete structures. These were designed for density functional theory (DFT), where each energy evaluation is expensive.

The authors introduce Popcornn, which instead represents the path as a continuous neural network and optimizes it on top of a machine-learned interatomic potential (MLIP). A parallelized adaptive numerical integrator evaluates the path. Because MLIPs support automatic differentiation, the method can use second-order information about the energy surface and optimize the whole path rather than only local pieces. The authors report that this removes path-discretization artifacts and reduces sensitivity to hyperparameters.

Across several MLIPs and thousands of organic reactions, Popcornn consistently recovered more correct transition states than NEB and growing string.

## Why it matters

Reaction networks for oxidation, degradation, and additive chemistry depend on many barrier calculations. A search method built for cheap, differentiable potentials could make automated, high-throughput barrier searches more practical. The authors also present the code as a flexible platform for testing path objectives and optimizers.

## Caveats

This is a preprint. The abstract gives no numerical success rates, so the size of the gain is unclear. Results cover organic reactions and depend on the MLIP used, so any errors in the potential carry into the transition states found.
