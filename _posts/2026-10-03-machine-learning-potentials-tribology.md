---
layout: post
title: "Learning the forces behind friction"
description: "How machine-learning interatomic potentials bring detailed chemistry into tribology simulations—and what makes their predictions trustworthy."
permalink: /perspectives/machine-learning-potentials-tribology/
date: 2026-10-03 07:00:00 -0700
category: Short reviews
topic: Machine-learning interatomic potentials
reading_time: 6
series_number: "02"
cover_title: "Atomic forces.<br>Sliding surfaces."
visual: potential
---

At a sliding contact, molecules can be compressed, stretched, and transformed. Understanding this chemistry matters when we want to explain how a lubricant works, how a protective film develops, or why a surface begins to wear.

Molecular dynamics follows atoms as they move. Its usefulness depends on the model supplying the forces. Machine-learning interatomic potentials (MLIPs) offer a way to learn those forces from quantum calculations and use them in larger or longer simulations than would usually be practical with the reference method.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>

> **The central idea:** an MLIP makes a learned approximation to atomic interactions. Its value in tribology depends on whether that approximation holds under the chemistry, pressure, and motion of the contact being studied.

<details class="essay-toc" open>
<summary>In this review</summary>
<ol>
<li><a href="#what-does-an-interatomic-potential-do">What does an interatomic potential do?</a></li>
<li><a href="#why-sliding-contacts-are-a-hard-test">Why sliding contacts are a hard test</a></li>
<li><a href="#a-published-example-carbon-based-lubricants">A published example: carbon-based lubricants</a></li>
<li><a href="#learning-where-the-model-needs-help">Learning where the model needs help</a></li>
<li><a href="#what-i-would-validate-before-trusting-a-result">What I would validate before trusting a result</a></li>
<li><a href="#the-connection-to-antioxidant-research">The connection to antioxidant research</a></li>
<li><a href="#references">References</a></li>
</ol>
</details>

## What does an interatomic potential do?

An interatomic potential relates atomic positions and chemical identities to energy and forces. In an energy-based model, a force follows from how the predicted energy changes when an atom moves. The molecular dynamics calculation then uses those forces to advance the atoms through time.

Behler and Parrinello demonstrated a neural-network representation of a potential-energy surface using reference calculations from density functional theory (DFT). Their approach helped establish how learned models could describe systems containing many atoms without carrying out a fresh electronic-structure calculation at every simulation step.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>

Modern models also encode geometric structure. NequIP, for example, uses equivariant neural networks: rotating a configuration rotates the relevant vector quantities consistently. This helps the model use reference data efficiently. The published demonstrations establish a modeling capability; they do not make every trained NequIP model suitable for every tribological system.<sup><a href="#ref-2" aria-label="Reference 2">[2]</a></sup>

An MLIP supplies interactions. Friction must still be measured from a simulation with defined surfaces, load, sliding motion, and thermal conditions.

## Why sliding contacts are a hard test

A training set of relaxed structures can leave out the configurations that matter during sliding. Close contacts, distorted bonds, exposed surfaces, and new reaction products may appear as the simulation evolves. A potential must have suitable reference information for those situations if it is to describe them reliably.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup>

This is an issue of **coverage**: has the model learned the region of configuration space the simulation is visiting? A low average error on familiar structures cannot answer that question for an unfamiliar reaction. Active-learning research addresses precisely this problem of detecting configurations that need new reference calculations.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup>

For tribology, I would therefore define the intended operating conditions before choosing training data. The relevant surfaces, lubricant composition, temperature range, and loading conditions determine which atomic environments need attention.

## A published example: carbon-based lubricants

Pacini and colleagues developed an active-learning workflow for neural-network potentials aimed at carbon-based lubricant simulations. Their training systems included diamond surfaces and glycerol-related environments, and their sliding simulations examined confined glycerol. The study reported different behavior at high and low loads and better agreement with the considered nanoscale friction measurements than the tested ReaxFF description.<sup><a href="#ref-4" aria-label="Reference 4">[4]</a></sup>

This is a useful demonstration of why the interaction model matters. Its scope also matters: success for those compositions and conditions is evidence for that application. It does not establish that an MLIP will always outperform a reactive force field, or that the same trained potential can be moved directly to an unrelated lubricant–surface combination.

