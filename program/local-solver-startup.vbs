Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File ""C:\Users\aa\Documents\github\fatedreel\program\local-solver-start.ps1"" -Restart", 0, False
