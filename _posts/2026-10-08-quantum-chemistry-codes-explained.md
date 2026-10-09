---
layout: post
title: "Quantum chemistry codes, explained from zero"
description: "What DFT, functionals, basis sets, pseudopotentials, k-points, smearing, and the rest of a DFT input actually mean, and why Gaussian, ORCA, Quantum ESPRESSO, VASP, and CP2K differ."
permalink: /perspectives/quantum-chemistry-codes-explained/
date: 2026-10-08 20:00:00 -0700
category: Explainers
topic: Quantum chemistry and DFT
reading_time: 28
---

Gaussian, ORCA, Quantum ESPRESSO, VASP, and CP2K all do the same basic job, yet their inputs read like different languages. An ORCA input asks for `B3LYP D3BJ def2-TZVP`. A Quantum ESPRESSO input asks for `ecutwfc`, `degauss`, and `K_POINTS`. The papers that use them assume you already know why. This post builds that vocabulary from zero. It assumes high-school chemistry and nothing more, and it is long on purpose: every term is explained before it is used.

> **The central idea:** every one of these programs answers the same question approximately: given where the atoms are, where do the electrons go, and what energy results? They differ in three choices: how rough the approximation is (the *method*), how the electrons are written down for the computer (the *basis set*), and whether the system is a lone molecule or a pattern that repeats forever (the *boundary conditions*). Almost every term below belongs to one of those three choices.

<details class="essay-toc" open>
<summary>In this post</summary>
<ol>
<li><a href="#the-one-problem-every-program-solves">The one problem every program solves</a></li>
<li><a href="#three-choices-that-separate-the-programs">Three choices that separate the programs</a></li>
<li><a href="#choice-1-the-method">Choice 1: the method</a></li>
<li><a href="#choice-2-the-basis-set">Choice 2: the basis set</a></li>
<li><a href="#choice-3-isolated-or-periodic">Choice 3: isolated or periodic</a></li>
<li><a href="#what-you-ask-the-program-to-do">What you ask the program to do</a></li>
<li><a href="#the-five-programs">The five programs</a></li>
<li><a href="#which-program-for-which-job">Which program for which job</a></li>
<li><a href="#reading-a-method-line">Reading a method line</a></li>
<li><a href="#a-one-line-glossary">A one-line glossary</a></li>
<li><a href="#references">References</a></li>
</ol>
</details>

## The one problem every program solves

An atom is a tiny, heavy, positively charged nucleus surrounded by much lighter, negatively charged electrons. Chemistry is mostly about the electrons: bonds form, break, and rearrange because electrons move between and around nuclei.

Electrons obey quantum mechanics, and its central equation is the Schrödinger equation. Solving it exactly would give everything: energies, bond lengths, spectra. The catch is that it can be solved exactly only in the simplest cases, such as a hydrogen atom with its single electron. With two or more electrons, every electron repels every other one, so the motion of each depends on all the others at once.

The size of the problem also grows explosively. The full description of the electrons, the *wavefunction*, depends on three coordinates for every electron. Benzene has 42 electrons, so its wavefunction is a function of 126 variables. Storing it on a coarse grid of only 10 points per variable would take 10<sup>126</sup> numbers, far more than the roughly 10<sup>80</sup> atoms in the observable universe. Every program therefore solves the problem approximately, and most of the vocabulary in this post names the approximations.

### Fixed nuclei, moving electrons

One approximation is so universal that programs rarely mention it. A proton is about 1,836 times heavier than an electron, so nuclei move far more slowly than electrons. Programs therefore hold the nuclei still, solve for the electrons around them, and only then consider moving the nuclei. This is the Born–Oppenheimer approximation. In practice it means every calculation starts from a list of atom positions, called the *geometry* or *structure*.

### What comes out: energy, forces, properties

For a given geometry, a program returns:

- **Energy:** one number for that arrangement of atoms. Lower means more stable.
- **Forces:** for each atom, the direction and strength of the push it feels. A force is the downhill slope of the energy: if moving an atom to the left lowers the energy, the force on that atom points left. Forces are what let a program move atoms, either to find a stable structure or to run molecular dynamics.
- **Properties:** everything else that follows from the electrons, such as atomic charges, dipole moments, vibrational frequencies, spectra, magnetism, and band structures.

It helps to picture the energy as a landscape. Each possible arrangement of the atoms is a location, and the energy is the height. Stable molecules sit in valleys. A reaction is a path from one valley to another, and the highest point along the easiest path is the *transition state*. Its height above the starting valley is the *barrier*, which controls how fast the reaction goes. This landscape is called the *potential energy surface*, and most calculation types are different ways of exploring it.

<figure class="essay-figure">
<img src="{{ '/assets/blog/qc-energy-landscape.png' | relative_url }}" alt="Schematic energy curve with a reactant valley on the left, a transition state at the top of a hill, and a lower product valley on the right. Arrows mark the barrier and the reaction energy, an arrow on the slope shows the force pointing downhill, and green dots along the curve represent NEB images." width="3500" height="2300" loading="lazy">
<figcaption>A schematic potential energy surface along one reaction path. A relaxation slides into the nearest valley, NEB places a chain of images along the path to find the transition state, and molecular dynamics moves the atoms with the forces.</figcaption>
</figure>

### Only differences matter

The total energy a program prints is large and, by itself, meaningless. A single water molecule has a total energy of roughly −76 hartree, about −2,070 eV, while the chemistry we care about involves differences of tenths of an electronvolt. Useful quantities are always differences between calculations: product minus reactant, adsorbed minus separated, transition state minus reactant.

That has a consequence that is easy to miss. Total energies from different programs, or from the same program with different settings, cannot be compared, because each choice shifts the zero of energy. Compute every energy in a comparison with the same method and settings. Errors then partly cancel, which is a large part of why approximate methods work as well as they do.

### Units you will meet

Gaussian, ORCA, and CP2K report energies in hartree, Quantum ESPRESSO in rydberg, and VASP in electronvolts. Chemistry papers often use kcal/mol or kJ/mol.

| Unit | In eV | In kcal/mol | Where you see it |
|---|---|---|---|
| 1 hartree (Ha) | 27.211 | 627.5 | Gaussian, ORCA, CP2K output |
| 1 rydberg (Ry) = 0.5 Ha | 13.606 | 313.8 | Quantum ESPRESSO input and output |
| 1 eV | 1 | 23.06 | VASP, most physics papers |
| 1 kcal/mol = 4.184 kJ/mol | 0.0434 | 1 | Chemistry papers |
{: .wrap}

