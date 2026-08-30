$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
npm ci
npm run qa:w101-marketplace
npm run qa:w101-nft-diversity
npm run build
npm run audit:site
npm run smoke:build
