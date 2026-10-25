# CoverCraftAI ✨

### AI-Powered Cover Letter Generator

CoverCraftAI is a modern AI-powered web application that helps users create personalized, professional cover letters based on their career details, target job role, company, skills, and preferred writing tone.

Powered by Google's Gemini API, it generates tailored cover letters in seconds, making the application process easier and more efficient.

---

## 🚀 Features

* **AI-Powered Generation:** Generate personalized cover letters using Google Gemini AI.
* **Multiple Writing Tones:** Choose from four different styles:

  * Professional & Polished
  * Confident & High-Impact
  * Enthusiastic & Passionate
  * Creative & Visionary
* **Personalized Content:** Customize letters using candidate name, job role, target company, and key skills.
* **Template Fallback:** Automatically generates a professional template-based letter if the Gemini API is unavailable.
* **Copy to Clipboard:** Copy generated content instantly.
* **Download Cover Letter:** Download your generated letter as a `.txt` file.
* **Editable Output:** Make changes directly to the generated cover letter.
* **Word & Character Counter:** Track the length of your generated content.
* **Form Validation:** Ensures required information is provided before generation.
* **Responsive Interface:** Clean and user-friendly interface across different screen sizes.

---

## 🛠️ Tech Stack

| Technology        | Purpose                            |
| ----------------- | ---------------------------------- |
| HTML5             | Application structure              |
| CSS3              | Styling and responsive design      |
| JavaScript        | Frontend functionality             |
| Node.js           | Backend runtime                    |
| Express.js        | Backend server and API handling    |
| Google Gemini API | AI-powered cover letter generation |
| dotenv            | Environment variable management    |

---

## 📂 Project Structure

```text
CoverCraftAI/
│
├── backend/
│   └── server.js
│
├── frontend/
│   ├── index.html
│   ├── style.css
│   └── script.js
│
├── .env.example
├── .gitignore
├── package.json
├── package-lock.json
├── PROMPTS.md
├── README.md
└── test-endpoints.js
```

---

## ⚙️ How It Works

1. The user enters their name, target job role, company, and key skills.
2. A preferred writing tone is selected.
3. The frontend sends the candidate details to the backend.
4. The backend processes the request and communicates with the Gemini API.
5. Gemini generates a personalized cover letter based on the provided information.
6. The generated letter is displayed in the output section.
7. If the AI service is temporarily unavailable, the application uses its built-in template fallback mechanism.

---

## 🔐 API Key Security

CoverCraftAI uses environment variables to protect sensitive API credentials.

* Gemini API credentials are stored in the backend environment.
* API keys are not exposed in frontend JavaScript.
* `.env` is excluded through `.gitignore`.
* `.env.example` provides a reference for the required configuration.

Never publish your actual API key in a public repository.

---

## 🧪 Testing

The project includes a test script for checking important application behavior, including:

* Required-field validation.
* Cover letter generation.
* Backend API responses.
* Frontend static asset availability.
* Template fallback behavior.

---

## 🎯 Project Objective

The objective of CoverCraftAI is to simplify the cover letter creation process through AI-assisted personalization.

Instead of relying on generic templates, users can generate role-specific content that reflects their skills, strengths, and professional goals.

---

## 👨‍💻 Developer

**Naman Agarwal**

Computer Science Student | Frontend & Full-Stack Development

---

### Built with ❤️ using Node.js, Express.js & Google Gemini AI.
