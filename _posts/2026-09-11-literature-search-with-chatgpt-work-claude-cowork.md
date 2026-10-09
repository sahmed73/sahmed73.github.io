---
layout: post
title: "Literature search with ChatGPT Work and Claude Cowork"
description: "How to use ChatGPT Work or Claude Cowork to find and review papers, with a worked example on what controls the friction of MoS₂."
permalink: /perspectives/literature-search-with-chatgpt-work-claude-cowork/
date: 2026-09-11 08:00:00 -0700
category: Guides
topic: AI for literature review
reading_time: 7
---

This is a practical guide to using **ChatGPT Work** or **Claude Cowork** to find and review literature, followed by a worked example: a first-pass review of what controls the friction of molybdenum disulfide (MoS₂).

> **The central idea:** the real difference isn't power, it's memory. A chat window forgets; a folder accumulates. In Work or Cowork, your review becomes files that persist, so each run builds on the last.

<details class="essay-toc" open>
<summary>In this post</summary>
<ol>
<li><a href="#what-you-need">What you need</a></li>
<li><a href="#what-work-and-cowork-are">What Work and Cowork are</a></li>
<li><a href="#download-the-desktop-app">Download the desktop app</a></li>
<li><a href="#the-workflow">The workflow</a></li>
<li><a href="#a-worked-example">A worked example</a></li>
</ol>
</details>

## What you need

- A **ChatGPT** Plus or **Claude** Pro subscription.
- The desktop app, not just the browser tab. Work and Cowork need access to a real folder on your machine.
- A reference manager for downloading papers: **Paperpile** (which I recommend), Zotero, or whatever you already use.
- Your institution's network or VPN, for full-text access to papers. For me, that is the UC Merced network.

## What Work and Cowork are

There are three ways to use ChatGPT or Claude, in increasing order of the access you give them:

| Mode | What it does | Use for |
|---|---|---|
| Chat | A browser tab. One question, one answer. You copy results out by hand. | Quick lookups, explaining a method |
| **Work / Cowork** | Runs inside a project folder. Reads and writes files. Takes many steps on its own. | **Reading and organizing papers** |
| CLI (Codex / Claude Code) | Runs in the terminal. Runs code, plots, and jobs, with full machine and cluster access. | Analysis pipelines, HPC |
{: .wrap}

The command-line tools are the most capable of the three. Work and Cowork are the right starting point: no setup, no terminal, and they already do the thing that matters for literature work.

**The real difference isn't power; it's memory.** A chat window forgets. A folder accumulates. In Work or Cowork your review becomes actual files that persist between sessions: you correct them, add to them, and come back next week to a review that is already half built. That is the reason to use this mode instead of a chat tab.

## Download the desktop app

For Work or Cowork, download the desktop app. When you give it permission, the desktop app can work with local files and folders on your computer, which is especially useful for keeping papers, notes, and project files together during a literature review.

