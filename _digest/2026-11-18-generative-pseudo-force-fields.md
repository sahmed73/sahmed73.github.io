---
title: "Pseudo-forces turn a force-field model into a fast molecule generator"
description: "Training a force-field network on a simple pseudo-energy gives a diffusion-style generator with no time-step input, reaching 99% validity on QM9."
date: 2026-11-18 11:55:04 -0800
slot: field
source_id: "doi:10.1088/2632-2153/aec2a2"
source_title: "Generative pseudo-force fields for molecular generation"
source_authors: "Stefaan Simon Pierre Hessmann, Khaled Kahouli, Stefan Gugler et al."
source_venue: "Machine Learning: Science and Technology"
source_date: 2026-11-16
source_url: "https://doi.org/10.1088/2632-2153/aec2a2"
---

## What's new

Two kinds of models can produce stable 3D molecular structures. Machine-learning force fields (MLFFs) relax a geometry by following physical forces, but they need costly ab initio labels for distorted structures. Diffusion models learn from equilibrium structures alone, but they depend on a noise schedule and on being told the current time step.

Hessmann and colleagues combine the two. Their generative pseudo-force field (GPFF) is an MLFF trained on a simple quadratic pseudo-energy around reference equilibrium structures. Training data cost almost nothing: perturb an equilibrium structure with Gaussian noise, and the target "force" points back toward it, with no quantum calculation. The authors show that a GPFF is a variance-exploding diffusion model that needs no time-step input, because the size of the predicted force already encodes the noise level. It works as a drop-in replacement in standard diffusion samplers and also allows faster adaptive sampling and a direct denoising scheme.

On QM9, the model reached 99% validity with stochastic direct denoising at 256 network evaluations, and about 90% at just 16, outperforming a matched diffusion baseline that shares its backbone, training recipe, and noise schedule.

## Why it matters

Generative design pipelines screen thousands of candidates, so generating valid 3D molecules in few steps saves real compute. The samplers also accept structural priors and geometric constraints, which suits interactive design, where a chemist wants to steer what gets generated. The authors demonstrate this in a molecular editor for a drug-design setting.

## Caveats

QM9 contains only small organic molecules with up to nine heavy atoms, so the abstract does not show how the method scales to larger, more flexible molecules. Validity checks that structures are chemically sensible, not that they have useful properties. The headline comparison in the abstract is against a matched baseline rather than other published generators.
