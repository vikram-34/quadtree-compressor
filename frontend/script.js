// async function upload() {
//     const file = document.getElementById("fileInput").files[0];
//     if (!file) {
//         alert("Please select an image");
//         return;
//     }

//     const form = new FormData();
//     form.append("file", file);

//     let res = await fetch("http://127.0.0.1:8000/compress-image?iterations=20000", {
//         method: "POST",
//         body: form
//     });

//     let data = await res.json();

//     document.getElementById("result").innerHTML = `
//         <a href="http://127.0.0.1:8000${data.download_url}" download>
//             Download Compressed Image
//         </a>
//     `;
// }
// 1. File Name Dikhane ka Logic
document.getElementById('file').addEventListener('change', function() {
    const fileNameDisplay = document.getElementById('file-name');
    
    if (this.files && this.files.length > 0) {
        // Agar file select hui hai to uska naam dikhao
        fileNameDisplay.textContent = this.files[0].name;
        fileNameDisplay.style.color = "#00ffcc"; // Thoda highlight color (Cyan/Green)
    } else {
        // Agar cancel kar diya to wapis default text
        fileNameDisplay.textContent = "No file selected";
        fileNameDisplay.style.color = "#aaa";
    }
});

// 2. Upload/Compress Logic
async function compressImage() {
    const fileInput = document.getElementById("file");
    const iterations = document.getElementById("iterations").value || 2000;
    const result = document.getElementById("result");

    // Check agar user ne file select nahi ki
    if (!fileInput.files.length) {
        alert("Please select an image first!");
        return;
    }

    result.innerHTML = "Compressing..."; // User ko wait karwane ke liye

    const formData = new FormData();
    formData.append("file", fileInput.files[0]);

    try {
        const response = await fetch(`http://127.0.0.1:8000/compress-image?iterations=${iterations}`, {
            method: "POST",
            body: formData
        });

        if (!response.ok) {
            throw new Error("Server error");
        }

        const data = await response.json();

        result.innerHTML = `
            <a class="download-btn" href="http://127.0.0.1:8000${data.download_url}" download style="color: #00ffcc; text-decoration: none; margin-top:15px; display:block;">
                Download Compressed Image
            </a>
        `;
    } catch (error) {
        console.error(error);
        result.innerHTML = "Error occurred during compression.";
    }
}