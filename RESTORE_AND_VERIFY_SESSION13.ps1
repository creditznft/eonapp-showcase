$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run build
npm run qa:w98-session13-mega
Write-Host "Session 13 source, production build and mega-enhancement gates passed." -ForegroundColor Green
Write-Host "Continue with the independent Session 14 plan in CodexAuditPack/W98_SESSION13/." -ForegroundColor Cyan
