$ErrorActionPreference = "Stop"

$ProgramDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $ProgramDir

$bundledPython = "C:\Users\aa\.cache\codex-runtimes\codex-primary-runtime\dependencies\python\python.exe"
$pythonExe = $null
if (Test-Path $bundledPython) {
  $pythonExe = $bundledPython
} elseif (Get-Command py -ErrorAction SilentlyContinue) {
  $pythonExe = "py"
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  $pythonExe = (Get-Command python).Source
}
if (-not $pythonExe) { throw "Python bulunamadı. Önce Python 3.11/3.12 kurulu olmalı." }

$venvDir = ".\.venv-solver"
if (-not (Test-Path "$venvDir\Scripts\python.exe")) {
  if ($pythonExe -eq "py") {
    & py -3.12 -m venv $venvDir
  } else {
    & $pythonExe -m venv $venvDir
  }
}

& "$venvDir\Scripts\python.exe" -m pip install --upgrade pip
& "$venvDir\Scripts\python.exe" -m pip install -r requirements-solver.txt

Write-Host ""
Write-Host "Kurulum tamam. Server başlatmak için:" -ForegroundColor Green
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$ProgramDir\local-solver-start.ps1`""
