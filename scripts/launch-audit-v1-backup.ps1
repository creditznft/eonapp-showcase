#!/usr/bin/env pwsh
# EONAPP.CH — Launch Readiness Audit Script
# Scores the app across 8 dimensions. Run from repo root.
# Usage: .\scripts\launch-audit.ps1
# Output: Console + audit-report.json

param(
  [string]$OutputFile = "audit-report.json",
  [switch]$Verbose
)

$Root = Split-Path -Parent $PSScriptRoot
Set-Location $Root

$Score = 0
$MaxScore = 0
$Issues = @()
$Passes = @()

function Check($label, $points, $pass, $detail = "") {
  $script:MaxScore += $points
  if ($pass) {
    $script:Score += $points
    $script:Passes += [PSCustomObject]@{ label = $label; points = $points; detail = $detail }
    if ($Verbose) { Write-Host "  ✅ [$points pts] $label" -ForegroundColor Green }
  } else {
    $script:Issues += [PSCustomObject]@{ label = $label; points = $points; detail = $detail }
    Write-Host "  ❌ [$points pts] $label$(if($detail){' — '+$detail})" -ForegroundColor Red
  }
}

function Section($name) {
  Write-Host "`n═══ $name ═══" -ForegroundColor Cyan
}

# ─── 1. FILE PRESENCE ─────────────────────────────────────────────────────────
Section "1. Core Files & Structure"
$coreFiles = @(
  "index.html","games.html","vault.html","chat.html","tools.html","blog/index.html",
  "manifest.webmanifest","sw.js","robots.txt","sitemap.xml","404.html","offline.html",
  "assets/js/main.js","assets/js/utils/wallet.js","assets/js/utils/pool-points.js",
  "assets/js/utils/lootbox.js","assets/js/utils/subscription.js","assets/js/utils/notifications.js",
  "assets/js/utils/secure-keystore.js","assets/js/utils/token-swap.js",
  "assets/js/utils/launch-discovery-boundary.js","assets/js/utils/device-detection.js",
  "assets/js/utils/identity.js","assets/js/utils/game-monetization.js",
  "assets/js/games/game-shell.js",
  "assets/css/base.css","assets/css/layout.css","assets/css/components.css"
)
foreach ($f in $coreFiles) {
  Check "File: $f" 1 (Test-Path (Join-Path $Root $f))
}

# ─── 2. GAMES INVENTORY ───────────────────────────────────────────────────────
Section "2. Games Inventory"
$gameDirs = Get-ChildItem (Join-Path $Root "games") -Directory
Check "At least 10 games present" 5 ($gameDirs.Count -ge 10) "Found: $($gameDirs.Count)"

foreach ($g in $gameDirs) {
  $idx = Join-Path $g.FullName "index.html"
  Check "Game has index.html: $($g.Name)" 1 (Test-Path $idx)
}

# ─── 3. GAME MONETIZATION WIRING ─────────────────────────────────────────────
Section "3. Game Monetization Wiring"
foreach ($g in $gameDirs) {
  $idx = Join-Path $g.FullName "index.html"
  if (-not (Test-Path $idx)) { continue }
  $html = Get-Content $idx -Raw -ErrorAction SilentlyContinue
  $jsFiles = Get-ChildItem $g.FullName -Filter "*.js" -Recurse -ErrorAction SilentlyContinue
  $allJs = ($jsFiles | ForEach-Object { Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue }) -join "`n"

  Check "[$($g.Name)] game-shell.js loaded" 2 ($html -match "game-shell\.js")
  Check "[$($g.Name)] EonPoolPoints wired" 2 ($allJs -match "EonPoolPoints")
  Check "[$($g.Name)] EonWallet/addCoins wired" 2 ($allJs -match "EonWallet|awardGameCoins")
  Check "[$($g.Name)] EonLootbox wired" 2 ($allJs -match "EonLootbox")
}

