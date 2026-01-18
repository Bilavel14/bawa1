@echo off
set PORT=8002
set HOST=0.0.0.0

echo Starting ED-COP-2026 portal on http://localhost:%PORT%
python -m uvicorn backend.app:app --host %HOST% --port %PORT%
