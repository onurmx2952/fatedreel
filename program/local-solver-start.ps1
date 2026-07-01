$ErrorActionPreference = "Stop"

$ProgramDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProgramDir

$venvPython = ".\.venv-solver\Scripts\python.exe"
if (-not (Test-Path $venvPython)) {
  Write-Host "Venv bulunamadı, kurulum başlatılıyor..." -ForegroundColor Yellow
  & "$ProgramDir\local-solver-install.ps1"
}

$existing = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  Write-Host "Ders programı solver zaten çalışıyor: http://127.0.0.1:8000" -ForegroundColor Yellow
  return
}

Write-Host "Ders programı solver başlıyor: http://127.0.0.1:8000" -ForegroundColor Green
& $venvPython -m uvicorn ortools_solver:app --host 127.0.0.1 --port 8000
