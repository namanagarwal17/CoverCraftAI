const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from root .env
dotenv.config({ path: path.join(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files
app.use(express.static(path.join(__dirname, '../frontend')));

/**
 * Helper to generate a well-crafted template-based cover letter.
 * Used for Phase 1 (No API key) and as a resilient fallback for Phase 2.
 */
function generateTemplateCoverLetter({ candidateName, jobRole, targetCompany, keySkills, tone = 'professional' }) {
  const currentDate = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const skillsList = keySkills
    .split(/[,;\n]+/)
    .map(s => s.trim())
    .filter(Boolean);

  const skillsHighlight = skillsList.length > 1
    ? `${skillsList.slice(0, -1).join(', ')} and ${skillsList[skillsList.length - 1]}`
    : (skillsList[0] || 'technical innovation and strategic problem-solving');

  const topSkill = skillsList[0] || 'delivering high-impact results';
  const secondarySkill = skillsList[1] || 'collaborative execution';

  let openingParagraph = '';
  let bodyParagraph = '';
  let closingParagraph = '';

  const toneLower = tone.toLowerCase();

  if (toneLower === 'enthusiastic') {
    openingParagraph = `I was thrilled to discover the opening for the ${jobRole} position at ${targetCompany}. With a passionate background in ${topSkill} and a proven commitment to excellence, I am eager to bring my energy, expertise, and fresh perspective to your innovative team.`;
    bodyParagraph = `Throughout my journey, I have focused heavily on mastering ${skillsHighlight}. At ${targetCompany}, your mission and standard of craftsmanship truly resonate with me. In this role, I am excited to apply my hands-on experience in ${secondarySkill} to tackle complex challenges, accelerate project velocity, and deliver measurable value to your stakeholders.`;
    closingParagraph = `I would welcome the opportunity to discuss how my dedication and skills align with ${targetCompany}'s future milestones. Thank you for your time, consideration, and the opportunity to contribute to your continued success.`;
  } else if (toneLower === 'confident') {
    openingParagraph = `I am writing to express my strong candidacy for the ${jobRole} role at ${targetCompany}. Having honed core expertise in ${topSkill}, I offer a decisive, results-oriented approach that consistently translates strategic goals into tangible business impact.`;
    bodyParagraph = `My technical and professional toolkit is centered on ${skillsHighlight}. I have repeatedly demonstrated the ability to lead critical initiatives, streamline workflows, and drive quantifiable outcomes. Given ${targetCompany}'s position as an industry leader, I am confident that my specialized capabilities in ${secondarySkill} will allow me to immediately contribute to your high-performing team.`;
    closingParagraph = `I look forward to discussing how my experience and track record of delivering measurable results will support ${targetCompany}'s strategic objectives. Thank you for your consideration.`;
  } else if (toneLower === 'creative') {
    openingParagraph = `Great products are built at the intersection of creative thinking and solid execution. That is precisely why the ${jobRole} role at ${targetCompany} caught my attention. With hands-on proficiency in ${skillsHighlight}, I specialize in turning ambitious ideas into polished, user-centric realities.`;
    bodyParagraph = `What draws me to ${targetCompany} is your forward-thinking approach to problem-solving. My core background in ${topSkill} has taught me to look beyond conventional solutions, while my experience in ${secondarySkill} ensures that every initiative is grounded in reliability and scalability. I am eager to bring this balanced, innovative mindset to your team.`;
    closingParagraph = `I would love the opportunity to share how my unique perspective and technical skill set can help shape ${targetCompany}'s upcoming initiatives. Thank you for your time and thoughtful consideration.`;
  } else {
    // Default: Professional
    openingParagraph = `Please accept this letter and the accompanying credentials as an expression of my sincere interest in the ${jobRole} position at ${targetCompany}. With demonstrated proficiency in ${topSkill} and a track record of driving impactful solutions, I am confident in my ability to make an immediate, positive contribution to your organization.`;
    bodyParagraph = `Over the course of my career, I have developed comprehensive competencies across ${skillsHighlight}. I pride myself on delivering clean, scalable, and well-architected outcomes while collaborating effectively across cross-functional teams. I have long admired ${targetCompany}'s dedication to innovation and quality, and I am particularly drawn to this role because it offers the ideal platform to leverage my background in ${secondarySkill}.`;
    closingParagraph = `Thank you for your time and consideration of my application. I look forward to the possibility of discussing how my experience, skills, and work ethic will benefit ${targetCompany} in greater detail.`;
  }

  return `${candidateName}
${currentDate}

Hiring Committee
${targetCompany}

Dear Hiring Team at ${targetCompany},

${openingParagraph}

${bodyParagraph}

${closingParagraph}

Sincerely,

${candidateName}`;
}

/**
 * Helper to delay execution (short backoff for retry)
 */
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Executes Gemini content generation with retry logic for transient errors (503 / 429).
 * Maximum 2 retries (3 attempts total) with backoff to prevent infinite loops.
 */
async function generateGeminiWithRetry(genAI, primaryModelName, prompt, maxRetries = 2) {
  let attempt = 0;
  let currentModelName = primaryModelName;

  while (attempt <= maxRetries) {
    try {
      const model = genAI.getGenerativeModel({ model: currentModelName });
      const result = await model.generateContent(prompt);
      return { result, usedModel: currentModelName };
    } catch (err) {
      attempt++;
      const errMsg = typeof err.message === 'string' ? err.message : '';
      const isTransient =
        err.status === 503 ||
        err.status === 429 ||
        errMsg.includes('503') ||
        errMsg.includes('429') ||
        errMsg.includes('high demand') ||
        errMsg.includes('ResourceExhausted') ||
        errMsg.includes('Service Unavailable');

      if (isTransient && attempt <= maxRetries) {
        const waitTime = attempt * 1500; // 1.5s, 3.0s
        console.warn(`[Gemini API] Transient ${err.status || 503} on ${currentModelName}. Retrying in ${waitTime}ms (attempt ${attempt}/${maxRetries})...`);
        await delay(waitTime);
        continue;
      }

      // If the primary model failed due to 503 capacity limit and wasn't gemini-3.5-flash,
      // try a quick fallback attempt with gemini-3.5-flash before reverting to template
      if (isTransient && currentModelName !== 'gemini-3.5-flash') {
        console.warn(`[Gemini API] Primary model ${currentModelName} unavailable after retries. Attempting fallback flash model gemini-3.5-flash...`);
        try {
          const fallbackModel = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' });
          const result = await fallbackModel.generateContent(prompt);
          return { result, usedModel: 'gemini-3.5-flash' };
        } catch (fallbackErr) {
          console.warn(`[Gemini API] Fallback flash model also unavailable:`, (fallbackErr.message || '').replace(/key=[^&\s]+/gi, 'key=[REDACTED]'));
        }
      }

      throw err;
    }
  }
}

/**
 * Health & Configuration Status Check
 */
app.get('/api/status', (req, res) => {
  const rawKey = process.env.GEMINI_API_KEY || '';
  const apiKey = rawKey.trim();
  const isKeyConfigured = Boolean(
    apiKey &&
    apiKey !== 'your_gemini_api_key_here'
  );

  res.json({
    status: 'ok',
    geminiConfigured: isKeyConfigured,
    model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * Cover Letter Generation Endpoint
 * Handles:
 * - Direct template generation (Phase 1)
 * - Gemini API generation with retries (Phase 2)
 * - Automatic graceful fallback to template if Gemini API fails or key is missing
 */
app.post('/api/generate-cover-letter', async (req, res) => {
  try {
    const { candidateName, jobRole, targetCompany, keySkills, tone, forceTemplate } = req.body;

    // Basic Validation
    if (!candidateName || !candidateName.trim()) {
      return res.status(400).json({ success: false, error: 'Candidate Name is required.' });
    }
    if (!jobRole || !jobRole.trim()) {
      return res.status(400).json({ success: false, error: 'Job Role is required.' });
    }
    if (!targetCompany || !targetCompany.trim()) {
      return res.status(400).json({ success: false, error: 'Target Company is required.' });
    }
    if (!keySkills || !keySkills.trim()) {
      return res.status(400).json({ success: false, error: 'Key Skills are required.' });
    }

    const payload = {
      candidateName: candidateName.trim(),
      jobRole: jobRole.trim(),
      targetCompany: targetCompany.trim(),
      keySkills: keySkills.trim(),
      tone: tone || 'professional'
    };

    // Phase 1: Explicit Template Mode requested
    if (forceTemplate === true) {
      const coverLetter = generateTemplateCoverLetter(payload);
      return res.json({
        success: true,
        source: 'template-fallback',
        message: 'Cover letter generated successfully using structured professional template.',
        coverLetter
      });
    }

    // Check if GEMINI_API_KEY is configured (always trim to avoid whitespace bugs)
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();
    const isKeyConfigured = Boolean(
      apiKey &&
      apiKey !== 'your_gemini_api_key_here'
    );

    // If no valid API key is configured, fallback to template gracefully (Phase 1 requirement)
    if (!isKeyConfigured) {
      const coverLetter = generateTemplateCoverLetter(payload);
      return res.json({
        success: true,
        source: 'template-fallback',
        message: 'No GEMINI_API_KEY configured in .env. Generated using professional template fallback.',
        coverLetter
      });
    }

    // Phase 2: Call Google Gemini API
    const modelName = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(apiKey);

      const currentDate = new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      });

      const structuredPrompt = `You are an expert executive career advisor and professional cover letter writer.
Write a highly compelling, tailored, and professional cover letter based on the following candidate information:

- Candidate Name: ${payload.candidateName}
- Target Job Role: ${payload.jobRole}
- Target Company: ${payload.targetCompany}
- Core Skills / Competencies: ${payload.keySkills}
- Tone / Style: ${payload.tone}
- Date: ${currentDate}

Formatting & Content Requirements:
1. Include a clean, standard header layout:
   - Candidate Name
   - ${currentDate}
   - Hiring Team / Department
   - ${payload.targetCompany}
2. Salutation: "Dear Hiring Team at ${payload.targetCompany},"
3. Write 3 to 4 cohesive, impactful paragraphs:
   - Engaging opening that immediately hooks the reader and references the ${payload.jobRole} role at ${payload.targetCompany}.
   - 1-2 body paragraphs connecting the candidate's specific skills (${payload.keySkills}) to tangible value, problem-solving, and innovation for ${payload.targetCompany}.
   - Confident closing paragraph with an interview call-to-action.
4. Closing: "Sincerely," followed by the candidate's name (${payload.candidateName}).
5. Strictly output ONLY the plain text cover letter. Do not include markdown code block backticks (\`\`\`), no introductory explanations, and no concluding remarks.`;

      const { result, usedModel } = await generateGeminiWithRetry(genAI, modelName, structuredPrompt);
      const response = await result.response;
      let generatedText = response.text();

      // Clean up any extraneous code fences or wrapping if present
      if (generatedText) {
        generatedText = generatedText
          .replace(/^```[a-z]*\s*/i, '')
          .replace(/```\s*$/i, '')
          .trim();
      }

      if (!generatedText) {
        throw new Error('Gemini API returned an empty response.');
      }

      return res.json({
        success: true,
        source: 'gemini',
        model: usedModel,
        message: 'Cover letter generated successfully with Google Gemini AI.',
        coverLetter: generatedText
      });
    } catch (apiError) {
      const safeErrorMsg = (apiError.message || 'Service unavailable')
        .replace(/key=[^&\s]+/gi, 'key=[REDACTED]');
      console.error('Gemini API generation error (falling back to template):', safeErrorMsg);

      // Safe fallback to template on API failure so user experience is uninterrupted
      const coverLetter = generateTemplateCoverLetter(payload);
      return res.json({
        success: true,
        source: 'template-fallback',
        message: `Gemini AI temporarily unavailable (${apiError.status || 503}). Generated using professional template fallback.`,
        coverLetter
      });
    }
  } catch (err) {
    console.error('Internal server error:', err.message || err);
    return res.status(500).json({
      success: false,
      error: 'An unexpected internal error occurred. Please try again.'
    });
  }
});

// Fallback to index.html for root or unmatched routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Start server
app.listen(PORT, () => {
  const key = (process.env.GEMINI_API_KEY || '').trim();
  const mode = (key && key !== 'your_gemini_api_key_here') ? 'Gemini AI Ready ✓' : 'Template Fallback Mode';
  const model = process.env.GEMINI_MODEL || 'gemini-3.5-flash';
  console.log(`=====================================================`);
  console.log(` Sprint 4 - AI Cover Letter Generator               `);
  console.log(` Server  : http://localhost:${PORT}                 `);
  console.log(` Mode    : ${mode}                 `);
  console.log(` Model   : ${model}                          `);
  console.log(`=====================================================`);
});

