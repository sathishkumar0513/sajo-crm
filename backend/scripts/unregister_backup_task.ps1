$ErrorActionPreference = "Stop"

$taskName = "Sajo CCTV CRM - Daily Encrypted Backup"
schtasks.exe /Delete /TN $taskName /F | Out-Host
if ($LASTEXITCODE -ne 0) {
    throw "Unable to remove Windows Task Scheduler task."
}

Write-Output "Removed '$taskName'."
