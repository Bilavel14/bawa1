ED-COP-2026 Environmental Dynamics Portal
=======================================

How to run
1. Ensure Python 3.10+ is available.
2. Install dependencies: pip install fastapi uvicorn httpx
3. Start the portal:
   - Run RunPortal.bat on Windows
   - Or run: python -m uvicorn backend.app:app --host 0.0.0.0 --port 8002
4. Open http://localhost:8002 in your browser.

Port used
- 8002

APIs used
- NOAA CPC SSTO Index for ENSO Niño 3.4 (https://www.cpc.ncep.noaa.gov/data/indices/sstoi.indices)
- NASA POWER API for temperature and precipitation proxies (https://power.larc.nasa.gov/)

If APIs fail
- The backend continues execution and marks signals as unavailable or proxy.
- Confidence is reduced to reflect missing data.
- Province risk continues using available signals with clear proxy labeling.
