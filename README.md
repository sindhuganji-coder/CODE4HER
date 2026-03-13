# AI Suspicious Conversation Analyzer

A full-stack safety tool that uses **Google Gemini AI** to analyze conversations and detect scams, grooming, manipulation, and harassment in real time.

---

## Features

- 🔍 **Scam Detection** – Identifies financial fraud, phishing, and impersonation attempts.
- 🚸 **Grooming Detection** – Flags inappropriate relationship-building language.
- 🧠 **Manipulation Detection** – Spots emotional manipulation, gaslighting, and coercive control.
- 🚫 **Harassment Detection** – Recognizes threatening, intimidating, or abusive language.
- 🛡️ **Risk Level** – Returns LOW / MEDIUM / HIGH / CRITICAL risk rating.
- 💡 **Safety Advice** – Provides actionable guidance for the recipient.

---

## Project Structure

```
├── backend/
│   ├── main.py           # FastAPI application with /analyze endpoint
│   ├── requirements.txt  # Python dependencies
│   └── .env.example      # Template for environment variables
└── frontend/
    ├── index.html        # Main UI page
    ├── style.css         # Dark-theme stylesheet
    └── script.js         # Fetch logic and result rendering
```

---

## Setup & Running

### Prerequisites

- Python 3.10+
- A [Google Gemini API key](https://aistudio.google.com/app/apikey)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env and set GEMINI_API_KEY=your_actual_key

# Start the server
uvicorn main:app --reload
# API available at http://localhost:8000
```

### Frontend

Open `frontend/index.html` directly in your browser — no build step required.

> Make sure the backend server is running at `http://localhost:8000` before clicking **Analyze**.

---

## API Reference

### `POST /analyze`

**Request body (JSON):**

```json
{
  "conversation": "Hey, you won $1000! Click here to claim your prize..."
}
```

**Response (JSON):**

```json
{
  "risk_level": "HIGH",
  "suspicious_phrases": ["you won $1000", "Click here to claim your prize"],
  "explanation": "This message contains classic prize scam language designed to lure victims into clicking a malicious link.",
  "safety_advice": [
    "Do not click any links from unknown senders.",
    "Report the message as spam.",
    "Block the sender immediately."
  ]
}
```

| Field | Type | Values |
|---|---|---|
| `risk_level` | string | `LOW`, `MEDIUM`, `HIGH`, `CRITICAL` |
| `suspicious_phrases` | string[] | Exact quotes from the conversation |
| `explanation` | string | AI-generated summary |
| `safety_advice` | string[] | Actionable safety steps |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| AI | Google Gemini 2.0 Flash |
| Frontend | HTML5, CSS3, Vanilla JavaScript |

---

## Disclaimer

This tool is for **educational and safety awareness purposes only**. Always consult relevant authorities (law enforcement, platform support) if you believe someone is in immediate danger.
