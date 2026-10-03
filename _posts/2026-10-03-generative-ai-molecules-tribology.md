---
layout: post
title: "Can generative AI help design better lubricant molecules?"
description: "From molecular generators to antioxidant discovery: what the methods offer, where tribology fits, and what still needs validation."
permalink: /perspectives/generative-ai-molecules-tribology/
date: 2026-10-03 08:00:00 -0700
category: Short reviews
topic: Generative molecular design
reading_time: 6
series_number: "01"
cover_title: "New molecules.<br>Better questions."
visual: generative
---

A lubricant has a demanding job: keep surfaces moving while its molecules face heat, oxygen, and mechanical stress. Choosing an additive therefore means asking several questions at once. Can it slow oxidation? Will it mix with the base oil? What happens to it during use?

Generative artificial intelligence offers a way to propose molecular candidates for that search. The useful outcome is a shortlist worth investigating, with enough evidence to explain why each molecule belongs on it.

> **The central idea:** use AI to suggest structures, then use chemistry, simulation, and experiments to decide whether those structures are useful.

<details class="essay-toc" open>
<summary>In this review</summary>
<ol>
<li><a href="#what-does-a-molecular-generator-learn">What does a molecular generator learn?</a></li>
<li><a href="#three-approaches-in-plain-language">Three approaches in plain language</a></li>
<li><a href="#where-tribology-enters-the-picture">Where tribology enters the picture</a></li>
<li><a href="#a-practical-antioxidant-design-loop">A practical antioxidant design loop</a></li>
<li><a href="#what-would-count-as-progress">What would count as progress?</a></li>
<li><a href="#references">References</a></li>
</ol>
</details>

## What does a molecular generator learn?

A molecule can be represented as a text string, a graph of atoms and bonds, or a set of positions in three-dimensional space. A generative model learns patterns in these representations and uses them to propose new structures. A separate property model or scoring function can guide that search toward a desired behavior. These are distinct tasks: proposing a molecule does not establish its performance.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a> <a href="#ref-4" aria-label="Reference 4">[4]</a></sup>

An early demonstration by Gómez-Bombarelli and colleagues encoded molecules into a continuous numerical space. Moving through that space made it possible to explore structures and optimize predicted properties. The demonstration concerned molecular design broadly; it did not establish a lubricant formulation method.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>

## Three approaches in plain language

**Variational autoencoders (VAEs)** compress a molecular representation into a smaller set of numbers and decode those numbers back into a structure. They provide a navigable space for exploring related candidates, although decoding and chemical validity need attention.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup>

**Generative adversarial networks (GANs)** train a generator alongside a discriminator that learns to distinguish generated examples from training examples. MolGAN applied this idea to small molecular graphs and combined it with a property-directed objective. One reported limitation was mode collapse: repeatedly producing a narrow selection of structures.<sup><a href="#ref-2" aria-label="Reference 2">[2]</a></sup>

**Diffusion models** learn to recover molecular structure from noise. Hoogeboom and colleagues demonstrated a model that jointly generates atom types and three-dimensional coordinates while respecting geometric symmetries. In practical terms, changing the orientation of a molecule should not arbitrarily change how the model treats its chemistry.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup>

These approaches offer different ways to search. Their value for a particular lubricant problem depends on the available data, the molecular representation, and the quality of the objective used to rank candidates.

## Where tribology enters the picture

Tribology studies friction, wear, and lubrication. My connection to it is antioxidant chemistry: understanding how molecular structure affects the reactions associated with lubricant degradation. Our reactive molecular dynamics work examines substituent-dependent phenoxyl radical stability, while our earlier work tracks thermo-oxidation products and pathways in modified lignin structures.<sup><a href="#ref-5" aria-label="Reference 5">[5]</a> <a href="#ref-6" aria-label="Reference 6">[6]</a></sup>

This suggests a specific design question: **could a generator propose useful variations of an antioxidant structure, guided by reaction-level evidence?** That is a research direction, rather than a result established by the generative-model papers cited here.

A candidate’s radical chemistry would be one part of the decision. I would also ask whether it is compatible with the intended base oil, whether it remains useful at the operating temperature, and whether it can be made and tested. An oxidation-related score alone would not justify a claim about lower friction or wear. Those outcomes require their own measurements.

## A practical antioxidant design loop

For this problem, I would organize the work around the following loop:

