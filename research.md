---
layout: page
title: Research
permalink: /research/
description: Generative AI, reactive molecular dynamics, and interpretable machine learning for discovering lubricant antioxidants, plus machine-learned interatomic potentials for additive interactions and LLM-based chemical literature mining.
---

My research brings together machine learning, chemical data, and molecular simulation for chemistry and materials science. Within computational tribology, I focus on lubricant oxidation and additive design: generating new molecules, testing them in simulation, and finding out which molecular features make them work.

I work in the Martini Research Group at UC Merced and collaborate with the Austrian Competence Center for Tribology (AC2T) and Chevron Oronite.

## Generative AI for antioxidant discovery

**The problem.** Oxidation is a major limit on how long a lubricant lasts and how well it performs. Phenolic antioxidants slow this degradation, but harsher operating conditions and environmental concerns call for antioxidants that are both more effective and safer. The space of possible molecules is far too large to search by synthesis and testing alone.

**The approach.** I built an AI-guided screening framework that connects four steps:

1. **Generate.** A graph diffusion model, trained on known antioxidants and structurally related molecules, proposes a large and chemically diverse library of new phenolic structures.
2. **Screen.** Candidates are filtered for structural eligibility, synthetic accessibility, phenolic O–H bond strength, preference for nonpolar (oil-like) environments, and predicted toxicity.
3. **Simulate.** Reactive molecular dynamics tests the remaining candidates in a representative lubricant environment and ranks them by how strongly they resist reverse hydrogen transfer, the reaction that regenerates harmful peroxyl radicals and undoes an antioxidant's work.
4. **Explain.** Neural networks learn the simulated reaction rates, and interpretation methods reveal which molecular features matter.

**What we found.**

- **Promising families.** Amide-containing, ortho-*tert*-butyl, and aryl-ketone phenols stood out among the candidates that best resisted the reverse reaction.
- **A shared design principle.** The strongest candidates limit access to their reactive phenoxyl oxygen, through steric shielding, stable hydrogen-bonded pairing with neighboring radicals, and slower molecular motion.
- **Machine learning agrees with the chemistry.** SHAP analysis of a neural network identified hydrogen-bond probability, steric shielding, and molecular mobility as the most influential factors. Masking substructures in a graph neural network independently linked amide, carboxylic acid, ketone, and aldehyde groups to slower reverse reactions.
- **From screening to the lab.** The framework produces a ranked candidate library and practical design rules that point to concrete targets for synthesis and experimental testing.

**Status.** The manuscript is in internal review. I presented the machine-learning side of this work at the TMS Annual Meeting 2026.

Related explainer: [Can generative AI help design better lubricant molecules?]({{ '/perspectives/generative-ai-molecules-tribology/' | relative_url }}) · [Talks]({{ '/publications/#talks-and-posters' | relative_url }})

## How lubricant additives interact

**The question.** Lubricants contain many additives, and their combined effect is not simply the sum of their parts: some combinations reinforce each other (synergy), while others interfere (antagonism). The molecular origins of these effects are still poorly understood.

**My work.** In a new collaboration with Chevron Oronite, I fine-tune pretrained machine-learned interatomic potentials, such as MACE and UMA, and evaluate others such as eSEN, to model interactions between lubricant additives. These models bring close-to-quantum-chemistry detail to systems far larger than direct quantum calculations can reach.

**Status.** Ongoing research, started in 2026.

Related explainer: [Machine-learning interatomic potentials, explained from zero]({{ '/perspectives/machine-learning-interatomic-potentials-explained/' | relative_url }})

## Chemical literature mining

**Goal.** Turn a broad literature search into a traceable collection of reported lubricant antioxidants.

**My work.** I built an open-source pipeline that runs a local LLM on university GPU nodes. It scores literature records for relevance, extracts named compounds into structured output, links names to PubChem records, and filters molecular structures with RDKit. Python and SLURM organize the workflow on the cluster.

**Results.** The pipeline screens the literature at scale, narrowing a broad search to the records worth a closer look before extracting compounds. Its curated molecules helped seed the training data for the generative antioxidant work above. The project note describes the extraction results, model comparisons, and current validation limits.

<figure class="essay-figure">
<img src="{{ '/assets/blog/llm-relevance-scores.png' | relative_url }}" alt="Distribution of LLM relevance scores across the screened literature records, showing that only a small fraction score high enough for further investigation." width="3500" height="2250" loading="lazy">
<figcaption>Relevance screening narrows a broad literature collection before compound extraction.</figcaption>
</figure>

**Status.** Public code and a project walkthrough are available.

[Code: llm-literature-mining](https://github.com/sahmed73/llm-literature-mining) · [Methods, results, and limitations]({{ '/perspectives/reading-a-million-papers-with-a-local-llm/' | relative_url }})

## Antioxidant radical stability

A phenolic antioxidant donates a hydrogen atom to a peroxyl radical and becomes a phenoxyl radical itself. How stable that radical is largely decides how well the antioxidant performs. I used REACTER-based reactive molecular dynamics to compare the reverse hydrogen-transfer rates of a large set of single-ring phenoxyl radicals in a polyalphaolefin hydroperoxide environment. Strong hydrogen bonding and steric hindrance around the phenoxyl oxygen lowered the rate, and faster diffusion raised it. I complement these simulations with DFT transition-state searches in Gaussian and ORCA to study the energetics of hydrogen abstraction.

Paper: [ACS Omega, 2026](https://doi.org/10.1021/acsomega.6c00592)

## Reaction pathways from reactive simulations

Reactive MD trajectories contain many bond-breaking and bond-forming events, which makes it hard to say which products form and how. I developed a tracking method that follows the dominant products back through specific bond changes, and used it to identify the most likely thermo-oxidation pathways of modified lignin model compounds.

Paper: [J. Phys. Chem. A, 2024](https://doi.org/10.1021/acs.jpca.4c00964)

## Research software

I built an interactive molecule viewer for exploring molecular structures and LAMMPS data files in the browser. It supports example molecules, structure customization, and image and rotation-video exports. This complements my Python and Bash workflows for setting up, monitoring, and analyzing simulation runs.

[Open the molecule viewer]({{ '/molecule-viewer/' | relative_url }})

## Tools

LAMMPS, ReaxFF, REACTER, ASE, Gaussian, ORCA, PyTorch, MACE, UMA, RDKit, and SLURM-based GPU and HPC clusters. Most of my simulation workflows are automated with Python and Bash so that large batches of runs can be set up, monitored, and analyzed consistently.
