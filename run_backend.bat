@echo off
echo ========================================================
echo Starting Smart Healthcare SPM Backend (FastAPI + SQLite)
echo ========================================================
cd /d "%~dp0backend"

REM Attempt to use local virtual environment if present
if exist "..\..\.venv\Scripts\python.exe" (
    echo Using project venv python...
    ..\..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else if exist ".venv\Scripts\python.exe" (
    echo Using backend venv python...
    .venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
) else (
    echo Using system python...
    python -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload
)
pause
