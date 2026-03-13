import os
import json
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(
    title="AI Suspicious Conversation Analyzer",
    description="Analyzes conversation text for scams, grooming, manipulation, and harassment using Google Gemini AI.",
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
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)


class ConversationRequest(BaseModel):
    conversation: str


class AnalysisResponse(BaseModel):
    risk_level: str
    suspicious_phrases: list[str]
    explanation: str
    safety_advice: list[str]


ANALYSIS_PROMPT = """You are a safety expert specializing in detecting online dangers including scams, grooming, manipulation, and harassment in digital conversations.

Analyze the following conversation text and return a JSON response with these exact fields:
- "risk_level": one of "LOW", "MEDIUM", "HIGH", or "CRITICAL"
- "suspicious_phrases": an array of specific phrases or sentences from the conversation that are concerning (empty array if none)
- "explanation": a clear explanation of what was detected and why it is concerning (or why it is safe)
- "safety_advice": an array of practical safety tips relevant to the detected issues (at least 2 tips)

Detection categories to check:
1. SCAM: requests for money, gift cards, wire transfers, personal/financial information, too-good-to-be-true offers, urgency tactics, impersonation
2. GROOMING: inappropriate relationships with minors, requests to keep secrets, isolation tactics, building excessive trust with a child, requests to meet in person, sexual content directed at minors
3. MANIPULATION: gaslighting, emotional blackmail, guilt-tripping, love bombing, threats disguised as concern, coercive control
4. HARASSMENT: threats, intimidation, persistent unwanted contact, hate speech, cyberbullying

Risk level guide:
- LOW: No suspicious content detected, normal conversation
- MEDIUM: Some concerning elements that warrant caution
- HIGH: Clear indicators of harmful intent or dangerous patterns
- CRITICAL: Immediate danger signals, such as explicit threats, active grooming, or ongoing scam

Conversation to analyze:
\"\"\"
{conversation}
\"\"\"

Respond ONLY with valid JSON matching the structure above. Do not include any additional text outside the JSON."""


def parse_gemini_response(text: str) -> dict:
    """Extract and parse JSON from Gemini response text."""
    # Try direct parse first
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        pass

    # Try extracting JSON block from markdown code fences
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", text)
    if match:
        try:
            return json.loads(match.group(1))
        except json.JSONDecodeError:
            pass

    # Try finding the first {...} block
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    raise ValueError(f"Could not parse JSON from response: {text[:200]}")


@app.get("/")
async def root():
    return {"message": "AI Suspicious Conversation Analyzer API", "version": "1.0.0"}


@app.post("/analyze", response_model=AnalysisResponse)
async def analyze_conversation(request: ConversationRequest):
    """
    Analyze a conversation for scams, grooming, manipulation, and harassment.

    Returns:
    - **risk_level**: LOW / MEDIUM / HIGH / CRITICAL
    - **suspicious_phrases**: List of concerning phrases found in the conversation
    - **explanation**: Detailed explanation of findings
    - **safety_advice**: Practical safety recommendations
    """
    if not request.conversation or not request.conversation.strip():
        raise HTTPException(status_code=400, detail="Conversation text cannot be empty.")

    if len(request.conversation) > 20000:
        raise HTTPException(
            status_code=400,
            detail="Conversation text is too long. Please limit to 20,000 characters.",
        )

    if not GEMINI_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Gemini API key is not configured. Please set the GEMINI_API_KEY environment variable.",
        )

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = ANALYSIS_PROMPT.format(conversation=request.conversation)
        response = model.generate_content(prompt)
        response_text = response.text.strip()
    except Exception as e:
        raise HTTPException(
            status_code=502,
            detail=f"Error communicating with Gemini API: {str(e)}",
        )

    try:
        data = parse_gemini_response(response_text)
    except ValueError as e:
        raise HTTPException(
            status_code=502,
            detail=f"Failed to parse AI response: {str(e)}",
        )

    # Validate and sanitize fields
    valid_risk_levels = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}
    risk_level = str(data.get("risk_level", "MEDIUM")).upper()
    if risk_level not in valid_risk_levels:
        risk_level = "MEDIUM"

    suspicious_phrases = data.get("suspicious_phrases", [])
    if not isinstance(suspicious_phrases, list):
        suspicious_phrases = []
    suspicious_phrases = [str(p) for p in suspicious_phrases]

    explanation = str(data.get("explanation", "No explanation provided."))

    safety_advice = data.get("safety_advice", [])
    if not isinstance(safety_advice, list):
        safety_advice = []
    safety_advice = [str(a) for a in safety_advice]

    return AnalysisResponse(
        risk_level=risk_level,
        suspicious_phrases=suspicious_phrases,
        explanation=explanation,
        safety_advice=safety_advice,
    )
