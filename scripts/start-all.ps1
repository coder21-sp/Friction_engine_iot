$ErrorActionPreference = "Continue"

Write-Host "==============================================" -ForegroundColor Cyan
Write-Host "Starting HFME 2.0 Local Services" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan

$baseDir = Split-Path -Parent $PSScriptRoot

Write-Host "[1/2] Starting AI Service on port 8000..." -ForegroundColor Yellow
$aiProc = Start-Process -FilePath "$baseDir\.venv\Scripts\python.exe" `
  -ArgumentList "-m uvicorn main:app --host 0.0.0.0 --port 8000" `
  -WorkingDirectory "$baseDir\ai-service" `
  -PassThru

Write-Host "[2/2] Starting Next.js Web UI on port 3000..." -ForegroundColor Yellow
$webProc = Start-Process -FilePath "npm.cmd" `
  -ArgumentList "run dev" `
  -WorkingDirectory "$baseDir" `
  -PassThru

Start-Sleep -Seconds 4
Start-Process "http://localhost:3000"

Write-Host "==============================================" -ForegroundColor Green
Write-Host "Both services are active!" -ForegroundColor Green
Write-Host "- Web Dashboard: http://localhost:3000" -ForegroundColor Green
Write-Host "- IoT Dashboard: http://localhost:3000/iot-security" -ForegroundColor Green
Write-Host "- AI Service:    http://localhost:8000" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green

Wait-Process -Id $aiProc.Id, $webProc.Id