Some reference points: "chemical accuracy" usually means errors below 1 kcal/mol (about 0.04 eV). Thermal energy at room temperature is about 0.6 kcal/mol (0.026 eV). Breaking the O–H bond of phenol, the kind of bond a phenolic antioxidant gives up, takes about 87 kcal/mol (3.8 eV).

## Three choices that separate the programs

With the problem defined, the differences between programs come down to three choices:

1. **Method:** which approximation to the electron problem is used, for example DFT with a particular functional, or a wavefunction method such as CCSD(T).
2. **Basis set:** how the electrons' orbitals are written down as numbers the computer can store, either as Gaussian functions centered on atoms or as plane waves filling a box.
3. **Boundary conditions:** whether the system is a single molecule in empty space, or a box that repeats forever in every direction, like a crystal.

The next three sections take these in order. The rest of the post covers what you ask a program to do and the programs themselves.

## Choice 1: the method

### Density functional theory (DFT)

DFT rests on a theorem proved by Hohenberg and Kohn in 1964: the lowest-energy state of a set of electrons is completely determined by the *electron density*, a map of how many electrons there are at each point in space.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup> The density depends on only three coordinates (x, y, z), however many electrons there are. Benzene's 126-variable wavefunction is replaced by a 3-variable density.

The theorem says the energy *can* be computed from the density, but not *how*. Kohn and Sham supplied the practical recipe in 1965.<sup><a href="#ref-2" aria-label="Reference 2">[2]</a></sup> They replaced the real, interacting electrons with imaginary electrons that do not interact with one another but are constructed to have exactly the same density. Most of the energy of these imaginary electrons can be computed exactly. Everything difficult is collected into one leftover term, the **exchange-correlation energy**:

- *Exchange* comes from the Pauli principle: two electrons with the same spin avoid each other.
- *Correlation* is the remaining way electrons dodge one another because they repel.

The exchange-correlation energy is a small part of the total, but it decides most of the chemistry, and its exact form is unknown. It must be approximated, and that approximation is the only real difference between the many flavors of DFT. The cost of DFT grows roughly as the cube of the system size, which makes calculations on hundreds of atoms routine.

### What a "functional" is

A *function* takes a number and returns a number: f(x) = x². A *functional* takes an entire function and returns a number. The area under a curve is a familiar example: give it the whole curve and get back one number. The exchange-correlation functional takes the whole electron density and returns one energy. "Which functional?" therefore means "which approximation to the exchange-correlation energy?"

### The functional ladder

Perdew pictured the families of functionals as rungs of a ladder, "Jacob's ladder", climbing from simple to accurate.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup> Each rung uses more information about the density and usually costs more.

| Rung | Extra information used | Examples | Typical use |
|---|---|---|---|
| LDA | The density at each point | LDA | Mostly historical |
| GGA | + how quickly the density changes (its gradient) | PBE | Solids, metals, surfaces |
| meta-GGA | + the kinetic energy density | SCAN, r²SCAN | A step above GGA, similar cost |
| Hybrid | + a fraction of exact (Hartree–Fock) exchange | B3LYP, PBE0, ωB97X | Molecules, reaction energies, barriers |
| Double hybrid | + a correlation term from wavefunction theory | B2PLYP | High-accuracy molecular work |
{: .wrap}

**GGA, such as PBE.** PBE is the standard functional for solids, metals, and surfaces.<sup><a href="#ref-4" aria-label="Reference 4">[4]</a></sup> It is cheap and gives good structures. Its main weakness is *self-interaction error*: in an approximate functional, an electron partly repels itself, so electrons spread out too much. In practice, reaction barriers come out too low, band gaps too small, and localized electrons, such as those in radicals or transition-metal oxides, are described poorly.

**meta-GGA, such as r²SCAN.** The kinetic energy density lets a functional recognize what kind of region it is in, for example a single bond or a metal. SCAN improved accuracy for many systems but was numerically delicate. r²SCAN keeps most of that accuracy, is numerically stable, and costs about the same as a GGA.<sup><a href="#ref-5" aria-label="Reference 5">[5]</a></sup>

**Hybrid, such as B3LYP, PBE0, or ωB97X.** Hartree–Fock theory (below) treats exchange exactly and has no self-interaction error. Hybrids mix a fraction of that exact exchange into a GGA: 20% in B3LYP and 25% in PBE0.<sup><a href="#ref-6" aria-label="Reference 6">[6]</a> <a href="#ref-7" aria-label="Reference 7">[7]</a></sup> Range-separated hybrids such as ωB97X vary the mixture with the distance between electrons and use more exact exchange at long range.<sup><a href="#ref-8" aria-label="Reference 8">[8]</a></sup> Hybrids give better barriers and reaction energies, which is why they are the default for molecular chemistry. Their cost depends on the basis set (next section). In Gaussian-basis programs such as ORCA and Gaussian, hybrids are routine for molecules of a hundred atoms or more. In plane-wave programs such as Quantum ESPRESSO and VASP, they are often ten or more times more expensive than a GGA, so periodic studies mostly use GGA or meta-GGA functionals.

### Dispersion corrections: D3 and D4

Even neutral, nonpolar molecules attract one another weakly. The electron cloud of a molecule fluctuates, creating momentary dipoles that induce matching dipoles in its neighbors. The result is a weak, always-attractive force called London dispersion, one kind of van der Waals interaction. Dispersion is what holds the hydrocarbon molecules of a base oil together as a liquid.

Common functionals miss most of it. A GGA or hybrid looks at the density at each point and its immediate surroundings, but dispersion is a correlation between fluctuations in two separate regions that may not overlap at all. Two molecules a few ångströms apart feel almost no attraction in plain DFT.

The usual fix adds a simple, empirical attraction between every pair of atoms that falls off as 1/r⁶ and is switched off at short distances, where the functional already works. Grimme's D3 is the most widely used version,<sup><a href="#ref-9" aria-label="Reference 9">[9]</a></sup> usually with Becke–Johnson damping, written D3(BJ).<sup><a href="#ref-10" aria-label="Reference 10">[10]</a></sup> D4 also makes the attraction depend on each atom's charge.<sup><a href="#ref-11" aria-label="Reference 11">[11]</a></sup> The added cost is negligible, and the method is then written, for example, as PBE-D3(BJ) or B3LYP-D4. Dispersion matters most for liquids, adsorption on surfaces, molecular crystals, and molecules associating with one another. It changes a covalent bond energy inside one molecule much less, but it is cheap enough to include anyway.

### DFT+U

In transition-metal oxides such as hematite (Fe₂O₃), the metal's d electrons are localized on individual metal atoms. Self-interaction error in a GGA smears them out, which gives band gaps that are far too small, wrong magnetic moments, and poor oxidation energies. DFT+U adds an energy penalty, named after the Hubbard model, that favors d orbitals being either fully occupied or empty, which pushes electrons back onto individual atoms.<sup><a href="#ref-12" aria-label="Reference 12">[12]</a></sup> The size of the penalty, U, is a parameter of a few electronvolts chosen for each element, either fitted to experimental data or computed from first principles.

