$ErrorActionPreference = "Stop"

$backend = Split-Path -Parent $PSScriptRoot
$runner = Join-Path $PSScriptRoot "run_backup.ps1"
$taskName = "Sajo CCTV CRM - Daily Encrypted Backup"
$action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$runner`""
$trigger = New-ScheduledTaskTrigger -Daily -At "02:00"
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Force | Out-Host

Write-Output "Registered '$taskName' to run daily at 02:00 local server time."
