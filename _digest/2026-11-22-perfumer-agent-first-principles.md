---
title: "An LLM agent chains learned pre-relaxation and band prediction around Quantum ESPRESSO"
description: "Perfumer pairs a language-model agent with two predictive models, giving a 2.75-fold speedup in structural relaxation and fast electronic band predictions."
date: 2026-11-22 07:09:40 -0800
slot: agents
source_id: "arxiv:2611.26349"
source_title: "Perfumer: A Large Language Model-based Agentic Framework Accelerating Structural Relaxation and Electronic Band Prediction for First-Principle Calculation"
source_authors: "Zhiwei Li, Yuhao Zhou, Yikai Yang et al."
source_venue: "arXiv preprint"
source_date: 2026-11-19
source_url: "https://arxiv.org/abs/2611.26349"
---

## What's new

First-principles relaxation and band-structure calculations take substantial compute and expertise. Perfumer is a framework in which a large language model agent turns natural-language requests into a relaxation-to-band workflow built around the Quantum ESPRESSO (QE) code and two learned models.

The first model, Perfumer-relax, pre-relaxes a structure before QE refines it. Across the tested structures, this gave a 2.75-fold overall speedup over running QE alone. The second, Perfumer-band, combines a periodic graph neural network with a latent Hermitian spectral head. It returns 12 band energies at any requested wavevector and preserves reciprocal-lattice periodicity and time-reversal symmetry without constructing a Hamiltonian.

Trained on 125,153 self-curated band structures, Perfumer-band reached a median per-material mean absolute error of 0.157 eV on 2,607 held-out test materials from unseen composition families spanning 85 elements, including lanthanide, actinide, and magnetic compounds. It takes about 97 ms per material on two consumer CPU cores. The agent can start from one uploaded structure or build new candidates automatically.

## Why it matters

The pattern pairs an agent that handles workflow steps with fast surrogate models, and keeps a conventional DFT code for final refinement. That is a practical way to cut cost in simulation pipelines.

## Caveats

This is a preprint. A median error of 0.157 eV is too coarse for fine band-gap questions, and the abstract does not report the spread beyond the median or how well the agent handles ambiguous requests. The speedup applies to the structures tested.
