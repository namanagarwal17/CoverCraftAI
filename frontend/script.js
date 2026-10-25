/**
 * Sprint 4: AI Cover Letter Generator
 * Frontend Logic: Form Validation, Gemini API Integration, Template Fallbacks,
 * Clipboard Handling, Word/Character counting, and UI State Management.
 */

// Determine API Base URL (works if served via Express port 5000 or standalone frontend)
const API_BASE_URL = (window.location.protocol.startsWith('http') && window.location.port === '5000')
  ? ''
  : 'http://localhost:5000';

// DOM Elements
const form = document.getElementById('coverLetterForm');
const candidateNameInput = document.getElementById('candidateName');
const jobRoleInput = document.getElementById('jobRole');
const targetCompanyInput = document.getElementById('targetCompany');
const keySkillsInput = document.getElementById('keySkills');
const toneSelect = document.getElementById('toneSelect');

// Error Elements
const candidateNameError = document.getElementById('candidateNameError');
const jobRoleError = document.getElementById('jobRoleError');
const targetCompanyError = document.getElementById('targetCompanyError');
const keySkillsError = document.getElementById('keySkillsError');

// Button Elements
const generateBtn = document.getElementById('generateBtn');
const btnIcon = generateBtn.querySelector('.btn-icon');
const btnText = generateBtn.querySelector('.btn-text');
const btnLoader = generateBtn.querySelector('.btn-loader');
const copyBtn = document.getElementById('copyBtn');
const copyBtnText = document.getElementById('copyBtnText');
const downloadBtn = document.getElementById('downloadBtn');
const clearFormBtn = document.getElementById('clearFormBtn');
const fillDemoBtn = document.getElementById('fillDemoBtn');

// Output Container Elements
const emptyState = document.getElementById('emptyState');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingSubtitle = document.getElementById('loadingSubtitle');
const resultContainer = document.getElementById('resultContainer');
const coverLetterOutput = document.getElementById('coverLetterOutput');
const outputBadge = document.getElementById('outputBadge');
const outputBadgeText = document.getElementById('outputBadgeText');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');

// Status & Notification Elements
const connectionStatus = document.getElementById('connectionStatus');
const connectionStatusText = document.getElementById('connectionStatusText');
const alertBanner = document.getElementById('alertBanner');
const alertMessage = document.getElementById('alertMessage');
const alertCloseBtn = document.getElementById('alertCloseBtn');
const toastEl = document.getElementById('toast');

let toastTimeout = null;

// ============================================================================
// Initialization & Backend Health Check
// ============================================================================

document.addEventListener('DOMContentLoaded', () => {
  checkBackendStatus();
  attachInputValidationListeners();
  attachActionListeners();
});

/**
 * Check backend status and whether Gemini API Key is configured
 */
async function checkBackendStatus() {
  updateStatusPill('checking', 'Connecting to backend...');

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(`${API_BASE_URL}/api/status`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.geminiConfigured) {
        updateStatusPill('connected', `Gemini AI Online (${data.model})`);
      } else {
        updateStatusPill('template', 'Template Mode (No API Key)');
      }
    } else {
      updateStatusPill('template', 'Backend Connected (Template)');
    }
  } catch (err) {
    console.warn('Backend server not detected or slow to respond:', err.message);
    updateStatusPill('template', 'Offline / Local Template Engine');
  }
}

function updateStatusPill(type, text) {
  connectionStatus.className = 'status-pill';
  connectionStatusText.textContent = text;

  if (type === 'connected') {
    connectionStatus.classList.add('status-connected');
  } else if (type === 'template') {
    connectionStatus.classList.add('status-template');
  } else {
    connectionStatus.classList.add('status-checking');
  }
}

// ============================================================================
// Client-Side Template Generator (Phase 1 & Resilient Offline Fallback)
// ============================================================================