## Learning where the model needs help

Active learning makes reference-data collection an iterative process. Run exploratory simulations, identify unfamiliar configurations, compute their reference energies and forces, and improve the potential. Podryabinkin and Shapeev demonstrated a configuration-selection strategy for linearly parametrized potentials.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup>

<figure class="review-workflow"><p>Reference data → Train → Explore → Select → Calculate → Retrain</p><figcaption>An active-learning loop concentrates new reference calculations on configurations that need attention.</figcaption></figure>

The practical question is whether the selection criterion notices the failures that matter. I would check the chosen uncertainty or novelty indicator against actual reference errors before relying on it to screen a long trajectory. I would also retain an independent validation set throughout the loop.

## What I would validate before trusting a result

For a tribology project, my validation plan would go beyond a single energy or force error:

- **Relevant chemistry.** Check reactants, products, and representative configurations along important reaction pathways against a consistent reference method.
- **Relevant interfaces.** Test the lubricant near the intended surface, including compressed and distorted configurations. An isolated molecule is a different environment.
- **Independent conditions.** Hold out complete trajectories or operating conditions during evaluation. Nearby frames from the same trajectory can make a test unusually easy.
- **Stable dynamics.** Examine energy behavior in an appropriate unthermostatted check, sensitivity to the timestep, and whether atoms explore implausible configurations.
- **The observable itself.** Check friction, structure, and reaction products under clearly reported loading, sliding, and thermostat conditions. Compare with experiments when comparable measurements exist.

These are proposed checks for a study, rather than a universal certificate of accuracy. The reference calculations also have approximations; training against them does not remove their limitations.

## The connection to antioxidant research

My research uses reactive molecular dynamics to connect molecular structure with oxidation chemistry. Our work on modified lignin structures showed how tracking species and bonds can identify reaction products and likely thermo-oxidation pathways.<sup><a href="#ref-5" aria-label="Reference 5">[5]</a></sup>

A validated MLIP could support a related goal: examine selected additive reactions with an interaction model trained for that chemistry. For an oxidation problem, I would pay particular attention to oxygen-containing species, radicals, and whether the electronic states assumed by the reference method are appropriate. That application would need its own training and validation; it is a direction to investigate, not a result claimed here.

There is also a natural connection to [generative molecular design]({{ '/perspectives/generative-ai-molecules-tribology/' | relative_url }}). A generator proposes candidates. A suitable potential helps investigate their behavior. Reaction analysis turns the trajectories into chemical explanations, and experiments determine whether those explanations translate into useful lubricant performance.

## References

<ol class="references">
<li id="ref-1">Behler, J., &amp; Parrinello, M. (2007). <a href="https://doi.org/10.1103/PhysRevLett.98.146401">Generalized Neural-Network Representation of High-Dimensional Potential-Energy Surfaces.</a> <em>Physical Review Letters</em>, 98, 146401.</li>
<li id="ref-2">Batzner, S., et al. (2022). <a href="https://doi.org/10.1038/s41467-022-29939-5">E(3)-equivariant graph neural networks for data-efficient and accurate interatomic potentials.</a> <em>Nature Communications</em>, 13, 2453.</li>
<li id="ref-3">Podryabinkin, E. V., &amp; Shapeev, A. V. (2017). <a href="https://doi.org/10.1016/j.commatsci.2017.08.031">Active learning of linearly parametrized interatomic potentials.</a> <em>Computational Materials Science</em>, 140, 171–180.</li>
<li id="ref-4">Pacini, A., Ferrario, M., Loehle, S., &amp; Righi, M. C. (2024). <a href="https://doi.org/10.1140/epjp/s13360-024-05348-z">Advancing tribological simulations of carbon-based lubricants with active learning and machine learning molecular dynamics.</a> <em>The European Physical Journal Plus</em>, 139, 549.</li>
<li id="ref-5">Ahmed, S., Eder, S. J., Dörr, N., &amp; Martini, A. (2024). <a href="https://doi.org/10.1021/acs.jpca.4c00964">Tracking Thermo-Oxidation Reaction Products and Pathways of Modified Lignin Structures from Reactive Molecular Dynamics Simulations.</a> <em>The Journal of Physical Chemistry A</em>, 128(27), 5398–5407.</li>
</ol>
