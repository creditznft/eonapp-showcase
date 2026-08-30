#!/usr/bin/env pwsh
# ════════════════════════════════════════════════════════════════
#   EONAPP.CH — INSTITUTIONAL-GRADE LAUNCH AUDIT SCRIPT v2.0
#   18 dimensions, 350+ checks
#   Run: .\scripts\launch-audit.ps1 [-Verbose] [-QuickMode]
#   Output: Console + audit-report.json
# ════════════════════════════════════════════════════════════════
param([string]$OutputFile="audit-report.json",[switch]$Verbose,[switch]$QuickMode)
$Root=Split-Path -Parent $PSScriptRoot; Set-Location $Root
$Score=0;$MaxScore=0;$Issues=@();$Passes=@();$Sections=@()
function Check($label,$points,$pass,$detail=""){
  $script:MaxScore+=$points
  if($pass){$script:Score+=$points;$script:Passes+=[PSCustomObject]@{label=$label;points=$points;detail=$detail};if($Verbose){Write-Host "  OK [$points] $label" -ForegroundColor Green}}
  else{$script:Issues+=[PSCustomObject]@{label=$label;points=$points;detail=$detail};$col=if($points-ge4){"Red"}else{"Yellow"};Write-Host "  XX [$points pts] $label$(if($detail){' -- '+$detail})" -ForegroundColor $col}
}
function Section($n){$script:Sections+=$n;Write-Host "`n=== $n ===" -ForegroundColor Cyan}
# §1 CORE FILES
Section "§1  Core Files"
@("index.html","games.html","vault.html","chat.html","tools.html","about.html","privacy.html","blog/index.html","404.html","offline.html","manifest.webmanifest","sw.js","robots.txt","sitemap.xml","assets/js/main.js","assets/js/utils/wallet.js","assets/js/utils/pool-points.js","assets/js/utils/lootbox.js","assets/js/utils/subscription.js","assets/js/utils/notifications.js","assets/js/utils/secure-keystore.js","assets/js/utils/token-swap.js","assets/js/utils/launch-discovery-boundary.js","assets/js/utils/p2p-multiplayer.js","assets/js/utils/p2p-nostr.js","assets/js/utils/device-detection.js","assets/js/utils/identity.js","assets/js/utils/game-monetization.js","assets/js/utils/ipfs-gateway.js","assets/js/utils/share.js","assets/js/utils/share-card.js","assets/js/utils/xp.js","assets/js/games/game-shell.js","assets/css/base.css","assets/css/layout.css","assets/css/components.css","_headers","_redirects") | ForEach-Object { Check "File: $_" 1 (Test-Path (Join-Path $Root $_)) }
# §2 GAMES INVENTORY
Section "§2  Games Inventory"
$gameDirs=Get-ChildItem (Join-Path $Root "games") -Directory | Where-Object{$_.Name -notmatch "^(api-|bugs|overview|recommendations)"}
Check ">=12 games present" 5 ($gameDirs.Count -ge 12) "Found: $($gameDirs.Count)"
foreach($g in $gameDirs){Check "Game index.html: $($g.Name)" 1 (Test-Path (Join-Path $g.FullName "index.html"))}
# §3 GAME MONETIZATION
Section "§3  Game Monetization Wiring"
foreach($g in $gameDirs){
  $idx=Join-Path $g.FullName "index.html"
  if(-not(Test-Path $idx)){continue}
  $html=Get-Content $idx -Raw -EA SilentlyContinue
  $allJs=((Get-ChildItem $g.FullName -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  Check "[$($g.Name)] game-shell.js" 2 ($html -match "game-shell\.js")
  Check "[$($g.Name)] EonPoolPoints" 2 ($allJs -match "EonPoolPoints")
  Check "[$($g.Name)] EonWallet"     2 ($allJs -match "EonWallet|awardGameCoins")
  Check "[$($g.Name)] EonLootbox"    2 ($allJs -match "EonLootbox")
  Check "[$($g.Name)] No legacy window.EON" 1 ($allJs -notmatch "window\.EON\.[a-zA-Z]")
}
# §4 HTML STRUCTURE
Section "§4  HTML Structural Accessibility"
$htmlFiles=Get-ChildItem $Root -Filter "*.html" -Recurse|Where-Object{$_.FullName -notmatch "node_modules|archive|dist|\.git"}
$mSkip=@();$mLang=@();$mVp=@();$mMain=@();$mBroken=@()
foreach($h in $htmlFiles){
  $c=Get-Content $h.FullName -Raw -EA SilentlyContinue; if(-not $c){continue}
  if($c -notmatch 'skip-to-content|skip to'){$mSkip+=$h.Name}
  if($c -notmatch '<html[^>]+lang='){$mLang+=$h.Name}
  if($c -notmatch 'viewport'){$mVp+=$h.Name}
  if($c -notmatch '<main'){$mMain+=$h.Name}
  if($c -match '<main[^>]*>' -and $c -match '</section>' -and $c -notmatch '</main>'){$mBroken+=$h.Name}
}
Check "All HTML: lang="           5 ($mLang.Count -eq 0)   "Missing: $($mLang -join ', ')"
Check "All HTML: viewport"        3 ($mVp.Count -eq 0)     "Missing: $($mVp.Count) files"
Check "All HTML: skip-to-content" 3 ($mSkip.Count -le 5)   "Missing in $($mSkip.Count) files"
Check "All HTML: <main> landmark" 3 ($mMain.Count -le 5)   "Missing: $($mMain.Count) files"
Check "No <main> closed with </section>" 4 ($mBroken.Count -eq 0) "Broken in: $($mBroken -join ', ')"
# §5 ARIA
Section "§5  ARIA & Screen Reader"
$mCanvas=@();$mNav=@();$mAP=@()
foreach($h in $htmlFiles){
  $c=Get-Content $h.FullName -Raw -EA SilentlyContinue; if(-not $c){continue}
  if($c -match '<canvas' -and $c -notmatch 'role="(img|application)"'){$mCanvas+=$h.Name}
  if($c -match '<nav' -and $c -notmatch 'aria-label'){$mNav+=$h.Name}
  if($c -match 'btn-theme|toggle.*theme' -and $c -notmatch 'aria-pressed'){$mAP+=$h.Name}
}
Check "Canvas elements have role (img|application)" 4 ($mCanvas.Count -eq 0) "$($mCanvas.Count) files missing"
Check "Nav elements have aria-label"           3 ($mNav.Count -eq 0)   "$($mNav.Count) files"
Check "Theme toggle has aria-pressed"          2 ($mAP.Count -eq 0)    "$($mAP.Count) pages"
$mAC=@("index.html","games.html","vault.html","chat.html","tools.html")|Where-Object{$p=Join-Path $Root $_;(Test-Path $p)-and((Get-Content $p -Raw)-notmatch 'aria-current')};$jsAriaWired=(Get-Content (Join-Path $Root "assets/js/main.js") -Raw -EA SilentlyContinue)-match "aria-current"
Check "Nav has aria-current page wiring"       3 ($mAC.Count -eq 0 -or $jsAriaWired)   "Missing: $($mAC -join ', ')"
$blurFiles=(Get-ChildItem $Root -Filter "*.html" -Recurse -EA SilentlyContinue|Where-Object{$_.FullName -notmatch "node_modules|archive|dist"}|Where-Object{(Get-Content $_.FullName -Raw -EA SilentlyContinue) -match 'stat-blurred'})|Where-Object{(Get-Content $_.FullName -Raw -EA SilentlyContinue) -notmatch 'stat-blurred.*aria-hidden|aria-hidden.*stat-blurred'}
Check "Blurred stats have aria-hidden"         2 ($blurFiles.Count -eq 0) "$($blurFiles.Count) files"
# §6 KEYBOARD & FOCUS
Section "§6  Keyboard & Focus"
$baseCss=Get-Content (Join-Path $Root "assets/css/base.css") -Raw -EA SilentlyContinue
$compCss=Get-Content (Join-Path $Root "assets/css/components.css") -Raw -EA SilentlyContinue
$layCss =Get-Content (Join-Path $Root "assets/css/layout.css") -Raw -EA SilentlyContinue
Check "CSS :focus-visible rule"          4 ($baseCss -match ':focus-visible')
Check "No outline:none on inputs without fallback" 4 ($compCss -notmatch 'input:focus[^}]*outline:\s*none(?![^}]*box-shadow)' -or $compCss -match 'input:focus[^}]*box-shadow')
Check "Chat input focus indicator"       2 ($compCss -notmatch 'chat-input[^}]*:focus[^}]*outline:\s*none' -or $compCss -match 'chat-input[^}]*box-shadow')
Check "Skip-to-content in base.css"      2 ($baseCss -match '\.skip-to-content')
Check "Touch targets >=44px declared"    3 ($compCss -match 'min-height.*44px|2\.75rem' -or $layCss -match 'min-height.*44px')
Check "Cards have :focus-visible state"  2 ($compCss -match ':focus-visible[^}]*card|card[^}]*:focus-visible')
Check "prefers-reduced-motion respected" 3 (($baseCss+$compCss+$layCss) -match 'prefers-reduced-motion')
# §7 MOBILE RESPONSIVENESS
Section "§7  Mobile / Responsive"
$allCss=$baseCss+$compCss+$layCss
Check "768px mobile breakpoint"          3 ($allCss -match 'max-width:\s*768px')
Check "1024px tablet breakpoint"         3 ($allCss -match 'max-width:\s*1024px')
Check "pointer:coarse touch rules"       3 ($allCss -match 'pointer:\s*coarse')
Check "prefers-color-scheme media query" 2 ($allCss -match 'prefers-color-scheme')
Check "grid minmax uses safe min"        2 ($layCss -match 'minmax\(min\(|minmax\(28[0-9]px|minmax\(30[0-9]px')
Check "No fixed-width canvas >800px in CSS" 3 (-not($allCss -match 'canvas\s*\{[^}]*width:\s*[89]\d\dpx'))
foreach($g in $gameDirs){
  $idx=Join-Path $g.FullName "index.html"; if(-not(Test-Path $idx)){continue}
  $c=Get-Content $idx -Raw -EA SilentlyContinue
  $css=((Get-ChildItem $g.FullName -Filter "*.css" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  $combined=$c+$css
  $hasFixed=$combined -match 'canvas[^>]*width="[6-9]\d\d|canvas\s*\{[^}]*width:\s*[6-9]\d\dpx'
  $hasMW=$combined -match 'max-width:\s*100%|max-width:\s*100vw|aspect-ratio'
  if($hasFixed){Check "[$($g.Name)] canvas max-width:100%" 2 $hasMW}
  $jsAll=((Get-ChildItem $g.FullName -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  Check "[$($g.Name)] DPR scaling" 1 ($jsAll -match 'devicePixelRatio|setPixelRatio|applyDprScaling' -or $c -match 'game-shell\.js')
}
$threejs=@("cyber-neon","neon-nexus")
foreach($gn in $threejs){
  $gd=Join-Path $Root "games/$gn"
  $jsAll=((Get-ChildItem $gd -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  Check "[$gn] DPR capped Math.min" 3 ($jsAll -match 'Math\.min.*devicePixelRatio|setPixelRatio.*Math\.min|pixelRatio.*min')
  Check "[$gn] webglcontextlost handler" 2 ($jsAll -match 'webglcontextlost')
  Check "[$gn] resize handler" 2 ($jsAll -match "addEventListener.*resize")
  Check "[$gn] No-WebGL fallback" 2 ($jsAll -match "webgl.*false|WebGL.*not.*support|no.*webgl|getContext.*webgl.*null")
}
$touchGames=@("cyber-neon","neon-siege","void-raider","void-storm","neon-dungeon","chrono-gladiators","neon-nexus","neon-conquest","realm-wars-lite")
foreach($gn in $touchGames){
  $gd=Join-Path $Root "games/$gn"; if(-not(Test-Path $gd)){continue}
  $jsAll=((Get-ChildItem $gd -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  $hi=Get-Content (Join-Path $gd "index.html") -Raw -EA SilentlyContinue
  Check "[$gn] Touch controls present" 3 ($jsAll -match "touchstart|touchend|touchmove|pointerdown" -or $hi -match "virtual-joystick|touch-btn|d-pad|btn-up|data-dir|touch-controls")
}
# §8 SEO
Section "§8  SEO & Meta"
@("index.html","games.html","vault.html","chat.html","tools.html","about.html","blog/index.html")|ForEach-Object{
  $p=Join-Path $Root $_; if(-not(Test-Path $p)){return}
  $c=Get-Content $p -Raw -EA SilentlyContinue
  Check "[$_] og:title"       1 ($c -match 'og:title')
  Check "[$_] og:description" 1 ($c -match 'og:description')
  Check "[$_] og:image"       1 ($c -match 'og:image')
  Check "[$_] twitter:card"   1 ($c -match 'twitter:card')
  Check "[$_] canonical"      1 ($c -match 'canonical')
  Check "[$_] JSON-LD"        2 ($c -match 'application/ld\+json')
}
Check "sitemap.xml exists" 3 (Test-Path (Join-Path $Root "sitemap.xml"))
Check "robots.txt exists"  2 (Test-Path (Join-Path $Root "robots.txt"))
Check "robots.txt Sitemap:" 1 ((Get-Content (Join-Path $Root "robots.txt") -Raw -EA SilentlyContinue) -match 'Sitemap:')
$mJsonLd=@();foreach($g in $gameDirs){$idx=Join-Path $g.FullName "index.html";if(-not(Test-Path $idx)){continue};$c=Get-Content $idx -Raw -EA SilentlyContinue;if($c -notmatch 'ld\+json'){$mJsonLd+=$g.Name}}
Check "All game pages JSON-LD" 3 ($mJsonLd.Count -eq 0) "Missing: $($mJsonLd -join ', ')"
$sm=Get-Content (Join-Path $Root "sitemap.xml") -Raw -EA SilentlyContinue
Check "Sitemap includes /games/" 2 ($sm -match '/games/')
Check "Sitemap includes /blog/"  2 ($sm -match '/blog/')
# §9 PWA
Section "§9  PWA & Service Worker"
$sw=Get-Content (Join-Path $Root "sw.js") -Raw -EA SilentlyContinue
Check "sw.js exists"                  3 ($null -ne $sw)
Check "sw install handler"            2 ($sw -match "addEventListener\s*\(\s*'install")
Check "sw activate handler"           2 ($sw -match "addEventListener\s*\(\s*'activate")
Check "sw fetch handler"              2 ($sw -match "addEventListener\s*\(\s*'fetch")
Check "sw precaches shell pages"      3 ($sw -match "index\.html" -and $sw -match "games\.html")
Check "sw offline fallback"           2 ($sw -match "offline\.html")
Check "sw stale-while-revalidate"     2 ($sw -match "stale-while-revalidate|StaleWhileRevalidate")
Check "sw skips /api/ caching"        2 ($sw -match '\/api\/')
Check "sw version string"             1 ($sw -match "VERSION|CACHE_NAME|v\d+")
$mf=Get-Content (Join-Path $Root "manifest.webmanifest") -Raw -EA SilentlyContinue|ConvertFrom-Json -EA SilentlyContinue
Check "manifest.webmanifest exists"   3 (Test-Path (Join-Path $Root "manifest.webmanifest"))
Check "manifest icons >=2"            2 ($mf.icons.Count -ge 2)
Check "manifest start_url"            1 ($mf.start_url -ne $null)
Check "manifest standalone"           1 ($mf.display -eq "standalone")
Check "manifest theme_color"          1 ($mf.theme_color -ne $null)
Check "manifest name+short_name"      1 ($mf.name -and $mf.short_name)
# §10 P2P
Section "§10 P2P & Decentralisation"
$p2pd=Get-Content (Join-Path $Root "assets/js/utils/launch-discovery-boundary.js")  -Raw -EA SilentlyContinue
$p2pn=Get-Content (Join-Path $Root "assets/js/utils/p2p-nostr.js")       -Raw -EA SilentlyContinue
$tswap=Get-Content (Join-Path $Root "assets/js/utils/token-swap.js")     -Raw -EA SilentlyContinue
$sks  =Get-Content (Join-Path $Root "assets/js/utils/secure-keystore.js") -Raw -EA SilentlyContinue
$ipfs =Get-Content (Join-Path $Root "assets/js/utils/ipfs-gateway.js")   -Raw -EA SilentlyContinue
$idn  =Get-Content (Join-Path $Root "assets/js/utils/identity.js")       -Raw -EA SilentlyContinue
$bkcl =Get-Content (Join-Path $Root "assets/js/utils/backend-client.js") -Raw -EA SilentlyContinue
$wjs  =Get-Content (Join-Path $Root "assets/js/utils/wallet.js")         -Raw -EA SilentlyContinue
Check "P2P uses GunDB"                          3 ($p2pd -match "Gun|GunDB")
Check "P2P localStorage fallback on relay fail" 3 ($p2pd -match "localStorage|fallback|_loadError")
Check ">=2 GunDB relay peers"                   2 ($p2pd -match "peer\.ooo|wallie\.io|gun\.eco")
Check ">=4 Nostr relays"                        2 ($p2pn -match "damus" -and $p2pn -match "nos\.lol")
Check "Nostr key not plaintext in localStorage" 4 ($p2pn -notmatch "setItem.*(?:sk|secretKey).*hex" -or $p2pn -match "encrypt.*nostr|nostr.*encrypt")
Check "Token swap uses signed auth (not btoa checksum only)" 4 ($tswap -match "signHmac|HMAC|SubtleCrypto|digest" -or $tswap -notmatch "checksum.*btoa\(")
Check "SecureKeyStore AES-256-GCM"              3 ($sks -match "AES-GCM")
Check "SecureKeyStore PBKDF2 >=100k"            3 ($sks -match "600[,\s]?000|[1-9]\d{5}\s*,")
Check "SecureKeyStore non-extractable keys"     3 ($sks -match "extractable.*false|false.*non-extractable")
Check "IPFS 4+ gateway fallbacks"               2 ($ipfs -match "ipfs\.io" -and $ipfs -match "dweb\.link" -and $ipfs -match "cloudflare" -and $ipfs -match "w3s")
Check "IPFS circuit breaker"                    2 ($ipfs -match "blacklist|cooldown|circuit|failCount")
Check "Identity uses crypto.getRandomValues"    3 ($idn -match "getRandomValues|randomUUID")
Check "No Math.random() in identity.js"         3 ($idn -notmatch "Math\.random\(\)")
Check "Backend client feature-gated"            2 ($bkcl -match "hasConfiguredBackend|No edge backend")
Check "Wallet client-side only (no POST)"       2 ($wjs -match "localStorage" -and $wjs -notmatch "fetch\(.*wallet|POST.*wallet")
Check "Pool points has daily cap"               2 ((Get-Content (Join-Path $Root "assets/js/utils/pool-points.js") -Raw -EA SilentlyContinue) -match "dailyCap|DAILY_CAP|MAX_.*DAY|checkCap")
Check "No hardcoded API keys in utils"          5 (-not((Get-ChildItem (Join-Path $Root "assets/js") -Filter "*.js" -Recurse|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"|Select-String 'sk-[a-zA-Z0-9]{20,}|api_key\s*=\s*"[^"]{10,}' -Quiet))
# §11 SECURITY
Section "§11 Security Headers"
$hdr=Get-Content (Join-Path $Root "_headers") -Raw -EA SilentlyContinue
$allJsU=(Get-ChildItem (Join-Path $Root "assets/js") -Filter "*.js" -Recurse|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
Check "CSP header present"                4 ($hdr -match "Content-Security-Policy")
Check "CSP frame-ancestors none"          3 ($hdr -match "frame-ancestors.*none")
Check "CSP no unsafe-eval"                3 ($hdr -notmatch "unsafe-eval")
Check "X-Frame-Options DENY"              2 ($hdr -match "X-Frame-Options.*DENY")
Check "X-Content-Type-Options nosniff"    2 ($hdr -match "nosniff")
Check "HSTS 2-year min"                   3 ($hdr -match "max-age=63072000|max-age=31536000")
Check "Referrer-Policy"                   2 ($hdr -match "Referrer-Policy")
Check "Permissions-Policy"                3 ($hdr -match "Permissions-Policy")
Check "geolocation blocked"               2 ($hdr -match "geolocation=\(\)")
Check "No eval() in utils"                4 ($allJsU -notmatch "(?<![a-zA-Z])eval\s*\(")
Check "innerHTML escaping present"        2 ($allJsU -match "escapeHtml|sanitize|DOMPurify")
Check "SubtleCrypto (not CryptoJS)"       3 ($sks -match "crypto\.subtle" -and $sks -notmatch "CryptoJS|md5\(")
Check "PBKDF2 >=600k iterations"          3 ($sks -match "600[,\s]?000")
Check "Swap double-spend prevention"      3 ($tswap -match "consumed|loadConsumed" -and $tswap -notmatch "window\.location\.reload.*consumed")
# §12 CSS DESIGN SYSTEM
Section "§12 CSS Design System"
Check "CSS custom props --clr-*"          3 ($baseCss -match '--clr-bg:')
Check "CSS spacing --space-*"             2 ($baseCss -match '--space-')
Check "CSS light-mode [data-theme]"       2 ($baseCss -match '\[data-theme')
Check "CSS font vars --font-sans"         2 ($baseCss -match '--font-sans')
Check "clamp() fluid typography"          2 ($allCss -match 'clamp\(')
Check "Components use var(--clr-*)"       3 ($compCss -match 'var\(--clr-')
Check "No hardcoded hex in layout.css"    2 ($layCss -notmatch '(?<!--)(?<![0-9a-fA-F])#[0-9a-fA-F]{6}(?![0-9a-fA-F])' -or $layCss -match 'var\(--')
Check "prefers-color-scheme present"      2 ($allCss -match 'prefers-color-scheme')
Check "Muted text not #94a3b8 (contrast)" 2 ($baseCss -notmatch '--clr-text-muted:\s*#94a3b8')
Check "Border/text/surface vars semantic" 1 ($baseCss -match '--clr-surface' -and $baseCss -match '--clr-border')
# §13 GAME PERFORMANCE
Section "§13 Game Performance"
$dd=Get-Content (Join-Path $Root "assets/js/utils/device-detection.js") -Raw -EA SilentlyContinue
Check "device-detection detects WebGL"      3 ($dd -match "WebGL2|webgl2|WebGLRenderingContext")
Check "device-detection LOW/MEDIUM/HIGH"    2 ($dd -match "LOW|MEDIUM|HIGH")
Check "device-detection touch capability"   2 ($dd -match "ontouchstart|maxTouchPoints")
Check "device-detection RAM detection"      2 ($dd -match "deviceMemory|hardwareConcurrency")
Check "games.html device tier badge"        2 ((Get-Content (Join-Path $Root "games.html") -Raw -EA SilentlyContinue) -match "device-banner|device-tier|LOW|MEDIUM")
foreach($gn in $threejs){
  $gd=Join-Path $Root "games/$gn"
  $jsAll=((Get-ChildItem $gd -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  Check "[$gn] Gates heavy features by device tier" 3 ($jsAll -match "deviceTier|LOW|MEDIUM|HIGH|getDeviceTier|quality")
}
$sbGames=@()
foreach($g in $gameDirs){
  $jsAll=((Get-ChildItem $g.FullName -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  if($jsAll -match 'shadowBlur\s*=\s*[1-9]' -and $jsAll -notmatch 'quality|tier|LOW|shadow.*false'){$sbGames+=$g.Name}
}
Check "Canvas shadowBlur gated on quality"  2 ($sbGames.Count -eq 0) "Unguarded: $($sbGames -join ', ')"
$gcGames=@()
foreach($g in $gameDirs){
  $jsAll=((Get-ChildItem $g.FullName -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  if($jsAll -match 'new Particle\(\)|push\(new ' -and $jsAll -notmatch 'ObjectPool|pool\.get|particlePool'){$gcGames+=$g.Name}
}
Check "Particle systems use object pooling" 2 ($gcGames.Count -eq 0) "GC risk: $($gcGames -join ', ')"
$alertGames=@()
foreach($g in $gameDirs){
  $jsAll=((Get-ChildItem $g.FullName -Filter "*.js" -Recurse -EA SilentlyContinue)|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
  if($jsAll -match "(?<![a-zA-Z])alert\s*\("){$alertGames+=$g.Name}
}
Check "No alert() dialogs in games"         2 ($alertGames.Count -eq 0) "alert() in: $($alertGames -join ', ')"
# §14 REFERRAL SYSTEM
Section "§14 Referral & Viral"
$shareJs=Get-Content (Join-Path $Root "assets/js/utils/share.js")   -Raw -EA SilentlyContinue
$poolPts=Get-Content (Join-Path $Root "assets/js/utils/pool-points.js") -Raw -EA SilentlyContinue
$profJs =Get-Content (Join-Path $Root "assets/js/utils/profile.js") -Raw -EA SilentlyContinue
$parJs  =Get-Content (Join-Path $Root "assets/js/utils/referral-par.js") -Raw -EA SilentlyContinue
Check "Referral ref= URL param"                         2 ($shareJs -match "ref=" -or $profJs -match "'ref'" -or $profJs -match "ref=")
Check "Invite trail/chain (viral multi-hop)"            2 ($profJs -match "trail|inviteTrail")
Check "Referral dedup (no double credit)"               3 ($profJs -match "referral-return-log|credited|dedup|issued-nonces" -or $parJs -match "credited|dedup")
Check "Invite links use single-use nonce"               3 ($profJs -match "nonce|issued-nonces|generateInviteLink" -or $parJs -match "nonce")
Check "Referral credit requires proof action (not just visit)" 4 ($parJs -match "PROOF_ACTIONS|game-run-complete" -or $profJs -match "PROOF_ACTIONS|proof.*action")
Check "Referral proof broadcast via Nostr"              3 ($parJs -match "broadcastReferralProof|nostr.*referral|EonNostr" -or $profJs -match "broadcastReferralProof")
Check "referral-par.js module exists"                   3 (Test-Path (Join-Path $Root "assets/js/utils/referral-par.js"))
Check "Daily cap on referral awards"                    2 ($poolPts -match "dailyCap|DAILY_CAP|MAX.*DAY" -or $shareJs -match "referral.*cap" -or $parJs -match "dailyCap|DAILY_CAP")
Check "Non-trivial reward (>=100 pts)"                  2 ($poolPts -match "referral.*100|100.*referral|500.*referral" -or $parJs -match "500|referral.*100")
Check "Vault page has invite/QR section"                1 ((Get-Content (Join-Path $Root "vault.html") -Raw -EA SilentlyContinue) -match "qr|QR|invite")
# §15 NOTIFICATIONS
Section "§15 Notifications & UX"
$notif=Get-Content (Join-Path $Root "assets/js/utils/notifications.js") -Raw -EA SilentlyContinue
Check "notifications.js exists"                     2 ($null -ne $notif)
Check "showToast() exported"                        2 ($notif -match "export.*showToast")
Check "pushNotification() exported"                 2 ($notif -match "export.*pushNotification")
Check "initNotifications() exported"                2 ($notif -match "export.*initNotifications")
Check "Notifications localStorage persistence"      2 ($notif -match "localStorage")
Check "notifyLootboxDrop() present"                 2 ($notif -match "notifyLootboxDrop|lootbox.*notif")
Check "main.js calls initNotifications()"           3 ((Get-Content (Join-Path $Root "assets/js/main.js") -Raw -EA SilentlyContinue) -match "initNotifications")
# §16 SUBSCRIPTION
Section "§16 Subscription & Wallet"
$subJs=Get-Content (Join-Path $Root "assets/js/utils/subscription.js") -Raw -EA SilentlyContinue
$loot =Get-Content (Join-Path $Root "assets/js/utils/lootbox.js")       -Raw -EA SilentlyContinue
Check "subscription.js uses window.EonWallet"       4 ($subJs -match "window\.EonWallet" -and $subJs -notmatch "import\s*\(.*wallet")
Check "Auto-renew uses .spend() not deductInternal" 3 ($subJs -match "\.spend\(" -and $subJs -notmatch "deductInternal\s*\(" -and $subJs -notmatch "deductInternal\)\s*;\s*//")
Check "wallet.js has getBalance()"                  3 ($wjs -match "getBalance\s*\(")
Check "wallet.js has spend()"                       3 ($wjs -match "(?:^|\s)spend\s*\(")
Check "wallet.js has awardGameCoins()"              2 ($wjs -match "awardGameCoins")
Check "Lootbox has rarity tiers"                    2 ($loot -match "COMMON|RARE|EPIC|LEGENDARY|rarity")
Check "main.js calls initSubscription()"            2 ((Get-Content (Join-Path $Root "assets/js/main.js") -Raw -EA SilentlyContinue) -match "initSubscription")
# §17 E2E TESTS
Section "§17 E2E Test Coverage"
$e2eF=@(Get-ChildItem (Join-Path $Root "e2e")   -Filter "*.spec.*" -Recurse -EA SilentlyContinue)+@(Get-ChildItem (Join-Path $Root "tests") -Filter "*.spec.*" -Recurse -EA SilentlyContinue)
$e2eC=($e2eF|ForEach-Object{Get-Content $_.FullName -Raw -EA SilentlyContinue})-join "`n"
Check ">=5 E2E spec files"                          3 ($e2eF.Count -ge 5)  "Found: $($e2eF.Count)"
Check "E2E tests: navigation"                       2 ($e2eC -match "goto|navigate|page\.go")
Check "E2E tests: wallet operations"                3 ($e2eC -match "wallet|EonWallet|getBalance")
Check "E2E tests: game loading"                     3 ($e2eC -match "game|canvas|games/")
Check "E2E tests: mobile viewport"                  2 ($e2eC -match "viewport.*375|iPhone|mobile")
Check "E2E tests: accessibility (axe)"              2 ($e2eC -match "axe|aria|a11y|accessibility")
Check "E2E tests: pool points"                      2 ($e2eC -match "pool.*point|EonPoolPoints|awardPoints")
Check "E2E tests: subscription flow"                2 ($e2eC -match "subscri")
Check "E2E tests: offline/SW"                       2 ($e2eC -match "offline|serviceWorker|sw\.js")
Check "E2E tests: share/referral"                   2 ($e2eC -match "share|referral|invite")
Check "playwright multi-browser"                    2 ((Get-Content (Join-Path $Root "playwright.config.js") -Raw -EA SilentlyContinue) -match "webkit|firefox")
# §18 CODE QUALITY
Section "§18 Code Quality"
Check "No console.log in utils (or gated by DEBUG)" 2 ($allJsU -notmatch "console\.log\(" -or $allJsU -match "DEBUG.*console\.log|window\.DEBUG")
Check "Game reward calls wrapped in try/catch"      3 ($allJsU -match "try\s*\{[^}]*EonPoolPoints|try\s*\{[^}]*EonWallet")
Check "No synchronous XHR"                          3 ($allJsU -notmatch "XMLHttpRequest.*open.*false")
Check "No deprecated document.write"               2 ($allJsU -notmatch "document\.write\(")
Check "ESLint config exists"                        1 (Test-Path (Join-Path $Root "eslint.config.mjs"))
Check "TypeScript config exists"                    1 (Test-Path (Join-Path $Root "tsconfig.checkjs.json") -and Test-Path (Join-Path $Root "tsconfig.strict.json"))
Check "package.json has test script"                1 ((Get-Content (Join-Path $Root "package.json") -Raw -EA SilentlyContinue) -match '"test"')
Check "package.json has build script"               1 ((Get-Content (Join-Path $Root "package.json") -Raw -EA SilentlyContinue) -match '"build"')
# RESULTS
$pct=[math]::Round(($Score/$MaxScore)*100)
$grade=if($pct-ge98){"S+"}elseif($pct-ge95){"S"}elseif($pct-ge90){"A+"}elseif($pct-ge85){"A"}elseif($pct-ge75){"B"}elseif($pct-ge60){"C"}else{"D"}
Write-Host "`n+----------------------------------------------+" -ForegroundColor Yellow
Write-Host "| EONAPP.CH INSTITUTIONAL AUDIT v2.0          |" -ForegroundColor Yellow
Write-Host "+----------------------------------------------+" -ForegroundColor Yellow
Write-Host "| Score : $Score / $MaxScore pts" -ForegroundColor Yellow
Write-Host "| Grade : $grade  ($pct%)" -ForegroundColor Yellow
Write-Host "| Issues: $($Issues.Count) items  Critical: $(($Issues|Where-Object{$_.points-ge4}).Count)  Major: $(($Issues|Where-Object{$_.points-ge2-and$_.points-lt4}).Count)  Minor: $(($Issues|Where-Object{$_.points-lt2}).Count)" -ForegroundColor Yellow
Write-Host "+----------------------------------------------+" -ForegroundColor Yellow
Write-Host "`nCRITICAL (>=4pts):" -ForegroundColor Red
$Issues|Where-Object{$_.points-ge4}|Sort-Object points -Desc|ForEach-Object{Write-Host "  [$($_.points)] $($_.label)$(if($_.detail){' -- '+$_.detail})"}
Write-Host "`nMAJOR (2-3pts):" -ForegroundColor Yellow
$Issues|Where-Object{$_.points-ge2-and$_.points-lt4}|Sort-Object points -Desc|ForEach-Object{Write-Host "  [$($_.points)] $($_.label)$(if($_.detail){' -- '+$_.detail})"}
Write-Host "`nMINOR (1pt):" -ForegroundColor Gray
$Issues|Where-Object{$_.points-lt2}|ForEach-Object{Write-Host "  [1] $($_.label)$(if($_.detail){' -- '+$_.detail})"}
[PSCustomObject]@{date=(Get-Date -Format "yyyy-MM-dd HH:mm");score=$Score;maxScore=$MaxScore;percent=$pct;grade=$grade;issueCount=$Issues.Count;critical=($Issues|Where-Object{$_.points-ge4}).Count;major=($Issues|Where-Object{$_.points-ge2-and$_.points-lt4}).Count;minor=($Issues|Where-Object{$_.points-lt2}).Count;sections=$Sections;issues=$Issues;passes=$Passes}|ConvertTo-Json -Depth 5|Set-Content (Join-Path $Root $OutputFile)
Write-Host "`nReport: $OutputFile" -ForegroundColor Green

