---
layout: page
title: ML playground
nav_title: ML projects
permalink: /ml-playground/
description: "Small machine-learning projects beyond my research: cats versus dogs, flu-shot prediction, and handwritten digit recognition."
---

A place for the fun side of learning machine learning: small experiments, familiar datasets, and competition problems outside my research. These projects let me explore computer vision, tabular data, and model evaluation.

The results below come from saved notebook outputs on local evaluation splits, not from competition leaderboards.

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
