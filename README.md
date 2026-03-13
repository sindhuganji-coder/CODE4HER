# 🛡️ AI Suspicious Conversation Analyzer

An AI-powered full-stack web application that detects **scams, grooming, manipulation, and harassment** in conversation text using **Google Gemini AI**.

---

## ✨ Features

- 🚨 **Scam Detection** — Identifies phishing, money requests, gift card scams, and impersonation
- ⚠️ **Grooming Detection** — Detects inappropriate adult-to-minor interactions and isolation tactics
- 🔍 **Manipulation Detection** — Spots gaslighting, emotional blackmail, and coercive control
- 🛑 **Harassment Detection** — Flags threats, cyberbullying, and intimidation
- 📊 **Risk Level Rating** — LOW / MEDIUM / HIGH / CRITICAL
- 🚩 **Suspicious Phrase Highlighting** — Pinpoints the exact phrases that triggered the alert
- 💡 **Safety Advice** — Provides actionable safety recommendations

---

## 🗂️ Project Structure

```
CODE4HER/
├── backend/
│   ├── main.py            # FastAPI app with /analyze endpoint
│   ├── requirements.txt   # Python dependencies
│   └── .env.example       # Environment variable template
└── frontend/
    ├── index.html         # Main UI page
    ├── styles.css         # Dark-theme styles
    └── script.js          # Frontend logic
```

---

## 🚀 Getting Started

### Prerequisites

- Python 3.10+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

---

### Backend Setup

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment (recommended)
python -m venv venv
source venv/bin/activate       # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Configure your API key
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=<your_key>

# 5. Start the FastAPI server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

---

### Frontend Setup

The frontend is a static site — no build step needed.

```bash
# Option A: Open directly in browser
open frontend/index.html

# Option B: Serve with Python
cd frontend
python -m http.server 3000
# Then visit http://localhost:3000
```

> **Note:** The frontend expects the backend to be running at `http://localhost:8000`.  
> To change this, edit the `API_BASE_URL` constant at the top of `frontend/script.js`.

---

## 🔌 API Reference

### `POST /analyze`

Analyzes conversation text and returns a risk assessment.

**Request Body**

```json
{
  "conversation": "Hey, I can double your money! Just send $500 in gift cards..."
}
```

**Response**

```json
{
  "risk_level": "HIGH",
  "suspicious_phrases": [
    "I can double your money",
    "send $500 in gift cards"
  ],
  "explanation": "This conversation shows clear signs of a financial scam. The sender promises unrealistic returns and requests payment via gift cards, a hallmark of scam operations.",
  "safety_advice": [
    "Never send money or gift cards to someone you met online.",
    "Legitimate investment opportunities do not require upfront payments.",
    "Report this account to the platform and block the sender."
  ]
}
```

**Risk Levels**

| Level    | Description                                              |
|----------|----------------------------------------------------------|
| LOW      | No suspicious content detected                           |
| MEDIUM   | Some concerning elements that warrant caution            |
| HIGH     | Clear indicators of harmful intent or dangerous patterns |
| CRITICAL | Immediate danger — threats, active grooming, ongoing scam|

---

## 🛠️ Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Backend  | Python, FastAPI, Pydantic   |
| AI Model | Google Gemini 1.5 Flash     |
| Frontend | HTML5, CSS3, Vanilla JS     |

---

## ⚠️ Disclaimer

This tool provides AI-generated analysis and should not replace professional judgement or law enforcement. If you or someone you know is in immediate danger, contact local authorities immediately.
