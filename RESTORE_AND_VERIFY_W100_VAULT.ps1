$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run qa:w100-vault-rebuild
npm run build
npm run audit:site
npm run smoke:build
Write-Host "`nW100 Vault restore and verification completed."
