document.addEventListener("DOMContentLoaded", () => {

  // ------------------- REGISTER -------------------
  const registerForm = document.querySelector("form.signup-form");
  if (registerForm) {
    registerForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("name")?.value.trim();
      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value.trim();

      if (!name || !email || !password) {
        alert("⚠ Please fill all fields.");
        return;
      }

      try {
        const response = await fetch("https://rescall.onrender.com/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });

        if (!response.ok) {
          const err = await response.json();
          alert("❌ Signup failed: " + (err.message || "Something went wrong"));
          return;
        }

        alert("✅ Signup successful! Please login now.");
        window.location.href = "login.html";
      } catch (err) {
        console.error("Signup error:", err);
        alert("❌ Network error: " + err.message);
      }
    });
  }

  // ------------------- LOGIN -------------------
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("email")?.value.trim();
      const password = document.getElementById("password")?.value;

      if (!email || !password) {
        alert("⚠ Please fill in all fields.");
        return;
      }

      try {
        const response = await fetch("https://rescall.onrender.com/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
          const err = await response.json();
          alert("❌ Login failed: " + (err.message || "Something went wrong"));
          return;
        }

        const { accessToken, refreshToken } = await response.json();

        localStorage.setItem("accessToken", accessToken);
        localStorage.setItem("refreshToken", refreshToken);

        alert("✅ Login successful!");

        const redirectURL = localStorage.getItem("redirectAfterLogin") || "index.html";
        window.location.href = redirectURL;
      } catch (err) {
        console.error("Login error:", err);
        alert("❌ An error occurred during login.");
      }
    });
  }

  // ------------------- TOKEN REFRESH -------------------
  async function refreshAccessToken() {
    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) throw new Error("No refresh token found");

    const response = await fetch("https://rescall.onrender.com/refresh", {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: refreshToken
    });

    if (!response.ok) {
      throw new Error("Please Login");
    }

    const { accessToken } = await response.json();
    localStorage.setItem("accessToken", accessToken);
  }

  // ------------------- PROTECTED FETCH WRAPPER -------------------
  async function fetchWithAuth(url, options) {
    let accessToken = localStorage.getItem("accessToken");

    options.headers = options.headers || {};
    options.headers["Authorization"] = "Bearer " + accessToken;

    let response = await fetch(url, options);

    if (response.status === 401) {
      // Token expired → refresh
      try {
        await refreshAccessToken();

        accessToken = localStorage.getItem("accessToken");
        options.headers["Authorization"] = "Bearer " + accessToken;

        response = await fetch(url, options); // retry once
      } catch (err) {
        alert("⚠ Session expired. Please log in again.");
        localStorage.clear();
        window.location.href = "login.html";
        return;
      }
    }

    return response;
  }

  // ------------------- UPLOAD + AUTO ATS ANALYSIS -------------------
  const form = document.querySelector(".upload-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!accessToken || !refreshToken) {
        localStorage.setItem("redirectAfterLogin", window.location.href);
        alert("⚠ You must log in first!");
        window.location.href = "login.html";
        return;
      }

      const resume = document.getElementById("resume").files[0];
      const jobdesc = document.getElementById("jobdesc").value;

      if (!resume || !jobdesc) {
        alert("⚠ Please upload your resume and paste the job description.");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resume);
      formData.append("jobdesc", jobdesc);

      try {
        // 1️⃣ Upload resume
        let uploadResponse = await fetchWithAuth("https://rescall.onrender.com/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          alert("❌ Upload failed: " + errorText);
          return;
        }

        const uploadedData = await uploadResponse.json();
        const resumeId = uploadedData.resumeId;

        console.log("✅ Resume uploaded with ID:", resumeId);
        alert("✅ Resume uploaded! Starting ATS analysis...");

        // 2️⃣ Call ATS Analysis
        await analyzeResume(resumeId);

      } catch (err) {
        console.error("Upload+Analyze Error:", err);
        alert("❌ Something went wrong: " + err.message);
      }
    });
  }

  // ------------------- ATS ANALYSIS API CALL -------------------
  async function analyzeResume(resumeId) {
    try {
      const accessToken = localStorage.getItem("accessToken");

      const response = await fetch("https://rescall.onrender.com/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + accessToken
        },
        body: JSON.stringify({ resumeId })
      });

      if (!response.ok) {
        const err = await response.text();
        alert("❌ ATS Analysis failed: " + err);
        return;
      }

      const analysis = await response.json();

      // ✅ Show ATS results in UI
      console.log("🎯 Match Score:", analysis.matchScore);
      console.log("📝 Missing Keywords:", analysis.missingKeywords);
      console.log("💡 Suggestions:", analysis.suggestions);

      // Create or update result container dynamically
      let resultContainer = document.getElementById("analysisResult");
      if (!resultContainer) {
        resultContainer = document.createElement("div");
        resultContainer.id = "analysisResult";
        document.querySelector(".upload-section").appendChild(resultContainer);
      }

      resultContainer.innerHTML = `
        <h3>✅ ATS Analysis Result</h3>
        <p><strong>🎯 Match Score:</strong> ${analysis.matchScore}</p>
        <p><strong>📝 Missing Keywords:</strong> ${analysis.missingKeywords?.join(", ") || "None"}</p>
        <p><strong>💡 Suggestions:</strong> ${analysis.suggestions || "No suggestions"}</p>
      `;

      alert(`✅ ATS Analysis Complete!\n🎯 Match Score: ${analysis.matchScore}`);

    } catch (err) {
      console.error("ATS Analysis Error:", err);
      alert("❌ Error analyzing resume.");
    }
  }

});
