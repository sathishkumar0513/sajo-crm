$ErrorActionPreference = "Stop"

$backend = Split-Path -Parent $PSScriptRoot
$python = Join-Path $backend "venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Backend virtual environment was not found at $python"
}

Set-Location $backend
& $python manage.py backup_database --encrypt --require-upload
if ($LASTEXITCODE -ne 0) {
    throw "Database backup failed with exit code $LASTEXITCODE"
}
