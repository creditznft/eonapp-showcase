$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest

Write-Host 'EONAPP W250-W290 final local preflight'
node .\FINAL_HANDOVER\verify-final-handover.mjs
npm ci --include=dev --no-audit --no-fund
npm run test:unit
npm run lint -- --max-warnings=0
npm run build
npm run qa:current-static-certification:core
npm run qa:current-static-certification:tail
Write-Host 'LOCAL PREFLIGHT PASS — this does not authorise main/production.'
