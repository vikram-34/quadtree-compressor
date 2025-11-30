"""
histogram_entropy.py
Provides histogram and entropy calculation for image regions.
"""

import numpy as np


def calculate_histogram(region):
    """
    Returns histogram of intensity values for the region.
    """
    hist, _ = np.histogram(region.flatten(), bins=256, range=(0, 255))
    return hist


def calculate_entropy(region):
    """
    Calculates Shannon entropy of a region.
    Higher entropy = more details.
    """
    hist = calculate_histogram(region)
    total = np.sum(hist)

    if total == 0:
        return 0

    probs = hist / total
    probs = probs[probs > 0]  # remove zeros to avoid log error

    entropy = -np.sum(probs * np.log2(probs))
    return entropy
