"""Province-level risk calculations for ED-COP-2026."""

from __future__ import annotations

from typing import Any, Dict, List

from .config import PROVINCES, WEIGHTS


def _normalize(value: float | None, min_val: float, max_val: float) -> float:
    if value is None:
        return 0.5
    if max_val == min_val:
        return 0.5
    return max(0.0, min(1.0, (value - min_val) / (max_val - min_val)))


def _level(score: float) -> str:
    if score >= 0.67:
        return "HIGH"
    if score >= 0.34:
        return "MEDIUM"
    return "LOW"


def _confidence(signals: Dict[str, Dict[str, Any]]) -> str:
    statuses = [
        signals.get("enso_nino34", {}).get("status"),
        signals.get("temperature_anomaly", {}).get("status"),
        signals.get("precipitation", {}).get("status"),
        signals.get("snow_melt", {}).get("status"),
    ]
    ok_count = sum(1 for status in statuses if status == "ok")
    proxy_count = sum(1 for status in statuses if status == "proxy")
    if ok_count >= 2:
        return "high"
    if ok_count + proxy_count >= 2:
        return "medium"
    return "low"


def _drivers(temp_score: float, precip_score: float, melt_score: float) -> List[str]:
    drivers = []
    if temp_score >= 0.6:
        drivers.append("elevated temperature")
    if precip_score >= 0.6:
        drivers.append("elevated precipitation")
    if melt_score >= 0.6:
        drivers.append("snow-melt proxy")
    if not drivers:
        drivers.append("mixed baseline signals")
    return drivers[:3]


def calculate_risks(signals: Dict[str, Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    temp = signals.get("temperature_anomaly", {}).get("value")
    precip = signals.get("precipitation", {}).get("value")
    melt = signals.get("snow_melt", {}).get("value")

    temp_score = _normalize(temp, -3.0, 6.0)
    precip_score = _normalize(precip, 0.0, 20.0)
    melt_score = _normalize(melt, 0.0, 2.0)

    flood_component = (precip_score * 0.7) + (melt_score * 0.3)
    heat_component = temp_score
    drought_component = (1 - precip_score) * 0.6 + temp_score * 0.4

    overall_base = (
        WEIGHTS["flood"] * flood_component
        + WEIGHTS["heat"] * heat_component
        + WEIGHTS["drought"] * drought_component
    )

    province_risk = {}
    for province in PROVINCES:
        modifier = 0.0
        if province in {"Punjab", "Sindh"}:
            modifier += 0.05
        if province in {"Balochistan"}:
            modifier += 0.1
        if province in {"Gilgit-Baltistan", "Azad Jammu and Kashmir"}:
            modifier += 0.05 * melt_score

        score = max(0.0, min(1.0, overall_base + modifier))
        drivers = _drivers(temp_score, precip_score, melt_score)
        why = (
            f"{_level(score)} risk driven by "
            f"{', '.join(drivers)} with proxy-adjusted signals."
        )
        province_risk[province] = {
            "risk": _level(score),
            "why": why,
            "drivers": drivers,
            "confidence": _confidence(signals),
        }

    return province_risk
