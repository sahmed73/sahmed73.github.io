---
title: "A polymer force-field paper survived two 'send it elsewhere' verdicts by narrowing its claims"
description: "SimPoly's three referees pushed on baseline fairness, chain structure and a priority claim; the authors answered with new tests and more modest framing."
date: 2026-11-26 17:35:37 -0800
slot: dissection
reading_time: 5
source_id: "doi:10.1038/s41467-026-78736-x"
source_title: "SimPoly: Simulation of polymers with machine learning force fields derived from first principles"
source_authors: "Gregor N. C. Simm, Jean Hélie, Hannes Schulz et al."
source_venue: "Nature Communications"
source_date: 2026-11-09
source_url: "https://doi.org/10.1038/s41467-026-78736-x"
topic: mlip
referee_file: "https://static-content.springer.com/esm/art%3A10.1038%2Fs41467-026-78736-x/MediaObjects/41467_2026_78736_MOESM2_ESM.pdf"
referee_license: "CC BY 4.0"
review_rounds: 3
---

## The claim

A machine-learning force field trained only on quantum-chemical data, with no experimental input, predicts the measured densities of a chemically diverse set of polymers and captures the glass transition in their density-temperature curves.

## What is new

The paper has three parts: Vivace, an equivariant graph neural network built for speed with several cutoff radii; PolyData, a quantum-chemical training set of packed periodic polymer structures, dissociation curves and molecular fragments; and PolyArena, a benchmark of measured densities and glass transition temperatures (Tg) for 130 polymers. The authors position the work against two gaps: classical force fields that lack accuracy and transferability for polymers, and machine-learned potentials that are usually judged on energy and force errors rather than on bulk properties people measure.

## The evidence stack

Vivace is compared with two machine-learned potentials (MACE-OFF and UMA) and with classical force fields, on density across the benchmark and on Tg for a subset. Tg comes from fitting the change in slope of density against temperature. During review the Tg set grew from 10 to 22 polymers with a fittable transition, fits moved to per-replica estimates with confidence intervals, and new appendices tested protocol choice, system size and chain length. A cutoff ablation shows the simulation box collapsing when the cutoff is too short. One note from the authors' response: after the authors of a classical benchmark corrected their published data, that classical force field's density error came out on par with Vivace's.

## Referee room

**Referee 1** was supportive from the start but listed seven requests. The largest was that density can look right while the chains sit in far-from-equilibrium shapes, so the referee asked for chain-level evidence such as radius of gyration, dihedral distributions and pair distributions. They also asked for failure rates of unstable runs, simulation lengths, a reason for weaker results on PVC, and noted that the code link returned a 404. The authors added stability statistics, structure comparisons for three polymers and chain-length tests. They also found that their methods text was wrong: chains were not fixed at six per box, as written, but at ten repeat units, with many chains per cell. Referee 1 endorsed publication after one round.

**Referee 2** asked for more observables (viscosity, heat of vaporization, heat capacity), chain conformations, tests at other temperatures and pressures, an account of Tg errors, and whether seeding the training structures with a classical force field biased the data. The authors declined the transport and thermal properties, arguing that no standard protocol scales to this many polymers, and added the structural analyses. In round two the referee said the comments were only "partially addressed", pressed again on radius of gyration and heat capacity, and challenged the claim to be first by pointing to an earlier machine-learned force field that predicted polymer densities and glass behavior. The authors added a chain-length study of radius of gyration, left heat capacity for future work, cited the earlier work and narrowed their priority claim to chemical breadth: many elements and polymer families rather than one family. Referee 2 was satisfied in round three.

**Referee 3** was the most critical. They argued the comparison was uneven, since Vivace was fine-tuned on PolyData while the baselines were used as released, and that Tg on ten polymers was too thin next to a classical force field tested on hundreds. They judged that the paper "feels more like a validation of a new dataset" and suited a specialist journal. The authors argued that fine-tuning the baselines would not isolate the architecture, stated that they do not claim Vivace is universally more accurate, expanded the Tg set and recast the contribution as methodological. In round two Referee 3 called the revision a substantive improvement but held that choosing a short-cutoff MACE model and then citing its cutoff to avoid a fairer test was circular. They asked for a zero-shot test of MACE-MH-1, a larger-cutoff MACE foundation model. Licensing kept the authors from running it themselves, so the model's developers ran it with their protocol. It avoided the collapse but still underpredicted the density of the polymer tested, and Referee 3 recommended acceptance.

**Shared concerns.** All three referees raised chain length or molecular weight. Two asked for chain-level structure, two asked how and why simulations failed, two reported the broken code link, and two said the paper might belong in a specialist journal.

## What convinced the referees, and what nearly sank the paper

The risk was significance, not correctness. Referee 3 in round one and Referee 2 in round two both recommended a specialist journal, Referee 2 explicitly agreeing with Referee 3. What moved Referee 3 is on record: the larger Tg set, the per-replica fits and the robustness appendices were called substantive, and acceptance was tied to one specific experiment, the MACE-MH-1 comparison, which the authors then reported. Referee 2 ended by saying all comments had been addressed.

## Lessons for computational-chemistry and MLIP authors

- Compare against the strongest fitting baseline, not a convenient one. Using a baseline's known weakness as the reason to skip a fairer test reads as circular.
- Show that the structure is right, not only a bulk number. Density can be correct with wrong chain shapes.
- Report failed and unstable runs with rates and causes, and give every simulation length.
- Make the code reachable at submission; two of three referees hit a dead link.
- Check preprints before claiming to be first, and state precisely what is new.
- When a requested calculation is out of reach, say why and offer the closest feasible evidence.

## Claude's reading

This is interpretation, not the referees' or editors' stated reasons. The paper seems to have been accepted less for beating other models than for its reframed claim: bulk polymer behavior predicted without experimental input, plus a benchmark and dataset others can use. The corrected classical reference data, which erased the density advantage, may have made that reframing necessary. The narrowing of claims looks as decisive as the new calculations.

## Caveats

One paper is not a rule, and accepted papers only show what got through review. The article was available only as an early preview, so this rests on the abstract and the peer review file; figures in the response letters may differ in the final text, and the letters themselves give two different values for one uncalibrated Tg error. The file leaves out confidential comments and editors' discussions. Quotes are from the anonymous referees, under the file's CC BY 4.0 licence.
