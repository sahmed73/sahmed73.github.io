---
title: "Five MLIPs fail on nitromethane decomposition, each for a different reason"
description: "A benchmark traces each machine-learned potential's error in reactive chemistry to a specific cause, and shows that only some fixes work."
date: 2026-11-26 07:10:57 -0800
slot: paper
source_id: "doi:10.26434/chemrxiv.15012828"
source_title: "Benchmarking Machine-Learned Interatomic Potentials for Reactive Chemistry: Failure Modes in Nitromethane Decomposition"
source_authors: "Cary B. Darwin, Jan Dunal, Steven O. Nielsen"
source_venue: "ChemRxiv preprint"
source_date: 2026-11-26
source_url: "https://doi.org/10.26434/chemrxiv.15012828"
---

## What's new

The authors tested five machine-learned interatomic potentials (MLIPs) on condensed-phase nitromethane decomposition. They compared each model with coupled-cluster dissociation energies and with published simulations, then traced every failure to a specific component.

The failures differ by model. The global spin label used by MACE-OMol-0 and UMA-S-1P1 produces a spurious rise of about 25 kcal/mol as fragments separate. ANI-1xnr has gaps in its training data and underbinds dissociation into two polyatomic radicals by up to 48 kcal/mol. MACE-OFF23 and MACEOsaka24 lack close-contact configurations in training, which gives unphysical energies at short distances, more severely in MACE-OFF23.

The remedy depends on the cause. The spin-label artifact cannot be fixed within the models' input format. The ANI-1xnr error drops to within 1 kcal/mol after physics-constrained data augmentation. The short-range failure of MACE-OFF23 persists even with a standard screened nuclear repulsion term.

## Why it matters

Reactive simulations of radicals and bond breaking, such as oxidation and antioxidant chemistry, depend on potentials that stay correct as bonds stretch and fragments separate. Aggregate energy and force errors can hide exactly these problems. This work shows how to diagnose them: check dissociation curves against high-level references and look at close-contact behavior.

The authors also report that corrected dissociation energies do not by themselves restore physical decomposition kinetics. They argue that MLIPs should be judged by their failure modes and by the observables they predict.

## Caveats

This is a ChemRxiv preprint and has not been peer reviewed. It covers one system, nitromethane, and five models, so the failure modes may not carry over to other chemistry. The abstract does not say whether the failing models can be repaired in general, and one of the three fixes tested did not work.