1. **Define the use case.** Specify the lubricant environment, the intended additive function, and the performance measures. Keep antioxidant activity distinct from friction reduction.
2. **Curate comparable data.** Record structures alongside test conditions and units. Separate measured properties from simulation outputs and model predictions so the generator’s scoring model has a clear target.
3. **Generate candidates with constraints.** Start with a chemically meaningful family, such as variations around an antioxidant scaffold. Remove duplicates and invalid structures before using expensive calculations.
4. **Check the chemistry.** Examine shortlisted molecules with appropriate quantum calculations and validated reactive simulations. Include likely reaction products when deciding what a promising structure actually means.
5. **Test the formulation and learn.** Evaluate selected compounds in the relevant lubricant and operating conditions. Feed those results back into the next round of candidate selection.

<figure class="review-workflow"><p>Define → Generate → Screen → Simulate → Test → Refine</p><figcaption>A proposed workflow for lubricant-additive research; each stage supplies evidence for the next.</figcaption></figure>

The reaction-tracking approach in our lignin study is relevant to the fourth step: it links evolving species and bond changes to likely pathways. Applying that kind of analysis to new additive candidates could help explain *why* one candidate deserves further study.<sup><a href="#ref-6" aria-label="Reference 6">[6]</a></sup>

## What would count as progress?

Molecular-generation benchmarks such as GuacaMol assess novelty, distribution learning, and goal-directed optimization. They also make comparison with simpler methods possible. These are useful checks on a generator, but they do not establish performance in a lubricant.<sup><a href="#ref-4" aria-label="Reference 4">[4]</a></sup>

For a tribology study, I would compare the proposed method with screening an existing compound library or systematically modifying a known scaffold. I would report the number of valid and distinct candidates, the uncertainty in predicted properties, and how many candidates survive chemical and experimental evaluation. Keeping related molecular families out of training during evaluation would provide a more demanding test of generalization.

The most interesting success would be a molecule that performs usefully under specified conditions, together with an explanation of its chemistry. Generative AI can expand the set of ideas we examine; mechanistic understanding makes those ideas worth pursuing.

## References

<ol class="references">
<li id="ref-1">Gómez-Bombarelli, R., et al. (2018). <a href="https://doi.org/10.1021/acscentsci.7b00572">Automatic Chemical Design Using a Data-Driven Continuous Representation of Molecules.</a> <em>ACS Central Science</em>, 4(2), 268–276.</li>
<li id="ref-2">De Cao, N., &amp; Kipf, T. (2018). <a href="https://arxiv.org/abs/1805.11973">MolGAN: An implicit generative model for small molecular graphs.</a> ICML Workshop on Theoretical Foundations and Applications of Deep Generative Models; arXiv:1805.11973.</li>
<li id="ref-3">Hoogeboom, E., Satorras, V. G., Vignac, C., &amp; Welling, M. (2022). <a href="https://proceedings.mlr.press/v162/hoogeboom22a.html">Equivariant Diffusion for Molecule Generation in 3D.</a> <em>Proceedings of the 39th International Conference on Machine Learning</em>, PMLR 162, 8867–8887.</li>
<li id="ref-4">Brown, N., Fiscato, M., Segler, M. H. S., &amp; Vaucher, A. C. (2019). <a href="https://doi.org/10.1021/acs.jcim.8b00839">GuacaMol: Benchmarking Models for de Novo Molecular Design.</a> <em>Journal of Chemical Information and Modeling</em>, 59(3), 1096–1108.</li>
<li id="ref-5">Ahmed, S., Eder, S. J., Iqbal, M. M., Dörr, N., &amp; Martini, A. (2026). <a href="https://doi.org/10.1021/acsomega.6c00592">Reactive MD Screening of Antioxidants for Substituent-Dependent Phenoxyl Radical Stability.</a> <em>ACS Omega</em>, 11(10), 16886–16894.</li>
<li id="ref-6">Ahmed, S., Eder, S. J., Dörr, N., &amp; Martini, A. (2024). <a href="https://doi.org/10.1021/acs.jpca.4c00964">Tracking Thermo-Oxidation Reaction Products and Pathways of Modified Lignin Structures from Reactive Molecular Dynamics Simulations.</a> <em>The Journal of Physical Chemistry A</em>, 128(27), 5398–5407.</li>
</ol>
