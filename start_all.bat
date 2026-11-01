@echo off
TITLE Smart Healthcare SPM System - Unified Launcher
color 0b
echo ===============================================================================
echo        SMART HEALTHCARE PROJECT MANAGEMENT SYSTEM (5-HOSPITAL NETWORK)
echo             Mid-Term Examination Fall-2026 - CSE-494 SPM
echo ===============================================================================
echo.

set SCRIPT_DIR=%~dp0
set BACKEND_DIR=%SCRIPT_DIR%backend
set FRONTEND_DIR=%SCRIPT_DIR%frontend

echo [1/3] Detecting Python environment...
if exist "%SCRIPT_DIR%..\.venv\Scripts\python.exe" (
    set PY_EXE=%SCRIPT_DIR%..\.venv\Scripts\python.exe
) else if exist "%SCRIPT_DIR%.venv\Scripts\python.exe" (
    set PY_EXE=%SCRIPT_DIR%.venv\Scripts\python.exe
) else (
    set PY_EXE=python
)
echo Found Python: %PY_EXE%

echo.
echo [2/3] Initializing SQLite database & loading sample data...
"%PY_EXE%" "%BACKEND_DIR%\sample_data.py"

echo.
echo [3/3] Launching Backend & Frontend Dev Server simultaneously...

REM Start Backend FastAPI Server on Port 8000
start "SmartHealth-SPM-Backend [FastAPI :8000]" cmd /k "cd /d \"%BACKEND_DIR%\" && \"%PY_EXE%\" -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

REM Wait 2 seconds for backend to start listening
timeout /t 2 /nobreak >nul

REM Start Frontend Vite Server on Port 5173
start "SmartHealth-SPM-Frontend [Vite React :5173]" cmd /k "cd /d \"%FRONTEND_DIR%\" && npm run dev"

REM Wait 2 seconds and open browser
timeout /t 2 /nobreak >nul
echo.
echo Opening Web Application in Browser...
start http://localhost:5173

echo.
echo ===============================================================================
echo Both servers are running!
echo - Frontend: http://localhost:5173
echo - Backend API: http://127.0.0.1:8000
echo - Swagger Docs: http://127.0.0.1:8000/docs
echo.
echo Leave the two opened console windows open while testing.
echo ===============================================================================
echo.
pause
