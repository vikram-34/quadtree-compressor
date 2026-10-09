"use strict";

(() => {
    const $ = (id) => document.getElementById(id);
    const fileInput = $("file");
    const viewer = $("image-viewer");
    const originalImage = $("original-image");
    const resultImage = $("result-image");
    const iterations = $("iterations");
    const qualitySlider = $("quality-slider");
    const compareSlider = $("compare-slider");
    const downloadButton = $("download-button");
    const presetButtons = Array.from(document.querySelectorAll("[data-iterations]"));
    const viewButtons = Array.from(document.querySelectorAll("[data-view]"));
    const sampleUrl = "/static/temp_1st_test.jpg";
    let selectedFile = null;
    let originalUrl = null;
    let resultUrl = null;
    let isBusy = false;
    let isDemo = true;
    let selectionVersion = 0;
    let completedIterations = null;

    function formatBytes(bytes) {
        if (bytes < 1024) return `${bytes} B`;
        return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }

    function setStat(id, value, description) {
        const element = $(id);
        element.replaceChildren(document.createTextNode(value));
        const small = document.createElement("small");
        small.textContent = description;
        element.append(small);
    }

    function showError(message) {
        $("error").textContent = message;
        $("error").hidden = !message;
    }

    function updateComparison() {
        const value = Number(compareSlider.value);
        viewer.style.setProperty("--split", `${value}%`);
        compareSlider.setAttribute("aria-valuetext", `${value}% original, ${100 - value}% ${isDemo ? "quadtree effect" : "compressed result"}`);
    }

    function setView(mode) {
        if (mode !== "original" && !isDemo && !resultUrl) return;
        if (mode === "result" && !resultUrl) return;
        viewer.dataset.mode = mode;
        viewButtons.forEach((button) => {
            button.setAttribute("aria-pressed", String(button.dataset.view === mode));
            button.disabled = (button.dataset.view === "result" && !resultUrl) || (button.dataset.view === "compare" && !isDemo && !resultUrl);
        });
        $("preview-hint").textContent = mode === "compare"
            ? (isDemo ? "Slide to explore the quadtree effect" : "Slide to compare your original and result")
            : mode === "result" ? "Your compressed image, in full view" : "Your original, just as you picked it";
    }

    function clearResult() {
        if (resultUrl) URL.revokeObjectURL(resultUrl);
        resultUrl = null;
        completedIterations = null;
        resultImage.hidden = true;
        resultImage.removeAttribute("src");
        downloadButton.removeAttribute("href");
        downloadButton.removeAttribute("download");
        downloadButton.setAttribute("aria-disabled", "true");
        downloadButton.tabIndex = -1;
        setStat("compressed-size", "—", "the lighter side");
        setStat("savings", "—", "let’s find out");
        $("savings-label").textContent = "SIZE DIFFERENCE";
        document.querySelector(".saved-stat").classList.remove("is-larger");
        $("compress-label").textContent = "Compress image";
    }

    function setBusy(busy) {
        isBusy = busy;
        $("controls").disabled = busy;
        $("reset-button").disabled = busy;
        $("processing-overlay").hidden = !busy;
        viewer.setAttribute("aria-busy", String(busy));
        document.querySelector(".button-spinner").hidden = !busy;
        document.querySelector(".button-arrow").toggleAttribute("hidden", busy);
        $("compress-label").textContent = busy ? "Working some magic…" : (resultUrl ? "Compress again" : "Compress image");
    }

    function updateQuality(value) {
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 15000) {
            iterations.setAttribute("aria-invalid", "true");
            $("quality-help").textContent = "Choose a whole number from 1 to 15,000.";
            presetButtons.forEach((button) => button.setAttribute("aria-pressed", "false"));
            return;
        }
        iterations.removeAttribute("aria-invalid");
        qualitySlider.value = String(parsed);
        qualitySlider.style.setProperty("--fill", `${((parsed - 1) / 14999) * 100}%`);
        presetButtons.forEach((button) => button.setAttribute("aria-pressed", String(Number(button.dataset.iterations) === parsed)));
        $("quality-help").textContent = parsed <= 700 ? "Bolder blocks. Less detail. A lighter touch."
            : parsed <= 4000 ? "The sweet spot for detail and file size."
            : "Finer detail, with a little more processing time.";
        if (resultUrl) $("status").textContent = parsed === completedIterations
            ? "All done. Your PNG is ready to download."
            : "Settings changed. Compress again to apply them.";
    }

    async function selectFile(file) {
        if (isBusy || !file) return;
        showError("");
        if (!/\.(jpe?g|png|webp|bmp)$/i.test(file.name) && !["image/jpeg", "image/png", "image/webp", "image/bmp"].includes(file.type)) {
            fileInput.value = "";
            showError("That format isn’t supported. Choose a JPG, PNG, WebP or BMP image.");
            return;
        }
        if (!file.size) {
            fileInput.value = "";
            showError("That file is empty. Please choose another image.");
            return;
        }
        const version = ++selectionVersion;
        const candidateUrl = URL.createObjectURL(file);
        const image = new Image();
        image.src = candidateUrl;
        try {
            await image.decode();
        } catch {
            URL.revokeObjectURL(candidateUrl);
            if (version === selectionVersion) {
                fileInput.value = "";
                showError("We couldn’t read that image. Try another JPG, PNG, WebP or BMP.");
            }
            return;
        }
        if (version !== selectionVersion || isBusy) {
            URL.revokeObjectURL(candidateUrl);
            return;
        }
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        originalUrl = candidateUrl;
        selectedFile = file;
        isDemo = false;
        clearResult();
        viewer.classList.remove("is-demo");
        originalImage.src = originalUrl;
        originalImage.alt = `Original: ${file.name}`;
        $("file-thumbnail").src = originalUrl;
        $("file-name").textContent = file.name;
        $("file-info").textContent = `${formatBytes(file.size)} · ${image.naturalWidth} × ${image.naturalHeight} px`;
        $("upload-empty").hidden = true;
        $("upload-selected").hidden = false;
        $("demo-canvas").hidden = true;
        $("demo-label").hidden = true;
        $("empty-preview").hidden = true;
        $("reset-button").hidden = false;
        $("preview-badge").textContent = `${image.naturalWidth} × ${image.naturalHeight} PX`;
        $("after-label").textContent = "COMPRESSED";
        setStat("original-size", formatBytes(file.size), `${image.naturalWidth} × ${image.naturalHeight} px`);
        $("result-note").textContent = "Your result is saved as PNG. Images over 1080 px are resized to fit; transparency is removed by the compressor.";
        $("status").textContent = "Looking good. Choose your balance and compress.";
        setView("original");
        updateComparison();
    }

    async function useSample() {
        if (isBusy) return;
        showError("");
        const version = selectionVersion;
        $("sample-button").disabled = true;
        try {
            const response = await fetch(sampleUrl);
            if (!response.ok) throw new Error("Sample unavailable");
            const blob = await response.blob();
            if (version === selectionVersion) await selectFile(new File([blob], "mountain-study.jpg", { type: "image/jpeg" }));
        } catch {
            showError("The sample couldn’t be loaded. You can still upload your own image.");
        } finally {
            $("sample-button").disabled = false;
        }
    }

    async function compressImage(event) {
        event.preventDefault();
        if (isBusy) return;
        showError("");
        if (!selectedFile) {
            showError("Choose an image first, or try our sample to get started.");
            fileInput.focus();
            return;
        }
        const requestedIterations = Number(iterations.value);
        if (!Number.isInteger(requestedIterations) || requestedIterations < 1 || requestedIterations > 15000) {
            showError("Detail iterations must be a whole number between 1 and 15,000.");
            iterations.focus();
            return;
        }
        clearResult();
        setView("original");
        setBusy(true);
        $("status").textContent = "Compressing your image. Good things take a moment.";
        $("processing-caption").textContent = "Your quadtree is taking shape…";
        const started = performance.now();
        const controller = new AbortController();
        const slowNotice = setTimeout(() => {
            $("processing-caption").textContent = "Still working. Detailed images can take a little longer.";
            $("status").textContent = "Still working. The server may need a moment to wake up.";
        }, 12000);
        const timeout = setTimeout(() => controller.abort(), 180000);
        try {
            // Preserve the backend contract: multipart field "file", iterations in the query.
            const formData = new FormData();
            formData.append("file", selectedFile);
            const response = await fetch(`/compress-image?iterations=${requestedIterations}`, {
                method: "POST", body: formData, signal: controller.signal,
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(typeof data.error === "string" ? data.error : "The server couldn’t compress this image. Try a smaller image or fewer iterations.");
            if (typeof data.download_url !== "string") throw new Error("The server didn’t return a download. Please try again.");
            const downloadUrl = new URL(data.download_url, window.location.origin);
            if (downloadUrl.origin !== window.location.origin || !downloadUrl.pathname.startsWith("/download-image/")) {
                throw new Error("The server returned an unexpected download address. Please try again.");
            }
            const output = await fetch(downloadUrl, { signal: controller.signal });
            if (!output.ok) throw new Error("The result is no longer available. Compress your image again for a fresh download.");
            const blob = await output.blob();
            if (!blob.size || !blob.type.startsWith("image/")) throw new Error("The server returned an unreadable image. Please try again.");
            resultUrl = URL.createObjectURL(blob);
            resultImage.src = resultUrl;
            await resultImage.decode();
            completedIterations = requestedIterations;
            resultImage.hidden = false;
            downloadButton.href = resultUrl;
            downloadButton.download = `${selectedFile.name.replace(/\.[^.]+$/, "")}-quadtree.png`;
            downloadButton.setAttribute("aria-disabled", "false");
            downloadButton.tabIndex = 0;
            const reduction = (1 - blob.size / selectedFile.size) * 100;
            const isLarger = blob.size > selectedFile.size;
            const equalSize = blob.size === selectedFile.size;
            const difference = Math.abs(reduction);
            const differenceLabel = difference > 0 && difference < 0.1 ? "<0.1%" : `${difference.toFixed(1)}%`;
            setStat("compressed-size", formatBytes(blob.size), `${resultImage.naturalWidth} × ${resultImage.naturalHeight} px`);
            setStat("savings", equalSize ? "0%" : differenceLabel, equalSize ? "same file size" : isLarger ? "larger file" : "smaller file");
            $("savings-label").textContent = isLarger ? "SIZE INCREASE" : "SIZE SAVED";
            document.querySelector(".saved-stat").classList.toggle("is-larger", isLarger);
            $("preview-badge").textContent = `${requestedIterations.toLocaleString()} ITERATIONS · PNG`;
            const duration = ((performance.now() - started) / 1000).toFixed(1);
            $("result-note").textContent = isLarger
                ? `Finished in ${duration}s. This PNG is larger than your original. Try fewer iterations; PNG can be larger than an already-compressed JPG or WebP.`
                : `Finished in ${duration}s with ${requestedIterations.toLocaleString()} iterations. Your PNG is ready. Try another setting to explore the balance.`;
            $("status").textContent = "All done. Your PNG is ready to download.";
            compareSlider.value = "50";
            updateComparison();
            setView("compare");
        } catch (error) {
            clearResult();
            setView("original");
            showError(error.name === "AbortError"
                ? "That took longer than expected. Please try a smaller image or fewer iterations."
                : error instanceof TypeError ? "We couldn’t reach the server. Check your connection and try again."
                    : error.message || "Something went wrong. Please try again.");
            $("status").textContent = "Your original is still here. Let’s try again.";
            $("result-note").textContent = "No result yet. Try another image or adjust the detail iterations.";
        } finally {
            clearTimeout(slowNotice);
            clearTimeout(timeout);
            setBusy(false);
        }
    }

    // This stylized canvas is a labelled demo. Actual compression always uses Python.
    function drawDemo() {
        if (!isDemo || !originalImage.naturalWidth) return;
        const canvas = $("demo-canvas");
        canvas.width = originalImage.naturalWidth;
        canvas.height = originalImage.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) { setView("original"); return; }
        const source = document.createElement("canvas");
        source.width = canvas.width;
        source.height = canvas.height;
        const sourceContext = source.getContext("2d", { willReadFrequently: true });
        if (!sourceContext) { setView("original"); return; }
        sourceContext.drawImage(originalImage, 0, 0);
        const pixels = sourceContext.getImageData(0, 0, canvas.width, canvas.height).data;
        const samplePixel = (x, y) => {
            const offset = (Math.min(canvas.height - 1, y) * canvas.width + Math.min(canvas.width - 1, x)) * 4;
            return [pixels[offset], pixels[offset + 1], pixels[offset + 2]];
        };
        function block(x, y, width, height, depth) {
            const points = [samplePixel(x, y), samplePixel(x + Math.floor(width / 2), y + Math.floor(height / 2)), samplePixel(x + width - 1, y + height - 1)];
            const variance = points.reduce((sum, pixel) => sum + pixel.reduce((difference, channel, index) => difference + Math.abs(channel - points[1][index]), 0), 0);
            if (depth < 3 || (depth < 6 && variance > 75 && width > 6 && height > 6)) {
                const halfWidth = Math.floor(width / 2);
                const halfHeight = Math.floor(height / 2);
                block(x, y, halfWidth, halfHeight, depth + 1);
                block(x + halfWidth, y, width - halfWidth, halfHeight, depth + 1);
                block(x, y + halfHeight, halfWidth, height - halfHeight, depth + 1);
                block(x + halfWidth, y + halfHeight, width - halfWidth, height - halfHeight, depth + 1);
                return;
            }
            const average = [0, 1, 2].map((channel) => Math.round(points.reduce((sum, pixel) => sum + pixel[channel], 0) / points.length));
            context.fillStyle = `rgb(${average.join(",")})`;
            context.fillRect(x, y, width, height);
            context.strokeStyle = "rgba(216, 235, 173, 0.22)";
            context.lineWidth = 0.6;
            context.strokeRect(x + 0.3, y + 0.3, width - 0.6, height - 0.6);
        }
        block(0, 0, canvas.width, canvas.height, 0);
    }

    function reset() {
        if (isBusy) return;
        selectionVersion++;
        clearResult();
        if (originalUrl) URL.revokeObjectURL(originalUrl);
        originalUrl = null;
        selectedFile = null;
        isDemo = true;
        fileInput.value = "";
        $("file-thumbnail").removeAttribute("src");
        $("upload-empty").hidden = false;
        $("upload-selected").hidden = true;
        $("demo-canvas").hidden = false;
        $("demo-label").hidden = false;
        $("reset-button").hidden = true;
        $("empty-preview").hidden = true;
        viewer.classList.add("is-demo");
        originalImage.src = sampleUrl;
        originalImage.alt = "Sample: a sunlit mountain surrounded by clouds";
        $("preview-badge").textContent = "ILLUSTRATIVE PREVIEW";
        $("after-label").textContent = "QUADTREE EFFECT";
        $("result-note").textContent = "A visual experiment in doing more with less. Upload an image to get your actual result.";
        $("status").textContent = "Your next lighter image starts here.";
        setStat("original-size", "—", "awaiting image");
        iterations.value = "2000";
        compareSlider.value = "50";
        updateQuality(2000);
        updateComparison();
        setView("compare");
        showError("");
        if (originalImage.complete) drawDemo();
    }

    fileInput.addEventListener("change", () => selectFile(fileInput.files[0]));
    $("sample-button").addEventListener("click", useSample);
    $("compress-form").addEventListener("submit", compressImage);
    $("reset-button").addEventListener("click", reset);
    iterations.addEventListener("input", () => updateQuality(iterations.value));
    qualitySlider.addEventListener("input", () => {
        iterations.value = qualitySlider.value;
        updateQuality(qualitySlider.value);
    });
    presetButtons.forEach((button) => button.addEventListener("click", () => {
        iterations.value = button.dataset.iterations;
        updateQuality(iterations.value);
    }));
    viewButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
    compareSlider.addEventListener("input", updateComparison);
    downloadButton.addEventListener("click", (event) => { if (!resultUrl) event.preventDefault(); });

    let dragDepth = 0;
    const dropZone = $("drop-zone");
    dropZone.addEventListener("dragenter", (event) => {
        event.preventDefault();
        dragDepth++;
        if (!isBusy) dropZone.classList.add("is-dragging");
    });
    dropZone.addEventListener("dragover", (event) => event.preventDefault());
    dropZone.addEventListener("dragleave", () => {
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) dropZone.classList.remove("is-dragging");
    });
    dropZone.addEventListener("drop", (event) => {
        event.preventDefault();
        dragDepth = 0;
        dropZone.classList.remove("is-dragging");
        if (isBusy) return;
        const files = event.dataTransfer.files;
        if (files.length > 1) { showError("One image at a time. Choose a single image to compress."); return; }
        fileInput.value = "";
        selectFile(files[0]);
    });
    // Keep a missed drop from navigating away and discarding the current result.
    window.addEventListener("dragover", (event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
    });
    window.addEventListener("drop", (event) => {
        if (Array.from(event.dataTransfer.types).includes("Files")) event.preventDefault();
    });
    originalImage.addEventListener("load", drawDemo);
    originalImage.addEventListener("error", () => {
        if (isDemo) {
            $("empty-preview").hidden = false;
            setView("original");
            $("preview-hint").textContent = "Choose your own image to see the bigger picture";
        }
    });
    viewer.classList.add("is-demo");
    updateQuality(2000);
    if (originalImage.complete) drawDemo();
})();
