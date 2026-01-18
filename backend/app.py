"""FastAPI server for ED-COP-2026 Environmental Dynamics portal."""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from .nlp import parse_intents
from .risk_engine import calculate_risks
from .signals import fetch_signals

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"
DATA_DIR = BASE_DIR / "data"

app = FastAPI(title="ED-COP-2026")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory=FRONTEND_DIR), name="static")
app.mount("/data", StaticFiles(directory=DATA_DIR), name="data")


class AnalyzeRequest(BaseModel):
    text: str


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/")
async def index() -> HTMLResponse:
    index_path = FRONTEND_DIR / "index.html"
    return HTMLResponse(index_path.read_text(encoding="utf-8"))


@app.post("/analyze")
async def analyze(payload: AnalyzeRequest) -> Dict[str, Any]:
    intents = parse_intents(payload.text)
    signals = fetch_signals()
    province_risk = calculate_risks(signals)

    confidence = intents.confidence
    if confidence == "high" and any(
        signal.get("status") == "unavailable" for signal in signals.values() if isinstance(signal, dict)
    ):
        confidence = "medium"
    elif confidence == "medium" and any(
        signal.get("status") == "unavailable" for signal in signals.values() if isinstance(signal, dict)
    ):
        confidence = "low"

    return {
        "intents": intents.intents,
        "confidence": confidence,
        "signals": signals,
        "province_risk": province_risk,
    }
