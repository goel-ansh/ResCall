document.addEventListener("DOMContentLoaded", ()=>{
    // ------------------- REGISTER -------------------
    const registerForm = document.querySelector("form.signup-form");
    if (registerForm) registerForm.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const name = document.getElementById("name")?.value.trim();
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value.trim();
        if (!name || !email || !password) {
            alert("\u26A0 Please fill all fields.");
            return;
        }
        try {
            const response = await fetch("http://localhost:8080/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });
            if (!response.ok) {
                const err = await response.json();
                alert("\u274C Signup failed: " + (err.message || "Something went wrong"));
                return;
            }
            alert("\u2705 Signup successful! Please login now.");
            window.location.href = "login.html";
        } catch (err) {
            console.error("Signup error:", err);
            alert("\u274C Network error: " + err.message);
        }
    });
    // ------------------- LOGIN -------------------
    const loginForm = document.getElementById("loginForm");
    if (loginForm) loginForm.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const email = document.getElementById("email")?.value.trim();
        const password = document.getElementById("password")?.value;
        if (!email || !password) {
            alert("\u26A0 Please fill in all fields.");
            return;
        }
        try {
            const response = await fetch("http://localhost:8080/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });
            if (!response.ok) {
                const err = await response.json();
                alert("\u274C Login failed: " + (err.message || "Something went wrong"));
                return;
            }
            const { accessToken, refreshToken } = await response.json();
            localStorage.setItem("accessToken", accessToken);
            localStorage.setItem("refreshToken", refreshToken);
            alert("\u2705 Login successful!");
            const redirectURL = localStorage.getItem("redirectAfterLogin") || "index.html";
            window.location.href = redirectURL;
        } catch (err) {
            console.error("Login error:", err);
            alert("\u274C An error occurred during login.");
        }
    });
    // ------------------- TOKEN REFRESH -------------------
    async function refreshAccessToken() {
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) throw new Error("No refresh token found");
        const response = await fetch("http://localhost:8080/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "text/plain"
            },
            body: refreshToken
        });
        if (!response.ok) throw new Error("Please Login");
        const { accessToken } = await response.json();
        localStorage.setItem("accessToken", accessToken);
    }
    // ------------------- PROTECTED FETCH WRAPPER -------------------
    async function fetchWithAuth(url, options) {
        let accessToken = localStorage.getItem("accessToken");
        options.headers = options.headers || {};
        options.headers["Authorization"] = "Bearer " + accessToken;
        let response = await fetch(url, options);
        if (response.status === 401) // Token expired → refresh
        try {
            await refreshAccessToken();
            accessToken = localStorage.getItem("accessToken");
            options.headers["Authorization"] = "Bearer " + accessToken;
            response = await fetch(url, options); // retry once
        } catch (err) {
            alert("\u26A0 Session expired. Please log in again.");
            localStorage.clear();
            window.location.href = "login.html";
            return;
        }
        return response;
    }
    // ------------------- UPLOAD + AUTO ATS ANALYSIS -------------------
    const form = document.querySelector(".upload-form");
    if (form) form.addEventListener("submit", async (e)=>{
        e.preventDefault();
        const accessToken = localStorage.getItem("accessToken");
        const refreshToken = localStorage.getItem("refreshToken");
        if (!accessToken || !refreshToken) {
            localStorage.setItem("redirectAfterLogin", window.location.href);
            alert("\u26A0 You must log in first!");
            window.location.href = "login.html";
            return;
        }
        const resume = document.getElementById("resume").files[0];
        const jobdesc = document.getElementById("jobdesc").value;
        if (!resume || !jobdesc) {
            alert("\u26A0 Please upload your resume and paste the job description.");
            return;
        }
        const formData = new FormData();
        formData.append("resume", resume);
        formData.append("jobdesc", jobdesc);
        try {
            // 1️⃣ Upload resume
            let uploadResponse = await fetchWithAuth("http://localhost:8080/upload", {
                method: "POST",
                body: formData
            });
            if (!uploadResponse.ok) {
                const errorText = await uploadResponse.text();
                alert("\u274C Upload failed: " + errorText);
                return;
            }
            const uploadedData = await uploadResponse.json();
            const resumeId = uploadedData.resumeId;
            console.log("\u2705 Resume uploaded with ID:", resumeId);
            alert("\u2705 Resume uploaded! Starting ATS analysis...");
            // 2️⃣ Call ATS Analysis
            await analyzeResume(resumeId);
        } catch (err) {
            console.error("Upload+Analyze Error:", err);
            alert("\u274C Something went wrong: " + err.message);
        }
    });
    // ------------------- ATS ANALYSIS API CALL -------------------
    async function analyzeResume(resumeId) {
        try {
            const accessToken = localStorage.getItem("accessToken");
            const response = await fetch("http://localhost:8080/analyze", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + accessToken
                },
                body: JSON.stringify({
                    resumeId
                })
            });
            if (!response.ok) {
                const err = await response.text();
                alert("\u274C ATS Analysis failed: " + err);
                return;
            }
            const analysis = await response.json();
            // ✅ Show ATS results in UI
            console.log("\uD83C\uDFAF Match Score:", analysis.matchScore);
            console.log("\uD83D\uDCDD Missing Keywords:", analysis.missingKeywords);
            console.log("\uD83D\uDCA1 Suggestions:", analysis.suggestions);
            // Create or update result container dynamically
            let resultContainer = document.getElementById("analysisResult");
            if (!resultContainer) {
                resultContainer = document.createElement("div");
                resultContainer.id = "analysisResult";
                document.querySelector(".upload-section").appendChild(resultContainer);
            }
            resultContainer.innerHTML = `
        <h3>\u{2705} ATS Analysis Result</h3>
        <p><strong>\u{1F3AF} Match Score:</strong> ${analysis.matchScore}</p>
        <p><strong>\u{1F4DD} Missing Keywords:</strong> ${analysis.missingKeywords?.join(", ") || "None"}</p>
        <p><strong>\u{1F4A1} Suggestions:</strong> ${analysis.suggestions || "No suggestions"}</p>
      `;
            alert(`\u{2705} ATS Analysis Complete!
\u{1F3AF} Match Score: ${analysis.matchScore}`);
        } catch (err) {
            console.error("ATS Analysis Error:", err);
            alert("\u274C Error analyzing resume.");
        }
    }
});

//# sourceMappingURL=ResCall-without-Animationn-main.7c0ccee6.js.map
