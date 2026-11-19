---
layout: post
title: "Machine-learning interatomic potentials, explained from zero"
description: "A beginner-friendly, detailed guide to MLIPs: energy and forces, training data, neural networks, graphs, equivariance, MACE and other architectures, prediction heads, foundation models, and reliable molecular dynamics."
permalink: /perspectives/machine-learning-interatomic-potentials-explained/
date: 2026-10-22 00:00:00 -0700
category: Explainers
topic: Machine-learning interatomic potentials
reading_time: 52
---

You open a paper about molecular simulation and find names such as MACE, NequIP, and Deep Potential. Then come the settings: a cutoff, interaction layers, hidden features, angular momentum, an energy head, force weights, and fine-tuning. It is easy to recognize the words without understanding what the model actually does.

This article starts before all of that. We will begin with two atoms, follow how their energy changes with distance, and explain how a computer learns that relationship. From there, we will build up to many atoms, neural networks, graphs, modern architectures, and the different things people mean by a **head**. No machine-learning background is assumed. A few equations appear, but each is followed by its meaning in words.

> **The central idea:** a machine-learning interatomic potential learns a rule for the energy of an arrangement of atoms. In an energy-based model, the forces come from the slope of that learned energy. Molecular dynamics uses those forces to move the atoms. The architecture determines how the model represents the arrangement; the training data determine which physical situations it has learned about.

The discussion draws on published research and the developers' documentation, rather than on a training experiment of my own. Software details were checked in October 2026. The architecture examples explain the main ideas; they are not a ranking of every available model.

<details class="essay-toc" open>
<summary>In this post</summary>
<ol>
<li><a href="#the-job-an-energy-landscape-for-atoms">The job: an energy landscape for atoms</a></li>
<li><a href="#a-two-atom-example">A two-atom example</a></li>
<li><a href="#what-an-mlip-receives-and-returns">What an MLIP receives and returns</a></li>
<li><a href="#what-learning-actually-means">What learning actually means</a></li>
<li><a href="#why-the-model-sees-neighborhoods">Why the model sees neighborhoods</a></li>
<li><a href="#the-symmetries-the-model-must-respect">The symmetries the model must respect</a></li>
<li><a href="#from-atoms-to-a-graph-neural-network">From atoms to a graph neural network</a></li>
<li><a href="#equivariance-without-the-intimidating-words">Equivariance without the intimidating words</a></li>
<li><a href="#the-main-architecture-families">The main architecture families</a></li>
<li><a href="#inside-mace-step-by-step">Inside MACE, step by step</a></li>
<li><a href="#what-a-head-actually-is">What a head actually is</a></li>
<li><a href="#foundation-models-and-fine-tuning">Foundation models and fine-tuning</a></li>
<li><a href="#building-a-training-set-that-teaches-the-right-physics">Building a training set that teaches the right physics</a></li>
<li><a href="#from-a-trained-model-to-molecular-dynamics">From a trained model to molecular dynamics</a></li>
<li><a href="#what-can-go-wrong">What can go wrong</a></li>
<li><a href="#a-worked-example-for-oxidation-chemistry">A worked example for oxidation chemistry</a></li>
<li><a href="#reading-papers-and-model-settings">Reading papers and model settings</a></li>
<li><a href="#a-beginners-route-through-the-subject">A beginner's route through the subject</a></li>
<li><a href="#glossary">Glossary</a></li>
<li><a href="#references">References</a></li>
</ol>
</details>

## The job: an energy landscape for atoms

### What an interatomic potential is

Imagine a water molecule. You can stretch an O–H bond, bend the H–O–H angle, or bring another molecule close to it. Each arrangement has an energy. Some arrangements are comfortable, some are strained, and some bring atoms so close together that they strongly repel.

An **interatomic potential** is a mathematical rule that assigns an energy to an arrangement of atoms. Here, *potential* means potential energy: energy associated with configuration. It does not mean a voltage, and it does not mean an atom's future possibilities.

The rule must also let us obtain forces. A force tells an atom which way to accelerate. If moving an atom slightly to the right lowers the energy, the force points to the right. In an energy-based potential, forces are calculated from the energy's downhill slope. We will make this precise in the next section.

An **MLIP**, short for *machine-learning interatomic potential*, is a potential whose rule has been fitted using machine learning. You will also encounter *machine-learning potential*, *ML force field*, and *neural-network potential*. These names overlap, although an MLIP need not use a neural network. Some use linear models or statistical methods called Gaussian processes. <sup><a href="#ref-1" aria-label="Reference 1">[1]</a> <a href="#ref-2" aria-label="Reference 2">[2]</a></sup>

### Where the target energy comes from

For most electronic-structure MLIPs, the reference energy comes from quantum calculations, commonly **density functional theory**, or DFT. DFT approximately solves the electron problem for a given arrangement of nuclei. Its total energy becomes the potential energy governing nuclear motion. If DFT itself is unfamiliar, [Quantum chemistry codes, explained from zero]({{ '/perspectives/quantum-chemistry-codes-explained/' | relative_url }}) covers the background.

The usual picture is the **Born–Oppenheimer approximation**: electrons adjust rapidly to nuclei that move much more slowly. For a specified electronic state, we can therefore regard the energy as a function of the nuclear positions. The collection of these energies is the **potential energy surface**, or PES. With two atoms it can be a curve; with many atoms it is a landscape in many dimensions.

A training calculation might provide the energy of a distorted water molecule and the forces on its three atoms. Repeat this for many arrangements, and the MLIP learns an approximation to the reference surface. It normally does not explicitly solve for the electrons during use. That avoided electronic calculation is the main reason for the speedup. <sup><a href="#ref-3" aria-label="Reference 3">[3]</a> <a href="#ref-4" aria-label="Reference 4">[4]</a></sup>

The reference method still matters. A model trained to imitate a particular DFT setup inherits its strengths and errors. “DFT accuracy” usually means agreement with the chosen DFT reference on specified tests; it is not a promise of exact chemistry or experimental accuracy.

### How this differs from a conventional force field

A conventional molecular force field often starts with prescribed terms for bond stretching, angle bending, electrostatics, and nonbonded interactions. Its parameters are fitted too. Machine learning does not introduce the idea of fitting; it offers flexible ways to represent and fit the energy relationship.

Some conventional force fields use a fixed bonding topology. Others are reactive: ReaxFF, for example, uses distance-dependent bond orders to let bonds form and break. Reactivity is therefore not exclusive to MLIPs. <sup><a href="#ref-5" aria-label="Reference 5">[5]</a></sup>

Both approaches can be used with classical nuclear dynamics, and both need validation for their intended chemistry. An MLIP's practical advantage is its ability to approximate a complex reference surface efficiently when the training data and representation are suitable.

### The potential and the simulation do different jobs

A molecular-dynamics program keeps track of positions, velocities, masses, and time. At each timestep it asks the potential for forces, then advances the atoms using an integration algorithm. A thermostat may regulate temperature; a barostat may regulate pressure. Neither is automatically part of the MLIP.

<figure class="review-workflow"><p>Current atom positions → MLIP energy and forces → Dynamics algorithm moves atoms → New positions → Repeat</p><figcaption>The potential supplies interactions. The dynamics algorithm supplies the motion through time.</figcaption></figure>

Consequently, an MLIP is not a stored movie of atoms moving. It can evaluate a structure that was not in a trajectory at all. It can also be used to optimize a geometry, estimate a reaction barrier, or calculate how a crystal responds to a distortion. ASE, the Atomic Simulation Environment, makes this distinction explicit: a *calculator* provides energies and forces, while separate tools perform optimization or dynamics. <sup><a href="#ref-6" aria-label="Reference 6">[6]</a> <a href="#ref-7" aria-label="Reference 7">[7]</a></sup>

## A two-atom example

Before discussing a neural network, consider a deliberately simple model of two atoms connected by a spring. Let their separation be r, and let the comfortable separation be r₀. Near that separation, a familiar energy model is:

<figure class="review-workflow"><p><strong>E(r) = ½ k(r − r₀)²</strong></p><figcaption>The energy grows as the atoms move away from their comfortable separation. The number k controls the stiffness.</figcaption></figure>

We will use invented values: r₀ = 1 Å and k = 4 eV/Å². An ångström, Å, is 10⁻¹⁰ metres, a useful unit for atomic distances. An electronvolt, eV, is a unit of energy. These numbers illustrate the mathematics; they are not parameters for a real chemical bond.

| Separation r | Energy E | Force on the atom on the right |
|---|---|---|
| 0.8 Å | 0.08 eV | +0.8 eV/Å: pushes it right, increasing separation |
| 1.0 Å | 0 eV | 0: the comfortable separation |
| 1.2 Å | 0.08 eV | −0.8 eV/Å: pulls it left, decreasing separation |
{: .wrap}

This table says something important: **the same energy does not imply the same force**. The two outer configurations have the same height on the curve, but they lie on opposite slopes.

The force on the right-hand atom, when the left-hand atom is held fixed, is:

<figure class="review-workflow"><p><strong>F = −dE/dr = −k(r − r₀)</strong></p><figcaption>The derivative dE/dr is the slope. The minus sign makes the force point downhill.</figcaption></figure>

You do not need calculus to understand the role of the derivative. Imagine nudging the atom and measuring how quickly energy changes. A steep energy change means a large force. A flat curve means a small force.

### What machine learning changes

For this spring, someone chose the equation first. Fitting it means finding a suitable stiffness and comfortable separation. A real bond is more complicated: strong compression gives steep repulsion, and stretching far enough can dissociate the atoms. The spring formula cannot describe the full dissociation curve.

A flexible learned model can instead fit a more general curve from reference examples. For a two-atom system with fixed elements and electronic state, its input can be just the separation. With many atoms, one distance is insufficient: bond angles, neighboring elements, and the rest of the relevant environment also matter.

The aim is not merely to connect the known energy points. The fitted curve must have sensible slopes between them. A curve can pass close to every energy label while wiggling badly between labels, producing incorrect forces. Force information helps constrain those slopes. Energy-conserving force-field research develops this connection explicitly. <sup><a href="#ref-4" aria-label="Reference 4">[4]</a></sup>

### Why the zero of energy is not the force

Add 10 eV everywhere on the spring curve. Every slope stays the same, so every force stays the same. The atoms move exactly as before. This is why an energy offset and a force error are different problems.

For a real model, energy references require care when comparing compositions or combining datasets. Forces alone cannot determine a separate constant energy offset for each element. We will return to this when discussing atomic reference energies and heads.

## What an MLIP receives and returns

### Inputs: a structure, not just a molecular formula

“Water” or “H₂O” is insufficient input. The model needs to distinguish a bent molecule from a stretched or dissociating one. A typical atomistic input contains:

| Input | Plain meaning |
|---|---|
| Element of every atom | Which nuclei are present: H, C, O, Fe, and so on |
| Position of every atom | Three coordinates locating each atom |
| Simulation cell | The three vectors defining a periodic box, when used |
| Periodic-boundary flags | Which directions repeat |
| Additional state information, if supported | For example, total charge, spin multiplicity, or a dataset/method selector |
{: .wrap}

