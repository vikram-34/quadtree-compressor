# 🖼️ Quadtree Image Compressor

This is a web application built to demonstrate efficient image compression using the **Quadtree** spatial partitioning algorithm. The project allows users to upload an image, specify the desired compression quality (number of iterations), and download the resulting compressed file.

## ✨ Key Features
* **Quadtree Algorithm:** Utilizes the Quadtree data structure to recursively divide image sections based on color variance, achieving lossy but highly efficient compression.
* **Adjustable Compression:** Users can input the number of **Iterations** to control the compression level (higher iterations = higher quality/larger file size).
* **Full Stack Integration:** Seamless communication between the JavaScript frontend and the Python image processing backend.

## 🚀 Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Frontend** | HTML, CSS, Vanilla JavaScript | User interface and handling of file selection/API calls. |
| **Backend** | Python (FastAPI/Flask) | Handles the image upload and executes the Quadtree compression logic. |
| **Image Processing** | Python Imaging Library (PIL/Pillow) | Used for loading, manipulating, and saving images. |

## 🛠️ Installation and Setup

Follow these steps to get the project running locally.

### 1. Backend Setup (Python)

Assuming your backend script is named `main.py` and uses **FastAPI** (since you were running on port 8000):

1.  Clone the repository:
    ```bash
    git clone [YOUR_REPO_URL]
    cd image-compressor
    ```
2.  Create a virtual environment (Recommended):
    ```bash
    python -m venv venv
    source venv/bin/activate  # On Windows use `venv\Scripts\activate`
    ```
3.  Install dependencies (You will need `fastapi`, `uvicorn`, and `pillow`):
    ```bash
    pip install fastapi uvicorn pillow
    ```
4.  Start the backend server:
    ```bash
    uvicorn main:app --reload
    # Ensure this runs on [http://127.0.0.1:8000](http://127.0.0.1:8000)
    ```

### 2. Frontend Usage

1.  Open the `index.html` file directly in your web browser.
2.  Ensure the backend server is running in the background.

## 💡 How It Works (The Quadtree Magic)

The Quadtree algorithm works by recursively dividing a square region of the image into four smaller squares (**quadrants**) if the pixel variance within that region exceeds a predefined threshold.

1.  The algorithm starts with the entire image as one single node.
2.  If the color variance is high (meaning the area is complex), the node is divided into four children.
3.  This recursive division continues until the area is nearly uniform or the maximum number of **iterations** (compression limit) is reached.
4.  The final compressed image is constructed using the average color of the smallest, non-divided squares.



## 🔮 Future Enhancements
* Add a live **preview** of the compressed image before download.
* Allow the user to select the **error threshold** instead of just iterations.
* Implement a **loading animation** during the compression process.