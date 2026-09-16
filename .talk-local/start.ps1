param([switch]$NoBrowser)
$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent $PSScriptRoot
$runtime = Join-Path $PSScriptRoot 'runtime'
Set-Location $repo
New-Item -ItemType Directory -Force $runtime | Out-Null
$python = Join-Path $repo '.talk-agent/.venv/Scripts/python.exe'
$llama = Join-Path $PSScriptRoot 'bin/llama/llama-server.exe'
$cloudflared = 'C:/Program Files (x86)/cloudflared/cloudflared.exe'
$git = 'C:/Users/aa/.cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe'
if (!(Test-Path (Join-Path $runtime 'access.key'))) {
  & $python -c "import secrets,pathlib;pathlib.Path('.talk-local/runtime/access.key').write_text(secrets.token_urlsafe(24))"
}
function Running($name, $expected) {
  $pidFile = Join-Path $runtime ($name + '.pid')
  if (!(Test-Path $pidFile)) { return $false }
  $taskId = [int](Get-Content $pidFile)
  $process = Get-Process -Id $taskId -ErrorAction SilentlyContinue
  return ($process -and $process.Path -eq [IO.Path]::GetFullPath($expected))
}
function StartHidden($name,$exe,$arguments) {
  $proc = Start-Process -FilePath $exe -ArgumentList $arguments -WindowStyle Hidden -PassThru -WorkingDirectory $repo -RedirectStandardOutput (Join-Path $runtime ($name+'.log')) -RedirectStandardError (Join-Path $runtime ($name+'-error.log'))
  $proc.Id | Set-Content (Join-Path $runtime ($name+'.pid'))
}
if (!(Running 'llama' $llama)) {
  StartHidden 'llama' $llama @('-m',(Join-Path $PSScriptRoot 'models/qwen2.5-1.5b-instruct-q4_k_m.gguf'),'--host','127.0.0.1','--port','8174','-t','4','-c','2048','--parallel','1','--no-webui','--api-key-file',(Join-Path $runtime 'access.key'),'--cors-origins','localhost')
}
if (!(Running 'voice' $python)) {
  StartHidden 'voice' $python @('-m','uvicorn','server:app','--app-dir','.talk-local','--host','127.0.0.1','--port','8173','--no-access-log')
}
$ready=$false
for($i=0;$i -lt 45;$i++) {
  try {$ready=(Invoke-RestMethod 'http://127.0.0.1:8173/health' -TimeoutSec 3).ready} catch {}
  if($ready){break}
  Start-Sleep -Seconds 2
}
if(!$ready){throw 'Voice service could not start. See .talk-local/runtime logs.'}
if (!(Running 'tunnel' $cloudflared)) {
  StartHidden 'tunnel' $cloudflared @('tunnel','--url','http://127.0.0.1:8173','--no-autoupdate')
}
$endpoint=''
for($i=0;$i -lt 30;$i++) {
  $log=Get-Content (Join-Path $runtime 'tunnel-error.log') -Raw -ErrorAction SilentlyContinue
  $found=[regex]::Match([string]$log,'https://[a-z0-9-]+\.trycloudflare\.com')
  if($found.Success){$endpoint=$found.Value;break}
  Start-Sleep -Seconds 2
}
if(!$endpoint){throw 'Phone tunnel could not start.'}
$config=Join-Path $repo 'talk/local-config.json'
$old=if(Test-Path $config){(Get-Content $config -Raw | ConvertFrom-Json).endpoint}else{''}
if($old -ne $endpoint){
  [IO.File]::WriteAllText($config,(@{endpoint=$endpoint;mode='local'} | ConvertTo-Json -Compress),[Text.UTF8Encoding]::new($false))
  & $git add -- talk/local-config.json
  & $git commit --only -m 'Update local Talk connection' -- talk/local-config.json
  if($LASTEXITCODE -ne 0){throw 'Connection settings could not be saved.'}
  & $git push origin main
  if($LASTEXITCODE -ne 0){throw 'Connection settings could not be published. Do not force push.'}
  Write-Host 'New connection published. The website may take a minute to update.'
}
$access=(Get-Content (Join-Path $runtime 'access.key') -Raw).Trim()
$link='https://fatedreel.com/talk/#key='+$access
[IO.File]::WriteAllText((Join-Path $runtime 'open-talk.html'),('<!doctype html><html lang="tr"><meta charset="utf-8"><meta name="referrer" content="no-referrer"><title>Talk</title><style>body{font:20px system-ui;background:#080a10;color:white;padding:40px}a{color:#b6c9ff}</style><h1>Talk hazir</h1><p><a href="'+$link+'">Konusmayi ac</a></p><p>iPhone icin bu ozel baglantiyi kendine gonderebilirsin. Baglanti erisim kodunu icerir.</p><input style="width:100%;padding:12px" readonly value="'+$link+'"></html>'),[Text.UTF8Encoding]::new($false))
if(!$NoBrowser){Start-Process (Join-Path $runtime 'open-talk.html')}
Write-Host 'Talk is running. Keep this PC awake. Use Talk Durdur to stop it.'