Coordinates are often stored in ångströms. Elements may be stored as **atomic numbers**, such as 1 for hydrogen and 8 for oxygen. Their numerical order is not a claim that oxygen is “eight times hydrogen”; the model treats element identity appropriately.

The cell and periodic flags matter. Two atoms near opposite faces of a periodic box may be neighbors through the boundary. Ignoring the cell can make nearby atoms look far apart.

Most ordinary potentials do not need atomic velocities to predict potential energy. Nuclear masses enter the dynamics calculation; changing an isotope generally changes the nuclear motion rather than the underlying Born–Oppenheimer electronic energy surface.

### Outputs: energy, forces, and sometimes more

A common model produces one total energy and three force components per atom. Periodic models may also provide stress. A three-atom water molecule therefore has one energy and nine force components; a 100-atom structure has one energy and 300 force components.

These numbers are **outputs**. They should not all be confused with separate learned heads. In many models, the network directly predicts energy, then a mathematical derivative produces forces and stress. NequIP's documentation, for example, separates an energy model from the machinery enabling these derivatives. <sup><a href="#ref-8" aria-label="Reference 8">[8]</a></sup>

For a many-atom energy, the force on atom i is:

<figure class="review-workflow"><p><strong>Fᵢ = −∂E/∂rᵢ</strong></p><figcaption>Move atom i in each of the three directions and ask how the total energy changes.</figcaption></figure>

Here rᵢ means the position of atom i. The symbol ∂ means that we change one coordinate while holding the others fixed. The force is a vector: a number with both magnitude and direction.

### Stress, virial, and pressure

For a periodic cell, **stress** describes how the energy changes when the cell and its contents are stretched or sheared. It is represented by a 3 × 3 array of numbers. It comes from a derivative with respect to *strain*, meaning a small deformation.

One common convention writes the potential contribution as σ = (1/V) ∂E/∂ε, where V is the cell volume and ε describes strain. The **virial** is closely related; in the ASE/NequIP convention, virial = −Vσ. Some electronic-structure programs use the opposite sign for stress, so datasets require explicit conversion. <sup><a href="#ref-9" aria-label="Reference 9">[9]</a></sup>

The pressure in a moving simulation also contains a contribution from nuclear motion. A DFT stress label is not, by itself, the entire instantaneous pressure of a finite-temperature MD trajectory. ASE documents the distinction through its option to include the ideal-gas, or kinetic, contribution when requesting stress. <sup><a href="#ref-10" aria-label="Reference 10">[10]</a></sup>

A model can calculate stress from its energy even if it was trained without stress labels, provided its representation and implementation support the required deformation derivative. Whether that stress is accurate is a separate question. Stress labels and deformation tests help establish that.

### Charge and spin are not optional physics

Total charge counts the electron imbalance: +1 means one electron fewer than the neutral system; −1 means one extra. **Spin** is a quantum property of electrons. **Spin multiplicity** labels their combined total spin: 1 for an ordinary closed-shell molecule, 2 for a radical with one unpaired electron, and 3 for ground-state O₂. In general it is 2S + 1, where S is total spin; counting unpaired electrons plus one works only when their spins align.

The same nuclei at the same positions can have different energies if the number or arrangement of electrons differs. A neutral molecule and its ion do not generally share one energy surface. Different spin states can also differ.

An input that contains only elements and positions cannot distinguish two examples that differ only in an unprovided charge or spin state. The problem is missing information, not insufficient neural-network size. Some models take extra state inputs; others apply to a restricted set of states or approximate a particular ground-state convention. Charge-aware potentials provide explicit examples of extending the usual input. <sup><a href="#ref-11" aria-label="Reference 11">[11]</a></sup>

## What learning actually means

### Architecture, parameters, and checkpoint

An **architecture** is the arrangement of operations used by the model: what information enters, how it is transformed, and how an answer is produced.

**Parameters**, often called *weights*, are the adjustable numbers inside those operations. Training changes their values.

A **checkpoint** is a saved trained model, usually including its architecture settings and learned weights. Some training checkpoints also contain optimizer state for resuming training. Two checkpoints can use the same architecture but have very different accuracy because they learned from different data or different reference methods.

Think of an architecture as the design of a measuring instrument, and a checkpoint as that instrument after a particular calibration. Knowing the instrument's name is not enough to know what calibration was used.

### A neural network is an adjustable function

A simple neural network takes a list of numbers, combines them using adjustable weights, applies nonlinear transformations, and repeats. A **layer** is one stage in that sequence. A **feature** is a number, or group of numbers, describing something the model currently knows about the input.

For two atoms, early features might distinguish short, medium, and long separations. Later features combine those descriptions to predict energy. For many atoms, features describe more complicated surroundings.

**Nonlinear** means that changing an input does not have to produce a proportionate change in the output. Without appropriate nonlinear operations or nonlinear input features, a stack of linear transformations would collapse into a single linear transformation. Complex chemistry needs a more flexible relationship.

A **hidden layer** is an intermediate stage, before the final output. “Hidden” means internal to the model; it does not mean that it contains a physically hidden atom or electron. Its features are generally learned numerical descriptions, not directly measurable chemical quantities.

### Training compares predictions with labels

A **label** is a reference answer associated with an input structure. For an MLIP, labels commonly include total energy, forces, and sometimes stress. Training repeatedly predicts those quantities, compares them with the labels, and adjusts the model to reduce the mismatch.

A **loss function** turns those mismatches into a single score for the optimizer. One illustrative choice is:

```
loss = energy_weight × average[(energy error per atom)²]
     + force_weight  × average[(force-component error)²]
     + stress_weight × average[(stress-component error)²]
```

“Error” means prediction minus reference. Squaring makes positive and negative errors both contribute positively and penalizes large errors strongly. “Average” means average over the relevant structures or components. Packages differ in normalization, weighting, and whether they use squared error or another penalty. NequIP documents these choices explicitly. <sup><a href="#ref-12" aria-label="Reference 12">[12]</a></sup>

The weights matter because energy, force, and stress have different units and numerical scales. A force weight of 100 in one implementation does not automatically mean the same thing as 100 in another. Check the actual loss definition before comparing settings.

A 100-atom structure supplies 300 force components, but these are not 300 independent structures. They obey geometric relationships and come from one configuration. Force labels provide rich slope information; they do not eliminate the need for diverse configurations.

### Two different derivatives are involved

**Automatic differentiation** is software that computes derivatives through a sequence of linked operations. It uses the **chain rule**, the calculus rule for combining how each operation changes its input. This avoids manually deriving the entire network or nudging every coordinate numerically. PyTorch calls this machinery *autograd*. <sup><a href="#ref-13" aria-label="Reference 13">[13]</a></sup>

There are two uses to keep separate:

1. Differentiate energy with respect to **positions** to obtain forces.
2. Differentiate the training loss with respect to **model weights** to improve the model.

Training on forces therefore involves differentiating through an energy derivative. This is one reason force training can require considerably more memory and work than predicting energies alone. Automatic differentiation follows the implemented function; it does not check whether that function represents sensible physics.

### Epochs, batches, and learning rate

A **batch** is a group of training structures processed together. An **epoch** is roughly one pass through the training set. An **optimizer** is the algorithm that updates weights. Its **learning rate** controls the update size.

A large learning rate can make training unstable; a very small one can make progress slow. More epochs give more opportunities to fit the training set, but can also make the model fit accidental details rather than general patterns. That is **overfitting**.

To detect this, divide the data into training, validation, and test sets. Training adjusts weights. Validation helps choose settings and when to stop. The test set estimates performance after those choices are finished. If you repeatedly choose models based on the test result, that set has effectively become another validation set. The independence of the split matters more than a fashionable percentage. <sup><a href="#ref-14" aria-label="Reference 14">[14]</a></sup>

## Why the model sees neighborhoods

### Add up local contributions

A widely used design predicts a contribution for every atom and adds the contributions:

<figure class="review-workflow"><p><strong>E = ε₁ + ε₂ + … + εₙ</strong></p><figcaption>Each εᵢ is a learned contribution based on atom i and its relevant environment. The sum is the system's energy.</figcaption></figure>

This was a central idea of the Behler–Parrinello neural-network potential: use local atomic environments to build an energy model that can handle many atoms. An oxygen atom in one water molecule and an oxygen atom in another can be evaluated using the same learned rule. <sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup>

This helps the model handle different system sizes. For well-separated, noninteracting copies of the same system, doubling the copies should double the energy. That is **extensivity**. The energy per atom is an **intensive** quantity in a uniform bulk system: it does not grow just because the sample becomes larger.

When an atom moves, it changes its neighbors' environments too. Its force therefore comes from differentiating the total energy sum, rather than only the contribution assigned to that atom.

Local decomposition is a modeling strategy, not a statement that a DFT calculation uniquely assigns one physical energy to each atom. Usually only the total energy and forces are supervised. Different internal atomic contributions can produce the same totals. Do not automatically interpret an unusually high learned atomic energy as an experimentally defined measure of reactivity.

### The cutoff radius

A **cutoff radius**, often written r<sub>cut</sub> or `r_max`, determines which nearby atoms enter a local calculation or a graph edge. For a 5 Å cutoff, an atom directly sees neighbors within 5 Å. This is a spatial distance, not the number of atoms and not a maximum bond length.

A model should smoothly reduce an interaction's contribution as a neighbor approaches the cutoff. If the contribution suddenly vanished when an atom crossed an invisible sphere, energy or forces could jump. A **cutoff envelope** is the mathematical function used to make that fading smooth. The required smoothness also depends on whether we need only forces or higher derivatives such as those used for vibrations. SOAP and modern neural-network implementations explicitly address differentiable descriptions of neighborhoods. <sup><a href="#ref-15" aria-label="Reference 15">[15]</a> <a href="#ref-16" aria-label="Reference 16">[16]</a></sup>

A neighbor-list **skin** is different. A dynamics program may keep a slightly larger list so it does not need to rebuild neighbors every step. The extra bookkeeping distance does not automatically extend the model's physical cutoff.

### Local does not mean pairwise

A **pair potential** assigns an energy to each pair, commonly as a function of distance alone. A local MLIP can depend on several neighbors simultaneously. It can therefore respond to bond angles and crowded arrangements even though its view is spatially limited.

For example, the energy associated with an oxygen and two hydrogens depends on the H–O–H angle, not just on considering the two O–H interactions separately. A **three-body** description involves three atoms together. A **four-body** description involves four. This is about simultaneous dependence, not the number of atoms in the simulation box. Atomic cluster expansions organize such many-atom information systematically. <sup><a href="#ref-17" aria-label="Reference 17">[17]</a></sup>

### Information can travel beyond one cutoff