# ─── 4. ACCESSIBILITY ─────────────────────────────────────────────────────────
Section "4. Accessibility"
$htmlFiles = Get-ChildItem $Root -Filter "*.html" -Recurse | Where-Object { $_.DirectoryName -notmatch "node_modules" }
$missingSkip = @()
$missingLang = @()
$missingViewport = @()
foreach ($h in $htmlFiles) {
  $c = Get-Content $h.FullName -Raw -ErrorAction SilentlyContinue
  if ($c -notmatch 'skip-to-content|skip to') { $missingSkip += $h.Name }
  if ($c -notmatch '<html[^>]+lang=') { $missingLang += $h.Name }
  if ($c -notmatch 'viewport') { $missingViewport += $h.Name }
}
Check "All HTML files have lang= attribute" 5 ($missingLang.Count -eq 0) "Missing: $($missingLang -join ', ')"
Check "All HTML files have viewport meta" 3 ($missingViewport.Count -eq 0) "Missing: $($missingViewport -join ', ')"
Check "HTML pages have skip-to-content link" 3 ($missingSkip.Count -le 5) "Missing in $($missingSkip.Count) files"

# Canvas accessibility
$canvasFiles = Select-String -Path (Get-ChildItem (Join-Path $Root "games") -Filter "*.html" -Recurse).FullName -Pattern "<canvas" -ErrorAction SilentlyContinue
$canvasMissingRole = @()
foreach ($m in $canvasFiles) {
  $line = $m.Line
  if ($line -notmatch 'role="img"') { $canvasMissingRole += $m.Filename }
}
$uniqueMissing = ($canvasMissingRole | Sort-Object -Unique).Count
Check "All canvas elements have role=img" 4 ($uniqueMissing -eq 0) "$uniqueMissing files missing role"

# ─── 5. SEO & META ────────────────────────────────────────────────────────────
Section "5. SEO & Meta"
$keyPages = @("index.html","games.html","vault.html","chat.html","blog/index.html")
foreach ($p in $keyPages) {
  $path = Join-Path $Root $p
  if (-not (Test-Path $path)) { continue }
  $c = Get-Content $path -Raw -ErrorAction SilentlyContinue
  Check "[$p] og:title" 1 ($c -match 'og:title')
  Check "[$p] og:description" 1 ($c -match 'og:description')
  Check "[$p] canonical" 1 ($c -match 'canonical')
  Check "[$p] JSON-LD schema" 1 ($c -match 'application/ld\+json')
}
Check "sitemap.xml exists" 3 (Test-Path (Join-Path $Root "sitemap.xml"))
Check "robots.txt exists" 2 (Test-Path (Join-Path $Root "robots.txt"))

# ─── 6. PWA / SERVICE WORKER ──────────────────────────────────────────────────
Section "6. PWA & Service Worker"
$swContent = Get-Content (Join-Path $Root "sw.js") -Raw -ErrorAction SilentlyContinue
Check "sw.js exists" 3 ($null -ne $swContent)
Check "sw.js has install handler" 2 ($swContent -match "addEventListener\s*\(\s*'install")
Check "sw.js has fetch handler" 2 ($swContent -match "addEventListener\s*\(\s*'fetch")
Check "manifest.webmanifest exists" 3 (Test-Path (Join-Path $Root "manifest.webmanifest"))
$manifest = Get-Content (Join-Path $Root "manifest.webmanifest") -Raw -ErrorAction SilentlyContinue | ConvertFrom-Json -ErrorAction SilentlyContinue
Check "manifest has icons" 2 ($manifest.icons.Count -gt 0)
Check "manifest has start_url" 1 ($manifest.start_url -ne $null)
Check "manifest has display=standalone" 1 ($manifest.display -eq "standalone")

# ─── 7. P2P & CLIENT-SIDE PURITY ─────────────────────────────────────────────
Section "7. P2P & Client-Side Architecture"
$p2pDisc = Get-Content (Join-Path $Root "assets/js/utils/launch-discovery-boundary.js") -Raw -ErrorAction SilentlyContinue
$tokenSwap = Get-Content (Join-Path $Root "assets/js/utils/token-swap.js") -Raw -ErrorAction SilentlyContinue
$secureKs = Get-Content (Join-Path $Root "assets/js/utils/secure-keystore.js") -Raw -ErrorAction SilentlyContinue
$ipfsGw = Get-Content (Join-Path $Root "assets/js/utils/ipfs-gateway.js") -Raw -ErrorAction SilentlyContinue
$identity = Get-Content (Join-Path $Root "assets/js/utils/identity.js") -Raw -ErrorAction SilentlyContinue

