$ErrorActionPreference = "Stop"

$ProgramDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$Cloudflared = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
$Log = Join-Path $ProgramDir "cloudflared-quick.log"

if (-not (Test-Path $Cloudflared)) {
  throw "cloudflared bulunamadı. winget install --id Cloudflare.cloudflared komutuyla kurun."
}

Remove-Item $Log -ErrorAction SilentlyContinue
Write-Host "Cloudflare quick tunnel başlıyor: http://127.0.0.1:8000" -ForegroundColor Green
Write-Host "URL birkaç saniye içinde bu ekranda görünecek."

& $Cloudflared tunnel --url http://127.0.0.1:8000 2>&1 | Tee-Object -FilePath $Log
