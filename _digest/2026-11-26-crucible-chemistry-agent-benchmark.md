---
title: "Best LLM agent scores 0.545 on a chemistry benchmark with 75 tools"
description: "Crucible Bench tests 14 LLMs as agents across the design-make-test-analyze cycle and finds they often return chemically invalid results."
date: 2026-11-26 07:10:57 -0800
slot: agents
source_id: "arxiv:2611.34254"
source_title: "Crucible: Evaluating LLM Agents in Executable Chemistry Research Environments"
source_authors: "Yinjun Liu, Xinye Li, Ruisen Peng et al."
source_venue: "arXiv preprint"
source_date: 2026-11-25
source_url: "https://arxiv.org/abs/2611.34254"
---

## What's new

Most chemistry benchmarks for language models test question answering. Crucible Bench instead tests whether an agent can use specialized tools and interpret their output. It has 1,078 tasks in 12 families, curated from 18 published datasets. The tasks cover all four stages of the design-make-test-analyze cycle: molecular design, synthesis planning, experimental execution, closed-loop optimization, simulation, and analytical characterization.

Agents reach 75 domain-specific tools through the Model Context Protocol in seven isolated environments. Sandboxed graders verify outputs such as synthesis routes and experimental protocols. Laboratory tasks use robotic simulators or previously measured experimental data.

The authors evaluated 14 LLMs as agents. The best reached an overall score of 0.545, and synthesis planning and closed-loop optimization were the hardest domains. Overall rank did not predict optimization performance well: the model ranked twelfth overall scored highest in closed-loop optimization. Stronger models gained more from tool access.

## Why it matters

Automated research workflows depend on agents that run software and then judge the results. The error analysis found that agents often submit chemically invalid results even when their tools ran successfully. A benchmark with verifiable graders gives a way to track that gap as models improve.

## Caveats

This is an arXiv preprint. Laboratory tasks run on simulators or earlier measurements, not live instruments. Scores depend on the chosen tasks, tools and graders, so they show relative standing on this benchmark only.
