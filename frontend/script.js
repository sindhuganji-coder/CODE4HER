/**
 * AI Suspicious Conversation Analyzer – Frontend Script
 * Communicates with the FastAPI backend at /analyze.
 */

const API_BASE = "http://localhost:8000";
const MAX_CHARS = 20000;

const RISK_META = {
  LOW: {
    icon: "✅",
    description: "No significant threats detected. The conversation appears safe.",
  },
  MEDIUM: {
    icon: "⚠️",
    description: "Some concerning patterns found. Exercise caution.",
  },
  HIGH: {
    icon: "🚨",
    description: "Clear indicators of harmful behavior. Take action and stay safe.",
  },
  CRITICAL: {
    icon: "🆘",
    description: "Immediate danger signals detected. Act now – your safety is at risk.",
  },
};

// ──────────────────────────────────────────────────────────────
// Character counter
// ──────────────────────────────────────────────────────────────
const textarea = document.getElementById("conversationInput");
const charCount = document.getElementById("charCount");

textarea.addEventListener("input", () => {
  const len = textarea.value.length;
  charCount.textContent = `${len.toLocaleString()} / ${MAX_CHARS.toLocaleString()} characters`;
  charCount.classList.toggle("over-limit", len > MAX_CHARS);
});

// ──────────────────────────────────────────────────────────────
// Main analysis function
// ──────────────────────────────────────────────────────────────
async function analyzeConversation() {
  const conversation = textarea.value.trim();

  if (!conversation) {
    showError("Please paste a conversation before clicking Analyze.");
    return;
  }
  if (conversation.length > MAX_CHARS) {
    showError(`Conversation is too long. Please keep it under ${MAX_CHARS.toLocaleString()} characters.`);
    return;
  }

  hideError();
  showLoading(true);
  hideResults();

  try {
    const response = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const detail = errorData.detail || `Server error (HTTP ${response.status}).`;
      throw new Error(detail);
    }

    const data = await response.json();
    renderResults(data);
  } catch (err) {
    if (err instanceof TypeError && err.message.includes("fetch")) {
      showError(
        "Cannot connect to the backend. Make sure the FastAPI server is running on http://localhost:8000."
      );
    } else {
      showError(err.message || "An unexpected error occurred.");
    }
  } finally {
    showLoading(false);
  }
}

// ──────────────────────────────────────────────────────────────
// Render results
// ──────────────────────────────────────────────────────────────
function renderResults(data) {
  const riskLevel = (data.risk_level || "LOW").toUpperCase();
  const meta = RISK_META[riskLevel] || RISK_META.LOW;

  // Risk card
  const riskCard = document.getElementById("riskCard");
  riskCard.className = `card risk-card risk-${riskLevel}`;
  document.getElementById("riskIcon").textContent = meta.icon;
  document.getElementById("riskValue").textContent = riskLevel;
  document.getElementById("riskDescription").textContent = meta.description;

  // Explanation
  document.getElementById("explanation").textContent =
    data.explanation || "No explanation provided.";

  // Suspicious phrases
  const phrasesList = document.getElementById("suspiciousPhrases");
  const noPhrases = document.getElementById("noPhrases");
  phrasesList.innerHTML = "";

  const phrases = Array.isArray(data.suspicious_phrases) ? data.suspicious_phrases : [];
  if (phrases.length > 0) {
    phrases.forEach((phrase) => {
      const li = document.createElement("li");
      li.textContent = `"${sanitize(phrase)}"`;
      phrasesList.appendChild(li);
    });
    noPhrases.classList.add("hidden");
    phrasesList.classList.remove("hidden");
  } else {
    noPhrases.classList.remove("hidden");
    phrasesList.classList.add("hidden");
  }

  // Safety advice
  const adviceList = document.getElementById("safetyAdvice");
  adviceList.innerHTML = "";
  const advice = Array.isArray(data.safety_advice) ? data.safety_advice : [];
  advice.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = sanitize(item);
    adviceList.appendChild(li);
  });

  document.getElementById("results").classList.remove("hidden");
  document.getElementById("results").scrollIntoView({ behavior: "smooth", block: "start" });
}

// ──────────────────────────────────────────────────────────────
// Reset
// ──────────────────────────────────────────────────────────────
function resetForm() {
  textarea.value = "";
  charCount.textContent = `0 / ${MAX_CHARS.toLocaleString()} characters`;
  charCount.classList.remove("over-limit");
  hideResults();
  hideError();
  textarea.focus();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────
function showLoading(visible) {
  document.getElementById("loading").classList.toggle("hidden", !visible);
  document.getElementById("analyzeBtn").disabled = visible;
}

function hideResults() {
  document.getElementById("results").classList.add("hidden");
}

function showError(message) {
  const banner = document.getElementById("errorBanner");
  document.getElementById("errorMessage").textContent = message;
  banner.classList.remove("hidden");
}

function hideError() {
  document.getElementById("errorBanner").classList.add("hidden");
}

/** Prevent XSS by escaping HTML special characters in displayed text. */
function sanitize(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
