"""Fetch climate signals from public APIs with graceful degradation."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from typing import Any, Dict, Tuple

import httpx

from .config import API_TIMEOUT_S, NASA_POWER_POINT_URL, NOAA_NINO34_URL, PAKISTAN_LAT, PAKISTAN_LON


@dataclass
class Signal:
    name: str
    value: float | None
    unit: str
    status: str
    source: str
    details: str


def _safe_get(url: str, params: Dict[str, Any] | None = None) -> Tuple[bool, Any]:
    try:
        with httpx.Client(timeout=API_TIMEOUT_S) as client:
            response = client.get(url, params=params)
            response.raise_for_status()
            return True, response.text
    except Exception as exc:  # noqa: BLE001 - broad to ensure no hard failures
        return False, str(exc)


def fetch_nino34() -> Signal:
    ok, data = _safe_get(NOAA_NINO34_URL)
    if not ok:
        return Signal(
            name="ENSO Niño 3.4",
            value=None,
            unit="index",
            status="unavailable",
            source="NOAA CPC",
            details=f"Failed to fetch: {data}",
        )

    lines = [line for line in data.splitlines() if line.strip() and not line.startswith("#")]
    if not lines:
        return Signal(
            name="ENSO Niño 3.4",
            value=None,
            unit="index",
            status="unavailable",
            source="NOAA CPC",
            details="No data lines returned.",
        )

    last = lines[-1].split()
    try:
        nino34 = float(last[4])
        return Signal(
            name="ENSO Niño 3.4",
            value=nino34,
            unit="index",
            status="ok",
            source="NOAA CPC",
            details="Latest monthly index.",
        )
    except (IndexError, ValueError):
        return Signal(
            name="ENSO Niño 3.4",
            value=None,
            unit="index",
            status="unavailable",
            source="NOAA CPC",
            details="Parsing failed for latest line.",
        )


def fetch_temperature_anomaly() -> Signal:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=7)
    params = {
        "parameters": "T2M",
        "community": "RE",
        "longitude": PAKISTAN_LON,
        "latitude": PAKISTAN_LAT,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
    }
    ok, data = _safe_get(NASA_POWER_POINT_URL, params=params)
    if not ok:
        return Signal(
            name="Temperature Anomaly",
            value=None,
            unit="degC",
            status="unavailable",
            source="NASA POWER",
            details=f"Failed to fetch: {data}",
        )

    try:
        json_data = httpx.Response(200, text=data).json()
        values = json_data["properties"]["parameter"]["T2M"].values()
        temps = [v for v in values if isinstance(v, (int, float))]
        if not temps:
            raise ValueError("No temperature values")
        avg_temp = sum(temps) / len(temps)
        anomaly = avg_temp - 30.0
        return Signal(
            name="Temperature Anomaly",
            value=anomaly,
            unit="degC",
            status="proxy",
            source="NASA POWER",
            details="Proxy anomaly vs 30C seasonal baseline.",
        )
    except Exception as exc:  # noqa: BLE001 - keep resilient
        return Signal(
            name="Temperature Anomaly",
            value=None,
            unit="degC",
            status="unavailable",
            source="NASA POWER",
            details=f"Parsing failed: {exc}",
        )


def fetch_precipitation_proxy() -> Signal:
    end_date = datetime.utcnow().date()
    start_date = end_date - timedelta(days=7)
    params = {
        "parameters": "PRECTOT",
        "community": "RE",
        "longitude": PAKISTAN_LON,
        "latitude": PAKISTAN_LAT,
        "start": start_date.strftime("%Y%m%d"),
        "end": end_date.strftime("%Y%m%d"),
        "format": "JSON",
    }
    ok, data = _safe_get(NASA_POWER_POINT_URL, params=params)
    if not ok:
        return Signal(
            name="Precipitation",
            value=None,
            unit="mm/day",
            status="unavailable",
            source="NASA POWER",
            details=f"Failed to fetch: {data}",
        )

    try:
        json_data = httpx.Response(200, text=data).json()
        values = json_data["properties"]["parameter"]["PRECTOT"].values()
        precips = [v for v in values if isinstance(v, (int, float))]
        if not precips:
            raise ValueError("No precipitation values")
        avg_precip = sum(precips) / len(precips)
        return Signal(
            name="Precipitation",
            value=avg_precip,
            unit="mm/day",
            status="proxy",
            source="NASA POWER",
            details="7-day mean precipitation proxy.",
        )
    except Exception as exc:  # noqa: BLE001
        return Signal(
            name="Precipitation",
            value=None,
            unit="mm/day",
            status="unavailable",
            source="NASA POWER",
            details=f"Parsing failed: {exc}",
        )


def fetch_snow_melt_proxy(temperature_anomaly: Signal) -> Signal:
    if temperature_anomaly.value is None:
        return Signal(
            name="Snow/Melt",
            value=None,
            unit="index",
            status="unavailable",
            source="Proxy",
            details="Temperature proxy unavailable.",
        )

    melt_index = max(0.0, min(2.0, temperature_anomaly.value / 3.0))
    return Signal(
        name="Snow/Melt",
        value=melt_index,
        unit="index",
        status="proxy",
        source="Temperature proxy",
        details="Derived from temperature anomaly for northern melt risk.",
    )


def fetch_signals() -> Dict[str, Dict[str, Any]]:
    nino = fetch_nino34()
    temp = fetch_temperature_anomaly()
    precip = fetch_precipitation_proxy()
    melt = fetch_snow_melt_proxy(temp)

    signals = {
        "enso_nino34": nino.__dict__,
        "temperature_anomaly": temp.__dict__,
        "precipitation": precip.__dict__,
        "snow_melt": melt.__dict__,
        "timestamp": datetime.utcnow().isoformat() + "Z",
    }
    return signals
