/**
 * AI Suspicious Conversation Analyzer — Frontend Script
 *
 * Sends conversation text to the backend /analyze endpoint and
 * renders risk level, suspicious phrases, explanation, and safety advice.
 */

const API_BASE_URL = "http://localhost:8000";

// DOM elements
const conversationInput = document.getElementById("conversationInput");
const charCount = document.getElementById("charCount");
const analyzeBtn = document.getElementById("analyzeBtn");
const clearBtn = document.getElementById("clearBtn");
const retryBtn = document.getElementById("retryBtn");
const analyzeAnotherBtn = document.getElementById("analyzeAnotherBtn");

const loadingCard = document.getElementById("loadingCard");
const errorCard = document.getElementById("errorCard");
const errorMessage = document.getElementById("errorMessage");
const resultsCard = document.getElementById("resultsCard");

const riskBanner = document.getElementById("riskBanner");
const riskIcon = document.getElementById("riskIcon");
const riskLevel = document.getElementById("riskLevel");
const explanationText = document.getElementById("explanationText");
const phrasesSection = document.getElementById("phrasesSection");
const phrasesList = document.getElementById("phrasesList");
const adviceList = document.getElementById("adviceList");

// Risk configuration
const RISK_CONFIG = {
  LOW: {
    icon: "✅",
    label: "LOW RISK",
    cssClass: "risk-low",
  },
  MEDIUM: {
    icon: "⚠️",
    label: "MEDIUM RISK",
    cssClass: "risk-medium",
  },
  HIGH: {
    icon: "🔴",
    label: "HIGH RISK",
    cssClass: "risk-high",
  },
  CRITICAL: {
    icon: "🚨",
    label: "CRITICAL RISK",
    cssClass: "risk-critical",
  },
};

// ---- Character counter ----
conversationInput.addEventListener("input", () => {
  const len = conversationInput.value.length;
  const charCountEl = document.querySelector(".char-count");
  charCount.textContent = len.toLocaleString();

  charCountEl.classList.remove("warning", "danger");
  if (len > 18000) {
    charCountEl.classList.add("danger");
  } else if (len > 14000) {
    charCountEl.classList.add("warning");
  }
});

// ---- Clear button ----
clearBtn.addEventListener("click", () => {
  conversationInput.value = "";
  charCount.textContent = "0";
  document.querySelector(".char-count").classList.remove("warning", "danger");
  hideAllCards();
  conversationInput.focus();
});

// ---- Retry button ----
retryBtn.addEventListener("click", () => {
  hideAllCards();
  conversationInput.focus();
});

// ---- Analyze Another button ----
analyzeAnotherBtn.addEventListener("click", () => {
  hideAllCards();
  conversationInput.focus();
});

// ---- Main analyze action ----
analyzeBtn.addEventListener("click", analyzeConversation);

conversationInput.addEventListener("keydown", (e) => {
  // Allow Ctrl/Cmd + Enter to trigger analysis
  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
    analyzeConversation();
  }
});

function hideAllCards() {
  loadingCard.hidden = true;
  errorCard.hidden = true;
  resultsCard.hidden = true;
}

function setLoading(isLoading) {
  analyzeBtn.disabled = isLoading;
  clearBtn.disabled = isLoading;
  if (isLoading) {
    analyzeBtn.classList.add("loading");
    analyzeBtn.querySelector(".btn-text").textContent = "Analyzing…";
  } else {
    analyzeBtn.classList.remove("loading");
    analyzeBtn.querySelector(".btn-text").textContent = "Analyze Conversation";
  }
}

async function analyzeConversation() {
  const text = conversationInput.value.trim();

  if (!text) {
    showError("Please paste a conversation before clicking Analyze.");
    return;
  }

  hideAllCards();
  setLoading(true);
  loadingCard.hidden = false;

  try {
    const response = await fetch(`${API_BASE_URL}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation: text }),
    });

    const data = await response.json();

    if (!response.ok) {
      const detail = data.detail || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(detail);
    }

    renderResults(data);
  } catch (err) {
    let message = err.message;

    // Provide friendlier messages for network failures (TypeError indicates a network error)
    if (err instanceof TypeError) {
      message =
        "Could not connect to the backend server. Make sure the FastAPI server is running on http://localhost:8000.";
    }

    showError(message);
  } finally {
    setLoading(false);
    loadingCard.hidden = true;
  }
}

function showError(message) {
  hideAllCards();
  errorMessage.textContent = message;
  errorCard.hidden = false;
}

function renderResults(data) {
  hideAllCards();

  const level = (data.risk_level || "MEDIUM").toUpperCase();
  const config = RISK_CONFIG[level] || RISK_CONFIG.MEDIUM;

  // Risk banner
  riskBanner.className = `risk-banner ${config.cssClass}`;
  riskIcon.textContent = config.icon;
  riskLevel.textContent = config.label;

  // Explanation
  explanationText.textContent = data.explanation || "No explanation provided.";

  // Suspicious phrases
  phrasesList.innerHTML = "";
  const phrases = Array.isArray(data.suspicious_phrases) ? data.suspicious_phrases : [];

  if (phrases.length === 0) {
    const li = document.createElement("li");
    li.className = "no-phrases";
    li.textContent = "No suspicious phrases detected.";
    phrasesList.appendChild(li);
  } else {
    phrases.forEach((phrase) => {
      const li = document.createElement("li");
      li.textContent = phrase;
      phrasesList.appendChild(li);
    });
  }

  // Safety advice
  adviceList.innerHTML = "";
  const advice = Array.isArray(data.safety_advice) ? data.safety_advice : [];
  advice.forEach((tip) => {
    const li = document.createElement("li");
    li.textContent = tip;
    adviceList.appendChild(li);
  });

  resultsCard.hidden = false;
  resultsCard.scrollIntoView({ behavior: "smooth", block: "start" });
}
