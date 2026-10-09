<div align="center">

# Quadtree Image Compressor

### A little less. A lot more.

A visual image-compression studio built with Python, FastAPI, and vanilla JavaScript.
Explore how a quadtree turns image detail into smaller regions, compare the result, and download your PNG.

[Live Website](https://quadtree-image-compressor-v7p0.onrender.com/) · [Getting Started](#getting-started) · [How It Works](#how-it-works) · [Demo Video](#demo-video)

</div>

---

## Overview

Quadtree Image Compressor combines an interactive frontend with a Python image-processing engine. Upload an image, choose a level of detail, and explore the difference with an adjustable before-and-after preview.

This is **lossy, quadtree-based image processing**: the algorithm approximates image regions with average colors and exports the result as a PNG. The amount of detail and the final file size depend on both the image and the iteration count.

## Demo Video

*A walkthrough of the live website will be added here.*

<!-- DEMO VIDEO: Replace the placeholder above with your GitHub-uploaded video URL.
Edit this README on GitHub and drag your video into the editor, or paste the
attachment URL GitHub provides. Keep the URL on its own line to display the video.
Do not remove temp_1st_test.jpg; it powers the website's sample image and tests. -->

## Features

- **Drag-and-drop upload** with file browsing and a built-in sample image.
- **Three detail presets** plus a slider and precise iteration input.
- **Before-and-after comparison** with separate original and result views.
- **Measured file-size statistics**, including a clear notice when the result is larger.
- **PNG download** with a descriptive filename.
- **Responsive layout** for phones, tablets, and desktops.
- **Accessible controls** with keyboard support, focus indicators, status announcements, and reduced-motion support.
- **Clear loading and error states** for compression requests.

## Using the Studio

1. Open the [live website](https://quadtree-image-compressor-v7p0.onrender.com/) or run it locally.
2. Drop an image into the upload area, browse for a file, or select **Try our sample**.
3. Choose a preset or enter a detail iteration count.
4. Select **Compress image**.
5. Compare the original and result, check the file-size change, and select **Download PNG**.

| Preset | Iterations | Best for exploring |
| --- | ---: | --- |
| Smaller | 500 | Coarser blocks and lower detail |
| Balanced | 2,000 | A middle ground between detail and size |
| Detailed | 8,000 | Finer detail with more processing time |

The interface accepts whole numbers from **1 to 15,000**. Higher iteration counts allow more subdivision; they do not guarantee a smaller file.

## How It Works

1. **Prepare the image.** The server reads the uploaded image, converts RGBA and palette images to RGB, and fits the image within 1080 × 1080 pixels while preserving its aspect ratio.
2. **Start with one region.** The compressor calculates the region's average color and a detail score based on color variation and region size.
3. **Refine the detailed areas.** A priority queue selects the most detailed region. Where possible, that region is divided into four smaller regions. The iteration budget and detail threshold govern refinement.
4. **Render the approximation.** Each leaf region is filled with its average color. The server saves the resulting image as a PNG and returns its download URL.
5. **Compare and download.** The frontend displays the actual output, calculates the file-size difference, and enables the download.

The initial mountain preview is a **labelled illustration** of the quadtree effect. Clicking **Compress image** always processes the selected image with the Python backend.

## Technology

| Layer | Tools |
| --- | --- |
| Interface | HTML, CSS, vanilla JavaScript, Canvas |
| Web server | Python, FastAPI, Uvicorn |
| Image processing | Pillow, NumPy |
| Quadtree priority queue | sortedcontainers |
| Integration tests | unittest, FastAPI TestClient, HTTPX |
| Hosting | Render |

## Getting Started

### Prerequisites

- Python **3.13** is the version used for the local verification in this repository.
- Git and pip.

### 1. Clone the repository

```bash
git clone https://github.com/vikram-34/quadtree-compressor.git
cd quadtree-compressor
```

### 2. Create and activate a virtual environment

**Windows PowerShell**

```powershell
py -3.13 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**macOS / Linux**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

### 3. Install dependencies

```bash
python -m pip install -r requirements.txt
```

### 4. Start the application

Run this command from the repository root:

```bash
python -m uvicorn app:app --reload
```

Open **[http://127.0.0.1:8000](http://127.0.0.1:8000)**. FastAPI serves both the frontend and the compression endpoints; no separate frontend build is needed.

Open the site through the server, rather than opening `index.html` directly from your file manager. Uploads and sample assets use server routes.

## Tests

Install the additional test dependency and run the integration suite from the repository root:

```bash
python -m pip install httpx
python -m unittest discover -s tests -v
```

The tests cover frontend and sample-image routes, the upload/download contract, pixel-for-pixel agreement with the compressor, resize and RGB conversion behavior, and error responses. Uploads and outputs are isolated in temporary directories during tests.

## API

Interactive API documentation is available at **`/docs`** on the running server.

### Compress an image

```http
POST /compress-image?iterations=2000
Content-Type: multipart/form-data
```

Send the image in the multipart field **`file`**. The API defaults to **1,000 iterations** when the query parameter is omitted and caps processing at **15,000**. The studio explicitly sends its selected value, initially **2,000**.

Example with curl (use `curl.exe` in Windows PowerShell if needed):

```bash
curl -X POST "http://127.0.0.1:8000/compress-image?iterations=2000" -F "file=@temp_1st_test.jpg"
```

Successful response:

```json
{
  "download_url": "/download-image/<file-id>"
}
```

### Download the result

```http
GET /download-image/<file-id>
```

Returns a PNG attachment. An unavailable output returns **404**; a processing failure returns **400** with an `error` message.

## Deploying on Render

Create a **Web Service** connected to this repository:

| Setting | Value |
| --- | --- |
| Runtime | Python |
| Branch | `main` |
| Root directory | Repository root; leave the setting blank |
| Build command | `pip install -r requirements.txt` |
| Start command | `uvicorn app:app --host 0.0.0.0 --port $PORT` |

For automatic updates, use **Auto-Deploy → On Commit**. Otherwise, use **Manual Deploy → Deploy latest commit** after pushing changes.

The CSS and JavaScript URLs in `index.html` include a version query string. **Update that version when either asset changes** so browsers fetch the matching files after a deployment.

## Project Structure

```text
quadtree-compressor/
├── app.py                         # FastAPI routes and image handling
├── quad_tree_compression.py       # Quadtree compression and reconstruction
├── index.html                     # Studio interface
├── style.css                      # Responsive visual design
├── script.js                      # Upload, comparison, and download interactions
├── temp_1st_test.jpg               # Required sample image and test fixture
├── backend/                       # Supporting utilities
├── tests/
│   └── test_frontend_integration.py
├── requirements.txt
├── .gitignore
└── README.md
```

The server creates `uploads/` and `outputs/` when needed. Generated images, legacy `compressed_files/` contents, virtual environments, and Python caches are excluded from version control.

## Current Limits

- **Input formats:** the studio accepts JPG, PNG, WebP, and BMP. RGB images are supported; grayscale-only images are not handled by the current compression path.
- **Dimensions:** images are reduced to fit within 1080 × 1080 pixels; small images are not enlarged.
- **Transparency:** RGBA and palette images are converted to RGB, so output does not preserve transparency.
- **Output:** the web application exports PNG. A result may be larger than a source JPG or WebP, especially at higher detail settings.
- **Retention:** saved outputs are temporary. Older files are pruned during subsequent compression requests, so server download links are not permanent storage.

## Author

Built by [Vikram](https://github.com/vikram-34).

Found a bug or have an idea? [Open an issue](https://github.com/vikram-34/quadtree-compressor/issues) with reproduction steps or a description of the improvement.