Two cautions. Energies computed with different U values cannot be compared, so U must stay the same across a study. And U is normally applied to oxides but not to metals: metallic iron is described well by plain spin-polarized PBE. Comparing metallic Fe with iron oxide therefore needs extra care.

### Wavefunction methods: HF, MP2, and CCSD(T)

The alternative to DFT is to approximate the wavefunction itself, through a series of methods of increasing accuracy and cost.

- **Hartree–Fock (HF)** lets each electron move in the *average* field of all the others. Exchange is exact, but correlation is missing entirely, so HF energies are not accurate enough for most chemistry. HF is the starting point for the methods below and the source of the "exact exchange" in hybrid functionals.
- **MP2** (second-order Møller–Plesset perturbation theory) adds an estimate of correlation on top of HF. It is a real improvement and captures dispersion, though it can overestimate it.
- **CCSD(T)** (coupled cluster with single, double, and perturbative triple excitations) is the "gold standard" of quantum chemistry.<sup><a href="#ref-13" aria-label="Reference 13">[13]</a></sup> For ordinary molecules with a large basis set, it typically reaches chemical accuracy. Its cost grows as the seventh power of system size: doubling the molecule multiplies the cost by about 128. Conventional CCSD(T) is therefore limited to small molecules.

**DLPNO-CCSD(T)** makes coupled cluster affordable for larger molecules.<sup><a href="#ref-14" aria-label="Reference 14">[14]</a></sup> It exploits the fact that correlation between distant electrons is weak and can be compressed or neglected, so the cost grows almost linearly with size. With tight settings it closely reproduces conventional CCSD(T), and it runs on molecules of roughly 50–150 atoms. In practice, wavefunction methods like these run only in molecular programs, especially ORCA.

A common strategy combines the two families: optimize the geometry with DFT, then compute a more accurate energy at that fixed geometry with DLPNO-CCSD(T).

## Choice 2: the basis set

### What a basis set is

An orbital describes where an electron is likely to be found. Mathematically it is a smooth function in three dimensions. A computer cannot store an arbitrary smooth function, so programs build each orbital from a fixed set of simpler building blocks, the *basis functions*, and store only how much of each block to use. It is like mixing any color from a fixed set of paints, or building any sound from pure tones. More building blocks describe orbitals more accurately and cost more. The collection of building blocks is the *basis set*, and there are two main families.

<figure class="essay-figure">
<img src="{{ '/assets/blog/qc-basis-sets.png' | relative_url }}" alt="Two panels over a 20 Å box containing two atoms. Panel a shows Gaussian functions of several widths centered on the two atoms, with the empty regions at both ends labeled as having no functions and no cost. Panel b shows cosine waves of increasing frequency spanning the whole box, with the shortest wave labeled as set by the cutoff energy." width="3500" height="3600" loading="lazy">
<figcaption>Two ways to write down orbitals. (a) Gaussian-type orbitals are bumps of different widths centered on each atom; empty space contains no functions. (b) Plane waves fill the whole box, including the empty space; the cutoff energy sets the shortest wave included.</figcaption>
</figure>

### Gaussian-type orbitals

Molecular programs build orbitals from Gaussian functions: bell-shaped bumps of the form exp(−αr²) centered on each atom, multiplied by simple factors that give them s, p, or d shapes. Real atomic orbitals are not Gaussian, so several Gaussians of different widths are combined for each orbital. Gaussians are used anyway because the integrals a calculation needs between them have simple formulas, which makes them fast.

Basis set names look cryptic, but they encode size:

- **6-31G\*** (Pople style): each core orbital is made from six Gaussians, and each valence orbital is split into two parts made from three Gaussians and one. The star adds *polarization functions*, d-shaped functions on heavy atoms that let orbitals distort in bonds. A plus sign, as in 6-31+G\*, adds *diffuse functions*: wide Gaussians needed for anions and weak interactions.
- **def2-SVP, def2-TZVP, def2-QZVP** (Karlsruhe): split valence, triple-zeta valence with polarization, and quadruple-zeta.<sup><a href="#ref-15" aria-label="Reference 15">[15]</a></sup> "Zeta" counts how many functions describe each valence orbital; more zeta means more flexibility. For elements heavier than krypton, the def2 sets replace the inner electrons with an *effective core potential*, the molecular-code version of the pseudopotentials described below.
- **cc-pVTZ and aug-cc-pVTZ** (Dunning): designed to converge systematically with correlated methods such as CCSD(T). "aug" adds diffuse functions.

The number of basis functions grows with the number of atoms, so the cost depends on how many atoms there are, not on the space around them. Empty space is free, which is the main reason molecular programs are efficient for molecules.

One side effect: when two molecules approach, each can borrow the other's basis functions to describe its own electrons better, which makes binding look artificially strong. This *basis set superposition error* shrinks with larger basis sets and can be corrected with the counterpoise method.

### Plane waves

Periodic programs build orbitals from plane waves: sine and cosine waves that extend across the whole simulation box. Because the box repeats (see below), only waves that fit it exactly, with a whole number of wavelengths, are allowed, just as only certain notes fit on a guitar string. Any smooth, periodic function can be built from enough of them.

The basis is controlled by one number, the **cutoff energy**. Each wave has a kinetic energy that grows as its wavelength shrinks, and the program includes every wave below the cutoff. A higher cutoff includes shorter waves, which describe finer detail. In Quantum ESPRESSO the cutoff is `ecutwfc`, in rydberg: 60 Ry is 60 × 13.6 ≈ 816 eV. In VASP it is `ENCUT`, in eV. Because one knob sets the quality, convergence is easy to check: raise the cutoff until the quantity you care about stops changing. Quantum ESPRESSO also has a second cutoff for the electron density, `ecutrho`. It is commonly 4 × `ecutwfc` for norm-conserving pseudopotentials and 8–12 × for ultrasoft and PAW ones.

The weakness is the mirror image of the Gaussians' strength. Plane waves fill the whole box whether atoms are there or not, so their number grows with the box volume. Doubling the box edge multiplies the volume, and roughly the number of plane waves, by eight. You pay for every cubic ångström, vacuum included.

### Pseudopotentials

Near a nucleus, valence orbitals oscillate rapidly, because they must stay orthogonal to the core orbitals beneath them. Describing those wiggles with plane waves would need very short waves and an enormous cutoff. Yet the core electrons, such as the 1s electrons of carbon and oxygen, are chemically inert: they hardly change when bonds form.

