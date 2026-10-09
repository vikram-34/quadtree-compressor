"""UI/API contract checks using the real compressor and isolated image storage.

Run from the project root: python -m unittest discover -s tests -v
Requires httpx in addition to the app requirements (FastAPI TestClient dependency).
"""

from io import BytesIO
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import numpy as np
from PIL import Image
from fastapi.testclient import TestClient

import app as server
from quad_tree_compression import compress_image_data


class FrontendIntegrationTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.storage = tempfile.TemporaryDirectory(prefix="quadtree-integration-")
        root = Path(cls.storage.name)
        (root / "uploads").mkdir()
        (root / "outputs").mkdir()
        cls.directories = patch.multiple(
            server, UPLOAD_DIR=str(root / "uploads"), OUTPUT_DIR=str(root / "outputs")
        )
        cls.directories.start()
        cls.client = TestClient(server.app)

    @classmethod
    def tearDownClass(cls):
        cls.client.close()
        cls.directories.stop()
        cls.storage.cleanup()

    def compress_and_download(self, data, filename, mime_type, iterations):
        response = self.client.post(
            f"/compress-image?iterations={iterations}",
            files={"file": (filename, data, mime_type)},
        )
        self.assertEqual(response.status_code, 200, response.text)
        url = response.json()["download_url"]
        self.assertTrue(url.startswith("/download-image/"))
        output = self.client.get(url)
        self.assertEqual(output.status_code, 200)
        self.assertEqual(output.headers["content-type"], "image/png")
        self.assertIn("compressed.png", output.headers["content-disposition"])
        image = Image.open(BytesIO(output.content))
        image.load()
        self.assertEqual(image.format, "PNG")
        self.assertFalse(list(Path(server.UPLOAD_DIR).iterdir()))
        return image

    def test_frontend_and_sample_are_served_by_existing_routes(self):
        for path, content_type in [
            ("/", "text/html"), ("/style.css", "text/css"),
            ("/script.js", "javascript"), ("/static/temp_1st_test.jpg", "image/jpeg"),
        ]:
            with self.subTest(path=path):
                response = self.client.get(path)
                self.assertEqual(response.status_code, 200)
                self.assertIn(content_type, response.headers["content-type"])

    def test_real_sample_matches_existing_compressor_pixel_for_pixel(self):
        data = Path("temp_1st_test.jpg").read_bytes()
        original = Image.open(BytesIO(data))
        original.thumbnail((1080, 1080))
        actual = self.compress_and_download(data, "mountain.jpg", "image/jpeg", 500)
        expected = compress_image_data(np.array(original), 500)
        np.testing.assert_array_equal(np.array(actual), expected)

    def test_transparent_large_image_keeps_existing_resize_and_rgb_behavior(self):
        y, x = np.indices((320, 1200))
        rgba = np.stack((x % 256, y % 256, (x + y) % 256, np.full_like(x, 128)), axis=-1).astype(np.uint8)
        original = Image.fromarray(rgba)
        encoded = BytesIO()
        original.save(encoded, format="PNG")
        actual = self.compress_and_download(encoded.getvalue(), "alpha.png", "image/png", 32)
        self.assertEqual(actual.mode, "RGB")
        prepared = original.convert("RGB")
        prepared.thumbnail((1080, 1080))
        self.assertEqual(actual.size, prepared.size)
        self.assertLessEqual(max(actual.size), 1080)
        np.testing.assert_array_equal(np.array(actual), compress_image_data(np.array(prepared), 32))

    def test_backend_errors_match_frontend_error_contract(self):
        invalid = self.client.post(
            "/compress-image?iterations=2000",
            files={"file": ("invalid.png", b"not an image", "image/png")},
        )
        self.assertEqual(invalid.status_code, 400)
        self.assertIsInstance(invalid.json()["error"], str)
        self.assertFalse(list(Path(server.UPLOAD_DIR).iterdir()))
        missing = self.client.get("/download-image/nonexistent-ui-test")
        self.assertEqual(missing.status_code, 404)


if __name__ == "__main__":
    unittest.main()
