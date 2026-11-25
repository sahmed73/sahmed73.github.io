---
title: "An agent harness ran a weeks-long DFT study and caught its own overclaim"
description: "MatHarness coordinated multiple agents on Cu-Zn surface segregation, using about 10^3 GPU-hours, and an auditor overturned one of its claims."
date: 2026-11-25 07:10:47 -0800
slot: agents
source_id: "arxiv:2611.28324"
source_title: "MatHarness: Towards Long-Horizon Open-ended AutoResearch for Computational Materials Science"
source_authors: "Yanlin Fei, Lei Li, Shaolong Chen et al."
source_venue: "arXiv preprint"
source_date: 2026-11-20
source_url: "https://arxiv.org/abs/2611.28324"
---

## What's new

MatHarness is an agent harness for open-ended, long-horizon computational materials research, covering ideation through manuscript writing. It combines three mechanisms. Execution robustness comes from pre-flight verification, expert-distilled skills, and just-in-time auditing. Epistemic adaptability comes from persistent research artifacts and an evolving scientific mental model. Collective intelligence comes from a multi-agent round table of different models under targeted human oversight.

The test case was adsorbate-induced surface segregation in Cu-Zn alloys, an open question in methanol-synthesis catalysis. Over a multi-week run using roughly 10^3 GPU-hours, 50 production DFT relaxations were prescreened by 171 machine-learning-potential evaluations. The system revised its plan six times, recovered on its own from failed calculations, and had an independent auditor overturn one of its over-attributed claims before publication. Within the sampled dilute-limit metallic models, the DFT analysis supports a tendency toward greater surface Cu exposure at both composition endpoints, with facet- and coverage-dependent exceptions. The results were compiled into a full manuscript, with humans mainly handling specification, approval, and steering. Code is public.

## Why it matters

Most science agents run fixed workflows. This work shows what an open-ended run looks like in practice, including the useful detail that a separate auditor can catch overstated conclusions.

## Caveats

This is a preprint describing one case study, so generality is untested. The scientific conclusion is limited to the sampled dilute-limit models. Human oversight remained part of the loop, and the abstract reports no comparison against other agent systems or human-only workflows.