In an ordinary message-passing graph network, an atom first receives information from its neighbors. At the next layer, those neighbors already carry information from their own neighbors. The **receptive field**, meaning the region that can influence a feature, can therefore extend beyond one cutoff.

With L such layers and edge cutoff r<sub>cut</sub>, information can in principle travel over L graph hops, spanning distances up to roughly Lr<sub>cut</sub>. This is an upper reach, not a guarantee that all distant influences are learned well. It also does not reproduce a true infinite-range electrostatic interaction. Strictly local models such as Allegro use a different design: increasing their internal depth does not propagate atom-centered messages through progressively more distant neighborhoods. <sup><a href="#ref-18" aria-label="Reference 18">[18]</a> <a href="#ref-19" aria-label="Reference 19">[19]</a></sup>

### What local models leave out

Electrostatic interactions between charges and dispersion attractions can remain important over long distances. A finite local description may fit their effects within a narrow environment, yet fail when the distant surroundings change.

Possible solutions include explicit long-range energy terms, learned charges with a global charge-equilibration calculation, or architectures designed to exchange information over longer distances. In a charge-equilibration model, charges are allowed to redistribute subject to a constraint such as the known total charge. A fourth-generation high-dimensional neural-network potential demonstrated this treatment of non-local charge transfer. <sup><a href="#ref-11" aria-label="Reference 11">[11]</a></sup>

The lesson is to check what the model actually includes. A bigger local cutoff may help a particular calculation, but “more neighbors” and “correct long-range physics” are different claims.

A recent example is the 2026 **MACE-POLAR-1** preprint. It extends local MACE features with explicit long-range electrostatics and polarization: the charge distribution responds to its surroundings. Its formulation handles variable total charge and spin through additional charge- and spin-density machinery. This capability belongs to that extended model design; it should not be assumed for every checkpoint using the MACE name.<sup><a href="#ref-20" aria-label="Reference 20">[20]</a></sup>

## The symmetries the model must respect

An isolated molecule should not change its energy because someone moves it across the room, rotates it, or renumbers identical atoms. Using these facts makes learning more efficient and prevents unphysical dependencies.

### Translation

Move every atom by the same amount. Internal distances are unchanged, so the energy of an isolated system without an external position-dependent field should stay the same. This is **translation invariance**.

Using relative positions between atoms automatically removes the arbitrary origin. A model should not need thousands of examples to learn that a water molecule at x = 10 has the same internal energy as the same molecule at x = 0.

### Rotation

Rotate the entire molecule. The energy should stay the same. A force arrow, however, must rotate with the molecule.

**Invariant** means the quantity stays unchanged. **Equivariant** means it changes in a specified, consistent way when the input is transformed. Energy is a rotationally invariant scalar. Force is a rotationally equivariant vector. Equivariance is not a separate correction added to a predicted force; it is a property of the mapping.

### Permutation of identical atoms

Swap the labels of two hydrogen atoms while keeping the physical arrangement the same. The energy must be unchanged. The corresponding force entries must follow the relabeling.

The model should distinguish hydrogen from oxygen, but it should not distinguish two hydrogens merely because one was listed first in a file. Summing neighbor information and summing atomic energy contributions are useful ways to respect this **permutation symmetry**.

### What these rules assume

For the usual nonrelativistic energy of a system without symmetry-breaking external fields, reflection symmetry is also relevant. Reflect the entire isolated arrangement and the corresponding energy should be unchanged. This does not imply that two molecules in a chiral environment always behave identically. *Chiral* means having handedness, like a left or right hand; the surrounding environment is part of the physical arrangement too.

A field, a surface kept fixed while only the molecule rotates, or another external condition can change the symmetry of the problem. The transformation must include all relevant physical inputs. Descriptor research and equivariant-network papers explain these symmetry requirements in detail. <sup><a href="#ref-15" aria-label="Reference 15">[15]</a> <a href="#ref-18" aria-label="Reference 18">[18]</a></sup>

## From atoms to a graph neural network

### Atoms become nodes; nearby pairs become edges

A **graph** is a set of nodes connected by edges. For an atomistic model, each atom is a node, and a pair of nearby atoms can be connected by an edge. The edge carries geometric information, such as their distance and direction.

This graph normally describes proximity. An edge is not automatically a chemical bond. Two molecules approaching each other can gain edges before any chemical reaction occurs. If a model rebuilds its neighbor graph from positions, it does not need a permanent list of bonded pairs.

This is one reason a suitable MLIP can describe bond formation and breaking: the energy is a function of the changing arrangement. It still needs appropriate training coverage and electronic-state assumptions. The absence of a fixed bond list does not establish reaction accuracy.

### Embeddings turn identities into usable numbers

An **embedding** is a learned numerical representation. The model might turn “oxygen” into a list of, say, 64 numbers. Those numbers are adjusted during training so that the later network can use element identity effectively.

They are not 64 measured properties of oxygen. They are working coordinates in the model's internal feature space. Initially, two oxygen atoms can have the same element embedding. After interactions with their surroundings, oxygen in water and oxygen in a carbonyl can have different environment features.

### Messages describe a neighbor's influence

A **message** is a numerical contribution sent along an edge. It may depend on the neighboring atom's features, the distance, and the direction between atoms. Each atom gathers incoming messages, commonly by summing them, then updates its own features.

A schematic equation is:

```
new features of atom i = update(
    old features of atom i,
    sum of messages from its neighbors
)
```

For a water molecule, oxygen receives messages from nearby hydrogens and any neighboring molecules. Later layers can refine what those surroundings mean. This is a **graph neural network**, or GNN, when the message and update rules contain learned neural-network operations.

### The readout turns features into energy

After the interaction stages, a **readout** converts each atom's internal features into an energy contribution. Summing those contributions gives the total energy. “Readout” is one meaning of “head,” which we will examine separately.

<figure class="review-workflow"><p>Elements and coordinates → Neighbor graph → Element and geometry features → Interaction layers → Energy readout → Total energy → Forces by differentiation</p><figcaption>A common energy-based graph potential. Different architectures change how the geometry and interactions are represented.</figcaption></figure>

An interaction layer is therefore not a simulation timestep. Ten layers do not mean that the model has advanced the atoms ten times. All the layers work on the current configuration before the dynamics algorithm makes its next move. SchNet is an early influential example of learning atomistic interactions through this kind of continuous geometric message passing. <sup><a href="#ref-21" aria-label="Reference 21">[21]</a></sup>

## Equivariance without the intimidating words

### A number, an arrow, and a directional pattern

A scalar feature is a number that does not change when the structure rotates. A distance is a simple example. A vector feature behaves like an arrow: its three components change when the structure rotates.

An equivariant network can keep both kinds of information internally. It does not need to throw away every direction immediately just because its final energy must be a scalar. NequIP uses geometric features that transform predictably, and PaiNN provides a particularly accessible scalar-and-vector construction. <sup><a href="#ref-22" aria-label="Reference 22">[22]</a></sup>

More complicated features describe richer directional patterns. A useful mental picture is a pattern painted on a sphere around an atom. Rotating the atomic neighborhood rotates the pattern. The network tracks the pattern using components whose transformation rules are known.

### Spherical harmonics

**Spherical harmonics** are standard mathematical building blocks for functions of direction on a sphere. They play a role for directions similar to the role of sine and cosine waves for a repeating signal.

Their angular degree is written l. In three dimensions, a degree-l set has 2l + 1 components:

| Degree | Components | Simple picture |
|---|---|---|
| l = 0 | 1 | A direction-independent number |
| l = 1 | 3 | A vector-like directional pattern |
| l = 2 | 5 | A more detailed quadrupolar pattern |
{: .wrap}

These are representation types, not electron orbitals being solved by the MLIP. The same mathematics appears in quantum mechanics, which explains the familiar names, but an `l_max` setting does not mean the model is running an orbital calculation.

### Irreps, parity, and channels

An **irreducible representation**, usually shortened to *irrep*, is a basic block of components with a particular transformation rule. You can read the label as an instruction: “these numbers must rotate together in this way.”

In the e3nn notation, `0e` is an ordinary scalar and `1o` behaves like an ordinary vector. The `e` and `o` describe **parity**: whether the components keep or reverse their sign under inversion, which changes every relative position r into −r. A magnetic-moment-like axial vector and a displacement-like polar vector do not have the same inversion rule. <sup><a href="#ref-23" aria-label="Reference 23">[23]</a></sup>

A **channel** is one copy of a feature type. A model can have many scalar channels and many vector channels, allowing it to represent different learned patterns with the same geometric behavior.

For example, the expression `64x0e + 64x1o` means 64 scalar channels plus 64 vector channels. Since each vector has three components, it represents 64 + 64 × 3 = 256 numerical components per atom at that stage. “64 channels” is therefore not always “64 individual numbers.”

### Tensor products

A **tensor product** combines geometric features while preserving the correct transformation behavior. With vectors, familiar examples include a dot product that produces a scalar and combinations that produce more elaborate directional information.

General equivariant networks organize these combinations using known angular-coupling rules. The name *Clebsch–Gordan coefficients* refers to fixed mathematical numbers used in these rules. They are not additional DFT labels. The network learns how strongly to use the allowed combinations.

You can understand the architecture without calculating these coefficients: the point is to combine directional information without accidentally making the answer depend on how the coordinate axes were chosen. The e3nn tensor-product documentation shows how such combinations are constructed. <sup><a href="#ref-24" aria-label="Reference 24">[24]</a></sup>

### Three settings that describe different things

Do not merge these ideas:

- **Angular degree** controls the directional representation types carried or used by the model.
- **Body order** describes simultaneous dependence on groups of atoms in a particular expansion or operation.
- **Interaction depth** counts successive stages that combine or propagate information.

Increasing one does not simply replace increasing another. A model can use rich many-body information within a local neighborhood and relatively few message-passing stages. MACE was designed around that possibility. <sup><a href="#ref-25" aria-label="Reference 25">[25]</a></sup>

## The main architecture families

The names can feel like a collection of unrelated inventions. A more useful way to organize them is by asking two questions: **how is an atomic environment represented, and what mathematical model turns that representation into energy?**

### Fixed descriptors with a fitted energy model

A **descriptor** is a numerical summary of a structure or neighborhood. It might describe how many neighbors sit at different distances and how their directions relate. A *fixed* descriptor has a prescribed mathematical definition; its numerical value still changes when the atoms move.

Behler–Parrinello-style models use **symmetry functions**, carefully chosen functions of neighboring distances and angles. A neural network maps each atom's descriptor to an energy contribution. ANI uses a related atom-centered representation with element-resolved information, demonstrating transfer across organic molecules within its defined chemical scope. <sup><a href="#ref-26" aria-label="Reference 26">[26]</a></sup>

**SOAP**, the Smooth Overlap of Atomic Positions, describes a neighborhood using a smooth density around neighboring atoms and rotationally invariant comparisons of its shape. **GAP**, the Gaussian Approximation Potential framework, uses Gaussian-process regression to learn an energy model; SOAP is a common descriptor used with GAP, not another name for the regression method. <sup><a href="#ref-2" aria-label="Reference 2">[2]</a> <a href="#ref-15" aria-label="Reference 15">[15]</a></sup>

