@echo off
title HFME Local Launcher
echo ===================================================
echo Starting HFME 2.0 Local Services
echo ===================================================

cd /d "%~dp0"

echo [1/2] Launching AI Service on http://localhost:8000 ...
start "HFME AI Service" cmd /k "cd /d %~dp0ai-service && ..\.venv\Scripts\python.exe -m uvicorn main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Launching Next.js Web UI on http://localhost:3000 ...
start "HFME Web App" cmd /k "cd /d %~dp0 && npm run dev"

echo Waiting for services to initialize...
ping -n 4 127.0.0.1 >nul

echo Opening browser at http://localhost:3000/iot-login ...
start http://localhost:3000/iot-login

echo.
echo ===================================================
echo Services are running!
echo - IoT Security Login: http://localhost:3000/iot-login
echo - IoT Dashboard:      http://localhost:3000/iot-security
echo - Main Dashboard:     http://localhost:3000
echo - Workflows:          http://localhost:3000/workflows
echo - Admin Console:      http://localhost:3000/admin
echo - AI API and Docs:    http://localhost:8000/docs
echo - Default Admin:      admin@hfme.io / hfme_admin_2024
echo ===================================================
