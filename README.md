# Sprint 4 – AI Cover Letter Generator

A modern, responsive, SaaS-grade Cover Letter Generator powered by **Google Gemini API** with an automatic **Template-based fallback engine**. Built using a clean vanilla JavaScript frontend and an Express Node.js backend.

---

## 🚀 Key Features

* **Dual-Engine Generation:**
  * **Phase 1 (Template Engine):** Generates high-quality, structured cover letters instantly without requiring an API key. Serves as a reliable, zero-downtime fallback.
  * **Phase 2 (Gemini AI Engine):** Generates personalized, role-specific cover letters using Google Gemini API (`gemini-3.5-flash` or configurable model).
* **Modern SaaS Interface:**
  * 2-column responsive layout built with vanilla CSS.
  * Form inputs for Candidate Name, Job Role, Target Company, Key Skills, and Tone presets (Professional, Confident, Enthusiastic, Creative).
  * Real-time form validation with clear field-level feedback and error banners.
  * Quick **"Demo Data"** button for instant testing.
  * Live output document viewer with real-time word and character counts.
  * Interactive **"Copy to Clipboard"** with animated feedback and **"Download (.txt)"** functionality.
  * Mode indicator badge displaying whether the letter was drafted via `Gemini AI` or `Template Engine`.
* **Security & Best Practices:**
  * Strict separation of frontend and backend.
  * API credentials are never exposed to the client; all calls route through the Express backend.
  * Credentials stored securely via root `.env` (git-ignored), with safe placeholders in `.env.example`.

---

## 📁 Project Structure

```text
Sprint-4/
├── frontend/
│   ├── index.html       # SaaS UI structure & semantic markup
│   ├── style.css        # Responsive dark-theme styling & micro-interactions
│   └── script.js        # Form validation, API calls, clipboard & template fallback
├── backend/
│   └── server.js        # Express backend, Gemini API integration & template engine
├── .env                 # Local environment variables (git-ignored)
├── .env.example         # Template for environment configuration
├── .gitignore           # Ignores .env, node_modules, and OS files
├── package.json         # Project metadata and start scripts
├── test-endpoints.js    # Automated validation and endpoint test suite
├── README.md            # Comprehensive documentation & setup guide
└── PROMPTS.md           # AI assistance prompts used during development
```

---

## 🛠️ Prerequisites

* [Node.js](https://nodejs.org/) (v18.0.0 or higher recommended)
* npm (bundled with Node.js)

---

## ⚙️ Installation & Setup

1. **Navigate to the Sprint-4 directory:**
   ```bash
   cd Sprint-4
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   * Copy `.env.example` to `.env`:
     ```bash
     cp .env.example .env
     ```
   * Open `.env` and configure your settings:
     ```env
     PORT=5000
     GEMINI_API_KEY=your_actual_gemini_api_key_here
     GEMINI_MODEL=gemini-3.5-flash
     ```

   > **Note:** If `GEMINI_API_KEY` is left blank or unset, the application automatically functions in **Phase 1 Template Mode**, generating polished cover letters without any external API calls.

---

## 🚀 Running the Application

### 1. Start the Server (Serves both Frontend & Backend API)

Run the Express server:
```bash
npm start
```
*Or during development with auto-reload:*
```bash
npm run dev
```

The application is now live at:
👉 **[http://localhost:5000](http://localhost:5000)**

### 2. Standalone Frontend (Optional)

Because Express serves the frontend statically from the `frontend/` directory, visiting `http://localhost:5000` is the easiest method.

However, if you wish to run the frontend independently (e.g., via VS Code Live Server or static server on port 3000 / 5500):
- Ensure the backend is running on `http://localhost:5000`.
- CORS is enabled in Express, allowing seamless cross-origin requests.
- Even if the backend server is offline, the frontend's built-in client engine will automatically generate template cover letters.

---

## 🧪 Verification & Testing

### 1. Automated Test Suite
Run the included verification script:
```bash
npm test
```
This tests:
- Form field validation (400 on missing fields)
- Template generation without an API key (Phase 1)
- Static asset serving (`index.html`, `style.css`, `script.js`)

### 2. Manual Testing Workflow

1. **Phase 1 Verification (No API Key):**
   - Leave `GEMINI_API_KEY=` blank in `.env`.
   - Start the server (`npm start`) and open `http://localhost:5000`.
   - Notice the header badge shows `Template Mode (No API Key)`.
   - Click **"Demo Data"** to fill the candidate profile, then click **"Generate Cover Letter"**.
   - Verify the cover letter appears with the `⚡ Template Fallback` badge.
   - Click **"Copy"** and verify the "Copied!" notification.
   - Click **"Download"** and verify the `.txt` file downloads with the company and candidate name.

2. **Phase 2 Verification (With Gemini API Key):**
   - Add your valid Google Gemini API key to `.env`:
     ```env
     GEMINI_API_KEY=AIzaSy...
     ```
   - Restart the server (`npm start`).
   - Refresh `http://localhost:5000`. The header badge will update to `Gemini AI Online (gemini-3.5-flash)`.
   - Click **"Generate Cover Letter"**.
   - Notice the loading state and subsequent tailored output tagged with the `✨ Gemini AI` badge.

3. **Validation & Edge Cases:**
   - Click **"Reset"** to clear all fields.
   - Click **"Generate Cover Letter"** with empty fields.
   - Verify red highlighting and field-level error messages.

---

## 🔒 Security Best Practices

* **No Leaked Secrets:** Frontend JavaScript contains zero API keys or secrets. All AI interactions occur on the Express backend.
* **Git Protection:** `.env` and `node_modules` are explicitly added to `.gitignore`.
* **Input Sanitization:** Backend validates all payloads and trims inputs before processing.
