---
layout: page
title: ML playground
nav_title: Playground
permalink: /ml-playground/
description: "Machine-learning challenges I take on beyond my research: identifying molecules from mass spectra (CASMI 2026), cats versus dogs, flu-shot prediction, and handwritten digits."
---

A place for the fun side of learning machine learning: small experiments, familiar datasets, and competition problems outside my research. They let me explore chemistry, computer vision, tabular data, and model evaluation.

<section class="nox-invite" aria-labelledby="nox-invite-title">
  <img src="{{ '/assets/pets/nox-idle.png' | relative_url }}" alt="Nox, a little moon fox with big ears and a gold-tipped tail" width="192" height="208">
  <div>
    <h2 id="nox-invite-title">Meet Nox</h2>
    <p>A tiny moon fox with a very important request: head scratches.</p>
    <button type="button" id="nox-open" class="nox-open" aria-haspopup="dialog" aria-controls="nox-dialog">Open Nox</button>
  </div>
</section>

<dialog id="nox-dialog" class="nox-dialog" aria-labelledby="nox-title" aria-describedby="nox-message" data-sprites="{{ '/assets/pets/nox-sprites.webp' | relative_url }}">
  <button type="button" id="nox-close" class="nox-close" aria-label="Close Nox">×</button>
  <h2 id="nox-title">Hi, I'm Nox.</h2>
  <p id="nox-message" class="nox-message" role="status" aria-live="polite" aria-atomic="true">Pet me, please!</p>
  <button type="button" id="nox-pet" class="nox-pet" aria-label="Give Nox a head scratch">
    <span id="nox-sprite" class="nox-sprite" aria-hidden="true" style="background-image: url('{{ '/assets/pets/nox-idle.png' | relative_url }}')"></span>
  </button>
  <p class="nox-hint">Click or tap Nox to give a head scratch.</p>
  <p id="nox-count" class="nox-count">A little kindness goes a long way.</p>
</dialog>
<noscript><p>Enable JavaScript to play with Nox.</p></noscript>
<script src="{{ '/assets/nox-pet.js' | relative_url }}" defer></script>

## CASMI 2026: identifying molecules from mass spectra

**The challenge.** In Enveda's CASMI 2026 competition on Kaggle, each unknown molecule comes only as its tandem mass spectra, the pattern of fragments it breaks into inside a mass spectrometer. The task is to name the molecule: return up to 25 candidate structures, ranked. Scoring uses mean reciprocal rank (MRR@25) on a hidden test set, so a correct answer ranked first counts fully, ranked second counts half, and so on.

**What I built.** A spectrum-to-structure pipeline written from scratch. It works out the molecule's mass from the measured spectrum, pulls candidate structures of matching mass from large public chemical databases (COCONUT, PubChemLite, and PubChem), and ranks those candidates. For ranking, I trained my own transformer that reads spectrum peaks and predicts a molecular fingerprint, combined it with the pretrained MIST model, and added GLACIER, which predicts each candidate's spectrum so it can be compared with the measured one. Training and evaluation ran on the UC Merced GPU cluster through Slurm, and the final pipeline runs as an offline Kaggle notebook.

**Result.** My first submission scored a public MRR@25 of **0.244** on Kaggle's hidden test set. That is well below what the same pipeline scored on my own validation data, a useful lesson that the hidden test molecules and spectra differ from my validation set more than I assumed. Closing that gap is my next step; the competition is still running.

**What I explored.** Spectrum-to-structure machine learning, retrieving candidates versus generating new structures, combining pretrained and self-trained models, and why validation data must match the real test conditions.

[Competition page](https://www.kaggle.com/competitions/enveda-CASMI26-molecule-id-mass-spectra)

The other results below come from saved notebook outputs on local evaluation splits, not from competition leaderboards.

## Cats vs. dogs

**The challenge.** Tell whether a photograph shows a cat or a dog, using the Kaggle Dogs vs. Cats dataset.

**What I built.** A TensorFlow/Keras convolutional neural network with three convolution-and-pooling stages, a dense layer, and dropout. I resized images to 128 × 128 pixels, normalized their values, and used an 80/20 stratified train/test split. I also explored image filtering with a small convolution implemented in NumPy.

**Result.** After training, the network separated cats from dogs well on held-out images it had never seen.

**What I explored.** How convolutional filters build image features, and why high training accuracy needs to be checked against performance on unseen images.

[Dataset and competition](https://www.kaggle.com/c/dogs-vs-cats)

## Flu Shot Learning

**The challenge.** Predict two outcomes from survey features: whether a respondent received an H1N1 vaccine and whether they received a seasonal flu vaccine.

**What I built.** A preprocessing pipeline for binary, ordinal, numeric, and categorical features, including missing-value handling, scaling, and one-hot encoding. I compared a PyTorch multilayer perceptron with separate CatBoost classifiers for the two targets. Preprocessing was fitted on the training portion before transforming the validation data.

**Result.** On a held-out validation split, both models ranked likely vaccine recipients well, with CatBoost slightly ahead of the neural network. I compared them with ROC-AUC, which measures how well predicted probabilities rank positive examples above negative ones, averaged over the two vaccine targets. The notebook also checks submission shape, respondent IDs, missing values, and probability ranges before writing prediction files.

**What I explored.** Comparing a neural network with boosted trees on the same tabular problem, and treating preprocessing and output checks as part of the modeling workflow.

[DrivenData challenge](https://www.drivendata.org/competitions/66/flu-shot-learning/)

## Digit recognizer

**The challenge.** Recognize handwritten digits from 0 to 9 using MNIST's 28 × 28 grayscale images.

**What I built.** A TensorFlow/Keras dense neural network with hidden layers of 128 and 64 units. I normalized pixel values, trained for five epochs, and examined a confusion matrix to see which digits were mistaken for one another.

**Result.** The network recognized the large majority of MNIST's test digits correctly, and the confusion matrix shows which digits it still mixes up.

<figure class="essay-figure">
<img src="{{ '/assets/projects/mnist-confusion-matrix.png' | relative_url }}" alt="MNIST confusion matrix replotted from saved numeric results for ten digit classes, with most predictions on the diagonal." width="1200" height="1080" loading="lazy">
<figcaption>Replotted from my notebook's saved numeric confusion matrix. Rows are true digits and columns are predicted digits.</figcaption>
</figure>

**What I explored.** Multiclass classification, pixel normalization, and using class-by-class errors to understand a model beyond its overall accuracy.

[MNIST dataset](https://keras.io/api/datasets/mnist/)