A *pseudopotential* replaces the nucleus and its core electrons with a smoother effective potential. The valence orbitals it produces, the *pseudo-orbitals*, are smooth and node-free inside a chosen core radius, r<sub>c</sub>, and identical to the true orbitals outside it, where bonding happens. The calculation then needs far fewer plane waves and treats only the valence electrons.

<figure class="essay-figure">
<img src="{{ '/assets/blog/qc-pseudopotential.png' | relative_url }}" alt="Plot of an orbital against distance from the nucleus. Inside a shaded core region, the true all-electron orbital oscillates and crosses zero twice, while the dashed pseudo-orbital rises smoothly. Beyond the core radius the two curves are identical." width="3500" height="2200" loading="lazy">
<figcaption>Schematic of a valence orbital near a nucleus. The true orbital oscillates inside the core region; the pseudo-orbital is smooth there and identical beyond the core radius r<sub>c</sub>, so far fewer plane waves are needed to describe it.</figcaption>
</figure>

There are three main types:

- **Norm-conserving (NC):** the pseudo-orbital holds the same amount of charge inside r<sub>c</sub> as the true one.<sup><a href="#ref-16" aria-label="Reference 16">[16]</a></sup> Simple and robust, but it needs a relatively high cutoff.
- **Ultrasoft (US):** relaxes that condition to allow much smoother orbitals and a lower cutoff, at the price of extra bookkeeping.<sup><a href="#ref-17" aria-label="Reference 17">[17]</a></sup>
- **Projector augmented wave (PAW):** also smooth and inexpensive, but it keeps the information needed to reconstruct the true orbital near the nucleus.<sup><a href="#ref-18" aria-label="Reference 18">[18]</a></sup> PAW is generally the most accurate of the three and is the standard in VASP.

Quantum ESPRESSO users often take pseudopotentials from PSLibrary, a set of ultrasoft and PAW pseudopotentials covering most of the periodic table,<sup><a href="#ref-19" aria-label="Reference 19">[19]</a></sup> or from SSSP, a tested collection with recommended cutoffs.<sup><a href="#ref-20" aria-label="Reference 20">[20]</a></sup> PSLibrary file names are informative. In `Fe.pbe-spn-kjpaw_psl.0.2.1.UPF`, `pbe` is the functional it was built for, `spn` means the 3s and 3p semicore electrons are treated as valence electrons (with a nonlinear core correction), `kjpaw` means PAW, and the rest is the library version. A pseudopotential is generated for one functional. Using it with another, for example a PBE pseudopotential in a hybrid calculation, is an approximation, though a common and usually acceptable one.

## Choice 3: isolated or periodic

### Molecules in empty space

Molecular programs such as Gaussian and ORCA treat a molecule as alone in infinite empty space, as in a dilute gas. A solvent can be added approximately with an *implicit solvation model* (such as PCM or SMD), which represents the solvent as a continuous polarizable medium instead of individual molecules.

### Periodic boundary conditions

A real piece of metal or a drop of oil contains around 10<sup>23</sup> atoms. Periodic programs make that manageable by simulating one box, the *cell*, and treating it as surrounded on all sides by identical copies of itself, forever. These are *periodic boundary conditions* (PBC). An atom that leaves through one face re-enters through the opposite face, like a character in an old arcade game who walks off one side of the screen and reappears on the other. A crystal really is a repeating pattern, so a small cell describes a perfect crystal exactly. A liquid in a large enough periodic box behaves like bulk liquid with no surface.

<figure class="essay-figure">
<img src="{{ '/assets/blog/qc-periodic-setups.png' | relative_url }}" alt="Four schematic panels, each showing a central simulation cell with a solid outline surrounded by faded periodic copies. (a) A small two-atom crystal cell. (b) A three-by-three supercell with one orange substituted atom. (c) A tall cell containing a few atomic layers at the bottom and vacuum above. (d) A small molecule in a box, with an arrow marking about 10 Å of vacuum to its copy in the next cell." width="4200" height="4200" loading="lazy">
<figcaption>Common periodic setups. The solid outline is the simulated cell; faded copies are its periodic images. (a) A crystal is one small repeating cell. (b) A supercell keeps a defect away from its own copies. (c) A slab is a few atomic layers with vacuum above, a model of a surface. (d) A molecule in a box is kept apart from its copies by vacuum.</figcaption>
</figure>

### Supercells

Anything placed in a periodic cell is repeated too. One defect, impurity, or adsorbed molecule in a small cell becomes a dense array of them that interact with their own copies. A *supercell* is a larger cell, for example 3 × 3 × 3 copies of the basic cell, that moves the copies further apart. Enlarge it until the quantity you care about stops changing.

### Slabs: modeling a surface

To model a surface, cut the crystal, keep a few atomic layers (a *slab*), and add a vacuum gap above them. The cell is still periodic in all three directions, so the slab sees copies of itself across the vacuum. The gap must be wide enough, often 10–15 Å or more, that they do not interact. The bottom layers are usually fixed at bulk positions to imitate the material underneath. When something is adsorbed on only one side, a *dipole correction* is often added to cancel an artificial electric field across the vacuum. An adsorption energy is then E(slab with molecule) − E(clean slab) − E(isolated molecule), each calculated with the same settings.

### A molecule in a box

A periodic program can still treat an isolated molecule by placing it in a large box with enough vacuum, typically about 10 Å, between it and its nearest copy. A 51-atom ZDDP molecule (zinc dialkyldithiophosphate, a common antiwear additive) therefore needs a box more than 20 Å on a side. Because plane waves fill that whole box, the calculation is far more expensive than the same molecule in ORCA.

Vacuum alone does not fully isolate the molecule. Electrostatic interactions with the copies fall off slowly with distance, especially for charged or strongly polar molecules. The Martyna–Tuckerman correction removes them;<sup><a href="#ref-21" aria-label="Reference 21">[21]</a></sup> in Quantum ESPRESSO it is `assume_isolated = 'mt'`. It works only if the box is roughly twice as large as the molecule's electron cloud in each direction, which is another reason boxes for molecules get large.

### k-points

This term confuses most newcomers. In a crystal, an electron's wave does not have to look identical in every cell: it can shift its phase slightly from one cell to the next, like a pattern that drifts as it repeats. Each possible rate of drift is labeled by a vector, **k**. The exact energy is an average over all possible k, and a program approximates that average with a grid of sample *k-points*, usually a Monkhorst–Pack grid such as 6 × 6 × 6.<sup><a href="#ref-22" aria-label="Reference 22">[22]</a></sup>

An analogy: to estimate a country's average temperature, you sample a grid of cities. Where temperature varies smoothly, a few cities are enough; where it changes abruptly, you need many. Three practical rules follow:

