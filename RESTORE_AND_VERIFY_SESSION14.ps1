$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run build
npm test
npm run audit:site
npm run smoke:build
Write-Host "Session 14 baseline restored and core verification completed."
