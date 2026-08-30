$ErrorActionPreference = "Stop"
Write-Host "[W107C] verifying no TS nocheck remains"
$scanFiles = @()
$scanFiles += Get-ChildItem -Path assets,scripts,tests,types -Recurse -File -ErrorAction SilentlyContinue
$scanFiles += Get-ChildItem -Path sw.js,package.json,tsconfig*.json -File -ErrorAction SilentlyContinue
$matches = $scanFiles | Select-String -Pattern "@ts[-]nocheck|ts[-]nocheck" -ErrorAction SilentlyContinue
if ($matches) { $matches | Format-List; throw "TS nocheck marker found; do not deploy" }

Write-Host "[W107C] TypeScript strict"
.\node_modules\.bin\tsc -p tsconfig.strict.json --pretty false
Write-Host "[W107C] TypeScript checkJS project"
.\node_modules\.bin\tsc -p tsconfig.checkjs.json --pretty false
Write-Host "[W107C] ESLint zero warnings"
npm run lint -- --max-warnings=0
Write-Host "[W107C] build smoke"
npm run smoke:build
Write-Host "[W107C] site audit"
npm run audit:site
Write-Host "[W107C] W105 all-route performance gate"
npm run qa:w105-performance
Write-Host "[W107C] W106 live integrations / contract map"
npm run qa:w106-live-integrations
Write-Host "[W107C] unit tests"
npm run test:unit
Write-Host "[W107C] verification complete"
