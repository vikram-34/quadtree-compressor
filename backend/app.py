# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import FileResponse, JSONResponse
# import numpy as np
# from PIL import Image
# import uuid
# import os

# from .quad_tree_compression import compress_image_data
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # allow all origins for testing
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )



# # Directories
# UPLOAD_DIR = "uploads"
# OUTPUT_DIR = "outputs"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# # -------------------------
# # Compress Image Endpoint
# # -------------------------
# @app.post("/compress-image")
# async def compress_image(file: UploadFile = File(...), iterations: int = 20000):
#     # Generate unique ID for this file
#     file_id = str(uuid.uuid4())

#     # Save uploaded file temporarily
#     input_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
#     with open(input_path, "wb") as f:
#         f.write(await file.read())

#     # Load image as numpy array
#     img = Image.open(input_path)
#     img_data = np.array(img)

#     # Compress using QuadTree
#     compressed_data = compress_image_data(img_data, iterations)

#     # Save compressed image
#     output_path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
#     Image.fromarray(compressed_data).save(output_path)

#     # Remove temporary uploaded file
#     os.remove(input_path)

#     # Return download URL
#     return {"download_url": f"/download-image/{file_id}"}

# # -------------------------
# # Download Compressed Image
# # -------------------------
# @app.get("/download-image/{file_id}")
# def download_image(file_id: str):
#     path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
#     if not os.path.exists(path):
#         return JSONResponse({"error": "File not found"}, status_code=404)
#     return FileResponse(path, media_type="image/png", filename="compressed.png")
from fastapi import FastAPI, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
import numpy as np
from PIL import Image
import uuid
import os

# Import your compression logic
# Note: Ensure your other file is named 'quad_tree_compression.py'
from quad_tree_compression import compress_image_data
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories Setup
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# --- FRONTEND SERVE KARNE KA CODE (NEW) ---

# 1. Main page (index.html) serve karna
@app.get("/")
async def read_index():
    return FileResponse('index.html')

# 2. CSS file serve karna
@app.get("/style.css")
async def read_css():
    return FileResponse('style.css')

# 3. JS file serve karna
@app.get("/script.js")
async def read_js():
    return FileResponse('script.js')

# -------------------------
# Compress Image Endpoint
# -------------------------
@app.post("/compress-image")
async def compress_image(file: UploadFile = File(...), iterations: int = 20000):
    # Generate unique ID
    file_id = str(uuid.uuid4())

    # Save uploaded file temporarily
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    with open(input_path, "wb") as f:
        f.write(await file.read())

    # Load image as numpy array
    img = Image.open(input_path)
    img_data = np.array(img)

    # Compress using QuadTree
    # (Yeh function aapki doosri file se aayega)
    compressed_data = compress_image_data(img_data, iterations)

    # Save compressed image
    output_path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
    Image.fromarray(compressed_data).save(output_path)

    # Remove temporary uploaded file
    os.remove(input_path)

    # Return download URL
    return {"download_url": f"/download-image/{file_id}"}

# -------------------------
# Download Compressed Image
# -------------------------
@app.get("/download-image/{file_id}")
def download_image(file_id: str):
    path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
    if not os.path.exists(path):
        return JSONResponse({"error": "File not found"}, status_code=404)
    return FileResponse(path, media_type="image/png", filename="compressed.png")
```