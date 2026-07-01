$ErrorActionPreference = "Stop"

$ProgramDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$StartScript = Join-Path $ProgramDir "local-solver-start.ps1"
$TaskName = "FatedReel Ders Solver"

if (-not (Test-Path $StartScript)) {
  throw "Başlatma script'i bulunamadı: $StartScript"
}

$action = New-ScheduledTaskAction `
  -Execute "powershell.exe" `
  -Argument "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$StartScript`""

$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet `
  -AllowStartIfOnBatteries `
  -DontStopIfGoingOnBatteries `
  -StartWhenAvailable `
  -MultipleInstances IgnoreNew

Register-ScheduledTask `
  -TaskName $TaskName `
  -Action $action `
  -Trigger $trigger `
  -Settings $settings `
  -Description "FatedReel okul ders programı yerel OR-Tools solver servisini oturum açınca başlatır." `
  -Force | Out-Null

Write-Host "Scheduled Task kuruldu: $TaskName" -ForegroundColor Green
Write-Host "Bilgisayar açılıp kullanıcı oturumu açıldığında solver otomatik başlar."
