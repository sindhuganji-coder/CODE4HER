"""
AI Suspicious Conversation Analyzer - FastAPI Backend
Uses Google Gemini API to detect scams, grooming, manipulation, and harassment.
"""

import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, field_validator
from google import genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Suspicious Conversation Analyzer",
    description="Analyzes conversations to detect scams, grooming, manipulation, and harassment.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")


class ConversationRequest(BaseModel):
    conversation: str

    @field_validator("conversation")
    @classmethod
    def conversation_must_not_be_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Conversation text must not be empty.")
        if len(v) > 20000:
            raise ValueError("Conversation text must not exceed 20,000 characters.")
        return v.strip()


class AnalysisResponse(BaseModel):
    risk_level: str
    suspicious_phrases: list[str]
    explanation: str
    safety_advice: list[str]


ANALYSIS_PROMPT = """You are an expert safety analyst specializing in detecting online threats.
Analyze the following conversation and identify any signs of:
- Scams (financial fraud, phishing, impersonation)
- Grooming (attempts to build inappropriate relationships, especially with minors)
- Manipulation (emotional manipulation, gaslighting, coercive control)
- Harassment (threatening, intimidating, or abusive language)

Conversation to analyze:
\"\"\"
{conversation}
\"\"\"

Respond ONLY with a valid JSON object (no markdown, no extra text) in this exact format:
{{
  "risk_level": "<one of: LOW, MEDIUM, HIGH, CRITICAL>",
  "suspicious_phrases": ["<exact phrase from conversation>", "..."],
  "explanation": "<detailed explanation of findings>",
  "safety_advice": ["<actionable advice>", "..."]
}}

Guidelines:
- risk_level LOW: normal conversation, no red flags
- risk_level MEDIUM: some concerning patterns that warrant caution
- risk_level HIGH: clear indicators of harmful intent or behavior
- risk_level CRITICAL: immediate danger signals; action required now
- suspicious_phrases: list up to 10 exact quotes from the conversation that raised concern; empty list if none
- explanation: 2-4 sentences summarizing what was detected and why
- safety_advice: 3-5 concrete, actionable steps the recipient should take; always include at least one
"""


@app.get("/")
def root():
    return {"message": "AI Suspicious Conversation Analyzer API is running."}


@app.post("/analyze", response_model=AnalysisResponse)
def analyze_conversation(request: ConversationRequest):
    """Analyze a conversation for scams, grooming, manipulation, and harassment."""

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.",
        )

    prompt = ANALYSIS_PROMPT.format(conversation=request.conversation)

    try:
        client = genai.Client(api_key=GEMINI_API_KEY)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw_text = response.text.strip()

        # Strip markdown code fences if present
        raw_text = re.sub(r"^```(?:json)?\s*", "", raw_text)
        raw_text = re.sub(r"\s*```$", "", raw_text)

        data = json.loads(raw_text)

        risk_level = str(data.get("risk_level", "LOW")).upper()
        if risk_level not in ("LOW", "MEDIUM", "HIGH", "CRITICAL"):
            risk_level = "LOW"

        suspicious_phrases = data.get("suspicious_phrases", [])
        if not isinstance(suspicious_phrases, list):
            suspicious_phrases = []

        explanation = str(data.get("explanation", "No explanation provided."))

        safety_advice = data.get("safety_advice", [])
        if not isinstance(safety_advice, list):
            safety_advice = []
        if not safety_advice:
            safety_advice = ["Stay cautious and trust your instincts."]

        return AnalysisResponse(
            risk_level=risk_level,
            suspicious_phrases=suspicious_phrases,
            explanation=explanation,
            safety_advice=safety_advice,
        )

    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse Gemini response as JSON: {exc}",
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {exc}",
        ) from exc