A **Gaussian process** is a statistical model of functions. In this setting, a *kernel* measures similarity between environments, and the fitted model combines reference information to make a prediction. Practical GAP models use sparse representative environments to control cost. Gaussian-process uncertainties are useful, but depend on assumptions about the model and data; they are not automatic guarantees of physical accuracy.

### Linear models with rich many-body features

“Linear” can sound too simple for chemistry, but it means linear in the fitted coefficients, not necessarily linear in atom positions. The features themselves can be complicated nonlinear functions of geometry.

**SNAP**, the Spectral Neighbor Analysis Potential, uses a particular set of neighborhood descriptors called bispectrum components. In its original form, atomic energy is a linear combination of those components. <sup><a href="#ref-27" aria-label="Reference 27">[27]</a></sup>

**Moment Tensor Potentials**, or MTPs, build neighborhood information from weighted sums of products of relative-position components. These are combined into rotation-invariant quantities, and the energy is fitted using the resulting basis. <sup><a href="#ref-28" aria-label="Reference 28">[28]</a></sup>

**ACE**, the Atomic Cluster Expansion, systematically constructs symmetry-respecting many-body basis functions for atomic environments. An ACE potential can use a linear expansion, while other models build nonlinear or neural-network constructions using related ideas. This is a useful bridge to understanding MACE. <sup><a href="#ref-17" aria-label="Reference 17">[17]</a></sup>

These methods show why “not a deep neural network” does not mean “not a machine-learning potential.” Their accuracy and cost depend on the representation, fitted model, and training coverage.

### Learned invariant representations

**SchNet** learns distance-dependent filters that transform and exchange atomic features. Its internal atom features are rotationally invariant. **DimeNet** adds explicit angular information through directional messages involving atom triplets. <sup><a href="#ref-21" aria-label="Reference 21">[21]</a> <a href="#ref-29" aria-label="Reference 29">[29]</a></sup>

Distance-based does not mean that a multilayer model is simply adding independent pair energies. Repeated interactions can encode many-atom dependencies. Explicit angle information and equivariant features are different ways to make useful geometry easier to learn.

**Deep Potential** learns local environment representations and maps them to atomic energy contributions. **DeePMD-kit** is a software framework for these models, rather than a single frozen architecture; its supported descriptors and fitting networks have expanded over time. The original Deep Potential molecular-dynamics paper and the framework documentation are distinct sources to consult. <sup><a href="#ref-30" aria-label="Reference 30">[30]</a> <a href="#ref-31" aria-label="Reference 31">[31]</a></sup>

### Equivariant message-passing networks

**PaiNN** carries scalar and vector features and updates them together. **NequIP** uses equivariant geometric representations to build atom-centered interaction networks. Both keep directional information inside the model while producing an invariant energy. <sup><a href="#ref-22" aria-label="Reference 22">[22]</a> <a href="#ref-18" aria-label="Reference 18">[18]</a></sup>

**MACE** combines equivariant message passing with higher-order local feature combinations inspired by atomic cluster expansions. It can build expressive many-body messages without relying only on a long chain of ordinary message-passing layers. We will walk through it next. <sup><a href="#ref-25" aria-label="Reference 25">[25]</a></sup>

Equivariance is a useful architectural constraint, not an accuracy certificate. A properly equivariant model trained on the wrong reference data still gives the wrong answer consistently under rotation.

### Strictly local equivariant models

**Allegro** uses learned equivariant tensor-product operations within a fixed local environment, without atom-centered message passing across successively larger neighborhoods. It is designed with large-scale, parallel atomistic simulation in mind. <sup><a href="#ref-19" aria-label="Reference 19">[19]</a></sup>

Its energy construction includes local edge-associated contributions, but those contributions depend on the surrounding environment. An “edge energy” is therefore not necessarily an ordinary pair potential depending only on that edge's distance.

### Equivariant attention models

**Attention** learns how strongly to weight different pieces of available information. In a neighborhood, different neighbors can receive different learned weights depending on the current features and geometry. An **attention head** is one parallel weighting-and-combination operation.

**EquiformerV2** is an example of an equivariant transformer architecture combining attention with structured geometric representations. Attention can be restricted to a local graph; the word *transformer* does not mean every atom communicates with every other atom in the system. It also does not mean that the model is a language model. <sup><a href="#ref-32" aria-label="Reference 32">[32]</a></sup>

### A compact map of the names

| Name | Main architectural idea | A distinction to remember |
|---|---|---|
| Behler–Parrinello / ANI | Atom-centered descriptors plus neural networks | Symmetry is built into the environment representation |
| GAP with SOAP | Statistical regression using environment similarity | SOAP describes environments; GAP fits the energy relationship |
| SNAP / MTP / ACE | Rich invariant basis functions, often with linear fitting | Linear coefficients can multiply nonlinear geometric features |
| SchNet / DimeNet | Learned invariant interactions; explicit angles in DimeNet | Invariant does not mean pairwise-only |
| Deep Potential | Learned local descriptors and energy fitting | DeePMD-kit supports multiple model variants |
| PaiNN / NequIP | Scalar/vector or more general equivariant interactions | Internal directions transform with the atomic environment |
| MACE | Equivariant higher-order local combinations and message passing | Body order and layer count are separate ideas |
| Allegro | Strictly local equivariant many-body representation | Internal depth does not expand atom-centered message-passing reach |
| EquiformerV2 | Equivariant attention | Attention heads are different from energy heads |
{: .wrap}

These categories overlap. An architecture may use descriptors, tensor products, message passing, and attention in different combinations. A comparison table is a map of the main design choices, not a rule that every implementation belongs in exactly one box.

## Inside MACE, step by step

MACE is worth examining closely because it brings many of the terms together. This is a conceptual walkthrough of the energy-based architecture. Particular checkpoints and newer variants can add or change components.

### 1. Build the neighborhood graph

Start with elements, positions, and any periodic cell. Find nearby pairs within the model's cutoff. For every edge, calculate a relative displacement, its length, and its direction. Periodic-image shifts must be included when a neighbor lies across a cell boundary.

### 2. Encode the elements and distances

An element embedding creates initial atomic features. Distances are expanded in **radial basis functions**: several smooth functions that respond differently at different separations. Instead of seeing one bare number, the network gets a collection of distance-sensitive signals.

For intuition, imagine overlapping distance windows, with one responding strongly near 1 Å and another near 2 Å. Actual bases can use oscillatory functions rather than those simple windows, but the purpose is similar: provide a flexible description of how interactions vary with separation. The official implementation includes radial embeddings and a smooth polynomial cutoff. <sup><a href="#ref-16" aria-label="Reference 16">[16]</a></sup>

### 3. Encode directions

Spherical harmonics describe the edge directions. These geometric quantities are combined with distance-dependent weights and atom features to form equivariant neighbor contributions. Summing contributions over neighbors produces local environment features.

### 4. Combine neighbor information into higher-order features

The **product-basis** stage forms symmetry-allowed products of the aggregated features. Multiplying environment summaries lets the model represent joint patterns involving several neighbors.

A useful schematic is:

```
one neighbor contribution       → center + one neighbor
products of two contributions   → center + up to two neighbors
products of three contributions → center + up to three neighbors
```

Thus a correlation order of three can construct terms involving the center and up to three distinct neighbors: four-body information in that local expansion. Repeated neighbor indices also contribute lower-order terms. With multiple interaction stages and nonlinear readouts, this is not a claim that the complete final model is strictly limited to four-body physics. The MACE paper and its product-basis implementation explain the construction. <sup><a href="#ref-25" aria-label="Reference 25">[25]</a> <a href="#ref-16" aria-label="Reference 16">[16]</a></sup>

This is also different from saying that only four atoms fit inside the cutoff. There can be many more neighbors in the environment.

### 5. Update features and read out energy

Interaction and product stages update each atom's representation. Readout blocks convert suitable invariant features into atomic energy contributions. MACE can combine contributions from multiple stages; it need not wait until the final layer to read out everything.

The model also includes element-dependent reference energies and, in some variants, scaling or shift terms. These bookkeeping choices matter for interpreting the predicted total. The official model implementation shows the embeddings, interaction blocks, product blocks, readouts, and final energy assembly in one place. <sup><a href="#ref-33" aria-label="Reference 33">[33]</a></sup>

### 6. Differentiate the selected total energy

For an energy-based MACE potential, forces come from differentiating that assembled energy with respect to positions. Stress and virials can be obtained through the corresponding deformation derivatives. They are not independent guesses merely because they appear as separate entries in the returned output dictionary. <sup><a href="#ref-33" aria-label="Reference 33">[33]</a></sup>

The complete route is therefore geometry → structured features → energy → derivatives. The model's learned many-body geometry and the calculus connecting energy to force both matter.

## What a head actually is

A **head** usually means a part of a model that turns an internal representation into an output. Unfortunately, the same word is used for several different things. Always ask what is being selected or predicted.

### 1. An energy readout head

Imagine that the main network has finished describing each atom's environment. The energy head turns that description into a number. Summing the numbers gives total energy.

The shared feature-building network is often called the **backbone** or **trunk**. The head is the final interpretation of its features. This is a useful simplification, although real models can have several intermediate readouts and head-specific scaling or reference terms.

For an ordinary energy head, the output must transform as an invariant scalar. A vector-valued hidden feature is not directly summed as an energy without a suitable invariant construction. The readout classes in MACE provide concrete examples of these output mappings. <sup><a href="#ref-16" aria-label="Reference 16">[16]</a></sup>

### 2. A force output is not necessarily a learned force head

In an energy-based model:

```
features → energy head → total energy
                              ↓ derivative with respect to positions
                            forces
```

There can be one learned energy model and many derivative outputs. This is why seeing `energy`, `forces`, and `stress` in an interface does not establish that the model has three independently trained prediction heads.

Other models predict forces directly. Such a force predictor must be checked for **conservativeness**: whether there is one consistent potential energy whose negative gradient equals the predicted forces. In general, predicting both an energy and forces separately does not enforce that relationship. Special constructions can enforce it, including force-domain methods. <sup><a href="#ref-4" aria-label="Reference 4">[4]</a> <a href="#ref-8" aria-label="Reference 8">[8]</a></sup>

For a smooth conservative field, the work around a closed path is zero. In plain terms, taking atoms around a loop back to the same arrangement cannot yield free net energy from the potential. A model can be rotation-equivariant yet fail this energy-consistency condition. The two constraints answer different questions.

### 3. Property heads

A shared representation can also predict a **dipole moment**, a measure of charge separation, or a **polarizability**, describing how the electron cloud responds to an electric field. These outputs have their own geometric transformation rules and require suitable training targets or physical constructions.

