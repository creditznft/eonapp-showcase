$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run build
npm run qa:w98-session12-polish
Write-Host "Session 12 source, build and presentation gates passed." -ForegroundColor Green
