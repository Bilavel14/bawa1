"""Soft intent parsing for environmental dynamics queries."""

from __future__ import annotations

from dataclasses import dataclass
from typing import List

INTENT_SYNONYMS = {
    "heat": ["heat", "hot", "summer", "temperature", "heatwave"],
    "flood": ["flood", "rain", "monsoon", "inundation", "storm"],
    "glacier": ["ice", "snow", "glacier", "north", "melt"],
    "drought": ["dry", "drought", "rainfall low", "arid", "low rain"],
}

INTENT_LABELS = {
    "heat": "heat stress",
    "flood": "flood",
    "glacier": "glacier melt",
    "drought": "drought",
}


@dataclass
class IntentResult:
    intents: List[str]
    confidence: str


def _tokenize(text: str) -> List[str]:
    tokens = (
        text.replace("/", " ")
        .replace(",", " ")
        .replace(".", " ")
        .replace(";", " ")
        .replace(":", " ")
        .split()
    )
    return [token.strip().lower() for token in tokens if token.strip()]


def parse_intents(text: str) -> IntentResult:
    """Parse intents from arbitrary text. Always returns at least one intent."""
    normalized = (text or "").strip().lower()
    tokens = _tokenize(normalized)

    matched = []
    for intent_key, synonyms in INTENT_SYNONYMS.items():
        for synonym in synonyms:
            if synonym in normalized:
                matched.append(INTENT_LABELS[intent_key])
                break
            if synonym in tokens:
                matched.append(INTENT_LABELS[intent_key])
                break

    if not matched:
        return IntentResult(intents=["general environmental dynamics"], confidence="low")

    confidence = "medium" if len(matched) == 1 else "high"
    return IntentResult(intents=list(dict.fromkeys(matched)), confidence=confidence)