PhysNet is an example of a model designed for energies, forces, dipole moments, and partial charges. Its electrostatic treatment makes predicted charges part of the energy model, rather than merely decorative extra numbers. <sup><a href="#ref-34" aria-label="Reference 34">[34]</a></sup>

A property head does not appear automatically just because the backbone seems chemically informative. Adding an untrained dipole head would not give a reliable dipole model. Likewise, a reported partial charge depends on its definition or construction; it is not generally a uniquely measurable charge sitting on an atom.

### 4. Dataset or method heads

Suppose we have two datasets: A contains PBE reference calculations, and B contains calculations using a different functional. The same geometry can legitimately have different labels in A and B.

If we feed both examples to one unconditioned output, we ask it to produce two answers for the same input. Separate heads offer one way to resolve this:

```
                     ┌→ head A → energy for reference setup A
shared representation
                     └→ head B → energy for reference setup B
```

In a multihead MACE construction, readouts and element reference energies can depend on the selected head. Some variants also include head-dependent scale and shift values. The core feature-building network can be shared. <sup><a href="#ref-33" aria-label="Reference 33">[33]</a></sup>

A method head is not necessarily just a constant correction. Different reference methods can change bond stiffness, reaction barriers, and relative stability. Their energy surfaces can have different shapes.

At inference time, the chosen head determines which learned target you request. An adsorption energy, for example, requires compatible energies for the adsorbed system, clean surface, and isolated molecule. Switching heads between terms does not produce a consistent energy difference merely because every number came from one checkpoint.

### 5. Replay and target heads during fine-tuning

A foundation model has already learned from a broad dataset. Fine-tuning changes it using a more focused target dataset. The shared network can become better on the target while losing some earlier capability: **catastrophic forgetting**.

MACE's **multihead replay** protocol combines target data with a replay dataset and uses separate heads while training. “Replay” means continuing to show examples intended to retain earlier behavior. It does not mean replaying an MD trajectory as a movie. <sup><a href="#ref-35" aria-label="Reference 35">[35]</a></sup>

The replay labels can be original reference calculations or **pseudolabels**, predictions from the earlier model. Pseudolabels teach the updated model to retain the previous model's behavior on those structures; they do not turn previous predictions into newly verified quantum answers. Replay can reduce forgetting, but its effectiveness still needs evaluation for the intended task.

This is more than attaching a fresh final layer while assuming everything else stays frozen. Which weights are updated depends on the fine-tuning protocol.

### 6. Attention heads

An attention head works inside an attention mechanism. Several heads let the model form several learned weighted combinations of available features. Their results are combined and passed onward.

These are not separate PBE and hybrid-DFT energy surfaces. They need not correspond to named chemical effects, such as “hydrogen-bond head” and “dispersion head.” Even when patterns emerge, such interpretations need evidence. EquiformerV2 illustrates attention in an equivariant atomistic architecture. <sup><a href="#ref-32" aria-label="Reference 32">[32]</a></sup>

### 7. Heads, ensembles, experts, and tasks

An **ensemble** is a collection of models. Running several independently trained models on the same structure gives several predictions whose spread can help estimate uncertainty. Several output heads sharing one backbone are not automatically an independent ensemble.

An **expert** is a component used by a mixture-of-experts model. A routing rule controls how experts contribute. Experts increase or organize internal model capacity; they need not be separate final output heads.

UMA is a useful concrete example. Its developers describe a *mixture of linear experts* with task-dependent routing and a **single output head**. The task input identifies the reference-data domain and level of theory to emulate. In its molecular task, total charge and spin multiplicity are also relevant inputs. A selectable task is therefore not proof that the architecture has one output head per task. <sup><a href="#ref-36" aria-label="Reference 36">[36]</a> <a href="#ref-37" aria-label="Reference 37">[37]</a></sup>

| Term in a paper or interface | What to check |
|---|---|
| Energy head | Does it predict atomic contributions, a total, or a correction? |
| Force head | Are forces directly predicted or derived from energy? |
| Property head | What property, symmetry, and labels define the output? |
| Dataset / method head | Which reference setup does it represent? |
| Replay head | What earlier behavior is the replay dataset intended to preserve? |
| Attention head | What internal information is weighted and combined? |
| Task / expert | Is this an input condition, routing mechanism, output branch, or something else? |
{: .wrap}

## Foundation models and fine-tuning

### The architecture is not the trained domain

A **foundation model** is a broadly pretrained model intended to support several downstream applications. In atomistic modeling, this usually means a model trained on a large and varied collection of reference structures, which can be used directly or adapted.

MACE is an architecture. MACE-MP is a family of materials-oriented trained models, while MACE-OFF models target organic molecular chemistry. Their training data and reference calculations differ. Using the same architectural ideas does not make their energies interchangeable. <sup><a href="#ref-38" aria-label="Reference 38">[38]</a> <a href="#ref-39" aria-label="Reference 39">[39]</a></sup>

Similarly, M3GNet and CHGNet combine specific architectural designs with broad materials pretraining. M3GNet explicitly includes three-body interactions. CHGNet uses magnetic-moment information during training to help learn charge-related structure. “Charge-informed” should not be read as a promise that any user can set any ionic or magnetic state and obtain its exact energy. <sup><a href="#ref-40" aria-label="Reference 40">[40]</a> <a href="#ref-41" aria-label="Reference 41">[41]</a></sup>

The relevant question is what a particular checkpoint was trained to represent: which elements, structures, electronic states, reference method, and operating conditions.

### Element coverage is only one kind of coverage

A model may recognize the symbols H, C, O, and Fe without being reliable for a lubricant oxidizing on an iron surface. That application combines molecules, radicals, a metal, adsorption, compressed contacts, and potentially several spin states.

**Element coverage** means the model supports those species. **Environment coverage** means it has learned relevant local arrangements. **State coverage** concerns charge, magnetism, electronic state, and other conditions. Passing the first check does not pass the other two.

Foundation-model cards and release documentation summarize intended domains, reference methods, and limitations. These details can change between releases, so record an explicit checkpoint instead of relying on a moving software default. <sup><a href="#ref-42" aria-label="Reference 42">[42]</a></sup>

### Four different ways to adapt a model

**Training from scratch** starts from an untrained model and fits your data. It gives control over the setup but requires enough suitable data to learn the needed relationships.

**Full fine-tuning** starts from pretrained weights and updates them on target data. It can need less target data, but can also inherit limitations or forget earlier behavior.

**Head-only fine-tuning** freezes the backbone and trains a selected readout. This is cheaper or more constrained, but it assumes that the fixed representation already contains what the new task needs.

**Low-rank adaptation**, often called LoRA, trains restricted updates to some weight matrices rather than freely changing every weight. “Low rank” means that the update is expressed through smaller factors, limiting how it can change the original transformation. It is another adaptation method, not another meaning of a physical energy head. Official MACE guidance compares these approaches and replay-based fine-tuning. <sup><a href="#ref-43" aria-label="Reference 43">[43]</a></sup>

There is also **delta learning**: predict a correction to a baseline energy, then add baseline and correction. For example, a model may learn the difference between a cheaper method and a more expensive target. The baseline still has to be evaluated, and the correction must be fitted with a consistent definition of the difference. <sup><a href="#ref-44" aria-label="Reference 44">[44]</a></sup>

### Atomic reference energies and E0s

Total energies can contain large element-dependent baselines. It is often helpful to write:

<figure class="review-workflow"><p><strong>Total energy = sum of element reference energies + learned interaction energy</strong></p><figcaption>The references provide a baseline. The model learns the remaining environment-dependent part.</figcaption></figure>

In MACE discussions, these reference values are commonly called **E0s**. They may be based on isolated-atom calculations or set through a fitting procedure. Do not assume that any fitted intercept is a physically correct isolated-atom energy.

Adding a constant per element does not change forces for a fixed composition. That makes it possible to have apparently good forces alongside badly aligned total energies. For composition-changing comparisons, isolated fragments, or combining reference methods, the alignment requires particular care. Some model variants also distribute offsets between explicit references and learned biases. MACE's fine-tuning guidance discusses these issues. <sup><a href="#ref-45" aria-label="Reference 45">[45]</a></sup>

In a balanced reaction evaluated with one consistent model, purely element-count-dependent constants cancel. A wrong dissociation curve or wrong relative electronic-state energy does not disappear through that cancellation. Correct bookkeeping and correct chemistry both matter.

### How to choose a starting checkpoint

Begin with the scientific question, not the largest parameter count. Check the supported elements, training domains, charge and spin handling, reference method, dispersion treatment, licensing, and available simulation interfaces. Then evaluate a small representative reference set before committing to a long calculation.

A pretrained model can be useful immediately, but that usefulness is an empirical property of the checkpoint on your task. It does not follow from the word “universal.”

## Building a training set that teaches the right physics

### A dataset is a collection of situations

A thousand relaxed water molecules do not automatically teach a model how water dissociates, how an ion is solvated, or what happens against a metal surface. Training examples must cover the arrangements and states relevant to the intended calculation.

Useful sources include distorted structures, molecular conformations (different shapes of the same molecule), thermal trajectories, strained cells, defects such as missing atoms, liquids, interfaces, and configurations near important reaction paths. The needed mixture depends on the question. Active-learning platforms such as DP-GEN organize data collection around exploration, reference labeling, and repeated improvement. <sup><a href="#ref-46" aria-label="Reference 46">[46]</a></sup>

A training set is not just a file size. One million nearly identical frames can contain less useful new information than a much smaller set spanning distinct environments. This is especially important when a rare event controls the observable.

### Consistent reference calculations

Labels should be generated with a defined reference method and settings appropriate to the task. Mixing unrelated functionals, pseudopotentials, spin conventions, or dispersion treatments in one unconditioned output can create conflicting targets.

Consistency does not always mean using an identical number for every setting. Different cell sizes may require different k-point meshes to maintain a comparable sampling density. The underlying reference protocol and convergence accuracy should remain controlled and documented.

For metallic calculations with electronic smearing—partly filling electronic states to help the calculation converge—check which energy is consistent with the reported forces. An extrapolated zero-smearing energy and the finite-smearing free-energy surface are not automatically the same training target. ASE's documentation explicitly notes that a calculator can distinguish these energy definitions. <sup><a href="#ref-10" aria-label="Reference 10">[10]</a></sup>

The label precision must also suit the desired accuracy. An unconverged reference calculation is not made more trustworthy by storing many digits after the decimal point.

### What a structure file needs to preserve

An extended XYZ file can hold elements, positions, per-atom properties, a cell, periodic flags, and per-structure information such as energy. Other packages use different formats. The important thing is the meaning of the fields, not the filename extension. ASE documents how extended XYZ maps these properties. <sup><a href="#ref-47" aria-label="Reference 47">[47]</a></sup>

Before fitting, inspect a few records by hand and through the intended data reader. Check whether energy is total or per atom, which force column belongs to which atom, and whether the cell vectors are interpreted as rows or columns.