function generateClientTemplate({ candidateName, jobRole, targetCompany, keySkills, tone }) {
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
    : (skillsList[0] || 'strategic problem-solving and software design');

  const topSkill = skillsList[0] || 'technical excellence';
  const secondarySkill = skillsList[1] || 'cross-functional collaboration';

  let opening = '';
  let body = '';
  let closing = '';

  const toneLower = (tone || 'professional').toLowerCase();

  if (toneLower === 'enthusiastic') {
    opening = `I was absolutely thrilled to come across the ${jobRole} opening at ${targetCompany}. With a strong background in ${topSkill} and a passion for high-impact innovation, I would love to bring my energy, dedication, and technical acumen to your distinguished organization.`;
    body = `Throughout my work, I have focused on mastering ${skillsHighlight}. I have followed ${targetCompany}'s achievements closely and deeply admire your engineering standards and vision. In this role, I am excited to apply my capabilities in ${secondarySkill} to conquer complex technical challenges and accelerate your team's goals.`;
    closing = `I would welcome the opportunity to discuss how my enthusiasm and skill set align with ${targetCompany}'s upcoming initiatives. Thank you for your consideration!`;
  } else if (toneLower === 'confident') {
    opening = `I am writing to express my strong interest in the ${jobRole} role at ${targetCompany}. With deep hands-on proficiency in ${topSkill}, I bring a decisive, outcome-focused mindset that consistently transforms complex objectives into high-value results.`;
    body = `My core competencies include ${skillsHighlight}. Over the course of my career, I have repeatedly driven impactful projects from concept to delivery, emphasizing performance, reliability, and scale. Given ${targetCompany}'s reputation for excellence, I am confident that my experience in ${secondarySkill} makes me an ideal fit for your high-performing team.`;
    closing = `I look forward to discussing how my experience and track record of delivering measurable outcomes will support ${targetCompany}'s strategic goals. Thank you for your time and consideration.`;
  } else if (toneLower === 'creative') {
    opening = `Exceptional products flourish at the intersection of creative thinking and solid execution. That is why the ${jobRole} opportunity at ${targetCompany} resonates so strongly with me. With proven expertise in ${skillsHighlight}, I specialize in crafting elegant, scalable solutions to demanding problems.`;
    body = `What excites me most about ${targetCompany} is your forward-thinking approach. My foundation in ${topSkill} has taught me to rethink conventional boundaries, while my proficiency in ${secondarySkill} ensures that every concept is grounded in engineering rigor. I am eager to contribute this balanced, inventive perspective to your team.`;
    closing = `I would appreciate the chance to share how my unique perspective and technical skills can help shape ${targetCompany}'s next chapter. Thank you for your time and thoughtful review.`;
  } else {
    // Professional (default)
    opening = `Please accept this application and credentials as an expression of my serious interest in the ${jobRole} position at ${targetCompany}. With demonstrated experience in ${topSkill} and a commitment to operational excellence, I am confident in my ability to make an immediate, positive impact on your team.`;
    body = `My professional background includes comprehensive experience across ${skillsHighlight}. I pride myself on architecting dependable solutions, optimizing team velocity, and delivering measurable business value. I have long admired ${targetCompany}'s leadership in the industry, and I am especially excited to contribute my capabilities in ${secondarySkill} toward your ongoing objectives.`;
    closing = `Thank you for your time, consideration, and review of my application. I welcome the opportunity to speak with you regarding how my technical qualifications and work ethic can benefit ${targetCompany}.`;
  }

  return `${candidateName}
${currentDate}

Hiring Committee
${targetCompany}

Dear Hiring Team at ${targetCompany},

${opening}

${body}

${closing}

Sincerely,

${candidateName}`;
}

// ============================================================================
// Form Validation & Input Handling
// ============================================================================

function attachInputValidationListeners() {
  const inputs = [
    { el: candidateNameInput, err: candidateNameError },
    { el: jobRoleInput, err: jobRoleError },
    { el: targetCompanyInput, err: targetCompanyError },
    { el: keySkillsInput, err: keySkillsError }
  ];

  inputs.forEach(({ el, err }) => {
    el.addEventListener('input', () => {
      if (el.value.trim()) {
        el.classList.remove('input-invalid');
        err.textContent = '';
      }
    });
  });

  coverLetterOutput.addEventListener('input', updateCounts);
}

function validateForm() {
  let isValid = true;
  let firstInvalid = null;

  if (!candidateNameInput.value.trim()) {
    candidateNameInput.classList.add('input-invalid');
    candidateNameError.textContent = 'Please enter candidate name.';
    isValid = false;
    firstInvalid = firstInvalid || candidateNameInput;
  } else {
    candidateNameInput.classList.remove('input-invalid');
    candidateNameError.textContent = '';
  }

  if (!jobRoleInput.value.trim()) {
    jobRoleInput.classList.add('input-invalid');
    jobRoleError.textContent = 'Please enter target job role.';
    isValid = false;
    firstInvalid = firstInvalid || jobRoleInput;
  } else {
    jobRoleInput.classList.remove('input-invalid');
    jobRoleError.textContent = '';
  }

  if (!targetCompanyInput.value.trim()) {
    targetCompanyInput.classList.add('input-invalid');
    targetCompanyError.textContent = 'Please enter target company.';
    isValid = false;
    firstInvalid = firstInvalid || targetCompanyInput;
  } else {
    targetCompanyInput.classList.remove('input-invalid');
    targetCompanyError.textContent = '';
  }

  if (!keySkillsInput.value.trim()) {
    keySkillsInput.classList.add('input-invalid');
    keySkillsError.textContent = 'Please enter key skills or competencies.';
    isValid = false;
    firstInvalid = firstInvalid || keySkillsInput;
  } else {
    keySkillsInput.classList.remove('input-invalid');
    keySkillsError.textContent = '';
  }

  if (!isValid && firstInvalid) {
    firstInvalid.focus();
  }

  return isValid;
}