- **Insulators and semiconductors** vary smoothly and need relatively few k-points.
- **Metals need many.** In a metal, electrons fill the available states up to an energy called the *Fermi level*, and the occupation of each state jumps abruptly from full to empty there. Capturing that sharp edge needs a dense grid; a small cell of bulk iron is often given a dozen or more k-points in each direction.
- **Bigger cells need fewer k-points.** Doubling the cell in one direction roughly halves the k-points needed in that direction. For very large cells, and for a molecule in a box, a single k-point is enough: the **Γ (Gamma) point**, k = 0, where the wave is identical in every cell. Programs can run Γ-only calculations faster.

A slab gets a grid along the surface and a single k-point across the vacuum, written for example as 4 × 4 × 1. As with the cutoff, the right density is found by testing: increase the grid until the energy stops changing, often to within about 1 meV per atom.

### Smearing

In a metal, the abrupt full-to-empty jump at the Fermi level also causes numerical trouble. As the calculation iterates, a state can flip from just below the Fermi level to just above it and back, and the calculation struggles to converge. *Smearing* replaces the abrupt step with a smooth one: states near the Fermi level may be partly occupied, as if the electrons had a small temperature. This also makes the average over k-points converge faster.

The smearing width is a parameter: `degauss` in Quantum ESPRESSO, in rydberg (around 0.01–0.02 Ry is common for metals), and `SIGMA` in VASP, in eV. Too much smearing distorts the result. Several schemes exist; Marzari–Vanderbilt "cold" smearing was designed so that the energy depends only weakly on the width.<sup><a href="#ref-23" aria-label="Reference 23">[23]</a></sup> Molecules and insulators normally use no smearing, with fixed occupations.

### Spin polarization

Electrons have a property called spin with two possible values, up and down. In most stable organic molecules, every orbital holds one up and one down electron, so the two spin populations are identical and can be treated together. Two cases break that pairing:

- **Radicals** have an unpaired electron. Examples are the phenoxyl radical formed when a phenolic antioxidant donates its hydrogen atom, and the peroxyl radicals (ROO•) it intercepts.
- **Magnetic materials** such as iron have more up electrons than down; bulk iron carries about 2.2 Bohr magnetons per atom.

These need *spin-polarized* (or *unrestricted*) calculations, which treat up and down electrons separately and cost roughly twice as much. In Quantum ESPRESSO this is `nspin = 2`, together with `starting_magnetization` to give the calculation a magnetic starting point; without one it can settle into a nonmagnetic solution. In Gaussian and ORCA you give the *spin multiplicity*, the number of unpaired electrons plus one: 1 for an ordinary closed-shell molecule, 2 for a radical with one unpaired electron, 3 for O₂.

## What you ask the program to do

### SCF: the loop inside every calculation

The orbitals depend on the electrostatic potential the electrons feel, but that potential depends on where the electrons are, that is, on the orbitals. This chicken-and-egg problem is solved by iteration:

<figure class="review-workflow"><p>Guess a density → Build the potential → Solve for orbitals → New density → Repeat until nothing changes</p><figcaption>The self-consistent field (SCF) loop.</figcaption></figure>

When the density going in matches the density coming out, within a set threshold (`conv_thr` in Quantum ESPRESSO), the solution is *self-consistent*. This is the **self-consistent field (SCF)** procedure, and every calculation type below runs it at least once. Each new density is usually blended with earlier ones (*mixing*) to keep the loop stable. When an SCF calculation will not converge, the usual remedies are gentler mixing (a smaller `mixing_beta` in Quantum ESPRESSO), smearing for metals, and a better starting guess, such as an initial magnetization for magnetic systems.

### Single point

One SCF calculation at a fixed geometry, returning the energy and, if requested, the forces and stress. Most energy comparisons are single points on geometries prepared by another calculation.

### Relax (geometry optimization)

Compute the forces, move the atoms a step downhill, and repeat until the forces are close to zero. The result is the bottom of the nearest valley in the energy landscape, which is not necessarily the lowest valley overall. A variable-cell relaxation (`vc-relax` in Quantum ESPRESSO) also changes the size and shape of the cell, using the stress. Molecular programs usually follow an optimization with a frequency calculation: a true minimum has no imaginary vibrational frequencies.

### NEB: finding a barrier

The nudged elastic band (NEB) method finds the easiest path between a known reactant and a known product.<sup><a href="#ref-24" aria-label="Reference 24">[24]</a></sup> It places a chain of intermediate copies of the system, called *images*, between the two and connects neighboring images with springs. The chain is then relaxed until it lies along the lowest-energy path. The climbing-image variant pushes the highest image onto the transition state, and the barrier is that image's energy minus the reactant's.

Barriers matter because reaction rates depend on them exponentially. At room temperature, every 1.4 kcal/mol (0.06 eV) of barrier changes the rate tenfold, so the underestimated barriers of GGA functionals are not a small detail. Molecular programs can also search for a transition state directly from a good guess and confirm it with a frequency calculation: a transition state has exactly one imaginary frequency.

### AIMD: molecular dynamics driven by DFT

Ab initio molecular dynamics (AIMD) computes DFT forces at every timestep and moves the atoms with Newton's laws. Each step is a full SCF calculation, and steps are about 0.5–1 fs long, so a simulation of a few hundred atoms typically reaches tens of picoseconds. That is far shorter and smaller than classical or reactive force-field MD, but the chemistry comes directly from the electrons instead of a fitted model.

### Stress and the virial

The stress is a 3 × 3 table of numbers describing how the energy changes when the cell is stretched or sheared. The diagonal entries are the pressures along x, y, and z; the off-diagonal entries are shears. The closely related *virial* is essentially the stress multiplied by the cell volume. Stress is needed for variable-cell relaxations and for constant-pressure molecular dynamics, where a barostat adjusts the box to hold the pressure fixed. An isolated molecule has no cell to squeeze, so stress has no meaning for it.

Plane-wave programs compute the stress routinely (`tstress = .true.` in Quantum ESPRESSO). One caveat: at a fixed cutoff, the number of plane waves changes as the cell changes, which adds an artificial *Pulay stress*. Stress therefore usually needs a higher cutoff to converge than energies do.

### Labels: DFT data for machine-learning potentials

A machine-learning interatomic potential (MLIP) learns to predict energies and forces from examples (see [Learning the forces behind friction]({{ '/perspectives/machine-learning-potentials-tribology/' | relative_url }})). Each example is a structure together with its DFT energy, the forces on all its atoms, and, for periodic cells, the stress. That set of answers is the structure's *label*, and a training set is thousands of labeled structures. Without stress labels, a model cannot predict pressure, so it cannot run constant-pressure MD.

