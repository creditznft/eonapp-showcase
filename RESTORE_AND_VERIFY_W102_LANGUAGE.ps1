$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run qa:w102-language-truth
npm run test:unit
npm run build
npm run audit:site
npm run smoke:build
npm run qa:w100-vault-rebuild
npm run qa:w101-marketplace
Write-Host "Core W102 verification passed."
Write-Host "For browser proof, first run: node scripts/lhci-static-server.mjs --port 4183 --root dist"
Write-Host "Then in another terminal run: npm run qa:w102-language:browser:suite"