An eV/Å force is not an eV force, and a stress in gigapascals is not numerically interchangeable with stress in eV/Å³. Stress may be stored as a 3 × 3 matrix or as six independent components in a particular order. A virial has energy units, whereas stress has energy-per-volume units. Names alone are not enough to establish compatibility.

### Split by the scientific challenge

Neighboring frames in one trajectory often look almost identical. Randomly mixing them across training and test sets can make the test mostly measure interpolation between familiar frames.

A more informative split may hold out complete trajectories, molecular families, crystal structures, compositions, temperatures, or reaction paths. Choose the split to match the intended generalization claim. Holding out a different temperature does not necessarily test transfer to a different chemical species.

Keep a genuinely independent final test set. If new active-learning data are added, track which structures became training data so that the final evaluation does not silently include them.

### Active learning

**Active learning** lets the model help decide which new reference calculations would be useful. The basic loop is:

<figure class="review-workflow"><p>Initial reference structures → Train → Explore with the model → Identify informative or uncertain structures → Reference calculations → Expand the dataset → Retrain</p><figcaption>The goal is to spend expensive labeling effort where it improves coverage.</figcaption></figure>

Podryabinkin and Shapeev developed an extrapolation-based selection approach for linearly parametrized potentials. It evaluates how far candidate configurations stretch the fitted representation. <sup><a href="#ref-48" aria-label="Reference 48">[48]</a></sup>

DP-GEN uses disagreement between independently trained models as part of a concurrent-learning workflow. FLARE demonstrates on-the-fly learning using Bayesian force models and uncertainty estimates. These are different implementations of the broader idea, not one universal uncertainty formula. <sup><a href="#ref-46" aria-label="Reference 46">[46]</a> <a href="#ref-49" aria-label="Reference 49">[49]</a></sup>

Selection should capture informative diversity. A thousand adjacent frames from the same unfamiliar event can be redundant. It is also useful to include deliberately chosen physical tests, such as compressed contacts or an important transition pathway, rather than expecting an uncertainty indicator to discover every relevant failure.

### What an uncertainty estimate means

An **uncertainty estimate** measures some aspect of how unsure a model or modeling procedure appears to be. It is not the same quantity as the actual error, which requires a reference answer.

An ensemble disagreement can be small because all members learned the same wrong trend. A statistical uncertainty can be misleading if its assumptions fail far from the training distribution. A model may even be confident about an electronic state it was never given a way to identify.

A practical **calibration** check compares uncertainty with observed reference errors on independent examples. If high uncertainty tends to flag large errors, the signal is useful for selection. A numerical uncertainty threshold should be chosen and tested for the model, units, and application; it is not a material-independent safety limit. Bayesian active-learning work makes the role of a defined uncertainty model explicit. <sup><a href="#ref-49" aria-label="Reference 49">[49]</a></sup>

## From a trained model to molecular dynamics

### First, evaluate one structure

Before a long trajectory, ask the model for the energy and forces of a familiar structure. Compare with its reference calculation. Check a slightly distorted structure too: at an optimized geometry, forces close to zero are an easy and incomplete test.

At this stage, confirm the element mapping, coordinate units, periodic flags, charge and spin inputs, selected head or task, and model precision. A wrong atomic-number map can produce a formally valid calculation with the wrong physical meaning.

An ASE calculator provides a convenient common interface for requesting energies and forces. LAMMPS and other simulation engines can run supported MLIP implementations through their own interfaces. Model compatibility, package versions, and deployment details still need checking. <sup><a href="#ref-6" aria-label="Reference 6">[6]</a></sup>

### Then let a dynamics algorithm move the atoms

Newton's law relates force to acceleration:

<figure class="review-workflow"><p><strong>acceleration = force / mass</strong></p><figcaption>The MLIP supplies the force. The integrator uses it with masses, positions, and velocities to advance the system.</figcaption></figure>

An **integrator**, such as velocity Verlet, takes a small time step and updates motion. A timestep is often measured in femtoseconds: 1 fs = 10⁻¹⁵ seconds. Hydrogen-containing systems can need particularly short steps because their fast vibrations must be resolved. The appropriate step must be tested; replacing DFT with an MLIP does not remove the time resolution required by the physical motion.

A **thermostat** controls the thermal behavior of the simulation, and a **barostat** controls cell fluctuations associated with pressure. ASE's MD documentation describes these as separate simulation components. <sup><a href="#ref-7" aria-label="Reference 7">[7]</a></sup>

### Check energy behavior in the right ensemble

An **ensemble** specifies the conditions of the simulation. The common abbreviations are:

| Ensemble | What is controlled |
|---|---|
| NVE | Number of atoms, volume, and total energy for an isolated classical system |
| NVT | Number of atoms, volume, and temperature |
| NPT | Number of atoms, pressure, and temperature |
{: .wrap}

Here total energy means potential plus nuclear kinetic energy, the energy of the atoms' motion. In a suitable NVE check, examine whether that total behaves sensibly and whether reducing the timestep improves the result. A discrete integrator, finite numerical precision, constraints, or implementation errors can all affect the observed behavior.

A conservative energy-based potential gives a consistent underlying force field, but it does not make a finite-step trajectory exactly energy conserving. A thermostat can remove energy introduced by numerical or modeling problems, so stable temperature alone is insufficient evidence of a good potential.

### Speed has a complete-system meaning

A timing result depends on atom count, neighbor count, cutoff, architecture, numerical precision, hardware, batch size, and the simulation engine. A small molecule on a GPU may spend considerable time in overhead; a large periodic system may spend it in neighbor interactions or communication between devices.

At a fixed density and cutoff, many local models have approximately size-proportional evaluation cost. That useful scaling does not mean identical prefactors, unlimited GPU memory, or perfect scaling across many GPUs. Message passing and domain communication also affect parallel performance.

Report wall time per MD step, or simulated time per day at a stated timestep, under a reproducible setup. An energy-only forward-pass timing is not the same benchmark as energy-plus-force dynamics. Allegro's design specifically addresses the scalability implications of keeping its learned interactions strictly local. <sup><a href="#ref-19" aria-label="Reference 19">[19]</a></sup>

## What can go wrong

### A good average error can hide the important failure

**MAE**, mean absolute error, averages the magnitude of prediction errors. **RMSE**, root mean squared error, takes the square root of the mean squared error and is more sensitive to large errors. Either needs a stated quantity and unit.

An energy MAE per atom, a total-energy MAE per structure, a force-component MAE, and a force-vector error are different metrics. For one 1,000-atom configuration, a total-energy error of 1 eV is only 1 meV per atom, because 1 meV is 0.001 eV. That normalized number does not by itself tell us the error in a reaction barrier or a small energy difference.

Errors can cancel between related configurations or add unfavorably. A low average over a mostly easy test set can also hide a poor description of radicals, rare transition structures, or a minority element. Report errors for relevant subsets and examine the observable itself.

Fu and colleagues' *Forces are not Enough* benchmark directly compared conventional prediction errors with simulation metrics and found that force accuracy alone did not reliably summarize simulation performance. <sup><a href="#ref-50" aria-label="Reference 50">[50]</a></sup>

### The model can invent an unphysical energy valley

Between familiar examples, an insufficiently constrained surface can contain a **hole**: a region of spuriously low energy. Atoms may then collapse into an implausible arrangement that the model incorrectly prefers.

A repulsive baseline can help with close approaches. **ZBL**, the Ziegler–Biersack–Littmark screened nuclear repulsion, is one established short-range form; LAMMPS documents its use for high-energy collisions. <sup><a href="#ref-51" aria-label="Reference 51">[51]</a></sup>

Adding repulsion requires a consistent energy definition and appropriate fitting or subtraction of the baseline. Simply overlaying an arbitrary extra term can count interactions twice or distort the fitted reference. A repulsive term also does not establish correct chemistry at intermediate distances. The full model still needs tests of compression, bond distortion, and unexplored configurations.

### Long-range physics can be missing or counted twice

A model trained on dispersion-corrected labels may already represent some dispersion within its learned range. Adding a correction afterward without checking the model's intended construction can count some contributions twice.

Conversely, a short-range fit does not automatically recover the correct attraction between widely separated fragments merely because its reference method included dispersion. A model with an explicit electrostatic and dispersion construction, such as PhysNet, illustrates a different design from a purely local fit. <sup><a href="#ref-34" aria-label="Reference 34">[34]</a></sup>

The question is both what the labels contain and how the deployed model represents that contribution at the separations you will use.

### Stable dynamics can still describe the wrong physics

A simulation may run without crashing while giving the wrong density, diffusion rate, vibrational spectrum, phase stability, adsorption energy, or reaction barrier. Those are scientific errors rather than software failures.

A published study of **systematic softening** found underprediction of energy and force changes in several then-available universal materials potentials across a range of tests. That result concerns the studied checkpoints and benchmarks; it should not be turned into a claim that every current MLIP has exactly the same error. <sup><a href="#ref-52" aria-label="Reference 52">[52]</a></sup>

Likewise, a model's success on a leaderboard establishes performance under that benchmark's definitions. It does not establish its accuracy for an unrelated reactive liquid or sliding interface.

### More model capacity cannot repair an ill-defined target

If identical inputs have conflicting labels because charge, spin, reference method, or a necessary environmental variable was omitted, a larger network cannot make the target single-valued. It can fit noise or compromise between examples, but the physical ambiguity remains.

Another example is a **coarse-grained** model, in which several atoms are replaced by one effective particle. Its effective interactions can depend on temperature and what degrees of freedom were removed. That is a different modeling problem from fitting an ordinary all-atom ground-state energy surface.

### Electronic and nuclear quantum effects remain separate issues

Most standard ground-state MLIPs do not explicitly follow excited electronic states, electron transfer between distinct states, or spin transitions during a reaction. Specialized models can extend the picture, but their inputs and equations must represent the required electronic physics.

An ordinary classical-nuclei trajectory also does not automatically include zero-point nuclear motion or tunneling. An MLIP can supply energies for methods that treat nuclear quantum effects, such as path-integral simulations, but a fast classical trajectory is not equivalent to those methods. The general force-field literature distinguishes the learned potential from the sampling and dynamical methods applied to it. <sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>

## A worked example for oxidation chemistry

Consider the hydrogen-transfer step through which a phenolic antioxidant intercepts a peroxyl radical:

<figure class="review-workflow"><p><strong>ArOH + ROO• → ArO• + ROOH</strong></p><figcaption>ArOH is a phenol-type antioxidant. ROO• is a peroxyl radical. The dot marks an unpaired electron.</figcaption></figure>

We want to examine how the surroundings affect this reaction. The following is an illustrative study design, not a reported calculation or a recommendation that one existing checkpoint is already validated for it.

### Define the physical target

Decide which reactants, solvent or base-oil environment, temperature range, and electronic-state treatment matter. Specify whether this is a gas-phase pair, a liquid, or a surface reaction. A model validated for isolated neutral molecules has not thereby been validated for a reactive iron–lubricant interface.