The most important rule for labels is consistency. Every label in a training set should use the same functional, dispersion correction, pseudopotentials, cutoff, smearing, and spin treatment. Even with the same functional, energies from different programs or pseudopotentials are offset by element-dependent amounts, so labels from different sources should not be mixed without care. This matters for pretrained models: large public datasets such as the Materials Project and OMat24 were computed with VASP at the PBE or PBE+U level,<sup><a href="#ref-25" aria-label="Reference 25">[25]</a> <a href="#ref-26" aria-label="Reference 26">[26]</a></sup> and labels from another program or setup will not match them exactly.

## The five programs

With the vocabulary in place, the differences between programs follow from the three choices.

| Program | Type | Basis | License |
|---|---|---|---|
| Gaussian | Molecular | Gaussian-type orbitals | Commercial |
| ORCA | Molecular | Gaussian-type orbitals | Free for academic use |
| Quantum ESPRESSO | Periodic | Plane waves + pseudopotentials | Open source (GPL) |
| VASP | Periodic | Plane waves + PAW | Commercial |
| CP2K | Periodic | Gaussians + plane waves | Open source (GPL) |
{: .wrap}

### Gaussian

Gaussian is a long-established, widely used molecular program.<sup><a href="#ref-27" aria-label="Reference 27">[27]</a></sup> It offers almost every functional, wavefunction methods, implicit solvation, and spectra (IR, Raman, UV-Vis, NMR), with a relatively simple input format. It has an option for periodic systems, but that option is rarely used and slow, and Gaussian is not a tool for metals. It needs a commercial license.

### ORCA

ORCA is a molecular program known for speed.<sup><a href="#ref-28" aria-label="Reference 28">[28]</a></sup> Approximations to the expensive integrals (RIJCOSX) make hybrid functionals fast, and it is the standard place to run DLPNO-CCSD(T). It is strong in molecular spectroscopy, including X-ray absorption. It has no periodic boundary conditions, so it cannot treat metals, surfaces, or bulk solids. ORCA is free for academic use; check its license terms before any industry-linked work.

### Quantum ESPRESSO

Quantum ESPRESSO (QE) is an open-source suite for periodic plane-wave calculations.<sup><a href="#ref-29" aria-label="Reference 29">[29]</a></sup> It is strong for metals, surfaces, and solids, with stress, magnetism, phonons, and, through XSpectra, X-ray absorption near-edge spectra (XANES) of solids and surfaces.<sup><a href="#ref-30" aria-label="Reference 30">[30]</a></sup> Its weaknesses follow from plane waves: isolated molecules are expensive because the vacuum costs as much as the atoms, and hybrid functionals are expensive.

### VASP

VASP occupies the same niche as QE and is one of the most widely used programs in computational materials science.<sup><a href="#ref-31" aria-label="Reference 31">[31]</a></sup> It uses plane waves with PAW. Large public datasets, including the Materials Project and OMat24, were computed with VASP, so many pretrained MLIPs inherit its settings. Its weaknesses are the same as QE's, and it requires a paid license for each research group.

### CP2K

CP2K uses a mixed scheme: orbitals are built from Gaussians, while the electron density is handled on a plane-wave grid.<sup><a href="#ref-32" aria-label="Reference 32">[32]</a></sup> The Gaussians tie the cost to the atoms, and the plane-wave grid makes the electrostatics of large periodic cells efficient. CP2K is the usual choice for large periodic systems of hundreds to about a thousand atoms, such as liquids and solid–liquid interfaces, and for AIMD. An auxiliary basis method (ADMM) also makes hybrid functionals much cheaper in large cells. It has fewer spectroscopy tools than the molecular programs and more parameters to tune: basis sets, pseudopotentials, and two grid cutoffs must be chosen consistently. Most CP2K calculations use only the Γ point, so its strength is large cells rather than small metallic ones.

## Which program for which job

| Task | Usually | Why |
|---|---|---|
| O–H bond dissociation energy of an antioxidant | ORCA or Gaussian: hybrid with dispersion, checked with DLPNO-CCSD(T) | Isolated molecules; hybrids are cheap; the radical has multiplicity 2 |
| Reaction barrier in a molecule | ORCA or Gaussian: hybrid with dispersion | Transition-state search and frequencies; GGA barriers are too low |
| Molecule adsorbed on an iron surface | QE or VASP: PBE-D3, spin-polarized, k-points, smearing | A metal surface needs a periodic slab and metallic settings |
| Iron oxide surface | QE or VASP with DFT+U | Localized d electrons |
| Liquid or lubricant–surface interface, AIMD | CP2K | Large periodic cells at reasonable cost |
| Training labels for an MLIP | QE, VASP, or CP2K, one fixed setup | Consistent energies, forces, and stress |
| X-ray absorption of a solid or surface | QE (XSpectra) | Periodic system |
| X-ray absorption of a molecule | ORCA | Molecular spectroscopy |
{: .wrap}

## Reading a method line

Papers compress all of these choices into one line. Two examples:

**ωB97X-D3/def2-TZVP//B3LYP-D3(BJ)/def2-SVP.** The double slash separates the energy from the geometry. The geometry (right side) was optimized with the B3LYP hybrid, D3 dispersion with Becke–Johnson damping, and the small def2-SVP basis. The energy (left side) was then computed at that geometry with the range-separated hybrid ωB97X, D3 dispersion, and the larger def2-TZVP basis.

**PBE-D3(BJ), PAW (PSLibrary), 60 Ry cutoff, 4 × 4 × 1 k-points, Marzari–Vanderbilt smearing of 0.02 Ry, spin-polarized.** A periodic calculation, probably of a metal surface: the PBE GGA with dispersion, PAW pseudopotentials, a plane-wave cutoff of 60 Ry (about 816 eV), a k-point grid that samples the surface with one point across the vacuum, cold smearing for the metal, and separate spin channels for magnetism.

Many of these terms appear directly in a Quantum ESPRESSO input. Here is the skeleton of a single-point calculation on a molecule in a box, such as ZDDP, with the atom lists left out:

```
&CONTROL
  calculation = 'scf'          ! single point; 'relax' optimizes the geometry
  tprnfor     = .true.         ! print the forces
/
&SYSTEM
  ibrav = 1, A = 22.0          ! cubic box, 22 Å on a side
  nat = 51, ntyp = 6           ! 51 atoms of 6 elements: Zn, P, S, O, C, H
  ecutwfc = 60                 ! plane-wave cutoff, Ry
  ecutrho = 480                ! density cutoff, 8 x ecutwfc for PAW
  assume_isolated = 'mt'       ! Martyna-Tuckerman: no interaction with copies
  vdw_corr = 'grimme-d3'       ! D3 dispersion correction
/
&ELECTRONS
  conv_thr = 1.0d-8            ! SCF convergence threshold, Ry
/
! one PAW pseudopotential file per element
ATOMIC_SPECIES
  ...
ATOMIC_POSITIONS angstrom
  ...
! a single k-point: the Gamma point
K_POINTS gamma
```

