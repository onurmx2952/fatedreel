param(
  [switch]$Restart
)

$ErrorActionPreference = "Stop"

$ProgramDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProgramDir

$VenvPython = Join-Path $ProgramDir ".venv-solver\Scripts\python.exe"
if (-not (Test-Path $VenvPython)) {
  Write-Host "Solver venv not found. Installing..." -ForegroundColor Yellow
  & "$ProgramDir\local-solver-install.ps1"
}

$ExpectedPython = (Resolve-Path $VenvPython).Path

function Stop-WrongSolverProcess {
  param([int]$ProcessId)

  $proc = Get-CimInstance Win32_Process -Filter "ProcessId=$ProcessId" -ErrorAction SilentlyContinue
  if (-not $proc) { return $false }

  $cmd = [string]$proc.CommandLine
  if ($cmd -like "*ortools_solver:app*" -and $cmd -like "*$ExpectedPython*") {
    if ($Restart) {
      Write-Host "Restarting solver process: PID $ProcessId" -ForegroundColor Yellow
      Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
      return $false
    }
    Write-Host "Solver is already running with the correct venv: http://127.0.0.1:8000" -ForegroundColor Green
    return $true
  }

  Write-Host "Stopping stale/wrong solver process: PID $ProcessId" -ForegroundColor Yellow
  Stop-Process -Id $ProcessId -Force -ErrorAction SilentlyContinue
  return $false
}

$existing = Get-NetTCPConnection -LocalAddress 127.0.0.1 -LocalPort 8000 -State Listen -ErrorAction SilentlyContinue
if ($existing) {
  foreach ($connection in $existing) {
    $isCorrect = Stop-WrongSolverProcess -ProcessId $connection.OwningProcess
    if ($isCorrect) { return }
  }
  Start-Sleep -Seconds 1
}

Get-CimInstance Win32_Process | Where-Object {
  $_.CommandLine -like "*ortools_solver:app*" -and $_.CommandLine -notlike "*$ExpectedPython*"
} | ForEach-Object {
  Write-Host "Stopping extra stale solver process: PID $($_.ProcessId)" -ForegroundColor Yellow
  Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue
}

Write-Host "Starting solver: http://127.0.0.1:8000" -ForegroundColor Green
& $VenvPython -m uvicorn ortools_solver:app --host 127.0.0.1 --port 8000