For this reacting system, establish an appropriate total charge and spin state in the reference calculations. If several electronic states are relevant, decide whether describing the reaction on just one electronic-state energy surface is an acceptable approximation. Changing a model's head cannot substitute for that physical decision.

### Choose reference structures beyond the endpoints

Include the separated reactants, their encounter arrangements, structures with hydrogen between donor and acceptor, products, and variations in nearby molecules. Include representative thermal distortions and close contacts.

A model that sees only comfortable reactants and products may invent the path between them. An equilibrium test set might then look excellent while the hydrogen-transfer barrier is wrong.

### Decide between a pretrained model and a fitted model

Inspect potential starting checkpoints for molecular and radical coverage, supported elements, charge/spin conditioning, reference method, and boundary conditions. Evaluate representative structures with the checkpoint and the intended reference method.

If target accuracy is inadequate, obtain additional reference labels and consider fine-tuning or a task-specific fit. Keep the head, task selection, and energy-reference convention consistent when comparing reactants, products, and pathway structures.

### Validate quantities that answer the question

Compare reaction energies and energy profiles, force directions near the reaction path, relevant bond stretches, and intermolecular interactions. Then examine dynamics under the intended conditions.

Even a good electronic barrier does not directly give a liquid-phase reaction rate. Temperature, entropy, solvent rearrangements, and rare-event sampling matter. A **free-energy barrier** includes the statistical effect of the surrounding configurations; it is not simply the highest potential energy encountered in one short trajectory.

For a sense of the sensitivity, at about 298 K a free-energy-barrier change of roughly 0.06 eV corresponds to about a factor of ten in a transition-state-theory rate, with the other factors held fixed. This follows from the exponential factor exp(−ΔG‡/k<sub>B</sub>T), where k<sub>B</sub> is Boltzmann's constant and T is absolute temperature. A small error can therefore be chemically important even when an average benchmark score looks encouraging. <sup><a href="#ref-53" aria-label="Reference 53">[53]</a></sup>

### Examine reactions after the trajectory exists

The MLIP supplies interactions. Identifying species, tracking hydrogen transfers, and estimating a rate are analysis steps. Defining an event using a distance threshold may require care to avoid counting rapid back-and-forth fluctuations as separate completed reactions.

For friction or wear, the distinction is similar: an MLIP does not output the friction coefficient merely because it evaluates an interface. The simulation must impose a defined load, sliding motion, and thermal treatment, and the measured forces must be analyzed under those conditions.

## Reading papers and model settings

### Translate the architecture description

Suppose a paper describes a local equivariant model with a 5 Å cutoff, two interaction stages, 64 scalar and 64 vector channels, and a correlation order of three. Read it in pieces:

| Setting | Meaning | What it does not establish |
|---|---|---|
| Cutoff = 5 Å | Direct graph edges or local environments use this distance scale | All longer-range physics is negligible |
| Two interaction stages | Two successive representation updates | Two MD timesteps, or two physical chemical reactions |
| 64 scalar + 64 vector channels | Several learned patterns with defined rotation behavior | 64 atoms, elements, or prediction heads |
| Correlation order = 3 in a MACE product basis | Products can include three neighbor contributions | The final stacked nonlinear model is globally limited to three-body interactions |
| Energy readout | Features are mapped to energy contributions | Forces are independently predicted |
| A chosen method head | One learned reference target is requested | Different heads can be mixed freely in energy differences |
{: .wrap}

This description tells you how the model processes inputs. It does not yet tell you what was in the training data or which checkpoint was used.

### Read angular settings literally

In MACE-related code and descriptions, the maximum degree used for edge spherical harmonics and the maximum degree retained in hidden atom features need not be identical. You may encounter names such as `max_ell`, `max_L`, and `hidden_irreps` in different interfaces.

Check the definition in that implementation. A scalar final energy does not mean every intermediate angular feature was scalar. Conversely, a high angular cutoff in one operation does not mean the model retains all those feature types everywhere.

A **hyperparameter** is a design or training setting chosen outside ordinary weight fitting: cutoff, width, layer count, learning rate, and loss weights are examples. A **parameter** usually means one of the weights learned during training. Some software uses the words less strictly, so context matters.

### Read the data and evaluation as carefully as the architecture

Look for the reference method, energy definitions, elements, charge/spin treatment, boundary conditions, data-generation procedure, and split strategy. Then check which quantities were evaluated and under which conditions.

“Trained on millions of structures” describes scale. It does not tell you whether the rare configuration controlling your application was present. “Accurate forces” needs units, a dataset, and an error definition. “Reactive” needs evidence for the reactions of interest.

### Know what the common dataset names imply

A dataset of crystal relaxation trajectories emphasizes configurations encountered while optimizing solids. A molecular conformer dataset emphasizes alternative arrangements of molecules. A catalyst dataset may emphasize adsorbates on surfaces. They teach different parts of configuration space, even when they share some elements.

For a concrete example, the original MACE-MP work uses broad inorganic materials data, while MACE-OFF uses molecular reference data. UMA explicitly documents different tasks associated with different reference datasets and levels of theory. These distinctions are part of interpreting a trained potential, not incidental administrative details. <sup><a href="#ref-38" aria-label="Reference 38">[38]</a> <a href="#ref-39" aria-label="Reference 39">[39]</a> <a href="#ref-37" aria-label="Reference 37">[37]</a></sup>

### Record enough information to reproduce the result

A usable record includes the exact checkpoint or model-file hash, package version, chosen head/task, supported-state inputs, numerical precision, and any added energy terms. For training, also keep the dataset definition, split, reference settings, configuration, and random seeds.

For a simulation, add the structure and boundary conditions, timestep, masses, integrator, thermostat/barostat, constraints, and analysis definition. Stating only “we used MACE” is like stating only “we used DFT”: it leaves important choices unspecified.

## A beginner's route through the subject

If the architecture names are still overwhelming, study the ideas in this order:

1. **Energy and force.** Use the two-atom table until the downhill direction makes sense.
2. **Fitting.** Understand a reference label, a prediction, a loss, and a weight update.
3. **Local environments.** Understand why a model sums atomic contributions and uses a cutoff.
4. **Graphs.** Follow elements → neighbors → messages → updated features → energy.
5. **Symmetry.** Separate an unchanged energy from a force arrow that rotates.
6. **One architecture.** Trace MACE or NequIP through its actual components before comparing ten models.
7. **Heads and checkpoints.** Identify the reference target and the output you are selecting.
8. **Validation.** Test the energy surface, dynamics, and scientific observable relevant to your application.

For further reading, start with the general review by Unke and colleagues, then read an architecture paper alongside its implementation. The Behler–Parrinello paper explains the local atomic-energy idea; SchNet introduces learned atomistic interactions; PaiNN, NequIP, MACE, and Allegro develop different geometric constructions. The documentation links in the references are there to connect the paper's ideas with the names found in real code.

The useful question becomes specific: **for this checkpoint, input state, and reference method, is the learned energy surface reliable in the region my calculation will explore?** That is the connection between understanding an MLIP and using one well.

## Glossary

Architecture
: The model's arrangement of operations and information flow.

Atomic reference energy / E0
: An element-dependent energy baseline; its meaning depends on how it was obtained and used.

Backbone / trunk
: The shared part that builds internal representations before a prediction head.

Body order
: How many atoms jointly enter a term in an expansion; it is different from the number of layers.

Charge / spin multiplicity
: Inputs describing electron imbalance and combined spin; the same nuclei can have different energies in different states.

Checkpoint
: A saved trained model with learned weights and the information needed to interpret them.

Conservative force
: A force consistent with the negative gradient of a potential energy.

Cutoff
: The distance limit for a specified local environment or graph connection.

Descriptor
: A numerical description of an atomic environment.

Embedding
: A learned numerical representation, often used to encode element identity or a task.

Energy surface / PES
: Energy considered as a function of atom positions for a specified physical state.

Equivariance
: Predictable transformation of an output or feature when the input is transformed.

Feature / channel
: An internal description used by the model; a channel is one copy of a feature type.

Fine-tuning
: Further training starting from pretrained weights.

Foundation model
: A broadly pretrained model intended to support several downstream applications.

Graph / node / edge
: A representation of atoms and their connections; atomistic edges commonly indicate proximity.

Head / readout
: An output mapping, although attention heads and other uses require their own definitions.

Hyperparameter
: A chosen architecture or training setting, such as cutoff or learning rate.

Inference
: Evaluating a trained model on an input, without updating its weights.

Invariance
: No change in a quantity under a specified transformation.

Irrep
: A block of components with a defined transformation rule, such as scalar or vector behavior.

Label
: A reference answer associated with a structure.

Loss
: A score measuring prediction errors during training.

Message passing
: Updating atom features using information from connected neighbors.

Parameter / weight
: An adjustable model number fitted during training.

Receptive field
: The region of the input that can influence a specified feature or output.

Replay
: Including earlier-domain examples during adaptation to help retain earlier behavior.

Stress / virial
: Related measures of response to deformation; their units and sign conventions differ.

Training / validation / test
: Data used to fit weights, choose settings, and independently evaluate the final model.

Uncertainty
: A model-dependent indication of confidence that must be checked against actual errors.

## References

