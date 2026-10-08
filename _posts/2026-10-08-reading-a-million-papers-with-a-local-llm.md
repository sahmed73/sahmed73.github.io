---
layout: post
title: "Reading a million papers with a local LLM"
description: "How I used Llama 3 on university GPUs to screen 1.16 million papers for lubricant antioxidants, and what the context window and the choice of model changed along the way."
permalink: /perspectives/reading-a-million-papers-with-a-local-llm/
date: 2026-10-08 00:00:00 -0700
category: Project notes
topic: LLM literature mining
reading_time: 8
---

For my research on antioxidant additives I wanted a list of every antioxidant molecule that the lubricant literature reports. A broad search for lubricants, oils, oxidation, and antioxidants returns more than a million papers, far too many to read, and most of them are about something else: food chemistry, biology, fuels, polymers.

So I built a pipeline in which a large language model does the first reading. It runs entirely on open-weight models served by Ollama on our university GPU nodes, and the code is on GitHub as [llm-literature-mining](https://github.com/sahmed73/llm-literature-mining). This post describes how it works, what the numbers look like, and two practical issues that shaped the design: the model's context window and the choice of model.

> **The central idea:** use a small local model as a first reader that only gives structured answers, and check its chemistry against a database rather than trusting it.

<details class="essay-toc" open>
<summary>In this post</summary>
<ol>
<li><a href="#why-a-local-model">Why a local model</a></li>
<li><a href="#from-15-million-records-to-3944-papers">From 1.5 million records to 3,944 papers</a></li>
<li><a href="#extracting-compounds-without-inventing-them">Extracting compounds without inventing them</a></li>
<li><a href="#chunking-for-an-8k-token-window">Chunking for an 8K-token window</a></li>
<li><a href="#llama-3-8b-70b-or-qwen-3">Llama 3 8B, 70B, or Qwen 3?</a></li>
<li><a href="#what-i-would-do-differently">What I would do differently</a></li>
<li><a href="#references">References</a></li>
</ol>
</details>

## Why a local model

Scoring a million abstracts through a commercial API would cost money for every run, and I expected to rerun the pipeline many times while adjusting prompts. A local model costs nothing per call once it is downloaded, keeps the data on our own machines, and can run for days as a batch job. Llama 3 8B fits in about 6 GB of GPU memory, so one 48 GB GPU can serve several copies of it at once.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup> Ollama starts the model inside a SLURM job and exposes a simple HTTP interface, which the pipeline calls like any other web service.

## From 1.5 million records to 3,944 papers

The first step queries seven literature databases (OpenAlex, Semantic Scholar, Crossref, PubMed, Europe PMC, CORE, and Lens) with 27 search phrasings.<sup><a href="#ref-2" aria-label="Reference 2">[2]</a></sup> That returned 1,535,419 records. After removing duplicates by DOI and title, 1,156,902 unique papers remained, and only 392,289 of them had an abstract.

The model then scored every paper from 0 to 10 for relevance to antioxidant additives for lubricants. The prompt gives a rubric with examples for each band (10 for papers directly about lubricant antioxidants, 4–5 for antioxidants in food or polymers, 0–1 for unrelated chemistry) and asks for a JSON answer containing only a score and a one-sentence reason. Papers without an abstract were scored from the title alone.

<figure class="essay-figure">
<img src="{{ '/assets/blog/llm-relevance-scores.png' | relative_url }}" alt="Bar chart of relevance scores from 0 to 10 for 1,156,902 papers on a log scale. Scores 0 to 2 contain over a million papers; scores 6 to 10 contain 3,944." width="3500" height="2250" loading="lazy">
<figcaption>Relevance scores for all 1,156,902 papers (log scale). Green bars (score ≥ 6, 3,944 papers) went on to compound extraction.</figcaption>
</figure>

Over 99% of the papers scored 0–2, which is what this step is for: it reduced the reading list to 3,944 papers. The distribution also shows something about how the model uses a rubric. Scores 6 and 8 each hold about 1,700 papers, while 7 holds 44 and 5 holds 17. The model gravitates to particular values instead of spreading papers smoothly across the scale, so I treat the score as a coarse label (relevant or not) rather than a fine measurement.

## Extracting compounds without inventing them

For the relevant papers the model read either the full text, when I had the PDF (3,338 documents), or the abstract (2,186 more). It was asked to list every specific antioxidant named in the text as JSON, with the compound name exactly as written, its role, and a short quoted phrase as evidence.

The prompt is strict about what not to do. It asks for a SMILES string or formula only when one is written in the text, never inferred from a name, and excludes food and biological antioxidants and generic classes such as "phenolic antioxidants" with no specific molecule. A small exclusion list removes common false positives such as vitamin C and vitamin E.

The model returned 22,230 compound mentions from 4,180 documents, covering 9,427 distinct names. Names are not structures, so the next step looks each one up in PubChem.<sup><a href="#ref-3" aria-label="Reference 3">[3]</a></sup> A final RDKit step classifies the structures by substructure: an aromatic OH for phenolic antioxidants and an aromatic N–H for aminic ones, keeping only molecules made of carbon, hydrogen, nitrogen, and oxygen.<sup><a href="#ref-4" aria-label="Reference 4">[4]</a></sup> That leaves 556 unique structures, of which 172 are phenolic and 34 are aminic antioxidants.

The final set is much smaller than the number of mentions, and that is intended. Every molecule in it traces back to a sentence in a paper and to a PubChem record, which matters more to me than coverage.

## Chunking for an 8K-token window

A model can only read as much text at once as its context window allows, and the prompt and the answer have to fit in the same window. Llama 3 has an 8,192-token window, roughly 30,000 characters.<sup><a href="#ref-1" aria-label="Reference 1">[1]</a></sup> In this collection the median full-text paper is about 29,000 characters long (around 7,400 tokens) and one in ten is longer than 56,000 characters. Only 37% of the papers would fit in a single call with room left for the prompt and the answer.

The extraction step therefore splits each paper into chunks of at most 10,000 characters (about 2,500 tokens), cut at paragraph or sentence boundaries, with 800 characters of overlap so that a compound named across a boundary appears whole in at least one chunk. Each chunk gets its own call, and the compounds from all chunks of a paper are merged by name. A median paper becomes four chunks: four calls instead of one, and the model never sees the whole paper.

Newer models make this optional. Qwen 2.5 and Qwen 3 accept 32K tokens or more, and Llama 3.1 and later accept 128K.<sup><a href="#ref-5" aria-label="Reference 5">[5]</a></sup> With a 32K window, 99% of these papers fit in one call, and the pipeline supports that by raising the chunk size and the requested context length. Longer inputs are not free, though. They take more GPU memory and longer per call, and models tend to use information in the middle of a long input less reliably than information near its start or end.<sup><a href="#ref-6" aria-label="Reference 6">[6]</a></sup> Whether whole-paper extraction finds more compounds than chunked extraction is something to measure on a sample, not to assume.

## Llama 3 8B, 70B, or Qwen 3?

The full runs used Llama 3 8B. To see how much the model matters, I ran the same two pipeline steps with three models on a small test: two abstracts to score (one of my own antioxidant papers and an invented food-science abstract) and one paragraph that names three lubricant antioxidants and vitamin E. Scores are listed as antioxidant paper / food-science paper.

| Model | Scores | Compounds extracted | GPU memory |
|---|---|---|---|
| Llama 3 8B | 9 / 2 | the 3 antioxidants | 6 GB |
| Llama 3 70B | 10 / 4 | the 3 antioxidants | 41 GB |
| Qwen 3 30B-A3B | 9 / 2 | the 3 antioxidants, plus BHT and PANA as separate entries | 21 GB |

All three separated the relevant paper from the irrelevant one and ignored vitamin E. This is a quick check, not a benchmark: three inputs cannot show which model is more accurate over thousands of papers. It does show that the 70B model, nine times larger, gave no visible advantage on this task, while the 8B model was several times faster.

Qwen 3 needed two changes before it worked at all. It is a reasoning model, and by default it writes out its reasoning before answering.<sup><a href="#ref-5" aria-label="Reference 5">[5]</a></sup> The scoring step allows only 150 tokens for the answer, so the reasoning used up the budget and no score came back. Turning thinking off was not enough on its own, because the model still wrote a short explanation before the JSON. What fixed it was Ollama's structured-output mode, which constrains the answer to a JSON schema. Both are now options in the pipeline. A newer model is not automatically a drop-in replacement, and a five-minute test on a few known examples catches this kind of problem before a multi-day run.

## What I would do differently

The weakest part of the current pipeline is that I cannot yet report its accuracy. The next step is a hand-labeled sample of a few hundred papers, which would give the precision and recall of the relevance score and of the extraction, and would turn the model comparison above into a real one. I would also record the model and prompt version next to every output, so that results from different runs can be compared without guessing.

The code, a demo that runs both LLM steps with any Ollama model, and the documentation are on [GitHub](https://github.com/sahmed73/llm-literature-mining).

## References

<ol class="references">
<li id="ref-1">Grattafiori, A., et al. (2024). <a href="https://arxiv.org/abs/2407.21783">The Llama 3 Herd of Models.</a> arXiv:2407.21783.</li>
<li id="ref-2">Priem, J., Piwowar, H., &amp; Orr, R. (2022). <a href="https://arxiv.org/abs/2205.01833">OpenAlex: A fully-open index of scholarly works, authors, venues, institutions, and concepts.</a> arXiv:2205.01833.</li>
<li id="ref-3">Kim, S., et al. (2023). <a href="https://doi.org/10.1093/nar/gkac956">PubChem 2023 update.</a> <em>Nucleic Acids Research</em>, 51(D1), D1373–D1380.</li>
<li id="ref-4">RDKit: Open-source cheminformatics. <a href="https://www.rdkit.org">https://www.rdkit.org</a></li>
<li id="ref-5">Yang, A., et al. (2025). <a href="https://arxiv.org/abs/2505.09388">Qwen3 Technical Report.</a> arXiv:2505.09388.</li>
<li id="ref-6">Liu, N. F., et al. (2024). <a href="https://doi.org/10.1162/tacl_a_00638">Lost in the Middle: How Language Models Use Long Contexts.</a> <em>Transactions of the Association for Computational Linguistics</em>, 12, 157–173.</li>
</ol>