For an iron slab, the cell would follow the slab, `assume_isolated` would be dropped, spin and smearing would be added to `&SYSTEM`, and the k-points would become a grid:

```
  nspin = 2                          ! spin-polarized
  starting_magnetization(1) = 0.5    ! magnetic starting guess for species 1 (Fe)
  occupations = 'smearing'
  smearing = 'mv', degauss = 0.02    ! Marzari-Vanderbilt smearing, Ry

K_POINTS automatic
  4 4 1 0 0 0
```

## A one-line glossary

DFT
: Gets the energy from the electron density; the unknown part is the exchange-correlation functional.

Functional
: The specific approximation to the exchange-correlation energy.

GGA (PBE)
: Uses the density and its gradient. Cheap; standard for solids and metals; barriers too low.

meta-GGA (r²SCAN)
: Adds the kinetic energy density. Somewhat better than GGA at similar cost.

Hybrid (B3LYP, PBE0, ωB97X)
: Mixes in exact Hartree–Fock exchange. Better barriers; cheap in molecular codes, expensive with plane waves.

Dispersion correction (D3, D4)
: An added pairwise attraction for the van der Waals forces DFT misses.

DFT+U
: A penalty that keeps transition-metal d electrons localized, for oxides such as Fe₂O₃.

HF, MP2, CCSD(T)
: Wavefunction methods of increasing accuracy and cost; CCSD(T) is the gold standard.

DLPNO-CCSD(T)
: A local approximation that makes CCSD(T) affordable for molecules of about 50–150 atoms.

Basis set
: The building blocks used to write down orbitals.

Gaussian-type orbitals
: Bumps centered on atoms; cost scales with atoms; empty space is free.

Plane waves
: Waves filling the whole box; quality set by the cutoff energy; vacuum costs as much as atoms.

Cutoff energy
: The highest-energy (shortest) plane wave included, such as `ecutwfc` or `ENCUT`.

Pseudopotential (NC, US, PAW)
: Replaces the nucleus and core electrons with a smoother potential so plane waves stay affordable.

PBC
: Periodic boundary conditions: the cell repeats forever in all directions.

Supercell
: An enlarged cell that keeps defects or molecules away from their copies.

Slab
: A few atomic layers plus vacuum, used to model a surface.

Molecule in a box
: How periodic codes treat a molecule: a large cell with about 10 Å of vacuum.

Martyna–Tuckerman
: A correction that removes the electrostatic interaction of a molecule with its copies.

k-points
: Sample points for averaging over the phase of electron waves in a periodic cell.

Γ point
: The single k-point k = 0; enough for large cells and molecules.

Fermi level
: The energy up to which states are filled; sharp in metals.

Smearing
: Smooths occupations near the Fermi level so metals converge.

Spin polarization
: Treats up and down electrons separately; needed for radicals and magnetic metals.

Multiplicity
: Unpaired electrons plus one: 1 for closed-shell molecules, 2 for a radical.

SCF
: The iterative loop that makes the electrons consistent with their own potential.

Single point
: Energy and forces at a fixed geometry.

Relax
: Geometry optimization to the nearest minimum.

NEB
: A chain of images that finds the minimum-energy path and its barrier.

AIMD
: Molecular dynamics with DFT forces at every step.

Stress and virial
: How the energy changes when the cell is deformed; needed for constant-pressure MD.

Label
: The DFT energy, forces, and stress for one structure, used to train an MLIP.

## References

