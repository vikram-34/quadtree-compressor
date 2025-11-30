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
# from fastapi import FastAPI, UploadFile, File
# from fastapi.responses import FileResponse, JSONResponse
# from fastapi.staticfiles import StaticFiles
# import numpy as np
# from PIL import Image
# import uuid
# import os

# # Import your compression logic
# # Note: Ensure your other file is named 'quad_tree_compression.py'
# from quad_tree_compression import compress_image_data
# from fastapi.middleware.cors import CORSMiddleware

# app = FastAPI()

# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Directories Setup
# UPLOAD_DIR = "uploads"
# OUTPUT_DIR = "outputs"
# os.makedirs(UPLOAD_DIR, exist_ok=True)
# os.makedirs(OUTPUT_DIR, exist_ok=True)

# # --- FRONTEND SERVE KARNE KA CODE (NEW) ---

# # 1. Main page (index.html) serve karna
# @app.get("/")
# async def read_index():
#     return FileResponse('index.html')

# # 2. CSS file serve karna
# @app.get("/style.css")
# async def read_css():
#     return FileResponse('style.css')

# # 3. JS file serve karna
# @app.get("/script.js")
# async def read_js():
#     return FileResponse('script.js')

# # -------------------------
# # Compress Image Endpoint
# # -------------------------
# @app.post("/compress-image")
# async def compress_image(file: UploadFile = File(...), iterations: int = 20000):
#     # Generate unique ID
#     file_id = str(uuid.uuid4())

#     # Save uploaded file temporarily
#     input_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
#     with open(input_path, "wb") as f:
#         f.write(await file.read())

#     # Load image as numpy array
#     img = Image.open(input_path)
#     img_data = np.array(img)

#     # Compress using QuadTree
#     # (Yeh function aapki doosri file se aayega)
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
from fastapi.middleware.cors import CORSMiddleware
import numpy as np
from PIL import Image
import uuid
import os
import sys
import gc

# Recursion limit badhana zaroori hai quadtree ke liye
sys.setrecursionlimit(10000)

# Import compression logic
# Try-catch block taaki agar file missing ho toh server crash na ho (debugging ke liye)
try:
    from quad_tree_compression import compress_image_data
except ImportError:
    print("Error: quad_tree_compression module not found!")
    compress_image_data = None

app = FastAPI()

# CORS Middleware (Security ke liye)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files (HTML/CSS/JS) serve karne ke liye
app.mount("/static", StaticFiles(directory="."), name="static")

# --- Frontend Routes ---
@app.get("/")
def read_index():
    return FileResponse('index.html')

@app.get("/style.css")
def read_css():
    return FileResponse('style.css')

@app.get("/script.js")
def read_js():
    return FileResponse('script.js')

# Directories setup
UPLOAD_DIR = "uploads"
OUTPUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Helper function: Purani files delete karne ke liye
def clean_old_files():
    try:
        for folder in [UPLOAD_DIR, OUTPUT_DIR]:
            # Files ko time ke hisaab se sort karo
            files = sorted(
                [os.path.join(folder, f) for f in os.listdir(folder)],
                key=os.path.getmtime
            )
            # Sirf latest 3 files rakho, baaki delete kar do
            if len(files) > 3:
                for f in files[:-3]:
                    try:
                        os.remove(f)
                    except:
                        pass
    except Exception:
        pass

# -------------------------
# Safe Compress Endpoint
# -------------------------
@app.post("/compress-image")
def compress_image(file: UploadFile = File(...), iterations: int = 1000):
    
    # 1. Cleaning: Pehle purani files saaf karo taaki disk full na ho
    clean_old_files()

    file_id = str(uuid.uuid4())
    input_path = os.path.join(UPLOAD_DIR, f"{file_id}_{file.filename}")
    
    # Uploaded file save karo
    with open(input_path, "wb") as f:
        f.write(file.file.read())

    try:
        if compress_image_data is None:
            raise Exception("Compression module missing")

        # 2. IMAGE OPTIMIZATION (Sabse Important Step for Free Server)
        img = Image.open(input_path)
        
        # Convert to RGB (PNG transparent images crash kar sakti hain)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')

        # RESIZE: Max 512px (Free tier ke liye yahi safe hai)
        # Yeh step server crash hone se bachayega
        img.thumbnail((1080, 1080))
        
        img_data = np.array(img)

        # 3. Process
        # Iterations ko limit karo (Max 3000)
        safe_iterations = min(iterations, 15000)
        
        compressed_data = compress_image_data(img_data, safe_iterations)

        # 4. Save
        output_path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
        Image.fromarray(compressed_data).save(output_path)

        return {"download_url": f"/download-image/{file_id}"}

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        # Crash hone ki bajaye error message bhejo
        return JSONResponse(
            status_code=400, 
            content={"error": "Image too heavy or server busy. Try a smaller image."}
        )

    finally:
        # 5. CLEANUP: Input file delete karo
        if os.path.exists(input_path):
            try:
                os.remove(input_path)
            except:
                pass
        
        # Memory free karo (Garbage Collection)
        # Yeh variables delete karna zaroori hai taaki RAM free ho jaye
        try:
            del img
            del img_data
            del compressed_data
        except:
            pass
        gc.collect()

@app.get("/download-image/{file_id}")
def download_image(file_id: str):
    path = os.path.join(OUTPUT_DIR, f"{file_id}_compressed.png")
    if not os.path.exists(path):
        return JSONResponse({"error": "File not found"}, status_code=404)
    return FileResponse(path, media_type="image/png", filename="compressed.png")