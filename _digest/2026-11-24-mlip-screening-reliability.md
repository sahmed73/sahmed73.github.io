---
title: "Better uncertainty scores did not cut DFT costs when screening materials with MLIPs"
description: "A preprint tests reliability checks for foundation MLIPs and finds that gains on standard metrics often fail to improve the final screening decision."
date: 2026-11-24 07:11:12 -0800
slot: field
source_id: "arxiv:2611.30066"
source_title: "Diagnostic Accuracy Is Not Deployment Value: Decision-Aligned Reliability Evaluation for Foundation MLIPs in Materials Discovery"
source_authors: "Harry Sevi, Joonatan E. M. Laulainen"
source_venue: "arXiv preprint"
source_date: 2026-11-23
source_url: "https://arxiv.org/abs/2611.30066"
---

## What's new

Foundation machine-learned interatomic potentials (MLIPs) are often used to rank candidate crystal structures so that only the most promising ones get checked with expensive DFT calculations. This preprint asks whether common reliability tools actually improve that decision. The authors study three models (MACE-MP, CHGNet and Orb V3) and three interventions: novelty detection, calibration using a small number of DFT calculations, and audits of ranking quality by chemistry.

Their yardstick is a deployment objective: how much DFT can be avoided while still recovering a required share of candidates near the convex hull (the stability line).

Across all three interventions, a signal could succeed at its own goal without improving the final screening. Novelty detection spotted distribution shift but only weakly indicated how badly a prediction would fail. Calibration could improve pooled ranking metrics while leaving screening unchanged or making it worse. Audits flagged model and chemistry pairs with poor ranking, but did not yield a routing policy that was reliably beneficial.

## Why it matters

Groups that use universal MLIPs for screening, including for new molecules or materials, often report uncertainty, calibration or ranking scores. This work argues that those scores should be judged against the decision they support, and that the cost of gathering more information must be weighed against what it changes. The authors also show that under formation-energy screening, even perfect knowledge of average ranking reliability can select the wrong model.

## Caveats

This is a preprint and has not been peer reviewed. The study covers three foundation models and a hull-based screening task, so the conclusions may not carry over to other tasks, such as molecular or reactive simulations. In the hull-aligned variant, the authors find the target becomes decision-aligned but audits with a finite budget still fail to deliver the value.
