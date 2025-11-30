"""
utils.py
Helper utility functions for QuadTree compression.
"""

import numpy as np


def is_uniform(region, threshold):
    """
    Returns True if region has low variance (i.e., uniform enough).
    """
    return np.std(region) <= threshold


def split_image(image):
    """
    Split image into 4 equal quadrants.
    Useful for debugging and visualizing.
    """
    h, w = image.shape
    mid_h, mid_w = h // 2, w // 2

    return (
        image[:mid_h, :mid_w],
        image[:mid_h, mid_w:],
        image[mid_h:, :mid_w],
        image[mid_h:, mid_w:]
    )
