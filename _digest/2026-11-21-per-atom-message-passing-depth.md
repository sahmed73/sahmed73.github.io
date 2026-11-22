---
title: "Letting each atom choose its own message-passing depth improves molecular property prediction"
description: "PRISM lets each atom pick how many message-passing steps to use, lowering errors on solubility and hydration free energy against eight baselines."
date: 2026-11-21 18:12:24 -0800
slot: field
source_id: "doi:10.1021/acs.jcim.6c03221"
source_title: "Atom-Wise Allocation of Message-Passing Scale for Molecular Property Prediction"
source_authors: "Regina Qianru Zhang, Honggang Wen, Zongru Li et al."
source_venue: "Journal of Chemical Information and Modeling"
source_date: 2026-11-20
source_url: "https://doi.org/10.1021/acs.jcim.6c03221"
---

## What's new

Most graph neural networks (GNNs) pass messages between atoms for a fixed number of steps, so every atom sees the same neighborhood size. The authors argue this is a poor fit: some properties depend on a local polar group, others on a larger substructure.

Their method, PRISM, lets each atom choose its own scale. A single bounded number per atom positions a distribution over the intermediate message-passing states, along with matching circular-fingerprint radii. Because the profile is controlled by one coordinate, the allocated depth has a closed-form relationship to that number.

Using scaffold splits and equal tuning budgets against eight graph, fingerprint, and geometric baselines, PRISM trained from scratch without 3D coordinates reached the lowest mean error on aqueous solubility and hydration free energy. It was also strong on BACE and BBBP. As a drop-in layer-combination rule, it cut hydration free energy error by up to 29% relative to last-layer readout on GCN, GIN, and GAT backbones. On a pretrained GIN it beat last-layer readout on four of six endpoints.

## Why it matters

Property models for molecules and lubricant-like compounds often rely on one fixed GNN depth. This work shows that depth can be learned per atom, cheaply, and inspected: allocated depth differed between atom types in a task-dependent way, so it acts like a learned form of atom typing.

## Caveats

The reported benchmarks are standard solubility, hydration, and bioactivity endpoints. The abstract does not report tests on lubricant, antioxidant, or reactive-chemistry properties. Only the abstract was read for this summary, so the numbers above are limited to what it states.
