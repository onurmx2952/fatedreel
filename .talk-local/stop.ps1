$runtime=Join-Path $PSScriptRoot 'runtime'
$repo=Split-Path -Parent $PSScriptRoot
$expected=@{llama=(Join-Path $PSScriptRoot 'bin/llama/llama-server.exe');voice=(Join-Path $repo '.talk-agent/.venv/Scripts/python.exe');tunnel='C:/Program Files (x86)/cloudflared/cloudflared.exe'}
foreach($name in @('tunnel','voice','llama')) {
  $pidFile=Join-Path $runtime ($name+'.pid')
  if(Test-Path $pidFile){
    $taskId=[int](Get-Content $pidFile)
    $process=Get-Process -Id $taskId -ErrorAction SilentlyContinue
    if($process -and $process.Path -eq [IO.Path]::GetFullPath($expected[$name])){Stop-Process -Id $taskId}
  }
}