// ============================================================================
// Cover Letter Generation Logic (Phase 1 & Phase 2)
// ============================================================================

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  hideAlert();

  if (!validateForm()) {
    showAlert('Please fill in all required fields before generating your cover letter.', 'error');
    return;
  }

  const engineMode = document.querySelector('input[name="engineMode"]:checked')?.value || 'auto';
  const forceTemplate = engineMode === 'template';

  const payload = {
    candidateName: candidateNameInput.value.trim(),
    jobRole: jobRoleInput.value.trim(),
    targetCompany: targetCompanyInput.value.trim(),
    keySkills: keySkillsInput.value.trim(),
    tone: toneSelect.value,
    forceTemplate
  };

  setLoading(true, forceTemplate ? 'Generating using professional template...' : 'Consulting Gemini AI & crafting tailored letter...');

  try {
    let coverLetterText = '';
    let sourceMode = 'template';
    let alertNotice = null;

    // If template mode is explicitly selected, skip backend API call or call backend template
    if (forceTemplate) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const data = await res.json();
          coverLetterText = data.coverLetter;
          sourceMode = 'template';
        } else {
          coverLetterText = generateClientTemplate(payload);
          sourceMode = 'template';
        }
      } catch {
        coverLetterText = generateClientTemplate(payload);
        sourceMode = 'template';
      }
    } else {
      // Auto Mode: Attempt Backend Gemini Generation with automatic Fallback
      try {
        const res = await fetch(`${API_BASE_URL}/api/generate-cover-letter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await res.json();

        if (res.ok && data.success) {
          coverLetterText = data.coverLetter;
          sourceMode = data.source; // 'gemini' or 'template-fallback'

          if (sourceMode === 'template-fallback') {
            alertNotice = {
              msg: data.message || 'AI service unavailable or API key not set. Generated using template fallback.',
              type: 'warning'
            };
          } else {
            showToast('AI Cover Letter generated successfully!', 'success');
          }
        } else {
          // Backend returned error (e.g. 500 or validation)
          console.warn('Backend returned non-success:', data);
          coverLetterText = generateClientTemplate(payload);
          sourceMode = 'template-fallback';
          alertNotice = {
            msg: `Backend notice: ${data.error || 'Switched to fallback template'}. Generated successfully via template!`,
            type: 'warning'
          };
        }
      } catch (networkErr) {
        // Backend completely unreachable (e.g., node server not running)
        console.warn('Backend fetch failed, using client-side template generator:', networkErr);
        coverLetterText = generateClientTemplate(payload);
        sourceMode = 'template-fallback';
        alertNotice = {
          msg: 'Backend server not reachable at http://localhost:5000. Generated immediately via client-side template engine!',
          type: 'info'
        };
      }
    }

    displayCoverLetter(coverLetterText, sourceMode);

    if (alertNotice) {
      showAlert(alertNotice.msg, alertNotice.type);
    }
  } catch (unexpectedError) {
    console.error('Generation error:', unexpectedError);
    showAlert('An error occurred during generation. Falling back to template.', 'error');
    const fallbackText = generateClientTemplate(payload);
    displayCoverLetter(fallbackText, 'template');
  } finally {
    setLoading(false);
  }
});

// ============================================================================
// Display & Output State Handling
// ============================================================================

function displayCoverLetter(text, source) {
  emptyState.classList.add('hidden');
  resultContainer.classList.remove('hidden');

  coverLetterOutput.value = text;
  updateCounts();

  // Enable action buttons
  copyBtn.disabled = false;
  downloadBtn.disabled = false;

  // Update Badge
  outputBadge.classList.remove('hidden', 'badge-gemini', 'badge-template');
  if (source === 'gemini') {
    outputBadge.classList.add('badge-gemini');
    outputBadgeText.textContent = '✨ Gemini AI';
  } else {
    outputBadge.classList.add('badge-template');
    outputBadgeText.textContent = '⚡ Template Fallback';
  }
}

function updateCounts() {
  const text = coverLetterOutput.value || '';
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const chars = text.length;

  wordCountEl.textContent = `${words} ${words === 1 ? 'word' : 'words'}`;
  charCountEl.textContent = `${chars} ${chars === 1 ? 'character' : 'characters'}`;
}

function setLoading(isLoading, subtitleText = '') {
  if (isLoading) {
    generateBtn.disabled = true;
    btnIcon.classList.add('hidden');
    btnLoader.classList.remove('hidden');
    btnText.textContent = 'Generating...';

    if (subtitleText) {
      loadingSubtitle.textContent = subtitleText;
    }
    loadingOverlay.classList.remove('hidden');
  } else {
    generateBtn.disabled = false;
    btnIcon.classList.remove('hidden');
    btnLoader.classList.add('hidden');
    btnText.textContent = 'Generate Cover Letter';
    loadingOverlay.classList.add('hidden');
  }
}

// ============================================================================
// Actions: Copy, Download, Demo Data, Reset
// ============================================================================

function attachActionListeners() {
  // Copy to Clipboard
  copyBtn.addEventListener('click', async () => {
    const text = coverLetterOutput.value;
    if (!text) return;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for non-HTTPS or older browsers
        coverLetterOutput.select();
        document.execCommand('copy');
      }

      copyBtnText.textContent = 'Copied!';
      showToast('Cover letter copied to clipboard!', 'success');
      setTimeout(() => {
        copyBtnText.textContent = 'Copy';
      }, 2000);
    } catch (err) {
      console.error('Copy failed:', err);
      showToast('Could not copy automatically. Please select text manually.', 'error');
    }
  });

  // Download as .txt file
  downloadBtn.addEventListener('click', () => {
    const text = coverLetterOutput.value;
    if (!text) return;

    const company = (targetCompanyInput.value.trim() || 'Company').replace(/[^a-zA-Z0-9_-]/g, '_');
    const role = (jobRoleInput.value.trim() || 'Role').replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `Cover_Letter_${company}_${role}.txt`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast(`Downloaded ${filename}`, 'success');
  });

  // Fill Demo Data
  fillDemoBtn.addEventListener('click', () => {
    candidateNameInput.value = 'Sophia Ramirez';
    jobRoleInput.value = 'Senior Full Stack Engineer';
    targetCompanyInput.value = 'Stripe';
    keySkillsInput.value = 'Node.js, Express, React, TypeScript, Distributed Systems, REST APIs, System Design, CI/CD';
    toneSelect.value = 'confident';

    // Clear any previous error styling
    [candidateNameInput, jobRoleInput, targetCompanyInput, keySkillsInput].forEach(el => {
      el.classList.remove('input-invalid');
    });
    candidateNameError.textContent = '';
    jobRoleError.textContent = '';
    targetCompanyError.textContent = '';
    keySkillsError.textContent = '';

    showToast('Loaded demo candidate profile!', 'success');
  });

  // Reset Form
  clearFormBtn.addEventListener('click', () => {
    form.reset();
    [candidateNameInput, jobRoleInput, targetCompanyInput, keySkillsInput].forEach(el => {
      el.classList.remove('input-invalid');
    });
    candidateNameError.textContent = '';
    jobRoleError.textContent = '';
    targetCompanyError.textContent = '';
    keySkillsError.textContent = '';

    coverLetterOutput.value = '';
    resultContainer.classList.add('hidden');
    emptyState.classList.remove('hidden');
    outputBadge.classList.add('hidden');
    copyBtn.disabled = true;
    downloadBtn.disabled = true;
    hideAlert();
    showToast('Form reset.', 'info');
  });

  // Alert close
  alertCloseBtn.addEventListener('click', hideAlert);
}

// ============================================================================
// UI Feedback: Alerts & Toasts
// ============================================================================

function showAlert(message, type = 'info') {
  alertBanner.className = `alert-banner alert-${type}`;
  alertMessage.textContent = message;
  alertBanner.classList.remove('hidden');
}

function hideAlert() {
  alertBanner.classList.add('hidden');
}

function showToast(message, type = 'info') {
  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastEl.textContent = message;
  toastEl.className = `toast toast-${type}`;
  toastEl.classList.remove('hidden');

  toastTimeout = setTimeout(() => {
    toastEl.classList.add('hidden');
  }, 3200);
}
