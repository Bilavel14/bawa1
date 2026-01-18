"""Configuration constants for the ED-COP-2026 backend."""

from __future__ import annotations

API_TIMEOUT_S = 6

# API endpoints
NOAA_NINO34_URL = "https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices"
NASA_POWER_POINT_URL = (
    "https://power.larc.nasa.gov/api/temporal/daily/point"
)

# Geographic center of Pakistan for point-based APIs
PAKISTAN_LAT = 30.3753
PAKISTAN_LON = 69.3451

# Risk weights
WEIGHTS = {
    "flood": 0.35,
    "heat": 0.35,
    "drought": 0.30,
}

PROVINCES = [
    "Punjab",
    "Sindh",
    "Khyber Pakhtunkhwa",
    "Balochistan",
    "Gilgit-Baltistan",
    "Azad Jammu and Kashmir",
    "Islamabad Capital Territory",
]
