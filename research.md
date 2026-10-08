---
layout: page
title: Research
permalink: /research/
---

Lubricants break down by oxidation, and antioxidant additives are added to slow that process. I use simulations and machine learning to understand which molecular features make an antioxidant work, with the longer-term goal of designing better ones.

## Antioxidant radical stability

A phenolic antioxidant donates a hydrogen atom to a peroxyl radical and becomes a phenoxyl radical itself. How stable that radical is largely decides how well the antioxidant performs. I used REACTER-based reactive molecular dynamics to measure the reverse hydrogen-transfer rate for 718 single-ring phenoxyl radicals in a polyalphaolefin hydroperoxide environment. Strong hydrogen bonding and steric hindrance around the phenoxyl oxygen lowered the rate, and faster diffusion raised it.

Paper: [ACS Omega, 2026](https://doi.org/10.1021/acsomega.6c00592)

## Reaction pathways from reactive simulations

Reactive MD trajectories contain thousands of bond-breaking and bond-forming events, which makes it hard to say which products form and how. I developed a tracking method that follows the dominant products back through specific bond changes, and used it to identify the most likely thermo-oxidation pathways of modified lignin model compounds.

Paper: [J. Phys. Chem. A, 2024](https://doi.org/10.1021/acs.jpca.4c00964)

## Machine learning for antioxidant design (ongoing)

I'm building generative models, based on GANs and graph diffusion, that propose new phenolic antioxidant structures, with reactive simulations used to check the candidates. Related work trains models to predict antioxidant performance directly from atomistic simulation data. I'm also building a literature-mining pipeline that runs large language models on GPU nodes to collect lubricant-relevant antioxidants reported in published papers.

Talk: TMS Annual Meeting 2026

## Tools

LAMMPS, ReaxFF, REACTER, ORCA, Gaussian, PyTorch, MACE, and SLURM-based HPC clusters. Most of my simulation workflows are automated with Python and Bash so that thousands of runs can be set up, monitored, and analyzed consistently.
