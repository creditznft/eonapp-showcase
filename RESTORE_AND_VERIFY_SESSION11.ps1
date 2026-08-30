$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run build
npm run qa:w98-session11-performance
Write-Host "Session 11 source, build and dedicated performance gates passed." -ForegroundColor Green