- **ChatGPT Desktop:** [chatgpt.com/download](https://chatgpt.com/download/)
- **Claude Desktop:** [claude.com/download](https://claude.com/download)

<figure class="essay-figure pair">
<div class="pair-row">
<img src="{{ '/assets/blog/lit-chatgpt-desktop.png' | relative_url }}" alt="ChatGPT desktop app with Chat and Work tabs at the top of the window." width="1361" height="957" loading="lazy">
<img src="{{ '/assets/blog/lit-claude-desktop.png' | relative_url }}" alt="Claude desktop app with Chat and Cowork options in the message box." width="1207" height="957" loading="lazy">
</div>
<figcaption>The ChatGPT (left) and Claude (right) desktop apps. Work and Cowork are selected next to Chat.</figcaption>
</figure>

## The workflow

<figure class="essay-figure">
<img src="{{ '/assets/blog/lit-workflow.jpg' | relative_url }}" alt="Eight illustrated steps: create a folder, add project files, open ChatGPT or Claude with the folder, choose a model, write a prompt, let the AI search and read, verify the results, and iterate." width="1774" height="887" loading="lazy">
<figcaption>The eight steps of the workflow.</figcaption>
</figure>

1. **Create a project folder.** Use one dedicated folder for each new literature search. It can be empty at first.
2. **Add any useful project context.** If you already have reference papers, notes, reports, slides, or other project information, put them in the folder. Starting from scratch is completely fine: provide the necessary context in your prompt, and the folder will build up over time.
3. **Open ChatGPT Work or Claude Cowork and add the project folder.** Give it access to the folder so it can read the existing files and save new outputs there as you work.
4. **Choose the right model.** For ChatGPT, use **GPT 6 Sol (Extra High or above)** or **Astra (Medium or above)**. For Claude, use **Opus 5.5 (Max)**. These models generally reason better, hallucinate less, and can work with large amounts of context. They can also use up your plan limits much faster.
5. **Write a detailed prompt.** Clearly describe your research question, background, scope, keywords, and inclusion and exclusion criteria. Also say what you want it to produce, such as a table of relevant papers, key findings, research gaps, citations, or a `.bib` file. The clearer the prompt, the better the search. Asking the AI to download papers may not work reliably, because many publisher websites block AI access.
6. **Let it run.** It searches, reads, and writes the files you asked for without you approving each step.
7. **Verify.** Open two or three of the cited papers and check that the claims are really there.
8. **Iterate and narrow the scope.** The first run may return many potentially relevant papers. Review the results, refine your question, keywords, or scope, and run it again. By the second run, Work or Cowork has more project context from the papers, notes, and outputs already collected, which helps it produce a more focused result. Download the paper PDFs into the project folder for better context on the second run.

> **Usage limits:** ChatGPT Work and Codex (the ChatGPT CLI) count toward your 5-hour and weekly usage limits, while regular chat does not. Claude Chat, Cowork, and Claude Code all share the same usage limit. Model names and limits are as of September 2026.

## A worked example

### The question

> What controls MoS₂'s friction performance?

### The folder and the model

One folder, `MoS2_lit`, empty or with existing files, opened in ChatGPT Work with access granted. First, choose **Work**:

<figure class="essay-figure">
<img src="{{ '/assets/blog/lit-chatgpt-work.png' | relative_url }}" alt="ChatGPT Work tab asking what we should work on, with a Choose project button under the message box and the 6 Astra model selected." width="817" height="712" loading="lazy">
</figure>

Then choose or create a project with the folder:

<figure class="essay-figure">
<img src="{{ '/assets/blog/lit-create-project.png' | relative_url }}" alt="Create project dialog with the project name MoS2_lit and the MoS2_lit folder added as a source folder." width="852" height="723" loading="lazy">
</figure>

**Select the model.** As of September 2026, Astra is excellent at finding papers, but it can burn through your entire usage limit in about 20 minutes. Be careful with it. The run can stop partway when you hit the limit, leaving you to wait up to 5 hours before you can say "please continue." For a safer run, use Sol.

### The prompt

```
I am doing a literature review for my research on MoS2 as a solid
lubricant. I want to know what actually controls its friction performance:
which factors govern how well it reduces friction, how strong the evidence
is for each, and where the literature disagrees.

In scope: papers from the last 20 years, both computational and
experimental, reporting friction or wear data for MoS2 in any form
(coating, powder, oil additive), and mechanism studies (AFM, MD,
spectroscopy).

Out of scope: anything outside tribology, including MoS2 for catalysis,
electronics, batteries, photodetectors.

Group the papers by which factor they show controls friction (e.g. number
of layers, environment/humidity, contact alignment, load, particle size).

For each paper give one table row:
Citation (with DOI) | Form of MoS2 | Method Type (Simulation/Experiment/Both) | Method | Factor studied | Key finding | Full text or abstract only

Flag any place where two papers disagree.

Verify every DOI/citation and never invent missing information.

Put everything in one file, review.md, starting with a short summary:
which factors have strong evidence, which are thin, and what is still
disputed. Also create a bibtex (ref.bib) file.

Please also report basic statistics, including the total number of
relevant papers found, how many were reviewed using full-text access, and
how many were assessed from the abstract only. Always read the full paper
when it is accessible; only fall back to the abstract when full text is
unavailable. Save your findings incrementally in the project folder as you
work, rather than waiting until the end, so that if the run is interrupted
by a usage limit or other cutoff, the completed work is preserved and can
be continued later without starting over. At the end, consolidate and
update the final review.md and ref.bib files so they follow the requested
structure and contain the complete, cleaned, verified results.
```

### What comes back

The model worked continuously for about **25 minutes**; higher-capability models use more compute and take longer. It found **60 papers** in total, read the full text of **34**, and used only the abstracts of the remaining **26**.

It produced two files, `review.md` and `ref.bib`. Here is a glimpse of the table in `review.md`. D1 and D2 refer to entries in the review's list of disagreements.

<div class="table-scroll" markdown="1">

| Citation (with DOI) | Form of MoS₂ | Method type | Method | Factor studied | Key finding | Full text or abstract only |
|---|---|---|---|---|---|---|
| **P01 — Khare & Burris (2013).** The Effects of Environmental Water and Oxygen on the Temperature-Dependent Friction of Sputtered Molybdenum Disulfide. *Tribology Letters* 52, 485–493. DOI: [10.1007/s11249-013-0233-8](https://doi.org/10.1007/s11249-013-0233-8) | Sputtered MoS₂ coating | Experiment | Sliding-friction tests with independently varied water, oxygen, and temperature | Humidity × oxygen × temperature; preparation and sliding history | Friction had a temperature minimum at approximately 100–250 °C depending on preparation/history. Below the transition, water dominated; at higher temperature oxygen-related degradation mattered. Direct environmental controls support separate mechanisms, rather than a universal temperature threshold. D1. | **Full text** ([source](https://research.me.udel.edu/~dlburris/papers/JA34.pdf)) |
| **P02 — Khare & Burris (2014).** Surface and Subsurface Contributions of Oxidation and Moisture to Room Temperature Friction of Molybdenum Disulfide. *Tribology Letters* 53, 329–336. DOI: [10.1007/s11249-013-0273-0](https://doi.org/10.1007/s11249-013-0273-0) | MoS₂ coating | Experiment | Parametric water/oxygen exposure and friction measurements; surface/subsurface environmental-response analysis | Surface oxidation versus physically bound water; water diffusion | Separates environmental exposure, oxidation, and water-storage effects to explain friction transients and hysteresis. Supports considering surface and subsurface water rather than attributing every humidity response to oxidation. Detailed partitioning cannot be independently assessed from the abstract. D1. | **Full text** ([source](https://link.springer.com/article/10.1007/s11249-013-0273-0)) |
| **P03 — Levita & Righi (2017).** Effects of Water Intercalation and Tribochemistry on MoS₂ Lubricity: An Ab Initio Molecular Dynamics Investigation. *ChemPhysChem* 18, 1475–1480. DOI: [10.1002/cphc.201601143](https://doi.org/10.1002/cphc.201601143) | Ideal and defective MoS₂ layers with water | Simulation | Ab initio molecular dynamics with intercalated water, load, and exposed edges | Water intercalation; defects; edge termination | Water impeded layer motion without requiring oxidation. With load and open edges, water left the interlayer gap and adsorbed at edges, intact or dissociated. Mechanism evidence is atomistic and depends on the modeled confinement and boundary conditions. D1, D2. | **Full text** ([source](https://iris.unimore.it/bitstream/11380/1152962/2/cphc.201601143.pdf)) |
{: .wrap}

</div>

### Download all the papers

Downloading all the papers into the project folder gives the model immediate context when you iterate or ask more questions. Paperpile can download them in bulk:

- In Paperpile, click **Add** at the top left and upload the `ref.bib` file.
- Once the articles are added, select them all and click the three dots at the top right. Click **Auto update** first to fix broken BibTeX entries, then **Find PDFs online**. The shortcut is to select all, press `U`, then `D`.
- Some papers need manual intervention because they are blocked by a captcha. Click on each and follow the process, which takes a few clicks. You must be on your institution's network or VPN.
- When everything has downloaded, click the three dots again, choose **Download files as ZIP**, and put the files into the project folder.

<figure class="essay-figure pair">
<div class="pair-row">
<img src="{{ '/assets/blog/lit-paperpile-add.png' | relative_url }}" alt="Paperpile Add menu with options to upload files, create new, search online, paste, import from other programs, and create a shared library." width="596" height="541" loading="lazy">
<img src="{{ '/assets/blog/lit-paperpile-more.png' | relative_url }}" alt="Paperpile More menu with Auto update, Find PDFs online, Make a copy, Export, and Download files as ZIP." width="688" height="379" loading="lazy">
</div>
<figcaption>Paperpile's Add menu (left) for uploading <code>ref.bib</code>, and the More menu (right) for updating entries, finding PDFs, and downloading them as a ZIP file.</figcaption>
</figure>

### The second run

Follow up with whatever you want, for example:

- *"What's missing from this list that you'd expect to find?"*
- *"Re-group these by method instead of by factor."*
- *"Please find more similar papers."*

Then tighten whichever scope line let irrelevant papers in, and run it again.
