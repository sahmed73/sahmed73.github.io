---
title: "Eight LLMs identify a hidden chemical only 24% to 67% of the time"
description: "ChemDeduce lets LLMs run simulated experiments to identify an unknown substance and finds weak experiment selection and hypothesis updating."
date: 2026-11-28 07:12:30 -0800
slot: agents
source_id: "arxiv:2611.33848"
source_title: "ChemDeduce: Benchmarking LLMs for Unknown Chemical Identification through Interactive Simulated Experiments"
source_authors: "Hengyi Cai, Yuqi Tang, Zichang Li et al."
source_venue: "arXiv preprint"
source_date: 2026-11-25
source_url: "https://arxiv.org/abs/2611.33848"
---

## What's new

Large language models do well on chemistry knowledge questions, but it is unclear whether they can solve problems whose answers must be found through experiments. ChemDeduce tests this with a task called Unknown Chemical Identification. The model must design experiments, interpret the observations, update its hypotheses, and finally name a hidden substance.

The benchmark treats identification as a sequential decision process inside a stateful simulated laboratory, with explicit instrument and operational constraints. This makes the evaluation repeatable and easy to scale.

The authors tested eight frontier LLMs on 200 chemicals. That gives 1,600 model-target pairs and 4,800 episodes over three independent repetitions. They scored identification accuracy, operational compliance, interaction efficiency, and the quality of the reasoning along each trajectory.

Average identification accuracy ranged from 23.83% to 67.33% across the models. The authors say the models often produce plausible-looking experimental plans but are weak at choosing experiments, interpreting evidence, and refining hypotheses step by step.

## Why it matters

Agentic chemistry systems are only useful if they can decide what to measure next and learn from the result. Static question-answering benchmarks do not test that loop. A benchmark with a controlled simulated lab gives a way to compare models on closed-loop reasoning before connecting them to real instruments.

## Caveats

This is a preprint, and the experiments are simulated, so real instruments, noise and safety constraints are not tested. The 200 chemicals and the lab model define the scope of the results. The summary rests on the abstract, so per-model scores, task design details and the trajectory-quality findings are not reported here.