<ol class="references">
<li id="ref-1">Hohenberg, P., &amp; Kohn, W. (1964). <a href="https://doi.org/10.1103/PhysRev.136.B864">Inhomogeneous Electron Gas.</a> <em>Physical Review</em>, 136, B864–B871.</li>
<li id="ref-2">Kohn, W., &amp; Sham, L. J. (1965). <a href="https://doi.org/10.1103/PhysRev.140.A1133">Self-Consistent Equations Including Exchange and Correlation Effects.</a> <em>Physical Review</em>, 140, A1133–A1138.</li>
<li id="ref-3">Perdew, J. P., &amp; Schmidt, K. (2001). <a href="https://doi.org/10.1063/1.1390175">Jacob's ladder of density functional approximations for the exchange-correlation energy.</a> <em>AIP Conference Proceedings</em>, 577, 1–20.</li>
<li id="ref-4">Perdew, J. P., Burke, K., &amp; Ernzerhof, M. (1996). <a href="https://doi.org/10.1103/PhysRevLett.77.3865">Generalized Gradient Approximation Made Simple.</a> <em>Physical Review Letters</em>, 77, 3865–3868.</li>
<li id="ref-5">Furness, J. W., Kaplan, A. D., Ning, J., Perdew, J. P., &amp; Sun, J. (2020). <a href="https://doi.org/10.1021/acs.jpclett.0c02405">Accurate and Numerically Efficient r<sup>2</sup>SCAN Meta-Generalized Gradient Approximation.</a> <em>The Journal of Physical Chemistry Letters</em>, 11, 8208–8215.</li>
<li id="ref-6">Becke, A. D. (1993). <a href="https://doi.org/10.1063/1.464913">Density-functional thermochemistry. III. The role of exact exchange.</a> <em>The Journal of Chemical Physics</em>, 98, 5648–5652.</li>
<li id="ref-7">Adamo, C., &amp; Barone, V. (1999). <a href="https://doi.org/10.1063/1.478522">Toward reliable density functional methods without adjustable parameters: The PBE0 model.</a> <em>The Journal of Chemical Physics</em>, 110, 6158–6170.</li>
<li id="ref-8">Chai, J.-D., &amp; Head-Gordon, M. (2008). <a href="https://doi.org/10.1063/1.2834918">Systematic optimization of long-range corrected hybrid density functionals.</a> <em>The Journal of Chemical Physics</em>, 128, 084106.</li>
<li id="ref-9">Grimme, S., Antony, J., Ehrlich, S., &amp; Krieg, H. (2010). <a href="https://doi.org/10.1063/1.3382344">A consistent and accurate ab initio parametrization of density functional dispersion correction (DFT-D) for the 94 elements H–Pu.</a> <em>The Journal of Chemical Physics</em>, 132, 154104.</li>
<li id="ref-10">Grimme, S., Ehrlich, S., &amp; Goerigk, L. (2011). <a href="https://doi.org/10.1002/jcc.21759">Effect of the damping function in dispersion corrected density functional theory.</a> <em>Journal of Computational Chemistry</em>, 32, 1456–1465.</li>
<li id="ref-11">Caldeweyher, E., et al. (2019). <a href="https://doi.org/10.1063/1.5090222">A generally applicable atomic-charge dependent London dispersion correction.</a> <em>The Journal of Chemical Physics</em>, 150, 154122.</li>
<li id="ref-12">Dudarev, S. L., Botton, G. A., Savrasov, S. Y., Humphreys, C. J., &amp; Sutton, A. P. (1998). <a href="https://doi.org/10.1103/PhysRevB.57.1505">Electron-energy-loss spectra and the structural stability of nickel oxide: An LSDA+U study.</a> <em>Physical Review B</em>, 57, 1505–1509.</li>
<li id="ref-13">Raghavachari, K., Trucks, G. W., Pople, J. A., &amp; Head-Gordon, M. (1989). <a href="https://doi.org/10.1016/S0009-2614(89)87395-6">A fifth-order perturbation comparison of electron correlation theories.</a> <em>Chemical Physics Letters</em>, 157, 479–483.</li>
<li id="ref-14">Riplinger, C., &amp; Neese, F. (2013). <a href="https://doi.org/10.1063/1.4773581">An efficient and near linear scaling pair natural orbital based local coupled cluster method.</a> <em>The Journal of Chemical Physics</em>, 138, 034106.</li>
<li id="ref-15">Weigend, F., &amp; Ahlrichs, R. (2005). <a href="https://doi.org/10.1039/b508541a">Balanced basis sets of split valence, triple zeta valence and quadruple zeta valence quality for H to Rn.</a> <em>Physical Chemistry Chemical Physics</em>, 7, 3297–3305.</li>
<li id="ref-16">Hamann, D. R., Schlüter, M., &amp; Chiang, C. (1979). <a href="https://doi.org/10.1103/PhysRevLett.43.1494">Norm-Conserving Pseudopotentials.</a> <em>Physical Review Letters</em>, 43, 1494–1497.</li>
<li id="ref-17">Vanderbilt, D. (1990). <a href="https://doi.org/10.1103/PhysRevB.41.7892">Soft self-consistent pseudopotentials in a generalized eigenvalue formalism.</a> <em>Physical Review B</em>, 41, 7892–7895.</li>
<li id="ref-18">Blöchl, P. E. (1994). <a href="https://doi.org/10.1103/PhysRevB.50.17953">Projector augmented-wave method.</a> <em>Physical Review B</em>, 50, 17953–17979.</li>
<li id="ref-19">Dal Corso, A. (2014). <a href="https://doi.org/10.1016/j.commatsci.2014.07.043">Pseudopotentials periodic table: From H to Pu.</a> <em>Computational Materials Science</em>, 95, 337–350.</li>
<li id="ref-20">Prandini, G., Marrazzo, A., Castelli, I. E., Mounet, N., &amp; Marzari, N. (2018). <a href="https://doi.org/10.1038/s41524-018-0127-2">Precision and efficiency in solid-state pseudopotential calculations.</a> <em>npj Computational Materials</em>, 4, 72.</li>
<li id="ref-21">Martyna, G. J., &amp; Tuckerman, M. E. (1999). <a href="https://doi.org/10.1063/1.477923">A reciprocal space based method for treating long range interactions in ab initio and force-field-based calculations in clusters.</a> <em>The Journal of Chemical Physics</em>, 110, 2810–2821.</li>
<li id="ref-22">Monkhorst, H. J., &amp; Pack, J. D. (1976). <a href="https://doi.org/10.1103/PhysRevB.13.5188">Special points for Brillouin-zone integrations.</a> <em>Physical Review B</em>, 13, 5188–5192.</li>
<li id="ref-23">Marzari, N., Vanderbilt, D., De Vita, A., &amp; Payne, M. C. (1999). <a href="https://doi.org/10.1103/PhysRevLett.82.3296">Thermal Contraction and Disordering of the Al(110) Surface.</a> <em>Physical Review Letters</em>, 82, 3296–3299.</li>
<li id="ref-24">Henkelman, G., Uberuaga, B. P., &amp; Jónsson, H. (2000). <a href="https://doi.org/10.1063/1.1329672">A climbing image nudged elastic band method for finding saddle points and minimum energy paths.</a> <em>The Journal of Chemical Physics</em>, 113, 9901–9904.</li>
<li id="ref-25">Jain, A., et al. (2013). <a href="https://doi.org/10.1063/1.4812323">Commentary: The Materials Project: A materials genome approach to accelerating materials innovation.</a> <em>APL Materials</em>, 1, 011002.</li>
<li id="ref-26">Barroso-Luque, L., et al. (2024). <a href="https://arxiv.org/abs/2410.12771">Open Materials 2024 (OMat24) Inorganic Materials Dataset and Models.</a> arXiv:2410.12771.</li>
<li id="ref-27">Frisch, M. J., et al. (2016). <a href="https://gaussian.com/citation/">Gaussian 16.</a> Gaussian, Inc., Wallingford, CT.</li>
<li id="ref-28">Neese, F., Wennmohs, F., Becker, U., &amp; Riplinger, C. (2020). <a href="https://doi.org/10.1063/5.0004608">The ORCA quantum chemistry program package.</a> <em>The Journal of Chemical Physics</em>, 152, 224108.</li>
<li id="ref-29">Giannozzi, P., et al. (2009). <a href="https://doi.org/10.1088/0953-8984/21/39/395502">QUANTUM ESPRESSO: a modular and open-source software project for quantum simulations of materials.</a> <em>Journal of Physics: Condensed Matter</em>, 21, 395502.</li>
<li id="ref-30">Gougoussis, C., Calandra, M., Seitsonen, A. P., &amp; Mauri, F. (2009). <a href="https://doi.org/10.1103/PhysRevB.80.075102">First-principles calculations of x-ray absorption in a scheme based on ultrasoft pseudopotentials: From α-quartz to high-T<sub>c</sub> compounds.</a> <em>Physical Review B</em>, 80, 075102.</li>
<li id="ref-31">Kresse, G., &amp; Furthmüller, J. (1996). <a href="https://doi.org/10.1103/PhysRevB.54.11169">Efficient iterative schemes for ab initio total-energy calculations using a plane-wave basis set.</a> <em>Physical Review B</em>, 54, 11169–11186.</li>
<li id="ref-32">Kühne, T. D., et al. (2020). <a href="https://doi.org/10.1063/5.0007045">CP2K: An electronic structure and molecular dynamics software package – Quickstep: Efficient and accurate electronic structure calculations.</a> <em>The Journal of Chemical Physics</em>, 152, 194103.</li>
</ol>
