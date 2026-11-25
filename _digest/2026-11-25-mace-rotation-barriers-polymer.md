---
title: "A general MLIP tracks rotation barrier shapes in a bio-based polymer, but runs low"
description: "MACE-OFF23 matched DFT dihedral scans of a soybean-oil acrylate fragment closely in shape but underestimated barrier heights by 3-20%."
date: 2026-11-25 07:10:47 -0800
slot: paper
source_id: "arxiv:2611.24148"
source_title: "Machine learning interatomic potentials and orientational defects in polymers"
source_authors: "Arnold Kiv, Volodymyr Soloviev, Andrii Tuzhykov et al."
source_venue: "arXiv preprint"
source_date: 2026-11-18
source_url: "https://arxiv.org/abs/2611.24148"
---

## What's new

The authors study UV curing of acrylated epoxidized soybean oil, a bio-based polymer formed by a free-radical chain reaction. They recorded the dielectric permittivity of a curing mixture under on/off illumination and analysed the time series with entropy-based measures. Short light pulses early in curing trigger strongly correlated, collective relaxation. As the network forms, only localized reorientations remain active.

They describe these reorientations as orientational defects and estimate their energy cost with the MACE-OFF23 machine learning interatomic potential. Relaxed dihedral scans of five rotational modes in a fragment were compared against density functional theory (DFT). MACE reproduced the shape of all five profiles (Pearson r = 0.95-0.98) and the order of the barriers: 2.9 eV for the constrained main-chain rotation, 0.54-0.81 eV for acrylate rotations, 0.16-0.18 eV for methyl and 0.06 eV for hydroxyl. It underestimated barrier heights by 3-20%. A simple Arrhenius estimate suggests the acrylate rotations lie closest to the frequency window of the dielectric measurement.

## Why it matters

Torsional barriers set how flexible molecular groups move, which matters for polymers, base oils, and additives alike. The paper shows a pretrained, general-purpose potential can give useful relative barrier rankings for a fragment of a real bio-based material at far lower cost than DFT, which is a practical check for anyone planning MLIP-based simulations of organic liquids or networks.

## Caveats

This is a preprint. The potential was tested on one small fragment and on dihedral scans only, not on the radical chain chemistry itself. The systematic underestimate of barriers (up to 20%) would shift rates exponentially in an Arrhenius picture, so quantitative use needs correction or fine-tuning. The link between computed barriers and the dielectric data is an estimate, not a direct test.
