# AI Assistance Prompts – Sprint 4

This document outlines 5 realistic, structured prompts used to guide the architecture, design, and implementation of the **Sprint 4 AI Cover Letter Generator**.

---

### Prompt 1: UI & Responsive SaaS Design (HTML & CSS)

> **Prompt:**  
> "Act as a Senior UI/UX Designer and Frontend Engineer. Design a modern, dark-themed SaaS interface for a Cover Letter Generator using semantic HTML5 and vanilla CSS. The layout must feature a responsive two-column grid on desktop that collapses smoothly on mobile devices.
>
> Requirements:
> - Left panel: Input form for Candidate Name, Target Job Role, Target Company, Key Skills (textarea), and Tone selection. Include glowing focus rings and field error states.
> - Right panel: Executive-style document output container with action buttons (Copy to Clipboard, Download as .txt), character/word counter, and mode indicator badges (`Gemini AI` vs `Template Fallback`).
> - Aesthetics: Atmospheric radial blur gradients, sleek slate/indigo color tokens, frosted glass backdrop filters (`backdrop-filter: blur(16px)`), and smooth micro-interactions. Avoid external CSS frameworks."

---

### Prompt 2: Backend Gemini API Integration (Node.js & Express)

> **Prompt:**  
> "You are a Backend Architect specializing in Node.js and AI APIs. Write an Express.js route `POST /api/generate-cover-letter` that integrates Google Gemini API using `@google/generative-ai`.
>
> Requirements:
> - Extract `candidateName`, `jobRole`, `targetCompany`, `keySkills`, and `tone` from the request body.
> - Construct a rigorous system prompt demanding a structured, persuasive 3-4 paragraph cover letter without conversational filler or markdown code fences.
> - Utilize model `gemini-1.5-flash` with dynamic model configuration via `process.env.GEMINI_MODEL`.
> - If `GEMINI_API_KEY` is missing or the external API call fails (rate limits, network failure, or invalid key), gracefully fall back to a high-quality template generator function so the client never receives an unhandled 500 error."

---

### Prompt 3: Async Frontend Flow & Resilient Fallback Logic

> **Prompt:**  
> "Create a vanilla JavaScript module to manage the asynchronous generation lifecycle of the cover letter tool.
>
> Requirements:
> - On submission, toggle the submit button to a loading state with an animated spinner, disable inputs, and display a blurred overlay with status text.
> - Send a `POST` request to `/api/generate-cover-letter`.
> - If the request succeeds with AI generation, display the text and set the badge to `Gemini AI`.
> - If the backend indicates a fallback or if the backend server is completely unreachable (offline/network failure), seamlessly invoke an embedded client-side template generator, inform the user via an alert banner, and tag the output as `Template Fallback`.
> - Ensure all loading states properly reset in a `finally` block."

---

### Prompt 4: Form Validation & Interactive Clipboard Handling

> **Prompt:**  
> "Implement user-friendly client-side form validation and interactive clipboard utilities in vanilla JavaScript.
>
> Requirements:
> - Validate that Candidate Name, Job Role, Target Company, and Key Skills are non-empty after trimming whitespace.
> - Display targeted error messages directly beneath invalid fields and apply red outline highlighting. Clear individual errors automatically on input.
> - For the 'Copy' button: Use `navigator.clipboard.writeText` with a graceful fallback to `document.execCommand('copy')` for non-secure contexts.
> - Provide immediate visual feedback: transform the button to 'Copied!' with a checkmark for 2 seconds and trigger an animated toast notification."

---

### Prompt 5: Security & Environment Variable Isolation

> **Prompt:**  
> "Review and audit the project structure of our Node.js and Express application for security and secrets management.
>
> Guidelines:
> - Ensure `GEMINI_API_KEY` is loaded exclusively on the backend using `dotenv` and never transmitted to or bundled in the frontend.
> - Create a `.env.example` file populated with placeholder values documenting all required keys (`PORT`, `GEMINI_API_KEY`, `GEMINI_MODEL`).
> - Configure `.gitignore` to prevent `.env`, `node_modules`, debug logs, and operating system metadata files from being tracked.
> - Provide clear instructions in the README on how developers can securely configure their API credentials locally."
