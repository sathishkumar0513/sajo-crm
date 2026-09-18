$ErrorActionPreference = "Stop"

$backend = Split-Path -Parent $PSScriptRoot
$python = Join-Path $backend "venv\Scripts\python.exe"

if (-not (Test-Path $python)) {
    throw "Backend virtual environment was not found at $python"
}

Set-Location $backend
& $python -m waitress --listen=127.0.0.1:8000 config.wsgi:application