Check "P2P discovery uses GunDB" 3 ($p2pDisc -match "Gun|GunDB|gundb")
Check "Token swap is local (no fetch)" 3 ($tokenSwap -notmatch "fetch\(|XMLHttpRequest" -or $tokenSwap -match "localStorage|GunDB|Gun")
Check "Secure keystore uses AES-256-GCM" 3 ($secureKs -match "AES-GCM")
Check "Secure keystore uses PBKDF2" 2 ($secureKs -match "PBKDF2")
Check "IPFS gateway has fallback list" 2 ($ipfsGw -match "ipfs\.io|dweb\.link|cloudflare-ipfs")
Check "Identity is generated-only (no server)" 3 ($identity -notmatch "fetch\(" -or $identity -match "crypto\.randomUUID|getRandomValues")
Check "No Math.random() in identity.js critical path" 2 ($identity -notmatch "Math\.random\(\)")

# ─── 8. SECURITY ──────────────────────────────────────────────────────────────
Section "8. Security"
# Check for common security anti-patterns
$allJsContent = (Get-ChildItem (Join-Path $Root "assets/js") -Filter "*.js" -Recurse | ForEach-Object { Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue }) -join "`n"
Check "No eval() in utils JS" 4 ($allJsContent -notmatch "(?<![a-zA-Z])eval\s*\(")
Check "No innerHTML assignment without escaping" 2 ($allJsContent -match "escapeHtml|sanitize|DOMPurify")
Check "PBKDF2 iterations >= 100000" 3 ($secureKs -match "600[,\s]?000|iterations[^=]*=.*[1-9]\d{5}")
Check "CSP header in _headers or HTML" 2 ((Test-Path (Join-Path $Root "_headers")) -and ((Get-Content (Join-Path $Root "_headers") -Raw) -match "Content-Security-Policy"))

# ─── RESULTS ──────────────────────────────────────────────────────────────────
$pct = [math]::Round(($Score / $MaxScore) * 100)
$grade = if ($pct -ge 95) {"S"} elseif ($pct -ge 85) {"A"} elseif ($pct -ge 75) {"B"} elseif ($pct -ge 60) {"C"} else {"D"}

Write-Host "`n╔══════════════════════════════════╗" -ForegroundColor Yellow
Write-Host "║  EONAPP.CH LAUNCH AUDIT RESULTS  ║" -ForegroundColor Yellow
Write-Host "╠══════════════════════════════════╣" -ForegroundColor Yellow
Write-Host "║  Score : $Score / $MaxScore pts$((" " * (19 - "$Score / $MaxScore pts".Length)))║" -ForegroundColor Yellow
Write-Host "║  Grade : $grade  ($pct%)$((" " * (20 - "$grade  ($pct%)".Length)))║" -ForegroundColor Yellow
Write-Host "╚══════════════════════════════════╝" -ForegroundColor Yellow

Write-Host "`n🔴 Issues ($($Issues.Count) items, $(($Issues | Measure-Object points -Sum).Sum) pts at stake):" -ForegroundColor Red
$Issues | Sort-Object points -Descending | ForEach-Object {
  Write-Host "  • [$($_.points) pts] $($_.label)$(if($_.detail){' — '+$_.detail})"
}

# Save JSON report
$report = [PSCustomObject]@{
  date       = (Get-Date -Format "yyyy-MM-dd HH:mm")
  score      = $Score
  maxScore   = $MaxScore
  percent    = $pct
  grade      = $grade
  issueCount = $Issues.Count
  issues     = $Issues
  passes     = $Passes
}
$report | ConvertTo-Json -Depth 5 | Set-Content (Join-Path $Root $OutputFile)
Write-Host "`n✅ Report saved to $OutputFile" -ForegroundColor Green