<ol class="references">
<li id="ref-1">Unke, O. T., et al. (2021). <a href="https://doi.org/10.1021/acs.chemrev.0c01111">Machine Learning Force Fields.</a> Chemical Reviews, 121, 10142–10186.</li>
<li id="ref-2">Bartók, A. P., Payne, M. C., Kondor, R., &amp; Csányi, G. (2010). <a href="https://doi.org/10.1103/PhysRevLett.104.136403">Gaussian Approximation Potentials: The Accuracy of Quantum Mechanics, without the Electrons.</a> Physical Review Letters, 104, 136403.</li>
<li id="ref-3">Behler, J., &amp; Parrinello, M. (2007). <a href="https://doi.org/10.1103/PhysRevLett.98.146401">Generalized Neural-Network Representation of High-Dimensional Potential-Energy Surfaces.</a> Physical Review Letters, 98, 146401.</li>
<li id="ref-4">Chmiela, S., et al. (2017). <a href="https://doi.org/10.1126/sciadv.1603015">Machine learning of accurate energy-conserving molecular force fields.</a> Science Advances, 3, e1603015.</li>
<li id="ref-5">van Duin, A. C. T., Dasgupta, S., Lorant, F., &amp; Goddard, W. A. (2001). <a href="https://doi.org/10.1021/jp004368u">ReaxFF: A Reactive Force Field for Hydrocarbons.</a> The Journal of Physical Chemistry A, 105, 9396–9409.</li>
<li id="ref-6">ASE developers. <a href="https://docs.ase-lib.org/ase/calculators/calculators.html">Calculators.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-7">ASE developers. <a href="https://docs.ase-lib.org/ase/md.html">Molecular dynamics.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-8">NequIP developers. <a href="https://nequip.readthedocs.io/en/latest/guide/configuration/model.html">Model Hyperparameters: energy-only models and derivative outputs.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-9">NequIP developers. <a href="https://nequip.readthedocs.io/en/latest/guide/reference/conventions.html">Conventions: pressure, stress, and virials.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-10">ASE developers. <a href="https://docs.ase-lib.org/ase/atoms.html">The Atoms object: energy definitions and stress.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-11">Ko, T. W., Finkler, J. A., Goedecker, S., &amp; Behler, J. (2021). <a href="https://doi.org/10.1038/s41467-020-20427-2">A fourth-generation high-dimensional neural network potential with accurate electrostatics including non-local charge transfer.</a> Nature Communications, 12, 398.</li>
<li id="ref-12">NequIP developers. <a href="https://nequip.readthedocs.io/en/latest/guide/configuration/metrics.html">Loss and Metrics.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-13">PyTorch developers. <a href="https://docs.pytorch.org/tutorials/beginner/blitz/autograd_tutorial.html">A Gentle Introduction to torch.autograd.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-14">MACE developers. <a href="https://mace-docs.readthedocs.io/en/latest/guide/training.html">Training.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-15">Bartók, A. P., Kondor, R., &amp; Csányi, G. (2013). <a href="https://doi.org/10.1103/PhysRevB.87.184115">On representing chemical environments.</a> Physical Review B, 87, 184115.</li>
<li id="ref-16">MACE developers. <a href="https://github.com/ACEsuit/mace/blob/main/mace/modules/blocks.py">mace/modules/blocks.py: radial embeddings, product bases, and readout blocks.</a> Official source code; accessed October 22, 2026.</li>
<li id="ref-17">Drautz, R. (2019). <a href="https://doi.org/10.1103/PhysRevB.99.014104">Atomic cluster expansion for accurate and transferable interatomic potentials.</a> Physical Review B, 99, 014104.</li>
<li id="ref-18">Batzner, S., et al. (2022). <a href="https://doi.org/10.1038/s41467-022-29939-5">E(3)-equivariant graph neural networks for data-efficient and accurate interatomic potentials.</a> Nature Communications, 13, 2453.</li>
<li id="ref-19">Musaelian, A., et al. (2023). <a href="https://doi.org/10.1038/s41467-023-36329-y">Learning local equivariant representations for large-scale atomistic dynamics.</a> Nature Communications, 14, 579.</li>
<li id="ref-20">Batatia, I., et al. (2026). <a href="https://arxiv.org/abs/2602.19411">MACE-POLAR-1: A Polarisable Electrostatic Foundation Model for Molecular Chemistry.</a> arXiv:2602.19411 (preprint).</li>
<li id="ref-21">Schütt, K. T., et al. (2017). <a href="https://arxiv.org/abs/1706.08566">SchNet: A continuous-filter convolutional neural network for modeling quantum interactions.</a> Advances in Neural Information Processing Systems, 30; author manuscript arXiv:1706.08566.</li>
<li id="ref-22">Schütt, K., Unke, O., &amp; Gastegger, M. (2021). <a href="https://proceedings.mlr.press/v139/schutt21a.html">Equivariant Message Passing for the Prediction of Tensorial Properties and Molecular Spectra.</a> Proceedings of Machine Learning Research, 139, 9377–9388.</li>
<li id="ref-23">e3nn developers. <a href="https://docs.e3nn.org/en/stable/guide/irreps.html">Irreducible representations.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-24">e3nn developers. <a href="https://docs.e3nn.org/en/stable/api/o3/o3_tp.html">Tensor Product.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-25">Batatia, I., Kovács, D. P., Simm, G. N. C., Ortner, C., &amp; Csányi, G. (2022). <a href="https://papers.neurips.cc/paper_files/paper/2022/hash/4a36c3c51af11ed9f34615b81edb5bbc-Abstract-Conference.html">MACE: Higher Order Equivariant Message Passing Neural Networks for Fast and Accurate Force Fields.</a> Advances in Neural Information Processing Systems, 35.</li>
<li id="ref-26">Smith, J. S., Isayev, O., &amp; Roitberg, A. E. (2017). <a href="https://doi.org/10.1039/C6SC05720A">ANI-1: an extensible neural network potential with DFT accuracy at force field computational cost.</a> Chemical Science, 8, 3192–3203.</li>
<li id="ref-27">Thompson, A. P., Swiler, L. P., Trott, C. R., Foiles, S. M., &amp; Tucker, G. J. (2015). <a href="https://doi.org/10.1016/j.jcp.2014.12.018">Spectral neighbor analysis method for automated generation of quantum-accurate interatomic potentials.</a> Journal of Computational Physics, 285, 316–330.</li>
<li id="ref-28">Shapeev, A. V. (2016). <a href="https://doi.org/10.1137/15M1054183">Moment Tensor Potentials: A Class of Systematically Improvable Interatomic Potentials.</a> Multiscale Modeling &amp; Simulation, 14, 1153–1173.</li>
<li id="ref-29">Klicpera, J., Groß, J., &amp; Günnemann, S. (2020). <a href="https://arxiv.org/abs/2003.03123">Directional Message Passing for Molecular Graphs.</a> International Conference on Learning Representations; author manuscript arXiv:2003.03123.</li>
<li id="ref-30">Zhang, L., et al. (2018). <a href="https://doi.org/10.1103/PhysRevLett.120.143001">Deep Potential Molecular Dynamics: A Scalable Model with the Accuracy of Quantum Mechanics.</a> Physical Review Letters, 120, 143001.</li>
<li id="ref-31">DeePMD-kit developers. <a href="https://docs.deepmodeling.com/projects/deepmd/en/latest/model/index.html">Model guide.</a> Official descriptor and fitting-network documentation; accessed October 22, 2026.</li>
<li id="ref-32">Liao, Y.-L., Wood, B., Das, A., &amp; Smidt, T. (2024). <a href="https://arxiv.org/abs/2306.12059">EquiformerV2: Improved Equivariant Transformer for Scaling to Higher-Degree Representations.</a> International Conference on Learning Representations; author manuscript arXiv:2306.12059.</li>
<li id="ref-33">MACE developers. <a href="https://github.com/ACEsuit/mace/blob/main/mace/modules/models.py">mace/modules/models.py: energy assembly, multihead selection, and derivative outputs.</a> Official source code; accessed October 22, 2026.</li>
<li id="ref-34">Unke, O. T., &amp; Meuwly, M. (2019). <a href="https://doi.org/10.1021/acs.jctc.9b00181">PhysNet: A Neural Network for Predicting Energies, Forces, Dipole Moments, and Partial Charges.</a> Journal of Chemical Theory and Computation, 15, 3678–3693.</li>
<li id="ref-35">MACE developers. <a href="https://mace-docs.readthedocs.io/en/latest/guide/multihead_finetuning.html">Multihead Replay Finetuning.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-36">Wood, B. M., et al. (2025). <a href="https://arxiv.org/abs/2506.23971">UMA: A Family of Universal Models for Atoms.</a> arXiv:2506.23971 (preprint).</li>
<li id="ref-37">FAIR Chemistry developers. <a href="https://facebookresearch.github.io/fairchem/uma/">UMA Models: mixture-of-linear-experts routing, tasks, charge, and spin.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-38">Batatia, I., et al. (2025). <a href="https://doi.org/10.1063/5.0297006">A foundation model for atomistic materials chemistry.</a> The Journal of Chemical Physics, 163, 184110.</li>
<li id="ref-39">Kovács, D. P., et al. (2025). <a href="https://doi.org/10.1021/jacs.4c07099">MACE-OFF: Short-Range Transferable Machine Learning Force Fields for Organic Molecules.</a> Journal of the American Chemical Society, 147, 17598–17611.</li>
<li id="ref-40">Chen, C., &amp; Ong, S. P. (2022). <a href="https://doi.org/10.1038/s43588-022-00349-3">A universal graph deep learning interatomic potential for the periodic table.</a> Nature Computational Science, 2, 718–728.</li>
<li id="ref-41">Deng, B., et al. (2023). <a href="https://doi.org/10.1038/s42256-023-00716-3">CHGNet as a pretrained universal neural network potential for charge-informed atomistic modelling.</a> Nature Machine Intelligence, 5, 1031–1041.</li>
<li id="ref-42">MACE developers. <a href="https://mace-docs.readthedocs.io/en/latest/guide/foundation_models.html">Foundation models.</a> Official model and reference-method documentation; accessed October 22, 2026.</li>
<li id="ref-43">MACE developers. <a href="https://mace-docs.readthedocs.io/en/latest/guide/finetuning.html">Fine-tuning Foundation Models.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-44">Ramakrishnan, R., Dral, P. O., Rupp, M., &amp; von Lilienfeld, O. A. (2015). <a href="https://doi.org/10.1021/acs.jctc.5b00099">Big Data Meets Quantum Chemistry Approximations: The Δ-Machine Learning Approach.</a> Journal of Chemical Theory and Computation, 11, 2087–2096.</li>
<li id="ref-45">MACE developers. <a href="https://mace-docs.readthedocs.io/en/latest/guide/finetuning_guidance.html">Fine-tuning Guidance.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-46">Zhang, Y., et al. (2020). <a href="https://doi.org/10.1016/j.cpc.2020.107206">DP-GEN: A concurrent learning platform for the generation of reliable deep learning based potential energy models.</a> Computer Physics Communications, 253, 107206.</li>
<li id="ref-47">ASE developers. <a href="https://docs.ase-lib.org/ase/io/formatoptions.html#extxyz">Format Specific Options: extended XYZ.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-48">Podryabinkin, E. V., &amp; Shapeev, A. V. (2017). <a href="https://doi.org/10.1016/j.commatsci.2017.08.031">Active learning of linearly parametrized interatomic potentials.</a> Computational Materials Science, 140, 171–180.</li>
<li id="ref-49">Vandermause, J., et al. (2020). <a href="https://doi.org/10.1038/s41524-020-0283-z">On-the-fly active learning of interpretable Bayesian force fields for atomistic rare events.</a> npj Computational Materials, 6, 20.</li>
<li id="ref-50">Fu, X., et al. (2023). <a href="https://arxiv.org/abs/2210.07237">Forces are not Enough: Benchmark and Critical Evaluation for Machine Learning Force Fields with Molecular Simulations.</a> Transactions on Machine Learning Research; author manuscript arXiv:2210.07237.</li>
<li id="ref-51">LAMMPS developers. <a href="https://docs.lammps.org/pair_zbl.html">pair_style zbl command.</a> Official documentation; accessed October 22, 2026.</li>
<li id="ref-52">Deng, B., et al. (2025). <a href="https://doi.org/10.1038/s41524-024-01500-6">Systematic softening in universal machine learning interatomic potentials.</a> npj Computational Materials, 11, 9.</li>
<li id="ref-53">IUPAC. <a href="https://goldbook.iupac.org/terms/view/T06470">Transition state theory.</a> Compendium of Chemical Terminology (Gold Book), 5th edition.</li>
</ol>
